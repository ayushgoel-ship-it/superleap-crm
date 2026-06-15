# All audit findings (raw) — 69 total

Generated 2026-06-11. Sorted by severity then category.

| Sev | Category | Title | Owner | Effort | Files |
|---|---|---|---|---|---|
| P0 | ai-readiness | NBA engine: no ranked-dealer endpoint exists, FE has no rationale chip surface | us | 180h | backend/crm-api/src/main/java/com/cars24/crmapi/controller/w... |
| P0 | ai-readiness | DCF OCR: form collects filename strings only — no actual upload, no dcf_onboardi | us | 200h | src/components/pages/DCFOnboardingPage.tsx:33-65, src/compon... |
| P0 | architecture | Frontend bypasses backend; admin clients forge their own audit_log directly agai | us | 80h | src/components/admin/desktop/AdminSettingsPage.tsx:60-72, sr... |
| P0 | data | Generic-table read helper enables any-table SELECT via supabase-js | us | 60h | src/data/supabaseRaw.ts:38-54, src/lib/supabase/client.ts:1- |
| P0 | data | DataIntegrityViolationException is unhandled — FK violations and unique-constrai | us | 5h | backend/crm-api/src/main/java/com/cars24/crmapi/exception/Gl |
| P0 | fe-be-coupling | Controllers leak JPA entities as API responses (35+ endpoints, every command pat | us | 32h | backend/crm-api/src/main/java/com/cars24/crmapi/controller/w... |
| P0 | fe-be-coupling | Auth: Supabase Auth is the ONLY sign-in path — zero Spring backend integration | cars24-idp | 56h | src/lib/auth/authService.ts:14 (supabase.auth.signInWithPass... |
| P0 | fe-be-coupling | Leads: dual write paths to Supabase + dead Spring facade — no backend wiring | us | 72h | src/api/lead.api.ts:7 (import supabase), :40 insert sell_lea... |
| P0 | fe-be-coupling | Dealers: writes go to Supabase tables, Spring DealerController exists but unused | us | 48h | src/components/pages/DealerLocationUpdatePage.tsx:17 (import... |
| P0 | fe-be-coupling | Calls + Visits: 100% Supabase, Spring Call/VisitController never called | us | 64h | src/api/visit.api.ts:8 (import supabase), src/api/visit.api.... |
| P0 | fe-be-coupling | Notifications: in-memory derivation from runtimeDB — backend NotificationControl | us | 56h | src/components/pages/NotificationCenterPage.tsx:131 — notifi... |
| P0 | fe-be-coupling | Admin (users/teams/targets/incentives/hierarchy/audit): mixed Supabase tables +  | us | 96h | src/components/admin/desktop/AdminUsersPage.tsx:50/51 select... |
| P0 | infra | JaCoCo not wired — no coverage measurement on a backend that is 6 weeks from pro | us | 3h | backend/pom.xml, backend/crm-api/pom.xml... |
| P0 | infra | No Kubernetes / Helm manifests anywhere in repo — Cars24 cloud cutover has no de | us | 24h | (missing) k8s/, (missing) helm/... |
| P0 | security | Hand-rolled JSON in audit log oldValues/newValues across 6+ services (injection  | us | 6h | backend/crm-core/src/main/java/com/cars24/crmcore/service/im... |
| P0 | security | Cars24 internal gateway Basic-auth credential hard-coded in the JS bundle | cars24-be | 24h | src/lib/api/c24Api.ts:49 |
| P0 | security | .env.local with live Supabase project URL + anon JWT committed to repo | cars24-secops | 4h | .env.local:1-3, .gitignore |
| P0 | security | Spring backend has no Spring Security; only custom servlet filters on /web /app  | us | 24h | backend/crm-api/src/main/java/com/cars24/crmapi/config/Filte... |
| P0 | security | Dev-header auth bypass still env-toggleable; one misconfigured env var = arbitra | us | 4h | backend/crm-api/src/main/java/com/cars24/crmapi/filter/JwtTo... |
| P0 | security | Spring Boot 3.2.5 ships several known CVEs (path traversal, auth bypass, denial  | us | 8h | backend/pom.xml:26 |
| P0 | security | Ola Maps API key baked into JS bundle as VITE_OLA_MAPS_API_KEY | cars24-be | 16h | src/lib/api/c24Api.ts:45-47, src/lib/api/c24Api.ts:280-298... |
| P0 | security | CI does not gate Docker image: no Trivy scan, no SBOM, no signing, no secret sca | us | 8h | .github/workflows/ci.yml:85-104 |
| P0 | test | Cars24 proxy services have zero test coverage — go-live critical external integr | us | 12h | backend/crm-api/src/main/java/com/cars24/crmapi/controller/w... |
| P0 | test | crm-core module has NO test source root — 163 main classes, 0 tests, including a | us | 20h | backend/crm-core/src/main/java, backend/crm-core/pom.xml |
| P0 | test | UploadServiceImpl has no test — presigned-URL flow for file upload is unverified | us | 6h | backend/crm-core/src/main/java/com/cars24/crmcore/service/im... |
| P0 | test | FE has zero component, API client, or auth flow tests — only 6 import-guard smok | us | 24h | src/__tests__/smoke.test.ts, src/api/client.ts... |
| P1 | ai-readiness | Inventory summary + ai-readiness flag | us | 6h | src/ — 36 supabase.from() call sites across 13 files, src/ —... |
| P1 | ai-readiness | Call intelligence: schema ready, but audio capture + transcription pipeline miss | us | 80h | backend/crm-core/src/main/java/com/cars24/crmcore/entity/Cal... |
| P1 | ai-readiness | Dealer health score: FE already renders a HealthRing but score is client-compute | us | 60h | src/components/pages/DealerDetailPageV2.tsx:220-229, src/com... |
| P1 | ai-readiness | Anomaly digest: notification fanout is event-driven only — no batch/digest path, | us | 60h | backend/crm-notification/src/main/java/com/cars24/crmnotific... |
| P1 | ai-readiness | Cross-cutting: no AI vendor abstraction layer or model_version provenance — ever | us | 24h | backend/crm-core/src/main/java/com/cars24/crmcore/external/S... |
| P1 | architecture | BulkImport uses ApplicationContext.getBean(String) + reflection to invoke pipeli | us | 3h | backend/crm-core/src/main/java/com/cars24/crmcore/service/im... |
| P1 | data | NotificationFanoutListener uses @EventListener not @TransactionalEventListener — | us | 2h | backend/crm-notification/src/main/java/com/cars24/crmnotific... |
| P1 | data | BulkImportPipeline.process has no @Transactional and no row-level rollback bound | us | 5h | backend/crm-pipeline/src/main/java/com/cars24/crmpipeline/pi |
| P1 | data | No FK integration tests for lead/call/visit/appointment write paths — repository | us | 6h | backend/crm-api/src/test/java/com/cars24/crmapi/integration/... |
| P1 | data | Flyway migrations V001-V010 only sanity-checked, no per-migration data-shape tes | us | 4h | backend/crm-api/src/test/java/com/cars24/crmapi/integration/ |
| P1 | data | Flyway baseline-on-migrate: true on a prod schema with no baseline-version pinne | us | 3h | backend/crm-api/src/main/resources/application.yml:20-24 |
| P1 | fe-be-coupling | Inconsistent success/error envelope shape (different meta types, NON_NULL on one | us | 4h | backend/crm-api/src/main/java/com/cars24/crmapi/dto/common/A... |
| P1 | fe-be-coupling | Supabase Auth still the only sign-in path; backend's JwtTokenFilter validates ag | cars24-idp | 80h | src/lib/auth/authService.ts:14-60, src/lib/auth/authService.... |
| P1 | fe-be-coupling | Files/uploads: visit photos and DCF docs are FAKE stubs — no real storage path | us | 32h | src/api/visit.api.ts:179 uploadVisitPhoto — STUBBED, returns... |
| P1 | fe-be-coupling | No tests for token storage / refresh / sign-out clearing API client — Supabase-> | us | 6h | src/api/client.ts, src/lib/auth/authService.ts... |
| P1 | infra | @Async crmAsyncExecutor is shared, undersized, and lacks SecurityContext propaga | us | 3h | backend/crm-api/src/main/java/com/cars24/crmapi/config/Async... |
| P1 | infra | Vite dev proxy missing Spring backend entry — local FE↔BE dev will hit CORS | us | 4h | vite.config.ts:60-82 — server.proxy declares /c24-vehicle, /... |
| P1 | infra | Surefire and Failsafe not split — testcontainers-driven integration tests run as | us | 4h | backend/crm-api/pom.xml, backend/crm-api/src/test/java/com/c |
| P1 | infra | CI does not enforce `mvn verify` (only `mvn test`), so even the testcontainer in | us | 4h | .github/workflows, backend/crm-api/src/test/java/com/cars24/ |
| P1 | infra | Backend Dockerfile has no HEALTHCHECK, no actuator probe split, runs Alpine JRE  | us | 3h | backend/Dockerfile:26-40, backend/crm-api/src/main/resources |
| P1 | infra | Frontend Dockerfile HEALTHCHECK uses wget which is not in nginx:alpine 1.27 | us | 0.5h | Dockerfile:46-47 |
| P1 | observability | Request-id is NOT propagated from FE — backend always invents a new UUID per req | us | 4h | src/lib/api/crmApi.ts:183-209, backend/crm-api/src/main/java |
| P1 | security | Cars24ProxyController passes raw Map<String,Object> request bodies through with  | us | 8h | backend/crm-api/src/main/java/com/cars24/crmapi/controller/w |
| P1 | security | Cars24LeadServiceImpl: outbound HTTP with no circuit breaker/retry/timeout polic | us | 6h | backend/crm-core/src/main/java/com/cars24/crmcore/service/im... |
| P1 | security | Zero entity-level @JsonIgnore safety net plus @Setter on every JPA entity (mass- | us | 3h | backend/crm-core/src/main/java/com/cars24/crmcore/entity/Use... |
| P1 | security | Auth tokens stored in plain localStorage; XSS in any dependency exfiltrates them | us | 32h | src/lib/auth/authService.ts:56-59, src/lib/auth/authService.... |
| P1 | security | Capacitor allowNavigation pins legacy Supabase host; APK rebuild keeps trusting  | us | 8h | capacitor.config.json:5-12, android/app/src/main/res/xml/net |
| P1 | security | Android allowBackup=true exposes app data to adb backup / Auto Backup | us | 2h | android/app/src/main/AndroidManifest.xml:5 |
| P1 | security | JwtTokenFilter copies the entire JWT claim map into AuthMetadata.rawAuthMetadata | us | 6h | backend/crm-api/src/main/java/com/cars24/crmapi/filter/JwtTo... |
| P1 | security | CORS allows credentials with origins from a single comma-separated env var and n | us | 6h | backend/crm-api/src/main/java/com/cars24/crmapi/config/CorsC |
| P1 | security | Spring Boot context for auth filter is only smoke-tested with valid/invalid JWT  | us | 5h | backend/crm-api/src/test/java/com/cars24/crmapi/filter/AuthF |
| P1 | security | Controller delegation tests assert routing but not actor-scope authorization on  | us | 6h | backend/crm-api/src/test/java/com/cars24/crmapi/controller/w... |
| P1 | security | /actuator/info exposes env + build metadata and Swagger UI is NOT gated in prod | us | 4h | backend/crm-api/src/main/resources/application.yml:29-57, ba... |
| P2 | architecture | DealerController.requestLocationUpdate writes destructively despite the 'request | cars24-be | 4h | backend/crm-api/src/main/java/com/cars24/crmapi/controller/w |
| P2 | architecture | Cars24 external gateway (vehicle + partners-lead) is the ONE backend that IS wir | cars24-secops | 16h | src/lib/api/c24Api.ts:39-46 — VEHICLE_BASE / PARTNERS_LEAD_B... |
| P2 | data | TargetCommandServiceImpl.initializeMonth is N+1 inside a single transaction (200 | us | 2h | backend/crm-core/src/main/java/com/cars24/crmcore/service/im |
| P2 | data | Hibernate ddl-auto=validate with Flyway in same module — fine, but no read-only  | cars24-platform | 8h | backend/crm-api/src/main/resources/application.yml:6-19, bac |
| P2 | fe-be-coupling | AppointmentController.updateStatus accepts untyped Map<String,String> body and n | us | 2h | backend/crm-api/src/main/java/com/cars24/crmapi/controller/w |
| P2 | observability | Sentry init is dynamic-import-by-string — will silently never load in prod | us | 4h | src/main.tsx:14-34, src/lib/telemetry/errorReporter.ts:30-54 |
| P2 | observability | No Prometheus exporter, no /actuator/prometheus, no metrics scrape path | us | 4h | backend/crm-core/pom.xml:37-38, backend/crm-api/pom.xml... |
| P2 | security | nginx config missing CSP and HSTS; X-XSS-Protection absent | us | 2h | docker/nginx.conf:11-15 |
| P2 | security | docker-compose.yml binds Postgres on host 0.0.0.0:5432 with hardcoded crm/crm/cr | us | 1h | backend/docker-compose.yml:8-11 |
| P2 | test | CI lints with --no-max-warnings (492 warnings) and tests are smoke-only — no cov | us | 12h | .github/workflows/ci.yml:33-41 |
