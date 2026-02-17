# APP_FLOWS.md Generation Notes — Phase 4

**Date:** February 10, 2026
**Phase:** 4 (Docs only)
**Type:** Documentation generation (no code changes)

---

## Sources Analyzed

| Source File | Purpose |
|-------------|---------|
| `lib/domain/constants.ts` | `AppRoute` enum — all defined route keys |
| `navigation/routes.ts` | `ROUTES` re-export of AppRoute values |
| `navigation/roleConfig.ts` | `ROLE_CONFIGS` — per-role bottom nav tabs and accessible routes |
| `navigation/navigationHelper.ts` | `navigate()`, role switch helpers, param builders |
| `auth/permissions.ts` | `ROLE_PERMISSIONS` — action keys and route patterns per role |
| `auth/authContext.tsx` | `AuthProvider` — login, logout, impersonation state machine |
| `App.tsx` | Main routing switch (lines 317-622), navigation handlers, state management |
| `contracts/dealer.contract.ts` | DealerDTO, Dealer360DTO, DealerListItemDTO |
| `contracts/lead.contract.ts` | DCFLeadDTO, DCFLeadDetailDTO, DCFDealerOnboardingDTO |
| `contracts/activity.contract.ts` | CallDTO, VisitDTO, CallDetailDTO, VisitDetailDTO |
| `contracts/incentive.contract.ts` | IncentiveSummaryDTO, IncentiveDetailDTO, TLIncentiveDTO |
| `contracts/productivity.contract.ts` | ProductivitySummaryDTO, ProductivityDetailDTO |
| `data/dtoSelectors.ts` | DTO transformation layer |
| `data/selectors.ts` | Raw entity selectors |
| `data/vcSelectors.ts` | V/C module selectors |
| `docs/DECISIONS/DEALER_DETAIL_DUPLICATE_DECISION.md` | Dealer360View archived, DealerDetailPageV2 canonical |
| `docs/DECISIONS/LEAD_DETAIL_DUPLICATE_DECISION.md` | Lead360View archived, LeadDetailPageV2 canonical |
| `docs/DECISIONS/NOTIFICATIONCENTER_LEADDETAIL_MIGRATION.md` | Adapter pattern, ID resolution gap |
| `docs/DECISIONS/ORPHAN_SWEEP_PHASE3B.md` | 3 orphan files archived |

## Key Findings

### Route Enum vs. Actual Routing Gaps

5 route constants are defined in `AppRoute` enum but have no corresponding `case` in App.tsx:
- `VISIT_DETAIL`, `CALL_DETAIL`, `TL_CALL_DETAIL`, `VISIT_CHECKIN`, `DCF_ONBOARDING_FORM`

4 routes are used in App.tsx switch cases but have no `AppRoute` enum constant:
- `lead-create`, `dcf-onboarding`, `dealer-location-update`, `admin-tl-leaderboard`

These are documented in Section 2.2 and 2.3 of APP_FLOWS.md.

### Role Naming Inconsistency

- `auth/permissions.ts` uses: `'KAM' | 'TL' | 'ADMIN'`
- `auth/authContext.tsx` uses: `'KAM' | 'TL' | 'ADMIN'`
- `navigation/roleConfig.ts` uses: `'KAM' | 'TL' | 'Admin'` (note lowercase 'dmin')
- `App.tsx` maps between them: `profile?.role === 'ADMIN' ? 'Admin' : ...`

This is a known inconsistency but does not cause bugs due to the mapping in App.tsx.

### Notification ID Resolution — Confirmed Pre-existing Bug

The NOTIFICATIONCENTER_LEADDETAIL_MIGRATION decision doc explicitly states this is a pre-existing integration bug, not caused by migration. The adapter preserves exact behavioral parity with v1.

### DealerDetailPageV2 — No Dedicated Route

Unlike most detail pages, DealerDetailPageV2 renders inline within DealersPage (no top-level route). This is documented in Section 4.5.

## Verification

- Zero code files modified
- Only `/docs/APP_FLOWS.md` and this file created
- All route/screen mappings verified against actual App.tsx switch cases (lines 437-621)
- All role permissions verified against `ROLE_CONFIGS` and `ROLE_PERMISSIONS`
- All DTOs verified against `contracts/*` files

---

**End of Generation Notes**
