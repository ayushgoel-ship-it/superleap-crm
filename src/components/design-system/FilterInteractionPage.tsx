/**
 * SUPERLEAP FILTER INTERACTION - Phase 5
 * Filter chip behavior, active states, Clear All, dropdown animation, time filter UX.
 */

import { useState } from 'react';
import { Check, X, ChevronDown, Calendar, Clock, Filter as FilterIcon } from 'lucide-react';

/* ── Helpers ── */
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
      <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

/* ── Enhanced Filter Chip (Phase 5 spec) ── */
function P5FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium
        transition-all duration-[120ms] min-h-[36px] whitespace-nowrap
        ${active
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
    >
      {active && <Check className="w-3.5 h-3.5 sl-animate-chip" />}
      {label}
      {count !== undefined && (
        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold
          ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Filter Chip Demo ── */
function FilterChipDemo() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['All']));

  const filters = [
    { id: 'All', count: 48 },
    { id: 'Active', count: 32 },
    { id: 'Inactive', count: 8 },
    { id: 'Onboarding', count: 5 },
    { id: 'Dormant', count: 3 },
  ];

  const toggle = (id: string) => {
    const next = new Set(activeFilters);
    if (id === 'All') {
      setActiveFilters(new Set(['All']));
      return;
    }
    next.delete('All');
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    if (next.size === 0) next.add('All');
    setActiveFilters(next);
  };

  const hasMultiple = activeFilters.size > 1 || !activeFilters.has('All');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <P5FilterChip
            key={f.id}
            label={f.id}
            count={f.count}
            active={activeFilters.has(f.id)}
            onClick={() => toggle(f.id)}
          />
        ))}

        {/* Clear All - fade in when multiple active */}
        {hasMultiple && (
          <button
            onClick={() => setActiveFilters(new Set(['All']))}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] font-medium
                       text-rose-600 hover:bg-rose-50 transition-all duration-[120ms] sl-animate-chip"
          >
            <X className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Filters</div>
        <div className="text-[12px] text-slate-600">
          {Array.from(activeFilters).join(', ')}
        </div>
      </div>
    </div>
  );
}

/* ── Chip State Comparison ── */
function ChipStateComparison() {
  return (
    <div className="space-y-4">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inactive State</div>
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium
                        bg-white text-slate-600 border border-slate-200">
          Active
        </div>
        <div className="text-[11px] text-slate-400">bg-white, text-slate-600, border-slate-200</div>
      </div>

      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active State</div>
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium
                        bg-indigo-600 text-white shadow-sm shadow-indigo-200">
          <Check className="w-3.5 h-3.5" />
          Active
        </div>
        <div className="text-[11px] text-slate-400">bg-primary-600, text-white, check icon appears</div>
      </div>

      <div className="p-3 bg-indigo-50 rounded-xl text-[11px] text-indigo-700 border border-indigo-100">
        <strong>Spec:</strong> Active chip turns primary-600 background, text goes white, a small check icon fades in.
        Transition is 120ms ease-out. Chip stays exactly the same size; the check icon replaces left padding.
      </div>
    </div>
  );
}

/* ── Dropdown Animation Demo ── */
function DropdownAnimationDemo() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('Today');

  const options = ['Today', 'This Week', 'This Month', 'Last 30 Days', 'Custom Range'];

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-slate-500">Click to toggle the dropdown. Observe fade + slide 6px animation.</p>

      <div className="relative inline-block">
        <button
          onClick={() => setOpen(!open)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium
                      border transition-all duration-[120ms] min-h-[44px]
                      ${open
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
        >
          <Clock className="w-4 h-4" />
          {selected}
          <ChevronDown className={`w-4 h-4 transition-transform duration-[140ms] ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl border border-slate-100 py-1.5
                          sl-animate-dropdown z-10"
               style={{ boxShadow: 'var(--sl-shadow-dropdown)' }}>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { setSelected(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors duration-100
                  ${selected === opt
                    ? 'text-indigo-700 bg-indigo-50'
                    : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  {opt}
                  {selected === opt && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />
      )}

      <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600">
        <strong>Dropdown animation:</strong> <code>sl-animate-dropdown</code> = fade + translateY(6px), 140ms ease-out.
        Shadow uses <code>--sl-shadow-dropdown</code>. ChevronDown rotates 180deg.
      </div>
    </div>
  );
}

/* ── Time Filter Active State ── */
function TimeFilterStateDemo() {
  const [period, setPeriod] = useState('MTD');
  const [showCustom, setShowCustom] = useState(false);

  const periods = [
    { id: 'Today', label: 'Today' },
    { id: 'WTD', label: 'WTD' },
    { id: 'MTD', label: 'MTD' },
    { id: 'QTD', label: 'QTD' },
    { id: 'Custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {periods.map(p => {
          const isActive = period === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setPeriod(p.id);
                setShowCustom(p.id === 'Custom');
              }}
              className={`px-3.5 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap
                transition-all duration-[120ms] min-h-[36px]
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Custom date range display */}
      {showCustom && (
        <div className="flex items-center gap-2 pl-1 sl-animate-dropdown">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span className="text-[12px] text-slate-600 font-medium">Jan 15, 2026 {'\u2013'} Feb 13, 2026</span>
          <button
            onClick={() => { setPeriod('MTD'); setShowCustom(false); }}
            className="ml-1 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      )}

      <div className="p-3 bg-indigo-50 rounded-xl text-[11px] text-indigo-700">
        <strong>Time filter:</strong> Active state is persistent (stays highlighted). When {'\u201C'}Custom{'\u201D'} is selected,
        the date range appears below with a smooth dropdown animation.
      </div>
    </div>
  );
}

/* ── Multi-Filter Summary ── */
function MultiFilterSummary() {
  const [channel, setChannel] = useState<string[]>(['NGS']);
  const [status, setStatus] = useState<string[]>(['Active']);
  const [segment, setSegment] = useState<string[]>([]);

  const channels = ['NGS', 'GS', 'DCF'];
  const statuses = ['Active', 'Dormant', 'New', 'Churned'];
  const segments = ['A', 'B', 'C'];

  const toggleList = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const totalFilters = channel.length + status.length + segment.length;

  const clearAll = () => {
    setChannel([]);
    setStatus([]);
    setSegment([]);
  };

  return (
    <div className="space-y-4">
      {/* Channel */}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Channel</div>
        <div className="flex flex-wrap gap-1.5">
          {channels.map(c => (
            <P5FilterChip key={c} label={c} active={channel.includes(c)} onClick={() => toggleList(channel, c, setChannel)} />
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map(s => (
            <P5FilterChip key={s} label={s} active={status.includes(s)} onClick={() => toggleList(status, s, setStatus)} />
          ))}
        </div>
      </div>

      {/* Segment */}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Segment</div>
        <div className="flex flex-wrap gap-1.5">
          {segments.map(s => (
            <P5FilterChip key={s} label={`Seg ${s}`} active={segment.includes(s)} onClick={() => toggleList(segment, s, setSegment)} />
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-slate-400" />
          <span className="text-[12px] text-slate-600 font-medium">
            {totalFilters === 0 ? 'No filters applied' : `${totalFilters} filter${totalFilters > 1 ? 's' : ''} active`}
          </span>
        </div>
        {totalFilters > 0 && (
          <button
            onClick={clearAll}
            className="text-[12px] text-rose-600 font-medium hover:text-rose-700 transition-colors sl-animate-chip"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export function FilterInteractionPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">Filter Interaction</h2>
        <p className="text-[13px] text-slate-500">
          Chip selection states, Clear All behavior, dropdown animation, and time filter persistence.
        </p>
      </div>

      {/* 1) Chip States */}
      <div className="card-premium p-5">
        <SectionHeader
          title="1. Filter Chip Active States"
          description="Compare inactive vs active chip rendering"
        />
        <ChipStateComparison />
      </div>

      {/* 2) Interactive Filter */}
      <div className="card-premium p-5">
        <SectionHeader
          title='2. Filter Chip with "Clear All"'
          description="Select multiple filters to see Clear All fade in"
        />
        <FilterChipDemo />
      </div>

      {/* 3) Dropdown Animation */}
      <div className="card-premium p-5">
        <SectionHeader
          title="3. Dropdown Animation"
          description="Fade + slide 6px, 140ms ease-out"
        />
        <DropdownAnimationDemo />
      </div>

      {/* 4) Time Filter */}
      <div className="card-premium p-5">
        <SectionHeader
          title="4. Time Filter Selection"
          description="Persistent active state with custom date display"
        />
        <TimeFilterStateDemo />
      </div>

      {/* 5) Multi-Filter */}
      <div className="card-premium p-5">
        <SectionHeader
          title="5. Multi-Filter Summary"
          description="Channel + Status + Segment with combined Clear All"
        />
        <MultiFilterSummary />
      </div>
    </div>
  );
}