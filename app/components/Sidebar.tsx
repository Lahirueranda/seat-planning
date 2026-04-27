'use client';

import { useState } from 'react';

interface Props {
  seatCount: number;
  onAddSingleSeat: (price: number) => void;
  onAddRow: (count: number, price: number) => void;
  onSave: () => void;
}

export default function Sidebar({ seatCount, onAddSingleSeat, onAddRow, onSave }: Props) {
  const [singlePrice, setSinglePrice] = useState(50);
  const [rowCount, setRowCount] = useState(8);
  const [rowPrice, setRowPrice] = useState(50);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 gap-5 shadow-sm shrink-0">
      <div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">Seat Map Builder</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {seatCount} seat{seatCount !== 1 ? 's' : ''} on canvas
        </p>
      </div>

      <Divider />

      <section className="flex flex-col gap-3">
        <SectionLabel>Single Seat</SectionLabel>
        <Field label="Price ($)">
          <NumberInput
            value={singlePrice}
            min={0}
            onChange={setSinglePrice}
          />
        </Field>
        <button
          onClick={() => onAddSingleSeat(singlePrice)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors"
        >
          + Add Single Seat
        </button>
      </section>

      <Divider />

      <section className="flex flex-col gap-3">
        <SectionLabel>Row of Seats</SectionLabel>
        <Field label="Number of seats">
          <NumberInput
            value={rowCount}
            min={1}
            max={20}
            onChange={setRowCount}
          />
        </Field>
        <Field label="Price per seat ($)">
          <NumberInput
            value={rowPrice}
            min={0}
            onChange={setRowPrice}
          />
        </Field>
        <button
          onClick={() => onAddRow(rowCount, rowPrice)}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors"
        >
          + Add Row of Seats
        </button>
      </section>

      <Divider />

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

function Divider() {
  return <hr className="border-slate-100" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
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
  value,
  min,
  max,
  onChange,
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
