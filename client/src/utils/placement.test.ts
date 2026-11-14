import { findFreeSpot, placeDrop, snapToGrid, tidyLayout, overlaps, GRID, NOTE_W } from './placement';

const VIEW = { width: 1366, height: 768 };

test('first note goes to the top-left of the free area', () => {
  expect(findFreeSpot([], VIEW)).toEqual({ x: 24, y: 96 });
});

test('a new note never overlaps existing ones', () => {
  const existing = [
    { x: 24, y: 96 },
    { x: 240, y: 96 },
    { x: 100, y: 300 },
  ];
  const spot = findFreeSpot(existing, VIEW);
  existing.forEach((n) => expect(overlaps(spot, n)).toBe(false));
});

test('when the screen is full it cascades instead of failing', () => {
  const full = [];
  for (let y = 0; y < 800; y += 48) for (let x = 0; x < 1400; x += 48) full.push({ x, y });
  const spot = findFreeSpot(full, VIEW);
  expect(spot.x % GRID).toBe(0);
  expect(spot.y % GRID).toBe(0);
});

test('snapToGrid rounds to the nearest grid line', () => {
  expect(snapToGrid(35)).toBe(24);
  expect(snapToGrid(37)).toBe(48);
});

test('drops are clamped on screen', () => {
  const p = placeDrop({ x: -500, y: 9999 }, [], VIEW, false);
  expect(p.x).toBeGreaterThanOrEqual(0);
  expect(p.y).toBeLessThan(VIEW.height);
});

test('a snapped drop onto another note slides to a free spot', () => {
  const other = { x: 240, y: 96 };
  const p = placeDrop({ x: 250, y: 100 }, [other], VIEW, true);
  expect(overlaps(p, other)).toBe(false);
  expect(p.x % GRID).toBe(0);
});

test('tidy gives every note its own slot and keeps reading order', () => {
  const notes = [
    { id: 'b', x: 600, y: 110 },
    { id: 'a', x: 50, y: 100 },
    { id: 'c', x: 70, y: 400 },
  ];
  const out = tidyLayout(notes, VIEW);
  expect(out.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  for (let i = 0; i < out.length; i++)
    for (let j = i + 1; j < out.length; j++) expect(overlaps(out[i], out[j])).toBe(false);
  expect(out[1].x - out[0].x).toBeGreaterThanOrEqual(NOTE_W);
});
