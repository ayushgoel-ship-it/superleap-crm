/**
 * UNIFIED TIME FILTER CONTROL
 * Phase 3 — One component for all time period selection across the app.
 *
 * Supports two visual modes:
 *   - "chips"    → segmented pill row (KAM / TL dashboards, DCF, Visits, Leads)
 *   - "dropdown" → single button + popover menu (Admin scope bar, Admin dashboard)
 *
 * Usage:
 *   <TimeFilterControl
 *     mode="chips"
 *     value={timePeriod}
 *     onChange={setTimePeriod}
 *     options={[TimePeriod.TODAY, TimePeriod.LAST_7D, TimePeriod.MTD]}
 *   />
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { TIME_PERIOD_LABELS } from '../../lib/time/resolveTimePeriod';

// ── Props ──

export interface TimeFilterControlProps {
  /** Visual mode: "chips" renders a segmented pill row; "dropdown" renders a select-style button. */
  mode: 'chips' | 'dropdown';
  /** Current selected period. */
  value: TimePeriod;
  /** Callback when user selects a new period. */
  onChange: (period: TimePeriod) => void;
  /** Restrict visible options. Defaults to the full enum if not provided. */
  options?: TimePeriod[];
  /** Override display labels per period. Merged on top of defaults. */
  labelOverrides?: Partial<Record<TimePeriod, string>>;
  /** Whether to include TimePeriod.CUSTOM in the options and handle custom date picking. */
  allowCustom?: boolean;
  /** Custom range start ISO (used when value === CUSTOM). */
  customFrom?: string;
  /** Custom range end ISO (used when value === CUSTOM). */
  customTo?: string;
  /** Called when user edits the custom range. */
  onCustomRangeChange?: (range: { fromISO: string; toISO: string }) => void;
  /** Optional label displayed above the control (dropdown mode only). */
  label?: string;
  /** Chips style variant: "segmented" uses the iOS-style segmented control, "pill" uses FilterChip styling */
  chipStyle?: 'segmented' | 'pill';
}

// ── Default option presets ──

/** KAM / TL common chip set */
export const KAM_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.TODAY, TimePeriod.D_MINUS_1, TimePeriod.MTD, TimePeriod.LAST_MONTH,
];

/** Visits / Activity page chip set */
export const VISITS_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.TODAY, TimePeriod.LAST_7D, TimePeriod.MTD,
];

/** Visits tab (with custom) */
export const VISITS_TAB_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.TODAY, TimePeriod.LAST_7D, TimePeriod.LAST_30D,
];

/** Leads page chip set */
export const LEADS_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.MTD, TimePeriod.TODAY, TimePeriod.D_MINUS_1, TimePeriod.LAST_7D, TimePeriod.LAST_30D,
];

/** DCF page chip set */
export const DCF_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.MTD, TimePeriod.LAST_7D, TimePeriod.LAST_30D, TimePeriod.QTD,
];

/** Leaderboard chip set */
export const LEADERBOARD_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.MTD, TimePeriod.D_MINUS_1, TimePeriod.LAST_7D, TimePeriod.LMTD,
];

/** TL Home chip set */
export const TL_HOME_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.D_MINUS_1, TimePeriod.LAST_7D, TimePeriod.LAST_MONTH, TimePeriod.MTD,
];

/** Admin dropdown options */
export const ADMIN_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.D_MINUS_1, TimePeriod.MTD, TimePeriod.LMTD, TimePeriod.LAST_MONTH,
];

// ── Component ──

export function TimeFilterControl({
  mode,
  value,
  onChange,
  options,
  labelOverrides,
  allowCustom = false,
  chipStyle = 'segmented',
}: TimeFilterControlProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Merge label overrides onto defaults
  const getLabel = (p: TimePeriod): string => {
    if (labelOverrides?.[p]) return labelOverrides[p]!;
    return TIME_PERIOD_LABELS[p] ?? String(p);
  };

  // Build options list
  let visibleOptions = options ?? Object.values(TimePeriod);
  if (!allowCustom) {
    visibleOptions = visibleOptions.filter(o => o !== TimePeriod.CUSTOM);
  }

  // ── Chips Mode ──
  if (mode === 'chips') {
    if (chipStyle === 'pill') {
      return (
        <div className="flex flex-wrap gap-2">
          {visibleOptions.map((period) => (
            <button
              key={period}
              onClick={() => onChange(period)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium
                transition-all duration-150 min-h-[36px] whitespace-nowrap
                ${value === period
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              {getLabel(period)}
            </button>
          ))}
        </div>
      );
    }

    // Segmented control (default) — matches DCFPage / VisitsPage pattern
    return (
      <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
        {visibleOptions.map((period) => (
          <button
            key={period}
            onClick={() => onChange(period)}
            className={`flex-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 min-h-[36px]
              ${value === period
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }
            `}
          >
            {getLabel(period)}
          </button>
        ))}
      </div>
    );
  }

  // ── Dropdown Mode ──
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
      >
        <span>{getLabel(value)}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
            {visibleOptions.map((period) => (
              <button
                key={period}
                onClick={() => {
                  onChange(period);
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  value === period ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                {getLabel(period)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
