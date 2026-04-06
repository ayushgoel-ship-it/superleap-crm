/**
 * ADMIN LEADS PAGE — Leader View (Unified Filters)
 *
 * Uses AdminCommonFilters with single-select contract (time_period, region_id, tl_id)
 * Clean SaaS look with compact KPI strip + lead list
 * Short labels, no overflow, neutral styling
 *
 * Data source: runtimeDB (real leads)
 */

import { useState, useMemo } from 'react';
import { PieChart, ChevronLeft, Search, X, FileText, Clock, User } from 'lucide-react';
import { TimePeriod, STOCK_CHANNEL_STAGE_FILTERS, DCF_STAGE_FILTERS } from '../../lib/domain/constants';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { getFilteredLeads, getFilteredDCFLeads } from '../../data/canonicalMetrics';
import { toDCFLeadListVM } from '../../data/adapters/dcfAdapter';
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

  const [channelFilter, setChannelFilter] = useState<'all' | 'NGS' | 'GS' | 'DCF'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'seller' | 'inventory'>('all');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const handleReset = () => {
    resetFilters();
    setChannelFilter('all');
    setTypeFilter('all');
    setSelectedStage(null);
    setSearchQuery('');
  };

  // Active stage definitions for the selected channel
  const activeStages = useMemo(() => {
    if (channelFilter === 'all') return null;
    if (channelFilter === 'DCF') return DCF_STAGE_FILTERS;
    return STOCK_CHANNEL_STAGE_FILTERS;
  }, [channelFilter]);

  // Clear stage when channel changes
  const handleChannelChange = (ch: 'all' | 'NGS' | 'GS' | 'DCF') => {
    setChannelFilter(ch);
    setSelectedStage(null);
  };

  // Build TL name lookup
  const tlNameMap = useMemo(() => {
    const db = getRuntimeDBSync();
    const map: Record<string, string> = {};
    db.org.tls.forEach(tl => { map[tl.id] = tl.name; });
    return map;
  }, []);

  // Dealer → region lookup (used to scope DCF leads by region, since DCFLead
  // does not carry region natively).
  const dealerRegionMap = useMemo(() => {
    const db = getRuntimeDBSync();
    const map: Record<string, string> = {};
    db.dealers.forEach(d => { map[d.code] = d.region; });
    return map;
  }, []);

  // Canonical time-filtered sources. Sell leads carry GS/NGS only; DCF leads
  // come from the separate DCF master with their own funnel stages.
  const timeFilteredSell = useMemo(
    () => getFilteredLeads({ period: timePeriod as TimePeriod }),
    [timePeriod]
  );
  const timeFilteredDCFRaw = useMemo(
    () => getFilteredDCFLeads({ period: timePeriod as TimePeriod }),
    [timePeriod]
  );
  const timeFilteredDCFVMs = useMemo(
    () => toDCFLeadListVM(timeFilteredDCFRaw),
    [timeFilteredDCFRaw]
  );

  // Unified row model — `isDcf` marks DCF-sourced rows so we can render them
  // without seller/inventory semantics.
  type AdminLeadRow = {
    id: string;
    isDcf: boolean;
    vehicle: string;
    regNo: string;
    leadId: string;
    region: string;
    kamId: string;
    kamName: string;
    tlId: string;
    tlName: string;
    channel: 'NGS' | 'GS' | 'DCF';
    leadType: string;
    type: 'seller' | 'inventory' | 'dcf';
    stage: string;
    status: string;
    value: number;
    createdAt: string;
    dealerName: string;
    dealerCode: string;
    hasCEP: boolean;
    hasInspection: boolean;
    hasSI: boolean;
  };

  const allLeads = useMemo<AdminLeadRow[]>(() => {
    const sellRows: AdminLeadRow[] = timeFilteredSell.map(l => ({
      id: l.id,
      isDcf: false,
      vehicle: [l.year, l.make, l.model].filter(Boolean).join(' ') || 'Unknown',
      regNo: l.regNo || '',
      leadId: l.id,
      region: l.region || '',
      kamId: l.kamId,
      kamName: l.kamName || 'Unassigned',
      tlId: l.tlId,
      tlName: tlNameMap[l.tlId] || 'Unknown TL',
      channel: l.channel,
      leadType: l.leadType,
      type: (l.leadType || 'Seller').toLowerCase() as 'seller' | 'inventory',
      stage: l.stage || l.currentStage || 'Lead Created',
      status: l.status,
      value: l.expectedRevenue || l.actualRevenue || 0,
      createdAt: l.createdAt,
      dealerName: l.dealerName || '',
      dealerCode: l.dealerCode || '',
      hasCEP: !!(l.cep && l.cep > 0),
      hasInspection: !!l.inspectionDate,
      hasSI: !!(l.stockinDate || l.finalSiDate),
    }));
    const dcfRows: AdminLeadRow[] = timeFilteredDCFVMs.map((v, i) => {
      const raw = timeFilteredDCFRaw[i];
      return {
        id: v.id,
        isDcf: true,
        vehicle: v.car || 'Unknown',
        regNo: raw?.regNo || '',
        leadId: v.id,
        region: dealerRegionMap[v.dealerCode] || '',
        kamId: raw?.kamId || '',
        kamName: v.kamName || 'Unassigned',
        tlId: raw?.tlId || '',
        tlName: tlNameMap[raw?.tlId || ''] || 'Unknown TL',
        channel: 'DCF',
        leadType: 'DCF',
        type: 'dcf',
        stage: v.stage,
        status: raw?.overallStatus === 'disbursed' ? 'Won' : 'Active',
        value: raw?.loanAmount || 0,
        createdAt: v.createdAt,
        dealerName: v.dealerName || '',
        dealerCode: v.dealerCode || '',
        hasCEP: false,
        hasInspection: false,
        hasSI: !!raw?.disbursalDate,
      };
    });
    return [...sellRows, ...dcfRows];
  }, [timeFilteredSell, timeFilteredDCFVMs, timeFilteredDCFRaw, tlNameMap, dealerRegionMap]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    let leads = allLeads;
    if (regionId) leads = leads.filter(l => l.region === regionId);
    if (tlId) {
      const db = getRuntimeDBSync();
      const tl = db.org?.tls?.find(t => t.id === tlId);
      const kamIds = new Set(tl?.kams?.map(k => k.id) || []);
      leads = leads.filter(l => kamIds.has(l.kamId));
    }
    if (channelFilter !== 'all') leads = leads.filter(l => l.channel === channelFilter);
    // Type filter only applies to sell leads (DCF has no seller/inventory concept)
    if (typeFilter !== 'all' && channelFilter !== 'DCF') {
      leads = leads.filter(l => l.isDcf || l.type === typeFilter);
    }
    // Stage sub-filter — uses canonical pattern matcher shared with KAM view
    if (selectedStage && activeStages) {
      const def = activeStages.find(s => s.key === selectedStage);
      if (def) {
        leads = leads.filter(l => {
          const s = (l.stage || '').toLowerCase();
          return def.patterns.some(p => s.includes(p));
        });
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      leads = leads.filter(l =>
        l.vehicle.toLowerCase().includes(q) ||
        l.regNo.toLowerCase().includes(q) ||
        l.dealerName.toLowerCase().includes(q) ||
        l.kamName.toLowerCase().includes(q) ||
        l.leadId.toLowerCase().includes(q) ||
        l.stage.toLowerCase().includes(q)
      );
    }
    return leads;
  }, [allLeads, regionId, tlId, channelFilter, typeFilter, selectedStage, activeStages, searchQuery]);

  // Compute KPIs from real filtered data
  const kpis = useMemo(() => {
    const total = filteredLeads.length;
    const seller = filteredLeads.filter(l => l.type === 'seller').length;
    const inventory = filteredLeads.filter(l => l.type === 'inventory').length;
    const withCEP = filteredLeads.filter(l => l.hasCEP).length;
    const withInspection = filteredLeads.filter(l => l.hasInspection).length;
    const withSI = filteredLeads.filter(l => l.hasSI).length;

    return {
      totalLeads: total,
      siRate: total > 0 ? +((withSI / total) * 100).toFixed(1) : 0,
      i2bPercent: withInspection > 0 ? +((withSI / withInspection) * 100).toFixed(1) : 0,
      t2siPercent: withInspection > 0 ? +((withSI / withInspection) * 100).toFixed(1) : 0,
      cepCapturePercent: total > 0 ? +((withCEP / total) * 100).toFixed(1) : 0,
      sellerLeads: seller,
      inventoryLeads: inventory,
    };
  }, [filteredLeads]);

  // Channel breakdown (respects region/TL/type but not channel filter)
  const channels = useMemo(() => {
    let leads = allLeads;
    if (regionId) leads = leads.filter(l => l.region === regionId);
    if (tlId) {
      const db = getRuntimeDBSync();
      const tl = db.org?.tls?.find(t => t.id === tlId);
      const kamIds = new Set(tl?.kams?.map(k => k.id) || []);
      leads = leads.filter(l => kamIds.has(l.kamId));
    }
    if (typeFilter !== 'all') leads = leads.filter(l => l.type === typeFilter);

    const channelNames: ('NGS' | 'GS' | 'DCF')[] = ['NGS', 'GS', 'DCF'];
    return channelNames.map(ch => {
      const chLeads = leads.filter(l => l.channel === ch);
      const withInsp = chLeads.filter(l => l.hasInspection).length;
      const withSI = chLeads.filter(l => l.hasSI).length;
      return {
        name: ch,
        count: chLeads.length,
        i2si: withInsp > 0 ? +((withSI / withInsp) * 100).toFixed(1) : 0,
      };
    }).filter(ch => ch.count > 0);
  }, [allLeads, regionId, tlId, typeFilter]);

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
      case 'NGS': return 'bg-violet-50 text-violet-700 border-violet-100';
      case 'GS': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'DCF': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  // Lead detail view
  const leadDetail = useMemo(() => {
    if (!selectedLead) return null;
    return filteredLeads.find(l => l.id === selectedLead) || allLeads.find(l => l.id === selectedLead) || null;
  }, [selectedLead, filteredLeads, allLeads]);

  if (leadDetail) {
    const db = getRuntimeDBSync();
    const rawLead = leadDetail.isDcf ? undefined : db.leads.find(l => l.id === leadDetail.id);
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedLead(null)} className="p-1 hover:bg-slate-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900 truncate">{leadDetail.vehicle}</h2>
            <p className="text-xs text-slate-500">#{leadDetail.leadId} {leadDetail.regNo ? `\u2022 ${leadDetail.regNo}` : ''}</p>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${channelColor(leadDetail.channel)}`}>
            {leadDetail.channel}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Status & Stage */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Lead Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Stage:</span> <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${stageColor(leadDetail.stage)}`}>{leadDetail.stage}</span></div>
              {!leadDetail.isDcf && <div><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-900 capitalize">{leadDetail.type}</span></div>}
              <div><span className="text-slate-500">Channel:</span> <span className="font-medium text-slate-900">{leadDetail.channel}</span></div>
              <div><span className="text-slate-500">Value:</span> <span className="font-medium text-slate-900">₹{new Intl.NumberFormat('en-IN').format(leadDetail.value)}</span></div>
              <div><span className="text-slate-500">Region:</span> <span className="font-medium text-slate-900">{leadDetail.region}</span></div>
              <div><span className="text-slate-500">Created:</span> <span className="font-medium text-slate-900">{leadDetail.createdAt?.slice(0, 10)}</span></div>
            </div>
          </div>

          {/* Dealer & KAM */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Assignment
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Dealer:</span> <span className="font-medium text-slate-900">{leadDetail.dealerName}</span></div>
              <div><span className="text-slate-500">Dealer Code:</span> <span className="font-medium text-slate-900">{leadDetail.dealerCode}</span></div>
              <div><span className="text-slate-500">KAM:</span> <span className="font-medium text-slate-900">{leadDetail.kamName}</span></div>
              <div><span className="text-slate-500">TL:</span> <span className="font-medium text-slate-900">{leadDetail.tlName}</span></div>
            </div>
          </div>

          {/* Progress Milestones — sell leads only */}
          {!leadDetail.isDcf && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Milestones
            </h3>
            <div className="space-y-2">
              {[
                { label: 'CEP Captured', done: leadDetail.hasCEP, detail: rawLead?.cep ? `₹${rawLead.cep.toLocaleString('en-IN')}` : '' },
                { label: 'Inspection Done', done: leadDetail.hasInspection, detail: rawLead?.inspectionDate?.slice(0, 10) || '' },
                { label: 'Stock In', done: leadDetail.hasSI, detail: rawLead?.stockinDate?.slice(0, 10) || rawLead?.finalSiDate?.slice(0, 10) || '' },
              ].map(m => (
                <div key={m.label} className={`flex items-center justify-between p-2.5 rounded-xl ${m.done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${m.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {m.done ? '✓' : '·'}
                    </div>
                    <span className={`text-sm ${m.done ? 'text-emerald-800 font-medium' : 'text-slate-500'}`}>{m.label}</span>
                  </div>
                  {m.detail && <span className="text-xs text-slate-500">{m.detail}</span>}
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Vehicle Details */}
          {rawLead && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vehicle</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Reg No:</span> <span className="font-medium text-slate-900">{rawLead.regNo || '-'}</span></div>
                <div><span className="text-slate-500">Make:</span> <span className="font-medium text-slate-900">{rawLead.make || '-'}</span></div>
                <div><span className="text-slate-500">Model:</span> <span className="font-medium text-slate-900">{rawLead.model || '-'}</span></div>
                <div><span className="text-slate-500">Year:</span> <span className="font-medium text-slate-900">{rawLead.year || '-'}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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

        {/* Search Bar */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by vehicle, dealer, KAM, stage..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* Local Filters */}
        <div className="px-4 pb-3 pt-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Channel
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'NGS', 'GS', 'DCF'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => handleChannelChange(ch)}
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
            {/* Channel-specific stage sub-filters (matches KAM view) */}
            {activeStages && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {channelFilter === 'DCF' ? 'DCF Stages' : `${channelFilter} Stages`}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {activeStages.map((st) => {
                    const isActive = selectedStage === st.key;
                    return (
                      <button
                        key={st.key}
                        onClick={() => setSelectedStage(isActive ? null : st.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? channelFilter === 'DCF'
                              ? 'bg-rose-600 text-white'
                              : 'bg-indigo-600 text-white'
                            : channelFilter === 'DCF'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Seller/Inventory only applies to sell leads (GS/NGS) */}
            {channelFilter !== 'DCF' && (
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
            )}
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
            filteredLeads.map((lead, idx) => (
              <button key={`${lead.id}-${idx}`} onClick={() => setSelectedLead(lead.id)} className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-3 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                        {lead.vehicle}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border whitespace-nowrap ${channelColor(lead.channel)}`}>
                        {lead.channel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
                      {lead.regNo ? `${lead.regNo} \u2022 ` : ''}{lead.dealerName || `Dealer ${lead.dealerCode}`}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
                      {lead.region} &bull; KAM: {lead.kamName} &bull; TL: {lead.tlName}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${stageColor(lead.stage)}`}>
                    {lead.stage}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {!lead.isDcf && <span className="capitalize">{lead.type}</span>}
                  {lead.isDcf && <span className="text-amber-700">DCF</span>}
                  {!lead.isDcf && lead.hasCEP && <span className="text-emerald-600">CEP &#10003;</span>}
                  {!lead.isDcf && lead.hasInspection && <span className="text-indigo-600">Insp &#10003;</span>}
                  {lead.hasSI && <span className="text-emerald-600">{lead.isDcf ? 'Disb ✓' : 'SI ✓'}</span>}
                  <span className="ml-auto font-medium text-slate-700 whitespace-nowrap">
                    &#8377;{new Intl.NumberFormat('en-IN').format(lead.value)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
