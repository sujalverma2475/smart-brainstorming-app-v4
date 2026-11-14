import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { darkenColor } from '../utils/color';
import { CloseIcon } from './Icons';

interface StickyNoteProps {
  id: string;
  content: string;
  x: number;
  y: number;
  user: string;
  color: string;
  onChange: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

// Stable little tilt per note (-2.4deg .. +2.4deg) so the board feels hand-placed.
const tiltFor = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 5) - 2) * 1.2;
};

const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  content,
  x,
  y,
  user,
  color,
  onChange,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  // `transform` is dnd-kit's live drag offset; x/y is the saved position.
  const style: React.CSSProperties = {
    transform: `translate(${(transform?.x ?? 0) + x}px, ${(transform?.y ?? 0) + y}px) rotate(${isDragging ? 0 : tiltFor(id)}deg)`,
    backgroundColor: color,
  };

  return (
    <div
      ref={setNodeRef}
      className={`sticky-note ${isDragging ? 'is-dragging' : ''}`}
      style={style}
    >
      <div className="sticky-note__bar" style={{ backgroundColor: darkenColor(color, 10) }}>
        <div className="sticky-note__handle" {...listeners} {...attributes}>
          {user}
        </div>
        <button
          className="sticky-note__delete"
          aria-label="Delete note"
          title="Delete note"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <CloseIcon />
        </button>
      </div>
      <textarea
        className="sticky-note__text"
        value={content}
        placeholder="Type an idea…"
        onChange={(e) => onChange(id, e.target.value)}
      />
    </div>
  );
};

export default StickyNote;
