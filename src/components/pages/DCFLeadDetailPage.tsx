/**
 * DCF LEAD DETAIL — visually aligned with LeadDetailPageV2 (GS/NGS)
 * but preserves ALL DCF-specific fields: multi-funnel journey, loan numbers,
 * RAG, conversion owner, commission, KAM/TL role-gating, car docs.
 *
 * Same component is used from:
 *   - DCF section → DCF Leads → tap card
 *   - Leads section → DCF channel → tap card
 *
 * Role visibility:
 *   - KAM:   no KAM/TL row (it's their own lead)
 *   - TL:    sees KAM
 *   - Admin: sees KAM + TL
 */

import { useState } from 'react';
import {
  ArrowLeft, Phone, MessageCircle, Mail, ChevronDown, ChevronUp,
  CheckCircle2, Clock, User, MapPin, IndianRupee, Copy, AlertCircle, Check, Send,
} from 'lucide-react';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { StatusChip } from '../premium/Chip';
import { toast } from 'sonner@2.0.3';

// Friendly label map for funnel + sub-stage codes
const FUNNEL_LABEL: Record<string, string> = {
  SOURCING: 'Sourcing',
  CREDIT: 'Credit',
  CONVERSION: 'Conversion',
  BAJAJ: 'Partner Approval',
  FULFILMENT: 'Fulfilment',
  RISK: 'Risk Check',
  DISBURSAL: 'Disbursal',
};
const SUBSTAGE_LABEL: Record<string, string> = {
  LEAD_CREATION: 'Lead Created',
  BASIC_DETAILS: 'Basic Details',
  ADDRESS_DETAILS: 'Address',
  ADDITIONAL_DETAILS: 'Additional Info',
  BANKING: 'Banking',
  COAPP_DETAILS: 'Co-applicant',
  ASSET_NEEDED: 'Asset Selection',
  PA_OFFER: 'PA Offer',
  INSPECTION: 'Inspection',
  UNDERWRITING: 'Underwriting',
  CREDIT_INITIATED: 'Credit Initiated',
  DC_VALIDATION: 'DC Validation',
  OFFER_DISCOUNT: 'Offer / Discount',
  TNC_PENDING: 'T&C Pending',
  DOC_UPLOAD: 'Document Upload',
  BENEFICIARY_DETAILS: 'Beneficiary',
  TNC_ACCEPTANCE: 'T&C Accepted',
  ADDITIONAL_INFO: 'Additional Info',
  PARTNER_APPROVAL: 'Partner Approval',
  AGREEMENT: 'Agreement',
  REFERENCE_CALLING: 'Reference Calling',
  KYC: 'KYC',
  NACH: 'NACH',
  RCU: 'RCU',
  RTO_KIT_APPROVAL: 'RTO Kit',
  FINAL_QC: 'Final QC',
  FCU: 'FCU',
  RTO: 'RTO',
  DISBURSAL: 'Disbursal',
};
const friendlyFunnel = (code: string) => FUNNEL_LABEL[code] || code;
const friendlySubStage = (code: string) => SUBSTAGE_LABEL[code] || code.replace(/_/g, ' ');

interface DCFLeadDetailPageProps {
  loanId: string;
  onBack: () => void;
  userRole?: 'KAM' | 'TL' | 'Admin';
}

interface DCFLeadData {
  loan_id: string;
  customer_name: string;
  customer_phone: string;
  pan: string;
  city: string;
  reg_no: string;
  car: string;
  car_value: number;
  ltv: number | null;
  loan_amount: number | null;
  roi: number | null;
  tenure: number | null;
  emi: number | null;
  dealer_name: string;
  dealer_code: string;
  dealer_city: string;
  channel: string;
  rag_status: 'green' | 'amber' | 'red';
  book_flag: 'Own Book' | 'Pmax';
  car_docs_flag: string;
  conversion_owner: string;
  conversion_email: string;
  conversion_phone: string;
  kam_name: string;
  kam_phone?: string;
  tl_name: string;
  first_disbursal_for_dealer: string;
  commission_eligible: boolean;
  base_commission: number;
  booster_applied: string;
  total_commission: number;
  current_funnel: string;
  current_sub_stage: string;
  overall_status: string;
  created_at: string;
  last_updated_at: string;
  utr?: string;
  disbursal_date?: string;
  cibil_score: number;
  cibil_date: string;
  employment_type?: string;
  monthly_income?: number;
  dealer_account?: string;
  delay_message?: string;
}

function formatAmount(amount: number): string {
  if (!amount) return '\u20B90';
  if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(0)}K`;
  return `\u20B9${amount}`;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard?.writeText(text);
  toast.success(`${label} copied`);
}

function computeDcfCommission(db: any, eligible: boolean): { eligible: boolean; perDisbursal: number; tiers: Array<{ threshold: number; payout: number }> } {
  const rules = (db.incentiveRules || []).filter((r: any) => r.metric_key === 'dcf_disbursals');
  const tiers = rules
    .map((r: any) => ({ threshold: Number(r.threshold) || 0, payout: Number(r.payout) || 0 }))
    .sort((a: any, b: any) => a.threshold - b.threshold);
  const entry = tiers[0];
  const perDisbursal = entry && entry.threshold > 0 ? Math.round(entry.payout / entry.threshold) : 0;
  return { eligible, perDisbursal, tiers };
}

function getDCFLeadFromDB(loanId: string): DCFLeadData | null {
  const db = getRuntimeDBSync();
  const dcfLead = db.dcfLeads.find((d: any) => d.loanId === loanId || d.id === loanId);
  if (!dcfLead) return null;

  const status = (dcfLead.overallStatus || dcfLead.status || '').toString().toLowerCase();
  const isDisbursed = status === 'disbursed' || !!dcfLead.disbursalDate;
  const ragStatus: 'green' | 'amber' | 'red' = isDisbursed ? 'green'
    : status === 'approved' ? 'amber'
      : 'red';
  const commission = computeDcfCommission(db, dcfLead.commissionEligible ?? isDisbursed);

  return {
    loan_id: dcfLead.loanId || dcfLead.id || loanId,
    customer_name: dcfLead.customerName || 'Unknown Customer',
    customer_phone: dcfLead.customerPhone || '',
    pan: dcfLead.pan || 'N/A',
    city: dcfLead.city || 'NCR',
    reg_no: dcfLead.regNo || 'N/A',
    car: dcfLead.car || dcfLead.carModel || dcfLead.regNo || 'Vehicle TBD',
    car_value: dcfLead.carValue || 0,
    ltv: dcfLead.ltv || null,
    loan_amount: dcfLead.loanAmount || null,
    roi: dcfLead.roi || null,
    tenure: dcfLead.tenure || null,
    emi: dcfLead.emi || null,
    dealer_name: dcfLead.dealerName || 'Unknown Dealer',
    dealer_code: dcfLead.dealerCode || 'N/A',
    dealer_city: dcfLead.dealerCity || dcfLead.city || 'NCR',
    channel: dcfLead.channel || 'DCF',
    rag_status: ragStatus,
    book_flag: dcfLead.bookFlag || 'Own Book',
    car_docs_flag: dcfLead.carDocsReceived ? 'Received' : 'Pending',
    conversion_owner: dcfLead.conversionOwner || 'Not assigned',
    conversion_email: dcfLead.conversionEmail || '',
    conversion_phone: dcfLead.conversionPhone || '',
    kam_name: dcfLead.kamName || 'N/A',
    kam_phone: (dcfLead as any).kamPhone || '',
    tl_name: (dcfLead as any).tlName || 'N/A',
    first_disbursal_for_dealer: dcfLead.firstDisbursal ? 'YES' : 'NO',
    commission_eligible: commission.eligible,
    base_commission: dcfLead.baseCommission ?? commission.perDisbursal,
    booster_applied: dcfLead.firstDisbursal ? 'YES' : 'NO',
    total_commission: dcfLead.totalCommission ?? commission.perDisbursal,
    current_funnel: dcfLead.currentFunnel || 'SOURCING',
    current_sub_stage: dcfLead.currentSubStage || 'LEAD_CREATION',
    // Wave 1A: write lowercase (DB convention). Previously .toUpperCase()
    // desynced from every reader comparing against lowercase 'disbursed'.
    overall_status: (dcfLead.overallStatus || (isDisbursed ? 'disbursed' : 'pending')).toString().toLowerCase(),
    created_at: dcfLead.createdAt || new Date().toISOString(),
    last_updated_at: dcfLead.updatedAt || new Date().toISOString(),
    utr: dcfLead.utr,
    disbursal_date: dcfLead.disbursalDate,
    cibil_score: dcfLead.cibilScore || 0,
    cibil_date: dcfLead.cibilDate || '',
    employment_type: dcfLead.employmentType,
    monthly_income: dcfLead.monthlyIncome,
    dealer_account: dcfLead.dealerAccount,
    delay_message: dcfLead.delayMessage,
  };
}

type Tab = 'overview' | 'journey' | 'notes';

interface NoteItem { id: string; text: string; time: string; author: string; }
const notesKey = (loanId: string) => `dcf-notes:${loanId}`;
function loadNotes(loanId: string): NoteItem[] {
  try {
    const raw = localStorage.getItem(notesKey(loanId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveNotes(loanId: string, notes: NoteItem[]) {
  try { localStorage.setItem(notesKey(loanId), JSON.stringify(notes)); } catch {}
}

const JOURNEY_FUNNELS = [
  { name: 'SOURCING', stages: [
    { id: 'LEAD_CREATION', label: 'Lead Creation' },
    { id: 'BASIC_DETAILS', label: 'Basic Details' },
    { id: 'ADDRESS_DETAILS', label: 'Address Details' },
    { id: 'ADDITIONAL_DETAILS', label: 'Additional Details' },
    { id: 'BANKING', label: 'Banking' },
    { id: 'COAPP_DETAILS', label: 'Co-app Details' },
    { id: 'ASSET_NEEDED', label: 'Asset Needed' },
    { id: 'PA_OFFER', label: 'PA Offer' },
    { id: 'INSPECTION', label: 'Inspection' },
  ]},
  { name: 'CREDIT', stages: [
    { id: 'UNDERWRITING', label: 'Underwriting' },
    { id: 'CREDIT_INITIATED', label: 'Credit Initiated' },
    { id: 'PA_OFFER', label: 'PA Offer' },
    { id: 'DC_VALIDATION', label: 'DC Validation' },
  ]},
  { name: 'CONVERSION', stages: [
    { id: 'OFFER_DISCOUNT', label: 'Offer Discount' },
    { id: 'TNC_PENDING', label: 'T&C Pending' },
    { id: 'DOC_UPLOAD', label: 'Doc Upload' },
    { id: 'BENEFICIARY_DETAILS', label: 'Beneficiary Details' },
    { id: 'TNC_ACCEPTANCE', label: 'T&C Acceptance' },
    { id: 'ADDITIONAL_INFO', label: 'Additional Info' },
  ]},
  { name: 'BAJAJ', stages: [
    { id: 'PARTNER_APPROVAL', label: 'Partner Approval' },
  ]},
  { name: 'FULFILMENT', stages: [
    { id: 'AGREEMENT', label: 'Agreement' },
    { id: 'REFERENCE_CALLING', label: 'Reference Calling' },
    { id: 'KYC', label: 'KYC' },
    { id: 'NACH', label: 'NACH' },
  ]},
  { name: 'RISK', stages: [
    { id: 'RCU', label: 'RCU' },
    { id: 'RTO_KIT_APPROVAL', label: 'RTO Kit Approval' },
    { id: 'FINAL_QC', label: 'Final QC' },
    { id: 'FCU', label: 'FCU' },
    { id: 'RTO', label: 'RTO' },
  ]},
  { name: 'DISBURSAL', stages: [
    { id: 'DISBURSAL', label: 'Disbursal' },
  ]},
];

function ProgressStrip({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 tabular-nums">{completed}/{total}</span>
    </div>
  );
}

export function DCFLeadDetailPage({ loanId, onBack, userRole }: DCFLeadDetailPageProps) {
  const showKamName = userRole === 'TL' || userRole === 'Admin';
  const showTlName = userRole === 'Admin';
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedFunnels, setExpandedFunnels] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<NoteItem[]>(() => loadNotes(loanId));
  const [noteText, setNoteText] = useState('');

  const addNote = () => {
    const t = noteText.trim();
    if (!t) return;
    const next = [{ id: `n-${Date.now()}`, text: t, time: new Date().toISOString(), author: 'You' }, ...notes];
    setNotes(next);
    saveNotes(loanId, next);
    setNoteText('');
    toast.success('Note added');
  };

  const leadData = getDCFLeadFromDB(loanId);

  if (!leadData) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#f7f8fa] gap-4">
        <div className="text-[14px] text-slate-500">Lead not found</div>
        <button onClick={onBack} className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700">Go back</button>
      </div>
    );
  }

  const currentFunnelIndex = JOURNEY_FUNNELS.findIndex(f => f.name === leadData.current_funnel);
  const safeCurrentFunnelIdx = currentFunnelIndex < 0 ? 0 : currentFunnelIndex;
  const currentFunnel = JOURNEY_FUNNELS[safeCurrentFunnelIdx];
  const currentStageIdx = currentFunnel?.stages.findIndex(s => s.id === leadData.current_sub_stage) || 0;

  const totalStages = JOURNEY_FUNNELS.reduce((sum, f) => sum + f.stages.length, 0);
  let completedStages = 0;
  for (let i = 0; i < safeCurrentFunnelIdx; i++) completedStages += JOURNEY_FUNNELS[i].stages.length;
  completedStages += Math.max(0, currentStageIdx);

  const daysActive = Math.floor((Date.now() - new Date(leadData.created_at).getTime()) / 86400000);

  const toggleFunnel = (name: string) => {
    setExpandedFunnels(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const getFunnelStatus = (idx: number): 'completed' | 'current' | 'pending' => {
    if (idx < safeCurrentFunnelIdx) return 'completed';
    if (idx === safeCurrentFunnelIdx) return 'current';
    return 'pending';
  };

  const getStageStatus = (funnelIdx: number, stageIdx: number): 'completed' | 'current' | 'pending' => {
    if (funnelIdx < safeCurrentFunnelIdx) return 'completed';
    if (funnelIdx > safeCurrentFunnelIdx) return 'pending';
    if (stageIdx < currentStageIdx) return 'completed';
    if (stageIdx === currentStageIdx) return 'current';
    return 'pending';
  };

  const channelVar = 'warning'; // DCF
  const ragChipClass =
    leadData.rag_status === 'green' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    leadData.rag_status === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                      'bg-rose-100 text-rose-700 border-rose-200';

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
            <h1 className="text-[16px] font-bold text-slate-900 truncate">{leadData.customer_name}</h1>
            {leadData.customer_phone && (
              <button
                onClick={() => copyToClipboard(leadData.customer_phone, 'Phone')}
                className="flex items-center gap-1 mt-0.5 group"
              >
                <span className="text-[11px] text-slate-400 font-medium">{leadData.customer_phone}</span>
                <Copy className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Vehicle + reg */}
        <div>
          <div className="text-[13px] font-medium text-slate-700">{leadData.car}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{leadData.reg_no} &middot; #{leadData.loan_id}</div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusChip label={leadData.channel} variant={channelVar} size="sm" />
          <StatusChip label={leadData.book_flag} variant="info" size="sm" />
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ragChipClass}`}>
            {leadData.overall_status}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-100 text-slate-700 border-slate-200">
            {friendlyFunnel(leadData.current_funnel)} &middot; {friendlySubStage(leadData.current_sub_stage)}
          </span>
        </div>

        {/* Primary actions */}
        <div className="flex gap-2">
          <a
            href={leadData.customer_phone ? `tel:${leadData.customer_phone}` : '#'}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all min-h-[44px]"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
          <a
            href={`https://wa.me/${(leadData.customer_phone || '').replace(/\+/g, '')}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white text-[12px] font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all min-h-[44px]"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
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
                ${activeTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 animate-fade-in">

        {/* ═══ OVERVIEW ═══ */}
        {activeTab === 'overview' && (
          <>
            {/* KPI snapshot */}
            <div className="card-premium p-3">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Car Value', value: formatAmount(leadData.car_value), color: 'text-slate-800' },
                  { label: 'Loan Amt', value: leadData.loan_amount ? formatAmount(leadData.loan_amount) : '—', color: 'text-emerald-700' },
                  { label: 'LTV', value: leadData.ltv ? `${leadData.ltv}%` : '—', color: 'text-indigo-700' },
                  { label: 'Age', value: `${daysActive}d`, color: daysActive > 7 ? 'text-amber-700' : 'text-slate-800' },
                ].map(m => (
                  <div key={m.label} className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-medium">{m.label}</div>
                    <div className={`text-[14px] font-bold tabular-nums mt-0.5 truncate ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delay alert */}
            {leadData.delay_message && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="text-[12px] text-rose-700 font-medium">{leadData.delay_message}</span>
              </div>
            )}

            {/* Loan Numbers */}
            <div className="card-premium p-4">
              <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Loan Numbers</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Car value', value: formatAmount(leadData.car_value) },
                  { label: 'Loan amount', value: leadData.loan_amount ? formatAmount(leadData.loan_amount) : 'Pending' },
                  { label: 'LTV', value: leadData.ltv ? `${leadData.ltv}%` : 'Pending' },
                  { label: 'ROI', value: leadData.roi ? `${leadData.roi}% p.a.` : 'Pending' },
                  { label: 'Tenure', value: leadData.tenure ? `${leadData.tenure} months` : 'Pending' },
                  { label: 'EMI', value: leadData.emi ? formatAmount(leadData.emi) : 'Pending' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">{row.label}</span>
                    <span className="text-[13px] font-bold text-slate-800 tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer / Dealer / Conversion Owner */}
            <div className="card-premium divide-y divide-slate-100">
              <div className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">Customer</div>
                  <div className="text-[13px] font-semibold text-slate-800 mt-0.5">{leadData.customer_name}</div>
                  {leadData.customer_phone && (
                    <button onClick={() => copyToClipboard(leadData.customer_phone, 'Phone')}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 mt-0.5">
                      {leadData.customer_phone} <Copy className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {leadData.pan && leadData.pan !== 'N/A' && (
                    <div className="text-[11px] text-slate-400 mt-0.5">PAN: {leadData.pan}</div>
                  )}
                  {leadData.cibil_score > 0 && (
                    <div className="text-[11px] text-slate-400 mt-0.5">CIBIL: {leadData.cibil_score}</div>
                  )}
                </div>
              </div>

              <div className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">Dealer</div>
                  <div className="text-[13px] font-semibold text-slate-800 mt-0.5">{leadData.dealer_name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{leadData.dealer_code} &middot; {leadData.dealer_city}</div>
                </div>
              </div>

              {/* Conversion Owner */}
              <div className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">Conversion Owner</div>
                  <div className="text-[13px] font-semibold text-slate-800 mt-0.5">{leadData.conversion_owner}</div>
                  {leadData.conversion_owner !== 'Not assigned' ? (
                    <div className="flex items-center gap-3 mt-1">
                      {leadData.conversion_email && (
                        <a href={`mailto:${leadData.conversion_email}`} className="text-[11px] text-indigo-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {leadData.conversion_email}
                        </a>
                      )}
                      {leadData.conversion_phone && (
                        <a href={`tel:${leadData.conversion_phone}`} className="text-[11px] text-indigo-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {leadData.conversion_phone}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-600 mt-0.5">Assigning in progress</div>
                  )}
                </div>
              </div>
            </div>

            {/* KAM / TL Owner card (role-gated) */}
            {(showKamName || showTlName) && (
              <div className="card-premium p-4 space-y-3">
                {showKamName && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[14px] font-bold text-indigo-700">{(leadData.kam_name || '?')[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-400 font-medium">KAM Owner</div>
                      <div className="text-[13px] font-semibold text-slate-800">{leadData.kam_name}</div>
                      {leadData.kam_phone && <div className="text-[11px] text-slate-400">{leadData.kam_phone}</div>}
                    </div>
                    {leadData.kam_phone && (
                      <a href={`tel:${leadData.kam_phone}`}
                        className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors flex-shrink-0">
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </a>
                    )}
                  </div>
                )}
                {showTlName && (
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[14px] font-bold text-amber-700">{(leadData.tl_name || '?')[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-400 font-medium">Team Lead</div>
                      <div className="text-[13px] font-semibold text-slate-800">{leadData.tl_name}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Commission */}
            <div className="card-premium p-4">
              <h3 className="text-[13px] font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Commission (KAM)
              </h3>
              {leadData.commission_eligible ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[12px] mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Commission Eligible
                  </div>
                  <div className="text-[12px] text-slate-700 space-y-1">
                    <div>0.5% of loan value = {formatAmount(leadData.base_commission)}</div>
                    {leadData.booster_applied === 'YES' && (
                      <div className="text-emerald-700 font-medium">Booster: 2× (Dealer's 1st disbursal)</div>
                    )}
                    <div className="text-[15px] font-bold text-emerald-700 mt-1">
                      Total: {formatAmount(leadData.total_commission)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[12px] text-slate-600">
                  Not eligible (not disbursed / rule unmet)
                </div>
              )}
            </div>

            {/* Journey progress preview */}
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-slate-800">Loan Journey</h3>
                <button onClick={() => setActiveTab('journey')} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
                  Full journey →
                </button>
              </div>
              <ProgressStrip completed={completedStages} total={totalStages} />
              <div className="mt-3 text-[11px] text-slate-500">
                Current: <span className="text-indigo-700 font-semibold">{friendlyFunnel(leadData.current_funnel)}</span> → {friendlySubStage(leadData.current_sub_stage)}
              </div>
            </div>
          </>
        )}

        {/* ═══ JOURNEY ═══ */}
        {activeTab === 'journey' && (
          <>
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-slate-800">Loan Journey</h3>
                <StatusChip label="DCF Flow" variant="warning" size="sm" />
              </div>
              <ProgressStrip completed={completedStages} total={totalStages} />
            </div>

            {/* Funnel accordion */}
            <div className="space-y-2.5">
              {JOURNEY_FUNNELS.map((funnel, fIdx) => {
                const fStatus = getFunnelStatus(fIdx);
                const isOpen = expandedFunnels.has(funnel.name);
                const isCurrent = fStatus === 'current';

                return (
                  <div key={funnel.name}
                    className={`card-premium overflow-hidden ${isCurrent ? 'ring-1 ring-indigo-200' : ''}`}
                  >
                    <button onClick={() => toggleFunnel(funnel.name)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="relative z-10 flex-shrink-0">
                        {fStatus === 'completed' ? (
                          <div className="w-[22px] h-[22px] rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : fStatus === 'current' ? (
                          <div className="w-[22px] h-[22px] rounded-full bg-indigo-500 flex items-center justify-center animate-pulse">
                            <Clock className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-[22px] h-[22px] rounded-full bg-slate-200 border-2 border-slate-100" />
                        )}
                      </div>
                      <span className={`flex-1 text-left text-[13px] font-semibold ${
                        fStatus === 'current' ? 'text-indigo-700' :
                        fStatus === 'completed' ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {fIdx + 1}. {friendlyFunnel(funnel.name)}
                      </span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-3 pt-1 space-y-1.5 border-t border-slate-100">
                        {funnel.stages.map((stage, sIdx) => {
                          const sStatus = getStageStatus(fIdx, sIdx);
                          return (
                            <div key={stage.id} className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg ${
                              sStatus === 'current' ? 'bg-indigo-50' : ''
                            }`}>
                              {sStatus === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : sStatus === 'current' ? (
                                <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0 animate-pulse" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-100 flex-shrink-0" />
                              )}
                              <span className={`flex-1 text-[12px] font-medium ${
                                sStatus === 'current' ? 'text-indigo-700' :
                                sStatus === 'completed' ? 'text-slate-700' : 'text-slate-400'
                              }`}>
                                {stage.label}
                              </span>
                              {sStatus === 'current' && (
                                <span className="text-[10px] font-semibold text-indigo-600">In Progress</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Car Docs */}
              <div className={`card-premium p-4 ${
                leadData.car_docs_flag === 'Received' ? 'ring-1 ring-emerald-200' : 'ring-1 ring-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 ${
                    leadData.car_docs_flag === 'Received' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}>
                    {leadData.car_docs_flag === 'Received'
                      ? <Check className="w-3.5 h-3.5 text-white" />
                      : <AlertCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-slate-800">8. Car Docs</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Status: {leadData.car_docs_flag}
                      {leadData.car_docs_flag === 'Received' && ' • RC received'}
                      {leadData.car_docs_flag === 'Pending' && ' • RC pending from dealer'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ NOTES ═══ */}
        {activeTab === 'notes' && (
          <>
            <div className="card-premium p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                  placeholder="Add a note about this lead…"
                  className="flex-1 px-3 py-2 text-[12px] rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-300 focus:outline-none transition-colors"
                />
                <button
                  onClick={addNote}
                  disabled={!noteText.trim()}
                  className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="card-premium p-6 text-center">
                <div className="text-[12px] text-slate-500">No notes yet</div>
                <div className="text-[10px] text-slate-400 mt-1">Add a note to keep context for this lead</div>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map(n => (
                  <div key={n.id} className="card-premium p-3">
                    <div className="text-[12px] text-slate-700">{n.text}</div>
                    <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                      <span className="font-semibold">{n.author}</span>
                      <span>·</span>
                      <span>{new Date(n.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
