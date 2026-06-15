# API Contract — what Cars24 BE team must build or expose

Generated 2026-06-11 from the comprehensive audit.
Lists every endpoint the FE needs to consume to finish the Supabase→Spring backend migration.
Existing endpoints are noted as "already-built"; missing ones come with method+path+payload+auth.

---

I have all the data I need. Producing the contract.

---

# Cars24 CRM — BE Contract for Supabase Cutover

Scope: every endpoint the FE needs to finish removing `@supabase/supabase-js` from `/src/`. Existing Spring controllers are in `backend/crm-api/.../controller/`. FE call sites cited by file:line.

Conventions:
- Base path `/web/v1/...` (web/desktop), `/app/v1/...` (mobile field-ops), `/internal/v1/...` (system).
- All `MUST-HAVE` endpoints require `Authorization: Bearer <JWT>` issued by `POST /web/v1/auth/google/callback` (see Auth domain). 401 on missing/expired.
- Standard error envelope: `{ error: { code, message, details? }, traceId }`. 400 validation, 401 unauth, 403 RBAC, 404 not found, 409 conflict, 422 business rule, 429 rate-limit, 5xx server.
- Rate-limit classes: **R-READ** (60 rpm/user), **R-WRITE** (30 rpm/user), **R-PROXY** (10 rpm/user, Cars24 upstream-protected), **R-EXPORT** (5 rpm/user), **R-AUTH** (10 rpm/IP).

---

## 1. Auth — MOSTLY MISSING (P0 blocker)

**Existing:** None. No `AuthController` in Spring tree.

**Missing — MUST-HAVE:**

| Method+Path | Purpose | Req | Resp | Errors | RL |
|---|---|---|---|---|---|
| `POST /web/v1/auth/google/callback` | Exchange Google ID token for CRM JWT; replace `supabase.auth.signInWithOAuth`. | `{ idToken: string }` | `{ token, refreshToken, expiresIn, profile: { userId, name, email, role, phone, city, mustResetPassword, activeRole, activeActorId } }` | 401 (bad token), 403 (domain not in `cars24.com` allow-list), 403 (user not provisioned / `active=false`) | R-AUTH |
| `POST /web/v1/auth/refresh` | Rotate token before expiry. | `{ refreshToken }` | same as callback | 401 | R-AUTH |
| `POST /web/v1/auth/logout` | Invalidate refresh token. | `{}` | `204` | – | R-WRITE |
| `GET /web/v1/auth/me` | Hydrate profile on app boot; replaces `supabase.from('users').select().eq(user_id)`. | – | `{ profile, mustResetPassword, lastLoginAt }` | 401 | R-READ |
| `POST /web/v1/auth/password/change` | First-login forced reset; replaces `supabase.auth.updateUser({password})` + clearing `must_reset_password`. | `{ newPassword }` | `{ ok: true }` | 400 (weak), 401 | R-AUTH |
| `POST /web/v1/auth/signup-request` | Self-service signup queue; replaces direct insert into `signup_requests`. | `{ name, email, phone, requestedRole, requestedTeamId? }` | `{ requestId, status: 'pending' }` | 409 duplicate | R-AUTH |

**FE call sites consuming these:**
- `src/lib/auth/authService.ts:14,26,106,143,149,157,196,249,279,288,298,307,314,322` — login, OAuth, getSession, signOut, profile fetch, OTP, password update.
- `src/components/auth/AuthProvider.tsx:55` — `onAuthStateChange` listener → replace with token-expiry timer + `/auth/refresh`.
- `src/data/mgmtRepo.ts:177,219,222,225` — `getSession`, `getUser`, `updateUser({password})`, clearing `must_reset_password`.
- `src/components/pages/auth/SignupPage.tsx:53` — insert into `signup_requests`.

**Nice-to-have:** `POST /web/v1/auth/impersonate` for SUPER_ADMIN role-swap (today client-side via `impersonationTargets`).

---

## 2. Bootstrap — EXISTS

**Existing:**
- `GET /web/v1/bootstrap` — `BootstrapController.java:35`
- `GET /app/v1/bootstrap` — `AppBootstrapController.java:35`

**Missing:** none for pilot. Verify response shape includes: `profile`, `featureFlags`, `regionTaxonomy`, `roleConfig`, `appVersion`, `serverTime`. If any are absent today, extend before cutover (MUST-HAVE).

---

## 3. Dashboard — EXISTS

**Existing:**
- `GET /web/v1/dashboard/home` — `DashboardController.java:37`
- `GET /app/v1/dashboard/home` — `AppDashboardController.java:35`

**Missing — MUST-HAVE:**

| Endpoint | Purpose | FE site |
|---|---|---|
| `GET /web/v1/leaderboard?scope=kam|tl&time_scope=…&region=&team_id=&current_user_id=` | Leaderboard widget. | `src/lib/api/crmApi.ts:278` |
| `GET /web/v1/incentives/summary?time_scope=&user_id=` | Incentive card. | `src/lib/api/crmApi.ts:294` |

Response shapes already defined in `src/lib/api/crmApi.ts` types — BE must mirror `LeaderboardResponse` and `IncentiveSummary`. Errors: 403 if requesting cross-team data without TL/ADMIN role. R-READ.

---

## 4. Leads — PARTIAL

**Existing:**
- `GET /web/v1/leads` (list) — `LeadController.java:49`
- `POST /web/v1/leads` (create) — `:70`
- `GET /web/v1/leads/{leadId}` — `:100`
- `PUT /web/v1/leads/{leadId}/pricing` — `:112`

**Missing — MUST-HAVE:**

| Endpoint | Req/Resp | FE site | Notes |
|---|---|---|---|
| `PATCH /web/v1/leads/{leadId}/cep` | `{ cep: number\|null }` → `CEPUpdateResponse` | `src/lib/api/crmApi.ts:253` | 422 if CEP outside slab range. R-WRITE. |
| `GET /web/v1/leads/list` (rich filter) | Query: `page,page_size,time_scope,channel,stage,kam_id,dealer_id,cep_status,status,search,sort_by,sort_order` → `LeadListResponse` | `src/lib/api/crmApi.ts:317` | Distinct from generic list (richer filters + paging contract). R-READ. |
| `POST /web/v1/leads/sell` | Create sell-lead row. Body: `{ name, phone, regNo, dealerCode, source, … }` | `src/api/lead.api.ts:40` (insert `sell_leads_master`), `src/components/pages/LeadCreatePage.tsx:65` (insert `leads_raw`) | Returns `{ leadId }`. 409 on dup phone+regNo within 30d. R-WRITE. |
| `GET /web/v1/leads/sell?dealerCode=&status=` | List sell-leads. | `src/api/lead.api.ts:80,100` | R-READ. |
| `PUT /web/v1/leads/sell/{leadId}` | Update sell-lead stage/CEP. | `src/api/lead.api.ts:100` | R-WRITE. |

**Nice-to-have:** bulk lead import (covered under Admin §10).

---

## 5. Dealers — PARTIAL

**Existing:**
- `GET /web/v1/dealers` — `DealerController.java:50`
- `GET /web/v1/dealers/{dealerCode}` — `:70`
- `POST /web/v1/dealers/untagged` — `:82`
- `PUT /web/v1/dealers/{dealerCode}/top-tag` — `:107`
- `POST /web/v1/dealers/location-request` — `:123`

**Missing — MUST-HAVE:**

| Endpoint | Purpose | FE site |
|---|---|---|
| `GET /web/v1/dealers/untagged` (list) | Today only POST exists; FE needs a read. | `src/data/supabaseRaw.ts:471`, `src/api/untaggedDealer.api.ts:63` |
| `PATCH /web/v1/dealers/untagged/{id}` | Update untagged dealer status. | `src/api/untaggedDealer.api.ts:84` |
| `GET /web/v1/dealers/location-requests` | List pending location-change requests. | `src/data/supabaseRaw.ts:496`, `src/components/pages/DealerLocationUpdatePage.tsx:74` |
| `POST /web/v1/dealers/{dealerCode}/location-change` | Submit lat/lng change request (write to `location_change_requests`). | `src/components/pages/DealerLocationUpdatePage.tsx:74,95` |
| `GET /web/v1/dealers/lite?fields=dealer_code,dealer_name` | Lightweight picker dataset; replaces `supabase.from('dealers_master').select('dealer_code, dealer_name')`. | `src/api/visit.api.ts:275`, `src/data/supabaseRaw.ts:654` |

All R-READ except POST/PATCH (R-WRITE). 403 if dealer not in caller's KAM/TL scope.

---

## 6. Calls — EXISTS

**Existing:**
- `GET /web/v1/calls` — `CallController.java:48`
- `POST /web/v1/calls` — `:64`
- `PUT /web/v1/calls/{callId}/feedback` — `:92`

**Missing — MUST-HAVE:**

| Endpoint | Purpose | FE site |
|---|---|---|
| `GET /web/v1/calls?dealerCode=&kamId=&from=&to=` | Detailed call-event filtering used by dealer detail. | `src/api/visit.api.ts:319,353,368` (multiple `call_events` reads) |
| `POST /app/v1/calls` | Mobile mirror of `POST /web/v1/calls` (CTI integration). | (mobile shell) |

R-WRITE for POST; R-READ for GET.

---

## 7. Visits — EXISTS

**Existing:**
- `GET /web/v1/visits` — `VisitController.java:48`
- `POST /web/v1/visits` (start) — `:64`
- `PUT /web/v1/visits/{visitId}/complete` — `:91`

**Missing — MUST-HAVE:**

| Endpoint | Purpose | FE site |
|---|---|---|
| `POST /app/v1/visits/start` | Mobile start (GPS + dealer). Mirrors web POST but enforces lat/lng + photo. | `src/api/visit.api.ts:125,167` |
| `PATCH /web/v1/visits/{visitId}` | Partial update (feedback, end_time, photo URL). | `src/api/visit.api.ts:203,220` |
| `POST /web/v1/visits/{visitId}/photo` | Multipart upload of geo-stamped visit photo, returns CDN URL. | (today handled via Supabase storage; no FE replacement yet — block for mobile pilot) |
| `GET /web/v1/visits/blocker` | Daily-blocker rule (KAM cannot log visit X without visit Y first). | edge fn parity: `visit_routes.tsx:445` |

R-WRITE; photo upload R-PROXY (size-limited, virus-scanned).

---

## 8. Notifications — EXISTS

**Existing:**
- `GET /web/v1/notifications` — `NotificationController.java:43`
- `GET /web/v1/notifications/unread-count` — `:58`
- `PUT /web/v1/notifications/{notificationId}/read` — `:69`

**Missing — NICE-TO-HAVE:** `POST /web/v1/notifications/mark-all-read`, `DELETE /web/v1/notifications/{id}`. Not blocking pilot.

---

## 9. Admin — PARTIAL

**Existing:**
- Users: `GET/POST /web/v1/admin/users`, `GET/PUT /web/v1/admin/users/{userId}`, `PUT .../deactivate`, `PUT .../reactivate` — `AdminUserController.java`
- Teams: `GET /web/v1/admin/teams`, `GET/POST/PUT /web/v1/admin/teams[/{id}]` — `AdminTeamController.java`
- Targets: `GET /web/v1/admin/targets`, `PUT .../{targetId}`, `POST .../initialize` — `AdminTargetController.java`
- Config: `GET/POST/PUT /web/v1/admin/config/slabs[/{id}]`, `.../rules[/{id}]` — `AdminConfigController.java`
- Hierarchy: `POST /web/v1/admin/hierarchy/dry-run`, `POST .../apply` — `AdminHierarchyController.java`
- Jobs: `POST /web/v1/admin/imports`, `POST .../exports`, `GET .../jobs[/{id}]` — `AdminJobController.java`
- Audit: `GET /web/v1/admin/audit` — `AdminAuditController.java`
- Internal: `GET /internal/v1/org/hierarchy` — `InternalOrgController.java`

**Missing — MUST-HAVE:**

| Endpoint | Purpose | FE site |
|---|---|---|
| `GET /web/v1/admin/signup-requests?status=pending` | Approval queue list; replaces direct `signup_requests` read. | `src/components/admin/AdminApprovalPanel.tsx:36` |
| `POST /web/v1/admin/signup-requests/{id}/approve` | Replaces edge fn `approve-signup`. Body: `{ role, teamId?, region?, city? }` → `{ userId, tempPassword }`. | `src/components/admin/AdminApprovalPanel.tsx:67,101` |
| `POST /web/v1/admin/signup-requests/{id}/reject` | Reject + reason. | same |
| `POST /web/v1/admin/dealers/reassign` | Replaces `mgmt-reassign-dealers` edge fn. Body: `{ dealer_ids, new_kam_id, dry_run }` → impact summary. | `src/data/mgmtRepo.ts:130` |
| `POST /web/v1/admin/bulk-upload` | Replaces `mgmt-bulk-upload`. Body: `{ type: 'targets'\|'dealer_kam_mapping', rows, dry_run }`. | `src/data/mgmtRepo.ts:143` |

All R-WRITE. RBAC: ADMIN/SUPER_ADMIN only (403 otherwise).

**Nice-to-have:** `GET /web/v1/admin/audit/{entity}/{id}` (single-entity audit trail), `POST /web/v1/admin/feature-flags` (today no UI).

---

## 10. Uploads — EXISTS

**Existing:**
- `POST /web/v1/uploads/initiate` — `UploadController.java:38` (returns pre-signed URL)
- `GET /web/v1/uploads/{uploadId}/download` — `:63`
- `GET /web/v1/uploads` — `:75`
- `DELETE /web/v1/uploads/{uploadId}` — `:86`

**Missing — MUST-HAVE:** `POST /web/v1/uploads/{uploadId}/complete` (signal finalize after S3 PUT, returns canonical URL). Today FE assumes immediate availability — race condition. R-WRITE.

**Missing — NICE-TO-HAVE:** `POST /web/v1/exports` for CSV download (today FE hits raw `mgmt-export` edge fn — `src/data/mgmtRepo.ts:180`). Body: `{ entity, fields, filters, from, to }`. Streamed CSV response with `X-Row-Count`. R-EXPORT. Promote to MUST-HAVE if admin export is in pilot scope.

---

## 11. DCF — EXISTS

**Existing:**
- `GET /web/v1/dcf/{dcfId}` — `DcfController.java:43`
- `GET /web/v1/dcf/{dcfId}/timeline` — `:53`
- `POST /web/v1/dcf/onboard` — `:63`

**Missing — MUST-HAVE:** `GET /web/v1/dcf?dealerCode=&status=&from=&to=` (list). Today FE pulls all `dcf_leads_master` via `fetchDcfLeadsRaw` (`src/data/supabaseRaw.ts:351`). Must support paging + filters. R-READ. **NICE-TO-HAVE:** `PATCH /web/v1/dcf/{dcfId}/status`.

`POST /web/v1/dcf/onboard` already covers the `dcf_onboarding` insert at `src/components/pages/DCFOnboardingPage.tsx:94` — verify payload parity.

---

## 12. Appointments — EXISTS

**Existing:**
- `GET /web/v1/appointments`, `GET .../{id}`, `POST`, `PUT .../reschedule`, `PUT .../status` — `AppointmentController.java`

**Missing:** none for pilot. Note: this overlaps Cars24 proxy slot booking (§13) — confirm whether appointments persisted locally or only via proxy.

---

## 13. C24 Proxy — EXISTS

**Existing (`Cars24ProxyController.java`):**
- Vehicle: `GET /web/v1/c24/vehicle/{makes,years,models,variants,states,cities,rto-codes}`, `GET .../vehicle/lookup/{regNo}`
- Leads: `POST .../leads/{dealerCode}/{estimate-price,create}`, `GET .../leads/{dealerCode}/{leadId}/slots`, `POST .../leads/.../book-appointment`, `.../reschedule-appointment`, `.../send-otp`, `.../verify-otp`
- Maps: `GET .../maps/autocomplete`, `GET .../maps/reverse-geocode`

**Missing — NICE-TO-HAVE:** `GET /web/v1/c24/leads/{dealerCode}/{leadId}` (single lead pull-through for status refresh), `GET /web/v1/c24/vehicle/lookup-batch` (regNo batch). All R-PROXY with circuit-breaker on upstream 5xx → return 503 with `Retry-After`.

---

## Pilot Cutover — Priority Roll-up

### MUST-HAVE (P0 — pilot blocker)
1. **Auth**: all 6 endpoints in §1 — nothing exists today, blocks every screen.
2. **Leads**: `PATCH /cep`, `GET /list` rich filter, `POST/GET/PUT /sell` — §4.
3. **Dealers**: `GET /untagged` list, `PATCH /untagged/{id}`, `GET /location-requests`, `POST /location-change`, `GET /lite` — §5.
4. **Calls**: filtered `GET /web/v1/calls` — §6.
5. **Visits**: `PATCH /visits/{id}`, `POST /photo`, `GET /blocker`, mobile `POST /app/v1/visits/start` — §7.
6. **Admin**: signup-request list + approve/reject, dealer reassign, bulk-upload — §9.
7. **Dashboard**: leaderboard, incentive summary — §3.
8. **Uploads**: `POST /uploads/{id}/complete` — §10.
9. **DCF**: `GET /dcf` list — §11.
10. **Bootstrap**: verify response includes `featureFlags`, `roleConfig`, `regionTaxonomy` — §2.

### NICE-TO-HAVE (post-pilot)
- Notifications bulk ops (§8).
- `POST /web/v1/exports` (replace mgmt-export) — §10. Promote if pilot needs admin CSV.
- Auth impersonation (§1).
- Admin audit per-entity, feature-flag UI (§9).
- DCF status PATCH (§11).
- C24 proxy: single-lead pull, batch regNo lookup, maps deepening (§13).

### Cross-cutting BE work (P0, not endpoint-shaped)
- Issue + verify CRM JWTs (HS256/RS256), refresh-token rotation, replay store.
- RBAC matrix on every endpoint (KAM ⊂ TL scope ⊂ ADMIN ⊂ SUPER_ADMIN). Today many writes rely on Supabase RLS — must move to controller-level.
- Audit-log writes on every WRITE (today FE writes `audit_log` directly at `mgmtRepo.ts:76,102` and `AdminSettingsPage.tsx:62,70` — BE must own this).
- Idempotency keys on `POST /leads`, `POST /visits`, `POST /calls`, `POST /uploads/initiate` (mobile-flaky-network safety).
- CORS allow-list, structured error envelope, traceId propagation.

FE files that disappear after cutover: `src/lib/supabase/client.ts`, `src/data/supabaseRaw.ts`, `src/data/mgmtRepo.ts` edge-invoke layer, `src/supabase/functions/server/*`.