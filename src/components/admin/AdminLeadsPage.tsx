/**
 * ADMIN LEADS PAGE — Leader View (Unified Filters)
 * 
 * Uses AdminCommonFilters with single-select contract (time_period, region_id, tl_id)
 * Clean SaaS look with compact KPI strip + lead list
 * Short labels, no overflow, neutral styling
 */

import { useState, useMemo } from 'react';
import { FileText, PieChart, Inbox } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { Region, getTLsByRegions } from '../../data/adminOrgMock';
import {
  ADMIN_LEAD_DATA,
  filterAdminLeads,
  computeLeadKPIs,
  computeChannelBreakdown,
  type AdminLeadFilters,
} from '../../data/adminFilterHelpers';
import { AdminCommonFilters } from './AdminCommonFilters';
import { useFilterScope } from '../../contexts/FilterContext';
import { MetricCard } from '../cards/MetricCard';
import { EmptyState } from '../premium/EmptyState';
import type { AdminPage } from '../../navigation';

interface AdminLeadsPageProps {
  onNavigate?: (page: AdminPage) => void;
}

export function AdminLeadsPage({ onNavigate }: AdminLeadsPageProps = {}) {
  const { state, setFilter, resetFilters } = useFilterScope('admin_leads');

  // Read single-select filter state (Admin contract)
  const timePeriod = state.time_period ?? TimePeriod.MTD;
  const regionId = state.region_id ?? null;
  const tlId = state.tl_id ?? null;

  // Convert to array format for existing filter helpers
  const selectedRegions = useMemo<Region[]>(() => {
    if (!regionId) return [];
    return [regionId as Region];
  }, [regionId]);

  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'seller' | 'inventory'>('all');

  const handleReset = () => {
    resetFilters();
    setChannelFilter('all');
    setTypeFilter('all');
  };

  // Apply filters
  const filteredLeads = useMemo(() => {
    const filters: AdminLeadFilters = {
      regions: selectedRegions,
      tlId: tlId || '',
      channel: channelFilter,
      type: typeFilter,
    };
    return filterAdminLeads(filters);
  }, [selectedRegions, tlId, channelFilter, typeFilter]);

  // Compute KPIs
  const kpis = useMemo(() => computeLeadKPIs(filteredLeads), [filteredLeads]);

  // Channel breakdown (respects region/TL/type but not channel filter)
  const channelBreakdownLeads = useMemo(() => {
    const filters: AdminLeadFilters = {
      regions: selectedRegions,
      tlId: tlId || '',
      channel: 'all',
      type: typeFilter,
    };
    return filterAdminLeads(filters);
  }, [selectedRegions, tlId, typeFilter]);

  const channels = useMemo(() => computeChannelBreakdown(channelBreakdownLeads), [channelBreakdownLeads]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const isFiltered = regionId || tlId || channelFilter !== 'all' || typeFilter !== 'all';

  // Stage/channel colors
  const stageColor = (stage: string): string => {
    switch (stage) {
      case 'Won': return 'bg-emerald-100 text-emerald-700';
      case 'Lost': return 'bg-rose-100 text-rose-700';
      case 'Inspected': case 'Offer Made': return 'bg-indigo-100 text-indigo-700';
      case 'Contacted': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const channelColor = (ch: string): string => {
    switch (ch) {
      case 'NGS': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'GS': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'DCF': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <AdminCommonFilters scope="admin_leads" />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
            Lead Funnel
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
            {!regionId ? 'All Regions' : regionId}
            {tlId && ' \u2022 TL Filtered'}
            {' \u2022 '}{filteredLeads.length} leads
          </p>
        </div>

        {/* KPI Strip */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Total Leads"
              value={formatNumber(kpis.totalLeads)}
              status="neutral"
            />
            <MetricCard
              title="SI Rate"
              value={`${kpis.siRate}%`}
              status="neutral"
            />
            <MetricCard
              title="I2B %"
              value={`${kpis.i2bPercent}%`}
              status="neutral"
            />
            <MetricCard
              title="T2SI %"
              value={`${kpis.t2siPercent}%`}
              status="neutral"
            />
            <MetricCard
              title="CEP Capture"
              value={`${kpis.cepCapturePercent}%`}
              status="neutral"
            />
          </div>

          {/* Lead Type Contribution */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Lead Type
              </h3>
            </div>
            {kpis.totalLeads > 0 ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">Seller</span>
                    <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {formatNumber(kpis.sellerLeads)} ({kpis.totalLeads > 0 ? ((kpis.sellerLeads / kpis.totalLeads) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${kpis.totalLeads > 0 ? (kpis.sellerLeads / kpis.totalLeads) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">Inventory</span>
                    <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {formatNumber(kpis.inventoryLeads)} ({kpis.totalLeads > 0 ? ((kpis.inventoryLeads / kpis.totalLeads) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${kpis.totalLeads > 0 ? (kpis.inventoryLeads / kpis.totalLeads) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-2">No data</p>
            )}
          </div>

          {/* I2SI by Channel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              I2SI by Channel
            </h3>
            {channels.length > 0 ? (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-slate-900">{channel.name}</span>
                        <span className="text-xs text-slate-500 ml-2">({formatNumber(channel.count)})</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{channel.i2si}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(channel.i2si, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-2">No data</p>
            )}
          </div>
        </div>

        {/* Local Filters */}
        <div className="px-4 pb-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Channel
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'NGS', 'GS', 'DCF'].map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      channelFilter === ch
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {ch === 'all' ? 'All' : ch}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Type
              </div>
              <div className="flex gap-2">
                {(['all', 'seller', 'inventory'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap ${
                      typeFilter === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lead List */}
        <div className="px-4 pb-20 space-y-2">
          {filteredLeads.length === 0 ? (
            <EmptyState
              variant="filtered"
              type="general"
              secondaryLabel="Reset"
              onSecondary={handleReset}
            />
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                        {lead.customerName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border whitespace-nowrap ${channelColor(lead.channel)}`}>
                        {lead.channel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
                      {lead.vehicle} &bull; {lead.dealerName}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
                      {lead.region} &bull; TL: {lead.tlName}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${stageColor(lead.stage)}`}>
                    {lead.stage}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="capitalize">{lead.type}</span>
                  {lead.hasCEP && <span className="text-emerald-600">CEP \u2713</span>}
                  {lead.hasInspection && <span className="text-indigo-600">Insp \u2713</span>}
                  {lead.hasSI && <span className="text-emerald-600">SI \u2713</span>}
                  <span className="ml-auto font-medium text-slate-700 whitespace-nowrap">
                    \u20B9{new Intl.NumberFormat('en-IN').format(lead.value)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
