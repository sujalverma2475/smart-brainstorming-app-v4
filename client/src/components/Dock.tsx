import React from 'react';
import { EraserIcon, PenIcon, PlusIcon, SnapIcon, TidyIcon, TrashIcon } from './Icons';

const SWATCHES = ['#1a2236', '#3a52f4', '#e5484d', '#16a34a', '#f59e0b', '#9333ea'];

interface DockProps {
  onAddNote: () => void;
  onTidy: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  drawMode: boolean;
  onToggleDraw: () => void;
  toolColor: string;
  onColorChange: (c: string) => void;
  toolSize: number;
  onSizeChange: (n: number) => void;
  isEraser: boolean;
  onEraserChange: (on: boolean) => void;
  onClearBoard: () => void;
}

const Dock: React.FC<DockProps> = (p) => (
  <div className="dock" role="toolbar" aria-label="Board tools">
    <button className="dock__btn dock__btn--primary" onClick={p.onAddNote}>
      <PlusIcon />
      <span>Add note</span>
    </button>

    <button className="dock__btn" onClick={p.onTidy} title="Line up all notes on a grid">
      <TidyIcon />
      <span>Tidy</span>
    </button>
    <button
      className={`dock__btn dock__btn--icon ${p.snapEnabled ? 'is-active' : ''}`}
      aria-pressed={p.snapEnabled}
      aria-label="Snap notes to grid"
      title={p.snapEnabled ? 'Snap to grid: on' : 'Snap to grid: off'}
      onClick={p.onToggleSnap}
    >
      <SnapIcon />
    </button>

    <span className="dock__sep" aria-hidden="true" />

    <button
      className={`dock__btn ${p.drawMode ? 'is-active' : ''}`}
      aria-pressed={p.drawMode}
      onClick={p.onToggleDraw}
    >
      <PenIcon />
      <span>{p.drawMode ? 'Drawing on' : 'Draw'}</span>
    </button>

    {p.drawMode && (
      <div className="dock__tools">
        <span className="dock__sep" aria-hidden="true" />

        <div className="dock__group" role="group" aria-label="Colour">
          {SWATCHES.map((c) => (
            <button
              key={c}
              className={`swatch ${!p.isEraser && p.toolColor === c ? 'is-selected' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Pen colour ${c}`}
              onClick={() => p.onColorChange(c)}
            />
          ))}
          <input
            className="swatch-custom"
            type="color"
            value={p.toolColor}
            aria-label="Custom colour"
            onChange={(e) => p.onColorChange(e.target.value)}
          />
        </div>

        <label className="dock__size">
          <span className="sr-only">Brush size</span>
          <input
            type="range"
            min={1}
            max={10}
            value={p.toolSize}
            onChange={(e) => p.onSizeChange(Number(e.target.value))}
          />
        </label>

        <div className="dock__group" role="group" aria-label="Tool">
          <button
            className={`dock__btn dock__btn--icon ${!p.isEraser ? 'is-active' : ''}`}
            aria-pressed={!p.isEraser}
            aria-label="Pen"
            title="Pen"
            onClick={() => p.onEraserChange(false)}
          >
            <PenIcon />
          </button>
          <button
            className={`dock__btn dock__btn--icon ${p.isEraser ? 'is-active' : ''}`}
            aria-pressed={p.isEraser}
            aria-label="Eraser"
            title="Eraser"
            onClick={() => p.onEraserChange(true)}
          >
            <EraserIcon />
          </button>
        </div>

        <button
          className="dock__btn dock__btn--icon dock__btn--danger"
          aria-label="Clear whiteboard"
          title="Clear whiteboard"
          onClick={() => {
            if (window.confirm('Clear the whiteboard for everyone?')) p.onClearBoard();
          }}
        >
          <TrashIcon />
        </button>
      </div>
    )}
  </div>
);

export default Dock;
