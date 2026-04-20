# Architecture Revamp Tasks

## Goal
Revamp `superleap-crm` from a Supabase-coupled React/Vite/Capacitor application into a company-standard architecture with:

- A Spring Boot backend aligned to the structural and operational principles used in `../viz-service`
- A frontend shell and service organization aligned to `../pathfinder/control-room`
- Company-managed authentication and authorization
- Backend-owned business APIs over company Postgres and approved object storage

## Target Principles

- Frontend talks only to backend APIs
- Backend owns authentication validation, authorization enforcement, business logic, and data shaping
- APIs are business-oriented, not table-oriented
- Controllers stay thin
- Shared infrastructure concerns are centralized
- Async/event processing is isolated from synchronous request handling
- UI permissions are derived from backend-authorized capabilities, not hardcoded guesses

## Anti-Patterns To Avoid

- Direct DB access from frontend
- Embedding DB credentials in app
- Recreating Supabase client behavior
- Generic CRUD APIs instead of business APIs
- Business logic inside controllers
- Frontend-only authorization checks
- Exposing internal schema details to web or Android clients
- Storing long-lived secrets in browser-accessible runtime config

## Suggested Folder Structure

### Backend

```text
backend/
  pom.xml
  mvnw
  mvnw.cmd
  .mvn/
    wrapper/
  crm-api/
    src/main/java/com/cars24/crmapi/
      controller/
        web/
        app/
        internal/
        publicapi/
      filter/
      config/
      exception/
      constants/
      dto/
    src/main/resources/
      application.yml
      application-dev.yml
      application-stage.yml
      application-prod.yml
  crm-core/
    src/main/java/com/cars24/crmcore/
      service/
        internal/
        external/
        impl/
      repository/
        postgres/
        redis/
      entity/
      dto/
      model/
      config/
      external/restclient/
      exception/
      util/
    src/main/resources/
      db/migration/
  crm-pipeline/
    src/main/java/com/cars24/crmpipeline/
      listener/
      processor/
      publisher/
      config/
  crm-notification/
    src/main/java/com/cars24/crmnotification/
      service/
      entity/
      repository/
```

### Frontend

```text
src/
  app/
    App.tsx
    routes.tsx
    ProtectedRoute.tsx
    AppLayout.tsx
  services/
    auth.services.ts
    dashboard.services.ts
    dealers.services.ts
    leads.services.ts
    visits.services.ts
    calls.services.ts
    notifications.services.ts
    admin.services.ts
  lib/
    http/
      axios.ts
    auth/
    storage/
  stores/
    useAuthStore.ts
    useBootstrapStore.ts
    useUiStore.ts
  pages/
    Login/
    Dashboard/
    Dealers/
    Leads/
    Visits/
    Calls/
    Notifications/
    Admin/
  components/
    ui/
    shared/
  constants/
  hooks/
  utils/
```

## Rough Timeline

| Phase | Estimate |
| --- | --- |
| Discovery & Audit | 4-5 days |
| Backend Setup | 5-7 days |
| Database Integration | 7-10 days |
| API Design & Read APIs | 7-10 days |
| Frontend Refactor | 7-10 days |
| Auth & Security | 4-6 days |
| Testing | 5-7 days |
| Cleanup & Decommissioning | 3-5 days |
| Optional Enhancements | As needed |

## Risks And Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Company schema does not map cleanly to CRM assumptions | High | Introduce app-owned schema/views and contract tests before frontend cutover |
| Auth design ambiguity between gateway-managed auth and service JWT validation | High | Finalize one canonical request-auth contract before implementation starts |
| Legacy runtimeDB hides multiple implicit dependencies | High | Replace with explicit bootstrap and business APIs incrementally |
| Mobile token persistence copied from browser patterns | High | Use approved secure storage and test Android lifecycle explicitly |
| Direct-write flows scattered across UI | High | Centralize all writes behind backend business endpoints before production cutover |
| Parallel old/new backends create confusion | Medium | Publish one source of truth architecture and decommission transitional paths quickly |

---

## Phase 1: Discovery & Audit

### Task D1: Inventory All Supabase Coupling
**Description:** Build the authoritative list of every Supabase dependency in the codebase so no hidden dependency survives the migration.

**Subtasks:**
- [x] Audit `src/lib/supabase/client.ts`
- [x] Audit `src/data/supabaseRaw.ts`
- [x] Audit `src/data/runtimeDB.ts`
- [x] Audit `src/lib/auth/authService.ts`
- [x] Audit `src/data/mgmtRepo.ts`
- [x] Audit all `supabase.from(...)`, `supabase.auth.*`, and `supabase.functions.invoke(...)` usage
- [x] Audit Capacitor allowlists and env vars referencing Supabase
- [x] Produce a dependency matrix: file -> operation type -> target backend replacement

**Owner:** Fullstack  
**Priority:** High  
**Dependencies:** None  
**Definition of Done:** A complete migration inventory exists and every direct Supabase touchpoint is accounted for.

### Task D2: Map Current Business Flows To Business APIs
**Description:** Convert the current screen behavior into backend business capabilities so the new API layer is shaped around workflows, not tables.

**Subtasks:**
- [x] Identify all read flows: dashboard, dealers, leads, calls, visits, notifications, admin views
- [x] Identify all write flows: visit start/end/feedback, call logging, lead creation, onboarding, admin updates, exports
- [x] Document inputs, outputs, permissions, and side effects for each flow
- [x] Mark which flows are synchronous and which should become async
- [x] Define which flows are web-only, app-only, or internal

**Owner:** Fullstack  
**Priority:** High  
**Dependencies:** D1  
**Definition of Done:** Every user-facing workflow is mapped to a target business API or async processor.

### Task D3: Record Existing Backend Reference Behavior
**Description:** Preserve the useful behavior already present in `src/backend_api` without adopting its implementation style.

**Subtasks:**
- [x] Extract route behavior from `src/backend_api/routes/*`
- [x] Record current query params, pagination, and response envelopes
- [x] Capture role-based filtering assumptions
- [x] Identify which response contracts should be preserved for easier frontend migration
- [x] Mark anything to intentionally redesign rather than carry forward

**Owner:** Backend  
**Priority:** High  
**Dependencies:** D2  
**Definition of Done:** A reference contract sheet exists for legacy route behavior and migration decisions are explicit.

### Task D4: Analyze `viz-service` Backend Principles
**Description:** Translate `../viz-service` into actionable backend design constraints for this project.

**Subtasks:**
- [x] Record multi-module layout from `settings.gradle`
- [x] Record responsibilities of `viz-api`, `viz-core`, `viz-pipeline`, and `viz-notification`
- [x] Record filter-chain auth pattern from `FilterConfig`, `JwtTokenFilter`, and `AuthenticationFilter`
- [x] Record controller/service/repository separation patterns
- [x] Record exception handling and shared config conventions
- [x] Record external client and async processing patterns worth copying

**Owner:** Backend  
**Priority:** High  
**Dependencies:** D3  
**Definition of Done:** Backend architecture principles are documented as implementation standards for the new CRM backend.

### Task D5: Analyze `control-room` Frontend Principles
**Description:** Translate `../pathfinder/control-room` into actionable frontend organization and auth-flow standards for this project.

**Subtasks:**
- [x] Record route shell structure
- [x] Record shared axios interceptor pattern
- [x] Record login/bootstrap flow and token handling
- [x] Record page-first feature organization
- [x] Record store placement and bootstrap-on-protected-route pattern
- [x] Note which patterns to copy and which to improve

**Owner:** Frontend  
**Priority:** High  
**Dependencies:** D2  
**Definition of Done:** Frontend architecture principles are documented as implementation standards for the new CRM frontend.

---

## Phase 2: Backend Setup

### Task B1: Create Multi-Module Spring Boot Backend
**Description:** Establish the target backend foundation using the same structural approach as `viz-service`.

**Subtasks:**
- [x] Create `backend/` root project
- [x] Add root `pom.xml` with `crm-api`, `crm-core`, `crm-pipeline`, and `crm-notification`
- [x] Configure shared Java 17, Spring Boot dependency management, repositories, and plugin management in the parent POM
- [x] Add module-specific `pom.xml` files
- [x] Add Maven wrapper so the backend builds without extra local setup
- [x] Ensure local Maven build works across all modules

**Owner:** Backend  
**Priority:** High  
**Dependencies:** D4  
**Definition of Done:** A multi-module Maven backend builds successfully on Java 17 and mirrors the intended module boundaries.

### Task B1.1: Align Backend Architecture Docs To Maven
**Description:** Remove Gradle- and Java-21-specific wording from backend architecture docs so implementation guidance matches the approved backend toolchain.

**Subtasks:**
- [x] Update backend architecture docs that currently hardcode Gradle build files
- [x] Update backend architecture docs that currently hardcode Java 21
- [x] Preserve the existing module-boundary and layering principles while changing only build/toolchain wording

**Owner:** Backend  
**Priority:** Medium  
**Dependencies:** B1  
**Definition of Done:** Backend architecture docs describe Maven + Java 17 without changing the agreed architecture boundaries.

### Task B2: Bootstrap Spring Application And Shared Configuration
**Description:** Provide a predictable application entrypoint and shared config model before feature code is added.

**Subtasks:**
- [x] Add `CrmApiApplication` with component scanning across modules
- [x] Add environment-specific property files
- [x] Add typed config classes for DB, JWT, storage, cache, and external services
- [x] Add structured logging setup
- [x] Add health endpoint under `/public/health`

**Owner:** Backend  
**Priority:** High  
**Dependencies:** B1  
**Definition of Done:** Backend starts with correct profiles, loads typed config, and exposes a working health endpoint.

### Task B3: Implement Filter Chain And Request Context
**Description:** Reproduce the `viz-api` style of auth as a filter pipeline so request authentication is uniform and centralized.

**Subtasks:**
- [x] Add `JwtConfig`
- [x] Add `JwtReader`
- [x] Add `JwtTokenFilter`
- [x] Add `AuthenticationFilter`
- [x] Add request logging/correlation filter
- [x] Add a request context model carrying user id, role list, permission list, tenant/group, actor scope, and raw auth metadata
- [x] Register filters for protected URL patterns only
- [x] Add tests for missing, invalid, expired, and valid tokens

**Owner:** Backend  
**Priority:** High  
**Dependencies:** B2  
**Definition of Done:** Protected requests are authenticated in filters and downstream code reads a normalized request context.

**Example:**
```java
@Bean
public FilterRegistrationBean<JwtTokenFilter> jwtFilterRegistration(JwtTokenFilter filter) {
    FilterRegistrationBean<JwtTokenFilter> bean = new FilterRegistrationBean<>();
    bean.setFilter(filter);
    bean.addUrlPatterns("/web/v1/*", "/app/v1/*", "/internal/v1/*");
    return bean;
}
```

### Task B4: Define Error Model And Global Exception Handling
**Description:** Standardize error shapes and failure semantics so frontend and observability are consistent.

**Subtasks:**
- [x] Define exception DTOs
- [x] Add `GlobalControllerAdvice`
- [x] Define application-specific exceptions for invalid request, forbidden, not found, optimistic conflict, external dependency failure
- [x] Map exceptions to stable HTTP statuses and safe messages
- [x] Add tests for representative exception handlers

**Owner:** Backend  
**Priority:** High  
**Dependencies:** B2  
**Definition of Done:** All backend failures return one consistent JSON error format.

### Task B5: Enforce Thin Controller Boundaries
**Description:** Keep transport logic separate from business logic to avoid recreating the current vibecoded architecture problems.

**Subtasks:**
- [x] Create controller packages by channel: `web`, `app`, `internal`, `publicapi`
- [x] Define DTO packages for request/response objects
- [x] Define service interfaces in `crm-core`
- [x] Add review rule that controllers only bind, validate, and delegate

**Owner:** Backend  
**Priority:** High  
**Dependencies:** B3, B4

---

## Phase 3: Database Integration

### Task DB1: Design Target Data Ownership Model
**Description:** Decide which data the CRM owns and which data it projects or references from company systems.

**Subtasks:**
- [x] Mark CRM-owned operational entities: visits, calls, notifications, audit logs, upload metadata, workflow state
- [x] Mark read-only/reference entities coming from company data
- [x] Define app-owned schema and naming conventions
- [x] Define what must remain source-of-truth elsewhere
- [x] Document write boundaries and forbidden direct writes to source systems

**Owner:** Backend  
**Priority:** High  
**Dependencies:** D2, D3  
**Definition of Done:** Data ownership is explicit and there is no ambiguity about what the CRM backend can write.

### Task DB2: Create Migration Framework And Baseline Schema
**Description:** Introduce managed schema evolution so the backend can be deployed and upgraded safely.

**Subtasks:**
- [x] Add Flyway or Liquibase to `crm-core`
- [x] Create baseline migrations for CRM-owned tables
- [x] Add indexes for primary list/detail query paths
- [x] Add audit columns and soft-delete conventions where needed
- [x] Add local/dev bootstrap instructions

**Owner:** Backend  
**Priority:** High  
**Dependencies:** DB1, B2  
**Definition of Done:** Backend can initialize its schema in company Postgres and re-run safely across environments.

### Task DB3: Build Postgres Read Models For UI Needs
**Description:** Replace client-side dataset hydration with backend-owned read models designed around the actual UI.

**Subtasks:**
- [x] Define dealer list/detail queries
- [x] Define lead list/detail queries
- [x] Define call/visit list/detail queries
- [x] Define dashboard aggregate queries
- [x] Define notifications query model
- [x] Add repository contracts and implementations
- [x] Add integration tests for each read model

**Owner:** Backend  
**Priority:** High  
**Dependencies:** DB2  
**Definition of Done:** All current read screens can be served from backend read models without frontend-side database composition.

### Task DB4: Add Caching Where It Improves Read Latency
**Description:** Use caching selectively, following `viz-core` patterns, only where the read load or query cost justifies it.

**Subtasks:**
- [x] Identify expensive read paths
- [x] Add Redis configuration and typed cache wrappers
- [x] Cache immutable or slowly changing reference data
- [x] Add TTL strategy per cache category
- [x] Add cache invalidation rules for writes

**Owner:** Backend  
**Priority:** Medium  
**Dependencies:** DB3  
**Definition of Done:** Caching exists only for justified read paths and cache invalidation is documented and tested.

### Task DB5: Implement File Metadata And Object Storage
**Description:** Replace Supabase storage with backend-owned object storage flows.

**Subtasks:**
- [x] Add upload metadata table(s)
- [x] Add object storage configuration and client wrapper
- [x] Implement signed upload URL generation
- [x] Implement signed read URL generation where needed
- [x] Add file validation rules for type, size, ownership, and lifecycle
- [x] Add integration tests for upload metadata flow

**Owner:** Backend  
**Priority:** High  
**Dependencies:** DB2  
**Definition of Done:** Files can be uploaded and retrieved without exposing storage credentials to clients.

---

## Phase 4: API Design

### Task A1: Publish Contract-First Endpoint Catalog
**Description:** Freeze the backend surface before frontend rewiring to prevent churn and duplicate adapter work.

**Subtasks:**
- [ ] Define route namespaces: `/public/v1`, `/web/v1`, `/app/v1`, `/internal/v1`
- [ ] Define DTOs for dashboard, dealers, leads, calls, visits, notifications, bootstrap, admin flows
- [ ] Standardize pagination and filtering semantics
- [ ] Standardize error response format
- [ ] Reconcile D3 legacy-route behavior with published docs and decide which legacy endpoints are deprecated, renamed, or promoted
- [ ] Publish an API inventory document in-repo

**Owner:** Fullstack  
**Priority:** High  
**Dependencies:** DB3  
**Definition of Done:** A stable API contract inventory exists and frontend implementation can proceed against it.

### Task A2: Implement Dashboard And Bootstrap APIs
**Description:** Replace the current startup-heavy frontend runtime loading with explicit backend bootstrap and dashboard endpoints.

**Subtasks:**
- [ ] Add dashboard home endpoint
- [ ] Add bootstrap endpoint for session-start data: profile, roles, nav/menu, config, feature flags
- [ ] Add any role-specific dashboard slices if needed
- [ ] Add tests for KAM/TL/Admin responses

**Owner:** Backend  
**Priority:** High  
**Dependencies:** A1, DB3  
**Definition of Done:** App startup and dashboard render can work without `runtimeDB` or `supabaseRaw`.

### Task A3: Implement Dealer And Lead Read APIs
**Description:** Provide explicit business endpoints for the core CRM datasets.

**Subtasks:**
- [ ] Implement dealer list API
- [ ] Implement dealer detail API
- [ ] Implement lead list API
- [ ] Implement lead detail API
- [ ] Implement any summary/count APIs required by current screens
- [ ] Add authorization checks per role/scope

**Owner:** Backend  
**Priority:** High  
**Dependencies:** A1, DB3  
**Definition of Done:** Dealer and lead screens can be fully API-backed.

### Task A4: Implement Calls, Visits, And Notifications Read APIs
**Description:** Complete the read surface needed for field activity and alerts.

**Subtasks:**
- [ ] Implement calls list/detail APIs
- [ ] Implement visits list/detail APIs
- [ ] Implement notifications list/count APIs
- [ ] Add time-scope, pagination, and role filters
- [ ] Add integration tests for auth-scoped responses

**Owner:** Backend  
**Priority:** High  
**Dependencies:** A1, DB3  
**Definition of Done:** Activity and notification reads no longer depend on Supabase tables from the client.

### Task A5: Implement Write Business APIs
**Description:** Route all operational writes through validated backend workflows instead of direct UI writes.

**Subtasks:**
- [ ] Add visit start endpoint
- [ ] Add visit end endpoint
- [ ] Add visit feedback submission endpoint
- [ ] Add call logging endpoint
- [ ] Add call feedback endpoint
- [ ] Add lead creation endpoint
- [ ] Add dealer location change request/approval endpoints
- [ ] Add admin settings/targets/users mutation endpoints
- [ ] Add idempotency keys or safe retry semantics for mobile writes

**Owner:** Backend  
**Priority:** High  
**Dependencies:** DB5, DB2  
**Definition of Done:** No required write use case needs direct data source access from the client.

### Task A6: Introduce Async/Event Processing Only Where Justified
**Description:** Apply `viz-pipeline` style separation only to workflows that benefit from it.

**Subtasks:**
- [ ] Identify candidates: exports, notifications, image processing, bulk uploads, long-running recomputations
- [ ] Create listeners/processors/publishers in `crm-pipeline`
- [ ] Add retry and dead-letter strategy
- [ ] Keep synchronous request APIs independent from event success where possible

**Owner:** Backend  
**Priority:** Medium  
**Dependencies:** A5  
**Definition of Done:** Async work is explicitly isolated and does not leak queue concerns into controllers.

---

## Phase 5: Frontend Refactor

### Task F1: Create New App Shell
**Description:** Reorganize the frontend into a clear, maintainable shell modeled on `control-room`.

**Subtasks:**
- [ ] Create `src/app/App.tsx`
- [ ] Create centralized route definitions
- [ ] Create `ProtectedRoute`
- [ ] Create `AppLayout`
- [ ] Move current route/page mounting into the new shell
- [ ] Add lazy loading for major pages where beneficial

**Owner:** Frontend  
**Priority:** High  
**Dependencies:** D5  
**Definition of Done:** The app boots through one central shell with a single protected area and a public login route.

### Task F2: Introduce Shared HTTP Client And Domain Service Modules
**Description:** Centralize API communication and remove ad hoc data access from pages/components.

**Subtasks:**
- [ ] Add shared axios client with request/response interceptors
- [ ] Add auth header injection
- [ ] Add unauthorized handling
- [ ] Add domain service modules for dashboard, dealers, leads, visits, calls, notifications, admin
- [ ] Migrate one feature first to validate the pattern

**Owner:** Frontend  
**Priority:** High  
**Dependencies:** F1, A1  
**Definition of Done:** Pages consume typed service functions and do not call fetch/Supabase directly.

**Example:**
```ts
export const fetchDealers = (params: DealersQuery) =>
  api.get<PaginatedResponse<DealerDto>>("/web/v1/dealers", { params });
```

### Task F3: Implement Auth Flow And Session Bootstrap
**Description:** Replace Supabase Auth with company login and central session bootstrap.

**Subtasks:**
- [ ] Create login page and callback handling
- [ ] Add auth store for access token, refresh token, session metadata, and user profile
- [ ] Add bootstrap store for menu/config/profile loading after login
- [ ] Implement logout flow
- [ ] Implement session restoration on app reload
- [ ] Implement Android-safe token storage strategy

**Owner:** Frontend  
**Priority:** High  
**Dependencies:** B3, A2  
**Definition of Done:** Users can authenticate, reload, resume, and log out without any Supabase code path.

### Task F4: Replace RuntimeDB And Supabase Read Paths
**Description:** Remove the current frontend-side data-cache architecture from production paths.

**Subtasks:**
- [ ] Replace dashboard reads
- [ ] Replace dealer reads
- [ ] Replace lead reads
- [ ] Replace calls/visits reads
- [ ] Replace notifications reads
- [ ] Replace admin read flows
- [ ] Remove runtime data hydration from startup

**Owner:** Frontend  
**Priority:** High  
**Dependencies:** F2, A2, A3, A4  
**Definition of Done:** Production reads no longer use `runtimeDB.ts` or `supabaseRaw.ts`.

### Task F5: Replace Supabase Write And Upload Paths
**Description:** Complete the migration by removing direct client mutations and storage writes.

**Subtasks:**
- [ ] Replace `visit.api.ts` mutation paths with backend APIs
- [ ] Replace `mgmtRepo.ts` mutation paths with backend APIs
- [ ] Replace onboarding/location/lead creation mutations
- [ ] Replace upload/photo flows with backend-signed storage flow
- [ ] Add UI retry/error handling for backend business API responses

**Owner:** Frontend  
**Priority:** High  
**Dependencies:** A5, DB5  
**Definition of Done:** Frontend contains zero direct mutation access to DB or storage providers.

---

## Phase 6: Auth & Security

### Task S1: Finalize JWT Contract
**Description:** Define exactly what token shape and claims the backend will trust and the frontend will depend on.

**Subtasks:**
- [ ] Define token issuer
- [ ] Define signing algorithm and secret/key handling
- [ ] Define required claims: user id, roles, permissions, tenant/group, expiry
- [ ] Define refresh behavior
- [ ] Define guest/public endpoint behavior
- [ ] Publish the request-auth contract for controllers/services

**Owner:** Fullstack  
**Priority:** High  
**Dependencies:** B3  
**Definition of Done:** JWT validation contract is explicit, documented, and implemented.

### Task S2: Enforce Backend Authorization Rules
**Description:** Move all meaningful access control into the backend service layer.

**Subtasks:**
- [ ] Define role-permission matrix for KAM, TL, Admin, internal actors
- [ ] Define row/data-scope constraints
- [ ] Enforce authorization in service methods
- [ ] Add forbidden-access tests for each major API area
- [ ] Keep frontend nav and page guards secondary to backend authorization

**Owner:** Backend  
**Priority:** High  
**Dependencies:** S1, A2, A3, A4, A5  
**Definition of Done:** Unauthorized operations are blocked server-side for every protected workflow.

### Task S3: Secure Client Runtime And Mobile Networking
**Description:** Remove existing platform-level security violations and reduce exposure.

**Subtasks:**
- [ ] Remove Supabase URLs and keys from env handling
- [ ] Remove hardcoded Supabase project ids, anon keys, and REST/RPC hosts from runtime code and ops scripts
- [ ] Update Capacitor config to allow only company backend hosts
- [ ] Ensure no DB or storage secrets are shipped in web or Android builds
- [ ] Add secure storage abstraction for mobile tokens
- [ ] Review CORS, CSP, rate limiting, upload size limits, and content validation

**Owner:** Fullstack  
**Priority:** High  
**Dependencies:** F3, DB5  
**Definition of Done:** Client builds contain no operational secrets and networking is restricted to approved service endpoints.

---

## Phase 7: Testing

### Task T1: Backend Unit And Integration Test Baseline
**Description:** Adopt a stronger test posture similar to `viz-service` so the migration is safe and maintainable.

**Subtasks:**
- [ ] Add unit tests for filters, JWT reader, exception handling, and core services
- [ ] Add integration tests for controllers using test profiles
- [ ] Add testcontainers for Postgres and any required infra
- [ ] Add coverage reporting and thresholds

**Owner:** Backend  
**Priority:** High  
**Dependencies:** B3, B4, A2, A3, A4, A5  
**Definition of Done:** Backend CI tests run green with defined minimum coverage and critical path coverage.

### Task T2: Frontend Integration Tests For Auth And Core Screens
**Description:** Validate the new shell, auth flow, and API-backed screens automatically.

**Subtasks:**
- [ ] Add tests for login redirect/callback flow
- [ ] Add tests for protected route bootstrap
- [ ] Add tests for logout and unauthorized redirect
- [ ] Add integration tests for dashboard, dealer list/detail, lead list/detail, and activity screens
- [ ] Add tests for token-refresh or re-auth behavior

**Owner:** Frontend  
**Priority:** Medium  
**Dependencies:** F3, F4, F5  
**Definition of Done:** Critical frontend paths are covered by automated tests and no longer rely on Supabase mocks.

### Task T3: Manual E2E Validation On Web And Android
**Description:** Confirm that the architecture works in the environments that matter, especially Capacitor Android.

**Subtasks:**
- [ ] Validate login on web
- [ ] Validate login on Android build
- [ ] Validate dashboard and core list/detail screens
- [ ] Validate write flows and upload flows
- [ ] Validate unauthorized, expired-token, and network-error behavior
- [ ] Validate logout and session restore behavior

**Owner:** Fullstack  
**Priority:** High  
**Dependencies:** T1, T2  
**Definition of Done:** A signed-off E2E checklist exists showing the new architecture works on web and Android.

---

## Phase 8: Cleanup & Decommissioning

### Task C1: Remove Supabase SDK And Runtime Dependencies
**Description:** Finish the migration by removing the old platform dependencies from the repo.

**Subtasks:**
- [ ] Remove `@supabase/supabase-js` from dependencies
- [ ] Remove `src/lib/supabase`
- [ ] Remove `src/data/supabaseRaw.ts` from runtime paths
- [ ] Remove `src/data/runtimeDB.ts` from runtime paths
- [ ] Remove old edge-function client code and obsolete docs
- [ ] Remove Supabase env vars from project setup docs

**Owner:** Fullstack  
**Priority:** High  
**Dependencies:** F4, F5, T3  
**Definition of Done:** The app builds and runs with zero runtime dependency on Supabase.

### Task C2: Decommission Transitional Backends And Duplicate Paths
**Description:** Prevent the repo from carrying two active architectures after cutover.

**Subtasks:**
- [ ] Decide whether `src/backend_api` is archived, deleted, or retained as reference
- [ ] Decommission duplicate Supabase function source trees under `src/supabase/functions/server`, `supabase/functions/server`, and `supabase/functions/make-server-4efaad2c`
- [ ] Remove duplicate API abstractions that no longer serve production paths
- [ ] Remove stale auth/session helpers
- [ ] Retire direct Supabase ops scripts and external sync paths once backend-owned ingest/admin flows exist
- [ ] Remove dead code paths created only for transition

**Owner:** Fullstack  
**Priority:** Medium  
**Dependencies:** C1  
**Definition of Done:** Only one supported backend and one supported frontend data-access path remain.

### Task C3: Update Docs, Onboarding, And Runbooks
**Description:** Make the new architecture operable and understandable to future engineers.

**Subtasks:**
- [ ] Document backend module responsibilities
- [ ] Document frontend shell and auth bootstrap flow
- [ ] Reconcile `APP_FLOWS.md` with mounted admin desktop and approval routes so route documentation has one live surface inventory
- [ ] Document local setup and required env vars
- [ ] Document deployment, rollback, and troubleshooting
- [ ] Document API inventory and business workflows

**Owner:** Fullstack  
**Priority:** Medium  
**Dependencies:** C2  
**Definition of Done:** A new engineer can set up, understand, and run the architecture using repo docs alone.

---

## Phase 9: Optional Enhancements

### Task O1: Add Read-Optimized Projections
**Description:** If dashboard and reporting queries become expensive, introduce dedicated read models instead of overloading transactional tables.

**Subtasks:**
- [ ] Identify aggregate-heavy read paths
- [ ] Add projection tables or materialized views
- [ ] Define refresh strategy via events or scheduled jobs
- [ ] Add projection consistency monitoring

**Owner:** Backend  
**Priority:** Low  
**Dependencies:** A6  
**Definition of Done:** Expensive aggregate reads run against read-optimized models with explicit refresh semantics.

### Task O2: Split Notifications Into Dedicated Module
**Description:** Mirror `viz-notification` only if notification complexity justifies separate ownership and deployment.

**Subtasks:**
- [ ] Move notification entities, repositories, and services into `crm-notification`
- [ ] Add notification delivery abstractions
- [ ] Add SSE/push/email channels if needed
- [ ] Define notification fanout and retry behavior

**Owner:** Backend  
**Priority:** Low  
**Dependencies:** A6  
**Definition of Done:** Notification concerns are isolated and independently evolvable.

### Task O3: Add Operational Observability Dashboards
**Description:** Make the system operable under production load with measurable service health.

**Subtasks:**
- [ ] Add latency metrics for core APIs
- [ ] Add auth failure metrics
- [ ] Add DB query latency metrics
- [ ] Add cache hit/miss metrics
- [ ] Add upload/storage failure metrics
- [ ] Define alerts and dashboards

**Owner:** Backend  
**Priority:** Low  
**Dependencies:** T3  
**Definition of Done:** Team has actionable dashboards and alert thresholds for production support.

---

## Recommended Execution Order

1. D1 -> D2 -> D3 -> D4 -> D5  
2. B1 -> B2 -> B3 -> B4 -> B5  
3. DB1 -> DB2 -> DB3 -> DB4 -> DB5  
4. A1 -> A2 -> A3 -> A4 -> A5 -> A6  
5. F1 -> F2 -> F3 -> F4 -> F5  
6. S1 -> S2 -> S3  
7. T1 -> T2 -> T3  
8. C1 -> C2 -> C3  
9. O1 -> O2 -> O3

## Final Acceptance Criteria

- The frontend no longer accesses Supabase, Postgres, or object storage directly
- The backend is multi-module and follows `viz-service`-style separation of API, core logic, and async processing
- Authentication is handled through a centralized filter chain and normalized request context
- Authorization is enforced server-side for all protected business operations
- All major CRM screens use business APIs instead of client-side data composition
- Supabase SDK, env vars, host allowlists, and production dependencies are fully removed
- The new architecture is validated on both web and Android
