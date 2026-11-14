export interface Note {
  id: string;
  content: string;
  x: number; // absolute position in px
  y: number;
  user: string;
}

// One piece of a freehand stroke. Coordinates are normalised to 0..1 so the
// same stroke renders correctly on any screen size.
export interface Segment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
  erase: boolean;
}

export interface Peer {
  id: string;
  name: string;
}

export type StrokeEvent =
  | { type: 'append'; segments: Segment[] } // draw only these new segments
  | { type: 'reset' }; // repaint everything from the stored segments
