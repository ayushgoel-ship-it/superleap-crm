/**
 * TLActivityShell — TL-role view in the rebuilt Activity module.
 *
 * Layout (no pinned StartVisit per F6):
 *   • KAM dropdown (defaults to All KAMs)
 *   • TimeFilterControl
 *   • DealerFilterBar (canonical 3-flag)
 *   • Calls/Visits toggle
 *   • ActivitySummaryStrip (6 metrics)
 *   • ActivityListView (chronological feed)
 *
 * KAM list source (F7 default): users table via existing getKAMsByTL selector,
 * which currently sources from runtime ORG (canonical dealer ownership).
 */

import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { TimePeriod } from '../../lib/domain/constants';
import { resolveTimePeriodToRange } from '../../lib/time/resolveTimePeriod';
import {
  TimeFilterControl,
  CANONICAL_TIME_OPTIONS,
  CANONICAL_TIME_LABELS,
} from '../filters/TimeFilterControl';
import { DealerFilterBar } from './DealerFilterBar';
import {
  DEFAULT_DEALER_FILTER,
  type DealerFilterState,
  buildInspectingDealerKeys,
  buildActiveDealerKeys,
  applyDealerFilter,
} from '../../lib/activity/dealerActivityFilter';
import { ActivitySummaryStrip } from './ActivitySummaryStrip';
import { ActivityListView } from './ActivityListView';
import {
  computeActivityMetrics,
  filterCallsByRange,
  filterVisitsByRange,
  daysInRange,
} from '../../lib/metrics/activityMetrics';
import { useActivity } from '../../contexts/ActivityContext';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { getKAMsByTL, getDealersByKAM, getAllDealers, getAllTLs as getAllTLsList } from '../../data/selectors';

interface Props {
  /** Pre-filtered KAM list when invoked from AdminActivityShell. Defaults to TL's KAMs. */
  kamIdsOverride?: string[];
  /** Hide the title row when embedded inside the Admin shell. */
  embedded?: boolean;
  onNavigateToCallFeedback?: (callId: string) => void;
  onNavigateToVisitFeedback?: (visitId: string) => void;
}

export function TLActivityShell({
  kamIdsOverride,
  embedded = false,
  onNavigateToCallFeedback,
  onNavigateToVisitFeedback,
}: Props) {
  const { activeActor } = useAuth();
  const tlId = activeActor?.userId || '';

  const allKams = useMemo(() => {
    if (kamIdsOverride !== undefined) {
      // Admin cascade: take all KAMs whose id appears in the override list,
      // regardless of who the logged-in actor is.
      const allTls = getAllTLsList();
      const flat = allTls.flatMap((t) => t.kams);
      return flat.filter((k) => kamIdsOverride.includes(k.id));
    }
    return getKAMsByTL(tlId);
  }, [tlId, kamIdsOverride]);

  const [selectedKamId, setSelectedKamId] = useState<string>('all');
  const [timeScope, setTimeScope] = useState<TimePeriod>(TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useState<string | undefined>(undefined);
  const [customTo, setCustomTo] = useState<string | undefined>(undefined);
  const [dealerFilter, setDealerFilter] = useState<DealerFilterState>(DEFAULT_DEALER_FILTER);
  const [mode, setMode] = useState<'all' | 'calls' | 'visits'>('all');

  const visibleKamIds = useMemo(() => {
    if (selectedKamId === 'all') return allKams.map((k) => k.id);
    return [selectedKamId];
  }, [allKams, selectedKamId]);

  const range = useMemo(() => {
    const r = resolveTimePeriodToRange(timeScope, new Date(), customFrom, customTo);
    return { from: new Date(r.fromISO).getTime(), to: new Date(r.toISO).getTime() };
  }, [timeScope, customFrom, customTo]);

  const { calls, visits } = useActivity();

  // Scope by KAM via dealer ownership: a call/visit belongs to a KAM if its
  // dealerId resolves to a dealer owned by that KAM. Use the runtimeDB dealer
  // ownership index for hierarchy correctness.
  const scopedCalls = useMemo(() => {
    const dealerIds = new Set(visibleKamIds.flatMap((id) => getDealersByKAM(id).map((d) => d.id)));
    return filterCallsByRange(calls, range.from, range.to).filter((c) => dealerIds.has(c.dealerId));
  }, [calls, range, visibleKamIds]);

  const scopedVisits = useMemo(() => {
    const dealerIds = new Set(visibleKamIds.flatMap((id) => getDealersByKAM(id).map((d) => d.id)));
    return filterVisitsByRange(visits, range.from, range.to).filter((v) => dealerIds.has(v.dealerId));
  }, [visits, range, visibleKamIds]);

  const inspectingKeys = useMemo(() => {
    try {
      return buildInspectingDealerKeys(getRuntimeDBSync().leads);
    } catch {
      return new Set<string>();
    }
  }, []);

  // Active-dealer keys are scoped to the visible KAM set so the Activity (30d)
  // filter respects hierarchy.
  const activeKeys = useMemo(() => {
    const dealerIds = new Set(visibleKamIds.flatMap((id) => getDealersByKAM(id).map((d) => d.id)));
    const scopedCallsAll = calls.filter((c) => dealerIds.has(c.dealerId));
    const scopedVisitsAll = visits.filter((v) => dealerIds.has(v.dealerId));
    return buildActiveDealerKeys(scopedCallsAll, scopedVisitsAll);
  }, [calls, visits, visibleKamIds]);

  const filteredScopeDealers = useMemo(() => {
    const base = visibleKamIds.length > 0
      ? visibleKamIds.flatMap((id) => getDealersByKAM(id))
      : getAllDealers();
    return applyDealerFilter({
      dealers: base,
      filter: dealerFilter,
      inspectingKeys,
      activeKeys,
      kamScopeId: selectedKamId === 'all' ? undefined : selectedKamId,
    });
  }, [visibleKamIds, dealerFilter, inspectingKeys, activeKeys, selectedKamId]);

  const numberOfDays = useMemo(() => daysInRange(range.from, range.to), [range]);

  const filteredDealerIds = useMemo(() => new Set(filteredScopeDealers.map((d) => d.id)), [filteredScopeDealers]);
  const callsForFeed = useMemo(
    () => scopedCalls.filter((c) => filteredDealerIds.has(c.dealerId)),
    [scopedCalls, filteredDealerIds],
  );
  const visitsForFeed = useMemo(
    () => scopedVisits.filter((v) => filteredDealerIds.has(v.dealerId)),
    [scopedVisits, filteredDealerIds],
  );

  const metrics = useMemo(
    () => computeActivityMetrics({
      calls: callsForFeed,
      visits: visitsForFeed,
      scopeDealerCount: filteredScopeDealers.length,
      numberOfDays,
    }),
    [callsForFeed, visitsForFeed, filteredScopeDealers, numberOfDays],
  );

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">
      {!embedded && (
        <div className="glass-nav border-b border-slate-200/60 px-4 pt-4 pb-2">
          <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Activity</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Team-wide calls & visits</p>
        </div>
      )}

      <div className="px-4 pt-3 pb-2 space-y-3 bg-white/60 border-b border-slate-100">
        {/* KAM dropdown (defaults to All KAMs) */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">KAM</label>
          <select
            value={selectedKamId}
            onChange={(e) => setSelectedKamId(e.target.value)}
            className="text-[12px] font-medium px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="all">All KAMs ({allKams.length})</option>
            {allKams.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
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

        <DealerFilterBar value={dealerFilter} onChange={setDealerFilter} />

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {(['all', 'calls', 'visits'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize
                ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {m}
            </button>
          ))}
        </div>

        <ActivitySummaryStrip metrics={metrics} scopeDealerCount={filteredScopeDealers.length} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6">
        <ActivityListView
          calls={callsForFeed}
          visits={visitsForFeed}
          mode={mode}
          onCallClick={onNavigateToCallFeedback}
          onVisitClick={onNavigateToVisitFeedback}
        />
      </div>
    </div>
  );
}
