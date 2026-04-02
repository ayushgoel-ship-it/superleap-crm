/**
 * LEAD ADAPTER — Maps raw Lead entities to LeadCardVM view-models
 *
 * Single source of truth for the LeadCardVM type and its construction.
 * Consumed by: LeadsPageV3, LeadCard, LeadCardV3, LeadList, LeadPipelineCard
 *
 * DO NOT duplicate LeadCardVM elsewhere — import from here.
 */

import type { Lead } from '../types';
import { mapChannelToCanonical, type CanonicalChannel, deriveRangeStatus, type RangeStatus } from '../canonicalMetrics';

// ── View-Model ──

export interface LeadCardVM {
  id: string;
  customerName: string;
  carDisplay: string;        // e.g. "Maruti Swift 2021"
  regNo: string;             // Registration number or 'N/A'
  channel: string;           // Canonical: NGS | GS | DCF
  rawChannel: string;        // Original: C2B | C2D | GS | DCF
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
  rangeStatus?: RangeStatus; // GS/NGS only: C24 Quote vs CEP range comparison
  badges: Array<{
    type: string;
    label: string;
    color: 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'gray';
  }>;
}

// ── Badge Helpers ──

function channelColor(ch: string): 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'gray' {
  switch (ch) {
    case 'NGS': return 'blue';
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
  const canonical = mapChannelToCanonical(lead.channel);

  // Channel badge (canonical)
  badges.push({
    type: 'channel',
    label: canonical,
    color: channelColor(canonical),
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
    customerName: lead.customerName,
    carDisplay: carDisplay || 'Unknown Vehicle',
    regNo: lead.regNo || lead.registrationNumber || 'N/A',
    channel: mapChannelToCanonical(lead.channel),
    rawChannel: lead.channel,
    leadType: lead.leadType,
    stage: lead.currentStage || lead.stage,
    status: lead.status,
    cep: lead.cep ?? null,
    secondaryValue: lead.c24Quote ?? lead.expectedRevenue ?? 0,
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
    rangeStatus: mapChannelToCanonical(lead.channel) !== 'DCF' ? deriveRangeStatus(lead) : undefined,
    badges: buildBadges(lead),
  };
}

// ── Public API ──

/** Map an array of raw Leads to view-model LeadCardVMs */
export function toLeadListVM(leads: Lead[]): LeadCardVM[] {
  return leads.map(toLeadCardVM);
}

/** Convert DCFLeadCardVM to LeadCardVM for unified display in Leads page */
export function dcfToLeadCardVM(dcf: import('./dcfAdapter').DCFLeadCardVM): LeadCardVM {
  return {
    id: dcf.id,
    customerName: dcf.customerName,
    carDisplay: dcf.car,
    regNo: 'N/A',
    channel: 'DCF',
    rawChannel: 'DCF',
    leadType: dcf.bookFlag,
    stage: dcf.overallStatus,
    status: dcf.overallStatus === 'REJECTED' ? 'Lost' : dcf.overallStatus === 'DISBURSED' ? 'Converted' : 'Active',
    cep: dcf.loanAmount,
    secondaryValue: dcf.carValue,
    revenue: dcf.loanAmount ?? 0,
    createdAt: dcf.createdAt,
    dealerName: dcf.dealerName,
    dealerCode: dcf.dealerCode,
    dealerId: dcf.dealerId,
    city: dcf.city,
    kamOwner: dcf.kamName,
    phone: dcf.phone,
    badges: [
      { type: 'channel', label: 'DCF', color: 'amber' as const },
      { type: 'rag', label: dcf.ragStatus.toUpperCase(), color: dcf.ragStatus === 'green' ? 'green' as const : dcf.ragStatus === 'amber' ? 'amber' as const : 'red' as const },
      { type: 'status', label: dcf.overallStatus, color: dcf.overallStatus === 'DISBURSED' ? 'green' as const : dcf.overallStatus === 'REJECTED' ? 'red' as const : 'blue' as const },
    ],
  };
}

/** Validate a lead ID before navigation — logs a warning for invalid IDs */
export function validateLeadIdForNavigation(leadId: string): void {
  if (!leadId || typeof leadId !== 'string') {
    console.warn('[leadAdapter] Invalid lead ID for navigation:', leadId);
  }
}
