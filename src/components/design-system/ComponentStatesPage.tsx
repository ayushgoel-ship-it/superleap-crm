/**
 * SUPERLEAP COMPONENT STATES - Phase 5
 * Card interaction states, KPI card hover, Modal polish, Geo-fence visit UX.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin, ChevronRight, TrendingUp, TrendingDown,
  X, AlertTriangle, Navigation, RefreshCw, Loader2, Check,
  MapPinOff, Wifi, WifiOff,
} from 'lucide-react';

/* ── Helpers ── */
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
      <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

/* ── Dealer Card Interaction Demo ── */
function DealerCardDemo() {
  const [state, setState] = useState<'default' | 'hover' | 'active' | 'selected'>('default');

  const cardStyles: Record<string, string> = {
    default: 'shadow-[var(--sl-shadow-card)] border border-slate-100/60',
    hover: 'shadow-[var(--sl-shadow-card-hover)] border border-slate-100/60 -translate-y-0.5',
    active: 'shadow-[var(--sl-shadow-card)] border border-slate-100/60 scale-[0.98]',
    selected: 'shadow-[var(--sl-shadow-card-hover)] border-2 border-indigo-500 -translate-y-0.5',
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(['default', 'hover', 'active', 'selected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all
              ${state === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-center border border-slate-100">
        <div
          className={`bg-white rounded-2xl p-4 w-full max-w-[300px] transition-all duration-[120ms] cursor-pointer
            ${cardStyles[state]}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[14px]">
              RS
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-slate-900">Rajesh Motors</div>
              <div className="text-[11px] text-slate-500">Dealer {'\u2022'} Segment A {'\u2022'} NGS</div>
            </div>
            {state === 'selected' && (
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center sl-animate-chip">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Leads', value: '12' },
              { label: 'Conv', value: '67%' },
              { label: 'Visits', value: '3' },
              { label: 'Calls', value: '8' },
            ].map(m => (
              <div key={m.label}>
                <div className="text-[10px] text-slate-400">{m.label}</div>
                <div className="text-[14px] font-bold text-slate-800">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 bg-indigo-50 rounded-xl text-[11px] text-indigo-700 space-y-1">
        <div><strong>Hover:</strong> Slight elevation increase ({'\u2192'} <code>--sl-shadow-card-hover</code>), translateY(-0.5px)</div>
        <div><strong>Active (tap):</strong> scale(0.98), shadow returns to default</div>
        <div><strong>Selected:</strong> 2px indigo-500 border highlight + check badge</div>
      </div>
    </div>
  );
}

/* ── KPI Card Hover Demo ── */
function KPICardDemo() {
  return (
    <div className="space-y-3">
      <p className="text-[12px] text-slate-500">Hover over each KPI card to see the subtle shadow elevation.</p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Leads', value: '142', trend: '+12%', up: true },
          { label: 'Conversion', value: '68%', trend: '+3.2%', up: true },
          { label: 'Visits Done', value: '28', trend: '-2', up: false },
          { label: 'Avg Revenue', value: '\u20B91.2L', trend: '+8%', up: true },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl p-4 border border-slate-100/60 cursor-default
                       transition-shadow duration-[120ms] ease-out
                       hover:shadow-[var(--sl-shadow-card-hover)]"
            style={{ boxShadow: 'var(--sl-shadow-card)' }}
          >
            <div className="text-[11px] text-slate-500 font-medium mb-1">{kpi.label}</div>
            <div className="text-[20px] font-bold text-slate-900 mb-1">{kpi.value}</div>
            <div className={`inline-flex items-center gap-1 text-[11px] font-semibold
              ${kpi.up ? 'text-emerald-600' : 'text-rose-600'}`}>
              {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600">
        <strong>KPI Cards:</strong> Hover adds subtle shadow only. No transform, no dramatic animation.
        Transition: <code>box-shadow 120ms ease-out</code>.
      </div>
    </div>
  );
}

/* ── Modal Polish Demo ── */
function ModalPolishDemo() {
  const [open, setOpen] = useState(false);
  const [mandatory, setMandatory] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [closing, setClosing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleClose = () => {
    if (mandatory && !inputValue.trim()) {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      return;
    }
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setInputValue('');
    }, 180);
  };

  const handleOverlayClick = () => {
    if (!mandatory) handleClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        if (!mandatory) handleClose();
        else {
          setShaking(true);
          setTimeout(() => setShaking(false), 400);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, mandatory, inputValue]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => { setMandatory(false); setOpen(true); }}
          className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Open Standard Modal
        </button>
        <button
          onClick={() => { setMandatory(true); setOpen(true); }}
          className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
        >
          Open Mandatory Modal
        </button>
      </div>

      {open && (
        <div className="relative">
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 z-[60] ${closing ? 'sl-animate-modal-exit' : 'sl-animate-overlay'}`}
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 pointer-events-none">
            <div
              className={`bg-white rounded-[20px] p-6 w-full max-w-[340px] pointer-events-auto
                ${closing ? 'sl-animate-modal-exit' : 'sl-animate-modal-enter'}
                ${shaking ? 'sl-animate-shake' : ''}`}
              style={{ boxShadow: 'var(--sl-shadow-modal)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[15px] font-bold text-slate-900">
                  {mandatory ? 'Required Feedback' : 'Confirmation'}
                </h4>
                {!mandatory && (
                  <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              <p className="text-[13px] text-slate-600 mb-4">
                {mandatory
                  ? 'Please provide your feedback before closing. This field is required.'
                  : 'Are you sure you want to proceed with this action?'
                }
              </p>

              {mandatory && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Enter feedback..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-[13px] transition-colors
                      ${shaking && !inputValue.trim()
                        ? 'border-rose-300 bg-rose-50'
                        : 'border-slate-200 bg-white focus:border-indigo-400'
                      } outline-none`}
                  />
                  {shaking && !inputValue.trim() && (
                    <p className="text-[11px] text-rose-600 mt-1 sl-animate-chip">This field is required</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-indigo-600 text-white
                             hover:bg-indigo-700 transition-colors min-h-[44px]"
                >
                  {mandatory ? 'Submit' : 'Confirm'}
                </button>
                {!mandatory && (
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-medium bg-white text-slate-700
                               border border-slate-200 hover:bg-slate-50 transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 space-y-1">
        <div><strong>Overlay:</strong> bg-black/50, fade in 120ms</div>
        <div><strong>Modal:</strong> Fade + translateY(8px), 180ms ease-out. Rounded 20px. Padding 24px.</div>
        <div><strong>Close:</strong> ESC closes, overlay click closes (except mandatory)</div>
        <div><strong>Mandatory:</strong> Shake animation on invalid submit attempt</div>
      </div>
    </div>
  );
}

/* ── Geo-Fence Visit UX Demo ── */
function GeoFenceDemo() {
  const [scenario, setScenario] = useState<'outside' | 'inaccurate' | 'updating'>('outside');
  const [distance, setDistance] = useState(450);
  const [accuracy, setAccuracy] = useState(85);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'outside' as const, label: 'Outside 200m' },
          { id: 'inaccurate' as const, label: 'GPS Inaccurate' },
          { id: 'updating' as const, label: 'Location Update' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all
              ${scenario === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
        {scenario === 'outside' && (
          <div className="space-y-3 sl-animate-page">
            <div className="flex items-center gap-2 mb-2">
              <MapPinOff className="w-5 h-5 text-amber-600" />
              <span className="text-[14px] font-semibold text-slate-800">Outside Dealer Zone</span>
            </div>

            {/* Distance bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Distance to dealer</span>
                <span className="font-semibold text-amber-600">{distance}m away</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, (distance / 500) * 100)}%`,
                    background: distance > 200
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : 'linear-gradient(90deg, #10b981, #059669)',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0m</span>
                <span className="text-amber-600 font-medium">200m zone</span>
                <span>500m</span>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold
                               bg-indigo-600 text-white hover:bg-indigo-700 transition-colors min-h-[44px]">
              <Navigation className="w-4 h-4" /> Navigate via Maps
            </button>
          </div>
        )}

        {scenario === 'inaccurate' && (
          <div className="space-y-3 sl-animate-page">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <WifiOff className="w-5 h-5 text-amber-500" />
                <span className="text-[14px] font-semibold text-slate-800">GPS Signal Weak</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-[12px] text-amber-800">Location accuracy is low. Try moving to an open area.</span>
            </div>

            <div className="flex items-center justify-between text-[12px] text-slate-600">
              <span>Current accuracy</span>
              <span className="font-mono text-amber-600 font-semibold">{'\u00B1'}{accuracy}m</span>
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold
                               bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors min-h-[44px]">
              <RefreshCw className="w-4 h-4" /> Retry Location
            </button>
          </div>
        )}

        {scenario === 'updating' && (
          <div className="space-y-3 sl-animate-page">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span className="text-[14px] font-semibold text-slate-800">Update Dealer Location</span>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-[12px]">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-slate-600">Previous: 28.6139{'\u00B0'}N, 77.2090{'\u00B0'}E</span>
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-indigo-700 font-medium">New: 28.6145{'\u00B0'}N, 77.2095{'\u00B0'}E</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-slate-600">
              <Wifi className="w-4 h-4 text-emerald-500" />
              <span>Accuracy: {'\u00B1'}12m</span>
              <span className="text-emerald-600 font-medium">(Good)</span>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 rounded-xl text-[13px] font-semibold bg-indigo-600 text-white
                                 hover:bg-indigo-700 transition-colors min-h-[44px]">
                Confirm Update
              </button>
              <button className="flex-1 px-4 py-3 rounded-xl text-[13px] font-medium bg-white text-slate-700
                                 border border-slate-200 hover:bg-slate-50 transition-colors min-h-[44px]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Role Transition Demo ── */
function RoleTransitionDemo() {
  const [role, setRole] = useState<'KAM' | 'TL' | 'Admin'>('KAM');
  const [transitioning, setTransitioning] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  const switchRole = (newRole: 'KAM' | 'TL' | 'Admin') => {
    if (newRole === role) return;
    setTransitioning(true);
    setTimeout(() => {
      setRole(newRole);
      setContentKey(k => k + 1);
      setTransitioning(false);
    }, 200);
  };

  const roleTabs: Record<string, string[]> = {
    KAM: ['Home', 'Dealers', 'Leads', 'Visits', 'Alerts'],
    TL: ['Home', 'Team', 'Leads', 'Activity', 'Performance'],
    Admin: ['Home', 'Dealers', 'Leads', 'V&C', 'DCF'],
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['KAM', 'TL', 'Admin'] as const).map(r => (
          <button
            key={r}
            onClick={() => switchRole(r)}
            className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all
              ${role === r ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 min-h-[100px]"
           style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 200ms ease-out' }}>
        <div key={contentKey} className="sl-animate-page">
          <div className="text-[13px] font-semibold text-slate-800 mb-2">{role} View</div>
          <div className="flex gap-2">
            {roleTabs[role].map(tab => (
              <span key={tab} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white text-slate-600 border border-slate-200">
                {tab}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Scroll position resets. Filters preserved if same role type.</p>
        </div>
      </div>

      <div className="p-3 bg-indigo-50 rounded-xl text-[11px] text-indigo-700">
        <strong>Role transition:</strong> Soft fade 200ms. Content re-mounts with page-enter animation.
        Scroll position resets. Filter state preserved if same role type.
      </div>
    </div>
  );
}

/* ── Main Page ── */
export function ComponentStatesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">Component States</h2>
        <p className="text-[13px] text-slate-500">
          Card interaction states, KPI hover, modal polish, geo-fence visit UX, and role transitions.
        </p>
      </div>

      {/* 1) Dealer Card */}
      <div className="card-premium p-5">
        <SectionHeader
          title="1. Dealer / Lead Card States"
          description="Hover, active (tap), selected border highlight"
        />
        <DealerCardDemo />
      </div>

      {/* 2) KPI Cards */}
      <div className="card-premium p-5">
        <SectionHeader
          title="2. KPI Card Hover"
          description="Subtle shadow on hover. No dramatic animation."
        />
        <KPICardDemo />
      </div>

      {/* 3) Modal Polish */}
      <div className="card-premium p-5">
        <SectionHeader
          title="3. Modal Polish"
          description="Standard vs mandatory modal with shake feedback"
        />
        <ModalPolishDemo />
      </div>

      {/* 4) Geo-Fence */}
      <div className="card-premium p-5">
        <SectionHeader
          title="4. Geo-Fence Visit UX"
          description="Outside zone, GPS inaccurate, and location update scenarios"
        />
        <GeoFenceDemo />
      </div>

      {/* 5) Role Transition */}
      <div className="card-premium p-5">
        <SectionHeader
          title="5. Role Transition Experience"
          description="Soft fade + content remount on role switch"
        />
        <RoleTransitionDemo />
      </div>
    </div>
  );
}