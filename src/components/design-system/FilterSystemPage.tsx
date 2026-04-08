/**
 * FILTER SYSTEM - Unified Filter Architecture Visual Standard
 * Phase 4 - FilterBar, state indicators, persistence UI
 */

import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, Filter } from 'lucide-react';
import { FilterChip, StatusChip, ChannelChip } from '../premium/Chip';
import { TimeFilterControl, KAM_TIME_OPTIONS, ADMIN_TIME_OPTIONS, VISITS_TAB_TIME_OPTIONS } from '../filters/TimeFilterControl';
import { TimePeriod } from '../../lib/domain/constants';

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
      <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

function RuleBox({ rules }: { rules: string[] }) {
  return (
    <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
      <div className="text-[11px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
        <SlidersHorizontal className="w-3 h-3" /> Rules
      </div>
      <ul className="space-y-1">
        {rules.map((r, i) => (
          <li key={i} className="text-[11px] text-amber-700 flex items-start gap-1.5">
            <span className="mt-1 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// FilterBar Demo Component
function FilterBarDemo({ mode }: { mode: 'horizontal' | 'dropdown' | 'mixed' }) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [region, setRegion] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | null>(null);

  const activeCount = [region, status, channel].filter(Boolean).length + 1; // +1 for time always being active

  if (mode === 'horizontal') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters
          </div>
          {activeCount > 1 && (
            <button
              onClick={() => { setRegion(null); setStatus(null); setChannel(null); }}
              className="text-[11px] text-indigo-600 font-medium flex items-center gap-0.5"
            >
              Clear All <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <TimeFilterControl
            mode="chips"
            value={timePeriod}
            onChange={setTimePeriod}
            options={KAM_TIME_OPTIONS}
            chipStyle="pill"
          />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-50 pt-2">
          <FilterChip label="All Status" active={!status} onClick={() => setStatus(null)} />
          <FilterChip label="Active" active={status === 'active'} onClick={() => setStatus(status === 'active' ? null : 'active')} count={28} />
          <FilterChip label="Dormant" active={status === 'dormant'} onClick={() => setStatus(status === 'dormant' ? null : 'dormant')} count={14} />
        </div>
      </div>
    );
  }

  if (mode === 'dropdown') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-3">
        <div className="flex items-center gap-3">
          <TimeFilterControl
            mode="dropdown"
            value={timePeriod}
            onChange={setTimePeriod}
            options={ADMIN_TIME_OPTIONS}
          />
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[12px] font-medium border border-slate-200 whitespace-nowrap">
              Region <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[12px] font-medium border border-slate-200 whitespace-nowrap">
              Team Lead <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[12px] font-medium border border-slate-200 whitespace-nowrap">
              Channel <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mixed mode
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-3">
      <div className="flex items-center gap-3">
        <TimeFilterControl
          mode="dropdown"
          value={timePeriod}
          onChange={setTimePeriod}
          options={ADMIN_TIME_OPTIONS}
        />
        <div className="flex-1 flex flex-wrap gap-2">
          <FilterChip label="Active" active={status === 'active'} onClick={() => setStatus(status === 'active' ? null : 'active')} />
          <FilterChip label="Dormant" active={status === 'dormant'} onClick={() => setStatus(status === 'dormant' ? null : 'dormant')} />
          <FilterChip label="All" active={!status} onClick={() => setStatus(null)} />
        </div>
      </div>
    </div>
  );
}

export function FilterSystemPage() {
  const [pastVisitTime, setPastVisitTime] = useState<TimePeriod>(TimePeriod.LAST_7D);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">Filter System</h2>
        <p className="text-[13px] text-slate-500">
          Unified filter architecture for consistent data scoping across all roles.
        </p>
      </div>

      {/* 1) FilterBar Component */}
      <div className="card-premium p-5">
        <SectionHeader title="1. FilterBar Component" description="Three modes for different contexts" />

        <div className="space-y-4">
          {/* Horizontal Chip Mode */}
          <div>
            <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-2">Horizontal Chip Mode (KAM/TL)</div>
            <FilterBarDemo mode="horizontal" />
          </div>

          {/* Dropdown Mode */}
          <div>
            <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-2">Dropdown Mode (Admin)</div>
            <FilterBarDemo mode="dropdown" />
          </div>

          {/* Mixed Mode */}
          <div>
            <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-2">Mixed Mode (Dropdown + Chips)</div>
            <FilterBarDemo mode="mixed" />
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-[12px] font-semibold text-slate-700 mb-2">Structure</div>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-200" />
              <span className="text-slate-500">Left: Time Filter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200" />
              <span className="text-slate-500">Right: Secondary Filters</span>
            </div>
          </div>
        </div>

        <RuleBox rules={[
          'Filters never float alone — always grouped in a FilterBar container',
          'Always grouped: Left = Time, Right = Secondary (region, TL, status, channel)',
          'Past Visit time filter must sit INSIDE Past Visit section only',
        ]} />
      </div>

      {/* 2) Filter State Indicators */}
      <div className="card-premium p-5">
        <SectionHeader title="2. Filter State Indicators" description="Visual feedback when filters are active" />

        {/* Count Badge */}
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Count Badge (Multiple Active)</div>
            <div className="bg-white rounded-2xl border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-[12px] font-semibold text-slate-700">Filters</div>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                    3
                  </span>
                </div>
                <button className="text-[11px] text-indigo-600 font-medium flex items-center gap-0.5">
                  Clear All <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="MTD" active={true} onClick={() => {}} />
                <FilterChip label="Active" active={true} onClick={() => {}} />
                <FilterChip label="NGS" active={true} onClick={() => {}} />
              </div>
            </div>
          </div>

          {/* Clear All Link */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">"Clear All" Visibility Rule</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400 mb-2">1 filter active</div>
                <div className="text-[12px] text-slate-500">No "Clear All" shown</div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                <div className="text-[11px] text-indigo-500 mb-2">&gt;1 filter active</div>
                <div className="text-[12px] text-indigo-700 font-medium">Show "Clear All" link</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3) Persistence UI */}
      <div className="card-premium p-5">
        <SectionHeader title="3. Persistence UI" description="Show active filter state below header" />

        <div className="space-y-4">
          {/* Active filter highlight */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Active State Display</div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Mock header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-[15px] font-bold text-slate-800">Dealer Portfolio</div>
                <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                  Showing: MTD (Feb 1 - Feb 13) | Active dealers | NGS
                </div>
              </div>
              <div className="px-4 py-3 bg-slate-50/50">
                <div className="text-[11px] text-slate-400">42 dealers matching filters</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4) Past Visit Filter Isolation */}
      <div className="card-premium p-5">
        <SectionHeader title="4. Past Visit Filter Isolation" description="Critical: Time filter scoped to Past Visits section only" />

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Mock page header */}
          <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
            <div className="text-[13px] font-bold text-indigo-900">Visits Page</div>
            <div className="text-[11px] text-indigo-600">Page-level time filter: NONE (Visits has its own sections)</div>
          </div>

          {/* Start Visit Section */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-semibold text-slate-700">Start Visit (no time filter)</span>
            </div>
          </div>

          {/* Suggested Visit Section */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="text-[12px] font-semibold text-slate-700">Suggested Visit (no time filter)</span>
            </div>
          </div>

          {/* Past Visits Section with its own time filter */}
          <div className="px-4 py-3 bg-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[12px] font-semibold text-slate-700">Past Visits</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">HAS TIME FILTER</span>
            </div>
            <TimeFilterControl
              mode="chips"
              value={pastVisitTime}
              onChange={setPastVisitTime}
              options={VISITS_TAB_TIME_OPTIONS}
              chipStyle="segmented"
            />
            <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-[10px] text-amber-700 font-semibold">
                This filter affects ONLY Past Visits — not Start Visit or Suggested Visit sections
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5) TimePeriod Enum Mapping */}
      <div className="card-premium p-5">
        <SectionHeader title="5. TimePeriod Enum Reference" description="Canonical enum values and their display labels" />

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-3 py-2 font-semibold">Enum Value</th>
                <th className="px-3 py-2 font-semibold">Display</th>
                <th className="px-3 py-2 font-semibold">Used In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { val: 'TimePeriod.TODAY', label: 'Today', usage: 'KAM, Visits' },
                { val: 'TimePeriod.D_MINUS_1', label: 'D-1', usage: 'KAM, TL, Admin' },
                { val: 'TimePeriod.LAST_7D', label: 'Last 7D', usage: 'Visits, Leads, DCF' },
                { val: 'TimePeriod.LAST_30D', label: 'Last 30D', usage: 'Leads, DCF, Visits' },
                { val: 'TimePeriod.MTD', label: 'MTD', usage: 'KAM, TL, Admin, Leads, DCF' },
                { val: 'TimePeriod.LMTD', label: 'LMTD', usage: 'Admin, Leaderboard' },
                { val: 'TimePeriod.LAST_MONTH', label: 'Last Month', usage: 'KAM, TL, Admin' },
                { val: 'TimePeriod.QTD', label: 'QTD', usage: 'DCF' },
                { val: 'TimePeriod.CUSTOM', label: 'Custom', usage: 'Future' },
              ].map(row => (
                <tr key={row.val} className="text-slate-700">
                  <td className="px-3 py-2 font-mono text-[11px] text-indigo-600">{row.val}</td>
                  <td className="px-3 py-2 font-medium">{row.label}</td>
                  <td className="px-3 py-2 text-slate-400">{row.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
