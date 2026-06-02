# Vendor RFP — Superleap CRM (Cars24 Dealer Referral)

**Status:** DRAFT for vendor review
**Owner:** Ayush Goel · ayush.goel@cars24.com
**Last updated:** 2026-05-27
**Engagement:** Build remainder, productionize, and ship to Cars24 internal cloud with AI features

---

## 0. TL;DR for the bidder

Cars24 has a substantially built Dealer Referral CRM — **Superleap CRM** — that is **mid-migration** from a Supabase-coupled architecture to Cars24 internal cloud. The frontend (React/Vite + Capacitor Android) and a multi-module Spring Boot backend are both implemented; what is missing is the wiring between them, the security/compliance hardening required for Cars24 prod, the operational onboarding to Cars24 cloud, and a layer of AI capabilities that turn the CRM from a logging tool into an active workflow accelerator.

We want a vendor to:

1. **Finish the migration** — wire the frontend to the new backend, kill the Supabase runtime dependency, close ~10 documented hard blockers.
2. **Productionize** — deploy onto Cars24 internal cloud (Kubernetes), with company SSO, observability, CI/CD, and security review signoff.
3. **Ship the AI layer** — a defined set of AI features (Tier 1 mandatory for v1; Tier 2/3 priced separately).
4. **Run a controlled rollout** — one zone, one TL, 8–12 KAMs first; then expand.

**Expected duration:** 12–16 weeks from kickoff to first-zone pilot live, AI Tier-1 included.
**Expected vendor team size:** ~6–8 people (1 EM, 1 BE, 2 FE, 1 ML/AI, 1 DevOps/SRE, 1 QA, 0.5 PM).
**Codebase asset already built:** ~24 K LOC frontend, ~40 K LOC backend, 232 passing backend integration tests, full Flyway schema, full CI gates. This is **not** a greenfield engagement — bid accordingly.

---

## 1. Business context

### 1.1 What Cars24 is
Cars24 is India's largest used-car platform (with international presence in UAE and Australia). Across the company we operate several lines of business; this RFP concerns the **Supply side** — how Cars24 sources cars from sellers, predominantly via the **Dealer Referral (DR)** channel.

### 1.2 What Dealer Referral (DR) is
DR procures cars by partnering with a national network of independent dealers. **Key Account Managers (KAMs)** field-visit and call dealers daily; each KAM is owned by a **Team Lead (TL)**, and zones aggregate up to Category Heads. Productivity is governed by five non-negotiable daily/monthly anchors:

| Anchor | Definition | Cadence |
|---|---|---|
| **3-ID** | A KAM must connect with at least **3 unique Inspecting Dealers per working day** | Daily |
| **10 GS SI** | 10 Good-Stock Stock-Ins per KAM | Monthly |
| **10 NGS SI** | 10 Non-Good-Stock Stock-Ins per KAM | Monthly |
| **12% I2SI** | 12% Inspection-to-Stock-In conversion | Monthly |
| **DCF: 10 onboard + 2 disburse** | DCF (Dealer Channel Finance) — 10 new onboardings + 2 disbursals per KAM | Monthly |

Every screen, alert, list, and metric in the CRM exists to make a KAM's day, a TL's review, or an Admin's reassignment of these five anchors faster and cleaner.

### 1.3 What Superleap CRM is
The single operational system through which DR runs. Roles:

- **KAM (mobile-first)**: daily dealer list, log calls, log visits, capture inspection bookings, initiate DCF onboarding, request location updates, see leaderboard / incentive simulator.
- **TL (desktop + mobile)**: KAM-wise performance dashboard, lead/call/visit drill-down, approval workflow for KAM location/dealer requests, incentive review.
- **Admin (desktop)**: KAM-dealer remapping, targets, hierarchy, incentive rules, audit log.

Today the field runs on Unolo + Snowflake + Slack. Superleap CRM replaces Unolo and becomes the operational cockpit; Snowflake remains source-of-truth for reporting.

---

## 2. Current state of the asset

### 2.1 Where the code lives
- Source of truth repo (development): `ayushgoel-ship-it/superleap-crm`
- Cars24 org repo (production target): `CSPL-CARS24/superleap-crm-service`
- Open bootstrap PR migrating the code into the Cars24 org: `CSPL-CARS24/superleap-crm-service#2`

### 2.2 Technology stack

| Layer | Stack |
|---|---|
| Frontend | Vite 6, React 18, TypeScript (strict), Radix UI primitives, Tailwind, Capacitor 8 (Android wrapper) |
| Backend | Spring Boot 3.2.5 (Java 17), multi-module Maven: `crm-api`, `crm-core`, `crm-pipeline`, `crm-notification` |
| Database | Postgres 16, schema managed by Flyway (V001–V010 applied; V011 deferred — see `docs/GOLIVE_READINESS.md` §S3) |
| Auth (today) | Supabase Auth, Google SSO gated to `@cars24.com` |
| Auth (target) | Cars24 IdP via JWT — backend filter chain (`JwtTokenFilter`, `AuthenticationFilter`) is already in place |
| Observability | MDC log enrichment, Micrometer, distributed trace-id propagation, lazy Sentry hook |
| CI | GitHub Actions — type-check, lint, vitest, Vite build, BE `mvn verify` with Testcontainers |
| Mobile | Capacitor → Android; iOS not yet built |
| Inter-system | Cars24 KAM panel APIs (vehicle, partners-lead) and Ola Maps proxied via backend (`Cars24ProxyController`) |

### 2.3 What's built and working
- 50+ KAM/TL/Admin pages (leads, dealers, visits, calls, DCF, leaderboard, incentive simulator, admin console, notifications)
- 18 JPA entities, 12+ repositories, full Flyway schema, audit trail, async pipelines, 3 scheduled jobs (stale lead cleanup, monthly target init, stuck job cleanup)
- 48 REST endpoints across 14 controllers (leads, dealers, DCF, calls, visits, notifications, uploads, dashboard, admin CRUD, hierarchy, targets, jobs, audit)
- 232 backend integration tests, real Testcontainers Postgres, Flyway-validated schema
- Lead creation against Cars24 partners-lead API + appointment booking (3-step OTP flow)
- DCF onboarding initiation flow + disbursal visibility on dealer card
- Searchable dealer selector scoped by actor role
- Google SSO with `hd=cars24.com` enforcement + post-redirect domain re-check
- Frontend Docker image (Vite → nginx:alpine), backend Dockerfile + docker-compose

### 2.4 What is NOT done (the vendor's scope)
Documented in [`docs/GOLIVE_READINESS.md`](./GOLIVE_READINESS.md). The hard blockers are summarized in §3.

---

## 3. Scope of the engagement

### 3.1 In scope — Phase A: Migration closure and hardening (Weeks 1–6)

#### A.1 — Finish the FE→BE migration
- Today: 0 frontend files call the new Spring backend; ~46 call sites still call Supabase directly (`src/data/supabaseRaw.ts`, `src/api/*.api.ts`, admin desktop pages).
- Deliverable: every frontend read/write path goes through the Spring backend's `/web/v1/*` and `/app/v1/*` endpoints. `grep -r "supabase\." src/` returns zero results in runtime code paths.
- Includes: bootstrap, dashboard, dealer list/detail, lead list/detail, call/visit list/detail/log/feedback, notifications, admin CRUD, file upload via backend-signed URLs.

#### A.2 — Migrate auth off Supabase onto Cars24 IdP
- Today: `authService.ts` uses `supabase.auth.signInWithPassword` and `supabase.auth.signInWithOAuth`. Backend `JwtTokenFilter` exists but receives no FE-issued tokens.
- Deliverable: frontend acquires a JWT from a Cars24-controlled identity source (the Cars24 IdP integration for Google Workspace SSO); backend validates the JWT in its filter chain and applies role/scope-based authorization in services.

#### A.3 — Close the security blockers
- Hardcode `dev-header-fallback-enabled: false` for the `prod` Spring profile (no env override); guard `JwtTokenFilter.resolveDevHeaderContext` with `@Profile("!prod")`.
- `@PostConstruct` validator on `JwtConfig`: refuse to boot the prod profile if `CRM_JWT_SECRET/ISSUER/AUDIENCE` are absent.
- Proxy `VITE_OLA_MAPS_API_KEY` server-side; remove all `VITE_OLA_*` env vars.
- Remove the Supabase host pin from `capacitor.config.json` `allowNavigation` and `network_security_config.xml`; add Cars24 cloud domains.
- Upgrade Spring Boot 3.2.5 → 3.2.12+ (or 3.3 LTS). Re-run `mvn verify`.
- Replace direct admin client writes (`AdminSettingsPage.tsx`, `mgmtRepo.ts`, `supabaseRaw.ts`) with backend endpoints that write `audit_log` server-side using the JWT's `effective_user_id`.
- Add response DTOs in `LeadController`, `DealerController` to stop leaking JPA entities.
- Re-enable V011 FK enforcement as V012, coordinated with entity type migration (`kam_id`, `tl_id` TEXT → UUID).

#### A.4 — Productionize CI/CD
- Backend Docker build + push job to a Cars24-managed registry.
- Trivy image scan, Syft SBOM, cosign signing as release-gate stages.
- gitleaks secret scan, `npm audit`, OWASP dep-check.
- Tagged release flow: `main` → staging → prod with manual approval.
- Frontend integration tests for auth, lead-create, dealer-list, call-log (vitest + msw).

### 3.2 In scope — Phase B: Cars24 cloud onboarding (Weeks 2–6, parallel)

#### B.1 — Infrastructure
- Cars24 cloud namespace (Kubernetes) provisioned for `superleap-crm`.
- Production Postgres provisioned with SSL, encrypted backups, point-in-time recovery.
- Container registry credentials wired into CI.
- Kubernetes deployment manifests (Helm chart preferred): API deployment, FE deployment behind nginx ingress, HorizontalPodAutoscaler, PodDisruptionBudget, NetworkPolicy.
- DNS reserved (`crm.cars24.com` or as Cars24 platform team allocates) + TLS certificate provisioned.
- Secrets manager populated for all `CRM_JWT_*`, `CRM_DB_*`, Cars24 service tokens, Ola Maps key.

#### B.2 — Identity & access
- Cars24 IdP integration for Google Workspace SSO; JWT signing key rotated and stored.
- Service accounts: CI deploy, monitoring scrape, backup runner.

#### B.3 — Observability
- Log shipping to Cars24 standard logging tenant.
- Metrics scrape via Micrometer to Cars24 Prometheus/Grafana tenant.
- Sentry DSN (or Cars24 equivalent) issued and wired to `errorReporter`.
- Dashboards: API latency, auth failure rate, DB pool utilization, JVM heap, error rate by endpoint.
- Alerts: 5xx > 1% for 5 min, p95 latency > 1 s, DB pool > 80%, auth failure rate spike.

### 3.3 In scope — Phase C: AI feature layer (Weeks 6–14, partially parallel to A/B)

The AI layer is a first-class deliverable, not a bolt-on. Three tiers:

#### Tier 1 — mandatory for v1 production launch
1. **Call intelligence**
   - Auto-transcription of KAM↔dealer calls (Hindi, English, code-mixed Hinglish + 5 major South Indian / Bengali / Marathi languages — Cars24 ops nationally).
   - Auto-classification of call as **productive** vs **unproductive** per the canonical definition (connected ≥ 30 s + dispositioned outcome).
   - Auto-extraction of dispositions: outcome category, next action, follow-up date, dealer objections.
   - Auto-detection of inspection commitments / appointment intents.
   - Pre-population of the call feedback form so the KAM only verifies, not transcribes.
   - Acceptance: ≥ 85% of calls produce a structured disposition the KAM accepts without major edit. Word-error rate ≤ 15% on Cars24's call corpus (a sample will be provided).

2. **Next-Best-Action (NBA) engine for the KAM daily list**
   - Each morning, recompute and rank each KAM's tagged dealer list by an action-score that optimizes 3-ID + I2SI: surfaces the right 3 dealers to visit today based on recency, last-call recency, lead-funnel state, days since last inspection, and historical conversion.
   - Includes "why this dealer" rationale tag (e.g., "no inspection in 14 days, 2 hot leads in queue").
   - Surfaces in the existing KAM Home view (no new UI surface).
   - Acceptance: in offline replay on 90 days of historical activity, NBA-ranked top-3 captures the actual converted Stock-In dealer at least 60% of days. A/B against the current ordering during the pilot.

3. **Dealer health score**
   - Composite per-dealer score (0–100) updated daily, computed from: call recency/frequency, response rate, lead conversion, GS/NGS ratio, DCF status, location stability.
   - Surfaces as a chip on the dealer card and a filter on the dealer list.
   - Underlying drivers explainable (top 3 contributing factors shown).

4. **Anomaly detection for TLs**
   - Daily TL digest (push or email) flags: KAMs missing 3-ID 2 days in a row, KAMs with no productive call ≥ 24 h, dealers going dark > 21 days, KAMs whose I2SI dropped > 20% week-on-week.
   - Lives in the TL home view as an "Action needed" section.

5. **Document OCR for DCF onboarding**
   - PAN, GSTIN, RC book, KYC docs uploaded by KAM during DCF onboarding flow → auto-extract structured fields, validate against existing Cars24 dealer master.
   - Reduces 5-step DCF onboarding form to 1 step of verification.
   - Acceptance: ≥ 90% field-level extraction accuracy on Cars24's document mix.

#### Tier 2 — strongly preferred for v1.1 (3 months post-pilot)
6. **Conversational assistant for KAM** — voice-first daily standup: KAM speaks a 2-minute update; AI structures it into call summaries, follow-ups, and disposition logs.
7. **Dealer voice/WhatsApp bot** — automated appointment confirmations, reminder calls 1 day before inspection, follow-up after dealer goes dark for 14 days. Handover to KAM on any non-trivial response.
8. **TL conversational analytics** — natural-language Q&A over Snowflake DR data ("show me KAMs in West who missed 3-ID this week and what their I2SI looks like"). Backend: vector index over Snowflake schema + Cars24's existing DR metric definitions.
9. **Forecasting** — predicted Stock-Ins per KAM next 7 days; predicted DCF onboard count next 30 days. Surfaced to TL/Admin only.

#### Tier 3 — future-state, not part of this engagement but the architecture should not preclude
10. Image intelligence on inspection photos (quality, damage detection).
11. Coaching insights for TLs (auto-summary of which KAMs need intervention and the suggested coaching topic).
12. Multilingual real-time call interpreter (KAM speaks Tamil, dealer hears Hindi, etc.).

#### AI implementation constraints
- **Hosting:** all AI inference must run on Cars24-approved infrastructure. Speech and document data cannot leave Cars24's cloud boundary. Acceptable: Cars24-hosted models, Cars24 AWS account, or vendor-managed enclave under Cars24 contract — no consumer LLM APIs sending dealer PII offshore.
- **Cost ceiling:** the AI layer's total monthly inference cost should fit within an agreed envelope (vendor to propose); cost dashboards mandatory.
- **Latency:** NBA + dealer health updates can be batched (daily). Call transcription should complete within 2 minutes of call end; OCR within 30 seconds of upload.
- **Privacy:** all AI artifacts (transcripts, extracted fields, scores) live in Cars24 Postgres, not the AI vendor's systems.

### 3.4 In scope — Phase D: Pilot rollout (Weeks 14–16)
- Vendor leads the pilot rollout: pick one zone with one disciplined TL (the **Category Head decides**), 8–12 KAMs.
- 2 weeks shadow mode (KAMs log in both Unolo and CRM), 2 weeks new-only.
- Daily standup with the pilot TL for the first 2 weeks of new-only.
- Vendor owns the bug burn-down during pilot.
- 5 reconciliation tests must pass and continue passing throughout pilot:

| Test | Tolerance |
|---|---|
| Per-KAM open lead count: CRM vs Snowflake `lead_funnel_master` | ± 1% |
| Per-KAM daily unique Inspecting Dealers: CRM vs Snowflake `inspection_fact` | exact match |
| Yesterday's inspections completed: CRM total vs Snowflake | exact match |
| MTD GS Stock Ins per zone: CRM vs Snowflake disbursal master | ± 0.5% |
| Productive-call count per KAM (yesterday): CRM vs telephony source-of-truth | ± 2% |

### 3.5 Out of scope
- iOS Capacitor build (Android only for v1).
- Net-new product surfaces beyond the existing 50+ pages and the AI layer above.
- Migration of historical Supabase data older than 90 days (Cars24 retains in Snowflake for reporting).
- Integration with non-DR Cars24 systems (e.g., Buy side, Retail).
- White-label / multi-tenant capabilities.

---

## 4. Non-functional requirements

| Area | Requirement |
|---|---|
| **Availability** | 99.5% during 7am–9pm IST (KAM working hours). Maintenance windows acceptable outside this band with 24h notice. |
| **API latency** | p95 < 500 ms for read endpoints, < 1 s for write endpoints, < 2 s for AI-augmented endpoints. |
| **Mobile cold start** | KAM home screen interactive within 4 s on a 4G connection on a 2-year-old Android device. |
| **Offline** | KAM call logging and visit start/end must succeed offline; sync when connectivity returns. (Today's app does not have this; vendor builds it.) |
| **Data residency** | All data resides within India (Mumbai region preferred). |
| **Security review** | Cars24 SecOps signoff is a hard gate before any production deploy. Penetration test required before pilot. |
| **Audit** | Every state-changing operation produces a server-written `audit_log` row with actor, target, before, after, request-id. |
| **Backup / DR** | Postgres point-in-time recovery to any minute in the last 14 days; daily encrypted backup snapshots retained 90 days. RTO 4 h, RPO 15 min. |
| **Accessibility** | KAM mobile flows: tap-target ≥ 44 px, contrast WCAG AA. Desktop TL/Admin: WCAG AA. |
| **Localization** | English primary; AI features must handle Hindi + Hinglish + 5 major Indian languages for speech and OCR. |
| **Telemetry** | Distributed trace ID propagated client→backend→DB; latency percentiles per endpoint visible in real time. |

---

## 5. Deliverables and milestones

| Milestone | Week | Deliverable | Gate |
|---|---|---|---|
| M1 — Kickoff signed | 0 | SOW signed; vendor team onboarded; Cars24 platform team ticket filed | — |
| M2 — Security quick wins shipped | 2 | A.3 backend security items; Spring Boot upgraded; image scanning in CI | CI green, SecOps notified |
| M3 — Auth migrated | 4 | A.2 done; FE issues real Cars24-IdP JWT, backend validates end-to-end | Auth flow integration test green; SecOps signoff on auth |
| M4 — FE read paths migrated | 6 | A.1 reads done — bootstrap, dashboard, dealer list/detail, lead list/detail | Reconciliation tests 1–4 within tolerance against staging |
| M5 — FE write paths migrated | 8 | A.1 writes done — call log, visit log, lead create, admin operations | All FE Supabase call sites removed from runtime; A.4 image scan + SBOM in pipeline |
| M6 — AI Tier 1 features shipped | 12 | Call intelligence, NBA engine, dealer health score, anomaly detection, DCF OCR | Each feature meets its acceptance criterion in §3.3 |
| M7 — Production-ready in staging | 13 | All hard blockers closed; pen-test signed off; observability + alerts firing in load test | SecOps signoff; Cars24 platform team ack on infra |
| M8 — Pilot zone live | 14 | Shadow mode begins | TL + 8–12 KAMs onboarded |
| M9 — Pilot new-only | 16 | Cutover to CRM-only in pilot zone | Reconciliation tests passing for 7 consecutive days |
| M10 — Engagement closeout | 16+ | Handover docs, runbooks, knowledge transfer to Cars24 ops | Cars24 signs off on expansion plan |

---

## 6. Acceptance criteria — what "done" means

- All hard blockers in `docs/GOLIVE_READINESS.md` resolved and closed.
- `grep -r "supabase\." src/` returns zero hits in runtime code paths.
- CI pipeline gates a merge on: type-check, lint, vitest, FE integration tests, `mvn verify`, image scan (no high/critical CVEs), SBOM generated, secret scan clean.
- All 5 reconciliation tests passing for the pilot zone for 7 consecutive days post-cutover.
- Each Tier 1 AI feature meets its acceptance criterion stated in §3.3.
- Penetration test conducted by a vendor-independent third party agreed with Cars24 SecOps; all High/Critical findings remediated.
- Documented runbooks for: deploy, rollback, on-call response, Postgres restore, key rotation.
- Knowledge transfer: 2 weeks of paired ops with Cars24 ops engineers, all on-call runbooks walked through.

---

## 7. What the bidder must propose

In your response, please address:

1. **Team composition** — named roles, seniority, % allocation, who's onsite vs remote, who's full-time vs part-time.
2. **Detailed Gantt** — your week-by-week interpretation of §5, with risk callouts and float.
3. **AI stack choices** — speech model (provider + on-prem-able? + language coverage), OCR model, NBA modeling approach (gradient-boosted + features, or neural — and why), forecasting approach. **Justify each** against the constraints in §3.3.
4. **Hosting plan** — exactly where AI inference runs; how dealer PII is kept inside Cars24's boundary; expected monthly inference cost at pilot scale (8–12 KAMs) and at full-DR scale (~300 KAMs).
5. **Security posture** — your data-handling, your incident response, your access model for engineers touching Cars24 data, SOC2 / ISO 27001 status.
6. **Commercial proposal** — fixed-price for Phase A + B, time-and-materials or fixed-price (vendor's choice with justification) for Phase C Tier 1, separate optional line items for Tier 2 features.
7. **References** — at least 2 prior engagements at comparable scope (CRM modernization + AI features, India auto/retail/fintech preferred).
8. **Risks you see** — anything we've under-specified, anything you'd push back on, anything that would change your timeline materially.

---

## 8. Constraints, working agreements, and access

- **Working hours:** vendor team must overlap Cars24 Bengaluru HQ hours (10am–6pm IST) by at least 4 hours daily.
- **Tools:** vendor team must use Cars24 Linear/Jira for issue tracking, Cars24 GitHub for code, Cars24 Slack for communication.
- **Source repo:** code lives in `CSPL-CARS24/superleap-crm-service`. Vendor team receives `write` access; merges to `master` require a Cars24 reviewer per the enterprise ruleset (see §9).
- **Code review:** every PR to `master` requires at least one Cars24 reviewer approval; vendor team can also review each other.
- **Branching:** trunk-based development; feature branches named `<vendor-handle>/<linear-ticket>-<slug>`.
- **No prod access for vendor engineers** without explicit named-user approval from Cars24 SecOps. Read-only staging access is acceptable.
- **Quarterly security review:** vendor engineers handling Cars24 data complete Cars24's annual data-handling training.

---

## 9. Existing Cars24 governance the vendor will work within

- All five enterprise/organization GitHub rulesets active on `CSPL-CARS24/superleap-crm-service`. None has bypass for repo admins.
- "Require Jira Check" ruleset — every PR title must reference a valid issue key.
- "Master Branch — At least One PR Review Policy" — author cannot self-approve; one external review required; last-push approval required; review threads must be resolved.
- `cars24-linear-ticket-enforcer` GitHub app posts a check that requires a valid Jira-style key in the PR title.
- Macroscope correctness check runs on every PR.

The vendor must engineer for these as a default.

---

## 10. Open questions Cars24 will answer at kickoff

These are unresolved as of this RFP and will be resolved with the chosen vendor in week 1:

1. **Identity provider** — exact Cars24 IdP product, JWT issuer string, audience claim, refresh-token model.
2. **Cloud platform** — Cars24 internal Kubernetes vs AWS EKS for this workload; container registry endpoint; secrets manager backend.
3. **Data ownership** — does Superleap CRM get its own Postgres or share with another DR service.
4. **Pilot zone + TL** — Cars24 Category Head will name the pilot TL and the 8–12 KAMs.
5. **AI vendor preferences** — Cars24 may have preferred providers for speech / OCR; vendor's proposed stack will be ratified or substituted in week 1.
6. **Cars24 KAM panel API stability** — vendor will receive the current Cars24 partners-lead / vehicle / Ola Maps API contracts and SLAs.

---

## 11. Appendix

### 11.1 Architecture overview

```
                ┌──────────────────────────┐
                │  Cars24 IdP (Google      │
                │  Workspace SSO)          │
                └────────────┬─────────────┘
                             │ JWT
                             ▼
  ┌──────────────────────────────────────────┐
  │  Frontend: React+Vite+Capacitor          │
  │  - 50+ pages (KAM/TL/Admin)              │
  │  - Calls only `/web/v1/*` and `/app/v1/*`│
  └────────────┬─────────────────────────────┘
               │ HTTPS, JWT in Authorization
               ▼
  ┌──────────────────────────────────────────┐
  │  Backend: Spring Boot multi-module        │
  │  ┌──────────────┐ ┌──────────────┐        │
  │  │ crm-api      │ │ crm-pipeline │ async  │
  │  │ controllers  │ │ events/jobs  │        │
  │  └──────┬───────┘ └──────┬───────┘        │
  │         │                │                 │
  │  ┌──────▼────────────────▼──────┐         │
  │  │  crm-core: services, repos,  │         │
  │  │  audit, RBAC enforcement     │         │
  │  └──────────────┬───────────────┘         │
  │                 │                          │
  │         ┌───────▼────────┐                 │
  │         │ crm-notification│                │
  │         └────────────────┘                 │
  └──────────────┬───────────────────────────┘
                 │
        ┌────────┴─────────────┬──────────────┐
        ▼                      ▼              ▼
   ┌──────────┐         ┌────────────┐  ┌──────────────┐
   │ Postgres │         │ Cars24 KAM │  │ AI services  │
   │ (Flyway) │         │ panel APIs │  │ (Cars24 cloud│
   │          │         │ via proxy  │  │  boundary)   │
   └──────────┘         └────────────┘  └──────────────┘
```

### 11.2 Reference documents in the repo
- [`docs/GOLIVE_READINESS.md`](./GOLIVE_READINESS.md) — full blocker list + 6-week sequenced plan (Cars24-led baseline; this RFP scope expands it for vendor delivery)
- [`DEPLOY.md`](../DEPLOY.md) — operator runbook for build → push → deploy → rollback
- [`docs/GOOGLE_SSO_SETUP.md`](./GOOGLE_SSO_SETUP.md) — current Google SSO config
- [`TASKS.md`](../TASKS.md) — architecture revamp task tree (D1 through C3)
- [`TS_STRICT_DEBT.md`](../TS_STRICT_DEBT.md) — frontend TypeScript strictness burn-down history

### 11.3 Codebase quick stats
- Frontend: ~50 page components, ~150 reusable components, TypeScript strict, 0 type errors, 492 lint warnings tolerated.
- Backend: 4 Maven modules, 18 JPA entities, 12+ repositories, 48 REST endpoints, 232 passing integration tests, ~75% line coverage estimate (JaCoCo not yet wired — vendor to add).
- Flyway migrations: V001–V010 active, V011 deferred (re-introduce as V012 per vendor scope A.3).
- Capacitor Android app builds; iOS not yet built.

### 11.4 Primary contacts

| Role | Name | Email |
|---|---|---|
| Engineering owner | Ayush Goel | ayush.goel@cars24.com |
| DR Category Head | TBD (will be confirmed at kickoff) | — |
| SecOps liaison | TBD | — |
| Platform team contact | TBD | — |

---

**Vendor proposals must be submitted to Cars24 Procurement, addressed to the engineering owner above, by [DATE TBD].**
