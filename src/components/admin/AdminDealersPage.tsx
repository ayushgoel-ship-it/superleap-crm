/**
 * ADMIN DEALERS PAGE — Leader View (Unified Filters)
 * 
 * Uses AdminCommonFilters with single-select contract (time_period, region_id, tl_id)
 * Clean SaaS look with compact KPI strip + dealer list
 * Short labels, no overflow, neutral styling
 */

import { useState, useMemo } from 'react';
import { Users, Activity, Check, Inbox } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { Region, getTLsByRegions } from '../../data/adminOrgMock';
import {
  ADMIN_DEALER_DATA,
  filterAdminDealers,
  computeDealerKPIs,
  type AdminDealerFilters,
} from '../../data/adminFilterHelpers';
import { AdminCommonFilters } from './AdminCommonFilters';
import { useFilterScope } from '../../contexts/FilterContext';
import { MetricCard } from '../cards/MetricCard';
import { EmptyState } from '../premium/EmptyState';
import type { AdminPage } from '../../navigation';

interface AdminDealersPageProps {
  onNavigate?: (page: AdminPage) => void;
}

export function AdminDealersPage({ onNavigate }: AdminDealersPageProps = {}) {
  const { state, setFilter, resetFilters } = useFilterScope('admin_dealers');

  // Read single-select filter state (Admin contract)
  const timePeriod = state.time_period ?? TimePeriod.MTD;
  const regionId = state.region_id ?? null;
  const tlId = state.tl_id ?? null;

  // Convert to array format for existing filter helpers
  const selectedRegions = useMemo<Region[]>(() => {
    if (!regionId) return [];
    return [regionId as Region];
  }, [regionId]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dormant'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'top' | 'tagged' | 'untagged'>('all');

  const handleReset = () => {
    resetFilters();
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  // Apply filters
  const filteredDealers = useMemo(() => {
    const filters: AdminDealerFilters = {
      regions: selectedRegions,
      tlId: tlId || '',
      status: statusFilter,
      category: categoryFilter,
    };
    return filterAdminDealers(filters);
  }, [selectedRegions, tlId, statusFilter, categoryFilter]);

  // Compute KPIs
  const kpis = useMemo(() => {
    return computeDealerKPIs(filteredDealers);
  }, [filteredDealers]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const isFiltered = regionId || tlId || statusFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <AdminCommonFilters scope="admin_dealers" />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
            Dealer Activity
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
            {!regionId ? 'All Regions' : regionId}
            {tlId && ' \u2022 TL Filtered'}
            {' \u2022 '}{filteredDealers.length} dealers
          </p>
        </div>

        {/* KPI Strip — Compact MetricCards */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Total"
              value={formatNumber(kpis.totalDealers)}
              status="neutral"
            />
            <MetricCard
              title="Active"
              value={formatNumber(kpis.activeDealers)}
              status="neutral"
            />
            <MetricCard
              title="Lead Giving"
              value={formatNumber(kpis.leadGivingDealers)}
              status="neutral"
            />
            <MetricCard
              title="Inspecting"
              value={formatNumber(kpis.inspectingDealers)}
              status="neutral"
            />
            <MetricCard
              title="Transacting"
              value={formatNumber(kpis.transactingDealers)}
              status="neutral"
            />
            <MetricCard
              title="I\u2192T %"
              value={`${kpis.inspToTransPercent}%`}
              status="neutral"
            />
          </div>

          {/* Highlight card */}
          <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Inspecting TOP %
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {kpis.inspectingTopDealersPercent}%
                </div>
              </div>
              <div className="text-xs text-slate-500 text-right">
                Quality<br />indicator
              </div>
            </div>
          </div>
        </div>

        {/* Local Filters */}
        <div className="px-4 pb-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Status
              </div>
              <div className="flex gap-2">
                {(['all', 'active', 'dormant'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap ${
                      statusFilter === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Category
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'top', 'tagged', 'untagged'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap ${
                      categoryFilter === c
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dealer List */}
        <div className="px-4 pb-20 space-y-3">
          {filteredDealers.length === 0 ? (
            <EmptyState
              variant="filtered"
              type="general"
              secondaryLabel="Reset"
              onSecondary={handleReset}
            />
          ) : (
            filteredDealers.map((dealer) => (
              <div key={dealer.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                        {dealer.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                        dealer.category === 'TOP'
                          ? 'bg-amber-100 text-amber-700'
                          : dealer.category === 'TAGGED'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {dealer.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
                      {dealer.city} &bull; {dealer.region} &bull; TL: {dealer.tlName}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                    dealer.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {dealer.status}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Leads</div>
                    <div className="text-base font-bold text-slate-900">{dealer.leads}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Insp</div>
                    <div className="text-base font-bold text-slate-900">{dealer.insp}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">SI</div>
                    <div className="text-base font-bold text-slate-900">{dealer.si}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">DCF</div>
                    <div className="text-base font-bold text-slate-900">{dealer.dcf}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  {dealer.visitedL30 && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="w-3 h-3" />
                      <span>Visited L30</span>
                    </div>
                  )}
                  {dealer.calledL7 && (
                    <div className="flex items-center gap-1 text-xs text-indigo-600">
                      <Check className="w-3 h-3" />
                      <span>Called L7</span>
                    </div>
                  )}
                  {!dealer.visitedL30 && !dealer.calledL7 && (
                    <span className="text-xs text-slate-400">No recent engagement</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
