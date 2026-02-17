# Next Steps: Complete Page Migration to Centralized Mock DB

## Already Completed ✅
1. ✅ DealersPage.tsx - Uses `getAllDealers()` from selectors
2. ✅ AdminCallsPage.tsx - Uses `getAllCalls()` from selectors
3. ✅ mockDealerActivity.ts - Uses canonical dealer IDs

## Remaining Pages To Update

### Priority 1: DCFLeadDetailPage.tsx

**Current State**: Uses inline `DCF_LEADS_MOCK_DATA` object

**Required Changes**:
```typescript
// Remove this (lines 56-190):
const DCF_LEADS_MOCK_DATA: Record<string, DCFLeadData> = { ... };

// Replace with:
import { getDCFLeadById } from '../../data/selectors';
import { DCFLead } from '../../data/types';

// In component:
const leadData = getDCFLeadById(loanId);

// Map to component format if needed:
const formattedLead = {
  loan_id: leadData.id,
  customer_name: leadData.customerName,
  customer_phone: leadData.customerPhone,
  pan: leadData.pan,
  // ... etc
};
```

**Impact**: ~135 lines removed, proper dealer references guaranteed

---

### Priority 2: AdminDashboardPage.tsx

**Current State**: Uses inline `mockTLData` array

**Required Changes**:
```typescript
// Remove this (lines 17-130):
const mockTLData: TLData[] = [ ... ];

// Replace with:
import { getAllTLs } from '../../data/selectors';
import { TeamLead } from '../../data/types';

// In component:
const tlData = getAllTLs();

// Note: May need to map to expected format or update component
// to use the canonical TL structure from selectors
```

**Impact**: ~115 lines removed, consistent with adminOrgMock

---

### Priority 3: AdminDealersPage.tsx (admin folder, not main DealersPage)

**Current State**: Uses inline `mockDealers` array

**Required Changes**:
```typescript
// Remove this (lines 28-220):
const mockDealers: Dealer[] = [ ... ];

// Replace with:
import { getAllDealers } from '../../data/selectors';

// In component:
const dealers = getAllDealers();
// Map to component format if interface differs
```

**Impact**: ~190 lines removed

---

### Priority 4: DCF-Related Pages

#### DCFDealersListPage.tsx
```typescript
// Remove inline dealer arrays based on filterType
// Use selectors instead:
import { getAllDealers, getDealersByTag } from '../../data/selectors';

const dealers = filterType === 'onboarded' 
  ? getDealersByTag('DCF Onboarded')
  : getAllDealers();
```

#### DCFPage.tsx & DCFPageTL.tsx
```typescript
// Remove inline dealer arrays
import { getAllDealers } from '../../data/selectors';

const dealers = getAllDealers();
// Apply DCF-specific filters as needed
```

---

## Selector Usage Examples

### Example 1: Get Dealer with Related Data
```typescript
import { getDealerById, getCallsByDealerId, getVisitsByDealerId, getDCFLeadsByDealerId } from '../../data/selectors';

const dealerId = 'dealer-ncr-001';
const dealer = getDealerById(dealerId);
const calls = getCallsByDealerId(dealerId);
const visits = getVisitsByDealerId(dealerId);
const dcfLeads = getDCFLeadsByDealerId(dealerId);
```

### Example 2: Filter Dealers by Criteria
```typescript
import { getDealersByRegion, getDealersByTag, getDealersByStatus } from '../../data/selectors';

const ncrDealers = getDealersByRegion('NCR');
const topDealers = getDealersByTag('Top Dealer');
const activeDealers = getDealersByStatus('active');
```

### Example 3: Get KAM's Dealers
```typescript
import { getDealersByKAM, getKAMById } from '../../data/selectors';

const kamId = 'kam-ncr-01';
const kam = getKAMById(kamId);
const kamDealers = getDealersByKAM(kamId);
```

### Example 4: Legacy ID Support
```typescript
import { getDealerById } from '../../data/selectors';

// Both work! Legacy IDs are transparently normalized
const dealer1 = getDealerById('dealer-ncr-001'); // New format
const dealer2 = getDealerById('DLR001'); // Legacy format - same result!
```

---

## Validation After Each Migration

After updating each page, run validation:

```typescript
import { validateMockDatabase } from './data/validateMockDB';

const result = validateMockDatabase();
console.log('Validation:', result.ok ? 'PASS' : 'FAIL');
if (!result.ok) {
  console.error('Issues:', result.issues);
}
```

---

## Benefits of Completing Migration

### 1. **Zero Inline Mock Data**
- All pages read from single source
- No duplication or drift
- Changes propagate automatically

### 2. **Guaranteed Referential Integrity**
- All foreign keys validated
- No "dealer not found" errors
- Joins always succeed

### 3. **Consistent IDs Everywhere**
- One canonical format
- Legacy support via normalization
- Easy to trace relationships

### 4. **Type Safety**
- Central type definitions
- TypeScript catches mismatches
- Selectors provide typed access

---

## Estimated Impact

### Lines to Remove (Approximate)
- DCFLeadDetailPage.tsx: ~135 lines
- AdminDashboardPage.tsx: ~115 lines
- AdminDealersPage.tsx: ~190 lines
- DCFDealersListPage.tsx: ~40 lines
- DCFPage.tsx: ~30 lines
- DCFPageTL.tsx: ~30 lines

**Total**: ~540 lines of duplicated mock data removed

### Expected Outcome
- ✅ Zero inline mock arrays across entire app
- ✅ All entity IDs unified and validated
- ✅ Single source of truth established
- ✅ Foundation for real backend integration

---

## Testing Checklist (After All Pages Migrated)

- [ ] All dealers load correctly across all pages
- [ ] All calls/visits show correct dealer info
- [ ] DCF leads show correct dealer info
- [ ] Admin dashboard shows correct TL info
- [ ] Dealer 360 views work correctly
- [ ] All filters work correctly
- [ ] Search functionality works
- [ ] No console errors about missing data
- [ ] Validation passes with zero issues

---

## Future Enhancements (Beyond Prompt 8 Scope)

1. **Add More Mock Data**
   - More dealers across regions
   - More calls and visits
   - More DCF leads at various stages

2. **Data Mutation Helpers**
   - `addDealer()`, `updateDealer()`, `deleteDealer()`
   - `addCall()`, `updateCall()`
   - `addVisit()`, `updateVisit()`

3. **Local Storage Persistence**
   - Save changes to localStorage
   - Load on app startup
   - Reset to defaults option

4. **Backend Integration Prep**
   - Make selectors async-ready
   - Add loading states
   - Error handling

5. **Advanced Selectors**
   - `getDealersByMultipleCriteria()`
   - `getTopPerformingDealers()`
   - `getDealersNeedingAttention()`
   - Time-based aggregations

---

## Recommended Approach

1. **Start with DCFLeadDetailPage** (most straightforward)
2. **Then AdminDashboardPage** (moderate complexity)
3. **Then AdminDealersPage** (similar to DealersPage)
4. **Finally DCF-specific pages** (may need custom filters)

Each page should follow the pattern:
1. Remove inline mock data
2. Import selectors and types
3. Load data using selectors
4. Map to component format if needed
5. Test thoroughly
6. Run validation

This will complete the mock data centralization and eliminate all data consistency issues!
