/**
 * SUPERLEAP COMPONENTS - Canonical Component Library
 * Phase 4 - Showcases all reusable components without changing visual design.
 */

import { useState } from 'react';
import {
  Home, Users, FileText, Activity, Bell,
  BarChart3, Briefcase, CreditCard, MapPin, Phone,
} from 'lucide-react';
import { StatusChip, ChannelChip, SegmentBadge, FilterChip } from '../premium/Chip';
import { MetricCard } from '../cards/MetricCard';
import { TimeFilterControl, KAM_TIME_OPTIONS, ADMIN_TIME_OPTIONS } from '../filters/TimeFilterControl';
import { TimePeriod } from '../../lib/domain/constants';

function SectionHeader({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="mb-4" id={id}>
      <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
      <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

function ComponentCard({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
      {label && <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</div>}
      {children}
    </div>
  );
}

// A) Bottom Navigation
function BottomNavShowcase() {
  const roles = [
    { name: 'KAM', tabs: [
      { id: 'home', label: 'Home', Icon: Home },
      { id: 'dealers', label: 'Dealers', Icon: Users },
      { id: 'leads', label: 'Leads', Icon: FileText },
      { id: 'visits', label: 'Visits', Icon: Activity },
      { id: 'notifications', label: 'Alerts', Icon: Bell },
    ]},
    { name: 'TL', tabs: [
      { id: 'home', label: 'Home', Icon: Home },
      { id: 'dealers', label: 'Team', Icon: Users },
      { id: 'leads', label: 'Leads', Icon: FileText },
      { id: 'visits', label: 'Activity', Icon: Activity },
      { id: 'performance', label: 'Perf', Icon: BarChart3 },
    ]},
    { name: 'Admin', tabs: [
      { id: 'admin-home', label: 'Home', Icon: Home },
      { id: 'admin-dealers', label: 'Dealers', Icon: Users },
      { id: 'admin-leads', label: 'Leads', Icon: FileText },
      { id: 'admin-vc', label: 'V&C', Icon: Activity },
      { id: 'admin-dcf', label: 'DCF', Icon: CreditCard },
    ]},
  ];

  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('home');

  const currentRole = roles[activeRoleIndex];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {roles.map((r, i) => (
          <button
            key={r.name}
            onClick={() => { setActiveRoleIndex(i); setActiveTab(r.tabs[0].id); }}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors
              ${activeRoleIndex === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
            `}
          >
            Role = {r.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-around">
            {currentRole.tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl min-w-[56px] min-h-[44px] transition-all duration-200"
                >
                  {isActive && (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full bg-indigo-600" />
                  )}
                  <tab.Icon
                    className={`w-[22px] h-[22px] transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
        <span className="w-2 h-2 rounded-full bg-indigo-600" />
        <span>Active: Indigo indicator line + bold label + icon filled</span>
      </div>
    </div>
  );
}

export function ComponentsPage() {
  const [filterStates, setFilterStates] = useState({ all: true, active: false, dormant: false });
  const [chipTimePeriod, setChipTimePeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [dropdownTimePeriod, setDropdownTimePeriod] = useState<TimePeriod>(TimePeriod.D_MINUS_1);
  const [modalOpen, setModalOpen] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">SuperLeap Components</h2>
        <p className="text-[13px] text-slate-500">
          Canonical component library. Components preserve existing visual design.
        </p>
      </div>

      {/* A) Bottom Navigation */}
      <div className="card-premium p-5">
        <SectionHeader id="bottom-nav" title="A. Bottom Navigation" description="Single component with role variants: KAM, TL, Admin" />
        <BottomNavShowcase />
      </div>

      {/* B) Status Chip */}
      <div className="card-premium p-5">
        <SectionHeader id="status-chip" title="B. Status Chip" description="Dealer lifecycle and lead stage indicators" />
        <div className="flex flex-wrap gap-2">
          <StatusChip label="Active" variant="success" dot />
          <StatusChip label="Dormant" variant="danger" dot />
          <StatusChip label="Inactive" variant="neutral" dot />
          <StatusChip label="Inspection Scheduled" variant="info" dot />
          <StatusChip label="Converted" variant="success" dot />
          <StatusChip label="Pending Feedback" variant="warning" dot />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusChip label="Active" variant="success" dot size="md" />
          <StatusChip label="Dormant" variant="danger" dot size="md" />
        </div>
        <div className="mt-2 text-[11px] text-slate-400">Size: sm (default) | md</div>
      </div>

      {/* C) Channel Chip */}
      <div className="card-premium p-5">
        <SectionHeader id="channel-chip" title="C. Channel Chip" description="Business vertical indicators" />
        <div className="flex flex-wrap gap-2">
          <ChannelChip channel="NGS" />
          <ChannelChip channel="DCF" />
          <ChannelChip channel="GS" />
        </div>
        <div className="mt-3 text-[11px] text-slate-400">Colors: violet (NGS) / emerald (GS) / amber (DCF)</div>
      </div>

      {/* D) Filter Chip */}
      <div className="card-premium p-5">
        <SectionHeader id="filter-chip" title="D. Filter Chip" description="Toggleable filter controls with optional count badge" />
        <div className="space-y-3">
          <ComponentCard label="States">
            <div className="flex flex-wrap gap-2">
              <FilterChip label="All Dealers" active={filterStates.all} onClick={() => setFilterStates(p => ({ ...p, all: !p.all }))} count={42} />
              <FilterChip label="Active" active={filterStates.active} onClick={() => setFilterStates(p => ({ ...p, active: !p.active }))} count={28} />
              <FilterChip label="Dormant" active={filterStates.dormant} onClick={() => setFilterStates(p => ({ ...p, dormant: !p.dormant }))} count={14} />
            </div>
          </ComponentCard>
          <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <FilterChip label="Default" active={false} onClick={() => {}} />
              <div className="mt-2 text-slate-400">Default</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <FilterChip label="Active" active={true} onClick={() => {}} />
              <div className="mt-2 text-slate-400">Active</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium bg-white text-slate-600 border border-slate-300 bg-slate-50">
                Hover
              </div>
              <div className="mt-2 text-slate-400">Hover</div>
            </div>
          </div>
        </div>
      </div>

      {/* E) Time Filter Control */}
      <div className="card-premium p-5">
        <SectionHeader id="time-filter" title="E. Time Filter Control" description="Unified time selection: chips mode (KAM/TL) and dropdown mode (Admin)" />

        <ComponentCard label="Chips Mode (Segmented)">
          <TimeFilterControl
            mode="chips"
            value={chipTimePeriod}
            onChange={setChipTimePeriod}
            options={KAM_TIME_OPTIONS}
            chipStyle="segmented"
          />
        </ComponentCard>

        <div className="mt-3">
          <ComponentCard label="Chips Mode (Pill)">
            <TimeFilterControl
              mode="chips"
              value={chipTimePeriod}
              onChange={setChipTimePeriod}
              options={KAM_TIME_OPTIONS}
              chipStyle="pill"
            />
          </ComponentCard>
        </div>

        <div className="mt-3">
          <ComponentCard label="Dropdown Mode (Admin)">
            <TimeFilterControl
              mode="dropdown"
              value={dropdownTimePeriod}
              onChange={setDropdownTimePeriod}
              options={ADMIN_TIME_OPTIONS}
            />
          </ComponentCard>
        </div>

        <div className="mt-3 p-3 bg-indigo-50 rounded-xl text-[12px] text-indigo-700">
          Supports: Today, D-1, Last 7D, Last 30D, MTD, LMTD, Last Month, QTD, Custom
        </div>
      </div>

      {/* F) Card Components */}
      <div className="card-premium p-5">
        <SectionHeader id="cards" title="F. Card Components" description="Consistent card system: 16px radius, subtle shadow, slate text system" />

        <ComponentCard label="KPI Card">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="SI Achievement"
              value="78%"
              subtitle="Target: 120 SIs"
              trend={{ direction: 'up', value: '+12%' }}
              status="good"
            />
            <MetricCard
              title="I2SI Conversion"
              value="42%"
              subtitle="Industry avg: 38%"
              trend={{ direction: 'down', value: '-3%' }}
              status="warning"
            />
          </div>
        </ComponentCard>

        <div className="mt-3">
          <ComponentCard label="Dealer Card (Preview)">
            <div className="card-premium p-4">
              <div className="flex items-start gap-3">
                <SegmentBadge segment="A" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-slate-800 truncate">Rajesh Motors</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400 font-medium">DLR-001</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                      <MapPin className="w-2.5 h-2.5" />Delhi
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <StatusChip label="Transacting" variant="success" dot size="sm" />
                <ChannelChip channel="NGS" />
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
                {[
                  { label: 'Leads', value: 12 },
                  { label: 'SIs', value: 4 },
                  { label: 'Calls', value: 8 },
                  { label: 'Visits', value: 3 },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
                    <div className="text-[14px] font-bold text-slate-700 mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </ComponentCard>
        </div>

        <div className="mt-3">
          <ComponentCard label="Lead Card (Preview)">
            <div className="card-premium p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[11px] font-mono font-semibold text-slate-400">LEAD-2024-045</span>
                <ChannelChip channel="NGS" />
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">Organic</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <h3 className="text-[13px] font-semibold text-slate-800">Amit Sharma</h3>
              </div>
              <div className="text-[12px] text-slate-500 ml-9 mb-3">Maruti Swift Dzire 2021</div>
              <div className="flex items-center gap-2">
                <StatusChip label="Inspection Scheduled" variant="info" dot size="sm" />
                <span className="text-[11px] text-slate-400">2d ago</span>
              </div>
            </div>
          </ComponentCard>
        </div>

        <div className="mt-3">
          <ComponentCard label="Visit History Card (Preview)">
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800">Rajesh Motors</div>
                    <div className="text-[11px] text-slate-400">DLR-001 | Delhi</div>
                  </div>
                </div>
                <StatusChip label="Completed" variant="success" size="sm" />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                <span>45 min</span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span>3 leads discussed</span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span>Today, 2:30 PM</span>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>

      {/* G) Modal Components */}
      <div className="card-premium p-5">
        <SectionHeader id="modals" title="G. Modal Components" description="Overlay: bg-black/50, 20px radius, consistent z-index" />

        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'confirm', label: 'Confirmation' },
            { id: 'geofence', label: 'GeoFence Warning' },
            { id: 'feedback', label: 'Feedback Form' },
            { id: 'datepicker', label: 'Date Picker' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setModalOpen(m.id)}
              className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center hover:bg-slate-100 transition-colors"
            >
              <div className="text-[13px] font-semibold text-slate-700">{m.label}</div>
              <div className="text-[11px] text-slate-400 mt-1">Tap to preview</div>
            </button>
          ))}
        </div>

        {/* Modal Previews */}
        {modalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" onClick={() => setModalOpen(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-white rounded-[20px] w-full max-w-sm p-5 shadow-[0_20px_60px_rgba(0,0,0,0.15)]" onClick={e => e.stopPropagation()}>
              {modalOpen === 'confirm' && (
                <>
                  <h3 className="text-[17px] font-bold text-slate-900 mb-2">Confirm Action</h3>
                  <p className="text-[13px] text-slate-500 mb-5">Are you sure you want to submit this visit feedback? This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setModalOpen(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600">Cancel</button>
                    <button onClick={() => setModalOpen(null)} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold">Confirm</button>
                  </div>
                </>
              )}
              {modalOpen === 'geofence' && (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-900 mb-2 text-center">Outside GeoFence</h3>
                  <p className="text-[13px] text-slate-500 mb-5 text-center">You are 350m away from the dealer location. Check-in is only allowed within 200m.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setModalOpen(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600">Go Back</button>
                    <button onClick={() => setModalOpen(null)} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-[13px] font-semibold">Update Location</button>
                  </div>
                </>
              )}
              {modalOpen === 'feedback' && (
                <>
                  <h3 className="text-[17px] font-bold text-slate-900 mb-4">Visit Feedback</h3>
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="text-[12px] font-medium text-slate-500 mb-1 block">Outcome</label>
                      <div className="flex gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[12px] font-medium">Productive</span>
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[12px] font-medium">Non-Productive</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-slate-500 mb-1 block">Notes</label>
                      <div className="w-full h-16 rounded-xl border border-slate-200 bg-slate-50" />
                    </div>
                  </div>
                  <button onClick={() => setModalOpen(null)} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold">Submit</button>
                </>
              )}
              {modalOpen === 'datepicker' && (
                <>
                  <h3 className="text-[17px] font-bold text-slate-900 mb-4">Select Date Range</h3>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 mb-1 block">From</label>
                      <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-700">Feb 01, 2026</div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 mb-1 block">To</label>
                      <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-700">Feb 13, 2026</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setModalOpen(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600">Cancel</button>
                    <button onClick={() => setModalOpen(null)} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold">Apply</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-[12px] font-semibold text-slate-700 mb-2">Modal Spec</div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="text-slate-400">Overlay</div><div className="text-slate-600 font-mono">bg-black/50</div>
            <div className="text-slate-400">Border Radius</div><div className="text-slate-600 font-mono">20px (--sl-radius-modal)</div>
            <div className="text-slate-400">Z-Index (overlay)</div><div className="text-slate-600 font-mono">60 (--sl-z-modal-overlay)</div>
            <div className="text-slate-400">Z-Index (content)</div><div className="text-slate-600 font-mono">70 (--sl-z-modal)</div>
            <div className="text-slate-400">Shadow</div><div className="text-slate-600 font-mono">--sl-shadow-modal</div>
          </div>
        </div>
      </div>

      {/* Segment Badge */}
      <div className="card-premium p-5">
        <SectionHeader id="segment-badge" title="Segment Badge" description="Dealer performance tier indicator" />
        <div className="flex items-center gap-4">
          <div className="text-center">
            <SegmentBadge segment="A" />
            <div className="text-[10px] text-slate-400 mt-1">High</div>
          </div>
          <div className="text-center">
            <SegmentBadge segment="B" />
            <div className="text-[10px] text-slate-400 mt-1">Medium</div>
          </div>
          <div className="text-center">
            <SegmentBadge segment="C" />
            <div className="text-[10px] text-slate-400 mt-1">Low</div>
          </div>
        </div>
      </div>
    </div>
  );
}
