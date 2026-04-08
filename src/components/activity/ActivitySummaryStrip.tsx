/**
 * ActivitySummaryStrip — canonical 6-metric summary used across KAM/TL/Admin
 * activity views. Reads only from `computeActivityMetrics` so all roles get
 * identical math.
 */
import { Phone, MapPin, TrendingUp, BarChart3, Users, Clock } from 'lucide-react';
import type { ActivityMetrics } from '../../lib/metrics/activityMetrics';

interface Props {
  metrics: ActivityMetrics;
  /** Total dealers in the visible scope (used as the partner-coverage denominator). */
  scopeDealerCount: number;
}

interface CellProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: 'indigo' | 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';
}

function Cell({ icon: Icon, label, value, sub, tone = 'indigo' }: CellProps) {
  const bg: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-2 py-2 flex items-start gap-1.5 shadow-sm min-w-0">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${bg[tone]}`}>
        <Icon className="w-3 h-3" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 truncate">{label}</div>
        <div className="text-[14px] font-bold text-slate-900 leading-tight tabular-nums truncate">{value}</div>
        {sub && <div className="text-[9px] text-slate-400 truncate">{sub}</div>}
      </div>
    </div>
  );
}

export function ActivitySummaryStrip({ metrics, scopeDealerCount }: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
      <Cell
        icon={Phone}
        tone="indigo"
        label="Call Cov"
        value={`${metrics.partnerCoverageCallPct}%`}
        sub={`of ${scopeDealerCount}`}
      />
      <Cell
        icon={MapPin}
        tone="emerald"
        label="Visit Cov"
        value={`${metrics.partnerCoverageVisitPct}%`}
        sub={`of ${scopeDealerCount}`}
      />
      <Cell
        icon={TrendingUp}
        tone="violet"
        label="Productive"
        value={`${metrics.productivePct}%`}
        sub={`${metrics.totalInteractions} acts`}
      />
      <Cell
        icon={BarChart3}
        tone="sky"
        label="Calls/day"
        value={`${metrics.avgCallsPerDay}`}
      />
      <Cell
        icon={Users}
        tone="amber"
        label="Visits/day"
        value={`${metrics.avgVisitsPerDay}`}
      />
      <Cell
        icon={Clock}
        tone="rose"
        label="Pending"
        value={`${metrics.pendingFeedback}`}
        sub="calls"
      />
    </div>
  );
}
