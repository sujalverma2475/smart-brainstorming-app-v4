// Smart placement: pure functions (no React, no sockets) so they are easy to test.
// Every size is a multiple of GRID so notes line up perfectly when snapped.

export const NOTE_W = 192; // 12rem
export const NOTE_H = 192;
export const GAP = 24; // breathing room between auto-placed notes
export const GRID = 24; // snap size

const MARGIN = 24;
const TOP_INSET = 96; // keep clear of the top bar
const BOTTOM_INSET = 96; // keep clear of the dock

export interface Pos {
  x: number;
  y: number;
}
export interface Viewport {
  width: number;
  height: number;
}

const snapDown = (v: number) => Math.floor(v / GRID) * GRID;
export const snapToGrid = (v: number) => Math.round(v / GRID) * GRID;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// The rectangle (top-left corners) where a note may sit and stay fully visible.
const area = ({ width, height }: Viewport) => ({
  minX: MARGIN,
  minY: TOP_INSET,
  maxX: Math.max(MARGIN, snapDown(width - NOTE_W - MARGIN)),
  maxY: Math.max(TOP_INSET, snapDown(height - NOTE_H - BOTTOM_INSET)),
});

// All notes are the same size, so two notes overlap exactly when their
// top-left corners are closer than one note (plus `gap`) on BOTH axes.
export const overlaps = (a: Pos, b: Pos, gap = 0): boolean =>
  Math.abs(a.x - b.x) < NOTE_W + gap && Math.abs(a.y - b.y) < NOTE_H + gap;

/**
 * Where should a brand-new note go? Scan the visible area in reading order
 * (left to right, top to bottom) on the snap grid and take the first spot
 * that doesn't collide with an existing note. If the screen is full, cascade
 * diagonally so the note is still visible and obviously new.
 */
export function findFreeSpot(existing: Pos[], viewport: Viewport): Pos {
  const { minX, minY, maxX, maxY } = area(viewport);
  for (let y = minY; y <= maxY; y += GRID) {
    for (let x = minX; x <= maxX; x += GRID) {
      const candidate = { x, y };
      if (!existing.some((n) => overlaps(candidate, n, GAP))) return candidate;
    }
  }
  const step = existing.length % 8;
  return { x: minX + step * GRID, y: minY + step * GRID };
}

/**
 * Where does a dragged note end up? Always kept on screen. With snapping on it
 * also snaps to the grid, and if that spot is taken it slides to the nearest
 * free grid spot instead of landing on top of another note.
 */
export function placeDrop(target: Pos, others: Pos[], viewport: Viewport, snap: boolean): Pos {
  const { minX, minY, maxX, maxY } = area(viewport);
  const clampPos = (p: Pos): Pos => ({
    x: clamp(p.x, minX, maxX),
    y: clamp(p.y, minY, maxY),
  });

  if (!snap) return clampPos(target);

  const start = clampPos({ x: snapToGrid(target.x), y: snapToGrid(target.y) });
  if (!others.some((o) => overlaps(start, o))) return start;

  let best: Pos | null = null;
  let bestDist = Infinity;
  for (let y = minY; y <= maxY; y += GRID) {
    for (let x = minX; x <= maxX; x += GRID) {
      const candidate = { x, y };
      if (others.some((o) => overlaps(candidate, o))) continue;
      const dist = (x - start.x) ** 2 + (y - start.y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
  }
  return best ?? start; // no free spot anywhere: accept the overlap
}

/**
 * "Tidy": line every note up on a grid. Notes keep their rough reading order
 * (rows first, then left-to-right) so the layout still resembles what people
 * made. If there are more notes than fit on screen, extras cascade on top
 * rather than disappearing off-screen.
 */
export function tidyLayout<T extends Pos & { id: string }>(
  notes: T[],
  viewport: Viewport
): { id: string; x: number; y: number }[] {
  const { minX, minY, maxX, maxY } = area(viewport);
  const cellW = NOTE_W + GAP;
  const cellH = NOTE_H + GAP;
  const cols = Math.max(1, Math.floor((maxX - minX) / cellW) + 1);
  const rows = Math.max(1, Math.floor((maxY - minY) / cellH) + 1);
  const capacity = cols * rows;
  const ROW_BAND = NOTE_H / 2; // notes within half a note height count as the same row

  const sorted = [...notes].sort(
    (a, b) =>
      Math.round(a.y / ROW_BAND) - Math.round(b.y / ROW_BAND) ||
      a.x - b.x ||
      a.id.localeCompare(b.id)
  );

  return sorted.map((n, i) => {
    const slot = i % capacity;
    const layer = Math.floor(i / capacity);
    return {
      id: n.id,
      x: minX + (slot % cols) * cellW + layer * GRID,
      y: minY + Math.floor(slot / cols) * cellH + layer * GRID,
    };
  });
}
