# Go-Live Blueprint — Superleap CRM

Generated 2026-06-11 from the 25-agent comprehensive audit.

## Audit summary

- **Total findings:** 69
- **P0 (blocking):** 12, of which **11 verified real** by adversarial check
- **By category:**
  - fe-be-coupling: 12
  - security: 21
  - architecture: 4
  - data: 9
  - infra: 8
  - ai-readiness: 7
  - test: 5
  - observability: 3

## Synthesis

Blueprint written to `/Users/a30711/superleap-crm/docs/GOLIVE_BLUEPRINT.md` (~1,750 words).

Structure:
- **Executive summary** (3 paragraphs): current state honest, the structural blocker (FE never wired to BE), the 6-week path with 3 unblock decisions
- **12 must-do items** as an ordered table with owner tags (us, cars24-platform, cars24-secops, cars24-idp, vendor) and effort estimates, gated to weeks 1–6
- **5 biggest risks** (platform queue depth, IdP drift, audit-log integrity, FE test gap, pilot rejection) each with concrete mitigation
- **3 week-1 decisions** (identity provider, cloud/data ownership, pilot zone/TL) with default fallbacks if leadership doesn't pick
- **Go/no-go checklist** organized into 4 buckets (Code & security, Infra & ops, Identity & access, Data & business) — single-line tick items

Owner distribution across the 12 items: 9 owned by us, 2 needing cars24-platform, 1 needing cars24-idp, 1 needing cars24-secops, 1 needing vendor (pen test). Items 1–6 fit in one engineer-week and are parallelisable; item 7 (platform-team ticket) is filed day 1 because it's the long pole; items 8–10 are the actual cutover work; items 11–12 are non-negotiable gates.

---

## Verified-real P0 findings (in priority order)

### P0-1: Controllers leak JPA entities as API responses (35+ endpoints, every command path)

- **Category:** fe-be-coupling
- **Owner:** us
- **Effort:** ~32h
- **Files cited:**
  - `backend/crm-api/src/main/java/com/cars24/crmapi/controller/web/LeadController.java:73`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/controller/web/LeadController.java:115`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/controller/web/DealerController.java:85`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/controller/web/DealerController.java:110`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/controller/web/DealerController.java:126`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/controller/web/AdminTargetController.java:47`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/controller/web/AdminTargetController.java:61`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/controller/web/AdminTargetController.java:86`
  - ...and 28 more

**Summary:** The audit prompt called out LeadController:73 + DealerController:85,110 as known bad, but the pattern is systemic. Every command endpoint and most admin reads return JPA entities directly (LeadEntity, DealerEntity, UntaggedDealerEntity, UserEntity, TeamEntity, TargetEntity, IncentiveSlabEntity, IncentiveRuleEntity, VisitEntity, CallEventEntity, NotificationEntity, AsyncJobEntity, AuditLogEntity, DcfLeadEntity, DcfTimelineEventEntity). Zero @JsonIgnore annotations exist on any entity (verified via grep). This makes the DB schema the API contract: any new column auto-leaks. Critically dangerous for the in-progress SSO/IDP migration — the moment cars24-idp adds password_hash, mfa_secret, oauth_subject, refresh_token, or session columns to users, dealers, or related tables, /web/v1/admin/users and others auto-expose them. UserEntity already exposes must_reset_password which is internal state. Combined with spring.jpa.open-in-view=false (verified in application.yml:15), the system is one @OneToMany away from LazyInitializationException-500s in production — the only reason it works today is that entities are flat. Blocks safe Cars24 cloud cutover because the IDP integration WILL add auth columns.

**Fix:** Add a Response DTO + static fromEntity(...) factory for every entity-returning endpoint, modeled on the existing LeadDetailResponse and DealerDetailResponse patterns already in the codebase. Drive this with a checklist (one PR per controller). Belt-and-braces: add a ArchUnit test in crm-api that fails the build if any @RestController method signature references com.cars24.crmcore.entity.*Entity. While at hand, add @JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true) at the entity superclass level as a temporary safety net during the migration window.

**Verification evidence:** {'real': True, 'evidence': 'Verified at /Users/a30711/superleap-crm HEAD 6bfdc33 (current branch feature/lead-creation-flow; the requested 737a0d6 was an earlier commit on the same branch — pattern unchanged).\n\n1) LeadController.java:73 — `public ResponseEntity<ApiResponseEnvelope<LeadEntity>> createLead(...)` returns `responseBuilder.ok(created)` where `created` is the raw `LeadEntity` from `leadCommandService.createLead(...)`. Line 115 mirrors this for `updatePricing` returning `LeadEntity`. Notably, the read path at :103 DOES use a DTO (`LeadDetailResponse.fromEntity(lead)`), proving the pattern exists but is selectively applied only to one read.\n\n2) DealerController.java:85 — `ResponseEntity<ApiResponseEnvelope<UntaggedDealerEntity>> logUntaggedDealer(...)` returns raw `UntaggedDealerEntity`. :110 returns raw `DealerEntity` (toggleTopTag). :126 returns raw `DealerEntity` (requestLocationUpdate).\n\n3) AdminUserController.java — every single endpoint (lines 47, 60, 71, 97, 122, 137) returns `UserEntity` directly: listUsers, getUser, createUser, updateUser, deactivateUser, reactivateUser. UserEntity.java:45-46 has `@Column(name = "must_reset_password") private Boolean mustRes

---

### P0-2: Hand-rolled JSON in audit log oldValues/newValues across 6+ services (injection + corruption risk)

- **Category:** security
- **Owner:** us
- **Effort:** ~6h
- **Files cited:**
  - `backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/LeadCommandServiceImpl.java:114`
  - `backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/LeadCommandServiceImpl.java:115`
  - `backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/DealerCommandServiceImpl.java:83`
  - `backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/DealerCommandServiceImpl.java:84`
  - `backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/DealerCommandServiceImpl.java:113`
  - `backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/DealerCommandServiceImpl.java:114`
  - `backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/AppointmentCommandServiceImpl.java:135`
  - `backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/AppointmentCommandServiceImpl.java:162`
  - ...and 10 more

**Summary:** The prompt flagged LeadCommandServiceImpl:114 as a single known bad spot. It's actually a copy-paste pattern in every command service: oldValues/newValues are built with raw string concatenation like "{\"address\":\"" + oldAddress + "\"}". Several of the concatenated values come straight from user input (DealerEntity.address from LocationUpdateRequest, customer_name, customer_phone, lead make/model, CEP confidence string). A dealer named O'Hara's "Used Cars" or an address with a quote/newline breaks JSON parsing of the audit log forever; a malicious user can inject arbitrary JSON keys into the audit oldValues/newValues, which then poison any downstream analytics/SIEM that parses the audit table. BulkImportPipeline.toJsonArray() escapes only quotes, not backslashes/newlines/control chars. Audit logs are the post-incident forensic trail Cars24 SecOps relies on — corrupting them blocks safe production cutover.

**Fix:** Inject ObjectMapper (already a singleton bean used by Cars24LeadServiceImpl) into AuditService and add log(...Map<String,Object> oldValues, Map<String,Object> newValues...) overloads that serialize via objectMapper.writeValueAsString. Migrate call sites mechanically: "{\"cep\":\"" + oldCep + "\"}" -> Map.of("cep", oldCep). Add a unit test that round-trips a value containing quote/backslash/newline/unicode through the audit log. The BulkImportPipeline result summary should also use ObjectMapper. Deprecate the String oldValues/newValues overload (do not remove yet — keep it for one release).

**Verification evidence:** {'real': True, 'evidence': 'Confirmed at current HEAD 6bfdc33 (one commit past cited 737a0d6; intervening commit is unrelated prod-profile/JWT hardening). All cited line numbers match verbatim:\n\nLeadCommandServiceImpl.java:114-115 — `oldCep != null ? "{\\"cep\\":\\"" + oldCep + "\\"}" : null,` then `"{\\"cep\\":\\"" + command.getCep() + "\\",\\"cep_confidence\\":\\"" + command.getCepConfidence() + "\\"}"`.\n\nDealerCommandServiceImpl.java:83-84 — `"{\\"is_top\\":" + oldIsTop + "}"` / `"{\\"is_top\\":" + newIsTop + "}"`.\nDealerCommandServiceImpl.java:113-114 — `oldAddress != null ? "{\\"address\\":\\"" + oldAddress + "\\"}" : null,` / `"{\\"address\\":\\"" + command.getNewAddress() + "\\"}"`. `oldAddress` and `command.getNewAddress()` flow straight from `LocationUpdateRequest` body — user-controlled, so an apostrophe, quote, backslash, or newline in a dealer address corrupts the audit JSON forever (and lets an attacker inject arbitrary JSON keys).\n\nAppointmentCommandServiceImpl.java:135 — `"{\\"from\\":\\"" + appointmentId + "\\"}"`.\nAppointmentCommandServiceImpl.java:162-163 — `"{\\"status\\":\\"" + oldStatus + "\\"}"` / `"{\\"status\\":\\"" + newStatus + "\\"}"`.\n\nUserComm

---

### P0-3: Frontend bypasses backend; admin clients forge their own audit_log directly against Supabase

- **Category:** architecture
- **Owner:** us
- **Effort:** ~80h
- **Files cited:**
  - `src/components/admin/desktop/AdminSettingsPage.tsx:60-72`
  - `src/data/mgmtRepo.ts:74-82`
  - `src/data/mgmtRepo.ts:99-107`
  - `src/data/supabaseRaw.ts:38-54`
  - `src/data/supabaseRaw.ts:649-666`
  - `supabase/migrations/0001_initial_schema.sql:308`
  - `supabase/migrations/0002_security_and_performance_fixes.sql:156-158`

**Summary:** The web client mutates `incentive_slabs`, `incentive_rules`, `users`, `targets`, and `dealers_master` via direct supabase-js calls — using the public anon JWT plus the logged-in user's Supabase session — and immediately writes an `audit_log` row describing what it just did. The migration explicitly comments 'Audit log should only be written to by triggers' but no INSERT policy is defined and no trigger exists, so the client write either silently fails (errors are not awaited/inspected in AdminSettingsPage) or, if a permissive INSERT policy is added later, the actor is auditing itself. This is unshippable: (a) the audit trail is forgeable by every admin user, (b) the audit-log integrity required for any SOX/PCI-style internal control is broken by construction, (c) all admin authorisation lives in the browser, so a hostile or curious user can hit the same supabase.from('targets').update(...) call from DevTools and skip the React role check entirely. This is the same root cause as RFP B1 + B9.

**Fix:** All admin/config writes must move behind authenticated Spring endpoints (`/web/v1/admin/{slabs,rules,targets,users}`) that already exist as `Admin*Controller` and already call `actorScopeResolver.requireRole("ADMIN")`. The backend should be the only writer of `audit_log`, populated from the JWT `effective_user_id`/`actor_scope`. Until the FE is wired (RFP B1), revoke the Supabase anon role's INSERT/UPDATE/DELETE on all business tables (slabs, rules, users, targets, audit_log, dealers_master) — leave read-only RLS only. Add a server-side INSERT policy on audit_log that admits only `service_role` (i.e. the Spring backend connecting with a service credential).

**Verification evidence:** {'real': True, 'evidence': 'Verified at HEAD (6bfdc33, advanced from 737a0d6 by one commit that does not touch these files). All cited client-side write paths and the missing audit_log INSERT policy/trigger are unchanged.\n\n1) src/components/admin/desktop/AdminSettingsPage.tsx:60-72 — direct supabase-js mutations + forged audit_log insert, return value of audit insert not inspected:\n   L60: `const { error } = await supabase.from(\'incentive_slabs\').update({ [field]: value }).eq(\'slab_id\', slab.slab_id);`\n   L62: `await supabase.from(\'audit_log\').insert({ action: \'slab_update\', entity_type: \'incentive_slab\', entity_id: slab.slab_id, change_summary: ... });`\n   L68: `const { error } = await supabase.from(\'incentive_rules\').update({ [field]: value }).eq(\'rule_id\', rule.rule_id);`\n   L70: `await supabase.from(\'audit_log\').insert({ action: \'rule_update\', ... });`\n\n2) src/data/mgmtRepo.ts:74-82 (updateUser) and 99-107 (updateTarget) — client writes `users` / `targets` and self-inserts audit_log:\n   L74: `const { error } = await supabase.from(\'users\').update(patch).eq(\'user_id\', user_id);`\n   L76-79: `await supabase.from(\'audit_log\').insert({ action: \'user

---

### P0-4: Generic-table read helper enables any-table SELECT via supabase-js

- **Category:** data
- **Owner:** us
- **Effort:** ~60h
- **Files cited:**
  - `src/data/supabaseRaw.ts:38-54`
  - `src/lib/supabase/client.ts:1-6`

**Summary:** `fetchAll(table, select, ...)` takes the table name as a string and runs `supabase.from(table).select(select).range(...)`. Today it is called with constant table names, but the function is exported-shaped and exists in the bundle alongside a fully wired supabase client. Combined with the fact that the FE holds a real Supabase user session (not a service role), confidentiality depends entirely on the RLS policies on every table. The same bundle exposes anon key + URL, so anybody with the bundle can stand up their own supabase-js client against the project and try the full row enumeration on every table that has a permissive `auth.uid() IS NOT NULL` policy — which migration 0002 grants to dealers_raw, calls_raw, visits_raw, leads_raw, dcf_leads_raw, dcf_cases, etc. After a session is obtained from any KAM account, that user can SELECT raw rows across regions/teams beyond their assigned scope.

**Fix:** Two-step: (1) audit RLS — replace every `auth.uid() IS NOT NULL` SELECT/INSERT policy on business tables with role-and-ownership-scoped policies (`assigned_kam_id = auth.uid() OR get_auth_user_role() IN ('TL','ADMIN')`, with TL bounded by team_id). (2) Move reads to the Spring backend's per-resource controllers which already scope queries by `actorScopeResolver`. Drop the generic `fetchAll(table)` helper — every read should go through a typed API call so the table allowlist is enforced at compile time, not at runtime via Supabase's row filter.

**Verification evidence:** {'real': True, 'evidence': 'Confirmed at HEAD 737a0d6.\n\n(1) Generic helper exists exactly as cited — `src/data/supabaseRaw.ts:38-43`:\n```\nasync function fetchAll<T = any>(table: string, select: string, pageSize = 1000): Promise<T[]> {\n  const all: T[] = [];\n  let from = 0;\n  while (true) {\n    const { data, error } = await supabase.from(table).select(select).range(from, from + pageSize - 1);\n```\nTable is a runtime string passed to `.from(table).select(select)` — no compile-time allowlist.\n\n(2) Client is a plain anon-key supabase-js instance bundled into the FE — `src/lib/supabase/client.ts:1-6`:\n```\nimport { createClient } from \'@supabase/supabase-js\';\nconst supabaseUrl = import.meta.env.VITE_SUPABASE_URL;\nconst supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;\nexport const supabase = createClient(supabaseUrl, supabaseAnonKey);\n```\nThe `VITE_` prefix means URL+anon key ship in the JS bundle to every browser — anyone with the bundle can stand up their own supabase-js against the project, and confidentiality reduces entirely to RLS.\n\n(3) Migration 0002 (`supabase/migrations/0002_security_and_performance_fixes.sql:165-191`) grants permissive `auth.uid() 

---

### P0-5: Cars24 internal gateway Basic-auth credential hard-coded in the JS bundle

- **Category:** security
- **Owner:** cars24-be
- **Effort:** ~24h
- **Files cited:**
  - `src/lib/api/c24Api.ts:49`

**Summary:** `const BASIC_AUTH = 'Basic YzI0X2FwaTpCMHctOWVnc3lNUk1nbTFGQko5Q2J2YTVJYXdOQmVSZg=='` is hard-coded as a module-level constant. Base64-decoding gives the live username/password `c24_api : B0w-9egsyMRMgm1FBJ9Cbva5IawNBeRf` for `gateway.24c.in/vehicle` and `gateway.24c.in/partners-lead`. Every Vite production build ships this verbatim — anyone with the bundle (any signed-in KAM, anyone who curls the SPA, anyone with an APK) can call the Cars24 internal partners-lead and vehicle endpoints directly, posing as the KAM panel. This is also baked into `.claude/worktrees/peaceful-wiles/.claude/settings.local.json` lines 254-257 indicating the credential is shared and reused. The credential cannot be 'rotated' as a fix — anything that lives in a public SPA bundle is permanently public.

**Fix:** Remove the literal from c24Api.ts. Move all Cars24 gateway calls server-side: add a `/web/v1/cars24/vehicle/*` and `/web/v1/cars24/partners-lead/*` thin proxy in crm-api (config already provisioned at `application.yml:89-103` under `crm.cars24.*`). The Spring backend signs the request with `C24_BASIC_AUTH` from secrets manager; the FE just forwards the user JWT and the proxy attaches both the service Basic auth and the per-user `x-auth-key`. Rotate the `c24_api` credential immediately with the Cars24 platform team and confirm git-history scrub. Until proxy lands, do not push the repo to Cars24 cloud or any third-party CI.

**Verification evidence:** {'real': True, 'evidence': 'Confirmed at /Users/a30711/superleap-crm/src/lib/api/c24Api.ts:49 — verbatim: `const BASIC_AUTH = \'Basic YzI0X2FwaTpCMHctOWVnc3lNUk1nbTFGQko5Q2J2YTVJYXdOQmVSZg==\';` with the comment on line 48 reading "// Basic auth for Cars24 internal gateway (same as KAM panel)". The constant is module-level, referenced by `vehicleHeaders()` (line 76: `\'Authorization\': BASIC_AUTH,`) which is consumed by every vehicle-service fetch helper. Production base URLs are `https://gateway.24c.in/vehicle` (line 40) and `https://gateway.24c.in/partners-lead` (line 42), both of which receive this Authorization header. Because Vite inlines module constants, every production build ships the literal in the SPA bundle — anyone who downloads the JS can decode `c24_api:B0w-9egsyMRMgm1FBJ9Cbva5IawNBeRf` and impersonate the KAM panel against the Cars24 internal gateway. There is no runtime check, no proxy, and no environment-only gating around the constant. P0 finding is real and unmitigated at HEAD 737a0d6.', 'refute_reason': ''}

---

### P0-6: Spring backend has no Spring Security; only custom servlet filters on /web /app /internal — actuator and swagger paths are unauthenticated

- **Category:** security
- **Owner:** us
- **Effort:** ~24h
- **Files cited:**
  - `backend/crm-api/src/main/java/com/cars24/crmapi/config/FilterConfig.java:15-19`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/filter/JwtTokenFilter.java:46-79`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/filter/AuthenticationFilter.java:24-35`
  - `backend/crm-api/src/main/resources/application-prod.yml:25-46`

**Summary:** `FilterConfig` registers `JwtTokenFilter` + `AuthenticationFilter` only on the URL patterns `/web/v1/*`, `/app/v1/*`, `/internal/v1/*`. Spring Security is not on the classpath (no `spring-boot-starter-security` in pom). That means `/actuator/**`, `/api-docs/**`, `/swagger-ui/**`, `/error`, and any other Spring-default endpoint serve without authentication. Prod yml does narrow actuator exposure to `health,metrics` and disables swagger, but `/actuator/metrics` still leaks JVM internals, request counts per URI, DB pool stats, and is reachable from anyone who can hit the pod's port (including, in a flat internal cloud network, every other tenant). There is also no CSRF protection — `CorsConfig` enables `allowCredentials(true)` on /web and /app paths, so if `crm.cors.allowed-origins` ever includes a malicious origin, the cookie-/credential-mode browser CSRF surface is wide open. There is no rate limiting, no brute-force protection, no security-headers filter on the Spring side (only nginx for the SPA, not the API).

**Fix:** Add `spring-boot-starter-security` to crm-api/pom.xml. Configure a `SecurityFilterChain` that (a) `permitAll()` only `/actuator/health` and explicitly denies everything else under `/actuator/**` unless the request comes from the internal probe CIDR, (b) requires authentication on `/**`, (c) sets `SessionCreationPolicy.STATELESS`, (d) disables form login + http basic, (e) installs `JwtTokenFilter` before `UsernamePasswordAuthenticationFilter`. Use Spring Security's CSRF default for any future cookie-mode auth, or document `STATELESS+Bearer` explicitly. Add a global response-headers filter for HSTS, X-Content-Type-Options, X-Frame-Options=DENY, Referrer-Policy.

**Verification evidence:** {'real': True, 'evidence': 'Verified at current HEAD 6bfdc33 (cited HEAD 737a0d6 also confirmed identical on the core issue). The P0 is genuinely present.\n\n1) Spring Security is NOT on the classpath. backend/crm-api/pom.xml lines 34-50 show only spring-boot-starter-web, validation, actuator, and springdoc — `grep -i security` over pom.xml returns zero matches. spring-boot-starter-actuator IS present, exposing actuator endpoints.\n\n2) FilterConfig.java:15-19 (current HEAD, unchanged from 737a0d6) only protects three URL patterns:\n   private static final List<String> PROTECTED_URL_PATTERNS = List.of(\n           "/web/v1/*",\n           "/app/v1/*",\n           "/internal/v1/*"\n   );\n   Both JwtTokenFilter and AuthenticationFilter beans are registered with this list (lines 30-46). Without Spring Security, anything outside these three patterns (/actuator/**, /error, /api-docs/**, /swagger-ui/**, custom controllers under any other path) bypasses auth entirely.\n\n3) application-prod.yml at current HEAD (lines 25-37) does narrow actuator exposure to `include: health,metrics` and hides health details, and disables springdoc UI/api-docs (lines 42-46). But /actuator/metrics remains e

---

### P0-7: Dev-header auth bypass still env-toggleable; one misconfigured env var = arbitrary admin in prod

- **Category:** security
- **Owner:** us
- **Effort:** ~4h
- **Files cited:**
  - `backend/crm-api/src/main/java/com/cars24/crmapi/filter/JwtTokenFilter.java:74-78`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/filter/JwtTokenFilter.java:106-170`
  - `backend/crm-api/src/main/resources/application-prod.yml:19`
  - `backend/crm-api/src/main/resources/application.yml:84`
  - `backend/docker-compose.yml:32`

**Summary:** `JwtTokenFilter.resolveDevHeaderContext` accepts `X-User-Id`, `X-User-Role`, `X-Permissions`, `X-Team-Id`, and even `X-Impersonate-User-Id` headers and builds a fully-authenticated `RequestContext` from them — no signature, no shared secret, no source-IP check. The role is whatever the client wrote in `X-User-Role` (so `ADMIN` is one header away). Whether this code path is reachable in prod depends on the boolean `crm.jwt.dev-header-fallback-enabled`. `application-prod.yml:19` correctly hardcodes it `false` (no `${...}` interpolation), which is good. BUT `application.yml:84` still reads `${CRM_JWT_DEV_HEADER_FALLBACK_ENABLED:false}` — and because Spring's profile-override semantics put `application-prod.yml` ON TOP of `application.yml`, the prod literal `false` does win — UNLESS the operator sets `CRM_JWT_DEV_HEADER_FALLBACK_ENABLED=true` in the prod environment, in which case Spring's relaxed env binding overrides the prod-profile literal. The literal in application-prod.yml is not a real override; it is just a fallback default for the same property. The only safe shape is removing the code path entirely from prod builds. RFP B3 partially addresses this but undersells the risk.

**Fix:** Add `@Profile("!prod")` (or `@ConditionalOnProperty` keyed off a non-overridable build flag) to a wrapper around the dev-header code in `JwtTokenFilter`, OR move `resolveDevHeaderContext` into a separate `@Profile("dev|stage-local")` filter and let prod builds simply not register it. As a belt-and-braces measure, change `JwtConfig.validate()` to additionally throw if `enabled=true && devHeaderFallbackEnabled=true && active-profile=prod`. Remove `CRM_JWT_DEV_HEADER_FALLBACK_ENABLED` from any prod env template and add a CI guard that fails build if `application-prod.yml` references it.

**Verification evidence:** {'real': True, 'evidence': 'Verified at HEAD 737a0d6 — finding is REAL.\n\n1) JwtTokenFilter.java:74-78 (the gate) — dev-header path is reachable whenever the flag is true:\n```\nif (jwtConfig.isDevHeaderFallbackEnabled()) {\n    return resolveDevHeaderContext(request, response);\n}\n```\n\n2) JwtTokenFilter.java:121-126 — fully authenticated context built from raw client headers, no signature/secret/IP check:\n```\nActorContext authenticatedActor = ActorContext.builder()\n        .userId(userId)\n        .roles(List.of(userRole))\n        .permissions(parseCsvHeader(header(request, "X-Permissions")))\n        .tenantGroup(header(request, "X-Team-Id"))\n        .build();\n```\nLines 132-149 also confirm `X-Impersonate-User-Id` works once role is ADMIN — which the same client just self-asserted via `X-User-Role`. So one header = arbitrary admin = arbitrary impersonation.\n\n3) application-prod.yml:19 — literal `false`:\n```\ndev-header-fallback-enabled: false\n```\nThis is a profile-specific default, NOT a hard guarantee. Per Spring Boot\'s documented PropertySource ordering, OS environment variables sit ABOVE `application-{profile}.yml` packaged inside the jar. Setting `CRM_JWT_DEV

---

### P0-8: Spring Boot 3.2.5 ships several known CVEs (path traversal, auth bypass, denial of service)

- **Category:** security
- **Owner:** us
- **Effort:** ~8h
- **Files cited:**
  - `backend/pom.xml:26`

**Summary:** `<spring-boot.version>3.2.5</spring-boot.version>` is from April 2024. Since then: CVE-2024-38807 (Spring Boot signature-verification bypass for loader-launched JARs), CVE-2024-38816 (Spring Framework path-traversal via static resources — directly relevant since Spring MVC is in use), CVE-2024-38821 (WebFlux static-resource authorisation bypass — not directly applicable since this is Servlet, but the same Spring Framework version line is affected by 38816). Cars24 SecOps and most enterprise scanners (Trivy, Snyk) will flag the image and refuse promotion. RFP B8 calls this out.

**Fix:** Bump `<spring-boot.version>` to the latest 3.2.x patch (>= 3.2.12 — `mvn versions:display-property-updates -Dincludes=org.springframework.boot:*`) or migrate to 3.3.x LTS. Run `mvn -B clean verify` (already 232 tests green). Add `dependency-check-maven` or Snyk to CI to fail PRs on new criticals. Pin a renovate/dependabot config so this doesn't drift again.

**Verification evidence:** {'real': True, 'evidence': 'backend/pom.xml line 29: `<spring-boot.version>3.2.5</spring-boot.version>`. Confirmed at HEAD 737a0d6. The file even contains a self-acknowledging TODO at lines 26-28: "TODO(security): bump to 3.3.13 (or 3.4.x LTS) once Maven Central is reachable from build env. 3.2.x is EOL Aug 2025 and carries CVE-2024-38807 / 38816 / 38821. See docs/GOLIVE_READINESS.md B8." The vulnerable version is still pinned and imported via `spring-boot-dependencies` (line 41) in dependencyManagement, so every child module (crm-api, crm-core, crm-pipeline, crm-notification) inherits the vulnerable Spring Framework/Boot bill of materials. No mitigation applied — finding is real.', 'refute_reason': ''}

---

### P0-9: Ola Maps API key baked into JS bundle as VITE_OLA_MAPS_API_KEY

- **Category:** security
- **Owner:** cars24-be
- **Effort:** ~16h
- **Files cited:**
  - `src/lib/api/c24Api.ts:45-47`
  - `src/lib/api/c24Api.ts:280-298`
  - `Dockerfile:26-32`

**Summary:** `VITE_OLA_MAPS_API_KEY` is a Vite build-time constant — it lands in the production JS bundle in clear text and is sent as a query string to `api.olamaps.io`. The Dockerfile takes it as `ARG VITE_OLA_MAPS_API_KEY` and inlines it. Anyone with DevTools (or a saved bundle) extracts the key, and Ola Maps bills the Cars24 account for arbitrary usage. There is no Ola-side referer restriction discoverable here. Same shape as RFP B6.

**Fix:** Remove `VITE_OLA_MAPS_API_KEY` from Dockerfile ARGs and from c24Api.ts. Add `/web/v1/maps/autocomplete` and `/web/v1/maps/reverse-geocode` proxy endpoints in crm-api (config slot already exists at `application.yml:104-109`). Spring server holds the key in env/secrets manager, forwards the user JWT for auth, optionally rate-limits per user. Rotate the existing Ola key after the proxy ships. Lock Ola's IP allow-list / referer to Cars24 infra.

**Verification evidence:** {'real': True, 'evidence': "Finding is real and unchanged at HEAD 6bfdc33 (one commit past cited 737a0d6, which only touched backend security hardening — none of the cited FE/Dockerfile lines changed).\n\n1. src/lib/api/c24Api.ts:45-46 — the key is a Vite build-time constant that ends up in the JS bundle:\n   `const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY || '';`\n\n2. src/lib/api/c24Api.ts:280-282 and :293-295 — the key is sent in clear text as a query string to api.olamaps.io directly from the browser:\n   `fetch(\\`${OLA_MAPS_BASE}/autocomplete?input=${encodeURIComponent(query)}&api_key=${OLA_MAPS_API_KEY}\\`)` and the matching `/reverse-geocode?latlng=...&api_key=${OLA_MAPS_API_KEY}` call. In production `OLA_MAPS_BASE` is `https://api.olamaps.io/places/v1` (line 44), so the key egresses to Ola from the user's browser.\n\n3. Dockerfile:26 and :32 — `ARG VITE_OLA_MAPS_API_KEY` followed by `ENV ... VITE_OLA_MAPS_API_KEY=$VITE_OLA_MAPS_API_KEY` injects the key into the Vite build environment, baking it into the static bundle that nginx serves.\n\nConfirmed actively used (not dead code): src/components/appointment-booking/BookAppointmentFlow.tsx:189 and :208 call `c

---

### P0-10: Auth: Supabase Auth is the ONLY sign-in path — zero Spring backend integration

- **Category:** fe-be-coupling
- **Owner:** cars24-idp
- **Effort:** ~56h
- **Files cited:**
  - `src/lib/auth/authService.ts:14 (supabase.auth.signInWithPassword)`
  - `src/lib/auth/authService.ts:106 (supabase.auth.signInWithOAuth — Google SSO)`
  - `src/lib/auth/authService.ts:143 (getSession), :149/:163/:196/:301 (signOut), :279 (signInWithOtp), :288 (verifyOtp), :298/:314/:322 (updateUser)`
  - `src/lib/auth/authService.ts:26 (select * from users where user_id = sb.user.id — profile lookup)`
  - `src/components/auth/AuthProvider.tsx:19 (import supabase), :55 (supabase.auth.onAuthStateChange)`
  - `src/data/mgmtRepo.ts:177 (getSession to attach JWT to mgmt-export raw fetch), :219 (getUser), :222 (updateUser password)`
  - `src/components/admin/AdminApprovalPanel.tsx:61/95 (getSession), :67/101 (supabase.functions.invoke('approve-signup'))`
  - `src/components/pages/auth/SignupPage.tsx:52 (insert into signup_requests)`
  - ...and 2 more

**Summary:** Every authentication touchpoint — password login, Google SSO redirect, session hydration, profile fetch, signup request creation, admin approve/reject, password reset — runs through Supabase Auth. The Spring backend (per docs/18_API_ENDPOINT_CATALOG.md) expects Cars24 IdP JWTs on /web/v1/* and /app/v1/*. Recent merge of Google SSO branch (737a0d6) DOUBLED DOWN on Supabase rather than cutting it over. AuthProvider subscribes to supabase.auth.onAuthStateChange — if Supabase is decommissioned the entire app cannot bootstrap. Zero Spring-backend wiring exists for auth on the FE.

**Fix:** 1) Stand up an SSO contract with Cars24 IdP that mints a Spring-backend-compatible JWT (or sidecar-trade Supabase JWT → backend JWT via /web/v1/auth/exchange). 2) Replace src/lib/auth/authService.ts to call Spring /auth/login + /auth/google-callback; keep the same exported surface (login, signInWithGoogle, getSession, hydrateSessionFromSupabase rename → hydrateSession). 3) Replace AuthProvider.tsx:55 subscription with a backend session refresh (e.g. /web/v1/me + /auth/refresh on 401). 4) Re-implement signup_requests insert + approve-signup edge function as POST /web/v1/admin/signup-requests + POST /web/v1/admin/signup-requests/{id}/approve. 5) Delete src/lib/supabase/client.ts after all call sites are gone — this is the canonical migration gate. Until gate (5) passes, Supabase Auth must keep running.

**Verification evidence:** {'real': True, 'evidence': 'Confirmed at HEAD 6bfdc33 (one commit after the 737a0d6 referenced; the new commit hardens backend JWT config only, does not touch FE auth). All cited lines verified verbatim:\n\n- src/lib/auth/authService.ts:14 — `const { data, error } = await supabase.auth.signInWithPassword({ email: credentials.email, password: credentials.password });`\n- src/lib/auth/authService.ts:106 — `const { data, error } = await supabase.auth.signInWithOAuth({ provider: \'google\', options: { redirectTo: window.location.origin, queryParams: { hd: \'cars24.com\', prompt: \'select_account\' }, skipBrowserRedirect: sandboxed, } });`\n- src/lib/auth/authService.ts:26-30 — `const { data: userRow, error: profileError } = await supabase.from(\'users\').select(\'*\').eq(\'user_id\', user.id).single();`\n- src/lib/auth/authService.ts:143 (`supabase.auth.getSession()`), :149/:163/:196/:301 (`supabase.auth.signOut()`), :279 (`supabase.auth.signInWithOtp`), :288 (`supabase.auth.verifyOtp`), :298/:314/:322 (`supabase.auth.updateUser`) — all confirmed.\n- src/components/auth/AuthProvider.tsx:19 — `import { supabase } from \'../../lib/supabase/client\';`\n- src/components/auth/AuthProvider.t

---

### P0-11: Leads: dual write paths to Supabase + dead Spring facade — no backend wiring

- **Category:** fe-be-coupling
- **Owner:** us
- **Effort:** ~72h
- **Files cited:**
  - `src/api/lead.api.ts:7 (import supabase), :40 insert sell_leads_master, :80 update sell_leads_master appointment_status, :100 update sell_leads_master target_price`
  - `src/components/pages/LeadCreatePage.tsx:13 (import supabase), :65 insert leads_raw (NB: writes to a DIFFERENT table than lead.api.ts createLead!)`
  - `src/lib/api/crmApi.ts:5 doc-comment, :181 BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4efaad2c/crm-api` — still pointing at Supabase Edge`
  - `src/lib/api/crmApi.ts:249 updateLeadCEP (consumed by src/components/pages/LeadDetailPageV2.tsx:37, LeaderboardPage.tsx:21, IncentiveDrawer.tsx:18)`
  - `src/data/supabaseRaw.ts:181 fetchLeadsRaw('sell_leads_master'), :351 fetchDcfLeadsRaw('dcf_leads_master') — all list reads`
  - `src/data/runtimeDB.ts:7/210 calls fetchLeadsRaw via Promise.all → primes the in-memory cache the whole UI reads from`
  - `backend/crm-api/src/main/java/com/cars24/crmapi/controller/web/LeadController.java (Spring impl exists at /web/v1/leads — never called by FE)`

**Summary:** Two Supabase write paths and one Supabase-Edge Functions read path for leads, and no calls to the Spring LeadController whatsoever. LeadCreatePage writes to `leads_raw` while api/lead.api.ts:createLead writes to `sell_leads_master` — these are inconsistent schemas, suggesting both predate the canonical model. crmApi.ts (used by LeadDetail, Leaderboard, IncentiveDrawer) is the most dangerous: it's labeled 'CRM API' but BASE_URL is hard-coded to make-server-4efaad2c on Supabase Edge — the moment Supabase Edge is turned off, CEP updates, leaderboard, and incentive drawer all break. The legacy src/api/*.api.ts facade is orphaned: nobody imports fetchLeads/fetchDealers/fetchActivities; reads come from runtimeDB → supabaseRaw.

**Fix:** 1) Repoint src/lib/api/crmApi.ts:181 BASE_URL → `${import.meta.env.VITE_BACKEND_URL}/web/v1` and rewrite the apiFetch auth header to `Authorization: Bearer ${getBackendJwt()}` instead of `apikey` + anon Bearer. 2) Replace src/components/pages/LeadCreatePage.tsx:65 (and src/api/lead.api.ts createLead/updateLeadStatus/addLeadCEP) with POST /web/v1/leads + PATCH /web/v1/leads/{id} + POST /web/v1/leads/{id}/cep. 3) Refactor src/data/supabaseRaw.ts:fetchLeadsRaw/fetchDcfLeadsRaw to call GET /web/v1/leads?page=...&page_size=... with server-side pagination instead of a client-side fetch-all loop. 4) Delete leads_raw table reference (it's not in Flyway V001–V010); harmonize on sell_leads_master DTO. 5) Add VITE_BACKEND_URL to .env.example + vite proxy entry.

**Verification evidence:** {'real': True, 'evidence': 'All citations verified at HEAD (post-737a0d6 commit touches only backend config + a Python script; no FE wiring changed).\n\n1) Dual Supabase write paths to DIFFERENT tables — confirmed:\n   - src/api/lead.api.ts:39-41 `const { data, error } = await supabase.from(\'sell_leads_master\').insert({` (also :80 update appointment_status, :100 update target_price on the same table).\n   - src/components/pages/LeadCreatePage.tsx:65 `const { error } = await supabase.from(\'leads_raw\').insert({` with fields `lead_id, dealer_id, kam_id, channel, customer_name, ...` — totally different shape from sell_leads_master.\n\n2) crmApi.ts still pointed at Supabase Edge — confirmed:\n   - src/lib/api/crmApi.ts:181 `const BASE_URL = \\`https://${projectId}.supabase.co/functions/v1/make-server-4efaad2c/crm-api\\`;`\n   - :185-187 auth still `\'apikey\': publicAnonKey, \'Authorization\': \\`Bearer ${publicAnonKey}\\``.\n   - :249-258 `updateLeadCEP` PATCHes `/v1/leads/${leadId}/cep` against that Supabase URL.\n   - Consumers confirmed: src/components/pages/LeadDetailPageV2.tsx:37 imports updateLeadCEP; src/components/pages/LeaderboardPage.tsx:21 imports LeaderboardResponse; sr

---

