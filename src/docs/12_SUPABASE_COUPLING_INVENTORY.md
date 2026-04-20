# Supabase Coupling Inventory

**Date:** April 10, 2026  
**Purpose:** Authoritative D1 inventory of executable and config-level Supabase coupling  
**Status:** Phase 1 D1 complete

---

## Scope

- Includes executable code, runtime config, platform config, scripts, and deployable server-side paths that couple the repo to Supabase.
- Excludes markdown-only references such as handoff docs, README notes, and verification guides.
- The only grouped rows in the matrix are the duplicate deploy trees under `supabase/functions/server/*` and `supabase/functions/make-server-4efaad2c/*`.
- `supabase/functions/server/*` and `supabase/functions/make-server-4efaad2c/*` are duplicate deploy trees. `diff -rq` is clean between those two directories.
- `src/supabase/functions/server/*` is a separate reference/source copy and differs from the deploy tree in at least `crm_routes.tsx`, `mock_leads.tsx`, and the `index.tsx` vs `index.ts` entrypoint.

## Summary

- `43` matrix entries were identified.
- Dominant coupling counts by primary risk lens:
  - Auth/session: `4`
  - Direct table reads: `11`
  - Direct table writes or raw-table upserts: `17`
  - Supabase Functions URLs, invokes, or hosted edge endpoints: `9`
  - Supabase Storage: `3`
  - Supabase env/key/url coupling: `15`
  - Platform allowlists / mobile networking: `2`
  - Legacy server-side or duplicate deploy paths: `10`

## Target Replacement Vocabulary

- `Backend auth/session contract`
- `Backend read/query endpoint`
- `Backend admin command endpoint`
- `crm-api business endpoint`
- `Company Postgres repository/service`
- `Approved object storage`
- `Platform config removal`
- `Secret management cleanup`
- `Decommission/archive`

## Dependency Matrix

### Shared Client, Config, And Bootstrap

| Path | Layer | Dependency Kind | Operation Type | Supabase Asset | Current Flow / Screen | Target Backend Replacement | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `package.json` | Build/runtime | SDK dependency | Installs browser and edge Supabase SDKs | `@supabase/supabase-js`, `@jsr/supabase__supabase-js` | Frontend runtime, scripts, edge code | `Decommission/archive` | High | Removal is blocked until all runtime and script callers are gone. |
| `src/lib/supabase/client.ts` | Frontend infra | Env + SDK bootstrap | `createClient()` from Vite env | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Shared browser DB/auth client | `Backend auth/session contract` + shared HTTP client | High | Root browser entrypoint for direct Supabase access. |
| `src/config/env.ts` | Frontend config | Env coupling | Exposes Supabase URL/key and logs URL in dev | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | App startup config | `Platform config removal` | High | Also defaults the app to real Supabase data. |
| `src/utils/supabase/info.tsx` | Frontend config | Hardcoded host/key | Exports fixed project id and anon key | Project id, public anon key | `crmApi` URL/header construction | `Secret management cleanup` | High | Static key in source. |
| `src/lib/api/crmApi.ts` | Frontend service | Hosted edge API coupling | Calls `/functions/v1/make-server-4efaad2c/crm-api` with anon-key headers | Supabase Functions URL + anon key | Dashboard, dealer, lead, calls, visits reads | `crm-api business endpoint` | High | Uses Supabase-hosted API instead of company backend. |
| `src/main.tsx` | Frontend bootstrap | Env UX coupling | Boot error copy tells user to verify Supabase env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | App boot failure UI | `Platform config removal` | Low | Dev-facing, but still encoded coupling. |
| `src/data/supabase.types.ts` | Type layer | Generated schema/RPC coupling | Generated public schema and RPC typing | Supabase schema, `exec_raw_sql` RPC | Compile-time table/RPC contracts | `Decommission/archive` | Medium | Not runtime, but locks code to Supabase schema shape. |
| `src/data/runtimeDB.ts` | Frontend data bootstrap | Transitive runtime coupling | Bootstraps whole app from Supabase-backed cache loader | `supabaseRaw` adapter | Whole-app data bootstrap | `Backend read/query endpoint` | High | Required D1 seed file; no direct SDK calls but central to coupling. |

### Frontend Auth, Data Layer, And Direct Screen Access

| Path | Layer | Dependency Kind | Operation Type | Supabase Asset | Current Flow / Screen | Target Backend Replacement | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/lib/auth/authService.ts` | Frontend auth | Auth + profile table coupling | Login, logout, OTP, password reset, password change; reads/writes `users` | Supabase Auth, `users` | Sign-in, profile update, password reset | `Backend auth/session contract` + user profile endpoint | High | Browser auth is Supabase-owned today. |
| `src/data/supabaseRaw.ts` | Frontend read adapter | Direct table reads | Paginated reads from `users`, `teams`, `dealers_master`, `sell_leads_master`, `call_events`, `visits`, `dcf_leads_master`, `untagged_dealers`, `location_requests`, `targets`, `incentive_slabs`, `incentive_rules` | Public tables | RuntimeDB bootstrap for all major screens | `Backend read/query endpoint` | High | Largest single read-side coupling surface. |
| `src/data/supabaseRaw.ts` | Frontend write adapter | Direct table write | Updates `dealers_master.is_top` via `setDealerIsTop()` | `dealers_master` | Dealer detail / activity “Top” toggle | `Backend admin command endpoint` | High | Write path is embedded in the read adapter. |
| `src/data/mgmtRepo.ts` | Frontend admin service | Edge function command coupling | `functions.invoke()` for `mgmt-create-user`, `mgmt-deactivate-user`, `mgmt-initialize-month`, `mgmt-reassign-dealers`, `mgmt-bulk-upload` | Edge Functions | Admin user/target/hierarchy actions | `Backend admin command endpoint` | High | Admin command surface is split between table writes and functions. |
| `src/data/mgmtRepo.ts` | Frontend admin service | Mixed auth, table, and URL coupling | Reads session/user; writes `users`, `targets`, `audit_log`; fetches `/functions/v1/mgmt-export`; resets password via auth + `users` flag | Auth, tables, hosted export function | Admin edits, exports, forced password reset | `Backend admin command endpoint` + `Backend auth/session contract` | High | One module mixes three migration targets. |
| `src/api/visit.api.ts` | Frontend field ops API | Direct table reads/writes | Creates, updates, and lists `visits` and `call_events`; looks up `dealers_master` | `visits`, `call_events`, `dealers_master` | Visit start/end/feedback, call logging, activity history | `crm-api business endpoint` | High | Explicitly bypasses edge routes in favor of direct Postgres tables. |
| `src/api/lead.api.ts` | Frontend lead API | Direct table write | Inserts and updates `sell_leads_master` | `sell_leads_master` | Lead create, status change, CEP update | `crm-api business endpoint` | High | Read methods use cache; write methods hit DB directly. |
| `src/api/untaggedDealer.api.ts` | Frontend field ops API | Direct table reads/writes | Upserts and lists `untagged_dealers` | `untagged_dealers` | Untagged dealer creation/listing | `crm-api business endpoint` | High | KAM flow writes directly to DB. |
| `src/components/pages/LeadCreatePage.tsx` | Page | Direct table write | Inserts `leads_raw` from the UI | `leads_raw` | KAM lead creation screen | `crm-api business endpoint` | High | Raw-table write from screen code. |
| `src/components/pages/DCFOnboardingPage.tsx` | Page | Direct table write | Inserts `dcf_onboarding` | `dcf_onboarding` | DCF onboarding flow | `crm-api business endpoint` | High | No backend validation boundary. |
| `src/components/pages/DealerLocationUpdatePage.tsx` | Page | Direct table write | Inserts `location_change_requests`; updates `dealers_master` directly for first-time setup | `location_change_requests`, `dealers_master` | Dealer location update flow | `crm-api business endpoint` | High | Write-side table name diverges from read-side `location_requests`. |
| `src/components/pages/auth/SignupPage.tsx` | Page | Direct table write | Inserts `signup_requests` | `signup_requests` | Public access request form | `crm-api business endpoint` | High | Public write handled from browser. |
| `src/components/admin/AdminApprovalPanel.tsx` | Page | Table read + auth + edge invoke | Reads `signup_requests`, gets session, invokes `approve-signup` | Table, Auth, Edge Function | Admin signup approval flow | `Backend admin command endpoint` | High | Approval console mixes three coupling styles. |
| `src/components/admin/desktop/AdminTargetsPage.tsx` | Page | Direct table reads | Reads `targets`, `users`, `teams` | Tables | Admin targets screen | `Backend read/query endpoint` | Medium | Save path is partly routed through `mgmtRepo`, read path is not. |
| `src/components/admin/desktop/AdminSettingsPage.tsx` | Page | Direct table reads/writes | Reads/writes `audit_log`, `incentive_slabs`, `incentive_rules` | Tables | Admin settings and audit log | `Backend admin command endpoint` | High | Config writes still happen in screen code. |
| `src/components/admin/desktop/AdminHierarchyPage.tsx` | Page | Direct table reads | Reads `users`, `teams`, `dealers_master` | Tables | Org tree, KAM/TL mapping, dealer ownership views | `Backend read/query endpoint` | Medium | Mutations mostly route through `mgmtRepo`; reads do not. |
| `src/components/admin/desktop/AdminUsersPage.tsx` | Page | Direct table reads | Reads `users`, `teams` | Tables | Admin user management list | `Backend read/query endpoint` | Medium | Create/update/deactivate is partly abstracted, but list bootstrap is direct. |

### Platform Config And Ops / Integration Scripts

| Path | Layer | Dependency Kind | Operation Type | Supabase Asset | Current Flow / Screen | Target Backend Replacement | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `capacitor.config.json` | Platform config | Mobile allowlist | Allows WebView navigation to project and wildcard Supabase hosts | `fdmlyrgiktljuyuthgki.supabase.co`, `*.supabase.co`, `*.supabase.in` | Android app networking | `Platform config removal` | High | Must move to company backend hosts only. |
| `android/app/src/main/res/xml/network_security_config.xml` | Platform config | Mobile network trust | Whitelists `supabase.co` and `supabase.in` domains | Supabase domains | Android TLS/network policy | `Platform config removal` | High | Keeps mobile runtime coupled to Supabase hostnames. |
| `scripts/seed.ts` | Ops script | Service-role SDK + raw upserts | Upserts `dealers_raw`, `calls_raw`, `visits_raw`, `leads_raw`, `dcf_leads_raw`, `location_requests_raw`, `org_raw` | Service role + raw tables | Local seed/bootstrap tooling | `Company Postgres repository/service` | Medium | Seeding strategy assumes Supabase raw-table staging. |
| `scripts/test_supabase_frontend.ts` | Ops script | Frontend env + table read | Creates browser-style client from `VITE_SUPABASE_*` and reads `dealers_raw` | Vite env, `dealers_raw` | Frontend smoke test | `Decommission/archive` | Low | Verification script only. |
| `scripts/execute_seed.py` | Ops script | Hardcoded URL/key/host | Hardcoded project URL and anon key; direct `db.<project>.supabase.co` Postgres host | Supabase URL, anon key, DB host | Seed SQL execution | `Company Postgres repository/service` | High | Security cleanup candidate. |
| `scripts/execute_seed_via_rpc.py` | Ops script | Hardcoded URL/key + RPC | Calls `/rest/v1/rpc/exec_raw_sql` with hardcoded anon key | REST RPC | Seed SQL execution | `Decommission/archive` | High | Depends on Supabase RPC execution path. |
| `scripts/rebuild_from_reference.py` | Ops script | Hardcoded URL/key + RPC | Rebuilds `sell_leads_master`, `dcf_leads_master`, `dealers_master` via `exec_raw_sql` | REST RPC, canonical tables | One-off rebuild from Excel reference | `Company Postgres repository/service` | High | Also embeds a user-local Excel path. |
| `supabase/google_sheets_sync.gs` | External integration | Hardcoded URL/key + REST sync | Upserts raw tables and `org_raw` over `/rest/v1/*`; handles reverse sync webhook flow | Supabase REST API | Google Sheets bridge | `crm-api business endpoint` or `Decommission/archive` | High | Another hardcoded anon key in source. |

### Legacy Server-Side And Supabase-Hosted Backends

| Path | Layer | Dependency Kind | Operation Type | Supabase Asset | Current Flow / Screen | Target Backend Replacement | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/backend_api/scripts/verify.ts` | Legacy backend | Direct Supabase Postgres | Verifies schema/tables over `DATABASE_URL` against Supabase Postgres | Supabase Postgres | `backend_api` verification | `Company Postgres repository/service` | Medium | Executable script, not docs-only. |
| `src/supabase/functions/server/crm_db.tsx` | Legacy edge backend | Direct Supabase Postgres | Uses `CRM_DB_URL` with `npm:postgres` query helpers | Supabase Postgres | CRM edge API query layer | `Company Postgres repository/service` | High | Core DB abstraction for edge-hosted API. |
| `src/supabase/functions/server/auth_middleware.tsx` | Legacy edge backend | Service-role auth | Reads `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`; validates token with `auth.getUser()` | Supabase Auth | Edge API auth middleware | `Backend auth/session contract` | High | JWT/user validation is Supabase-owned today. |
| `src/supabase/functions/server/kv_store.tsx` | Legacy edge backend | Service-role table CRUD | CRUD on `kv_store_4efaad2c` | KV table | Figma Make KV store / field-ops state | `Decommission/archive` or company cache | Medium | Auto-generated helper. |
| `src/supabase/functions/server/sync_routes.tsx` | Legacy edge backend | Hosted sync endpoint | Secret-gated `/sync/push` route that upserts `dealers_raw`, `leads_raw`, `calls_raw`, `visits_raw`, `dcf_leads_raw`, `location_requests_raw`, `org_raw` | Edge Functions, raw tables | Sheet/Excel sync ingress | `crm-api business endpoint` | High | Separate raw-ingest path from `index.tsx`; must not survive cutover. |
| `src/supabase/functions/server/index.tsx` | Legacy edge backend | Hosted sync endpoint | Creates Supabase admin client and upserts raw tables on `/make-server-4efaad2c/sync/push` | Edge Functions, raw tables | Sheet/Excel sync ingress | `crm-api business endpoint` | High | Duplicate ingress path exists in deploy trees too. |
| `src/supabase/functions/server/visit_routes.tsx` | Legacy edge backend | Storage + KV coupling | Ensures bucket `make-4efaad2c-visit-proofs`, uploads proofs, creates signed URLs, stores field-ops state in KV | Supabase Storage, KV table | Field-ops edge API | `Approved object storage` + `crm-api business endpoint` | High | Bucket lifecycle is owned by the edge function. |
| `src/supabase/functions/server/crm_routes.tsx` | Legacy edge backend | Hosted API shell | `/make-server-4efaad2c/crm-api` Hono shell over edge runtime and `crm_db` | Edge Functions, Postgres | Dashboard, lead, dealer, call, visit APIs | `crm-api business endpoint` | High | Route shell remains Supabase-hosted even when DB calls go through `crm_db`. |
| `supabase/functions/server/*` | Deploy tree | Duplicate hosted backend | Deployable copy of `auth_middleware.tsx`, `crm_routes.tsx`, `index.ts`, `kv_store.tsx`, `sync_routes.tsx`, `visit_routes.tsx`, plus helper modules | Edge Functions, tables, storage | Active deploy path | `Decommission/archive` | High | Root deploy tree duplicates `src/supabase/functions/server/*`. |
| `supabase/functions/make-server-4efaad2c/*` | Deploy alias | Duplicate hosted backend | Second deploy copy of `auth_middleware.tsx`, `crm_routes.tsx`, `index.ts`, `kv_store.tsx`, `sync_routes.tsx`, `visit_routes.tsx`, plus helper modules | Edge Functions, tables, storage | Alternate active deploy path | `Decommission/archive` | High | Duplicate of duplicate; keeps two Supabase-backed server paths alive. |

## Newly Discovered Migration Risks

- Direct writes are scattered well beyond the intended data layer. `LeadCreatePage`, `DCFOnboardingPage`, `DealerLocationUpdatePage`, `SignupPage`, and `AdminSettingsPage` all mutate tables from screen code.
- Hardcoded project identifiers and anon keys exist in runtime code and scripts, not only env handling. The most exposed paths are `src/utils/supabase/info.tsx`, `supabase/google_sheets_sync.gs`, `scripts/execute_seed.py`, `scripts/execute_seed_via_rpc.py`, and `scripts/rebuild_from_reference.py`.
- The repo carries three Supabase-hosted server code locations at once: `src/supabase/functions/server/*`, `supabase/functions/server/*`, and `supabase/functions/make-server-4efaad2c/*`.
- Read/write model naming is already inconsistent around location updates: runtime reads use `location_requests`, while screen writes use `location_change_requests`.

## Follow-Up Tasks Created From This Audit

- Add explicit hardcoded key / host cleanup under Phase 6 Task S3.
- Add explicit duplicate-edge-tree and direct-Supabase-ops cleanup under Phase 8 Task C2.
