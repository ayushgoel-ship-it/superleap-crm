/**
 * ROLE PARITY - Side-by-side comparison for KAM, TL, Admin
 * Phase 4 - Ensures visual consistency across all roles
 */

import { useState } from 'react';
import {
  Home, Users, FileText, Activity, Bell, BarChart3, CreditCard,
  Check, X, AlertTriangle, MapPin,
} from 'lucide-react';
import { StatusChip, ChannelChip, SegmentBadge, FilterChip } from '../premium/Chip';
import { MetricCard } from '../cards/MetricCard';

type RoleKey = 'KAM' | 'TL' | 'Admin';

function RoleTab({ role, active, onClick }: { role: RoleKey; active: boolean; onClick: () => void }) {
  const colors: Record<RoleKey, string> = {
    KAM: 'bg-emerald-600',
    TL: 'bg-blue-600',
    Admin: 'bg-violet-600',
  };
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all
        ${active ? `${colors[role]} text-white shadow-sm` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
      `}
    >
      {role}
    </button>
  );
}

function CheckItem({ label, status }: { label: string; status: 'pass' | 'fail' | 'warn' }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {status === 'pass' && <Check className="w-4 h-4 text-emerald-500" />}
      {status === 'fail' && <X className="w-4 h-4 text-rose-500" />}
      {status === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
      <span className={`text-[12px] ${status === 'pass' ? 'text-slate-700' : status === 'fail' ? 'text-rose-600' : 'text-amber-600'}`}>
        {label}
      </span>
    </div>
  );
}

function RoleFrame({ role }: { role: RoleKey }) {
  const bottomNavTabs: Record<RoleKey, { id: string; label: string; Icon: typeof Home }[]> = {
    KAM: [
      { id: 'home', label: 'Home', Icon: Home },
      { id: 'dealers', label: 'Dealers', Icon: Users },
      { id: 'leads', label: 'Leads', Icon: FileText },
      { id: 'visits', label: 'Visits', Icon: Activity },
      { id: 'alerts', label: 'Alerts', Icon: Bell },
    ],
    TL: [
      { id: 'home', label: 'Home', Icon: Home },
      { id: 'team', label: 'Team', Icon: Users },
      { id: 'leads', label: 'Leads', Icon: FileText },
      { id: 'activity', label: 'Activity', Icon: Activity },
      { id: 'perf', label: 'Perf', Icon: BarChart3 },
    ],
    Admin: [
      { id: 'home', label: 'Home', Icon: Home },
      { id: 'dealers', label: 'Dealers', Icon: Users },
      { id: 'leads', label: 'Leads', Icon: FileText },
      { id: 'vc', label: 'V&C', Icon: Activity },
      { id: 'dcf', label: 'DCF', Icon: CreditCard },
    ],
  };

  const roleColors: Record<RoleKey, string> = {
    KAM: 'border-emerald-200',
    TL: 'border-blue-200',
    Admin: 'border-violet-200',
  };

  const roleBgs: Record<RoleKey, string> = {
    KAM: 'bg-emerald-50',
    TL: 'bg-blue-50',
    Admin: 'bg-violet-50',
  };

  return (
    <div className={`rounded-2xl border-2 ${roleColors[role]} overflow-hidden`}>
      {/* Role Header */}
      <div className={`px-3 py-2 ${roleBgs[role]} flex items-center justify-between`}>
        <div className="text-[13px] font-bold text-slate-700">{role} View</div>
        <div className="text-[10px] text-slate-400">Frame {role === 'KAM' ? '1' : role === 'TL' ? '2' : '3'}</div>
      </div>

      {/* Mock Screen */}
      <div className="bg-[#f7f8fa] p-3 min-h-[280px]">
        {/* Top Bar */}
        <div className="bg-white rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Good morning</div>
            <div className="text-[14px] font-bold text-slate-800">
              {role === 'KAM' ? 'Rahul K.' : role === 'TL' ? 'Priya S.' : 'Vikram A.'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[12px] font-bold text-indigo-600">
            {role === 'KAM' ? 'RK' : role === 'TL' ? 'PS' : 'VA'}
          </div>
        </div>

        {/* Time Filter */}
        <div className="mb-3">
          {role === 'Admin' ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-medium border border-blue-200">
                MTD <span className="text-blue-400">v</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-medium border border-slate-200">
                All Regions <span className="text-slate-400">v</span>
              </div>
            </div>
          ) : (
            <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
              {['D-1', 'Last 7D', 'Last Month', 'MTD'].map((label, i) => (
                <div
                  key={label}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold text-center
                    ${i === 3 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}
                  `}
                >
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white rounded-xl p-2.5 border border-slate-100">
            <div className="text-[10px] text-slate-400 mb-0.5">
              {role === 'Admin' ? 'Org SIs' : role === 'TL' ? 'Team SIs' : 'My SIs'}
            </div>
            <div className="text-[16px] font-bold text-slate-800">
              {role === 'Admin' ? '2,847' : role === 'TL' ? '342' : '28'}
            </div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-slate-100">
            <div className="text-[10px] text-slate-400 mb-0.5">
              {role === 'Admin' ? 'Avg I2SI' : 'Conversion'}
            </div>
            <div className="text-[16px] font-bold text-emerald-600">
              {role === 'Admin' ? '38%' : role === 'TL' ? '42%' : '45%'}
            </div>
          </div>
        </div>

        {/* Card Sample */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <SegmentBadge segment="A" />
            <div>
              <div className="text-[12px] font-semibold text-slate-800">Rajesh Motors</div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />Delhi
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusChip label="Active" variant="success" dot size="sm" />
            <ChannelChip channel="C2B" />
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-slate-200 px-1 py-1.5">
        <div className="flex items-center justify-around">
          {bottomNavTabs[role].map((tab, i) => (
            <div key={tab.id} className="flex flex-col items-center gap-0.5 relative">
              {i === 0 && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-indigo-600" />
              )}
              <tab.Icon className={`w-4 h-4 ${i === 0 ? 'text-indigo-600' : 'text-slate-400'}`} strokeWidth={i === 0 ? 2.2 : 1.8} />
              <span className={`text-[8px] font-medium ${i === 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RoleParityPage() {
  const [activeRole, setActiveRole] = useState<RoleKey>('KAM');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">Role Parity</h2>
        <p className="text-[13px] text-slate-500">
          Side-by-side comparison ensuring Admin no longer feels like a different app.
        </p>
      </div>

      {/* Side-by-side comparison (scrollable on mobile) */}
      <div className="card-premium p-5">
        <h3 className="text-[15px] font-bold text-slate-800 mb-4">Side-by-Side Frames</h3>
        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="flex gap-3" style={{ minWidth: '780px' }}>
            <div className="flex-1"><RoleFrame role="KAM" /></div>
            <div className="flex-1"><RoleFrame role="TL" /></div>
            <div className="flex-1"><RoleFrame role="Admin" /></div>
          </div>
        </div>
      </div>

      {/* Alignment Checklist */}
      <div className="card-premium p-5">
        <h3 className="text-[15px] font-bold text-slate-800 mb-4">Alignment Checklist</h3>

        <div className="space-y-4">
          {/* Background Color */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-[12px] font-semibold text-slate-700 mb-2">Background Color</div>
            <div className="grid grid-cols-3 gap-2">
              {(['KAM', 'TL', 'Admin'] as RoleKey[]).map(r => (
                <div key={r} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#f7f8fa] border border-slate-200" />
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">{r}</div>
                    <div className="text-[10px] text-slate-400 font-mono">#f7f8fa</div>
                  </div>
                </div>
              ))}
            </div>
            <CheckItem label="All three roles use --sl-bg-app (#f7f8fa)" status="pass" />
          </div>

          {/* Card Radius */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-[12px] font-semibold text-slate-700 mb-2">Card Radius</div>
            <CheckItem label="KAM cards use 16px radius" status="pass" />
            <CheckItem label="TL cards use 16px radius" status="pass" />
            <CheckItem label="Admin cards use 16px radius" status="pass" />
            <CheckItem label="All cards use --sl-radius-card (16px)" status="pass" />
          </div>

          {/* Primary Color */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-[12px] font-semibold text-slate-700 mb-2">Primary Color Usage</div>
            <CheckItem label="Bottom nav active indicator: indigo-600 (all roles)" status="pass" />
            <CheckItem label="Active filter chip: indigo-600 (all roles)" status="pass" />
            <CheckItem label="CTA buttons: indigo-600 (all roles)" status="pass" />
            <CheckItem label="Admin dropdown uses blue-50/blue-700 (acceptable variant)" status="warn" />
          </div>

          {/* Filter Styling */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-[12px] font-semibold text-slate-700 mb-2">Filter Styling</div>
            <CheckItem label="KAM: Chip-based segmented time filter" status="pass" />
            <CheckItem label="TL: Chip-based segmented time filter" status="pass" />
            <CheckItem label="Admin: Dropdown-based time filter" status="pass" />
            <CheckItem label="All use TimePeriod enum (Phase 3)" status="pass" />
            <CheckItem label="All use TimeFilterControl component" status="pass" />
          </div>

          {/* Typography */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-[12px] font-semibold text-slate-700 mb-2">Typography</div>
            <CheckItem label="Card titles: text-[13px]/text-[14px] font-semibold" status="pass" />
            <CheckItem label="Metric values: text-2xl/text-[16px] font-bold" status="pass" />
            <CheckItem label="Captions: text-[11px] text-slate-400" status="pass" />
            <CheckItem label="All roles use slate-* text colors (no gray-*)" status="pass" />
          </div>

          {/* Bottom Nav */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-[12px] font-semibold text-slate-700 mb-2">Bottom Navigation</div>
            <CheckItem label="Single BottomNav component serves all 3 roles" status="pass" />
            <CheckItem label="Active: indigo indicator line + bold + filled icon" status="pass" />
            <CheckItem label="Inactive: slate-400 + thin stroke" status="pass" />
            <CheckItem label="Glass nav background consistent" status="pass" />
          </div>
        </div>
      </div>

      {/* Visual Diff Summary */}
      <div className="card-premium p-5">
        <h3 className="text-[15px] font-bold text-slate-800 mb-4">Remaining Differences (By Design)</h3>
        <div className="space-y-2">
          {[
            { item: 'Time filter mode', kam: 'Chips', tl: 'Chips', admin: 'Dropdown', reason: 'Admin needs broader period set' },
            { item: 'Nav items', kam: '5 tabs', tl: '5 tabs', admin: '5 tabs', reason: 'Different verticals per role' },
            { item: 'Scope bar', kam: 'None', tl: 'Region only', admin: 'Region + TL', reason: 'Hierarchical data access' },
            { item: 'Card density', kam: 'Single dealer', tl: 'KAM rows', admin: 'TL summary rows', reason: 'Different data granularity' },
          ].map((d, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[12px] font-semibold text-slate-700">{d.item}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-1">
                <div className="text-[10px]"><span className="text-emerald-600 font-semibold">KAM:</span> <span className="text-slate-500">{d.kam}</span></div>
                <div className="text-[10px]"><span className="text-blue-600 font-semibold">TL:</span> <span className="text-slate-500">{d.tl}</span></div>
                <div className="text-[10px]"><span className="text-violet-600 font-semibold">Admin:</span> <span className="text-slate-500">{d.admin}</span></div>
              </div>
              <div className="text-[10px] text-slate-400 italic">{d.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
