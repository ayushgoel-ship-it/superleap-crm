/**
 * SUPERLEAP MOTION SYSTEM - Phase 5
 * Interactive documentation of motion principles, durations, easing, and transition patterns.
 */

import { useState, useCallback } from 'react';
import { Play, RotateCcw, Zap, Wind, ArrowDown } from 'lucide-react';

/* ── Helpers ── */
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
      <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

function TokenRow({ label, token, value }: { label: string; token: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div>
        <div className="text-[13px] font-medium text-slate-700">{label}</div>
        <code className="text-[10px] text-indigo-500 font-mono">{token}</code>
      </div>
      <span className="text-[12px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{value}</span>
    </div>
  );
}

/* ── Live Animation Playground ── */
function AnimationPlayground() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const replay = useCallback((demo: string) => {
    setActiveDemo(null);
    // Force remount
    setTimeout(() => {
      setActiveDemo(demo);
      setKey(k => k + 1);
    }, 30);
  }, []);

  const demos = [
    { id: 'modal', label: 'Modal Enter', css: 'sl-animate-modal-enter', desc: 'Fade + Y(8px), 180ms ease-out' },
    { id: 'dropdown', label: 'Dropdown', css: 'sl-animate-dropdown', desc: 'Fade + Y(6px), 140ms ease-out' },
    { id: 'card', label: 'Card Scale', css: 'sl-animate-card-in', desc: 'Scale 0.98 \u2192 1, 120ms ease-out' },
    { id: 'chip', label: 'Chip Fade', css: 'sl-animate-chip', desc: 'Opacity + scale, 120ms ease-out' },
    { id: 'page', label: 'Page Enter', css: 'sl-animate-page', desc: 'Fade + Y(4px), 220ms ease-out' },
    { id: 'shake', label: 'Shake', css: 'sl-animate-shake', desc: 'Error feedback, 400ms ease' },
  ];

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {demos.map(d => (
          <button
            key={d.id}
            onClick={() => replay(d.id)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-120
              ${activeDemo === d.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
          >
            <Play className="w-3 h-3 inline mr-1" />
            {d.label}
          </button>
        ))}
      </div>

      {/* Preview area */}
      <div className="bg-slate-50 rounded-2xl p-6 min-h-[140px] flex items-center justify-center border border-slate-100 relative overflow-hidden">
        {!activeDemo && (
          <p className="text-[12px] text-slate-400">Click a button above to preview the animation</p>
        )}
        {activeDemo && (() => {
          const demo = demos.find(d => d.id === activeDemo)!;
          return (
            <div key={key} className="text-center">
              <div className={`bg-white rounded-2xl shadow-lg p-6 mx-auto max-w-[200px] ${demo.css}`}>
                <div className="text-[14px] font-semibold text-slate-800 mb-1">{demo.label}</div>
                <div className="text-[11px] text-slate-400">{demo.desc}</div>
              </div>
              <button
                onClick={() => replay(activeDemo)}
                className="mt-3 text-[11px] text-indigo-600 font-medium flex items-center gap-1 mx-auto hover:text-indigo-800"
              >
                <RotateCcw className="w-3 h-3" /> Replay
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* ── Duration Comparison Visual ── */
function DurationVisual() {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const durations = [
    { label: 'Micro', ms: 120, token: '--sl-duration-micro', color: 'bg-emerald-500' },
    { label: 'Dropdown', ms: 140, token: '--sl-duration-dropdown', color: 'bg-sky-500' },
    { label: 'Modal', ms: 180, token: '--sl-duration-modal', color: 'bg-indigo-500' },
    { label: 'Page', ms: 220, token: '--sl-duration-page', color: 'bg-violet-500' },
    { label: 'Min Display', ms: 300, token: '--sl-duration-min-display', color: 'bg-amber-500' },
  ];

  const maxMs = 300;

  const runAll = () => {
    setRunning(true);
    setCompleted(new Set());
    durations.forEach(d => {
      setTimeout(() => {
        setCompleted(prev => new Set([...prev, d.label]));
      }, d.ms);
    });
    setTimeout(() => setRunning(false), maxMs + 100);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={runAll}
          disabled={running}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all
            ${running ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          <Zap className="w-3 h-3 inline mr-1" />
          {running ? 'Running...' : 'Race Durations'}
        </button>
        {!running && completed.size > 0 && (
          <span className="text-[11px] text-slate-400">All complete!</span>
        )}
      </div>

      <div className="space-y-2">
        {durations.map(d => {
          const widthPct = (d.ms / maxMs) * 100;
          const done = completed.has(d.label);
          return (
            <div key={d.label} className="flex items-center gap-3">
              <div className="w-20 text-[11px] text-slate-600 font-medium text-right">{d.label}</div>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all ${d.color} ${running && !done ? 'opacity-50' : ''}`}
                  style={{
                    width: `${widthPct}%`,
                    transition: running ? `width ${d.ms}ms ease-out` : 'none',
                  }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                  {d.ms}ms
                </span>
              </div>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-colors duration-150
                ${done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                {done ? '\u2713' : '\u00B7'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ���─ Easing Comparison ── */
function EasingComparison() {
  const [animate, setAnimate] = useState(false);
  const [key, setKey] = useState(0);

  const triggerAnimate = () => {
    setAnimate(false);
    setTimeout(() => {
      setAnimate(true);
      setKey(k => k + 1);
    }, 30);
  };

  const easings = [
    { label: 'ease-out (enter)', value: 'cubic-bezier(0, 0, 0.2, 1)', token: '--sl-ease-enter' },
    { label: 'ease-in (exit)', value: 'cubic-bezier(0.4, 0, 1, 1)', token: '--sl-ease-exit' },
    { label: 'ease-in-out (standard)', value: 'cubic-bezier(0.4, 0, 0.2, 1)', token: '--sl-ease-standard' },
  ];

  return (
    <div className="space-y-3">
      <button
        onClick={triggerAnimate}
        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
      >
        <Wind className="w-3 h-3 inline mr-1" /> Compare Easings
      </button>

      <div className="space-y-3" key={key}>
        {easings.map(e => (
          <div key={e.label} className="flex items-center gap-3">
            <div className="w-32 text-right">
              <div className="text-[11px] font-medium text-slate-700">{e.label}</div>
              <code className="text-[9px] text-indigo-400 font-mono">{e.token}</code>
            </div>
            <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative border border-slate-100">
              <div
                className="absolute top-1 bottom-1 w-8 bg-indigo-500 rounded-md"
                style={{
                  left: animate ? 'calc(100% - 36px)' : '4px',
                  transition: animate ? `left 600ms ${e.value}` : 'none',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export function MotionSystemPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">SuperLeap Motion System</h2>
        <p className="text-[13px] text-slate-500">
          Phase 5 motion language. Professional, confident, fast. No bounce, no overshoot, no spring physics.
        </p>
      </div>

      {/* 1) Motion Personality */}
      <div className="card-premium p-5">
        <SectionHeader
          title="1. Motion Personality"
          description="Four principles that define every animation in SuperLeap"
        />
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '\u{1F3AF}', label: 'Professional', desc: 'Clean, purposeful movements' },
            { icon: '\u{1F4AA}', label: 'Confident', desc: 'Direct transitions, no hesitation' },
            { icon: '\u26A1', label: 'Fast', desc: 'Sub-250ms for all UI transitions' },
            { icon: '\u{1F6AB}', label: 'No Play', desc: 'No bounce, no dramatic overshoot' },
          ].map(p => (
            <div key={p.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-[18px] mb-1">{p.icon}</div>
              <div className="text-[12px] font-semibold text-slate-800">{p.label}</div>
              <div className="text-[11px] text-slate-500">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2) Duration Rules */}
      <div className="card-premium p-5">
        <SectionHeader
          title="2. Duration Scale"
          description="Canonical duration tokens with live comparison"
        />

        <div className="mb-6">
          <TokenRow label="Micro interaction" token="--sl-duration-micro" value="120ms" />
          <TokenRow label="Dropdown expand" token="--sl-duration-dropdown" value="140ms" />
          <TokenRow label="Modal open/close" token="--sl-duration-modal" value="180ms" />
          <TokenRow label="Page transition" token="--sl-duration-page" value="220ms" />
          <TokenRow label="Min display (anti-flicker)" token="--sl-duration-min-display" value="300ms" />
        </div>

        <DurationVisual />
      </div>

      {/* 3) Easing */}
      <div className="card-premium p-5">
        <SectionHeader
          title="3. Easing Functions"
          description="Standard CSS easing curves. No spring physics."
        />

        <div className="mb-4">
          <TokenRow label="Entrance (ease-out)" token="--sl-ease-enter" value="cubic-bezier(0,0,0.2,1)" />
          <TokenRow label="Exit (ease-in)" token="--sl-ease-exit" value="cubic-bezier(0.4,0,1,1)" />
          <TokenRow label="Standard (ease-in-out)" token="--sl-ease-standard" value="cubic-bezier(0.4,0,0.2,1)" />
        </div>

        <EasingComparison />

        <div className="mt-4 p-3 bg-amber-50 rounded-xl text-[12px] text-amber-800 border border-amber-100">
          <strong>Rule:</strong> Use ease-out for entrances, ease-in for exits. Standard for inline transitions like hover states.
        </div>
      </div>

      {/* 4) Transition Patterns */}
      <div className="card-premium p-5">
        <SectionHeader
          title="4. Transition Pattern Library"
          description="Click each pattern to see a live preview"
        />
        <AnimationPlayground />

        <div className="mt-5 space-y-2">
          <div className="flex items-start gap-2 text-[12px] text-slate-600">
            <ArrowDown className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span><strong>Modals:</strong> Fade + translateY(8px), 180ms ease-out</span>
          </div>
          <div className="flex items-start gap-2 text-[12px] text-slate-600">
            <ArrowDown className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span><strong>Cards:</strong> scale(0.98) {'\u2192'} scale(1), 120ms ease-out</span>
          </div>
          <div className="flex items-start gap-2 text-[12px] text-slate-600">
            <ArrowDown className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span><strong>Chips/Filters:</strong> Opacity + subtle scale, 120ms ease-out</span>
          </div>
          <div className="flex items-start gap-2 text-[12px] text-slate-600">
            <ArrowDown className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span><strong>Dropdowns:</strong> Fade + translateY(6px), 140ms ease-out</span>
          </div>
          <div className="flex items-start gap-2 text-[12px] text-slate-600">
            <ArrowDown className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span><strong>Page transitions:</strong> Fade + translateY(4px), 220ms ease-out</span>
          </div>
        </div>
      </div>

      {/* 5) Motion Offsets */}
      <div className="card-premium p-5">
        <SectionHeader
          title="5. Offset & Scale Tokens"
          description="Consistent offset distances used across all animated components"
        />
        <TokenRow label="Modal Y offset" token="--sl-offset-modal" value="8px" />
        <TokenRow label="Dropdown Y offset" token="--sl-offset-dropdown" value="6px" />
        <TokenRow label="Card press scale" token="--sl-scale-card-press" value="0.98" />
      </div>

      {/* 6) Reduced Motion */}
      <div className="card-premium p-5">
        <SectionHeader
          title="6. Reduced Motion"
          description="All animations respect prefers-reduced-motion: reduce"
        />
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap">{`@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}`}</pre>
        </div>
        <div className="mt-3 p-3 bg-indigo-50 rounded-xl text-[12px] text-indigo-700">
          SuperLeap{'\u2019'}s motion system automatically degrades when the user prefers reduced motion. No component-level opt-outs needed.
        </div>
      </div>
    </div>
  );
}