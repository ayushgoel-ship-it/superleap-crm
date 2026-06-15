# Frontend Integration Map — pages that need re-wiring

Generated 2026-06-11. Per FE page: what it reads, what it writes, and which new BE endpoint replaces the Supabase call.
Grouped by role (KAM mobile, TL desktop+mobile, Admin desktop) and ordered by pilot criticality.

---

I have enough. Now I write the integration map.

# Frontend Integration Map — Supabase → Backend Cutover

**Scope.** Every page (and the helpers it pulls from) that issues Supabase JS calls today, with the target backend endpoint, the auth context, and the Supabase-specific UX that must change. Grouped by role and ordered by **pilot criticality**: P0 = blocks pilot, P1 = needed by pilot week 1, P2 = post-pilot.

**Indirect surface.** All pages listed below also read the snapshot via `src/data/runtimeDB.ts` → `src/data/supabaseRaw.ts`, which currently `supabase.from(table).select().range(...)` paginates through ~20 master tables (`users`, `teams`, `dealers_master`, `sell_leads_master`, `visits`, `call_events`, `targets`, `incentive_*`, `untagged_dealers`, `location_requests`, etc.). Cutover requires **replacing `supabaseRaw.ts` with REST equivalents** in lockstep with the per-page work below — every page using `getRuntimeDBSync` inherits that change.

**No Postgres realtime** is used anywhere (`grep channel(/onPostgres` empty). Only `supabase.auth.onAuthStateChange` (`src/components/auth/AuthProvider.tsx:97`). UX impact is auth-session-driven only; no live row pushes to replace.

---

## KAM mobile (P0 — pilot-critical)

### `src/components/pages/LeadCreatePage.tsx` — P0
- **Writes.** `supabase.from('leads_raw').insert(...)` at line 65 (the manual lead-capture form).
  - **Target.** `POST /v1/leads` (lead-capture endpoint owned by Lead service). Body = current `leads_raw` payload; server stamps `kam_id`, `created_at`, dedup hash.
- **Reads.** None direct; uses `runtimeDB` snapshot for dealer dropdown.
- **Auth.** Bearer (KAM JWT) — server must derive `kam_id` from token, not trust client.
- **UX.** Replace Supabase `PostgrestError` toast with structured `{ code, message }` from REST. Add idempotency-key on retry (currently relies on Supabase upsert semantics).

### `src/components/pages/LeadDetailPageV2.tsx` — P0
- **Reads.** Visit history via `visit.api.ts` (`supabase.from('visits').select(...)`); lead row via `runtimeDB`; CEP via `crmApi.updateLeadCEP`.
  - **Target.** `GET /v1/leads/:id`, `GET /v1/leads/:id/visits`, `GET /v1/leads/:id/calls`.
- **Writes.** `updateLeadCEP` (already REST via `crmApi`), plus disposition writes through `visit.api`.
  - **Target.** `PATCH /v1/leads/:id` (CEP, owner, sub-status); `POST /v1/leads/:id/visits`; `POST /v1/leads/:id/calls`.
- **Auth.** KAM JWT; server enforces `lead.kam_id == token.user_id` instead of RLS.
- **UX.** Remove the silent-empty-array fallback the page does today when RLS denies — surface a real 403 with "not your lead" copy. Replace `getSession` polling with the existing AuthProvider context.

### `src/components/pages/LeadsPageV3.tsx` — P0
- **Reads.** Lead list + per-lead aggregate counters via `runtimeDB` + `visit.api.listVisits`.
  - **Target.** `GET /v1/leads?owner=me&status=...&page=...` (server-side filter+paginate); `GET /v1/visits/summary?lead_ids=...`.
- **Writes.** None.
- **Auth.** KAM JWT.
- **UX.** Replace client-side `.filter(l => l.kam_id === me)` with server scoping; remove the giant in-memory snapshot load. Loading skeleton instead of "wait for runtimeDB".

### `src/api/visit.api.ts` (consumed by LeadDetail, CallDetail, VisitDetail, CallFeedback, VisitFeedback) — P0
- **Reads.** `supabase.from('visits').select(...).eq(...)`, `supabase.from('call_events').select(...)`, dealer lookup.
  - **Target.** `GET /v1/visits`, `GET /v1/visits/:id`, `GET /v1/calls`, `GET /v1/calls/:id`, `GET /v1/dealers?fields=code,name`.
- **Writes.** `insert/update` on `visits` and `call_events`.
  - **Target.** `POST/PATCH /v1/visits[/:id]`, `POST/PATCH /v1/calls[/:id]`.
- **Auth.** KAM JWT for KAM rows, TL JWT for team-scope reads.
- **UX.** This file is the **single biggest blast radius** — every KAM mobile page imports it. Cut once, here.

### `src/components/pages/CallFeedbackPage.tsx` / `VisitFeedbackPage.tsx` / `CallDetailPage.tsx` / `VisitDetailPage.tsx` — P0
- All four consume `visit.api`; once `visit.api` is REST-backed they need only error-shape fixes (PostgrestError → `{ code, message }`) and removal of `getSession()` calls in favour of context.

### `src/components/pages/DealerDetailPageV2.tsx` — P0
- **Reads.** `runtimeDB` for dealer + visits + calls.
- **Writes.** `setDealerIsTop` in `src/data/supabaseRaw.ts:654` → `supabase.from('dealers_master').update(...)`.
  - **Target.** `PATCH /v1/dealers/:code { is_top: bool }`.
- **Auth.** KAM JWT; server checks `dealer.kam_id == me`.
- **UX.** Optimistic toggle needs rollback on REST 4xx (today swallows RLS error).

### `src/components/pages/DealerLocationUpdatePage.tsx` — P0
- **Writes.** `supabase.from('location_change_requests').insert(...)` line 74 and `supabase.from('dealers_master').update(...)` line 95.
  - **Target.** `POST /v1/dealers/:code/location-change-requests`. The direct `dealers_master` update path is wrong even today (KAM shouldn't write master) — server should gate behind approval workflow.
- **Auth.** KAM JWT; server moderates before applying.
- **UX.** Replace "instant save" with "submitted for approval" copy.

### `src/components/pages/DCFOnboardingPage.tsx` — P1
- **Writes.** `supabase.from('dcf_onboarding').insert(...)` line 94.
  - **Target.** `POST /v1/dcf/onboarding`.
- **Auth.** KAM JWT.
- **UX.** Same PostgrestError → structured-error fix.

### `src/components/pages/DCFLeadDetailPage.tsx`, `DCFDealerDetailPage.tsx`, `DCFLeadsListPage.tsx`, `DCFDealersListPage.tsx`, `DCFDisbursalsListPage.tsx`, `DCFDealerOnboardingDetailPage.tsx`, `DCFPage.tsx` — P1
- All read-only against `runtimeDB`. Targets: `GET /v1/dcf/leads`, `GET /v1/dcf/leads/:id`, `GET /v1/dcf/dealers`, `GET /v1/dcf/disbursals`, `GET /v1/dcf/summary`.
- Auth: KAM JWT. UX: replace giant client-side filter with server pagination.

### `src/components/pages/HomePage.tsx`, `KAMDetailPage.tsx`, `KAMIncentiveSimulator.tsx`, `IncentiveSimulator.tsx`, `ProductivityDashboard.tsx`, `NotificationCenterPage.tsx`, `DealersPage.tsx` — P1
- Read-only via `runtimeDB` + `crmApi` (which is already REST → Edge Function; needs to point at the new backend host).
- Targets: `GET /v1/me/home`, `GET /v1/me/productivity`, `GET /v1/me/notifications`, `GET /v1/dealers?owner=me`.
- UX: kill the snapshot-warm-up spinner; show per-card loading.

### `src/components/pages/profile/ProfilePage.tsx`, `ProfileCompletePage.tsx` — P1
- Goes through `authService.updateProfile` / `changePassword` (`supabase.auth.updateUser`, `supabase.from('users').update`).
- **Target.** `PATCH /v1/me`, `POST /v1/me/password`.
- Auth: KAM JWT. UX: keep AuthProvider in sync after profile change (today it relies on Supabase realtime user refresh).

### `src/components/pages/auth/SignupPage.tsx`, `LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` — P0 (auth gate)
- `SignupPage`: direct `supabase.from('users').insert(...)` line 52 + `supabase.auth.signUp` via authService.
  - **Target.** `POST /v1/auth/signup` (creates pending user; admin approval workflow already exists).
- Login uses `authService.signInWithPassword` (email/password) and `signInWithGoogle` (OAuth).
  - **Target.** `POST /v1/auth/login`, plus existing Google OAuth redirect → server token exchange `POST /v1/auth/oauth/google/callback`.
- Forgot/Reset: `supabase.auth.signInWithOtp`, `verifyOtp`, `updateUser`, `resetPasswordForEmail`.
  - **Target.** `POST /v1/auth/password-reset/request`, `POST /v1/auth/password-reset/verify`, `POST /v1/auth/password-reset/confirm`.
- **UX.** `AuthProvider` (`src/components/auth/AuthProvider.tsx`) must replace `supabase.auth.onAuthStateChange` with: (1) token in `localStorage`, (2) refresh-token interval, (3) `401 → /login` interceptor. **This is the single most load-bearing change** — every authenticated page depends on it.

---

## TL desktop + mobile (P1)

### `src/components/pages/LeaderboardPage.tsx`, `TLLeaderboardPage.tsx`, `TLHomeView.tsx`, `TLDetailPage.tsx`, `TLIncentiveDashboard.tsx`, `TLIncentiveMobile.tsx`, `TLIncentiveSimulator.tsx`, `PerformancePage.tsx`, `DCFPageTL.tsx`, `UnproductiveCallsList.tsx`, `UnproductiveVisitsList.tsx` — P1
- **Reads.** `runtimeDB` aggregates + `crmApi.fetchLeaderboard` / `fetchIncentiveSummary` (REST already, repoint base URL).
  - **Target.** `GET /v1/leaderboard?scope=team&period=...`, `GET /v1/incentives/summary?user=...`, `GET /v1/teams/:id/productivity`, `GET /v1/teams/:id/unproductive?type=call|visit`.
- **Writes.** None except `visit.api`/`lead.api` writes inherited from KAM flows when TL acts on behalf of KAM.
- **Auth.** TL JWT; server enforces team scope from token `team_id`.
- **UX.** Today the page reads the whole runtimeDB and `.filter(team===myTeam)` in memory — must be server-scoped. Remove RLS-driven empty states.

### `src/api/lead.api.ts` (TL also calls it for team views) — P1
- `supabase.from('sell_leads_master').insert/update` at lines 39, 79, 99.
- **Target.** `POST /v1/leads`, `PATCH /v1/leads/:id` (same endpoints as KAM, server enforces role).

### `src/api/untaggedDealer.api.ts` (TL approves untagged) — P1
- `supabase.from('untagged_dealers').select/update`.
- **Target.** `GET /v1/untagged-dealers`, `PATCH /v1/untagged-dealers/:id { action: 'tag'|'reject', kam_id? }`.
- Auth: TL JWT.

---

## Admin desktop (P1/P2)

### `src/components/admin/AdminApprovalPanel.tsx` — P1
- **Reads.** `supabase.from('signup_requests').select(...)` line 35.
  - **Target.** `GET /v1/admin/signup-requests?status=pending`.
- **Writes.** `supabase.functions.invoke('approve-signup', ...)` lines 67 & 101 (the existing Edge Function).
  - **Target.** `POST /v1/admin/signup-requests/:id/approve` and `/reject`.
- **Auth.** Admin JWT; server-side role gate replaces Edge-Function header check.

### `src/components/admin/desktop/AdminUsersPage.tsx` — P1
- **Reads.** `supabase.from('users').select('*')`, `from('teams').select('*')`.
  - **Target.** `GET /v1/admin/users`, `GET /v1/admin/teams`.
- **Writes.** User edits (inferred from page) → `PATCH /v1/admin/users/:id`.
- **Auth.** Admin JWT.

### `src/components/admin/desktop/AdminHierarchyPage.tsx` — P1
- **Reads.** Four parallel selects on `users`, `teams`, `dealers_master`.
  - **Target.** `GET /v1/admin/hierarchy` (single composite endpoint — current 4-way fan-out is the main perf problem here).
- **Writes.** Dealer reassignments → `PATCH /v1/admin/dealers/:code { kam_id, tl_id }`.
- **Auth.** Admin JWT.
- **UX.** Replace the "load entire dealer master" pattern with paginated + searchable endpoint.

### `src/components/admin/desktop/AdminTargetsPage.tsx` — P1
- **Reads.** `from('targets').select.eq('month',...)`, `from('users')`, `from('teams')` (lines 58–60).
  - **Target.** `GET /v1/admin/targets?month=YYYY-MM`.
- **Writes.** Target edits → `PUT /v1/admin/targets/:user_id?month=...`.
- **Auth.** Admin JWT.

### `src/components/admin/desktop/AdminSettingsPage.tsx` — P2
- **Reads.** `from('audit_log').select(...)`, `from('incentive_slabs')`, `from('incentive_rules')`.
  - **Target.** `GET /v1/admin/audit-log?limit=200`, `GET /v1/admin/incentive-slabs`, `GET /v1/admin/incentive-rules`.
- **Writes.** Slab/rule field edits write directly to table **and** then write an `audit_log` row from the client — this is **dangerous** (client controls audit trail). Move to server.
  - **Target.** `PATCH /v1/admin/incentive-slabs/:id`, `PATCH /v1/admin/incentive-rules/:id` — server writes the audit row.
- **Auth.** Admin JWT.
- **UX.** Remove client-side audit-log insert path.

### `src/components/admin/AdminHomePage.tsx`, `AdminLeadsPage.tsx`, `AdminDealersPage.tsx`, `AdminDCFPage.tsx`, `AdminVCPage.tsx`, `AdminHeader.tsx`, `AdminCommonFilters.tsx`, `TargetsModal.tsx`, `CallCoveragePanel.tsx`, `VisitCoveragePanel.tsx`, `ExportModal.tsx`, `I2TDetailModal.tsx`, `CallDetailModal.tsx`, `VisitDetailModal.tsx`, `DealerStateMetrics.tsx`, `LeadSourceCard.tsx`, `TLLeaderboardRow.tsx`, `ConversionMetricCard.tsx` — P2
- All read-only via `runtimeDB` snapshot. Targets: `GET /v1/admin/leads`, `GET /v1/admin/dealers`, `GET /v1/admin/dcf`, `GET /v1/admin/vc`, `GET /v1/admin/coverage?type=call|visit`, `GET /v1/admin/leaderboard`, `GET /v1/admin/exports`.
- Auth: Admin JWT. UX: replace snapshot dependency with on-demand fetch + filter persisted in URL.

### `src/components/admin/desktop/AdminReportsPage.tsx` — P2
- Currently snapshot-only. Target: `GET /v1/admin/reports/:report_id` with server-side rollup.

---

## Cross-cutting changes (apply once, fixes many pages)

1. **`src/data/supabaseRaw.ts` + `src/data/runtimeDB.ts`** — rewrite as REST clients hitting `GET /v1/snapshot/{table}` (or, preferred, kill `runtimeDB` and switch every page to per-resource endpoints). This file alone is consumed by **18 pages**.
2. **`src/lib/auth/authService.ts`** — replace all `supabase.auth.*` with backend `/v1/auth/*` calls; keep the `AuthSession` shape so callers don't change.
3. **`src/components/auth/AuthProvider.tsx`** — swap `onAuthStateChange` for token-refresh interval + 401 interceptor.
4. **`src/lib/api/crmApi.ts:181`** — flip `BASE_URL` from `https://<project>.supabase.co/functions/v1/make-server-4efaad2c/crm-api` to the new gateway host; auth header changes from `apikey + Bearer publicAnonKey` to `Bearer <jwt>`.
5. **Error shape.** Every page that catches `PostgrestError` (search: `.error` after `await supabase`) must adopt `{ code, message, details }` from REST. About 35 catch sites.
6. **No Postgres realtime to replace** — confirmed nil. Polling intervals are fine for pilot.