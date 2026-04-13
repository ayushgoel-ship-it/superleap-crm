/**
 * ADMIN HOME PAGE — Leader Dashboard (UNIFIED FILTERS + PREMIUM VISUAL)
 * 
 * Uses AdminCommonFilters component
 * Reads from FilterState contract: time_period, region_id, tl_id
 * Guaranteed reactivity with proper useMemo dependencies
 * Visual elevation: gradients, colored borders, depth layers, micro-animations
 */

import { useMemo } from 'react';
import { Users, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { Region, getAggregatedRegionMetrics, getTLsByRegions } from '../../data/adminOrgData';
import { scaleTLMetrics, scaleMetric, scalePercent } from '../../data/adminFilterHelpers';
import { computeMetrics, computeKAMMetrics } from '../../lib/metrics/metricsFromDB';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { isDateInRange } from '../../lib/date/range';
import { AdminCommonFilters } from './AdminCommonFilters';
import { useFilterScope } from '../../contexts/FilterContext';
import { resolveTimePeriodToRange, type DateRange } from '../../lib/time/resolveTimePeriodToRange';
import { useLoadingState } from '../premium/SkeletonLoader';
import { EmptyState } from '../premium/EmptyState';
import { getSITarget } from '../../lib/metricsEngine';
import type { AdminPage } from '../../navigation';

interface AdminHomePageProps {
  onNavigate?: (page: AdminPage) => void;
  onViewTLDetail?: (tlId: string) => void;
}

// ── Shared Formatters ──

function formatCompact(num: number): string {
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 10000) return `${(num / 1000).toFixed(1)}K`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return Math.round(num).toString();
}

function formatPct(num: number): string {
  return `${num.toFixed(1)}%`;
}

function formatCurrency(num: number): string {
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${Math.round(num)}`;
}

// ── Trend Calculation ──

type TrendDir = 'up' | 'down';

function calculateTrend(current: number, lastMonth: number): { dir: TrendDir; value: string } | undefined {
  if (current === 0 || lastMonth === 0) return undefined;
  const diff = ((current - lastMonth) / lastMonth) * 100;
  if (Math.abs(diff) < 2) return undefined;
  return {
    dir: diff > 0 ? 'up' : 'down',
    value: `${Math.abs(diff).toFixed(0)}%`,
  };
}

// ── Premium Metric Card with Colored Border ──

interface PremiumMetricCardProps {
  title: string;
  value: string;
  trend?: { dir: TrendDir; value: string };
  accentColor: 'indigo' | 'emerald' | 'violet' | 'teal' | 'amber' | 'blue' | 'green';
  delay?: number;
}

function PremiumMetricCard({ title, value, trend, accentColor, delay = 0 }: PremiumMetricCardProps) {
  const borderColors = {
    indigo: 'border-l-indigo-500',
    emerald: 'border-l-emerald-500',
    violet: 'border-l-violet-500',
    teal: 'border-l-teal-500',
    amber: 'border-l-amber-500',
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
  };

  return (
    <div
      className={`
        bg-white rounded-2xl border border-slate-100 shadow-sm
        border-l-4 ${borderColors[accentColor]}
        hover:shadow-md hover:-translate-y-0.5
        transition-all duration-200
        animate-scale-in
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-4">
        <h4 className="text-xs font-medium text-slate-500 mb-2">{title}</h4>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight text-slate-900 transition-opacity duration-200">
            {value}
          </div>
          {trend && (
            <div
              className={`
                flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full
                ${trend.dir === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}
              `}
            >
              {trend.dir === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Visual Insight Card ──

interface InsightCardProps {
  label: string;
  value: string;
  direction: 'up' | 'down';
}

function InsightCard({ label, value, direction }: InsightCardProps) {
  return (
    <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${direction === 'up' ? 'bg-emerald-100' : 'bg-rose-100'}
        `}
      >
        {direction === 'up' ? (
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-rose-600" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-600">{label}</div>
        <div
          className={`
            text-sm font-semibold
            ${direction === 'up' ? 'text-emerald-600' : 'text-rose-600'}
          `}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function AdminHomePage({ onNavigate, onViewTLDetail }: AdminHomePageProps = {}) {
  const { state, resetFilters } = useFilterScope('admin_home');
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

  // Resolve KAM IDs in scope (based on region + TL filters)
  const scopedKamIds = useMemo(() => {
    const allTLs = getTLsByRegions(selectedRegions);
    // If TL is selected, only that TL's KAMs
    const tls = tlId ? allTLs.filter(t => t.tlId === tlId) : allTLs;
    // If no filters, return null (means all)
    if (!regionId && !tlId) return null;
    const ids = new Set<string>();
    tls.forEach(t => t.kams.forEach(k => ids.add(k.kamId)));
    return ids;
  }, [selectedRegions, tlId, regionId]);

  // Get real metrics from metricsFromDB — scoped by region/TL filter
  const currentMetrics = useMemo(() => {
    if (!scopedKamIds) return computeMetrics(timePeriod);
    // Aggregate metrics for all KAMs in scope
    const kamMetricsAll = computeKAMMetrics(timePeriod);
    const filtered = kamMetricsAll.filter(km => scopedKamIds.has(km.kamId));
    if (filtered.length === 0) return computeMetrics(timePeriod); // fallback to global if empty scope
    // Sum key metrics
    return {
      stockIns: filtered.reduce((s, km) => s + km.stockIns, 0),
      inspections: filtered.reduce((s, km) => s + km.inspections, 0),
      tokens: filtered.reduce((s, km) => s + km.tokens, 0),
      totalLeads: filtered.reduce((s, km) => s + km.totalLeads, 0),
      openLeads: filtered.reduce((s, km) => s + km.openLeads, 0),
      wonLeads: filtered.reduce((s, km) => s + km.wonLeads, 0),
      lostLeads: filtered.reduce((s, km) => s + km.lostLeads, 0),
      dcfTotal: filtered.reduce((s, km) => s + km.dcfTotal, 0),
      dcfOnboarded: filtered.reduce((s, km) => s + km.dcfOnboarded, 0),
      dcfDisbursals: filtered.reduce((s, km) => s + km.dcfDisbursals, 0),
      dcfDisbursedValue: filtered.reduce((s, km) => s + km.dcfDisbursedValue, 0),
      dcfInProgress: filtered.reduce((s, km) => s + km.dcfInProgress, 0),
      dcfApproved: filtered.reduce((s, km) => s + km.dcfApproved, 0),
      dcfRejected: filtered.reduce((s, km) => s + km.dcfRejected, 0),
      totalCalls: filtered.reduce((s, km) => s + km.totalCalls, 0),
      connectedCalls: filtered.reduce((s, km) => s + km.connectedCalls, 0),
      totalVisits: filtered.reduce((s, km) => s + km.totalVisits, 0),
      completedVisits: filtered.reduce((s, km) => s + km.completedVisits, 0),
      scheduledVisits: filtered.reduce((s, km) => s + km.scheduledVisits, 0),
      i2si: (() => { const si = filtered.reduce((s, km) => s + km.stockIns, 0); const insp = filtered.reduce((s, km) => s + km.inspections, 0); return insp > 0 ? Math.round((si / insp) * 1000) / 10 : 0; })(),
      conversionRate: (() => { const si = filtered.reduce((s, km) => s + km.stockIns, 0); const insp = filtered.reduce((s, km) => s + km.inspections, 0); return insp > 0 ? Math.round((si / insp) * 1000) / 10 : 0; })(),
      callConnectRate: (() => { const t = filtered.reduce((s, km) => s + km.totalCalls, 0); const c = filtered.reduce((s, km) => s + km.connectedCalls, 0); return t > 0 ? Math.round((c / t) * 100) : 0; })(),
      totalDealers: filtered.reduce((s, km) => s + km.totalDealers, 0),
      activeDealers: filtered.reduce((s, km) => s + km.activeDealers, 0),
      inactiveDealers: filtered.reduce((s, km) => s + km.inactiveDealers, 0),
      channelBreakdown: {},
      ragBreakdown: { green: 0, amber: 0, red: 0 },
      avgCallDuration: 0,
      uniqueDealersVisited: filtered.reduce((s, km) => s + km.uniqueDealersVisited, 0),
      uniqueDealersCalled: filtered.reduce((s, km) => s + km.uniqueDealersCalled, 0),
    };
  }, [timePeriod, scopedKamIds]);
  const lastMonthMetrics = useMemo(() => computeMetrics(TimePeriod.LAST_MONTH), []);

  // Scale metrics by time period - MEMOIZED
  const metrics = useMemo(() => {
    // NGS% = NGS stock-ins / NGS inspections (rank-based, NGS channel only)
    const db = getRuntimeDBSync();
    const { fromISO, toISO } = dateRange;
    const from = new Date(fromISO);
    const to = new Date(toISO);
    const allLeads = scopedKamIds
      ? db.leads.filter(l => scopedKamIds.has(l.kamId))
      : db.leads;
    const ngsLeads = allLeads.filter(l => l.channel === 'NGS');
    const ngsSI = ngsLeads.filter(l =>
      l.regStockinRank === 1 && (l.finalSiDate || l.stockinDate) && isDateInRange(l.finalSiDate || l.stockinDate, from, to)
    ).length;
    const ngsInsp = ngsLeads.filter(l =>
      l.regInspRank === 1 && l.inspectionDate && isDateInRange(l.inspectionDate, from, to)
    ).length;
    const ngs = ngsInsp > 0 ? Math.round((ngsSI / ngsInsp) * 1000) / 10 : 0;

    return {
      si: currentMetrics.stockIns,
      siTarget: getSITarget('TL'),
      i2si: currentMetrics.i2si,
      ngs,
      dcfLeads: currentMetrics.dcfTotal,
      dcfOnb: currentMetrics.dcfOnboarded,
      dcfDisb: currentMetrics.dcfDisbursals,
      dcfGMV: currentMetrics.dcfDisbursedValue,
    };
  }, [currentMetrics, dateRange, scopedKamIds]);

  // Calculate trends using real LMTD data
  const trends = useMemo(() => ({
    si: calculateTrend(metrics.si, lastMonthMetrics.stockIns),
    i2si: calculateTrend(metrics.i2si, lastMonthMetrics.i2si),
    ngs: calculateTrend(metrics.ngs, lastMonthMetrics.conversionRate),
    gmv: calculateTrend(metrics.dcfGMV, lastMonthMetrics.dcfDisbursedValue),
    onb: calculateTrend(metrics.dcfOnb, lastMonthMetrics.dcfOnboarded),
    disb: calculateTrend(metrics.dcfDisb, lastMonthMetrics.dcfDisbursals),
  }), [metrics, lastMonthMetrics]);

  // Get TL data from real KAM metrics - MEMOIZED
  const kamMetrics = useMemo(() => computeKAMMetrics(timePeriod), [timePeriod]);
  const sortedTLs = useMemo(() => {
    const tls = getTLsByRegions(selectedRegions);
    const allTLs = tls.map(tl => {
      // Find KAMs belonging to this TL
      const tlKamMetrics = kamMetrics.filter(km =>
        tl.kams.some(k => k.kamId === km.kamId)
      );
      const siAch = tlKamMetrics.reduce((sum, km) => sum + km.stockIns, 0);
      const inspections = tlKamMetrics.reduce((sum, km) => sum + km.inspections, 0);
      const i2si = inspections > 0 ? Math.round((siAch / inspections) * 1000) / 10 : 0;
      const gmv = tlKamMetrics.reduce((sum, km) => sum + km.dcfDisbursedValue, 0);
      return {
        tlId: tl.tlId,
        tlName: tl.tlName,
        region: tl.region,
        kamCount: tl.kams.length,
        siAch,
        siTarget: getSITarget('TL'),
        i2siPercent: i2si,
        dcfDisbValueAch: gmv,
      };
    }).sort((a, b) => (b.siAch / Math.max(b.siTarget, 1)) - (a.siAch / Math.max(a.siTarget, 1)));
    // FIX 4: If TL filter is selected, show only that TL
    if (tlId) {
      return allTLs.filter(tl => tl.tlId === tlId);
    }
    return allTLs;
  }, [kamMetrics, selectedRegions, tlId]);

  // Loading state
  if (loading.isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <AdminCommonFilters scope="admin_home" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (loading.isError) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <AdminCommonFilters scope="admin_home" />
        <EmptyState variant="error" type="general" onRetry={loading.reset} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header with gradient background strip */}
      <div className="relative">
        {/* Gradient background */}
        <div className="absolute inset-0 h-24 bg-gradient-to-b from-indigo-50/40 to-transparent pointer-events-none" />

        {/* Common Filter Bar */}
        <div className="relative">
          <AdminCommonFilters scope="admin_home" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Header with scope summary + accent underline */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                Business Overview
              </h1>
              {/* Accent underline */}
              <div className="w-12 h-0.5 bg-indigo-500 mt-1 mb-1.5 rounded-full" />
              <p className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
                Performance snapshot • {!regionId ? 'All Regions' : regionId}
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

        {/* KPI Grid with colored borders */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <PremiumMetricCard
              title="SI"
              value={`${formatCompact(metrics.si)} / ${formatCompact(metrics.siTarget)}`}
              trend={trends.si}
              accentColor="indigo"
              delay={0}
            />
            <PremiumMetricCard
              title="I2SI"
              value={formatPct(metrics.i2si)}
              trend={trends.i2si}
              accentColor="emerald"
              delay={50}
            />
            <PremiumMetricCard
              title="NGS"
              value={formatPct(metrics.ngs)}
              trend={trends.ngs}
              accentColor="blue"
              delay={100}
            />
            <PremiumMetricCard
              title="DCF Lds"
              value={formatCompact(metrics.dcfLeads)}
              accentColor="teal"
              delay={150}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PremiumMetricCard
              title="Onb"
              value={formatCompact(metrics.dcfOnb)}
              trend={trends.onb}
              accentColor="amber"
              delay={200}
            />
            <PremiumMetricCard
              title="Disb"
              value={formatCompact(metrics.dcfDisb)}
              trend={trends.disb}
              accentColor="blue"
              delay={250}
            />
            <PremiumMetricCard
              title="GMV"
              value={`₹${metrics.dcfGMV.toFixed(1)}L`}
              trend={trends.gmv}
              accentColor="green"
              delay={300}
            />
          </div>

          {/* What Moved - Visual Insight Cards */}
          {(trends.si || trends.i2si || trends.gmv) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-700">What Moved</h3>
                <div className="w-8 h-0.5 bg-slate-200 mt-1 rounded-full" />
              </div>
              <div className="space-y-2">
                {trends.si && (
                  <InsightCard label="SI" value={trends.si.value} direction={trends.si.dir} />
                )}
                {trends.i2si && (
                  <InsightCard label="I2SI" value={trends.i2si.value} direction={trends.i2si.dir} />
                )}
                {trends.gmv && (
                  <InsightCard label="GMV" value={trends.gmv.value} direction={trends.gmv.dir} />
                )}
              </div>
            </div>
          )}

          {/* TL Performance with Target % in table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                TL Performance ({sortedTLs.length})
              </h3>
            </div>

            {sortedTLs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  variant="filtered"
                  type="general"
                  secondaryLabel="Reset"
                  onSecondary={resetFilters}
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedTLs.map((tl) => {
                  const achPct = (tl.siAch / tl.siTarget) * 100;
                  const isOnTrack = achPct >= 95;

                  return (
                    <button
                      key={tl.tlId}
                      onClick={() => onViewTLDetail?.(tl.tlId)}
                      className="w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isOnTrack ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                          {achPct.toFixed(0)}%
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {tl.tlName}
                          </div>
                          <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                            {tl.region} • {tl.kamCount} KAMs • Target: {formatCompact(tl.siTarget)}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs flex-shrink-0">
                          <div className="text-right">
                            <div className="text-slate-500">SI</div>
                            <div className="font-bold text-slate-900 whitespace-nowrap">{formatCompact(tl.siAch)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-500">I2SI</div>
                            <div className="font-bold text-slate-900 whitespace-nowrap">{formatPct(tl.i2siPercent)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-500">GMV</div>
                            <div className="font-bold text-slate-900 whitespace-nowrap">{`₹${tl.dcfDisbValueAch.toFixed(1)}L`}</div>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom spacing for nav */}
        <div className="h-28"></div>
      </div>
    </div>
  );
}