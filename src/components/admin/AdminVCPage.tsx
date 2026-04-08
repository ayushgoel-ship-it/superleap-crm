/**
 * ADMIN V/C PAGE — Activity Command Center (Unified Filters)
 *
 * Uses AdminCommonFilters with single-select contract (time_period, region_id, tl_id)
 * Comprehensive activity insights: KAM breakdown, call outcomes, dealer coverage, activity log
 */

import { useState, useMemo } from 'react';
import { Phone, Car, Users, BarChart3, Activity, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { AdminCommonFilters } from './AdminCommonFilters';
import { useFilterScope } from '../../contexts/FilterContext';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { resolveTimePeriodToRange } from '../../lib/time/resolveTimePeriod';
import type { AdminPage } from '../../navigation';

interface AdminVCPageProps {
  onNavigate?: (page: AdminPage) => void;
}

export function AdminVCPage({ onNavigate }: AdminVCPageProps = {}) {
  const { state, setFilter, resetFilters } = useFilterScope('admin_activity');
  const [viewMode, setViewMode] = useState<'visits' | 'calls'>('visits');
  const [showKAMBreakdown, setShowKAMBreakdown] = useState(false);


  const timePeriod = state.time_period ?? TimePeriod.MTD;
  const regionId = state.region_id ?? null;
  const tlId = state.tl_id ?? null;

  // Compute comprehensive activity metrics
  const activityData = useMemo(() => {
    const db = getRuntimeDBSync();
    const { fromISO, toISO } = resolveTimePeriodToRange(timePeriod);
    const from = new Date(fromISO);
    const to = new Date(toISO);

    // Filter by time
    let calls = db.calls.filter(c => {
      if (!c.callDate) return false;
      const d = new Date(c.callDate);
      return d >= from && d < to;
    });
    let visits = db.visits.filter(v => {
      if (!v.visitDate) return false;
      const d = new Date(v.visitDate);
      return d >= from && d < to;
    });

    // Apply region filter
    if (regionId) {
      const regionDealerIds = new Set(db.dealers.filter(d => d.region === regionId).map(d => d.code));
      calls = calls.filter(c => regionDealerIds.has(c.dealerCode));
      visits = visits.filter(v => regionDealerIds.has(v.dealerCode));
    }

    // Apply TL filter
    if (tlId) {
      calls = calls.filter(c => c.tlId === tlId);
      visits = visits.filter(v => v.tlId === tlId);
    }

    const daysInPeriod = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));

    // === CALL METRICS ===
    const totalCalls = calls.length;
    const productiveCalls = calls.filter(c => c.isProductive).length;
    const connectedCalls = calls.filter(c => c.callStatus === 'CONNECTED').length;
    const attemptedCalls = calls.filter(c => c.callStatus === 'ATTEMPTED').length;
    const busyCalls = calls.filter(c => c.callStatus === 'BUSY').length;
    const notReachableCalls = calls.filter(c => c.callStatus === 'NOT_REACHABLE').length;
    const callbackCalls = calls.filter(c => c.callStatus === 'CALL_BACK').length;
    const uniqueDealersCalled = new Set(calls.map(c => c.dealerCode)).size;
    const uniqueKamsCalls = new Set(calls.map(c => c.kamId));

    // Call duration analysis
    const callsWithDuration = calls.filter(c => c.durationSec && c.durationSec > 0);
    const avgCallDurationSec = callsWithDuration.length > 0
      ? Math.round(callsWithDuration.reduce((s, c) => s + (c.durationSec || 0), 0) / callsWithDuration.length)
      : 0;
    const totalCallDurationMin = Math.round(callsWithDuration.reduce((s, c) => s + (c.durationSec || 0), 0) / 60);

    // Sentiment
    const callsWithSentiment = calls.filter(c => c.sentimentLabel);
    const positiveSentiment = callsWithSentiment.filter(c => c.sentimentLabel === 'Positive').length;
    const negativeSentiment = callsWithSentiment.filter(c => c.sentimentLabel === 'Negative').length;

    // === VISIT METRICS ===
    const totalVisits = visits.length;
    const productiveVisits = visits.filter(v => v.isProductive).length;
    const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;
    const plannedVisits = visits.filter(v => v.visitType === 'Planned').length;
    const unplannedVisits = visits.filter(v => v.visitType === 'Unplanned').length;
    const uniqueDealersVisited = new Set(visits.map(v => v.dealerCode)).size;
    const uniqueKamsVisits = new Set(visits.map(v => v.kamId));

    // Feedback compliance
    const visitsWithFeedback = visits.filter(v => v.feedbackStatus === 'SUBMITTED').length;
    const callsWithFeedback = calls.filter(c => c.feedbackStatus === 'SUBMITTED').length;

    const totalKAMs = Math.max(new Set([...uniqueKamsCalls, ...uniqueKamsVisits]).size, 1);

    // === TL BREAKDOWN ===
    // Scope TLs by region/tlId filter; show ALL TLs in scope (even zero-activity ones)
    const tlsInScope = (db.org?.tls || []).filter(tl => {
      if (tlId && tl.id !== tlId) return false;
      if (regionId && tl.region !== regionId) return false;
      return true;
    });

    const tlMap = new Map<string, {
      name: string; region: string; kamCount: number; kamIds: Set<string>;
      calls: number; visits: number; productiveCalls: number; productiveVisits: number;
      connectedCalls: number; uniqueDealers: Set<string>; totalDuration: number;
      totalDealers: number;
    }>();

    // Build kamId → tlId map for accurate call/visit attribution.
    // dealer.tlId may reference team_id, not the TL's user_id, so resolve via the org tree.
    const kamToTlMap = new Map<string, string>();
    (db.org?.tls || []).forEach(tl => {
      (tl.kams || []).forEach(k => kamToTlMap.set(k.id, tl.id));
    });

    tlsInScope.forEach(tl => {
      const kamIds = new Set((tl.kams || []).map(k => k.id));
      // Count total dealers in this TL's scope (respecting region filter)
      const tlDealers = db.dealers.filter(d => {
        if (!kamIds.has(d.kamId)) return false;
        if (regionId && d.region !== regionId) return false;
        return true;
      });
      tlMap.set(tl.id, {
        name: tl.name,
        region: tl.region,
        kamCount: kamIds.size,
        kamIds,
        calls: 0, visits: 0, productiveCalls: 0, productiveVisits: 0,
        connectedCalls: 0, uniqueDealers: new Set(), totalDuration: 0,
        totalDealers: tlDealers.length,
      });
    });

    calls.forEach(c => {
      const tlIdResolved = kamToTlMap.get(c.kamId) || c.tlId || '';
      const t = tlMap.get(tlIdResolved);
      if (!t) return;
      t.calls++;
      if (c.isProductive) t.productiveCalls++;
      if (c.callStatus === 'CONNECTED') t.connectedCalls++;
      t.uniqueDealers.add(c.dealerCode);
      t.totalDuration += c.durationSec || 0;
    });
    visits.forEach(v => {
      const tlIdResolved = kamToTlMap.get(v.kamId) || v.tlId || '';
      const t = tlMap.get(tlIdResolved);
      if (!t) return;
      t.visits++;
      if (v.isProductive) t.productiveVisits++;
      t.uniqueDealers.add(v.dealerCode);
    });

    const tlBreakdown = Array.from(tlMap.entries()).map(([id, d]) => ({
      tlId: id,
      tlName: d.name,
      region: d.region,
      kamCount: d.kamCount,
      totalCalls: d.calls,
      totalVisits: d.visits,
      productiveCalls: d.productiveCalls,
      productiveVisits: d.productiveVisits,
      connectedCalls: d.connectedCalls,
      uniqueDealers: d.uniqueDealers.size,
      totalDealers: d.totalDealers,
      coveragePercent: d.totalDealers > 0 ? Math.round((d.uniqueDealers.size / d.totalDealers) * 100) : 0,
      visitProdPercent: d.visits > 0 ? Math.round((d.productiveVisits / d.visits) * 100) : 0,
      callProdPercent: d.calls > 0 ? Math.round((d.productiveCalls / d.calls) * 100) : 0,
      connectRate: d.calls > 0 ? Math.round((d.connectedCalls / d.calls) * 100) : 0,
      avgCallDuration: d.calls > 0 ? Math.round(d.totalDuration / d.calls) : 0,
      visitsPerKamDay: d.kamCount > 0 ? Math.round((d.visits / d.kamCount / daysInPeriod) * 10) / 10 : 0,
      callsPerKamDay: d.kamCount > 0 ? Math.round((d.calls / d.kamCount / daysInPeriod) * 10) / 10 : 0,
    })).sort((a, b) => (b.totalCalls + b.totalVisits) - (a.totalCalls + a.totalVisits));

    // === DEALER COVERAGE ===
    const totalDealersInScope = (() => {
      let dealers = db.dealers;
      if (regionId) dealers = dealers.filter(d => d.region === regionId);
      if (tlId) {
        const tl = db.org?.tls?.find(t => t.id === tlId);
        const kamIds = new Set(tl?.kams?.map(k => k.id) || []);
        dealers = dealers.filter(d => kamIds.has(d.kamId));
      }
      return dealers.length;
    })();
    const dealersCovered = new Set([...calls.map(c => c.dealerCode), ...visits.map(v => v.dealerCode)]).size;

    return {
      // Call summary
      totalCalls, productiveCalls, connectedCalls, attemptedCalls, busyCalls, notReachableCalls, callbackCalls,
      uniqueDealersCalled, avgCallDurationSec, totalCallDurationMin,
      positiveSentiment, negativeSentiment, callsWithSentiment: callsWithSentiment.length,
      callsWithFeedback,
      productiveCallsPercent: totalCalls > 0 ? Math.round((productiveCalls / totalCalls) * 100) : 0,
      connectRate: totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0,
      callsPerKAMPerDay: Math.round((totalCalls / totalKAMs / daysInPeriod) * 10) / 10,
      // Visit summary
      totalVisits, productiveVisits, completedVisits, plannedVisits, unplannedVisits,
      uniqueDealersVisited, visitsWithFeedback,
      productiveVisitsPercent: totalVisits > 0 ? Math.round((productiveVisits / totalVisits) * 100) : 0,
      visitsPerKAMPerDay: Math.round((totalVisits / totalKAMs / daysInPeriod) * 10) / 10,
      // Shared
      totalKAMs, dealersCovered, totalDealersInScope,
      dealerCoveragePercent: totalDealersInScope > 0 ? Math.round((dealersCovered / totalDealersInScope) * 100) : 0,
      // Breakdowns
      tlBreakdown,
    };
  }, [timePeriod, regionId, tlId]);

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <AdminCommonFilters scope="admin_activity" />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Activity Command Center</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {!regionId ? 'All Regions' : regionId}
            {tlId && ' \u2022 TL Filtered'}
            {' \u2022 '}{activityData.totalKAMs} active KAMs
          </p>
        </div>

        {/* Segmented Control */}
        <div className="p-4 pb-0">
          <div className="bg-slate-100 rounded-xl p-1 flex">
            <button
              onClick={() => setViewMode('visits')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                viewMode === 'visits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Car className="w-3.5 h-3.5" /> Visits
            </button>
            <button
              onClick={() => setViewMode('calls')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                viewMode === 'calls' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> Calls
            </button>
          </div>
        </div>

        {/* === VISITS VIEW === */}
        {viewMode === 'visits' && (
          <div className="p-4 pb-20 space-y-3">
            {/* Primary Metrics */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: activityData.totalVisits, color: 'text-slate-900' },
                { label: 'Productive', value: activityData.productiveVisits, color: 'text-emerald-600' },
                { label: 'Completed', value: activityData.completedVisits, color: 'text-indigo-600' },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
                  <div className="text-xs text-slate-500">{m.label}</div>
                  <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Detailed Visit Metrics */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Visit Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Productive %</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activityData.productiveVisitsPercent}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-10 text-right">{activityData.productiveVisitsPercent}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Planned vs Unplanned</span>
                  <span className="text-sm font-bold text-slate-900">{activityData.plannedVisits} / {activityData.unplannedVisits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Visits per KAM/Day</span>
                  <span className="text-sm font-bold text-indigo-600">{activityData.visitsPerKAMPerDay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Unique Dealers Visited</span>
                  <span className="text-sm font-bold text-slate-900">{activityData.uniqueDealersVisited}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Feedback Submitted</span>
                  <span className="text-sm font-bold text-slate-900">{activityData.visitsWithFeedback} / {activityData.totalVisits}</span>
                </div>
              </div>
            </div>

            {/* Dealer Coverage */}
            <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dealer Coverage</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-indigo-600">{activityData.dealerCoveragePercent}%</span>
                <span className="text-xs text-slate-500">{activityData.dealersCovered} / {activityData.totalDealersInScope} dealers</span>
              </div>
              <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${activityData.dealerCoveragePercent}%` }} />
              </div>
            </div>

            {/* TL Performance Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button onClick={() => setShowKAMBreakdown(!showKAMBreakdown)} className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> TL Breakdown ({activityData.tlBreakdown.length})
                </h3>
                {showKAMBreakdown ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showKAMBreakdown && (
                <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                  {activityData.tlBreakdown.map(tl => (
                    <div key={tl.tlId} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800 truncate">{tl.tlName}</div>
                          <div className="text-xs text-slate-500">{tl.region} • {tl.kamCount} KAMs</div>
                        </div>
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{tl.coveragePercent}% cov</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
                          <div className="text-slate-500">Visits</div>
                          <div className="font-bold text-slate-900">{tl.totalVisits}</div>
                        </div>
                        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
                          <div className="text-slate-500">Prod%</div>
                          <div className="font-bold text-emerald-600">{tl.visitProdPercent}%</div>
                        </div>
                        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
                          <div className="text-slate-500">V/KAM/Day</div>
                          <div className="font-bold text-indigo-600">{tl.visitsPerKamDay}</div>
                        </div>
                        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
                          <div className="text-slate-500">Dealers</div>
                          <div className="font-bold text-slate-900">{tl.uniqueDealers}/{tl.totalDealers}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* === CALLS VIEW === */}
        {viewMode === 'calls' && (
          <div className="p-4 pb-20 space-y-3">
            {/* Primary Metrics */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: activityData.totalCalls, color: 'text-slate-900' },
                { label: 'Connected', value: activityData.connectedCalls, color: 'text-emerald-600' },
                { label: 'Productive', value: activityData.productiveCalls, color: 'text-indigo-600' },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
                  <div className="text-xs text-slate-500">{m.label}</div>
                  <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Call Outcome Distribution */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" /> Call Outcomes
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Connected', value: activityData.connectedCalls, color: 'bg-emerald-500' },
                  { label: 'Attempted', value: activityData.attemptedCalls, color: 'bg-amber-500' },
                  { label: 'Busy', value: activityData.busyCalls, color: 'bg-orange-400' },
                  { label: 'Not Reachable', value: activityData.notReachableCalls, color: 'bg-rose-400' },
                  { label: 'Callback', value: activityData.callbackCalls, color: 'bg-blue-400' },
                ].filter(o => o.value > 0).map(o => (
                  <div key={o.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{o.label}</span>
                      <span className="font-bold text-slate-900">{o.value} ({activityData.totalCalls > 0 ? Math.round((o.value / activityData.totalCalls) * 100) : 0}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${o.color} rounded-full`} style={{ width: `${activityData.totalCalls > 0 ? (o.value / activityData.totalCalls) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Call Metrics */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Call Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Connect Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activityData.connectRate}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-10 text-right">{activityData.connectRate}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Productive %</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${activityData.productiveCallsPercent}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-10 text-right">{activityData.productiveCallsPercent}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Calls per KAM/Day</span>
                  <span className="text-sm font-bold text-emerald-600">{activityData.callsPerKAMPerDay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Avg Call Duration</span>
                  <span className="text-sm font-bold text-slate-900">{formatDuration(activityData.avgCallDurationSec)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Talk Time</span>
                  <span className="text-sm font-bold text-slate-900">{activityData.totalCallDurationMin}m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Unique Dealers Called</span>
                  <span className="text-sm font-bold text-slate-900">{activityData.uniqueDealersCalled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Feedback Submitted</span>
                  <span className="text-sm font-bold text-slate-900">{activityData.callsWithFeedback} / {activityData.totalCalls}</span>
                </div>
              </div>
            </div>

            {/* Sentiment (if available) */}
            {activityData.callsWithSentiment > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Sentiment Analysis</h3>
                <div className="flex gap-3">
                  <div className="flex-1 text-center p-2 bg-emerald-50 rounded-xl">
                    <div className="text-xs text-emerald-600">Positive</div>
                    <div className="text-lg font-bold text-emerald-700">{activityData.positiveSentiment}</div>
                  </div>
                  <div className="flex-1 text-center p-2 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500">Neutral</div>
                    <div className="text-lg font-bold text-slate-700">{activityData.callsWithSentiment - activityData.positiveSentiment - activityData.negativeSentiment}</div>
                  </div>
                  <div className="flex-1 text-center p-2 bg-rose-50 rounded-xl">
                    <div className="text-xs text-rose-600">Negative</div>
                    <div className="text-lg font-bold text-rose-700">{activityData.negativeSentiment}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Dealer Coverage */}
            <div className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dealer Coverage (V+C)</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-emerald-600">{activityData.dealerCoveragePercent}%</span>
                <span className="text-xs text-slate-500">{activityData.dealersCovered} / {activityData.totalDealersInScope} dealers</span>
              </div>
              <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${activityData.dealerCoveragePercent}%` }} />
              </div>
            </div>

            {/* TL Performance Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button onClick={() => setShowKAMBreakdown(!showKAMBreakdown)} className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> TL Breakdown ({activityData.tlBreakdown.length})
                </h3>
                {showKAMBreakdown ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showKAMBreakdown && (
                <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                  {activityData.tlBreakdown.map(tl => (
                    <div key={tl.tlId} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800 truncate">{tl.tlName}</div>
                          <div className="text-xs text-slate-500">{tl.region} • {tl.kamCount} KAMs</div>
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{tl.connectRate}% conn</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
                          <div className="text-slate-500">Calls</div>
                          <div className="font-bold text-slate-900">{tl.totalCalls}</div>
                        </div>
                        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
                          <div className="text-slate-500">Prod%</div>
                          <div className="font-bold text-emerald-600">{tl.callProdPercent}%</div>
                        </div>
                        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
                          <div className="text-slate-500">Avg Dur</div>
                          <div className="font-bold text-slate-900">{formatDuration(tl.avgCallDuration)}</div>
                        </div>
                        <div className="text-center p-1.5 bg-slate-50 rounded-lg">
                          <div className="text-slate-500">C/KAM/Day</div>
                          <div className="font-bold text-indigo-600">{tl.callsPerKamDay}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
