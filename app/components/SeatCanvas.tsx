'use client';

import { Stage, Layer, Line } from 'react-konva';
import SeatNode from './SeatNode';
import type { Seat } from '@/app/types/seat';

const GRID = 40;

interface Props {
  seats: Seat[];
  width: number;
  height: number;
  onSeatDragEnd: (id: string, x: number, y: number) => void;
}

export default function SeatCanvas({ seats, width, height, onSeatDragEnd }: Props) {
  const verticals = Array.from({ length: Math.ceil(width / GRID) + 1 }, (_, i) => i);
  const horizontals = Array.from({ length: Math.ceil(height / GRID) + 1 }, (_, i) => i);

  return (
    <Stage width={width} height={height}>
      <Layer listening={false}>
        {verticals.map((i) => (
          <Line
            key={`v-${i}`}
            points={[i * GRID, 0, i * GRID, height]}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        ))}
        {horizontals.map((j) => (
          <Line
            key={`h-${j}`}
            points={[0, j * GRID, width, j * GRID]}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        ))}
      </Layer>
      <Layer>
        {seats.map((seat) => (
          <SeatNode key={seat.id} seat={seat} onDragEnd={onSeatDragEnd} />
        ))}
      </Layer>
    </Stage>
  );
}
