/**
 * DCF ADAPTER — Maps raw DCFLead entities to view-models
 *
 * Single source of truth for DCFLeadCardVM and DCFLeadDetailData types.
 * Consumed by: DCFPage, DCFLeadsListPage, DCFLeadDetailPage, DCFDealerDetailPage
 */

import type { DCFLead } from '../types';

// ── Card View-Model ──

export interface DCFLeadCardVM {
  id: string;
  loanId: string;
  customerName: string;
  phone: string;
  car: string;
  carValue: number;
  loanAmount: number | null;
  city: string;
  dealerName: string;
  dealerCode: string;
  dealerId: string;
  kamName: string;
  ragStatus: 'green' | 'amber' | 'red';
  overallStatus: string;
  currentFunnel: string;
  currentSubStage: string;
  channel: string;
  bookFlag: string;
  carDocsFlag: string;
  createdAt: string;
  lastUpdatedAt: string;
  disbursalDate?: string;
  cibilScore?: number;
  commission: {
    eligible: boolean;
    base: number;
    total: number;
    boosterApplied: boolean;
  };
  badges: Array<{
    type: string;
    label: string;
    color: 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'gray';
  }>;
  // For list rendering
  stage: string;
  stageColor: 'blue' | 'amber' | 'green' | 'gray' | 'red';
}

function statusColor(status: string): 'green' | 'amber' | 'blue' | 'red' | 'gray' {
  const s = status.toUpperCase();
  if (s === 'DISBURSED') return 'green';
  if (s.includes('PENDING') || s.includes('DELAYED')) return 'amber';
  if (s === 'IN_PROGRESS') return 'blue';
  if (s === 'REJECTED') return 'red';
  return 'gray';
}

function ragToColor(rag: string): 'green' | 'amber' | 'red' {
  if (rag === 'green') return 'green';
  if (rag === 'amber') return 'amber';
  return 'red';
}

function deriveStage(lead: DCFLead): string {
  const s = lead.overallStatus.toUpperCase();
  if (s === 'DISBURSED') return 'Disbursed';
  if (s === 'REJECTED') return 'Rejected';
  if (s.includes('PENDING')) return 'Approval Pending';
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'DELAYED') return 'Delayed';
  return lead.currentSubStage || 'Unknown';
}

function buildDCFBadges(lead: DCFLead): DCFLeadCardVM['badges'] {
  const badges: DCFLeadCardVM['badges'] = [];

  badges.push({
    type: 'rag',
    label: lead.ragStatus.toUpperCase(),
    color: ragToColor(lead.ragStatus),
  });

  badges.push({
    type: 'status',
    label: lead.overallStatus,
    color: statusColor(lead.overallStatus),
  });

  badges.push({
    type: 'book',
    label: lead.bookFlag,
    color: lead.bookFlag === 'Own Book' ? 'blue' : 'purple',
  });

  if (lead.carDocsFlag !== 'Received') {
    badges.push({
      type: 'docs',
      label: `Docs ${lead.carDocsFlag}`,
      color: lead.carDocsFlag === 'Pending' ? 'red' : 'amber',
    });
  }

  return badges;
}

function toDCFLeadCardVM(lead: DCFLead): DCFLeadCardVM {
  return {
    id: lead.id,
    loanId: lead.id,
    customerName: lead.customerName,
    phone: lead.customerPhone,
    car: lead.car,
    carValue: lead.carValue,
    loanAmount: lead.loanAmount ?? null,
    city: lead.city,
    dealerName: lead.dealerName,
    dealerCode: lead.dealerCode,
    dealerId: lead.dealerId,
    kamName: lead.kamName,
    ragStatus: lead.ragStatus,
    overallStatus: lead.overallStatus,
    currentFunnel: lead.currentFunnel,
    currentSubStage: lead.currentSubStage,
    channel: lead.channel,
    bookFlag: lead.bookFlag,
    carDocsFlag: lead.carDocsFlag,
    createdAt: lead.createdAt,
    lastUpdatedAt: lead.lastUpdatedAt,
    disbursalDate: (lead as any).disbursalDate,
    cibilScore: lead.cibilScore,
    commission: {
      eligible: lead.commissionEligible,
      base: lead.baseCommission,
      total: lead.totalCommission,
      boosterApplied: lead.boosterApplied,
    },
    badges: buildDCFBadges(lead),
    stage: deriveStage(lead),
    stageColor: statusColor(lead.overallStatus),
  };
}

export function toDCFLeadListVM(leads: DCFLead[]): DCFLeadCardVM[] {
  return leads.map(toDCFLeadCardVM);
}

// ── Detail Data (snake_case format for DCFLeadDetailPage) ──

export interface DCFLeadDetailData {
  loan_id: string;
  customer_name: string;
  phone: string;
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
  overall_status: string;
  current_funnel: string;
  current_sub_stage: string;
  book_flag: string;
  car_docs_flag: string;
  conversion_owner: string;
  conversion_email: string;
  conversion_phone: string;
  first_disbursal_for_dealer: string;
  commission_eligible: string;
  base_commission: number;
  booster_applied: string;
  total_commission: number;
  kam_name: string;
  created_at: string;
  last_updated_at: string;
  cibil_score: number | null;
  cibil_date: string | null;
  employment_type: string;
  monthly_income: number;
  dealer_account: string;
  disbursal_date: string | null;
  utr: string | null;
  delay_message?: string;
}

export function toDCFLeadDetail(lead: DCFLead): DCFLeadDetailData {
  return {
    loan_id: lead.id,
    customer_name: lead.customerName,
    phone: lead.customerPhone,
    pan: lead.pan,
    city: lead.city,
    reg_no: lead.regNo,
    car: lead.car,
    car_value: lead.carValue,
    ltv: lead.ltv ?? null,
    loan_amount: lead.loanAmount ?? null,
    roi: lead.roi ?? null,
    tenure: lead.tenure ?? null,
    emi: lead.emi ?? null,
    dealer_name: lead.dealerName,
    dealer_code: lead.dealerCode,
    dealer_city: lead.dealerCity,
    channel: lead.channel,
    rag_status: lead.ragStatus,
    overall_status: lead.overallStatus,
    current_funnel: lead.currentFunnel,
    current_sub_stage: lead.currentSubStage,
    book_flag: lead.bookFlag,
    car_docs_flag: lead.carDocsFlag,
    conversion_owner: lead.conversionOwner,
    conversion_email: lead.conversionEmail,
    conversion_phone: lead.conversionPhone,
    first_disbursal_for_dealer: lead.firstDisbursalForDealer ? 'YES' : 'NO',
    commission_eligible: lead.commissionEligible ? 'YES' : 'NO',
    base_commission: lead.baseCommission,
    booster_applied: lead.boosterApplied ? 'YES' : 'NO',
    total_commission: lead.totalCommission,
    kam_name: lead.kamName,
    created_at: lead.createdAt,
    last_updated_at: lead.lastUpdatedAt,
    cibil_score: lead.cibilScore ?? null,
    cibil_date: lead.cibilDate ?? null,
    employment_type: lead.employmentType,
    monthly_income: lead.monthlyIncome,
    dealer_account: lead.dealerAccount,
    disbursal_date: (lead as any).disbursalDate ?? null,
    utr: (lead as any).utr ?? null,
    delay_message: (lead as any).delayMessage,
  };
}
