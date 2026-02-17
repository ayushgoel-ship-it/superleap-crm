# Prompt 9 — Quick Reference Card

## 🚀 Quick Start (For Developers)

### How to Use Admin Metrics Engine

```typescript
import { getAdminHomeMetrics, getDefaultAdminFilters } from '@/lib/metrics/adminMetrics';

// 1. Get default filters
const filters = getDefaultAdminFilters();
// Returns: { timeScope: 'MTD', regions: [] }

// 2. Compute all metrics
const metrics = getAdminHomeMetrics(filters);

// 3. Use the data
console.log(metrics.summary.siAchieved);        // 165
console.log(metrics.summary.siTarget);          // 180
console.log(metrics.regionBreakdown.length);    // 4 regions
console.log(metrics.tlLeaderboard.length);      // 5 TLs
```

### Custom Filters

```typescript
// Single region
const ncrMetrics = getAdminHomeMetrics({
  timeScope: 'MTD',
  regions: ['NCR']
});

// Multiple regions
const northMetrics = getAdminHomeMetrics({
  timeScope: 'MTD',
  regions: ['NCR', 'North']
});

// Yesterday only
const yesterdayMetrics = getAdminHomeMetrics({
  timeScope: 'D-1',
  regions: []
});

// Last month comparison
const lastMonthMetrics = getAdminHomeMetrics({
  timeScope: 'Last Month',
  regions: []
});
```

---

## 📊 Available Metrics

### Business Summary
```typescript
metrics.summary = {
  siAchieved: number,      // Total stock-ins achieved
  siTarget: number,        // Total stock-ins target
  inspections: number,     // Total inspections
  i2si: number,            // I2SI percentage
  c2dI2B: number,          // C2D I2B count
  dcfOnboarding: number,   // DCF dealers onboarded
  dcfLeads: number,        // Total DCF leads
  dcfGMV: number,          // Total DCF GMV in ₹
  dcfDisbursals: number    // Total DCF disbursals
}
```

### Region Breakdown
```typescript
metrics.regionBreakdown = [
  {
    region: 'NCR',
    tlCount: 2,
    siAchieved: 68,
    siTarget: 80,
    i2si: 22.0,
    dcfDisbursals: 5,
    inputScore: 78.5,
    dcfGMV: 2150000
  },
  // ... more regions
]
```

### TL Leaderboard
```typescript
metrics.tlLeaderboard = [
  {
    tlId: 'tl-ncr-01',
    tlName: 'Rajesh Kumar',
    region: 'NCR',
    kamCount: 4,
    siAchieved: 68,
    siTarget: 80,
    i2si: 22.0,
    dcfDisbursals: 5,
    inputScore: 78.5
  },
  // ... more TLs (sorted by SI achievement %)
]
```

---

## 🎯 Filter Options

### Time Filters
| Filter | Description | Use Case |
|--------|-------------|----------|
| `MTD` | Month to date | Current month progress |
| `D-1` | Yesterday only | Daily standup review |
| `LMTD` | Last month to date | MoM comparison (same day range) |
| `Last Month` | Full previous month | Historical performance |

### Region Filters
| Value | Description |
|-------|-------------|
| `[]` | All regions (default) |
| `['NCR']` | NCR only |
| `['NCR', 'West']` | Multiple regions |
| `['NCR', 'West', 'South', 'East']` | All 4 regions (explicit) |

---

## 🔧 Common Patterns

### Pattern 1: MTD Overview
```typescript
// Get current month overview for all regions
const overview = getAdminHomeMetrics({
  timeScope: 'MTD',
  regions: []
});

console.log(`SI Progress: ${overview.summary.siAchieved}/${overview.summary.siTarget}`);
```

### Pattern 2: Regional Deep Dive
```typescript
// Focus on NCR region
const ncrData = getAdminHomeMetrics({
  timeScope: 'MTD',
  regions: ['NCR']
});

console.log(`NCR SI: ${ncrData.summary.siAchieved}`);
console.log(`NCR TLs: ${ncrData.tlLeaderboard.length}`);
```

### Pattern 3: Yesterday's Performance
```typescript
// Quick check of yesterday
const yesterday = getAdminHomeMetrics({
  timeScope: 'D-1',
  regions: []
});

console.log(`Yesterday SI: ${yesterday.summary.siAchieved}`);
```

### Pattern 4: Month-over-Month Comparison
```typescript
// Compare MTD vs LMTD
const thisMonth = getAdminHomeMetrics({ timeScope: 'MTD', regions: [] });
const lastMonth = getAdminHomeMetrics({ timeScope: 'LMTD', regions: [] });

const growth = ((thisMonth.summary.siAchieved - lastMonth.summary.siAchieved) / lastMonth.summary.siAchieved) * 100;
console.log(`MoM Growth: ${growth.toFixed(1)}%`);
```

---

## 🧮 Key Calculations

### SI Achievement %
```typescript
const achievement = (siAchieved / siTarget) * 100;
// Example: (165 / 180) * 100 = 91.7%
```

### I2SI Formula
```typescript
const i2si = (stockIns / inspections) * 100;
// Example: (165 / 780) * 100 = 21.2%
```

### DCF Average Loan Value
```typescript
const avgLoanValue = dcfGMV / dcfDisbursals;
// Example: 48,50,000 / 12 = ₹4.04L per disbursal
```

### Regional Target Calculation
```typescript
const regionTarget = kamCountInRegion * 20; // 20 SI per KAM
// Example: 4 KAMs × 20 = 80 target
```

---

## 🎨 UI Components (AdminDashboardPage)

### Filter Controls
```typescript
// Time filter dropdown
<button onClick={() => setShowTimeFilter(!showTimeFilter)}>
  {filters.timeScope}
</button>

// Region multi-select
<button onClick={() => setShowRegionFilter(!showRegionFilter)}>
  {filters.regions.length === 0 ? 'All Regions' : `${filters.regions.length} Selected`}
</button>

// Reset button
<button onClick={handleReset}>
  Reset
</button>
```

### Business Summary Display
```typescript
// SI metric
<div>
  <div>Stock-Ins</div>
  <div>{metrics.summary.siAchieved} / {metrics.summary.siTarget}</div>
</div>

// I2SI metric
<div>
  <div>I2SI</div>
  <div>{metrics.summary.i2si}%</div>
</div>
```

### Region Cards
```typescript
{metrics.regionBreakdown.map(region => (
  <div key={region.region}>
    <div>{region.region}</div>
    <div>{region.tlCount} TLs</div>
    <div>SI: {region.siAchieved} / {region.siTarget}</div>
    <div>I2SI: {region.i2si}%</div>
  </div>
))}
```

### TL Leaderboard Table
```typescript
{metrics.tlLeaderboard.map((tl, index) => (
  <div key={tl.tlId} onClick={() => onViewTLDetail(tl.tlId)}>
    <div>#{index + 1}</div>
    <div>{tl.tlName}</div>
    <div>{tl.siAchieved} / {tl.siTarget}</div>
    <div>{tl.i2si}%</div>
  </div>
))}
```

---

## 🐛 Debugging Tips

### Check Filter State
```typescript
console.log('Current filters:', filters);
// { timeScope: 'MTD', regions: ['NCR'] }
```

### Inspect Computed Metrics
```typescript
const metrics = getAdminHomeMetrics(filters);
console.log('Summary:', metrics.summary);
console.log('Regions:', metrics.regionBreakdown);
console.log('TLs:', metrics.tlLeaderboard);
```

### Verify Data Source
```typescript
import { DEALERS, DCF_LEADS, ORG } from '@/data/mockDatabase';

console.log('Total dealers:', DEALERS.length);
console.log('Total DCF leads:', DCF_LEADS.length);
console.log('Total TLs:', ORG.tls.length);
```

### Check ID Normalization
```typescript
import { makeTLId, makeKAMId, makeDealerId } from '@/data/mockDatabase';

console.log(makeTLId('ncr', 1));      // 'tl-ncr-01'
console.log(makeKAMId('west', 2));    // 'kam-west-02'
console.log(makeDealerId('south', 5)); // 'dealer-south-005'
```

---

## ⚡ Performance Tips

### Current Performance (Fast)
```
Data size: ~100 records total
Computation time: <5ms
Re-render time: <10ms
Total latency: <20ms ✅
```

### When to Optimize
```
Only if:
  - DEALERS > 1,000 records
  - DCF_LEADS > 1,000 records
  - ORG.tls > 50 TLs
  - Filter changes feel sluggish (>100ms)
```

### Optimization Strategy
```typescript
// Add memoization
const metrics = useMemo(
  () => getAdminHomeMetrics(filters),
  [filters.timeScope, filters.regions.join(',')]
);

// Debounce search
const debouncedSearch = useMemo(
  () => debounce(setSearchTerm, 300),
  []
);

// Virtual scrolling for large TL lists
import { FixedSizeList } from 'react-window';
```

---

## 📝 Code Snippets

### Add New Metric to Summary
```typescript
// 1. Update interface in adminMetrics.ts
interface AdminBusinessSummary {
  // ... existing
  newMetric: number; // Add this
}

// 2. Compute in computeBusinessSummary()
function computeBusinessSummary(...) {
  // ... existing
  const newMetric = dealers.reduce((sum, d) => sum + d.someValue, 0);
  
  return {
    // ... existing
    newMetric
  };
}

// 3. Display in AdminDashboardPage.tsx
<div>
  <div>New Metric</div>
  <div>{metrics.summary.newMetric}</div>
</div>
```

### Add New Filter Type
```typescript
// 1. Update AdminTimeFilter type
export type AdminTimeFilter = 'MTD' | 'D-1' | 'LMTD' | 'Last Month' | 'Custom';

// 2. Update matchesTimeFilter()
function matchesTimeFilter(dateStr: string, filter: AdminTimeFilter): boolean {
  // ... existing cases
  case 'Custom':
    return matchesCustomRange(date, customRange);
}

// 3. Add to UI dropdown
{(['MTD', 'D-1', 'LMTD', 'Last Month', 'Custom'] as AdminTimeFilter[]).map(...)}
```

### Export to CSV
```typescript
function exportAdminMetricsToCSV(metrics: AdminHomeMetrics) {
  const rows = [
    ['TL Name', 'Region', 'SI Achieved', 'SI Target', 'I2SI', 'DCF Disbursals'],
    ...metrics.tlLeaderboard.map(tl => [
      tl.tlName,
      tl.region,
      tl.siAchieved,
      tl.siTarget,
      tl.i2si,
      tl.dcfDisbursals
    ])
  ];
  
  const csv = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'admin_metrics.csv';
  link.click();
}
```

---

## ✅ Checklist for New Admin Dashboards

When creating a new admin dashboard (Calls, Visits, etc.):

- [ ] Create `/lib/metrics/adminXMetrics.ts` engine
- [ ] Define filter interface (time, regions, etc.)
- [ ] Define metrics output interface
- [ ] Implement main function: `getAdminXMetrics(filters)`
- [ ] Use centralized mockDatabase (no inline arrays)
- [ ] Test with different filter combinations
- [ ] Add to AdminDashboardPage with collapsible sections
- [ ] Ensure mobile responsiveness
- [ ] Add to PROMPT_9_COMPLETE.md as example

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `/lib/metrics/adminMetrics.ts` | Metrics computation engine |
| `/components/pages/AdminDashboardPage.tsx` | UI presentation layer |
| `/data/mockDatabase.ts` | Centralized data source |
| `/data/types.ts` | TypeScript interfaces |
| `/lib/metricsEngine.ts` | Shared calculation utilities |
| `/PROMPT_9_COMPLETE.md` | Implementation summary |
| `/PROMPT_9_DEMO_GUIDE.md` | User demo script |
| `/PROMPT_9_ARCHITECTURE.md` | Architecture details |

---

## 🎓 Learning Resources

### Understand the Pattern
1. Read `/PROMPT_9_ARCHITECTURE.md` for system design
2. Study `getAdminHomeMetrics()` function signature
3. Trace a filter change through the data flow
4. Try modifying a metric calculation

### Extend the System
1. Add a new summary metric (follow snippets above)
2. Add a new filter option (time or region)
3. Create a new admin dashboard using same pattern
4. Optimize with memoization if needed

---

**This reference card should get you productive with Admin Home metrics in <10 minutes.**

For questions, check:
- `/PROMPT_9_COMPLETE.md` - Full implementation details
- `/PROMPT_9_DEMO_GUIDE.md` - User workflows
- `/PROMPT_9_ARCHITECTURE.md` - System architecture
