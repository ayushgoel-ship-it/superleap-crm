# Data Layer - Quick Reference

## Overview

This directory contains the data access layer for the SuperLeap CRM application. Data is fetched from Supabase, cached in a runtime database, and accessed through selectors and metrics modules.

## File Structure

```
/data/
├── adminFilterHelpers.ts    # Admin-specific filter utilities
├── adminOrgData.ts          # Admin org data accessors
├── canonicalMetrics.ts      # Stage classification, DCF metrics, deriveDealerActivityStage()
├── configFromDB.ts          # Config accessor from runtimeDB
├── dtoSelectors.ts          # DTO contract enforcement
├── idUtils.ts               # Canonical ID generation and normalization
├── index.ts                 # Single import point for all data concerns
├── runtimeDB.ts             # Supabase data cache (loadRuntimeDB / getRuntimeDBSync)
├── selectors.ts             # Convenience selectors over runtimeDB
├── supabaseRaw.ts           # Raw Supabase fetch layer
├── types.ts                 # Central type definitions
├── vcSelectors.ts           # Visit/Call specific selectors
├── visitTypes.ts            # Visit-specific type definitions
├── adapters/
│   ├── dcfAdapter.ts        # DCF data adapter
│   └── leadAdapter.ts       # Lead data adapter
└── README.md                # This file
```

## Architecture

```
Supabase (remote)
    │
    ▼
supabaseRaw.ts        — raw fetch layer (queries Supabase tables)
    │
    ▼
runtimeDB.ts          — loadRuntimeDB() fetches & caches; getRuntimeDBSync() returns cache
    │
    ▼
selectors.ts          — convenience accessors (getDealerById, getAllDealers, etc.)
canonicalMetrics.ts   — deriveDealerActivityStage(), DCF metrics
    │
    ▼
dtoSelectors.ts       — transforms raw entities → DTOs for UI consumption
    │
    ▼
UI Components         — consume DTOs only
```

### Key Functions

- **`loadRuntimeDB()`** — Fetches all data from Supabase and caches it. Called once at app startup.
- **`getRuntimeDBSync()`** — Returns the cached data synchronously. Used by all selectors.
- **`deriveDealerActivityStage(dealer)`** — Computes the 4-tier activity stage from activity data:
  - **Transacting** — Active deals/stock-ins
  - **Inspecting** — Inspections happening, no stock-ins yet
  - **Lead Giving** — Sharing leads but no inspections
  - **Dormant** — No meaningful activity

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

// Import canonical metrics
import { deriveDealerActivityStage } from '../../data/canonicalMetrics';
```

### Basic Usage

```typescript
// Get all dealers
const dealers = getAllDealers();

// Get a specific dealer
const dealer = getDealerById('dealer-ncr-001');

// Get dealer's calls
const calls = getCallsByDealerId('dealer-ncr-001');

// Compute dealer activity stage
const stage = deriveDealerActivityStage(dealer);
// Returns: 'Transacting' | 'Inspecting' | 'Lead Giving' | 'Dormant'
```

## ID Formats

### Canonical IDs
- **Dealer**: `dealer-<region>-<3digit>` (e.g., `dealer-ncr-001`)
- **TL**: `tl-<region>-<2digit>` (e.g., `tl-ncr-01`)
- **KAM**: `kam-<region>-<2digit>` (e.g., `kam-ncr-01`)
- **Call**: `call-<timestamp>-<seq>` (e.g., `call-20241212-001`)
- **Visit**: `visit-<timestamp>-<seq>` (e.g., `visit-20241212-001`)

### Legacy ID Support
Old IDs are automatically converted via `idUtils.ts`:
- `DLR001` -> `dealer-ncr-001`
- `tl1` -> `tl-ncr-01`
- `kam1` -> `kam-ncr-01`

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
getDealersBySegment(segment: 'A' | 'B' | 'C'): Dealer[]
getDealersByTag(tag: string): Dealer[]
```

### Call Selectors
```typescript
getCallById(id: string): CallLog | undefined
getAllCalls(): CallLog[]
getCallsByDealerId(dealerId: string): CallLog[]
getCallsByKAM(kamId: string): CallLog[]
getCallsByDateRange(startDate: string, endDate: string): CallLog[]
```

### Visit Selectors
```typescript
getVisitById(id: string): VisitLog | undefined
getAllVisits(): VisitLog[]
getVisitsByDealerId(dealerId: string): VisitLog[]
getVisitsByKAM(kamId: string): VisitLog[]
getVisitsByDateRange(startDate: string, endDate: string): VisitLog[]
```

### DCF Lead Selectors
```typescript
getDCFLeadById(id: string): DCFLead | undefined
getAllDCFLeads(): DCFLead[]
getDCFLeadsByDealerId(dealerId: string): DCFLead[]
getDCFLeadsByStatus(ragStatus: 'green' | 'amber' | 'red'): DCFLead[]
getDCFLeadsByFunnel(funnel: string): DCFLead[]
```

### Organization Selectors
```typescript
getAllTLs(): TeamLead[]
getTLById(id: string): TeamLead | undefined
getAllKAMs(): KAM[]
getKAMById(id: string): KAM | undefined
getKAMsByTL(tlId: string): KAM[]
```

## Best Practices

### DO
- Use selectors to access data (never import runtimeDB directly in components)
- Use `deriveDealerActivityStage()` for dealer dormancy classification
- Normalize legacy IDs when needed via `idUtils.ts`
- Use canonical ID formats in new code

### DON'T
- Import `runtimeDB` directly in UI components
- Define inline mock data in components
- Hardcode dealer IDs (use helpers from `idUtils.ts`)
- Use legacy ID formats in new code
- Compute dormancy status manually (use `deriveDealerActivityStage()`)

## Troubleshooting

### "Dealer not found" Error
```typescript
import { getDealerById } from '../../data/selectors';
import { normalizeDealerId } from '../../data/idUtils';

const dealerId = 'DLR001'; // Legacy format
const normalizedId = normalizeDealerId(dealerId);
const dealer = getDealerById(normalizedId);
```

### Type Mismatches
```typescript
// Always import types from central location
import { Dealer, CallLog, DCFLead } from '../../data/types';
```

### Data Not Loading
Ensure `loadRuntimeDB()` has been called at app startup (typically in the root App component or a data provider). `getRuntimeDBSync()` returns empty data if the cache has not been populated.
