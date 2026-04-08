/**
 * LEAD DETAIL V2 — Lead Story & Progress
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  DESIGN NOTE                                        │
 * │                                                     │
 * │  CTA layout: Call | WhatsApp | CEP Action            │
 * │  - Call → opens UnifiedFeedbackModal in sheet mode   │
 * │  - After call feedback save, if CEP pending →        │
 * │    auto-open CEPModal                                │
 * │  - CEP CTA → opens CEPModal directly                 │
 * │                                                     │
 * │  "No silent calls" rule enforced here.               │
 * │  Token flow fully removed. Revenue → CEP.            │
 * └─────────────────────────────────────────────────────┘
 */

import { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Phone, MessageCircle, Calendar, ChevronDown, ChevronUp,
  CheckCircle2, Clock, MoreHorizontal, User, MapPin,
  FileText, IndianRupee, Send, ChevronRight, Copy, Zap,
} from 'lucide-react';
import { getLeadById } from '../../data/selectors';
import type { Lead } from '../../data/types';
import { deriveRangeStatus, mapChannelToCanonical } from '../../data/canonicalMetrics';
import { StatusChip } from '../premium/Chip';
import { InlineEmpty } from '../premium/EmptyState';
import { toast } from 'sonner@2.0.3';
import { CEPModal } from '../leads/CEPModal';
import type { CEPData, CEPConfidence } from '../leads/CEPModal';
import { UnifiedFeedbackModal } from '../activity/VisitModals';
import type { UnifiedFeedbackData } from '../activity/visitHelpers';
import * as visitApi from '../../api/visit.api';
import { enqueue } from '../../lib/feedbackRetryQueue';
import { updateLeadCEP } from '../../lib/api/crmApi';

// ── Props ──

interface LeadDetailPageV2Props {
  leadId: string;
  onBack: () => void;
  userRole?: 'KAM' | 'TL' | 'Admin';
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
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(0)}K`;
  return `\u20B9${amount}`;
}

function channelVariant(ch: string): 'info' | 'warning' | 'success' | 'neutral' {
  if (ch === 'NGS') return 'info';
  if (ch === 'GS') return 'success';
  if (ch === 'DCF') return 'warning';
  return 'neutral';
}

function stageVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  if (status === 'Converted' || status === 'Completed') return 'success';
  if (status === 'Lost') return 'danger';
  return 'warning';
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard?.writeText(text);
  toast.success(`${label} copied`);
}

// ── Types ──

type Tab = 'overview' | 'journey' | 'notes';

interface JourneyStage {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  details?: { label: string; value: string }[];
}

// ── Progress Bar ──

function ProgressStrip({ completed, total }: { completed: number; total: number }) {
  const pct = (completed / total) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 tabular-nums">{completed}/{total}</span>
    </div>
  );
}

// ── Component ──

export function LeadDetailPageV2({ leadId, onBack, userRole }: LeadDetailPageV2Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<{ id: string; text: string; time: string; author: string }[]>([
    { id: 'ln1', text: 'Customer agreed to inspection slot on 10th. Confirmed availability.', time: new Date(Date.now() - 1 * 86400000).toISOString(), author: 'You' },
  ]);

  // ── Modal / Sheet state ──
  const [showCEPModal, setShowCEPModal] = useState(false);
  const [showCallFeedback, setShowCallFeedback] = useState(false);
  const [localCep, setLocalCep] = useState<number | null>(null);
  const [localCepConfidence, setLocalCepConfidence] = useState<CEPConfidence>('estimated');
  const [localCepNotes, setLocalCepNotes] = useState('');
  const [cepSaving, setCepSaving] = useState(false);

  // ── Lead data ──
  const lead = getLeadById(leadId);
  const effectiveCep = localCep ?? lead?.cep ?? null;

  if (!lead) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#f7f8fa] gap-4">
        <div className="text-[14px] text-slate-500">Lead not found</div>
        <button onClick={onBack} className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700">Go back</button>
      </div>
    );
  }

  // ── Computed values ──
  const daysActive = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000);

  // ── Journey stages ──
  const journeyStages: JourneyStage[] = useMemo(() => [
    {
      id: 'lead-created', label: 'Lead Created', status: 'completed' as const,
      timestamp: new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      details: [
        { label: 'CEP entered by KAM', value: effectiveCep ? formatAmount(effectiveCep) : 'Not entered' },
      ],
    },
    {
      id: '3ca-completed', label: '3CA Completed', status: 'completed' as const,
      timestamp: '2 Dec 2025',
      details: [
        { label: 'RA name', value: 'Suresh RA' },
        { label: 'Calls', value: '3 attempts, 1 connect' },
      ],
    },
    {
      id: 'inspection-scheduled', label: 'Inspection Scheduled',
      status: (lead.stage === 'Inspection Scheduled' ? 'current' : 'completed') as const,
      timestamp: '2 Dec 2025',
      details: [
        { label: 'Slot', value: '2 Dec 2025, 3:00\u20134:00 PM' },
        { label: 'CJ email', value: 'mohit.singh@cars24.com' },
      ],
    },
    {
      id: 'inspection-done', label: 'Inspection Done',
      status: (['PLL', 'PR', 'Stock-in'].includes(lead.stage) ? 'completed' : 'pending') as const,
      timestamp: ['PLL', 'PR', 'Stock-in'].includes(lead.stage) ? '2 Dec 2025' : undefined,
      details: ['PLL', 'PR', 'Stock-in'].includes(lead.stage) ? [
        { label: 'LMS link', value: 'APP ID: DL6CAC9999' },
      ] : [],
    },
    {
      id: 'hb-discovered', label: 'HB Discovered',
      status: (['PLL', 'PR', 'Stock-in'].includes(lead.stage) ? 'completed' : 'pending') as const,
      timestamp: ['PLL', 'PR', 'Stock-in'].includes(lead.stage) ? '2 Dec 2025' : undefined,
      details: ['PLL', 'PR', 'Stock-in'].includes(lead.stage) ? [
        { label: 'TP (Target Price)', value: '\u20B94,60,000' },
        { label: 'C24 Price', value: '\u20B94,35,000' },
        { label: 'Margin', value: '7% (\u20B930,000)' },
      ] : [],
    },
    {
      id: 'ocb-raised', label: 'OCB Raised',
      status: (['PR', 'Stock-in'].includes(lead.stage) ? 'completed' : 'pending') as const,
      timestamp: ['PR', 'Stock-in'].includes(lead.stage) ? '2 Dec 2025' : undefined,
      details: ['PR', 'Stock-in'].includes(lead.stage) ? [
        { label: 'OCB / Nego Price', value: '\u20B94,50,000' },
        { label: 'TP band', value: '\u20B94,45,000 \u2013 \u20B94,55,000' },
      ] : [],
    },
    {
      id: 'pr-punched', label: 'PR Punched',
      status: (['PR', 'Stock-in'].includes(lead.stage) ? 'completed' : 'pending') as const,
      timestamp: ['PR', 'Stock-in'].includes(lead.stage) ? '2 Dec 2025' : undefined,
      details: ['PR', 'Stock-in'].includes(lead.stage) ? [
        { label: 'Customer payout (CP)', value: '\u20B94,05,000' },
      ] : [],
    },
    {
      id: 'stock-in', label: 'Stock-in',
      status: (lead.stage === 'Stock-in' ? 'current' : 'pending') as const,
      timestamp: lead.stage === 'Stock-in' ? '3 Dec 2025' : undefined,
    },
    {
      id: 'payout', label: 'Payout',
      status: (lead.actualRevenue > 0 ? 'completed' : 'pending') as const,
      timestamp: lead.actualRevenue > 0 ? '3 Dec 2025' : undefined,
      details: lead.actualRevenue > 0 ? [
        { label: 'Payout amount', value: formatAmount(lead.actualRevenue) },
      ] : [],
    },
  ], [lead, effectiveCep]);

  const completedStages = journeyStages.filter(s => s.status === 'completed').length;
  const currentStage = journeyStages.find(s => s.status === 'current');

  const toggleStage = (id: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Smart CTA ──
  const primaryCTA = useMemo(() => {
    const s = lead.stage;
    if (s === 'Inspection Scheduled') return { label: 'Confirm Inspection', icon: Calendar };
    if (['PLL'].includes(s)) return { label: 'Raise OCB', icon: Zap };
    if (['PR'].includes(s)) return { label: 'Push PR', icon: FileText };
    return { label: 'Call Customer', icon: Phone };
  }, [lead.stage]);

  // ── CEP Action (third CTA) ──
  const cepAction = useMemo(() => {
    const isDCF = lead.channel === 'DCF';
    if (!effectiveCep) {
      return { label: isDCF ? 'Add LTV' : 'Add CEP', badge: 'Action Required', style: 'cep-pending' as const };
    }
    return { label: isDCF ? 'Edit LTV' : 'Edit CEP', badge: null, style: 'cep-captured' as const };
  }, [effectiveCep, lead.channel]);

  // ── CEP Intelligence ──
  const c24Quote = lead.c24Quote || lead.expectedRevenue || null;
  const cepGap = useMemo(() => {
    if (!effectiveCep || !c24Quote) return null;
    const gap = effectiveCep - c24Quote;
    return { raw: gap, abs: Math.abs(gap), pct: Math.round((gap / c24Quote) * 100) };
  }, [effectiveCep, c24Quote]);

  // ── Range Status (GS/NGS only) ──
  const rangeStatus = useMemo(() => {
    if (mapChannelToCanonical(lead.channel) === 'DCF') return null;
    return deriveRangeStatus({ cep: effectiveCep, c24Quote });
  }, [lead.channel, effectiveCep, c24Quote]);

  // ── CEP Save Handler ──
  const handleCEPSave = useCallback(async (data: CEPData) => {
    setCepSaving(true);
    try {
      await updateLeadCEP(leadId, data.cep);
      setLocalCep(data.cep);
      setLocalCepConfidence(data.confidence);
      setLocalCepNotes(data.notes);
    } catch (err) {
      console.error('[LeadDetail] CEP save error:', err);
      // Still update locally for responsiveness
      setLocalCep(data.cep);
      setLocalCepConfidence(data.confidence);
      setLocalCepNotes(data.notes);
    } finally {
      setCepSaving(false);
    }
  }, [leadId]);

  // ── Call Feedback Handler ──
  const handleCallFeedbackSubmit = useCallback(async (feedback: UnifiedFeedbackData) => {
    setShowCallFeedback(false);
    toast.success('Call feedback saved');

    // If CEP is missing, auto-open CEP modal after feedback
    if (!effectiveCep) {
      setTimeout(() => {
        setShowCEPModal(true);
      }, 400);
    }

    // Persist to DB
    const callId = `call-${Date.now()}`;
    try {
      await visitApi.registerCall({
        id: callId,
        dealerId: lead?.dealerId || '',
        dealerName: lead?.dealerName || '',
        dealerCode: lead?.dealerCode || '',
        dealerCity: lead?.city || '',
        userId: 'current-user',
        kamName: lead?.kamName || 'Current User',
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
      console.error('[LeadDetail] Failed to persist call feedback:', err);
      enqueue('call-feedback', callId, feedback as any);
    }
  }, [effectiveCep, lead]);

  // ── Notes ──
  const addNote = () => {
    if (!noteText.trim()) return;
    setNotes(prev => [{ id: `ln-${Date.now()}`, text: noteText.trim(), time: new Date().toISOString(), author: 'You' }, ...prev]);
    setNoteText('');
    toast.success('Note added');
  };

  // ── Render ──
  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">

      {/* ═══ HEADER ═══ */}
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-3 pb-3 space-y-3">
        {/* Nav row */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-bold text-slate-900 truncate">{lead.customerName}</h1>
            <button
              onClick={() => copyToClipboard(lead.customerPhone, 'Phone')}
              className="flex items-center gap-1 mt-0.5 group"
            >
              <span className="text-[11px] text-slate-400 font-medium">{lead.customerPhone}</span>
              <Copy className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <MoreHorizontal className="w-5 h-5 text-slate-500" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg py-1.5 w-48 z-40 animate-scale-in">
                  {['Add Note', 'Share Details', 'Update Stage'].map(item => (
                    <button key={item} onClick={() => { setShowMenu(false); toast.info(item); }}
                      className="w-full px-4 py-2.5 text-left text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vehicle + Badges */}
        <div>
          <div className="text-[13px] font-medium text-slate-700">
            {lead.make} {lead.model} {lead.year}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{lead.regNo || lead.registrationNumber}</div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatusChip label={lead.channel} variant={channelVariant(lead.channel)} size="sm" />
          <StatusChip label={lead.leadType} variant="neutral" size="sm" />
          <StatusChip label={lead.stage || lead.currentStage || 'Active'} variant={stageVariant(lead.status)} dot size="sm" />
          {effectiveCep && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              CEP: {formatAmount(effectiveCep)}
            </span>
          )}
        </div>

        {/* Primary Actions: Call | WhatsApp | CEP Action */}
        <div className="flex gap-2">
          {/* CALL → Opens UnifiedFeedbackModal in sheet mode (No silent calls!) */}
          <button
            onClick={() => setShowCallFeedback(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold
                       rounded-xl hover:bg-indigo-700 active:scale-95 transition-all min-h-[44px]"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </button>
          <a href={`https://wa.me/${lead.customerPhone.replace(/\+/g, '')}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white text-[12px] font-semibold
                       rounded-xl hover:bg-emerald-700 active:scale-95 transition-all min-h-[44px]"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
          {/* CEP Action CTA → Opens CEPModal */}
          <button onClick={() => setShowCEPModal(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl active:scale-95 transition-all min-h-[44px] relative
              ${cepAction.style === 'cep-pending'
                ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-200/40'
                : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
              }
            `}
          >
            {cepAction.badge && (
              <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full border border-rose-200">
                !
              </span>
            )}
            <span className="text-[12px] font-semibold flex items-center gap-1">
              <IndianRupee className="w-3 h-3" />
              {cepAction.label}
            </span>
            {cepAction.badge && (
              <span className={`text-[8px] font-medium ${cepAction.style === 'cep-pending' ? 'text-rose-200' : 'text-slate-400'}`}>
                {cepAction.badge}
              </span>
            )}
          </button>
        </div>

        {/* CEP micro status strip */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-400">
            {lead.channel === 'DCF' ? 'LTV' : 'CEP'} Status:
          </span>
          {effectiveCep ? (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Captured
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Pending
            </span>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {([
            { key: 'overview' as Tab, label: 'Overview' },
            { key: 'journey' as Tab, label: 'Journey' },
            { key: 'notes' as Tab, label: `Notes (${notes.length})` },
          ]).map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 min-h-[34px]
                ${activeTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 animate-fade-in">

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <>
            {/* Snapshot KPIs */}
            <div className="card-premium p-3">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Channel', value: lead.channel, color: 'text-indigo-700' },
                  { label: lead.channel === 'DCF' ? 'LTV' : 'C24 Quote', value: formatAmount(c24Quote || 0), color: 'text-emerald-700' },
                  { label: 'Age', value: `${daysActive}d`, color: daysActive > 7 ? 'text-amber-700' : 'text-slate-800' },
                  { label: 'Stage', value: (lead.stage || 'Active').split(' ')[0], color: 'text-slate-800' },
                ].map(m => (
                  <div key={m.label} className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-medium">{m.label}</div>
                    <div className={`text-[14px] font-bold tabular-nums mt-0.5 truncate ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next best action */}
            {currentStage && (
              <button
                onClick={() => toast.info(primaryCTA.label)}
                className="flex items-center gap-3 px-3.5 py-3 border rounded-2xl bg-indigo-50 border-indigo-100 w-full text-left
                           hover:bg-indigo-100/50 transition-all active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-indigo-700">Next step: {primaryCTA.label}</div>
                  <div className="text-[11px] text-indigo-500 mt-0.5">Current stage: {currentStage.label}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              </button>
            )}

            {/* Journey progress preview */}
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-slate-800">Lead Journey</h3>
                <button onClick={() => setActiveTab('journey')} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
                  Full journey <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <ProgressStrip completed={completedStages} total={journeyStages.length} />

              {/* Quick timeline preview */}
              <div className="mt-3 space-y-0">
                {journeyStages.filter(s => s.status !== 'pending').slice(-3).map(stage => (
                  <div key={stage.id} className="flex items-center gap-2.5 py-1.5">
                    {stage.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0 animate-pulse" />
                    )}
                    <span className={`text-[12px] font-medium flex-1 ${stage.status === 'current' ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {stage.label}
                    </span>
                    {stage.timestamp && (
                      <span className="text-[10px] text-slate-400 tabular-nums">{stage.timestamp}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Customer + Dealer + Pricing */}
            <div className="card-premium divide-y divide-slate-100">
              {/* Customer */}
              <div className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">Customer</div>
                  <div className="text-[13px] font-semibold text-slate-800 mt-0.5">{lead.customerName}</div>
                  <button onClick={() => copyToClipboard(lead.customerPhone, 'Phone')}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 mt-0.5">
                    {lead.customerPhone} <Copy className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* Dealer */}
              <div className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">Dealer</div>
                  <div className="text-[13px] font-semibold text-slate-800 mt-0.5">{lead.dealerName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{lead.dealerCode} &middot; KAM: {lead.kamName}</div>
                </div>
              </div>

              {/* Pricing */}
              <div className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">{lead.channel === 'DCF' ? 'LTV' : 'C24 Quote'}</div>
                  <div className="text-[15px] font-bold text-emerald-700 mt-0.5">{formatAmount(c24Quote || 0)}</div>
                  {effectiveCep && (
                    <div className="text-[11px] text-slate-500 mt-0.5">CEP: {formatAmount(effectiveCep)}</div>
                  )}
                  {!effectiveCep && (
                    <div className="text-[11px] font-semibold text-rose-500 mt-0.5">CEP Pending</div>
                  )}
                  {lead.actualRevenue > 0 && (
                    <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">Actual: {formatAmount(lead.actualRevenue)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Pricing Alignment — CEP Intelligence Panel ── */}
            <div className="card-premium p-4">
              <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Pricing Alignment</h3>
              {effectiveCep && c24Quote ? (
                <>
                  {/* CEP / C24 Quote / Gap grid */}
                  <div className="space-y-2.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">{lead.channel === 'DCF' ? 'LTV Expected' : 'CEP'}</span>
                      <span className="text-[14px] font-bold text-slate-800 tabular-nums">{formatAmount(effectiveCep)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">{lead.channel === 'DCF' ? 'LTV Approved' : 'C24 Quote'}</span>
                      <span className="text-[14px] font-bold text-slate-800 tabular-nums">{formatAmount(c24Quote)}</span>
                    </div>
                    <div className="w-full h-px bg-slate-100" />
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-slate-600">Gap</span>
                      <span className={`text-[14px] font-bold tabular-nums ${
                        cepGap && cepGap.raw > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {cepGap ? `${cepGap.raw > 0 ? '+' : ''}${formatAmount(cepGap.raw)} (${cepGap.pct > 0 ? '+' : ''}${cepGap.pct}%)` : '\u2014'}
                      </span>
                    </div>
                    {rangeStatus && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[12px] font-semibold text-slate-600">Range</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          rangeStatus === 'Within Range'    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          rangeStatus === 'Less than Range' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                          rangeStatus === 'More than Range' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                              'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {rangeStatus}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Insight */}
                  {cepGap && cepGap.raw > 0 && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span className="text-[11px] text-amber-700 font-medium">Customer expectation above internal quote</span>
                    </div>
                  )}
                  {cepGap && cepGap.raw <= 0 && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span className="text-[11px] text-emerald-700 font-medium">Margin cushion available</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-2.5 px-3 py-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0 animate-pulse" />
                  <div>
                    <span className="text-[12px] font-semibold text-rose-700 block">
                      {lead.channel === 'DCF' ? 'LTV' : 'CEP'} not captured
                    </span>
                    <span className="text-[10px] text-rose-500 mt-0.5">Cannot evaluate negotiation strength</span>
                  </div>
                </div>
              )}
            </div>

            {/* KAM Owner */}
            <div className="card-premium p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[14px] font-bold text-indigo-700">{lead.kamName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">KAM Owner</div>
                  <div className="text-[13px] font-semibold text-slate-800">{lead.kamName}</div>
                  <div className="text-[11px] text-slate-400">{lead.kamPhone || '+91 98765 12345'}</div>
                </div>
                <a href={`tel:${lead.kamPhone || '+919876512345'}`}
                  className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors flex-shrink-0"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                </a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card-premium p-3">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Days Active', value: `${daysActive}` },
                  { label: 'Follow-ups', value: '3' },
                  { label: 'Calls', value: '5' },
                  { label: 'Time to HB', value: '1.5d' },
                ].map(m => (
                  <div key={m.label} className="min-w-0 text-center">
                    <div className="text-[18px] font-bold text-slate-800 tabular-nums">{m.value}</div>
                    <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ═══ JOURNEY TAB ═══ */}
        {activeTab === 'journey' && (
          <>
            {/* Progress header */}
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-slate-800">Lead Journey</h3>
                <StatusChip label={`${lead.channel} Flow`} variant={channelVariant(lead.channel)} size="sm" />
              </div>
              <ProgressStrip completed={completedStages} total={journeyStages.length} />
            </div>

            {/* Timeline */}
            <div className="relative pl-1">
              {journeyStages.map((stage, idx) => {
                const isExpanded = expandedStages.has(stage.id);
                const hasDetails = stage.details && stage.details.length > 0 && stage.status !== 'pending';
                const isLast = idx === journeyStages.length - 1;

                return (
                  <div key={stage.id} className="relative flex gap-3 pb-1">
                    {/* Vertical line */}
                    {!isLast && (
                      <div className={`absolute left-[11px] top-7 bottom-0 w-px
                        ${stage.status === 'completed' ? 'bg-emerald-200' : stage.status === 'current' ? 'bg-indigo-200' : 'bg-slate-200'}
                      `} />
                    )}

                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0 mt-0.5">
                      {stage.status === 'completed' ? (
                        <div className="w-[22px] h-[22px] rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      ) : stage.status === 'current' ? (
                        <div className="w-[22px] h-[22px] rounded-full bg-indigo-500 flex items-center justify-center animate-pulse">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-[22px] h-[22px] rounded-full bg-slate-200 border-2 border-slate-100" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-4 min-w-0
                      ${stage.status === 'pending' ? 'opacity-50' : ''}
                    `}>
                      <button
                        onClick={() => hasDetails && toggleStage(stage.id)}
                        className={`w-full text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                        disabled={!hasDetails}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[13px] font-semibold
                            ${stage.status === 'current' ? 'text-indigo-700' : stage.status === 'completed' ? 'text-slate-800' : 'text-slate-400'}
                          `}>
                            {stage.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {stage.timestamp && (
                              <span className="text-[10px] text-slate-400 tabular-nums">{stage.timestamp}</span>
                            )}
                            {hasDetails && (
                              isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && hasDetails && (
                        <div className="mt-2 bg-slate-50 rounded-xl p-3 space-y-2 animate-fade-in">
                          {stage.details?.map((detail, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                              <div>
                                <div className="text-[10px] text-slate-400">{detail.label}</div>
                                <div className="text-[12px] text-slate-700 font-medium">{detail.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ NOTES TAB ═══ */}
        {activeTab === 'notes' && (
          <>
            {/* Add note */}
            <div className="card-premium p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] text-slate-800
                             placeholder:text-slate-400 border border-slate-200 focus:border-indigo-300
                             focus:ring-2 focus:ring-indigo-100 outline-none transition-all min-h-[44px]"
                />
                <button onClick={addNote} disabled={!noteText.trim()}
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
      </div>

      {/* ═══ STICKY FOOTER ═══ */}
      <div className="py-2.5 px-4 glass-nav border-t border-slate-200/60 flex items-center justify-between">
        <div className="text-[11px] text-slate-400 font-medium">
          {lead.regNo || lead.registrationNumber} &middot; {lead.channel} &middot; {daysActive}d active
        </div>
        {/* Footer CTA: CEP pending takes priority, else stage-based action */}
        {!effectiveCep ? (
          <button
            onClick={() => setShowCEPModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[11px] font-semibold rounded-xl
                       hover:from-rose-600 hover:to-rose-700 active:scale-95 transition-all min-h-[36px] flex items-center gap-1.5"
          >
            <IndianRupee className="w-3 h-3" />
            {cepAction.label}
          </button>
        ) : (
          <button
            onClick={() => toast.info(primaryCTA.label)}
            className="px-4 py-2 bg-indigo-600 text-white text-[11px] font-semibold rounded-xl
                       hover:bg-indigo-700 active:scale-95 transition-all min-h-[36px]"
          >
            {primaryCTA.label}
          </button>
        )}
      </div>

      {/* ═══ CEP MODAL (Bottom Sheet) ═══ */}
      <CEPModal
        open={showCEPModal}
        onClose={() => setShowCEPModal(false)}
        onSave={handleCEPSave}
        initialCep={effectiveCep}
        initialConfidence={localCepConfidence}
        initialNotes={localCepNotes}
        c24Quote={c24Quote}
        channel={lead.channel as 'NGS' | 'GS' | 'DCF'}
        vehicleInfo={`${lead.make} ${lead.model} ${lead.year} \u2022 ${lead.regNo || lead.registrationNumber}`}
      />

      {/* ═══ CALL FEEDBACK SHEET ═══ */}
      {showCallFeedback && (
        <UnifiedFeedbackModal
          interactionType="CALL"
          dealerName={lead.dealerName}
          visitId={`call-${leadId}`}
          onSubmit={handleCallFeedbackSubmit}
          closeable
          onClose={() => setShowCallFeedback(false)}
        />
      )}
    </div>
  );
}