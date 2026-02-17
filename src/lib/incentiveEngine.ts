/**
 * SINGLE INCENTIVE ENGINE - BUSINESS LOGIC LAYER
 * 
 * This is the ONLY place where incentive calculations should happen.
 * NO UI component should calculate incentives directly.
 * 
 * Architecture:
 * - Uses /lib/metricsEngine.ts for SI targets, projections, DCF metrics
 * - Uses /lib/domain/metrics.ts for low-level math
 * - Handles both Actual Projection and What-If Simulation
 * 
 * CRITICAL RULES:
 * - SI below target = ZERO INCENTIVE (no partial payouts)
 * - Slab logic: <100% = ₹0, 100-109% = ₹1000/SI, ≥110% = ₹1500/SI
 * - DCF split into 3 line items: GMV Total (1%), GMV First (0.5%), Onboarding (₹300)
 * - Input score gates: <50 = 0, <70 = 50% multiplier
 * - All functions are pure (no side effects)
 */

import {
  getSITarget,
  projectMTDToEOM,
  getDCFTargets,
} from './metricsEngine';
import { round, safeDivide, getAchievementPercent } from './domain/metrics';

// ============================================================================
// A) TYPE DEFINITIONS
// ============================================================================

/**
 * DCF metrics for incentive calculations
 */
export interface DCFIncentiveMetrics {
  onboardingCount: number;  // Number of dealers onboarded
  gmvTotal: number;         // Total GMV (all disbursements)
  gmvFirstDisbursement: number; // GMV from first disbursement only
  dealerCount: number;      // Alias for onboardingCount (backward compat)
}

/**
 * Common context for incentive calculations
 */
export interface IncentiveContext {
  role: 'KAM' | 'TL';
  siActualMTD: number;        // Current MTD stock-ins
  siTarget: number;           // SI target for role
  inspectionsMTD: number;     // Current MTD inspections
  daysElapsed: number;        // Days elapsed in month
  totalDaysInMonth: number;   // Total days in current month
  inputScore: number;         // Input quality score (0-100)
  dcf: DCFIncentiveMetrics;
}

/**
 * SI slab breakdown
 */
export interface SISlabBreakdown {
  slabName: string;           // e.g., "100-109%", "110%+"
  siCount: number;            // Number of SIs in this slab
  ratePerSI: number;          // Rate per SI (₹1000 or ₹1500)
  slabIncentive: number;      // Total incentive from this slab
}

/**
 * DCF incentive breakdown (explicit line items)
 */
export interface DCFIncentiveBreakdown {
  gmvTotal: number;           // 1% of total GMV
  gmvFirst: number;           // 0.5% of first disbursement GMV
  onboarding: number;         // ₹300 per dealer onboarded
  totalDCF: number;           // Sum of all DCF incentives
}

/**
 * Incentive breakup with all components
 */
export interface IncentiveBreakup {
  siIncentive: number;        // Total SI-based incentive
  siSlabs: SISlabBreakdown[]; // Detailed slab breakdown
  dcf: DCFIncentiveBreakdown; // DCF breakdown
  scoreMultiplier: number;    // 1.0, 0.5, or 0.0
  totalBeforeScore: number;   // Total before score adjustment
  totalAfterScore: number;    // Final incentive after score gate
}

/**
 * Projection metadata
 */
export interface ProjectionMetadata {
  siProjected: number;        // Projected end-of-month SI
  siAchievementPercent: number; // Achievement % of target
  daysElapsed: number;
  daysTotal: number;
  runRate: number;            // Daily SI run rate
  isEligible: boolean;        // Whether projected SI meets target
}

/**
 * Actionable insights for KAM/TL
 */
export interface IncentiveInsight {
  type: 'success' | 'warning' | 'info' | 'milestone';
  message: string;
  priority: number; // 1 = highest
}

/**
 * Result from actual projected incentive calculation
 */
export interface ActualProjectedIncentiveResult {
  projected: ProjectionMetadata;
  breakup: IncentiveBreakup;
  totalIncentive: number;
  insights: IncentiveInsight[];
}

/**
 * Input for what-if simulation
 */
export interface WhatIfSimulationInput {
  role: 'KAM' | 'TL';
  projectedSI: number;        // Manual input for projected SI
  inspections: number;        // Manual input for inspections
  dcf: {
    onboarding: number;
    gmvTotal: number;
    gmvFirst: number;
  };
  inputScore: number;
}

/**
 * Result from what-if simulation
 */
export interface WhatIfSimulationResult {
  eligibility: boolean;       // Whether SI target is met
  slabsUnlocked: string[];    // List of unlocked slabs
  breakup: IncentiveBreakup;
  totalIncentive: number;
  nextActionTips: IncentiveInsight[];
  milestones: {
    at50Percent: {
      siNeeded: number;
      incentiveIfAchieved: number;
    };
    at100Percent: {
      siNeeded: number;
      incentiveIfAchieved: number;
    };
    at110Percent: {
      siNeeded: number;
      incentiveIfAchieved: number;
    };
  };
}

// ============================================================================
// B) CORE INCENTIVE LOGIC (INTERNAL HELPERS)
// ============================================================================

/**
 * Apply SI slab logic with STRICT eligibility gate
 * 
 * CRITICAL RULES:
 * - If projectedSI < target: ZERO INCENTIVE
 * - 100-109%: ₹1000 per SI (on ALL SIs, not just excess)
 * - ≥110%: ₹1500 per SI (on ALL SIs, not just excess)
 */
function applySISlabLogic(projectedSI: number, target: number): {
  totalIncentive: number;
  slabs: SISlabBreakdown[];
  isEligible: boolean;
} {
  // CRITICAL GATE: Must meet target
  if (projectedSI < target) {
    return {
      totalIncentive: 0,
      slabs: [],
      isEligible: false,
    };
  }

  const achievementPercent = getAchievementPercent(projectedSI, target);
  
  // Determine slab
  let slabName: string;
  let ratePerSI: number;
  
  if (achievementPercent >= 110) {
    // 110%+ slab: ₹1500 per SI on ALL SIs
    slabName = '110%+';
    ratePerSI = 1500;
  } else {
    // 100-109% slab: ₹1000 per SI on ALL SIs
    slabName = '100-109%';
    ratePerSI = 1000;
  }
  
  const totalIncentive = projectedSI * ratePerSI;
  
  const slabs: SISlabBreakdown[] = [
    {
      slabName,
      siCount: projectedSI,
      ratePerSI,
      slabIncentive: totalIncentive,
    },
  ];
  
  return {
    totalIncentive: round(totalIncentive, 0),
    slabs,
    isEligible: true,
  };
}

/**
 * Calculate DCF incentives with explicit breakdown
 * 
 * RULES:
 * - GMV Total: 1% of total GMV
 * - GMV First: 0.5% of first disbursement GMV
 * - Onboarding: ₹300 per dealer onboarded
 */
function calculateDCFIncentives(dcf: DCFIncentiveMetrics): DCFIncentiveBreakdown {
  const gmvTotal = round(dcf.gmvTotal * 0.01, 0);        // 1%
  const gmvFirst = round(dcf.gmvFirstDisbursement * 0.005, 0); // 0.5%
  const onboarding = dcf.onboardingCount * 300;          // ₹300 per dealer
  const totalDCF = gmvTotal + gmvFirst + onboarding;
  
  return {
    gmvTotal,
    gmvFirst,
    onboarding,
    totalDCF: round(totalDCF, 0),
  };
}

/**
 * Apply input score gate
 * 
 * RULES:
 * - Score < 50: ZERO INCENTIVE (block completely)
 * - Score < 70: 50% of incentive
 * - Score >= 70: 100% of incentive
 */
function applyInputScoreGate(totalIncentive: number, inputScore: number): {
  multiplier: number;
  finalIncentive: number;
} {
  let multiplier: number;
  
  if (inputScore < 50) {
    multiplier = 0.0;
  } else if (inputScore < 70) {
    multiplier = 0.5;
  } else {
    multiplier = 1.0;
  }
  
  const finalIncentive = round(totalIncentive * multiplier, 0);
  
  return {
    multiplier,
    finalIncentive,
  };
}

/**
 * Generate actionable insights based on current state
 */
function generateInsights(
  projected: ProjectionMetadata,
  breakup: IncentiveBreakup,
  totalIncentive: number,
  inputScore: number,
  target: number
): IncentiveInsight[] {
  const insights: IncentiveInsight[] = [];
  
  // 1. Eligibility status
  if (!projected.isEligible) {
    const gap = target - projected.siProjected;
    insights.push({
      type: 'warning',
      message: `You need ${round(gap, 0)} more SIs to unlock incentives (currently at ${round(projected.siAchievementPercent, 1)}% of target)`,
      priority: 1,
    });
  } else {
    insights.push({
      type: 'success',
      message: `Target achieved! Currently projected at ${round(projected.siAchievementPercent, 1)}%`,
      priority: 2,
    });
  }
  
  // 2. Slab progression
  if (projected.isEligible && projected.siAchievementPercent < 110) {
    const siNeededFor110 = Math.ceil(target * 1.1) - projected.siProjected;
    if (siNeededFor110 > 0) {
      const additionalIncentive = siNeededFor110 * 1500 + (projected.siProjected * 500); // Upgrade from ₹1000 to ₹1500
      insights.push({
        type: 'info',
        message: `Achieve ${siNeededFor110} more SIs to unlock 110% slab and earn ₹${round(additionalIncentive, 0)} more`,
        priority: 3,
      });
    }
  }
  
  // 3. Input score impact
  if (inputScore < 50) {
    insights.push({
      type: 'warning',
      message: `Input score below 50 blocks ALL incentives. Current: ${inputScore}. Improve quality to unlock ₹${round(breakup.totalBeforeScore, 0)}`,
      priority: 1,
    });
  } else if (inputScore < 70) {
    const blocked = breakup.totalBeforeScore - breakup.totalAfterScore;
    insights.push({
      type: 'warning',
      message: `Input score below 70 reduces incentive by 50%. Improve from ${inputScore} to 70+ to unlock ₹${round(blocked, 0)} more`,
      priority: 2,
    });
  } else if (inputScore >= 75) {
    insights.push({
      type: 'success',
      message: `Excellent input score (${inputScore})! No penalties applied.`,
      priority: 4,
    });
  }
  
  // 4. DCF contribution
  if (breakup.dcf.totalDCF > 0) {
    const dcfPercent = round((breakup.dcf.totalDCF / breakup.totalBeforeScore) * 100, 1);
    insights.push({
      type: 'info',
      message: `DCF contributing ₹${round(breakup.dcf.totalDCF, 0)} (${dcfPercent}% of total)`,
      priority: 5,
    });
  }
  
  // 5. Milestone: 50% of target
  if (projected.siAchievementPercent >= 50 && projected.siAchievementPercent < 100) {
    insights.push({
      type: 'milestone',
      message: `Halfway there! You've achieved 50% of your target. Keep pushing to unlock incentives.`,
      priority: 3,
    });
  }
  
  return insights.sort((a, b) => a.priority - b.priority);
}

/**
 * Calculate milestones for what-if simulator
 */
function calculateMilestones(
  target: number,
  dcf: DCFIncentiveMetrics,
  inputScore: number
): WhatIfSimulationResult['milestones'] {
  const dcfBreakdown = calculateDCFIncentives(dcf);
  
  // 50% milestone (no incentive yet, but informational)
  const siAt50 = Math.ceil(target * 0.5);
  
  // 100% milestone (₹1000/SI slab)
  const siAt100 = target;
  const incentiveAt100Base = siAt100 * 1000 + dcfBreakdown.totalDCF;
  const { finalIncentive: incentiveAt100 } = applyInputScoreGate(incentiveAt100Base, inputScore);
  
  // 110% milestone (₹1500/SI slab)
  const siAt110 = Math.ceil(target * 1.1);
  const incentiveAt110Base = siAt110 * 1500 + dcfBreakdown.totalDCF;
  const { finalIncentive: incentiveAt110 } = applyInputScoreGate(incentiveAt110Base, inputScore);
  
  return {
    at50Percent: {
      siNeeded: siAt50,
      incentiveIfAchieved: 0, // No incentive below 100%
    },
    at100Percent: {
      siNeeded: siAt100,
      incentiveIfAchieved: round(incentiveAt100, 0),
    },
    at110Percent: {
      siNeeded: siAt110,
      incentiveIfAchieved: round(incentiveAt110, 0),
    },
  };
}

// ============================================================================
// C) ACTUAL PROJECTED INCENTIVE (READ-ONLY MODE)
// ============================================================================

/**
 * Calculate actual projected incentive based on MTD performance
 * 
 * This function is READ-ONLY and auto-extrapolates from current MTD data.
 * It should be used for displaying current projected incentive to KAMs/TLs.
 * 
 * @param ctx - Current MTD context
 * @returns Projected incentive with full breakdown
 */
export function calculateActualProjectedIncentive(
  ctx: IncentiveContext
): ActualProjectedIncentiveResult {
  const {
    role,
    siActualMTD,
    siTarget,
    daysElapsed,
    totalDaysInMonth,
    inputScore,
    dcf,
  } = ctx;
  
  // 1. Project MTD SI to end of month
  const projection = projectMTDToEOM(siActualMTD, new Date());
  const projectedSI = projection.projectedValue;
  const achievementPercent = getAchievementPercent(projectedSI, siTarget);
  
  // 2. Apply SI slab logic (with eligibility gate)
  const siResult = applySISlabLogic(projectedSI, siTarget);
  
  // 3. Calculate DCF incentives
  const dcfBreakdown = calculateDCFIncentives(dcf);
  
  // 4. Calculate total before score
  const totalBeforeScore = siResult.totalIncentive + dcfBreakdown.totalDCF;
  
  // 5. Apply input score gate
  const scoreResult = applyInputScoreGate(totalBeforeScore, inputScore);
  
  // 6. Build projection metadata
  const projectionMetadata: ProjectionMetadata = {
    siProjected: round(projectedSI, 0),
    siAchievementPercent: round(achievementPercent, 1),
    daysElapsed,
    daysTotal: totalDaysInMonth,
    runRate: projection.runRate,
    isEligible: siResult.isEligible,
  };
  
  // 7. Build incentive breakup
  const breakup: IncentiveBreakup = {
    siIncentive: siResult.totalIncentive,
    siSlabs: siResult.slabs,
    dcf: dcfBreakdown,
    scoreMultiplier: scoreResult.multiplier,
    totalBeforeScore: round(totalBeforeScore, 0),
    totalAfterScore: scoreResult.finalIncentive,
  };
  
  // 8. Generate insights
  const insights = generateInsights(
    projectionMetadata,
    breakup,
    scoreResult.finalIncentive,
    inputScore,
    siTarget
  );
  
  return {
    projected: projectionMetadata,
    breakup,
    totalIncentive: scoreResult.finalIncentive,
    insights,
  };
}

// ============================================================================
// D) WHAT-IF SIMULATOR (INPUT-DRIVEN MODE)
// ============================================================================

/**
 * Simulate incentive based on what-if inputs
 * 
 * This function allows KAMs/TLs to experiment with different scenarios.
 * It uses the SAME logic as actual projection but with manual inputs.
 * 
 * @param input - What-if scenario inputs
 * @returns Simulated incentive with tips
 */
export function simulateIncentiveWhatIf(
  input: WhatIfSimulationInput
): WhatIfSimulationResult {
  const { role, projectedSI, inspections, dcf, inputScore } = input;
  
  // 1. Get target for role
  const target = getSITarget(role);
  
  // 2. Apply SI slab logic
  const siResult = applySISlabLogic(projectedSI, target);
  
  // 3. Calculate DCF incentives
  const dcfBreakdown = calculateDCFIncentives({
    onboardingCount: dcf.onboarding,
    gmvTotal: dcf.gmvTotal,
    gmvFirstDisbursement: dcf.gmvFirst,
    dealerCount: dcf.onboarding,
  });
  
  // 4. Calculate total before score
  const totalBeforeScore = siResult.totalIncentive + dcfBreakdown.totalDCF;
  
  // 5. Apply input score gate
  const scoreResult = applyInputScoreGate(totalBeforeScore, inputScore);
  
  // 6. Build breakup
  const breakup: IncentiveBreakup = {
    siIncentive: siResult.totalIncentive,
    siSlabs: siResult.slabs,
    dcf: dcfBreakdown,
    scoreMultiplier: scoreResult.multiplier,
    totalBeforeScore: round(totalBeforeScore, 0),
    totalAfterScore: scoreResult.finalIncentive,
  };
  
  // 7. Extract unlocked slabs
  const slabsUnlocked = siResult.slabs.map(s => s.slabName);
  
  // 8. Generate next action tips
  const achievementPercent = getAchievementPercent(projectedSI, target);
  const nextActionTips: IncentiveInsight[] = [];
  
  if (!siResult.isEligible) {
    const gap = target - projectedSI;
    nextActionTips.push({
      type: 'warning',
      message: `Increase projected SI by ${round(gap, 0)} to unlock incentives`,
      priority: 1,
    });
  } else if (achievementPercent < 110) {
    const siFor110 = Math.ceil(target * 1.1);
    const gap = siFor110 - projectedSI;
    const upgrade = gap * 1500 + (projectedSI * 500);
    nextActionTips.push({
      type: 'info',
      message: `Add ${gap} more SIs to hit 110% slab and earn ₹${round(upgrade, 0)} more`,
      priority: 1,
    });
  }
  
  if (inputScore < 70) {
    const potentialGain = totalBeforeScore - scoreResult.finalIncentive;
    nextActionTips.push({
      type: 'warning',
      message: `Improve input score to ${inputScore < 50 ? '50+' : '70+'} to unlock ₹${round(potentialGain, 0)}`,
      priority: 1,
    });
  }
  
  if (dcfBreakdown.totalDCF === 0) {
    nextActionTips.push({
      type: 'info',
      message: 'Focus on DCF onboarding and GMV to boost total incentive',
      priority: 2,
    });
  }
  
  // 9. Calculate milestones
  const milestones = calculateMilestones(target, {
    onboardingCount: dcf.onboarding,
    gmvTotal: dcf.gmvTotal,
    gmvFirstDisbursement: dcf.gmvFirst,
    dealerCount: dcf.onboarding,
  }, inputScore);
  
  return {
    eligibility: siResult.isEligible,
    slabsUnlocked,
    breakup,
    totalIncentive: scoreResult.finalIncentive,
    nextActionTips: nextActionTips.sort((a, b) => a.priority - b.priority),
    milestones,
  };
}

// ============================================================================
// E) CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get incentive summary for a role (quick overview)
 */
export function getIncentiveSummary(role: 'KAM' | 'TL'): {
  role: 'KAM' | 'TL';
  siTarget: number;
  slabs: Array<{ range: string; rate: number }>;
  dcfRates: {
    gmvTotal: string;
    gmvFirst: string;
    onboarding: number;
  };
  scoreGates: {
    below50: string;
    below70: string;
    above70: string;
  };
} {
  const target = getSITarget(role);
  
  return {
    role,
    siTarget: target,
    slabs: [
      { range: 'Below 100%', rate: 0 },
      { range: '100-109%', rate: 1000 },
      { range: '110%+', rate: 1500 },
    ],
    dcfRates: {
      gmvTotal: '1%',
      gmvFirst: '0.5%',
      onboarding: 300,
    },
    scoreGates: {
      below50: 'No incentive',
      below70: '50% of incentive',
      above70: 'Full incentive',
    },
  };
}

/**
 * Calculate I2SI from projected values (helper for what-if)
 */
export function calculateI2SIFromProjected(
  projectedSI: number,
  inspections: number
): number {
  return round(safeDivide(projectedSI, inspections, 0) * 100, 1);
}

/**
 * Calculate inspections needed for target I2SI
 */
export function calculateInspectionsForI2SI(
  projectedSI: number,
  targetI2SI: number
): number {
  // I2SI = (SI / Inspections) * 100
  // Inspections = (SI / I2SI) * 100
  const inspections = safeDivide(projectedSI, targetI2SI, 0) * 100;
  return Math.ceil(inspections);
}

// ============================================================================
// F) EXPORT NAMESPACE (OPTIONAL)
// ============================================================================

export const IncentiveEngine = {
  // Main functions
  calculateActualProjectedIncentive,
  simulateIncentiveWhatIf,
  
  // Helpers
  getIncentiveSummary,
  calculateI2SIFromProjected,
  calculateInspectionsForI2SI,
};

export default IncentiveEngine;
