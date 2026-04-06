# SuperLeap CRM - Code Audit: Stale Items Report

**Generated:** February 6, 2026  
**Auditor:** Automated Analysis  
**Purpose:** Identify unused/duplicate/stale code for future cleanup

---

## Summary

| Category | Count | Risk Level |
|----------|-------|------------|
| Unused Components | 12 | LOW |
| Duplicate Components | 8 | MEDIUM |
| Orphan Routes | 3 | LOW |
| Legacy Adapters | 1 folder | LOW |
| Unused Selectors | 0 | - |
| Large Files (Split Candidates) | 6 | LOW |

**Total Items:** 29 + 1 folder

**Recommendation:** Archive all LOW risk items. Review MEDIUM risk items before archiving.

---

## 1. Unused Components (Never Imported)

### 1.1 KAMCallsViewNew.tsx
- **Path:** `/components/calls/KAMCallsViewNew.tsx`
- **Why Stale:** Created during call module refactor. Old KAMCallsView kept. "New" version never imported.
- **Import Check:** ❌ Not found in any file
- **Risk:** LOW
- **Action:** ARCHIVE
- **Notes:** UnifiedVisitsPage uses KAMCallsView (without "New"). Verify functionality before archive.

---

### 1.2 KAMVisitsViewNew.tsx
- **Path:** `/components/visits/KAMVisitsViewNew.tsx`
- **Why Stale:** Same pattern as calls - "New" version created but old kept.
- **Import Check:** ❌ Not found in any file
- **Risk:** LOW
- **Action:** ARCHIVE

---

### 1.3 PostCallWrapup.tsx
- **Path:** `/components/calls/PostCallWrapup.tsx`
- **Why Stale:** Replaced by CallFeedbackForm.tsx. Old wrapup component unused.
- **Import Check:** ❌ Not found in any file
- **Risk:** LOW
- **Action:** ARCHIVE

---

### 1.4 LocationUpdateDemoPage.tsx
- **Path:** `/components/visits/LocationUpdateDemoPage.tsx`
- **Why Stale:** Demo page for location update feature. Not part of main app.
- **Import Check:** ❌ Only referenced in QUICK_START.md (demo menu)
- **Risk:** LOW
- **Action:** KEEP (demo page, intentional)
- **Notes:** Part of demo/testing workflow, not production.

---

### 1.5 VisitFeedbackDemo.tsx
- **Path:** `/components/visits/VisitFeedbackDemo.tsx`
- **Why Stale:** Demo page for visit feedback redesign.
- **Import Check:** ❌ Only referenced in QUICK_START.md
- **Risk:** LOW
- **Action:** KEEP (demo page, intentional)

---

### 1.6 AdminVisitsPageEnhanced.tsx
- **Path:** `/components/pages/AdminVisitsPageEnhanced.tsx`
- **Why Stale:** Enhanced version created. Original AdminVisitsPage still used.
- **Import Check:** ❌ Not imported in AdminWorkspace.tsx
- **Risk:** LOW
- **Action:** ARCHIVE
- **Notes:** AdminWorkspace routes to AdminVisitsCallsPage, not this.

---

### 1.7 DealersPage_NEW.tsx
- **Path:** `/components/pages/DealersPage_NEW.tsx`
- **Why Stale:** "NEW" suffix indicates experimental version. Original DealersPage.tsx is active.
- **Import Check:** ❌ Not found in App.tsx or navigation
- **Risk:** LOW
- **Action:** ARCHIVE

---

### 1.8 LeadDetailPage.tsx (OLD)
- **Path:** `/components/pages/LeadDetailPage.tsx`
- **Why Stale:** Replaced by LeadDetailPageV2.tsx. V2 is canonical.
- **Import Check:** ⚠️ May have legacy imports
- **Risk:** MEDIUM (verify no imports before archive)
- **Action:** REVIEW → ARCHIVE

---

### 1.9 DealerDetailPage.tsx (OLD)
- **Path:** `/components/pages/DealerDetailPage.tsx`
- **Why Stale:** Replaced by DealerDetailPageV2.tsx.
- **Import Check:** ⚠️ May have legacy imports
- **Risk:** MEDIUM
- **Action:** REVIEW → ARCHIVE

---

### 1.10 DealerDetailsPage.tsx (Note: with 's')
- **Path:** `/components/pages/DealerDetailsPage.tsx`
- **Why Stale:** Naming inconsistency. DealerDetailPage (no 's') is canonical.
- **Import Check:** ❌ Not found
- **Risk:** LOW
- **Action:** ARCHIVE

---

### 1.11 LeadDetailsPage.tsx (Note: with 's')
- **Path:** `/components/pages/LeadDetailsPage.tsx`
- **Why Stale:** Same as above - naming inconsistency.
- **Import Check:** ❌ Not found
- **Risk:** LOW
- **Action:** ARCHIVE

---

### 1.12 DCFOnboardingPage.tsx
- **Path:** `/components/pages/DCFOnboardingPage.tsx`
- **Why Stale:** Replaced by DCFOnboardingFlow.tsx component (integrated into DealerDetailPageV2).
- **Import Check:** ❌ Not found
- **Risk:** LOW
- **Action:** ARCHIVE

---

## 2. Duplicate Components (Same Purpose)

### 2.1 Dealer360View vs DealerDetailPageV2
- **Files:**
  - `/components/dealers/Dealer360View.tsx` (OLD)
  - `/components/pages/DealerDetailPageV2.tsx` (NEW)
- **Duplication:** Both serve dealer detail view
- **Current Usage:** DealersPage.tsx uses DealerDetailPageV2
- **Risk:** MEDIUM (Dealer360View may have legacy imports)
- **Action:** Migrate all imports to V2, then archive Dealer360View

---

### 2.2 Lead360View (Integrated Component)
- **File:** `/components/leads/Lead360View.tsx`
- **Why Stale:** Lead detail view moved to LeadDetailPageV2 (full page)
- **Import Check:** ⚠️ Check if still used in LeadDetailPage (old)
- **Risk:** MEDIUM
- **Action:** REVIEW → ARCHIVE

---

### 2.3 MetricCard.tsx Duplication
- **Files:**
  - `/components/MetricCard.tsx` (root-level)
  - `/components/cards/MetricCard.tsx` (in cards folder)
- **Duplication:** Same component in two locations
- **Current Usage:** Check which is imported
- **Risk:** MEDIUM
- **Action:** Keep one (cards/MetricCard.tsx), archive root-level

---

### 2.4 AdminKPICard vs AdminHeader
- **Files:**
  - `/components/admin/AdminKPICard.tsx`
  - `/components/admin/AdminHeader.tsx`
- **Duplication:** Both render admin metrics/KPIs
- **Current Usage:** AdminHomePage uses AdminKPICard
- **Risk:** LOW (may serve different purposes)
- **Action:** REVIEW - verify not duplicates

---

### 2.5 InputScoreCard (Multiple Versions)
- **Files:**
  - `/components/cards/InputScoreCard.tsx`
  - (Potentially inline versions in HomePage)
- **Duplication:** Input Score rendering logic scattered
- **Risk:** LOW
- **Action:** KEEP cards/InputScoreCard.tsx, ensure HomePage uses it

---

### 2.6 CallDetailModal vs CallDetail
- **Files:**
  - `/components/admin/CallDetailModal.tsx` (admin view)
  - `/components/calls/CallDetail.tsx` (KAM view)
- **Duplication:** Partial - different contexts
- **Risk:** LOW (intentional separation by role)
- **Action:** KEEP BOTH

---

### 2.7 VisitDetailModal vs TLVisitDetailPage
- **Files:**
  - `/components/admin/VisitDetailModal.tsx` (admin modal)
  - `/components/visits/TLVisitDetailPage.tsx` (TL full page)
- **Duplication:** Partial - different contexts
- **Risk:** LOW (intentional)
- **Action:** KEEP BOTH

---

### 2.8 TL Incentive Components (3 variants)
- **Files:**
  - `/components/pages/TLIncentiveDashboard.tsx`
  - `/components/pages/TLIncentiveMobile.tsx`
  - `/components/pages/TLIncentiveSimulator.tsx`
- **Duplication:** TL incentive views - may overlap
- **Risk:** MEDIUM
- **Action:** REVIEW - verify distinct purposes, consolidate if overlap

---

## 3. Orphan Routes (Defined but Never Reachable)

### 3.1 ROUTES.VISIT_DETAIL — REMOVED
- **Status:** REMOVED (Wave 2 cleanup)
- **Former Path:** `/navigation/routes.ts` - `VISIT_DETAIL: '/visits/:id/detail'`

---

### 3.2 ROUTES.CALL_DETAIL — REMOVED
- **Status:** REMOVED (Wave 2 cleanup)
- **Former Path:** `/navigation/routes.ts` - `CALL_DETAIL: '/calls/:id/detail'`

---

### 3.3 ROUTES.DCF_ONBOARDING_FORM — REMOVED
- **Status:** REMOVED (Wave 2 cleanup)
- **Former Path:** `/navigation/routes.ts` - `DCF_ONBOARDING_FORM: '/dcf/onboarding/:id'`

---

## 4. Legacy Adapters (Entire Folder)

### 4.1 /data/adapters/ Folder
- **Path:** `/data/adapters/leadAdapter.ts`
- **Why Stale:** Created during data model transition. Types duplicated.
- **Current Usage:** ❌ Not imported anywhere
- **Risk:** LOW
- **Action:** ARCHIVE ENTIRE FOLDER
- **Notes:** `/data/types.ts` is canonical. Adapters were backward compatibility layer, no longer needed.

---

## 5. Unused Selectors

**Result:** ✅ NO UNUSED SELECTORS FOUND

All selectors in `/data/selectors.ts` are actively used by components. Good data hygiene.

---

## 6. Large Files (Split Candidates)

These files are >500 lines and could benefit from splitting in future refactors. NOT stale, just large.

### 6.1 DealerDetailPageV2.tsx (1,020 lines)
- **Path:** `/components/pages/DealerDetailPageV2.tsx`
- **Why Large:** 4 tabs with complex logic
- **Risk:** LOW (functional, just long)
- **Action:** FUTURE REFACTOR - Split into tab components
- **Suggested Structure:**
  ```
  DealerDetailPageV2.tsx (main container)
  ├── tabs/DealerOverviewTab.tsx
  ├── tabs/DealerLeadsTab.tsx
  ├── tabs/DealerActivityTab.tsx
  └── tabs/DealerDCFTab.tsx
  ```

---

### 6.2 DCFLeadDetailPage.tsx (650 lines)
- **Path:** `/components/pages/DCFLeadDetailPage.tsx`
- **Why Large:** 8-funnel journey with sub-stages
- **Risk:** LOW
- **Action:** FUTURE REFACTOR - Extract funnel components
- **Suggested Structure:**
  ```
  DCFLeadDetailPage.tsx (main)
  ├── DCFLoanJourney.tsx (accordion container)
  ├── funnels/SourcingFunnel.tsx
  ├── funnels/CreditFunnel.tsx
  └── ... (8 funnel components)
  ```

---

### 6.3 AdminHomePage.tsx (580 lines)
- **Path:** `/components/pages/AdminHomePage.tsx`
- **Why Large:** Multiple KPI sections, leaderboards, panels
- **Risk:** LOW
- **Action:** FUTURE REFACTOR - Split into sections
- **Suggested Structure:**
  ```
  AdminHomePage.tsx (main)
  ├── sections/AdminKPISection.tsx
  ├── sections/AdminLeaderboardSection.tsx
  └── sections/AdminRegionalPanels.tsx
  ```

---

### 6.4 Dealer360View.tsx (720 lines)
- **Path:** `/components/dealers/Dealer360View.tsx`
- **Why Large:** Comprehensive dealer detail (OLD version)
- **Risk:** MEDIUM (to be archived)
- **Action:** ARCHIVE (being replaced by DealerDetailPageV2)

---

### 6.5 LeadDetailPageV2.tsx (540 lines)
- **Path:** `/components/pages/LeadDetailPageV2.tsx`
- **Why Large:** Comprehensive lead detail with timeline
- **Risk:** LOW
- **Action:** FUTURE REFACTOR - Extract timeline component

---

### 6.6 UnifiedVisitsPage.tsx (680 lines)
- **Path:** `/components/pages/UnifiedVisitsPage.tsx`
- **Why Large:** Unified V/C hub with multiple tabs
- **Risk:** LOW
- **Action:** FUTURE REFACTOR - Split into tab components

---

## 7. Protected Files (DO NOT TOUCH)

These files are system-protected and must NEVER be archived:

- `/components/figma/ImageWithFallback.tsx` (Figma integration)
- `/data/runtimeDB.ts` (single source of truth - Supabase cache)
- `/lib/metricsEngine.ts` (canonical metrics)
- `/lib/incentiveEngine.ts` (canonical incentives)
- `/lib/productivityEngine.ts` (canonical productivity)
- `/navigation/routes.ts` (route constants)
- `/navigation/roleConfig.ts` (nav config)

---

## Archive Plan

### Phase 1: Low Risk (Safe to Archive Now)

**Files:**
1. `/components/calls/KAMCallsViewNew.tsx`
2. `/components/visits/KAMVisitsViewNew.tsx`
3. `/components/calls/PostCallWrapup.tsx`
4. `/components/pages/AdminVisitsPageEnhanced.tsx`
5. `/components/pages/DealersPage_NEW.tsx`
6. `/components/pages/DealerDetailsPage.tsx` (with 's')
7. `/components/pages/LeadDetailsPage.tsx` (with 's')
8. `/components/pages/DCFOnboardingPage.tsx`
9. `/data/adapters/` (entire folder)

**Route Constants — COMPLETED:**
1. `ROUTES.VISIT_DETAIL` — REMOVED
2. `ROUTES.CALL_DETAIL` — REMOVED
3. `ROUTES.DCF_ONBOARDING_FORM` — REMOVED

**Total:** 9 files + 1 folder

---

### Phase 2: Medium Risk (Review Before Archive)

**Files:**
1. `/components/pages/LeadDetailPage.tsx` (OLD - verify no imports)
2. `/components/pages/DealerDetailPage.tsx` (OLD - verify no imports)
3. `/components/dealers/Dealer360View.tsx` (verify migration complete)
4. `/components/leads/Lead360View.tsx` (verify not used)
5. `/components/MetricCard.tsx` (root-level - keep cards/ version)

**Duplicate Reviews:**
1. TL Incentive components (verify distinct purposes)
2. AdminKPICard vs AdminHeader (verify not duplicates)

**Total:** 5 files + 2 reviews

---

### Phase 3: Future Refactors (NOT Archive, Split)

**Files to Split (>500 lines):**
1. `DealerDetailPageV2.tsx` → 4 tab components
2. `DCFLeadDetailPage.tsx` → 8 funnel components
3. `AdminHomePage.tsx` → 3 section components
4. `LeadDetailPageV2.tsx` → Timeline component
5. `UnifiedVisitsPage.tsx` → Tab components

**Total:** 5 files (DO NOT ARCHIVE - refactor instead)

---

## Verification Checklist

Before archiving ANY file, run:

```bash
# 1. Search for imports
grep -r "import.*ComponentName" .

# 2. Search for file references
grep -r "ComponentName.tsx" .

# 3. Build the app
npm run build

# 4. Run smoke tests
# (Manual - check all major flows)
```

**Only archive if:**
- ✅ Zero imports found
- ✅ Zero file references
- ✅ Build succeeds
- ✅ Smoke tests pass

---

## Archive Structure

All archived files should preserve folder structure:

```
/_archive_code/
├── components/
│   ├── calls/
│   │   ├── KAMCallsViewNew.tsx
│   │   └── PostCallWrapup.tsx
│   ├── visits/
│   │   └── KAMVisitsViewNew.tsx
│   └── pages/
│       ├── AdminVisitsPageEnhanced.tsx
│       ├── DealersPage_NEW.tsx
│       ├── DealerDetailsPage.tsx
│       ├── LeadDetailsPage.tsx
│       └── DCFOnboardingPage.tsx
└── data/
    └── adapters/
        └── leadAdapter.ts
```

---

## Restoration Instructions

If an archived file is needed again:

1. Copy file from `/_archive_code/` to original location
2. Restore imports in consuming components
3. Add back to routing (if page component)
4. Run full test suite
5. Update this audit report (mark as RESTORED)

---

**End of Audit Report**

**Next Steps:**
1. ✅ Review this report
2. Execute Phase 1 archiving (low risk items)
3. Verify build after Phase 1
4. Review Phase 2 items individually
5. Plan Phase 3 refactors for future sprints

**Estimated Time:**
- Phase 1: 30 minutes
- Phase 2: 1-2 hours (includes verification)
- Phase 3: Future work (not immediate)
