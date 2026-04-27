'use client';

import { useState } from 'react';
import type { VenueShape, ShapeKind } from '@/app/types/seat';

interface Props {
  seatCount: number;
  selectedShape: VenueShape | null;
  onAddSingleSeat: (price: number) => void;
  onAddRow: (count: number, price: number) => void;
  onAddCurvedBlock: (
    rows: number,
    seatsPerRow: number,
    radius: number,
    startAngle: number,
    arcAngle: number,
    price: number,
  ) => void;
  onAddShape: (kind: ShapeKind | 'wedge') => void;
  onUpdateShapeLabel: (id: string, label: string) => void;
  onUpdateShapeColor: (id: string, color: string) => void;
  onUpdateShapeTension: (id: string, tension: number) => void;
  onUpdateShapeRotation: (id: string, rotation: number) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDeleteShape: (id: string) => void;
  onSave: () => void;
}

const SHAPE_BUTTONS: { kind: ShapeKind | 'wedge'; label: string; cls: string }[] = [
  { kind: 'stage',   label: 'Stage',        cls: 'bg-slate-700 hover:bg-slate-800' },
  { kind: 'bar',     label: 'Bar',           cls: 'bg-amber-800 hover:bg-amber-900' },
  { kind: 'pillar',  label: 'Pillar',        cls: 'bg-gray-500 hover:bg-gray-600'  },
  { kind: 'section', label: 'Section Zone',  cls: 'bg-indigo-600 hover:bg-indigo-700' },
  { kind: 'wedge',   label: 'Stadium Wedge', cls: 'bg-blue-600 hover:bg-blue-700' },
];

export default function Sidebar({
  seatCount,
  selectedShape,
  onAddSingleSeat,
  onAddRow,
  onAddCurvedBlock,
  onAddShape,
  onUpdateShapeLabel,
  onUpdateShapeColor,
  onUpdateShapeTension,
  onUpdateShapeRotation,
  onBringToFront,
  onSendToBack,
  onDeleteShape,
  onSave,
}: Props) {
  const [singlePrice, setSinglePrice] = useState(50);
  const [rowCount,    setRowCount]    = useState(8);
  const [rowPrice,    setRowPrice]    = useState(50);

  // Curved section state
  const [curvRows,     setCurvRows]     = useState(5);
  const [curvSPerRow,  setCurvSPerRow]  = useState(10);
  const [curvRadius,   setCurvRadius]   = useState(300);
  const [curvStartAng, setCurvStartAng] = useState(180);
  const [curvArcAng,   setCurvArcAng]   = useState(180);
  const [curvPrice,    setCurvPrice]    = useState(100);

  const [saved,       setSaved]       = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 gap-5 shadow-sm shrink-0 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">Seat Map Builder</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {seatCount} seat{seatCount !== 1 ? 's' : ''} on canvas
        </p>
      </div>

      <Divider />

      {/* ── Layout Shapes ── */}
      <section className="flex flex-col gap-3">
        <Label>Layout Shapes</Label>
        <div className="grid grid-cols-2 gap-2">
          {SHAPE_BUTTONS.map(({ kind, label, cls }) => (
            <button
              key={kind}
              onClick={() => onAddShape(kind)}
              className={`${cls} text-white rounded-lg py-2 px-2 text-xs font-medium transition-colors`}
            >
              + {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">Click a shape to select → drag anchors to resize / rotate.</p>
      </section>

      {/* ── Selection panel (shown only when a shape is selected) ── */}
      {selectedShape && (
        <>
          <Divider />
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Label>Selected Shape</Label>
              <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">
                {selectedShape.kind}
              </span>
            </div>

            {/* Editable label */}
            <Field label="Label">
              <input
                type="text"
                value={selectedShape.label}
                onChange={(e) => onUpdateShapeLabel(selectedShape.id, e.target.value)}
                placeholder="Shape label…"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </Field>

            {/* Editable color */}
            <Field label="Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedShape.fill.startsWith('rgba') ? '#6366f1' : selectedShape.fill}
                  onChange={(e) => onUpdateShapeColor(selectedShape.id, e.target.value)}
                  className="w-10 h-10 rounded border border-slate-200 p-1 cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedShape.fill}
                  onChange={(e) => onUpdateShapeColor(selectedShape.id, e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
                />
              </div>
            </Field>

            {/* Curvature (Tension) */}
            {selectedShape.points && (
              <Field label={`Curvature (${Math.round((selectedShape.tension || 0) * 100)}%)`}>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={selectedShape.tension || 0}
                  onChange={(e) => onUpdateShapeTension(selectedShape.id, parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </Field>
            )}

            {/* Rotation */}
            <Field label={`Rotation (${Math.round(selectedShape.rotation)}°)`}>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={selectedShape.rotation}
                onChange={(e) => onUpdateShapeRotation(selectedShape.id, Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </Field>

            {/* Z-index controls */}
            <div className="flex gap-2">
              <button
                onClick={() => onBringToFront(selectedShape.id)}
                title="Bring to Front"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2 text-xs font-medium transition-colors"
              >
                ↑ Bring Front
              </button>
              <button
                onClick={() => onSendToBack(selectedShape.id)}
                title="Send to Back"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2 text-xs font-medium transition-colors"
              >
                ↓ Send Back
              </button>
            </div>

            <button
              onClick={() => onDeleteShape(selectedShape.id)}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-lg py-2 text-xs font-medium transition-colors"
            >
              Delete Shape
            </button>
          </section>
        </>
      )}

      <Divider />

      {/* ── Single Seat ── */}
      <section className="flex flex-col gap-3">
        <Label>Single Seat</Label>
        <Field label="Price ($)">
          <NumberInput value={singlePrice} min={0} onChange={setSinglePrice} />
        </Field>
        <button
          onClick={() => onAddSingleSeat(singlePrice)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors"
        >
          + Add Single Seat
        </button>
      </section>

      <Divider />

      {/* ── Curved Seating (Stadium Style) ── */}
      <section className="flex flex-col gap-3 bg-slate-50 -mx-6 px-6 py-5 border-y border-slate-100">
        <Label>Curved Seating</Label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rows">
            <NumberInput value={curvRows} min={1} max={20} onChange={setCurvRows} />
          </Field>
          <Field label="Seats / Row">
            <NumberInput value={curvSPerRow} min={1} max={50} onChange={setCurvSPerRow} />
          </Field>
          <Field label="Radius">
            <NumberInput value={curvRadius} min={50} max={2000} onChange={setCurvRadius} />
          </Field>
          <Field label="Start Angle">
            <NumberInput value={curvStartAng} min={0} max={360} onChange={setCurvStartAng} />
          </Field>
          <Field label="Arc Angle">
            <NumberInput value={curvArcAng} min={10} max={360} onChange={setCurvArcAng} />
          </Field>
          <Field label="Price ($)">
            <NumberInput value={curvPrice} min={0} onChange={setCurvPrice} />
          </Field>
        </div>
        <button
          onClick={() => onAddCurvedBlock(curvRows, curvSPerRow, curvRadius, curvStartAng, curvArcAng, curvPrice)}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors shadow-sm"
        >
          + Add Curved Block
        </button>
      </section>

      <Divider />

      {/* ── Row of Seats ── */}
      <section className="flex flex-col gap-3">
        <Label>Row of Seats</Label>
        <Field label="Number of seats">
          <NumberInput value={rowCount} min={1} max={20} onChange={setRowCount} />
        </Field>
        <Field label="Price per seat ($)">
          <NumberInput value={rowPrice} min={0} onChange={setRowPrice} />
        </Field>
        <button
          onClick={() => onAddRow(rowCount, rowPrice)}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors"
        >
          + Add Row of Seats
        </button>
      </section>

      <Divider />

      {/* ── Save ── */}
      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg py-2.5 px-4 text-sm font-semibold transition-colors"
        >
          {saved ? '✓ Saved to Console' : 'Save Layout'}
        </button>
        <p className="text-xs text-slate-400 text-center">JSON logged to browser console</p>
      </div>
    </aside>
  );
}

/* ── Small helpers ─────────────────────────────────────────────────── */

function Divider() {
  return <hr className="border-slate-100" />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{children}</h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function NumberInput({
  value, min, max, onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );
}
