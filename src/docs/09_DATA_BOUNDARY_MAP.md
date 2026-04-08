# Data Boundary Map

**Date:** February 6, 2026  
**Purpose:** Explicit map of data access patterns and centralization status  
**Status:** ✅ ESTABLISHED (Phase 3 complete)

---

## Table of Contents

1. [Data Architecture](#data-architecture)
2. [Where Data Lives](#where-mock-data-lives)
3. [Where Selectors Live](#where-selectors-live)
4. [Which Screens Bypass Selectors](#which-screens-bypass-selectors)
5. [Centralization Status](#centralization-status)
6. [Data Flow Rules](#data-flow-rules)

---

## Data Architecture

### Canonical Flow

```
┌─────────────┐
│   Engines   │  Calculations (metrics, incentives, productivity)
│ (lib/*.ts)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Runtime DB     │  Raw entities (Dealer, Lead, Call, Visit, etc.)
│(runtimeDB.ts)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Selectors  │  Data access functions (getDealerById, etc.)
│(selectors.ts)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│DTO Selectors│  Transform raw → DTOs (contracts)
│(dtoSelectors)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ UI Components│  Consume DTOs only (NEVER raw entities)
│(components/) │
└─────────────┘
```

### Key Principle

**UI components MUST consume DTOs, not raw entities.**

- ✅ `function DealerCard(props: { dealer: DealerDTO })`
- ❌ `function DealerCard(props: { dealer: Dealer })`

---

## Where Data Lives

### Single Source of Truth: `/data/runtimeDB.ts` (Supabase cache)

**Exported Collections:**

| Entity | Collection Name | Example ID |
|--------|-----------------|------------|
| Dealers | `DEALERS` | `dealer-ncr-001` |
| Calls | `CALLS` | `call-1670000000-001` |
| Visits | `VISITS` | `visit-1670000000-001` |
| Leads | `LEADS` | `lead-ncr-001` |
| DCF Leads | `DCF_LEADS` | `dcf-lead-ncr-001` |
| Team Leads | `TEAM_LEADS` | `tl-ncr-01` |
| KAMs | `KAMS` | `kam-ncr-01` |
| Location Requests | `LOCATION_REQUESTS` | `loc-req-001` |

**ID Generation Functions:**
- `makeDealerId(region, seq)` → `dealer-ncr-001`
- `makeKAMId(region, seq)` → `kam-ncr-01`
- `makeTLId(region, seq)` → `tl-ncr-01`
- `makeCallId(timestamp, seq)` → `call-1670000000-001`
- `makeVisitId(timestamp, seq)` → `visit-1670000000-001`
- `makeLeadId(region, seq)` → `lead-ncr-001`

**Legacy ID Mapping:**
- `LEGACY_ID_MAP` - Maps old IDs to canonical format
- `normalizeDealerId(id)` - Converts legacy ID → canonical ID

**Rule:** NEVER import `DEALERS`, `LEADS`, etc. directly in UI components. Use selectors.

---

## Where Selectors Live

### Primary Selectors: `/data/selectors.ts`

**Exported Functions:**

#### Single Entity Access
```typescript
getDealerById(id: string): Dealer | undefined
getLeadById(id: string): Lead | undefined
getCallById(id: string): CallLog | undefined
getVisitById(id: string): VisitLog | undefined
getDCFLeadById(id: string): DCFLead | undefined
getKAMById(id: string): KAM | undefined
getTLById(id: string): TeamLead | undefined
```

#### Filtered Access
```typescript
getDealersByKAM(kamId: string): Dealer[]
getLeadsByDealerId(dealerId: string): Lead[]
getCallsByDealerId(dealerId: string): CallLog[]
getVisitsByDealerId(dealerId: string): VisitLog[]
getDCFLeadsByDealerId(dealerId: string): DCFLead[]
```

#### Related Entity Access
```typescript
getKAMByDealerId(dealerId: string): KAM | undefined
getTLByKAMId(kamId: string): TeamLead | undefined
```

#### Collection Access
```typescript
getAllDealers(): Dealer[]
getAllLeads(): Lead[]
getAllCalls(): CallLog[]
getAllVisits(): VisitLog[]
getAllDCFLeads(): DCFLead[]
```

### DTO Selectors: `/data/dtoSelectors.ts`

**Pattern:**
```typescript
export function getDealerDTO(dealerId: string): DealerDTO | null {
  const dealer = getDealerById(dealerId);
  if (!dealer) return null;
  
  // Transform raw entity → DTO
  return {
    id: dealer.id,
    name: dealer.name,
    // ... map all fields
    metrics: calculateDealerMetrics(dealer), // From engine
    productivity: calculateDealerProductivity(dealer), // From engine
    daysSinceLastVisit: calculateDaysSince(dealer.lastVisit),
  };
}
```

**Rule:** DTO selectors call engines for derived values, selectors for raw data.

### V/C Specific Selectors: `/data/vcSelectors.ts`

**Purpose:** Visit & Call specific queries

**Exported Functions:**
- Visit-specific selectors
- Call-specific selectors
- Cross-entity V/C queries

---

## Which Screens Bypass Selectors

### ✅ Fully Centralized (All screens use selectors)

**Pages using selectors correctly:**
- HomePage.tsx ✅
- DealersPage.tsx ✅
- DealerDetailPageV2.tsx ✅
- LeadsPageV3.tsx ✅
- LeadDetailPageV2.tsx ✅
- DCFPage.tsx ✅
- DCFDealersListPage.tsx ✅
- DCFLeadsListPage.tsx ✅
- DCFLeadDetailPage.tsx ✅
- UnifiedVisitsPage.tsx ✅
- CallFeedbackPage.tsx ✅
- VisitFeedbackPage.tsx ✅
- AdminHomePage.tsx ✅
- AdminWorkspace.tsx ✅

**Status:** ✅ **100% selector usage in major pages**

### ⚠️ Local Mock Data (To be refactored later)

**Files that MAY have inline mock data:**

None identified during Phase 3 scan. All major pages use selectors.

**If found in future:** Document here with:
- File path
- Reason for bypass (e.g., demo page, test data)
- Plan to migrate (or keep as exception)

### 🔒 Intentional Exceptions

**Demo Pages (allowed to have local mocks):**
- LocationUpdateDemoPage.tsx - Demo only, not production
- VisitFeedbackDemo.tsx - Demo only, not production

**Reason:** Demo pages showcase features, don't need full data layer.

---

## Centralization Status

### Phase 3 Achievements ✅

1. **Created Data Boundary Index** (`/data/index.ts`)
   - Single import point for all data concerns
   - Exports: types, runtimeDB, selectors, DTOs
   - Developer documentation inline

2. **Verified Selector Usage**
   - Scanned all major pages
   - Confirmed 100% selector usage in production code
   - No inline `DEALERS.find()` or similar bypasses found

3. **Compatibility Layers (None needed)**
   - No duplicate interfaces found requiring compatibility
   - All pages already using canonical types from `/data/types.ts`
   - No aggressive refactors needed (data layer already clean)

### Deferred Work (Low Priority)

**No major issues found.** Data layer is well-structured.

**Future improvements (optional):**
- Add more DTO selectors for complex transformations
- Add caching layer if performance becomes issue
- Add data validation at selector boundary

---

## Data Flow Rules

### Rule 1: UI Components MUST Consume DTOs

**Correct:**
```typescript
import { DealerDTO } from '@/contracts/dealer.contract';
import { getDealerDTO } from '@/data';

function DealerCard({ dealerId }: { dealerId: string }) {
  const dealer = getDealerDTO(dealerId);
  // dealer is DealerDTO type
}
```

**Incorrect:**
```typescript
import { Dealer } from '@/data/types';
import { getDealerById } from '@/data';

function DealerCard({ dealerId }: { dealerId: string }) {
  const dealer = getDealerById(dealerId);
  // dealer is Dealer type (raw entity, not DTO)
}
```

### Rule 2: ALL Data Access Goes Through Selectors

**Correct:**
```typescript
import { getDealerById } from '@/data';

const dealer = getDealerById(id);
```

**Incorrect:**
```typescript
import { DEALERS } from '@/data/runtimeDB';

const dealer = DEALERS.find(d => d.id === id);
```

### Rule 3: ALL Calculations Go Through Engines

**Correct:**
```typescript
import { calculateI2SI } from '@/lib/metricsEngine';

const i2si = calculateI2SI(inspections, stockIns);
```

**Incorrect:**
```typescript
const i2si = (stockIns / inspections) * 100;
```

### Rule 4: NO Inline Mock Data in UI Components

**Correct:**
```typescript
import { getAllDealers } from '@/data';

const dealers = getAllDealers();
```

**Incorrect:**
```typescript
const dealers = [
  { id: '1', name: 'Dealer 1' },
  { id: '2', name: 'Dealer 2' },
];
```

---

## Centralization Checklist

### Data Layer ✅
- [x] Data cache in `/data/runtimeDB.ts`
- [x] Selectors in `/data/selectors.ts`
- [x] DTO selectors in `/data/dtoSelectors.ts`
- [x] Types in `/data/types.ts`
- [x] Data index in `/data/index.ts`

### Engines ✅
- [x] Metrics engine in `/lib/metricsEngine.ts`
- [x] Incentive engine in `/lib/incentiveEngine.ts`
- [x] Productivity engine in `/lib/productivityEngine.ts`
- [x] Call attempt engine in `/lib/activity/callAttemptEngine.ts`
- [x] Visit engine in `/lib/activity/visitEngine.ts`

### UI Components ✅
- [x] All major pages use selectors
- [x] No inline mock data found
- [x] DTO usage verified

### Navigation ✅
- [x] Routes in `/navigation/routes.ts`
- [x] Role config in `/navigation/roleConfig.ts`
- [x] Navigation helper in `/navigation/navigationHelper.ts`

---

## Quick Reference

### Where to Find Things

| Need | File | Pattern |
|------|------|---------|
| Add data | `/data/supabaseRaw.ts` → `/data/runtimeDB.ts` | Data comes from Supabase |
| Add selector | `/data/selectors.ts` | `export function getXById(id)` |
| Add DTO | `/contracts/*.contract.ts` + `/data/dtoSelectors.ts` | Define interface + selector |
| Add calculation | `/lib/metricsEngine.ts` or `/lib/incentiveEngine.ts` | `export function calculateX()` |
| Add route | `/navigation/routes.ts` | `X: '/path'` |
| Add tab | `/navigation/roleConfig.ts` | Add to bottomNav array |

### Import Patterns

**Correct imports:**
```typescript
// Data access
import { getDealerById } from '@/data';

// Types
import { DealerDTO } from '@/contracts/dealer.contract';

// Engines
import { calculateI2SI } from '@/lib/metricsEngine';

// Routes
import { ROUTES } from '@/navigation/routes';
```

**Incorrect imports:**
```typescript
// DON'T bypass selectors
import { DEALERS } from '@/data/runtimeDB';

// DON'T use raw entities in UI
import { Dealer } from '@/data/types';
```

---

## Violations Detection

**How to check for violations:**

```bash
# Check for direct runtimeDB imports in components/
grep -r "from.*runtimeDB" components/

# Check for inline data arrays in components/
grep -r "const.*=.*\[{.*id:" components/

# Check for inline calculations (harder to detect)
grep -r "/.*100" components/ # Rough heuristic for percentages
```

**Expected:** Zero violations in production code (demo pages excepted)

---

## For More Information

- **Architecture:** `/docs/02_TRD_ARCHITECTURE.md` → Data Flow section
- **Baseline:** `/docs/06_DEV_READY_BASELINE_SNAPSHOT.md`
- **Verification:** `/docs/11_DEV_READY_VERIFICATION.md`

---

**End of Data Boundary Map**

**Status:** ✅ Data layer is centralized and follows architectural rules.  
**No aggressive refactors needed.** System is already well-structured.
