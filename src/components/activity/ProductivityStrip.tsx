/**
 * PRODUCTIVITY STRIP — Compact KPI row for Activity cockpit
 *
 * Shows: Total Calls | Productive % | Visits | Feedback Pending
 * Each metric has a thin progress bar underneath.
 * Design: finance-grade, calm, scannable.
 */

import { useEffect, useState } from 'react';

interface KpiItem {
  label: string;
  value: string;
  pct: number;          // 0–100 for the bar
  barColor: string;     // tailwind bg class
  accent?: boolean;     // highlight value color
}

interface ProductivityStripProps {
  items: KpiItem[];
}

function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, pct)), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-1.5">
      <div
        className={`h-full rounded-full ${color} transition-all duration-600 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function ProductivityStrip({ items }: ProductivityStripProps) {
  return (
    <div className="card-premium p-3">
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <div className="text-[10px] text-slate-400 font-medium tracking-wide truncate">{item.label}</div>
            <div className={`text-[16px] font-bold tabular-nums leading-tight mt-0.5
              ${item.accent ? 'text-indigo-600' : 'text-slate-800'}
            `}>
              {item.value}
            </div>
            <AnimatedBar pct={item.pct} color={item.barColor} />
          </div>
        ))}
      </div>
    </div>
  );
}
