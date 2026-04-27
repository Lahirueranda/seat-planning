'use client';

import { Group, Circle, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Seat } from '@/app/types/seat';

const RADIUS = 22;

interface Props {
  seat: Seat;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export default function SeatNode({ seat, onDragEnd }: Props) {
  const setCursor = (e: KonvaEventObject<MouseEvent | DragEvent>, cursor: string) => {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = cursor;
  };

  return (
    <Group
      x={seat.x}
      y={seat.y}
      rotation={seat.rotation ?? 0}
      draggable
      onMouseEnter={(e) => setCursor(e, 'grab')}
      onMouseLeave={(e) => setCursor(e, 'default')}
      onDragStart={(e) => setCursor(e, 'grabbing')}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        setCursor(e, 'grab');
        onDragEnd(seat.id, e.target.x(), e.target.y());
      }}
    >
      <Circle
        radius={RADIUS}
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth={1.5}
        shadowBlur={6}
        shadowColor="rgba(59,130,246,0.35)"
        shadowOffsetY={2}
      />
      <Text
        text={seat.label}
        fontSize={9}
        fontStyle="bold"
        fill="white"
        width={RADIUS * 2}
        height={RADIUS * 2}
        offsetX={RADIUS}
        offsetY={RADIUS}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
}
