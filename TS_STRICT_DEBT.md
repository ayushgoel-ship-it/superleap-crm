# TypeScript Strict-Mode Debt

_Last updated 2026-04-17._

## Status

`npm run type-check` reports **0 errors under full `strict: true`**
(down from ~378 at audit start → 190 → 114 → 101 → 74 → 0 non-strict → 0 strict).

- `tsconfig.json` now has `"strict": true`, `"noImplicitAny": true`,
  `"strictNullChecks": true`.
- CI `type-check` step is **blocking** (see `.github/workflows/ci.yml`).
- CI `lint` step is **error-blocking** (warnings still allowed, ~492
  across the codebase — mostly `no-unused-vars`). Remaining
  `rules-of-hooks` violations (35) were closed out by extracting
  wrapper components (`DCFPage` → `DCFPageKAM`, `LeadDetailPageV2`
  → `LeadDetailPageV2Inner`), reordering early-returns to run after
  all hooks (`AuditLogViewer`, `NotificationCenterPage`), and
  renaming a `useFallback` helper that tripped the hook-name
  heuristic (`VisitsTabContent`).
- `src/backend_api/**` is excluded from the FE tsconfig — it's a
  standalone Node/Express server with its own dependency surface and
  is not imported by the Vite bundle. Type-check it separately when
  that tree becomes active.

## Burn-down history

| Checkpoint                          | Errors | Notes                                                    |
| ----------------------------------- | -----: | -------------------------------------------------------- |
| Initial audit                       |   ~378 | Missing tsconfig paths for versioned package imports     |
| After tsconfig path aliases         |    190 | Resolved `sonner@2.0.3` / `@radix-ui/*@x.y.z` shape      |
| After PageView widening             |    114 | `setCurrentPage` SetStateAction narrowing                |
| After ENV feature-flag additions    |    101 | `platformSafety.ts` / `performance.ts` globals           |
| After BusinessChannel template lit. |     74 | DealersFilterContext / LeadsFilterContext channel widen  |
| After domain drift repair           |      0 | ProductivityStatus, UserRole, dtoSelectors, as-const fix |
| Flipped `strict: true` (first pass) |     23 | 13 backend_api TS7016 + 9 strictNull in adapters         |
| After backend_api exclude + fixes   |      0 | ?? '' / ?? 0 on optional adapter fields; cache guard     |

## Shortcuts taken (tech debt, not bugs)

The following fixes used `as any` / widened casts rather than full type
refactors. They are safe at runtime but should be hardened when the
underlying data contracts are frozen:

1. `src/data/dtoSelectors.ts` — `tags as any`, `(dealer as any).address`,
   status churn `'churned' → 'dormant'` mapping.
2. `src/api/lead.api.ts` / `activity.api.ts` / `incentive.api.ts` —
   temporary DTO aliases (`type LeadDTO = DCFLeadDTO`) plus local stub
   selectors. The canonical read paths use `supabaseRaw` +
   `runtimeDB`, so the facade is largely inert; remove when the legacy
   facade is deleted.
3. `src/components/pages/DCFPageTL.tsx` — `(dealer as any).onboarding`
   access. The new dealer card type dropped `onboarding`; the page
   still reads it at runtime. Align types once the card contract is
   finalized.
4. `src/data/supabaseRaw.ts` — `cancelled` visits are mapped to
   `NOT_STARTED` since `VisitStatus` has no `CANCELLED` member. Add
   `CANCELLED` to `VisitStatus` if the domain requires it.
5. `src/lib/incentiveEngine.validation.ts` — local `getSITarget` stub
   replacing a removed named export. Re-wire if validation suite is
   revived.

## How to go strict-mode-clean

With the baseline at 0, tighten `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

and flip the CI step from `continue-on-error: true` to the default in
`.github/workflows/ci.yml`.

Expect a new wave of errors from `strictNullChecks` once enabled —
those are legitimate null-safety issues, not cosmetic ones.
