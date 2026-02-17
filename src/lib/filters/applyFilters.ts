/**
 * PHASE 6 — CENTRALIZED FILTER ENGINE
 *
 * All array filtering logic lives here.
 * No screen should manually filter arrays anymore.
 *
 * Each function takes raw data + FilterState and returns filtered data.
 * All functions are pure — safe to memoize with useMemo.
 */

import type { FilterState } from '../../contexts/FilterContext';
import { TimePeriod } from '../domain/constants';
import { resolveTimePeriodToRange } from '../time/resolveTimePeriod';
import type { Lead } from '../../data/types';
import type { AdminDealerItem, AdminLeadItem } from '../../data/adminFilterHelpers';
import type { Visit, CallAttempt } from '../../contexts/ActivityContext';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Returns true if `dateStr` falls within the resolved time range of the filter.
 */
function isInTimeRange(dateStr: string, time: TimePeriod | undefined): boolean {
  if (!time) return true; // No time filter = include all
  if (!dateStr) return false;

  try {
    const { fromISO, toISO } = resolveTimePeriodToRange(time);
    const ts = new Date(dateStr).getTime();
    return ts >= new Date(fromISO).getTime() && ts < new Date(toISO).getTime();
  } catch {
    return true; // On error, include
  }
}

/**
 * Returns true if `dateStr` is at or after the cutoff for the given period.
 * Simpler variant for client-side mock data that just needs a floor check.
 */
function isAfterCutoff(dateStr: string, time: TimePeriod | undefined): boolean {
  if (!time) return true;
  if (!dateStr) return false;

  try {
    const { fromISO } = resolveTimePeriodToRange(time);
    return new Date(dateStr).getTime() >= new Date(fromISO).getTime();
  } catch {
    return true;
  }
}

// ============================================================================
// LEAD FILTERS
// ============================================================================

/**
 * Filter leads by FilterState.
 * Used by LeadsPageV3 and KAM leads view.
 */
export function applyLeadFilters(
  leads: Lead[],
  filters: FilterState,
): Lead[] {
  let result = [...leads];

  // Time filter on createdAt
  if (filters.time) {
    result = result.filter(l => isAfterCutoff(l.createdAt, filters.time));
  }

  // Channel filter
  if (filters.channel && filters.channel.length > 0 && !filters.channel.includes('all')) {
    result = result.filter(l => filters.channel!.includes(l.channel));
  }

  // Status filter (maps to lead stage)
  if (filters.status && filters.status.length > 0) {
    result = result.filter(l =>
      filters.status!.some(s => l.stage.toLowerCase().includes(s.toLowerCase())),
    );
  }

  // Search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(l =>
      l.customerName?.toLowerCase().includes(q) ||
      l.vehicle?.toLowerCase().includes(q) ||
      l.dealerName?.toLowerCase().includes(q) ||
      l.id?.toLowerCase().includes(q),
    );
  }

  return result;
}

// ============================================================================
// ADMIN DEALER FILTERS
// ============================================================================

/**
 * Filter admin dealer dataset by FilterState.
 * Used by AdminDealersPage.
 */
export function applyAdminDealerFilters(
  dealers: AdminDealerItem[],
  filters: FilterState,
): AdminDealerItem[] {
  let result = [...dealers];

  // Region
  if (filters.region && filters.region.length > 0) {
    result = result.filter(d => filters.region!.includes(d.region));
  }

  // TL
  if (filters.tl && filters.tl.length > 0) {
    result = result.filter(d => filters.tl!.includes(d.tlId));
  }

  // Status
  if (filters.status && filters.status.length > 0 && !filters.status.includes('all')) {
    result = result.filter(d => filters.status!.includes(d.status));
  }

  // Dealer category
  if (filters.dealerCategory && filters.dealerCategory.length > 0 && !filters.dealerCategory.includes('all')) {
    result = result.filter(d =>
      filters.dealerCategory!.some(c => c.toUpperCase() === d.category),
    );
  }

  return result;
}

// ============================================================================
// ADMIN LEAD FILTERS
// ============================================================================

/**
 * Filter admin lead dataset by FilterState.
 * Used by AdminLeadsPage.
 */
export function applyAdminLeadFilters(
  leads: AdminLeadItem[],
  filters: FilterState,
): AdminLeadItem[] {
  let result = [...leads];

  // Region
  if (filters.region && filters.region.length > 0) {
    result = result.filter(l => filters.region!.includes(l.region));
  }

  // TL
  if (filters.tl && filters.tl.length > 0) {
    result = result.filter(l => filters.tl!.includes(l.tlId));
  }

  // Channel
  if (filters.channel && filters.channel.length > 0 && !filters.channel.includes('all')) {
    result = result.filter(l => filters.channel!.includes(l.channel));
  }

  // Lead type
  if (filters.leadType && filters.leadType.length > 0 && !filters.leadType.includes('all')) {
    result = result.filter(l => filters.leadType!.includes(l.type));
  }

  return result;
}

// ============================================================================
// VISIT FILTERS
// ============================================================================

/**
 * Filter visits by FilterState.
 * Used by VisitsTabContent (past visits only) and Activity page.
 */
export function applyVisitFilters(
  visits: Visit[],
  filters: FilterState,
): Visit[] {
  let result = [...visits];

  // Time filter on checkInTime (or scheduledTime fallback)
  if (filters.time) {
    result = result.filter(v => {
      const dateStr = v.checkInTime || v.scheduledTime || '';
      return isAfterCutoff(dateStr, filters.time);
    });
  }

  // Search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(v =>
      v.dealerName?.toLowerCase().includes(q) ||
      v.dealerCode?.toLowerCase().includes(q) ||
      v.dealerCity?.toLowerCase().includes(q),
    );
  }

  return result;
}

// ============================================================================
// CALL FILTERS
// ============================================================================

/**
 * Filter call attempts by FilterState.
 * Used by Activity page call feed.
 */
export function applyCallFilters(
  calls: CallAttempt[],
  filters: FilterState,
): CallAttempt[] {
  let result = [...calls];

  // Time filter on timestamp
  if (filters.time) {
    result = result.filter(c => isAfterCutoff(c.timestamp, filters.time));
  }

  // Search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(c =>
      c.dealerName?.toLowerCase().includes(q) ||
      c.dealerCode?.toLowerCase().includes(q) ||
      c.dealerCity?.toLowerCase().includes(q),
    );
  }

  return result;
}

// ============================================================================
// ADMIN SCOPE FILTERS (Region + TL for aggregated admin metrics)
// ============================================================================

/**
 * Apply admin scope filters (region, TL) to TL metrics data.
 * Used by AdminHomePage, AdminVCPage, AdminDCFPage.
 */
export function applyAdminScopeFilters<T extends { tlId: string; region?: string }>(
  data: T[],
  filters: FilterState,
): T[] {
  let result = [...data];

  if (filters.region && filters.region.length > 0) {
    result = result.filter(d => d.region && filters.region!.includes(d.region));
  }

  if (filters.tl && filters.tl.length > 0) {
    result = result.filter(d => filters.tl!.includes(d.tlId));
  }

  return result;
}
