const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

// ---------- Config (12-factor: everything environment-specific comes from env) ----------
const PORT = process.env.PORT || 4000;
// Comma-separated list, e.g. "https://my-app.netlify.app,http://localhost:3000". "*" = allow all (dev only).
const ORIGINS = (process.env.CLIENT_ORIGIN || '*').split(',').map((s) => s.trim());
const corsOrigin = ORIGINS.includes('*') ? '*' : ORIGINS;

const MAX_NOTES_PER_ROOM = 500;
const MAX_SEGMENTS_PER_ROOM = 50000;
const ROOM_IDLE_TTL_MS = 6 * 60 * 60 * 1000; // delete empty rooms after 6h

const app = express();
app.use(cors({ origin: corsOrigin }));
app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin } });

// ---------- In-memory room store (the server is now the source of truth) ----------
// rooms: roomId -> { notes: Map<noteId, note>, segments: Segment[], users: Map<socketId, name>, lastActive }
const rooms = new Map();

function getRoom(roomId) {
  let room = rooms.get(roomId);
  if (!room) {
    room = { notes: new Map(), segments: [], users: new Map(), lastActive: Date.now() };
    rooms.set(roomId, room);
  }
  return room;
}

// ---------- Validation helpers (never trust client input) ----------
const ROOM_RE = /^[\w-]{1,32}$/;
const COLOR_RE = /^#[0-9a-f]{3,8}$/i;
const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const isId = (s) => typeof s === 'string' && s.length > 0 && s.length <= 64;

function sanitizeNote(n) {
  if (!n || !isId(n.id) || !isNum(n.x) || !isNum(n.y)) return null;
  return {
    id: n.id,
    content: String(n.content ?? '').slice(0, 2000),
    x: n.x,
    y: n.y,
    user: String(n.user ?? 'Anonymous').slice(0, 40),
  };
}

function sanitizeSegment(s) {
  if (!s) return null;
  const coords = [s.x0, s.y0, s.x1, s.y1];
  if (!coords.every((c) => isNum(c) && c >= 0 && c <= 1)) return null;
  if (!isNum(s.size) || s.size < 1 || s.size > 60) return null;
  if (typeof s.color !== 'string' || !COLOR_RE.test(s.color)) return null;
  return { x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, size: s.size, color: s.color, erase: !!s.erase };
}

const presenceOf = (room) =>
  Array.from(room.users.entries()).map(([id, name]) => ({ id, name }));

// ---------- Socket handlers ----------
io.on('connection', (socket) => {
  let roomId = null;

  const leaveCurrentRoom = () => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    socket.leave(roomId);
    if (room) {
      room.users.delete(socket.id);
      room.lastActive = Date.now();
      io.to(roomId).emit('presence', presenceOf(room));
    }
    roomId = null;
  };

  // Runs a handler only if the socket is in a room; keeps every handler short.
  const inRoom = (handler) => (...args) => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.lastActive = Date.now();
    handler(room, ...args);
  };

  socket.on('join-room', ({ roomId: id, name } = {}) => {
    if (typeof id !== 'string' || !ROOM_RE.test(id)) return;
    leaveCurrentRoom();
    roomId = id;
    const room = getRoom(id);
    room.users.set(socket.id, String(name || 'Anonymous').slice(0, 40));
    socket.join(id);

    // Late joiners / reconnects get the full board in one message.
    socket.emit('room-state', {
      notes: Array.from(room.notes.values()),
      segments: room.segments,
    });
    io.to(id).emit('presence', presenceOf(room));
  });

  // --- Sticky notes: server stores, then relays to everyone else ---
  socket.on('note-added', inRoom((room, raw) => {
    const note = sanitizeNote(raw);
    if (!note || room.notes.size >= MAX_NOTES_PER_ROOM) return;
    room.notes.set(note.id, note);
    socket.to(roomId).emit('note-added', note);
  }));

  socket.on('note-updated', inRoom((room, { id, content } = {}) => {
    const note = room.notes.get(id);
    if (!note) return;
    note.content = String(content ?? '').slice(0, 2000);
    socket.to(roomId).emit('note-updated', { id, content: note.content });
  }));

  // Absolute position (x, y), not a delta: idempotent, so a lost/reordered packet can't cause drift.
  socket.on('note-moved', inRoom((room, { id, x, y } = {}) => {
    const note = room.notes.get(id);
    if (!note || !isNum(x) || !isNum(y)) return;
    note.x = x;
    note.y = y;
    socket.to(roomId).emit('note-moved', { id, x, y });
  }));

  socket.on('note-deleted', inRoom((room, id) => {
    if (!room.notes.delete(id)) return;
    socket.to(roomId).emit('note-deleted', id);
  }));

  // --- Whiteboard: strokes are stored as normalised segments (0..1) and sent in batches ---
  socket.on('draw-segments', inRoom((room, batch) => {
    if (!Array.isArray(batch) || batch.length > 200) return;
    const clean = batch.map(sanitizeSegment).filter(Boolean);
    if (!clean.length) return;
    room.segments.push(...clean);
    if (room.segments.length > MAX_SEGMENTS_PER_ROOM) {
      room.segments.splice(0, room.segments.length - MAX_SEGMENTS_PER_ROOM);
    }
    socket.to(roomId).emit('draw-segments', clean);
  }));

  socket.on('clear-board', inRoom((room) => {
    room.segments = [];
    socket.to(roomId).emit('clear-board');
  }));

  socket.on('disconnect', leaveCurrentRoom);
});

// ---------- Housekeeping: free memory from abandoned rooms ----------
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (room.users.size === 0 && now - room.lastActive > ROOM_IDLE_TTL_MS) rooms.delete(id);
  }
}, 10 * 60 * 1000).unref();

server.listen(PORT, () => console.log(`Server listening on :${PORT}`));
