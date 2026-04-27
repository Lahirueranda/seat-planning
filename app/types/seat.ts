export interface Seat {
  id: string;
  x: number;
  y: number;
  label: string;
  price: number;
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
}

export const SHAPE_PRESETS: Record<
  ShapeKind,
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
  },
};
