/**
 * DCF DEALER PERFORMANCE CARD — Premium Finance-Grade
 *
 * Shows each dealer's DCF pipeline health at a glance:
 *   - Name + code + onboarding status
 *   - Compact KPI bars (Leads / Approvals / Disbursals)
 *   - Onboarding progress as a mini-stepper ring
 *
 * Design: calm, confident, no clutter. Green only for ₹ amounts.
 */

import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { StatusChip } from '../premium/Chip';
import { useEffect, useState } from 'react';

// ── Types ──

export type OnboardingStep = 'form_filled' | 'docs_cibil' | 'inspection' | 'finance_approval' | 'onboarded';

export interface DCFDealerData {
  id: string;
  name: string;
  code: string;
  isOnboarded: boolean;
  onboardingStatus: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  dcfLeads: number;
  dcfLeadsTarget: number;
  approvals: number;
  approvalsTarget: number;
  disbursals: number;
  disbursalsTarget: number;
}

interface DCFDealerCardProps {
  dealer: DCFDealerData;
  onTap: () => void;
  onOverflow?: (e: React.MouseEvent) => void;
}

// ── Helpers ──

const STEP_MAP: Record<OnboardingStep, { number: number; label: string }> = {
  form_filled:       { number: 1, label: 'Form Filled' },
  docs_cibil:        { number: 2, label: 'Docs & CIBIL' },
  inspection:        { number: 3, label: 'Inspection' },
  finance_approval:  { number: 4, label: 'Finance Review' },
  onboarded:         { number: 5, label: 'Onboarded' },
};

function getStepInfo(step: OnboardingStep) {
  return STEP_MAP[step] ?? { number: 1, label: 'Unknown' };
}

// ── Animated Bar ──

function KpiBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string; // tailwind bg class
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] text-slate-400 font-medium tracking-wide">{label}</span>
        <span className="text-[12px] font-bold tabular-nums text-slate-700">
          {value}<span className="text-slate-300 font-medium">/{target}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-600 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ── Mini Stepper Ring ──

function StepperRing({ current, total }: { current: number; total: number }) {
  const pct = (current / total) * 100;
  const size = 36;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circumference - (pct / 100) * circumference);
    }, 120);
    return () => clearTimeout(t);
  }, [pct, circumference]);

  const isDone = current >= total;

  return (
    <div className="relative flex-shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-slate-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${isDone ? 'stroke-emerald-500' : 'stroke-indigo-400'} transition-all duration-600 ease-out`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold
        ${isDone ? 'text-emerald-600' : 'text-indigo-600'}
      `}>
        {current}/{total}
      </span>
    </div>
  );
}

// ── Component ──

export function DCFDealerCard({ dealer, onTap, onOverflow }: DCFDealerCardProps) {
  const stepInfo = getStepInfo(dealer.currentStep);
  const isNotOnboarded = !dealer.isOnboarded;

  return (
    <div
      onClick={onTap}
      className={`card-premium overflow-hidden cursor-pointer active:scale-[0.995] transition-all duration-200
        ${isNotOnboarded ? 'border-l-[3px] border-l-amber-300' : ''}
      `}
    >
      <div className="px-4 pt-4 pb-3">
        {/* Row 1: Name + Status + Overflow */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-slate-800 truncate">{dealer.name}</h3>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{dealer.code}</span>
          </div>

          <StatusChip
            label={dealer.isOnboarded ? 'Active' : dealer.onboardingStatus}
            variant={dealer.isOnboarded ? 'success' : 'warning'}
            dot
            size="sm"
          />

          {onOverflow && (
            <button
              onClick={(e) => { e.stopPropagation(); onOverflow(e); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 -mr-1"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Bars */}
      <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100/80">
        <div className="flex gap-4">
          <KpiBar
            label="Leads"
            value={dealer.isOnboarded ? dealer.dcfLeads : 0}
            target={dealer.dcfLeadsTarget}
            color="bg-indigo-400"
          />
          <KpiBar
            label="Approvals"
            value={dealer.isOnboarded ? dealer.approvals : 0}
            target={dealer.approvalsTarget}
            color="bg-sky-400"
          />
          <KpiBar
            label="Disbursals"
            value={dealer.isOnboarded ? dealer.disbursals : 0}
            target={dealer.disbursalsTarget}
            color="bg-emerald-400"
          />
        </div>
      </div>

      {/* Footer: Onboarding stepper */}
      <div className="px-4 py-2.5 flex items-center gap-3">
        <StepperRing current={stepInfo.number} total={5} />
        <div className="flex-1 min-w-0">
          <span className={`text-[11px] font-medium
            ${dealer.isOnboarded ? 'text-emerald-600' : 'text-slate-500'}
          `}>
            {dealer.isOnboarded ? 'Fully onboarded' : `Step ${stepInfo.number} of 5 — ${stepInfo.label}`}
          </span>
        </div>
      </div>
    </div>
  );
}
