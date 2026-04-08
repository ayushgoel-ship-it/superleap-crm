/**
 * ADMIN DEALERS PAGE — Leader View (Unified Filters)
 * 
 * Uses AdminCommonFilters with single-select contract (time_period, region_id, tl_id)
 * Clean SaaS look with compact KPI strip + dealer list
 * Short labels, no overflow, neutral styling
 */

import { useState, useMemo } from 'react';
import { Check, Search, X, ChevronLeft, Phone, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import { getRuntimeDBSync } from '../../data/runtimeDB';
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

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dormant'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'top' | 'tagged' | 'untagged'>('all');
  const [dcfFilter, setDcfFilter] = useState<'all' | 'onboarded' | 'not_onboarded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDealer, setSelectedDealer] = useState<string | null>(null);

  const handleReset = () => {
    resetFilters();
    setStatusFilter('all');
    setCategoryFilter('all');
    setDcfFilter('all');
    setSearchQuery('');
  };

  // Build dealer list from runtimeDB
  const allDealers = useMemo(() => {
    const db = getRuntimeDBSync();
    return db.dealers.map(d => ({
      id: d.id,
      name: d.name,
      code: d.code,
      city: d.city,
      region: d.region,
      kamName: d.kamName || 'Unassigned',
      kamId: d.kamId,
      tlId: d.tlId,
      segment: d.segment || 'B',
      status: d.status || 'active',
      tags: d.tags || [],
      metrics: d.metrics,
      lastVisitDaysAgo: d.lastVisitDaysAgo,
      lastContactDaysAgo: d.lastContactDaysAgo,
      dcfOnboarded: d.dcfOnboarded === 'Y',
      // Derive category from segment
      category: d.segment === 'A' ? 'TOP' as const : d.segment === 'B' ? 'TAGGED' as const : 'UNTAGGED' as const,
    }));
  }, []);

  // Apply filters
  const filteredDealers = useMemo(() => {
    let dealers = allDealers;
    if (regionId) dealers = dealers.filter(d => d.region === regionId);
    if (tlId) {
      // Find KAMs under this TL from org hierarchy
      const db = getRuntimeDBSync();
      const tl = db.org?.tls?.find(t => t.id === tlId);
      const kamIds = new Set(tl?.kams?.map(k => k.id) || []);
      dealers = dealers.filter(d => kamIds.has(d.kamId));
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        dealers = dealers.filter(d => d.status === 'active');
      } else {
        // 'dormant' filter shows inactive + churned
        dealers = dealers.filter(d => d.status !== 'active');
      }
    }
    if (categoryFilter !== 'all') dealers = dealers.filter(d => d.category.toLowerCase() === categoryFilter);
    if (dcfFilter === 'onboarded') dealers = dealers.filter(d => d.dcfOnboarded);
    if (dcfFilter === 'not_onboarded') dealers = dealers.filter(d => !d.dcfOnboarded);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      dealers = dealers.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.kamName.toLowerCase().includes(q)
      );
    }
    return dealers;
  }, [allDealers, regionId, tlId, statusFilter, categoryFilter, dcfFilter, searchQuery]);

  // Compute KPIs from filtered dealers
  const kpis = useMemo(() => {
    const total = filteredDealers.length;
    const active = filteredDealers.filter(d => d.status === 'active').length;
    const dormant = filteredDealers.filter(d => d.status !== 'active').length;
    const leadGiving = filteredDealers.filter(d => d.metrics.mtd.leads > 0).length;
    const inspecting = filteredDealers.filter(d => d.metrics.mtd.inspections > 0).length;
    const transacting = filteredDealers.filter(d => d.metrics.mtd.sis > 0).length;
    const inspToTransPercent = inspecting > 0 ? Math.round((transacting / inspecting) * 100) : 0;
    const topDealers = filteredDealers.filter(d => d.category === 'TOP');
    const inspectingTopDealers = topDealers.filter(d => d.metrics.mtd.inspections > 0).length;
    const inspectingTopDealersPercent = topDealers.length > 0 ? Math.round((inspectingTopDealers / topDealers.length) * 100) : 0;
    return { total, active, dormant, leadGiving, inspecting, transacting, inspToTransPercent, inspectingTopDealersPercent };
  }, [filteredDealers]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const isFiltered = regionId || tlId || statusFilter !== 'all' || categoryFilter !== 'all' || dcfFilter !== 'all' || searchQuery;

  // Get dealer detail data (leads, calls, visits for selected dealer)
  const dealerDetail = useMemo(() => {
    if (!selectedDealer) return null;
    const dealer = filteredDealers.find(d => d.id === selectedDealer) || allDealers.find(d => d.id === selectedDealer);
    if (!dealer) return null;
    const db = getRuntimeDBSync();
    const dealerLeads = db.leads.filter(l => l.dealerCode === dealer.code);
    const dealerCalls = db.calls.filter(c => c.dealerCode === dealer.code).slice(0, 10);
    const dealerVisits = db.visits.filter(v => v.dealerCode === dealer.code).slice(0, 10);
    const dealerDCF = db.dcfLeads.filter(d => d.dealerCode === dealer.code);
    return { dealer, leads: dealerLeads, calls: dealerCalls, visits: dealerVisits, dcfLeads: dealerDCF };
  }, [selectedDealer, filteredDealers, allDealers]);

  // Detail view for a dealer
  if (dealerDetail) {
    const { dealer, leads, calls, visits, dcfLeads } = dealerDetail;
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedDealer(null)} className="p-1 hover:bg-slate-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900 truncate">{dealer.name}</h2>
            <p className="text-xs text-slate-500">{dealer.code} &bull; {dealer.city} &bull; {dealer.region}</p>
          </div>
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${dealer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {dealer.status}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Dealer Info */}
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Category:</span> <span className="font-medium text-slate-900">{dealer.category}</span></div>
                <div><span className="text-slate-500">Segment:</span> <span className="font-medium text-slate-900">{dealer.segment}</span></div>
                <div><span className="text-slate-500">KAM:</span> <span className="font-medium text-slate-900">{dealer.kamName}</span></div>
                <div><span className="text-slate-500">Last Visit:</span> <span className="font-medium text-slate-900">{dealer.lastVisitDaysAgo}d ago</span></div>
                <div><span className="text-slate-500">Last Call:</span> <span className="font-medium text-slate-900">{dealer.lastContactDaysAgo}d ago</span></div>
              </div>
            </div>

            {/* MTD Performance */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> MTD Performance
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Leads', value: dealer.metrics.mtd.leads },
                  { label: 'Insp', value: dealer.metrics.mtd.inspections },
                  { label: 'SI', value: dealer.metrics.mtd.sis },
                  { label: 'DCF', value: dealer.metrics.mtd.dcf },
                ].map(m => (
                  <div key={m.label} className="text-center p-2 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500">{m.label}</div>
                    <div className="text-lg font-bold text-slate-900">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Leads ({leads.length})</h3>
              </div>
              {leads.length === 0 ? (
                <div className="p-4 text-sm text-slate-400 text-center">No leads</div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                  {leads.slice(0, 20).map(l => (
                    <div key={l.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{[l.year, l.make, l.model].filter(Boolean).join(' ') || `Lead #${l.id}`}</div>
                        <div className="text-xs text-slate-500">{l.channel} &bull; {l.stage || l.currentStage || 'Lead Created'}</div>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{l.createdAt?.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Calls */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Calls ({calls.length})</h3>
              </div>
              {calls.length === 0 ? (
                <div className="p-4 text-sm text-slate-400 text-center">No calls recorded</div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                  {calls.map(c => (
                    <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-800">{c.kamName} &bull; {c.duration || '-'}</div>
                        <div className="text-xs text-slate-500">{c.callStatus} &bull; {c.isProductive ? 'Productive' : 'Not Productive'}</div>
                      </div>
                      <span className="text-xs text-slate-500">{c.callDate?.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Visits */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Visits ({visits.length})</h3>
              </div>
              {visits.length === 0 ? (
                <div className="p-4 text-sm text-slate-400 text-center">No visits recorded</div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                  {visits.map(v => (
                    <div key={v.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-800">{v.kamName} &bull; {v.visitType}</div>
                        <div className="text-xs text-slate-500">{v.status || 'Completed'} &bull; {v.isProductive ? 'Productive' : 'Not Productive'}</div>
                      </div>
                      <span className="text-xs text-slate-500">{v.visitDate?.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DCF Leads */}
            {dcfLeads.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">DCF Files ({dcfLeads.length})</h3>
                </div>
                <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                  {dcfLeads.map(d => (
                    <div key={d.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{d.customerName}</div>
                        <div className="text-xs text-slate-500">{d.overallStatus} &bull; {d.currentFunnel} &bull; ₹{(d.loanAmount / 100000).toFixed(1)}L</div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${d.ragStatus === 'green' ? 'bg-emerald-100 text-emerald-700' : d.ragStatus === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {d.ragStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="h-20" />
        </div>
      </div>
    );
  }

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

        {/* Search Bar */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dealers by name, code, city, KAM..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* KPI Strip — Compact MetricCards */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Total"
              value={formatNumber(kpis.total)}
              status="neutral"
            />
            <MetricCard
              title="Active"
              value={formatNumber(kpis.active)}
              status="neutral"
            />
            <MetricCard
              title="Lead Giving"
              value={formatNumber(kpis.leadGiving)}
              status="neutral"
            />
            <MetricCard
              title="Inspecting"
              value={formatNumber(kpis.inspecting)}
              status="neutral"
            />
            <MetricCard
              title="Transacting"
              value={formatNumber(kpis.transacting)}
              status="neutral"
            />
            <MetricCard
              title="I→T %"
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

        {/* Compact Filter Bar */}
        <div className="px-4 pb-2 space-y-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] font-semibold text-slate-400 uppercase shrink-0">Status</span>
            {(['all', 'active', 'dormant'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors capitalize whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
            <span className="w-px h-4 bg-slate-200 shrink-0 mx-0.5" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase shrink-0">Seg</span>
            {(['all', 'top', 'tagged', 'untagged'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors capitalize whitespace-nowrap ${
                  categoryFilter === c
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] font-semibold text-slate-400 uppercase shrink-0">DCF</span>
            {([['all', 'All'], ['onboarded', 'Onboarded'], ['not_onboarded', 'Not Onb.']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDcfFilter(val)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                  dcfFilter === val
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
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
              <button
                key={dealer.id}
                onClick={() => setSelectedDealer(dealer.id)}
                className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all"
              >
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
                      {dealer.dcfOnboarded && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap bg-violet-100 text-violet-700">
                          DCF
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
                      {dealer.city} &bull; {dealer.region} &bull; KAM: {dealer.kamName}
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
                    <div className="text-base font-bold text-slate-900">{dealer.metrics.mtd.leads}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Insp</div>
                    <div className="text-base font-bold text-slate-900">{dealer.metrics.mtd.inspections}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">SI</div>
                    <div className="text-base font-bold text-slate-900">{dealer.metrics.mtd.sis}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">DCF</div>
                    <div className="text-base font-bold text-slate-900">{dealer.metrics.mtd.dcf}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  {dealer.lastVisitDaysAgo <= 30 && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="w-3 h-3" />
                      <span>Visited L30</span>
                    </div>
                  )}
                  {dealer.lastContactDaysAgo <= 7 && (
                    <div className="flex items-center gap-1 text-xs text-indigo-600">
                      <Check className="w-3 h-3" />
                      <span>Called L7</span>
                    </div>
                  )}
                  {dealer.lastVisitDaysAgo > 30 && dealer.lastContactDaysAgo > 7 && (
                    <span className="text-xs text-slate-400">No recent engagement</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
