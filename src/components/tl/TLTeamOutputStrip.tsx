/**
 * TLTeamOutputStrip — Team-level output rollup for the TL home page.
 *
 * Three-cell strip:
 *   • Total Inspections (sum across team)
 *   • Stock-ins (sum across team)
 *   • Productivity (I2SI%) — team stockIns / team inspections × 100
 *
 * Sums are computed by aggregating per-KAM rank-based metrics from
 * computeMetrics so the math matches KAM HomePage parity exactly.
 */

import { useMemo } from 'react';
import { Target, Boxes, Percent } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { computeMetrics } from '../../lib/metrics/metricsFromDB';
import { prorateTarget } from '../../lib/metrics/prorateTarget';
import { getConfigSITarget, getConfigI2SITarget } from '../../lib/configFromDB';

interface Props {
  effectiveKamIds: string[] | undefined;
  period: TimePeriod;
  customFrom?: string;
  customTo?: string;
}

const MONTHLY_INSPECTIONS_TARGET_PER_KAM = 250;

export function TLTeamOutputStrip({ effectiveKamIds, period, customFrom, customTo }: Props) {
  const totals = useMemo(() => {
    const ids = effectiveKamIds ?? [];
    let inspections = 0;
    let stockIns = 0;
    for (const kamId of ids) {
      const m = computeMetrics(period, kamId, customFrom, customTo);
      inspections += m.inspections;
      stockIns += m.stockIns;
    }
    const i2si = inspections > 0 ? Math.round((stockIns / inspections) * 100) : 0;
    return { inspections, stockIns, i2si, kamCount: ids.length };
  }, [effectiveKamIds, period, customFrom, customTo]);

  const kamCount = Math.max(1, totals.kamCount);
  const inspectionsTarget = prorateTarget(MONTHLY_INSPECTIONS_TARGET_PER_KAM * kamCount, period, { customFrom, customTo });
  const siTarget = prorateTarget(getConfigSITarget('KAM') * kamCount, period, { customFrom, customTo });
  const i2siTarget = getConfigI2SITarget('KAM');

  return (
    <div className="mx-4 mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-100">
        <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Team Output</div>
        <span className="text-[10px] text-slate-400">across {totals.kamCount} KAM{totals.kamCount === 1 ? '' : 's'}</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <Cell
          icon={<Target className="w-3.5 h-3.5 text-indigo-600" />}
          label="Inspections"
          value={totals.inspections}
          target={inspectionsTarget}
          isPct={false}
        />
        <Cell
          icon={<Boxes className="w-3.5 h-3.5 text-violet-600" />}
          label="Stock-ins"
          value={totals.stockIns}
          target={siTarget}
          isPct={false}
        />
        <Cell
          icon={<Percent className="w-3.5 h-3.5 text-emerald-600" />}
          label="Productivity (I2SI)"
          value={totals.i2si}
          target={i2siTarget}
          isPct
        />
      </div>
    </div>
  );
}

function Cell({
  icon,
  label,
  value,
  target,
  isPct,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  target: number;
  isPct: boolean;
}) {
  const pct = target > 0 ? Math.round((value / target) * 100) : 0;
  const onTrack = pct >= 90;
  const color = onTrack ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-rose-600';
  const bar = onTrack ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1.5">
        <span className={`text-[20px] font-extrabold tabular-nums ${color}`}>
          {value}
          {isPct ? '%' : ''}
        </span>
        <span className="text-[10px] text-slate-400">
          / {target}
          {isPct ? '%' : ''}
        </span>
      </div>
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
