'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Transformer } from 'react-konva';
import type Konva from 'konva';
import ShapeNode from './ShapeNode';
import SeatNode from './SeatNode';
import type { Seat, VenueShape } from '@/app/types/seat';

const GRID = 40;

interface Props {
  seats: Seat[];
  shapes: VenueShape[];
  selectedId: string | null;
  width: number;
  height: number;
  scale: number;
  pos: { x: number; y: number };
  onScaleChange: (s: number) => void;
  onPosChange: (p: { x: number; y: number }) => void;
  onSeatDragEnd: (id: string, x: number, y: number) => void;
  onShapeDragEnd: (id: string, x: number, y: number, dx: number, dy: number) => void;
  onShapeTransformEnd: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number,
  ) => void;
  onSelect: (id: string | null) => void;
}

export default function SeatCanvas({
  seats,
  shapes,
  selectedId,
  width,
  height,
  scale,
  pos,
  onScaleChange,
  onPosChange,
  onSeatDragEnd,
  onShapeDragEnd,
  onShapeTransformEnd,
  onSelect,
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  // Map from shapeId → Konva.Group; populated via ShapeNode's onNodeRef callback.
  const nodeMap = useRef<Map<string, Konva.Group>>(new Map());

  // Attach / detach Transformer whenever selection or shapes list changes.
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId ? nodeMap.current.get(selectedId) : undefined;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, shapes]);

  const registerNode = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodeMap.current.set(id, node);
    else nodeMap.current.delete(id);
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const deltaY = e.evt.deltaY;
    const scaleBy = 1.1;
    const newScale = deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(Math.max(newScale, 0.2), 3);

    onScaleChange(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    onPosChange(newPos);
  };

  const handleDragEnd = (e: any) => {
    // Only handle stage drag
    if (e.target === e.target.getStage()) {
      onPosChange({ x: e.target.x(), y: e.target.y() });
    }
  };

  // Shapes rendered in ascending zIndex order (low = behind).
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

  // Increase grid size to cover the whole world even when panning
  const gridExtra = 2000;
  const vLines = Array.from({ length: Math.ceil((width + gridExtra * 2) / GRID) + 1 }, (_, i) => i);
  const hLines = Array.from({ length: Math.ceil((height + gridExtra * 2) / GRID) + 1 }, (_, i) => i);

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={scale}
      scaleY={scale}
      x={pos.x}
      y={pos.y}
      draggable
      onWheel={handleWheel}
      onDragEnd={handleDragEnd}
      // Click on bare canvas → deselect
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
      onTouchStart={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      {/* ── Grid (no hit-testing) ── */}
      <Layer listening={false}>
        {vLines.map((i) => (
          <Line
            key={`v-${i}`}
            points={[(i * GRID) - gridExtra, -gridExtra, (i * GRID) - gridExtra, height + gridExtra]}
            stroke="#e2e8f0"
            strokeWidth={1 / scale}
          />
        ))}
        {hLines.map((j) => (
          <Line
            key={`h-${j}`}
            points={[-gridExtra, (j * GRID) - gridExtra, width + gridExtra, (j * GRID) - gridExtra]}
            stroke="#e2e8f0"
            strokeWidth={1 / scale}
          />
        ))}
      </Layer>

      {/* ── Venue shapes + Transformer (below seats) ── */}
      <Layer>
        {sortedShapes.map((shape) => (
          <ShapeNode
            key={shape.id}
            shape={shape}
            isSelected={selectedId === shape.id}
            onSelect={() => onSelect(shape.id)}
            onDragEnd={(x, y, dx, dy) => onShapeDragEnd(shape.id, x, y, dx, dy)}
            onTransformEnd={(x, y, w, h, r) => onShapeTransformEnd(shape.id, x, y, w, h, r)}
            onNodeRef={(node) => registerNode(shape.id, node)}
          />
        ))}

        {/* Transformer must live in the same Layer as the nodes it transforms. */}
        <Transformer
          ref={trRef}
          rotateEnabled
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
          }
        />
      </Layer>

      {/* ── Seats (always on top) ── */}
      <Layer>
        {seats.map((seat) => (
          <SeatNode key={seat.id} seat={seat} onDragEnd={onSeatDragEnd} />
        ))}
      </Layer>
    </Stage>
  );
}
