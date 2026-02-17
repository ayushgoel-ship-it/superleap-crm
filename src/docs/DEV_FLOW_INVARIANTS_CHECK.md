# Dev Flow Invariants - UI Validation Checklist

**Date Created:** February 6, 2026  
**Purpose:** Manual UI validation for each flow invariant from `/docs/10_FLOW_INVARIANTS.md`  
**Type:** Step-by-step checks to verify invariants hold in production  
**Time Estimate:** 20-25 minutes for full validation

---

## How to Use This Checklist

**Before refactor:**
1. Run all checks below
2. All should pass (✅)
3. Document any failures as "known issues" (baseline)

**After refactor:**
1. Run all checks again
2. Compare to baseline
3. **ANY new failure = invariant violated = refactor broke behavior**

**Expected Result:** All invariants pass before AND after refactor.

---

## Invariant Category: Critical Flow Invariants

### ✅ Invariant 1: Dealer → Lead Card Click Opens LeadDetail

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 1

**Statement:** Clicking a lead card from any entry point MUST open LeadDetailPageV2.

**Screens Involved:**
- LeadsPageV3 (`leads` route)
- DealerDetailPageV2 → Leads tab
- DCFLeadsListPage (`dcf-leads` route) ← Exception: opens DCFLeadDetailPage instead

---

#### Test 1.1: From Leads Page
**Action:**
1. Login as KAM
2. Navigate to Leads tab (bottom nav)
3. Click any lead card

**Expected:**
- [ ] LeadDetailPageV2 opens
- [ ] Route changes to `lead-detail`
- [ ] Lead info displayed (customer, dealer, stage, value)
- [ ] Back button present

**Validation:**
- [ ] ✅ PASS: LeadDetailPageV2 opens
- [ ] ❌ FAIL: Different page opens OR route doesn't change

---

#### Test 1.2: From Dealer Detail Leads Tab
**Action:**
1. Navigate to Dealers → Click any dealer
2. Click "Leads" tab in dealer detail
3. Click any lead card in that tab

**Expected:**
- [ ] LeadDetailPageV2 opens (same as Test 1.1)
- [ ] Route changes to `lead-detail`
- [ ] Shows same lead info
- [ ] Back button returns to Dealer Detail (not Leads page)

**Validation:**
- [ ] ✅ PASS: LeadDetailPageV2 opens, back returns to dealer
- [ ] ❌ FAIL: Wrong page opens OR back goes to wrong place

---

#### Test 1.3: From DCF Leads (Exception)
**Action:**
1. Navigate to DCF tab → Leads
2. Click any DCF lead card

**Expected:**
- [ ] DCFLeadDetailPage opens (NOT LeadDetailPageV2)
- [ ] Route changes to `dcf-lead-detail`
- [ ] Shows DCF-specific lead info (loan amount, status)

**Validation:**
- [ ] ✅ PASS: DCFLeadDetailPage opens (correct exception)
- [ ] ❌ FAIL: Opens LeadDetailPageV2 instead (wrong page for DCF)

---

**Invariant 1 Pass Criteria:**
- Tests 1.1 and 1.2: PASS ✅
- Test 1.3: PASS with exception ✅

**Failure Condition:**
- Lead card opens different page
- Route doesn't change
- Back button goes to wrong context
- DCF leads open wrong page

---

## Invariant Category: Critical Flow Invariants

### ✅ Invariant 2: Call Attempt → Feedback Mandatory

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 2

**Statement:** After call attempt, feedback MUST be submitted before another attempt to same dealer.

**Screens Involved:**
- DealerDetailPageV2 (Call Now quick action)
- CallFeedbackPage (`call-feedback` route)
- UnifiedVisitsPage → Calls tab

---

#### Test 2.1: Call Attempt Creates Pending Feedback
**Action:**
1. Navigate to Dealers → Click dealer
2. Click "Call Now" quick action
3. Pre-call screen appears
4. Click "Start Call" (native dialer opens)
5. End call (return to app)

**Expected:**
- [ ] Feedback form appears immediately
- [ ] Route changes to `call-feedback`
- [ ] Form shows: Outcome dropdown, Duration, Notes
- [ ] Cannot exit without submitting

**Validation:**
- [ ] ✅ PASS: Feedback form appears, mandatory
- [ ] ❌ FAIL: Can skip feedback OR form doesn't appear

---

#### Test 2.2: Cannot Call Same Dealer Until Feedback Submitted
**Action:**
1. Make call attempt (Test 2.1)
2. DO NOT submit feedback (if possible)
3. Try to navigate away
4. Try to call same dealer again

**Expected:**
- [ ] Cannot navigate away from feedback form
- [ ] OR: If navigated away, "Call Now" button disabled
- [ ] Shows message: "Complete pending feedback"
- [ ] Cannot make second call attempt

**Validation:**
- [ ] ✅ PASS: Blocked from second call until feedback submitted
- [ ] ❌ FAIL: Can make multiple calls without feedback

---

#### Test 2.3: After Feedback Submitted, Can Call Again
**Action:**
1. Submit feedback from Test 2.1
2. Navigate back to dealer detail
3. Click "Call Now" again (if < 3 total calls today)

**Expected:**
- [ ] "Call Now" button enabled
- [ ] Can make new call attempt
- [ ] Feedback status = SUBMITTED for previous call

**Validation:**
- [ ] ✅ PASS: Can make new call after feedback
- [ ] ❌ FAIL: Button still disabled OR shows wrong state

---

**Invariant 2 Pass Criteria:**
- All 3 tests: PASS ✅

**Failure Condition:**
- Can skip feedback
- Can make multiple calls without feedback
- Button state incorrect
- Feedback not mandatory

---

## Invariant Category: State Machine Invariants

### ✅ Invariant 3: Visit Check-In → Resume → Complete

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 3

**Statement:** Visit has 3 states (NOT_STARTED, CHECKED_IN, COMPLETED). Must check-in before completing.

**Screens Involved:**
- UnifiedVisitsPage (`visits` route)
- VisitCheckInPage (`visit-checkin` route)
- VisitFeedbackPage (`visit-feedback` route)

---

#### Test 3.1: Cannot Complete Without Check-In
**Action:**
1. Navigate to V/C tab → Visits
2. Find visit with status NOT_STARTED
3. Try to click "Complete" (if button exists)

**Expected:**
- [ ] No "Complete" button visible (only "Check-In")
- [ ] OR: "Complete" disabled
- [ ] Cannot complete visit without check-in

**Validation:**
- [ ] ✅ PASS: Cannot complete, must check-in first
- [ ] ❌ FAIL: Can complete without check-in

---

#### Test 3.2: Check-In Changes Status to CHECKED_IN
**Action:**
1. Click visit with NOT_STARTED status
2. Click "Check-In" button
3. Allow geofence check (location permission)
4. (If within 100m) Check-in succeeds

**Expected:**
- [ ] Visit status changes to CHECKED_IN
- [ ] Timer starts (visit duration)
- [ ] "Resume Visit" button appears (or "End Visit")
- [ ] Route changes to `visit-checkin`

**Validation:**
- [ ] ✅ PASS: Status = CHECKED_IN, timer running
- [ ] ❌ FAIL: Status unchanged OR check-in fails incorrectly

---

#### Test 3.3: Resume Visit Keeps CHECKED_IN Status
**Action:**
1. After Test 3.2, close app (or navigate away)
2. Reopen app, go back to Visits
3. Find same visit
4. Click "Resume Visit"

**Expected:**
- [ ] Visit still shows status = CHECKED_IN
- [ ] Timer continues from previous value
- [ ] Route changes to `visit-checkin`
- [ ] Can resume where left off

**Validation:**
- [ ] ✅ PASS: Can resume, timer persists
- [ ] ❌ FAIL: Visit reset to NOT_STARTED OR timer reset

---

#### Test 3.4: Complete Changes Status to COMPLETED
**Action:**
1. In CHECKED_IN visit (Test 3.2 or 3.3)
2. Click "End Visit" button
3. Feedback form appears

**Expected:**
- [ ] Feedback form appears (mandatory)
- [ ] After submit: Visit status = COMPLETED
- [ ] Route changes to `visit-feedback`
- [ ] Cannot edit visit after completion

**Validation:**
- [ ] ✅ PASS: Status = COMPLETED after feedback
- [ ] ❌ FAIL: Can skip feedback OR status not updated

---

**Invariant 3 Pass Criteria:**
- All 4 tests: PASS ✅

**Failure Condition:**
- Can complete without check-in
- Status transitions incorrect
- Timer doesn't persist
- Can skip states

---

## Invariant Category: Critical Flow Invariants

### ✅ Invariant 4: Dealer Activity Entries Link to V/C Detail

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 4

**Statement:** Call/visit entries in dealer detail activity tab MUST open respective detail pages.

**Screens Involved:**
- DealerDetailPageV2 → Activity tab
- CallFeedbackPage OR CallDetailPage
- VisitFeedbackPage OR VisitDetailPage

---

#### Test 4.1: Activity Tab Shows Mixed Call/Visit Entries
**Action:**
1. Navigate to Dealers → Click dealer with calls AND visits
2. Click "Activity" tab

**Expected:**
- [ ] Activity list visible
- [ ] Shows both calls and visits mixed
- [ ] Sorted by date (newest first)
- [ ] Each entry shows: Type icon, Date, Outcome, Notes preview

**Validation:**
- [ ] ✅ PASS: Activity list renders correctly
- [ ] ❌ FAIL: Empty list OR only shows one type OR wrong order

---

#### Test 4.2: Click Call Entry Opens Call Detail
**Action:**
1. In Activity tab (Test 4.1)
2. Click any call entry

**Expected:**
- [ ] Call detail page opens (CallFeedbackPage or CallDetailPage)
- [ ] Shows call info: Date, Outcome, Duration, Notes
- [ ] Route changes to `call-detail` or `call-feedback`
- [ ] Back button returns to Dealer Detail Activity tab

**Validation:**
- [ ] ✅ PASS: Call detail opens, back returns correctly
- [ ] ❌ FAIL: Nothing happens OR wrong page opens OR back goes wrong place

---

#### Test 4.3: Click Visit Entry Opens Visit Detail
**Action:**
1. In Activity tab (Test 4.1)
2. Click any visit entry

**Expected:**
- [ ] Visit detail page opens (VisitFeedbackPage or VisitDetailPage)
- [ ] Shows visit info: Date, Outcome, Duration, Notes
- [ ] Route changes to `visit-detail` or `visit-feedback`
- [ ] Back button returns to Dealer Detail Activity tab

**Validation:**
- [ ] ✅ PASS: Visit detail opens, back returns correctly
- [ ] ❌ FAIL: Nothing happens OR wrong page opens OR back goes wrong place

---

**Invariant 4 Pass Criteria:**
- All 3 tests: PASS ✅

**Failure Condition:**
- Activity list empty when data exists
- Click entry doesn't open detail
- Wrong detail page opens
- Back button goes to wrong context

---

## Invariant Category: State Machine Invariants

### ✅ Invariant 5: DCF Onboarding State Machine

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 5

**Statement:** Dealer can only access DCF loans if `dcfOnboardingStatus = 'APPROVED'`.

**Screens Involved:**
- DealerDetailPageV2 → DCF tab
- DCFOnboardingFlow component (inline in DCF tab)
- DCFDealerOnboardingDetailPage (`dcf-onboarding-detail` route)

**States:** NOT_ONBOARDED → PENDING_DOCS → PENDING_APPROVAL → APPROVED/REJECTED

---

#### Test 5.1: NOT_ONBOARDED Shows Onboarding CTA
**Action:**
1. Navigate to Dealers → Click dealer with `dcfOnboardingStatus = 'NOT_ONBOARDED'`
2. Click "DCF" tab

**Expected:**
- [ ] Shows benefits section (why onboard to DCF)
- [ ] Shows "Start Onboarding" CTA button
- [ ] Does NOT show DCF loans interface
- [ ] Click CTA → Opens onboarding form (PENDING_DOCS state)

**Validation:**
- [ ] ✅ PASS: Shows benefits + CTA, no loans shown
- [ ] ❌ FAIL: Shows loans OR missing CTA

---

#### Test 5.2: PENDING_DOCS Shows Document Upload
**Action:**
1. (If possible) Click "Start Onboarding" from Test 5.1
2. OR: Navigate to dealer with `dcfOnboardingStatus = 'PENDING_DOCS'`

**Expected:**
- [ ] Document upload form visible
- [ ] Shows 6 documents (5 mandatory, 1 optional)
- [ ] Each doc: Checkbox + Upload button
- [ ] Cannot submit without 5 mandatory docs
- [ ] After submit: Status → PENDING_APPROVAL

**Validation:**
- [ ] ✅ PASS: Upload form works, validation enforced
- [ ] ❌ FAIL: Can submit without docs OR form broken

---

#### Test 5.3: PENDING_APPROVAL Shows "Under Review"
**Action:**
1. Navigate to dealer with `dcfOnboardingStatus = 'PENDING_APPROVAL'`
2. Click "DCF" tab

**Expected:**
- [ ] Shows "Under Review" message
- [ ] Shows submission date
- [ ] No action buttons (waiting for approval)
- [ ] Cannot access DCF loans yet

**Validation:**
- [ ] ✅ PASS: Shows review message, no loans
- [ ] ❌ FAIL: Shows loans OR missing message

---

#### Test 5.4: REJECTED Shows Resubmit CTA
**Action:**
1. Navigate to dealer with `dcfOnboardingStatus = 'REJECTED'`
2. Click "DCF" tab

**Expected:**
- [ ] Shows rejection reason
- [ ] Shows "Resubmit Documents" CTA
- [ ] Does NOT show DCF loans
- [ ] Click CTA → Opens document upload (back to PENDING_DOCS)

**Validation:**
- [ ] ✅ PASS: Shows reason + resubmit CTA
- [ ] ❌ FAIL: Shows loans OR missing CTA

---

#### Test 5.5: APPROVED Shows DCF Loans Interface
**Action:**
1. Navigate to dealer with `dcfOnboardingStatus = 'APPROVED'`
2. Click "DCF" tab

**Expected:**
- [ ] Shows DCF loans interface
- [ ] Can create new DCF lead
- [ ] Shows list of DCF leads for this dealer
- [ ] Shows approval date
- [ ] No onboarding flow visible

**Validation:**
- [ ] ✅ PASS: Shows loans interface, fully functional
- [ ] ❌ FAIL: Shows onboarding flow OR loans not accessible

---

**Invariant 5 Pass Criteria:**
- All 5 tests: PASS ✅

**Failure Condition:**
- Wrong UI for current status
- Can access loans before approval
- Status transitions skip states
- Missing CTAs or messages

---

## Invariant Category: Navigation Invariants

### ✅ Invariant 6: Routes Must Be Canonical

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 6

**Statement:** ALL navigation MUST use routes from `ROUTES` constant, no hardcoded paths.

**Screens Involved:** All

**Note:** This is a CODE validation, not UI validation.

---

#### Test 6.1: Code Scan for Hardcoded Paths
**Action:**
1. Run grep command:
   ```bash
   grep -r "'/dealers/" components/
   grep -r "'/leads/" components/
   grep -r "'/admin/" components/
   ```
2. Check results for hardcoded path strings

**Expected:**
- [ ] Zero results (or only in comments/strings)
- [ ] All navigation uses `ROUTES.DEALERS`, `ROUTES.LEADS`, etc.
- [ ] No `navigateTo('/dealers/...')` patterns

**Validation:**
- [ ] ✅ PASS: No hardcoded paths found
- [ ] ❌ FAIL: Found hardcoded paths in navigation code

**Note:** This check is code-level. Can be skipped if code access unavailable, but MUST be run during code review.

---

**Invariant 6 Pass Criteria:**
- Code scan: PASS ✅

**Failure Condition:**
- Any hardcoded path strings in navigation calls

---

## Invariant Category: Navigation Invariants

### ✅ Invariant 7: Role-Based Nav Tabs Unchanged

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 7

**Statement:** Bottom nav tabs for each role MUST match roleConfig.ts. No dynamic changes.

**Screens Involved:** All pages (bottom nav persistent)

---

#### Test 7.1: KAM Bottom Nav Has 5 Tabs
**Action:**
1. Login as KAM
2. Check bottom nav

**Expected:**
- [ ] 5 tabs visible
- [ ] Tab 1: Home (house icon)
- [ ] Tab 2: Dealers (users icon)
- [ ] Tab 3: Leads (file icon)
- [ ] Tab 4: V/C (map pin icon)
- [ ] Tab 5: DCF (rupee icon)
- [ ] No extra tabs, no missing tabs

**Validation:**
- [ ] ✅ PASS: Exactly 5 tabs, correct order
- [ ] ❌ FAIL: Wrong tab count OR wrong order OR wrong icons

---

#### Test 7.2: TL Bottom Nav Has 5 Tabs
**Action:**
1. Login as TL
2. Check bottom nav

**Expected:**
- [ ] 5 tabs visible (same as KAM)
- [ ] Same icons, same order
- [ ] Home, Dealers, Leads, V/C, DCF

**Validation:**
- [ ] ✅ PASS: Exactly 5 tabs, matches KAM
- [ ] ❌ FAIL: Different tabs OR different order

---

#### Test 7.3: Admin Bottom Nav Has 5 Tabs
**Action:**
1. Login as Admin
2. Check bottom nav

**Expected:**
- [ ] 5 tabs visible
- [ ] Tab 1: Home (admin icon)
- [ ] Tab 2: Dealers
- [ ] Tab 3: Leads
- [ ] Tab 4: V/C
- [ ] Tab 5: DCF
- [ ] Routes different (admin routes, not KAM routes)

**Validation:**
- [ ] ✅ PASS: Exactly 5 tabs, admin routes
- [ ] ❌ FAIL: Wrong tab count OR uses KAM routes instead of admin routes

---

**Invariant 7 Pass Criteria:**
- All 3 tests: PASS ✅

**Failure Condition:**
- Tab count ≠ 5 for any role
- Tab order different
- Icons missing or wrong
- Routes wrong for role

---

## Invariant Category: Data Invariants

### ✅ Invariant 8: Selectors Return Non-Null for Valid IDs

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 8

**Statement:** If entity exists, selector MUST return non-null.

**Screens Involved:** All

**Note:** This is partially a CODE validation.

---

#### Test 8.1: Navigate to Existing Dealer
**Action:**
1. Navigate to Dealers list
2. Click any dealer card
3. Dealer detail page opens

**Expected:**
- [ ] Page loads successfully
- [ ] No "Dealer not found" error
- [ ] Dealer data displays correctly

**Validation:**
- [ ] ✅ PASS: Dealer detail loads
- [ ] ❌ FAIL: "Not found" error OR blank page

---

#### Test 8.2: Navigate to Existing Lead
**Action:**
1. Navigate to Leads list
2. Click any lead card
3. Lead detail page opens

**Expected:**
- [ ] Page loads successfully
- [ ] No "Lead not found" error
- [ ] Lead data displays correctly

**Validation:**
- [ ] ✅ PASS: Lead detail loads
- [ ] ❌ FAIL: "Not found" error OR blank page

---

#### Test 8.3: Console Check for Selector Errors
**Action:**
1. Open browser console
2. Navigate through app (dealers, leads, visits, calls)
3. Check for errors like "getDealerById returned null"

**Expected:**
- [ ] Zero selector errors in console
- [ ] No "cannot read property of undefined" errors

**Validation:**
- [ ] ✅ PASS: No selector errors
- [ ] ❌ FAIL: Errors logged for valid entities

---

**Invariant 8 Pass Criteria:**
- All 3 tests: PASS ✅

**Failure Condition:**
- "Not found" errors for existing entities
- Console errors for selectors returning null
- Blank pages when data exists

---

## Invariant Category: Data Invariants

### ✅ Invariant 9: IDs Must Be Canonical Format

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 9

**Statement:** All IDs MUST follow canonical format. Legacy IDs normalized.

**Screens Involved:** All

**Note:** This is a CODE + DATA validation.

---

#### Test 9.1: Check Dealer IDs in UI
**Action:**
1. Navigate to Dealers list
2. Inspect page (browser DevTools)
3. Check `data-dealer-id` attributes or similar

**Expected:**
- [ ] All dealer IDs match format: `dealer-{region}-{seq}`
- [ ] Example: `dealer-ncr-001`, `dealer-west-042`
- [ ] No legacy IDs like `DLR001` or `dealer_1`

**Validation:**
- [ ] ✅ PASS: All IDs canonical format
- [ ] ❌ FAIL: Legacy IDs visible

---

#### Test 9.2: Check Lead IDs in URL
**Action:**
1. Navigate to Lead detail
2. Check browser URL bar
3. Look for lead ID in route

**Expected:**
- [ ] Lead ID format: `lead-{region}-{seq}`
- [ ] Example: `lead-ncr-001`
- [ ] No legacy IDs

**Validation:**
- [ ] ✅ PASS: Canonical format in URL
- [ ] ❌ FAIL: Legacy format in URL

---

**Invariant 9 Pass Criteria:**
- All 2 tests: PASS ✅

**Failure Condition:**
- Any legacy ID format visible in UI or URLs

---

## Invariant Category: Data Invariants

### ✅ Invariant 10: Engine Calculations Return Valid Numbers

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 10

**Statement:** ALL engine calculations MUST return valid numbers (no NaN, no Infinity).

**Screens Involved:** Home, Performance, Admin Home, Incentive Simulator

---

#### Test 10.1: Check Dashboard Metrics for NaN
**Action:**
1. Login as KAM
2. Navigate to Home dashboard
3. Check all metric cards (Stock-ins, I2SI%, Input Score, DCF)

**Expected:**
- [ ] All metrics show numbers (e.g., "42.5%", "85.0", "₹520L")
- [ ] No "NaN" displayed
- [ ] No "Infinity" displayed
- [ ] No blank/empty metric values

**Validation:**
- [ ] ✅ PASS: All metrics valid numbers
- [ ] ❌ FAIL: NaN or Infinity displayed

---

#### Test 10.2: Check Incentive Simulator Calculations
**Action:**
1. Navigate to Incentive Simulator
2. Adjust sliders (Stock-ins, I2SI%, Input Score)
3. Check calculated incentive value

**Expected:**
- [ ] Incentive updates live as sliders move
- [ ] Shows finite number (e.g., "₹45,000")
- [ ] No NaN or Infinity
- [ ] If inputs cause division by zero → Shows 0 or error message (not NaN)

**Validation:**
- [ ] ✅ PASS: Calculations always valid
- [ ] ❌ FAIL: NaN or Infinity displayed

---

**Invariant 10 Pass Criteria:**
- All 2 tests: PASS ✅

**Failure Condition:**
- Any metric shows NaN or Infinity
- Calculations produce invalid numbers

---

## Invariant Category: State Machine Invariants

### ✅ Invariant 11: Visit State Transitions

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 11

**Statement:** Visit state can only transition in valid order.

**Screens Involved:** UnifiedVisitsPage, VisitCheckInPage, VisitFeedbackPage

**Valid Transitions:**
- NOT_STARTED → CHECKED_IN
- CHECKED_IN → CHECKED_IN (resume)
- CHECKED_IN → COMPLETED

**Invalid Transitions:**
- NOT_STARTED → COMPLETED ❌
- COMPLETED → CHECKED_IN ❌

---

#### Test 11.1: Cannot Skip Check-In
**Action:**
1. Find visit with status NOT_STARTED
2. Look for "Complete" or "End Visit" button

**Expected:**
- [ ] Only "Check-In" button visible
- [ ] No "Complete" button
- [ ] Cannot complete without check-in

**Validation:**
- [ ] ✅ PASS: Must check-in first
- [ ] ❌ FAIL: Can complete without check-in

**Note:** Covered by Invariant 3 Test 3.1, but validated here for state machine focus.

---

#### Test 11.2: Cannot Revert Completed Visit
**Action:**
1. Find visit with status COMPLETED
2. Check available actions

**Expected:**
- [ ] No "Check-In" or "Resume" buttons
- [ ] Cannot edit completed visit
- [ ] Cannot change status back to CHECKED_IN
- [ ] Can only view details (read-only)

**Validation:**
- [ ] ✅ PASS: Completed visits read-only
- [ ] ❌ FAIL: Can check-in again or edit

---

**Invariant 11 Pass Criteria:**
- All 2 tests: PASS ✅

**Failure Condition:**
- Can skip states
- Can revert completed visits
- Invalid transitions allowed

---

## Invariant Category: State Machine Invariants

### ✅ Invariant 12: Call Attempt Limit (3 per day)

**Reference:** `/docs/10_FLOW_INVARIANTS.md` → Invariant 12

**Statement:** Max 3 call attempts per dealer per day.

**Screens Involved:** DealerDetailPageV2, UnifiedVisitsPage → Calls tab

---

#### Test 12.1: Make 3 Calls to Same Dealer
**Action:**
1. Navigate to dealer detail
2. Make 1st call attempt (feedback submitted)
3. Make 2nd call attempt (feedback submitted)
4. Make 3rd call attempt (feedback submitted)

**Expected:**
- [ ] All 3 calls succeed
- [ ] Each requires feedback
- [ ] No errors

**Validation:**
- [ ] ✅ PASS: 3 calls allowed
- [ ] ❌ FAIL: Blocked before 3 calls

**Note:** May require fast-forwarding time or test mode.

---

#### Test 12.2: 4th Call Blocked
**Action:**
1. After Test 12.1 (3 calls made today)
2. Try to make 4th call to same dealer

**Expected:**
- [ ] "Call Now" button disabled
- [ ] Shows message: "Maximum 3 attempts per day"
- [ ] Cannot bypass limit
- [ ] Call count visible: "3/3 calls today"

**Validation:**
- [ ] ✅ PASS: 4th call blocked
- [ ] ❌ FAIL: Can make 4+ calls

---

#### Test 12.3: Limit Resets Next Day
**Action:**
1. (If possible) Fast-forward to next day OR wait 24 hours
2. Check same dealer

**Expected:**
- [ ] "Call Now" button enabled
- [ ] Call count reset: "0/3 calls today"
- [ ] Can make new calls

**Validation:**
- [ ] ✅ PASS: Limit resets daily
- [ ] ❌ FAIL: Still blocked next day

**Note:** May require test mode or time manipulation. Can be skipped if not testable.

---

**Invariant 12 Pass Criteria:**
- Tests 12.1 and 12.2: PASS ✅
- Test 12.3: PASS ✅ (or skip if not testable)

**Failure Condition:**
- Can make 4+ calls same day
- Limit doesn't reset
- No error message shown

---

## Summary Checklist

**After running all invariant checks:**

| Invariant | Tests | Pass | Fail | Notes |
|-----------|-------|------|------|-------|
| 1. Lead Navigation | 3 | [ ] | [ ] | _____ |
| 2. Call Feedback Mandatory | 3 | [ ] | [ ] | _____ |
| 3. Visit State Machine | 4 | [ ] | [ ] | _____ |
| 4. Activity Links | 3 | [ ] | [ ] | _____ |
| 5. DCF Onboarding | 5 | [ ] | [ ] | _____ |
| 6. Canonical Routes (code) | 1 | [ ] | [ ] | _____ |
| 7. Role Nav Tabs | 3 | [ ] | [ ] | _____ |
| 8. Selectors Non-Null | 3 | [ ] | [ ] | _____ |
| 9. Canonical IDs | 2 | [ ] | [ ] | _____ |
| 10. Valid Numbers | 2 | [ ] | [ ] | _____ |
| 11. Visit State Transitions | 2 | [ ] | [ ] | _____ |
| 12. Call Attempt Limit | 3 | [ ] | [ ] | _____ |
| **TOTAL** | **34** | **____ / 34** | **____ / 34** | |

---

## Pass Criteria

**Before refactor:**
- Establish baseline (some may fail if features incomplete)
- Document any known failures

**After refactor:**
- ALL previously passing tests MUST still pass
- NO new failures
- **ANY new failure = invariant violated = refactor invalid**

---

## Failure Investigation

**If an invariant check fails:**

**Invariant Number:** ________  
**Test Number:** ________  
**Expected:** ________  
**Actual:** ________  
**Is this new?** Yes / No  
**Caused by refactor?** Yes / No  
**Root cause:** ________  
**Fix required:** ________  

---

## Notes

**Code-Level Checks:**
- Invariant 6 (canonical routes) requires code grep
- Invariant 9 (canonical IDs) partially requires code review
- If code access unavailable, skip and note in summary

**Time-Dependent Checks:**
- Invariant 12.3 (daily limit reset) may require test mode
- If not testable, skip and note

**Baseline Drift:**
- If features are added/removed intentionally, update baseline
- DO NOT update baseline to "fix" a failing refactor check

---

**End of Flow Invariants Check**

**Last Updated:** February 6, 2026  
**Total Invariants:** 12  
**Total Tests:** 34  
**Estimated Time:** 20-25 minutes
