# SuperLeap KAM CRM - Business Logic Documentation

## Table of Contents
1. [Overview](#overview)
2. [KAM Incentive Logic](#kam-incentive-logic)
3. [TL Incentive Logic](#tl-incentive-logic)
4. [Input Score Calculation](#input-score-calculation)
5. [Gate Logic](#gate-logic)
6. [Performance Flags](#performance-flags)
7. [Time Periods](#time-periods)
8. [Metrics & Formulas](#metrics--formulas)

---

## Overview

SuperLeap is a comprehensive CRM for CARS24's Dealer Referral business where:
- **Key Account Managers (KAMs)** manage panels of used-car dealers
- **Team Leads (TLs)** oversee multiple KAMs
- Dealers share seller leads and inventory leads in exchange for commissions
- System handles multiple verticals: C2B, C2D, GS, and DCF (loans to customers buying cars from dealers)

---

## KAM Incentive Logic

### Components
KAM incentives are calculated based on three components:

#### 1. Stock-in Incentive
- **Rate**: ₹500 per stock-in
- **Gate**: Stock-ins must reach **≥90% of target** before any incentive is paid
- **Formula**: 
  ```
  if (stockIns / stockInTarget >= 0.9):
    incentive = stockIns × 500
  else:
    incentive = 0
  ```

#### 2. DCF Incentive
- **Rate**: ₹2,000 per loan disbursal
- **No gate**: Incentive applies from first disbursal
- **Formula**: `incentive = dcfDisbursals × 2000`

#### 3. I2SI Bonus
- **Trigger**: I2SI% > 15%
- **Rate**: +5% bonus on total base incentive for every 1% above 15%
- **Formula**: 
  ```
  if (I2SI > 15):
    i2siExcess = I2SI - 15
    i2siMultiplier = i2siExcess × 5 (in %)
    i2siBonus = (stockInIncentive + dcfIncentive) × (i2siMultiplier / 100)
  else:
    i2siBonus = 0
  ```

### Master Gate
- **Input Score Gate**: KAM's Input Score must be **≥75**
- If Input Score < 75, **ALL incentive = ₹0** (completely locked)

### Total KAM Incentive Formula
```
if (inputScore >= 75):
  baseIncentive = stockInIncentive + dcfIncentive
  totalIncentive = baseIncentive + i2siBonus
else:
  totalIncentive = 0
```

### Example Calculation
**Scenario**: 
- Stock-ins: 124 / 150 (82.7% achievement)
- DCF Disbursals: 18
- I2SI%: 17.2%
- Input Score: 78

**Calculation**:
```
1. Input Score Gate: 78 >= 75 ✓ (Unlocked)
2. Stock-in Incentive: 82.7% < 90% → ₹0
3. DCF Incentive: 18 × ₹2,000 = ₹36,000
4. Base Incentive: ₹0 + ₹36,000 = ₹36,000
5. I2SI Bonus: 17.2% - 15% = 2.2% → 2.2 × 5% = 11% bonus
   → ₹36,000 × 0.11 = ₹3,960
6. Total Incentive: ₹36,000 + ₹3,960 = ₹39,960
```

---

## TL Incentive Logic

### Components
TL incentives are based on team performance across three components:

#### 1. Stock-in Incentive
- **Rate**: ₹200 per team stock-in
- **Gate**: Team stock-ins must reach **≥100% of target**
- **Formula**: 
  ```
  if (teamStockIns / teamStockInTarget >= 1.0):
    incentive = teamStockIns × 200
  else:
    incentive = 0
  ```

#### 2. I2SI Bonus
- **Trigger**: Team I2SI% > 20%
- **Rate**: ₹50 per car
- **Gate**: Only applies if stock-in target ≥100% is achieved
- **Formula**: 
  ```
  if (teamStockIns / teamStockInTarget >= 1.0 AND teamI2SI > 20):
    i2siBonus = teamStockIns × 50
  else:
    i2siBonus = 0
  ```

#### 3. DCF Incentive
- **Rate**: ₹500 per team DCF disbursal
- **No gate**: Incentive applies regardless of stock-in achievement
- **Formula**: `incentive = teamDCFDisbursals × 500`

### Master Gate
- **TL Score Gate**: TL's Input Score must be **≥75**
- If TL Score < 75, **ALL incentive = ₹0** (completely locked)

### Target Achievement Gate
- **100% Stock-in Achievement Required**: 
  - If projected stock-ins < 100% of target:
    - Stock-in incentive = ₹0
    - I2SI bonus = ₹0
  - DCF incentive continues regardless

### Payout Logic
- **Current MTD**: Informational only (shown with reduced opacity)
- **Projected Incentive**: This is the actual payout at month-end
- Display: "Actual payout is based on Projected incentive at end of month."

### Total TL Incentive Formula
```
if (tlScore >= 75):
  if (teamStockIns / teamStockInTarget >= 1.0):
    stockInIncentive = teamStockIns × 200
    i2siBonus = (teamI2SI > 20) ? teamStockIns × 50 : 0
  else:
    stockInIncentive = 0
    i2siBonus = 0
  
  dcfIncentive = teamDCFDisbursals × 500
  totalIncentive = stockInIncentive + i2siBonus + dcfIncentive
else:
  totalIncentive = 0
```

### Example Calculation
**Scenario**: 
- Team Stock-ins: 124 / 150 (82.7% achievement)
- Team DCF Disbursals: 18
- Team I2SI%: 17.2%
- TL Score: 78

**Calculation**:
```
1. TL Score Gate: 78 >= 75 ✓ (Unlocked)
2. Target Achievement: 82.7% < 100% ✗
3. Stock-in Incentive: Target not met → ₹0
4. I2SI Bonus: Target not met → ₹0
5. DCF Incentive: 18 × ₹500 = ₹9,000
6. Total Incentive: ₹9,000
```

**With Extra Achievements (+26 SIs)**:
```
1. TL Score Gate: 78 >= 75 ✓ (Unlocked)
2. Projected Stock-ins: 124 + 26 = 150 (100% achievement)
3. Stock-in Incentive: 150 × ₹200 = ₹30,000
4. I2SI Bonus: 17.2% < 20% → ₹0
5. DCF Incentive: 18 × ₹500 = ₹9,000
6. Projected Total: ₹30,000 + ₹0 + ₹9,000 = ₹39,000
```

---

## Input Score Calculation

Input Score is calculated from 4 components, each worth **25 points maximum** (total 100 points).

### KAM Input Score

#### Component 1: Visits / Connects (25 points)
- **Logic**: Take the BETTER of visits OR connects ratio
- **Formula**: 
  ```
  visitsRatio = min(actualVisits / targetVisits, 1)
  callsRatio = min(actualConnects / targetConnects, 1)
  score = max(visitsRatio, callsRatio) × 25
  ```
- **Example**: 
  - Visits: 0.8/1.0 = 80%
  - Connects: 9/10 = 90%
  - Score = max(0.8, 0.9) × 25 = 22.5 points

#### Component 2: Inspecting Dealers (25 points)
- **Formula**: 
  ```
  score = min(avgInspectingDealers / targetInspectingDealers, 1) × 25
  ```
- **Example**: 
  - Avg: 0.4 dealers/day
  - Target: 0.5 dealers/day
  - Score = (0.4 / 0.5) × 25 = 20 points

#### Component 3: Unique Raise % (25 points)
- **Formula**: 
  ```
  score = min(uniqueRaisePercent / targetUniqueRaise, 1) × 25
  ```
- **Example**: 
  - Actual: 72%
  - Target: 75%
  - Score = (72 / 75) × 25 = 24 points

#### Component 4: Raise Quality vs HBTP (25 points)
- **Logic**: Lower raise quality (closer to HBTP) is better
- **Target**: raiseQuality ≤ (targetQualityRatio × HBTP)
- **Formula**: 
  ```
  targetQuality = targetQualityRatio × hbtpValue
  if (raiseQuality <= targetQuality):
    score = 25 (full points)
  else:
    score = min(targetQuality / raiseQuality, 1) × 25
  ```
- **Example**: 
  - Raise Quality: 0.83
  - HBTP: 0.95
  - Target Ratio: 0.85
  - Target Quality: 0.85 × 0.95 = 0.8075
  - Score: 0.83 > 0.8075 → (0.8075 / 0.83) × 25 = 24.3 points

**Total KAM Input Score**: Sum of all 4 components (rounded)

### TL Input Score

Same as KAM, except **Component 1 is different**:

#### Component 1: Productivity of KAMs (25 points)
- **Fixed Thresholds**: 
  - **20 Stock-ins** (team total)
  - **₹15L DCF disbursals** (team total)
- **Formula**: 
  ```
  sisRatio = teamSIs / 20
  dcfRatio = teamDCFValue / 15 (in lakhs)
  
  if (sisRatio >= 1.0 AND dcfRatio >= 1.0):
    score = 25 (full points)
  else:
    avgRatio = min((sisRatio + dcfRatio) / 2, 1)
    score = avgRatio × 25
  ```
- **Example**: 
  - Team SIs: 18 / 20 = 0.9
  - Team DCF: ₹12L / ₹15L = 0.8
  - Average: (0.9 + 0.8) / 2 = 0.85
  - Score = 0.85 × 25 = 21.25 points

**Components 2-4**: Same as KAM (Inspecting Dealers, Unique Raise %, Raise Quality vs HBTP)

**Total TL Input Score**: Sum of all 4 components (rounded)

---

## Gate Logic

### KAM Gates

#### 1. Input Score Gate (Master Gate)
- **Threshold**: ≥75
- **Impact**: Locks ALL incentive if not met
- **Status**: Pass/Fail

#### 2. Stock-in Threshold Gate
- **Threshold**: ≥90% of target
- **Impact**: Locks stock-in incentive only (DCF still pays)
- **Status**: Pass/Fail

### TL Gates (Incentive Simulator)

#### 1. TL Score Gate (Master Gate)
- **Threshold**: ≥75
- **Impact**: Locks ALL incentive if not met
- **Display**: "TL Score: [X] / 100 • Gate: 75 (Unlocked/Locked)"
- **Status**: Pass/Fail

#### 2. I2SI% Gate
- **Threshold**: Team-specific (typically ≥65%)
- **Impact**: Used in simulator projections
- **Display**: "I2SI% Gate: ≥65%"
- **Status**: Pass/Fail

**Note**: Active Dealers gate has been removed from TL simulator.

### Gate Display Logic

**Unlocked State** (Gate Met):
```
✓ Green unlock icon
"TL Score: 78 / 100 • Gate: 75 (Unlocked)"
All incentive calculations proceed normally
```

**Locked State** (Gate Not Met):
```
✗ Red lock icon
"TL Score: 68 / 100 • Gate: 75 (Locked – no incentive)"
Projected incentive = ₹0
Slider impacts show "+₹0K"
Helper text: "TL score below 75 – incentive locked."
```

---

## Performance Flags

### KAM Performance Flags (Visible to TL)

Used to classify KAM performance on TL Home screen.

#### Logic
```javascript
function getPerformanceFlag(kam) {
  const achievementPercent = (kam.stockIns / kam.stockInsTarget) × 100;
  
  if (kam.inputScore >= 80 AND achievementPercent >= 90) {
    return "Good performing" (green badge);
  } 
  else if (kam.inputScore < 70 OR achievementPercent < 75) {
    return "Poor performing" (red badge);
  } 
  else {
    return "Good performing" (green badge);
  }
}
```

#### Criteria Summary
| Performance | Input Score | Stock-in Achievement |
|-------------|-------------|----------------------|
| Good | ≥80 | ≥90% |
| Poor | <70 | <75% |
| Good (default) | 70-79 | 75-89% |

#### Display
KAM tiles show:
- **Score badge**: Color-coded (green if ≥85, amber if <85)
- **Performance badge**: "Good performing" (green) or "Poor performing" (red)
- **Region/City**: e.g., "Gurgaon"

---

## Time Periods

The application supports multiple time period filters that affect all metrics:

### Available Periods
1. **D-1** (Yesterday)
2. **L7D** (Last 7 Days)
3. **Last Month**
4. **MTD** (Month-to-Date) - **Default for TL Home**

### Impact
All cards and metrics update based on selected time period:
- Team Overview metrics
- Input Score calculations
- KAM Performance tiles
- Stock-ins, I2SI%, DCF disbursals

---

## Metrics & Formulas

### Key Metrics

#### 1. Stock-ins (SIs)
- **Definition**: Number of cars successfully onboarded to CARS24 inventory
- **Related**: Inspections → Stock-ins conversion

#### 2. I2SI% (Inspection-to-Stock-in %)
- **Formula**: `I2SI% = (Stock-ins / Inspections) × 100`
- **Example**: 124 stock-ins from 721 inspections = 17.2%
- **Targets**: 
  - KAM bonus trigger: >15%
  - TL bonus trigger: >20%
  - TL gate: ≥65% (team average)

#### 3. DCF Disbursals
- **Definition**: Number of loan disbursals through DCF vertical
- **Value**: Also tracked in Lakhs/Crores
- **Example**: 18 disbursals = ₹1.98Cr value

#### 4. Input Score
- **Range**: 0-100
- **Components**: 4 components × 25 points each
- **Gate**: ≥75 for incentive eligibility
- **Target**: Typically 85 for "on track"

#### 5. Target Achievement %
- **Formula**: `(Actual / Target) × 100`
- **Stock-in Example**: 124 / 150 = 82.7%
- **Used in**: Performance flags, gates, incentive calculations

### Conversion Funnels

#### C2B Funnel (KAM)
```
Appointments → Inspections → Stock-ins → Revenue
```

#### Lead Quality Metrics
- **Unique Raise %**: Percentage of unique dealer leads
- **Raise Quality vs HBTP**: How close raise prices are to HBTP (lower is better)

### Team Aggregation (TL Metrics)

**Team Stock-ins**: Sum of all KAM stock-ins
```
teamStockIns = Σ(kamStockIns)
```

**Team I2SI%**: Weighted average
```
teamI2SI = (Σ(kamStockIns) / Σ(kamInspections)) × 100
```

**Team DCF**: Sum of all KAM DCF disbursals
```
teamDCF = Σ(kamDCFDisbursals)
```

**Avg Input Score**: Simple average
```
avgInputScore = Σ(kamInputScore) / numberOfKAMs
```

---

## Simulator Logic

### KAM Incentive Simulator

Accessed from: KAM Home → "Incentive Calculator" card (from TL Home → opens TL Simulator instead)

**Features**:
- Current MTD performance display
- Adjustable sliders:
  - Extra Stock-ins (0-30)
  - Extra DCF Disbursals (0-15)
  - Target I2SI% (10-30%)
- Real-time incentive impact calculation
- Input Score gate validation
- 90% stock-in threshold feedback

**Calculation Flow**:
1. Take current MTD values
2. Add extra achievements from sliders
3. Calculate projected incentive with updated values
4. Check Input Score gate (≥75)
5. Check stock-in threshold (≥90%)
6. Display incentive delta vs current

### TL Incentive Simulator

Accessed from: Performance → Incentive Simulator (TL view only)

**Features**:
- Current MTD vs Projected display (Projected emphasized)
- Payout note: "Actual payout is based on Projected incentive at end of month"
- Adjustable sliders:
  - Extra Stock-ins (0-50)
  - Extra DCF Disbursals (₹0-20L)
  - Expected I2SI% improvement (50-80%)
- Gate status panel:
  - I2SI% Gate
  - Input Score Gate (TL Score)
- Scenario summary with recommendations

**Calculation Flow**:
1. Take current team MTD values
2. Add extra achievements from sliders
3. Calculate projected team metrics
4. Check TL Score gate (≥75)
5. Check 100% target achievement gate for SI/I2SI
6. DCF incentive always calculated (no gate)
7. Display projected incentive and gate status

**Gate Behavior**:
- If TL Score < 75: All incentive = ₹0
- If Stock-in achievement < 100%: SI and I2SI incentive = ₹0
- DCF incentive unaffected by stock-in gate

---

## Business Rules Summary

### Incentive Payment Rules
1. **Payment Frequency**: Monthly (based on MTD performance)
2. **Payout Timing**: End of month
3. **Gate Validation**: Checked at month-end
4. **Eligibility**: Must meet ALL applicable gates

### Target Setting
- Targets are set per KAM/TL
- Targets may vary by region/city
- Typical KAM stock-in target: 130-220 per month
- Typical TL team target: 600 stock-ins per month

### Performance Measurement
- Daily tracking (D-1 available)
- Weekly tracking (L7D)
- Monthly tracking (MTD, Last Month)
- Input Score calculated daily

### Dealer Context
- **SIs (Context)**: Total inspections (formerly shown, now removed from some views)
- Used to calculate I2SI% but not directly incentivized
- Helps contextualize stock-in performance

---

## Data Structures

### KAM Data Object
```typescript
{
  name: string;              // "Rajesh Kumar"
  city: string;              // "Gurgaon"
  inputScore: number;        // 87
  sis: number;               // 198 (inspections)
  sisTarget: number;         // 220
  stockIns: number;          // 124
  stockInsTarget: number;    // 150
  i2si: number;              // 68 (%)
  dcfDisbursals: number;     // 18
}
```

### TL Data Object
```typescript
{
  name: string;                    // "Amit Sharma"
  region: string;                  // "North"
  tlScore: number;                 // 78 (TL Input Score)
  teamStockIns: number;            // 587
  teamStockInsTarget: number;      // 600
  teamI2SI: number;                // 68 (%)
  teamI2SIGate: number;            // 65 (%)
  teamDCFDisbursals: number;       // 90
  teamDCFTarget: number;           // 15000000 (in rupees)
  totalPotentialIncentive: number; // Based on achievement
  eligibleIncentive: number;       // After gates applied
}
```

### Input Score Data Object
```typescript
{
  // KAM fields
  visits: number;                  // 0.8
  targetVisits: number;            // 1
  connects: number;                // 9
  targetConnects: number;          // 10
  
  // TL additional fields
  sis?: number;                    // 198 (for TL productivity)
  sisTarget?: number;              // 220
  dcfDisbursalsValue?: number;     // 12 (in lakhs)
  dcfDisbursalsTarget?: number;    // 15 (in lakhs)
  
  // Common fields
  avgInspectingDealers: number;    // 0.4
  targetInspectingDealers: number; // 0.5
  uniqueRaisePercent: number;      // 72
  targetUniqueRaise: number;       // 75
  raiseQuality: number;            // 0.83
  hbtpValue: number;               // 0.95
  targetQualityRatio: number;      // 0.85
}
```

---

## UI/UX Logic

### TL Home Layout (Reordered)
1. **Time Period Filters** (D-1, L7D, Last Month, MTD)
2. **Team Overview** - 4 metrics grid
3. **Team Input Score** - Expandable card with 4 components
4. **KAM Performance** - List of KAM tiles (tappable)

**Removed**: TL Incentive Calculator card (access via Performance menu instead)

### KAM Home Layout
1. **Time Period Filters**
2. **Input Score Card**
3. **Quick Actions Grid**
4. **Performance Metrics**
5. **Incentive Calculator** (tappable card)

### Navigation Patterns
- **TL → KAM**: Tap KAM tile on TL Home → Opens KAM Detail dashboard
- **Simulator Access**: 
  - KAM: Home → Incentive Calculator card → KAM Simulator
  - TL: Performance menu → TL Incentive Simulator

### Color Coding
- **Green**: On target, good performance, gate passed
- **Amber/Orange**: Below target, warning
- **Red**: Poor performance, gate failed
- **Blue**: Primary actions, neutral info
- **Gray**: Disabled, informational

---

## Validation & Error Handling

### Gate Failure Messages
```
KAM Input Score < 75:
  "Improve Input Score to 75+ to unlock this incentive."

TL Score < 75:
  "TL score below 75 – incentive locked."

Stock-in < 90% (KAM):
  "Below 90% target – no incentive yet (82% to target)"

Target < 100% (TL):
  "Target not yet 100% – no SI / I2SI incentive."
```

### Slider Constraints
- **KAM Extra Stock-ins**: 0-30 (prevents unrealistic projections)
- **KAM Extra DCF**: 0-15
- **TL Extra Stock-ins**: 0-50 (team level)
- **TL Extra DCF**: ₹0-25L
- **I2SI% Adjustment**: 10-35% (realistic range)

---

## Version History

**Current Version**: v2.0 (December 2024)

**Recent Changes**:
- Updated TL simulator to use "TL Score" instead of "Input Score"
- Removed Active Dealers gate from TL simulator
- Removed TL Incentive Calculator card from TL Home
- Reordered TL Home sections (Team Overview first)
- Updated Productivity component to use fixed thresholds (20 SIs, ₹15L DCF)
- Added 100% target achievement gate for TL SI/I2SI incentive
- Emphasized Projected incentive as actual payout basis for TLs
- Changed MTD default for TL Home (was LMTD)
- Removed "SIs (context)" row from Current MTD Performance in TL simulator

**Previous Version**: v1.0
- Initial implementation with basic KAM/TL incentive logic
- Input Score calculation with 4 components
- Gate-based incentive system

---

## Contact & Support

For questions about business logic or feature requests:
- **Product Owner**: CARS24 Dealer Referral Team
- **System**: SuperLeap KAM CRM
- **Last Updated**: December 15, 2024

---

*This document reflects the current state of business logic as implemented in the SuperLeap KAM CRM application. All formulas, thresholds, and rules are subject to change based on business requirements.*
