# Archive Actions Log

**Purpose:** Single source of truth for every archive/keep decision. Must match actual repo state.  
**Last Updated:** February 9, 2026  
**Status:** Phase 1 COMPLETE | Phase 2A COMPLETE | Phase 2B COMPLETE | Phase 2C Duplicate Screens + Components COMPLETE | Phase 3A.5 Lead v1 Cleanup COMPLETE | Phase 3B Orphan Sweep COMPLETE

---

## Repo State Summary

| Metric | Value |
|--------|-------|
| Files in `/_archive_code/` | 22 |
| Original locations removed | 22 (confirmed) |
| Active code modified | 7 (5 type import rewires Phase 2B + 2 dead-import removals Phase 2C — no UI/behavior change) |
| Protected files modified | 0 |
| UI/UX behavior changes | 0 |

---

## Archived Files (originals DELETED from source tree)

These files exist ONLY in `/_archive_code/`. Their original paths are gone.

### Phase 1 — Low-Risk Stale Cleanup (6 files)

### 1. PostCallWrapup.tsx

| Field | Value |
|-------|-------|
| **Original Path** | `/components/calls/PostCallWrapup.tsx` |
| **Archived To** | `/_archive_code/components/calls/PostCallWrapup.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | Replaced by CallFeedbackForm.tsx; old wrapup component |
| **Replaced By** | `/components/calls/CallFeedbackForm.tsx` |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*PostCallWrapup" --include="*.tsx"` → 0 results |

---

### 2. DealersPage_NEW.tsx

| Field | Value |
|-------|-------|
| **Original Path** | `/components/pages/DealersPage_NEW.tsx` |
| **Archived To** | `/_archive_code/components/pages/DealersPage_NEW.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | "_NEW" suffix = experimental version never adopted |
| **Replaced By** | `/components/pages/DealersPage.tsx` (active in App.tsx) |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*DealersPage_NEW" --include="*.tsx"` → 0 results |

---

### 3. DealerDetailsPage.tsx (with 's')

| Field | Value |
|-------|-------|
| **Original Path** | `/components/pages/DealerDetailsPage.tsx` |
| **Archived To** | `/_archive_code/components/pages/DealerDetailsPage.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | Naming inconsistency ("Details" vs "Detail"); unused variant |
| **Replaced By** | `/components/pages/DealerDetailPageV2.tsx` |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*DealerDetailsPage" --include="*.tsx"` → 0 results |

---

### 4. LeadDetailsPage.tsx (with 's')

| Field | Value |
|-------|-------|
| **Original Path** | `/components/pages/LeadDetailsPage.tsx` |
| **Archived To** | `/_archive_code/components/pages/LeadDetailsPage.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | Naming inconsistency ("Details" vs "Detail"); unused variant |
| **Replaced By** | `/components/pages/LeadDetailPageV2.tsx` |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*LeadDetailsPage" --include="*.tsx"` → 0 results |

---

### 5. CallFeedbackPageNew.tsx

| Field | Value |
|-------|-------|
| **Original Path** | `/components/pages/CallFeedbackPageNew.tsx` |
| **Archived To** | `/_archive_code/components/pages/CallFeedbackPageNew.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | "New" suffix = experimental version never adopted |
| **Replaced By** | `/components/pages/CallFeedbackPage.tsx` (active in App.tsx) |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*CallFeedbackPageNew" --include="*.tsx"` → 0 results |

---

### 6. DCFOnboardingFormPage.tsx

| Field | Value |
|-------|-------|
| **Original Path** | `/components/pages/DCFOnboardingFormPage.tsx` |
| **Archived To** | `/_archive_code/components/pages/DCFOnboardingFormPage.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | DCF onboarding moved to DCFOnboardingFlow.tsx (inline in DealerDetailPageV2) |
| **Replaced By** | `/components/dcf/DCFOnboardingFlow.tsx` |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*DCFOnboardingFormPage" --include="*.tsx"` → 0 results |
| **Content** | Full file content preserved in archive |

---

### Phase 2B — Type Extraction + Orphan Cluster Archive (8 files)

### 7. UnifiedVisitsPage.tsx (Orphan Cluster Root)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/pages/UnifiedVisitsPage.tsx` |
| **Archived To** | `/_archive_code/components/pages/UnifiedVisitsPage.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | Not mounted in App.tsx. VisitsPage.tsx is the canonical mounted visits screen. Root of 7-file orphan cluster. |
| **Replaced By** | `/components/pages/VisitsPage.tsx` (active) |
| **Imports Found (pre-migration)** | 5 (type imports from sub-components) |
| **Imports Found (post-migration)** | 0 |
| **Type Migration** | `Dealer`, `Visit`, `DealerType`, `VisitStatus` → `/data/visitTypes.ts` |
| **Verification** | `grep -r "from.*UnifiedVisitsPage" --include="*.tsx"` → 0 results (post type migration) |
| **Decision Doc** | `/docs/VISITS_DUPLICATE_DECISION.md` |

---

### 8. GeofenceCheckIn.tsx (Orphan Cluster)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/visits/GeofenceCheckIn.tsx` |
| **Archived To** | `/_archive_code/components/visits/GeofenceCheckIn.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | Only imported by UnifiedVisitsPage.tsx (archived) and DealerQuickActionsCard.tsx (archived). Neither reaches a mount point. |
| **Imports Found** | 2 (both from archived files) |
| **Type Import Rewired** | `Dealer` from `UnifiedVisitsPage` → `/data/visitTypes.ts` |
| **Verification** | `grep -r "from.*GeofenceCheckIn" --include="*.tsx"` → 0 results (post archive) |

---

### 9. InVisitScreen.tsx (Orphan Cluster)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/visits/InVisitScreen.tsx` |
| **Archived To** | `/_archive_code/components/visits/InVisitScreen.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | Only imported by UnifiedVisitsPage.tsx (archived). Not reachable from any mount point. |
| **Imports Found** | 1 (UnifiedVisitsPage only) |
| **Type Import Rewired** | `Visit` from `UnifiedVisitsPage` → `/data/visitTypes.ts` |
| **Verification** | `grep -r "from.*InVisitScreen" --include="*.tsx"` → 0 results (post archive) |

---

### 10. EditDealerInfo.tsx (Orphan Cluster)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/visits/EditDealerInfo.tsx` |
| **Archived To** | `/_archive_code/components/visits/EditDealerInfo.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | Only imported by InVisitScreen.tsx (archived). Not reachable from any mount point. |
| **Imports Found** | 1 (InVisitScreen only) |
| **Type Import Rewired** | `Dealer` from `UnifiedVisitsPage` → `/data/visitTypes.ts` |
| **Verification** | `grep -r "from.*EditDealerInfo" --include="*.tsx"` → 0 results (post archive) |

---

### 11. VisitSummary.tsx (Orphan Cluster)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/visits/VisitSummary.tsx` |
| **Archived To** | `/_archive_code/components/visits/VisitSummary.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | Only imported by UnifiedVisitsPage.tsx (archived). Not reachable from any mount point. |
| **Imports Found** | 1 (UnifiedVisitsPage only) |
| **Type Import Rewired** | `Visit` from `UnifiedVisitsPage` → `/data/visitTypes.ts` |
| **Verification** | `grep -r "from.*VisitSummary" --include="*.tsx"` → 0 results (post archive) |

---

### 12. NearbyDealersMap.tsx (Orphan Cluster)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/visits/NearbyDealersMap.tsx` |
| **Archived To** | `/_archive_code/components/visits/NearbyDealersMap.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | Only imported by UnifiedVisitsPage.tsx (archived). Not reachable from any mount point. |
| **Imports Found** | 1 (UnifiedVisitsPage only) |
| **Type Import Rewired** | `Dealer` from `UnifiedVisitsPage` → `/data/visitTypes.ts` |
| **Verification** | `grep -r "from.*NearbyDealersMap" --include="*.tsx"` → 0 results (post archive) |

---

### 13. DealerQuickActionsCard.tsx (Orphan)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/dealer/DealerQuickActionsCard.tsx` |
| **Archived To** | `/_archive_code/components/dealer/DealerQuickActionsCard.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | 0 imports from any .tsx file. Only referenced in markdown docs. Imports GeofenceCheckIn (also archived). |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*DealerQuickActionsCard" --include="*.tsx"` → 0 results |

---

### 14. KAMVisitsView.tsx (Legacy View)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/visits/KAMVisitsView.tsx` |
| **Archived To** | `/_archive_code/components/visits/KAMVisitsView.tsx` |
| **Archived Date** | February 9, 2026 |
| **Reason** | 0 imports from any .tsx file. Predecessor to KAMVisitsViewNew.tsx (active). Fully replaced. |
| **Replaced By** | `/components/visits/KAMVisitsViewNew.tsx` (imported by mounted VisitsPage.tsx) |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*KAMVisitsView['\"]" --include="*.tsx"` → 0 results |

---

### Phase 2C — Duplicate Screens + Components (3 files)

### 15. Dealer360View.tsx (Dealer Detail Duplicate)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/dealers/Dealer360View.tsx` |
| **Archived To** | `/_archive_code/components/dealers/Dealer360View.tsx` |
| **Archived Date** | February 9, 2026 |
| **Phase** | Phase 2C |
| **Reason** | Imported by DealersPage.tsx but NEVER rendered in JSX (dead import). DealerDetailPageV2.tsx is the canonical dealer detail screen (rendered at DealersPage.tsx line 235). Dead import removed from DealersPage.tsx. |
| **Replaced By** | `/components/pages/DealerDetailPageV2.tsx` (active, rendered by DealersPage) |
| **Imports Found (pre-cleanup)** | 1 (DealersPage.tsx — dead import, never rendered) |
| **Imports Found (post-cleanup)** | 0 |
| **Verification** | `grep -r "from.*Dealer360View" --include="*.tsx"` → 0 results |
| **Decision Doc** | `/docs/DECISIONS/DEALER_DETAIL_DUPLICATE_DECISION.md` |

---

### 16. Lead360View.tsx (Lead Detail Duplicate)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/leads/Lead360View.tsx` |
| **Archived To** | `/_archive_code/components/leads/Lead360View.tsx` |
| **Archived Date** | February 9, 2026 |
| **Phase** | Phase 2C |
| **Reason** | 0 imports from any .tsx file. Never imported or rendered anywhere. LeadDetailPageV2.tsx is canonical for main leads flow. |
| **Replaced By** | `/components/pages/LeadDetailPageV2.tsx` (canonical) |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*Lead360View" --include="*.tsx"` → 0 results |
| **Decision Doc** | `/docs/DECISIONS/LEAD_DETAIL_DUPLICATE_DECISION.md` |
| **Note** | `LeadDetailPage.tsx` (v1) was subsequently archived in Phase 3A.5 after NotificationCenterPage migration to V2 adapter (Phase 3A). |

---

### 17. MetricCard.tsx (Root-level duplicate)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/MetricCard.tsx` |
| **Archived To** | `/_archive_code/components/MetricCard.tsx` |
| **Archived Date** | February 9, 2026 |
| **Phase** | Phase 2C |
| **Reason** | 0 imports from any .tsx file. Simpler variant with different prop interface (color-based, icon prop). Replaced by `/components/cards/MetricCard.tsx` which has richer features (targetConfig, expandable, status-based styling). |
| **Replaced By** | `/components/cards/MetricCard.tsx` (imported by HomePage.tsx, KAMDetailPage.tsx) |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*['\"/]MetricCard['\"]" --include="*.tsx"` → 0 results; `grep -r "from.*cards/MetricCard" --include="*.tsx"` → 2 results (canonical) |

---

### Phase 3A.5 — Lead v1 Cleanup (2 files)

### 18. LeadDetailPage.tsx (v1)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/pages/LeadDetailPage.tsx` |
| **Archived To** | `/_archive_code/components/pages/LeadDetailPage.tsx` |
| **Archived Date** | February 9, 2026 |
| **Phase** | Phase 3A.5 |
| **Reason** | 0 active imports from any .tsx file. Only import was from LeadsPage.tsx (also dead, co-archived). NotificationCenterPage migrated to LeadDetailPageV2 via adapter in Phase 3A. |
| **Replaced By** | `/components/pages/LeadDetailPageV2.tsx` (canonical, rendered via `LeadDetailV2AdapterForNotifications.tsx` for notifications and directly by `LeadsPageV3.tsx` and `App.tsx`) |
| **Imports Found (pre-archive)** | 1 (LeadsPage.tsx only — itself unmounted/dead) |
| **Imports Found (post-archive)** | 0 |
| **Verification** | `grep -r "from.*LeadDetailPage['\"]" --include="*.tsx"` → 0 results (excluding `/_archive_code/`) |
| **Decision Doc** | `/docs/DECISIONS/LEAD_DETAIL_DUPLICATE_DECISION.md`, `/docs/DECISIONS/NOTIFICATIONCENTER_LEADDETAIL_MIGRATION.md` |

---

### 19. LeadsPage.tsx (v1)

| Field | Value |
|-------|-------|
| **Original Path** | `/components/pages/LeadsPage.tsx` |
| **Archived To** | `/_archive_code/components/pages/LeadsPage.tsx` |
| **Archived Date** | February 9, 2026 |
| **Phase** | Phase 3A.5 |
| **Reason** | 0 imports from any .tsx file. Not mounted in App.tsx. App.tsx uses LeadsPageV3 instead. Internally imported LeadDetailPage v1 (co-archived). |
| **Replaced By** | `/components/pages/LeadsPageV3.tsx` (active, rendered by App.tsx) |
| **Imports Found** | 0 |
| **Verification** | `grep -r "from.*LeadsPage['\"]" --include="*.tsx"` → 0 results |

---

### Phase 3B — Orphan Sweep (3 files)

### 20. VisitFeedbackRedesigned.tsx

| Field | Value |
|-------|-------|
| **Original Path** | `/components/visits/VisitFeedbackRedesigned.tsx` |
| **Archived To** | `/_archive_code/components/visits/VisitFeedbackRedesigned.tsx` |
| **Archived Date** | February 9, 2026 |
| **Phase** | Phase 3B |
| **Reason** | Only imported by InVisitScreen.tsx (archived) and KAMVisitsView.tsx (archived). Neither reaches a mount point. |
| **Imports Found** | 2 (both from archived files) |
| **Verification** | `grep -r "from.*VisitFeedbackRedesigned" --include="*.tsx"` → 0 results (post archive) |

---

### 21. SuggestedTabContent.tsx

| Field | Value |
|-------|-------|
| **Original Path** | `/components/visits/SuggestedTabContent.tsx` |
| **Archived To** | `/_archive_code/components/visits/SuggestedTabContent.tsx` |
| **Archived Date** | February 9, 2026 |
| **Phase** | Phase 3B |
| **Reason** | Only imported by KAMVisitsView.tsx (archived). Not reachable from any mount point. |
| **Imports Found** | 1 (KAMVisitsView only) |
| **Verification** | `grep -r "from.*SuggestedTabContent" --include="*.tsx"` → 0 results (post archive) |

---

### 22. LocationUpdateModal.tsx

| Field | Value |
|-------|-------|
| **Original Path** | `/components/visits/LocationUpdateModal.tsx` |
| **Archived To** | `/_archive_code/components/visits/LocationUpdateModal.tsx` |
| **Archived Date** | February 9, 2026 |
| **Phase** | Phase 3B |
| **Reason** | Only imported by KAMVisitsView.tsx (archived). Not reachable from any mount point. |
| **Imports Found** | 1 (KAMVisitsView only) |
| **Verification** | `grep -r "from.*LocationUpdateModal" --include="*.tsx"` → 0 results (post archive) |

---

## Archive Structure (actual)

```
/_archive_code/
├── README.md
└── components/
    ├── MetricCard.tsx
    ├── calls/
    │   └── PostCallWrapup.tsx
    ├── dealer/
    │   └── DealerQuickActionsCard.tsx
    ├── dealers/
    │   └── Dealer360View.tsx
    ├── leads/
    │   └── Lead360View.tsx
    └── pages/
    │   ├── CallFeedbackPageNew.tsx
    │   ├── DCFOnboardingFormPage.tsx
    │   ├── DealerDetailsPage.tsx
    │   ├── DealersPage_NEW.tsx
    │   ├── LeadDetailPage.tsx
    │   ├── LeadDetailsPage.tsx
    │   ├── LeadsPage.tsx
    │   └── UnifiedVisitsPage.tsx
    └── visits/
        ├── EditDealerInfo.tsx
        ├── GeofenceCheckIn.tsx
        ├── InVisitScreen.tsx
        ├── KAMVisitsView.tsx
        ├── NearbyDealersMap.tsx
        ├── VisitFeedbackRedesigned.tsx
        ├── SuggestedTabContent.tsx
        └── LocationUpdateModal.tsx
        └── VisitSummary.tsx
```

**Total:** 22 files archived (6 Phase 1 + 8 Phase 2B + 3 Phase 2C + 2 Phase 3A.5 + 3 Phase 3B). Originals confirmed deleted.

---

## NEEDS_VERIFICATION

Items from the Phase 1 "Low Risk" audit list that were **NOT archived** because repo-wide import search found active callers. Each entry includes the exact imports found and what must be checked before any future archive.

---

### NV-1. KAMCallsViewNew.tsx — RESOLVED

| Field | Value |
|-------|-------|
| **Path** | `/components/calls/KAMCallsViewNew.tsx` |
| **Audit Action** | ARCHIVE |
| **Actual Action** | KEEP |
| **Imports Found** | 1 |
| **Imported By** | `/components/pages/VisitsPage.tsx` line 5: `import { KAMCallsViewNew } from '../calls/KAMCallsViewNew';` |
| **Reachable?** | YES — VisitsPage.tsx rendered by App.tsx line 463 (`case 'visits': return <VisitsPage .../>`) |
| **Resolution** | **CONFIRMED ACTIVE** (Phase 2A, Feb 9 2026). DO NOT ARCHIVE. |

---

### NV-2. KAMVisitsViewNew.tsx — RESOLVED

| Field | Value |
|-------|-------|
| **Path** | `/components/visits/KAMVisitsViewNew.tsx` |
| **Audit Action** | ARCHIVE |
| **Actual Action** | KEEP |
| **Imports Found** | 1 |
| **Imported By** | `/components/pages/VisitsPage.tsx` line 3: `import { KAMVisitsViewNew } from '../visits/KAMVisitsViewNew';` |
| **Reachable?** | YES — same chain as NV-1 |
| **Resolution** | **CONFIRMED ACTIVE** (Phase 2A, Feb 9 2026). DO NOT ARCHIVE. |

---

### NV-3. DCFOnboardingPage.tsx

| Field | Value |
|-------|-------|
| **Path** | `/components/pages/DCFOnboardingPage.tsx` |
| **Audit Action** | ARCHIVE |
| **Actual Action** | KEEP |
| **Imports Found** | 1 |
| **Imported By** | `/App.tsx` line 46: `import { DCFOnboardingPage } from './components/pages/DCFOnboardingPage';` |
| **Rendered?** | YES — App.tsx `case 'dcf-onboarding': return <DCFOnboardingPage ... />` |
| **What to check** | The audit claimed this was a "dead import". It is NOT dead — it is actively rendered for the `dcf-onboarding` navigation case. Archiving would break the DCF onboarding flow. |

---

### NV-4. /data/adapters/leadAdapter.ts

| Field | Value |
|-------|-------|
| **Path** | `/data/adapters/leadAdapter.ts` |
| **Audit Action** | ARCHIVE (entire folder) |
| **Actual Action** | KEEP |
| **Imports Found** | 4 (was 6 originally; Dealer360View archived Phase 2C, LeadsPage.tsx archived Phase 3A.5) |
| **Imported By** | 1. `/components/pages/LeadsPageV3.tsx` (toLeadListVM, validateLeadIdForNavigation) |
| | 2. `/components/leads/LeadCard.tsx` (LeadCardVM type) |
| | 3. `/components/leads/LeadList.tsx` (LeadCardVM type) |
| | 4. `/components/leads/LeadCardV3.tsx` (LeadCardVM type) |
| **What to check** | The audit claimed "Not imported anywhere". This is wrong — 4 active files import from it. Previous importers Dealer360View and LeadsPage.tsx have been archived. |

---

### NV-5. AdminVisitsPageEnhanced.tsx

| Field | Value |
|-------|-------|
| **Path** | `/components/pages/AdminVisitsPageEnhanced.tsx` |
| **Audit Action** | ARCHIVE |
| **Actual Action** | KEEP |
| **Imports Found** | 1 |
| **Imported By** | `/components/pages/AdminWorkspace.tsx` line 6 |
| **Rendered?** | YES — AdminWorkspace.tsx renders it |
| **What to check** | The audit claimed "Not imported in AdminWorkspace.tsx". This is wrong. Archiving would break Admin workspace Visits tab. |

---

### NV-6. Orphan Route Constants

| Field | Value |
|-------|-------|
| **Routes** | `ROUTES.VISIT_DETAIL`, `ROUTES.CALL_DETAIL`, `ROUTES.DCF_ONBOARDING_FORM` |
| **File** | `/navigation/routes.ts` |
| **Audit Action** | REMOVE constants |
| **Actual Action** | KEEP |
| **Reason** | `routes.ts` is listed as a Protected File in audit section 7 ("DO NOT TOUCH"). Cannot modify. |

---

### NV-7. UnifiedVisitsPage.tsx Orphan Cluster — RESOLVED

| Field | Value |
|-------|-------|
| **Resolution** | ARCHIVED in Phase 2B. Types migrated to `/data/visitTypes.ts`. Full 7-file cluster + KAMVisitsView archived (items 7-14 above). |

---

### NV-8. KAMVisitsView.tsx — RESOLVED

| Field | Value |
|-------|-------|
| **Resolution** | ARCHIVED in Phase 2B as item 14. 0 imports confirmed. |

---

## Phase 2C Additional Findings (documented, not archived)

### LeadDetailPage.tsx (v1) — ARCHIVED Phase 3A.5

| Field | Value |
|-------|-------|
| **Path** | `/components/pages/LeadDetailPage.tsx` → `/_archive_code/components/pages/LeadDetailPage.tsx` |
| **Status** | ARCHIVED (Phase 3A.5). NotificationCenterPage migrated to V2 adapter in Phase 3A; v1 archived in Phase 3A.5. |
| **Dead Import Removed** | App.tsx line 43 imported it but never rendered it — dead import removed (Phase 2C) |
| **Decision Docs** | `/docs/DECISIONS/LEAD_DETAIL_DUPLICATE_DECISION.md`, `/docs/DECISIONS/NOTIFICATIONCENTER_LEADDETAIL_MIGRATION.md` |

### LeadsPage.tsx (v1) — ARCHIVED Phase 3A.5

| Field | Value |
|-------|-------|
| **Path** | `/components/pages/LeadsPage.tsx` → `/_archive_code/components/pages/LeadsPage.tsx` |
| **Status** | ARCHIVED (Phase 3A.5). 0 imports confirmed; App.tsx uses LeadsPageV3. |

### New orphans from Phase 2B (noted for future phases)

| File | Reason | Status |
|------|--------|--------|
| `VisitFeedbackRedesigned.tsx` | Was imported by InVisitScreen + KAMVisitsView (both archived) | **ARCHIVED Phase 3B** (item 20) |
| `SuggestedTabContent.tsx` | Was only imported by KAMVisitsView (archived) | **ARCHIVED Phase 3B** (item 21) |
| `LocationUpdateModal.tsx` | Was only imported by KAMVisitsView (archived) | **ARCHIVED Phase 3B** (item 22) |

---

## Corrections to Previous Audit Data

The original audit (`docs/05_CODE_AUDIT_STALE_ITEMS.md`) contained incorrect "Import Check" results for 5 items:

| Item | Audit Claim | Actual (verified Feb 9, 2026) |
|------|------------|-------------------------------|
| AdminVisitsPageEnhanced.tsx | "Not imported in AdminWorkspace.tsx" | **Imported AND rendered** by AdminWorkspace.tsx |
| DCFOnboardingPage.tsx | "Not found" | **Imported AND rendered** by App.tsx |
| KAMCallsViewNew.tsx | "Not found in any file" | **Imported AND rendered** by VisitsPage.tsx → App.tsx |
| KAMVisitsViewNew.tsx | "Not found in any file" | **Imported AND rendered** by VisitsPage.tsx → App.tsx |
| leadAdapter.ts | "Not imported anywhere" | **Imported by 5 active component files** |

---

## Restoration Instructions

```bash
# Restore a single file:
cp /_archive_code/components/pages/DCFOnboardingFormPage.tsx /components/pages/DCFOnboardingFormPage.tsx

# Verify:
grep -r "DCFOnboardingFormPage" components/ --include="*.tsx"
```

If any archived file is needed, copy it back from `/_archive_code/` to its original path, re-add any necessary imports, and test.

---

**End of Archive Actions Log**