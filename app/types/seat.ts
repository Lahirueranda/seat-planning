export interface Seat {
  id: string;
  x: number;
  y: number;
  label: string;
  price: number;
  rotation?: number; // In degrees
  sectionId?: string;
}

export type ShapeKind = 'stage' | 'bar' | 'pillar' | 'section';

/** x, y are the CENTER of the shape (pre-rotation origin). */
export interface VenueShape {
  id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  fill: string;
  zIndex: number;
  points?: number[]; // [x1, y1, x2, y2, ...] relative to x,y
  tension?: number; // 0 to 1 for curvature
}

export const SHAPE_PRESETS: Record<
  ShapeKind | 'wedge',
  Omit<VenueShape, 'id' | 'x' | 'y' | 'zIndex'>
> = {
  stage: {
    kind: 'stage',
    width: 240,
    height: 80,
    rotation: 0,
    label: 'Stage',
    fill: '#334155',
  },
  bar: {
    kind: 'bar',
    width: 140,
    height: 60,
    rotation: 0,
    label: 'Bar',
    fill: '#92400e',
  },
  pillar: {
    kind: 'pillar',
    width: 44,
    height: 44,
    rotation: 0,
    label: '',
    fill: '#6b7280',
  },
  section: {
    kind: 'section',
    width: 220,
    height: 180,
    rotation: 0,
    label: 'Section',
    fill: 'rgba(99,102,241,0.08)',
    points: [-110, -90, 110, -90, 110, 90, -110, 90],
  },
  wedge: {
    kind: 'section', // Internal kind is still section for seat logic
    width: 260,
    height: 160,
    rotation: 0,
    label: 'Wedge Block',
    fill: 'rgba(59,130,246,0.08)',
    points: [-80, -80, 80, -80, 130, 80, -130, 80],
    tension: 0.25,
  },
};
