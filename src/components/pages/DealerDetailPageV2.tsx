/**
 * DEALER DETAIL V2 — Account Command Center
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  DESIGN NOTE                                        │
 * │                                                     │
 * │  Separation of concerns:                            │
 * │  "Context and review happen in Detail screens"      │
 * │  "Execution happens in Activity"                    │
 * │                                                     │
 * │  DealerDetail is for understanding a dealer:        │
 * │  1. Header → who is this, how are they doing?       │
 * │  2. Snapshot → 4 key numbers, instantly              │
 * │  3. Sections → progressively deeper context          │
 * │  4. Quick actions → Call + Note only                 │
 * │                                                     │
 * │  Why visits are NOT initiated here:                  │
 * │  Visit execution (start, log, track) is owned by    │
 * │  the Activity (V/C) page. This prevents duplicate    │
 * │  or accidental visit logs, and keeps DealerDetail    │
 * │  focused on review and understanding.                │
 * │                                                     
 * │  Visit history appears in the Activity tab as        │
 * │  read-only timeline entries — the KAM can see        │
 * │  what happened and when, without modifying.          │
 * │                                                     │
 * │  Single source of truth for visit actions:           │
 * │  Activity page → start, log, track, edit visits      │
 * │  DealerDetail → read-only visit history              │
 * └─────────────────────────────────────────────────────┘
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft, Phone, MapPin, StickyNote, ChevronRight,
  Clock, TrendingUp, FileText, Users,
  MessageCircle, CheckCircle2, AlertCircle, Send, Mic,
  Calendar, Activity, MoreHorizontal, Star,
  IndianRupee, Eye,
} from 'lucide-react';
import {
  getDealerByCode, getLeadsByDealerId, getCallsByDealerId,
  getVisitsByDealerId, getDCFLeadsByDealerId, toggleTopDealer
} from '../../data/selectors';
import { getDealerLeadMetrics, getFilteredCalls, getFilteredVisits, deriveDealerActivityStage, type DealerLeadMetrics } from '../../data/canonicalMetrics';
import { TimePeriod } from '../../lib/domain/constants';
import type { UserRole } from '../../lib/shared/appTypes';
import { StatusChip, FilterChip } from '../premium/Chip';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';
import { EmptyState, InlineEmpty } from '../premium/EmptyState';
import { CardSkeleton } from '../premium/SkeletonLoader';
import { DCFOnboardingFlow, DCFOnboardingStatus } from '../dcf/DCFOnboardingFlow';
import { useActivity } from '../../contexts/ActivityContext';
import { UnifiedFeedbackModal } from '../activity/VisitModals';
import type { UnifiedFeedbackData } from '../activity/visitHelpers';
import * as visitApi from '../../api/visit.api';
import { enqueue } from '../../lib/feedbackRetryQueue';
import { toast } from 'sonner@2.0.3';

// ── Types ──

type Section = 'overview' | 'activity' | 'leads' | 'notes';

interface DealerDetailPageV2Props {
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  tags?: string[];
  onBack: () => void;
  userRole?: UserRole;
  onNavigateToLeads?: () => void;
  onNavigateToActivity?: () => void;
  onNavigateToLeadDetail?: (leadId: string) => void;
  onNavigateToCallDetail?: (callId: string) => void;
  onNavigateToVisitDetail?: (visitId: string) => void;
  onNavigateToDCFDetail?: (loanId: string) => void;
}

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatAmount(amount: number): string {
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(0)}K`;
  return `\u20B9${amount}`;
}

// ── Progress Ring ──

function HealthRing({ pct, size = 48, stroke = 4 }: { pct: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const t = setTimeout(() => setOffset(circumference - (Math.min(pct, 100) / 100) * circumference), 120);
    return () => clearTimeout(t);
  }, [pct, circumference]);

  const color = pct >= 75 ? 'stroke-emerald-500' : pct >= 50 ? 'stroke-indigo-500' : pct >= 25 ? 'stroke-amber-400' : 'stroke-rose-400';

  return (
    <div className="relative flex-shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-slate-100" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className={`${color} transition-all duration-700 ease-out`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-slate-700">
        {Math.round(pct)}
      </span>
    </div>
  );
}

// ── Animated metric bar ──

function MetricBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, pct)), 120);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="h-1 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-600 ease-out`} style={{ width: `${width}%` }} />
    </div>
  );
}

// ── Component ──

export function DealerDetailPageV2({
  dealerName, dealerCode, dealerCity, tags = [],
  onBack, userRole = 'KAM',
  onNavigateToLeads, onNavigateToActivity,
  onNavigateToLeadDetail, onNavigateToCallDetail,
  onNavigateToVisitDetail, onNavigateToDCFDetail,
}: DealerDetailPageV2Props) {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<{ id: string; text: string; time: string; author: string }[]>([
    { id: 'n1', text: 'Dealer mentioned they expect 5+ seller leads next week. Follow up Thursday.', time: new Date(Date.now() - 2 * 86400000).toISOString(), author: 'You' },
    { id: 'n2', text: 'DCF onboarding documents submitted. Pending finance review.', time: new Date(Date.now() - 5 * 86400000).toISOString(), author: 'You' },
  ]);

  // DCF onboarding
  const [dcfOnboardingStatus, setDCFOnboardingStatus] = useState<DCFOnboardingStatus>(() =>
    tags.includes('DCF Onboarded') ? 'APPROVED' : 'NOT_ONBOARDED'
  );

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // ── Data ──
  const dealer = getDealerByCode(dealerCode);
  const leads = dealer ? getLeadsByDealerId(dealer.id) : [];
  const calls = dealer ? getCallsByDealerId(dealer.id) : [];
  const visits = dealer ? getVisitsByDealerId(dealer.id) : [];
  const dcfLeads = dealer ? getDCFLeadsByDealerId(dealer.id) : [];
  const kamOwner = dealer?.kamName || 'Rajesh Kumar';

  // ── Canonical metrics (timeframe-aware) ──
  const canonicalDealerMetrics = useMemo(() => {
    if (!dealer) return { leadsMTD: 0, inspectionsMTD: 0, sisMTD: 0, dcfMTD: 0 };
    return getDealerLeadMetrics(dealer.id, { period: timePeriod });
  }, [dealer, timePeriod]);

  // ── Metrics ──
  const metrics = useMemo(() => {
    const totalCalls = calls.length;
    const totalVisits = visits.length;
    const productivePct = totalCalls > 0 ? Math.round(((calls.filter((c: any) => c.isProductive).length) / totalCalls) * 100) : 0;

    const lastCall = calls.sort((a: any, b: any) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())[0];
    const lastVisit = visits.sort((a: any, b: any) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];
    const lastCallDate = lastCall ? new Date((lastCall as any).callDate) : null;
    const lastVisitDate = lastVisit ? new Date((lastVisit as any).visitDate) : null;
    const mostRecent = lastCallDate && lastVisitDate
      ? (lastCallDate > lastVisitDate ? lastCallDate : lastVisitDate)
      : lastCallDate || lastVisitDate;

    return {
      calls: totalCalls,
      visits: totalVisits,
      productivePct: Math.min(100, productivePct),
      lastActivity: mostRecent ? timeAgo(mostRecent.toISOString()) : 'No contact',
      lastActivityDays: mostRecent ? Math.floor((Date.now() - mostRecent.getTime()) / 86400000) : 999,
    };
  }, [calls, visits]);

  // Health score (composite)
  const healthScore = useMemo(() => {
    let score = 50;
    if (metrics.calls >= 3) score += 15;
    if (metrics.visits >= 1) score += 15;
    if (metrics.productivePct >= 50) score += 10;
    if (metrics.lastActivityDays <= 3) score += 10;
    if (leads.length >= 3) score += 5;
    return Math.min(100, score);
  }, [metrics, leads]);

  // ── Activity timeline (base — used only by mergedTimeline) ──
  // Note: the legacy `timeline` memo is superseded by `mergedTimeline`
  // which includes ActivityContext calls. Keep data flow clean:
  // mock DB data → mergedTimeline ← ActivityContext data

  // ── Open actions ──
  const openActions = useMemo(() => {
    const items: { id: string; label: string; type: 'warning' | 'info'; cta?: string }[] = [];
    if (metrics.lastActivityDays > 5) items.push({ id: 'overdue', label: `No contact in ${metrics.lastActivityDays} days`, type: 'warning', cta: 'Call now' });
    if (leads.filter(l => l.status === 'Active').length > 3) items.push({ id: 'active-leads', label: `${leads.filter(l => l.status === 'Active').length} active leads need follow-up`, type: 'info', cta: 'View leads' });
    if (dcfOnboardingStatus === 'NOT_ONBOARDED' && tags.includes('DCF Interested'))
      items.push({ id: 'dcf', label: 'DCF onboarding not started', type: 'info', cta: 'Start onboarding' });
    return items;
  }, [metrics, leads, dcfOnboardingStatus, tags]);

  // ── CEP Intelligence (dealer-level summary) ──
  const cepIntelligence = useMemo(() => {
    const activeLeads = leads.filter(l => l.status === 'Active');
    const withCEP = activeLeads.filter(l => l.cep && l.cep > 0);
    const captureRate = activeLeads.length > 0 ? Math.round((withCEP.length / activeLeads.length) * 100) : 0;
    const totalCEP = withCEP.reduce((s, l) => s + (l.cep || 0), 0);
    const totalC24Quote = leads.reduce((s, l) => s + (l.c24Quote || l.expectedRevenue || 0), 0);
    const pendingCount = activeLeads.length - withCEP.length;
    return { captureRate, totalCEP, totalC24Quote, pendingCount, withCEP: withCEP.length, total: activeLeads.length };
  }, [leads]);

  // ── Smart next-best-action (Call or Note only — visits start from Activity page) ──
  const nextAction = useMemo(() => {
    if (metrics.lastActivityDays > 3) return { label: 'Call', icon: Phone, primary: true };
    return { label: 'Note', icon: StickyNote, primary: false };
  }, [metrics]);

  // ── Note adding ──
  const addNote = () => {
    if (!noteText.trim()) return;
    setNotes(prev => [{ id: `n-${Date.now()}`, text: noteText.trim(), time: new Date().toISOString(), author: 'You' }, ...prev]);
    setNoteText('');
    toast.success('Note added');
  };

  // ── Call flow state machine ──
  // States: idle → calling → feedback → done
  type CallFlowState = 'idle' | 'calling' | 'feedback' | 'prompt';
  const [callFlowState, setCallFlowState] = useState<CallFlowState>('idle');
  const [callStartTime, setCallStartTime] = useState<number>(0);
  const [pendingCallId, setPendingCallId] = useState<string | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ActivityContext for tracking calls
  const { addCall, updateCall, getCallsByDealer } = useActivity();

  // Merge ActivityContext calls into timeline for real-time updates
  const activityCalls = dealer ? getCallsByDealer(dealer.id) : [];

  const handleInitiateCall = () => {
    const phone = dealer?.phone || '+919876543210';
    const now = Date.now();
    setCallStartTime(now);
    setCallFlowState('calling');

    // Open device dialer
    window.open(`tel:${phone}`, '_self');

    // Create a pending-feedback call entry immediately
    const dummySnapshot = { leads: 0, inspections: 0, stockIns: 0, dcfLeads: 0, dcfOnboarded: 0, dcfDisbursed: 0 };
    const newCall = addCall({
      dealerId: dealer?.id || dealerCode,
      dealerName,
      dealerCode,
      dealerCity,
      kamName: kamOwner,
      createdAt: new Date().toISOString(),
      status: 'pending-feedback',
      connected: false,
      tags: [],
      originContext: {
        origin: 'dealer_detail',
        dealerId: dealer?.id,
        dealerName,
        dealerCode,
      },
      beforeSnapshot: dummySnapshot,
      afterSnapshot: dummySnapshot,
      productiveStatus: 'pending',
    });
    setPendingCallId(newCall.id);

    // After a brief delay (simulating call returning to app), show feedback sheet
    // In production, this would be triggered by app resume or telephony API
    callTimerRef.current = setTimeout(() => {
      setCallFlowState('feedback');
    }, 3000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearTimeout(callTimerRef.current);
    };
  }, []);

  const handleCallFeedbackSubmit = async (feedback: UnifiedFeedbackData) => {
    const callId = pendingCallId || `call-${Date.now()}`;
    if (pendingCallId) {
      updateCall(pendingCallId, {
        status: 'completed',
        connected: true,
        outcome: `Rating: ${feedback.rating}/5 | Met: ${feedback.meetingPersonRole}`,
        notes: feedback.note || 'Feedback submitted',
        duration: Math.max(1, Math.floor((Date.now() - callStartTime) / 1000)),
        productiveStatus: feedback.leadShared ? 'productive' : 'non_productive',
        productiveReason: feedback.leadShared ? 'Lead discussion during call' : 'Standard call',
      });
    }
    setPendingCallId(null);
    setCallFlowState('idle');
    toast.success('Call feedback saved', {
      description: `${dealerName} · Rating: ${feedback.rating}/5`,
    });

    // Persist to DB
    try {
      await visitApi.registerCall({
        id: callId,
        dealerId: dealer?.id || dealerCode,
        dealerName,
        dealerCode,
        dealerCity,
        userId: 'current-user',
        kamName: kamOwner,
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
      console.error('[DealerDetail] Failed to persist call feedback:', err);
      enqueue('call-feedback', callId, feedback as any);
      toast.info('Feedback queued for retry');
    }
  };

  const handleCallFeedbackSkip = () => {
    // Call still appears as "pending-feedback" in Activity
    setPendingCallId(null);
    setCallFlowState('idle');
    toast.info('Call logged as feedback pending', {
      description: 'You can add feedback later from Activity',
    });
  };

  const handleCallFeedbackClose = () => {
    // User closed the sheet — show prompt mode
    setCallFlowState('prompt');
  };

  // Enhanced timeline: merge mock DB entries + ActivityContext entries
  const mergedTimeline = useMemo(() => {
    const items: { id: string; type: 'call' | 'visit'; date: string; title: string; detail: string; icon: typeof Phone; iconBg: string; iconColor: string; feedbackPending?: boolean }[] = [];

    // Mock DB calls
    calls.forEach((c: any) => {
      items.push({
        id: c.id, type: 'call', date: c.callDate,
        title: `Call \u2014 ${c.outcome || 'Connected'}`,
        detail: c.notes || `${c.duration || '3 min'} call`,
        icon: Phone, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
      });
    });

    // ActivityContext calls (avoid duplicates by ID)
    const existingIds = new Set(calls.map((c: any) => c.id));
    activityCalls.forEach((ac) => {
      if (existingIds.has(ac.id)) return;
      items.push({
        id: ac.id, type: 'call', date: ac.timestamp || ac.createdAt,
        title: ac.status === 'pending-feedback'
          ? `Call \u2014 Feedback pending`
          : `Call \u2014 ${ac.outcome || 'Completed'}`,
        detail: ac.notes || (ac.status === 'pending-feedback' ? 'Awaiting feedback' : `${ac.duration ? `${Math.floor(ac.duration / 60)}m ${ac.duration % 60}s` : '—'}`),
        icon: Phone,
        iconBg: ac.status === 'pending-feedback' ? 'bg-amber-50' : 'bg-emerald-50',
        iconColor: ac.status === 'pending-feedback' ? 'text-amber-600' : 'text-emerald-600',
        feedbackPending: ac.status === 'pending-feedback',
      });
    });

    // Mock DB visits
    visits.forEach((v: any) => {
      items.push({
        id: v.id, type: 'visit', date: v.visitDate,
        title: `Visit \u2014 ${v.outcome || 'Completed'}`,
        detail: v.feedback || v.notes || 'Dealer visit',
        icon: MapPin, iconBg: 'bg-sky-50', iconColor: 'text-sky-600',
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [calls, visits, activityCalls]);

  // Updated metrics incorporating ActivityContext calls
  const enhancedMetrics = useMemo(() => {
    const contextCallCount = activityCalls.length;
    const totalCalls = metrics.calls + contextCallCount;
    const connectedCalls = activityCalls.filter(c => c.connected).length;
    const totalConnected = (calls.filter((c: any) => c.isProductive).length) + connectedCalls;
    const productivePct = totalCalls > 0 ? Math.round((totalConnected / totalCalls) * 100) : 0;

    // Check if any ActivityContext call is more recent
    const latestContextCall = activityCalls.length > 0
      ? new Date(activityCalls[0].timestamp || activityCalls[0].createdAt)
      : null;

    let lastActivityDays = metrics.lastActivityDays;
    if (latestContextCall) {
      const contextDays = Math.floor((Date.now() - latestContextCall.getTime()) / 86400000);
      lastActivityDays = Math.min(lastActivityDays, contextDays);
    }

    return {
      ...metrics,
      calls: totalCalls,
      productivePct: Math.min(100, productivePct),
      lastActivity: lastActivityDays === 0 ? 'Just now' : lastActivityDays === 1 ? 'Yesterday' : lastActivityDays < 7 ? `${lastActivityDays}d ago` : metrics.lastActivity,
      lastActivityDays,
    };
  }, [metrics, activityCalls, calls]);

  // ── Render ──
  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">

      {/* ═══ HEADER ═══ */}
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-3 pb-3 space-y-3">
        {/* Back + Name + Health */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-bold text-slate-900 truncate">{dealerName}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-slate-400 font-medium">{dealerCode}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <span className="text-[11px] text-slate-400">{dealerCity}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <span className="text-[11px] text-slate-400">{kamOwner}</span>
            </div>
          </div>
          <HealthRing pct={healthScore} />
        </div>

        {/* Tags + Top Dealer toggle */}
        <div className="flex gap-1.5 flex-wrap items-center">
          {tags.map((tag, i) => (
            <StatusChip key={i} label={tag}
              variant={tag === 'Top Dealer' ? 'info' : tag.includes('DCF') ? 'success' : 'neutral'}
              size="sm"
            />
          ))}
          {dealer?.segment && (
            <StatusChip label={dealer.segment} variant="neutral" size="sm" />
          )}
          {/* Top Dealer toggle button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newStatus = toggleTopDealer(dealerCode);
              toast.success(newStatus ? 'Marked as Top Dealer' : 'Removed Top Dealer status');
              setForceUpdate(prev => prev + 1);
            }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all active:scale-95
              ${dealer?.isTopDealer
                ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            title={dealer?.isTopDealer ? 'Remove Top Dealer status' : 'Mark as Top Dealer'}
          >
            <Star className={`w-3 h-3 ${dealer?.isTopDealer ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            {dealer?.isTopDealer ? 'Top Dealer' : 'Mark Top'}
          </button>
        </div>

        {/* Primary Actions — Call + Note only (visits are started via Activity page) */}
        <div className="flex gap-2">
          <button
            onClick={handleInitiateCall}
            disabled={callFlowState !== 'idle'}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold
                       rounded-xl active:scale-95 transition-all min-h-[44px]
                       ${callFlowState === 'calling' ? 'bg-emerald-600 text-white animate-pulse' :
                         nextAction.label === 'Call' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                         'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}
                       disabled:opacity-60
            `}
          >
            <Phone className="w-3.5 h-3.5" />
            {callFlowState === 'calling' ? 'Calling...' : 'Call'}
          </button>
          <button onClick={() => { setActiveSection('notes'); setTimeout(() => document.getElementById('note-input')?.focus(), 100); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold
                       rounded-xl active:scale-95 transition-all min-h-[44px]
                       ${nextAction.label === 'Note' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}
            `}
          >
            <StickyNote className="w-3.5 h-3.5" />
            Note
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {([
            { key: 'overview' as Section, label: 'Overview' },
            { key: 'activity' as Section, label: 'Activity' },
            { key: 'leads' as Section, label: `Leads (${leads.length})` },
            { key: 'notes' as Section, label: 'Notes' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 min-h-[34px]
                ${activeSection === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 animate-fade-in">

        {isLoading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <>
            {/* ═══ OVERVIEW ═══ */}
            {activeSection === 'overview' && (
              <>
                {/* Snapshot Metrics */}
                <div className="card-premium p-3">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'MTD Calls', value: `${enhancedMetrics.calls}`, barPct: Math.min(100, (enhancedMetrics.calls / 8) * 100), barColor: 'bg-indigo-400' },
                      { label: 'MTD Visits', value: `${enhancedMetrics.visits}`, barPct: Math.min(100, (enhancedMetrics.visits / 4) * 100), barColor: 'bg-sky-400' },
                      { label: 'Productive', value: `${enhancedMetrics.productivePct}%`, barPct: enhancedMetrics.productivePct, barColor: enhancedMetrics.productivePct >= 50 ? 'bg-emerald-400' : 'bg-amber-400' },
                      { label: 'Last Act.', value: enhancedMetrics.lastActivity, barPct: Math.max(0, 100 - enhancedMetrics.lastActivityDays * 15), barColor: enhancedMetrics.lastActivityDays <= 3 ? 'bg-emerald-400' : 'bg-rose-400' },
                    ].map((m) => (
                      <div key={m.label} className="min-w-0">
                        <div className="text-[10px] text-slate-400 font-medium truncate">{m.label}</div>
                        <div className="text-[14px] font-bold text-slate-800 tabular-nums mt-0.5">{m.value}</div>
                        <MetricBar pct={m.barPct} color={m.barColor} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Actions */}
                {openActions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider px-1">Next Actions</h3>
                    {openActions.map((action) => (
                      <button key={action.id} className={`flex items-center gap-3 px-3.5 py-3 border rounded-2xl w-full text-left transition-all active:scale-[0.98]
                        ${action.type === 'warning' ? 'bg-amber-50 border-amber-100 hover:bg-amber-100/50' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100/50'}
                      `}
                        onClick={() => {
                          if (action.id === 'active-leads') setActiveSection('leads');
                          else if (action.id === 'overdue') toast.info('Opening dialer');
                          else toast.info('Action: ' + action.cta);
                        }}
                      >
                        <AlertCircle className={`w-4 h-4 flex-shrink-0 ${action.type === 'warning' ? 'text-amber-600' : 'text-indigo-600'}`} />
                        <span className={`text-[12px] font-medium flex-1 ${action.type === 'warning' ? 'text-amber-700' : 'text-indigo-700'}`}>
                          {action.label}
                        </span>
                        {action.cta && (
                          <span className={`text-[10px] font-bold ${action.type === 'warning' ? 'text-amber-600' : 'text-indigo-600'}`}>
                            {action.cta}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Performance summary */}
                <div className="card-premium p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-slate-800">Performance</h3>
                    <TimeFilterControl
                      mode="chips"
                      chipStyle="pill"
                      value={timePeriod}
                      onChange={setTimePeriod}
                      options={CANONICAL_TIME_OPTIONS}
                      labelOverrides={CANONICAL_TIME_LABELS}
                      allowCustom
                      customFrom={customFrom}
                      customTo={customTo}
                      onCustomRangeChange={({ fromISO, toISO }) => {
                        setCustomFrom(fromISO);
                        setCustomTo(toISO);
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Leads', value: canonicalDealerMetrics.leadsMTD, trend: 12, breakdown: '' },
                      { label: 'Inspections', value: canonicalDealerMetrics.inspectionsMTD, trend: 8, breakdown: '' },
                      { label: 'Stock-ins', value: canonicalDealerMetrics.sisMTD, trend: 5, breakdown: '' },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center justify-between">
                        <div>
                          <span className="text-[12px] text-slate-600 font-medium">{m.label}</span>
                          {m.breakdown && <span className="text-[10px] text-slate-400 ml-2">{m.breakdown}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold text-slate-800 tabular-nums">{m.value}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                            ${m.trend > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}
                          `}>
                            {m.trend > 0 ? '\u2191' : '\u2193'}{Math.abs(m.trend)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CEP Intelligence Card */}
                {leads.length > 0 && (
                  <div className="card-premium p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[13px] font-semibold text-slate-800">CEP Intelligence</h3>
                      {cepIntelligence.pendingCount > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          {cepIntelligence.pendingCount} pending
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Capture Rate</div>
                        <div className={`text-[16px] font-bold tabular-nums mt-0.5 ${
                          cepIntelligence.captureRate >= 80 ? 'text-emerald-600' :
                          cepIntelligence.captureRate >= 50 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {cepIntelligence.captureRate}%
                        </div>
                        <MetricBar pct={cepIntelligence.captureRate} color={
                          cepIntelligence.captureRate >= 80 ? 'bg-emerald-400' :
                          cepIntelligence.captureRate >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                        } />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Total CEP</div>
                        <div className="text-[16px] font-bold text-slate-800 tabular-nums mt-0.5">
                          {cepIntelligence.totalCEP > 0 ? formatAmount(cepIntelligence.totalCEP) : '--'}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">{cepIntelligence.withCEP}/{cepIntelligence.total} leads</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">C24 Quote</div>
                        <div className="text-[16px] font-bold text-indigo-600 tabular-nums mt-0.5">
                          {cepIntelligence.totalC24Quote > 0 ? formatAmount(cepIntelligence.totalC24Quote) : '--'}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">portfolio value</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DCF snapshot */}
                {(tags.includes('DCF Onboarded') || dcfLeads.length > 0) && (
                  <div className="card-premium p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13px] font-semibold text-slate-800">DCF Status</h3>
                      <StatusChip label={tags.includes('DCF Onboarded') ? 'Onboarded' : 'Not Onboarded'}
                        variant={tags.includes('DCF Onboarded') ? 'success' : 'warning'} dot size="sm" />
                    </div>
                    {dcfLeads.length > 0 && (
                      <div className="flex items-center gap-4 mt-3 text-[12px]">
                        <span className="text-slate-500">Disbursals: <span className="font-bold text-slate-800">{dcfLeads.filter((l: any) => l.overallStatus === 'DISBURSED').length}</span></span>
                        <span className="text-slate-500">Amount: <span className="font-bold text-emerald-700">{formatAmount(dcfLeads.filter((l: any) => l.overallStatus === 'DISBURSED').reduce((s: number, l: any) => s + (l.loanAmount || 0), 0))}</span></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent activity preview */}
                {mergedTimeline.length > 0 && (
                  <div className="card-premium p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[13px] font-semibold text-slate-800">Recent Activity</h3>
                      <button onClick={() => setActiveSection('activity')} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
                        View all <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-0">
                      {mergedTimeline.slice(0, 3).map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.id} className="flex items-start gap-3 py-2.5">
                            <div className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[12px] font-medium text-slate-700">{item.title}</span>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.detail}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 tabular-nums flex-shrink-0">{timeAgo(item.date)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ ACTIVITY TIMELINE (read-only visit history, calls navigable) ═══ */}
            {activeSection === 'activity' && (
              <>
                {mergedTimeline.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-6 bottom-6 w-px bg-slate-200/70" />

                    <div className="space-y-0">
                      {mergedTimeline.map((item) => {
                        const Icon = item.icon;
                        const isCall = item.type === 'call';

                        // Calls are navigable; visits are read-only
                        if (isCall) {
                          return (
                            <button
                              key={item.id}
                              onClick={() => onNavigateToCallDetail?.(item.id)}
                              className="relative flex items-start gap-3 w-full text-left py-3.5 pl-0 hover:bg-white/60 rounded-2xl transition-colors"
                            >
                              <div className={`relative z-10 w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-4 h-4 ${item.iconColor}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[13px] font-semibold text-slate-800 truncate">{item.title}</span>
                                  <span className="text-[10px] text-slate-400 font-medium flex-shrink-0 tabular-nums">{timeAgo(item.date)}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.detail}</p>
                                {item.feedbackPending && (
                                  <span className="inline-block mt-1.5 text-[9px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                    Feedback pending
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-3" />
                            </button>
                          );
                        }

                        // Visit — read-only timeline entry
                        return (
                          <div
                            key={item.id}
                            className="relative flex items-start gap-3 w-full py-3.5 pl-0"
                          >
                            <div className={`relative z-10 w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-4 h-4 ${item.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[13px] font-semibold text-slate-700 truncate">{item.title}</span>
                                <span className="text-[10px] text-slate-400 font-medium flex-shrink-0 tabular-nums">{timeAgo(item.date)}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.detail}</p>
                              <span className="inline-block mt-1.5 text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                                Read-only · manage via Activity
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <InlineEmpty label="No activity recorded yet" />
                )}
              </>
            )}

            {/* ═══ LEADS ═══ */}
            {activeSection === 'leads' && (
              <>
                {leads.length > 0 ? (
                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => onNavigateToLeadDetail?.(lead.id)}
                        className="card-premium p-3.5 w-full text-left active:scale-[0.995] transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-slate-800 truncate">{lead.customerName}</span>
                              <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {lead.make} {lead.model} {lead.year} &middot; {lead.regNo || lead.registrationNumber}
                            </div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <StatusChip label={lead.channel} variant="info" size="sm" />
                              <StatusChip label={lead.leadType} variant="neutral" size="sm" />
                              <StatusChip label={lead.stage || lead.currentStage || 'Active'}
                                variant={lead.status === 'Converted' ? 'success' : lead.status === 'Lost' ? 'danger' : 'warning'}
                                dot size="sm" />
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[9px] text-slate-400 font-medium tracking-wide">C24 Quote</div>
                            <div className="text-[12px] font-bold text-emerald-700">{formatAmount(lead.c24Quote || lead.expectedRevenue)}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {lead.cep ? `CEP: ${formatAmount(lead.cep)}` : <span className="text-rose-500 font-semibold">CEP Pending</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState variant="empty" type="leads" />
                )}
              </>
            )}

            {/* ═══ NOTES ═══ */}
            {activeSection === 'notes' && (
              <>
                {/* Add note input */}
                <div className="card-premium p-3">
                  <div className="flex items-center gap-2">
                    <input
                      id="note-input"
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addNote()}
                      placeholder="Add a note..."
                      className="flex-1 px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] text-slate-800
                                 placeholder:text-slate-400 border border-slate-200 focus:border-indigo-300
                                 focus:ring-2 focus:ring-indigo-100 outline-none transition-all min-h-[44px]"
                    />
                    <button
                      onClick={addNote}
                      disabled={!noteText.trim()}
                      className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center
                                 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes list */}
                {notes.length > 0 ? (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="card-premium p-3.5">
                        <p className="text-[12px] text-slate-700 leading-relaxed">{note.text}</p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <span className="text-[10px] font-semibold text-indigo-600">{note.author}</span>
                          <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                          <span className="text-[10px] text-slate-400 font-medium">{timeAgo(note.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <InlineEmpty label="No notes yet. Add your first note above." />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ═══ CALL FEEDBACK OVERLAY ═══ */}
      {callFlowState === 'feedback' && (
        <UnifiedFeedbackModal
          interactionType="CALL"
          dealerName={dealerName}
          visitId={pendingCallId || ''}
          onSubmit={handleCallFeedbackSubmit}
          closeable
          onClose={handleCallFeedbackClose}
        />
      )}

      {/* ═══ CALL FEEDBACK PROMPT (lightweight) ═══ */}
      {callFlowState === 'prompt' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={handleCallFeedbackSkip} />
          <div className="relative w-full max-w-lg mx-4 mb-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">Add call feedback?</p>
                  <p className="text-[11px] text-slate-400">{dealerName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCallFlowState('feedback')}
                  className="flex-1 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl
                             hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Add feedback
                </button>
                <button
                  onClick={handleCallFeedbackSkip}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 text-[12px] font-semibold rounded-xl
                             hover:bg-slate-200 active:scale-95 transition-all"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}