# Dev Smoke Test Checklist

**Date Created:** February 6, 2026  
**Purpose:** Manual verification checklist to prove "no UI/UX/behavior change" after refactors  
**Type:** Step-by-step smoke tests covering all major user flows  
**Time Estimate:** 15-20 minutes for full run

---

## How to Use This Checklist

**Before ANY refactor:**
1. Run this checklist and note any failures (baseline)
2. Document baseline state in `/docs/DEV_READY_BASELINE_SNAPSHOT.md`

**After refactor:**
1. Run this checklist again
2. Compare results to baseline
3. **ANY difference = behavior change = failure**

**Expected Result:** ✅ All checks pass identically before and after refactor

---

## Test Environment Setup

**Prerequisites:**
- [ ] App running: `npm run dev`
- [ ] Browser: Chrome/Edge/Safari (pick one, stay consistent)
- [ ] Clear browser cache if needed
- [ ] Test user credentials ready (KAM, TL, Admin)

**Test Credentials:**
- **KAM:** `kam.north@cars24.com` / `SuperLeap@123`
- **TL:** `tl.north@cars24.com` / `SuperLeap@123`
- **Admin:** `admin.ops@cars24.com` / `SuperLeap@123`

---

## Section 1: Authentication & Profile (3 checks)

### ✅ Check 1.1: Login Screen
**Screen:** Login Page  
**Route:** `auth-login`  
**Action:** Navigate to app root  
**Expected:**
- [ ] Login form visible
- [ ] Email input field present
- [ ] Password input field present
- [ ] "Login" button present
- [ ] CARS24 branding/logo visible

**Failure Condition:** Missing fields, broken layout, wrong route

---

### ✅ Check 1.2: KAM Login Success
**Screen:** Login Page → Home Page  
**Route:** `auth-login` → `home`  
**Action:**
1. Enter KAM credentials
2. Click "Login"

**Expected:**
- [ ] Redirects to Home page (`home` route)
- [ ] Bottom nav shows 5 tabs: Home, Dealers, Leads, V/C, DCF
- [ ] Top bar shows user name + profile icon
- [ ] Dashboard cards visible (Stock-ins, I2SI, etc.)

**Failure Condition:** Wrong route, missing tabs, login error

---

### ✅ Check 1.3: Profile Drawer Access
**Screen:** Any page with top bar  
**Route:** Any (stays on same route)  
**Action:** Click hamburger menu (☰) or profile icon  

**Expected:**
- [ ] Drawer/modal opens from left or top
- [ ] Shows logged-in user name
- [ ] Shows role (KAM/TL/Admin)
- [ ] "Logout" option present
- [ ] (Optional) "View As" section if Admin/TL

**Failure Condition:** Drawer doesn't open, missing user info

---

## Section 2: Dashboard & Metrics (4 checks)

### ✅ Check 2.1: KAM Home Dashboard
**Screen:** Home Page (KAM view)  
**Route:** `home`  
**Action:** Login as KAM, land on home  

**Expected:**
- [ ] "Today's Snapshot" or similar heading
- [ ] Stock-ins metric card (current/target/%)
- [ ] I2SI% metric card
- [ ] Input Score metric card
- [ ] DCF metrics visible (count, value)
- [ ] Visit/Call summary visible
- [ ] Green/Amber/Red color coding on metrics

**Failure Condition:** Missing cards, wrong data format, broken layout

---

### ✅ Check 2.2: Time Period Filter
**Screen:** Home Page  
**Route:** `home`  
**Action:**
1. Find time period selector (Today/D-1/MTD/etc.)
2. Click to change period (e.g., MTD)

**Expected:**
- [ ] Dropdown/selector opens
- [ ] Options visible: Today, D-1, MTD, LMTD, Last Month
- [ ] Click option → Metrics update
- [ ] Selected period shown in UI

**Failure Condition:** Selector broken, metrics don't update

---

### ✅ Check 2.3: TL Home Dashboard
**Screen:** Home Page (TL view)  
**Route:** `home`  
**Action:** Login as TL, land on home  

**Expected:**
- [ ] "Team Performance" or similar heading
- [ ] Aggregated team metrics (all KAMs summed)
- [ ] KAM leaderboard/list visible
- [ ] Can see individual KAM performance
- [ ] Same metric types as KAM (Stock-ins, I2SI, Input Score, DCF)

**Failure Condition:** Shows KAM view instead, missing team data

---

### ✅ Check 2.4: Admin Home Dashboard
**Screen:** Admin Home Page  
**Route:** `admin-home`  
**Action:** Login as Admin, land on admin home  

**Expected:**
- [ ] "Admin Home" or "Business Summary" heading
- [ ] Region selector visible (NCR, West, South, East)
- [ ] Business metrics cards (Stock-ins, DCF, I2SI)
- [ ] TL Leaderboard visible
- [ ] Bottom nav shows 5 Admin tabs

**Failure Condition:** Wrong route, missing admin UI, shows KAM view

---

## Section 3: Dealers List & Search (4 checks)

### ✅ Check 3.1: Dealers Page Load
**Screen:** Dealers Page  
**Route:** `dealers`  
**Action:** Click "Dealers" tab in bottom nav  

**Expected:**
- [ ] List of dealer cards/rows visible
- [ ] Each dealer shows: Name, City, Segment, Last Visit, Stock-ins
- [ ] Search bar at top
- [ ] Filter icons/buttons visible (Segment, City, etc.)
- [ ] Scroll works if many dealers

**Failure Condition:** Empty list (when data exists), broken layout, wrong route

---

### ✅ Check 3.2: Dealer Search
**Screen:** Dealers Page  
**Route:** `dealers`  
**Action:**
1. Click search bar
2. Type dealer name (e.g., "Ram")
3. See results filter

**Expected:**
- [ ] Search input accepts text
- [ ] Results filter as you type
- [ ] Matching dealers appear
- [ ] Non-matching dealers hidden
- [ ] Clear search → All dealers return

**Failure Condition:** Search doesn't filter, results wrong

---

### ✅ Check 3.3: Dealer Segment Filter
**Screen:** Dealers Page  
**Route:** `dealers`  
**Action:**
1. Click segment filter button/chip
2. Select "Premium" (or any segment)
3. See filtered list

**Expected:**
- [ ] Filter modal/dropdown opens
- [ ] Segment options visible (Premium, Mid, Value, etc.)
- [ ] Click option → List filters
- [ ] Only selected segment dealers shown
- [ ] Clear filter → All dealers return

**Failure Condition:** Filter doesn't apply, wrong dealers shown

---

### ✅ Check 3.4: Dealer Sort
**Screen:** Dealers Page  
**Route:** `dealers`  
**Action:** Click sort dropdown/icon (if present)  

**Expected:**
- [ ] Sort options visible (Name A-Z, Last Visit, Stock-ins, etc.)
- [ ] Click option → List re-sorts
- [ ] Visual order changes correctly
- [ ] Sort persists on scroll

**Failure Condition:** Sort doesn't work, list order wrong

**Note:** If no sort UI exists, skip this check and note in baseline.

---

## Section 4: Dealer Detail (5 checks)

### ✅ Check 4.1: Navigate to Dealer Detail
**Screen:** Dealers Page → Dealer Detail Page  
**Route:** `dealers` → `dealers` (with modal) OR new route  
**Action:** Click any dealer card  

**Expected:**
- [ ] Dealer detail page/modal opens
- [ ] Shows dealer name, city, segment at top
- [ ] Tabs visible: Overview, Leads, Activity, DCF, Visits
- [ ] First tab (Overview) selected by default
- [ ] Back button/close icon present

**Failure Condition:** Page doesn't open, wrong dealer shown, missing tabs

---

### ✅ Check 4.2: Dealer Overview Tab
**Screen:** Dealer Detail - Overview Tab  
**Route:** `dealers` (detail view)  
**Action:** Ensure Overview tab selected  

**Expected:**
- [ ] Dealer business metrics (Inspections, Stock-ins, I2SI%)
- [ ] Contact information (phone, address)
- [ ] Quick actions: Call, Visit, Update Location
- [ ] Productivity indicators visible
- [ ] Days since last visit/call shown

**Failure Condition:** Missing metrics, broken layout, no quick actions

---

### ✅ Check 4.3: Dealer Leads Tab
**Screen:** Dealer Detail - Leads Tab  
**Route:** `dealers` (detail view, leads tab)  
**Action:** Click "Leads" tab  

**Expected:**
- [ ] Tab switches to Leads
- [ ] List of leads for this dealer visible
- [ ] Each lead shows: Customer name, Stage, Car model, Value
- [ ] Can click lead card to open lead detail
- [ ] Shows "No leads" message if dealer has zero leads

**Failure Condition:** Wrong leads shown, can't switch tabs, no data

---

### ✅ Check 4.4: Dealer Activity Tab
**Screen:** Dealer Detail - Activity Tab  
**Route:** `dealers` (detail view, activity tab)  
**Action:** Click "Activity" tab  

**Expected:**
- [ ] Activity timeline/list visible
- [ ] Shows calls and visits mixed chronologically
- [ ] Each entry shows: Type icon, Date, Outcome, Notes preview
- [ ] Click call entry → Opens call detail/feedback
- [ ] Click visit entry → Opens visit detail/feedback

**Failure Condition:** No activities shown, can't click entries, wrong order

---

### ✅ Check 4.5: Dealer DCF Tab
**Screen:** Dealer Detail - DCF Tab  
**Route:** `dealers` (detail view, DCF tab)  
**Action:** Click "DCF" tab  

**Expected:**
- [ ] Shows DCF onboarding status (NOT_ONBOARDED, PENDING_DOCS, APPROVED, etc.)
- [ ] If NOT_ONBOARDED: Shows benefits + "Start Onboarding" CTA
- [ ] If APPROVED: Shows DCF leads/loans interface
- [ ] If PENDING: Shows "Under Review" message
- [ ] Appropriate UI for each status

**Failure Condition:** Wrong status shown, CTA doesn't work, empty tab

---

## Section 5: Leads List & Detail (4 checks)

### ✅ Check 5.1: Leads Page Load
**Screen:** Leads Page V3  
**Route:** `leads`  
**Action:** Click "Leads" tab in bottom nav  

**Expected:**
- [ ] List of lead cards visible
- [ ] Each lead shows: Dealer name, Customer name, Stage, Car, Value
- [ ] Stage badges color-coded (New/Contacted/Qualified/Lost/Won)
- [ ] Search bar + filters visible
- [ ] Can scroll through leads

**Failure Condition:** Empty list, wrong layout, wrong route

---

### ✅ Check 5.2: Lead Search by Dealer
**Screen:** Leads Page  
**Route:** `leads`  
**Action:**
1. Click search bar
2. Type dealer name (e.g., "Ram Auto")
3. See filtered leads

**Expected:**
- [ ] Search filters leads by dealer name
- [ ] Matching leads appear
- [ ] Non-matching leads hidden
- [ ] Clear search → All leads return

**Failure Condition:** Search doesn't work, wrong results

---

### ✅ Check 5.3: Lead Stage Filter
**Screen:** Leads Page  
**Route:** `leads`  
**Action:**
1. Click stage filter
2. Select "Qualified" (or any stage)
3. See filtered list

**Expected:**
- [ ] Filter modal/chips visible
- [ ] Stage options: New, Contacted, Qualified, Lost, Won
- [ ] Click option → Only that stage shown
- [ ] Clear filter → All stages return

**Failure Condition:** Filter broken, wrong leads shown

---

### ✅ Check 5.4: Navigate to Lead Detail
**Screen:** Leads Page → Lead Detail Page V2  
**Route:** `leads` → `lead-detail`  
**Action:** Click any lead card  

**Expected:**
- [ ] Lead detail page opens
- [ ] Shows lead info: Dealer, Customer, Car, Stage, Value
- [ ] Lead timeline visible (status changes)
- [ ] Can see lead source, contact info
- [ ] Back button returns to Leads page
- [ ] Route changes to `lead-detail`

**Failure Condition:** Page doesn't open, wrong lead shown, route unchanged

---

## Section 6: Calls & Visits (5 checks)

### ✅ Check 6.1: Unified V/C Page Load
**Screen:** Unified Visits/Calls Page  
**Route:** `visits`  
**Action:** Click "V/C" tab in bottom nav  

**Expected:**
- [ ] Two tabs visible: Visits, Calls
- [ ] Default tab (Visits or Calls) selected
- [ ] List of visits OR calls visible depending on tab
- [ ] Each entry shows: Dealer name, Date, Status, Outcome
- [ ] Can switch between Visits and Calls tabs

**Failure Condition:** Page doesn't load, tabs missing, wrong route

---

### ✅ Check 6.2: Visit Check-In Flow
**Screen:** Unified V/C → Visit Check-In  
**Route:** `visits` → `visit-checkin`  
**Action:**
1. Click any planned visit (status: NOT_STARTED)
2. Click "Check-In" button

**Expected:**
- [ ] Geofence check triggers (location permission requested)
- [ ] If within 100m: Check-in succeeds
- [ ] If outside: Shows "Too far from dealer" error
- [ ] After check-in: Visit status = CHECKED_IN
- [ ] Timer starts (visit duration)
- [ ] Route changes to `visit-checkin`

**Failure Condition:** Check-in fails, timer doesn't start, route unchanged

---

### ✅ Check 6.3: Visit Feedback Mandatory
**Screen:** Visit Check-In → Visit Feedback  
**Route:** `visit-checkin` → `visit-feedback`  
**Action:**
1. Complete visit (click "End Visit")
2. See feedback form

**Expected:**
- [ ] Feedback form appears (mandatory)
- [ ] Fields: Outcome, Notes, Next Steps
- [ ] Submit button enabled only when required fields filled
- [ ] After submit: Visit status = COMPLETED
- [ ] Route changes to `visit-feedback`

**Failure Condition:** Can skip feedback, form broken, status not updated

---

### ✅ Check 6.4: Call Attempt Flow
**Screen:** Dealer Detail → Call Attempt  
**Route:** `dealers` → (dialer opens, then) → `call-feedback`  
**Action:**
1. Open dealer detail
2. Click "Call Now" quick action
3. Native dialer opens

**Expected:**
- [ ] Pre-call screen shows dealer context
- [ ] "Start Call" button triggers native dialer
- [ ] After call (return to app): Feedback form appears
- [ ] Feedback form fields: Outcome, Duration, Notes
- [ ] Cannot call same dealer again until feedback submitted

**Failure Condition:** Dialer doesn't open, feedback skippable, multiple calls allowed

---

### ✅ Check 6.5: Call Attempt Limit (3 per day)
**Screen:** Dealer Detail OR Unified V/C  
**Route:** Any  
**Action:**
1. Make 3 call attempts to same dealer (in test mode)
2. Try 4th call

**Expected:**
- [ ] After 3 calls: "Call Now" button disabled
- [ ] Shows message: "Maximum 3 attempts per day"
- [ ] Cannot bypass limit
- [ ] Next day: Limit resets (can call again)

**Failure Condition:** Can make 4+ calls, no limit enforced

**Note:** May require test mode or date manipulation.

---

## Section 7: DCF Module (3 checks)

### ✅ Check 7.1: DCF Home Page
**Screen:** DCF Home  
**Route:** `dcf`  
**Action:** Click "DCF" tab in bottom nav  

**Expected:**
- [ ] DCF summary cards visible (Total leads, Disbursals, Pending)
- [ ] Three sub-tabs: Dealers, Leads, Disbursals
- [ ] Default tab (Dealers or Leads) selected
- [ ] Can navigate between sub-tabs

**Failure Condition:** Page doesn't load, tabs missing, wrong route

---

### ✅ Check 7.2: DCF Dealer Onboarding Status
**Screen:** DCF Dealers List  
**Route:** `dcf-dealers`  
**Action:** Click "Dealers" tab in DCF section  

**Expected:**
- [ ] List of dealers with DCF status visible
- [ ] Status badges: NOT_ONBOARDED, PENDING_DOCS, PENDING_APPROVAL, APPROVED, REJECTED
- [ ] Color-coded badges (green=approved, amber=pending, red=rejected)
- [ ] Click dealer → Opens DCF dealer detail
- [ ] Filter by status available

**Failure Condition:** Wrong status shown, can't filter, layout broken

---

### ✅ Check 7.3: DCF Lead Detail
**Screen:** DCF Leads List → DCF Lead Detail  
**Route:** `dcf-leads` → `dcf-lead-detail`  
**Action:**
1. Click "Leads" tab in DCF
2. Click any DCF lead card

**Expected:**
- [ ] DCF lead detail opens
- [ ] Shows: Customer, Dealer, Loan amount, Status
- [ ] Shows loan stage (Applied, Approved, Disbursed, Rejected)
- [ ] Shows documents required/submitted
- [ ] Back button returns to DCF Leads

**Failure Condition:** Page doesn't open, wrong data, route unchanged

---

## Section 8: Admin Features (3 checks)

### ✅ Check 8.1: Admin Region Filter
**Screen:** Admin Home  
**Route:** `admin-home`  
**Action:**
1. Login as Admin
2. Click region selector dropdown
3. Select "NCR" (or any region)

**Expected:**
- [ ] Region dropdown shows: All Regions, NCR, West, South, East
- [ ] Click region → Metrics update to show only that region
- [ ] Region chip appears below selector: [NCR ×]
- [ ] Can select multiple regions
- [ ] Clear filter → Shows all regions again

**Failure Condition:** Filter doesn't apply, metrics unchanged

---

### ✅ Check 8.2: Admin TL Leaderboard
**Screen:** Admin Home  
**Route:** `admin-home`  
**Action:** Scroll to TL Leaderboard section  

**Expected:**
- [ ] Leaderboard table visible
- [ ] Shows TL names, regions, metrics (Stock-ins, I2SI, DCF)
- [ ] Sorted by performance (best to worst)
- [ ] Can click TL name → Opens TL detail page
- [ ] Filters by selected region(s)

**Failure Condition:** Leaderboard empty, wrong data, can't click TL

---

### ✅ Check 8.3: Admin Impersonation (View As)
**Screen:** Admin Home → Any page  
**Route:** `admin-home` → (stays same or changes based on impersonation)  
**Action:**
1. Open profile drawer
2. Click "View As" (if present)
3. Select a KAM

**Expected:**
- [ ] Impersonation picker opens
- [ ] Shows list of TLs and KAMs by region
- [ ] Click KAM → UI switches to KAM view
- [ ] Banner appears: "Viewing as [KAM Name] | Real Role: Admin | [Exit]"
- [ ] Bottom nav switches to KAM nav (5 tabs)
- [ ] Click Exit → Returns to Admin view

**Failure Condition:** Impersonation doesn't work, banner missing, nav doesn't switch

**Note:** If "View As" not implemented, skip this check.

---

## Section 9: Incentive & Performance (2 checks)

### ✅ Check 9.1: Incentive Simulator
**Screen:** Incentive Simulator  
**Route:** `incentive-simulator`  
**Action:**
1. Open drawer/menu
2. Navigate to "Incentive Simulator"

**Expected:**
- [ ] Simulator page loads
- [ ] Input fields for: Stock-ins, I2SI%, Input Score, DCF
- [ ] Sliders or text inputs
- [ ] Live calculation as you adjust inputs
- [ ] Shows: Total incentive, Breakup (Quality, Output, OCB), Thresholds

**Failure Condition:** Page doesn't load, calculations wrong, inputs broken

---

### ✅ Check 9.2: Performance Page
**Screen:** Performance Page  
**Route:** `performance`  
**Action:** Navigate to Performance page (via drawer or bottom nav if configured)  

**Expected:**
- [ ] Performance metrics visible (MTD, LMTD, Last Month)
- [ ] Comparison charts (current vs target)
- [ ] Trend graphs if present
- [ ] Shows breakdown by metric type

**Failure Condition:** Page empty, wrong data, charts broken

**Note:** Performance page may be integrated into Home. If so, skip and note in baseline.

---

## Post-Test Checklist

### After Running All Checks
- [ ] Record total passed: _____ / 30
- [ ] Record total failed: _____ / 30
- [ ] Note any skipped checks (and why)
- [ ] Document any unexpected behavior
- [ ] Compare to baseline (if re-test after refactor)

### Pass Criteria
- **Before refactor:** Establish baseline (some checks may fail if features incomplete)
- **After refactor:** MUST match baseline exactly
- **Any new failures = regression = refactor invalid**

---

## Failure Investigation Template

**If a check fails:**

**Check Number:** ________  
**Screen/Route:** ________  
**Expected:** ________  
**Actual:** ________  
**Is this a new failure?** Yes / No  
**Root cause:** ________  
**Fix required:** ________  

---

## Notes

**This checklist is intentionally manual** because:
- Automated tests can miss visual regressions
- Real user flows catch edge cases
- Fast to run (15-20 min)
- No test infrastructure required

**Update this checklist if:**
- New critical flows added
- Routes change (update route names)
- Major features added/removed
- Baseline changes intentionally

**Do NOT update this checklist after refactors** unless functionality legitimately changed.

---

**End of Smoke Test Checklist**

**Last Updated:** February 6, 2026  
**Total Checks:** 30  
**Estimated Time:** 15-20 minutes
