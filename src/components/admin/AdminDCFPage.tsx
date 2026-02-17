/**
 * ADMIN DCF PAGE — Leader View (UNIFIED FILTERS + CORE METRICS)
 * 
 * Uses AdminCommonFilters component
 * Reads from FilterState contract: time_period, region_id, tl_id
 * TL Leaderboard with core DCF metrics: Leads, Disbursements, GMV, Onboarded, Active
 * Guaranteed reactivity with proper useMemo dependencies
 */

import { useMemo } from 'react';
import { IndianRupee, Users, TrendingUp } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { MOCK_TL_METRICS, getTLsByRegions, type Region } from '../../data/adminOrgMock';
import { scaleTLMetrics } from '../../data/adminFilterHelpers';
import { AdminCommonFilters } from './AdminCommonFilters';
import { useFilterScope } from '../../contexts/FilterContext';
import { resolveTimePeriodToRange, type DateRange } from '../../lib/time/resolveTimePeriodToRange';
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

  // Get TL metrics with time scaling - MEMOIZED
  const relevantTLs = useMemo(() => getTLsByRegions(selectedRegions), [selectedRegions]);
  const rawTLMetrics = useMemo(() => {
    let filtered = MOCK_TL_METRICS.filter(m => relevantTLs.some(tl => tl.tlId === m.tlId));
    // Apply TL filter if selected
    if (tlId) {
      filtered = filtered.filter(m => m.tlId === tlId);
    }
    return filtered;
  }, [relevantTLs, tlId]);
  
  const scaledTLMetrics = useMemo(() => scaleTLMetrics(rawTLMetrics, timePeriod), [rawTLMetrics, timePeriod]);

  // Aggregate top-level KPIs - MEMOIZED
  const aggregatedKPIs = useMemo(() => {
    const totalLeads = scaledTLMetrics.reduce((sum, m) => sum + m.dcfLeads, 0);
    const totalDisbCount = scaledTLMetrics.reduce((sum, m) => sum + m.dcfDisbursements, 0);
    const totalDisbValue = scaledTLMetrics.reduce((sum, m) => sum + m.dcfGMV, 0);
    const totalOnboarded = scaledTLMetrics.reduce((sum, m) => sum + m.dcfOnboardings, 0);

    // Active dealers: those with leads OR disbursements (estimate: unique dealers with activity)
    // For demo purposes, estimate as ~60% of onboarded
    const activeDealers = Math.round(totalOnboarded * 0.65);

    return {
      dcfLeads: totalLeads,
      disbursalsCount: totalDisbCount,
      disbursalsValue: totalDisbValue,
      onboardedDealers: totalOnboarded,
      activeDealers,
      conversionRate: totalLeads > 0 ? (totalDisbCount / totalLeads) * 100 : 0,
    };
  }, [scaledTLMetrics]);

  // Build TL Performance rows - MEMOIZED
  const tlPerformanceRows = useMemo<TLPerformance[]>(() => {
    return scaledTLMetrics.map(tl => {
      const leadsCount = tl.dcfLeads;
      const disbursedCount = tl.dcfDisbursements;
      const disbursedValue = tl.dcfGMV;
      const onboardedDealers = tl.dcfOnboardings;
      // Estimate active dealers as ~65% of onboarded for this TL
      const activeDealers = Math.round(onboardedDealers * 0.65);
      const conversionRate = leadsCount > 0 ? (disbursedCount / leadsCount) * 100 : 0;

      return {
        tlId: tl.tlId,
        tlName: tl.tlName,
        region: tl.region,
        leadsCount,
        disbursedCount,
        disbursedValue,
        onboardedDealers,
        activeDealers,
        conversionRate,
      };
    });
  }, [scaledTLMetrics]);

  // Sort by GMV (disbursedValue) desc, then by disbursedCount desc - MEMOIZED
  const sortedTLs = useMemo(() => {
    return [...tlPerformanceRows]
      .sort((a, b) => {
        if (b.disbursedValue !== a.disbursedValue) {
          return b.disbursedValue - a.disbursedValue;
        }
        return b.disbursedCount - a.disbursedCount;
      })
      .slice(0, 10); // Top 10
  }, [tlPerformanceRows]);

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