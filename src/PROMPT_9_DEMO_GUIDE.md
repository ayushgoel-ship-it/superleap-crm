# Prompt 9 — Admin Home v2 Demo Guide

## Quick Visual Demo Script

### 1. Initial Load (Default State)
**What to see**:
```
Header: "Admin Dashboard — Business Overview"
Active Filters: [MTD] [All Regions]

Business Summary:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ SI          │ Inspections │ I2SI        │ C2D I2B     │
│ 165 / 180   │ 780         │ 21.2%       │ 99          │
└─────────────┴─────────────┴─────────────┴─────────────┘

DCF Performance:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Onboarding  │ Leads       │ Disbursals  │ GMV         │
│ 8           │ 45          │ 12          │ ₹48.5L      │
└─────────────┴─────────────┴─────────────┴─────────────┘

Region Performance: [🔽 Expanded]
  ┌─ NCR ─────────────┐  ┌─ West ────────────┐
  │ 2 TLs             │  │ 1 TL              │
  │ SI: 68 / 80       │  │ SI: 42 / 40       │
  │ I2SI: 22%         │  │ I2SI: 23%         │
  └───────────────────┘  └───────────────────┘

TL Leaderboard: [🔽 Expanded]
  #1 Rajesh Kumar (NCR) - 68/80, I2SI: 22%, DCF: 5
  #2 Neha Singh (West) - 42/40, I2SI: 23%, DCF: 4
  ...
```

---

### 2. Change Time Filter to "D-1" (Yesterday)
**Actions**:
1. Click "MTD" dropdown
2. Select "D-1"

**Expected Changes**:
```
Header: [D-1] [All Regions]

Business Summary:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ SI          │ Inspections │ I2SI        │ C2D I2B     │
│ 8 / 180 ⬇️  │ 33 ⬇️       │ 24.2% ⬆️    │ 5 ⬇️        │
└─────────────┴─────────────┴─────────────┴─────────────┘

DCF Performance:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Onboarding  │ Leads       │ Disbursals  │ GMV         │
│ 2 ⬇️        │ 3 ⬇️        │ 1 ⬇️        │ ₹4.2L ⬇️    │
└─────────────┴─────────────┴─────────────┴─────────────┘

Region Performance:
  All regions show LOWER numbers (yesterday only)
  
TL Leaderboard:
  Rankings may shift based on yesterday's performance
```

**Key Observation**: All numbers drop significantly because D-1 shows only yesterday's data, not cumulative MTD.

---

### 3. Change to "LMTD" (Last Month To Date)
**Actions**:
1. Click "D-1" dropdown
2. Select "LMTD"

**Expected Changes**:
```
Header: [LMTD] [All Regions]

Business Summary:
  Numbers will be similar to MTD but from LAST month
  (November 1-5 if today is December 5)
  
  Compare:
    MTD (Dec 1-5):  SI 165
    LMTD (Nov 1-5): SI 142 (slightly lower, historical)
```

**Use Case**: Compare current month progress vs same period last month.

---

### 4. Select Single Region (NCR Only)
**Actions**:
1. Click "All Regions" dropdown
2. Check only "NCR"
3. Click outside to close

**Expected Changes**:
```
Header: [LMTD] [1 Selected]

Business Summary:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ SI          │ Inspections │ I2SI        │ C2D I2B     │
│ 68 / 80 ⬇️  │ 310 ⬇️      │ 22% ≈      │ 41 ⬇️       │
└─────────────┴─────────────┴─────────────┴─────────────┴

Region Performance: [Shows NCR only]
  ┌─ NCR ─────────────┐
  │ 2 TLs             │
  │ SI: 68 / 80       │
  └───────────────────┘
  
TL Leaderboard: [Shows only NCR TLs]
  #1 Rajesh Kumar (NCR) - 68/80
  #2 Neha Singh (NCR) - (if exists)
```

**Key Observation**: Summary aggregates ONLY NCR data. Other regions disappear.

---

### 5. Multi-Select Regions (NCR + West)
**Actions**:
1. Click "1 Selected" dropdown
2. Check "West" also
3. Click outside

**Expected Changes**:
```
Header: [LMTD] [2 Selected]

Business Summary:
  SI: 110 / 120 (NCR 68 + West 42)
  Inspections: 476 (NCR 310 + West 166)
  
Region Performance: [Shows NCR + West only]
  ┌─ NCR ─────────────┐  ┌─ West ────────────┐
  │ 2 TLs             │  │ 1 TL              │
  │ SI: 68 / 80       │  │ SI: 42 / 40       │
  └───────────────────┘  └───────────────────┘
  
TL Leaderboard: [Shows NCR + West TLs only]
  #1 Neha Singh (West) - 42/40 (105%)
  #2 Rajesh Kumar (NCR) - 68/80 (85%)
```

**Key Observation**: Numbers sum across selected regions.

---

### 6. Click Reset
**Actions**:
1. Click "Reset" button

**Expected Changes**:
```
Filters restore to:
  [MTD] [All Regions]
  
All numbers return to initial state (Step 1)
Search box clears
```

---

### 7. Collapse Region Block
**Actions**:
1. Click "Region Performance" header

**Expected Changes**:
```
Region Performance: [🔼 Collapsed]
  (Cards hidden)
  
TL Leaderboard still visible below
```

---

### 8. Collapse TL Block
**Actions**:
1. Click "TL Leaderboard" header

**Expected Changes**:
```
Region Performance: [🔼 Collapsed]

TL Leaderboard: [🔼 Collapsed]
  (Table hidden)
```

**Use Case**: Clean view focusing only on Business Summary when both blocks collapsed.

---

## Mobile View Demo

### Swipe Through Summary Cards
```
Business Summary (Scroll horizontally):
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ SI          │ │ I2SI        │ │ Inspections │
│ 165 / 180   │ │ 21.2%       │ │ 780         │
└─────────────┘ └─────────────┘ └─────────────┘
      ⬅️  Swipe  ➡️
```

### Collapsed Sections on Mobile
Both Region Performance and TL Leaderboard have collapse toggles.

**Recommended UX**: 
- Start with both expanded on first load
- User can collapse to focus on summary metrics

---

## Filter Combination Examples

### Example 1: Regional Deep Dive
```
Filter: [MTD] + [South]
Goal: Analyze South region performance this month
Result: See only South dealers, DCF leads, TLs
```

### Example 2: Yesterday's Pan-India Performance
```
Filter: [D-1] + [All Regions]
Goal: Quick check of yesterday's numbers across India
Result: Aggregated numbers for all regions from yesterday
```

### Example 3: North Zones Comparison
```
Filter: [MTD] + [NCR, North]
Goal: Compare NCR vs North region
Result: Combined metrics, but region cards show breakdown
```

### Example 4: Month-over-Month Comparison
```
Step 1: Set [MTD] + [All] → Note SI: 165
Step 2: Set [LMTD] + [All] → Note SI: 142
Analysis: +16% growth vs last month same period
```

---

## Data Validation Checks

### Check 1: SI Target Matches KAM Count
```
Expected: SI Target = (# of KAMs) × 20

Example:
  NCR: 4 KAMs → Target = 80
  West: 2 KAMs → Target = 40
  Total: 6 KAMs → Target = 120
```

### Check 2: DCF GMV Matches Disbursals
```
If DCF Disbursals = 12
Then DCF GMV should be reasonable (e.g., ₹40-60L)
Average loan: ₹4-5L per disbursal
```

### Check 3: I2SI Calculation
```
Formula: (SI / Inspections) × 100

Example:
  SI: 165
  Inspections: 780
  I2SI: (165 / 780) × 100 = 21.15% ≈ 21.2% ✅
```

### Check 4: Region Sum = Total
```
When "All Regions" selected:
  Summary SI should equal SUM of all region SI

  NCR: 68
  West: 42
  South: 35
  East: 20
  Total: 165 ✅
```

---

## Common User Flows

### Flow 1: Morning Review (Admin)
```
1. Open Admin Home (defaults to MTD, All Regions)
2. Scan Business Summary for health check
3. Check Region Performance for outliers
4. Click underperforming region to drill down
5. Review TL Leaderboard for individual accountability
```

### Flow 2: Regional Focus (Admin managing NCR)
```
1. Open Admin Home
2. Click Region filter → Select NCR only
3. Expand TL Leaderboard
4. Click top TL to see detail
5. Click Reset when done
```

### Flow 3: Yesterday's Standup Prep
```
1. Open Admin Home
2. Click Time filter → Select D-1
3. Note key numbers:
   - SI achieved
   - DCF disbursals
   - Any red flags
4. Switch back to MTD for cumulative view
```

### Flow 4: Export for Leadership
```
1. Set desired filters (e.g., MTD, All Regions)
2. Click "Export CSV"
3. Numbers in CSV match on-screen display
4. Send to leadership with context
```

---

## Troubleshooting

### Issue: Numbers seem wrong
**Check**:
1. What time filter is active? (D-1 will be much lower than MTD)
2. What regions are selected? (Single region != All regions)
3. Is search filter active in TL table? (May hide rows)

### Issue: Region block empty
**Cause**: Selected a region with no TLs (rare)
**Solution**: Click Reset or select different region

### Issue: TL Leaderboard out of order
**Expected**: TLs ranked by SI achievement %
**Check**: Top TL should have highest (SI Achieved / SI Target) %

---

## Success Criteria Met ✅

- [x] Filters work and update all numbers
- [x] SI shown as Ach/Target format
- [x] 8 summary metrics visible
- [x] Region block collapsible
- [x] TL block collapsible
- [x] No inline mocks, all from centralized engine
- [x] Single function powers entire page
- [x] Mobile responsive

**Admin Home is now a production-ready business cockpit.**
