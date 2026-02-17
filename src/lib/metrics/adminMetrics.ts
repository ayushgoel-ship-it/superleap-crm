/**
 * ADMIN METRICS ENGINE
 * Single source of truth for all Admin Home dashboard computations
 * 
 * NO UI COMPONENT should compute admin metrics directly.
 * All admin-level aggregations happen here.
 */

import { DEALERS, DCF_LEADS, ORG } from '../../data/mockDatabase';
import { Dealer, DCFLead, RegionKey } from '../../data/types';
import { MetricsEngine } from '../metricsEngine';
import { round } from '../domain/metrics';
import { TimePeriod } from '../domain/constants';

/**
 * @deprecated Phase 3 — Use TimePeriod from constants.ts directly.
 */
export type AdminTimeFilter = TimePeriod;

/**
 * Admin filter state
 */
export interface AdminFilters {
  timeScope: TimePeriod;
  regions: RegionKey[];
}

/**
 * Business summary metrics
 */
export interface AdminBusinessSummary {
  // Dealer Referral metrics
  siAchieved: number;
  siTarget: number;
  inspections: number;
  i2si: number; // percentage
  c2dI2B: number; // count
  
  // DCF metrics
  dcfOnboarding: number; // count of dealers onboarded
  dcfLeads: number; // count of DCF leads
  dcfGMV: number; // total GMV in rupees
  dcfDisbursals: number; // count of disbursed loans
}

/**
 * Region performance card
 */
export interface RegionPerformance {
  region: RegionKey;
  tlCount: number;
  siAchieved: number;
  siTarget: number;
  i2si: number; // percentage
  dcfDisbursals: number;
  inputScore: number; // average
  dcfGMV: number;
}

/**
 * TL leaderboard row
 */
export interface TLLeaderboardRow {
  tlId: string;
  tlName: string;
  region: RegionKey;
  kamCount: number;
  siAchieved: number;
  siTarget: number;
  i2si: number; // percentage
  dcfDisbursals: number;
  inputScore: number; // average
}

/**
 * Complete admin home metrics
 */
export interface AdminHomeMetrics {
  summary: AdminBusinessSummary;
  regionBreakdown: RegionPerformance[];
  tlLeaderboard: TLLeaderboardRow[];
}

/**
 * Helper: Check if a date string matches the time filter
 */
function matchesTimeFilter(dateStr: string, filter: AdminTimeFilter, now: Date = new Date()): boolean {
  const date = new Date(dateStr);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  switch (filter) {
    case 'MTD': {
      // Month to date
      return date.getFullYear() === currentYear && 
             date.getMonth() === currentMonth &&
             date.getDate() <= currentDay;
    }
    case 'D-1': {
      // Yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return date.getFullYear() === yesterday.getFullYear() &&
             date.getMonth() === yesterday.getMonth() &&
             date.getDate() === yesterday.getDate();
    }
    case 'LMTD': {
      // Last month to date (same day range, previous month)
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getFullYear() === lastMonthYear &&
             date.getMonth() === lastMonth &&
             date.getDate() <= currentDay;
    }
    case 'Last Month': {
      // Full previous month
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getFullYear() === lastMonthYear &&
             date.getMonth() === lastMonth;
    }
    default:
      return true;
  }
}

/**
 * Helper: Filter dealers by region
 */
function filterDealersByRegion(dealers: Dealer[], regions: RegionKey[]): Dealer[] {
  if (regions.length === 0) return dealers; // All regions
  return dealers.filter(d => regions.includes(d.region));
}

/**
 * Helper: Filter DCF leads by region
 */
function filterDCFLeadsByRegion(leads: DCFLead[], regions: RegionKey[]): DCFLead[] {
  if (regions.length === 0) return leads; // All regions
  return leads.filter(lead => {
    // Find the dealer to get region
    const dealer = DEALERS.find(d => d.id === lead.dealerId);
    return dealer && regions.includes(dealer.region);
  });
}

/**
 * Compute business summary metrics
 */
function computeBusinessSummary(
  dealers: Dealer[],
  dcfLeads: DCFLead[],
  timeScope: AdminTimeFilter
): AdminBusinessSummary {
  // For now, use MTD metrics from dealers
  // In a real system, we'd filter by actual timestamps
  
  let siAchieved = 0;
  let inspections = 0;
  let c2dI2B = 0; // For simplicity, we'll approximate from SIs
  
  dealers.forEach(dealer => {
    siAchieved += dealer.metrics.mtd.sis;
    inspections += dealer.metrics.mtd.inspections;
  });
  
  // I2SI calculation
  const i2si = inspections > 0 ? round((siAchieved / inspections) * 100, 1) : 0;
  
  // C2D I2B approximation (assume 60% of SIs come from C2D channel)
  c2dI2B = Math.round(siAchieved * 0.6);
  
  // DCF metrics
  const dcfOnboarding = new Set(dcfLeads.map(l => l.dealerId)).size;
  const dcfLeadsCount = dcfLeads.length;
  
  // DCF disbursals (check if disbursalDate exists)
  const dcfDisbursals = dcfLeads.filter(lead => lead.disbursalDate).length;
  
  // DCF GMV (sum of loan amounts for disbursed loans)
  const dcfGMV = dcfLeads
    .filter(lead => lead.disbursalDate && lead.loanAmount)
    .reduce((sum, lead) => sum + (lead.loanAmount || 0), 0);
  
  // SI target calculation (assume 20 SI per KAM, aggregate across all KAMs)
  const totalKAMs = ORG.tls.reduce((sum, tl) => sum + tl.kams.length, 0);
  const siTarget = totalKAMs * 20; // 20 SI per KAM per month
  
  return {
    siAchieved,
    siTarget,
    inspections,
    i2si,
    c2dI2B,
    dcfOnboarding,
    dcfLeads: dcfLeadsCount,
    dcfGMV,
    dcfDisbursals,
  };
}

/**
 * Compute region-wise performance
 */
function computeRegionBreakdown(
  dealers: Dealer[],
  dcfLeads: DCFLead[],
  regions: RegionKey[]
): RegionPerformance[] {
  const regionsToCompute = regions.length > 0 ? regions : ORG.regions;
  
  return regionsToCompute.map(region => {
    // Filter dealers in this region
    const regionDealers = dealers.filter(d => d.region === region);
    
    // Filter DCF leads in this region
    const regionDCFLeads = dcfLeads.filter(lead => {
      const dealer = DEALERS.find(d => d.id === lead.dealerId);
      return dealer && dealer.region === region;
    });
    
    // Get TLs in this region
    const regionTLs = ORG.tls.filter(tl => tl.region === region);
    const tlCount = regionTLs.length;
    
    // Calculate metrics
    const siAchieved = regionDealers.reduce((sum, d) => sum + d.metrics.mtd.sis, 0);
    const inspections = regionDealers.reduce((sum, d) => sum + d.metrics.mtd.inspections, 0);
    const i2si = inspections > 0 ? round((siAchieved / inspections) * 100, 1) : 0;
    
    const dcfDisbursals = regionDCFLeads.filter(lead => lead.disbursalDate).length;
    
    const dcfGMV = regionDCFLeads
      .filter(lead => lead.disbursalDate && lead.loanAmount)
      .reduce((sum, lead) => sum + (lead.loanAmount || 0), 0);
    
    // Input score (mock - in real system would come from actual data)
    const inputScore = 75 + Math.random() * 10; // Mock: 75-85
    
    // SI target for this region
    const kamCount = regionTLs.reduce((sum, tl) => sum + tl.kams.length, 0);
    const siTarget = kamCount * 20;
    
    return {
      region,
      tlCount,
      siAchieved,
      siTarget,
      i2si,
      dcfDisbursals,
      inputScore: round(inputScore, 1),
      dcfGMV,
    };
  }).sort((a, b) => b.siAchieved - a.siAchieved); // Sort by SI achieved
}

/**
 * Compute TL leaderboard
 */
function computeTLLeaderboard(
  dealers: Dealer[],
  dcfLeads: DCFLead[]
): TLLeaderboardRow[] {
  return ORG.tls.map(tl => {
    // Filter dealers managed by this TL's KAMs
    const tlDealers = dealers.filter(d => d.tlId === tl.id);
    
    // Filter DCF leads managed by this TL's KAMs
    const tlDCFLeads = dcfLeads.filter(lead => lead.tlId === tl.id);
    
    // Calculate metrics
    const siAchieved = tlDealers.reduce((sum, d) => sum + d.metrics.mtd.sis, 0);
    const inspections = tlDealers.reduce((sum, d) => sum + d.metrics.mtd.inspections, 0);
    const i2si = inspections > 0 ? round((siAchieved / inspections) * 100, 1) : 0;
    
    const dcfDisbursals = tlDCFLeads.filter(lead => lead.disbursalDate).length;
    
    // Input score (mock - in real system would come from actual productivity data)
    const inputScore = 70 + Math.random() * 15; // Mock: 70-85
    
    // SI target for this TL
    const kamCount = tl.kams.length;
    const siTarget = kamCount * 20;
    
    return {
      tlId: tl.id,
      tlName: tl.name,
      region: tl.region,
      kamCount,
      siAchieved,
      siTarget,
      i2si,
      dcfDisbursals,
      inputScore: round(inputScore, 1),
    };
  }).sort((a, b) => {
    // Sort by SI achievement percentage
    const aPercent = a.siTarget > 0 ? (a.siAchieved / a.siTarget) * 100 : 0;
    const bPercent = b.siTarget > 0 ? (b.siAchieved / b.siTarget) * 100 : 0;
    return bPercent - aPercent;
  });
}

/**
 * MAIN FUNCTION: Get all admin home metrics
 * 
 * This is the single entry point for Admin Home dashboard data.
 * All filtering and computation happens here.
 * 
 * @param filters - Time scope and region filters
 * @param now - Current date (for testing)
 * @returns Complete admin home metrics
 */
export function getAdminHomeMetrics(
  filters: AdminFilters,
  now: Date = new Date()
): AdminHomeMetrics {
  // Apply region filter
  const filteredDealers = filterDealersByRegion(DEALERS, filters.regions);
  const filteredDCFLeads = filterDCFLeadsByRegion(DCF_LEADS, filters.regions);
  
  // Compute all metrics
  const summary = computeBusinessSummary(filteredDealers, filteredDCFLeads, filters.timeScope);
  const regionBreakdown = computeRegionBreakdown(filteredDealers, filteredDCFLeads, filters.regions);
  const tlLeaderboard = computeTLLeaderboard(filteredDealers, filteredDCFLeads);
  
  return {
    summary,
    regionBreakdown,
    tlLeaderboard,
  };
}

/**
 * Helper: Get default filters
 */
export function getDefaultAdminFilters(): AdminFilters {
  return {
    timeScope: 'MTD',
    regions: [], // Empty = All regions
  };
}