/**
 * CEP MODAL — Customer Expected Price Intelligence Capture
 *
 * Premium bottom sheet for capturing/editing CEP with pricing alignment.
 *
 * Triggers:
 *   - "Add CEP" CTA (LeadDetailPageV2 or sticky footer)
 *   - "Edit CEP" CTA (when CEP already captured)
 *   - Auto-open after CallFeedbackUnified save when CEP missing
 *
 * Fields:
 *   1. Customer Expected Price (INR, numeric, auto-formatted)
 *   2. Confidence Level (dropdown)
 *   3. Notes (optional)
 *
 * Auto-shows:
 *   - Internal C24 Quote comparison
 *   - Difference badge (green = margin cushion, red = negative margin)
 *
 * On Save:
 *   - Updates lead.cep, lead.cepConfidence, lead.cepNotes
 *   - Recomputes pricing alignment
 *   - Closes modal
 */

import { useState, useEffect, useRef } from 'react';
import {
  X, IndianRupee, ChevronDown, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Info, Minus,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// ── Types ──

export interface CEPData {
  cep: number;
  confidence: CEPConfidence;
  notes: string;
}

export type CEPConfidence = 'confirmed' | 'estimated' | 'dealer_told' | 'approximate';

interface CEPModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CEPData) => void;
  /** Pre-fill for edit mode */
  initialCep?: number | null;
  initialConfidence?: CEPConfidence;
  initialNotes?: string;
  /** C24 internal quote for gap analysis */
  c24Quote?: number | null;
  /** Lead channel for context */
  channel?: 'C2B' | 'C2D' | 'GS';
  /** Vehicle info for header */
  vehicleInfo?: string;
}

// ── Helpers ──

const CONFIDENCE_OPTIONS: { value: CEPConfidence; label: string; icon: string }[] = [
  { value: 'confirmed', label: 'Confirmed by customer', icon: 'check' },
  { value: 'estimated', label: 'Estimated', icon: 'calc' },
  { value: 'dealer_told', label: 'Dealer told', icon: 'user' },
  { value: 'approximate', label: 'Approximate', icon: 'approx' },
];

function formatINR(value: number): string {
  if (value >= 100000) return `\u20B9${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `\u20B9${(value / 1000).toFixed(1)}K`;
  return `\u20B9${value.toLocaleString('en-IN')}`;
}

function formatInputINR(raw: string): string {
  const num = raw.replace(/[^0-9]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('en-IN');
}

function parseINR(formatted: string): number {
  return Number(formatted.replace(/[^0-9]/g, '')) || 0;
}

// ── Component ──

export function CEPModal({
  open,
  onClose,
  onSave,
  initialCep,
  initialConfidence = 'estimated',
  initialNotes = '',
  c24Quote,
  channel = 'C2B',
  vehicleInfo,
}: CEPModalProps) {
  const [cepInput, setCepInput] = useState('');
  const [confidence, setConfidence] = useState<CEPConfidence>(initialConfidence);
  const [notes, setNotes] = useState(initialNotes);
  const [showConfidenceDropdown, setShowConfidenceDropdown] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEdit = !!initialCep;

  // Initialize on open
  useEffect(() => {
    if (open) {
      setCepInput(initialCep ? Number(initialCep).toLocaleString('en-IN') : '');
      setConfidence(initialConfidence);
      setNotes(initialNotes);
      setShowConfidenceDropdown(false);
      // Animate in
      requestAnimationFrame(() => setAnimateIn(true));
      // Auto-focus after animation
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      setAnimateIn(false);
    }
  }, [open, initialCep, initialConfidence, initialNotes]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowConfidenceDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!open) return null;

  const cepValue = parseINR(cepInput);
  const hasGap = cepValue > 0 && c24Quote && c24Quote > 0;
  const gap = hasGap ? cepValue - c24Quote : null;
  const gapPct = hasGap ? ((gap!) / c24Quote) * 100 : null;

  // Gap analysis color/label
  const gapColor = gap === null
    ? 'neutral'
    : gap > 0
      ? 'red'    // CEP > Quote = customer expects more = risk
      : gap < 0
        ? 'green' // CEP < Quote = margin cushion
        : 'neutral';

  const isValid = cepValue >= 10000; // Minimum sanity check

  const handleSave = () => {
    if (!isValid) {
      toast.error('Please enter a valid price (min \u20B910,000)');
      return;
    }
    onSave({
      cep: cepValue,
      confidence,
      notes: notes.trim(),
    });
    toast.success(isEdit ? 'CEP updated successfully' : 'CEP captured successfully');
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCepInput(raw ? Number(raw).toLocaleString('en-IN') : '');
  };

  const selectedConfidence = CONFIDENCE_OPTIONS.find(c => c.value === confidence)!;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          animateIn ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              {isEdit ? 'Edit CEP' : 'Add Customer Expected Price'}
            </h2>
            {vehicleInfo && (
              <p className="text-[11px] text-slate-500 mt-0.5">{vehicleInfo}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 space-y-4 pb-4 max-h-[60vh] overflow-y-auto">
          {/* Field 1: CEP Amount */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">
              Customer Expected Price
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                <IndianRupee className="w-4 h-4 text-slate-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={cepInput}
                onChange={handleInputChange}
                placeholder="e.g. 3,50,000"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-semibold text-slate-900
                           placeholder:text-slate-400 placeholder:font-normal
                           focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all min-h-[48px]"
              />
              {cepValue > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium">
                  {formatINR(cepValue)}
                </div>
              )}
            </div>
          </div>

          {/* Field 2: Confidence Level */}
          <div ref={dropdownRef} className="relative">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">
              Confidence Level
            </label>
            <button
              onClick={() => setShowConfidenceDropdown(!showConfidenceDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl
                         text-[13px] text-slate-800 hover:border-slate-300 transition-all min-h-[48px]"
            >
              <span className="font-medium">{selectedConfidence.label}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showConfidenceDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showConfidenceDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {CONFIDENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setConfidence(opt.value);
                      setShowConfidenceDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-[13px] transition-colors min-h-[44px] ${
                      confidence === opt.value
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Field 3: Notes */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context about the price discussion..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800
                         placeholder:text-slate-400 resize-none
                         focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          {/* Pricing Alignment Panel (auto-shows when both CEP and C24 Quote exist) */}
          {hasGap && (
            <div className={`rounded-xl p-3.5 border ${
              gapColor === 'red' ? 'bg-rose-50/50 border-rose-200' :
              gapColor === 'green' ? 'bg-emerald-50/50 border-emerald-200' :
              'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-2.5">
                {gapColor === 'red' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                {gapColor === 'green' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {gapColor === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  gapColor === 'red' ? 'text-rose-600' :
                  gapColor === 'green' ? 'text-emerald-600' :
                  'text-slate-500'
                }`}>
                  Pricing Alignment
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 font-medium">C24 Quote</div>
                  <div className="text-[14px] font-bold text-slate-800">{formatINR(c24Quote!)}</div>
                </div>
                <div className="flex flex-col items-center">
                  {gap! > 0 ? (
                    <TrendingUp className="w-4 h-4 text-rose-500" />
                  ) : gap! < 0 ? (
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-slate-400" />
                  )}
                  <div className={`text-[12px] font-bold mt-0.5 ${
                    gapColor === 'red' ? 'text-rose-600' :
                    gapColor === 'green' ? 'text-emerald-600' :
                    'text-slate-500'
                  }`}>
                    {gap! > 0 ? '+' : ''}{formatINR(Math.abs(gap!))}
                  </div>
                  <div className={`text-[10px] font-medium ${
                    gapColor === 'red' ? 'text-rose-500' : gapColor === 'green' ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                    {gapPct !== null ? `${gapPct > 0 ? '+' : ''}${gapPct.toFixed(1)}%` : ''}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-[10px] text-slate-500 font-medium">CEP</div>
                  <div className="text-[14px] font-bold text-slate-800">{formatINR(cepValue)}</div>
                </div>
              </div>

              {/* Contextual warning */}
              <div className={`mt-2.5 text-[10px] leading-relaxed px-2 py-1.5 rounded-lg ${
                gapColor === 'red'
                  ? 'bg-rose-100/60 text-rose-700'
                  : gapColor === 'green'
                    ? 'bg-emerald-100/60 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
              }`}>
                {gapColor === 'red' && (
                  <>Customer expects <strong>{formatINR(Math.abs(gap!))}</strong> above C24 quote. Negotiate or escalate pricing.</>
                )}
                {gapColor === 'green' && (
                  <>Margin cushion of <strong>{formatINR(Math.abs(gap!))}</strong>. Strong conversion potential.</>
                )}
                {gapColor === 'neutral' && (
                  <>Price aligned. Proceed with standard flow.</>
                )}
              </div>
            </div>
          )}

          {/* Info hint when no C24 Quote */}
          {!c24Quote && cepValue > 0 && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl">
              <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-700 leading-relaxed">
                C24 Quote not available yet. Pricing alignment will auto-compute once the quote is generated.
              </p>
            </div>
          )}
        </div>

        {/* Sticky Save CTA */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`w-full py-3.5 rounded-xl text-[14px] font-bold transition-all min-h-[48px] active:scale-[0.98] ${
              isValid
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-200/50 hover:shadow-xl'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isEdit ? 'Update CEP' : 'Save CEP'}
          </button>
        </div>
      </div>
    </div>
  );
}