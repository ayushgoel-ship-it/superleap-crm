# Backend Architecture Audit — `codex/project-revamp`

**Date**: 2026-04-12
**Auditor**: Claude Opus 4.6
**Branch**: `codex/project-revamp` (commit `383257e`)
**Scope**: Full Java/Spring Boot backend + frontend delta + TASKS.md + architecture docs

---

## Executive Summary

The backend is a **well-architected scaffolding** with excellent security patterns and test discipline. It is NOT production-ready yet (no database, no business APIs), but the foundation is solid and build-worthy.

**Overall Score: 7/10** (for a scaffolding-stage project)

| Category | Score | Notes |
|----------|-------|-------|
| Architecture & Design | 8/10 | Clean multi-module Maven, proper separation |
| Security & Auth | 7/10 | 1 critical JWT fix needed (see below) |
| Testing | 8/10 | Excellent auth coverage, 10 test classes |
| Code Quality | 9/10 | Clean, idiomatic Spring Boot 3.2 |
| Configuration | 8/10 | Externalized, profile-aware, structured logging |
| Completeness | 4/10 | Only health endpoint; no DB, no business APIs |

---

## CRITICAL: Security Fix Required

### JWT Effective User Escalation (HIGH)

**File**: `backend/crm-api/src/main/java/com/cars24/crmapi/filter/JwtTokenFilter.java`
**Lines**: `buildEffectiveActor()` method

**Problem**: When JWT claims contain `effective_user_id`, the code sets the effective actor without verifying the authenticated user has ADMIN role. Dev headers correctly block non-ADMIN impersonation, but the JWT path does not.

A malicious KAM could craft/obtain a JWT with `effective_user_id` set to another user and gain unauthorized access.

**Fix**:
```java
// In buildEffectiveActor(), add before creating effective actor:
if (!Objects.equals(authenticatedActor.getUserId(), effectiveUserId)
    && !authenticatedActor.getRoles().contains("ADMIN")) {
    throw new UnauthorizedException("Only ADMIN can impersonate");
}
```

---

## What's Good

### 1. Project Structure
- Clean 4-module Maven layout: `crm-api`, `crm-core`, `crm-pipeline`, `crm-notification`
- Spring Boot 3.2.5, Java 17 — modern and well-supported
- Proper `dependencyManagement` in parent POM
- Maven wrapper included for portable builds

### 2. Auth & Filter Chain
- **JwtTokenFilter** (291 lines): Comprehensive JWT validation with proper claims extraction, expiry handling, and ThreadLocal cleanup
- **Filter ordering**: Logging(1) → JWT(2) → Auth(3) — correct
- **ActorScope enum**: `SELF` / `TEAM` / `GLOBAL` / `IMPERSONATED` — aligns with frontend's `useActorScope` (KAM/TL/Admin)
- **Dev header fallback**: Only enabled in dev profile, properly guarded
- **RequestContextHolder**: ThreadLocal with `finally` cleanup prevents context leaks

### 3. Error Handling
- **GlobalControllerAdvice**: Maps 10+ exception types to proper HTTP codes
- **Profile-aware**: Dev/test show full messages; stage/prod sanitize to generic errors
- **ApiErrorResponseFactory**: Works for both controllers and filters (pre-controller errors)
- **Request ID tracking** via MDC in LoggingFilter

### 4. Testing
- 10 test files with excellent coverage:
  - `AuthFilterIntegrationTest` (161 lines) — tests JWT, dev headers, impersonation, scope
  - `JwtReaderTest` — signature, issuer, audience, expiration
  - `GlobalControllerAdviceIntegrationTest` — all exception types
  - `GlobalControllerAdviceStageProfileTest` — prod message sanitization
  - `ConfigurationPropertiesBindingTest` — all property classes bind correctly

### 5. Configuration
- All secrets via env vars (`CRM_JWT_SECRET`, `CRM_DB_*`)
- Profile-specific YAMLs (dev/stage/prod)
- Structured JSON logging for stage/prod via logback-spring.xml

---

## Issues & Risks

### HIGH Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **JWT effective user escalation** | JwtTokenFilter.buildEffectiveActor() | Privilege escalation via crafted JWT |
| 2 | **No database integration** | crm-core/pom.xml | Cannot implement any business API |
| 3 | **Weak JWT secret not validated** | JwtReader | Short secrets silently accepted; HMAC-SHA256 needs >=32 bytes |

### MEDIUM Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 4 | No business APIs implemented | crm-api/controller/ | Only health endpoint exists |
| 5 | No Flyway/Liquibase migration setup | crm-core | No schema management |
| 6 | No role-based endpoint protection | controllers | ActorScope set but never enforced on routes |
| 7 | Empty modules (crm-pipeline, crm-notification) | Both modules | Just package-info.java stubs |

### LOW Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 8 | No async appender in logback | logback-spring.xml | May block under high throughput |
| 9 | Test secret in application-test.yml | test config | Acceptable for test, but noted |
| 10 | No distributed tracing | global | No trace ID support |

---

## Frontend Changes in This Branch

The branch **reverts** three files we added in `claude/waves-a-to-e`:

| File | Action | Risk |
|------|--------|------|
| `src/components/auth/RoleGuard.tsx` | **Deleted** | RoleGuard + withRoleGuard HOC removed. Admin pages imported directly without permission wrapping. Intentional — backend will own authorization. |
| `src/lib/domain/dcfStatus.ts` | **Deleted** | DCF status helper removed. |
| `src/lib/metrics/useMetrics.ts` | **Deleted** | useMetrics hook removed. |

The remaining frontend changes (syntax fixes, adapter updates) are **identical** to our branch — this branch rebased from `claude/waves-a-to-e`.

---

## Architecture Docs Added (src/docs/12-16)

| Doc | Lines | Purpose |
|-----|-------|---------|
| `12_SUPABASE_COUPLING_INVENTORY.md` | 117 | Maps every Supabase dependency (auth, DB, edge fns, storage) for migration planning |
| `13_BUSINESS_API_FLOW_MAP.md` | 156 | Catalogs all read/write flows with permissions, sync/async classification |
| `14_LEGACY_BACKEND_REFERENCE_CONTRACTS.md` | 465 | Documents current API response shapes to preserve during migration |
| `15_VIZ_SERVICE_BACKEND_PRINCIPLES.md` | 374 | Backend architecture principles extracted from company reference (viz-service) |
| `16_CONTROL_ROOM_FRONTEND_PRINCIPLES.md` | 275 | Frontend architecture principles from company reference (pathfinder/control-room) |

These are excellent reference docs that will guide the migration.

---

## TASKS.md Status

- **840 lines** of structured migration tasks
- ~40 tasks completed (marked `[x]`), covering audit + scaffolding
- ~60+ tasks remaining (marked `[ ]`), covering:
  - Entity ownership classification
  - Database migration setup (Flyway)
  - Repository layer
  - Business API endpoints
  - Caching (Redis)
  - File storage
  - Frontend service layer migration
  - Capacitor/Android updates

---

## Recommendations

### Before merging to main:
1. **Fix JWT escalation** (blocking — security)
2. **Add JWT secret length validation** on startup
3. **Add database dependencies** (spring-boot-starter-data-jpa + postgresql driver)
4. **Verify `mvn clean install` passes** across all modules

### Next priorities after merge:
1. Add Flyway + baseline migration for CRM-owned tables
2. Implement first business API (GET /app/v1/dashboard)
3. Add `@RequireRole` annotation for endpoint protection
4. Implement repository layer against Supabase Postgres

---

## Verdict

**This is a solid architectural foundation.** The auth/security layer is well-designed and well-tested. The scaffolding correctly separates concerns into API/Core/Pipeline/Notification modules. The code follows Spring Boot best practices.

**Recommendation: Fix the JWT escalation bug, then this is ready to build upon.** The remaining work (DB, APIs, frontend migration) is execution, not rearchitecture.
