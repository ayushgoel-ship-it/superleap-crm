/**
 * INCENTIVE ENGINE VALIDATION SUITE
 * 
 * Run this file to validate that the incentive engine works correctly.
 * This demonstrates all critical business rules are implemented.
 * 
 * Usage in browser console:
 * import { runAllValidations } from '@/lib/incentiveEngine.validation'
 * runAllValidations()
 */

import {
  calculateActualProjectedIncentive,
  simulateIncentiveWhatIf,
  getSITarget,
} from './incentiveEngine';

// ============================================================================
// VALIDATION TEST CASES
// ============================================================================

/**
 * Test 1: SI Below Target → ZERO INCENTIVE
 * CRITICAL BUG FIX
 */
export function test_SIBelowTarget_ReturnsZero() {
  console.log('\n🧪 Test 1: SI Below Target → Zero Incentive');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = calculateActualProjectedIncentive({
    role: 'KAM',
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
  });
  
  console.log('Input: 12 MTD SIs → Projects to', result.projected.siProjected);
  console.log('Target:', 20);
  console.log('Achievement:', result.projected.siAchievementPercent + '%');
  console.log('Total Incentive:', '₹' + result.totalIncentive.toLocaleString('en-IN'));
  
  const passed = result.totalIncentive === 0 && !result.projected.isEligible;
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  console.log('Expected: ₹0 (target not met)');
  console.log('Actual:', '₹' + result.totalIncentive.toLocaleString('en-IN'));
  
  return passed;
}

/**
 * Test 2: SI at 100-109% → ₹1000/SI
 */
export function test_Slab100to109_Returns1000PerSI() {
  console.log('\n🧪 Test 2: Slab 100-109% → ₹1000/SI');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = calculateActualProjectedIncentive({
    role: 'KAM',
    siActualMTD: 14,
    siTarget: 20,
    inspectionsMTD: 90,
    daysElapsed: 19,
    totalDaysInMonth: 30,
    inputScore: 85,
    dcf: {
      onboardingCount: 0,
      gmvTotal: 0,
      gmvFirstDisbursement: 0,
      dealerCount: 0,
    },
  });
  
  console.log('Input: 14 MTD SIs → Projects to', result.projected.siProjected);
  console.log('Target:', 20);
  console.log('Achievement:', result.projected.siAchievementPercent + '%');
  console.log('Slab:', result.breakup.siSlabs[0]?.slabName);
  console.log('Rate per SI:', '₹' + result.breakup.siSlabs[0]?.ratePerSI.toLocaleString('en-IN'));
  console.log('SI Incentive:', '₹' + result.breakup.siIncentive.toLocaleString('en-IN'));
  
  const projectedSI = result.projected.siProjected;
  const expectedIncentive = projectedSI * 1000;
  const passed = result.breakup.siSlabs[0]?.slabName === '100-109%' && 
                 result.breakup.siIncentive === Math.round(expectedIncentive);
  
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  console.log('Expected:', projectedSI + ' SIs × ₹1000 = ₹' + expectedIncentive.toLocaleString('en-IN'));
  console.log('Actual:', '₹' + result.breakup.siIncentive.toLocaleString('en-IN'));
  
  return passed;
}

/**
 * Test 3: SI at 110%+ → ₹1500/SI
 */
export function test_Slab110Plus_Returns1500PerSI() {
  console.log('\n🧪 Test 3: Slab 110%+ → ₹1500/SI');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = calculateActualProjectedIncentive({
    role: 'KAM',
    siActualMTD: 20,
    siTarget: 20,
    inspectionsMTD: 100,
    daysElapsed: 24,
    totalDaysInMonth: 30,
    inputScore: 90,
    dcf: {
      onboardingCount: 0,
      gmvTotal: 0,
      gmvFirstDisbursement: 0,
      dealerCount: 0,
    },
  });
  
  console.log('Input: 20 MTD SIs → Projects to', result.projected.siProjected);
  console.log('Target:', 20);
  console.log('Achievement:', result.projected.siAchievementPercent + '%');
  console.log('Slab:', result.breakup.siSlabs[0]?.slabName);
  console.log('Rate per SI:', '₹' + result.breakup.siSlabs[0]?.ratePerSI.toLocaleString('en-IN'));
  console.log('SI Incentive:', '₹' + result.breakup.siIncentive.toLocaleString('en-IN'));
  
  const projectedSI = result.projected.siProjected;
  const expectedIncentive = projectedSI * 1500;
  const passed = result.breakup.siSlabs[0]?.slabName === '110%+' && 
                 Math.abs(result.breakup.siIncentive - expectedIncentive) < 100; // Allow small rounding difference
  
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  console.log('Expected:', '~' + projectedSI + ' SIs × ₹1500 = ₹' + expectedIncentive.toLocaleString('en-IN'));
  console.log('Actual:', '₹' + result.breakup.siIncentive.toLocaleString('en-IN'));
  
  return passed;
}

/**
 * Test 4: Input Score < 50 → ZERO INCENTIVE
 */
export function test_InputScoreBelow50_BlocksIncentive() {
  console.log('\n🧪 Test 4: Input Score < 50 → Zero Incentive');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = calculateActualProjectedIncentive({
    role: 'KAM',
    siActualMTD: 20,
    siTarget: 20,
    inspectionsMTD: 100,
    daysElapsed: 24,
    totalDaysInMonth: 30,
    inputScore: 45, // Critical: Below 50
    dcf: {
      onboardingCount: 5,
      gmvTotal: 500000,
      gmvFirstDisbursement: 200000,
      dealerCount: 5,
    },
  });
  
  console.log('Input Score:', 45);
  console.log('Total Before Score:', '₹' + result.breakup.totalBeforeScore.toLocaleString('en-IN'));
  console.log('Score Multiplier:', result.breakup.scoreMultiplier);
  console.log('Total After Score:', '₹' + result.totalIncentive.toLocaleString('en-IN'));
  
  const passed = result.totalIncentive === 0 && result.breakup.scoreMultiplier === 0;
  
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  console.log('Expected: ₹0 (score gate blocks all incentive)');
  console.log('Actual:', '₹' + result.totalIncentive.toLocaleString('en-IN'));
  
  return passed;
}

/**
 * Test 5: Input Score < 70 → 50% PENALTY
 */
export function test_InputScoreBelow70_Applies50Percent() {
  console.log('\n🧪 Test 5: Input Score < 70 → 50% Penalty');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = calculateActualProjectedIncentive({
    role: 'KAM',
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
  });
  
  console.log('Input Score:', 65);
  console.log('Total Before Score:', '₹' + result.breakup.totalBeforeScore.toLocaleString('en-IN'));
  console.log('Score Multiplier:', result.breakup.scoreMultiplier);
  console.log('Total After Score:', '₹' + result.totalIncentive.toLocaleString('en-IN'));
  
  const expectedAfterScore = Math.round(result.breakup.totalBeforeScore * 0.5);
  const passed = result.breakup.scoreMultiplier === 0.5 && 
                 result.totalIncentive === expectedAfterScore;
  
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  console.log('Expected:', '₹' + expectedAfterScore.toLocaleString('en-IN') + ' (50% of total)');
  console.log('Actual:', '₹' + result.totalIncentive.toLocaleString('en-IN'));
  
  return passed;
}

/**
 * Test 6: DCF Breakdown (3 Line Items)
 */
export function test_DCFBreakdown_ThreeLineItems() {
  console.log('\n🧪 Test 6: DCF Breakdown → 3 Separate Line Items');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = calculateActualProjectedIncentive({
    role: 'KAM',
    siActualMTD: 20,
    siTarget: 20,
    inspectionsMTD: 100,
    daysElapsed: 30,
    totalDaysInMonth: 30,
    inputScore: 85,
    dcf: {
      onboardingCount: 5,
      gmvTotal: 500000,
      gmvFirstDisbursement: 200000,
      dealerCount: 5,
    },
  });
  
  console.log('DCF Breakdown:');
  console.log('  GMV Total (1%):', '₹' + result.breakup.dcf.gmvTotal.toLocaleString('en-IN'));
  console.log('  GMV First (0.5%):', '₹' + result.breakup.dcf.gmvFirst.toLocaleString('en-IN'));
  console.log('  Onboarding (₹300×5):', '₹' + result.breakup.dcf.onboarding.toLocaleString('en-IN'));
  console.log('  Total DCF:', '₹' + result.breakup.dcf.totalDCF.toLocaleString('en-IN'));
  
  const expectedGMVTotal = Math.round(500000 * 0.01);
  const expectedGMVFirst = Math.round(200000 * 0.005);
  const expectedOnboarding = 5 * 300;
  const expectedTotal = expectedGMVTotal + expectedGMVFirst + expectedOnboarding;
  
  const passed = 
    result.breakup.dcf.gmvTotal === expectedGMVTotal &&
    result.breakup.dcf.gmvFirst === expectedGMVFirst &&
    result.breakup.dcf.onboarding === expectedOnboarding &&
    result.breakup.dcf.totalDCF === expectedTotal;
  
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  console.log('Expected Total:', '₹' + expectedTotal.toLocaleString('en-IN'));
  console.log('Actual Total:', '₹' + result.breakup.dcf.totalDCF.toLocaleString('en-IN'));
  
  return passed;
}

/**
 * Test 7: What-If Simulator (Same Logic)
 */
export function test_WhatIfSimulator_SameLogic() {
  console.log('\n🧪 Test 7: What-If Simulator → Same Logic as Actual');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Simulate with exact target
  const whatIf = simulateIncentiveWhatIf({
    role: 'KAM',
    projectedSI: 20,
    inspections: 100,
    dcf: {
      onboarding: 5,
      gmvTotal: 500000,
      gmvFirst: 200000,
    },
    inputScore: 85,
  });
  
  console.log('Projected SI:', 20);
  console.log('Eligibility:', whatIf.eligibility ? 'Eligible' : 'Not Eligible');
  console.log('Slabs Unlocked:', whatIf.slabsUnlocked.join(', '));
  console.log('Total Incentive:', '₹' + whatIf.totalIncentive.toLocaleString('en-IN'));
  console.log('SI Incentive:', '₹' + whatIf.breakup.siIncentive.toLocaleString('en-IN'));
  console.log('DCF Incentive:', '₹' + whatIf.breakup.dcf.totalDCF.toLocaleString('en-IN'));
  
  const expectedSI = 20 * 1000; // 100% slab
  const passed = whatIf.eligibility && 
                 whatIf.slabsUnlocked.includes('100-109%') &&
                 whatIf.breakup.siIncentive === expectedSI;
  
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  console.log('Expected: Eligible with 100-109% slab');
  console.log('Actual:', whatIf.eligibility ? 'Eligible' : 'Not Eligible', 'with', whatIf.slabsUnlocked.join(', '));
  
  return passed;
}

/**
 * Test 8: Team Lead (Different Targets)
 */
export function test_TeamLead_HigherTargets() {
  console.log('\n🧪 Test 8: Team Lead → Higher Targets');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = calculateActualProjectedIncentive({
    role: 'TL',
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
  });
  
  console.log('Role: TL');
  console.log('Input: 70 MTD SIs → Projects to', result.projected.siProjected);
  console.log('Target:', 100);
  console.log('Achievement:', result.projected.siAchievementPercent + '%');
  console.log('Slab:', result.breakup.siSlabs[0]?.slabName);
  console.log('Total Incentive:', '₹' + result.totalIncentive.toLocaleString('en-IN'));
  
  const passed = result.projected.isEligible && result.projected.siProjected >= 100;
  
  console.log(passed ? '✅ PASS' : '❌ FAIL');
  console.log('Expected: Eligible (projected SI >= 100)');
  console.log('Actual:', result.projected.isEligible ? 'Eligible' : 'Not Eligible');
  
  return passed;
}

// ============================================================================
// RUN ALL VALIDATIONS
// ============================================================================

/**
 * Run all validation tests
 */
export function runAllValidations(): {
  passed: number;
  failed: number;
  total: number;
  allPassed: boolean;
} {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           INCENTIVE ENGINE VALIDATION SUITE              ');
  console.log('═══════════════════════════════════════════════════════════');
  
  const tests = [
    { name: 'SI Below Target', fn: test_SIBelowTarget_ReturnsZero },
    { name: 'Slab 100-109%', fn: test_Slab100to109_Returns1000PerSI },
    { name: 'Slab 110%+', fn: test_Slab110Plus_Returns1500PerSI },
    { name: 'Input Score < 50', fn: test_InputScoreBelow50_BlocksIncentive },
    { name: 'Input Score < 70', fn: test_InputScoreBelow70_Applies50Percent },
    { name: 'DCF Breakdown', fn: test_DCFBreakdown_ThreeLineItems },
    { name: 'What-If Simulator', fn: test_WhatIfSimulator_SameLogic },
    { name: 'Team Lead', fn: test_TeamLead_HigherTargets },
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach((test) => {
    try {
      const result = test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} ERRORED:`, error);
      failed++;
    }
  });
  
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                        SUMMARY                           ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');
  
  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED - Incentive Engine is working correctly!');
  } else {
    console.log(`❌ ${failed} TEST(S) FAILED - Please review the output above`);
  }
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n');
  
  return {
    passed,
    failed,
    total: tests.length,
    allPassed: failed === 0,
  };
}

// Auto-run in development (optional)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Uncomment to auto-run on module load:
  // runAllValidations();
}
