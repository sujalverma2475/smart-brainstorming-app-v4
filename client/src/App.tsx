import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useParams } from 'react-router-dom';
import StickyNote from './components/StickyNote';
import WhiteBoard from './components/WhiteBoard';
import Dock from './components/Dock';
import RoomBar from './components/RoomBar';
import Presence from './components/Presence';
import { useRoomSocket } from './hooks/useRoomSocket';
import { colorForUser } from './utils/color';
import { getUsername } from './utils/identity';
import { findFreeSpot, placeDrop, tidyLayout } from './utils/placement';
import './App.css';

const App: React.FC = () => {
  const { roomId } = useParams();
  const username = useMemo(getUsername, []);
  const room = useRoomSocket(roomId, username);

  const [drawMode, setDrawMode] = useState(false);
  const [toolColor, setToolColor] = useState('#1a2236');
  const [toolSize, setToolSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);

  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

  // New notes land in the first free spot instead of a random (possibly overlapping) one.
  const handleAddNote = () => room.addNote(findFreeSpot(room.notes, viewport()));

  const handleTidy = () => room.moveNotes(tidyLayout(room.notes, viewport()));

  // dnd-kit reports how far the note moved; we turn that into an ABSOLUTE position,
  // then let placement rules keep it on screen, on the grid, and off other notes.
  const handleDragEnd = ({ active, delta }: DragEndEvent) => {
    const note = room.notes.find((n) => n.id === active.id);
    if (!note) return;
    const others = room.notes.filter((n) => n.id !== note.id);
    const pos = placeDrop({ x: note.x + delta.x, y: note.y + delta.y }, others, viewport(), snapEnabled);
    room.moveNote(note.id, pos.x, pos.y);
  };

  const pickColor = (c: string) => {
    setToolColor(c);
    setIsEraser(false); // choosing a colour implies you want to draw with it
  };

  return (
    <div className="room">
      {!room.connected && (
        <div className="banner" role="status">
          Reconnecting… your changes will sync when you're back.
        </div>
      )}

      <header className="topbar">
        <RoomBar roomId={roomId} />
        <Presence peers={room.peers} me={username} />
      </header>

      {room.connected && room.notes.length === 0 && !drawMode && (
        <div className="empty">
          <h2>Nothing on the board yet</h2>
          <p>Add a note to get started, then share the room link so others can join.</p>
        </div>
      )}

      {drawMode && (
        <WhiteBoard
          segmentsRef={room.segmentsRef}
          subscribeStrokes={room.subscribeStrokes}
          onSegments={room.addSegments}
          color={toolColor}
          size={toolSize}
          isEraser={isEraser}
        />
      )}

      <DndContext onDragEnd={handleDragEnd}>
        {room.notes.map((note) => (
          <StickyNote
            key={note.id}
            id={note.id}
            content={note.content}
            x={note.x}
            y={note.y}
            user={note.user}
            color={colorForUser(note.user)}
            onChange={room.updateNote}
            onDelete={room.deleteNote}
          />
        ))}
      </DndContext>

      <Dock
        onAddNote={handleAddNote}
        onTidy={handleTidy}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled((v) => !v)}
        drawMode={drawMode}
        onToggleDraw={() => setDrawMode((v) => !v)}
        toolColor={toolColor}
        onColorChange={pickColor}
        toolSize={toolSize}
        onSizeChange={setToolSize}
        isEraser={isEraser}
        onEraserChange={setIsEraser}
        onClearBoard={room.clearBoard}
      />
    </div>
  );
};

export default App;
