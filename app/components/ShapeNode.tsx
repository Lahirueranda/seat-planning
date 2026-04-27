import { useRef, useLayoutEffect } from 'react';
import { Group, Rect, Text, Line, Circle, Shape } from 'react-konva';
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
  onPointsChange: (points: number[]) => void;
  /** Callback so SeatCanvas can register this node with the shared Transformer. */
  onNodeRef: (node: Konva.Group | null) => void;
}

export default function ShapeNode({
  shape,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onPointsChange,
  onNodeRef,
}: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  useLayoutEffect(() => {
    onNodeRef(groupRef.current);
    return () => onNodeRef(null);
  }, [onNodeRef]);

  const isSection = shape.kind === 'section';
  const isPillar = shape.kind === 'pillar';
  const cornerRadius = isPillar ? Math.min(shape.width, shape.height) / 2 : 6;

  const setCursor = (e: KonvaEventObject<MouseEvent | DragEvent>, cur: string) => {
    e.target.getStage()?.container().style.setProperty('cursor', cur);
  };

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

  const handlePointDrag = (index: number, e: KonvaEventObject<DragEvent>) => {
    if (!shape.points) return;
    const newPoints = [...shape.points];
    newPoints[index * 2] = e.target.x();
    newPoints[index * 2 + 1] = e.target.y();
    onPointsChange(newPoints);
  };

  const handleAddPoint = (e: KonvaEventObject<MouseEvent>) => {
    if (!shape.points || !groupRef.current) return;
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const transform = groupRef.current.getAbsoluteTransform().copy().invert();
    const localPos = transform.point(pointer);
    const pts = shape.points;
    const n = pts.length / 2;
    let bestDist = Infinity;
    let insertIndex = -1;

    const getDistSq = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
      const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
      if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
      let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2;
    };

    for (let i = 0; i < n; i++) {
      const x1 = pts[i * 2], y1 = pts[i * 2 + 1];
      const i2 = (i + 1) % n;
      const x2 = pts[i2 * 2], y2 = pts[i2 * 2 + 1];
      const dist = getDistSq(localPos.x, localPos.y, x1, y1, x2, y2);
      if (dist < bestDist) {
        bestDist = dist;
        insertIndex = i + 1;
      }
    }

    if (insertIndex !== -1) {
      const newPoints = [...shape.points];
      newPoints.splice(insertIndex * 2, 0, localPos.x, localPos.y);
      onPointsChange(newPoints);
    }
  };

  const tension = shape.tension || 0;
  const hasMultiplePoints = shape.points && shape.points.length > 4;

  return (
    <Group
      ref={groupRef}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      draggable
      onClick={onSelect}
      onDblClick={(e) => {
        if (e.target.className === 'Line' || e.target.className === 'Shape') {
          handleAddPoint(e as any);
        }
      }}
      onTap={onSelect}
      onMouseEnter={(e) => setCursor(e, 'grab')}
      onMouseLeave={(e) => setCursor(e, 'default')}
      onDragStart={(e) => {
        if (e.target.className === 'Circle' && isSelected) {
          e.cancelBubble = true;
          return;
        }
        dragStart.current = { x: e.target.x(), y: e.target.y() };
        setCursor(e, 'grabbing');
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        if (e.target !== groupRef.current) return;
        const nx = e.target.x();
        const ny = e.target.y();
        onDragEnd(nx, ny, nx - dragStart.current.x, ny - dragStart.current.y);
        setCursor(e, 'default');
      }}
      onTransformEnd={handleTransformEnd}
    >
      {/* ── Main Body ── */}
      {shape.points ? (
        tension > 0 && !hasMultiplePoints ? (
          /* True Stadium Wedge: Curved top/bottom, straight sides */
          <Shape
            points={shape.points}
            sceneFunc={(context, shapeNode) => {
              const pts = shapeNode.getAttr('points');
              const t = tension * 400; // Curvature strength
              context.beginPath();
              context.moveTo(pts[0], pts[1]);
              // Curve Top: p1 to p2
              context.quadraticCurveTo((pts[0] + pts[2]) / 2, (pts[1] + pts[3]) / 2 - t, pts[2], pts[3]);
              // Straight Right: p2 to p3
              context.lineTo(pts[4], pts[5]);
              // Curve Bottom: p3 to p4 
              context.quadraticCurveTo((pts[4] + pts[6]) / 2, (pts[5] + pts[7]) / 2 - t, pts[6], pts[7]);
              // Straight Left: p4 to p1
              context.closePath();
              context.fillStrokeShape(shapeNode);
            }}
            fill={shape.fill}
            stroke={isSelected ? '#3b82f6' : '#cbd5e1'}
            strokeWidth={isSelected ? 3 : 1.5}
            hitStrokeWidth={20}
          />
        ) : (
          <Line
            points={shape.points}
            fill={shape.fill}
            stroke={isSelected ? '#3b82f6' : isSection ? '#cbd5e1' : '#475569'}
            strokeWidth={isSelected ? 12 : 2}
            hitStrokeWidth={20}
            closed
            dash={isSection ? [8, 4] : undefined}
            lineJoin="round"
            tension={hasMultiplePoints ? tension : 0}
          />
        )
      ) : (
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
      )}

      {/* ── Vertex Handles (Anchors) ── */}
      {isSelected && isSection && shape.points && 
        Array.from({ length: shape.points.length / 2 }).map((_, i) => (
          <Circle
            key={`handle-${i}`}
            x={shape.points![i * 2]}
            y={shape.points![i * 2 + 1]}
            radius={8}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={2}
            draggable
            onDragMove={(e) => handlePointDrag(i, e)}
            onMouseEnter={(e) => setCursor(e, 'nwse-resize')}
            onMouseLeave={(e) => setCursor(e, 'default')}
            onDragStart={(e) => { e.cancelBubble = true; }} // Prevent group dragging
          />
        ))
      }

      {/* ── Label ── */}
      {shape.label ? (
        <Text
          x={-shape.width / 2}
          y={isSection ? -shape.height / 2 + 12 : -shape.height / 2}
          width={shape.width}
          height={isSection ? 32 : shape.height}
          text={shape.label}
          fontSize={isSection ? 12 : 13}
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
