/**
 * DEALERS PAGE — Portfolio Overview
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  DESIGN NOTE                                         │
 * │                                                      │
 * │  Purpose: This is a portfolio overview screen.        │
 * │  It answers "How is my dealer base performing?"       │
 * │  — not "What action should I take right now?"         │
 * │                                                      │
 * │  Execution actions (Call, Visit, Notes) are removed   │
 * │  from cards. They live inside DealerDetail, which     │
 * │  is one tap away. This keeps the list scannable,      │
 * │  calm, and focused on understanding.                  │
 * │                                                      │
 * │  Summary metrics (top):                               │
 * │  - Total Tagged: all dealers assigned to this KAM     │
 * │  - Inspecting: dealers with inspections this period   │
 * │  - Transacting: dealers with stock-ins this period    │
 * │  - DCF Onboarded: dealers with DCF Onboarded tag      │
 * │  - DCF Lead-Giving: dealers submitting DCF leads      │
 * │  Summary is NOT filtered by status chips.             │
 * │                                                      │
 * │  Relationship to DealerDetail:                        │
 * │  DealersPage = scan + prioritise                      │
 * │  DealerDetail = understand + act                      │
 * └──────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, ChevronDown, X, AlertTriangle, ArrowUpDown, Zap,
  Users, TrendingUp, ShieldCheck, FileText, Handshake,
} from 'lucide-react';
import type { UserRole, DealersFilterContext } from '../../lib/shared/appTypes';
import { ViewModeSelector } from '../shared/ViewModeSelector';
import { DealerDetailPageV2 } from './DealerDetailPageV2';
import { DealerAccountCard, type DealerCardData } from '../dealers/DealerAccountCard';
import { toast } from 'sonner@2.0.3';
import { getAllDealers } from '../../data/selectors';
import { getRuntimeDBSync } from '../../data/runtimeDB';

// ── Filter Types ──
type QuickFilter = 'all' | 'active' | 'dormant' | 'inactive';
type SortKey = 'name' | 'segment' | 'leads' | 'last-activity';
type SummaryRange = 'mtd' | 'last-30';

interface DealersPageProps {
  userRole: UserRole;
  initialFilter?: string | null;
  navigationContext?: string | null;
  onClearContext?: () => void;
  filterContext?: DealersFilterContext | null;
  onNavigateToCallFeedback?: (callId: string) => void;
  onNavigateToVisitFeedback?: (visitId: string) => void;
  onNavigateToLeadDetail?: (leadId: string) => void;
  onNavigateToLeadCreate?: (dealerId: string) => void;
  onNavigateToDCFOnboarding?: (dealerId: string) => void;
  onNavigateToLocationUpdate?: (dealerId: string) => void;
}

// ── Chip config ──
const FILTER_CHIPS: { key: QuickFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'dormant', label: 'Dormant' },
  { key: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name A-Z' },
  { key: 'segment', label: 'Segment' },
  { key: 'leads', label: 'Leads MTD' },
  { key: 'last-activity', label: 'Last Activity' },
];

// ── Helpers ──
function mapDBDealerToCard(d: any): DealerCardData {
  // Compute real MTD metrics from actual Supabase data
  const db = getRuntimeDBSync();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const dealerLeads = db.leads.filter(l => l.dealerId === d.id);
  const dealerLeadsMTD = dealerLeads.filter(l => new Date(l.createdAt) >= monthStart);
  const dealerCalls = db.calls.filter(c => c.dealerId === d.id && new Date(c.callDate) >= monthStart);
  const dealerVisits = db.visits.filter(v => v.dealerId === d.id && new Date(v.visitDate) >= monthStart);
  const dealerSIs = dealerLeadsMTD.filter(l => l.status === 'won' || l.status === 'Won' || l.stage === 'stock_in');

  const leadsMTD = dealerLeadsMTD.length;
  const sisMTD = dealerSIs.length;
  const callsMTD = dealerCalls.length;
  const visitsMTD = dealerVisits.length;
  const productivityPct = leadsMTD > 0 ? Math.min(100, Math.round((sisMTD / Math.max(leadsMTD, 1)) * 100)) : 0;

  return {
    id: d.id,
    name: d.name,
    code: d.code,
    city: d.city,
    segment: d.segment ?? 'C',
    status: d.status ?? 'active',
    tags: d.tags ?? [],
    lastActivity: d.lastContact ?? d.lastVisit ?? 'Unknown',
    lastActivityDaysAgo: Math.min(d.lastContactDaysAgo ?? 999, d.lastVisitDaysAgo ?? 999),
    callsMTD,
    visitsMTD,
    leadsMTD,
    sisMTD,
    productivityPct,
    hasLocation: !!d.latitude,
    distanceKm: undefined,
  };
}

// ── Summary KPI Pill ──
function SummaryPill({
  label, value, accent = false, highlight = false,
}: {
  label: string; value: number; accent?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-2 py-2 rounded-xl min-w-0
      ${highlight ? 'bg-emerald-50/80' : 'bg-white'}
    `}>
      <span className={`text-[16px] font-bold tabular-nums leading-none
        ${accent ? 'text-indigo-700' : highlight ? 'text-emerald-700' : 'text-slate-800'}
      `}>
        {value}
      </span>
      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// ── Component ──
export function DealersPage({
  userRole,
  initialFilter,
  navigationContext,
  onClearContext,
  filterContext,
  onNavigateToCallFeedback,
  onNavigateToVisitFeedback,
  onNavigateToLeadDetail,
  onNavigateToLeadCreate,
  onNavigateToDCFOnboarding,
  onNavigateToLocationUpdate,
}: DealersPageProps) {
  const chipScrollRef = useRef<HTMLDivElement>(null);

  // ── State ──
  const [selectedDealerCode, setSelectedDealerCode] = useState<string | null>(null);
  const [selectedDealerRaw, setSelectedDealerRaw] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuickFilter>(
    initialFilter === 'Dormant' ? 'dormant' : 'all'
  );
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showContextBanner, setShowContextBanner] = useState(!!navigationContext);
  const [summaryRange, setSummaryRange] = useState<SummaryRange>('mtd');

  // ── Data loading ──
  const [rawDealers, setRawDealers] = useState<any[]>([]);
  useEffect(() => {
    setRawDealers(getAllDealers());
  }, []);

  const dealers: DealerCardData[] = useMemo(
    () => rawDealers.map(mapDBDealerToCard),
    [rawDealers]
  );

  // ── Summary metrics (NOT filtered by status chips) ──
  const summaryMetrics = useMemo(() => {
    // Use all dealers for summary, regardless of active filter
    const all = dealers;
    // Adjust multiplier for Last 30 Days to simulate broader window
    const mult = summaryRange === 'last-30' ? 1.2 : 1;

    const totalTagged = all.length;
    const inspecting = all.filter(d => Math.round(d.leadsMTD * mult) > 0).length;
    const transacting = all.filter(d => Math.round(d.sisMTD * mult) > 0).length;
    const dcfOnboarded = all.filter(d => d.tags.includes('DCF Onboarded')).length;
    const dcfLeadGiving = all.filter(d =>
      d.tags.includes('DCF Onboarded') && Math.round(d.leadsMTD * mult) > 0
    ).length;

    return { totalTagged, inspecting, transacting, dcfOnboarded, dcfLeadGiving };
  }, [dealers, summaryRange]);

  // ── Dormant count ──
  const dormantCount = useMemo(
    () => dealers.filter(d => d.status === 'dormant' || (d.leadsMTD === 0 && d.sisMTD === 0)).length,
    [dealers]
  );

  // ── Filtering ──
  const filteredDealers = useMemo(() => {
    let result = dealers;

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.city.toLowerCase().includes(q)
      );
    }

    // Quick filter
    switch (activeFilter) {
      case 'active':
        result = result.filter(d => d.status === 'active' && (d.leadsMTD > 0 || d.sisMTD > 0));
        break;
      case 'dormant':
        result = result.filter(d => d.status === 'dormant' || (d.leadsMTD === 0 && d.sisMTD === 0));
        break;
      case 'inactive':
        result = result.filter(d => d.status === 'inactive');
        break;
      default:
        break;
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'segment':
          return a.segment.localeCompare(b.segment);
        case 'leads':
          return b.leadsMTD - a.leadsMTD;
        case 'last-activity':
          return a.lastActivityDaysAgo - b.lastActivityDaysAgo;
        default:
          return 0;
      }
    });

    return result;
  }, [dealers, searchTerm, activeFilter, sortKey]);

  const hasActiveFilters = activeFilter !== 'all' || searchTerm.length > 0;

  // ── Handlers ──
  const handleDealerTap = (dealer: DealerCardData) => {
    const rawDealer = rawDealers.find((d: any) => d.id === dealer.id);
    setSelectedDealerRaw(rawDealer);
    setSelectedDealerCode(dealer.code);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
  };

  // ── DealerDetail sub-page ──
  if (selectedDealerCode && selectedDealerRaw) {
    return (
      <DealerDetailPageV2
        dealerName={selectedDealerRaw.name}
        dealerCode={selectedDealerRaw.code}
        dealerCity={selectedDealerRaw.city}
        tags={selectedDealerRaw.tags}
        onBack={() => {
          setSelectedDealerCode(null);
          setSelectedDealerRaw(null);
        }}
        userRole={userRole}
        onNavigateToLeads={() => {
          setSelectedDealerCode(null);
          setSelectedDealerRaw(null);
          toast.info('Opening leads filtered by dealer...');
        }}
        onNavigateToActivity={() => {
          setSelectedDealerCode(null);
          setSelectedDealerRaw(null);
          toast.info('Opening activity view...');
        }}
        onNavigateToLeadDetail={(leadId) => {
          setSelectedDealerCode(null);
          setSelectedDealerRaw(null);
          onNavigateToLeadDetail?.(leadId);
        }}
        onNavigateToCallDetail={(callId) => {
          setSelectedDealerCode(null);
          setSelectedDealerRaw(null);
          onNavigateToCallFeedback?.(callId);
        }}
        onNavigateToVisitDetail={(visitId) => {
          setSelectedDealerCode(null);
          setSelectedDealerRaw(null);
          onNavigateToVisitFeedback?.(visitId);
        }}
        onNavigateToDCFDetail={(loanId) => {
          setSelectedDealerCode(null);
          setSelectedDealerRaw(null);
          toast.info(`Opening DCF loan ${loanId}...`);
        }}
      />
    );
  }

  // ── Main UI ──
  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">
      {/* TL View Mode */}
      <ViewModeSelector userRole={userRole} />

      {/* ── Title Bar + Search + Sort ── */}
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-4 pb-3 space-y-3">
        {/* Navigation Context Banner */}
        {showContextBanner && navigationContext === 'daily-inspecting-dealers' && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl animate-scale-in">
            <AlertTriangle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-slate-800">Showing Dormant Dealers</div>
              <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Activating dormant dealers will help increase your daily inspecting dealers count.
              </div>
            </div>
            <button
              onClick={() => { setShowContextBanner(false); onClearContext?.(); }}
              className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-indigo-500" />
            </button>
          </div>
        )}

        {/* Search + Sort row */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border-0 rounded-xl text-[13px] text-slate-700
                         placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/40 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Sort dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px]
                         font-medium text-slate-600 hover:border-slate-300 active:scale-95 transition-all min-h-[40px]"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden min-[360px]:inline">{SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? 'Sort'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/60 z-40 py-1 animate-scale-in">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium transition-colors
                        ${sortKey === opt.key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Portfolio Summary Section ── */}
      <div className="mx-4 mt-3 space-y-2.5">
        {/* Range toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Portfolio</h2>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {([
              { key: 'mtd' as SummaryRange, label: 'MTD' },
              { key: 'last-30' as SummaryRange, label: 'Last 30d' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSummaryRange(key)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
                  ${summaryRange === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI pills */}
        <div className="grid grid-cols-5 gap-1.5 bg-slate-100/60 rounded-2xl p-1.5">
          <SummaryPill label="Tagged" value={summaryMetrics.totalTagged} accent />
          <SummaryPill label="Inspecting" value={summaryMetrics.inspecting} />
          <SummaryPill label="Transact." value={summaryMetrics.transacting} highlight />
          <SummaryPill label="DCF On." value={summaryMetrics.dcfOnboarded} />
          <SummaryPill label="DCF Lead" value={summaryMetrics.dcfLeadGiving} />
        </div>
      </div>

      {/* ── Hero Strip: Dormant Dealers Banner ── */}
      {dormantCount > 0 && activeFilter !== 'dormant' && !searchTerm && (
        <div className="mx-4 mt-3">
          <button
            onClick={() => setActiveFilter('dormant')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-rose-50 to-amber-50
                       border border-rose-100/80 rounded-2xl active:scale-[0.99] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4.5 h-4.5 text-rose-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[13px] font-semibold text-slate-800">
                {dormantCount} dormant dealer{dormantCount !== 1 ? 's' : ''} this month
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Tap to review and plan revival outreach
              </div>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg
                             group-hover:bg-rose-200 transition-colors">
              Review
            </span>
          </button>
        </div>
      )}

      {/* ── Quick Filter Chips ── */}
      <div className="px-4 pt-3 pb-1">
        <div ref={chipScrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeFilter === chip.key;
            const count = chip.key === 'all'
              ? dealers.length
              : chip.key === 'dormant'
                ? dormantCount
                : chip.key === 'active'
                  ? dealers.filter(d => d.status === 'active' && (d.leadsMTD > 0 || d.sisMTD > 0)).length
                  : chip.key === 'inactive'
                    ? dealers.filter(d => d.status === 'inactive').length
                    : undefined;

            return (
              <button
                key={chip.key}
                onClick={() => setActiveFilter(isActive ? 'all' : chip.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium
                  whitespace-nowrap transition-all duration-150 min-h-[36px] flex-shrink-0
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                {chip.label}
                {count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                    ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}
                  `}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters Applied Bar ── */}
      {hasActiveFilters && (
        <div className="mx-4 mb-1 flex items-center justify-between px-3.5 py-2 bg-slate-100/70 rounded-xl">
          <span className="text-[11px] font-medium text-slate-500">
            {filteredDealers.length} result{filteredDealers.length !== 1 ? 's' : ''}
            {activeFilter !== 'all' && ` \u00b7 ${FILTER_CHIPS.find(c => c.key === activeFilter)?.label}`}
            {searchTerm && ` \u00b7 "${searchTerm}"`}
          </span>
          <button
            onClick={clearAllFilters}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg
                       hover:bg-indigo-50 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Dealer Account Cards ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 space-y-3">
        {filteredDealers.length > 0 ? (
          filteredDealers.map((dealer) => (
            <DealerAccountCard
              key={dealer.id}
              dealer={dealer}
              onTap={() => handleDealerTap(dealer)}
            />
          ))
        ) : (
          dealers.length === 0 ? (
            // No dealers tagged at all
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-700 mb-1">No dealers tagged yet</h3>
              <p className="text-[12px] text-slate-400 max-w-[260px] leading-relaxed">
                Dealers appear here once they are tagged to your account by your Team Lead or Admin in the CRM system.
              </p>
            </div>
          ) : (
            // Filtered to zero
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-700 mb-1">No dealers match this filter</h3>
              <p className="text-[12px] text-slate-400 max-w-[260px] leading-relaxed mb-4">
                Try a different filter or clear all filters to see your full portfolio.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl
                           hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Clear filters
              </button>
            </div>
          )
        )}
      </div>

      {/* ── Footer count ── */}
      <div className="py-2.5 px-4 glass-nav border-t border-slate-200/60 text-[11px] text-slate-400 text-center font-medium tracking-wide">
        {filteredDealers.length} of {dealers.length} dealers
      </div>
    </div>
  );
}