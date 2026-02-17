/**
 * CALL FEEDBACK UNIFIED — Single Canonical Call Feedback Component
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  SYSTEM RULE                                            │
 * │                                                         │
 * │  This is a SHARED SYSTEM COMPONENT.                     │
 * │  All calls in SuperLeap CRM funnel into this form.      │
 * │  No screen may create its own call feedback variant.     │
 * │                                                         │
 * │  Sources that MUST use this component:                   │
 * │  - DealerDetail → Call (sheet mode)                      │
 * │  - Activity (V/C) → Call (page mode)                     │
 * │  - LeadDetail → Call (sheet mode, if applicable)         │
 * │                                                         │
 * │  Render modes:                                           │
 * │  - mode="page"   → full-screen page with back button    │
 * │  - mode="sheet"  → bottom-sheet overlay                  │
 * │  - promptMode    → lightweight "Add feedback?" banner    │
 * │                                                         │
 * │  Why enforce a single feedback form?                     │
 * │  1. Data integrity — identical fields = comparable data  │
 * │  2. Productivity accuracy — outcome + car-sell + DCF     │
 * │     fields drive productivity scoring equally            │
 * │  3. Incentive trust — TLs/Admins see consistent metrics  │
 * │  4. Audit trail — every call has the same data shape     │
 * │                                                         │
 * │  Field set (canonical):                                  │
 * │  A. Call Context — outcome (mandatory)                   │
 * │  B. Car Sell Discussion — toggle + outcome + leads est.  │
 * │  C. DCF Discussion — toggle + status + leads est.        │
 * │  D. Notes — free text                                    │
 * │  E. Next Actions — multi-select + follow-up date         │
 * │                                                         │
 * │  All conditional logic, validation rules, and option     │
 * │  values are defined HERE and nowhere else.               │
 * └─────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Phone, Clock, ChevronDown, CheckCircle2,
  AlertCircle, X, Calendar,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════
// CANONICAL TYPES — shared across all call feedback consumers
// ════════════════════════════════════════════════════════════

export type CallOutcome = 'Connected' | 'Not reachable' | 'Busy' | 'Call back requested';

export interface CallFeedbackData {
  callOutcome: CallOutcome;
  carSell: {
    discussed: boolean;
    outcome: string | null;
    expectedSellerLeads: number | null;
    expectedInventoryLeads: number | null;
  };
  dcf: {
    discussed: boolean;
    status: string | null;
    expectedDcfLeads: number | null;
  };
  notes: string;
  nextActions: string[];
  followUpDate: string | null;
  submittedAt: string;
}

// ════════════════════════════════════════════════════════════
// CANONICAL CONSTANTS — single source of truth for all options
// ════════════════════════════════════════════════════════════

const CALL_OUTCOMES: { key: CallOutcome; label: string; dotColor: string }[] = [
  { key: 'Connected', label: 'Connected', dotColor: 'bg-emerald-500' },
  { key: 'Not reachable', label: 'Not reachable', dotColor: 'bg-slate-400' },
  { key: 'Busy', label: 'Busy', dotColor: 'bg-amber-500' },
  { key: 'Call back requested', label: 'Callback requested', dotColor: 'bg-sky-500' },
];

const CAR_SELL_OUTCOMES = [
  'Dealer agreed to share leads',
  'Already sharing, no change',
  'Dealer hesitant',
  'Not interested',
];

const DCF_STATUSES = [
  'Already onboarded',
  'Interested',
  'Needs demo',
  'Not interested',
];

const NEXT_ACTION_OPTIONS = [
  'Follow-up call',
  'Schedule visit',
  'Share training material',
  'Schedule DCF demo',
];

// ════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════

interface CallFeedbackUnifiedProps {
  /** Render mode: full page or bottom-sheet overlay */
  mode: 'page' | 'sheet';
  /** Lightweight prompt mode (sheet only) — "Add feedback?" banner */
  promptMode?: boolean;

  // Call context (pre-filled, read-only)
  dealerName: string;
  dealerCode: string;
  dealerCity?: string;
  kamName?: string;
  phone?: string;
  callTime?: string;         // e.g. "2:35 PM"
  callDuration?: string;     // e.g. "3m 42s"
  callDurationSeconds?: number;

  // Navigation
  onSubmit: (feedback: CallFeedbackData) => void;
  onBack: () => void;
  /** Called when user explicitly skips feedback (sheet/prompt only) */
  onSkip?: () => void;
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function formatDurationFromSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

// Premium toggle switch
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-indigo-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════

export function CallFeedbackUnified({
  mode,
  promptMode = false,
  dealerName,
  dealerCode,
  dealerCity,
  kamName,
  phone,
  callTime,
  callDuration,
  callDurationSeconds,
  onSubmit,
  onBack,
  onSkip,
}: CallFeedbackUnifiedProps) {

  // ── Form state ──
  const [callOutcome, setCallOutcome] = useState<CallOutcome | null>(null);
  const [carSellDiscussed, setCarSellDiscussed] = useState(true);
  const [carSellOutcome, setCarSellOutcome] = useState('');
  const [expectedSellerLeads, setExpectedSellerLeads] = useState('');
  const [expectedInventoryLeads, setExpectedInventoryLeads] = useState('');
  const [dcfDiscussed, setDcfDiscussed] = useState(false);
  const [dcfStatus, setDcfStatus] = useState('');
  const [expectedDcfLeads, setExpectedDcfLeads] = useState('');
  const [notes, setNotes] = useState('');
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState('');

  const [expandedSection, setExpandedSection] = useState<string>('context');

  // Sheet animation
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (mode === 'sheet' || promptMode) {
      const t = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(t);
    }
  }, [mode, promptMode]);

  const displayDuration = callDuration || (callDurationSeconds ? formatDurationFromSeconds(callDurationSeconds) : 'N/A');
  const displayTime = callTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // ── Section toggle ──
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const toggleNextAction = (action: string) => {
    setNextActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  // ── Validation ──
  const isValid = () => {
    if (!callOutcome) return false;
    if (carSellDiscussed && !carSellOutcome) return false;
    if (dcfDiscussed && !dcfStatus) return false;
    if (nextActions.length > 0 && !followUpDate) return false;
    return true;
  };

  // ── Submit ──
  const handleSubmit = () => {
    if (!callOutcome) return;
    const feedback: CallFeedbackData = {
      callOutcome,
      carSell: {
        discussed: carSellDiscussed,
        outcome: carSellDiscussed ? carSellOutcome : null,
        expectedSellerLeads: expectedSellerLeads ? parseInt(expectedSellerLeads) : null,
        expectedInventoryLeads: expectedInventoryLeads ? parseInt(expectedInventoryLeads) : null,
      },
      dcf: {
        discussed: dcfDiscussed,
        status: dcfDiscussed ? dcfStatus : null,
        expectedDcfLeads: expectedDcfLeads ? parseInt(expectedDcfLeads) : null,
      },
      notes: notes.trim(),
      nextActions,
      followUpDate: nextActions.length > 0 ? followUpDate : null,
      submittedAt: new Date().toISOString(),
    };

    if (mode === 'sheet') {
      setIsVisible(false);
      setTimeout(() => onSubmit(feedback), 200);
    } else {
      onSubmit(feedback);
    }
  };

  const handleBack = () => {
    if (mode === 'sheet') {
      setIsVisible(false);
      setTimeout(() => onBack(), 200);
    } else {
      onBack();
    }
  };

  const handleSkip = () => {
    if (mode === 'sheet') {
      setIsVisible(false);
      setTimeout(() => (onSkip || onBack)(), 200);
    } else {
      (onSkip || onBack)();
    }
  };

  // ═══════════════════════════════════════════════════════════
  // PROMPT MODE (lightweight "Add feedback?" banner)
  // ═══════════════════════════════════════════════════════════

  if (promptMode && mode === 'sheet') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={handleSkip}
        />
        <div className={`relative w-full max-w-lg mx-4 mb-6 transition-all duration-200
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}>
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800">Add call feedback?</p>
                <p className="text-[11px] text-slate-400">
                  {dealerName} · {displayDuration !== 'N/A' ? displayDuration : 'Just ended'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl
                           hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Add feedback
              </button>
              <button
                onClick={handleSkip}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 text-[12px] font-semibold rounded-xl
                           hover:bg-slate-200 active:scale-95 transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SHARED FORM CONTENT — identical for page & sheet modes
  // ═══════════════════════════════════════════════════════════

  const formContent = (
    <>
      {/* ── Section A: Call Context + Outcome ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('context')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">A</span>
            <span className="text-[13px] font-semibold text-slate-800">Call Context</span>
          </div>
          <div className="flex items-center gap-2">
            {callOutcome && (
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {callOutcome}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'context' ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expandedSection === 'context' && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-4">
            {/* Read-only call info */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-2 mt-3">
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Dealer</span>
                <span className="text-slate-800 font-medium">{dealerName} ({dealerCode})</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Call time</span>
                <span className="text-slate-800 font-medium">{displayTime}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-500">Duration</span>
                <span className="text-slate-800 font-medium">{displayDuration}</span>
              </div>
              {kamName && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">KAM</span>
                  <span className="text-slate-800 font-medium">{kamName}</span>
                </div>
              )}
            </div>

            {/* Call Outcome — mandatory */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Call Outcome <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CALL_OUTCOMES.map((o) => {
                  const isActive = callOutcome === o.key;
                  return (
                    <button
                      key={o.key}
                      onClick={() => setCallOutcome(o.key)}
                      className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-[12px] font-medium
                        transition-all duration-150 active:scale-[0.97]
                        ${isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }
                      `}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : o.dotColor}`} />
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section B: Car Sell Discussion ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('carSell')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center text-[10px] font-bold text-emerald-600">B</span>
            <span className="text-[13px] font-semibold text-slate-800">Car Sell Discussion</span>
          </div>
          <div className="flex items-center gap-2">
            {carSellDiscussed && carSellOutcome && (
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                {carSellOutcome.split(' ').slice(0, 3).join(' ')}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'carSell' ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expandedSection === 'carSell' && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between mt-3">
              <label className="text-[12px] text-slate-700 font-medium">Car sell discussed?</label>
              <Toggle value={carSellDiscussed} onChange={setCarSellDiscussed} />
            </div>

            {carSellDiscussed && (
              <>
                {/* Outcome */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Outcome <span className="text-rose-400">*</span>
                  </label>
                  <div className="space-y-1.5">
                    {CAR_SELL_OUTCOMES.map(outcome => (
                      <label key={outcome} className={`flex items-center gap-2.5 px-3.5 py-2.5 border rounded-xl cursor-pointer transition-all
                        ${carSellOutcome === outcome
                          ? 'border-indigo-300 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                        <input
                          type="radio"
                          name="carSellOutcome"
                          value={outcome}
                          checked={carSellOutcome === outcome}
                          onChange={(e) => setCarSellOutcome(e.target.value)}
                          className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-[12px] text-slate-700">{outcome}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Expected leads */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Seller leads / week
                    </label>
                    <input
                      type="number"
                      value={expectedSellerLeads}
                      onChange={(e) => setExpectedSellerLeads(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800
                                 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Inventory leads / week
                    </label>
                    <input
                      type="number"
                      value={expectedInventoryLeads}
                      onChange={(e) => setExpectedInventoryLeads(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800
                                 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Section C: DCF Discussion ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('dcf')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-sky-50 flex items-center justify-center text-[10px] font-bold text-sky-600">C</span>
            <span className="text-[13px] font-semibold text-slate-800">DCF (Loan) Discussion</span>
          </div>
          <div className="flex items-center gap-2">
            {dcfDiscussed && dcfStatus && (
              <span className="text-[10px] font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                {dcfStatus}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'dcf' ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expandedSection === 'dcf' && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between mt-3">
              <label className="text-[12px] text-slate-700 font-medium">DCF discussed?</label>
              <Toggle value={dcfDiscussed} onChange={setDcfDiscussed} />
            </div>

            {dcfDiscussed && (
              <>
                {/* DCF Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    DCF Status <span className="text-rose-400">*</span>
                  </label>
                  <div className="space-y-1.5">
                    {DCF_STATUSES.map(status => (
                      <label key={status} className={`flex items-center gap-2.5 px-3.5 py-2.5 border rounded-xl cursor-pointer transition-all
                        ${dcfStatus === status
                          ? 'border-indigo-300 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                        <input
                          type="radio"
                          name="dcfStatus"
                          value={status}
                          checked={dcfStatus === status}
                          onChange={(e) => setDcfStatus(e.target.value)}
                          className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-[12px] text-slate-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Expected DCF leads */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Expected DCF leads / month
                  </label>
                  <input
                    type="number"
                    value={expectedDcfLeads}
                    onChange={(e) => setExpectedDcfLeads(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800
                               focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Section D: Notes ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('notes')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-600">D</span>
            <span className="text-[13px] font-semibold text-slate-800">Quick Notes</span>
          </div>
          <div className="flex items-center gap-2">
            {notes.trim() && (
              <span className="text-[10px] font-medium text-slate-500">{notes.trim().length} chars</span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'notes' ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expandedSection === 'notes' && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key discussion points, commitments, follow-ups..."
              className="w-full mt-3 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800
                         placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300
                         outline-none transition-all resize-none"
              rows={3}
            />
          </div>
        )}
      </div>

      {/* ── Section E: Next Actions ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('nextActions')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-rose-50 flex items-center justify-center text-[10px] font-bold text-rose-600">E</span>
            <span className="text-[13px] font-semibold text-slate-800">Next Actions</span>
          </div>
          <div className="flex items-center gap-2">
            {nextActions.length > 0 && (
              <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                {nextActions.length} selected
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedSection === 'nextActions' ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expandedSection === 'nextActions' && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-4">
            {/* Multi-select checkboxes */}
            <div className="space-y-1.5 mt-3">
              {NEXT_ACTION_OPTIONS.map(action => (
                <label key={action} className={`flex items-center gap-2.5 px-3.5 py-2.5 border rounded-xl cursor-pointer transition-all
                  ${nextActions.includes(action)
                    ? 'border-indigo-300 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <input
                    type="checkbox"
                    checked={nextActions.includes(action)}
                    onChange={() => toggleNextAction(action)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span className="text-[12px] text-slate-700">{action}</span>
                </label>
              ))}
            </div>

            {/* Follow-up date (required if actions selected) */}
            {nextActions.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Follow-up Date <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800
                               focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // FOOTER — shared submit area
  // ═══════════════════════════════════════════════════════════

  const footer = (
    <div className={`space-y-2 ${mode === 'sheet' ? 'px-5 py-4' : 'px-4 py-4'} bg-white border-t border-slate-100`}>
      {!isValid() && (
        <div className="flex items-center gap-1.5 justify-center pb-1">
          <AlertCircle className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-amber-600 font-medium">
            {!callOutcome ? 'Select call outcome to submit' :
             carSellDiscussed && !carSellOutcome ? 'Select car sell outcome' :
             dcfDiscussed && !dcfStatus ? 'Select DCF status' :
             nextActions.length > 0 && !followUpDate ? 'Set follow-up date' :
             'Complete all required fields'}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        {mode === 'sheet' && onSkip && (
          <button
            onClick={handleSkip}
            className="px-4 py-3 bg-slate-100 text-slate-600 text-[12px] font-semibold rounded-xl
                       hover:bg-slate-200 active:scale-95 transition-all"
          >
            Skip
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!isValid()}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold rounded-xl
                     active:scale-95 transition-all
            ${isValid()
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }
          `}
        >
          <CheckCircle2 className="w-4 h-4" />
          Submit Feedback
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE MODE — full screen with back button
  // ═══════════════════════════════════════════════════════════

  if (mode === 'page') {
    return (
      <div className="flex flex-col h-full bg-[#f7f8fa]">
        {/* Header */}
        <div className="glass-nav border-b border-slate-200/60 px-4 pt-3 pb-3 space-y-2">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[16px] font-bold text-slate-900">Call Feedback</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {dealerName} · {dealerCode}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          </div>

          {/* Call info strip */}
          <div className="flex items-center gap-3 px-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {phone || displayTime}
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {displayDuration}
            </span>
          </div>
        </div>

        {/* Feedback required banner */}
        <div className="mx-4 mt-3 px-3.5 py-2.5 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-[11px] text-amber-700 font-medium">
            Feedback required to complete this call
          </span>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {formContent}
        </div>

        {/* Footer */}
        {footer}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SHEET MODE — bottom-sheet overlay
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleBack}
      />

      {/* Sheet */}
      <div className={`relative w-full max-w-lg bg-white rounded-t-3xl shadow-xl transition-all duration-300 ease-out
        max-h-[92vh] overflow-hidden flex flex-col
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="px-5 pb-2 pt-1 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Call Feedback</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {dealerName} · {dealerCode}
              {dealerCity && ` · ${dealerCity}`}
            </p>
          </div>
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Call info strip */}
        <div className="mx-5 px-3.5 py-2.5 bg-slate-50 rounded-xl flex items-center gap-3 text-[11px] border border-slate-100 mb-2">
          <span className="flex items-center gap-1 text-slate-500">
            <Phone className="w-3 h-3" />
            {phone || 'Unknown'}
          </span>
          {displayDuration !== 'N/A' && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3" />
                {displayDuration}
              </span>
            </>
          )}
          <span className="ml-auto px-2 py-0.5 rounded-md text-[9px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
            Pending
          </span>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {formContent}
        </div>

        {/* Footer */}
        {footer}
      </div>
    </div>
  );
}
