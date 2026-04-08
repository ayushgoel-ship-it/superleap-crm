/**
 * TLIncentiveCard — Renders the locked TL incentive formula for the
 * currently-viewed period and effective KAM scope.
 *
 * Formula owner: see `src/lib/incentive/tlIncentive.ts`
 *
 * Data wiring:
 *   • teamStockins                → sum of computeMetrics(period, kamId).stockIns
 *                                   across effectiveKamIds
 *   • teamStockinMonthlyTarget    → sum of getConfigTargetsForUser(kamId).siTarget
 *                                   (per-KAM monthly target; falls back to
 *                                   FALLBACK_SI_TARGET_KAM inside configFromDB).
 *                                   The formula uses the **full monthly** team
 *                                   target as the denominator for achievement %
 *                                   and for the mid-month 50% gate.
 *   • teamDcfDisbursed            → sum of computeMetrics(period, kamId).dcfDisbursals
 *                                   (dcfDisbursals = DCF leads with disbursalDate
 *                                   in period — canonical "disbursed" predicate
 *                                   per metricsFromDB.ts).
 *   • teamScore                   → average of per-KAM InputScore (reuses the same
 *                                   composite formula as TLInputMetricsCard /
 *                                   HomePage: visits/calls/unique dealers/conversion).
 *   • midMonthProgressPct         → stockins for [month start, day 15] across the
 *                                   team ÷ monthly team target × 100.
 *   • periodCoversMidMonth        → true if today ≥ 15th of current month AND the
 *                                   active period's range overlaps day 15 of the
 *                                   current month. For historical periods that
 *                                   don't include day 15 this is false → bonus N/A.
 *
 * Assumption: Per-KAM monthly SI targets come from `targets` table via
 * getConfigTargetsForUser. If a KAM has no row, configFromDB falls back to
 * a per-role default (FALLBACK_SI_TARGET_KAM). This matches the logic used
 * by getConfigSITarget('TL').
 */

import { useMemo, useState } from 'react';
import { Coins, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { computeMetrics } from '../../lib/metrics/metricsFromDB';
import { getConfigTargetsForUser } from '../../lib/configFromDB';
import { resolveTimePeriodToRange } from '../../lib/time/resolveTimePeriod';
import { computeTLIncentive, TLIncentiveBreakdown } from '../../lib/incentive/tlIncentive';
import { computeInputScore as kamInputScore } from '../../lib/metrics/inputScore';

interface Props {
  effectiveKamIds: string[] | undefined;
  period: TimePeriod;
  customFrom?: string;
  customTo?: string;
}

function formatRupees(n: number): string {
  if (n >= 100000) return `\u20B9${(n / 1000).toFixed(1)}K`;
  return `\u20B9${Math.round(n).toLocaleString('en-IN')}`;
}

export function TLIncentiveCard({ effectiveKamIds, period, customFrom, customTo }: Props) {
  const [expanded, setExpanded] = useState(false);

  const { breakdown, teamStockins, teamStockinMonthlyTarget, teamDcfDisbursed, teamScore, periodLabel } = useMemo(() => {
    const kamIds = effectiveKamIds ?? [];
    const now = new Date();

    // Aggregate across team for the active period
    let stockins = 0;
    let dcfDisbursed = 0;
    let scoreSum = 0;
    let monthlyTargetSum = 0;

    for (const kamId of kamIds) {
      const m = computeMetrics(period, kamId, customFrom, customTo);
      stockins += m.stockIns;
      dcfDisbursed += m.dcfDisbursals;
      scoreSum += kamInputScore(m);
      monthlyTargetSum += getConfigTargetsForUser(kamId).siTarget || 0;
    }
    const teamCount = Math.max(1, kamIds.length);
    const avgScore = Math.round(scoreSum / teamCount);

    // Mid-month evaluation:
    // Eligible only if the active period's range overlaps day 15 of the
    // current month AND today is on/after that day.
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const day15 = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59);
    const range = resolveTimePeriodToRange(period, now, customFrom, customTo);
    const pFrom = new Date(range.fromISO).getTime();
    const pTo = new Date(range.toISO).getTime();
    const overlapsDay15 = pFrom <= day15.getTime() && pTo >= day15.getTime();
    const todayPastDay15 = now.getTime() >= new Date(now.getFullYear(), now.getMonth(), 15).getTime();
    const periodCoversMidMonth = overlapsDay15 && todayPastDay15;

    let midMonthProgressPct = 0;
    if (periodCoversMidMonth && monthlyTargetSum > 0) {
      // Compute stockins across team from month-start → day 15 (inclusive).
      let midStockins = 0;
      const fromISO = monthStart.toISOString();
      const toISO = day15.toISOString();
      for (const kamId of kamIds) {
        const m = computeMetrics(TimePeriod.CUSTOM, kamId, fromISO, toISO);
        midStockins += m.stockIns;
      }
      midMonthProgressPct = (midStockins / monthlyTargetSum) * 100;
    }

    const result = computeTLIncentive({
      teamStockins: stockins,
      teamStockinMonthlyTarget: monthlyTargetSum,
      teamDcfDisbursed: dcfDisbursed,
      teamScore: avgScore,
      midMonthProgressPct,
      periodCoversMidMonth,
    });

    return {
      breakdown: result,
      teamStockins: stockins,
      teamStockinMonthlyTarget: monthlyTargetSum,
      teamDcfDisbursed: dcfDisbursed,
      teamScore: avgScore,
      periodLabel: period,
    };
  }, [effectiveKamIds, period, customFrom, customTo]);

  const multiplierColor =
    breakdown.multiplier === 1 ? 'text-emerald-600' : breakdown.multiplier === 0.5 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="mx-4 mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            TL Incentive ({periodLabel})
          </span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-0.5"
        >
          {expanded ? 'Hide' : 'Details'}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Hero — Final amount */}
      <div className="px-4 pt-3 pb-3">
        <div className="text-[11px] text-slate-500 font-medium mb-1">Projected Payout</div>
        <div className="flex items-baseline gap-2">
          <span className={`text-[28px] font-extrabold tabular-nums leading-none ${multiplierColor}`}>
            {formatRupees(breakdown.final)}
          </span>
          <span className="text-[11px] text-slate-400">
            = {formatRupees(breakdown.gross)} × {breakdown.multiplier}
          </span>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Chip label={`Target ${breakdown.targetAchPct}%`} tone={breakdown.rate > 0 ? 'emerald' : 'rose'} />
          <Chip label={`Rate \u20B9${breakdown.rate}/SI`} tone="slate" />
          <Chip
            label={`Score ${teamScore}`}
            tone={breakdown.multiplier === 1 ? 'emerald' : breakdown.multiplier === 0.5 ? 'amber' : 'rose'}
          />
          {breakdown.midMonthBonus > 0 && <Chip label="Mid-month +\u20B92.5K" tone="emerald" />}
        </div>
      </div>

      {/* Breakdown rows (always visible) */}
      <div className="border-t border-slate-100 px-4 py-2 space-y-1">
        <BreakdownRow
          label="Stockin Incentive"
          sub={`${teamStockins} SI \u00D7 \u20B9${breakdown.rate}`}
          amount={breakdown.stockinIncentive}
        />
        <BreakdownRow
          label="DCF Incentive"
          sub={`${teamDcfDisbursed} disbursed \u00D7 \u20B91,000`}
          amount={breakdown.dcfIncentive}
        />
        <BreakdownRow
          label="Mid-Month Bonus"
          sub={breakdown.midMonthBonus > 0 ? 'Unlocked' : 'Not unlocked'}
          amount={breakdown.midMonthBonus}
        />
        <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700">Gross</span>
          <span className="text-[12px] font-bold text-slate-900 tabular-nums">{formatRupees(breakdown.gross)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700">× Score Multiplier</span>
          <span className={`text-[12px] font-bold tabular-nums ${multiplierColor}`}>×{breakdown.multiplier}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-900">Final</span>
          <span className={`text-[14px] font-extrabold tabular-nums ${multiplierColor}`}>
            {formatRupees(breakdown.final)}
          </span>
        </div>
      </div>

      {/* Expanded reasoning */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-2">
          <Reason icon text={breakdown.rateReason} />
          <Reason icon text={breakdown.multiplierReason} />
          <Reason icon text={breakdown.bonusReason} />
          <div className="pt-2 mt-2 border-t border-slate-200">
            <div className="text-[10px] font-semibold text-slate-600 mb-1">Formula legend</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px] text-slate-500 leading-snug">
              <dt className="font-semibold text-slate-600">SI</dt>
              <dd>Stock-Ins (period)</dd>
              <dt className="font-semibold text-slate-600">Achv%</dt>
              <dd>Period SI ÷ team monthly SI target</dd>
              <dt className="font-semibold text-slate-600">Rate</dt>
              <dd>₹/SI tier picked from Achv%</dd>
              <dt className="font-semibold text-slate-600">Gross</dt>
              <dd>SI × Rate</dd>
              <dt className="font-semibold text-slate-600">Score</dt>
              <dd>Avg KAM input score (visits, calls, dealers, conv.)</dd>
              <dt className="font-semibold text-slate-600">Multiplier</dt>
              <dd>0.8×–1.2× from Score band</dd>
              <dt className="font-semibold text-slate-600">Mid-bonus</dt>
              <dd>Flat ₹ if mid-month pace on track</dd>
              <dt className="font-semibold text-slate-600">Final</dt>
              <dd>(Gross × Multiplier) + Mid-bonus</dd>
            </dl>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-200 text-[10px] text-slate-500 leading-snug">
            Team monthly SI target (denominator): <b>{teamStockinMonthlyTarget}</b>{' '}
            (sum of per-KAM <code>targets.si_target</code>). Period stockins contribute to achievement %.
            Formula locked — see <code>src/lib/incentive/tlIncentive.ts</code>.
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone: 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : tone === 'rose'
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function BreakdownRow({ label, sub, amount }: { label: string; sub: string; amount: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <div className="text-[12px] text-slate-700">{label}</div>
        <div className="text-[10px] text-slate-400 truncate">{sub}</div>
      </div>
      <span className="text-[12px] font-semibold text-slate-800 tabular-nums">{formatRupees(amount)}</span>
    </div>
  );
}

function Reason({ icon, text }: { icon?: boolean; text: string }) {
  return (
    <div className="flex items-start gap-1.5">
      {icon && <Info className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />}
      <span className="text-[11px] text-slate-600 leading-snug">{text}</span>
    </div>
  );
}
