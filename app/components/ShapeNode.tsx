'use client';

import { useRef, useLayoutEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import type { VenueShape } from '@/app/types/seat';

interface Props {
  shape: VenueShape;
  isSelected: boolean;
  onSelect: () => void;
  /** Reports new center position + delta for grouped-seat movement. */
  onDragEnd: (x: number, y: number, dx: number, dy: number) => void;
  /** Reports normalized (scale-applied) dimensions after a Transformer interaction. */
  onTransformEnd: (
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number,
  ) => void;
  /** Callback so SeatCanvas can register this node with the shared Transformer. */
  onNodeRef: (node: Konva.Group | null) => void;
}

export default function ShapeNode({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onNodeRef,
}: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // Register/unregister the Konva node with the parent canvas once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    onNodeRef(groupRef.current);
    return () => onNodeRef(null);
  }, []);

  const isSection = shape.kind === 'section';
  const isPillar = shape.kind === 'pillar';
  const cornerRadius = isPillar ? Math.min(shape.width, shape.height) / 2 : 6;

  const setCursor = (e: KonvaEventObject<MouseEvent | DragEvent>, cur: string) => {
    e.target.getStage()?.container().style.setProperty('cursor', cur);
  };

  // Konva Transformer modifies scaleX/scaleY on the Group. We normalise them
  // back to width/height here so the React state always stores real dimensions.
  const handleTransformEnd = () => {
    const node = groupRef.current!;
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onTransformEnd(
      node.x(),
      node.y(),
      Math.max(20, shape.width * sx),
      Math.max(20, shape.height * sy),
      node.rotation(),
    );
  };

  return (
    <Group
      ref={groupRef}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onMouseEnter={(e) => setCursor(e, 'grab')}
      onMouseLeave={(e) => setCursor(e, 'default')}
      onDragStart={(e) => {
        dragStart.current = { x: e.target.x(), y: e.target.y() };
        setCursor(e, 'grabbing');
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        const nx = e.target.x();
        const ny = e.target.y();
        onDragEnd(nx, ny, nx - dragStart.current.x, ny - dragStart.current.y);
        setCursor(e, 'default');
      }}
      onTransformEnd={handleTransformEnd}
    >
      <Rect
        x={-shape.width / 2}
        y={-shape.height / 2}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={isSelected ? '#3b82f6' : isSection ? '#6366f1' : '#475569'}
        strokeWidth={isSelected ? 2.5 : 1.5}
        dash={isSection ? [10, 5] : undefined}
        cornerRadius={cornerRadius}
      />
      {shape.label ? (
        <Text
          x={-shape.width / 2}
          y={isSection ? -shape.height / 2 + 8 : -shape.height / 2}
          width={shape.width}
          height={isSection ? 28 : shape.height}
          text={shape.label}
          fontSize={isSection ? 11 : 13}
          fontStyle="bold"
          fill={isSection ? '#4f46e5' : 'white'}
          align="center"
          verticalAlign={isSection ? 'top' : 'middle'}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
