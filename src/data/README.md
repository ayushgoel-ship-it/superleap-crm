# Centralized Mock Database - Quick Reference

## Overview

This directory contains the centralized mock database for the SuperLeap CRM application. All mock data is stored here, ensuring consistency and referential integrity across the application.

## File Structure

```
/data/
├── types.ts           # Central type definitions
├── mockDatabase.ts    # Single source of truth for all mock data
├── selectors.ts       # Query API for accessing data
├── validateMockDB.ts  # Validation and integrity checks
├── testValidation.ts  # Quick validation test script
└── README.md          # This file
```

## Quick Start

### Importing Data

```typescript
// Import selectors
import { 
  getAllDealers, 
  getDealerById, 
  getCallsByDealerId 
} from '../../data/selectors';

// Import types
import { Dealer, CallLog, DCFLead } from '../../data/types';
```

### Basic Usage

```typescript
// Get all dealers
const dealers = getAllDealers();

// Get a specific dealer
const dealer = getDealerById('dealer-ncr-001');

// Get dealer's calls
const calls = getCallsByDealerId('dealer-ncr-001');

// Search dealers
const results = searchDealers('Gupta');
```

## ID Formats

### Canonical IDs
- **Dealer**: `dealer-<region>-<3digit>` (e.g., `dealer-ncr-001`)
- **TL**: `tl-<region>-<2digit>` (e.g., `tl-ncr-01`)
- **KAM**: `kam-<region>-<2digit>` (e.g., `kam-ncr-01`)
- **Call**: `call-<timestamp>-<seq>` (e.g., `call-20241212-001`)
- **Visit**: `visit-<timestamp>-<seq>` (e.g., `visit-20241212-001`)

### Legacy ID Support
Old IDs are automatically converted:
- `DLR001` → `dealer-ncr-001`
- `tl1` → `tl-ncr-01`
- `kam1` → `kam-ncr-01`

## Available Selectors

### Dealer Selectors
```typescript
getDealerById(id: string): Dealer | undefined
getDealerByCode(code: string): Dealer | undefined
getAllDealers(): Dealer[]
getDealersByRegion(region: RegionKey): Dealer[]
getDealersByKAM(kamId: string): Dealer[]
getDealersByTL(tlId: string): Dealer[]
searchDealers(query: string): Dealer[]
getDealersByStatus(status: 'active' | 'dormant' | 'inactive'): Dealer[]
getDealersBySegment(segment: 'A' | 'B' | 'C'): Dealer[]
getDealersByTag(tag: string): Dealer[]
```

### Call Selectors
```typescript
getCallById(id: string): CallLog | undefined
getAllCalls(): CallLog[]
getCallsByDealerId(dealerId: string): CallLog[]
getCallsByKAM(kamId: string): CallLog[]
getCallsByTL(tlId: string): CallLog[]
getCallsByDateRange(startDate: string, endDate: string): CallLog[]
getProductiveCalls(): CallLog[]
getUnproductiveCalls(): CallLog[]
```

### Visit Selectors
```typescript
getVisitById(id: string): VisitLog | undefined
getAllVisits(): VisitLog[]
getVisitsByDealerId(dealerId: string): VisitLog[]
getVisitsByKAM(kamId: string): VisitLog[]
getVisitsByTL(tlId: string): VisitLog[]
getVisitsByDateRange(startDate: string, endDate: string): VisitLog[]
getProductiveVisits(): VisitLog[]
getUnproductiveVisits(): VisitLog[]
```

### DCF Lead Selectors
```typescript
getDCFLeadById(id: string): DCFLead | undefined
getAllDCFLeads(): DCFLead[]
getDCFLeadsByDealerId(dealerId: string): DCFLead[]
getDCFLeadsByKAM(kamId: string): DCFLead[]
getDCFLeadsByTL(tlId: string): DCFLead[]
getDCFLeadsByStatus(ragStatus: 'green' | 'amber' | 'red'): DCFLead[]
getDCFLeadsByFunnel(funnel: string): DCFLead[]
getDisbursedDCFLeads(): DCFLead[]
searchDCFLeads(query: string): DCFLead[]
```

### Organization Selectors
```typescript
getAllTLs(): TeamLead[]
getTLById(id: string): TeamLead | undefined
getTLsByRegion(region: RegionKey): TeamLead[]
getAllKAMs(): KAM[]
getKAMById(id: string): KAM | undefined
getKAMsByTL(tlId: string): KAM[]
getKAMsByRegion(region: RegionKey): KAM[]
getAllRegions(): RegionKey[]
```

### Aggregation Helpers
```typescript
getDealerMetrics(dealerId: string): {
  dealer: Dealer;
  totalCalls: number;
  productiveCalls: number;
  totalVisits: number;
  productiveVisits: number;
  totalDCFLeads: number;
  disbursedDCFLeads: number;
} | null

getKAMMetrics(kamId: string): {
  kam: KAM;
  totalDealers: number;
  activeDealers: number;
  totalCalls: number;
  productiveCalls: number;
  totalVisits: number;
  productiveVisits: number;
  totalDCFLeads: number;
  disbursedDCFLeads: number;
} | null

getTLMetrics(tlId: string): {
  tl: TeamLead;
  totalDealers: number;
  activeDealers: number;
  totalCalls: number;
  productiveCalls: number;
  totalVisits: number;
  productiveVisits: number;
  totalDCFLeads: number;
  disbursedDCFLeads: number;
} | null
```

## Common Patterns

### Pattern 1: Display Dealer with Related Data
```typescript
import { getDealerById, getCallsByDealerId, getVisitsByDealerId } from '../../data/selectors';

function DealerDetailView({ dealerId }: { dealerId: string }) {
  const dealer = getDealerById(dealerId);
  const calls = getCallsByDealerId(dealerId);
  const visits = getVisitsByDealerId(dealerId);
  
  if (!dealer) return <div>Dealer not found</div>;
  
  return (
    <div>
      <h1>{dealer.name}</h1>
      <p>Calls: {calls.length}</p>
      <p>Visits: {visits.length}</p>
    </div>
  );
}
```

### Pattern 2: Filter and Display
```typescript
import { getDealersByRegion, getDealersByTag } from '../../data/selectors';

function DealerList() {
  const ncrDealers = getDealersByRegion('NCR');
  const topDealers = getDealersByTag('Top Dealer');
  
  // Intersection: Top dealers in NCR
  const topNcrDealers = ncrDealers.filter(d => 
    topDealers.some(t => t.id === d.id)
  );
  
  return <div>{/* render dealers */}</div>;
}
```

### Pattern 3: Aggregated Metrics
```typescript
import { getDealerMetrics } from '../../data/selectors';

function DealerMetricsCard({ dealerId }: { dealerId: string }) {
  const metrics = getDealerMetrics(dealerId);
  
  if (!metrics) return null;
  
  const productivityRate = metrics.totalCalls > 0
    ? (metrics.productiveCalls / metrics.totalCalls * 100).toFixed(1)
    : '0';
  
  return (
    <div>
      <h2>{metrics.dealer.name}</h2>
      <p>Calls: {metrics.totalCalls}</p>
      <p>Productive: {productivityRate}%</p>
    </div>
  );
}
```

### Pattern 4: Legacy ID Compatibility
```typescript
import { getDealerById, normalizeDealerId } from '../../data/selectors';

// Both work!
const dealer1 = getDealerById('dealer-ncr-001'); // New format
const dealer2 = getDealerById('DLR001'); // Legacy format

// Explicit normalization
const canonicalId = normalizeDealerId('DLR001'); // Returns: 'dealer-ncr-001'
```

## Validation

### Run Validation
```typescript
import { validateMockDatabase, runValidation } from '../../data/validateMockDB';

// Option 1: Get results programmatically
const result = validateMockDatabase();
if (!result.ok) {
  console.error('Validation failed:', result.issues);
}

// Option 2: Log to console
runValidation();
```

### Validation Checks
- ✅ No duplicate IDs
- ✅ All foreign keys valid
- ✅ All names consistent
- ✅ Canonical ID format enforced
- ✅ No legacy IDs in active data

## Adding New Mock Data

### Add a New Dealer
Edit `/data/mockDatabase.ts`:

```typescript
export const DEALERS: Dealer[] = [
  // ... existing dealers
  {
    id: makeDealerId('ncr', 8), // dealer-ncr-008
    name: 'New Dealer Name',
    code: 'NEW-001',
    city: 'Noida',
    region: 'NCR',
    kamId: makeKAMId('ncr', 1), // kam-ncr-01
    kamName: 'Amit Verma',
    tlId: makeTLId('ncr', 1), // tl-ncr-01
    lastVisit: 'Today',
    lastContact: '1 hour ago',
    lastVisitDaysAgo: 0,
    lastContactDaysAgo: 0,
    metrics: {
      mtd: { leads: 10, inspections: 5, sis: 2, dcf: 1 },
      // ... other time ranges
    },
    tags: ['Tagged Dealer'],
    segment: 'B',
    status: 'active',
  },
];
```

### Add a New Call
```typescript
export const CALLS: CallLog[] = [
  // ... existing calls
  {
    id: makeCallId(Date.now(), 6), // call-<timestamp>-006
    dealerId: makeDealerId('ncr', 1), // Reference existing dealer
    dealerName: 'Daily Motoz', // Must match dealer name
    dealerCode: 'DR080433', // Must match dealer code
    callDate: '2024-12-12',
    callTime: '02:00 PM',
    duration: '5m 30s',
    kamId: makeKAMId('ncr', 1),
    kamName: 'Amit Verma',
    tlId: makeTLId('ncr', 1),
    outcome: 'Connected',
    isProductive: true,
    productivitySource: 'AI',
    // ... other fields
  },
];
```

## Best Practices

### ✅ DO
- Use selectors to access data
- Normalize legacy IDs when needed
- Run validation after changes
- Keep referential integrity
- Use canonical ID formats

### ❌ DON'T
- Define inline mock data in components
- Hardcode dealer IDs (use helpers)
- Skip validation after changes
- Create orphaned records (foreign keys must exist)
- Use legacy ID formats in new code

## Troubleshooting

### "Dealer not found" Error
```typescript
// Check if ID needs normalization
import { getDealerById, normalizeDealerId } from '../../data/selectors';

const dealerId = 'DLR001'; // Legacy format
const normalizedId = normalizeDealerId(dealerId);
console.log('Normalized ID:', normalizedId); // dealer-ncr-001

const dealer = getDealerById(dealerId); // Works with both formats
```

### Validation Failures
```typescript
import { runValidation } from '../../data/validateMockDB';

runValidation();
// Check console for specific issues:
// - Duplicate IDs
// - Missing foreign keys
// - Name mismatches
// - Invalid ID formats
```

### Type Mismatches
```typescript
// Always import types from central location
import { Dealer, CallLog, DCFLead } from '../../data/types';

// Don't define local interfaces that duplicate central types
```

## Support

For issues or questions:
1. Check this README
2. Review `/PROMPT_8_COMPLETE.md`
3. Check `/NEXT_STEPS_FOR_REMAINING_PAGES.md`
4. Run validation to diagnose issues

## Version History

- **v1.0** (Prompt 8) - Initial centralized mock database
  - 10 dealers across NCR, West, South
  - 5 call logs
  - 2 visit logs
  - 3 DCF leads
  - Complete organization structure
  - Validation framework
  - Legacy ID support
