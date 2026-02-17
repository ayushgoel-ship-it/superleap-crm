# Dev-Ready Baseline Snapshot

**Baseline Date:** February 6, 2026, 14:30 UTC  
**Purpose:** Immutable snapshot of current state for future refactor verification  
**Status:** 🔒 FROZEN - Do not modify after creation

---

## How to Use This Snapshot

**Purpose:** This document captures the EXACT state of the app at this moment.

**Before ANY refactor:**
1. Review this snapshot
2. Run `/docs/DEV_SMOKE_CHECKLIST.md` and note baseline results
3. Run `/docs/DEV_FLOW_INVARIANTS_CHECK.md` and verify all pass

**After refactor:**
1. Run smoke tests + invariant checks again
2. Compare results to this baseline
3. **ANY difference in routes/pages/flows = FAILURE**

**Golden Rule:** If this snapshot says a route exists or a page is active, it MUST still exist/be active after refactor.

---

## Route Constants & Paths

**Source:** `/navigation/routes.ts` + `/lib/domain/constants.ts`

**Total Routes:** 33

### Auth Routes (2)
1. `AUTH_LOGIN` → `auth-login`
2. `AUTH_FORGOT_PASSWORD` → `auth-forgot-password`

### Profile Routes (2)
3. `PROFILE` → `profile`
4. `PROFILE_COMPLETE` → `profile-complete`

### KAM/TL Core Routes (10)
5. `HOME` → `home`
6. `DEALERS` → `dealers`
7. `LEADS` → `leads`
8. `LEAD_DETAIL` → `lead-detail`
9. `VISITS` → `visits`
10. `VISIT_DETAIL` → `visit-detail`
11. `CALL_DETAIL` → `call-detail`
12. `TL_CALL_DETAIL` → `tl-call-detail`
13. `NOTIFICATIONS` → `notifications`
14. `PERFORMANCE` → `performance`

### Productivity & Incentive Routes (3)
15. `PRODUCTIVITY` → `productivity`
16. `LEADERBOARD` → `leaderboard`
17. `INCENTIVE_SIMULATOR` → `incentive-simulator`

### Feedback & Check-In Routes (3)
18. `CALL_FEEDBACK` → `call-feedback`
19. `VISIT_FEEDBACK` → `visit-feedback`
20. `VISIT_CHECKIN` → `visit-checkin`

### DCF Routes (8)
21. `DCF` → `dcf`
22. `DCF_DEALERS` → `dcf-dealers`
23. `DCF_LEADS` → `dcf-leads`
24. `DCF_DISBURSALS` → `dcf-disbursals`
25. `DCF_DEALER_DETAIL` → `dcf-dealer-detail`
26. `DCF_LEAD_DETAIL` → `dcf-lead-detail`
27. `DCF_ONBOARDING_DETAIL` → `dcf-onboarding-detail`
28. `DCF_ONBOARDING_FORM` → `dcf-onboarding-form`

### Admin Routes (7)
29. `ADMIN_HOME` → `admin-home`
30. `ADMIN_DEALERS` → `admin-dealers`
31. `ADMIN_LEADS` → `admin-leads`
32. `ADMIN_VC` → `admin-vc`
33. `ADMIN_DCF` → `admin-dcf`
34. `ADMIN_DASHBOARD` → `admin-dashboard`
35. `ADMIN_TL_DETAIL` → `admin-tl-detail`

**Note:** Listed 35 total (2 extra: NOTIFICATIONS, ADMIN_TL_LEADERBOARD may be in constants but not actively routed)

### Demo Routes (2)
36. `DEMO_LOCATION_UPDATE` → `demo-location-update`
37. `DEMO_VISIT_FEEDBACK` → `demo-visit-feedback`

**CRITICAL:** These 37 route constants MUST remain after any refactor. Removing ANY route = breaking change.

---

## Main Pages & Screens

**Source:** `/components/pages/*` directory

### Active Production Pages (Confirmed Used)

**Auth Pages (2):**
- LoginPage.tsx (`/components/pages/auth/`)
- ForgotPasswordPage.tsx (`/components/pages/auth/`)
- ProfilePage.tsx (`/components/pages/profile/`)
- ProfileCompletePage.tsx (`/components/pages/profile/`)

**KAM/TL Pages (11):**
- HomePage.tsx ✅ (KAM/TL dashboard)
- DealersPage.tsx ✅ (Dealers list)
- DealerDetailPageV2.tsx ✅ (Active dealer detail)
- LeadsPageV3.tsx ✅ (Active leads list)
- LeadDetailPageV2.tsx ✅ (Active lead detail)
- LeadCreatePage.tsx ✅ (Lead creation form)
- UnifiedVisitsPage.tsx ✅ (V/C unified view)
- VisitCheckInPage.tsx ✅ (Visit check-in + in-progress)
- VisitFeedbackPage.tsx ✅ (Visit feedback form)
- CallFeedbackPage.tsx ✅ (Call feedback form)
- DealerLocationUpdatePage.tsx ✅ (Location change request)

**Performance & Incentives Pages (7):**
- PerformancePage.tsx
- ProductivityDashboard.tsx
- LeaderboardPage.tsx
- TLDetailPage.tsx
- TLLeaderboardPage.tsx
- IncentiveSimulator.tsx
- KAMIncentiveSimulator.tsx (may be duplicate)
- TLIncentiveDashboard.tsx
- TLIncentiveMobile.tsx
- TLIncentiveSimulator.tsx

**DCF Pages (9):**
- DCFPage.tsx ✅ (DCF home for KAM)
- DCFPageTL.tsx ✅ (DCF home for TL, if separate)
- DCFDealersListPage.tsx ✅
- DCFLeadsListPage.tsx ✅
- DCFDisbursalsListPage.tsx ✅
- DCFDealerDetailPage.tsx ✅
- DCFLeadDetailPage.tsx ✅
- DCFDealerOnboardingDetailPage.tsx ✅

**Admin Pages (7):**
- AdminWorkspace.tsx ✅ (Admin container/router)
- AdminHomePage.tsx ✅ (Admin dashboard)
- AdminDealersPage.tsx ✅
- AdminLeadsPage.tsx ✅
- AdminVisitsCallsPage.tsx ✅ (V/C combined admin view)
- AdminDCFPage.tsx ✅ (if exists)
- AdminDashboardPage.tsx (may be duplicate of AdminHomePage)

**Call/Visit Detail Pages:**
- CallDetailPage.tsx
- TLCallDetailPage.tsx
- VisitDetailPage.tsx
- UnproductiveCallsList.tsx
- UnproductiveVisitsList.tsx

**Demo Pages (2):**
- LocationUpdateDemoPage.tsx ✅
- VisitFeedbackDemo.tsx ✅

**Total Active Pages:** ~50 files

**CRITICAL:** All pages marked ✅ are confirmed active. Removing ANY active page = breaking change.

---

## Key Data Sources

**Source:** `/data/` directory

### Single Source of Truth
**File:** `/data/mockDatabase.ts` ⭐

**Exported Collections:**
- `DEALERS` - All dealer entities
- `CALLS` - All call logs
- `VISITS` - All visit logs
- `LEADS` - All lead entities
- `DCF_LEADS` - All DCF lead entities
- `TEAM_LEADS` - All TL entities
- `KAMS` - All KAM entities
- `LOCATION_REQUESTS` - Location change requests

**ID Generators:**
- `makeDealerId(region, seq)` → `dealer-{region}-{seq}`
- `makeKAMId(region, seq)` → `kam-{region}-{seq}`
- `makeTLId(region, seq)` → `tl-{region}-{seq}`
- `makeCallId(timestamp, seq)` → `call-{timestamp}-{seq}`
- `makeVisitId(timestamp, seq)` → `visit-{timestamp}-{seq}`
- `makeLeadId(region, seq)` → `lead-{region}-{seq}`

**Legacy Support:**
- `LEGACY_ID_MAP` - Maps old IDs to canonical
- `normalizeDealerId(id)` - Converts legacy → canonical

---

### Data Selectors (Read-Only Access)
**File:** `/data/selectors.ts` ⭐

**Exported Functions (Sample):**
- `getDealerById(id)` → Dealer | undefined
- `getDealersByKAM(kamId)` → Dealer[]
- `getLeadsByDealerId(dealerId)` → Lead[]
- `getCallsByDealerId(dealerId)` → CallLog[]
- `getVisitsByDealerId(dealerId)` → VisitLog[]
- `getDCFLeadsByDealerId(dealerId)` → DCFLead[]
- `getKAMByDealerId(dealerId)` → KAM | undefined
- `getTLByKAMId(kamId)` → TeamLead | undefined
- `getAllDealers()` → Dealer[]
- `getAllLeads()` → Lead[]
- `getAllCalls()` → CallLog[]
- `getAllVisits()` → VisitLog[]

**Total Selectors:** ~30+

---

### DTO Selectors (UI-Facing)
**File:** `/data/dtoSelectors.ts` ⭐

**Exported Functions (Sample):**
- `getDealerDTO(dealerId)` → DealerDTO | null
- `getLeadDTO(leadId)` → LeadDTO | null
- _(Other DTO transformations)_

**Contracts:** `/contracts/*.contract.ts` define DTO interfaces

---

### V/C Specific Selectors
**File:** `/data/vcSelectors.ts`

Visit & Call specific query functions.

---

### Admin Org Mock
**File:** `/data/adminOrgMock.ts`

Admin-specific org structure (TLs, regions, KAM hierarchy).

---

### Data Boundary Index
**File:** `/data/index.ts` ⭐

Centralized export point for all data layer concerns.

**CRITICAL:** All data access MUST go through selectors, not direct mockDatabase imports.

---

## Engines & Business Logic

**Source:** `/lib/` directory

### Metrics Engine
**File:** `/lib/metricsEngine.ts` ⭐

**Functions:**
- `calculateI2SI(inspections, stockIns)` → number
- `calculateInputScore(data)` → number (0-100)
- `calculateDCFMetrics(dcfLeads)` → DCFMetrics
- _(Other metric calculations)_

---

### Incentive Engine
**File:** `/lib/incentiveEngine.ts` ⭐

**Functions:**
- `calculateKAMIncentive(data)` → IncentiveBreakdown
- `calculateTLIncentive(data)` → IncentiveBreakdown
- Gate logic (Input Score ≥75, I2SI ≥40%)
- Tier calculations (60-79%, 80-99%, 100%+)

---

### Productivity Engine
**File:** `/lib/productivityEngine.ts` ⭐

**Functions:**
- `evaluateProductivity(type, date, before, after, now)` → ProductivityResult
- 7-day window rules
- Productivity state machine

---

### Call Attempt Engine
**File:** `/lib/activity/callAttemptEngine.ts` ⭐

**Functions:**
- `canAttemptCall(dealerId, kamId)` → CallAttemptValidation
- Max 3 attempts per day rule
- Mandatory feedback enforcement

---

### Visit Engine
**File:** `/lib/activity/visitEngine.ts` ⭐

**Functions:**
- `canCheckIn(visit, location)` → CheckInValidation
- State machine: NOT_STARTED → CHECKED_IN → COMPLETED
- Geofence validation (100m radius)

---

## Protected Files (DO NOT TOUCH)

**Source:** `/docs/05_CODE_AUDIT_STALE_ITEMS.md` + hardening docs

**These files MUST NEVER be archived or modified in unsafe ways:**

### Core System Files
- `/App.tsx` - Main app router
- `/main.tsx` or `/index.tsx` - App bootstrap

### Figma Integration
- `/components/figma/ImageWithFallback.tsx` - Protected by system

### Data Layer (Single Source of Truth)
- `/data/mockDatabase.ts` ⭐
- `/data/selectors.ts` ⭐
- `/data/dtoSelectors.ts` ⭐
- `/data/types.ts` ⭐
- `/data/index.ts` ⭐

### Engines (Business Logic)
- `/lib/metricsEngine.ts` ⭐
- `/lib/incentiveEngine.ts` ⭐
- `/lib/productivityEngine.ts` ⭐
- `/lib/activity/callAttemptEngine.ts` ⭐
- `/lib/activity/visitEngine.ts` ⭐

### Navigation
- `/navigation/routes.ts` ⭐
- `/navigation/roleConfig.ts` ⭐

### Auth & Permissions
- `/auth/authContext.tsx`
- `/auth/permissions.ts`
- `/lib/auth/types.ts`

### Contracts (DTOs)
- `/contracts/*.contract.ts` (All contract files)

### Dev Guardrails
- `/lib/devAssertions.ts` (Dev-only, but protected)

**Total Protected Files:** ~20 critical files

**RULE:** These files can be EXTENDED (add new functions) but NEVER have existing exports removed or signatures changed without extreme caution.

---

## Canonical Flow Invariants

**Source:** `/docs/10_FLOW_INVARIANTS.md` ⭐

**Reference:** See `/docs/10_FLOW_INVARIANTS.md` for full list.

**Critical Invariants (Summary):**

1. **Dealer → Lead Navigation:** Clicking lead card from any entry point opens LeadDetailPageV2
2. **Call Feedback Mandatory:** Cannot make another call to same dealer until feedback submitted
3. **Visit State Machine:** NOT_STARTED → CHECKED_IN → COMPLETED (no shortcuts)
4. **Dealer Activity Links:** Call/visit entries in dealer detail open respective detail pages
5. **DCF State Machine:** NOT_ONBOARDED → PENDING_DOCS → PENDING_APPROVAL → APPROVED/REJECTED
6. **Routes Canonical:** All navigation uses `ROUTES` constant, no hardcoded paths
7. **Role-Based Tabs:** KAM/TL/Admin each have 5 bottom nav tabs (unchanging)
8. **Selectors Return Non-Null:** Valid IDs always return entities
9. **IDs Canonical Format:** All IDs follow `{entity}-{region}-{seq}` pattern
10. **Engine Calculations Valid:** No NaN, no Infinity, finite numbers only
11. **Visit State Transitions:** Only valid state transitions allowed
12. **Call Attempt Limit:** Max 3 calls per dealer per day

**Validation:** See `/docs/DEV_FLOW_INVARIANTS_CHECK.md` for UI validation steps.

---

## Role Configuration

**Source:** `/navigation/roleConfig.ts`

### KAM Bottom Nav (5 tabs)
1. Home (`/` = `home`)
2. Dealers (`/dealers` = `dealers`)
3. Leads (`/leads` = `leads`)
4. V/C (`/visits` = `visits`)
5. DCF (`/dcf` = `dcf`)

**Default Route:** `home`

---

### TL Bottom Nav (5 tabs)
1. Home (`/` = `home`)
2. Dealers (`/dealers` = `dealers`)
3. Leads (`/leads` = `leads`)
4. V/C (`/visits` = `visits`)
5. DCF (`/dcf` = `dcf`)

**Default Route:** `home`

**Note:** TL home shows team aggregated metrics, not individual KAM metrics.

---

### Admin Bottom Nav (5 tabs)
1. Home (`/admin` = `admin-home`)
2. Dealers (`/admin/dealers` = `admin-dealers`)
3. Leads (`/admin/leads` = `admin-leads`)
4. V/C (`/admin/vc` = `admin-vc`)
5. DCF (`/admin/dcf` = `admin-dcf`)

**Default Route:** `admin-home`

**CRITICAL:** Tab count (5), order, and routes MUST remain unchanged.

---

## Component Architecture Snapshot

### Active Component Folders
- `/components/` - Root components (BottomNav, MobileTopBar, etc.)
- `/components/admin/` - Admin-specific components (~13 files)
- `/components/auth/` - Auth components (~8 files)
- `/components/calls/` - Call components (~6 files)
- `/components/visits/` - Visit components (~14 files)
- `/components/leads/` - Lead components (~8 files)
- `/components/dealers/` - Dealer components (~2 files)
- `/components/dcf/` - DCF components (DCFOnboardingFlow.tsx)
- `/components/pages/` - Page components (~44 active)
- `/components/cards/` - Metric cards (~3 files)
- `/components/ui/` - shadcn/ui components (~40+ files)
- `/components/shared/` - Shared components (~2 files)
- `/components/system/` - ErrorBoundary, LoadingStates (~2 files)

**Total Component Files:** ~140 active

---

## Build Configuration

**Build Tool:** Vite  
**Framework:** React + TypeScript  
**Styling:** Tailwind CSS v4  
**UI Library:** shadcn/ui components  

**TypeScript:** Enabled, strict mode  
**Linting:** Unknown (not documented)  
**Hot Reload:** Vite dev server

**Critical Entrypoints:**
- `/App.tsx`
- `/main.tsx` or `/index.tsx` (assumed)

**Protected System Files:**
- `/components/figma/ImageWithFallback.tsx`
- Tailwind config (if exists)
- Vite config (if exists)

---

## Archived Files (Not Active)

**Archive Location:** `/_archive_code/`

**Archived During Hardening (11 files + 1 folder):**
- AdminVisitsPageEnhanced.tsx
- CallFeedbackPageNew.tsx
- DealerDetailsPage.tsx
- DealersPage_NEW.tsx
- LeadDetailsPage.tsx
- DCFOnboardingFormPage.tsx
- DCFOnboardingPage.tsx
- KAMCallsViewNew.tsx
- KAMVisitsViewNew.tsx
- PostCallWrapup.tsx
- /data/adapters/ folder

**Status:** Archived files are NOT part of active codebase. Do not reference them.

**Restoration:** If needed, see `/_archive_code/README.md`.

---

## Verification Commands

**Run Before Refactor:**
```bash
# 1. Ensure app builds
npm run build

# 2. Run smoke tests (manual)
# See /docs/DEV_SMOKE_CHECKLIST.md

# 3. Run invariant checks (manual)
# See /docs/DEV_FLOW_INVARIANTS_CHECK.md

# 4. Record baseline state (this document)
```

**Run After Refactor:**
```bash
# 1. Verify build still passes
npm run build

# 2. Re-run smoke tests
# Compare to baseline results

# 3. Re-run invariant checks
# ALL must still pass

# 4. Compare routes/pages to this snapshot
# ZERO differences allowed
```

---

## Snapshot Integrity

**MD5 Checksum (Conceptual):**
- Routes: 37 defined
- Pages: ~50 active
- Engines: 5 critical
- Selectors: ~30+
- Protected files: ~20

**If ANY of these numbers change after refactor → INVESTIGATE IMMEDIATELY**

---

## Summary Checklist

**Use this to verify snapshot integrity after refactor:**

- [ ] All 37 routes still defined in `/navigation/routes.ts`
- [ ] All 50 active pages still exist in `/components/pages/`
- [ ] All 5 engines still export same functions
- [ ] All ~30 selectors still exist in `/data/selectors.ts`
- [ ] All 20 protected files still untouched
- [ ] Role configs still have 5 tabs each
- [ ] All 12 flow invariants still pass (see invariants check doc)
- [ ] Build passes: `npm run build`
- [ ] Smoke tests pass: `/docs/DEV_SMOKE_CHECKLIST.md`

**If ALL boxes checked → Refactor is SAFE (no behavior changes)**

**If ANY box unchecked → Refactor introduced breaking changes → ROLLBACK**

---

## Freeze Notice

🔒 **THIS SNAPSHOT IS FROZEN AS OF:** February 6, 2026, 14:30 UTC

**DO NOT MODIFY THIS FILE after baseline is established.**

If you need to update baseline (rare cases):
1. Create NEW snapshot file with new date
2. Keep old snapshot for historical reference
3. Update docs to reference new snapshot

**Only update baseline if:**
- Intentional feature addition (new route, new page)
- Intentional feature removal (deprecated route, removed page)
- Architecture change approved by team

**NEVER update baseline to "fix" a failing refactor verification.** That defeats the purpose.

---

**End of Baseline Snapshot**

**Status:** 🔒 FROZEN  
**Next Review:** After next major refactor  
**Linked Docs:**
- `/docs/DEV_SMOKE_CHECKLIST.md` (30 manual checks)
- `/docs/DEV_FLOW_INVARIANTS_CHECK.md` (12 invariant validations)
- `/docs/10_FLOW_INVARIANTS.md` (Canonical invariants reference)
