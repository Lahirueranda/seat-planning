'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './Sidebar';
import type { Seat, VenueShape, ShapeKind } from '@/app/types/seat';
import { SHAPE_PRESETS } from '@/app/types/seat';

const SeatCanvas = dynamic(() => import('./SeatCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
      Loading canvas…
    </div>
  ),
});

const SEAT_SPACING = 50;

interface MapState {
  seats: Seat[];
  shapes: VenueShape[];
  seatCounter: number;
  rowCounter: number;
  shapeCounter: number;
}

// ── Section-containment test (handles rotation) ───────────────────────────────
// Returns true if point (px, py) falls inside the rotated rectangle defined by
// the VenueShape whose x, y are its CENTER coordinates.
function insideSection(px: number, py: number, s: VenueShape): boolean {
  const rad = (-s.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = px - s.x;
  const dy = py - s.y;
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  return lx >= -s.width / 2 && lx <= s.width / 2 && ly >= -s.height / 2 && ly <= s.height / 2;
}

export default function SeatMapBuilder() {
  const [map, setMap] = useState<MapState>({
    seats: [],
    shapes: [],
    seatCounter: 0,
    rowCounter: 0,
    shapeCounter: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a ref in sync so callbacks can read the latest size without stale closures.
  const canvasSizeRef = useRef(canvasSize);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const s = { width: el.offsetWidth, height: el.offsetHeight };
      setCanvasSize(s);
      canvasSizeRef.current = s;
    };
    const obs = new ResizeObserver(update);
    obs.observe(el);
    update();
    return () => obs.disconnect();
  }, []);

  // ── Seat helpers ─────────────────────────────────────────────────────────────

  const addSingleSeat = useCallback((price: number) => {
    const { width, height } = canvasSizeRef.current;
    setMap((prev) => {
      const counter = prev.seatCounter + 1;
      const seat: Seat = {
        id: `s-${counter}-${Math.random().toString(36).slice(2, 7)}`,
        x: width / 2,
        y: height / 2,
        label: `S${counter}`,
        price,
      };
      return { ...prev, seatCounter: counter, seats: [...prev.seats, seat] };
    });
  }, []);

  const addRowOfSeats = useCallback((count: number, price: number) => {
    const { width } = canvasSizeRef.current;
    setMap((prev) => {
      const row = prev.rowCounter + 1;
      const totalW = (count - 1) * SEAT_SPACING;
      const startX = Math.max(SEAT_SPACING, (width - totalW) / 2);
      const y = 60 + row * 70;
      const newSeats: Seat[] = Array.from({ length: count }, (_, i) => ({
        id: `r${row}-${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
        x: startX + i * SEAT_SPACING,
        y,
        label: `R${row}-${i + 1}`,
        price,
      }));
      return { ...prev, rowCounter: row, seats: [...prev.seats, ...newSeats] };
    });
  }, []);

  // On seat drop: reassign sectionId based on which section (if any) contains it.
  const handleSeatDragEnd = useCallback((id: string, x: number, y: number) => {
    setMap((prev) => {
      const sections = prev.shapes.filter((s) => s.kind === 'section');
      const enclosing = sections.find((sec) => insideSection(x, y, sec));
      return {
        ...prev,
        seats: prev.seats.map((s) =>
          s.id === id ? { ...s, x, y, sectionId: enclosing?.id } : s,
        ),
      };
    });
  }, []);

  // ── Shape helpers ────────────────────────────────────────────────────────────

  const addShape = useCallback((kind: ShapeKind) => {
    const { width, height } = canvasSizeRef.current;
    setMap((prev) => {
      const counter = prev.shapeCounter + 1;
      const preset = SHAPE_PRESETS[kind];
      // Sections get the lowest zIndex so they render behind other shapes;
      // all other shapes stack above the current maximum.
      const maxZ = prev.shapes.reduce((m, s) => Math.max(m, s.zIndex), 0);
      const minZ = prev.shapes.reduce((m, s) => Math.min(m, s.zIndex), 0);
      const zIndex = kind === 'section' ? minZ - 1 : maxZ + 1;
      const shape: VenueShape = {
        ...preset,
        id: `shape-${counter}-${Math.random().toString(36).slice(2, 7)}`,
        x: width / 2,
        y: height / 2,
        zIndex,
      };
      return { ...prev, shapeCounter: counter, shapes: [...prev.shapes, shape] };
    });
  }, []);

  // Drag end: update position; if it is a section, drag its contained seats too.
  const handleShapeDragEnd = useCallback(
    (id: string, x: number, y: number, dx: number, dy: number) => {
      setMap((prev) => {
        const shape = prev.shapes.find((s) => s.id === id);
        const shapes = prev.shapes.map((s) => (s.id === id ? { ...s, x, y } : s));
        const seats =
          shape?.kind === 'section'
            ? prev.seats.map((seat) =>
                seat.sectionId === id
                  ? { ...seat, x: seat.x + dx, y: seat.y + dy }
                  : seat,
              )
            : prev.seats;
        return { ...prev, shapes, seats };
      });
    },
    [],
  );

  // Transform end: Konva Transformer already normalised scale → width/height in ShapeNode.
  const handleShapeTransformEnd = useCallback(
    (id: string, x: number, y: number, width: number, height: number, rotation: number) => {
      setMap((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) =>
          s.id === id ? { ...s, x, y, width, height, rotation } : s,
        ),
      }));
    },
    [],
  );

  const updateShapeLabel = useCallback((id: string, label: string) => {
    setMap((prev) => ({
      ...prev,
      shapes: prev.shapes.map((s) => (s.id === id ? { ...s, label } : s)),
    }));
  }, []);

  const updateShapeColor = useCallback((id: string, fill: string) => {
    setMap((prev) => ({
      ...prev,
      shapes: prev.shapes.map((s) => (s.id === id ? { ...s, fill } : s)),
    }));
  }, []);

  const bringToFront = useCallback((id: string) => {
    setMap((prev) => {
      const maxZ = prev.shapes.reduce((m, s) => Math.max(m, s.zIndex), 0);
      return {
        ...prev,
        shapes: prev.shapes.map((s) => (s.id === id ? { ...s, zIndex: maxZ + 1 } : s)),
      };
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    setMap((prev) => {
      const minZ = prev.shapes.reduce((m, s) => Math.min(m, s.zIndex), 0);
      return {
        ...prev,
        shapes: prev.shapes.map((s) => (s.id === id ? { ...s, zIndex: minZ - 1 } : s)),
      };
    });
  }, []);

  const deleteShape = useCallback((id: string) => {
    setMap((prev) => ({
      ...prev,
      shapes: prev.shapes.filter((s) => s.id !== id),
      // Detach any seats that were grouped inside the deleted section.
      seats: prev.seats.map((seat) =>
        seat.sectionId === id ? { ...seat, sectionId: undefined } : seat,
      ),
    }));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────────

  const saveLayout = useCallback(() => {
    const output = {
      seats: map.seats,
      sections: map.shapes.map(({ id, kind, x, y, width, height, rotation, label }) => ({
        id,
        type: kind,
        x,
        y,
        width,
        height,
        rotation,
        label,
      })),
    };
    console.log('Venue Layout JSON:');
    console.log(JSON.stringify(output, null, 2));
  }, [map]);

  const selectedShape = map.shapes.find((s) => s.id === selectedId) ?? null;
  const isEmpty = map.seats.length === 0 && map.shapes.length === 0;

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(prev + delta, 0.2), 3));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        seatCount={map.seats.length}
        selectedShape={selectedShape}
        onAddSingleSeat={addSingleSeat}
        onAddRow={addRowOfSeats}
        onAddShape={addShape}
        onUpdateShapeLabel={updateShapeLabel}
        onUpdateShapeColor={updateShapeColor}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onDeleteShape={deleteShape}
        onSave={saveLayout}
      />

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        <SeatCanvas
          seats={map.seats}
          shapes={map.shapes}
          selectedId={selectedId}
          width={canvasSize.width}
          height={canvasSize.height}
          scale={scale}
          pos={pos}
          onScaleChange={setScale}
          onPosChange={setPos}
          onSeatDragEnd={handleSeatDragEnd}
          onShapeDragEnd={handleShapeDragEnd}
          onShapeTransformEnd={handleShapeTransformEnd}
          onSelect={setSelectedId}
        />

        {/* ── Zoom Controls ── */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <div className="flex flex-col bg-white rounded-lg shadow-lg border border-slate-200 p-1">
            <button
              onClick={() => handleZoom(0.1)}
              title="Zoom In"
              className="p-2 hover:bg-slate-50 text-slate-600 rounded-md transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <div className="h-px bg-slate-100 mx-2" />
            <button
              onClick={() => handleZoom(-0.1)}
              title="Zoom Out"
              className="p-2 hover:bg-slate-50 text-slate-600 rounded-md transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
          
          <button
            onClick={handleResetZoom}
            title="Reset View"
            className="bg-white p-2.5 rounded-lg shadow-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <polyline points="3 3 3 8 8 8"></polyline>
            </svg>
          </button>
          
          <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100 text-[10px] font-bold text-slate-400 text-center">
            {Math.round(scale * 100)}%
          </div>
        </div>

        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <svg className="text-slate-300 mb-3" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 18v-2h2v-2H4v-2h4v6H4zm7-6v6h4v-2h-2v-2h2v-2h-2V8h-4v2h2zm6-2v2h2v2h-2v2h2v2h-4v-6h2zm-5-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
            </svg>
            <p className="text-slate-400 font-medium">Canvas is empty</p>
            <p className="text-slate-300 text-sm mt-1">Add layout shapes or seats from the sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
}
