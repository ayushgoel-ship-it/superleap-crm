# Dev-Ready Hardening - Baseline Snapshot

**Date:** February 6, 2026  
**Purpose:** Pre-hardening baseline to track what changes during dev-ready cleanup  
**Status:** ✅ BASELINE CAPTURED

---

## Table of Contents

1. [Routes Snapshot](#routes-snapshot)
2. [Role Tabs Snapshot](#role-tabs-snapshot)
3. [Selectors & Engines](#selectors--engines)
4. [File Counts](#file-counts)
5. [Build Status](#build-status)

---

## Routes Snapshot

**Source:** `/navigation/routes.ts`

**Total Routes:** 33

### Auth Routes (2)
- `AUTH_LOGIN` → `/auth/login`
- `AUTH_FORGOT_PASSWORD` → `/auth/forgot-password`

### Profile Routes (2)
- `PROFILE` → `/profile`
- `PROFILE_COMPLETE` → `/profile/complete`

### KAM/TL Core Routes (6)
- `HOME` → `/`
- `DEALERS` → `/dealers`
- `LEADS` → `/leads`
- `LEAD_DETAIL` → `/leads/:id`
- `VISITS` → `/visits`
- `VISIT_DETAIL` → `/visits/:id/detail`

### Call Routes (3)
- `CALL_DETAIL` → `/calls/:id/detail`
- `CALL_FEEDBACK` → `/calls/:id/feedback`
- `TL_CALL_DETAIL` → `/tl/calls/:id`

### Visit Routes (2)
- `VISIT_FEEDBACK` → `/visits/:id/feedback`
- `VISIT_CHECKIN` → `/visits/:id/checkin`

### DCF Routes (8)
- `DCF` → `/dcf`
- `DCF_DEALERS` → `/dcf/dealers`
- `DCF_LEADS` → `/dcf/leads`
- `DCF_DISBURSALS` → `/dcf/disbursals`
- `DCF_DEALER_DETAIL` → `/dcf/dealers/:id`
- `DCF_LEAD_DETAIL` → `/dcf/leads/:id`
- `DCF_ONBOARDING_DETAIL` → `/dcf/dealers/:id/onboarding`
- `DCF_ONBOARDING_FORM` → `/dcf/onboarding/:id`

### Other Routes (3)
- `PERFORMANCE` → `/performance`
- `PRODUCTIVITY` → `/productivity`
- `LEADERBOARD` → `/leaderboard`
- `INCENTIVE_SIMULATOR` → `/incentive-simulator`

### Admin Routes (7)
- `ADMIN_HOME` → `/admin`
- `ADMIN_DEALERS` → `/admin/dealers`
- `ADMIN_LEADS` → `/admin/leads`
- `ADMIN_VC` → `/admin/vc`
- `ADMIN_DCF` → `/admin/dcf`
- `ADMIN_DASHBOARD` → `/admin/dashboard`
- `ADMIN_TL_DETAIL` → `/admin/tl/:id`

### Demo Routes (2)
- `DEMO_LOCATION_UPDATE` → `/demo/location-update`
- `DEMO_VISIT_FEEDBACK` → `/demo/visit-feedback`

---

## Role Tabs Snapshot

**Source:** `/navigation/roleConfig.ts`

### KAM Bottom Nav (5 tabs)
1. Home (`/`) - Home icon
2. Dealers (`/dealers`) - Users icon
3. Leads (`/leads`) - FileText icon
4. V/C (`/visits`) - MapPin icon
5. DCF (`/dcf`) - IndianRupee icon

**Default Route:** `/` (HOME)

### TL Bottom Nav (5 tabs)
1. Home (`/`) - Home icon
2. Dealers (`/dealers`) - Users icon
3. Leads (`/leads`) - FileText icon
4. V/C (`/visits`) - MapPin icon
5. DCF (`/dcf`) - IndianRupee icon

**Default Route:** `/` (HOME)

### Admin Bottom Nav (5 tabs)
1. Home (`/admin`) - Home icon
2. Dealers (`/admin/dealers`) - Users icon
3. Leads (`/admin/leads`) - FileText icon
4. V/C (`/admin/vc`) - Phone icon
5. DCF (`/admin/dcf`) - IndianRupee icon

**Default Route:** `/admin` (ADMIN_HOME)

---

## Selectors & Engines

**Source:** `/data/` and `/lib/`

### Data Selectors (`/data/selectors.ts`)
**Exported Functions:** (verified via file read)
- `getDealerById(id: string): Dealer | undefined`
- `getDealersByKAM(kamId: string): Dealer[]`
- `getLeadsByDealerId(dealerId: string): Lead[]`
- `getCallsByDealerId(dealerId: string): CallLog[]`
- `getVisitsByDealerId(dealerId: string): VisitLog[]`
- `getDCFLeadsByDealerId(dealerId: string): DCFLead[]`
- `getKAMByDealerId(dealerId: string): KAM | undefined`
- `getTLByKAMId(kamId: string): TeamLead | undefined`
- (Additional selectors for various entity access)

### DTO Selectors (`/data/dtoSelectors.ts`)
**Exported Functions:**
- `getDealerDTO(dealerId: string): DealerDTO | null`
- `getLeadDTO(leadId: string): LeadDTO | null`
- (Additional DTO transformations)

### Engines (`/lib/`)

**Metrics Engine (`/lib/metricsEngine.ts`):**
- `calculateI2SI(inspections, stockIns): number`
- `calculateInputScore(data): number`
- `calculateDCFMetrics(dcfLeads): DCFMetrics`
- (Additional metric calculations)

**Incentive Engine (`/lib/incentiveEngine.ts`):**
- `calculateKAMIncentive(data): IncentiveBreakdown`
- `calculateTLIncentive(data): IncentiveBreakdown`
- (Gate logic, tier calculations)

**Productivity Engine (`/lib/productivityEngine.ts`):**
- `evaluateProductivity(type, date, before, after, now): ProductivityResult`
- (7-day window rules)

**Call Attempt Engine (`/lib/activity/callAttemptEngine.ts`):**
- `canAttemptCall(dealerId, kamId): CallAttemptValidation`
- (Max 3 attempts per day, mandatory feedback)

**Visit Engine (`/lib/activity/visitEngine.ts`):**
- `canCheckIn(visit, location): CheckInValidation`
- (State machine: NOT_STARTED → CHECKED_IN → COMPLETED)

---

## File Counts

**Generated:** February 6, 2026

### Component Files

**Root Components (`/components/`):**
- 5 files: BottomNav.tsx, ChannelBadge.tsx, MetricCard.tsx, MobileTopBar.tsx, StatusBadge.tsx

**Admin Components (`/components/admin/`):**
- ~13 files (AdminHeader, AdminKPICard, CallCoveragePanel, etc.)

**Auth Components (`/components/auth/`):**
- ~8 files (AuthProvider, ImpersonationBanner, RequireAuth, etc.)

**Call Components (`/components/calls/`):**
- ~7 files (CallDetail, CallFeedbackForm, KAMCallsView, TLCallsView, etc.)

**Visit Components (`/components/visits/`):**
- ~15 files (GeofenceCheckIn, InVisitScreen, VisitFeedbackRedesigned, etc.)

**Lead Components (`/components/leads/`):**
- ~8 files (LeadCard, LeadCardV3, Lead360View, LeadTimeline, etc.)

**Dealer Components (`/components/dealers/`):**
- ~2 files (Dealer360View, etc.)

**DCF Components (`/components/dcf/`):**
- ~1 file (DCFOnboardingFlow.tsx)

**Page Components (`/components/pages/`):**
- ~52 files (detailed below)

**Cards Components (`/components/cards/`):**
- ~3 files (InputScoreCard, MetricCard, TargetCard)

**UI Components (`/components/ui/`):**
- ~40+ files (shadcn/ui components)

**Shared Components (`/components/shared/`):**
- ~2 files (ViewModeSelector, etc.)

**System Components (`/components/system/`):**
- ~2 files (ErrorBoundary, LoadingStates)

### Page Components Detail (`/components/pages/`)

**Admin Pages (9):**
1. AdminCallsPage.tsx
2. AdminDashboardPage.tsx
3. AdminDealersPage.tsx
4. AdminLeadsPage.tsx
5. AdminVisitsCallsPage.tsx
6. AdminVisitsPage.tsx
7. AdminVisitsPageEnhanced.tsx ⚠️ (possibly unused)
8. AdminWorkspace.tsx
9. (Profile/Auth subdirectories)

**DCF Pages (11):**
1. DCFDealerDetailPage.tsx
2. DCFDealerOnboardingDetailPage.tsx
3. DCFDealersListPage.tsx
4. DCFDisbursalsListPage.tsx
5. DCFLeadDetailPage.tsx
6. DCFLeadsListPage.tsx
7. DCFOnboardingFormPage.tsx ⚠️ (possibly unused)
8. DCFOnboardingPage.tsx ⚠️ (possibly unused)
9. DCFPage.tsx
10. DCFPageTL.tsx

**Dealer Pages (6):**
1. DealerDetailPage.tsx ⚠️ (OLD - replaced by V2)
2. DealerDetailPageV2.tsx ✅ (ACTIVE)
3. DealerDetailsPage.tsx ⚠️ (possibly unused)
4. DealerLocationUpdatePage.tsx
5. DealersPage.tsx ✅ (ACTIVE)
6. DealersPage_NEW.tsx ⚠️ (possibly unused)

**Lead Pages (7):**
1. LeadCreatePage.tsx
2. LeadDetailPage.tsx ⚠️ (OLD - replaced by V2)
3. LeadDetailPageV2.tsx ✅ (ACTIVE)
4. LeadDetailsPage.tsx ⚠️ (possibly unused)
5. LeaderboardPage.tsx
6. LeadsPage.tsx ⚠️ (OLD - replaced by V3)
7. LeadsPageV3.tsx ✅ (ACTIVE)

**Call & Visit Pages (9):**
1. CallDetailPage.tsx
2. CallFeedbackPage.tsx ✅ (ACTIVE)
3. CallFeedbackPageNew.tsx ⚠️ (possibly unused)
4. TLCallDetailPage.tsx
5. UnifiedVisitsPage.tsx ✅ (ACTIVE)
6. UnproductiveCallsList.tsx
7. UnproductiveVisitsList.tsx
8. VisitCheckInPage.tsx ✅ (ACTIVE)
9. VisitDetailPage.tsx
10. VisitFeedbackPage.tsx ✅ (ACTIVE)
11. VisitsPage.tsx ⚠️ (OLD - replaced by Unified)

**Performance & Incentive Pages (7):**
1. HomePage.tsx ✅ (ACTIVE)
2. IncentiveSimulator.tsx
3. KAMDetailPage.tsx
4. KAMIncentiveSimulator.tsx
5. PerformancePage.tsx
6. ProductivityDashboard.tsx
7. TLCallDetailPage.tsx (duplicate?)
8. TLDetailPage.tsx
9. TLIncentiveDashboard.tsx
10. TLIncentiveMobile.tsx
11. TLIncentiveSimulator.tsx
12. TLLeaderboardPage.tsx

**Other Pages (1):**
1. NotificationCenterPage.tsx

**Auth/Profile Subdirectories:**
- `/components/pages/auth/` - LoginPage, ForgotPasswordPage
- `/components/pages/profile/` - ProfilePage, ProfileCompletePage

**⚠️ Total Potentially Stale Pages:** 12+ files identified

---

### Library Files

**Auth (`/lib/auth/`):**
- authService.ts
- impersonationTargets.ts
- mockUsers.ts
- storage.ts
- types.ts

**Domain (`/lib/domain/`):**
- constants.ts
- metrics.ts

**Activity (`/lib/activity/`):**
- callAttemptEngine.ts
- visitEngine.ts

**Metrics (`/lib/metrics/`):**
- adminMetrics.ts

**Productivity (`/lib/productivity/`):**
- mockDealerActivity.ts
- productivityService.ts

**Other Library Files:**
- consistencyGuard.ts
- geo.ts
- geolocation.ts
- incentiveEngine.ts
- incentiveEngine.test.examples.ts
- incentiveEngine.validation.ts
- leadBusinessRules.ts
- metricsEngine.ts
- productivityEngine.ts
- utils/idGenerator.ts
- validate.ts

---

### Data Files

**Data Layer (`/data/`):**
- mockDatabase.ts ⭐ (SINGLE SOURCE OF TRUTH)
- selectors.ts ⭐ (DATA ACCESS LAYER)
- dtoSelectors.ts ⭐ (DTO TRANSFORMATIONS)
- types.ts ⭐ (ENTITY DEFINITIONS)
- vcSelectors.ts
- testValidation.ts
- validateMockDB.ts
- adminOrgMock.ts
- README.md

**Adapters (Legacy - Flagged for Archive):**
- `/data/adapters/leadAdapter.ts` ⚠️

---

### Navigation Files

**Navigation (`/navigation/`):**
- routes.ts ⭐ (ROUTE CONSTANTS)
- roleConfig.ts ⭐ (ROLE-BASED NAV)
- navigationHelper.ts
- index.ts

---

### Contracts

**Contracts (`/contracts/`):**
- activity.contract.ts
- dealer.contract.ts
- incentive.contract.ts
- lead.contract.ts
- productivity.contract.ts

---

### API Scaffolding (Not Connected)

**API (`/api/`):**
- client.ts
- activity.api.ts
- dealer.api.ts
- incentive.api.ts
- lead.api.ts
- productivity.api.ts

---

### Utils

**Utils (`/utils/`):**
- performance.ts
- platformSafety.ts

---

### Config

**Config (`/config/`):**
- env.ts

---

### Contexts

**Contexts (`/contexts/`):**
- ActivityContext.tsx

---

### Auth

**Auth (`/auth/`):**
- auditLog.ts
- authContext.tsx
- permissions.ts

---

## Summary Counts

| Category | Count |
|----------|-------|
| **Routes Defined** | 33 |
| **Role Configs** | 3 (KAM, TL, Admin) |
| **Bottom Nav Tabs (KAM)** | 5 |
| **Bottom Nav Tabs (TL)** | 5 |
| **Bottom Nav Tabs (Admin)** | 5 |
| **Page Components** | ~52 |
| **Admin Components** | ~13 |
| **Auth Components** | ~8 |
| **Call Components** | ~7 |
| **Visit Components** | ~15 |
| **Lead Components** | ~8 |
| **UI Components** | ~40+ |
| **Total Component Files** | ~150+ |
| **Engines** | 5 (metrics, incentive, productivity, callAttempt, visit) |
| **Selectors** | 2 files (selectors.ts, dtoSelectors.ts) |
| **Library Files** | ~20+ |
| **Data Files** | ~8 |
| **Potentially Stale Files** | 12+ pages + 1 adapter |

---

## Build Status

**Status:** ✅ Assumed Passing (no build errors reported)

**TypeScript:** Enabled  
**Linting:** Unknown  
**Hot Module Reload:** Vite dev server

**Critical Entrypoints:**
- `/App.tsx` - Main app router
- `/main.tsx` or `/index.tsx` - App bootstrap (assumed to exist)

**Protected Files (DO NOT ARCHIVE):**
- `/components/figma/ImageWithFallback.tsx`
- `/data/mockDatabase.ts`
- `/lib/metricsEngine.ts`
- `/lib/incentiveEngine.ts`
- `/lib/productivityEngine.ts`
- `/navigation/routes.ts`
- `/navigation/roleConfig.ts`

---

## Baseline Established

This snapshot captures the state of the codebase BEFORE any dev-ready hardening.

**Next Steps:**
1. Build import graph (Phase 1)
2. Identify unused files deterministically
3. Archive stale code safely
4. Centralize data structures
5. Add guardrails
6. Verify no changes to routes, tabs, or behavior

**Comparison Required:**
After hardening, compare this baseline to post-hardening state to ensure:
- Route count unchanged
- Role tabs unchanged
- Engine exports unchanged
- Build still passes
- No missing imports

---

**End of Baseline Snapshot**
