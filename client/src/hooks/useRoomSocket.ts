import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import socket from '../socket';
import { Note, Peer, Segment, StrokeEvent } from '../types';

type StrokeListener = (event: StrokeEvent) => void;

/**
 * Owns everything about the realtime connection for one room:
 * notes state, presence, and the stored whiteboard segments.
 * Components never touch the socket directly.
 */
export function useRoomSocket(roomId: string | undefined, username: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [connected, setConnected] = useState(socket.connected);

  // Strokes live in a ref (not state): they can be thousands of segments and
  // the canvas repaints imperatively, so re-rendering React would be wasted work.
  const segmentsRef = useRef<Segment[]>([]);
  const strokeListeners = useRef<Set<StrokeListener>>(new Set());
  const updateTimers = useRef<Record<string, number>>({});

  const notifyStrokes = useCallback((event: StrokeEvent) => {
    strokeListeners.current.forEach((fn) => fn(event));
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const join = () => socket.emit('join-room', { roomId, name: username });

    // 'connect' fires on the first connection AND on every automatic reconnect,
    // so re-joining here means a dropped connection heals itself with fresh state.
    const onConnect = () => {
      setConnected(true);
      join();
    };
    const onDisconnect = () => setConnected(false);

    const onRoomState = ({ notes: n, segments }: { notes: Note[]; segments: Segment[] }) => {
      setNotes(n);
      segmentsRef.current = segments;
      notifyStrokes({ type: 'reset' });
    };
    const onPresence = (list: Peer[]) => setPeers(list);

    const onNoteAdded = (note: Note) =>
      setNotes((prev) => (prev.some((p) => p.id === note.id) ? prev : [...prev, note]));
    const onNoteUpdated = ({ id, content }: { id: string; content: string }) =>
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)));
    const onNoteMoved = ({ id, x, y }: { id: string; x: number; y: number }) =>
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    const onNoteDeleted = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

    const onDrawSegments = (segments: Segment[]) => {
      segmentsRef.current.push(...segments);
      notifyStrokes({ type: 'append', segments });
    };
    const onClearBoard = () => {
      segmentsRef.current = [];
      notifyStrokes({ type: 'reset' });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room-state', onRoomState);
    socket.on('presence', onPresence);
    socket.on('note-added', onNoteAdded);
    socket.on('note-updated', onNoteUpdated);
    socket.on('note-moved', onNoteMoved);
    socket.on('note-deleted', onNoteDeleted);
    socket.on('draw-segments', onDrawSegments);
    socket.on('clear-board', onClearBoard);

    if (socket.connected) join();
    else socket.connect();

    const timers = updateTimers.current;
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room-state', onRoomState);
      socket.off('presence', onPresence);
      socket.off('note-added', onNoteAdded);
      socket.off('note-updated', onNoteUpdated);
      socket.off('note-moved', onNoteMoved);
      socket.off('note-deleted', onNoteDeleted);
      socket.off('draw-segments', onDrawSegments);
      socket.off('clear-board', onClearBoard);
      Object.values(timers).forEach((t) => window.clearTimeout(t));
      socket.disconnect();
      setNotes([]);
      setPeers([]);
      segmentsRef.current = [];
    };
  }, [roomId, username, notifyStrokes]);

  // ---------- Local actions: update my screen immediately, then tell the server ----------
  const addNote = useCallback((pos: { x: number; y: number }) => {
    const note: Note = {
      id: uuidv4(),
      content: '',
      x: pos.x,
      y: pos.y,
      user: username,
    };
    setNotes((prev) => [...prev, note]);
    socket.emit('note-added', note);
  }, [username]);

  // Typing updates local state instantly but the network event is debounced,
  // so one sentence is ~1 message instead of one per keystroke.
  const updateNote = useCallback((id: string, content: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)));
    window.clearTimeout(updateTimers.current[id]);
    updateTimers.current[id] = window.setTimeout(
      () => socket.emit('note-updated', { id, content }),
      150
    );
  }, []);

  const moveNote = useCallback((id: string, x: number, y: number) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    socket.emit('note-moved', { id, x, y });
  }, []);

  // Move many notes at once (used by "Tidy"): one state update, one absolute-position
  // event per note. Absolute positions make this safe even if events arrive out of order.
  const moveNotes = useCallback((updates: { id: string; x: number; y: number }[]) => {
    const byId = new Map(updates.map((u) => [u.id, u] as [string, { id: string; x: number; y: number }]));
    setNotes((prev) =>
      prev.map((n) => {
        const u = byId.get(n.id);
        return u ? { ...n, x: u.x, y: u.y } : n;
      })
    );
    updates.forEach((u) => socket.emit('note-moved', u));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    socket.emit('note-deleted', id);
  }, []);

  const addSegments = useCallback((segments: Segment[]) => {
    segmentsRef.current.push(...segments);
    socket.emit('draw-segments', segments);
  }, []);

  const clearBoard = useCallback(() => {
    segmentsRef.current = [];
    notifyStrokes({ type: 'reset' });
    socket.emit('clear-board');
  }, [notifyStrokes]);

  const subscribeStrokes = useCallback((fn: StrokeListener) => {
    strokeListeners.current.add(fn);
    return () => {
      strokeListeners.current.delete(fn);
    };
  }, []);

  return {
    notes,
    peers,
    connected,
    segmentsRef,
    addNote,
    updateNote,
    moveNote,
    moveNotes,
    deleteNote,
    addSegments,
    clearBoard,
    subscribeStrokes,
  };
}
