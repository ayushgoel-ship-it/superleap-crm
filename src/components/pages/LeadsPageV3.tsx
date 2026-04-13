/**
 * LEADS PAGE V3 - Premium Pipeline-Lite with Channel-Aware Filtering
 *
 * Filter hierarchy:
 *   1. Time filters (primary)
 *   2. Channel pills (primary)
 *   3. Channel-specific stage chips (secondary, appears on channel select)
 *   4. "Pending" pill (priority exception — always visible, independent mode)
 *
 * "All", "Hot", "Stale" chips are intentionally removed:
 *   - They are secondary analytical states that clutter the primary action area
 *   - TLs and KAMs care more about *what is blocking progress*
 *   - "Pending" (CEP Pending) is the only cross-cutting priority exception
 *
 * Two views:
 *   "Cards" (default) — stage-grouped collapsible sections
 *   "Table"  — dense power-user list
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { getSession } from '../../lib/auth/authService';
import {
  Search, Plus, X, ChevronDown, ChevronRight,
  LayoutGrid, TableProperties, AlertCircle,
  Calendar, ArrowUpDown,
} from 'lucide-react';
import type { UserRole } from '../../lib/shared/appTypes';
import type { LeadsFilterContext } from '../../lib/shared/appTypes';
import { LeadDetailPageV2 } from './LeadDetailPageV2';
import { DCFLeadDetailPage } from './DCFLeadDetailPage';
import { LeadCreatePage } from './LeadCreatePage';
import { getAllLeads, searchLeads, getAnyLeadById } from '../../data/selectors';
import { toLeadListVM, dcfToLeadCardVM, validateLeadIdForNavigation } from '../../data/adapters/leadAdapter';
import { getFilteredLeads, getFilteredDCFLeads, classifyLeadStage } from '../../data/canonicalMetrics';
import { useKamScope } from '../../lib/auth/useKamScope';
import { useActorScope } from '../../lib/auth/useActorScope';
import { KAMFilter } from '../common/KAMFilter';
import type { Lead } from '../../data/types';
import type { LeadCardVM } from '../../data/adapters/leadAdapter';
import { LeadPipelineCard } from '../leads/LeadPipelineCard';
import { ChannelChip } from '../premium/Chip';
import { LeadCardSkeleton } from '../premium/SkeletonLoader';
import { UnifiedFeedbackModal } from '../activity/VisitModals';
import type { UnifiedFeedbackData } from '../activity/visitHelpers';
import * as visitApi from '../../api/visit.api';
import { enqueue } from '../../lib/feedbackRetryQueue';
import { toast } from 'sonner@2.0.3';

// ── Types ──

import { TimePeriod, STOCK_CHANNEL_STAGE_FILTERS, DCF_STAGE_FILTERS } from '../../lib/domain/constants';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';
import { useUrlState } from '../../lib/url/useUrlState';
import { toDCFLeadListVM } from '../../data/adapters/dcfAdapter';

type ViewMode = 'cards' | 'table';
type ChannelKey = 'all' | 'NGS' | 'GS' | 'DCF';
type SortKey = 'newest' | 'oldest' | 'value' | 'stage';

interface StageGroup {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
  leads: LeadCardVM[];
}

// ── Constants ──

/** Look up short label for a TimePeriod */
const getTimeLabel = (p: TimePeriod): string => CANONICAL_TIME_LABELS[p] || p;

const CHANNEL_PILLS: { key: ChannelKey; label: string; dot?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'NGS', label: 'NGS' },
  { key: 'GS', label: 'GS' },
  { key: 'DCF', label: 'DCF', dot: 'bg-rose-500' },
];

// ── Channel-specific stage filters ──

interface StageFilterDef {
  key: string;
  label: string;
  patterns: string[]; // patterns to match against lead.stage (lowercase)
}

// Use canonical stage filters from constants (includes Stockin for GS/NGS)
const STOCK_CHANNEL_STAGES: StageFilterDef[] = STOCK_CHANNEL_STAGE_FILTERS as unknown as StageFilterDef[];
const DCF_STAGES: StageFilterDef[] = DCF_STAGE_FILTERS as unknown as StageFilterDef[];

// ── Generic stage order for grouping ──

const STAGE_ORDER: { pattern: string; label: string; color: string; bgColor: string; dotColor: string }[] = [
  { pattern: 'pr|lead created', label: 'New / PR', color: 'text-violet-700', bgColor: 'bg-violet-50', dotColor: 'bg-violet-500' },
  { pattern: 'pll|in progress', label: 'In Progress', color: 'text-amber-700', bgColor: 'bg-amber-50', dotColor: 'bg-amber-500' },
  { pattern: 'inspection', label: 'Inspection', color: 'text-sky-700', bgColor: 'bg-sky-50', dotColor: 'bg-sky-500' },
  { pattern: 'stock-in|inspection done', label: 'Stock-In', color: 'text-emerald-700', bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-500' },
  { pattern: 'payout', label: 'Payout Done', color: 'text-green-700', bgColor: 'bg-green-50', dotColor: 'bg-green-500' },
  { pattern: 'lost', label: 'Lost', color: 'text-rose-700', bgColor: 'bg-rose-50', dotColor: 'bg-rose-500' },
];

// ── Helpers ──

function daysAgo(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000));
}

function classifyStage(stage: string, createdAt?: string): string {
  // Use canonical stage classifier, then map to display labels
  const canonical = classifyLeadStage(stage, createdAt);
  const mapping: Record<string, string> = {
    'New/PR': 'New / PR',
    'Lead Dropped': 'Lost',
    'Insp Pending': 'In Progress',
    'In Nego': 'Inspection',
    'BBNP': 'BBNP',
    'Stockin': 'Stock-In',
    'Payout Done': 'Payout Done',
    'Lost': 'Lost',
  };
  return mapping[canonical] || 'Other';
}

function formatMoney(n: number | null | undefined): string {
  if (!n) return '--';
  if (n >= 10_000_000) return `\u20B9${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `\u20B9${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `\u20B9${(n / 1_000).toFixed(0)}K`;
  return `\u20B9${n}`;
}

function matchesStageFilter(leadStage: string, stageFilter: StageFilterDef): boolean {
  const s = leadStage.toLowerCase();
  return stageFilter.patterns.some(p => s.includes(p));
}

// ── Props ──

interface LeadsPageV3Props {
  userRole: UserRole;
  filterContext?: LeadsFilterContext | null;
  onClearContext?: () => void;
  onLeadClick?: (leadId: string) => void;
  /** Open the Cars24 API lead creation flow (Sheet overlay — no dealer pre-selected) */
  onOpenLeadCreationFlow?: (dealerCode?: string, dealerName?: string) => void;
}

// ── Component ──

export function LeadsPageV3({ userRole, filterContext, onClearContext, onLeadClick, onOpenLeadCreationFlow }: LeadsPageV3Props) {
  // Sub-page state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCreateLead, setShowCreateLead] = useState(false);

  // Filter / view state (URL-backed so back-nav from detail restores filters)
  const [viewMode, setViewMode] = useUrlState<ViewMode>('view', 'cards');
  const [searchQuery, setSearchQuery] = useUrlState<string>('q', '');
  const [pendingModeRaw, setPendingModeRaw] = useUrlState<'0' | '1'>('pending', '0');
  const pendingMode = pendingModeRaw === '1';
  const setPendingMode = (b: boolean) => setPendingModeRaw(b ? '1' : '0');
  const [selectedChannel, setSelectedChannel] = useUrlState<ChannelKey>('ch', 'all');
  const [selectedStageRaw, setSelectedStageRaw] = useUrlState<string>('stage', '');
  const selectedStage = selectedStageRaw === '' ? null : selectedStageRaw;
  const setSelectedStage = (v: string | null) => setSelectedStageRaw(v ?? '');
  const [timeFilter, setTimeFilter] = useUrlState<TimePeriod>('t', TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useUrlState<string>('from', '');
  const [customTo, setCustomTo] = useUrlState<string>('to', '');
  const [sortKey, setSortKey] = useUrlState<SortKey>('sort', 'newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Banner carousel
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Call feedback state ("No silent calls" enforcement)
  const [callFeedbackLead, setCallFeedbackLead] = useState<LeadCardVM | null>(null);
  const [callStartTime, setCallStartTime] = useState(0);
  const [pendingCallId, setPendingCallId] = useState<string | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Reset stage when channel changes
  useEffect(() => {
    setSelectedStage(null);
  }, [selectedChannel]);

  // Cleanup call timer
  useEffect(() => {
    return () => { if (callTimerRef.current) clearTimeout(callTimerRef.current); };
  }, []);

  // ── Data (canonical time-filtered) ──

  const kamScopeId = useKamScope();
  const { effectiveKamIds, role: actorRole } = useActorScope();
  // Scope set used for list filtering — KAM self-id wins (back-compat), else team.
  const scopeKamIds = useMemo(
    () => (kamScopeId ? [kamScopeId] : effectiveKamIds),
    [kamScopeId, effectiveKamIds],
  );
  const scopeKamIdSet = useMemo(
    () => (scopeKamIds ? new Set(scopeKamIds) : null),
    [scopeKamIds],
  );
  const allLeads = useMemo(
    () => (scopeKamIdSet ? getAllLeads().filter(l => scopeKamIdSet.has(l.kamId)) : getAllLeads()),
    [scopeKamIdSet]
  );
  const timeFilteredLeads = useMemo(
    () => getFilteredLeads({ period: timeFilter, kamIds: scopeKamIds, customFrom, customTo }),
    [timeFilter, scopeKamIds, customFrom, customTo]
  );
  const leadVMs = useMemo(() => toLeadListVM(timeFilteredLeads), [timeFilteredLeads]);

  // Merge DCF leads into unified pipeline
  const timeFilteredDCF = useMemo(
    () => getFilteredDCFLeads({ period: timeFilter, kamIds: scopeKamIds, customFrom, customTo }),
    [timeFilter, scopeKamIds, customFrom, customTo]
  );
  const dcfVMs = useMemo(
    () => toDCFLeadListVM(timeFilteredDCF).map(dcfToLeadCardVM),
    [timeFilteredDCF]
  );
  const allVMs = useMemo(() => [...leadVMs, ...dcfVMs], [leadVMs, dcfVMs]);


  // CEP Pending count (cross-channel, always computed)
  const cepPendingCount = useMemo(
    () => allVMs.filter(l => l.cep === null).length,
    [allVMs]
  );

  // Today's inspections (for the single remaining insight banner)
  const todayInspections = useMemo(
    () => allVMs.filter(l => {
      if (!l.inspectionDate) return false;
      const d = new Date(l.inspectionDate);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    [allVMs]
  );

  // Insight banner (inspections only — CEP Pending is now the inline pill)
  const showInspectionBanner = todayInspections > 0 && !pendingMode && !searchQuery && selectedChannel === 'all' && !selectedStage;

  // Auto-rotate not needed with single banner

  // ── Channel-aware stage defs ──
  const activeStages = useMemo(() => {
    if (selectedChannel === 'all') return null;
    if (selectedChannel === 'DCF') return DCF_STAGES;
    return STOCK_CHANNEL_STAGES; // NGS and GS both use stock channel stages
  }, [selectedChannel]);

  // ── Filtering pipeline ──

  const filteredVMs = useMemo(() => {
    let result = searchQuery
      ? toLeadListVM(searchLeads(searchQuery)).filter(l =>
          allVMs.some(vm => vm.id === l.id) // intersect search with time-filtered set
        )
      : allVMs;

    // Channel (canonical: NGS/GS/DCF)
    if (selectedChannel !== 'all') {
      result = result.filter(l => l.channel === selectedChannel);
    }

    // Channel-specific stage
    if (selectedStage && activeStages) {
      const stageDef = activeStages.find(s => s.key === selectedStage);
      if (stageDef) {
        result = result.filter(l => matchesStageFilter(l.stage, stageDef));
      }
    }

    // Pending mode (CEP Pending) — independent overlay, works across all channels
    if (pendingMode) {
      result = result.filter(l => l.cep === null);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'value': return (b.secondaryValue || 0) - (a.secondaryValue || 0);
        case 'stage': return classifyStage(a.stage).localeCompare(classifyStage(b.stage));
        default: return 0;
      }
    });

    return result;
  }, [allVMs, searchQuery, selectedChannel, selectedStage, activeStages, pendingMode, sortKey]);

  // ── Stage groups (for Cards view) ──

  const stageGroups: StageGroup[] = useMemo(() => {
    const map = new Map<string, LeadCardVM[]>();
    for (const lead of filteredVMs) {
      const bucket = classifyStage(lead.stage);
      if (!map.has(bucket)) map.set(bucket, []);
      map.get(bucket)!.push(lead);
    }

    const ordered: StageGroup[] = [];
    for (const def of STAGE_ORDER) {
      const leads = map.get(def.label);
      if (leads && leads.length > 0) {
        ordered.push({ key: def.label, label: def.label, color: def.color, bgColor: def.bgColor, dotColor: def.dotColor, leads });
        map.delete(def.label);
      }
    }
    for (const [key, leads] of map) {
      ordered.push({ key, label: key, color: 'text-slate-700', bgColor: 'bg-slate-50', dotColor: 'bg-slate-400', leads });
    }
    return ordered;
  }, [filteredVMs]);

  // ── Stats ──

  const stats = useMemo(() => {
    const total = filteredVMs.length;
    const active = filteredVMs.filter(l => l.status === 'Active').length;
    return { total, active };
  }, [filteredVMs]);

  const hasActiveFilters = pendingMode || searchQuery.length > 0 || selectedChannel !== 'all' || selectedStage !== null || timeFilter !== TimePeriod.MTD;

  // ── Handlers ──

  const handleLeadClick = (leadId: string) => {
    validateLeadIdForNavigation(leadId);
    if (onLeadClick) {
      onLeadClick(leadId);
    } else {
      setSelectedLeadId(leadId);
    }
  };

  const handleCallRA = (lead: LeadCardVM, e: React.MouseEvent) => {
    e.stopPropagation();
    const raPhone = lead.kamPhone || lead.phone;
    if (raPhone) {
      window.open(`tel:${raPhone}`, '_self');
      setCallStartTime(Date.now());
      const callId = `call-${Date.now()}`;
      setPendingCallId(callId);
      // "No silent calls" — after dialer returns, show feedback sheet
      callTimerRef.current = setTimeout(() => {
        setCallFeedbackLead(lead);
      }, 3000);
    } else {
      toast.error('No RA phone number available');
    }
  };

  const handleCallFeedbackSubmit = async (feedback: UnifiedFeedbackData) => {
    const lead = callFeedbackLead;
    const callId = pendingCallId || `call-${Date.now()}`;
    setCallFeedbackLead(null);
    setPendingCallId(null);
    toast.success('Call feedback saved', {
      description: `Rating: ${feedback.rating}/5 · ${lead?.customerName}`,
    });

    // Persist to DB
    try {
      await visitApi.registerCall({
        id: callId,
        dealerId: lead?.dealerId || '',
        dealerName: lead?.dealerName || '',
        dealerCode: lead?.dealerCode || '',
        dealerCity: lead?.city || '',
        userId: getSession()?.activeActorId || getSession()?.userId || '',
        kamName: 'Current User',
        durationSeconds: Math.max(1, Math.floor((Date.now() - callStartTime) / 1000)),
      });
      await visitApi.submitCallFeedback(callId, {
        interactionType: 'CALL',
        meetingPersonRole: feedback.meetingPersonRole,
        meetingPersonOtherText: feedback.meetingPersonOtherText,
        leadShared: feedback.leadShared,
        leadStatus: feedback.leadStatus,
        sellerLeadCount: feedback.sellerLeadCount,
        buyerLeadCount: feedback.buyerLeadCount,
        inspectionExpected: feedback.inspectionExpected,
        dcfDiscussed: feedback.dcfDiscussed,
        dcfStatus: feedback.dcfStatus,
        dcfCreditRange: feedback.dcfCreditRange,
        dcfDocsCollected: feedback.dcfDocsCollected,
        note: feedback.note,
        rating: feedback.rating,
      });
    } catch (err: any) {
      console.error('[LeadsPage] Failed to persist call feedback:', err);
      enqueue('call-feedback', callId, feedback as any);
      toast.info('Feedback queued for retry');
    }
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setPendingMode(false);
    setSelectedChannel('all');
    setSelectedStage(null);
    setTimeFilter(TimePeriod.MTD);
  };

  // ── Sub-pages ──

  if (selectedLeadId) {
    // Route to correct detail page based on lead source
    const leadLookup = getAnyLeadById(selectedLeadId);
    if (leadLookup?.source === 'dcf') {
      return (
        <DCFLeadDetailPage
          loanId={selectedLeadId}
          onBack={() => setSelectedLeadId(null)}
          userRole={userRole as 'KAM' | 'TL' | 'Admin'}
        />
      );
    }
    return (
      <LeadDetailPageV2
        leadId={selectedLeadId}
        onBack={() => setSelectedLeadId(null)}
        userRole={userRole}
      />
    );
  }

  if (showCreateLead) {
    return (
      <LeadCreatePage
        dealerId="dealer-ncr-001"
        onBack={() => setShowCreateLead(false)}
        onSuccess={(leadId: string) => {
          setShowCreateLead(false);
          handleLeadClick(leadId);
        }}
      />
    );
  }

  // ── RENDER ──

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">

      {/* ═══ HEADER ═══ */}
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-4 pb-3 space-y-3">

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Leads</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {stats.total} lead{stats.total !== 1 ? 's' : ''} &middot; {stats.active} active
            </p>
            {(actorRole === 'TL' || actorRole === 'Admin') && (
              <div className="mt-2"><KAMFilter sticky /></div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                aria-label="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                aria-label="Table view"
              >
                <TableProperties className="w-4 h-4" />
              </button>
            </div>

            {/* Create */}
            <button
              onClick={() => setShowCreateLead(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-medium
                         hover:bg-indigo-700 active:scale-[0.97] transition-all duration-150 min-h-[40px] shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden min-[360px]:inline">Create</span>
            </button>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, car..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border-0 rounded-xl text-[13px] text-slate-700
                         placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/40 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px]
                         font-medium text-slate-600 hover:border-slate-300 active:scale-95 transition-all min-h-[40px]"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/60 z-40 py-1 animate-scale-in">
                  {[
                    { key: 'newest' as SortKey, label: 'Newest first' },
                    { key: 'oldest' as SortKey, label: 'Oldest first' },
                    { key: 'value' as SortKey, label: 'C24 Quote / LTV' },
                    { key: 'stage' as SortKey, label: 'Stage' },
                  ].map((opt) => (
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

        {/* ── Time filter row ── */}
        <TimeFilterControl
          mode="chips"
          chipStyle="pill"
          value={timeFilter}
          onChange={setTimeFilter}
          options={CANONICAL_TIME_OPTIONS}
          labelOverrides={CANONICAL_TIME_LABELS}
          allowCustom
          customFrom={customFrom}
          customTo={customTo}
          onCustomRangeChange={({ fromISO, toISO }) => { setCustomFrom(fromISO); setCustomTo(toISO); }}
        />

        {/* ── Channel pills + Pending indicator (same row) ── */}
        <div className="flex items-center gap-2 pb-1">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 -mx-1 px-1">
            {CHANNEL_PILLS.map((ch) => {
              const isActive = selectedChannel === ch.key;
              const count = ch.key === 'all' ? allVMs.length : allVMs.filter(l => l.channel === ch.key).length;
              return (
                <button
                  key={ch.key}
                  onClick={() => setSelectedChannel(isActive ? 'all' : ch.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium
                    whitespace-nowrap transition-all duration-150 min-h-[32px] flex-shrink-0
                    ${isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  {ch.dot && !isActive && (
                    <span className={`w-1.5 h-1.5 rounded-full ${ch.dot} flex-shrink-0`} />
                  )}
                  {ch.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                    ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}
                  `}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Pending pill (always visible when count > 0) ── */}
          {cepPendingCount > 0 && (
            <button
              onClick={() => setPendingMode(!pendingMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold
                whitespace-nowrap transition-all duration-150 min-h-[32px] flex-shrink-0
                ${pendingMode
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                  : 'bg-white text-rose-600 border border-rose-200 hover:border-rose-300 hover:bg-rose-50'
                }
              `}
            >
              {!pendingMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              )}
              Pending
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${pendingMode ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}
              `}>
                {cepPendingCount}
              </span>
            </button>
          )}
          {/* Show "all clear" state when count is 0 — pill not rendered at all */}
        </div>
      </div>

      {/* ═══ SCROLLABLE BODY ═══ */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Channel-specific Stage Filters ── */}
        {activeStages && activeStages.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {selectedChannel === 'DCF' ? 'DCF Stages' : `${selectedChannel} Stages`}
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
              {activeStages.map((st) => {
                const isActive = selectedStage === st.key;
                return (
                  <button
                    key={st.key}
                    onClick={() => setSelectedStage(isActive ? null : st.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0
                      ${isActive
                        ? selectedChannel === 'DCF'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                          : 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : selectedChannel === 'DCF'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }
                    `}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Inspections Today Banner (only insight banner kept) ── */}
        {showInspectionBanner && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-sky-50 border border-sky-100 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4.5 h-4.5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-sky-900">
                  {todayInspections} inspection{todayInspections !== 1 ? 's' : ''} scheduled today
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Pending Mode Active Indicator ── */}
        {pendingMode && (
          <div className="mx-4 mt-3 flex items-center justify-between px-3.5 py-2 bg-rose-50 border border-rose-100 rounded-xl">
            <span className="text-[11px] font-medium text-rose-700">
              Showing CEP Pending leads &middot; {filteredVMs.length} result{filteredVMs.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setPendingMode(false)}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg
                         hover:bg-rose-100 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* ── Filters Applied Bar (non-pending filters) ── */}
        {!pendingMode && hasActiveFilters && (
          <div className="mx-4 mt-3 flex items-center justify-between px-3.5 py-2 bg-slate-100/70 rounded-xl">
            <span className="text-[11px] font-medium text-slate-500">
              {filteredVMs.length} result{filteredVMs.length !== 1 ? 's' : ''}
              {timeFilter !== TimePeriod.MTD && ` \u00b7 ${getTimeLabel(timeFilter)}`}
              {selectedChannel !== 'all' && ` \u00b7 ${selectedChannel}`}
              {selectedStage && activeStages && ` \u00b7 ${activeStages.find(s => s.key === selectedStage)?.label}`}
              {searchQuery && ` \u00b7 "${searchQuery}"`}
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

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="px-4 pt-2 space-y-3 animate-fade-in">
            {Array.from({ length: 3 }).map((_, i) => (
              <LeadCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && filteredVMs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              pendingMode ? 'bg-emerald-50' : 'bg-slate-100'
            }`}>
              {pendingMode ? (
                <span className="text-2xl">🎉</span>
              ) : (
                <Search className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <h3 className="text-[15px] font-semibold text-slate-700 mb-1">
              {pendingMode
                ? 'No CEP pending leads'
                : hasActiveFilters ? 'No leads match your filters' : 'No leads yet'
              }
            </h3>
            <p className="text-[12px] text-slate-400 max-w-[280px] leading-relaxed mb-4">
              {pendingMode
                ? 'All leads have CEP captured. Great work!'
                : hasActiveFilters
                  ? `No results for ${
                      [
                        selectedChannel !== 'all' ? selectedChannel : '',
                        selectedStage && activeStages ? activeStages.find(s => s.key === selectedStage)?.label : '',
                        timeFilter !== TimePeriod.MTD ? getTimeLabel(timeFilter) : '',
                      ].filter(Boolean).join(' + ') || 'current filters'
                    }. Try adjusting your filters.`
                  : 'Leads will appear here once they are created or assigned to you.'
              }
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl
                           hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onOpenLeadCreationFlow) {
                    onOpenLeadCreationFlow(); // No dealer pre-selected — user picks in form
                  } else {
                    setShowCreateLead(true); // Fallback to old flow
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl
                           hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Create Lead
              </button>
            )}
          </div>
        )}

        {/* ═══ CARDS VIEW ═══ */}
        {!isLoading && filteredVMs.length > 0 && viewMode === 'cards' && (
          <div className="px-4 pt-2 pb-4 space-y-4 animate-fade-in">
            {stageGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.key);
              return (
                <div key={group.key}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center gap-2.5 py-2.5 group"
                  >
                    <span className={`w-2 h-2 rounded-full ${group.dotColor} flex-shrink-0`} />
                    <span className={`text-[13px] font-semibold ${group.color}`}>
                      {group.label}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${group.bgColor} ${group.color}`}>
                      {group.leads.length}
                    </span>
                    <div className="flex-1" />
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200
                        ${isCollapsed ? '-rotate-90' : ''}
                      `}
                    />
                  </button>

                  {/* Cards */}
                  {!isCollapsed && (
                    <div className="space-y-3 animate-fade-in">
                      {group.leads.map((lead) => (
                        <LeadPipelineCard
                          key={lead.id}
                          lead={lead}
                          onTap={() => handleLeadClick(lead.id)}
                          onCall={(e) => handleCallRA(lead, e)}
                          showKAM={userRole === 'TL'}
                          showDCFDot={lead.channel === 'DCF'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ TABLE VIEW ═══ */}
        {!isLoading && filteredVMs.length > 0 && viewMode === 'table' && (
          <div className="px-4 pt-2 pb-4 animate-fade-in">
            <div className="card-premium overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <div className="col-span-4">Customer</div>
                <div className="col-span-2">Channel</div>
                <div className="col-span-3">Stage</div>
                <div className="col-span-3 text-right">CEP</div>
              </div>

              {/* Table rows */}
              {filteredVMs.map((lead, idx) => (
                <button
                  key={lead.id}
                  onClick={() => handleLeadClick(lead.id)}
                  className={`w-full grid grid-cols-12 gap-2 px-3.5 py-3 items-center text-left transition-colors min-h-[52px]
                    hover:bg-slate-50 active:bg-slate-100
                    ${idx < filteredVMs.length - 1 ? 'border-b border-slate-50' : ''}
                  `}
                >
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-1">
                      {lead.channel === 'DCF' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                      )}
                      <span className="text-[12px] font-semibold text-slate-800 truncate">{lead.customerName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{lead.carDisplay}</div>
                  </div>
                  <div className="col-span-2">
                    <ChannelChip channel={lead.channel} />
                  </div>
                  <div className="col-span-3">
                    <span className="text-[11px] font-medium text-slate-600 truncate block">{lead.stage}</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className={`text-[12px] font-bold tabular-nums ${lead.cep ? 'text-slate-700' : 'text-rose-400'}`}>
                      {lead.cep ? formatMoney(lead.cep) : 'Pending'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="py-2.5 px-4 glass-nav border-t border-slate-200/60 text-[11px] text-slate-400 text-center font-medium tracking-wide">
        {filteredVMs.length} of {allVMs.length} leads
      </div>

      {/* ── Call Feedback Sheet ("No silent calls" enforcement) ── */}
      {callFeedbackLead && (
        <UnifiedFeedbackModal
          interactionType="CALL"
          dealerName={callFeedbackLead.dealerName}
          visitId={pendingCallId || ''}
          onSubmit={handleCallFeedbackSubmit}
          closeable
          onClose={() => {
            setCallFeedbackLead(null);
            toast.info('Call logged as feedback pending');
          }}
        />
      )}
    </div>
  );
}