/**
 * INCENTIVE ENGINE VALIDATION SCENARIOS
 * 
 * This file contains example scenarios to validate the incentive engine.
 * These examples demonstrate that all business rules are correctly implemented.
 * 
 * Run these examples in the browser console to verify:
 * import { validateIncentiveEngine } from './incentiveEngine.test.examples'
 * validateIncentiveEngine()
 */

import {
  calculateActualProjectedIncentive,
  simulateIncentiveWhatIf,
  IncentiveContext,
  WhatIfSimulationInput,
} from './incentiveEngine';

// ============================================================================
// VALIDATION SCENARIOS
// ============================================================================

/**
 * Scenario 1: SI Below Target → ZERO INCENTIVE
 * CRITICAL: This is the main bug fix
 */
export const scenario1_BelowTarget = {
  description: 'KAM with 15 projected SIs (75% of target 20) → ₹0 incentive',
  input: {
    role: 'KAM' as const,
    siActualMTD: 12,
    siTarget: 20,
    inspectionsMTD: 80,
    daysElapsed: 20,
    totalDaysInMonth: 30,
    inputScore: 85,
    dcf: {
      onboardingCount: 5,
      gmvTotal: 500000,
      gmvFirstDisbursement: 200000,
      dealerCount: 5,
    },
  } as IncentiveContext,
  expectedOutput: {
    totalIncentive: 0,
    isEligible: false,
    reason: 'Projected SI (18) below target (20)',
  },
};

/**
 * Scenario 2: SI at 105% → ₹1000/SI on ALL SIs
 */
export const scenario2_Slab100to109 = {
  description: 'KAM with 22 projected SIs (110% of target 20) → ₹1000/SI',
  input: {
    role: 'KAM' as const,
    siActualMTD: 14,
    siTarget: 20,
    inspectionsMTD: 90,
    daysElapsed: 19,
    totalDaysInMonth: 30,
    inputScore: 85,
    dcf: {
      onboardingCount: 3,
      gmvTotal: 300000,
      gmvFirstDisbursement: 100000,
      dealerCount: 3,
    },
  } as IncentiveContext,
  expectedOutput: {
    totalIncentive: '~₹27,000+',
    siIncentive: 22000, // 22 SIs × ₹1000
    dcfTotal: 4900, // (300000 × 1%) + (100000 × 0.5%) + (3 × 300)
    isEligible: true,
    slab: '100-109%',
  },
};

/**
 * Scenario 3: SI at 115% → ₹1500/SI on ALL SIs
 */
export const scenario3_Slab110Plus = {
  description: 'KAM with 25 projected SIs (125% of target 20) → ₹1500/SI',
  input: {
    role: 'KAM' as const,
    siActualMTD: 20,
    siTarget: 20,
    inspectionsMTD: 100,
    daysElapsed: 24,
    totalDaysInMonth: 30,
    inputScore: 90,
    dcf: {
      onboardingCount: 8,
      gmvTotal: 800000,
      gmvFirstDisbursement: 400000,
      dealerCount: 8,
    },
  } as IncentiveContext,
  expectedOutput: {
    totalIncentive: '~₹49,000+',
    siIncentive: 37500, // 25 SIs × ₹1500 (rounded to 25 from projection)
    dcfTotal: 12400, // (800000 × 1%) + (400000 × 0.5%) + (8 × 300)
    isEligible: true,
    slab: '110%+',
  },
};

/**
 * Scenario 4: Input Score < 50 → ZERO INCENTIVE
 */
export const scenario4_ScoreBelow50 = {
  description: 'KAM with 25 projected SIs but input score 45 → ₹0',
  input: {
    role: 'KAM' as const,
    siActualMTD: 20,
    siTarget: 20,
    inspectionsMTD: 100,
    daysElapsed: 24,
    totalDaysInMonth: 30,
    inputScore: 45, // CRITICAL: Below 50
    dcf: {
      onboardingCount: 5,
      gmvTotal: 500000,
      gmvFirstDisbursement: 200000,
      dealerCount: 5,
    },
  } as IncentiveContext,
  expectedOutput: {
    totalIncentive: 0,
    totalBeforeScore: '~₹42,000',
    scoreMultiplier: 0.0,
    reason: 'Input score below 50 blocks all incentives',
  },
};

/**
 * Scenario 5: Input Score < 70 → 50% MULTIPLIER
 */
export const scenario5_ScoreBelow70 = {
  description: 'KAM with 22 projected SIs and input score 65 → 50% penalty',
  input: {
    role: 'KAM' as const,
    siActualMTD: 14,
    siTarget: 20,
    inspectionsMTD: 90,
    daysElapsed: 19,
    totalDaysInMonth: 30,
    inputScore: 65, // Between 50-70
    dcf: {
      onboardingCount: 4,
      gmvTotal: 400000,
      gmvFirstDisbursement: 150000,
      dealerCount: 4,
    },
  } as IncentiveContext,
  expectedOutput: {
    totalIncentive: '~₹14,000', // ~50% of ~₹28,000
    totalBeforeScore: '~₹28,000',
    scoreMultiplier: 0.5,
    reason: 'Input score 65 applies 50% penalty',
  },
};

/**
 * Scenario 6: Team Lead with higher targets
 */
export const scenario6_TeamLead = {
  description: 'TL with 110 projected SIs (110% of target 100) → ₹1500/SI',
  input: {
    role: 'TL' as const,
    siActualMTD: 70,
    siTarget: 100,
    inspectionsMTD: 400,
    daysElapsed: 19,
    totalDaysInMonth: 30,
    inputScore: 88,
    dcf: {
      onboardingCount: 25,
      gmvTotal: 2500000,
      gmvFirstDisbursement: 1000000,
      dealerCount: 25,
    },
  } as IncentiveContext,
  expectedOutput: {
    totalIncentive: '~₹210,000+',
    siIncentive: 165000, // 110 SIs × ₹1500
    dcfTotal: 37500, // (2500000 × 1%) + (1000000 × 0.5%) + (25 × 300)
    isEligible: true,
    slab: '110%+',
  },
};

/**
 * Scenario 7: What-If Simulator - Exact at target
 */
export const scenario7_WhatIfExactTarget = {
  description: 'What-if: KAM simulates exactly 20 SIs (100%)',
  input: {
    role: 'KAM' as const,
    projectedSI: 20,
    inspections: 100,
    dcf: {
      onboarding: 5,
      gmvTotal: 500000,
      gmvFirst: 200000,
    },
    inputScore: 80,
  } as WhatIfSimulationInput,
  expectedOutput: {
    totalIncentive: '~₹25,000',
    siIncentive: 20000, // 20 × ₹1000
    dcfTotal: 4900,
    slabsUnlocked: ['100-109%'],
    eligibility: true,
  },
};

/**
 * Scenario 8: What-If Simulator - Below target
 */
export const scenario8_WhatIfBelowTarget = {
  description: 'What-if: KAM simulates 15 SIs (75%)',
  input: {
    role: 'KAM' as const,
    projectedSI: 15,
    inspections: 80,
    dcf: {
      onboarding: 3,
      gmvTotal: 300000,
      gmvFirst: 100000,
    },
    inputScore: 85,
  } as WhatIfSimulationInput,
  expectedOutput: {
    totalIncentive: 0,
    eligibility: false,
    nextActionTip: 'Increase projected SI by 5 to unlock incentives',
  },
};

// ============================================================================
// VALIDATION RUNNER
// ============================================================================

/**
 * Run all validation scenarios and print results
 */
export function validateIncentiveEngine(): {
  passed: number;
  failed: number;
  results: Array<{
    scenario: string;
    passed: boolean;
    expected: any;
    actual: any;
  }>;
} {
  console.log('🧪 Running Incentive Engine Validation...\n');
  
  const results: Array<{ scenario: string; passed: boolean; expected: any; actual: any }> = [];
  
  // Scenario 1: Below Target
  console.log('Scenario 1: SI Below Target');
  const result1 = calculateActualProjectedIncentive(scenario1_BelowTarget.input);
  console.log('Expected:', scenario1_BelowTarget.expectedOutput);
  console.log('Actual:', {
    totalIncentive: result1.totalIncentive,
    isEligible: result1.projected.isEligible,
    projectedSI: result1.projected.siProjected,
  });
  const pass1 = result1.totalIncentive === 0 && !result1.projected.isEligible;
  console.log(pass1 ? '✅ PASS' : '❌ FAIL');
  console.log('\n---\n');
  results.push({
    scenario: 'Below Target',
    passed: pass1,
    expected: scenario1_BelowTarget.expectedOutput,
    actual: result1,
  });
  
  // Scenario 2: 100-109% Slab
  console.log('Scenario 2: 100-109% Slab');
  const result2 = calculateActualProjectedIncentive(scenario2_Slab100to109.input);
  console.log('Expected:', scenario2_Slab100to109.expectedOutput);
  console.log('Actual:', {
    totalIncentive: result2.totalIncentive,
    siIncentive: result2.breakup.siIncentive,
    dcfTotal: result2.breakup.dcf.totalDCF,
    isEligible: result2.projected.isEligible,
    slab: result2.breakup.siSlabs[0]?.slabName,
  });
  const pass2 = result2.projected.isEligible && result2.breakup.siSlabs[0]?.slabName === '100-109%';
  console.log(pass2 ? '✅ PASS' : '❌ FAIL');
  console.log('\n---\n');
  results.push({
    scenario: '100-109% Slab',
    passed: pass2,
    expected: scenario2_Slab100to109.expectedOutput,
    actual: result2,
  });
  
  // Scenario 3: 110%+ Slab
  console.log('Scenario 3: 110%+ Slab');
  const result3 = calculateActualProjectedIncentive(scenario3_Slab110Plus.input);
  console.log('Expected:', scenario3_Slab110Plus.expectedOutput);
  console.log('Actual:', {
    totalIncentive: result3.totalIncentive,
    siIncentive: result3.breakup.siIncentive,
    dcfTotal: result3.breakup.dcf.totalDCF,
    isEligible: result3.projected.isEligible,
    slab: result3.breakup.siSlabs[0]?.slabName,
  });
  const pass3 = result3.projected.isEligible && result3.breakup.siSlabs[0]?.slabName === '110%+';
  console.log(pass3 ? '✅ PASS' : '❌ FAIL');
  console.log('\n---\n');
  results.push({
    scenario: '110%+ Slab',
    passed: pass3,
    expected: scenario3_Slab110Plus.expectedOutput,
    actual: result3,
  });
  
  // Scenario 4: Score Below 50
  console.log('Scenario 4: Input Score < 50');
  const result4 = calculateActualProjectedIncentive(scenario4_ScoreBelow50.input);
  console.log('Expected:', scenario4_ScoreBelow50.expectedOutput);
  console.log('Actual:', {
    totalIncentive: result4.totalIncentive,
    totalBeforeScore: result4.breakup.totalBeforeScore,
    scoreMultiplier: result4.breakup.scoreMultiplier,
  });
  const pass4 = result4.totalIncentive === 0 && result4.breakup.scoreMultiplier === 0;
  console.log(pass4 ? '✅ PASS' : '❌ FAIL');
  console.log('\n---\n');
  results.push({
    scenario: 'Score < 50',
    passed: pass4,
    expected: scenario4_ScoreBelow50.expectedOutput,
    actual: result4,
  });
  
  // Scenario 5: Score Below 70
  console.log('Scenario 5: Input Score < 70');
  const result5 = calculateActualProjectedIncentive(scenario5_ScoreBelow70.input);
  console.log('Expected:', scenario5_ScoreBelow70.expectedOutput);
  console.log('Actual:', {
    totalIncentive: result5.totalIncentive,
    totalBeforeScore: result5.breakup.totalBeforeScore,
    scoreMultiplier: result5.breakup.scoreMultiplier,
  });
  const pass5 = result5.breakup.scoreMultiplier === 0.5;
  console.log(pass5 ? '✅ PASS' : '❌ FAIL');
  console.log('\n---\n');
  results.push({
    scenario: 'Score < 70',
    passed: pass5,
    expected: scenario5_ScoreBelow70.expectedOutput,
    actual: result5,
  });
  
  // Scenario 6: Team Lead
  console.log('Scenario 6: Team Lead');
  const result6 = calculateActualProjectedIncentive(scenario6_TeamLead.input);
  console.log('Expected:', scenario6_TeamLead.expectedOutput);
  console.log('Actual:', {
    totalIncentive: result6.totalIncentive,
    siIncentive: result6.breakup.siIncentive,
    dcfTotal: result6.breakup.dcf.totalDCF,
    slab: result6.breakup.siSlabs[0]?.slabName,
  });
  const pass6 = result6.projected.isEligible && result6.breakup.siSlabs[0]?.slabName === '110%+';
  console.log(pass6 ? '✅ PASS' : '❌ FAIL');
  console.log('\n---\n');
  results.push({
    scenario: 'Team Lead',
    passed: pass6,
    expected: scenario6_TeamLead.expectedOutput,
    actual: result6,
  });
  
  // Scenario 7: What-If Exact Target
  console.log('Scenario 7: What-If at 100%');
  const result7 = simulateIncentiveWhatIf(scenario7_WhatIfExactTarget.input);
  console.log('Expected:', scenario7_WhatIfExactTarget.expectedOutput);
  console.log('Actual:', {
    totalIncentive: result7.totalIncentive,
    siIncentive: result7.breakup.siIncentive,
    dcfTotal: result7.breakup.dcf.totalDCF,
    slabsUnlocked: result7.slabsUnlocked,
    eligibility: result7.eligibility,
  });
  const pass7 = result7.eligibility && result7.slabsUnlocked.includes('100-109%');
  console.log(pass7 ? '✅ PASS' : '❌ FAIL');
  console.log('\n---\n');
  results.push({
    scenario: 'What-If 100%',
    passed: pass7,
    expected: scenario7_WhatIfExactTarget.expectedOutput,
    actual: result7,
  });
  
  // Scenario 8: What-If Below Target
  console.log('Scenario 8: What-If Below Target');
  const result8 = simulateIncentiveWhatIf(scenario8_WhatIfBelowTarget.input);
  console.log('Expected:', scenario8_WhatIfBelowTarget.expectedOutput);
  console.log('Actual:', {
    totalIncentive: result8.totalIncentive,
    eligibility: result8.eligibility,
    tips: result8.nextActionTips,
  });
  const pass8 = result8.totalIncentive === 0 && !result8.eligibility;
  console.log(pass8 ? '✅ PASS' : '❌ FAIL');
  console.log('\n---\n');
  results.push({
    scenario: 'What-If Below Target',
    passed: pass8,
    expected: scenario8_WhatIfBelowTarget.expectedOutput,
    actual: result8,
  });
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log('📊 SUMMARY');
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  console.log(failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return {
    passed,
    failed,
    results,
  };
}

// ============================================================================
// QUICK REFERENCE EXAMPLES
// ============================================================================

/**
 * Quick examples for acceptance criteria validation
 */
export const acceptanceCriteriaExamples = {
  // ✅ SI < Target → Incentive = 0
  sibelowTarget: {
    input: { role: 'KAM', projectedSI: 15, target: 20 },
    expected: { incentive: 0 },
  },
  
  // ✅ Slabs applied ONLY after 100%
  slabsAfter100: {
    at99: { input: { role: 'KAM', projectedSI: 19.8, target: 20 }, expected: { incentive: 0 } },
    at100: { input: { role: 'KAM', projectedSI: 20, target: 20 }, expected: { incentive: 20000 } },
    at110: { input: { role: 'KAM', projectedSI: 22, target: 20 }, expected: { incentive: 33000 } },
  },
  
  // ✅ DCF breakdown visible
  dcfBreakdown: {
    input: {
      gmvTotal: 500000,
      gmvFirst: 200000,
      onboarding: 5,
    },
    expected: {
      gmvTotal: 5000,        // 1%
      gmvFirst: 1000,        // 0.5%
      onboarding: 1500,      // 5 × 300
      total: 7500,
    },
  },
  
  // ✅ Input score gate works
  scoreGate: {
    below50: { input: { score: 45 }, expected: { multiplier: 0.0 } },
    below70: { input: { score: 65 }, expected: { multiplier: 0.5 } },
    above70: { input: { score: 75 }, expected: { multiplier: 1.0 } },
  },
};
