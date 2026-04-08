/**
 * DealerFilterBar — compact 4-chip filter row for the Activity module.
 *
 * Single horizontal row of 4 chips: Dealer · DCF · Insp · Activity.
 * Tapping a chip opens a small popover with the options. Active (non-"All")
 * chips are highlighted. Targets fits-in-one-line at 375px width
 * (horizontal scroll fallback).
 *
 * Component name + prop contract preserved (`value`, `onChange`); the filter
 * value type now includes `activity`.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type {
  DealerFilterState,
  DealerFlag,
  DcfFlag,
  InspectingFlag,
  ActivityFlag,
} from '../../lib/activity/dealerActivityFilter';

interface Props {
  value: DealerFilterState;
  onChange: (next: DealerFilterState) => void;
}

interface ChipProps<T extends string> {
  label: string;
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}

function FilterChip<T extends string>({ label, value, options, onChange }: ChipProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== 'all';
  const current = options.find((o) => o.key === value)?.label ?? 'All';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors
          ${active
            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
      >
        <span className={active ? 'opacity-90' : 'text-slate-400'}>{label}:</span>
        <span>{current}</span>
        <ChevronDown className="w-3 h-3 opacity-80" />
      </button>
      {open && (
        <div className="absolute left-0 top-[110%] z-30 min-w-[140px] bg-white border border-slate-200 rounded-xl shadow-lg p-1.5">
          {options.map((o) => {
            const sel = o.key === value;
            return (
              <button
                key={o.key}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors
                  ${sel ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DealerFilterBar({ value, onChange }: Props) {
  return (
    <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 py-0.5">
      <FilterChip<DealerFlag>
        label="Dealer"
        value={value.dealerFlag}
        options={[
          { key: 'all', label: 'All' },
          { key: 'top', label: 'Top' },
          { key: 'tagged', label: 'Tagged' },
        ]}
        onChange={(v) => onChange({ ...value, dealerFlag: v })}
      />
      <FilterChip<DcfFlag>
        label="DCF"
        value={value.dcfFlag}
        options={[
          { key: 'all', label: 'All' },
          { key: 'onboarded', label: 'Onboarded' },
          { key: 'not_onboarded', label: 'Not onboarded' },
        ]}
        onChange={(v) => onChange({ ...value, dcfFlag: v })}
      />
      <FilterChip<InspectingFlag>
        label="Insp"
        value={value.inspecting}
        options={[
          { key: 'all', label: 'All' },
          { key: 'yes', label: 'Yes' },
          { key: 'no', label: 'No' },
        ]}
        onChange={(v) => onChange({ ...value, inspecting: v })}
      />
      <FilterChip<ActivityFlag>
        label="Activity"
        value={value.activity}
        options={[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'inactive', label: 'Inactive' },
        ]}
        onChange={(v) => onChange({ ...value, activity: v })}
      />
    </div>
  );
}
