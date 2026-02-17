/**
 * ADMIN V/C PAGE — Activity Summary (Unified Filters)
 * 
 * Uses AdminCommonFilters with single-select contract (time_period, region_id, tl_id)
 * Clean SaaS look with visits/calls toggle
 * Short labels, no overflow, neutral styling
 */

import { useState, useMemo } from 'react';
import { Phone, Car, ChevronDown } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { MOCK_TL_METRICS, getTLsByRegions } from '../../data/adminOrgMock';
import { scaleTLMetrics } from '../../data/adminFilterHelpers';
import { AdminCommonFilters } from './AdminCommonFilters';
import { useFilterScope } from '../../contexts/FilterContext';
import { MetricCard } from '../cards/MetricCard';
import type { AdminPage } from '../../navigation';
import type { Region } from '../../data/adminOrgMock';

interface AdminVCPageProps {
  onNavigate?: (page: AdminPage) => void;
}

export function AdminVCPage({ onNavigate }: AdminVCPageProps = {}) {
  const { state, setFilter, resetFilters } = useFilterScope('admin_activity');
  const [viewMode, setViewMode] = useState<'visits' | 'calls'>('visits');
  const [expandedTL, setExpandedTL] = useState<string | null>(null);

  // Read single-select filter state (Admin contract)
  const timePeriod = state.time_period ?? TimePeriod.MTD;
  const regionId = state.region_id ?? null;
  const tlId = state.tl_id ?? null;

  // Convert to array format for existing helpers
  const selectedRegions = useMemo<Region[]>(() => {
    if (!regionId) return [];
    return [regionId as Region];
  }, [regionId]);

  // Get TLs for selected regions with time scaling - memoized
  const relevantTLs = useMemo(() => getTLsByRegions(selectedRegions), [selectedRegions]);
  const rawTLMetrics = useMemo(() => {
    let filtered = MOCK_TL_METRICS.filter(m => relevantTLs.some(tl => tl.tlId === m.tlId));
    if (tlId) {
      filtered = filtered.filter(m => m.tlId === tlId);
    }
    return filtered;
  }, [relevantTLs, tlId]);
  const relevantTLMetrics = useMemo(() => scaleTLMetrics(rawTLMetrics, timePeriod), [rawTLMetrics, timePeriod]);

  // Calculate aggregated metrics
  const avgMetrics = useMemo(() => ({
    visitsPerKAMPerDay: relevantTLMetrics.reduce((sum, m) => sum + m.visitsPerKAMPerDay, 0) / (relevantTLMetrics.length || 1),
    callsPerKAMPerDay: relevantTLMetrics.reduce((sum, m) => sum + m.callsPerKAMPerDay, 0) / (relevantTLMetrics.length || 1),
    topDealerCoverageVisitsL30: relevantTLMetrics.reduce((sum, m) => sum + m.topDealerCoverageVisitsL30, 0) / (relevantTLMetrics.length || 1),
    taggedDealerCoverageVisitsL30: relevantTLMetrics.reduce((sum, m) => sum + m.taggedDealerCoverageVisitsL30, 0) / (relevantTLMetrics.length || 1),
    overallDealerCoverageVisitsL30: relevantTLMetrics.reduce((sum, m) => sum + m.overallDealerCoverageVisitsL30, 0) / (relevantTLMetrics.length || 1),
    topDealerCoverageCallsL7: relevantTLMetrics.reduce((sum, m) => sum + m.topDealerCoverageCallsL7, 0) / (relevantTLMetrics.length || 1),
    taggedDealerCoverageCallsL7: relevantTLMetrics.reduce((sum, m) => sum + m.taggedDealerCoverageCallsL7, 0) / (relevantTLMetrics.length || 1),
    overallDealerCoverageCallsL7: relevantTLMetrics.reduce((sum, m) => sum + m.overallDealerCoverageCallsL7, 0) / (relevantTLMetrics.length || 1),
    productiveVisitsPercent: relevantTLMetrics.reduce((sum, m) => sum + m.productiveVisitsPercent, 0) / (relevantTLMetrics.length || 1),
    productiveCallsPercent: relevantTLMetrics.reduce((sum, m) => sum + m.productiveCallsPercent, 0) / (relevantTLMetrics.length || 1),
  }), [relevantTLMetrics]);

  // Mock breakup data
  const visitBreakup = {
    top: 2.1,
    tagged: 1.3,
    untagged: 0.8,
  };

  const callBreakup = {
    top: 6.5,
    tagged: 4.2,
    untagged: 1.8,
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <AdminCommonFilters scope="admin_activity" />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
            Visits & Calls
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
            {!regionId ? 'All Regions' : regionId}
            {tlId && ' \u2022 TL Filtered'}
          </p>
        </div>

        {/* Segmented Control */}
        <div className="p-4">
          <div className="bg-slate-100 rounded-xl p-1 flex">
            <button
              onClick={() => setViewMode('visits')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                viewMode === 'visits'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Visits
            </button>
            <button
              onClick={() => setViewMode('calls')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                viewMode === 'calls'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Calls
            </button>
          </div>
        </div>

        {/* Visits View */}
        {viewMode === 'visits' && (
          <div className="px-4 pb-20 space-y-3">
            {/* Coverage Metrics */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Visit Coverage (L30D)
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">TOP Dealers</span>
                    <span className="text-sm font-bold text-indigo-600">{avgMetrics.topDealerCoverageVisitsL30.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${avgMetrics.topDealerCoverageVisitsL30}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">Tagged</span>
                    <span className="text-sm font-bold text-emerald-600">{avgMetrics.taggedDealerCoverageVisitsL30.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${avgMetrics.taggedDealerCoverageVisitsL30}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">Overall</span>
                    <span className="text-sm font-bold text-slate-900">{avgMetrics.overallDealerCoverageVisitsL30.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-400 rounded-full"
                      style={{ width: `${avgMetrics.overallDealerCoverageVisitsL30}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visits per KAM per Day */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Visits per KAM per Day
              </h3>
              <div className="text-3xl font-bold text-indigo-600 mb-3">{avgMetrics.visitsPerKAMPerDay.toFixed(1)}</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">TOP dealers</span>
                  <span className="font-bold text-slate-900">{visitBreakup.top}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">Tagged</span>
                  <span className="font-bold text-slate-900">{visitBreakup.tagged}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">Untagged</span>
                  <span className="font-bold text-slate-900">{visitBreakup.untagged}</span>
                </div>
              </div>
            </div>

            {/* Productive Visits */}
            <MetricCard
              title="Productive Visits %"
              value={`${avgMetrics.productiveVisitsPercent.toFixed(1)}%`}
              status="neutral"
            />

            {/* TL Drill-down */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  TL Breakdown
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {relevantTLMetrics.map((tl) => (
                  <div key={tl.tlId}>
                    <button
                      onClick={() => setExpandedTL(expandedTL === tl.tlId ? null : tl.tlId)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-left min-w-0">
                        <div className="font-medium text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                          {tl.tlName}
                        </div>
                        <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                          {tl.region}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">{tl.visitsPerKAMPerDay.toFixed(1)}</div>
                          <div className="text-xs text-slate-500">visits/day</div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${
                          expandedTL === tl.tlId ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </button>
                    {expandedTL === tl.tlId && (
                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                        <div className="text-xs text-slate-500 mb-2">Coverage L30D</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-700">TOP</span>
                            <span className="font-medium text-slate-900">{tl.topDealerCoverageVisitsL30.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Tagged</span>
                            <span className="font-medium text-slate-900">{tl.taggedDealerCoverageVisitsL30.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Overall</span>
                            <span className="font-medium text-slate-900">{tl.overallDealerCoverageVisitsL30.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calls View */}
        {viewMode === 'calls' && (
          <div className="px-4 pb-20 space-y-3">
            {/* Coverage Metrics */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Connect Coverage (L7D)
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">TOP Dealers</span>
                    <span className="text-sm font-bold text-indigo-600">{avgMetrics.topDealerCoverageCallsL7.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${avgMetrics.topDealerCoverageCallsL7}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">Tagged</span>
                    <span className="text-sm font-bold text-emerald-600">{avgMetrics.taggedDealerCoverageCallsL7.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${avgMetrics.taggedDealerCoverageCallsL7}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">Overall</span>
                    <span className="text-sm font-bold text-slate-900">{avgMetrics.overallDealerCoverageCallsL7.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-400 rounded-full"
                      style={{ width: `${avgMetrics.overallDealerCoverageCallsL7}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calls per KAM per Day */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Calls per KAM per Day
              </h3>
              <div className="text-3xl font-bold text-emerald-600 mb-3">{avgMetrics.callsPerKAMPerDay.toFixed(1)}</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">TOP dealers</span>
                  <span className="font-bold text-slate-900">{callBreakup.top}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">Tagged</span>
                  <span className="font-bold text-slate-900">{callBreakup.tagged}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">Untagged</span>
                  <span className="font-bold text-slate-900">{callBreakup.untagged}</span>
                </div>
              </div>
            </div>

            {/* Productive Calls */}
            <MetricCard
              title="Productive Calls %"
              value={`${avgMetrics.productiveCallsPercent.toFixed(1)}%`}
              status="neutral"
            />

            {/* TL Drill-down */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  TL Breakdown
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {relevantTLMetrics.map((tl) => (
                  <div key={tl.tlId}>
                    <button
                      onClick={() => setExpandedTL(expandedTL === tl.tlId ? null : tl.tlId)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-left min-w-0">
                        <div className="font-medium text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                          {tl.tlName}
                        </div>
                        <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                          {tl.region}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">{tl.callsPerKAMPerDay.toFixed(1)}</div>
                          <div className="text-xs text-slate-500">calls/day</div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${
                          expandedTL === tl.tlId ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </button>
                    {expandedTL === tl.tlId && (
                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                        <div className="text-xs text-slate-500 mb-2">Coverage L7D</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-700">TOP</span>
                            <span className="font-medium text-slate-900">{tl.topDealerCoverageCallsL7.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Tagged</span>
                            <span className="font-medium text-slate-900">{tl.taggedDealerCoverageCallsL7.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Overall</span>
                            <span className="font-medium text-slate-900">{tl.overallDealerCoverageCallsL7.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
