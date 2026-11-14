import React, { useCallback, useEffect, useRef } from 'react';
import { Segment, StrokeEvent } from '../types';

interface WhiteBoardProps {
  segmentsRef: React.MutableRefObject<Segment[]>;
  subscribeStrokes: (fn: (event: StrokeEvent) => void) => () => void;
  onSegments: (segments: Segment[]) => void;
  color: string;
  size: number;
  isEraser: boolean;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const drawSegment = (ctx: CanvasRenderingContext2D, s: Segment, w: number, h: number) => {
  // destination-out makes the eraser punch real holes instead of painting white,
  // so it also works when the stroke list is replayed on another screen.
  ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.size;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s.x0 * w, s.y0 * h);
  ctx.lineTo(s.x1 * w, s.y1 * h);
  ctx.stroke();
};

const WhiteBoard: React.FC<WhiteBoardProps> = ({
  segmentsRef,
  subscribeStrokes,
  onSegments,
  color,
  size,
  isEraser,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const pending = useRef<Segment[]>([]);
  const rafId = useRef<number | null>(null);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    segmentsRef.current.forEach((s) => drawSegment(ctx, s, canvas.width, canvas.height));
  }, [segmentsRef]);

  // Size the canvas, repaint from stored data, and listen for remote strokes.
  // Repainting from data is what makes show/hide, resize and late-join all work.
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawAll();
    };
    resize();
    window.addEventListener('resize', resize);

    const unsubscribe = subscribeStrokes((event) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      if (event.type === 'reset') redrawAll();
      else event.segments.forEach((s) => drawSegment(ctx, s, canvas.width, canvas.height));
    });

    return () => {
      window.removeEventListener('resize', resize);
      unsubscribe();
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [redrawAll, subscribeStrokes]);

  // Batch outgoing segments: at most one network message per animation frame.
  const flush = useCallback(() => {
    rafId.current = null;
    if (pending.current.length) onSegments(pending.current.splice(0));
  }, [onSegments]);

  const queue = (segment: Segment) => {
    pending.current.push(segment);
    if (rafId.current === null) rafId.current = requestAnimationFrame(flush);
  };

  const toPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  };

  const strokeBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const segment: Segment = {
      x0: a.x,
      y0: a.y,
      x1: b.x,
      y1: b.y,
      color,
      size: isEraser ? size * 4 : size,
      erase: isEraser,
    };
    drawSegment(ctx, segment, canvas.width, canvas.height);
    queue(segment);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = toPoint(e);
    last.current = p;
    strokeBetween(p, p); // a click draws a dot
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const p = toPoint(e);
    strokeBetween(last.current, p);
    last.current = p;
  };

  const stop = () => {
    drawing.current = false;
    last.current = null;
    flush();
  };

  return (
    <canvas
      ref={canvasRef}
      className="board-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
    />
  );
};

export default WhiteBoard;
