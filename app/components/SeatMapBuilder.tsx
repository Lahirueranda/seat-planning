'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './Sidebar';
import type { Seat } from '@/app/types/seat';

// Konva uses browser canvas APIs — must be excluded from SSR even inside a Client Component
const SeatCanvas = dynamic(() => import('./SeatCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
      Loading canvas…
    </div>
  ),
});

const SEAT_SPACING = 50;

// All mutable counters live in one object so we can update them atomically
// in a single setState call — no nested updaters, no Strict Mode double-fire.
interface MapState {
  seats: Seat[];
  seatCounter: number;
  rowCounter: number;
}

export default function SeatMapBuilder() {
  const [map, setMap] = useState<MapState>({ seats: [], seatCounter: 0, rowCounter: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasSizeRef = useRef(canvasSize);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const size = { width: el.offsetWidth, height: el.offsetHeight };
      setCanvasSize(size);
      canvasSizeRef.current = size;
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, []);

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
      const totalWidth = (count - 1) * SEAT_SPACING;
      const startX = Math.max(SEAT_SPACING, (width - totalWidth) / 2);
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

  const handleSeatDragEnd = useCallback((id: string, x: number, y: number) => {
    setMap((prev) => ({
      ...prev,
      seats: prev.seats.map((s) => (s.id === id ? { ...s, x, y } : s)),
    }));
  }, []);

  const saveLayout = useCallback(() => {
    console.log('Seat Layout JSON:');
    console.log(JSON.stringify(map.seats, null, 2));
  }, [map.seats]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        seatCount={map.seats.length}
        onAddSingleSeat={addSingleSeat}
        onAddRow={addRowOfSeats}
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
          width={canvasSize.width}
          height={canvasSize.height}
          onSeatDragEnd={handleSeatDragEnd}
        />

        {map.seats.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <div className="text-slate-300 mb-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 18v-2h2v-2H4v-2h4v6H4zm7-6v6h4v-2h-2v-2h2v-2h-2V8h-4v2h2zm6-2v2h2v2h-2v2h2v2h-4v-6h2zm-5-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium">Canvas is empty</p>
            <p className="text-slate-300 text-sm mt-1">Use the sidebar to add seats</p>
          </div>
        )}
      </div>
    </div>
  );
}
