/**
 * KAM DETAIL PAGE — TL Decision Dashboard
 *
 * Purpose: Answer "Should I escalate or appreciate this KAM?"
 *
 * Sections:
 *   1. Hero — Split Stock-in + DCF performance snapshot
 *   2. Incentive Impact — Slab status, I2SI band, TL payout impact
 *   3. Performance Gaps — Pipeline / Execution / DCF diagnostics
 *   4. Push Today — Auto-generated daily action items
 *
 * This is NOT a KAM self-service dashboard.
 * This is a TL coaching + incentive-driven decision screen.
 */

import { useState, useMemo } from 'react';
import {
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, AlertCircle,
  CheckCircle, Zap, Target, ChevronRight, Phone, MapPin, FileText,
  Rocket, ShieldAlert, ArrowUpRight, BarChart3, CircleDollarSign,
} from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { computeMetrics } from '../../lib/metrics/metricsFromDB';
import { getConfigI2SITarget, getConfigTargetsForUser } from '../../lib/configFromDB';
import { getSITarget, getDCFTargets } from '../../lib/metricsEngine';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';

// ── Types ──

interface KAMDetailPageProps {
  kamName: string;
  kamCity: string;
  onBack: () => void;
  onNavigateToSection?: (section: string, kamId: string) => void;
}

// ── LMTD Helpers ──

type MomentumDir = 'up' | 'down' | 'flat';

function lmtdDelta(current: number, lmtd: number): { direction: MomentumDir; label: string } {
  const diff = current - lmtd;
  const direction: MomentumDir = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat';
  return { direction, label: `${Math.abs(diff).toFixed(1)}` };
}

function lmtdPctDelta(current: number, lmtd: number): { direction: MomentumDir; label: string } {
  if (lmtd === 0) return { direction: 'flat', label: '—' };
  const diff = ((current - lmtd) / lmtd) * 100;
  const direction: MomentumDir = diff > 1 ? 'up' : diff < -1 ? 'down' : 'flat';
  return { direction, label: `${Math.abs(diff).toFixed(0)}%` };
}

function LmtdMarker({ direction, label }: { direction: MomentumDir; label: string }) {
  if (direction === 'flat') return null;
  const Arrow = direction === 'up' ? TrendingUp : TrendingDown;
  const color = direction === 'up' ? 'text-emerald-500' : 'text-rose-400';
  return (
    <span className="inline-flex items-center gap-0.5 text-slate-400">
      <Arrow className={`w-2.5 h-2.5 ${color}`} />
      <span className="text-[10px] tabular-nums">{direction === 'up' ? '+' : '-'}{label}</span>
      <span className="text-[9px] ml-0.5">LMTD</span>
    </span>
  );
}

// ── Real Data from Supabase ──

interface KAMLmtd {
  stockInsPct: number;
  i2si: number;
  inputScore: number;
  dcfDisbursalsPct: number;
  dcfGMV: number;
}

function getKAMData(period: TimePeriod) {
  const m = computeMetrics(period);

  const isDaily = period === TimePeriod.TODAY || period === TimePeriod.D_MINUS_1;
  const kamRoleTargets = getConfigTargetsForUser('');
  const monthlySITarget = getSITarget('KAM');
  const dcfMonthlyTargets = getDCFTargets('KAM');
  const WORKING_DAYS = 25;
  const stockInsTarget = isDaily ? Math.round(monthlySITarget / WORKING_DAYS) : monthlySITarget;
  const dcfTarget = isDaily ? Math.max(1, Math.round(dcfMonthlyTargets.disbursement / WORKING_DAYS)) : dcfMonthlyTargets.disbursement;
  const visitsTarget = isDaily ? kamRoleTargets.visitTarget : kamRoleTargets.visitTarget * WORKING_DAYS;
  const connectsTarget = isDaily ? kamRoleTargets.callTarget * 3 : kamRoleTargets.callTarget * 3 * WORKING_DAYS;
  const inputScoreTarget = kamRoleTargets.inputScoreGate;

  // Compute input score
  const inputScore = Math.round(
    (Math.min(m.completedVisits / 3, 1) * 30) +
    (Math.min(m.totalCalls / 5, 1) * 30) +
    (Math.min(m.uniqueDealersCalled / 3, 1) * 20) +
    (Math.min(m.conversionRate / 50, 1) * 20)
  );

  const dcfConversion = m.dcfTotal > 0 ? Math.round((m.dcfDisbursals / m.dcfTotal) * 100) : 0;
  const dcfOnboardingRatio = m.dcfTotal > 0 ? Math.round((m.dcfDisbursals / m.dcfTotal) * 100) : 0;
  const callFeedbackPct = m.callConnectRate;
  const dormantDealers = Math.max(0, m.totalDealers - m.uniqueDealersCalled);
  const cepPending = Math.max(0, m.openLeads - m.completedVisits);
  const cepConversionPct = m.totalLeads > 0 ? Math.round((m.wonLeads / m.totalLeads) * 100) : 0;

  return {
    stockIns: m.stockIns, stockInsTarget, i2si: m.i2si, i2siTarget: getConfigI2SITarget(),
    inputScore, inputScoreTarget,
    inspections: m.totalLeads, leads: m.totalLeads, sis: m.wonLeads,
    dcfDisbursals: m.dcfDisbursals, dcfTarget, dcfOnboardings: m.dcfOnboarded,
    dcfLeadsSubmitted: m.dcfTotal, dcfGMV: m.dcfDisbursedValue, dcfConversion,
    visits: m.completedVisits, visitsTarget, connects: m.connectedCalls, connectsTarget,
    callFeedbackPct, dealersVisited: m.uniqueDealersVisited, dormantDealers,
    cepPending, cepConversionPct, inspectionsBooked: m.scheduledVisits,
    dcfOnboardingRatio, dcfWeeklyAvgSubmissions: Math.max(1, Math.round(m.dcfTotal / 4)),
    attendance: m.completedVisits, attendanceTarget: visitsTarget,
  };
}

function getKAMLmtd(_period: TimePeriod): KAMLmtd {
  // Use last month data as LMTD comparison baseline
  const lastMonth = computeMetrics(TimePeriod.LAST_MONTH);
  const lastMonthSIPct = lastMonth.totalLeads > 0 ? Math.round((lastMonth.wonLeads / lastMonth.totalLeads) * 100) : 0;
  const lastMonthDCFPct = lastMonth.dcfTotal > 0 ? Math.round((lastMonth.dcfDisbursals / lastMonth.dcfTotal) * 100) : 0;
  const lastMonthScore = Math.round(
    (Math.min(lastMonth.completedVisits / 3, 1) * 30) +
    (Math.min(lastMonth.totalCalls / 5, 1) * 30) +
    (Math.min(lastMonth.uniqueDealersCalled / 3, 1) * 20) +
    (Math.min(lastMonth.conversionRate / 50, 1) * 20)
  );

  return {
    stockInsPct: lastMonthSIPct,
    i2si: lastMonth.i2si,
    inputScore: lastMonthScore,
    dcfDisbursalsPct: lastMonthDCFPct,
    dcfGMV: lastMonth.dcfDisbursedValue,
  };
}

// ── Helpers ──

type RAG = 'green' | 'amber' | 'red';

function rag(value: number, greenThreshold: number, amberThreshold: number): RAG {
  if (value >= greenThreshold) return 'green';
  if (value >= amberThreshold) return 'amber';
  return 'red';
}

const ragBg: Record<RAG, string> = {
  green: 'bg-emerald-50 border-emerald-100',
  amber: 'bg-amber-50 border-amber-100',
  red: 'bg-rose-50 border-rose-100',
};
const ragText: Record<RAG, string> = {
  green: 'text-emerald-700',
  amber: 'text-amber-700',
  red: 'text-rose-700',
};
const ragDot: Record<RAG, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
};
const ragTagBg: Record<RAG, string> = {
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-rose-100 text-rose-700',
};

function formatLakhs(n: number): string {
  if (n >= 100) return `\u20B9${(n / 100).toFixed(1)}Cr`;
  return `\u20B9${n.toFixed(1)}L`;
}

// ── Component ──

export function KAMDetailPage({ kamName, kamCity, onBack, onNavigateToSection }: KAMDetailPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const d = getKAMData(selectedPeriod);
  const lmtd = getKAMLmtd(selectedPeriod);

  // Computed
  const siAchievePct = Math.round((d.stockIns / d.stockInsTarget) * 100);
  const dcfAchievePct = d.dcfTarget > 0 ? Math.round((d.dcfDisbursals / d.dcfTarget) * 100) : 0;
  const siNeededFor95 = Math.max(0, Math.ceil(d.stockInsTarget * 0.95) - d.stockIns);
  const siNeededFor110 = Math.max(0, Math.ceil(d.stockInsTarget * 1.10) - d.stockIns);

  // LMTD deltas
  const siLmtd = lmtdPctDelta(siAchievePct, lmtd.stockInsPct);
  const i2siLmtd = lmtdDelta(d.i2si, lmtd.i2si);
  const scoreLmtd = lmtdDelta(d.inputScore, lmtd.inputScore);
  const dcfLmtd = lmtdPctDelta(dcfAchievePct, lmtd.dcfDisbursalsPct);
  const dcfGmvLmtd = lmtdPctDelta(d.dcfGMV, lmtd.dcfGMV);

  // Overall momentum direction
  const positiveMomentum = [siLmtd, i2siLmtd, dcfLmtd].filter(m => m.direction === 'up').length;
  const negativeMomentum = [siLmtd, i2siLmtd, dcfLmtd].filter(m => m.direction === 'down').length;
  const overallMomentum: MomentumDir = positiveMomentum > negativeMomentum ? 'up' : negativeMomentum > positiveMomentum ? 'down' : 'flat';

  // SI progress bar color
  const siBarColor = siAchievePct >= 110 ? 'bg-indigo-500' : siAchievePct >= 95 ? 'bg-emerald-500' : 'bg-amber-500';
  const siBarBg = siAchievePct >= 110 ? 'bg-indigo-100' : siAchievePct >= 95 ? 'bg-emerald-100' : 'bg-amber-100';

  // DCF progress bar color
  const dcfBarColor = dcfAchievePct >= 70 ? 'bg-emerald-500' : dcfAchievePct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  const dcfBarBg = dcfAchievePct >= 70 ? 'bg-emerald-100' : dcfAchievePct >= 50 ? 'bg-amber-100' : 'bg-rose-100';

  // Overall KAM status for header
  const kamStatus: RAG = siAchievePct >= 95 && d.inputScore >= 85 ? 'green'
    : siAchievePct >= 80 && d.inputScore >= 70 ? 'amber'
      : 'red';
  const kamStatusLabel = kamStatus === 'green' ? 'On Track' : kamStatus === 'amber' ? 'Needs Attention' : 'Critical';

  // Incentive slab
  const slabStatus = siAchievePct >= 110
    ? { icon: Rocket, label: 'On track for 110% slab', sublabel: `${siNeededFor110 === 0 ? 'Already unlocked' : `${siNeededFor110} more SI to lock`}`, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' }
    : siAchievePct >= 95
      ? { icon: CheckCircle, label: 'Eligible for 95% slab', sublabel: `${siNeededFor110} more SI to unlock 110% slab`, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' }
      : { icon: AlertTriangle, label: `Needs ${siNeededFor95} more stock-ins for 95% slab`, sublabel: `Currently at ${siAchievePct}% achievement`, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' };

  // I2SI slab
  const i2siSlab = d.i2si >= 15
    ? { label: '15% slab unlocked', color: 'text-indigo-700', bg: 'bg-indigo-100 text-indigo-700' }
    : d.i2si >= 12
      ? { label: '12% slab active', color: 'text-emerald-700', bg: 'bg-emerald-100 text-emerald-700' }
      : { label: 'Below incentive band', color: 'text-rose-700', bg: 'bg-rose-100 text-rose-700' };

  // ── Performance Gaps ──
  const pipelineGaps = useMemo(() => [
    {
      label: 'CEP Conversion',
      value: `${d.cepConversionPct}%`,
      status: rag(d.cepConversionPct, 70, 55),
      detail: d.cepConversionPct < 70 ? 'Low CEP capture rate' : 'Healthy',
    },
    {
      label: 'CEP Pending Leads',
      value: `${d.cepPending}`,
      status: rag(100 - d.cepPending * 10, 70, 40) as RAG, // more pending = worse
      detail: d.cepPending > 3 ? `${d.cepPending} leads need CEP` : 'Under control',
    },
    {
      label: 'Inspections Booked',
      value: `${d.inspectionsBooked}`,
      status: rag(d.inspectionsBooked, 12, 6),
      detail: d.inspectionsBooked < 10 ? 'Low inspection pipeline' : 'Good pipeline',
    },
  ], [d]);

  const executionGaps = useMemo(() => [
    {
      label: 'Call Feedback %',
      value: `${d.callFeedbackPct}%`,
      status: rag(d.callFeedbackPct, 80, 60),
      detail: d.callFeedbackPct < 80 ? 'Low feedback completion' : 'On track',
    },
    {
      label: 'Visit Frequency',
      value: `${d.visits}/${d.visitsTarget}`,
      status: rag((d.visits / d.visitsTarget) * 100, 90, 70),
      detail: d.visits < d.visitsTarget ? 'Below visit target' : 'Meeting target',
    },
    {
      label: 'Dormant Dealers (>7d)',
      value: `${d.dormantDealers}`,
      status: rag(100 - d.dormantDealers * 10, 70, 40) as RAG,
      detail: d.dormantDealers > 5 ? `${d.dormantDealers} dealers no contact` : 'Manageable',
    },
  ], [d]);

  const dcfGaps = useMemo(() => [
    {
      label: 'DCF Onboarding Ratio',
      value: `${d.dcfOnboardingRatio}%`,
      status: rag(d.dcfOnboardingRatio, 50, 30),
      detail: d.dcfOnboardingRatio < 50 ? 'Low onboarding' : 'Active',
    },
    {
      label: 'DCF Leads Submitted',
      value: `${d.dcfLeadsSubmitted}`,
      status: rag(d.dcfLeadsSubmitted, 30, 15),
      detail: d.dcfLeadsSubmitted < d.dcfWeeklyAvgSubmissions * 4 ? 'Below monthly average' : 'On pace',
    },
    {
      label: 'DCF GMV',
      value: formatLakhs(d.dcfGMV),
      status: rag(d.dcfGMV, 40, 20),
      detail: d.dcfGMV < 30 ? 'Low GMV contribution' : 'Strong contribution',
    },
  ], [d]);

  // ── Push Today items ──
  const pushItems = useMemo(() => {
    const items: { icon: any; label: string; cta: string; action: string; urgency: RAG }[] = [];
    if (d.cepPending > 0) items.push({ icon: AlertCircle, label: `${d.cepPending} leads CEP pending`, cta: 'Review leads', action: 'leads', urgency: 'red' });
    if (d.dormantDealers > 2) items.push({ icon: Phone, label: `${d.dormantDealers} dealers not contacted >5 days`, cta: 'Call dealers', action: 'dealers', urgency: 'amber' });
    if (d.dcfLeadsSubmitted < d.dcfWeeklyAvgSubmissions * 4) items.push({ icon: CircleDollarSign, label: 'DCF submissions below monthly average', cta: 'Push DCF', action: 'dcf', urgency: 'amber' });
    if (d.callFeedbackPct < 75) items.push({ icon: FileText, label: `Call feedback at ${d.callFeedbackPct}% — needs improvement`, cta: 'Review calls', action: 'activity', urgency: 'amber' });
    if (items.length === 0) items.push({ icon: CheckCircle, label: 'No urgent actions — KAM is executing well', cta: 'View details', action: 'leads', urgency: 'green' });
    return items;
  }, [d]);

  // ── KAM status tag for header ──
  const StatusIcon = kamStatus === 'green' ? CheckCircle : kamStatus === 'amber' ? AlertTriangle : AlertCircle;

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">

      {/* ═══ HEADER ═══ */}
      <div className="glass-nav border-b border-slate-200/60">
        {/* Hero gradient band */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 px-4 pt-4 pb-5">
          {/* Back + Name row */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white/90" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-bold text-white tracking-tight truncate">{kamName}</h1>
              <p className="text-[12px] text-indigo-200 mt-0.5">{kamCity} &middot; KAM Performance</p>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold
              ${kamStatus === 'green' ? 'bg-emerald-500/20 text-emerald-200' : kamStatus === 'amber' ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}
            `}>
              <StatusIcon className="w-3 h-3" />
              {kamStatusLabel}
            </div>
          </div>

          {/* Period switcher */}
          <TimeFilterControl
            mode="chips"
            chipStyle="pill"
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={CANONICAL_TIME_OPTIONS}
            labelOverrides={CANONICAL_TIME_LABELS}
            allowCustom
            customFrom={customFrom}
            customTo={customTo}
            onCustomRangeChange={({ fromISO, toISO }) => {
              setCustomFrom(fromISO);
              setCustomTo(toISO);
            }}
          />
        </div>
      </div>

      {/* ═══ SCROLLABLE BODY ═══ */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-6 space-y-4">

          {/* ══════════════════════════════════════════ */}
          {/* 1️⃣ HERO — SPLIT PERFORMANCE SNAPSHOT      */}
          {/* ══════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-3">

            {/* LEFT: Stock-in Performance */}
            <div className="card-premium p-4 space-y-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Stock-ins</span>
              </div>

              {/* Big number */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-extrabold text-slate-900 tabular-nums leading-none">{d.stockIns}</span>
                  <span className="text-[14px] font-medium text-slate-400">/ {d.stockInsTarget}</span>
                </div>
                <div className={`text-[12px] font-bold mt-1 tabular-nums ${siAchievePct >= 95 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                  {siAchievePct}% achieved
                </div>
              </div>

              {/* Progress bar */}
              <div className={`w-full h-2 rounded-full ${siBarBg}`}>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${siBarColor}`}
                  style={{ width: `${Math.min(siAchievePct, 100)}%` }}
                />
              </div>
              {/* LMTD momentum marker */}
              <div className="pt-0.5">
                <LmtdMarker direction={siLmtd.direction} label={siLmtd.label} />
              </div>

              {/* Sub-metrics */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">I2SI%</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[12px] font-bold tabular-nums ${d.i2si >= d.i2siTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {d.i2si}%
                      <span className="text-[10px] font-medium text-slate-400 ml-1">/ {d.i2siTarget}%</span>
                    </span>
                  </div>
                </div>
                {/* I2SI LMTD */}
                <div className="flex justify-end -mt-0.5">
                  <LmtdMarker direction={i2siLmtd.direction} label={i2siLmtd.label + '%'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Input Score</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[12px] font-bold tabular-nums ${d.inputScore >= d.inputScoreTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {d.inputScore}
                      <span className="text-[10px] font-medium text-slate-400 ml-1">/ {d.inputScoreTarget}</span>
                    </span>
                  </div>
                </div>
                {/* Score LMTD */}
                <div className="flex justify-end -mt-0.5">
                  <LmtdMarker direction={scoreLmtd.direction} label={scoreLmtd.label} />
                </div>
              </div>
            </div>

            {/* RIGHT: DCF Performance */}
            <div className="card-premium p-4 space-y-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CircleDollarSign className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">DCF</span>
              </div>

              {/* Big number */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-extrabold text-slate-900 tabular-nums leading-none">{d.dcfDisbursals}</span>
                  <span className="text-[14px] font-medium text-slate-400">/ {d.dcfTarget}</span>
                </div>
                <div className={`text-[12px] font-bold mt-1 tabular-nums ${dcfAchievePct >= 70 ? 'text-emerald-600' : dcfAchievePct >= 50 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                  {dcfAchievePct}% achieved
                </div>
              </div>

              {/* Progress bar */}
              <div className={`w-full h-2 rounded-full ${dcfBarBg}`}>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${dcfBarColor}`}
                  style={{ width: `${Math.min(dcfAchievePct, 100)}%` }}
                />
              </div>
              {/* LMTD momentum marker */}
              <div className="pt-0.5">
                <LmtdMarker direction={dcfLmtd.direction} label={dcfLmtd.label} />
              </div>

              {/* Sub-metrics */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Onboardings</span>
                  <span className="text-[12px] font-bold tabular-nums text-slate-700">{d.dcfOnboardings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Leads Sub.</span>
                  <span className="text-[12px] font-bold tabular-nums text-slate-700">{d.dcfLeadsSubmitted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">GMV</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] font-bold tabular-nums text-slate-700">{formatLakhs(d.dcfGMV)}</span>
                  </div>
                </div>
                {/* GMV LMTD */}
                <div className="flex justify-end -mt-0.5">
                  <LmtdMarker direction={dcfGmvLmtd.direction} label={dcfGmvLmtd.label} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Conversion</span>
                  <span className={`text-[12px] font-bold tabular-nums ${d.dcfConversion >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {d.dcfConversion}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MOMENTUM INSIGHT — micro line between hero and incentive */}
          {overallMomentum !== 'flat' && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${overallMomentum === 'up' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'
              }`}>
              {overallMomentum === 'up'
                ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                : <TrendingDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              }
              <span className={`text-[11px] font-medium ${overallMomentum === 'up' ? 'text-emerald-700' : 'text-rose-700'}`}>
                Momentum: {overallMomentum === 'up' ? 'Improving vs last month' : 'Slipping vs last month'}
              </span>
            </div>
          )}

          {/* ══════════════════════════════════════════ */}
          {/* 2️⃣ INCENTIVE IMPACT                       */}
          {/* ══════════════════════════════════════════ */}
          <div className="card-premium p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-[14px] font-bold text-slate-900">Incentive Impact</h2>
            </div>

            {/* Slab status */}
            <div className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border ${slabStatus.bg}`}>
              <slabStatus.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${slabStatus.color}`} />
              <div className="min-w-0">
                <div className={`text-[13px] font-semibold ${slabStatus.color}`}>{slabStatus.label}</div>
                <div className={`text-[11px] mt-0.5 ${slabStatus.color} opacity-80`}>{slabStatus.sublabel}</div>
              </div>
            </div>

            {/* I2SI slab + Score gate row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">I2SI Slab</div>
                <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-lg ${i2siSlab.bg}`}>
                  {i2siSlab.label}
                </span>
                <div className="text-[11px] text-slate-500 mt-1.5">Current: {d.i2si}%</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Score Gate</div>
                <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-lg ${d.inputScore >= 70 ? 'bg-emerald-100 text-emerald-700' : d.inputScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                  {d.inputScore >= 70 ? 'Full Payout' : d.inputScore >= 50 ? 'Half Payout' : 'Zero Payout'}
                </span>
                <div className="text-[11px] text-slate-500 mt-1.5">Score: {d.inputScore}</div>
              </div>
            </div>

            {/* TL impact note */}
            <div className="flex items-start gap-2 px-3 py-2 bg-indigo-50/60 rounded-lg border border-indigo-100">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                {siAchievePct >= 95
                  ? `This KAM is contributing to your 95%+ slab. ${d.i2si >= 15 ? 'I2SI at 15% — maximum per-SI rate.' : d.i2si >= 12 ? 'I2SI at 12% band — push for 15% to increase per-SI rate.' : 'I2SI below 12% — reducing your per-SI rate.'}`
                  : `This KAM is ${siNeededFor95} SIs short of your 95% slab threshold. Coaching priority.`
                }
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* 3️⃣ PERFORMANCE GAPS — DIAGNOSTICS          */}
          {/* ══════════════════════════════════════════ */}
          <div className="card-premium p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <h2 className="text-[14px] font-bold text-slate-900">Performance Gaps</h2>
            </div>

            {/* A) Pipeline Weakness */}
            <GapBucket
              title="Pipeline"
              icon={TrendingUp}
              iconColor="text-violet-600"
              iconBg="bg-violet-50"
              items={pipelineGaps}
            />

            {/* B) Execution Weakness */}
            <GapBucket
              title="Execution"
              icon={MapPin}
              iconColor="text-sky-600"
              iconBg="bg-sky-50"
              items={executionGaps}
            />

            {/* C) DCF Weakness */}
            <GapBucket
              title="DCF"
              icon={CircleDollarSign}
              iconColor="text-rose-600"
              iconBg="bg-rose-50"
              items={dcfGaps}
            />
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* 4️⃣ PUSH TODAY — DAILY ACTIONS               */}
          {/* ══════════════════════════════════════════ */}
          <div className="card-premium p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-[14px] font-bold text-slate-900">Push Today</h2>
            </div>

            <div className="space-y-2">
              {pushItems.map((item, idx) => {
                const IIcon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onNavigateToSection?.(item.action, kamName)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-100 bg-white
                               hover:border-slate-200 hover:bg-slate-50 active:scale-[0.99] transition-all text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ragBg[item.urgency]}`}>
                      <IIcon className={`w-4 h-4 ${ragText[item.urgency]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-slate-700 leading-snug">{item.label}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`text-[11px] font-semibold ${ragText[item.urgency]}`}>{item.cta}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${ragText[item.urgency]} opacity-60 group-hover:translate-x-0.5 transition-transform`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

interface GapItem {
  label: string;
  value: string;
  status: RAG;
  detail: string;
}

function GapBucket({ title, icon: Icon, iconColor, iconBg, items }: {
  title: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  items: GapItem[];
}) {
  // Count reds
  const redCount = items.filter(i => i.status === 'red').length;
  const amberCount = items.filter(i => i.status === 'amber').length;
  const worstStatus: RAG = redCount > 0 ? 'red' : amberCount > 0 ? 'amber' : 'green';

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-3 h-3 ${iconColor}`} />
        </div>
        <span className="text-[12px] font-semibold text-slate-600">{title}</span>
        {worstStatus !== 'green' && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ragTagBg[worstStatus]}`}>
            {redCount > 0 ? `${redCount} red` : `${amberCount} amber`}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50/80"
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ragDot[item.status]}`} />
            <span className="text-[11px] text-slate-600 flex-1 min-w-0 truncate">{item.label}</span>
            <span className={`text-[12px] font-bold tabular-nums ${ragText[item.status]}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}