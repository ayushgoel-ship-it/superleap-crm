/**
 * DCF KPI CARD — Financial-grade metric instrument
 *
 * Design philosophy: Each card answers two questions:
 *   1. How close am I to target?
 *   2. Is this improving or slipping?
 *
 * Visual language:
 *   - Large number with thin weight (Stripe-inspired)
 *   - Soft progress ring shows target completion
 *   - Green used ONLY for ₹ and positive growth
 *   - Indigo accent for primary actions
 */

import { useEffect, useState } from 'react';

// ── Progress Ring SVG ──

function ProgressRing({
  pct,
  size = 44,
  stroke = 4,
  color = 'stroke-indigo-500',
  trackColor = 'stroke-slate-100',
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (Math.min(pct, 100) / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [pct, circumference]);

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        className={trackColor}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={`${color} transition-all duration-700 ease-out`}
      />
    </svg>
  );
}

// ── Props ──

export interface DCFKpiCardProps {
  label: string;
  value: string;
  target?: string;
  pct: number;           // 0-100 completion %
  trend?: number | null;  // e.g. +28 or -5
  trendLabel?: string;    // e.g. "+3 this month"
  isCurrency?: boolean;
  onClick?: () => void;
}

// ── Component ──

export function DCFKpiCard({
  label,
  value,
  target,
  pct,
  trend,
  trendLabel,
  isCurrency = false,
  onClick,
}: DCFKpiCardProps) {
  const ringColor = isCurrency
    ? pct >= 80 ? 'stroke-emerald-500' : pct >= 50 ? 'stroke-emerald-400' : 'stroke-amber-400'
    : pct >= 80 ? 'stroke-indigo-500' : pct >= 50 ? 'stroke-indigo-400' : 'stroke-amber-400';

  const isPositive = trend !== null && trend !== undefined && trend > 0;
  const isNegative = trend !== null && trend !== undefined && trend < 0;

  return (
    <button
      onClick={onClick}
      className="card-premium p-4 text-left w-full active:scale-[0.97] transition-all duration-150
                 hover:shadow-md cursor-pointer"
    >
      {/* Top row: label */}
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
        {label}
      </div>

      {/* Middle: Value + Ring */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-[22px] font-bold tracking-tight leading-none
            ${isCurrency ? 'text-emerald-700' : 'text-slate-800'}
          `}>
            {value}
          </div>
          {target && (
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              of {target} target
            </div>
          )}
        </div>

        <div className="relative">
          <ProgressRing pct={pct} color={ringColor} />
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-600 rotate-0">
            {Math.round(pct)}%
          </span>
        </div>
      </div>

      {/* Bottom: Trend */}
      {(trendLabel || trend !== null) && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100/80">
          {trendLabel && (
            <span className={`text-[11px] font-medium
              ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-500' : 'text-slate-400'}
            `}>
              {isPositive && '\u2191 '}{isNegative && '\u2193 '}{trendLabel}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
