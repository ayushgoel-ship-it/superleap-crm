# Flow Invariants Checklist

**Date:** February 6, 2026  
**Purpose:** Document critical flow invariants that MUST NOT be violated  
**Status:** ✅ ESTABLISHED (Phase 4 complete)

---

## Table of Contents

1. [What Are Flow Invariants](#what-are-flow-invariants)
2. [Critical Flow Invariants](#critical-flow-invariants)
3. [Navigation Invariants](#navigation-invariants)
4. [Data Invariants](#data-invariants)
5. [State Machine Invariants](#state-machine-invariants)
6. [Dev Assertions](#dev-assertions)

---

## What Are Flow Invariants

**Definition:** Invariants are conditions that MUST ALWAYS be true at specific points in a user flow.

**Purpose:**
- Catch bugs early in development
- Document expected behavior
- Prevent regressions
- Guide new developers

**Types:**
1. **Navigation Invariants** - Route transitions must be valid
2. **Data Invariants** - Data must exist before rendering
3. **State Machine Invariants** - States must transition correctly
4. **Business Logic Invariants** - Business rules must hold

---

## Critical Flow Invariants

### Invariant 1: Dealer → Lead Card Click Opens LeadDetail

**Statement:** Clicking a lead card from any entry point (Leads section, Dealer section, DCF section) MUST open LeadDetailPageV2.

**Entry Points:**
1. LeadsPageV3 → Click lead card
2. DealerDetailPageV2 → Leads tab → Click lead card
3. DCFLeadsListPage → Click DCF lead card (opens DCFLeadDetailPage, different page)

**Expected Behavior:**
- Click lead card → `onNavigateToLeadDetail(leadId)` → LeadDetailPageV2 opens
- Back button → Returns to original context (not global leads page)

**Assertion:**
```typescript
import { assertFlowInvariant } from '@/lib/devAssertions';

function onNavigateToLeadDetail(leadId: string) {
  assertFlowInvariant(
    leadId !== null && leadId !== undefined,
    'Lead ID must be defined before navigation',
    { leadId, source: 'DealerDetailPageV2' }
  );
  
  // Navigate to LeadDetailPageV2
}
```

**Verification:**
- [ ] Click lead from Leads section → Opens LeadDetailPageV2
- [ ] Click lead from Dealer section → Opens LeadDetailPageV2
- [ ] Back button from LeadDetailPageV2 → Returns to original section

---

### Invariant 2: Call Attempt → Feedback Mandatory

**Statement:** After a call attempt, feedback form MUST be submitted before creating another attempt to the same dealer.

**Flow:**
1. KAM clicks "Call Now" on dealer
2. Pre-call screen shows dealer context
3. "Start Call" opens native dialer
4. After call ends, KAM MUST submit feedback
5. If KAM tries to call same dealer again without feedback → BLOCKED

**Expected Behavior:**
- Call attempt created → `feedbackStatus = 'PENDING'`
- Feedback submitted → `feedbackStatus = 'SUBMITTED'`
- Next call attempt only allowed if previous has `feedbackStatus = 'SUBMITTED'`

**Assertion:**
```typescript
import { assertFlowInvariant } from '@/lib/devAssertions';
import { canAttemptCall } from '@/lib/activity/callAttemptEngine';

function handleCallAttempt(dealerId: string, kamId: string) {
  const validation = canAttemptCall(dealerId, kamId);
  
  assertFlowInvariant(
    validation.canAttempt,
    `Cannot attempt call: ${validation.reason}`,
    { dealerId, kamId, validation }
  );
  
  // Proceed with call
}
```

**Verification:**
- [ ] Call attempt created → Feedback form appears
- [ ] Try to call same dealer again → Shows "Complete feedback first" message
- [ ] Submit feedback → Can make new call attempt (if < 3 attempts today)

---

### Invariant 3: Visit Check-in → Resume → Complete

**Statement:** Visit has 3 states (NOT_STARTED, CHECKED_IN, COMPLETED). Must check-in before completing.

**State Machine:**
```
NOT_STARTED → (Check-in) → CHECKED_IN → (Complete) → COMPLETED
                                ↓ (Resume)
                          CHECKED_IN (in-progress)
```

**Expected Behavior:**
- Visit starts in `status = 'NOT_STARTED'`
- Check-in successful → `status = 'CHECKED_IN'`
- Can close app and resume → Still `status = 'CHECKED_IN'`
- Complete visit → `status = 'COMPLETED'`

**Assertion:**
```typescript
import { assertFlowInvariant } from '@/lib/devAssertions';

function handleCompleteVisit(visitId: string) {
  const visit = getVisitById(visitId);
  
  assertFlowInvariant(
    visit?.status === 'CHECKED_IN',
    'Cannot complete visit without check-in',
    { visitId, currentStatus: visit?.status }
  );
  
  // Proceed with complete
}
```

**Verification:**
- [ ] Try to complete without check-in → Error
- [ ] Check-in → Close app → Reopen → Shows "Resume Visit"
- [ ] Resume → Timer continues from previous value
- [ ] Complete → Feedback form appears

---

### Invariant 4: Dealer Activity Entries Link to V/C Detail

**Statement:** Call/Visit entries in dealer detail activity tab MUST open respective detail pages with feedback.

**Flow:**
1. Open DealerDetailPageV2 → Activity tab
2. Click call entry → Opens CallFeedbackPage (or CallDetailPage)
3. Click visit entry → Opens VisitFeedbackPage (or VisitDetailPage)

**Expected Behavior:**
- Activity list shows mixed calls and visits sorted by date
- Each item shows type icon (phone/map pin), date, outcome, notes preview
- Click call item → Opens call detail with feedback
- Click visit item → Opens visit detail with feedback
- Back button → Returns to Dealer Detail Activity tab

**Assertion:**
```typescript
import { assertFlowInvariant, assertSelectorReturnsNonNull } from '@/lib/devAssertions';

function handleActivityClick(activityId: string, type: 'call' | 'visit') {
  if (type === 'call') {
    const call = getCallById(activityId);
    assertSelectorReturnsNonNull(call, 'getCallById', activityId);
  } else {
    const visit = getVisitById(activityId);
    assertSelectorReturnsNonNull(visit, 'getVisitById', activityId);
  }
  
  // Navigate to detail page
}
```

**Verification:**
- [ ] Click call entry → Opens call detail page
- [ ] Click visit entry → Opens visit detail page
- [ ] Back button → Returns to dealer detail
- [ ] No "Call/Visit not found" errors

---

### Invariant 5: DCF Onboarding State Machine

**Statement:** Dealer can only access DCF loans if `dcfOnboardingStatus = 'APPROVED'`.

**State Machine:**
```
NOT_ONBOARDED → (Start) → PENDING_DOCS → (Submit) → PENDING_APPROVAL
                                                         ↓ (Approve)
                                                      APPROVED
                                                         ↓ (Reject)
                                                      REJECTED → (Resubmit) → PENDING_DOCS
```

**Expected Behavior:**
- `NOT_ONBOARDED` → Show benefits + "Start Onboarding" CTA
- `PENDING_DOCS` → Show document upload form (6 docs, 5 mandatory)
- `PENDING_APPROVAL` → Show "Under Review" message
- `REJECTED` → Show reason + "Resubmit Documents" CTA
- `APPROVED` → Show DCF loans interface

**Assertion:**
```typescript
import { assertFlowInvariant } from '@/lib/devAssertions';

function handleAccessDCFLoans(dealer: Dealer) {
  assertFlowInvariant(
    dealer.dcfOnboardingStatus === 'APPROVED',
    'Cannot access DCF loans - dealer not approved',
    { dealerId: dealer.id, status: dealer.dcfOnboardingStatus }
  );
  
  // Show DCF loans
}
```

**Verification:**
- [ ] NOT_ONBOARDED state → Shows onboarding flow
- [ ] PENDING_DOCS → Upload documents form appears
- [ ] Submit without mandatory docs → Validation error
- [ ] PENDING_APPROVAL → Shows "Under Review"
- [ ] APPROVED → DCF loans visible

---

## Navigation Invariants

### Invariant 6: Routes Must Be Canonical

**Statement:** ALL navigation MUST use routes from `ROUTES` constant. No hardcoded paths.

**Rule:**
- ✅ `navigateTo(ROUTES.DEALER_DETAIL, { id: dealer.id })`
- ❌ `navigateTo('/dealers/' + dealer.id)`

**Assertion:**
```typescript
import { assertRouteExists } from '@/lib/devAssertions';
import { ROUTES } from '@/navigation/routes';

function navigateTo(routeKey: string, params?: Record<string, string>) {
  assertRouteExists(routeKey, ROUTES);
  
  // Navigate
}
```

**Verification:**
- Grep codebase for hardcoded paths: `grep -r "'/dealers/" components/`
- Expected: Zero hardcoded paths in navigation calls

---

### Invariant 7: Role-Based Nav Tabs Unchanged

**Statement:** Bottom nav tabs for each role MUST match roleConfig.ts. No dynamic tab changes.

**Expected Tabs:**

**KAM:** 5 tabs (Home, Dealers, Leads, V/C, DCF)  
**TL:** 5 tabs (Home, Dealers, Leads, V/C, DCF)  
**Admin:** 5 tabs (Home, Dealers, Leads, V/C, DCF)

**Assertion:**
```typescript
import { assertFlowInvariant } from '@/lib/devAssertions';

function renderBottomNav(role: UserRole, tabs: Tab[]) {
  assertFlowInvariant(
    tabs.length === 5,
    `Expected 5 tabs for ${role}, got ${tabs.length}`,
    { role, tabs }
  );
  
  // Render tabs
}
```

**Verification:**
- [ ] Login as KAM → See 5 tabs
- [ ] Login as TL → See 5 tabs
- [ ] Login as Admin → See 5 tabs
- [ ] Tab order matches roleConfig.ts

---

## Data Invariants

### Invariant 8: Selectors Must Return Non-Null for Valid IDs

**Statement:** If an ID is passed to a selector and that entity exists, selector MUST return non-null.

**Rule:**
- If `dealer.id = 'dealer-ncr-001'` exists in `DEALERS`
- Then `getDealerById('dealer-ncr-001')` MUST return dealer object, not null

**Assertion:**
```typescript
import { assertSelectorReturnsNonNull } from '@/lib/devAssertions';

function renderDealerDetail(dealerId: string) {
  const dealer = getDealerById(dealerId);
  assertSelectorReturnsNonNull(dealer, 'getDealerById', dealerId);
  
  // Render dealer
}
```

**Verification:**
- Test with all entity types (dealer, lead, call, visit, etc.)
- No "Entity not found" errors for valid IDs

---

### Invariant 9: IDs Must Be Canonical Format

**Statement:** All IDs MUST follow canonical format. Legacy IDs must be normalized.

**Canonical Formats:**
- Dealer: `dealer-{region}-{seq}` (e.g., `dealer-ncr-001`)
- KAM: `kam-{region}-{seq}` (e.g., `kam-ncr-01`)
- TL: `tl-{region}-{seq}` (e.g., `tl-ncr-01`)
- Lead: `lead-{region}-{seq}` (e.g., `lead-ncr-001`)
- Call: `call-{timestamp}-{seq}` (e.g., `call-1670000000-001`)
- Visit: `visit-{timestamp}-{seq}` (e.g., `visit-1670000000-001`)

**Assertion:**
```typescript
import { assertCanonicalId } from '@/lib/devAssertions';

function processDealerId(id: string) {
  assertCanonicalId(id, 'dealer');
  
  // Use ID
}
```

**Verification:**
- Grep for legacy IDs: `grep -r "DLR001" components/`
- All should be normalized before use

---

### Invariant 10: Engine Calculations Return Valid Numbers

**Statement:** ALL engine calculations MUST return valid numbers (not NaN, not Infinity).

**Rule:**
- `calculateI2SI()` returns finite number
- `calculateInputScore()` returns finite number 0-100
- `calculateKAMIncentive()` returns finite number ≥ 0

**Assertion:**
```typescript
import { assertValidNumber } from '@/lib/devAssertions';

function calculateI2SI(inspections: number, stockIns: number): number {
  const result = (stockIns / inspections) * 100;
  assertValidNumber(result, 'calculateI2SI');
  return result;
}
```

**Verification:**
- Test edge cases (zero inspections, zero stock-ins)
- No NaN or Infinity in UI displays

---

## State Machine Invariants

### Invariant 11: Visit State Transitions

**Statement:** Visit state can only transition in this order: NOT_STARTED → CHECKED_IN → COMPLETED.

**Valid Transitions:**
- `NOT_STARTED` → `CHECKED_IN` (check-in)
- `CHECKED_IN` → `CHECKED_IN` (resume)
- `CHECKED_IN` → `COMPLETED` (complete)

**Invalid Transitions:**
- `NOT_STARTED` → `COMPLETED` ❌
- `COMPLETED` → `CHECKED_IN` ❌

**Assertion:**
```typescript
import { assertFlowInvariant } from '@/lib/devAssertions';

function transitionVisitState(visit: Visit, newState: VisitStatus) {
  const validTransitions: Record<VisitStatus, VisitStatus[]> = {
    NOT_STARTED: ['CHECKED_IN'],
    CHECKED_IN: ['CHECKED_IN', 'COMPLETED'],
    COMPLETED: [], // No transitions from completed
  };
  
  const allowed = validTransitions[visit.status] || [];
  assertFlowInvariant(
    allowed.includes(newState),
    `Invalid visit state transition: ${visit.status} → ${newState}`,
    { visitId: visit.id, currentState: visit.status, newState }
  );
  
  // Update state
}
```

**Verification:**
- Try to complete without check-in → Blocked
- Try to revert completed visit → Blocked

---

### Invariant 12: Call Attempt Limit

**Statement:** Max 3 call attempts per dealer per day. Cannot exceed this limit.

**Rule:**
- Count today's calls to dealer
- If count ≥ 3 → Block new attempt

**Assertion:**
```typescript
import { assertFlowInvariant } from '@/lib/devAssertions';

function attemptCall(dealerId: string, kamId: string) {
  const today = new Date().toISOString().split('T')[0];
  const todayCalls = getCallsByDealerId(dealerId).filter(c => c.callDate.startsWith(today));
  
  assertFlowInvariant(
    todayCalls.length < 3,
    'Maximum 3 call attempts per dealer per day',
    { dealerId, todayCallsCount: todayCalls.length }
  );
  
  // Create call attempt
}
```

**Verification:**
- Make 3 calls to same dealer
- Try 4th call → Shows "Maximum attempts reached" message

---

## Dev Assertions

### How to Use Dev Assertions

**Import:**
```typescript
import {
  assertFlowInvariant,
  assertSelectorReturnsNonNull,
  assertRouteExists,
  assertCanonicalId,
  assertValidNumber,
} from '@/lib/devAssertions';
```

**Usage Examples:**

**1. Route Navigation:**
```typescript
assertRouteExists('DEALER_DETAIL', ROUTES);
navigateTo(ROUTES.DEALER_DETAIL, { id: dealer.id });
```

**2. Selector Calls:**
```typescript
const dealer = getDealerById(dealerId);
assertSelectorReturnsNonNull(dealer, 'getDealerById', dealerId);
```

**3. Business Logic:**
```typescript
assertFlowInvariant(
  inputScore >= 75,
  'Input Score must be ≥75 for incentive eligibility',
  { inputScore, kamId }
);
```

**4. ID Validation:**
```typescript
assertCanonicalId(dealerId, 'dealer');
```

**5. Calculation Results:**
```typescript
const i2si = calculateI2SI(inspections, stockIns);
assertValidNumber(i2si, 'I2SI%');
```

---

## Production Impact

**All assertions are NO-OP in production:**
- Wrapped in `if (!IS_DEV) return;` checks
- Tree-shaken out of production builds
- Zero runtime cost
- Zero bundle size impact

**Verification:**
```bash
npm run build
# Check bundle - assertions should be removed
```

---

## Checklist for New Flows

When adding a new flow, document invariants:

- [ ] **Navigation:** What routes are valid transitions?
- [ ] **Data:** What data must exist before rendering?
- [ ] **State:** What states are valid? What transitions are allowed?
- [ ] **Business Logic:** What rules MUST hold?
- [ ] **Edge Cases:** What happens if data is missing/invalid?

**Then add dev assertions** to catch violations early.

---

## For More Information

- **Dev Assertions:** `/lib/devAssertions.ts`
- **Data Flow:** `/docs/09_DATA_BOUNDARY_MAP.md`
- **QA Runbook:** `/docs/03_QA_RUNBOOK.md` → Critical Flows
- **Architecture:** `/docs/02_TRD_ARCHITECTURE.md`

---

**End of Flow Invariants Checklist**

**Status:** ✅ Documented. Dev assertions available.  
**Production Impact:** ZERO (assertions are dev-only).
