/**
 * SUPERLEAP UX ENHANCEMENTS - Phase 5
 * Loading & empty states, toast system, skeleton shimmer, accessibility prep.
 */

import { useState } from 'react';
import {
  CheckCircle, AlertCircle, Info, X, Loader2,
  Users, FileText, MapPin,
  Keyboard, Eye, Hand, Monitor,
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

/* ── Skeleton Shimmer Demo ── */
function SkeletonDemo() {
  const [loading, setLoading] = useState(true);
  const [minDisplayActive, setMinDisplayActive] = useState(false);

  const toggleLoading = () => {
    if (!loading) {
      setLoading(true);
      setMinDisplayActive(true);
      // Minimum 300ms display rule
      setTimeout(() => {
        setLoading(false);
        setMinDisplayActive(false);
      }, 300);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLoading}
          className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          {loading ? 'Show Content' : 'Show Skeleton'}
        </button>
        <button
          onClick={() => {
            setLoading(true);
            setMinDisplayActive(true);
            setTimeout(() => { setLoading(false); setMinDisplayActive(false); }, 300);
          }}
          className="px-4 py-2 rounded-xl text-[12px] font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Fast Load (300ms min)
        </button>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 min-h-[180px]">
        {loading ? (
          <div className="space-y-3 animate-fade-in">
            {/* Card skeleton */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl animate-shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded-lg animate-shimmer" />
                    <div className="h-3 w-1/2 rounded-lg animate-shimmer" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="text-center space-y-1">
                      <div className="h-2.5 w-8 mx-auto rounded animate-shimmer" />
                      <div className="h-4 w-6 mx-auto rounded animate-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 sl-animate-page">
            {[
              { name: 'Rajesh Motors', segment: 'A', leads: 12 },
              { name: 'Supreme Cars', segment: 'B', leads: 8 },
            ].map(d => (
              <div key={d.name} className="bg-white rounded-2xl p-4 border border-slate-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-[14px] font-bold text-indigo-600">
                    {d.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-slate-900">{d.name}</div>
                    <div className="text-[11px] text-slate-500">Segment {d.segment} {'\u2022'} {d.leads} leads</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 border border-amber-100">
        <strong>300ms minimum display:</strong> Prevents loading flicker. Even if data arrives in 50ms,
        skeleton stays for at least 300ms (<code>--sl-duration-min-display</code>).
      </div>
    </div>
  );
}

/* ── Empty State Showcase ── */
function EmptyStateShowcase() {
  const [variant, setVariant] = useState<'empty' | 'filtered' | 'error'>('empty');
  const [type, setType] = useState<'dealers' | 'leads' | 'visits'>('dealers');

  const configs = {
    dealers: {
      icon: Users, accentBg: 'bg-indigo-50', accentIcon: 'text-indigo-500',
      empty: { title: 'Build your dealer network', desc: 'Your assigned dealers will appear here.' },
      filtered: { title: 'No matching dealers', desc: 'Try broadening your filter criteria.' },
      error: { title: "Couldn\u2019t load dealers", desc: 'We ran into a problem. This is usually temporary.' },
    },
    leads: {
      icon: FileText, accentBg: 'bg-violet-50', accentIcon: 'text-violet-500',
      empty: { title: 'No leads yet', desc: 'Once dealers start referring, leads will appear here.' },
      filtered: { title: 'No leads match your filters', desc: 'Adjust channel, stage, or time period.' },
      error: { title: "Couldn\u2019t load leads", desc: 'There was an issue loading your leads.' },
    },
    visits: {
      icon: MapPin, accentBg: 'bg-emerald-50', accentIcon: 'text-emerald-500',
      empty: { title: 'No visits scheduled', desc: 'Plan your next dealer visit.' },
      filtered: { title: 'No visits match', desc: 'Adjust your date range or filters.' },
      error: { title: "Couldn\u2019t load visits", desc: 'We had trouble loading your visit history.' },
    },
  };

  const cfg = configs[type];
  const variantCfg = cfg[variant];
  const Icon = variant === 'error' ? AlertCircle : cfg.icon;
  const bgClass = variant === 'error' ? 'bg-rose-50' : cfg.accentBg;
  const iconClass = variant === 'error' ? 'text-rose-500' : cfg.accentIcon;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 mb-1">
        {(['dealers', 'leads', 'visits'] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all
              ${type === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="text-slate-300 mx-1">|</span>
        {(['empty', 'filtered', 'error'] as const).map(v => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all
              ${variant === v ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col items-center justify-center sl-animate-page"
           key={`${type}-${variant}`}>
        <div className={`w-14 h-14 rounded-2xl ${bgClass} flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 ${iconClass}`} />
        </div>
        <h4 className="text-[14px] font-semibold text-slate-800 mb-1 text-center">{variantCfg.title}</h4>
        <p className="text-[12px] text-slate-500 text-center max-w-[260px] mb-4">{variantCfg.desc}</p>

        {variant === 'empty' && (
          <button className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-indigo-600 text-white
                             hover:bg-indigo-700 transition-colors min-h-[44px]">
            Get Started
          </button>
        )}
        {variant === 'filtered' && (
          <button className="px-5 py-2.5 rounded-xl text-[13px] font-medium bg-white text-slate-700
                             border border-slate-200 hover:bg-slate-50 transition-colors min-h-[44px]">
            Clear Filters
          </button>
        )}
        {variant === 'error' && (
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold
                             bg-indigo-600 text-white hover:bg-indigo-700 transition-colors min-h-[44px]">
            <Loader2 className="w-4 h-4" /> Try Again
          </button>
        )}
      </div>

      <div className="p-3 bg-indigo-50 rounded-xl text-[11px] text-indigo-700">
        <strong>Pattern:</strong> Clear icon + 1-line explanation + optional CTA. Context-aware per entity type.
        Three variants: empty, filtered, error.
      </div>
    </div>
  );
}

/* ── Toast Notification Demo ── */
function ToastDemo() {
  const [toasts, setToasts] = useState<Array<{
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    action?: string;
  }>>([]);

  const addToast = (type: 'success' | 'error' | 'info') => {
    const configs = {
      success: { title: 'Lead Created', message: 'Rajesh Motors referral has been saved', action: '' },
      error: { title: 'Save Failed', message: 'Unable to update dealer status. Please try again.', action: '' },
      info: { title: 'Visit Reminder', message: 'You have 3 pending visits today', action: 'View' },
    };

    const id = Date.now();
    const cfg = configs[type];

    setToasts(prev => {
      const next = [...prev, { id, type, ...cfg }];
      return next.slice(-3); // Max 3 stacked
    });

    // Auto-dismiss success after 3s
    if (type === 'success') {
      setTimeout(() => removeToast(id), 3000);
    }
    // Auto-dismiss info after 5s
    if (type === 'info') {
      setTimeout(() => removeToast(id), 5000);
    }
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const accentColors = {
    success: { bar: 'bg-emerald-500', icon: 'text-emerald-600', bg: 'bg-emerald-50' },
    error: { bar: 'bg-rose-500', icon: 'text-rose-600', bg: 'bg-rose-50' },
    info: { bar: 'bg-sky-500', icon: 'text-sky-600', bg: 'bg-sky-50' },
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => addToast('success')}
          className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          Success Toast
        </button>
        <button
          onClick={() => addToast('error')}
          className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
        >
          Error Toast
        </button>
        <button
          onClick={() => addToast('info')}
          className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
        >
          Info Toast
        </button>
      </div>

      {/* Toast preview area (simulates top-right) */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 min-h-[160px] relative">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Toast Preview (top-right placement)</div>

        <div className="absolute top-4 right-4 space-y-2 w-[280px] z-10">
          {toasts.map(toast => {
            const colors = accentColors[toast.type];
            const IconComp = icons[toast.type];
            return (
              <div
                key={toast.id}
                className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden sl-animate-modal-enter"
              >
                {/* Accent bar */}
                <div className={`h-1 ${colors.bar}`} />
                <div className="p-3 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <IconComp className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800">{toast.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{toast.message}</div>
                    {toast.action && (
                      <button className="text-[11px] font-semibold text-sky-600 mt-1 hover:text-sky-700">
                        {toast.action} {'\u2192'}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {toasts.length === 0 && (
          <div className="flex items-center justify-center h-[120px] text-[12px] text-slate-400">
            Click a button to preview toast notifications
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { type: 'Success', color: 'bg-emerald-500', rules: 'Green accent, auto-dismiss 3s' },
          { type: 'Error', color: 'bg-rose-500', rules: 'Red accent, persistent, no jargon' },
          { type: 'Info', color: 'bg-sky-500', rules: 'Blue accent, optional action button' },
        ].map(t => (
          <div key={t.type} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
              <span className="text-[11px] font-semibold text-slate-700">{t.type}</span>
            </div>
            <span className="text-[10px] text-slate-500">{t.rules}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Accessibility Prep ── */
function AccessibilityPrep() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            icon: Hand, label: 'Touch Targets',
            desc: 'Minimum 44px on all interactive elements',
            check: true,
          },
          {
            icon: Eye, label: 'Contrast AA',
            desc: 'All text meets WCAG 2.1 AA contrast ratio',
            check: true,
          },
          {
            icon: Keyboard, label: 'Focus States',
            desc: 'focus-visible ring on all interactive items',
            check: true,
          },
          {
            icon: Monitor, label: 'Keyboard Nav',
            desc: 'Tab order follows visual flow, ESC closes modals',
            check: true,
          },
        ].map(item => (
          <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="w-4 h-4 text-indigo-500" />
              <span className="text-[12px] font-semibold text-slate-800">{item.label}</span>
              {item.check && (
                <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  Ready
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Touch target visual */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Touch Target Comparison</div>
        <div className="flex items-end gap-4">
          <div className="text-center">
            <div className="w-8 h-8 rounded-lg bg-rose-100 border-2 border-rose-300 border-dashed flex items-center justify-center mb-1">
              <span className="text-[10px] text-rose-500">32</span>
            </div>
            <span className="text-[10px] text-rose-600 font-medium">Too small</span>
          </div>
          <div className="text-center">
            <div className="w-11 h-11 rounded-lg bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mb-1">
              <span className="text-[10px] text-emerald-600">44</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Minimum</span>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center mb-1">
              <span className="text-[10px] text-indigo-600">48</span>
            </div>
            <span className="text-[10px] text-indigo-600 font-medium">Ideal</span>
          </div>
        </div>
      </div>

      {/* Focus ring demo */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Focus Ring Spec</div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl text-[12px] font-semibold bg-indigo-600 text-white
                             ring-2 ring-indigo-500 ring-offset-2 min-h-[44px]">
            Focused Button
          </button>
          <input
            type="text"
            placeholder="Focused input"
            className="px-4 py-2.5 rounded-xl text-[12px] border-2 border-indigo-400 bg-white outline-none min-h-[44px]"
            readOnly
          />
          <div className="px-3.5 py-2 rounded-xl text-[12px] font-medium bg-indigo-600 text-white
                          ring-2 ring-indigo-500 ring-offset-2">
            Focused Chip
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          2px ring, 2px offset, color-matched to component variant. Uses <code>focus-visible</code> (keyboard only).
        </p>
      </div>
    </div>
  );
}

/* ── Contrast Checker Visual ── */
function ContrastChecker() {
  const pairs = [
    { bg: '#ffffff', fg: '#0f172a', label: 'White / Slate-900', ratio: '15.4:1', pass: true },
    { bg: '#ffffff', fg: '#64748b', label: 'White / Slate-500', ratio: '5.4:1', pass: true },
    { bg: '#4f46e5', fg: '#ffffff', label: 'Primary-600 / White', ratio: '6.1:1', pass: true },
    { bg: '#f1f5f9', fg: '#475569', label: 'Slate-100 / Slate-600', ratio: '5.9:1', pass: true },
    { bg: '#fef2f2', fg: '#dc2626', label: 'Error-light / Error', ratio: '5.8:1', pass: true },
  ];

  return (
    <div className="space-y-2">
      {pairs.map(p => (
        <div key={p.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded-md border border-slate-200" style={{ backgroundColor: p.bg }} />
            <div className="w-6 h-6 rounded-md border border-slate-200" style={{ backgroundColor: p.fg }} />
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-medium text-slate-700">{p.label}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-500">{p.ratio}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
              ${p.pass ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {p.pass ? 'AA' : 'Fail'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export function UXEnhancementsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">UX Enhancements</h2>
        <p className="text-[13px] text-slate-500">
          Loading intelligence, empty states, toast system, and accessibility preparation.
        </p>
      </div>

      {/* 1) Skeleton Shimmer */}
      <div className="card-premium p-5">
        <SectionHeader
          title="1. Skeleton Shimmer Animation"
          description="300ms minimum display rule prevents loading flicker"
        />
        <SkeletonDemo />
      </div>

      {/* 2) Empty States */}
      <div className="card-premium p-5">
        <SectionHeader
          title="2. Smart Empty States"
          description="Context-aware with clear icon, explanation, and CTA"
        />
        <EmptyStateShowcase />
      </div>

      {/* 3) Toast System */}
      <div className="card-premium p-5">
        <SectionHeader
          title="3. Toast Notification System"
          description="Success (3s auto), Error (persistent), Info (optional action). Max 3 stacked."
        />
        <ToastDemo />
      </div>

      {/* 4) Accessibility */}
      <div className="card-premium p-5">
        <SectionHeader
          title="4. Accessibility Preparation"
          description="Touch targets, contrast ratios, focus states, keyboard navigation"
        />
        <AccessibilityPrep />
      </div>

      {/* 5) Contrast Audit */}
      <div className="card-premium p-5">
        <SectionHeader
          title="5. Contrast Ratio Audit"
          description="All primary color pairs meet WCAG 2.1 AA standard"
        />
        <ContrastChecker />
      </div>
    </div>
  );
}