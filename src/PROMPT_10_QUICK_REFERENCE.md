# Prompt 10 — Quick Reference for Developers

## 🚀 Quick Start: Using DTOs

### Rule #1: Never Import Raw Entities
```tsx
// ❌ WRONG
import { DEALERS } from '../data/mockDatabase';
const dealer = DEALERS.find(d => d.id === dealerId);

// ✅ CORRECT
import { getDealerDTO } from '../data/dtoSelectors';
const dealer = getDealerDTO(dealerId);
```

### Rule #2: Never Calculate Metrics in UI
```tsx
// ❌ WRONG
const i2si = (dealer.metrics.mtd.sis / dealer.metrics.mtd.inspections) * 100;

// ✅ CORRECT
const i2si = dealer.metrics.i2si; // Pre-calculated
```

### Rule #3: Never Call Engines Directly
```tsx
// ❌ WRONG
import { IncentiveEngine } from '../lib/incentiveEngine';
const incentive = IncentiveEngine.calculateIncentive(...);

// ✅ CORRECT
import { getIncentiveSummaryDTO } from '../data/dtoSelectors';
const incentive = getIncentiveSummaryDTO(kamId);
```

---

## 📦 Available DTOs

### Dealer DTOs
```typescript
import { 
  getDealerDTO,           // Full dealer info
  getDealer360DTO,        // Enhanced with aggregations
  getDealerListItemDTO,   // Lightweight for lists
  getDealerDTOs,          // Batch
  getKAMDealerDTOs        // All for a KAM
} from '../data/dtoSelectors';
```

### Activity DTOs
```typescript
import {
  getCallDTO,             // Full call info
  getCallDetailDTO,       // Enhanced for detail screen
  getVisitDTO,            // Full visit info
  getVisitDetailDTO,      // Enhanced for detail screen
  getKAMCallDTOs,         // All calls for a KAM
  getKAMVisitDTOs         // All visits for a KAM
} from '../data/dtoSelectors';
```

### Lead DTOs
```typescript
import {
  getDCFLeadDTO,          // Full lead info
  getDCFLeadDetailDTO     // Enhanced for detail screen
} from '../data/dtoSelectors';
```

---

## 🛠 Common Patterns

### Pattern 1: Simple Component
```tsx
import { getDealerDTO } from '../data/dtoSelectors';

function DealerCard({ dealerId }: { dealerId: string }) {
  const dealer = getDealerDTO(dealerId);
  
  if (!dealer) {
    return <div>Dealer not found</div>;
  }
  
  return (
    <div>
      <h3>{dealer.name}</h3>
      <p>SI: {dealer.metrics.stockIns}</p>
      <p>I2SI: {dealer.metrics.i2si}%</p>
    </div>
  );
}
```

### Pattern 2: List Component
```tsx
import { getKAMDealerDTOs } from '../data/dtoSelectors';

function DealerList({ kamId }: { kamId: string }) {
  const dealers = getKAMDealerDTOs(kamId);
  
  return (
    <div>
      {dealers.map(dealer => (
        <DealerCard key={dealer.id} dealerId={dealer.id} />
      ))}
    </div>
  );
}
```

### Pattern 3: Detail Screen
```tsx
import { getDealer360DTO } from '../data/dtoSelectors';

function Dealer360View({ dealerId }: { dealerId: string }) {
  const dealer = getDealer360DTO(dealerId);
  
  if (!dealer) return null;
  
  return (
    <div>
      <h1>{dealer.name}</h1>
      
      {/* Metrics */}
      <MetricsCard metrics={dealer.metrics} />
      
      {/* Recent Activity */}
      <ActivitySummary 
        calls={dealer.recentCalls}
        visits={dealer.recentVisits}
      />
      
      {/* DCF Status */}
      <DCFStatusCard status={dealer.dcfStatus} />
    </div>
  );
}
```

### Pattern 4: With Validation (Dev Mode)
```tsx
import { getDealerDTO } from '../data/dtoSelectors';
import { validateDTO, DealerDTOSchema } from '../lib/validate';

function DealerCard({ dealerId }: { dealerId: string }) {
  const dealer = getDealerDTO(dealerId);
  
  // Validate (only runs in dev mode)
  if (dealer) {
    validateDTO('DealerDTO', dealer, DealerDTOSchema);
  }
  
  if (!dealer) return null;
  
  return <div>...</div>;
}
```

### Pattern 5: With Consistency Check (Dev Mode)
```tsx
import { getDealerDTO } from '../data/dtoSelectors';
import { registerMetric } from '../lib/consistencyGuard';

function HomePage({ kamId }: { kamId: string }) {
  const dealers = getKAMDealerDTOs(kamId);
  const totalSI = dealers.reduce((sum, d) => sum + d.metrics.stockIns, 0);
  
  // Register for cross-screen consistency check
  registerMetric('stockIns', 'HomePage', totalSI, 'getDealerDTO');
  
  return <div>SI: {totalSI}</div>;
}
```

---

## 📋 DTO Field Reference

### DealerDTO
```typescript
{
  // Identity
  id: string                    // 'dealer-ncr-001'
  name: string                  // 'Daily Motoz'
  code: string                  // 'DR080433'
  city: string                  // 'Gurugram'
  region: string                // 'NCR'
  segment: 'A' | 'B' | 'C'      
  tags: string[]                // ['Top Dealer']
  status: 'active' | 'dormant' | 'inactive'
  
  // Ownership
  kamId: string                 // 'kam-ncr-01'
  kamName: string               // 'Amit Verma'
  tlId: string                  // 'tl-ncr-01'
  
  // Metrics (pre-calculated)
  metrics: {
    leads: number               // 42
    inspections: number         // 28
    stockIns: number            // 18
    i2si: number                // 21.4% (pre-calculated)
    dcfLeads: number            // 5
    dcfOnboarded: boolean       // true
    dcfDisbursed: number        // 2
    dcfGMV: number              // 850000
  }
  
  // Productivity (pre-calculated)
  productivity: {
    productiveCalls: number           // 12
    nonProductiveCalls: number        // 3
    totalCalls: number                // 15
    productiveCallsPercent: number    // 80%
    productiveVisits: number          // 8
    nonProductiveVisits: number       // 2
    totalVisits: number               // 10
    productiveVisitsPercent: number   // 80%
  }
  
  // Engagement
  lastInteractionAt: Date | null
  daysSinceLastVisit: number    // 2
  daysSinceLastCall: number     // 1
}
```

### CallDTO
```typescript
{
  // Identity
  id: string                    // 'call-1733812800-001'
  callDate: Date
  callTime: string              // '10:30 AM'
  duration: string              // '6m 12s'
  
  // Dealer context
  dealerId: string              // 'dealer-ncr-001'
  dealerName: string            // 'Daily Motoz'
  dealerCode: string            // 'DR080433'
  
  // Ownership
  kamId: string                 // 'kam-ncr-01'
  kamName: string               // 'Amit Verma'
  tlId: string                  // 'tl-ncr-01'
  
  // Outcome
  outcome: 'Connected' | 'No Answer' | 'Busy' | 'Left VM'
  isProductive: boolean         // true
  productivitySource: 'AI' | 'KAM' | 'TL'
  
  // Analysis (optional)
  transcript?: string
  sentimentScore?: number       // 0-100
  sentimentLabel?: 'Positive' | 'Neutral' | 'Negative'
  autoTags?: string[]           // ['pricing_discussion', 'followup_needed']
  
  // Follow-up
  kamComments?: string
  followUpTasks?: string[]
  recordingUrl?: string
}
```

### VisitDTO
```typescript
{
  // Identity
  id: string
  visitDate: Date
  visitTime: string             // '2:30 PM'
  duration: string              // '45m'
  
  // Dealer context
  dealerId: string
  dealerName: string
  dealerCode: string
  
  // Ownership
  kamId: string
  kamName: string
  tlId: string
  
  // Location
  checkInLocation: {
    latitude: number            // 28.4595
    longitude: number           // 77.0266
  }
  checkOutLocation?: {
    latitude: number
    longitude: number
  }
  distanceFromDealer: number    // meters
  isWithinGeofence: boolean     // true
  
  // Outcome
  visitType: 'Planned' | 'Unplanned'
  isProductive: boolean
  productivitySource: 'Geofence' | 'KAM' | 'TL'
  outcomes?: string[]           // ['inventory_discussed', 'payment_collected']
  
  // Follow-up
  kamComments?: string
  followUpTasks?: string[]
}
```

---

## 🔍 Debugging DTOs

### Check if DTO exists
```tsx
const dealer = getDealerDTO(dealerId);
console.log('Dealer:', dealer);
// null if not found
// DealerDTO object if found
```

### Validate DTO structure
```tsx
import { validateDTO, DealerDTOSchema } from '../lib/validate';

const dealer = getDealerDTO(dealerId);
const errors = validateDTO('DealerDTO', dealer, DealerDTOSchema);

if (errors.length > 0) {
  console.error('Validation errors:', errors);
}
```

### Check consistency
```tsx
import { checkAllMetrics } from '../lib/consistencyGuard';

const reports = checkAllMetrics();
console.log('Consistency report:', reports);

const inconsistent = reports.filter(r => !r.isConsistent);
if (inconsistent.length > 0) {
  console.error('Found inconsistencies:', inconsistent);
}
```

---

## ⚠️ Common Mistakes

### Mistake 1: Importing Raw Entities
```tsx
// ❌ WRONG
import { DEALERS } from '../data/mockDatabase';

// Why: Bypasses validation and consistency checks
// Fix: Use getDealerDTO() instead
```

### Mistake 2: Inline Calculations
```tsx
// ❌ WRONG
const i2si = (sis / inspections) * 100;

// Why: Formula might differ across screens
// Fix: Use dealer.metrics.i2si (pre-calculated)
```

### Mistake 3: Calling Engines Directly
```tsx
// ❌ WRONG
import { ProductivityEngine } from '../lib/productivityEngine';
const score = ProductivityEngine.calculateInputScore(...);

// Why: Bypasses DTO layer and validation
// Fix: Use getProductivitySummaryDTO()
```

### Mistake 4: Mutating DTOs
```tsx
// ❌ WRONG
const dealer = getDealerDTO(dealerId);
dealer.metrics.stockIns = 20; // Mutation!

// Why: DTOs are read-only
// Fix: Don't mutate, create new object if needed
```

### Mistake 5: Assuming DTO is Never Null
```tsx
// ❌ WRONG
const dealer = getDealerDTO(dealerId);
return <div>{dealer.name}</div>; // Might crash if null

// Why: DTO returns null if entity not found
// Fix: Check for null first
```

---

## ✅ Checklist for New Components

When creating a new component:

- [ ] Use DTO selectors (never raw entities)
- [ ] Handle null DTOs gracefully
- [ ] Never calculate metrics inline
- [ ] Never call engines directly
- [ ] Add validation in dev mode (optional)
- [ ] Register metrics for consistency (optional)
- [ ] TypeScript types for all props
- [ ] Test with empty/null data

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `/contracts/*.contract.ts` | DTO type definitions |
| `/data/dtoSelectors.ts` | DTO selector functions |
| `/data/selectors.ts` | Raw entity selectors |
| `/lib/validate.ts` | Validation utilities |
| `/lib/consistencyGuard.ts` | Consistency checking |
| `/PROMPT_10_COMPLETE.md` | Full documentation |

---

## 🎓 Learning Path

### Level 1: Basic Usage
1. Read this quick reference
2. Study Pattern 1 (Simple Component)
3. Create a dealer card using `getDealerDTO()`
4. Test with valid and invalid IDs

### Level 2: Advanced Usage
1. Study Pattern 3 (Detail Screen)
2. Use `getDealer360DTO()` for rich data
3. Add validation in dev mode
4. Handle edge cases (null, undefined)

### Level 3: Expert Usage
1. Study validation and consistency code
2. Create custom DTOs for new domains
3. Add new selectors
4. Write DTO tests

---

## 💡 Tips & Tricks

### Tip 1: TypeScript Autocomplete
```tsx
const dealer = getDealerDTO(dealerId);
// Type "dealer." and see all available fields
// TypeScript will show:
//   - dealer.metrics.stockIns
//   - dealer.productivity.productiveCalls
//   - etc.
```

### Tip 2: Destructuring
```tsx
const dealer = getDealerDTO(dealerId);
if (!dealer) return null;

const { name, metrics, productivity } = dealer;
return (
  <div>
    <h1>{name}</h1>
    <p>SI: {metrics.stockIns}</p>
    <p>Calls: {productivity.totalCalls}</p>
  </div>
);
```

### Tip 3: Conditional Rendering
```tsx
const dealer = getDealerDTO(dealerId);
if (!dealer) return <div>Loading...</div>;

return (
  <div>
    {dealer.metrics.dcfOnboarded && (
      <Badge>DCF Onboarded</Badge>
    )}
  </div>
);
```

### Tip 4: Mapping Arrays
```tsx
const dealers = getKAMDealerDTOs(kamId);

return (
  <div>
    {dealers
      .filter(d => d.status === 'active')
      .sort((a, b) => b.metrics.stockIns - a.metrics.stockIns)
      .map(dealer => (
        <DealerCard key={dealer.id} dealer={dealer} />
      ))}
  </div>
);
```

---

## 🐛 Troubleshooting

### Problem: DTO is null
**Solution**: Check if entity exists in mockDatabase
```tsx
const dealer = getDealerDTO('invalid-id');
console.log(dealer); // null

// Fix: Use valid ID like 'dealer-ncr-001'
```

### Problem: TypeScript error "property doesn't exist"
**Solution**: DTO might be null, add null check
```tsx
// ❌ WRONG
const si = dealer.metrics.stockIns;

// ✅ CORRECT
const si = dealer?.metrics.stockIns ?? 0;
```

### Problem: Validation warnings in console
**Solution**: DTO doesn't match schema, check selector
```
🚨 DTO Validation Error: DealerDTO
  ❌ metrics.stockIns: Expected number but got string

// Fix selector to return number, not string
```

### Problem: Numbers don't match across screens
**Solution**: Check consistency guard output
```
⚠️ Metric Mismatch: Stock-Ins

// Use same DTO selector everywhere
// Don't calculate inline
```

---

**Need Help?** Check `/PROMPT_10_COMPLETE.md` for full documentation.
