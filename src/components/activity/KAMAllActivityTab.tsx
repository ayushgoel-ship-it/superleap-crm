/**
 * KAMAllActivityTab — KAM "All Activity" tab.
 *
 * Backend-driven, KAM-scoped chronological feed of calls + visits with:
 *   • Canonical TimeFilterControl (chips + custom range)
 *   • Calls/Visits/All toggle + Pending-feedback filter
 *   • ActivitySummaryStrip (canonical 6-metric strip via computeActivityMetrics)
 *
 * Reuses ActivityContext + activityMetrics.ts and is hierarchy-aware via useKamScope.
 */

import { useMemo, useState } from 'react';
import { Phone, MapPin, AlertTriangle } from 'lucide-react';
import { useActivity, type CallAttempt, type Visit } from '../../contexts/ActivityContext';
import {
  CallActivityCard,
  VisitActivityCard,
  isCallPendingFeedback,
  isVisitPendingFeedback,
} from './ActivityCard';
import { ActivitySummaryStrip } from './ActivitySummaryStrip';
import {
  computeActivityMetrics,
  filterCallsByRange,
  filterVisitsByRange,
  daysInRange,
} from '../../lib/metrics/activityMetrics';
import { TimePeriod } from '../../lib/domain/constants';
import { resolveTimePeriodToRange } from '../../lib/time/resolveTimePeriod';
import {
  TimeFilterControl,
  CANONICAL_TIME_OPTIONS,
  CANONICAL_TIME_LABELS,
} from '../filters/TimeFilterControl';
import { useKamScope } from '../../lib/auth/useKamScope';
import { getAllDealers, getDealersByKAM } from '../../data/selectors';

type FeedFilter = 'all' | 'calls' | 'visits' | 'pending';

interface Props {
  onNavigateToCallFeedback?: (callId: string) => void;
  onNavigateToVisitFeedback?: (visitId: string) => void;
}

export function KAMAllActivityTab({ onNavigateToCallFeedback, onNavigateToVisitFeedback }: Props) {
  const { calls, visits } = useActivity();
  const kamId = useKamScope();
  const scopeDealerCount = useMemo(
    () => (kamId ? getDealersByKAM(kamId).length : getAllDealers().length),
    [kamId],
  );

  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [timeScope, setTimeScope] = useState<TimePeriod>(TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useState<string | undefined>(undefined);
  const [customTo, setCustomTo] = useState<string | undefined>(undefined);

  const range = useMemo(() => {
    const r = resolveTimePeriodToRange(timeScope, new Date(), customFrom, customTo);
    return { from: new Date(r.fromISO).getTime(), to: new Date(r.toISO).getTime() };
  }, [timeScope, customFrom, customTo]);

  const filteredCalls = useMemo(() => filterCallsByRange(calls, range.from, range.to), [calls, range]);
  const filteredVisits = useMemo(() => filterVisitsByRange(visits, range.from, range.to), [visits, range]);

  const numberOfDays = useMemo(() => daysInRange(range.from, range.to), [range]);

  const metrics = useMemo(
    () => computeActivityMetrics({ calls: filteredCalls, visits: filteredVisits, scopeDealerCount, numberOfDays }),
    [filteredCalls, filteredVisits, scopeDealerCount, numberOfDays],
  );

  const feed = useMemo(() => {
    const items: Array<{ id: string; type: 'call' | 'visit'; ts: number; call?: CallAttempt; visit?: Visit }> = [];
    if (feedFilter === 'pending') {
      for (const c of filteredCalls) if (isCallPendingFeedback(c)) items.push({ id: c.id, type: 'call', ts: new Date(c.timestamp).getTime(), call: c });
      for (const v of filteredVisits) if (isVisitPendingFeedback(v)) items.push({ id: v.id, type: 'visit', ts: new Date(v.checkInTime || v.createdAt || v.scheduledTime || 0).getTime(), visit: v });
    } else {
      if (feedFilter !== 'visits') for (const c of filteredCalls) items.push({ id: c.id, type: 'call', ts: new Date(c.timestamp).getTime(), call: c });
      if (feedFilter !== 'calls') for (const v of filteredVisits) items.push({ id: v.id, type: 'visit', ts: new Date(v.checkInTime || v.createdAt || v.scheduledTime || 0).getTime(), visit: v });
    }
    return items.sort((a, b) => b.ts - a.ts);
  }, [filteredCalls, filteredVisits, feedFilter]);

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3 pb-2 space-y-3 bg-white/60 border-b border-slate-100">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {([
            { key: 'all' as FeedFilter, label: 'All', count: filteredCalls.length + filteredVisits.length },
            { key: 'calls' as FeedFilter, label: 'Calls', count: filteredCalls.length, icon: Phone },
            { key: 'visits' as FeedFilter, label: 'Visits', count: filteredVisits.length, icon: MapPin },
            { key: 'pending' as FeedFilter, label: 'Pending', count: metrics.pendingFeedback, icon: AlertTriangle },
          ]).map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFeedFilter(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap
                ${feedFilter === key ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {label} <span className="opacity-80">{count}</span>
            </button>
          ))}
        </div>
        <TimeFilterControl
          mode="chips"
          chipStyle="pill"
          value={timeScope}
          onChange={setTimeScope}
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
        <ActivitySummaryStrip metrics={metrics} scopeDealerCount={scopeDealerCount} />
      </div>

      <div className="flex-1 px-4 pt-3 pb-6 space-y-3">
        {feed.length === 0 && (
          <div className="text-center text-[12px] text-slate-400 py-10">No activity in this period</div>
        )}
        {feed.map((item) => {
          if (item.type === 'call' && item.call) {
            return (
              <CallActivityCard
                key={item.id}
                call={item.call}
                onAddFeedback={isCallPendingFeedback(item.call) ? () => onNavigateToCallFeedback?.(item.call!.id) : undefined}
                onViewDetails={() => onNavigateToCallFeedback?.(item.call!.id)}
              />
            );
          }
          if (item.type === 'visit' && item.visit) {
            return (
              <VisitActivityCard
                key={item.id}
                visit={item.visit}
                onAddFeedback={isVisitPendingFeedback(item.visit) ? () => onNavigateToVisitFeedback?.(item.visit!.id) : undefined}
                onViewSummary={item.visit.status === 'completed' ? () => onNavigateToVisitFeedback?.(item.visit!.id) : undefined}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
