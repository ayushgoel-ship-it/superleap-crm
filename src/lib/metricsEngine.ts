/**
 * SINGLE METRICS ENGINE - BUSINESS LOGIC LAYER
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all business metric computations.
 * NO UI component should calculate business metrics directly.
 * 
 * Architecture:
 * - This engine uses /lib/domain/metrics.ts for low-level math
 * - This engine handles business rules (SI targets, DCF logic, productivity rules)
 * - UI components consume outputs read-only
 * 
 * RULES:
 * - All functions are pure (no side effects)
 * - All business logic is centralized here
 * - No duplication of formulas
 * - No hard-coded thresholds (use constants.ts)
 */

import {
  getAchievementPercent,
  getI2SIPercent,
  safeDivide,
  round,
  clamp,
  extrapolateToEOM,
  getMonthContext
} from './domain/metrics';
import { ProductivityStatus } from './domain/constants';
import { getConfigSITarget, getConfigDCFGMVTarget, getConfigI2SITarget, getConfigKAMCount } from './configFromDB';

// ============================================================================
// A) SI & TARGET METRICS
// ============================================================================

/**
 * Get SI target based on role
 * SINGLE SOURCE OF TRUTH for SI targets
 * Reads from backend `targets` table via configFromDB, falls back to hardcoded.
 */
export function getSITarget(role: 'KAM' | 'TL'): number {
  return getConfigSITarget(role);
}

/**
 * Calculate SI achievement metrics
 * Returns comprehensive achievement data
 */
export function getSIAchievement(actualSI: number, targetSI: number): {
  achieved: number;
  target: number;
  percent: number;
  percentCapped: number; // Capped at 110% for slab logic
  remaining: number;
  isMet: boolean;
  isExceeded: boolean;
} {
  const percent = getAchievementPercent(actualSI, targetSI);
  const percentCapped = clamp(percent, 0, 110); // Cap at 110% for incentive slabs
  const remaining = Math.max(0, targetSI - actualSI);
  const isMet = actualSI >= targetSI;
  const isExceeded = actualSI > targetSI;
  
  return {
    achieved: actualSI,
    target: targetSI,
    percent: round(percent, 1),
    percentCapped: round(percentCapped, 1),
    remaining: round(remaining, 1),
    isMet,
    isExceeded,
  };
}

/**
 * Get SI achievement for a specific role (convenience function)
 */
export function getSIAchievementForRole(actualSI: number, role: 'KAM' | 'TL'): ReturnType<typeof getSIAchievement> {
  const target = getSITarget(role);
  return getSIAchievement(actualSI, target);
}

// ============================================================================
// B) I2SI LOGIC (CRITICAL - SINGLE SOURCE OF TRUTH)
// ============================================================================

/**
 * Calculate I2SI percentage
 * CRITICAL: This is the ONLY place I2SI should be calculated
 * 
 * @param stockIns - Number of stock-ins
 * @param inspections - Number of inspections
 * @returns I2SI percentage (0-100+)
 */
export function calculateI2SI(stockIns: number, inspections: number): number {
  return getI2SIPercent(stockIns, inspections);
}

/**
 * Calculate I2SI with context (includes target comparison)
 */
export function calculateI2SIWithTarget(stockIns: number, inspections: number, target: number): {
  i2si: number;
  target: number;
  achievement: number;
  gap: number;
  isMet: boolean;
} {
  const i2si = calculateI2SI(stockIns, inspections);
  const achievement = getAchievementPercent(i2si, target);
  const gap = i2si - target;
  const isMet = i2si >= target;
  
  return {
    i2si: round(i2si, 1),
    target,
    achievement: round(achievement, 1),
    gap: round(gap, 1),
    isMet,
  };
}

/**
 * Get channel-specific I2SI targets
 * SINGLE SOURCE OF TRUTH for channel I2SI targets
 */
export function getChannelI2SITarget(channel: 'GS' | 'NGS' | 'DCF' | string): number {
  const targets: Record<string, number> = {
    GS: 15,
    NGS: 12,
    DCF: 20,
  };
  return targets[channel] ?? 15;
}

/**
 * Calculate channel-specific I2SI with target
 */
export function calculateChannelI2SI(
  channel: 'GS' | 'NGS' | 'DCF' | string,
  stockIns: number,
  inspections: number
): {
  channel: string;
  i2si: number;
  target: number;
  achievement: number;
  gap: number;
  isMet: boolean;
} {
  const target = getChannelI2SITarget(channel);
  const result = calculateI2SIWithTarget(stockIns, inspections, target);
  
  return {
    channel,
    ...result,
  };
}

// ============================================================================
// C) DCF METRICS (EXPLICIT BREAKDOWN)
// ============================================================================

/**
 * DCF Metrics input
 */
export interface DCFMetricsInput {
  onboardingCount: number;
  leadCount: number;
  gmvTotal: number;
  gmvFirstDisbursement: number;
  disbursementCount: number;
}

/**
 * DCF Metrics output (with explicit breakdowns)
 */
export interface DCFMetricsOutput {
  // Counts
  onboardingCount: number;
  leadCount: number;
  disbursementCount: number;
  
  // GMV Breakdown
  gmvTotal: number;
  gmvFirstDisbursement: number;
  gmvRepeat: number; // Derived: total - first
  
  // Conversion Rates
  leadToOnboardingPercent: number; // onboarding / leads
  onboardingToDisbursementPercent: number; // disbursement / onboarding
  leadToDisbursementPercent: number; // disbursement / leads (full funnel)
  
  // Targets & Achievement (if provided)
  onboardingTarget?: number;
  onboardingAchievement?: number;
  disbursementTarget?: number;
  disbursementAchievement?: number;
  gmvTarget?: number;
  gmvAchievement?: number;
}

/**
 * Calculate DCF metrics with explicit breakdowns
 * NO PAGE SHOULD DO THIS MATH INLINE
 */
export function getDCFMetrics(
  input: DCFMetricsInput,
  targets?: {
    onboardingTarget?: number;
    disbursementTarget?: number;
    gmvTarget?: number;
  }
): DCFMetricsOutput {
  const {
    onboardingCount,
    leadCount,
    gmvTotal,
    gmvFirstDisbursement,
    disbursementCount,
  } = input;
  
  // Explicit GMV breakdown
  const gmvRepeat = Math.max(0, gmvTotal - gmvFirstDisbursement);
  
  // Conversion rates
  const leadToOnboardingPercent = round(safeDivide(onboardingCount, leadCount, 0) * 100, 1);
  const onboardingToDisbursementPercent = round(safeDivide(disbursementCount, onboardingCount, 0) * 100, 1);
  const leadToDisbursementPercent = round(safeDivide(disbursementCount, leadCount, 0) * 100, 1);
  
  // Base output
  const output: DCFMetricsOutput = {
    onboardingCount,
    leadCount,
    disbursementCount,
    gmvTotal,
    gmvFirstDisbursement,
    gmvRepeat,
    leadToOnboardingPercent,
    onboardingToDisbursementPercent,
    leadToDisbursementPercent,
  };
  
  // Add achievements if targets provided
  if (targets) {
    if (targets.onboardingTarget !== undefined) {
      output.onboardingTarget = targets.onboardingTarget;
      output.onboardingAchievement = round(getAchievementPercent(onboardingCount, targets.onboardingTarget), 1);
    }
    if (targets.disbursementTarget !== undefined) {
      output.disbursementTarget = targets.disbursementTarget;
      output.disbursementAchievement = round(getAchievementPercent(disbursementCount, targets.disbursementTarget), 1);
    }
    if (targets.gmvTarget !== undefined) {
      output.gmvTarget = targets.gmvTarget;
      output.gmvAchievement = round(getAchievementPercent(gmvTotal, targets.gmvTarget), 1);
    }
  }
  
  return output;
}

/**
 * Get DCF targets by role
 * SINGLE SOURCE OF TRUTH for DCF targets
 * GMV target reads from backend via configFromDB.
 *
 * TL targets are DERIVED: KAM target * number of KAMs in the org.
 */
export function getDCFTargets(role: 'KAM' | 'TL'): {
  onboarding: number;
  disbursement: number;
  gmv: number; // in lakhs
} {
  const gmvTarget = getConfigDCFGMVTarget();
  const kamTargets = {
    onboarding: 20,
    disbursement: 15,
    gmv: gmvTarget <= 100 ? gmvTarget * 100 : 1500, // convert lakhs to absolute if small
  };

  if (role === 'KAM') return kamTargets;

  // TL: sum across all KAMs
  const kamCount = getConfigKAMCount();
  return {
    onboarding: kamTargets.onboarding * kamCount,
    disbursement: kamTargets.disbursement * kamCount,
    gmv: kamTargets.gmv * kamCount,
  };
}

// ============================================================================
// D) PRODUCTIVITY LOGIC (HARD RULE)
// ============================================================================

/**
 * Productivity evaluation input
 */
export interface ProductivityEventInput {
  lastInteractionDate: Date;
  delta: {
    leadsAdded: number;
    inspectionsAdded: number;
    stockInsAdded: number;
    dcfLeadsAdded: number;
    dcfDisbursed: number;
  };
}

/**
 * Productivity evaluation output
 */
export interface ProductivityEvaluation {
  status: ProductivityStatus;
  daysSinceLastInteraction: number;
  deltaSummary: string[];
  totalDeltaCount: number;
  isWithinWindow: boolean;
  windowDays: number;
}

/**
 * Evaluate dealer/KAM productivity
 * HARD RULE: Productive = ANY delta > 0 within 7 days
 * 
 * @param event - Productivity event data
 * @param referenceDate - Reference date for calculation (default: now)
 * @param windowDays - Productivity window (default: 7)
 */
export function evaluateProductivity(
  event: ProductivityEventInput,
  referenceDate: Date = new Date(),
  windowDays: number = 7
): ProductivityEvaluation {
  const { lastInteractionDate, delta } = event;
  
  // Calculate days since last interaction
  const timeDiff = referenceDate.getTime() - lastInteractionDate.getTime();
  const daysSinceLastInteraction = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  // Check if within productivity window
  const isWithinWindow = daysSinceLastInteraction <= windowDays;
  
  // Calculate total delta count
  const totalDeltaCount = 
    delta.leadsAdded +
    delta.inspectionsAdded +
    delta.stockInsAdded +
    delta.dcfLeadsAdded +
    delta.dcfDisbursed;
  
  // Build delta summary (non-zero deltas only)
  const deltaSummary: string[] = [];
  if (delta.leadsAdded > 0) deltaSummary.push(`${delta.leadsAdded} leads`);
  if (delta.inspectionsAdded > 0) deltaSummary.push(`${delta.inspectionsAdded} inspections`);
  if (delta.stockInsAdded > 0) deltaSummary.push(`${delta.stockInsAdded} stock-ins`);
  if (delta.dcfLeadsAdded > 0) deltaSummary.push(`${delta.dcfLeadsAdded} DCF leads`);
  if (delta.dcfDisbursed > 0) deltaSummary.push(`${delta.dcfDisbursed} DCF disbursed`);
  
  // Determine status
  let status: ProductivityStatus;
  
  if (totalDeltaCount > 0 && isWithinWindow) {
    // PRODUCTIVE: Any delta > 0 within window
    status = ProductivityStatus.PRODUCTIVE;
  } else if (totalDeltaCount === 0 && isWithinWindow) {
    // PROVISIONAL: Within window but no delta yet
    status = ProductivityStatus.PROVISIONAL;
  } else {
    // NON_PRODUCTIVE: Outside window with no delta, OR outside window
    status = ProductivityStatus.NON_PRODUCTIVE;
  }
  
  return {
    status,
    daysSinceLastInteraction,
    deltaSummary,
    totalDeltaCount,
    isWithinWindow,
    windowDays,
  };
}

/**
 * Evaluate productivity for multiple events (batch)
 */
export function evaluateProductivityBatch(
  events: ProductivityEventInput[],
  referenceDate?: Date,
  windowDays?: number
): ProductivityEvaluation[] {
  return events.map(event => evaluateProductivity(event, referenceDate, windowDays));
}

/**
 * Calculate productivity percentage
 * Used for aggregate metrics (e.g., "70% of dealers are productive")
 */
export function calculateProductivityPercentage(
  productiveCount: number,
  totalCount: number
): {
  percent: number;
  productiveCount: number;
  totalCount: number;
  nonProductiveCount: number;
} {
  const percent = round(safeDivide(productiveCount, totalCount, 0) * 100, 1);
  const nonProductiveCount = totalCount - productiveCount;
  
  return {
    percent,
    productiveCount,
    totalCount,
    nonProductiveCount,
  };
}

// ============================================================================
// E) TIME FILTER NORMALIZATION
// ============================================================================

/**
 * Time filter types (standardized across app)
 */
export type TimeFilter = 'D-1' | 'MTD' | 'LMTD' | 'LAST_7D' | 'LAST_30D' | 'TODAY';

/**
 * Time window definition
 */
export interface TimeWindow {
  filter: TimeFilter;
  startDate: Date;
  endDate: Date;
  label: string;
  daysInPeriod: number;
  isCurrentMonth: boolean;
  isPastPeriod: boolean;
}

/**
 * Resolve time window from filter
 * SINGLE SOURCE OF TRUTH for time window calculations
 * 
 * Used by:
 * - Admin Home
 * - Productivity Dashboard
 * - Incentive Simulator
 * - Region/TL aggregations
 */
export function resolveTimeWindow(filter: TimeFilter, referenceDate: Date = new Date()): TimeWindow {
  const now = referenceDate;
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  
  let startDate: Date;
  let endDate: Date;
  let label: string;
  let isCurrentMonth: boolean;
  let isPastPeriod: boolean;
  
  switch (filter) {
    case 'TODAY':
      startDate = new Date(year, month, day, 0, 0, 0);
      endDate = new Date(year, month, day, 23, 59, 59);
      label = 'Today';
      isCurrentMonth = true;
      isPastPeriod = false;
      break;
      
    case 'D-1':
      // Yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yYear = yesterday.getFullYear();
      const yMonth = yesterday.getMonth();
      const yDay = yesterday.getDate();
      startDate = new Date(yYear, yMonth, yDay, 0, 0, 0);
      endDate = new Date(yYear, yMonth, yDay, 23, 59, 59);
      label = 'Yesterday';
      isCurrentMonth = yMonth === month;
      isPastPeriod = true;
      break;
      
    case 'MTD':
      // Month to date (1st to today)
      startDate = new Date(year, month, 1, 0, 0, 0);
      endDate = new Date(year, month, day, 23, 59, 59);
      label = 'MTD';
      isCurrentMonth = true;
      isPastPeriod = false;
      break;
      
    case 'LMTD':
      // Last month to date (same day range in previous month)
      const lastMonth = month - 1;
      const lastMonthYear = lastMonth < 0 ? year - 1 : year;
      const lastMonthMonth = lastMonth < 0 ? 11 : lastMonth;
      
      // Get last day of previous month
      const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
      const endDay = Math.min(day, lastDayOfPrevMonth);
      
      startDate = new Date(lastMonthYear, lastMonthMonth, 1, 0, 0, 0);
      endDate = new Date(lastMonthYear, lastMonthMonth, endDay, 23, 59, 59);
      label = 'LMTD';
      isCurrentMonth = false;
      isPastPeriod = true;
      break;
      
    case 'LAST_7D':
      // Last 7 days (including today)
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(year, month, day, 23, 59, 59);
      label = 'Last 7 Days';
      isCurrentMonth = false; // Might span months
      isPastPeriod = false;
      break;
      
    case 'LAST_30D':
      // Last 30 days (including today)
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(year, month, day, 23, 59, 59);
      label = 'Last 30 Days';
      isCurrentMonth = false; // Might span months
      isPastPeriod = false;
      break;
      
    default:
      // Default to MTD
      startDate = new Date(year, month, 1, 0, 0, 0);
      endDate = new Date(year, month, day, 23, 59, 59);
      label = 'MTD';
      isCurrentMonth = true;
      isPastPeriod = false;
  }
  
  // Calculate days in period
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysInPeriod = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    filter,
    startDate,
    endDate,
    label,
    daysInPeriod,
    isCurrentMonth,
    isPastPeriod,
  };
}

/**
 * Get multiple time windows (for comparison views)
 */
export function resolveMultipleTimeWindows(filters: TimeFilter[], referenceDate?: Date): TimeWindow[] {
  return filters.map(filter => resolveTimeWindow(filter, referenceDate));
}

/**
 * Check if a date falls within a time window
 */
export function isDateInWindow(date: Date, window: TimeWindow): boolean {
  const timestamp = date.getTime();
  return timestamp >= window.startDate.getTime() && timestamp <= window.endDate.getTime();
}

// ============================================================================
// F) EXTRAPOLATION & PROJECTION (MTD → EOM)
// ============================================================================

/**
 * Project MTD metric to end-of-month
 * Uses getMonthContext and extrapolateToEOM from metrics.ts
 */
export function projectMTDToEOM(mtdValue: number, referenceDate: Date = new Date()): {
  mtdValue: number;
  projectedValue: number;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  runRate: number;
} {
  const monthContext = getMonthContext(referenceDate);
  const { daysElapsedInMonth, totalDaysInMonth, daysRemainingInMonth } = monthContext;
  
  const projectedValue = extrapolateToEOM(mtdValue, daysElapsedInMonth, totalDaysInMonth);
  const runRate = round(safeDivide(mtdValue, daysElapsedInMonth, 0), 1);
  
  return {
    mtdValue,
    projectedValue,
    daysElapsed: daysElapsedInMonth,
    daysTotal: totalDaysInMonth,
    daysRemaining: daysRemainingInMonth,
    runRate,
  };
}

/**
 * Project with target comparison
 */
export function projectMTDWithTarget(
  mtdValue: number,
  target: number,
  referenceDate?: Date
): {
  mtdValue: number;
  projectedValue: number;
  target: number;
  mtdAchievement: number;
  projectedAchievement: number;
  projectedGap: number;
  onTrack: boolean;
  daysElapsed: number;
  daysTotal: number;
  runRate: number;
} {
  const projection = projectMTDToEOM(mtdValue, referenceDate);
  const mtdAchievement = round(getAchievementPercent(mtdValue, target), 1);
  const projectedAchievement = round(getAchievementPercent(projection.projectedValue, target), 1);
  const projectedGap = round(projection.projectedValue - target, 1);
  const onTrack = projectedAchievement >= 100;
  
  return {
    ...projection,
    target,
    mtdAchievement,
    projectedAchievement,
    projectedGap,
    onTrack,
  };
}

// ============================================================================
// G) AGGREGATE METRICS (Team/Region Rollups)
// ============================================================================

/**
 * Aggregate SI metrics across multiple entities
 */
export function aggregateSIMetrics(entities: Array<{ achieved: number; target: number }>): {
  totalAchieved: number;
  totalTarget: number;
  achievementPercent: number;
  count: number;
  averageAchieved: number;
  averageTarget: number;
} {
  const totalAchieved = entities.reduce((sum, e) => sum + e.achieved, 0);
  const totalTarget = entities.reduce((sum, e) => sum + e.target, 0);
  const count = entities.length;
  
  const achievementPercent = round(getAchievementPercent(totalAchieved, totalTarget), 1);
  const averageAchieved = round(safeDivide(totalAchieved, count, 0), 1);
  const averageTarget = round(safeDivide(totalTarget, count, 0), 1);
  
  return {
    totalAchieved,
    totalTarget,
    achievementPercent,
    count,
    averageAchieved,
    averageTarget,
  };
}

/**
 * Aggregate I2SI metrics
 */
export function aggregateI2SIMetrics(entities: Array<{ stockIns: number; inspections: number }>): {
  totalStockIns: number;
  totalInspections: number;
  overallI2SI: number;
  count: number;
} {
  const totalStockIns = entities.reduce((sum, e) => sum + e.stockIns, 0);
  const totalInspections = entities.reduce((sum, e) => sum + e.inspections, 0);
  const count = entities.length;
  
  const overallI2SI = round(calculateI2SI(totalStockIns, totalInspections), 1);
  
  return {
    totalStockIns,
    totalInspections,
    overallI2SI,
    count,
  };
}

/**
 * Aggregate DCF metrics
 */
export function aggregateDCFMetrics(entities: Array<DCFMetricsInput>): DCFMetricsOutput {
  const totals = entities.reduce(
    (acc, e) => ({
      onboardingCount: acc.onboardingCount + e.onboardingCount,
      leadCount: acc.leadCount + e.leadCount,
      disbursementCount: acc.disbursementCount + e.disbursementCount,
      gmvTotal: acc.gmvTotal + e.gmvTotal,
      gmvFirstDisbursement: acc.gmvFirstDisbursement + e.gmvFirstDisbursement,
    }),
    {
      onboardingCount: 0,
      leadCount: 0,
      disbursementCount: 0,
      gmvTotal: 0,
      gmvFirstDisbursement: 0,
    }
  );
  
  return getDCFMetrics(totals);
}

// ============================================================================
// H) EXPORT ALL
// ============================================================================

export const MetricsEngine = {
  // SI & Targets
  getSITarget,
  getSIAchievement,
  getSIAchievementForRole,
  
  // I2SI
  calculateI2SI,
  calculateI2SIWithTarget,
  getChannelI2SITarget,
  calculateChannelI2SI,
  
  // DCF
  getDCFMetrics,
  getDCFTargets,
  
  // Productivity
  evaluateProductivity,
  evaluateProductivityBatch,
  calculateProductivityPercentage,
  
  // Time
  resolveTimeWindow,
  resolveMultipleTimeWindows,
  isDateInWindow,
  
  // Projection
  projectMTDToEOM,
  projectMTDWithTarget,
  
  // Aggregation
  aggregateSIMetrics,
  aggregateI2SIMetrics,
  aggregateDCFMetrics,
};

export default MetricsEngine;
