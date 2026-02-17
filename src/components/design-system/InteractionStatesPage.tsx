/**
 * SUPERLEAP INTERACTION STATES - Phase 5
 * Button states (Primary, Secondary, Danger), Loading patterns, Disabled rules.
 */

import { useState, useRef, useEffect } from 'react';
import { Loader2, Trash2, Check, ArrowRight, AlertTriangle, Download, Send, Plus } from 'lucide-react';

/* ── Helpers ── */
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
      <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

function StateLabel({ label, active }: { label: string; active?: boolean }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
      {label}
    </span>
  );
}

/* ── Primary Button Demo ── */
function PrimaryButtonDemo() {
  const [state, setState] = useState<'default' | 'hover' | 'active' | 'loading' | 'disabled' | 'success'>('default');
  const [loadingText, setLoadingText] = useState('Saving...');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const widthRef = useRef<number>(0);

  useEffect(() => {
    if (buttonRef.current && state === 'default') {
      widthRef.current = buttonRef.current.offsetWidth;
    }
  }, [state]);

  const triggerLoading = () => {
    setState('loading');
    setLoadingText('Saving...');
    setTimeout(() => {
      setState('success');
      setTimeout(() => setState('default'), 1200);
    }, 2000);
  };

  const baseClasses = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold transition-all duration-120 min-h-[44px] min-w-[140px]';

  const stateStyles: Record<string, string> = {
    default: 'bg-indigo-600 text-white shadow-sm shadow-indigo-200',
    hover: 'bg-indigo-700 text-white shadow-md shadow-indigo-200',
    active: 'bg-indigo-800 text-white shadow-sm shadow-indigo-300 scale-[0.98]',
    loading: 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 cursor-wait',
    disabled: 'bg-slate-200 text-slate-400 cursor-not-allowed',
    success: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200',
  };

  return (
    <div className="space-y-4">
      {/* State switcher */}
      <div className="flex flex-wrap gap-1.5">
        {(['default', 'hover', 'active', 'loading', 'disabled', 'success'] as const).map(s => (
          <button
            key={s}
            onClick={() => s === 'loading' ? triggerLoading() : setState(s)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all
              ${state === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Live preview */}
      <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-center border border-slate-100">
        <button
          ref={buttonRef}
          className={`${baseClasses} ${stateStyles[state]}`}
          disabled={state === 'disabled' || state === 'loading'}
          style={widthRef.current ? { minWidth: widthRef.current } : undefined}
        >
          {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {state === 'success' && <Check className="w-4 h-4" />}
          {state === 'loading' ? loadingText : state === 'success' ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Spec */}
      <div className="p-3 bg-indigo-50 rounded-xl text-[11px] text-indigo-700 space-y-1">
        <div><strong>Loading:</strong> Replace label with spinner + text. Maintain button width (no layout shift).</div>
        <div><strong>Focus:</strong> 2px indigo-500 ring with 2px offset (keyboard only).</div>
        <div><strong>Min touch target:</strong> 44px height.</div>
      </div>
    </div>
  );
}

/* ── Secondary Button Demo ── */
function SecondaryButtonDemo() {
  const [state, setState] = useState<'default' | 'hover' | 'active' | 'loading' | 'disabled'>('default');

  const stateStyles: Record<string, string> = {
    default: 'bg-white text-slate-700 border border-slate-200',
    hover: 'bg-slate-50 text-slate-800 border border-slate-300',
    active: 'bg-slate-100 text-slate-900 border border-slate-300 scale-[0.98]',
    loading: 'bg-white text-slate-500 border border-slate-200 cursor-wait',
    disabled: 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed',
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(['default', 'hover', 'active', 'loading', 'disabled'] as const).map(s => (
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
        <button
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-medium transition-all duration-120 min-h-[44px] min-w-[140px] ${stateStyles[state]}`}
          disabled={state === 'disabled' || state === 'loading'}
        >
          {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          <Download className="w-4 h-4" />
          {state === 'loading' ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600">
        <strong>Secondary:</strong> Outline variant with subtle hover background tint. Never competes with Primary for attention.
      </div>
    </div>
  );
}

/* ── Danger Button Demo ── */
function DangerButtonDemo() {
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle');

  const handleClick = () => {
    if (phase === 'idle') {
      setPhase('confirm');
    } else if (phase === 'confirm') {
      setPhase('loading');
      setTimeout(() => {
        setPhase('done');
        setTimeout(() => setPhase('idle'), 1500);
      }, 1500);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <StateLabel label="Idle" active={phase === 'idle'} />
        <span className="text-slate-300">{'\u2192'}</span>
        <StateLabel label="Confirm" active={phase === 'confirm'} />
        <span className="text-slate-300">{'\u2192'}</span>
        <StateLabel label="Deleting" active={phase === 'loading'} />
        <span className="text-slate-300">{'\u2192'}</span>
        <StateLabel label="Done" active={phase === 'done'} />
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-center border border-slate-100 gap-3">
        {phase === 'idle' && (
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-medium
                       bg-white text-slate-700 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200
                       transition-all duration-120 min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" /> Delete Dealer
          </button>
        )}
        {phase === 'confirm' && (
          <div className="flex items-center gap-2 sl-animate-chip">
            <button
              onClick={handleClick}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold
                         bg-rose-600 text-white shadow-sm shadow-rose-200 hover:bg-rose-700
                         transition-all duration-120 min-h-[44px]"
            >
              <AlertTriangle className="w-4 h-4" /> Confirm Delete
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="px-4 py-3 rounded-xl text-[13px] font-medium bg-white text-slate-600 border border-slate-200
                         hover:bg-slate-50 transition-all duration-120 min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        )}
        {phase === 'loading' && (
          <button
            disabled
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold
                       bg-rose-600 text-white shadow-sm cursor-wait min-h-[44px] min-w-[160px]"
          >
            <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
          </button>
        )}
        {phase === 'done' && (
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold
                          bg-emerald-600 text-white min-h-[44px] sl-animate-chip">
            <Check className="w-4 h-4" /> Deleted
          </div>
        )}
      </div>

      <div className="p-3 bg-rose-50 rounded-xl text-[11px] text-rose-700 border border-rose-100">
        <strong>Danger pattern:</strong> Red tone only after confirmation. Initial state uses neutral styling with rose hover hint.
        Two-step confirm prevents accidental destructive actions.
      </div>
    </div>
  );
}

/* ── Button Size & Icon Variants ── */
function ButtonVariantsGrid() {
  return (
    <div className="space-y-4">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Size Variants</div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 text-white min-h-[32px]">
          Small
        </button>
        <button className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-indigo-600 text-white min-h-[40px]">
          Medium
        </button>
        <button className="px-6 py-3 rounded-xl text-[14px] font-semibold bg-indigo-600 text-white min-h-[48px]">
          Large
        </button>
      </div>

      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-4">Icon + Text</div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-indigo-600 text-white min-h-[44px]">
          <Plus className="w-4 h-4" /> Create Lead
        </button>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-white text-slate-700 border border-slate-200 min-h-[44px]">
          <Send className="w-4 h-4" /> Send Report
        </button>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium bg-indigo-50 text-indigo-700 min-h-[44px]">
          Details <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-4">Icon Only</div>
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-xl bg-white text-slate-600 border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
          <Download className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ── Focus Ring Demo ── */
function FocusRingDemo() {
  return (
    <div className="space-y-3">
      <p className="text-[12px] text-slate-500">Tab through these buttons to see focus ring behavior:</p>
      <div className="flex flex-wrap items-center gap-3">
        <button className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-indigo-600 text-white min-h-[44px]
                           focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none">
          Primary Focus
        </button>
        <button className="px-5 py-2.5 rounded-xl text-[13px] font-medium bg-white text-slate-700 border border-slate-200 min-h-[44px]
                           focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none">
          Secondary Focus
        </button>
        <button className="px-5 py-2.5 rounded-xl text-[13px] font-medium bg-rose-600 text-white min-h-[44px]
                           focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 outline-none">
          Danger Focus
        </button>
      </div>
      <div className="p-3 bg-sky-50 rounded-xl text-[11px] text-sky-700 border border-sky-100">
        <strong>Accessibility:</strong> Focus ring uses <code>focus-visible</code> (keyboard only, no mouse click ring).
        2px ring with 2px offset. Color-matched to button variant.
      </div>
    </div>
  );
}

/* ── Main Page ── */
export function InteractionStatesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">Interaction States</h2>
        <p className="text-[13px] text-slate-500">
          Button state machines, loading patterns, and interaction feedback. Every state is intentional.
        </p>
      </div>

      {/* 1) Primary Button */}
      <div className="card-premium p-5">
        <SectionHeader
          title="1. Primary Button States"
          description="Click each state or trigger the loading flow to preview"
        />
        <PrimaryButtonDemo />
      </div>

      {/* 2) Secondary Button */}
      <div className="card-premium p-5">
        <SectionHeader
          title="2. Secondary Button States"
          description="Outline variant with subtle hover tint"
        />
        <SecondaryButtonDemo />
      </div>

      {/* 3) Danger Button */}
      <div className="card-premium p-5">
        <SectionHeader
          title="3. Danger Button (Two-Step Confirm)"
          description="Red tone only when destructive action is confirmed"
        />
        <DangerButtonDemo />
      </div>

      {/* 4) Button Variants */}
      <div className="card-premium p-5">
        <SectionHeader
          title="4. Button Sizes & Icon Variants"
          description="Small (32px), Medium (40px), Large (48px) with icon combinations"
        />
        <ButtonVariantsGrid />
      </div>

      {/* 5) Focus Rings */}
      <div className="card-premium p-5">
        <SectionHeader
          title="5. Focus Ring & Keyboard Navigation"
          description="Tab through buttons to preview focus-visible rings"
        />
        <FocusRingDemo />
      </div>
    </div>
  );
}
