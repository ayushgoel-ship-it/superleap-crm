/**
 * ADMIN FILTER HELPERS — Time-period multipliers + data filtering
 *
 * Provides:
 *   - applyTimePeriodMultiplier: scales metrics by time period
 *   - Mock dealer/lead datasets with region/TL fields for filtering
 *   - KPI recomputation from filtered datasets
 *
 * This is the bridge between AdminScopeBar state and actual data display.
 */

import type { Region, TLData } from './adminOrgMock';
import { getTLsByRegions, MOCK_TL_DATA, MOCK_TL_METRICS, type TLMetrics } from './adminOrgMock';
import { TimePeriod } from '../lib/domain/constants';
import { getTimeMultiplier } from '../lib/time/resolveTimePeriod';

// ── Time Period Multiplier ──

/**
 * @deprecated Phase 3 — Use TimePeriod from constants.ts instead.
 * Kept as alias for any lingering imports during migration.
 */
export type AdminTimePeriod = TimePeriod;

/**
 * @deprecated Phase 3 — Use getTimeMultiplier from /lib/time/resolveTimePeriod.ts
 */
export { getTimeMultiplier };

export function scaleMetric(value: number, period: TimePeriod): number {
  return Math.round(value * getTimeMultiplier(period));
}

/** For percentage metrics, time period doesn't scale linearly — just add variance */
export function scalePercent(value: number, period: TimePeriod): number {
  const variance: Partial<Record<TimePeriod, number>> = {
    [TimePeriod.D_MINUS_1]: -2.5,
    [TimePeriod.MTD]: 0,
    [TimePeriod.LMTD]: -3.2,
    [TimePeriod.LAST_MONTH]: 1.8,
  };
  return Math.max(0, Math.min(100, +(value + (variance[period] ?? 0)).toFixed(1)));
}

// ── Admin Mock Dealer Data (with region/TL fields) ──

export interface AdminDealerItem {
  id: string;
  name: string;
  city: string;
  region: Region;
  tlId: string;
  tlName: string;
  category: 'TOP' | 'TAGGED' | 'UNTAGGED';
  status: 'active' | 'dormant';
  leads: number;
  insp: number;
  si: number;
  dcf: number;
  visitedL30: boolean;
  calledL7: boolean;
}

export const ADMIN_DEALER_DATA: AdminDealerItem[] = [
  { id: 'd1', name: 'Gupta Motors', city: 'Gurgaon', region: 'NCR', tlId: 'tl-ncr-1', tlName: 'Rajesh Kumar', category: 'TOP', status: 'active', leads: 45, insp: 38, si: 12, dcf: 8, visitedL30: true, calledL7: true },
  { id: 'd2', name: 'Royal Auto Sales', city: 'Delhi', region: 'NCR', tlId: 'tl-ncr-1', tlName: 'Rajesh Kumar', category: 'TAGGED', status: 'active', leads: 32, insp: 28, si: 9, dcf: 5, visitedL30: true, calledL7: false },
  { id: 'd3', name: 'City Car Bazaar', city: 'Noida', region: 'NCR', tlId: 'tl-ncr-2', tlName: 'Neha Singh', category: 'TOP', status: 'active', leads: 52, insp: 45, si: 15, dcf: 12, visitedL30: true, calledL7: true },
  { id: 'd4', name: 'NCR Auto Hub', city: 'Faridabad', region: 'NCR', tlId: 'tl-ncr-2', tlName: 'Neha Singh', category: 'TAGGED', status: 'dormant', leads: 18, insp: 12, si: 3, dcf: 1, visitedL30: false, calledL7: false },
  { id: 'd5', name: 'Sharma Automobiles', city: 'Mumbai', region: 'West', tlId: 'tl-west-1', tlName: 'Amit Sharma', category: 'TAGGED', status: 'dormant', leads: 28, insp: 22, si: 7, dcf: 3, visitedL30: false, calledL7: true },
  { id: 'd6', name: 'Western Wheels', city: 'Pune', region: 'West', tlId: 'tl-west-1', tlName: 'Amit Sharma', category: 'TOP', status: 'active', leads: 41, insp: 35, si: 11, dcf: 7, visitedL30: true, calledL7: true },
  { id: 'd7', name: 'Pune Motor Plaza', city: 'Pune', region: 'West', tlId: 'tl-west-1', tlName: 'Amit Sharma', category: 'UNTAGGED', status: 'active', leads: 15, insp: 10, si: 2, dcf: 0, visitedL30: false, calledL7: true },
  { id: 'd8', name: 'Prime Motors', city: 'Bangalore', region: 'South', tlId: 'tl-south-1', tlName: 'Priya Iyer', category: 'TOP', status: 'active', leads: 48, insp: 41, si: 14, dcf: 9, visitedL30: true, calledL7: true },
  { id: 'd9', name: 'South Star Cars', city: 'Chennai', region: 'South', tlId: 'tl-south-1', tlName: 'Priya Iyer', category: 'TAGGED', status: 'active', leads: 36, insp: 30, si: 10, dcf: 6, visitedL30: true, calledL7: true },
  { id: 'd10', name: 'Chennai Drive Hub', city: 'Chennai', region: 'South', tlId: 'tl-south-1', tlName: 'Priya Iyer', category: 'UNTAGGED', status: 'dormant', leads: 8, insp: 5, si: 1, dcf: 0, visitedL30: false, calledL7: false },
  { id: 'd11', name: 'Eastern Motors', city: 'Kolkata', region: 'East', tlId: 'tl-east-1', tlName: 'Suresh Ghosh', category: 'TOP', status: 'active', leads: 38, insp: 32, si: 10, dcf: 5, visitedL30: true, calledL7: true },
  { id: 'd12', name: 'Bhubaneswar Auto', city: 'Bhubaneswar', region: 'East', tlId: 'tl-east-1', tlName: 'Suresh Ghosh', category: 'TAGGED', status: 'dormant', leads: 12, insp: 8, si: 2, dcf: 0, visitedL30: false, calledL7: false },
];

export interface AdminDealerFilters {
  regions: Region[];
  tlId: string;
  status: 'all' | 'active' | 'dormant';
  category: 'all' | 'top' | 'tagged' | 'untagged';
}

export function filterAdminDealers(filters: AdminDealerFilters): AdminDealerItem[] {
  return ADMIN_DEALER_DATA.filter(d => {
    if (filters.regions.length > 0 && !filters.regions.includes(d.region)) return false;
    if (filters.tlId && d.tlId !== filters.tlId) return false;
    if (filters.status !== 'all' && d.status !== filters.status) return false;
    if (filters.category !== 'all' && d.category !== filters.category.toUpperCase()) return false;
    return true;
  });
}

export interface AdminDealerKPIs {
  totalDealers: number;
  activeDealers: number;
  dormantDealers: number;
  leadGivingDealers: number;
  inspectingDealers: number;
  transactingDealers: number;
  inspToTransPercent: number;
  inspectingTopDealersPercent: number;
}

export function computeDealerKPIs(dealers: AdminDealerItem[]): AdminDealerKPIs {
  const total = dealers.length;
  const active = dealers.filter(d => d.status === 'active').length;
  const dormant = dealers.filter(d => d.status === 'dormant').length;
  const leadGiving = dealers.filter(d => d.leads > 0).length;
  const inspecting = dealers.filter(d => d.insp > 0).length;
  const transacting = dealers.filter(d => d.si > 0).length;
  const topDealers = dealers.filter(d => d.category === 'TOP');
  const inspTopDealers = topDealers.filter(d => d.insp > 0).length;

  return {
    totalDealers: total,
    activeDealers: active,
    dormantDealers: dormant,
    leadGivingDealers: leadGiving,
    inspectingDealers: inspecting,
    transactingDealers: transacting,
    inspToTransPercent: inspecting > 0 ? +((transacting / inspecting) * 100).toFixed(1) : 0,
    inspectingTopDealersPercent: topDealers.length > 0 ? +((inspTopDealers / topDealers.length) * 100).toFixed(1) : 0,
  };
}

// ── Admin Mock Lead Data (with region/TL/channel/type fields) ──

export interface AdminLeadItem {
  id: string;
  customerName: string;
  vehicle: string;
  region: Region;
  tlId: string;
  tlName: string;
  dealerName: string;
  channel: 'C2B' | 'C2D' | 'GS' | 'DCF';
  type: 'seller' | 'inventory';
  stage: string;
  value: number;
  hasCEP: boolean;
  hasInspection: boolean;
  hasSI: boolean;
}

export const ADMIN_LEAD_DATA: AdminLeadItem[] = [
  { id: 'l1', customerName: 'Ravi Patel', vehicle: '2020 Swift', region: 'NCR', tlId: 'tl-ncr-1', tlName: 'Rajesh Kumar', dealerName: 'Gupta Motors', channel: 'C2B', type: 'seller', stage: 'Inspected', value: 485000, hasCEP: true, hasInspection: true, hasSI: true },
  { id: 'l2', customerName: 'Amit Shah', vehicle: '2019 i20', region: 'NCR', tlId: 'tl-ncr-1', tlName: 'Rajesh Kumar', dealerName: 'Royal Auto', channel: 'C2B', type: 'seller', stage: 'New', value: 520000, hasCEP: true, hasInspection: false, hasSI: false },
  { id: 'l3', customerName: 'Priya Mehta', vehicle: '2021 Creta', region: 'NCR', tlId: 'tl-ncr-2', tlName: 'Neha Singh', dealerName: 'City Car Bazaar', channel: 'C2D', type: 'inventory', stage: 'Offer Made', value: 1150000, hasCEP: false, hasInspection: true, hasSI: false },
  { id: 'l4', customerName: 'Suresh Gupta', vehicle: '2018 Verna', region: 'NCR', tlId: 'tl-ncr-2', tlName: 'Neha Singh', dealerName: 'NCR Auto Hub', channel: 'GS', type: 'seller', stage: 'Inspected', value: 380000, hasCEP: true, hasInspection: true, hasSI: true },
  { id: 'l5', customerName: 'Deepak Joshi', vehicle: '2020 Nexon', region: 'West', tlId: 'tl-west-1', tlName: 'Amit Sharma', dealerName: 'Sharma Auto', channel: 'C2B', type: 'seller', stage: 'Won', value: 720000, hasCEP: true, hasInspection: true, hasSI: true },
  { id: 'l6', customerName: 'Meera Desai', vehicle: '2019 Baleno', region: 'West', tlId: 'tl-west-1', tlName: 'Amit Sharma', dealerName: 'Western Wheels', channel: 'C2D', type: 'inventory', stage: 'New', value: 550000, hasCEP: false, hasInspection: false, hasSI: false },
  { id: 'l7', customerName: 'Arjun Kulkarni', vehicle: '2021 Seltos', region: 'West', tlId: 'tl-west-1', tlName: 'Amit Sharma', dealerName: 'Pune Motor', channel: 'DCF', type: 'seller', stage: 'Inspected', value: 980000, hasCEP: true, hasInspection: true, hasSI: false },
  { id: 'l8', customerName: 'Kavitha Reddy', vehicle: '2020 XUV300', region: 'South', tlId: 'tl-south-1', tlName: 'Priya Iyer', dealerName: 'Prime Motors', channel: 'C2B', type: 'seller', stage: 'Inspected', value: 610000, hasCEP: true, hasInspection: true, hasSI: true },
  { id: 'l9', customerName: 'Ramesh Nair', vehicle: '2019 Ertiga', region: 'South', tlId: 'tl-south-1', tlName: 'Priya Iyer', dealerName: 'South Star', channel: 'GS', type: 'seller', stage: 'New', value: 750000, hasCEP: false, hasInspection: false, hasSI: false },
  { id: 'l10', customerName: 'Anitha S', vehicle: '2021 Brezza', region: 'South', tlId: 'tl-south-1', tlName: 'Priya Iyer', dealerName: 'Prime Motors', channel: 'C2B', type: 'seller', stage: 'Won', value: 820000, hasCEP: true, hasInspection: true, hasSI: true },
  { id: 'l11', customerName: 'Debashish Bose', vehicle: '2018 Tiago', region: 'East', tlId: 'tl-east-1', tlName: 'Suresh Ghosh', dealerName: 'Eastern Motors', channel: 'C2B', type: 'seller', stage: 'Contacted', value: 350000, hasCEP: true, hasInspection: false, hasSI: false },
  { id: 'l12', customerName: 'Neelam Sarkar', vehicle: '2020 Sonet', region: 'East', tlId: 'tl-east-1', tlName: 'Suresh Ghosh', dealerName: 'Eastern Motors', channel: 'C2D', type: 'inventory', stage: 'New', value: 680000, hasCEP: false, hasInspection: false, hasSI: false },
  { id: 'l13', customerName: 'Rajib Das', vehicle: '2019 Dzire', region: 'East', tlId: 'tl-east-1', tlName: 'Suresh Ghosh', dealerName: 'Bhubaneswar Auto', channel: 'GS', type: 'seller', stage: 'Lost', value: 420000, hasCEP: true, hasInspection: true, hasSI: false },
  { id: 'l14', customerName: 'Vikash Tiwari', vehicle: '2021 Punch', region: 'NCR', tlId: 'tl-ncr-1', tlName: 'Rajesh Kumar', dealerName: 'Gupta Motors', channel: 'DCF', type: 'seller', stage: 'New', value: 590000, hasCEP: false, hasInspection: false, hasSI: false },
  { id: 'l15', customerName: 'Shweta Verma', vehicle: '2020 Altroz', region: 'West', tlId: 'tl-west-1', tlName: 'Amit Sharma', dealerName: 'Western Wheels', channel: 'C2B', type: 'seller', stage: 'Inspected', value: 510000, hasCEP: true, hasInspection: true, hasSI: true },
];

export interface AdminLeadFilters {
  regions: Region[];
  tlId: string;
  channel: string; // 'all' | 'C2B' | 'C2D' | 'GS' | 'DCF'
  type: 'all' | 'seller' | 'inventory';
}

export function filterAdminLeads(filters: AdminLeadFilters): AdminLeadItem[] {
  return ADMIN_LEAD_DATA.filter(l => {
    if (filters.regions.length > 0 && !filters.regions.includes(l.region)) return false;
    if (filters.tlId && l.tlId !== filters.tlId) return false;
    if (filters.channel !== 'all' && l.channel !== filters.channel) return false;
    if (filters.type !== 'all' && l.type !== filters.type) return false;
    return true;
  });
}

export interface AdminLeadKPIs {
  totalLeads: number;
  siRate: number;
  i2bPercent: number;
  t2siPercent: number;
  cepCapturePercent: number;
  sellerLeads: number;
  inventoryLeads: number;
}

export function computeLeadKPIs(leads: AdminLeadItem[]): AdminLeadKPIs {
  const total = leads.length;
  const seller = leads.filter(l => l.type === 'seller').length;
  const inventory = leads.filter(l => l.type === 'inventory').length;
  const withCEP = leads.filter(l => l.hasCEP).length;
  const withInspection = leads.filter(l => l.hasInspection).length;
  const withSI = leads.filter(l => l.hasSI).length;

  return {
    totalLeads: total,
    siRate: total > 0 ? +((withSI / total) * 100).toFixed(1) : 0,
    i2bPercent: withInspection > 0 ? +((withSI / withInspection) * 100).toFixed(1) : 0,
    t2siPercent: withInspection > 0 ? +((withSI / withInspection) * 100).toFixed(1) : 0,
    cepCapturePercent: total > 0 ? +((withCEP / total) * 100).toFixed(1) : 0,
    sellerLeads: seller,
    inventoryLeads: inventory,
  };
}

export interface ChannelBreakdown {
  name: string;
  count: number;
  i2si: number;
}

export function computeChannelBreakdown(leads: AdminLeadItem[]): ChannelBreakdown[] {
  const channels: ('C2B' | 'C2D' | 'GS' | 'DCF')[] = ['C2B', 'C2D', 'GS', 'DCF'];
  return channels.map(ch => {
    const chLeads = leads.filter(l => l.channel === ch);
    const withInsp = chLeads.filter(l => l.hasInspection).length;
    const withSI = chLeads.filter(l => l.hasSI).length;
    return {
      name: ch,
      count: chLeads.length,
      i2si: withInsp > 0 ? +((withSI / withInsp) * 100).toFixed(1) : 0,
    };
  }).filter(ch => ch.count > 0);
}

// ── Scale TL metrics by time period ──

export function scaleTLMetrics(metrics: TLMetrics[], period: TimePeriod): TLMetrics[] {
  const m = getTimeMultiplier(period);
  return metrics.map(tl => ({
    ...tl,
    leadsAch: Math.round(tl.leadsAch * m),
    inspAch: Math.round(tl.inspAch * m),
    siAch: Math.round(tl.siAch * m),
    dcfDisbCountAch: Math.round(tl.dcfDisbCountAch * m),
    dcfDisbValueAch: Math.round(tl.dcfDisbValueAch * m),
    dcfLeads: Math.round(tl.dcfLeads * m),
    dcfOnboardings: Math.round(tl.dcfOnboardings * m),
    dcfDisbursements: Math.round(tl.dcfDisbursements * m),
    dcfGMV: Math.round(tl.dcfGMV * m),
    // Percentages use variance not multiplier
    i2siPercent: scalePercent(tl.i2siPercent, period),
    inputScore: scalePercent(tl.inputScore, period),
    productiveVisitsPercent: scalePercent(tl.productiveVisitsPercent, period),
    productiveCallsPercent: scalePercent(tl.productiveCallsPercent, period),
  }));
}