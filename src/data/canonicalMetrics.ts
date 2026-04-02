/**
 * CANONICAL METRICS — Single source of truth for all counts and KPIs
 *
 * Every page (Home, Leads, Dealers, DCF) must derive metrics from this module.
 * No page should hard-code counts or read from dealer.metrics.mtd statics.
 *
 * Data flow:
 *   LEADS / DCF_LEADS / CALLS / VISITS (mockDatabase)
 *     → filter by timeframe + optional KAM
 *     → compute counts, rates, breakdowns
 *     → consume in pages
 */

import { LEADS, DCF_LEADS, CALLS, VISITS, DEALERS } from './mockDatabase';
import type { Lead, DCFLead, CallLog, VisitLog, Dealer } from './types';
import { TimePeriod } from '../lib/domain/constants';

// ── Channel taxonomy ──
// C2B + C2D → NGS, GS stays GS, DCF stays DCF
export type CanonicalChannel = 'NGS' | 'GS' | 'DCF';

export function mapChannelToCanonical(raw: string): CanonicalChannel {
  const ch = raw.toUpperCase();
  if (ch === 'C2B' || ch === 'C2D' || ch === 'NGS' || ch === 'DEALER SHARED' || ch === 'WALK-IN') return 'NGS';
  if (ch === 'GS') return 'GS';
  if (ch === 'DCF') return 'DCF';
  return 'NGS'; // default fallback
}

// ── Time filtering ──

function isInTimeRange(dateStr: string | undefined, period: TimePeriod, customFrom?: string, customTo?: string): boolean {
  if (!dateStr) return false;
  const created = new Date(dateStr);
  if (isNaN(created.getTime())) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case TimePeriod.TODAY:
      return created >= today;
    case TimePeriod.D_MINUS_1: {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return created >= yesterday && created < today;
    }
    case TimePeriod.LAST_7D: {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return created >= d;
    }
    case TimePeriod.LAST_30D: {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return created >= d;
    }
    case TimePeriod.LAST_MONTH: {
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return created >= firstOfLastMonth && created < firstOfThisMonth;
    }
    case TimePeriod.LMTD: {
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthSameDay = new Date(now.getFullYear(), now.getMonth() - 1, today.getDate() + 1);
      return created >= prevMonthStart && created < prevMonthSameDay;
    }
    case TimePeriod.LAST_3M: {
      const d = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return created >= d;
    }
    case TimePeriod.LAST_6M: {
      const d = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      return created >= d;
    }
    case TimePeriod.QTD: {
      const q = Math.floor(now.getMonth() / 3) * 3;
      const quarterStart = new Date(now.getFullYear(), q, 1);
      return created >= quarterStart;
    }
    case TimePeriod.LIFETIME:
      return true;
    case TimePeriod.CUSTOM: {
      if (!customFrom || !customTo) return false;
      const from = new Date(customFrom);
      const to = new Date(customTo);
      return created >= from && created <= to;
    }
    case TimePeriod.MTD:
    default: {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return created >= monthStart;
    }
  }
}

// ── Filter options ──

export interface MetricFilters {
  period: TimePeriod;
  kamId?: string;
  customFrom?: string;
  customTo?: string;
}

// ── Filtered data getters ──

export function getFilteredLeads(filters: MetricFilters): Lead[] {
  let leads = LEADS as Lead[];
  leads = leads.filter(l => isInTimeRange(l.createdAt, filters.period, filters.customFrom, filters.customTo));
  if (filters.kamId) {
    leads = leads.filter(l => l.kamId === filters.kamId);
  }
  return leads;
}

export function getFilteredDCFLeads(filters: MetricFilters): DCFLead[] {
  let leads = DCF_LEADS as DCFLead[];
  leads = leads.filter(l => isInTimeRange(l.createdAt, filters.period, filters.customFrom, filters.customTo));
  if (filters.kamId) {
    leads = leads.filter(l => l.kamId === filters.kamId);
  }
  return leads;
}

export function getFilteredCalls(filters: MetricFilters): CallLog[] {
  let calls = CALLS as CallLog[];
  calls = calls.filter(c => isInTimeRange(c.callDate, filters.period, filters.customFrom, filters.customTo));
  if (filters.kamId) {
    calls = calls.filter(c => c.kamId === filters.kamId);
  }
  return calls;
}

export function getFilteredVisits(filters: MetricFilters): VisitLog[] {
  let visits = VISITS as VisitLog[];
  visits = visits.filter(v => isInTimeRange(v.checkInAt || v.visitDate, filters.period, filters.customFrom, filters.customTo));
  if (filters.kamId) {
    visits = visits.filter(v => v.kamId === filters.kamId);
  }
  return visits;
}

// ── Stage classification ──

function isStockIn(stage: string): boolean {
  const s = stage.toLowerCase();
  return s.includes('stock-in') || s.includes('stockin') || s === 'bought' || s === 'bbnp';
}

function isInspection(stage: string): boolean {
  const s = stage.toLowerCase();
  return s.includes('inspection');
}

// ── Dashboard metrics ──

export interface DashboardMetrics {
  // Lead counts
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;

  // Stock-in (leads with stage containing "stock-in")
  stockIns: number;

  // Inspections
  inspections: number;

  // I2SI = stock-ins / inspections * 100
  i2si: number;

  // Channel breakdown (canonical)
  channelBreakdown: Record<CanonicalChannel, number>;

  // DCF
  dcfTotal: number;
  dcfDisbursals: number;
  dcfDisbursedValue: number; // in lakhs
  dcfOnboarded: number;

  // Activity
  totalCalls: number;
  connectedCalls: number;
  totalVisits: number;
  completedVisits: number;

  // Dealer-level
  totalDealers: number;
  inspectingDealers: number;  // dealers with at least 1 lead in inspection+ stage
  transactingDealers: number; // dealers with at least 1 stock-in
  dcfOnboardedDealers: number;
}

export function computeDashboardMetrics(filters: MetricFilters): DashboardMetrics {
  const leads = getFilteredLeads(filters);
  const dcfLeads = getFilteredDCFLeads(filters);
  const calls = getFilteredCalls(filters);
  const visits = getFilteredVisits(filters);

  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => l.status === 'Active').length;
  const convertedLeads = leads.filter(l => l.status === 'Converted').length;
  const stockIns = leads.filter(l => isStockIn(l.stage)).length;
  const inspections = leads.filter(l => isInspection(l.stage) || isStockIn(l.stage)).length;
  const i2si = inspections > 0 ? Math.round((stockIns / inspections) * 100) : 0;

  // Channel breakdown
  const channelBreakdown: Record<CanonicalChannel, number> = { NGS: 0, GS: 0, DCF: 0 };
  leads.forEach(l => {
    channelBreakdown[mapChannelToCanonical(l.channel)]++;
  });

  // DCF
  const dcfDisbursals = dcfLeads.filter(l => l.overallStatus === 'DISBURSED').length;
  const dcfDisbursedValue = dcfLeads
    .filter(l => l.overallStatus === 'DISBURSED')
    .reduce((sum, l) => sum + ((l as any).loanAmount || 0), 0) / 100000; // to lakhs

  // Activity
  const totalCalls = calls.length;
  const connectedCalls = calls.filter(c => c.isProductive).length;
  const totalVisits = visits.length;
  const completedVisits = visits.filter(v => v.isProductive).length;

  // Dealer aggregation from leads
  const dealerLeadMap = new Map<string, Lead[]>();
  leads.forEach(l => {
    const existing = dealerLeadMap.get(l.dealerId) || [];
    existing.push(l);
    dealerLeadMap.set(l.dealerId, existing);
  });

  const allDealers = DEALERS as Dealer[];
  const inspectingDealers = Array.from(dealerLeadMap.values())
    .filter(dLeads => dLeads.some(l => isInspection(l.stage) || isStockIn(l.stage))).length;
  const transactingDealers = Array.from(dealerLeadMap.values())
    .filter(dLeads => dLeads.some(l => isStockIn(l.stage))).length;
  const dcfOnboardedDealers = allDealers.filter(d =>
    (d.tags || []).includes('DCF Onboarded')
  ).length;

  return {
    totalLeads,
    activeLeads,
    convertedLeads,
    stockIns,
    inspections,
    i2si,
    channelBreakdown,
    dcfTotal: dcfLeads.length,
    dcfDisbursals,
    dcfDisbursedValue,
    dcfOnboarded: dcfOnboardedDealers,
    totalCalls,
    connectedCalls,
    totalVisits,
    completedVisits,
    totalDealers: allDealers.length,
    inspectingDealers,
    transactingDealers,
    dcfOnboardedDealers,
  };
}

// ── Dealer-level metrics from actual leads ──

export interface DealerLeadMetrics {
  leadsMTD: number;
  inspectionsMTD: number;
  sisMTD: number;
  dcfMTD: number;
}

export function getDealerLeadMetrics(dealerId: string, filters: MetricFilters): DealerLeadMetrics {
  const leads = getFilteredLeads(filters).filter(l => l.dealerId === dealerId);
  const dcfLeads = getFilteredDCFLeads(filters).filter(l => l.dealerId === dealerId);

  return {
    leadsMTD: leads.length,
    inspectionsMTD: leads.filter(l => isInspection(l.stage) || isStockIn(l.stage)).length,
    sisMTD: leads.filter(l => isStockIn(l.stage)).length,
    dcfMTD: dcfLeads.length,
  };
}

// ── Get all leads with canonical channel ──

export function getLeadsWithCanonicalChannel(filters: MetricFilters): (Lead & { canonicalChannel: CanonicalChannel })[] {
  return getFilteredLeads(filters).map(l => ({
    ...l,
    canonicalChannel: mapChannelToCanonical(l.channel),
  }));
}
