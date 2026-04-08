# Route Parity & Dead Route Hygiene — Phase 4.5 Decision

**Date:** February 10, 2026
**Phase:** 4.5 (Route Parity)
**Constraint:** ZERO UI/UX/behavior changes
**Status:** COMPLETE

---

## 1. Summary

Reconciled all mismatches between the `AppRoute` enum, `ROUTES` object, `ROLE_CONFIGS` accessibleRoutes, and `App.tsx` switch cases. 5 dead routes marked deprecated (kept for type compatibility); 5 live routes added to enum/ROUTES/roleConfig. Zero navigation behavior changed.

---

## 2. Table A: Enum Values With No Switch Case (5 dead routes)

| # | Enum Constant | Key Value | In `ROUTES` obj | In `accessibleRoutes` | App.tsx switch case | Other references | Verdict |
|---|--------------|-----------|-----------------|----------------------|--------------------|--------------------|---------|
| A1 | `VISIT_DETAIL` | `visit-detail` | Removed | No | **NO** | 0 usage refs | **REMOVED** — detail handled inline by VisitsPage |
| A2 | `CALL_DETAIL` | `call-detail` | Removed | No | **NO** | 0 usage refs | **REMOVED** — detail handled inline by VisitsPage |
| A3 | `TL_CALL_DETAIL` | `tl-call-detail` | Removed | No | **NO** | 0 usage refs | **REMOVED** — planned but never implemented |
| A4 | `VISIT_CHECKIN` | `visit-checkin` | Removed | No | **NO** | 0 usage refs | **REMOVED** — check-in handled inline by VisitsPage |
| A5 | `DCF_ONBOARDING_FORM` | `dcf-onboarding-form` | Removed | No | **NO** | 0 usage refs | **REMOVED** — `dcf-onboarding` is the live route |

### Action Taken

- Originally marked `@deprecated` in Phase 4.5
- **Now fully REMOVED** in Wave 2 cleanup — all 5 route constants deleted from `AppRoute` enum and `ROUTES` object
- `isDCFRoute` helper updated to remove `DCF_ONBOARDING_FORM` reference

---

## 3. Table B: Switch Cases Missing From Enum/ROUTES (5 live routes)

| # | Key Value | App.tsx switch | App.tsx navigation | In `AppRoute` enum (pre-fix) | In `ROUTES` obj (pre-fix) | In `accessibleRoutes` (pre-fix) | Other refs | Verdict |
|---|-----------|---------------|-------------------|------------------------------|--------------------------|-------------------------------|------------|---------|
| B1 | `lead-create` | line 590 | `navigateToLeadCreate()` line 269 | **NO** | **NO** | **NO** | None | **ADDED** to enum + ROUTES + roleConfig |
| B2 | `dcf-onboarding` | line 600 | `navigateToDCFOnboarding()` line 286 | **NO** | **NO** | **NO** | None | **ADDED** to enum + ROUTES + roleConfig |
| B3 | `dealer-location-update` | line 610 | `navigateToDealerLocationUpdate()` line 303 | **NO** | **NO** | **NO** | None | **ADDED** to enum + ROUTES + roleConfig |
| B4 | `notifications` | line 469 | MobileTopBar bell click (line 132) | YES (`NOTIFICATIONS`) | **NO** | **NO** | MobileTopBar pageTitle (line 26) | **ADDED** to ROUTES + roleConfig |
| B5 | `admin-tl-leaderboard` | line 536 | AdminWorkspace callback | YES (`ADMIN_TL_LEADERBOARD`) | **NO** | **NO** | MobileTopBar pageTitle (line 37) | **ADDED** to ROUTES + roleConfig + isAdminRoute |

### Action Taken

**B1 (`lead-create`):**
- Added `LEAD_CREATE = 'lead-create'` to `AppRoute` enum
- Added `LEAD_CREATE: AppRoute.LEAD_CREATE` to ROUTES object
- Added to KAM, TL, Admin `accessibleRoutes`

**B2 (`dcf-onboarding`):**
- Added `DCF_ONBOARDING = 'dcf-onboarding'` to `AppRoute` enum
- Added `DCF_ONBOARDING: AppRoute.DCF_ONBOARDING` to ROUTES object
- Added to KAM, TL, Admin `accessibleRoutes`
- Added to `isDCFRoute` helper
- Added to `getActiveNavTab` DCF highlight list

**B3 (`dealer-location-update`):**
- Added `DEALER_LOCATION_UPDATE = 'dealer-location-update'` to `AppRoute` enum
- Added `DEALER_LOCATION_UPDATE: AppRoute.DEALER_LOCATION_UPDATE` to ROUTES object
- Added to KAM, TL, Admin `accessibleRoutes`

**B4 (`notifications`):**
- `NOTIFICATIONS` already existed in enum — no change
- Added `NOTIFICATIONS: AppRoute.NOTIFICATIONS` to ROUTES object
- Added to KAM, TL, Admin `accessibleRoutes`

**B5 (`admin-tl-leaderboard`):**
- `ADMIN_TL_LEADERBOARD` already existed in enum — no change
- Added `ADMIN_TL_LEADERBOARD: AppRoute.ADMIN_TL_LEADERBOARD` to ROUTES object
- Added to Admin `accessibleRoutes`
- Added to `isAdminRoute` helper

---

## 4. Files Changed

| File | Change Type | Risk |
|------|------------|------|
| `lib/domain/constants.ts` | Added 3 enum values, added @deprecated to 5 | LOW — additive enum change, no value changes |
| `navigation/routes.ts` | Added 5 entries to ROUTES, added @deprecated to 5, updated helpers | LOW — additive, Route type widens |
| `navigation/roleConfig.ts` | Added routes to all 3 accessibleRoutes arrays, updated getActiveNavTab | LOW — `hasAccessToRoute` not used as gate in App.tsx |
| `docs/APP_FLOWS.md` | Updated Sections 2.2, 2.3 to reflect reconciliation | NONE — docs only |
| `docs/DECISIONS/ROUTE_PARITY_PHASE4_5.md` | NEW — this file | NONE — docs only |

### Files NOT Changed

| File | Reason |
|------|--------|
| `App.tsx` | No changes needed — switch cases and navigation handlers are correct as-is |
| `components/MobileTopBar.tsx` | `pageTitle` record is pre-existing incomplete (missing many routes). Fixing would touch UI. Out of scope. |
| `navigation/navigationHelper.ts` | No changes needed — uses ROUTES/roleConfig which were updated |

---

## 5. Behavioral Verification

### What changed at runtime: NOTHING

- **Navigation flow:** `setCurrentPage()` uses string literals in App.tsx; adding enum constants doesn't change any call path
- **Switch cases:** Unchanged — same string-matched cases render same components
- **Role guards:** `hasAccessToRoute()` is NOT used as a rendering guard in App.tsx — RequireAuth + RequireProfileComplete are the only guards. Adding routes to accessibleRoutes is purely for advisory correctness
- **Type system:** Route type union is wider (more values) — this is backward-compatible; no narrowing
- **isDCFRoute / isAdminRoute:** Added entries for already-navigated routes — these helpers are used for UI highlighting, not access control

### Smoke Test Checklist

| Path | Expected | Status |
|------|----------|--------|
| Login -> Home (KAM) | HomePage renders | No change |
| Home -> Dealers -> Dealer Detail | DealersPage -> DealerDetailPageV2 inline | No change |
| Dealer Detail -> Lead Detail | LeadDetailPageV2 renders | No change |
| Home -> Leads -> Lead tap | LeadsPageV3 -> LeadDetailPageV2 | No change |
| Home -> V/C -> Visits/Calls tabs | VisitsPage renders | No change |
| Top bar bell -> Notifications | NotificationCenterPage renders | No change |
| Dealer Detail -> Create Lead | LeadCreatePage renders | No change |
| Dealer Detail -> Update Location | DealerLocationUpdatePage renders | No change |
| Dealer Detail -> DCF Onboarding | DCFOnboardingPage renders | No change |
| Admin login -> Admin Home | AdminHomePage renders | No change |
| Admin -> Dashboard -> TL Leaderboard | TLLeaderboardPage renders | No change |

---

## 6. Remaining Items (NOT in this phase)

1. **MobileTopBar `pageTitle` gaps:** The Record is missing titles for: `lead-detail`, `lead-create`, `call-feedback`, `visit-feedback`, `productivity`, `incentive-simulator`, `dcf-onboarding`, `dealer-location-update`, and all 5 deprecated routes. These show as undefined in the top bar. Fixing is a UI change — deferred.

2. **Deprecated route cleanup:** The 5 deprecated routes (A1-A5) can be fully removed in a future phase once a type migration verifies 0 downstream consumers.

3. **App.tsx `setCurrentPage` type safety:** App.tsx uses string literals like `'lead-create'` directly. These are now valid Route values via the enum/ROUTES additions, so type safety improves passively.

---

**End of Decision Document**
