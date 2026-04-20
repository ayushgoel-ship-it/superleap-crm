# API Endpoint Catalog — Phase 4 Read APIs

> Generated from the Spring Boot controller layer. All endpoints return the standard envelope:
> `{ success, data, meta: { timestamp, request_id, role?, time_scope?, pagination? }, error? }`

---

## Authentication & Context

All `/web/v1/*` and `/app/v1/*` endpoints require a valid JWT. The filter chain:
1. `LoggingFilter` — assigns `request_id`, logs entry/exit
2. `JwtTokenFilter` — validates JWT, extracts claims
3. `AuthenticationFilter` — builds `RequestContext` with `ActorContext` and `ActorScope`

Role-based data scoping is handled by `ActorScopeResolver`:
- **KAM** (SELF scope): sees only own data — `kamId` = own UUID
- **TL** (TEAM scope): sees team data — `tlId` = own UUID
- **ADMIN** (GLOBAL scope): sees all data — no filtering applied

`/internal/v1/*` endpoints bypass JWT auth (service-to-service).
`/public/*` endpoints are unauthenticated.

---

## Pagination Convention

| Parameter | Type | Default | Max | Notes |
|-----------|------|---------|-----|-------|
| `page` | Integer | 1 | — | 1-based in API, converted to 0-based internally |
| `page_size` | Integer | 20 | 100 | Capped at 100 |

Response `meta.pagination`:
```json
{
  "page": 1,
  "page_size": 20,
  "total_items": 150,
  "total_pages": 8,
  "has_next": true
}
```

---

## Web Endpoints (`/web/v1/*`)

### Dashboard

| Method | Path | Query Params | Response Type | Role Scoping |
|--------|------|-------------|---------------|--------------|
| GET | `/web/v1/dashboard/home` | `time_scope` (default: `mtd`) | `DashboardSummary` | KAM/TL: own userId; ADMIN: null (all) |

### Bootstrap

| Method | Path | Query Params | Response Type | Role Scoping |
|--------|------|-------------|---------------|--------------|
| GET | `/web/v1/bootstrap` | — | `BootstrapResponse` | All roles. `org_hierarchy` included only for TL/ADMIN |

**BootstrapResponse shape:**
```json
{
  "profile": {
    "user_id": "...",
    "role": "KAM",
    "roles": ["KAM"],
    "permissions": ["read:dealers"],
    "tenant_group": "cars24"
  },
  "org_hierarchy": null
}
```

### Dealers

| Method | Path | Query Params | Response Type | Role Scoping |
|--------|------|-------------|---------------|--------------|
| GET | `/web/v1/dealers` | `segment`, `status`, `search`, `page`, `page_size` | `List<DealerListItem>` (paginated) | KAM: `kamId`=self; TL: `tlId`=self; ADMIN: no filter |
| GET | `/web/v1/dealers/{dealerCode}` | — | `DealerDetailResponse` | No scoping (detail by code) |

### Leads

| Method | Path | Query Params | Response Type | Role Scoping |
|--------|------|-------------|---------------|--------------|
| GET | `/web/v1/leads` | `dealer_code`, `channel`, `status`, `stage`, `search`, `page`, `page_size` | `List<LeadListItem>` (paginated) | KAM: `kamId`=self; others: no filter |
| GET | `/web/v1/leads/{leadId}` | — | `LeadDetailResponse` | No scoping (detail by ID) |

**LeadDetailResponse** includes a nested `dealer_snapshot`:
```json
{
  "lead_id": "...",
  "customer_name": "...",
  "dealer_snapshot": {
    "dealer_code": "DLR001",
    "dealer_name": "Dealer Name"
  }
}
```

### Calls

| Method | Path | Query Params | Response Type | Role Scoping |
|--------|------|-------------|---------------|--------------|
| GET | `/web/v1/calls` | `dealer_code`, `page`, `page_size` | `List<CallListItem>` (paginated) | KAM: `kamId`=self; others: no filter |

### Visits

| Method | Path | Query Params | Response Type | Role Scoping |
|--------|------|-------------|---------------|--------------|
| GET | `/web/v1/visits` | `dealer_code`, `page`, `page_size` | `List<VisitListItem>` (paginated) | KAM: `kamId`=self; others: no filter |

### Notifications

| Method | Path | Query Params | Response Type | Role Scoping |
|--------|------|-------------|---------------|--------------|
| GET | `/web/v1/notifications` | `page`, `page_size` | `List<NotificationItem>` (paginated) | Always user-scoped (effective userId) |
| GET | `/web/v1/notifications/unread-count` | — | `UnreadCountResponse` | Always user-scoped |

**UnreadCountResponse:**
```json
{ "unread_count": 5 }
```

---

## App Endpoints (`/app/v1/*`)

Mobile app endpoints — same logic as web, different base path for potential mobile-specific behavior later.

| Method | Path | Query Params | Response Type | Notes |
|--------|------|-------------|---------------|-------|
| GET | `/app/v1/dashboard/home` | `time_scope` (default: `mtd`) | `DashboardSummary` | Same delegation as web |
| GET | `/app/v1/bootstrap` | — | `BootstrapResponse` | Same delegation as web |

---

## Internal Endpoints (`/internal/v1/*`)

Service-to-service endpoints. No JWT required.

| Method | Path | Query Params | Response Type | Notes |
|--------|------|-------------|---------------|-------|
| GET | `/internal/v1/org/hierarchy` | — | `OrgHierarchyDto` | Full org tree (regions → teams → KAMs) |

---

## Public Endpoints (`/public/*`)

| Method | Path | Response Type | Notes |
|--------|------|---------------|-------|
| GET | `/public/health` | `text/plain` "OK" | Health check, no envelope |

---

## Error Responses

All errors follow the `ApiErrorEnvelope` shape:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Dealer not found: DLR999"
  },
  "meta": {
    "timestamp": "2026-04-10T10:00:00Z",
    "request_id": "req-abc123"
  }
}
```

Standard error codes:
- `BAD_REQUEST` (400) — validation failures
- `UNAUTHORIZED` (401) — missing/invalid JWT
- `FORBIDDEN` (403) — insufficient permissions/role
- `RESOURCE_NOT_FOUND` (404) — entity not found
- `INTERNAL_ERROR` (500) — unhandled exceptions
- `EXTERNAL_DEPENDENCY_FAILURE` (502) — partner service errors

---

## File Inventory

### Controllers (10 files)
```
controller/web/DashboardController.java      — /web/v1/dashboard
controller/web/BootstrapController.java      — /web/v1/bootstrap
controller/web/DealerController.java         — /web/v1/dealers
controller/web/LeadController.java           — /web/v1/leads
controller/web/CallController.java           — /web/v1/calls
controller/web/VisitController.java          — /web/v1/visits
controller/web/NotificationController.java   — /web/v1/notifications
controller/app/AppDashboardController.java   — /app/v1/dashboard
controller/app/AppBootstrapController.java   — /app/v1/bootstrap
controller/internal/InternalOrgController.java — /internal/v1/org
```

### Support (3 files)
```
controller/support/PaginationHelper.java     — 1-based → 0-based conversion
controller/support/ActorScopeResolver.java   — Role-scoped data filtering params
controller/support/ApiResponseBuilder.java   — Envelope construction
```

### DTOs (8 files)
```
dto/common/PaginationMeta.java               — Pagination metadata
dto/common/ApiResponseMeta.java              — Response meta (timestamp, request_id, role, etc.)
dto/common/ApiResponseEnvelope.java          — Generic success/error envelope
dto/web/response/UserProfileDto.java         — User profile for bootstrap
dto/web/response/BootstrapResponse.java      — Bootstrap composite response
dto/web/response/DealerDetailResponse.java   — Dealer detail mapping
dto/web/response/LeadDetailResponse.java     — Lead detail with dealer snapshot
dto/web/response/UnreadCountResponse.java    — Unread notification count
```
