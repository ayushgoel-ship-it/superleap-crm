/**
 * LEAD ADAPTER — Maps raw Lead entities to LeadCardVM view-models
 *
 * Single source of truth for the LeadCardVM type and its construction.
 * Consumed by: LeadsPageV3, LeadCard, LeadList, LeadPipelineCard
 *
 * DO NOT duplicate LeadCardVM elsewhere — import from here.
 */

import type { Lead } from '../types';

// ── View-Model ──

export interface LeadCardVM {
  id: string;
  customerName: string;
  carDisplay: string;        // e.g. "Maruti Swift 2021"
  regNo: string;             // Registration number or 'N/A'
  channel: string;           // NGS | GS | DCF
  leadType: string;          // Seller | Inventory
  stage: string;             // Current pipeline stage
  status: string;            // Active | Converted | Lost
  cep: number | null;        // Customer Expected Price (null = pending)
  secondaryValue: number;    // C24 Quote (stock channels) or expected revenue
  revenue: number;           // Primary monetary value for display
  createdAt: string;         // ISO date string
  inspectionDate?: string;   // ISO date string (optional)
  dealerName: string;
  dealerCode: string;
  dealerId: string;
  city: string;
  kamOwner?: string;         // KAM name (for TL views)
  kamPhone?: string;         // KAM phone (for Call RA)
  phone: string;             // Fallback phone
  badges: Array<{
    type: string;
    label: string;
    color: 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'gray';
  }>;
}

// ── Badge Helpers ──

function channelColor(ch: string): 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'gray' {
  switch (ch) {
    case 'NGS': return 'purple';
    case 'GS':  return 'green';
    case 'DCF': return 'amber';
    default:    return 'gray';
  }
}

function statusColor(status: string): 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'gray' {
  const s = status.toLowerCase();
  if (s === 'converted' || s === 'payout done') return 'green';
  if (s === 'lost') return 'red';
  if (s === 'active') return 'blue';
  return 'gray';
}

function buildBadges(lead: Lead): LeadCardVM['badges'] {
  const badges: LeadCardVM['badges'] = [];

  // Channel badge
  badges.push({
    type: 'channel',
    label: lead.channel,
    color: channelColor(lead.channel),
  });

  // Lead type badge
  if (lead.leadType) {
    badges.push({
      type: 'leadType',
      label: lead.leadType,
      color: lead.leadType === 'Seller' ? 'amber' : 'blue',
    });
  }

  // Status badge
  if (lead.status && lead.status !== 'Active') {
    badges.push({
      type: 'status',
      label: lead.status,
      color: statusColor(lead.status),
    });
  }

  // CEP badge
  const cepVal = lead.cep ?? null;
  if (cepVal === null || cepVal === 0) {
    badges.push({
      type: 'cep',
      label: 'CEP Pending',
      color: 'red',
    });
  } else {
    const formatted = cepVal >= 100000
      ? `₹${(cepVal / 100000).toFixed(1)}L`
      : `₹${cepVal.toLocaleString()}`;
    badges.push({
      type: 'cep',
      label: `CEP ${formatted}`,
      color: 'green',
    });
  }

  return badges;
}

// ── Mapper ──

function toLeadCardVM(lead: Lead): LeadCardVM {
  const carDisplay = [lead.make, lead.model, lead.year].filter(Boolean).join(' ');

  return {
    id: lead.id,
    customerName: lead.appId || lead.id || 'Lead',
    carDisplay: carDisplay || 'Unknown Vehicle',
    regNo: lead.regNo || lead.registrationNumber || 'N/A',
    channel: lead.channel,
    leadType: lead.leadType,
    stage: lead.currentStage || lead.stage,
    status: lead.status,
    cep: lead.cep ?? null,
    secondaryValue: lead.c24Quote ?? 0,
    revenue: lead.actualRevenue || lead.expectedRevenue || 0,
    createdAt: lead.createdAt,
    inspectionDate: lead.inspectionDate,
    dealerName: lead.dealerName,
    dealerCode: lead.dealerCode,
    dealerId: lead.dealerId,
    city: lead.city,
    kamOwner: lead.kamName,
    kamPhone: lead.kamPhone,
    phone: lead.customerPhone || '',
    badges: buildBadges(lead),
  };
}

// ── Public API ──

/** Map an array of raw Leads to view-model LeadCardVMs */
export function toLeadListVM(leads: Lead[]): LeadCardVM[] {
  return leads.map(toLeadCardVM);
}

/** Validate a lead ID before navigation — logs a warning for invalid IDs */
export function validateLeadIdForNavigation(leadId: string): void {
  if (!leadId || typeof leadId !== 'string') {
    console.warn('[leadAdapter] Invalid lead ID for navigation:', leadId);
  }
}

/** Map a DCFLeadCardVM to a LeadCardVM for unified pipeline display */
export function dcfToLeadCardVM(dcf: {
  id: string; customerName: string; car: string; phone: string;
  channel: string; stage: string; overallStatus: string;
  loanAmount: number | null; finalOfferLtv?: number | null; createdAt: string;
  dealerName: string; dealerCode: string; dealerId: string;
  kamName: string; city: string; disbursalDate?: string;
}): LeadCardVM {
  return {
    id: dcf.id,
    customerName: dcf.id || 'DCF Lead',
    carDisplay: dcf.car,
    regNo: 'N/A',
    channel: 'DCF',
    leadType: 'DCF',
    stage: dcf.stage,
    status: dcf.overallStatus === 'disbursed' ? 'Won' : 'Active',
    cep: null,
    secondaryValue: dcf.finalOfferLtv ?? null,
    revenue: dcf.loanAmount || 0,
    createdAt: dcf.createdAt,
    dealerName: dcf.dealerName,
    dealerCode: dcf.dealerCode,
    dealerId: dcf.dealerId,
    city: dcf.city,
    kamOwner: dcf.kamName,
    phone: dcf.phone,
    inspectionDate: undefined,
    badges: [],
  };
}
