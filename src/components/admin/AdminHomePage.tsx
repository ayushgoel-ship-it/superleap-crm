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
import { Region, getAggregatedRegionMetrics, getTLsByRegions } from '../../data/adminOrgMock';
import { scaleTLMetrics, scaleMetric, scalePercent } from '../../data/adminFilterHelpers';
import { computeMetrics, computeKAMMetrics } from '../../lib/metrics/metricsFromDB';
import { AdminCommonFilters } from './AdminCommonFilters';
import { useFilterScope } from '../../contexts/FilterContext';
import { resolveTimePeriodToRange, type DateRange } from '../../lib/time/resolveTimePeriodToRange';
import { useLoadingState } from '../premium/SkeletonLoader';
import { EmptyState } from '../premium/EmptyState';
import type { AdminPage } from '../../navigation';

interface AdminHomePageProps {
  onNavigate?: (page: AdminPage) => void;
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

export function AdminHomePage({ onNavigate }: AdminHomePageProps = {}) {
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

  // Get real metrics from metricsFromDB
  const currentMetrics = useMemo(() => computeMetrics(timePeriod), [timePeriod]);
  const lastMonthMetrics = useMemo(() => computeMetrics(TimePeriod.LAST_MONTH), []);

  // Scale metrics by time period - MEMOIZED
  const metrics = useMemo(() => ({
    si: currentMetrics.stockIns,
    siTarget: 150,
    i2si: currentMetrics.i2si,
    c2d: currentMetrics.conversionRate,
    dcfLeads: currentMetrics.dcfTotal,
    dcfOnb: currentMetrics.dcfTotal - currentMetrics.dcfDisbursals,
    dcfDisb: currentMetrics.dcfDisbursals,
    dcfGMV: currentMetrics.dcfDisbursedValue * 100000,
  }), [currentMetrics]);

  // Calculate trends using real LMTD data
  const trends = useMemo(() => ({
    si: calculateTrend(metrics.si, lastMonthMetrics.stockIns),
    i2si: calculateTrend(metrics.i2si, lastMonthMetrics.i2si),
    c2d: calculateTrend(metrics.c2d, lastMonthMetrics.conversionRate),
    gmv: calculateTrend(metrics.dcfGMV, lastMonthMetrics.dcfDisbursedValue * 100000),
    onb: calculateTrend(metrics.dcfOnb, lastMonthMetrics.dcfTotal - lastMonthMetrics.dcfDisbursals),
    disb: calculateTrend(metrics.dcfDisb, lastMonthMetrics.dcfDisbursals),
  }), [metrics, lastMonthMetrics]);

  // Get TL data from real KAM metrics - MEMOIZED
  const kamMetrics = useMemo(() => computeKAMMetrics(timePeriod), [timePeriod]);
  const sortedTLs = useMemo(() =>
    kamMetrics.map(km => ({
      tlId: km.kamId,
      tlName: km.kamName,
      region: 'NCR',
      siAch: km.stockIns,
      siTarget: 20,
      i2siPercent: km.i2si,
      dcfDisbValueAch: km.dcfDisbursedValue * 100000,
    })).sort((a, b) => (b.siAch / b.siTarget) - (a.siAch / a.siTarget)),
    [kamMetrics]
  );

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
              value={formatCompact(metrics.si)}
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
              title="C2D"
              value={formatPct(metrics.c2d)}
              trend={trends.c2d}
              accentColor="violet"
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
              value={formatCurrency(metrics.dcfGMV)}
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
                      onClick={() => console.log('Drill to TL:', tl.tlId)}
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
                            {tl.region} • Target: {formatCompact(tl.siTarget)}
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
                            <div className="font-bold text-slate-900 whitespace-nowrap">{formatCurrency(tl.dcfDisbValueAch)}</div>
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