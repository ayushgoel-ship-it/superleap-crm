# Legacy Backend Reference Contracts

**Date:** April 10, 2026  
**Purpose:** Authoritative D3 record of existing route behavior in `src/backend_api` so useful contracts can be preserved during the backend migration without copying the legacy implementation style  
**Status:** Phase 1 D3 complete

---

## Scope And Sources

- Primary source of truth for this document is executable code under:
  - `src/backend_api/routes/*`
  - `src/backend_api/utils/*`
  - `src/backend_api/middleware/*`
- Comparison sources used only to identify contract drift:
  - `src/docs/API_CONTRACTS.md`
  - `src/lib/api/crmApi.ts`
  - `src/supabase/functions/server/crm_routes.tsx`
- This is a reference-contract sheet, not a target API design. It records current behavior, then marks what should be preserved, cleaned up, or redesigned in the Spring backend.
- D3 scope is limited to the legacy backend routes already implemented in `src/backend_api`. It does not treat edge-only routes as part of the canonical D3 implementation surface.

## Cross-Cutting Legacy Behavior

### Shared Response Envelope

All success responses are wrapped as:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "ISO-8601",
    "request_id": "req-...",
    "time_scope": "optional",
    "role": "optional"
  },
  "error": null
}
```

All handled errors are wrapped as:

```json
{
  "success": false,
  "data": null,
  "meta": {
    "timestamp": "ISO-8601",
    "request_id": "req-..."
  },
  "error": {
    "code": "STRING_CODE",
    "message": "message"
  }
}
```

Decision: `preserve`

- Preserve the envelope family, request id propagation, and consistent error-code shape.
- Redesign the exact namespace and DTO catalog later under Phase 4 `A1`.

### Pagination Behavior

- Shared parser supports:
  - `page`, default `1`
  - `page_size`, default `20`
  - max `page_size` `100`
- Shared pagination metadata:
  - `page`
  - `page_size`
  - `total_items`
  - `total_pages`
  - `has_next`

Decision: `preserve`

- Preserve the metadata shape and default/max behavior.
- Keep pagination semantics centralized in the future backend.

### Time Scope Behavior

- Supported values in code: `d-1`, `last-7d`, `mtd`, `last-30d`, `last-6m`, `lifetime`
- Invalid or missing values fall back to `mtd`
- Current per-route defaults:
  - dashboard: `mtd`
  - leads: `mtd`
  - dealers: `mtd`
  - calls: `last-7d`
  - visits: `last-7d`
  - notifications: no `time_scope`
- Date math is resolved in IST and converted to UTC timestamps for querying.

Decision: `preserve with cleanup`

- Preserve `time_scope` as a first-class query concept.
- Redesign route-specific default drift so the new API has explicit, published defaults per workflow family.

### Auth And Role Scope

- All legacy Express routes are mounted behind `authMiddleware`.
- Production-style path:
  - reads Bearer token
  - decodes payload
  - expects `user_id` and `role`
- Dev path:
  - allows `X-User-Id`, `X-User-Role`, `X-Team-Id`
- Admin impersonation is supported through `X-Impersonate-User-Id`.
- Shared row filters:
  - `KAM` -> `kam_user_id = current user`
  - `TL` -> `tl_user_id = current user`
  - `ADMIN` -> unrestricted
  - notifications -> `user_id = current user`

Decision: `preserve with cleanup`

- Preserve backend-owned actor scoping and impersonation as concepts.
- Redesign the transport and trust model around the future company auth contract instead of dev headers and unverified JWT parsing.

### Authorization Gap To Carry Forward As A Warning

- List routes apply role-scoped filtering.
- Detail routes in `leads`, `dealers`, `calls`, and `visits` fetch by id without route-level ownership checks.

Decision: `redesign`

- Do not preserve this behavior.
- Future detail APIs must enforce actor scope server-side.

## Endpoint Inventory

| Endpoint | Route File | Current Intent | Migration Decision |
| --- | --- | --- | --- |
| `GET /v1/dashboard/home` | `routes/dashboard.ts` | Config-driven home dashboard | `preserve with cleanup` |
| `GET /v1/leads` | `routes/leads.ts` | Paginated lead list + summary | `preserve with cleanup` |
| `GET /v1/leads/:lead_id` | `routes/leads.ts` | Lead detail with dealer snapshot | `preserve with cleanup` |
| `GET /v1/dealers` | `routes/dealers.ts` | Paginated dealer portfolio + summary | `preserve with cleanup` |
| `GET /v1/dealers/:dealer_id` | `routes/dealers.ts` | Dealer 360 detail | `preserve` |
| `GET /v1/calls` | `routes/calls.ts` | Paginated calls feed + analytics | `preserve with cleanup` |
| `GET /v1/calls/:call_id` | `routes/calls.ts` | Call detail + historical context | `preserve with cleanup` |
| `GET /v1/visits` | `routes/visits.ts` | Paginated visits feed + analytics | `preserve with cleanup` |
| `GET /v1/visits/:visit_id` | `routes/visits.ts` | Visit detail + historical context | `preserve with cleanup` |
| `GET /v1/notifications` | `routes/notifications.ts` | User inbox + unread count | `preserve with cleanup` |

## Route Reference Details

### `GET /v1/dashboard/home`

- Query params:
  - `time_scope`, default `mtd`
- Response shape:
  - standard envelope
  - `data` comes from `buildDashboard(...)`
  - `meta` includes `time_scope` and `role`
- Role behavior:
  - dashboard is built from `req.auth`
  - role-aware layout resolution is implicit in `dashboardService`
- Preserve:
  - one-call home bootstrap pattern
  - role-aware dashboard payload family
  - shared envelope and `meta.time_scope`
- Redesign:
  - implementation should become explicit business DTOs, not config-table execution as a migration requirement
  - auth transport should follow the company request-auth contract

### `GET /v1/leads`

- Query params:
  - `page`
  - `page_size`
  - `time_scope`, default `mtd`
  - `channel`
  - `status`
  - `stage`
  - `dealer_id`
  - `search`
  - `sort_by`, allowed effectively: `created_at`, `updated_at`, `customer_name`, `stage`
  - `sort_order`, `asc` or `desc`, default `desc`
- Pagination:
  - shared pagination parser and metadata
- Response shape:
  - `data.items`
  - `data.pagination`
  - `data.summary`
- Role behavior:
  - list rows are scope-filtered by role
- Notable assumptions:
  - time filtering is on `created_at`
  - summary contains status and channel breakdowns
  - summary query computes `dcf` internally but response only exposes `NGS` and `GS`
- Preserve:
  - paginated lead list family
  - list + summary bundle
  - server-owned role filtering
- Redesign:
  - reconcile naming against published `GET /v1/leads/list`
  - publish one canonical filter set instead of route-only behavior
  - align pricing and CEP fields with the actual frontend migration target

### `GET /v1/leads/:lead_id`

- Query params:
  - none
- Response shape:
  - lead detail fields
  - `dealer_snapshot`
  - `timeline` currently always empty
- Role behavior:
  - route does not apply scope enforcement beyond authenticated access
- Notable assumptions:
  - dealer snapshot is included inline
  - KAM phone is included
  - timeline is reserved but not implemented
- Preserve:
  - lead detail family
  - embedded dealer snapshot
- Redesign:
  - enforce scoped authorization on detail reads
  - decide whether empty `timeline` remains part of the public DTO
  - reconcile against published pricing-oriented lead detail contract

### `GET /v1/dealers`

- Query params:
  - `page`
  - `page_size`
  - `time_scope`, default `mtd`
  - `segment`
  - `status`
  - `tag`
  - `search`
- Pagination:
  - shared pagination parser and metadata
- Response shape:
  - `data.items`
  - `data.pagination`
  - `data.summary`
- Role behavior:
  - list rows are scope-filtered by role
- Notable assumptions:
  - list includes inline computed metrics for leads, inspections, stock-ins, DCF leads
  - list includes last visit/call recency fields
  - sort is fixed to `d.name ASC`
- Preserve:
  - dealer portfolio read shape with embedded metric summary
  - segment/status/tag filters
- Redesign:
  - publish sorting semantics instead of leaving them implicit
  - decide whether inline metrics stay on the list or move to a dedicated summary fragment

### `GET /v1/dealers/:dealer_id`

- Query params:
  - `time_scope`, default `mtd`
- Response shape:
  - dealer identity/contact fields
  - `metrics`
  - `productivity`
  - `recent_calls`
  - `recent_visits`
  - `top_leads`
  - `dcf_status`
  - last interaction timestamps
- Role behavior:
  - route does not enforce scoped access at query level
- Notable assumptions:
  - this is already a business-oriented 360 payload, not a raw table dump
  - multiple aggregate queries are bundled into one response
- Preserve:
  - dealer 360 family as a migration anchor for frontend cutover
  - bundled metrics and recent activity summaries
- Redesign:
  - add scoped authorization enforcement
  - decide whether all sections remain synchronous in the new backend or are split behind one orchestrated read service

### `GET /v1/calls`

- Query params:
  - `page`
  - `page_size`
  - `time_scope`, default `last-7d`
  - `dealer_id`
  - `kam_id`
  - `feedback_status`
  - `is_productive`
- Pagination:
  - shared pagination parser and metadata
- Response shape:
  - `data.items`
  - `data.pagination`
  - `data.analytics`
- Role behavior:
  - list rows are scope-filtered by role
- Notable assumptions:
  - sort is fixed to most recent date/start time first
  - formatted fields are included, such as `call_time` and human-readable `duration`
  - analytics include outcome and sentiment breakdowns
- Preserve:
  - activity feed item family
  - analytics bundle
  - explicit productivity filters
- Redesign:
  - reconcile this endpoint with D2’s broader `READ:activity:workspace` target
  - publish whether formatted presentation fields belong in backend DTOs or in frontend view models

### `GET /v1/calls/:call_id`

- Query params:
  - none
- Response shape:
  - call detail fields
  - `dealer_snapshot`
  - `historical_context`
  - `productivity_evidence`
- Role behavior:
  - route does not enforce scoped access at query level
- Notable assumptions:
  - historical context is relative to the dealer, not just the call
  - transcript and recording metadata are included
- Preserve:
  - detail payload family with dealer snapshot and evidence context
- Redesign:
  - add scoped authorization enforcement
  - decide if this remains a standalone route or a sub-resource within an activity domain

### `GET /v1/visits`

- Query params:
  - `page`
  - `page_size`
  - `time_scope`, default `last-7d`
  - `dealer_id`
  - `kam_id`
  - `feedback_status`
  - `is_productive`
- Pagination:
  - shared pagination parser and metadata
- Response shape:
  - `data.items`
  - `data.pagination`
  - `data.analytics`
- Role behavior:
  - list rows are scope-filtered by role
- Notable assumptions:
  - geofence threshold is hardcoded to `100`
  - duration is partly presentation-oriented, including `In Progress`
  - analytics include visit type and geofence compliance
- Preserve:
  - visit activity item family
  - productivity and compliance summaries
- Redesign:
  - move geofence threshold to owned configuration or domain policy
  - reconcile this route with the broader activity workspace target capability

### `GET /v1/visits/:visit_id`

- Query params:
  - none
- Response shape:
  - visit detail fields
  - `dealer_snapshot`
  - `historical_context`
  - `productivity_evidence`
- Role behavior:
  - route does not enforce scoped access at query level
- Notable assumptions:
  - productivity explanation depends on geofence and source fields
  - dealer location is bundled for detail use
- Preserve:
  - detail payload family and embedded evidence context
- Redesign:
  - add scoped authorization enforcement
  - convert hardcoded geofence assumptions into owned backend policy

### `GET /v1/notifications`

- Query params:
  - `page`
  - `page_size`
- Pagination:
  - shared pagination parser and metadata
- Response shape:
  - `data.items`
  - `data.pagination`
  - `data.unread_count`
- Role behavior:
  - always scoped to `req.auth.user_id`
- Notable assumptions:
  - no `time_scope`
  - notification items return generic `data` blob
  - read state is derived from `read_at != null`
- Preserve:
  - inbox + unread count bundle
  - actor-scoped notification reads
- Redesign:
  - pair with a persisted mark-read command in the future API
  - define canonical deep-link payloads instead of leaving `data` schema open-ended

## Contract Drift And Intentional Redesign List

### Routes Present In Published Docs Or Clients But Not In `src/backend_api/routes/*`

- `GET /v1/leads/list`
- `PATCH /v1/leads/:lead_id/cep`
- `GET /v1/leaderboard`
- `GET /v1/incentives/summary`

Migration action: `redesign explicitly`

- These routes must be reconciled during Phase 4 `A1` instead of being assumed to exist because they appear in docs, frontend client code, or edge-function code.

### Auth Contract Drift

- `src/backend_api` expects Bearer JWT or dev headers.
- `src/docs/API_CONTRACTS.md` and `src/lib/api/crmApi.ts` document Supabase anon-key based calls.
- `src/supabase/functions/server/crm_routes.tsx` is a separate, evolved contract surface and includes endpoints not present in `src/backend_api`.

Migration action: `redesign explicitly`

- Future backend contracts must be published once under the company auth model and then consumed by frontend services and Android/web clients uniformly.

### Endpoint Naming And Filter Drift

- Legacy Express route uses `GET /v1/leads`.
- Published contract and edge/frontend client center `GET /v1/leads/list`.
- `time_scope` values differ between docs and code in some places.
- Several route defaults exist only in code and are not published.

Migration action: `preserve behavior only where it serves frontend cutover`

- Preserve useful payload families.
- Redesign route naming, filter publication, and default semantics in the contract-first API catalog.

### Response Contracts Worth Preserving For Easier Frontend Migration

- Standard `{ success, data, meta, error }` envelope
- Shared pagination metadata shape
- Dealer 360 payload family
- Lead detail payload family with dealer snapshot
- Calls/visits item and detail families with analytics/evidence context
- Notifications inbox response with `unread_count`

### Legacy Behavior To Intentionally Avoid Carrying Forward

- Detail routes without scope enforcement
- Dev-header auth as a production-visible behavior
- Unpublished implicit defaults
- Hardcoded geofence threshold in route code
- Table-shaped or implementation-driven quirks being treated as stable public API by accident

## D3 Coverage Checklist

| D3 Requirement | Covered In |
| --- | --- |
| Extract route behavior from `src/backend_api/routes/*` | Endpoint inventory and route detail sections |
| Record current query params, pagination, and response envelopes | Cross-cutting sections and per-route sections |
| Capture role-based filtering assumptions | Auth and role scope sections plus route notes |
| Identify which response contracts should be preserved for easier frontend migration | Preserve decisions and summary list above |
| Mark anything to intentionally redesign rather than carry forward | Redesign notes and drift section |

## Assumptions

- The future backend should preserve useful read-model shapes where they reduce frontend migration churn, but not preserve Supabase-hosted transport, weak auth validation, or missing authorization checks.
- D2 remains the source of truth for target business capabilities. This D3 document is a backward-looking compatibility aid.
