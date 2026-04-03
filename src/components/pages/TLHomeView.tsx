/**
 * TL HOME VIEW — Team Lead Operations Cockpit
 *
 * Structure (top → bottom):
 *   1. Time filter chips
 *   2. TEAM SUMMARY BLOCK — unified gradient hero (SI left + DCF right)
 *      with LMTD momentum markers (secondary layer)
 *   3. 🎯 Incentive View command button (opens drawer)
 *   4. Productivity Snapshot — compact horizontal card + Momentum Risk
 *   5. KAM drilldown cards (Who Needs Help)
 *   6. Incentive Drawer (bottom sheet with slab + boosters + gates)
 *
 * Performance Intelligence Model:
 *   Level 1 → Target Progress (Primary, dominant)
 *   Level 2 → LMTD Momentum (Secondary, subtle, <12px)
 *   LMTD must NEVER overpower targets.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Users, ChevronRight, CheckCircle, AlertCircle,
  AlertTriangle, Target, Banknote, Zap, ArrowUpRight,
  BarChart3, Info, ChevronDown, ChevronUp, X,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { FilterChip } from '../premium/Chip';
import { TimePeriod } from '../../lib/domain/constants';
import { computeTLOverview, computeKAMMetrics, computeMetrics } from '../../lib/metrics/metricsFromDB';

// ── Types ──

/** @deprecated Phase 3 — now alias for TimePeriod. Kept for getTLData lookup compatibility. */
type TLPeriod = TimePeriod;

type KAMStatus = 'On Track' | 'Needs Attention' | 'Critical';

interface KAMData {
  name: string;
  city: string;
  inputScore: number;
  sis: number;
  sisTarget: number;
  i2si: number;
  i2siTarget: number;
  stockIns: number;
  stockInsTarget: number;
  dcfDisbursals: number;
  dcfGMV: number;
  lmtdSIPct: number; // LMTD SI achievement % for momentum comparison
}

interface TLOverview {
  teamStockIns: number;
  teamStockInsTarget: number;
  teamI2SI: number;
  teamI2SITarget: number;
  teamAvgInputScore: number;
  dcfOnboardings: number;
  dcfGMV: number;
  dcfGMVTarget: number;
}

interface TLLmtd {
  teamStockInsPct: number;
  teamI2SI: number;
  teamAvgInputScore: number;
  dcfGMV: number;
  dcfOnboardings: number;
}

interface TLIncentiveData {
  currentAchievementPercent: number;
  currentI2SI: number;
  projectedPayout: number;
  scoreGate: 'full' | 'half' | 'zero';
  avgTeamScore: number;
  dcfOnboardingBonus: number;
  dcfGMVBonus: number;
  i2siBonus: number;
}

interface TLHomeViewProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  onKAMClick?: (kamName: string, kamCity: string) => void;
}

// ── LMTD Helpers ──

type MomentumDir = 'up' | 'down' | 'flat';

function lmtdDelta(current: number, lmtd: number): { direction: MomentumDir; label: string; raw: number } {
  const diff = current - lmtd;
  const direction: MomentumDir = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat';
  return { direction, label: `${Math.abs(diff).toFixed(1)}`, raw: diff };
}

function lmtdPctDelta(current: number, lmtd: number): { direction: MomentumDir; label: string; raw: number } {
  if (lmtd === 0) return { direction: 'flat', label: '—', raw: 0 };
  const diff = ((current - lmtd) / lmtd) * 100;
  const direction: MomentumDir = diff > 1 ? 'up' : diff < -1 ? 'down' : 'flat';
  return { direction, label: `${Math.abs(diff).toFixed(0)}%`, raw: diff };
}

/** Micro LMTD delta marker — renders inline, never larger than 10px text */
function LmtdMarker({ direction, label, variant = 'dark' }: { direction: MomentumDir; label: string; variant?: 'dark' | 'light' }) {
  if (direction === 'flat') return null;
  const Arrow = direction === 'up' ? TrendingUp : TrendingDown;
  const color = variant === 'dark'
    ? direction === 'up' ? 'text-emerald-500' : 'text-rose-400'
    : direction === 'up' ? 'text-emerald-300/80' : 'text-rose-300/80';
  const textColor = variant === 'dark' ? 'text-slate-400' : 'text-indigo-200/60';
  return (
    <span className={`inline-flex items-center gap-0.5 ${textColor}`}>
      <Arrow className={`w-2.5 h-2.5 ${color}`} />
      <span className="text-[10px] tabular-nums">{direction === 'up' ? '+' : '-'}{label}</span>
      <span className="text-[9px] ml-0.5">LMTD</span>
    </span>
  );
}

// ── Real Data by Period ──

function getTLData(period: TLPeriod): {
  overview: TLOverview;
  kamData: KAMData[];
  incentive: TLIncentiveData;
  lmtd: TLLmtd;
} {
  const i2siTarget = 15;
  const tlOverview = computeTLOverview(period);
  const totalMetrics = computeMetrics(period);

  // Map KAM metrics into the KAMData shape expected by the view
  const kamData: KAMData[] = tlOverview.kamMetrics.map(km => {
    const siTarget = 20; // per-KAM target
    return {
      name: km.kamName,
      city: 'NCR',
      inputScore: km.inputScore,
      sis: km.wonLeads,
      sisTarget: siTarget,
      i2si: km.i2si,
      i2siTarget: i2siTarget,
      stockIns: km.stockIns,
      stockInsTarget: siTarget,
      dcfDisbursals: km.dcfDisbursals,
      dcfGMV: km.dcfDisbursedValue,
      lmtdSIPct: 80, // baseline LMTD comparison
    };
  });

  const siTarget = 100;
  const overview: TLOverview = {
    teamStockIns: tlOverview.teamStockIns,
    teamStockInsTarget: siTarget,
    teamI2SI: totalMetrics.i2si,
    teamI2SITarget: i2siTarget,
    teamAvgInputScore: tlOverview.teamAvgInputScore,
    dcfOnboardings: totalMetrics.dcfTotal,
    dcfGMV: totalMetrics.dcfDisbursedValue,
    dcfGMVTarget: 50,
  };

  // LMTD: compute from last month for comparison
  const lastMonthMetrics = computeMetrics(TimePeriod.LAST_MONTH);
  const lmtd: TLLmtd = {
    teamStockInsPct: lastMonthMetrics.totalLeads > 0 ? Math.round((lastMonthMetrics.wonLeads / lastMonthMetrics.totalLeads) * 100) : 0,
    teamI2SI: lastMonthMetrics.i2si,
    teamAvgInputScore: 70,
    dcfGMV: lastMonthMetrics.dcfDisbursedValue,
    dcfOnboardings: lastMonthMetrics.dcfTotal,
  };

  // Incentive calculation from real data
  const achievePct = siTarget > 0 ? Math.round((overview.teamStockIns / siTarget) * 100) : 0;
  const scoreGate: 'full' | 'half' | 'zero' = overview.teamAvgInputScore >= 70 ? 'full' : overview.teamAvgInputScore >= 50 ? 'half' : 'zero';
  const basePayout = achievePct >= 95 ? (achievePct >= 110 ? 250 : achievePct >= 100 ? 200 : 150) : 0;
  const projectedPayout = basePayout * overview.teamStockIns * (scoreGate === 'full' ? 1 : scoreGate === 'half' ? 0.5 : 0);

  const incentive: TLIncentiveData = {
    currentAchievementPercent: achievePct,
    currentI2SI: overview.teamI2SI,
    projectedPayout,
    scoreGate,
    avgTeamScore: overview.teamAvgInputScore,
    dcfOnboardingBonus: overview.dcfOnboardings * 100,
    dcfGMVBonus: Math.round(overview.dcfGMV * 30),
    i2siBonus: overview.teamI2SI >= 15 ? 5000 : 0,
  };

  return { overview, kamData, incentive, lmtd };
}

// ── Helpers ──

function getKAMStatus(kam: KAMData): KAMStatus {
  const siAchieve = (kam.stockIns / kam.stockInsTarget) * 100;
  if (kam.inputScore < 50 || siAchieve < 60 || kam.i2si < kam.i2siTarget * 0.65) return 'Critical';
  if (kam.inputScore < 70 || siAchieve < 80 || kam.i2si < kam.i2siTarget) return 'Needs Attention';
  return 'On Track';
}

const statusConfig = {
  'On Track': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle, iconColor: 'text-emerald-500' },
  'Needs Attention': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: AlertTriangle, iconColor: 'text-amber-500' },
  'Critical': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: AlertCircle, iconColor: 'text-rose-500' },
};

function formatLakhs(n: number): string {
  if (n >= 100) return `\u20B9${(n / 100).toFixed(1)}Cr`;
  return `\u20B9${n.toFixed(1)}L`;
}

// ── Incentive Slab Data ──

const SLABS = [
  { achieveLabel: '<95%', i2si12: 0, i2si15: 0 },
  { achieveLabel: '95%', i2si12: 100, i2si15: 150 },
  { achieveLabel: '100%', i2si12: 150, i2si15: 200 },
  { achieveLabel: '110%', i2si12: 200, i2si15: 250 },
];

function getActiveSlab(achievePct: number, i2si: number): { row: number; col: number } | null {
  let row = 0;
  if (achievePct >= 110) row = 3;
  else if (achievePct >= 100) row = 2;
  else if (achievePct >= 95) row = 1;
  else row = 0;
  const col = i2si >= 15 ? 2 : 1;
  return { row, col };
}

// ── Component ──

export function TLHomeView({ selectedPeriod, onPeriodChange, onKAMClick }: TLHomeViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [expandedProductivity, setExpandedProductivity] = useState(false);
  const [showIncentiveDrawer, setShowIncentiveDrawer] = useState(false);
  const [momentumExpanded, setMomentumExpanded] = useState(false);

  const { overview, kamData, incentive, lmtd } = getTLData(timePeriod);

  // Computed insights (ALL LOGIC PRESERVED)
  const kamsBelowI2SI = kamData.filter(k => k.i2si < k.i2siTarget).length;
  const kamsBelowScore70 = kamData.filter(k => k.inputScore < 70).length;
  const kamsAtRiskIncentive = kamData.filter(k => k.inputScore < 50).length;
  const kamsMeetingSI = kamData.filter(k => k.stockIns >= k.stockInsTarget).length;
  const kamsMeetingSIPct = Math.round((kamsMeetingSI / kamData.length) * 100);
  const kamsContributingDCF = kamData.filter(k => k.dcfDisbursals > 0).length;
  const kamsContributingDCFPct = Math.round((kamsContributingDCF / kamData.length) * 100);
  const avgDCFPerKAM = (overview.dcfOnboardings / kamData.length).toFixed(1);

  const siAchievePct = Math.round((overview.teamStockIns / overview.teamStockInsTarget) * 100);
  const siIsOnTrack = siAchievePct >= 90;
  const i2siIsOnTrack = overview.teamI2SI >= overview.teamI2SITarget;

  const activeSlab = getActiveSlab(incentive.currentAchievementPercent, incentive.currentI2SI);

  const kamsBelowSIPace = kamData.filter(k => (k.stockIns / k.stockInsTarget) < 0.8).length;
  const kamsZeroDCF = kamData.filter(k => k.dcfDisbursals === 0).length;

  // LMTD deltas (secondary momentum layer)
  const siLmtd = lmtdPctDelta(siAchievePct, lmtd.teamStockInsPct);
  const i2siLmtd = lmtdDelta(overview.teamI2SI, lmtd.teamI2SI);
  const scoreLmtd = lmtdDelta(overview.teamAvgInputScore, lmtd.teamAvgInputScore);
  const dcfGmvLmtd = lmtdPctDelta(overview.dcfGMV, lmtd.dcfGMV);
  const dcfOnbLmtd = lmtdDelta(overview.dcfOnboardings, lmtd.dcfOnboardings);

  // Momentum Risk: KAMs where target < 90% AND LMTD trend negative
  const momentumRiskKams = kamData.filter(k => {
    const currentPct = Math.round((k.stockIns / k.stockInsTarget) * 100);
    return currentPct < 90 && currentPct < k.lmtdSIPct;
  }).map(k => {
    const currentPct = Math.round((k.stockIns / k.stockInsTarget) * 100);
    return { name: k.name, delta: currentPct - k.lmtdSIPct };
  });

  // Sort KAMs: Critical first, then Needs Attention, then On Track
  const sortedKAMs = [...kamData].sort((a, b) => {
    const order: Record<KAMStatus, number> = { 'Critical': 0, 'Needs Attention': 1, 'On Track': 2 };
    return order[getKAMStatus(a)] - order[getKAMStatus(b)];
  });

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `\u20B9${(n / 1000).toFixed(1)}K`;
    return `\u20B9${Math.round(n).toLocaleString('en-IN')}`;
  };

  const criticalCount = kamData.filter(k => getKAMStatus(k) === 'Critical').length;

  return (
    <div className="animate-fade-in">

      {/* ═══ Period Chips ═══ */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {([
            { key: TimePeriod.D_MINUS_1, label: 'D-1' },
            { key: TimePeriod.LAST_7D, label: 'L7D' },
            { key: TimePeriod.LAST_MONTH, label: 'Last Month' },
            { key: TimePeriod.MTD, label: 'MTD' },
          ]).map(({ key, label }) => (
            <FilterChip
              key={key}
              label={label}
              active={timePeriod === key}
              onClick={() => setTimePeriod(key)}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           1️⃣ TEAM SUMMARY BLOCK — Unified Premium Gradient
              L1: Target vs Achievement (dominant)
              L2: LMTD Momentum (subtle, below bars)
         ══════════════════════════════════════════════════ */}
      <div className="mx-4 mt-2 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-4 pb-5 shadow-lg shadow-indigo-200/40">

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-white/90" />
          </div>
          <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
            Team Summary ({timePeriod})
          </span>
        </div>

        {/* Split: SI (left) | DCF (right) */}
        <div className="flex gap-3">

          {/* LEFT — Stock-in Summary */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-indigo-200/80 uppercase tracking-wider mb-2">Stock-ins</div>

            {/* Big number */}
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-[32px] font-extrabold text-white leading-none tabular-nums">{overview.teamStockIns}</span>
              <span className="text-[14px] font-medium text-indigo-200/80">/ {overview.teamStockInsTarget}</span>
            </div>

            {/* Achievement badge */}
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold mb-2
              ${siIsOnTrack ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}
            `}>
              {siIsOnTrack ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {siAchievePct}%
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${siIsOnTrack ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(siAchievePct, 100)}%` }}
              />
            </div>
            {/* L2: LMTD marker */}
            <div className="mb-3">
              <LmtdMarker direction={siLmtd.direction} label={siLmtd.label} variant="light" />
            </div>

            {/* Sub-metrics */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-200/70">I2SI %</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[12px] font-bold tabular-nums ${i2siIsOnTrack ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {overview.teamI2SI}%
                  </span>
                  <LmtdMarker direction={i2siLmtd.direction} label={i2siLmtd.label + '%'} variant="light" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-200/70">Avg Score</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[12px] font-bold tabular-nums ${overview.teamAvgInputScore >= 70 ? 'text-white' : 'text-amber-300'}`}>
                    {overview.teamAvgInputScore}
                  </span>
                  <LmtdMarker direction={scoreLmtd.direction} label={scoreLmtd.label} variant="light" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-200/70">KAMs at SI</span>
                <span className={`text-[12px] font-bold tabular-nums ${kamsMeetingSIPct >= 80 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {kamsMeetingSI}/{kamData.length}
                </span>
              </div>
            </div>
          </div>

          {/* Vertical separator */}
          <div className="w-px bg-white/15 self-stretch mx-1" />

          {/* RIGHT — DCF Summary */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-indigo-200/80 uppercase tracking-wider mb-2">DCF</div>

            {/* Primary: Onboardings */}
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-[32px] font-extrabold text-white leading-none tabular-nums">{overview.dcfOnboardings}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] text-indigo-200/70">Onboardings</span>
              <LmtdMarker direction={dcfOnbLmtd.direction} label={dcfOnbLmtd.label} variant="light" />
            </div>

            {/* GMV with target */}
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[20px] font-bold text-white leading-none tabular-nums">{formatLakhs(overview.dcfGMV)}</span>
              <span className="text-[10px] text-indigo-200/60">/ {formatLakhs(overview.dcfGMVTarget)}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] text-indigo-200/70">GMV</span>
              <LmtdMarker direction={dcfGmvLmtd.direction} label={dcfGmvLmtd.label} variant="light" />
            </div>

            {/* Sub-metrics */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-200/70">Avg per KAM</span>
                <span className="text-[12px] font-bold text-white tabular-nums">{avgDCFPerKAM}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-200/70">KAMs in DCF</span>
                <span className={`text-[12px] font-bold tabular-nums ${kamsContributingDCFPct >= 60 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {kamsContributingDCF}/{kamData.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════
           2️⃣ INCENTIVE VIEW COMMAND BUTTON
         ══════════════════════════════════════════════════ */}
      <div className="px-4 mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowIncentiveDrawer(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-white
                     text-indigo-700 text-[12px] font-semibold hover:bg-indigo-50 hover:border-indigo-300
                     active:scale-[0.97] transition-all shadow-sm"
        >
          <Target className="w-3.5 h-3.5" />
          Incentive View
        </button>
        <span className={`text-[12px] font-bold tabular-nums ${incentive.scoreGate === 'full' ? 'text-emerald-600' : incentive.scoreGate === 'half' ? 'text-amber-600' : 'text-rose-600'
          }`}>
          {formatCurrency(incentive.projectedPayout)}
        </span>
        <span className="text-[10px] text-slate-400">projected</span>
      </div>

      {/* ══════════════════════════════════════════════════
           3️⃣ PRODUCTIVITY SNAPSHOT + MOMENTUM RISK
         ══════════════════════════════════════════════════ */}
      <div className="mx-4 mt-4">
        <div className="card-premium p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <h2 className="text-[13px] font-semibold text-slate-900">Team Productivity</h2>
            {siLmtd.direction === 'down' && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-full">
                <TrendingDown className="w-2.5 h-2.5" /> Negative trend
              </span>
            )}
            <span className="text-[10px] font-medium text-indigo-600 ml-auto">{kamData.length} KAMs</span>
          </div>

          {/* Compact metric row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                label: 'Critical', value: String(criticalCount), bad: criticalCount > 0,
                color: criticalCount > 0 ? 'text-rose-600' : 'text-emerald-600',
                bg: criticalCount > 0 ? 'bg-rose-50' : 'bg-emerald-50'
              },
              {
                label: '<12% I2SI', value: String(kamsBelowI2SI), bad: kamsBelowI2SI > 0,
                color: kamsBelowI2SI > 0 ? 'text-amber-600' : 'text-emerald-600',
                bg: kamsBelowI2SI > 0 ? 'bg-amber-50' : 'bg-emerald-50'
              },
              {
                label: 'Below SI', value: String(kamsBelowSIPace), bad: kamsBelowSIPace > 0,
                color: kamsBelowSIPace > 0 ? 'text-amber-600' : 'text-emerald-600',
                bg: kamsBelowSIPace > 0 ? 'bg-amber-50' : 'bg-emerald-50'
              },
              {
                label: 'Zero DCF', value: String(kamsZeroDCF), bad: kamsZeroDCF > 0,
                color: kamsZeroDCF > 0 ? 'text-rose-600' : 'text-emerald-600',
                bg: kamsZeroDCF > 0 ? 'bg-rose-50' : 'bg-emerald-50'
              },
            ].map(m => (
              <div key={m.label} className={`text-center px-1.5 py-2 rounded-xl ${m.bg}`}>
                <div className={`text-[18px] font-extrabold tabular-nums leading-none ${m.color}`}>{m.value}</div>
                <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mt-1">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Momentum Risk row */}
          {momentumRiskKams.length > 0 && (
            <div className="mt-2.5">
              <button
                onClick={() => setMomentumExpanded(!momentumExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-rose-50/60 border border-rose-100 rounded-xl
                           hover:bg-rose-50 transition-colors"
              >
                <TrendingDown className="w-3 h-3 text-rose-400 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-rose-700 flex-1 text-left">
                  {momentumRiskKams.length} KAM{momentumRiskKams.length > 1 ? 's' : ''} declining vs LMTD
                </span>
                {momentumExpanded
                  ? <ChevronUp className="w-3 h-3 text-rose-300" />
                  : <ChevronDown className="w-3 h-3 text-rose-300" />
                }
              </button>
              {momentumExpanded && (
                <div className="mt-1.5 px-3 space-y-1">
                  {momentumRiskKams.map(k => (
                    <div key={k.name} className="flex items-center justify-between text-[10px] py-1">
                      <span className="text-slate-600 font-medium">{k.name}</span>
                      <span className="text-rose-500 font-bold tabular-nums flex items-center gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" />
                        {k.delta}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alert banners (compact) */}
          {(kamsBelowScore70 > 0 || kamsAtRiskIncentive > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {kamsAtRiskIncentive > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg">
                  <AlertCircle className="w-3 h-3" />
                  {kamsAtRiskIncentive} at zero incentive
                </span>
              )}
              {kamsBelowScore70 > 0 && kamsBelowScore70 !== kamsAtRiskIncentive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                  <AlertTriangle className="w-3 h-3" />
                  {kamsBelowScore70 - kamsAtRiskIncentive} at half incentive
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           4️⃣ KAM DRILLDOWN — WHO NEEDS HELP
         ══════════════════════════════════════════════════ */}
      <div className="px-4 mt-4 pb-5">
        <button
          onClick={() => setExpandedProductivity(!expandedProductivity)}
          className="w-full flex items-center justify-between mb-3"
        >
          <h2 className="text-[14px] font-semibold text-slate-900">Who Needs Help</h2>
          {expandedProductivity
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </button>

        <div className="space-y-2.5">
          {(expandedProductivity ? sortedKAMs : sortedKAMs.slice(0, 3)).map((kam) => {
            const status = getKAMStatus(kam);
            const config = statusConfig[status];
            const siPct = Math.round((kam.stockIns / kam.stockInsTarget) * 100);
            const kamLmtd = lmtdDelta(siPct, kam.lmtdSIPct);

            return (
              <button
                key={kam.name}
                onClick={() => onKAMClick?.(kam.name, kam.city)}
                className={`w-full card-premium p-3.5 text-left active:scale-[0.99] transition-all duration-150
                  ${status === 'Critical' ? 'ring-1 ring-rose-200' : status === 'Needs Attention' ? 'ring-1 ring-amber-200' : ''}
                `}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold
                    ${status === 'On Track' ? 'bg-emerald-100 text-emerald-700' : status === 'Needs Attention' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}
                  `}>
                    {kam.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-slate-800 truncate">{kam.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
                        {status}
                      </span>
                      <span className="text-[10px] text-slate-400">{kam.city}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'I2SI%', value: `${kam.i2si}%`, bad: kam.i2si < kam.i2siTarget },
                    { label: 'Score', value: String(kam.inputScore), bad: kam.inputScore < 70 },
                    { label: 'SI', value: `${kam.stockIns}/${kam.stockInsTarget}`, bad: siPct < 80 },
                    { label: 'DCF', value: String(kam.dcfDisbursals), bad: false },
                  ].map((m) => (
                    <div key={m.label} className={`text-center px-1.5 py-1.5 rounded-lg ${m.bad ? 'bg-rose-50/60' : 'bg-slate-50'}`}>
                      <div className="text-[9px] text-slate-400 font-medium uppercase">{m.label}</div>
                      <div className={`text-[13px] font-bold ${m.bad ? 'text-rose-600' : 'text-slate-800'}`}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Mini SI progress + LMTD delta */}
                <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500
                      ${siPct >= 90 ? 'bg-emerald-500' : siPct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}
                    `}
                    style={{ width: `${Math.min(siPct, 100)}%` }}
                  />
                </div>
                {kamLmtd.direction !== 'flat' && (
                  <div className="mt-1">
                    <LmtdMarker direction={kamLmtd.direction} label={kamLmtd.label + '%'} variant="dark" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {kamData.length > 3 && (
          <button
            onClick={() => setExpandedProductivity(!expandedProductivity)}
            className="w-full mt-2 py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-indigo-600
                       rounded-xl hover:bg-indigo-50 transition-colors"
          >
            {expandedProductivity ? 'Show less' : `Review all ${kamData.length} KAMs`}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="h-4" />
      </div>

      {/* ══════════════════════════════════════════════════
           5️⃣ INCENTIVE DRAWER (Bottom Sheet)
         ══════════════════════════════════════════════════ */}
      {showIncentiveDrawer && (
        <IncentiveDrawer
          incentive={incentive}
          overview={overview}
          activeSlab={activeSlab}
          kamsAtRiskIncentive={kamsAtRiskIncentive}
          kamsBelowScore70={kamsBelowScore70}
          formatCurrency={formatCurrency}
          onClose={() => setShowIncentiveDrawer(false)}
        />
      )}
    </div>
  );
}

// ── Incentive Drawer (unchanged) ──

interface IncentiveDrawerProps {
  incentive: TLIncentiveData;
  overview: TLOverview;
  activeSlab: { row: number; col: number } | null;
  kamsAtRiskIncentive: number;
  kamsBelowScore70: number;
  formatCurrency: (n: number) => string;
  onClose: () => void;
}

function IncentiveDrawer({ incentive, overview, activeSlab, kamsAtRiskIncentive, kamsBelowScore70, formatCurrency, onClose }: IncentiveDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div ref={backdropRef} onClick={handleClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`} />

      <div className={`relative bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto transition-transform duration-200 ease-out
        ${mounted ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-[16px] font-bold text-slate-900">TL Incentive Engine</h2>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Slab Status */}
          <div className={`card-premium p-4 ${incentive.scoreGate === 'full' ? 'ring-1 ring-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                  ${incentive.scoreGate === 'full' ? 'bg-emerald-100' : incentive.scoreGate === 'half' ? 'bg-amber-100' : 'bg-rose-100'}`}>
                  <Banknote className={`w-5 h-5
                    ${incentive.scoreGate === 'full' ? 'text-emerald-600' : incentive.scoreGate === 'half' ? 'text-amber-600' : 'text-rose-600'}`} />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Projected Payout</div>
                  <div className={`text-xl font-bold tracking-tight ${incentive.scoreGate === 'full' ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {formatCurrency(incentive.projectedPayout)}
                  </div>
                </div>
              </div>
              <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
                ${incentive.currentAchievementPercent >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {incentive.currentAchievementPercent}% achieved
              </div>
            </div>
            {kamsAtRiskIncentive > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                <span className="text-[11px] font-medium text-rose-700">{kamsAtRiskIncentive} KAM{kamsAtRiskIncentive > 1 ? 's' : ''} score below 50 — incentive at zero</span>
              </div>
            )}
            {kamsBelowScore70 > 0 && kamsBelowScore70 !== kamsAtRiskIncentive && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl mt-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-[11px] font-medium text-amber-700">{kamsBelowScore70 - kamsAtRiskIncentive} KAM{(kamsBelowScore70 - kamsAtRiskIncentive) > 1 ? 's' : ''} score below 70 — half incentive</span>
              </div>
            )}
          </div>

          {/* Achievement + I2SI Slab */}
          <div className="flex gap-2.5">
            <div className="flex-1 bg-slate-50 rounded-xl p-3">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Achievement Slab</div>
              <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-lg
                ${incentive.currentAchievementPercent >= 110 ? 'bg-indigo-100 text-indigo-700'
                  : incentive.currentAchievementPercent >= 95 ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'}`}>
                {incentive.currentAchievementPercent >= 110 ? '110% Slab' : incentive.currentAchievementPercent >= 95 ? '95% Slab' : 'Not eligible'}
              </span>
            </div>
            <div className="flex-1 bg-slate-50 rounded-xl p-3">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">I2SI Band</div>
              <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-lg
                ${incentive.currentI2SI >= 15 ? 'bg-indigo-100 text-indigo-700'
                  : incentive.currentI2SI >= 12 ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'}`}>
                {incentive.currentI2SI >= 15 ? '15% Band' : incentive.currentI2SI >= 12 ? '12% Band' : 'Below 12%'}
              </span>
            </div>
          </div>

          {/* Per-SI Slab Matrix */}
          <div className="card-premium p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">Per SI Incentive Slab</h3>
            </div>
            <div className="text-[10px] text-slate-400 mb-2 font-medium">Rate per Stock-in (only 10% SB considered)</div>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-3 bg-slate-50">
                <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Achievement</div>
                <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">I2SI 12%</div>
                <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">I2SI 15%</div>
              </div>
              {SLABS.map((slab, rowIdx) => (
                <div key={slab.achieveLabel} className="grid grid-cols-3 border-t border-slate-100">
                  <div className="px-3 py-2.5 text-[12px] font-medium text-slate-700">{slab.achieveLabel}</div>
                  {[slab.i2si12, slab.i2si15].map((rate, colIdx) => {
                    const isActive = activeSlab && activeSlab.row === rowIdx && activeSlab.col === colIdx + 1;
                    return (
                      <div key={colIdx} className={`px-3 py-2.5 text-center text-[13px] font-bold transition-all
                        ${isActive ? 'bg-indigo-100 text-indigo-700 ring-2 ring-inset ring-indigo-400'
                          : rate === 0 ? 'text-slate-300 bg-slate-50/50' : 'text-slate-700'}`}>
                        {rate === 0 ? '—' : `\u20B9${rate}`}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400">
              <div className="w-3 h-3 rounded bg-indigo-100 ring-1 ring-indigo-400" />
              <span>Your current slab</span>
            </div>
          </div>

          {/* Boosters & Gates */}
          <div className="card-premium p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">Boosters & Gates</h3>
            </div>
            <div className="space-y-2 mb-4">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Boosters</div>
              {[
                { label: 'I2SI target achieved', value: incentive.i2siBonus > 0 ? `+\u20B9${incentive.i2siBonus.toLocaleString('en-IN')}` : '+\u20B95,000', active: incentive.i2siBonus > 0, desc: 'Flat bonus if I2SI \u2265 15%' },
                { label: 'DCF Onboarding', value: `+\u20B9${incentive.dcfOnboardingBonus.toLocaleString('en-IN')}`, active: incentive.dcfOnboardingBonus > 0, desc: `\u20B9100 per onboarding (\u00D7${overview.dcfOnboardings})` },
                { label: 'DCF GMV', value: `+\u20B9${incentive.dcfGMVBonus.toLocaleString('en-IN')}`, active: incentive.dcfGMVBonus > 0, desc: 'GMV \u00D7 0.3%' },
              ].map((b) => (
                <div key={b.label} className={`flex items-center justify-between px-3 py-2 rounded-xl ${b.active ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <div>
                    <div className={`text-[12px] font-medium ${b.active ? 'text-emerald-700' : 'text-slate-500'}`}>{b.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{b.desc}</div>
                  </div>
                  <span className={`text-[13px] font-bold ${b.active ? 'text-emerald-600' : 'text-slate-400'}`}>{b.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Score-based Gating</div>
              {[
                { label: 'Score \u226570', desc: 'Full incentive', color: 'emerald' as const, active: incentive.avgTeamScore >= 70 },
                { label: 'Score 50\u201370', desc: 'Half incentive', color: 'amber' as const, active: incentive.avgTeamScore >= 50 && incentive.avgTeamScore < 70 },
                { label: 'Score <50', desc: 'Zero incentive', color: 'rose' as const, active: incentive.avgTeamScore < 50 },
              ].map((gate) => (
                <div key={gate.label} className={`flex items-center justify-between px-3 py-2 rounded-xl border
                  ${gate.active
                    ? gate.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' : gate.color === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'
                    : 'bg-slate-50/50 border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    {gate.active && <div className={`w-2 h-2 rounded-full ${gate.color === 'emerald' ? 'bg-emerald-500' : gate.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />}
                    <span className={`text-[12px] font-medium ${gate.active ? gate.color === 'emerald' ? 'text-emerald-700' : gate.color === 'amber' ? 'text-amber-700' : 'text-rose-700' : 'text-slate-400'}`}>{gate.label}</span>
                  </div>
                  <span className={`text-[11px] font-semibold ${gate.active ? gate.color === 'emerald' ? 'text-emerald-600' : gate.color === 'amber' ? 'text-amber-600' : 'text-rose-600' : 'text-slate-300'}`}>{gate.desc}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-1.5 mt-3 text-[10px] text-slate-400">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Incentive is per Stock-in. Only 10% SB considered. Score gating applies at individual KAM level.</span>
            </div>
          </div>
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}