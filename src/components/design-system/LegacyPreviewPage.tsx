/**
 * LEGACY PREVIEW - Read-only snapshot of current app state
 * Phase 4 - Used only for navigation validation. No changes.
 */

import { useState } from 'react';
import {
  Home, Users, FileText, Activity, Bell, MapPin,
  ChevronRight, Clock, TrendingUp, Eye, Lock,
} from 'lucide-react';
import { StatusChip, ChannelChip, SegmentBadge } from '../premium/Chip';

function LegacyBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
      <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
      <div>
        <div className="text-[12px] font-semibold text-amber-700">Legacy Preview (Read Only)</div>
        <div className="text-[11px] text-amber-600 mt-0.5">
          This is a static snapshot of the current mock. No modifications. Used for navigation validation only.
        </div>
      </div>
    </div>
  );
}

// Screen thumbnail component
function ScreenThumbnail({ 
  title, 
  role, 
  route, 
  description,
  children 
}: { 
  title: string; 
  role: string; 
  route: string; 
  description: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card-premium overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Eye className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-slate-800">{title}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                ${role === 'KAM' ? 'bg-emerald-100 text-emerald-700' :
                  role === 'TL' ? 'bg-blue-100 text-blue-700' :
                  role === 'Admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}
              `}>{role}</span>
              <code className="text-[10px] text-slate-400 font-mono">{route}</code>
            </div>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          <div className="text-[11px] text-slate-500 mb-3">{description}</div>
          <div className="bg-[#f7f8fa] rounded-xl p-3 border border-slate-200">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function LegacyPreviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">Legacy Preview</h2>
        <p className="text-[13px] text-slate-500">
          Current full mock pasted as-is. No changes. Used only for navigation validation.
        </p>
      </div>

      <LegacyBanner />

      {/* Navigation Map */}
      <div className="card-premium p-5">
        <h3 className="text-[15px] font-bold text-slate-800 mb-4">Navigation Map</h3>
        <div className="space-y-2">
          {/* KAM Routes */}
          <div className="mb-3">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">KAM Routes</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Home', route: '/home' },
                { label: 'Dealers', route: '/dealers' },
                { label: 'Leads', route: '/leads' },
                { label: 'Visits', route: '/visits' },
                { label: 'DCF', route: '/dcf' },
                { label: 'Notifications', route: '/notifications' },
                { label: 'Performance', route: '/performance' },
                { label: 'Leaderboard', route: '/leaderboard' },
              ].map(r => (
                <div key={r.route} className="flex items-center gap-2 px-2 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-emerald-700">{r.label}</span>
                  <code className="text-[9px] text-emerald-400 font-mono ml-auto">{r.route}</code>
                </div>
              ))}
            </div>
          </div>

          {/* TL Routes */}
          <div className="mb-3">
            <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-2">TL Routes</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Home (TL)', route: '/home' },
                { label: 'Team View', route: '/dealers' },
                { label: 'Leads', route: '/leads' },
                { label: 'Activity', route: '/visits' },
                { label: 'TL Detail', route: '/admin-tl-detail' },
                { label: 'Performance', route: '/performance' },
              ].map(r => (
                <div key={r.route + r.label} className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-[11px] font-medium text-blue-700">{r.label}</span>
                  <code className="text-[9px] text-blue-400 font-mono ml-auto">{r.route}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Routes */}
          <div>
            <div className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider mb-2">Admin Routes</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Admin Home', route: '/admin-home' },
                { label: 'Admin Dealers', route: '/admin-dealers' },
                { label: 'Admin Leads', route: '/admin-leads' },
                { label: 'Admin V&C', route: '/admin-vc' },
                { label: 'Admin DCF', route: '/admin-dcf' },
                { label: 'Admin Dashboard', route: '/admin-dashboard' },
              ].map(r => (
                <div key={r.route} className="flex items-center gap-2 px-2 py-1.5 bg-violet-50 rounded-lg border border-violet-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-[11px] font-medium text-violet-700">{r.label}</span>
                  <code className="text-[9px] text-violet-400 font-mono ml-auto">{r.route}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Screen Previews */}
      <div className="space-y-3">
        <h3 className="text-[15px] font-bold text-slate-800">Screen Previews</h3>

        <ScreenThumbnail 
          title="KAM Home" 
          role="KAM" 
          route="home" 
          description="Main dashboard with KPI summary, time filter, dealer quick stats"
        >
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3">
              <div className="text-[11px] text-slate-400 mb-1">Good morning, Rahul</div>
              <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 mb-3">
                {['D-1', 'Last 7D', 'LM', 'MTD'].map((t, i) => (
                  <div key={t} className={`flex-1 py-1 rounded-md text-[9px] font-semibold text-center ${i === 3 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>{t}</div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50/80 rounded-lg p-2 border border-emerald-100">
                  <div className="text-[9px] text-slate-400">SI Achievement</div>
                  <div className="text-[14px] font-bold text-emerald-700">78%</div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <div className="text-[9px] text-slate-400">Input Score</div>
                  <div className="text-[14px] font-bold text-slate-800">72</div>
                </div>
              </div>
            </div>
          </div>
        </ScreenThumbnail>

        <ScreenThumbnail 
          title="Dealers Page" 
          role="KAM" 
          route="dealers" 
          description="Portfolio view with status/segment filters, dealer cards, search"
        >
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3">
              <div className="flex gap-1.5 mb-3 overflow-x-auto">
                {['All', 'Active', 'Dormant', 'Inactive'].map((f, i) => (
                  <span key={f} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{f}</span>
                ))}
              </div>
              <div className="space-y-2">
                {['Rajesh Motors', 'Krishna Auto'].map((name, i) => (
                  <div key={name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <SegmentBadge segment={i === 0 ? 'A' : 'B'} />
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-slate-700">{name}</div>
                      <div className="flex items-center gap-1">
                        <StatusChip label={i === 0 ? 'Active' : 'Dormant'} variant={i === 0 ? 'success' : 'danger'} dot size="sm" />
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScreenThumbnail>

        <ScreenThumbnail 
          title="Visits Page" 
          role="KAM" 
          route="visits" 
          description="Start Visit, Suggested Visits, All Dealers, Past Visits with scoped time filter"
        >
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3">
              <div className="bg-indigo-600 text-white rounded-xl p-3 mb-2 text-center">
                <div className="text-[12px] font-semibold">Start Visit</div>
                <div className="text-[10px] opacity-80">Select a dealer to begin</div>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mb-1.5">Past Visits</div>
              <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 mb-2">
                {['Today', 'Last 7D', 'Last 30D'].map((t, i) => (
                  <div key={t} className={`flex-1 py-1 rounded-md text-[9px] font-semibold text-center ${i === 0 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>{t}</div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                <MapPin className="w-3 h-3 text-emerald-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-slate-700 truncate">Rajesh Motors - 45 min</div>
                  <div className="text-[9px] text-slate-400">Today, 2:30 PM</div>
                </div>
                <StatusChip label="Done" variant="success" size="sm" />
              </div>
            </div>
          </div>
        </ScreenThumbnail>

        <ScreenThumbnail 
          title="Admin Home" 
          role="Admin" 
          route="admin-home" 
          description="Org-level KPIs, TL leaderboard, scope bar with region/TL filters"
        >
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium border border-blue-200">
                  MTD <span className="text-blue-400">v</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] font-medium border border-slate-200">
                  All Regions <span className="text-slate-400">v</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'SI Target', val: '3,200', color: 'text-slate-800' },
                  { label: 'SI Actual', val: '2,847', color: 'text-emerald-600' },
                  { label: 'Achievement', val: '89%', color: 'text-amber-600' },
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[8px] text-slate-400">{m.label}</div>
                    <div className={`text-[13px] font-bold ${m.color}`}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">TL Performance</div>
              {['Priya S.', 'Rohit K.'].map((name, i) => (
                <div key={name} className="flex items-center gap-2 py-1.5 border-b border-slate-50">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] font-bold text-indigo-600">
                    {i + 1}
                  </div>
                  <span className="text-[10px] font-medium text-slate-700 flex-1">{name}</span>
                  <div className="flex items-center gap-0.5 text-emerald-500">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-semibold">{i === 0 ? '94%' : '87%'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScreenThumbnail>

        <ScreenThumbnail 
          title="TL Home View" 
          role="TL" 
          route="home" 
          description="Team KPIs, KAM performance cards, time filter"
        >
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3">
              <div className="text-[11px] text-slate-400 mb-1">Your Team</div>
              <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 mb-3">
                {['D-1', 'Last 7D', 'LM', 'MTD'].map((t, i) => (
                  <div key={t} className={`flex-1 py-1 rounded-md text-[9px] font-semibold text-center ${i === 3 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>{t}</div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                  <div className="text-[9px] text-blue-500">Team SIs</div>
                  <div className="text-[14px] font-bold text-blue-700">342</div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <div className="text-[9px] text-slate-400">Team Conversion</div>
                  <div className="text-[14px] font-bold text-slate-800">42%</div>
                </div>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">KAM Scoreboard</div>
              {['Rahul K.', 'Sneha P.'].map((name, i) => (
                <div key={name} className="flex items-center gap-2 py-1.5 border-b border-slate-50">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">
                    {i + 1}
                  </div>
                  <span className="text-[10px] font-medium text-slate-700 flex-1">{name}</span>
                  <span className="text-[9px] font-semibold text-slate-500">{i === 0 ? '28 SIs' : '22 SIs'}</span>
                </div>
              ))}
            </div>
          </div>
        </ScreenThumbnail>

        <ScreenThumbnail 
          title="Leads Page V3" 
          role="KAM" 
          route="leads" 
          description="Lead pipeline with channel/stage filters, CEP visibility, date filter"
        >
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3">
              <div className="flex gap-1.5 mb-2 overflow-x-auto">
                {['MTD', 'Today', 'D-1', 'Last 7D', 'Last 30D'].map((f, i) => (
                  <span key={f} className={`px-2 py-1 rounded-lg text-[9px] font-medium whitespace-nowrap ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{f}</span>
                ))}
              </div>
              <div className="flex gap-1.5 mb-3">
                <ChannelChip channel="NGS" />
                <ChannelChip channel="DCF" />
              </div>
              <div className="space-y-2">
                {['Amit Sharma', 'Priya Patel'].map((name, i) => (
                  <div key={name} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-mono text-slate-400">LEAD-{2045 + i}</span>
                      <ChannelChip channel={i === 0 ? 'NGS' : 'DCF'} />
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700">{name}</div>
                    <div className="text-[9px] text-slate-400 mb-1">{i === 0 ? 'Swift Dzire 2021' : 'Hyundai i20 2020'}</div>
                    <StatusChip label={i === 0 ? 'Inspection Scheduled' : 'New'} variant={i === 0 ? 'info' : 'neutral'} dot size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScreenThumbnail>

        <ScreenThumbnail 
          title="DCF Page" 
          role="KAM" 
          route="dcf" 
          description="DCF vertical dashboard with onboarding, leads, disbursals KPIs"
        >
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3">
              <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 mb-3">
                {['MTD', 'Last 7D', 'Last 30D', 'QTD'].map((t, i) => (
                  <div key={t} className={`flex-1 py-1 rounded-md text-[9px] font-semibold text-center ${i === 0 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>{t}</div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Onboarded', val: '8' },
                  { label: 'DCF Leads', val: '24' },
                  { label: 'Disbursed', val: '12' },
                ].map(m => (
                  <div key={m.label} className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                    <div className="text-[8px] text-amber-500">{m.label}</div>
                    <div className="text-[13px] font-bold text-amber-700">{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScreenThumbnail>
      </div>

      {/* Flow Diagram */}
      <div className="card-premium p-5">
        <h3 className="text-[15px] font-bold text-slate-800 mb-4">Navigation Flow Summary</h3>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="space-y-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">1</span>
              <span className="text-slate-600">Login → Role Detection → Appropriate Home</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">2</span>
              <span className="text-slate-600">Home → Bottom Nav → 5 Primary Sections</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">3</span>
              <span className="text-slate-600">Dealers → Dealer Detail → Quick Actions → Feedback</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">4</span>
              <span className="text-slate-600">Visits → Start Visit → GeoFence → Check-in → Feedback</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">5</span>
              <span className="text-slate-600">Impersonation: Admin → TL → KAM (preserves original role)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}