/**
 * Admin Org Data
 * 
 * Sources org structure and metrics from runtimeDB (Supabase-backed).
 * Falls back to empty arrays/defaults if data not yet loaded.
 */

import { getRuntimeDBSync } from '@/data/runtimeDB';

export type Region = 'NCR' | 'West' | 'South' | 'East';

export interface KAMData {
  kamId: string;
  kamName: string;
  city: string;
  phone: string;
  email: string;
  tlId: string;
}

export interface TLData {
  tlId: string;
  tlName: string;
  region: Region;
  phone: string;
  email: string;
  kams: KAMData[];
}

export interface RegionMetrics {
  region: Region;
  leadsTarget: number;
  leadsAch: number;
  inspTarget: number;
  inspAch: number;
  siTarget: number;
  siAch: number;
  dcfDisbCountTarget: number;
  dcfDisbCountAch: number;
  dcfDisbValueTarget: number;
  dcfDisbValueAch: number;
  ngsInventory: number;
  ngsBuyers: number;
  ngsI2BPercent: number;
  dcfLeads: number;
  dcfOnboardings: number;
  dcfDisbursements: number;
  dcfGMV: number;
  i2siPercent: number;
  inputScore: number;
  productiveVisitsPercent: number;
  productiveCallsPercent: number;
  visitsPerKAMPerDay: number;
  callsPerKAMPerDay: number;
  topDealerCoverageVisitsL30: number;
  taggedDealerCoverageVisitsL30: number;
  overallDealerCoverageVisitsL30: number;
  topDealerCoverageCallsL7: number;
  taggedDealerCoverageCallsL7: number;
  overallDealerCoverageCallsL7: number;
}

export interface TLMetrics extends RegionMetrics {
  tlId: string;
  tlName: string;
}

// ─── LIVE DATA ACCESSORS ──────────────────────────────────────────────────

function db() {
  try {
    return getRuntimeDBSync();
  } catch {
    return null;
  }
}

/**
 * Get TL data from live org structure
 */
function getLiveTLData(): TLData[] {
  const rdb = db();
  if (!rdb?.org?.tls) return [];

  return rdb.org.tls.map(tl => ({
    tlId: tl.id,
    tlName: tl.name,
    region: tl.region as Region,
    phone: tl.phone || '',
    email: tl.email || '',
    kams: (tl.kams || []).map(kam => ({
      kamId: kam.id,
      kamName: kam.name,
      city: kam.city || '',
      phone: kam.phone || '',
      email: kam.email || '',
      tlId: tl.id,
    })),
  }));
}

/**
 * Compute region metrics from live data
 */
function computeRegionMetrics(region: Region): RegionMetrics {
  const rdb = db();
  if (!rdb) return emptyRegionMetrics(region);

  const dealers = rdb.dealers.filter(d => d.region === region);
  const calls = rdb.calls.filter(c => {
    const dealer = dealers.find(d => d.id === c.dealerId);
    return !!dealer;
  });
  const visits = rdb.visits.filter(v => {
    const dealer = dealers.find(d => d.id === v.dealerId);
    return !!dealer;
  });
  const leads = rdb.leads.filter(l => l.region === region);
  const dcfLeads = rdb.dcfLeads.filter(l => {
    const dealer = dealers.find(d => d.id === l.dealerId);
    return !!dealer;
  });

  const productiveCalls = calls.filter(c => c.isProductive).length;
  const productiveVisits = visits.filter(v => v.isProductive).length;
  const totalKAMs = rdb.org.tls
    .filter(tl => tl.region === region)
    .reduce((acc, tl) => acc + (tl.kams?.length || 0), 0) || 1;

  return {
    region,
    leadsTarget: 0, // Targets come from Config sheet
    leadsAch: leads.length,
    inspTarget: 0,
    inspAch: leads.filter(l => l.stage === 'Inspection Scheduled' || l.stage === 'Inspection Done').length,
    siTarget: 0,
    siAch: leads.filter(l => l.stage === 'Stock-in').length,
    dcfDisbCountTarget: 0,
    dcfDisbCountAch: dcfLeads.filter(l => l.overallStatus === 'DISBURSED').length,
    dcfDisbValueTarget: 0,
    dcfDisbValueAch: dcfLeads
      .filter(l => l.overallStatus === 'DISBURSED')
      .reduce((acc, l) => acc + (l.loanAmount || 0), 0) / 100000, // Convert to lakhs
    ngsInventory: leads.filter(l => l.channel === 'NGS' && l.leadType === 'Inventory').length,
    ngsBuyers: leads.filter(l => l.channel === 'NGS' && l.leadType === 'Seller').length,
    ngsI2BPercent: 0,
    dcfLeads: dcfLeads.length,
    dcfOnboardings: dcfLeads.filter(l => l.currentFunnel === 'Onboarded').length,
    dcfDisbursements: dcfLeads.filter(l => l.overallStatus === 'DISBURSED').length,
    dcfGMV: dcfLeads.reduce((acc, l) => acc + (l.loanAmount || 0), 0) / 100000,
    i2siPercent: 0,
    inputScore: 0,
    productiveVisitsPercent: visits.length > 0 ? (productiveVisits / visits.length) * 100 : 0,
    productiveCallsPercent: calls.length > 0 ? (productiveCalls / calls.length) * 100 : 0,
    visitsPerKAMPerDay: visits.length / totalKAMs,
    callsPerKAMPerDay: calls.length / totalKAMs,
    topDealerCoverageVisitsL30: 0,
    taggedDealerCoverageVisitsL30: 0,
    overallDealerCoverageVisitsL30: 0,
    topDealerCoverageCallsL7: 0,
    taggedDealerCoverageCallsL7: 0,
    overallDealerCoverageCallsL7: 0,
  };
}

function emptyRegionMetrics(region: Region): RegionMetrics {
  return {
    region,
    leadsTarget: 0, leadsAch: 0, inspTarget: 0, inspAch: 0,
    siTarget: 0, siAch: 0, dcfDisbCountTarget: 0, dcfDisbCountAch: 0,
    dcfDisbValueTarget: 0, dcfDisbValueAch: 0, ngsInventory: 0,
    ngsBuyers: 0, ngsI2BPercent: 0, dcfLeads: 0, dcfOnboardings: 0,
    dcfDisbursements: 0, dcfGMV: 0, i2siPercent: 0, inputScore: 0,
    productiveVisitsPercent: 0, productiveCallsPercent: 0,
    visitsPerKAMPerDay: 0, callsPerKAMPerDay: 0,
    topDealerCoverageVisitsL30: 0, taggedDealerCoverageVisitsL30: 0,
    overallDealerCoverageVisitsL30: 0, topDealerCoverageCallsL7: 0,
    taggedDealerCoverageCallsL7: 0, overallDealerCoverageCallsL7: 0,
  };
}

// ─── PUBLIC API (same signatures as before) ──────────────────────────────

/** Live TL data from Supabase org table */
export const MOCK_TL_DATA: TLData[] = []; // Lazy-loaded, use getTLsByRegion()

/** Region metrics computed from live data */
export const MOCK_REGION_METRICS: RegionMetrics[] = []; // Use getRegionMetrics()

/** TL metrics computed from live data */
export const MOCK_TL_METRICS: TLMetrics[] = []; // Use getTLMetrics()

export function getAllRegions(): Region[] {
  return ['NCR', 'West', 'South', 'East'];
}

export function getTLsByRegion(region: Region): TLData[] {
  return getLiveTLData().filter(tl => tl.region === region);
}

export function getTLsByRegions(regions: Region[]): TLData[] {
  const allTLs = getLiveTLData();
  if (regions.length === 0) return allTLs;
  return allTLs.filter(tl => regions.includes(tl.region));
}

export function getKAMsByTL(tlId: string): KAMData[] {
  const tl = getLiveTLData().find(t => t.tlId === tlId);
  return tl?.kams || [];
}

export function getKAMsByRegions(regions: Region[]): KAMData[] {
  const tls = getTLsByRegions(regions);
  return tls.flatMap(tl => tl.kams);
}

export function getRegionMetrics(region: Region): RegionMetrics {
  return computeRegionMetrics(region);
}

export function getTLMetrics(tlId: string): TLMetrics | undefined {
  const tl = getLiveTLData().find(t => t.tlId === tlId);
  if (!tl) return undefined;

  const regionMetrics = computeRegionMetrics(tl.region);
  return {
    ...regionMetrics,
    tlId: tl.tlId,
    tlName: tl.tlName,
  };
}

export function getMetricsByRegion(region: Region): RegionMetrics {
  return computeRegionMetrics(region);
}

export function getAggregatedRegionMetrics(regions: Region[]): RegionMetrics {
  const targetRegions = regions.length === 0 ? getAllRegions() : regions;
  const metrics = targetRegions.map(r => computeRegionMetrics(r));

  const sum = (key: keyof RegionMetrics) =>
    metrics.reduce((acc, m) => acc + (typeof m[key] === 'number' ? m[key] as number : 0), 0);

  const avg = (key: keyof RegionMetrics) =>
    metrics.length > 0
      ? metrics.reduce((acc, m) => acc + (typeof m[key] === 'number' ? m[key] as number : 0), 0) / metrics.length
      : 0;

  return {
    region: 'NCR', // dummy for aggregation
    leadsTarget: sum('leadsTarget'),
    leadsAch: sum('leadsAch'),
    inspTarget: sum('inspTarget'),
    inspAch: sum('inspAch'),
    siTarget: sum('siTarget'),
    siAch: sum('siAch'),
    dcfDisbCountTarget: sum('dcfDisbCountTarget'),
    dcfDisbCountAch: sum('dcfDisbCountAch'),
    dcfDisbValueTarget: sum('dcfDisbValueTarget'),
    dcfDisbValueAch: sum('dcfDisbValueAch'),
    ngsInventory: sum('ngsInventory'),
    ngsBuyers: sum('ngsBuyers'),
    ngsI2BPercent: avg('ngsI2BPercent'),
    dcfLeads: sum('dcfLeads'),
    dcfOnboardings: sum('dcfOnboardings'),
    dcfDisbursements: sum('dcfDisbursements'),
    dcfGMV: sum('dcfGMV'),
    i2siPercent: avg('i2siPercent'),
    inputScore: avg('inputScore'),
    productiveVisitsPercent: avg('productiveVisitsPercent'),
    productiveCallsPercent: avg('productiveCallsPercent'),
    visitsPerKAMPerDay: avg('visitsPerKAMPerDay'),
    callsPerKAMPerDay: avg('callsPerKAMPerDay'),
    topDealerCoverageVisitsL30: avg('topDealerCoverageVisitsL30'),
    taggedDealerCoverageVisitsL30: avg('taggedDealerCoverageVisitsL30'),
    overallDealerCoverageVisitsL30: avg('overallDealerCoverageVisitsL30'),
    topDealerCoverageCallsL7: avg('topDealerCoverageCallsL7'),
    taggedDealerCoverageCallsL7: avg('taggedDealerCoverageCallsL7'),
    overallDealerCoverageCallsL7: avg('overallDealerCoverageCallsL7'),
  };
}