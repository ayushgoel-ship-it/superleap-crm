/**
 * DCF PAGE — Premium Finance-Grade Performance Cockpit
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  DESIGN NOTE                                        │
 * │                                                     │
 * │  Why a "financial cockpit"?                         │
 * │  DCF (Dealer Car Finance) is CARS24's disbursal     │
 * │  multiplier. Every disbursed loan = dealer           │
 * │  commission + CARS24 margin. This screen must        │
 * │  instantly communicate:                              │
 * │                                                     │
 * │  KPIs:                                              │
 * │  · Onboarded Dealers — how many can generate loans  │
 * │  · Lead-Giving Dealers — how many are ACTIVE        │
 * │  · DCF Leads — top of the financing funnel          │
 * │  · Disbursals (₹) — the LTV outcome                │
 * │                                                     │
 * │  Onboarding → Leads → Approvals → Disbursals       │
 * │  is the value chain. Each KPI's progress ring       │
 * │  shows target completion, so the KAM always knows   │
 * │  "am I on track this period?"                       │
 * │                                                     │
 * │  Action layer: insight banners call out blockers    │
 * │  (e.g. "dealers with 0 disbursals") to drive        │
 * │  disbursal-focused action, not just data browsing.  │
 * └─────────────────────────────────────────────────────┘
 */

import { useState, useMemo, useEffect } from 'react';
import { Shield, Lightbulb, ArrowRight, X } from 'lucide-react';
import type { PageView, DealersFilterContext, LeadsFilterContext } from '../../lib/shared/appTypes';
import { DCFPageTL } from './DCFPageTL';
import { DCFKpiCard } from '../dcf/DCFKpiCard';
import { DCFDealerCard, type DCFDealerData, type OnboardingStep } from '../dcf/DCFDealerCard';
import { FilterChip } from '../premium/Chip';
import { EmptyState } from '../premium/EmptyState';
import { CardSkeleton } from '../premium/SkeletonLoader';
import { toast } from 'sonner';
import { computeDashboardMetrics, getFilteredDCFLeads } from '../../data/canonicalMetrics';
import { getAllDealers } from '../../data/selectors';

// ── Types ──

interface DCFPageProps {
  onNavigateToDealers: (filter?: string, context?: string, filterContext?: DealersFilterContext) => void;
  onNavigateToLeads: (filterContext?: LeadsFilterContext) => void;
  onNavigate: (page: PageView) => void;
  onNavigateToDCFDealers?: (filterType: 'onboarded' | 'leadGiving') => void;
  onNavigateToDCFLeads?: () => void;
  onNavigateToDCFDisbursals?: () => void;
  onNavigateToDCFDealerDetail?: (dealerId: string) => void;
  onNavigateToDCFOnboardingDetail?: (dealerId: string) => void;
  onDateRangeChange?: (dateRange: string) => void;
  userRole?: 'KAM' | 'TL';
}

import { TimePeriod } from '../../lib/domain/constants';
import { CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';

type StatusFilter = 'All' | 'Onboarded' | 'Not Onboarded';

// ── Derive DCF dealer data from canonical sources ──

function buildDCFDealerData(timeScope: TimePeriod): DCFDealerData[] {
  const allDealers = getAllDealers();
  const dcfLeads = getFilteredDCFLeads({ period: timeScope });

  return allDealers.map(d => {
    const dealerDCFLeads = dcfLeads.filter(l => l.dealerId === d.id);
    const isOnboarded = (d.tags || []).includes('DCF Onboarded');
    const approvals = dealerDCFLeads.filter(l =>
      !['REJECTED', 'DELAYED'].includes(l.overallStatus.toUpperCase())
    ).length;
    const disbursals = dealerDCFLeads.filter(l => l.overallStatus === 'DISBURSED').length;

    return {
      id: d.id,
      name: d.name,
      code: d.code,
      isOnboarded,
      onboardingStatus: isOnboarded ? 'Active' : 'Not Onboarded',
      currentStep: (isOnboarded ? 'onboarded' : 'form_filled') as OnboardingStep,
      completedSteps: isOnboarded
        ? ['form_filled', 'docs_cibil', 'inspection', 'finance_approval', 'onboarded'] as OnboardingStep[]
        : ['form_filled'] as OnboardingStep[],
      dcfLeads: dealerDCFLeads.length,
      dcfLeadsTarget: 20,
      approvals,
      approvalsTarget: 12,
      disbursals,
      disbursalsTarget: 8,
    };
  });
}

// ── Component ──

export function DCFPage({
  onNavigateToDealers,
  onNavigateToLeads,
  onNavigate,
  onNavigateToDCFDealers,
  onNavigateToDCFLeads,
  onNavigateToDCFDisbursals,
  onNavigateToDCFDealerDetail,
  onNavigateToDCFOnboardingDetail,
  onDateRangeChange,
  userRole,
}: DCFPageProps) {

  // TL delegates to its own view
  if (userRole === 'TL') {
    return (
      <DCFPageTL
        onNavigateToDealers={onNavigateToDealers}
        onNavigateToLeads={onNavigateToLeads}
        onNavigate={onNavigate}
        onNavigateToDCFDealers={onNavigateToDCFDealers}
        onNavigateToDCFLeads={onNavigateToDCFLeads}
        onNavigateToDCFDisbursals={onNavigateToDCFDisbursals}
        onNavigateToDCFDealerDetail={onNavigateToDCFDealerDetail}
        onNavigateToDCFOnboardingDetail={onNavigateToDCFOnboardingDetail}
        onDateRangeChange={onDateRangeChange}
      />
    );
  }

  // ── State ──
  const [timeScope, setTimeScope] = useState<TimePeriod>(TimePeriod.MTD);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const handleTimeScopeChange = (scope: TimePeriod) => {
    setTimeScope(scope);
    onDateRangeChange?.(scope);
    // Brief loading flash for smooth data transition
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 200);
  };

  // ── Computed metrics (canonical) ──

  const dealers = useMemo(() => buildDCFDealerData(timeScope), [timeScope]);
  const onboarded = useMemo(() => dealers.filter(d => d.isOnboarded), [dealers]);
  const notOnboarded = useMemo(() => dealers.filter(d => !d.isOnboarded), [dealers]);
  const leadGiving = useMemo(() => onboarded.filter(d => d.dcfLeads > 0), [onboarded]);
  const zeroDisbursals = useMemo(() => onboarded.filter(d => d.disbursals === 0), [onboarded]);
  const nearComplete = useMemo(
    () => notOnboarded.filter(d => d.completedSteps.length >= 3),
    [notOnboarded]
  );

  // Canonical metrics for KPI cards
  const canonicalMetrics = useMemo(
    () => computeDashboardMetrics({ period: timeScope }),
    [timeScope]
  );

  // ── KPI values (driven by canonical data) ──
  const kpis = useMemo(() => ({
    onboardedValue: `${canonicalMetrics.dcfOnboarded}`,
    onboardedTarget: '20',
    onboardedPct: (canonicalMetrics.dcfOnboarded / 20) * 100,

    leadGivingValue: `${leadGiving.length}`,
    leadGivingTarget: `${onboarded.length}`,
    leadGivingPct: onboarded.length > 0 ? (leadGiving.length / onboarded.length) * 100 : 0,

    leadsValue: `${canonicalMetrics.dcfTotal}`,
    leadsTarget: '60',
    leadsPct: (canonicalMetrics.dcfTotal / 60) * 100,

    disbursalValue: `\u20B9${canonicalMetrics.dcfDisbursedValue.toFixed(1)}L`,
    disbursalTarget: '\u20B960L',
    disbursalPct: (canonicalMetrics.dcfDisbursedValue / 60) * 100,
    disbursalLoans: `${canonicalMetrics.dcfDisbursals}`,
  }), [canonicalMetrics, onboarded, leadGiving]);

  // ── Insights ──

  const insights = useMemo(() => {
    const items: { id: string; message: string; cta: string; action: () => void; color: string; bgColor: string }[] = [];

    if (nearComplete.length > 0) {
      items.push({
        id: 'near-complete',
        message: `${nearComplete.length} dealer${nearComplete.length > 1 ? 's are' : ' is'} one step from full DCF onboarding`,
        cta: 'Review dealers',
        action: () => {
          setStatusFilter('Not Onboarded');
          toast.info('Showing dealers close to onboarding completion');
        },
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50 border-indigo-100',
      });
    }

    if (zeroDisbursals.length > 0) {
      items.push({
        id: 'zero-disbursals',
        message: `${zeroDisbursals.length} active dealer${zeroDisbursals.length > 1 ? 's have' : ' has'} zero disbursals this period`,
        cta: 'Follow up now',
        action: () => {
          setStatusFilter('Onboarded');
          toast.info('Review dealers with zero disbursals');
        },
        color: 'text-amber-700',
        bgColor: 'bg-amber-50 border-amber-100',
      });
    }

    return items.filter(i => !dismissedInsights.has(i.id));
  }, [nearComplete, zeroDisbursals, dismissedInsights]);

  // ── Filtered dealers ──

  const filteredDealers = useMemo(() => {
    switch (statusFilter) {
      case 'Onboarded': return onboarded;
      case 'Not Onboarded': return notOnboarded;
      default: return dealers;
    }
  }, [dealers, onboarded, notOnboarded, statusFilter]);

  // ── Navigation handlers ──

  const handleOnboardedClick = () => {
    if (onNavigateToDCFDealers) onNavigateToDCFDealers('onboarded');
    else onNavigateToDealers('DCF', 'Showing DCF onboarded dealers', { channel: 'DCF', status: 'Onboarded', dateRange: timeScope });
  };

  const handleLeadGivingClick = () => {
    if (onNavigateToDCFDealers) onNavigateToDCFDealers('leadGiving');
    else onNavigateToDealers('DCF', 'Showing lead-giving DCF dealers', { channel: 'DCF', status: 'Onboarded', leadGiving: true, dateRange: timeScope });
  };

  const handleLeadsClick = () => {
    if (onNavigateToDCFLeads) onNavigateToDCFLeads();
    else onNavigateToLeads({ channel: 'DCF', dateRange: timeScope });
  };

  const handleDisbursalsClick = () => {
    if (onNavigateToDCFDisbursals) onNavigateToDCFDisbursals();
    else onNavigate('performance');
  };

  const handleDealerTap = (dealer: DCFDealerData) => {
    if (dealer.isOnboarded) {
      onNavigateToDCFDealerDetail?.(dealer.id) ??
        onNavigateToDealers('DCF', 'Viewing dealer DCF performance', { channel: 'DCF', dateRange: timeScope });
    } else {
      onNavigateToDCFOnboardingDetail?.(dealer.id);
    }
  };

  const handleDealerOverflow = (dealer: DCFDealerData, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Options for ${dealer.name}`, { description: 'View details · Nudge dealer · Add note' });
  };

  // ── Render ──

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">

      {/* ═══ HEADER & CONTEXT BAR ═══ */}
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-4 pb-3 space-y-3">

        {/* Title + Role pill */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">DCF Loans</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Dealer financing performance</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg">
            <Shield className="w-3 h-3 text-indigo-500" />
            <span className="text-[10px] font-medium text-slate-500">KAM View</span>
          </div>
        </div>

        {/* Time scope — canonical options */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {CANONICAL_TIME_OPTIONS.filter(k => k !== TimePeriod.CUSTOM).map((key) => (
            <button
              key={key}
              onClick={() => handleTimeScopeChange(key)}
              className={`flex-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 min-h-[36px]
                ${timeScope === key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              {CANONICAL_TIME_LABELS[key] || key}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ SCROLLABLE BODY ═══ */}
      <div className="flex-1 overflow-y-auto">

        {/* ── PRIMARY KPI CARDS ── */}
        <div className="px-4 pt-4 pb-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <DCFKpiCard
                label="Onboarded"
                value={kpis.onboardedValue}
                target={kpis.onboardedTarget}
                pct={kpis.onboardedPct}
                trend={3}
                trendLabel="+3 this month"
                onClick={handleOnboardedClick}
              />
              <DCFKpiCard
                label="Lead Giving"
                value={kpis.leadGivingValue}
                target={kpis.leadGivingTarget}
                pct={kpis.leadGivingPct}
                trend={null}
                trendLabel={`${Math.round(kpis.leadGivingPct)}% active`}
                onClick={handleLeadGivingClick}
              />
              <DCFKpiCard
                label="DCF Leads"
                value={kpis.leadsValue}
                target={kpis.leadsTarget}
                pct={kpis.leadsPct}
                trend={28}
                trendLabel="+28% vs last month"
                onClick={handleLeadsClick}
              />
              <DCFKpiCard
                label="Disbursals"
                value={kpis.disbursalValue}
                target={kpis.disbursalTarget}
                pct={kpis.disbursalPct}
                trend={12}
                trendLabel={`${kpis.disbursalLoans} loans disbursed`}
                isCurrency
                onClick={handleDisbursalsClick}
              />
            </div>
          )}
        </div>

        {/* ── INTELLIGENCE / ACTION BANNERS ── */}
        {insights.length > 0 && !isLoading && (
          <div className="px-4 pt-3 space-y-2 animate-fade-in">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`flex items-start gap-2.5 px-3.5 py-3 border rounded-2xl ${insight.bgColor}`}
              >
                <Lightbulb className={`w-4 h-4 ${insight.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-[12px] font-medium ${insight.color} leading-relaxed`}>
                    {insight.message}
                  </div>
                  <button
                    onClick={insight.action}
                    className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold ${insight.color} hover:opacity-80 transition-opacity`}
                  >
                    {insight.cta}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => setDismissedInsights(prev => new Set([...prev, insight.id]))}
                  className="p-1 rounded-md hover:bg-white/50 transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── DEALER PERFORMANCE SECTION ── */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-slate-800">Dealer Performance</h2>
          </div>

          {/* Segment pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1">
            {([
              { key: 'All' as StatusFilter, count: dealers.length },
              { key: 'Onboarded' as StatusFilter, count: onboarded.length },
              { key: 'Not Onboarded' as StatusFilter, count: notOnboarded.length },
            ]).map(({ key, count }) => (
              <FilterChip
                key={key}
                label={key}
                active={statusFilter === key}
                onClick={() => setStatusFilter(key)}
                count={count}
              />
            ))}
          </div>
        </div>

        {/* Dealer Cards */}
        <div className="px-4 pb-6 space-y-3">
          {isLoading ? (
            <div className="space-y-3 animate-fade-in">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filteredDealers.length > 0 ? (
            <div className="space-y-3 animate-fade-in">
              {filteredDealers.map((dealer) => (
                <DCFDealerCard
                  key={dealer.id}
                  dealer={dealer}
                  onTap={() => handleDealerTap(dealer)}
                  onOverflow={(e) => handleDealerOverflow(dealer, e)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant={statusFilter !== 'All' ? 'filtered' : 'empty'}
              type="dcf"
              title={statusFilter !== 'All' ? undefined : 'Start DCF onboarding'}
              description={
                statusFilter !== 'All'
                  ? undefined
                  : 'Onboarding dealers to DCF unlocks financing growth. Start with your most active dealers.'
              }
              actionLabel={statusFilter !== 'All' ? undefined : 'Onboard first dealer'}
              onAction={statusFilter !== 'All' ? undefined : () => toast.info('DCF onboarding flow coming soon')}
              secondaryLabel={statusFilter !== 'All' ? 'Clear filter' : undefined}
              onSecondary={statusFilter !== 'All' ? () => setStatusFilter('All') : undefined}
            />
          )}
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="py-2.5 px-4 glass-nav border-t border-slate-200/60 text-[11px] text-slate-400 text-center font-medium tracking-wide">
        {filteredDealers.length} of {dealers.length} dealers &middot; {timeScope}
      </div>
    </div>
  );
}