/**
 * ADMIN DCF PAGE — Leader View (UNIFIED FILTERS + CORE METRICS)
 * 
 * Uses AdminCommonFilters component
 * Reads from FilterState contract: time_period, region_id, tl_id
 * TL Leaderboard with core DCF metrics: Leads, Disbursements, GMV, Onboarded, Active
 * Guaranteed reactivity with proper useMemo dependencies
 */

import { useState, useMemo } from 'react';
import { IndianRupee, Users, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { getTLsByRegions, type Region } from '../../data/adminOrgData';
import { scaleTLMetrics } from '../../data/adminFilterHelpers';
import { computeMetrics, computeKAMMetrics } from '../../lib/metrics/metricsFromDB';
import { AdminCommonFilters } from './AdminCommonFilters';
import { useFilterScope } from '../../contexts/FilterContext';
import { resolveTimePeriodToRange, type DateRange } from '../../lib/time/resolveTimePeriodToRange';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { MetricCard } from '../cards/MetricCard';
import { EmptyState } from '../premium/EmptyState';
import { useLoadingState } from '../premium/SkeletonLoader';
import type { AdminPage } from '../../navigation';

interface AdminDCFPageProps {
  onNavigate?: (page: AdminPage) => void;
}

// ── Shared Formatters ──

function formatCompact(num: number): string {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return Math.round(num).toString();
}

function formatCurrency(num: number): string {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${Math.round(num)}`;
}

function formatCount(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return Math.round(num).toString();
}

function formatPct(num: number): string {
  return `${num.toFixed(1)}%`;
}

// ── TL Performance Row Data ──

interface TLPerformance {
  tlId: string;
  tlName: string;
  region: string;
  leadsCount: number;
  disbursedCount: number;
  disbursedValue: number; // GMV
  onboardedDealers: number;
  activeDealers: number;
  conversionRate: number; // disbursed / leads %
}

export function AdminDCFPage({ onNavigate }: AdminDCFPageProps = {}) {
  const { state, setFilter, resetFilters } = useFilterScope('admin_dcf');
  const loading = useLoadingState('loaded');
  const [showStageFunnel, setShowStageFunnel] = useState(true);

  // Read filter state (Admin contract)
  const timePeriod = state.time_period ?? TimePeriod.MTD;
  const regionId = state.region_id ?? null;
  const tlId = state.tl_id ?? null;

  // Compute date range from time_period - MEMOIZED
  const dateRange = useMemo<DateRange>(() => {
    return resolveTimePeriodToRange(timePeriod);
  }, [timePeriod]);

  // Determine selected regions - MEMOIZED
  const selectedRegions = useMemo<Region[]>(() => {
    if (!regionId) return [];
    return [regionId as Region];
  }, [regionId]);

  // Get real metrics from metricsFromDB
  const currentMetrics = useMemo(() => computeMetrics(timePeriod), [timePeriod]);
  const kamMetrics = useMemo(() => computeKAMMetrics(timePeriod), [timePeriod]);

  // Aggregate top-level KPIs from real data
  const aggregatedKPIs = useMemo(() => {
    return {
      dcfLeads: currentMetrics.dcfTotal,
      disbursalsCount: currentMetrics.dcfDisbursals,
      disbursalsValue: currentMetrics.dcfDisbursedValue * 100000,
      onboardedDealers: currentMetrics.totalDealers,
      activeDealers: currentMetrics.uniqueDealersVisited,
      conversionRate: currentMetrics.dcfTotal > 0 ? (currentMetrics.dcfDisbursals / currentMetrics.dcfTotal) * 100 : 0,
    };
  }, [currentMetrics]);

  // Build TL Performance rows by aggregating KAMs under their actual TL
  const tlPerformanceRows = useMemo<TLPerformance[]>(() => {
    const tls = getTLsByRegions(selectedRegions);
    return tls.map(tl => {
      const tlKamMetrics = kamMetrics.filter(km => tl.kams.some(k => k.kamId === km.kamId));
      const dcfTotal = tlKamMetrics.reduce((s, km) => s + km.dcfTotal, 0);
      const dcfDisbursals = tlKamMetrics.reduce((s, km) => s + km.dcfDisbursals, 0);
      const dcfValue = tlKamMetrics.reduce((s, km) => s + km.dcfDisbursedValue * 100000, 0);
      return {
        tlId: tl.tlId,
        tlName: tl.tlName,
        region: tl.region,
        leadsCount: dcfTotal,
        disbursedCount: dcfDisbursals,
        disbursedValue: dcfValue,
        onboardedDealers: tlKamMetrics.reduce((s, km) => s + km.totalDealers, 0),
        activeDealers: tlKamMetrics.reduce((s, km) => s + km.uniqueDealersVisited, 0),
        conversionRate: dcfTotal > 0 ? (dcfDisbursals / dcfTotal) * 100 : 0,
      };
    }).filter(tl => tlId ? tl.tlId === tlId : true)
      .sort((a, b) => b.disbursedValue - a.disbursedValue);
  }, [kamMetrics, selectedRegions, tlId]);

  // Sort by GMV (disbursedValue) desc - MEMOIZED
  const sortedTLs = useMemo(() => {
    return [...tlPerformanceRows].slice(0, 10);
  }, [tlPerformanceRows]);

  // DCF Stage Funnel — shows files stuck at each stage by team
  const stageFunnel = useMemo(() => {
    const db = getRuntimeDBSync();
    let dcfLeads = db.dcfLeads || [];

    // Apply region/TL filters
    if (regionId) {
      const regionDealerCodes = new Set(db.dealers.filter(d => d.region === regionId).map(d => d.code));
      dcfLeads = dcfLeads.filter(d => regionDealerCodes.has(d.dealerCode));
    }
    if (tlId) {
      dcfLeads = dcfLeads.filter(d => d.tlId === tlId);
    }

    // Only non-disbursed, non-rejected (in-progress files)
    const activeFiles = dcfLeads.filter(d => d.overallStatus !== 'disbursed' && d.overallStatus !== 'rejected');

    // Group by currentFunnel (stage)
    const stageMap = new Map<string, { count: number; totalValue: number; redCount: number; amberCount: number; byTeam: Map<string, number> }>();
    activeFiles.forEach(f => {
      const stage = f.currentFunnel || f.currentSubStage || 'Unknown';
      if (!stageMap.has(stage)) stageMap.set(stage, { count: 0, totalValue: 0, redCount: 0, amberCount: 0, byTeam: new Map() });
      const s = stageMap.get(stage)!;
      s.count++;
      s.totalValue += f.loanAmount || 0;
      if (f.ragStatus === 'red') s.redCount++;
      if (f.ragStatus === 'amber') s.amberCount++;
      const team = f.conversionOwner || f.kamName || 'Unassigned';
      s.byTeam.set(team, (s.byTeam.get(team) || 0) + 1);
    });

    return Array.from(stageMap.entries())
      .map(([stage, data]) => ({
        stage,
        count: data.count,
        totalValue: data.totalValue,
        redCount: data.redCount,
        amberCount: data.amberCount,
        greenCount: data.count - data.redCount - data.amberCount,
        topTeams: Array.from(data.byTeam.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count })),
      }))
      .sort((a, b) => b.count - a.count);
  }, [regionId, tlId]);

  // Rejected summary
  const rejectedSummary = useMemo(() => {
    const db = getRuntimeDBSync();
    let dcfLeads = db.dcfLeads || [];
    if (regionId) {
      const regionDealerCodes = new Set(db.dealers.filter(d => d.region === regionId).map(d => d.code));
      dcfLeads = dcfLeads.filter(d => regionDealerCodes.has(d.dealerCode));
    }
    if (tlId) dcfLeads = dcfLeads.filter(d => d.tlId === tlId);
    const rejected = dcfLeads.filter(d => d.overallStatus === 'rejected');
    return { count: rejected.length, value: rejected.reduce((s, d) => s + (d.loanAmount || 0), 0) };
  }, [regionId, tlId]);

  // Handle TL drill-down
  const handleTLClick = (tlIdToFilter: string) => {
    // Apply TL filter to current scope
    setFilter({ tl_id: tlIdToFilter });
  };

  // Loading state
  if (loading.isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <AdminCommonFilters scope="admin_dcf" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (loading.isError) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <AdminCommonFilters scope="admin_dcf" />
        <EmptyState variant="error" type="general" onRetry={loading.reset} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Common Filter Bar */}
      <AdminCommonFilters scope="admin_dcf" />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                DCF Business
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
                {!regionId ? 'All Regions' : regionId}
                {tlId && ' • TL Filtered'}
              </p>
            </div>
            {(regionId || tlId) && (
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Onboarded"
              value={formatCount(aggregatedKPIs.onboardedDealers)}
              subtitle="dealers"
              status="neutral"
            />
            <MetricCard
              title="Active"
              value={formatCount(aggregatedKPIs.activeDealers)}
              subtitle="dealers"
              status="neutral"
            />
            <MetricCard
              title="DCF Lds"
              value={formatCount(aggregatedKPIs.dcfLeads)}
              status="neutral"
            />
            <MetricCard
              title="Conv Rate"
              value={formatPct(aggregatedKPIs.conversionRate)}
              status="neutral"
            />
          </div>

          {/* Disbursals — Highlight Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Disbursals
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-600 mb-1">Count</div>
                <div className="text-2xl font-bold text-emerald-600">{formatCount(aggregatedKPIs.disbursalsCount)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-600 mb-1">GMV</div>
                <div className="text-2xl font-bold text-emerald-600">{formatCompact(aggregatedKPIs.disbursalsValue)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage-wise Funnel Summary */}
        <div className="px-4 pb-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => setShowStageFunnel(!showStageFunnel)} className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                Pipeline by Stage ({stageFunnel.reduce((s, f) => s + f.count, 0)} files)
              </h3>
              {showStageFunnel ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {showStageFunnel && (
              <div className="divide-y divide-slate-50">
                {stageFunnel.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400 text-center">No active files in pipeline</div>
                ) : (
                  stageFunnel.map(s => (
                    <div key={s.stage} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{s.stage}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-bold text-slate-700">{s.count}</span>
                        </div>
                        <span className="text-xs text-slate-500">{formatCurrency(s.totalValue)}</span>
                      </div>
                      {/* RAG status bar */}
                      <div className="flex gap-1 mb-2">
                        {s.redCount > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-xs">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span className="font-medium text-rose-700">{s.redCount} red</span>
                          </div>
                        )}
                        {s.amberCount > 0 && (
                          <div className="px-1.5 py-0.5 rounded bg-amber-50 text-xs font-medium text-amber-700">{s.amberCount} amber</div>
                        )}
                        {s.greenCount > 0 && (
                          <div className="px-1.5 py-0.5 rounded bg-emerald-50 text-xs font-medium text-emerald-700">{s.greenCount} green</div>
                        )}
                      </div>
                      {/* Top teams with files stuck */}
                      <div className="flex flex-wrap gap-1">
                        {s.topTeams.map(t => (
                          <span key={t.name} className="px-2 py-0.5 rounded-full bg-indigo-50 text-xs text-indigo-700">
                            {t.name}: {t.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                {/* Rejected summary */}
                {rejectedSummary.count > 0 && (
                  <div className="px-4 py-3 bg-rose-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-rose-700">Rejected</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-xs font-bold text-rose-700">{rejectedSummary.count}</span>
                      </div>
                      <span className="text-xs text-rose-600">{formatCurrency(rejectedSummary.value)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TL Leaderboard */}
        <div className="px-4 pb-20">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                TL Leaderboard (DCF)
              </h3>
              <div className="text-xs text-slate-400">Sorted by: GMV</div>
            </div>

            {sortedTLs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  variant="filtered"
                  type="general"
                  primaryLabel="No DCF activity for selected filters"
                  secondaryLabel="Reset"
                  onSecondary={resetFilters}
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedTLs.map((tl, index) => {
                  const rankBadgeColor =
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-100 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-indigo-50 text-indigo-600';

                  return (
                    <button
                      key={tl.tlId}
                      onClick={() => handleTLClick(tl.tlId)}
                      className="w-full p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      {/* Top Row: Rank + Name + GMV */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Rank Badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${rankBadgeColor}`}>
                            #{index + 1}
                          </div>

                          {/* TL Name + Region */}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                              {tl.tlName}
                            </div>
                            <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                              {tl.region}
                            </div>
                          </div>
                        </div>

                        {/* GMV (Primary Metric) */}
                        <div className="text-right">
                          <div className="text-base font-bold text-emerald-600 whitespace-nowrap">
                            {formatCompact(tl.disbursedValue)}
                          </div>
                          <div className="text-xs text-slate-500 whitespace-nowrap">
                            Disb: {formatCount(tl.disbursedCount)} | Leads: {formatCount(tl.leadsCount)}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Micro Metrics Grid */}
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="text-slate-500">Onb</div>
                          <div className="font-semibold text-slate-900">{formatCount(tl.onboardedDealers)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Active</div>
                          <div className="font-semibold text-slate-900">{formatCount(tl.activeDealers)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Conv</div>
                          <div className="font-semibold text-slate-900">{formatPct(tl.conversionRate)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}