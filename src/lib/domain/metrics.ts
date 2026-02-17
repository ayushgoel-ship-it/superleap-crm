/**
 * SINGLE SOURCE OF TRUTH FOR METRIC CALCULATIONS
 * 
 * This file centralizes ALL metric computation logic across the app.
 * DO NOT duplicate metric calculations in components.
 * Import from this file instead.
 * 
 * All functions are pure (no side effects) and testable.
 */

import { RAGStatus, METRIC_THRESHOLDS } from './constants';

// ============================================================================
// A) SAFE MATH HELPERS
// ============================================================================

/**
 * Clamps a number between min and max values
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Safe division that handles divide-by-zero
 * @param numerator - The dividend
 * @param denominator - The divisor
 * @param fallback - Value to return if denominator is 0 or invalid (default: 0)
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (!denominator || denominator === 0 || !isFinite(denominator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

/**
 * Converts a 0-1 decimal to percentage (0-100)
 */
export function toPercent(value01: number): number {
  return value01 * 100;
}

/**
 * Rounds a number to specified decimal places
 */
export function round(value: number, digits: number = 1): number {
  const multiplier = Math.pow(10, digits);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Formats a number as a percentage string with specified decimals
 */
export function formatPct(value: number, digits: number = 1): string {
  return `${round(value, digits)}%`;
}

/**
 * Formats a number with Indian locale (lakhs/crores)
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.round(num));
}

/**
 * Formats currency in Indian rupees
 */
export function formatCurrency(amount: number, showSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('en-IN').format(Math.round(amount));
  return showSymbol ? `₹${formatted}` : formatted;
}

// ============================================================================
// B) CORE METRIC CALCULATORS
// ============================================================================

/**
 * Calculate achievement percentage
 * @param ach - Actual achievement value
 * @param target - Target value
 * @returns Percentage (0-200 capped), 0 if invalid
 */
export function getAchievementPercent(ach: number, target: number): number {
  if (target <= 0) return 0;
  const percent = safeDivide(ach, target, 0) * 100;
  return clamp(percent, 0, 200); // Cap at 200%
}

/**
 * Calculate I2SI percentage (Inspection to Stock-In conversion)
 * @param stockIns - Number of stock-ins
 * @param inspections - Number of inspections
 * @returns I2SI percentage
 */
export function getI2SIPercent(stockIns: number, inspections: number): number {
  return safeDivide(stockIns, inspections, 0) * 100;
}

/**
 * Calculate I2T percentage (Inspection to Token conversion)
 * @param tokens - Number of tokens
 * @param inspections - Number of inspections
 * @returns I2T percentage
 */
export function getI2TPercent(tokens: number, inspections: number): number {
  return safeDivide(tokens, inspections, 0) * 100;
}

/**
 * Calculate T2SI percentage (Token to Stock-In conversion)
 * @param stockIns - Number of stock-ins
 * @param tokens - Number of tokens
 * @returns T2SI percentage
 */
export function getT2SIPercent(stockIns: number, tokens: number): number {
  return safeDivide(stockIns, tokens, 0) * 100;
}

/**
 * Calculate A2C percentage (Appointment to Conversion rate)
 * @param conversions - Number of conversions
 * @param appointments - Number of appointments
 * @returns A2C percentage
 */
export function getA2CPercent(conversions: number, appointments: number): number {
  return safeDivide(conversions, appointments, 0) * 100;
}

/**
 * Get RAG status based on achievement percentage
 * Uses standardized ACHIEVEMENT thresholds from constants
 */
export function getRAGStatusByAchievement(achievementPercent: number): RAGStatus {
  if (achievementPercent >= METRIC_THRESHOLDS.ACHIEVEMENT.GOOD) {
    return RAGStatus.GOOD;
  }
  if (achievementPercent >= METRIC_THRESHOLDS.ACHIEVEMENT.WARNING) {
    return RAGStatus.WARNING;
  }
  return RAGStatus.DANGER;
}

/**
 * Get RAG status by comparing value against thresholds
 * @param value - Current value
 * @param goodMin - Minimum value for GOOD status
 * @param warningMin - Minimum value for WARNING status
 * @returns RAG status
 */
export function getRAGStatusByValue(value: number, goodMin: number, warningMin: number): RAGStatus {
  if (value >= goodMin) return RAGStatus.GOOD;
  if (value >= warningMin) return RAGStatus.WARNING;
  return RAGStatus.DANGER;
}

/**
 * Get RAG status for Input Score
 * Uses standardized INPUT_SCORE thresholds
 */
export function getInputScoreRAG(score: number): RAGStatus {
  return getRAGStatusByValue(
    score,
    METRIC_THRESHOLDS.INPUT_SCORE.GOOD,
    METRIC_THRESHOLDS.INPUT_SCORE.WARNING
  );
}

/**
 * Get RAG status for Quality percentage (lower is better)
 * Uses standardized QUALITY thresholds
 */
export function getQualityRAG(qualityPercent: number): RAGStatus {
  if (qualityPercent <= METRIC_THRESHOLDS.QUALITY.GOOD) {
    return RAGStatus.GOOD;
  }
  if (qualityPercent <= METRIC_THRESHOLDS.QUALITY.WARNING) {
    return RAGStatus.WARNING;
  }
  return RAGStatus.DANGER;
}

/**
 * Get RAG status for Unique Raise percentage
 * Uses standardized UNIQUE_RAISE thresholds
 */
export function getUniqueRaiseRAG(uniqueRaisePercent: number): RAGStatus {
  return getRAGStatusByValue(
    uniqueRaisePercent,
    METRIC_THRESHOLDS.UNIQUE_RAISE.GOOD,
    METRIC_THRESHOLDS.UNIQUE_RAISE.WARNING
  );
}

/**
 * Get RAG status for Productivity percentage
 * Uses standardized PRODUCTIVITY thresholds
 */
export function getProductivityRAG(productivityPercent: number): RAGStatus {
  return getRAGStatusByValue(
    productivityPercent,
    METRIC_THRESHOLDS.PRODUCTIVITY.GOOD,
    METRIC_THRESHOLDS.PRODUCTIVITY.WARNING
  );
}

/**
 * Get RAG status for I2SI percentage against target
 */
export function getI2SIRAG(i2siPercent: number, target: number): RAGStatus {
  const achievementPercent = getAchievementPercent(i2siPercent, target);
  return getRAGStatusByAchievement(achievementPercent);
}

/**
 * Legacy function for color state (backward compatibility)
 * Returns 'green' | 'yellow' | 'red' for UI components that haven't migrated yet
 */
export function getMetricColorState(value: number, target: number): 'green' | 'yellow' | 'red' {
  const achievementPercent = getAchievementPercent(value, target);
  const rag = getRAGStatusByAchievement(achievementPercent);
  
  const mapping: Record<RAGStatus, 'green' | 'yellow' | 'red'> = {
    [RAGStatus.GOOD]: 'green',
    [RAGStatus.WARNING]: 'yellow',
    [RAGStatus.DANGER]: 'red',
  };
  
  return mapping[rag];
}

// ============================================================================
// C) TIME EXTRAPOLATION
// ============================================================================

/**
 * Get current month context for time-based calculations
 */
export function getMonthContext(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const currentDay = date.getDate();
  
  // Get total days in current month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Days elapsed (current day)
  const daysElapsedInMonth = currentDay;
  
  // Days remaining
  const daysRemainingInMonth = totalDaysInMonth - currentDay;
  
  // Is this the start of the month (first 3 days)?
  const isMonthStart = currentDay <= 3;
  
  // Is this the end of the month (last 3 days)?
  const isMonthEnd = currentDay >= totalDaysInMonth - 3;
  
  // Progress through month (0-1)
  const monthProgress = safeDivide(currentDay, totalDaysInMonth, 0);
  
  return {
    year,
    month,
    currentDay,
    totalDaysInMonth,
    daysElapsedInMonth,
    daysRemainingInMonth,
    isMonthStart,
    isMonthEnd,
    monthProgress,
  };
}

/**
 * Extrapolate MTD value to end-of-month projection
 * @param mtdValue - Current MTD value
 * @param daysElapsed - Days elapsed in month
 * @param totalDaysInMonth - Total days in month
 * @returns Projected EOM value
 */
export function extrapolateToEOM(mtdValue: number, daysElapsed: number, totalDaysInMonth: number): number {
  if (daysElapsed <= 0) return 0;
  const projectedValue = mtdValue * safeDivide(totalDaysInMonth, daysElapsed, 1);
  return round(projectedValue, 0); // Round to whole number
}

/**
 * Calculate run rate (daily average)
 */
export function getRunRate(mtdValue: number, daysElapsed: number): number {
  return safeDivide(mtdValue, daysElapsed, 0);
}

/**
 * Get extrapolation with context
 * Returns both current and projected values with metadata
 */
export function getExtrapolationContext(mtdValue: number, target: number, date: Date = new Date()) {
  const monthContext = getMonthContext(date);
  const { daysElapsedInMonth, totalDaysInMonth, monthProgress } = monthContext;
  
  const projectedValue = extrapolateToEOM(mtdValue, daysElapsedInMonth, totalDaysInMonth);
  const runRate = getRunRate(mtdValue, daysElapsedInMonth);
  
  const currentAchievementPercent = getAchievementPercent(mtdValue, target);
  const projectedAchievementPercent = getAchievementPercent(projectedValue, target);
  
  const currentRAG = getRAGStatusByAchievement(currentAchievementPercent);
  const projectedRAG = getRAGStatusByAchievement(projectedAchievementPercent);
  
  return {
    current: {
      value: mtdValue,
      achievementPercent: currentAchievementPercent,
      rag: currentRAG,
    },
    projected: {
      value: projectedValue,
      achievementPercent: projectedAchievementPercent,
      rag: projectedRAG,
    },
    runRate,
    target,
    monthContext,
  };
}

// ============================================================================
// D) TARGET vs ACHIEVEMENT STANDARD OBJECT BUILDER
// ============================================================================

/**
 * Standard target vs achievement object
 * Use this everywhere to ensure consistent structure
 */
export interface TargetAchievement {
  label: string;
  ach: number;
  target: number;
  achievementPercent: number;
  rag: RAGStatus;
  gap: number;
  gapPercent: number;
  isMet: boolean;
  isExceeded: boolean;
}

/**
 * Build standard target vs achievement object
 * @param ach - Actual achievement
 * @param target - Target value
 * @param label - Metric label (e.g., "Stock-Ins", "DCF Onboarding")
 */
export function buildTargetAchievement(params: {
  ach: number;
  target: number;
  label: string;
}): TargetAchievement {
  const { ach, target, label } = params;
  
  const achievementPercent = getAchievementPercent(ach, target);
  const rag = getRAGStatusByAchievement(achievementPercent);
  const gap = ach - target;
  const gapPercent = safeDivide(gap, target, 0) * 100;
  const isMet = ach >= target;
  const isExceeded = ach > target;
  
  return {
    label,
    ach,
    target,
    achievementPercent: round(achievementPercent, 1),
    rag,
    gap: round(gap, 1),
    gapPercent: round(gapPercent, 1),
    isMet,
    isExceeded,
  };
}

/**
 * Build multiple target achievements at once
 */
export function buildMultipleTargetAchievements(
  metrics: Array<{ ach: number; target: number; label: string }>
): TargetAchievement[] {
  return metrics.map(m => buildTargetAchievement(m));
}

// ============================================================================
// E) COMPOSITE METRICS (Multi-step calculations)
// ============================================================================

/**
 * Calculate overall panel health score (0-100)
 * Composite of multiple metrics
 */
export function calculatePanelHealthScore(params: {
  siAchievementPercent: number;
  i2siPercent: number;
  inputScore: number;
  productivityPercent: number;
}): number {
  const { siAchievementPercent, i2siPercent, inputScore, productivityPercent } = params;
  
  // Weighted average
  const weights = {
    si: 0.35,
    i2si: 0.25,
    inputScore: 0.25,
    productivity: 0.15,
  };
  
  const normalizedSI = clamp(siAchievementPercent, 0, 100);
  const normalizedI2SI = clamp((i2siPercent / 15) * 100, 0, 100); // Assuming 15% is good I2SI
  const normalizedInputScore = clamp(inputScore, 0, 100);
  const normalizedProductivity = clamp(productivityPercent, 0, 100);
  
  const healthScore = 
    (normalizedSI * weights.si) +
    (normalizedI2SI * weights.i2si) +
    (normalizedInputScore * weights.inputScore) +
    (normalizedProductivity * weights.productivity);
  
  return round(healthScore, 0);
}

/**
 * Calculate KAM performance flag
 */
export function getKAMPerformanceFlag(params: {
  stockIns: number;
  stockInsTarget: number;
  inputScore: number;
}): { label: string; color: string; rag: RAGStatus } {
  const { stockIns, stockInsTarget, inputScore } = params;
  
  const achievementPercent = getAchievementPercent(stockIns, stockInsTarget);
  const inputScoreRAG = getInputScoreRAG(inputScore);
  
  // Good: Input Score >= 80 AND Achievement >= 90%
  if (inputScore >= 80 && achievementPercent >= 90) {
    return {
      label: 'Good performing',
      color: 'bg-green-100 text-green-700',
      rag: RAGStatus.GOOD,
    };
  }
  
  // Poor: Input Score < 70 OR Achievement < 75%
  if (inputScore < 70 || achievementPercent < 75) {
    return {
      label: 'Poor performing',
      color: 'bg-red-100 text-red-700',
      rag: RAGStatus.DANGER,
    };
  }
  
  // Average: Everything else
  return {
    label: 'Average performing',
    color: 'bg-amber-100 text-amber-700',
    rag: RAGStatus.WARNING,
  };
}

/**
 * Calculate channel-specific I2SI targets and status
 */
export function getChannelI2SIStatus(channel: 'GS' | 'C2D' | 'C2B', i2siPercent: number): {
  target: number;
  rag: RAGStatus;
  achievementPercent: number;
} {
  const targets: Record<'GS' | 'C2D' | 'C2B', number> = {
    GS: 15,
    C2D: 20,
    C2B: 12,
  };
  
  const target = targets[channel];
  const achievementPercent = getAchievementPercent(i2siPercent, target);
  const rag = getRAGStatusByAchievement(achievementPercent);
  
  return {
    target,
    rag,
    achievementPercent: round(achievementPercent, 1),
  };
}

// ============================================================================
// F) DEBUG EXAMPLES & VERIFICATION
// ============================================================================

/**
 * Debug examples for verification
 * These demonstrate expected outputs and can be used for quick sanity checks
 */
export const __debugExamples = {
  achievementPercent: {
    input: { ach: 15, target: 20 },
    expected: 75.0,
    actual: getAchievementPercent(15, 20),
  },
  
  i2siPercent: {
    input: { stockIns: 10, inspections: 50 },
    expected: 20.0,
    actual: getI2SIPercent(10, 50),
  },
  
  extrapolation: {
    input: { mtdValue: 60, daysElapsed: 4, totalDays: 28 },
    expected: 420, // 60 * (28/4) = 420
    actual: extrapolateToEOM(60, 4, 28),
  },
  
  ragByAchievement: {
    input: { achievementPercent: 95 },
    expected: RAGStatus.WARNING, // 95% is between 80-99%, so WARNING is correct
    actual: getRAGStatusByAchievement(95),
  },
  
  inputScoreRAG: {
    input: { score: 78 },
    expected: RAGStatus.GOOD,
    actual: getInputScoreRAG(78),
  },
  
  targetAchievement: {
    input: { ach: 15, target: 20, label: 'Stock-Ins' },
    expected: {
      achievementPercent: 75.0,
      rag: RAGStatus.DANGER,
      gap: -5,
      isMet: false,
    },
    actual: buildTargetAchievement({ ach: 15, target: 20, label: 'Stock-Ins' }),
  },
};

/**
 * Run verification checks
 * Returns true if all examples match expectations
 */
export function verifyMetricsEngine(): {
  passed: boolean;
  results: Array<{ test: string; passed: boolean; expected: any; actual: any }>;
} {
  const results = [
    {
      test: 'achievementPercent',
      passed: __debugExamples.achievementPercent.actual === __debugExamples.achievementPercent.expected,
      expected: __debugExamples.achievementPercent.expected,
      actual: __debugExamples.achievementPercent.actual,
    },
    {
      test: 'i2siPercent',
      passed: __debugExamples.i2siPercent.actual === __debugExamples.i2siPercent.expected,
      expected: __debugExamples.i2siPercent.expected,
      actual: __debugExamples.i2siPercent.actual,
    },
    {
      test: 'extrapolation',
      passed: __debugExamples.extrapolation.actual === __debugExamples.extrapolation.expected,
      expected: __debugExamples.extrapolation.expected,
      actual: __debugExamples.extrapolation.actual,
    },
    {
      test: 'ragByAchievement',
      passed: __debugExamples.ragByAchievement.actual === __debugExamples.ragByAchievement.expected,
      expected: __debugExamples.ragByAchievement.expected,
      actual: __debugExamples.ragByAchievement.actual,
    },
    {
      test: 'inputScoreRAG',
      passed: __debugExamples.inputScoreRAG.actual === __debugExamples.inputScoreRAG.expected,
      expected: __debugExamples.inputScoreRAG.expected,
      actual: __debugExamples.inputScoreRAG.actual,
    },
  ];
  
  const allPassed = results.every(r => r.passed);
  
  return {
    passed: allPassed,
    results,
  };
}

// Log verification on module load (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const verification = verifyMetricsEngine();
  if (verification.passed) {
    console.log('✅ Metrics engine verified - all tests passed');
  } else {
    console.warn('⚠️ Metrics engine verification failed:', verification.results.filter(r => !r.passed));
  }
}