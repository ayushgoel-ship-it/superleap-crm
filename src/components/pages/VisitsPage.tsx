/**
 * ACTIVITY PAGE — Calls + Visits Productivity Cockpit
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  DESIGN NOTE                                        │
 * │                                                     │
 * │  Activity = "What work happened / is happening?"    │
 * │  It complements Inbox ("What needs my attention?"). │
 * │                                                     │
 * │  Calls and Visits are shown in ONE chronological    │
 * │  feed so the KAM sees their full day/week without   │
 * │  context-switching. The productivity strip at top    │
 * │  instantly answers "am I on track?"                  │
 * │                                                     │
 * │  Feedback closure drives productivity:              │
 * │  Pending-feedback items get visual priority (indigo  │
 * │  left border + prominent CTA) to nudge the KAM      │
 * │  toward completing the feedback loop, which is the   │
 * │  key input for productivity measurement.             │
 * └─────────────────────────────────────────────────────┘
 */

import { useState, useMemo, useEffect } from 'react';
import { Phone, MapPin, Filter, AlertTriangle } from 'lucide-react';
import type { UserRole } from '../../lib/shared/appTypes';
import { useActivity, type CallAttempt, type Visit } from '../../contexts/ActivityContext';
import { CallActivityCard, VisitActivityCard } from '../activity/ActivityCard';
import { ProductivityStrip } from '../activity/ProductivityStrip';
import { EmptyState } from '../premium/EmptyState';
import { CardSkeleton } from '../premium/SkeletonLoader';
import { TLVisitsView } from '../visits/TLVisitsView';
import { TLCallsView } from '../calls/TLCallsView';
import { VisitsTabContent } from '../activity/VisitsTabContent';
import { toast } from 'sonner@2.0.3';

// ── Types ──

type ActivityFilter = 'all' | 'calls' | 'visits' | 'pending';
import { TimePeriod } from '../../lib/domain/constants';
import { getTimePeriodCutoffMs } from '../../lib/time/resolveTimePeriod';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';

/** A unified item that wraps either a call or a visit for the chronological feed. */
interface FeedItem {
  id: string;
  type: 'call' | 'visit';
  timestamp: number;   // epoch ms for sorting
  call?: CallAttempt;
  visit?: Visit;
}

// ── Props ──

interface VisitsPageProps {
  userRole: UserRole;
  onNavigateToLocationUpdate?: (dealerId: string) => void;
  onNavigateToCallFeedback?: (callId: string) => void;
  onNavigateToVisitFeedback?: (visitId: string) => void;
}

// ── Component ──

export function VisitsPage({
  userRole,
  onNavigateToLocationUpdate,
  onNavigateToCallFeedback,
  onNavigateToVisitFeedback,
}: VisitsPageProps) {

  // TL gets its own tabbed view (to be upgraded later)
  if (userRole === 'TL') {
    return <TLActivityView />;
  }

  // ── State ──
  const { calls, visits } = useActivity();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('visits');
  const [timeScope, setTimeScope] = useState<TimePeriod>(TimePeriod.LAST_7D);
  const [customFrom, setCustomFrom] = useState<string | undefined>(undefined);
  const [customTo, setCustomTo] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  // ── Time filtering ──
  const cutoff = useMemo(() => {
    return getTimePeriodCutoffMs(timeScope);
  }, [timeScope]);

  const filteredCalls = useMemo(
    () => calls.filter(c => new Date(c.timestamp).getTime() >= cutoff),
    [calls, cutoff]
  );
  const filteredVisits = useMemo(
    () => visits.filter(v => {
      const t = v.checkInTime || v.createdAt || v.scheduledTime;
      return t ? new Date(t).getTime() >= cutoff : false;
    }),
    [visits, cutoff]
  );

  // ── Unified feed ──
  const feed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    // 'pending' filter: only show calls with pending feedback
    if (activityFilter === 'pending') {
      for (const call of filteredCalls) {
        if (call.productiveStatus === 'pending' || call.status === 'pending-feedback') {
          items.push({ id: call.id, type: 'call', timestamp: new Date(call.timestamp).getTime(), call });
        }
      }
      items.sort((a, b) => b.timestamp - a.timestamp);
      return items;
    }

    if (activityFilter !== 'visits') {
      for (const call of filteredCalls) {
        items.push({ id: call.id, type: 'call', timestamp: new Date(call.timestamp).getTime(), call });
      }
    }
    if (activityFilter !== 'calls') {
      for (const visit of filteredVisits) {
        const t = visit.checkInTime || visit.createdAt || visit.scheduledTime;
        items.push({ id: visit.id, type: 'visit', timestamp: t ? new Date(t).getTime() : 0, visit });
      }
    }

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }, [filteredCalls, filteredVisits, activityFilter]);

  // ── Productivity KPIs ──
  const kpis = useMemo(() => {
    const totalCalls = filteredCalls.length;
    const connectedCalls = filteredCalls.filter(c => c.connected).length;
    const productivePct = totalCalls > 0 ? Math.round((filteredCalls.filter(c => c.productiveStatus === 'productive').length / totalCalls) * 100) : 0;
    const completedVisits = filteredVisits.filter(v => v.status === 'completed').length;
    const pendingFeedback = filteredCalls.filter(c => c.productiveStatus === 'pending' || c.status === 'pending-feedback').length;
    const callTarget = timeScope === TimePeriod.TODAY ? 8 : timeScope === TimePeriod.LAST_7D ? 50 : 120;
    const visitTarget = timeScope === TimePeriod.TODAY ? 2 : timeScope === TimePeriod.LAST_7D ? 12 : 30;

    return {
      totalCalls,
      connectedCalls,
      productivePct,
      completedVisits,
      pendingFeedback,
      callTarget,
      visitTarget,
    };
  }, [filteredCalls, filteredVisits, timeScope]);

  const hasActiveFilters = activityFilter !== 'all';

  // ── Handlers ──
  const handleCallFeedback = (callId: string) => {
    if (onNavigateToCallFeedback) onNavigateToCallFeedback(callId);
    else toast.info('Navigate to call feedback');
  };

  const handleVisitCheckIn = (visitId: string) => {
    toast.info('Check-in flow', { description: 'Opening check-in for this visit' });
  };

  const handleVisitSummary = (visitId: string) => {
    if (onNavigateToVisitFeedback) onNavigateToVisitFeedback(visitId);
    else toast.info('Navigate to visit summary');
  };

  const handleTimeScopeChange = (scope: TimePeriod) => {
    setTimeScope(scope);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 180);
  };

  // ── Render ──
  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">

      {/* ═══ HEADER ═══ */}
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-4 pb-3 space-y-3">
        {/* Title */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Activity</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Calls and visits across your dealers</p>
          </div>
        </div>

        {/* Activity filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
          {([
            { key: 'all' as ActivityFilter, label: 'All', count: feed.length, icon: undefined },
            { key: 'calls' as ActivityFilter, label: 'Calls', count: filteredCalls.length, icon: Phone },
            { key: 'visits' as ActivityFilter, label: 'Visits', count: filteredVisits.length, icon: MapPin },
          ]).map(({ key, label, count, icon: ItemIcon }) => (
            <button
              key={key}
              onClick={() => setActivityFilter(key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium
                whitespace-nowrap transition-all duration-150 min-h-[36px] flex-shrink-0
                ${activityFilter === key
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }
              `}
            >
              {ItemIcon && <ItemIcon className="w-3.5 h-3.5" />}
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                ${activityFilter === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}
              `}>
                {count}
              </span>
            </button>
          ))}

          {/* Pending pill — amber warning style, visually distinct */}
          {kpis.pendingFeedback > 0 && (
            <button
              onClick={() => setActivityFilter(activityFilter === 'pending' ? 'all' : 'pending')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold
                whitespace-nowrap transition-all duration-150 min-h-[36px] flex-shrink-0 active:scale-95
                ${activityFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-200 border border-amber-500'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                }
              `}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${activityFilter === 'pending' ? 'text-white' : 'text-amber-600'}`} />
              Pending
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${activityFilter === 'pending' ? 'bg-white/25 text-white' : 'bg-amber-200/70 text-amber-800'}
              `}>
                {kpis.pendingFeedback}
              </span>
            </button>
          )}
        </div>

        {/* Date scope filter — hidden when Visits tab is active */}
        {activityFilter !== 'visits' && (
          <TimeFilterControl
            mode="chips"
            chipStyle="pill"
            value={timeScope}
            onChange={(scope) => handleTimeScopeChange(scope)}
            options={CANONICAL_TIME_OPTIONS}
            labelOverrides={CANONICAL_TIME_LABELS}
            allowCustom
            customFrom={customFrom}
            customTo={customTo}
            onCustomRangeChange={({ fromISO, toISO }) => { setCustomFrom(fromISO); setCustomTo(toISO); }}
          />
        )}
      </div>

      {/* ═══ SCROLLABLE BODY ═══ */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Visits Tab: Dedicated layout with Start Visit, Suggested, Dealers, History ── */}
        {activityFilter === 'visits' ? (
          <VisitsTabContent
            onNavigateToVisitFeedback={onNavigateToVisitFeedback}
          />
        ) : (
        <>
        {/* ── Productivity Strip ── */}
        {!isLoading && (
          <div className="px-4 pt-3 pb-1 animate-fade-in">
            <ProductivityStrip
              items={[
                {
                  label: 'Calls',
                  value: `${kpis.totalCalls}`,
                  pct: Math.min(100, (kpis.totalCalls / kpis.callTarget) * 100),
                  barColor: 'bg-indigo-400',
                },
                {
                  label: 'Productive',
                  value: `${kpis.productivePct}%`,
                  pct: kpis.productivePct,
                  barColor: kpis.productivePct >= 50 ? 'bg-emerald-400' : 'bg-amber-400',
                },
                {
                  label: 'Visits',
                  value: `${kpis.completedVisits}`,
                  pct: Math.min(100, (kpis.completedVisits / kpis.visitTarget) * 100),
                  barColor: 'bg-sky-400',
                },
                {
                  label: 'Feedback',
                  value: kpis.pendingFeedback > 0 ? `${kpis.pendingFeedback}` : '\u2713',
                  pct: kpis.pendingFeedback > 0
                    ? Math.min(100, ((kpis.totalCalls - kpis.pendingFeedback) / Math.max(1, kpis.totalCalls)) * 100)
                    : 100,
                  barColor: kpis.pendingFeedback > 0 ? 'bg-amber-400' : 'bg-emerald-400',
                  accent: kpis.pendingFeedback > 0,
                },
              ]}
            />
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="px-4 pt-3 space-y-3 animate-fade-in">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && feed.length === 0 && (
          <EmptyState
            variant={hasActiveFilters ? 'filtered' : 'empty'}
            type="activity"
            title={activityFilter === 'calls' ? 'No calls yet' : activityFilter === 'visits' ? 'No visits yet' : undefined}
            actionLabel={!hasActiveFilters ? 'Start calling' : undefined}
            onAction={!hasActiveFilters ? () => toast.info('Open dealer list to make a call') : undefined}
            secondaryLabel={hasActiveFilters ? 'Show all activity' : undefined}
            onSecondary={hasActiveFilters ? () => setActivityFilter('all') : undefined}
          />
        )}

        {/* ── Feed ── */}
        {!isLoading && feed.length > 0 && (
          <div className="px-4 pt-2 pb-4 space-y-3 animate-fade-in">
            {feed.map((item) => {
              if (item.type === 'call' && item.call) {
                return (
                  <CallActivityCard
                    key={item.id}
                    call={item.call}
                    onAddFeedback={
                      (item.call.productiveStatus === 'pending' || item.call.status === 'pending-feedback')
                        ? () => handleCallFeedback(item.call!.id)
                        : undefined
                    }
                    onViewDetails={() => handleCallFeedback(item.call!.id)}
                  />
                );
              }
              if (item.type === 'visit' && item.visit) {
                return (
                  <VisitActivityCard
                    key={item.id}
                    visit={item.visit}
                    onCheckIn={item.visit.status === 'not-started' ? () => handleVisitCheckIn(item.visit!.id) : undefined}
                    onViewSummary={item.visit.status === 'completed' ? () => handleVisitSummary(item.visit!.id) : undefined}
                  />
                );
              }
              return null;
            })}
          </div>
        )}
        </>
        )}
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="py-2.5 px-4 glass-nav border-t border-slate-200/60 text-[11px] text-slate-400 text-center font-medium tracking-wide">
        {feed.length} activit{feed.length === 1 ? 'y' : 'ies'}
        {activityFilter !== 'all' && ` \u00b7 ${activityFilter}`}
      </div>
    </div>
  );
}

// ── TL wrapper (preserves existing TL views) ──

function TLActivityView() {
  const [activeSegment, setActiveSegment] = useState<'visits' | 'calls'>('visits');

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">
      <div className="glass-nav border-b border-slate-200/60">
        <div className="px-4 py-3">
          <h1 className="text-[17px] font-bold text-slate-900 tracking-tight mb-3">Activity</h1>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveSegment('visits')}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200
                ${activeSegment === 'visits' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              Visits
            </button>
            <button
              onClick={() => setActiveSegment('calls')}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200
                ${activeSegment === 'calls' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              Calls
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto animate-fade-in">
        {activeSegment === 'visits' ? <TLVisitsView /> : <TLCallsView />}
      </div>
    </div>
  );
}