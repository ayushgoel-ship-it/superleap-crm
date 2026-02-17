# Incentive Engine Quick Reference

## 🎯 Import and Use

```typescript
import {
  calculateActualProjectedIncentive,
  simulateIncentiveWhatIf,
  getIncentiveSummary,
  IncentiveContext,
  WhatIfSimulationInput
} from '@/lib/incentiveEngine';
```

---

## 📋 Quick Examples

### Example 1: Calculate Actual Projected Incentive

```typescript
// For a KAM on day 20 of month
const result = calculateActualProjectedIncentive({
  role: 'KAM',
  siActualMTD: 14,          // 14 SIs so far
  siTarget: 20,             // Target is 20
  inspectionsMTD: 90,
  daysElapsed: 20,
  totalDaysInMonth: 30,
  inputScore: 85,
  dcf: {
    onboardingCount: 5,
    gmvTotal: 500000,
    gmvFirstDisbursement: 200000,
    dealerCount: 5
  }
});

// Result structure:
console.log(result.projected.siProjected);        // 21 (extrapolated)
console.log(result.projected.siAchievementPercent); // 105%
console.log(result.totalIncentive);               // ₹26,900
console.log(result.breakup.siIncentive);          // ₹21,000 (21 × ₹1000)
console.log(result.breakup.dcf.totalDCF);         // ₹6,500
console.log(result.insights);                     // Array of tips
```

---

### Example 2: What-If Simulation

```typescript
// Simulate: "What if I achieve 25 SIs this month?"
const whatIf = simulateIncentiveWhatIf({
  role: 'KAM',
  projectedSI: 25,          // Manual input
  inspections: 120,
  dcf: {
    onboarding: 8,
    gmvTotal: 800000,
    gmvFirst: 300000
  },
  inputScore: 90
});

// Result structure:
console.log(whatIf.eligibility);                  // true
console.log(whatIf.totalIncentive);               // ₹50,900
console.log(whatIf.slabsUnlocked);                // ['110%+']
console.log(whatIf.breakup.siIncentive);          // ₹37,500 (25 × ₹1500)
console.log(whatIf.milestones.at110Percent);      // { siNeeded: 22, incentive: ... }
console.log(whatIf.nextActionTips);               // Array of suggestions
```

---

### Example 3: Get Incentive Structure Summary

```typescript
const summary = getIncentiveSummary('KAM');

console.log(summary);
// Output:
{
  role: 'KAM',
  siTarget: 20,
  slabs: [
    { range: 'Below 100%', rate: 0 },
    { range: '100-109%', rate: 1000 },
    { range: '110%+', rate: 1500 }
  ],
  dcfRates: {
    gmvTotal: '1%',
    gmvFirst: '0.5%',
    onboarding: 300
  },
  scoreGates: {
    below50: 'No incentive',
    below70: '50% of incentive',
    above70: 'Full incentive'
  }
}
```

---

## 🧮 Business Rules

### SI Eligibility Gate
```typescript
if (projectedSI < target) {
  return ₹0;  // STRICT - no partial payout
}
```

### Slab Rates (Applied to ALL SIs)
```typescript
if (achievementPercent >= 110) {
  return projectedSI × ₹1500;
} else if (achievementPercent >= 100) {
  return projectedSI × ₹1000;
} else {
  return ₹0;
}
```

### DCF Calculations
```typescript
dcfIncentive = {
  gmvTotal: gmvTotal × 0.01,              // 1%
  gmvFirst: gmvFirstDisbursement × 0.005, // 0.5%
  onboarding: onboardingCount × 300       // ₹300 each
}
```

### Input Score Gates
```typescript
if (inputScore < 50) {
  finalIncentive = 0;           // Blocked completely
} else if (inputScore < 70) {
  finalIncentive = total × 0.5; // 50% penalty
} else {
  finalIncentive = total × 1.0; // Full incentive
}
```

---

## 🎨 Output Types Reference

### ActualProjectedIncentiveResult
```typescript
{
  projected: {
    siProjected: number,              // Extrapolated SI
    siAchievementPercent: number,     // % of target
    daysElapsed: number,
    daysTotal: number,
    runRate: number,                  // Daily avg
    isEligible: boolean               // Target met?
  },
  breakup: {
    siIncentive: number,              // SI-based total
    siSlabs: [                        // Detailed slabs
      {
        slabName: '110%+',
        siCount: 25,
        ratePerSI: 1500,
        slabIncentive: 37500
      }
    ],
    dcf: {
      gmvTotal: number,               // 1% line item
      gmvFirst: number,               // 0.5% line item
      onboarding: number,             // ₹300 line item
      totalDCF: number                // Sum
    },
    scoreMultiplier: number,          // 0.0, 0.5, or 1.0
    totalBeforeScore: number,
    totalAfterScore: number
  },
  totalIncentive: number,             // Final amount
  insights: [                         // Actionable tips
    {
      type: 'warning',
      message: 'You need 5 more SIs...',
      priority: 1
    }
  ]
}
```

### WhatIfSimulationResult
```typescript
{
  eligibility: boolean,               // Target met?
  slabsUnlocked: ['100-109%'],        // Unlocked slabs
  breakup: { ... },                   // Same as above
  totalIncentive: number,
  nextActionTips: [ ... ],            // Suggestions
  milestones: {
    at50Percent: {
      siNeeded: 10,
      incentiveIfAchieved: 0
    },
    at100Percent: {
      siNeeded: 20,
      incentiveIfAchieved: 25000
    },
    at110Percent: {
      siNeeded: 22,
      incentiveIfAchieved: 38000
    }
  }
}
```

---

## ✅ Common Patterns

### Pattern 1: Display Current Projected Incentive
```typescript
const result = calculateActualProjectedIncentive({
  role: currentUser.role,
  siActualMTD: mtdData.stockIns,
  siTarget: getSITarget(currentUser.role),
  inspectionsMTD: mtdData.inspections,
  daysElapsed: getCurrentDay(),
  totalDaysInMonth: getDaysInMonth(),
  inputScore: mtdData.inputScore,
  dcf: mtdData.dcfMetrics
});

// Show total
<div>Projected Incentive: ₹{result.totalIncentive.toLocaleString('en-IN')}</div>

// Show breakup
<div>SI: ₹{result.breakup.siIncentive.toLocaleString('en-IN')}</div>
<div>DCF: ₹{result.breakup.dcf.totalDCF.toLocaleString('en-IN')}</div>

// Show insights
{result.insights.map(insight => (
  <Alert type={insight.type}>{insight.message}</Alert>
))}
```

### Pattern 2: What-If with User Inputs
```typescript
const [projectedSI, setProjectedSI] = useState(20);
const [inputScore, setInputScore] = useState(80);

const simulation = simulateIncentiveWhatIf({
  role: 'KAM',
  projectedSI,
  inspections: 100,
  dcf: dcfInputs,
  inputScore
});

// Show result
<div>If you achieve {projectedSI} SIs:</div>
<div>Incentive: ₹{simulation.totalIncentive.toLocaleString('en-IN')}</div>
<div>Slab: {simulation.slabsUnlocked.join(', ')}</div>

// Show tips
{simulation.nextActionTips.map(tip => (
  <Tip type={tip.type}>{tip.message}</Tip>
))}
```

### Pattern 3: Milestone Display
```typescript
const simulation = simulateIncentiveWhatIf({ ... });

<div>
  <h3>Milestones</h3>
  <div>
    <strong>50% Target ({simulation.milestones.at50Percent.siNeeded} SIs):</strong>
    ₹{simulation.milestones.at50Percent.incentiveIfAchieved}
  </div>
  <div>
    <strong>100% Target ({simulation.milestones.at100Percent.siNeeded} SIs):</strong>
    ₹{simulation.milestones.at100Percent.incentiveIfAchieved}
  </div>
  <div>
    <strong>110% Target ({simulation.milestones.at110Percent.siNeeded} SIs):</strong>
    ₹{simulation.milestones.at110Percent.incentiveIfAchieved}
  </div>
</div>
```

---

## 🚫 Anti-Patterns (Don't Do This)

### ❌ Don't Calculate Incentives in UI
```typescript
// BAD
const incentive = stockIns * (achievementPercent >= 110 ? 1500 : 1000);
```

### ✅ Use the Engine
```typescript
// GOOD
const result = calculateActualProjectedIncentive({ ... });
const incentive = result.totalIncentive;
```

---

### ❌ Don't Mix Logic Between Actual and What-If
```typescript
// BAD - Different logic in different tabs
if (isActualTab) {
  // One calculation
} else {
  // Different calculation
}
```

### ✅ Use Same Engine, Different Inputs
```typescript
// GOOD
if (isActualTab) {
  const result = calculateActualProjectedIncentive(actualContext);
} else {
  const result = simulateIncentiveWhatIf(userInputs);
}
```

---

### ❌ Don't Hardcode Targets
```typescript
// BAD
const target = role === 'KAM' ? 20 : 100;
```

### ✅ Use getSITarget
```typescript
// GOOD
import { getSITarget } from '@/lib/metricsEngine';
const target = getSITarget(role);
```

---

## 🧪 Testing Checklist

When integrating the engine, verify:

- [ ] SI below target shows ₹0
- [ ] 100-109% slab shows ₹1000/SI
- [ ] 110%+ slab shows ₹1500/SI
- [ ] DCF breakdown shows 3 separate line items
- [ ] Input score < 50 blocks all incentive
- [ ] Input score < 70 applies 50% penalty
- [ ] Actual tab auto-projects from MTD
- [ ] What-if tab accepts manual inputs
- [ ] Both tabs show same breakup structure
- [ ] Insights are helpful and actionable
- [ ] Milestones show correct target points

---

## 📞 Support

If you encounter issues:
1. Check that inputs match `IncentiveContext` or `WhatIfSimulationInput` types
2. Verify role is exactly `'KAM'` or `'TL'` (case-sensitive)
3. Ensure all numbers are valid (not `NaN` or `undefined`)
4. Check browser console for TypeScript errors

For validation, run:
```typescript
import { validateIncentiveEngine } from '@/lib/incentiveEngine.test.examples';
validateIncentiveEngine();
```
