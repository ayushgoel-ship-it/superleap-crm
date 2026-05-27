# Superleap CRM — Go-Live Readiness

**Owner:** ayush.goel@cars24.com
**Last updated:** 2026-05-27
**Target environment:** Cars24 internal cloud (not Supabase)
**Pilot cohort target:** 1 zone, 1 TL, 8–12 KAMs (per `dr-boss` recommendation)

## Current state — verified

| Surface | Status | Evidence |
|---|---|---|
| Local branch | `feature/lead-creation-flow` @ `b17f305` (27 commits ahead of `main`, includes Google SSO merge) | `git log` |
| PR | [#10](https://github.com/ayushgoel-ship-it/superleap-crm/pull/10) open against `main` | `gh pr view 10` |
| FE type-check | ✅ Clean | `npm run type-check` |
| FE lint | ✅ 0 errors (492 warnings tolerated by CI) | `npm run lint` |
| FE vitest | ✅ 6/6 pass (smoke-only file) | `npm test` |
| BE `mvn verify` | ✅ 232 tests pass, 12 skipped, real Testcontainers Postgres | `mvn -B clean verify` |
| Cars24 git remote | `cars24/master` is "Initial commit" — empty stub | `git log cars24/master` |
| Docker (local) | NOT installed | `docker: command not found` |

## What "live" means here

For this document, **live = a defined Cars24 internal-cloud environment serving a closed-cohort pilot (one zone), with the FE/BE deployed on company infra, no Supabase runtime dependency for protected operations, and KAM/TL daily flows working end-to-end against company-managed Postgres and Auth.**

If "live" means something narrower (e.g. "shipped to staging with Supabase still in the loop"), several blockers below can be deferred — see Annex A.

---

## Hard blockers — MUST be resolved before pilot

### B1. Frontend never wired to the new Spring backend
- **Today:** `src/lib/api/crmApi.ts:5` points at Supabase Edge Functions, not the Spring backend. **0** FE files call `/web/v1` or `/app/v1`. **12 files / 46 sites** still call Supabase directly.
- **Why blocking:** The whole point of cutting over off Supabase is moot if the FE never calls the new backend. You either drag Supabase along in prod (security gap) or 90% of the UI breaks (functional gap).
- **Owner:** Frontend lead
- **Effort:** 3–4 weeks. Start with: auth, then bootstrap, then leads, dealers, calls, visits, admin. One bounded PR per surface.
- **Done when:** `grep -r "supabase\." src/` shows zero remaining call sites in non-test code paths.

### B2. Auth still on Supabase
- **Today:** `src/lib/auth/authService.ts:17` still calls `supabase.auth.signInWithPassword`. The newly-merged Google SSO is still **Supabase Google OAuth**. The Spring `JwtTokenFilter` exists but receives no FE-issued tokens.
- **Why blocking:** Cutting over while keeping Supabase Auth means the JWT validation contract is owned by Supabase forever. No path to Cars24 IdP / company SSO.
- **Owner:** Backend + Frontend
- **Effort:** 1–2 weeks once IdP integration target is chosen
- **Done when:** FE acquires JWT from a Cars24-controlled identity source (Google Workspace via Cars24 IdP, or company OIDC), and Spring backend validates it via `JwtTokenFilter` end-to-end.

### B3. Dev-header auth bypass is env-overridable in prod
- **Today:** `CRM_JWT_DEV_HEADER_FALLBACK_ENABLED=true` in any env enables `JwtTokenFilter:113-119` to trust `X-User-Id`/`X-User-Role` headers from any caller. Complete auth bypass.
- **Why blocking:** One misconfigured env var = arbitrary impersonation in prod.
- **Owner:** Backend
- **Effort:** 2 hours
- **Fix:** Hardcode `crm.jwt.dev-header-fallback-enabled: false` (no `${...}` fallback) in `application-prod.yml`, OR guard `resolveDevHeaderContext` with `@Profile("!prod")`.

### B4. No fail-fast on missing JWT config
- **Today:** `application-prod.yml` doesn't define `crm.jwt.secret/issuer/audience`. If env vars are missing in the cloud manifest, the app boots and **every request 401s silently**.
- **Owner:** Backend
- **Effort:** 2 hours
- **Fix:** `@PostConstruct` validator on `JwtConfig` that fails boot on prod profile if required values are absent.

### B5. `.env.local` committed to repo root
- **Today:** `.env.local` (with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) sits at repo root and is tracked by git history.
- **Why blocking:** Any leaked anon/service key surfaces in `cars24/master` once we push, in CI logs, in cloned forks.
- **Owner:** Security lead
- **Effort:** 1 hour + key rotation
- **Fix:** `git rm --cached .env.local`, rotate Supabase anon key, force-overwrite history before pushing to `cars24/master`.

### B6. `VITE_OLA_MAPS_API_KEY` ships in the JS bundle
- **Today:** `src/lib/api/c24Api.ts:46` reads the key from `VITE_*` env, baked into the bundle at build time. Anyone with DevTools can extract it.
- **Why blocking:** Billable third-party key freely exposed = abuse vector. Cars24 SecOps will block.
- **Owner:** Backend
- **Effort:** 2 days. Add `/web/v1/maps/*` proxy endpoint that holds the key server-side; FE calls the backend instead.
- **Done when:** No `VITE_OLA_MAPS_*` env var, all Ola calls route through Spring backend.

### B7. Capacitor `allowNavigation` hardcodes old Supabase host
- **Today:** `capacitor.config.json:5-10` allows webview navigation to the Supabase project URL.
- **Why blocking:** Post-cutover, the Android app continues to be allowed to navigate to and trust the old Supabase host. Without this fix, an APK rebuild + ship still trusts Supabase certificates.
- **Owner:** Mobile
- **Effort:** 1 day (incl APK rebuild and TestFlight/Play internal track)
- **Fix:** Remove Supabase hosts; add `*.cars24.com` (or the chosen prod domain).

### B8. Spring Boot 3.2.5 has known CVEs
- **Today:** `backend/pom.xml` pins Spring Boot 3.2.5. Several CVEs fixed since (CVE-2024-38807, CVE-2024-38816 path traversal, CVE-2024-38821 WebFlux static-resource auth bypass).
- **Owner:** Backend
- **Effort:** 1 day (upgrade + run integration suite)
- **Fix:** Upgrade to 3.2.12+ or 3.3.x LTS. Re-run `mvn verify`.

### B9. Admin client writes forge their own audit_log
- **Today:** `AdminSettingsPage.tsx:60-70`, `mgmtRepo.ts:74-102` write directly to `incentive_slabs`, `incentive_rules`, `users`, `targets`, AND insert their own rows into `audit_log` from the client.
- **Why blocking:** Audit trail is meaningless if the audited party writes it. Compliance + SOX-style review will reject this.
- **Owner:** Backend + Frontend
- **Effort:** Folds into B1 — when admin writes move to `/web/v1/admin/*`, backend writes `audit_log` using JWT's `effective_user_id`.

### B10. Cars24 cloud onboarding not yet started
- **Today:** No infra namespace, no DNS, no secrets manager entry, no monitoring tenant, no Cars24 SSO IdP integration request, no on-call rotation defined.
- **Why blocking:** Even with code ready, you can't deploy without these.
- **Owner:** Eng manager + DevOps
- **Effort:** 2–4 weeks lead time depending on Cars24 platform team queue
- **Done when:** Namespace assigned, DNS (`crm.cars24.com`?) reserved, secrets manager populated, monitoring dashboard exists, on-call PagerDuty/equivalent rotation defined.

---

## Soft blockers — fix before scale, can ship pilot without

### S1. Frontend has effectively no automated tests
Only `src/__tests__/smoke.test.ts` (6 import/compile guards). No component tests, no API tests, no auth-flow tests, no route-guard tests. Add at minimum: login flow, lead create flow, dealer list rendering — once the FE is wired to the new backend (depends on B1).

### S2. Backend controllers return JPA entities directly
`LeadController.java:73`, `DealerController.java:85,110` serialize `LeadEntity`/`DealerEntity` raw. Risk: lazy-init failures, leaking internal columns, breaking API contracts on schema change. Add response DTOs.

### S3. V011 FK enforcement reverted
`lead.kamId` and `tl_id` are still `String`, not UUID FK. No DB-level ownership integrity. Re-enable as V012 once entity types + service-layer call sites are migrated together (see commit `584c6fd`'s revert note).

### S4. No JaCoCo coverage measurement
Backend is genuinely well-tested but coverage is unmeasured. Add JaCoCo plugin + thresholds (start at 60% line, raise to 75% over a quarter).

### S5. No image scanning / SBOM / signing in CI
Cars24 internal cloud will likely mandate these. Add Trivy + Syft + cosign jobs to `.github/workflows/ci.yml` before requesting a deploy slot.

### S6. CORS + actuator hygiene in prod
`CorsConfig.java` defaults to localhost; `application-prod.yml` doesn't override. `/actuator/info` exposes `env`. Lock down before exposing to the internet (even internal-cloud).

### S7. Swagger UI exposed in prod profile
Lock with the auth filter or disable in prod — exposing live API docs is an attack-surface map.

### S8. 492 lint warnings tolerated
Drive to 0. Not a blocker, but ratchet down (set `--max-warnings=N-10` weekly).

---

## Operational prerequisites — track separately from code

Code-readiness is half the picture. The other half:

### Cloud / infra (Cars24 platform team)
- [ ] Cars24 cloud namespace assigned for `superleap-crm`
- [ ] Production Postgres provisioned (with SSL, encrypted backups, point-in-time recovery)
- [ ] Container registry credentials (Cars24 internal — ECR or equivalent)
- [ ] Kubernetes namespace / deployment manifests written and reviewed
- [ ] Ingress + DNS record (`crm.cars24.com` proposed) reserved and TLS cert provisioned
- [ ] Secrets manager populated (`CRM_JWT_SECRET`, `CRM_DB_PASSWORD`, `OLA_MAPS_API_KEY`, Cars24 service tokens)
- [ ] Network policy: only Cars24 internal range can reach `crm-api`; FE behind WAF

### Identity & access
- [ ] Cars24 IdP integration for Google Workspace SSO (alternative to Supabase Google OAuth) — request submitted to IT
- [ ] JWT signing key rotated and stored in secrets manager
- [ ] Service accounts created for CI deploy, monitoring scrape, backup job
- [ ] On-call rotation defined; PagerDuty/equivalent integration wired to actuator alerts

### Data
- [ ] Decision: migrate Supabase data into Cars24 Postgres, or keep Supabase as source-of-truth read-side during transition?
- [ ] Migration scripts written for any Supabase-owned data the CRM still depends on
- [ ] Production seed data plan: bootstrap KAMs / TLs / Admin users from existing Superleap CRM source-of-truth
- [ ] Reconciliation tests written (per `dr-analyst`): KAM open leads ±1%, daily Inspecting Dealers exact, MTD GS SI ±0.5%, productive calls ±2%, working-day calendar parity

### Observability
- [ ] Cars24 standard logging tenant (ELK / Loki / equivalent) — log shipping configured
- [ ] Metrics tenant (Prometheus / Grafana / equivalent) — Micrometer scrape configured
- [ ] Sentry/equivalent DSN issued and wired to `VITE_SENTRY_DSN` + `errorReporter`
- [ ] Dashboard: API latency, auth failures, DB pool exhaustion, JVM heap, error rate by endpoint
- [ ] Alerts: 5xx rate > 1% for 5min, p95 latency > 1s, DB pool > 80%, auth failure rate spike

### Operational
- [ ] Runbook published (DEPLOY.md exists; needs Cars24-specific platform commands)
- [ ] Backup + restore tested end-to-end (Postgres PITR drill)
- [ ] Disaster recovery plan defined (RTO/RPO documented)
- [ ] First-pilot KAM/TL list confirmed with DR Category Head (dr-boss owns)
- [ ] Shadow-mode period defined (2 weeks per `dr-boss` recommendation): KAMs log in both old (Unolo) and new CRM
- [ ] Cutover communication plan to pilot cohort

### Compliance / security
- [ ] Cars24 SecOps review of the architecture
- [ ] Penetration test scheduled (post-implementation, pre-pilot)
- [ ] Data classification: PII columns documented (dealer phone, KAM email, etc.)
- [ ] RBAC matrix signed off: who can do what in CRM (KAM, TL, Admin, internal ops)

---

## Sequenced plan — 6 weeks to pilot

### Week 1 — security quick wins + infra kickoff (parallel)
- B3 (dev-header lockdown), B4 (JWT fail-fast), B5 (remove `.env.local` + rotate), B6 start (Ola Maps proxy), B7 (Capacitor allowlist), B8 (Spring Boot upgrade) — all backend/config, 1 engineer, 1 week.
- Open Cars24 platform-team ticket for B10 — they'll be the long pole.

### Weeks 2–4 — FE migration (B1 + B2)
- Week 2: wire FE auth path to backend JWT issuance (B2). Single PR.
- Week 3: migrate reads — bootstrap, dashboard, dealer list, lead list. Per-feature PRs.
- Week 4: migrate writes — lead create, call log, visit log, admin operations (folds in B9).
- After week 4, `grep supabase\\. src/` should be empty in runtime code.

### Week 5 — testing + ops prerequisites
- S1 — add real FE integration tests (now possible since backend is wired)
- S5 — image scan / SBOM / signing in CI
- S4 — JaCoCo
- Observability + alerts wired and tested (load-test → confirm alerts fire)
- Reconciliation tests (`dr-analyst`'s 5 tests) run against staging — green light

### Week 6 — pilot prep
- Cars24 SecOps signoff
- Penetration test
- Shadow-mode start with pilot cohort (KAMs log in both Unolo and CRM)
- Daily standups with TL for first 2 weeks of pilot

### Weeks 7–8 — pilot run, gate to expand
- Monitor reconciliation tests daily
- Bug burn-down
- Decision at end of week 8: expand to next zone, or extend pilot.

---

## Annex A — if "live" means "private staging with Supabase still attached"

Drop these blockers: B1, B2, B7, B9 (FE migration not needed).
Still required: B3, B4, B5, B6, B8, B10 (security + ops).
Timeline shrinks to ~2 weeks.

This is a viable interim step but is **not** the cutover target — Supabase still runs in production.

---

## Annex B — open decisions blocking the plan

1. **Identity provider**: Cars24 IdP (which one?), Google Workspace via Cars24, or stay on Supabase Google OAuth for v1?
2. **Cloud platform**: Cars24 internal k8s, AWS EKS, or other?
3. **Data ownership**: does Superleap CRM in Cars24 cloud get its own Postgres, or shared with another DR service?
4. **Cars24 git lib mirror**: push direction confirmed (origin → cars24) and cadence (per-merge to main, or weekly snapshot)?
5. **Pilot zone**: which TL + zone? `dr-boss` recommends "most disciplined TL, not the largest zone" — needs naming.

These five decisions are blocking the plan from being executable. Get them on paper, then start week 1.
