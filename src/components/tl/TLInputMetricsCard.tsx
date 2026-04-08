/**
 * TLInputMetricsCard — Team-average input-metric tracker for the TL home page.
 *
 * Mirrors the KAM HomePage "Input Metrics" composite (visits, calls,
 * inspecting dealers, conversion) but computed per-KAM and then averaged
 * across the TL's effective KAM list.
 *
 * Layout:
 *   • Hero tile: team-average input score with target progress bar
 *   • 3-row table: Inspecting dealers/day, Visits/day, Calls/day
 *     showing Team Avg + Top KAM for each row.
 */

import { useMemo } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { computeMetrics } from '../../lib/metrics/metricsFromDB';
import { resolveTimePeriodToRange } from '../../lib/time/resolveTimePeriod';
import { prorateTarget } from '../../lib/metrics/prorateTarget';
import { computeInputScore } from '../../lib/metrics/inputScore';
import { getRuntimeDBSync } from '../../data/runtimeDB';

interface Props {
  effectiveKamIds: string[] | undefined;
  period: TimePeriod;
  customFrom?: string;
  customTo?: string;
}

interface PerKamRow {
  kamId: string;
  kamName: string;
  inputScore: number;
  inspectingDealersPerDay: number;
  visitsPerDay: number;
  callsPerDay: number;
}

const MONTHLY_INPUT_SCORE_TARGET = 85;
const MONTHLY_VISITS_TARGET = 8 * 30;
const MONTHLY_CONNECTS_TARGET = 60;
const PER_DAY_INSPECTING_TARGET = 3;

function kamNameOf(kamId: string): string {
  const db = getRuntimeDBSync();
  const dealer = db.dealers.find((d) => d.kamId === kamId);
  if (dealer?.kamName) return dealer.kamName;
  const lead = db.leads.find((l) => l.kamId === kamId);
  return lead?.kamName || 'KAM';
}

export function TLInputMetricsCard({ effectiveKamIds, period, customFrom, customTo }: Props) {
  const rows: PerKamRow[] = useMemo(() => {
    if (!effectiveKamIds || effectiveKamIds.length === 0) return [];
    const range = resolveTimePeriodToRange(period, new Date(), customFrom, customTo);
    const fromMs = new Date(range.fromISO).getTime();
    const toMs = new Date(range.toISO).getTime();
    const days = Math.max(1, Math.round((toMs - fromMs) / 86_400_000));

    return effectiveKamIds.map((kamId) => {
      const m = computeMetrics(period, kamId, customFrom, customTo);
      const inputScore = computeInputScore(m);
      return {
        kamId,
        kamName: kamNameOf(kamId),
        inputScore,
        inspectingDealersPerDay: Math.round((m.uniqueDealersVisited / days) * 10) / 10,
        visitsPerDay: Math.round((m.completedVisits / days) * 10) / 10,
        callsPerDay: Math.round((m.connectedCalls / days) * 10) / 10,
      };
    });
  }, [effectiveKamIds, period, customFrom, customTo]);

  const teamCount = rows.length || 1;
  const avgInputScore = Math.round(rows.reduce((s, r) => s + r.inputScore, 0) / teamCount);
  const avgInspecting = Math.round((rows.reduce((s, r) => s + r.inspectingDealersPerDay, 0) / teamCount) * 10) / 10;
  const avgVisits = Math.round((rows.reduce((s, r) => s + r.visitsPerDay, 0) / teamCount) * 10) / 10;
  const avgCalls = Math.round((rows.reduce((s, r) => s + r.callsPerDay, 0) / teamCount) * 10) / 10;

  const top = (key: keyof PerKamRow): PerKamRow | undefined =>
    rows.length === 0 ? undefined : [...rows].sort((a, b) => (b[key] as number) - (a[key] as number))[0];

  const topInspecting = top('inspectingDealersPerDay');
  const topVisits = top('visitsPerDay');
  const topCalls = top('callsPerDay');

  // Per-day targets (period-agnostic — these are rates).
  const visitsPerDayTarget = MONTHLY_VISITS_TARGET / 30;
  const callsPerDayTarget = MONTHLY_CONNECTS_TARGET / 30;
  // Touch prorateTarget to keep import (used elsewhere in TL home computations).
  void prorateTarget;

  const scorePct = Math.min(100, Math.round((avgInputScore / MONTHLY_INPUT_SCORE_TARGET) * 100));
  const scoreColor = avgInputScore >= 75 ? 'bg-emerald-500' : avgInputScore >= 50 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="mx-4 mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Team Input Metrics</span>
        </div>
        <span className="text-[10px] text-slate-400">avg of {rows.length} KAM{rows.length === 1 ? '' : 's'}</span>
      </div>

      {/* Hero — team input score */}
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="text-[11px] text-slate-500 font-medium">Team Avg Input Score</div>
          <div className="flex items-baseline gap-1">
            <span className="text-[24px] font-extrabold text-slate-900 tabular-nums leading-none">{avgInputScore}</span>
            <span className="text-[11px] text-slate-400">/ {MONTHLY_INPUT_SCORE_TARGET}</span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${scoreColor} transition-all duration-700`} style={{ width: `${scorePct}%` }} />
        </div>
      </div>

      {/* 3-row metric table */}
      <div className="border-t border-slate-100">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider">
              <th className="text-left font-semibold px-4 py-1.5">Metric</th>
              <th className="text-right font-semibold px-2 py-1.5">Team Avg</th>
              <th className="text-right font-semibold px-4 py-1.5">Top KAM</th>
            </tr>
          </thead>
          <tbody>
            <MetricRow
              label="Inspecting Dealers / day"
              teamAvg={avgInspecting}
              target={PER_DAY_INSPECTING_TARGET}
              top={topInspecting}
              topValue={topInspecting?.inspectingDealersPerDay ?? 0}
            />
            <MetricRow
              label="Visits / day"
              teamAvg={avgVisits}
              target={Math.max(1, Math.round(visitsPerDayTarget))}
              top={topVisits}
              topValue={topVisits?.visitsPerDay ?? 0}
            />
            <MetricRow
              label="Calls / day (Connects)"
              teamAvg={avgCalls}
              target={Math.max(1, Math.round(callsPerDayTarget))}
              top={topCalls}
              topValue={topCalls?.callsPerDay ?? 0}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  teamAvg,
  target,
  top,
  topValue,
}: {
  label: string;
  teamAvg: number;
  target: number;
  top: PerKamRow | undefined;
  topValue: number;
}) {
  const onTrack = teamAvg >= target;
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2 text-slate-700">{label}</td>
      <td className="px-2 py-2 text-right tabular-nums">
        <span className={`font-bold ${onTrack ? 'text-emerald-600' : 'text-amber-600'}`}>{teamAvg}</span>
        <span className="text-[10px] text-slate-400 ml-1">/ {target}</span>
      </td>
      <td className="px-4 py-2 text-right">
        {top ? (
          <div className="flex items-center justify-end gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-slate-700 truncate max-w-[80px]">{top.kamName}</span>
            <span className="text-slate-500 tabular-nums">({topValue})</span>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
    </tr>
  );
}

