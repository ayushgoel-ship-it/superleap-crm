# Cars24 Team Asks — Superleap CRM Go-Live

Generated 2026-06-11 from the 25-agent comprehensive audit (`/tmp/.../wluzwhcwn.output`).
One section per Cars24 internal team. Forward each section to the named owner.

---

I have enough context. Writing the doc now.

# CARS24_TEAM_ASKS — Superleap CRM Pilot

**Owner:** ayush.goel@cars24.com  |  **Target:** 1-zone closed-cohort pilot on Cars24 internal cloud  |  **Plan:** 12–16 weeks
**Scope reference:** `/Users/a30711/superleap-crm/docs/GOLIVE_READINESS.md`, `/Users/a30711/superleap-crm/docs/VENDOR_RFP_SUPERLEAP_CRM.md`

---

## 1. Backend (Superleap CRM Spring service)

- **WHAT:** Land B3 (dev-header lockdown), B4 (JWT fail-fast on prod profile), B6 (Ola Maps server-side proxy `/web/v1/maps/*`), B8 (Spring Boot 3.2.12+ upgrade), B9 (server-owned `audit_log` writes), S2 (response DTOs for `LeadController` / `DealerController`), S3 (V012 FK migration for `lead.kamId`, `tl_id` → UUID), JaCoCo plugin at 60% threshold. JWT issuance endpoint accepting an IdP id_token and minting a Cars24-signed CRM JWT.
- **WHEN:** Week 1 (B3, B4, B8) → Weeks 2–4 (B6, B9, JWT issuance) → Week 5 (S2, S3, JaCoCo)
- **WHO:** Senior Backend Engineer — Superleap CRM pod (DR org), reporting to DR Engineering Manager
- **DEPENDENCIES:** IdP team (§5) must publish the OIDC discovery URL + audience claim **before** the JWT issuance endpoint can be implemented in Week 3. Platform team (§3) must hand over secrets-manager paths **before** Week 1 close.
- **ARTIFACT:** A single `application-prod.yml` + `JwtIssuanceController.java` PR merged by end of Week 4, with `mvn verify` green and `grep -r "fallback-enabled: true" backend/` returning zero hits.

---

## 2. Frontend (Superleap CRM Vite/React app)

- **WHAT:** Execute B1 (wire all 12 files / 46 sites off Supabase onto `/web/v1` and `/app/v1`), B2 FE-side (token exchange against backend JWT issuance, drop `supabase.auth.signInWithPassword`), B7 (Capacitor `allowNavigation` → `*.cars24.com`), S1 (add login + lead-create + dealer-list integration tests), S8 (lint warnings ratchet to 0). Replace `VITE_OLA_MAPS_API_KEY` consumer with the new `/web/v1/maps/*` proxy.
- **WHEN:** Week 2 (auth path) → Week 3 (reads: bootstrap, dashboard, dealer list, lead list) → Week 4 (writes: lead create, call log, visit log, admin) → Week 5 (integration tests, lint cleanup) → Week 6 (Capacitor APK rebuild + Play internal track)
- **WHO:** Senior Frontend Engineer — Superleap CRM pod; Mobile/Capacitor work co-owned with the DR Mobile Lead
- **DEPENDENCIES:** Backend (§1) JWT issuance endpoint live **before** Week 2 FE auth migration. Backend `/web/v1/maps/*` proxy live **before** Week 3 dashboard migration. IdP (§5) Workspace tenant + OAuth client_id available **before** Week 2.
- **ARTIFACT:** PR set tagged `fe-migration/B1` merged by end of Week 4, with `grep -r "supabase\." src/ --include='*.ts' --include='*.tsx' | grep -v __tests__` returning zero runtime hits.

---

## 3. Platform / Infra (Cars24 cloud platform team)

- **WHAT:** Resolve B10 end-to-end — assign Cars24 cloud namespace `superleap-crm`, provision production Postgres (SSL, encrypted backups, PITR enabled), issue container-registry credentials, write k8s manifests (Deployment + Service + Ingress + HPA), reserve DNS (`crm.cars24.com` proposed) and TLS cert, populate secrets manager (`CRM_JWT_SECRET`, `CRM_DB_PASSWORD`, `OLA_MAPS_API_KEY`, IdP client_secret), define network policy (Cars24 internal CIDR only to `crm-api`; FE behind WAF). Stand up staging tenant first, then prod. Wire log shipping (ELK/Loki), metrics (Prometheus/Grafana), and the Sentry DSN. Add Trivy + Syft + cosign jobs to `.github/workflows/ci.yml` (S5).
- **WHEN:** Week 1 (namespace + ticket intake, this is the long pole — start day 1) → Weeks 2–3 (Postgres, secrets, registry, manifests for staging) → Week 4 (DNS, TLS, ingress, WAF) → Week 5 (observability wiring, image scanning in CI) → Week 6 (prod tenant cut)
- **WHO:** Cars24 Platform Engineering Manager + assigned Platform/DevOps Engineer; Database Reliability Engineer for Postgres provisioning
- **DEPENDENCIES:** Engineering Manager must open the platform ticket in **Week 0** (before Week 1) — Cars24 platform queue is 2–4 weeks. SecOps (§4) approval of network policy **before** ingress goes live in Week 4. Decision from leadership on the Annex B questions (cloud platform, data ownership) **before** Week 1.
- **ARTIFACT:** Staging URL reachable (`crm-staging.cars24.com`) by end of Week 3; prod URL reserved and TLS-validated by end of Week 4; a single `infra/k8s/` directory checked into the repo with reviewed manifests.

---

## 4. SecOps (Cars24 Security Operations)

- **WHAT:** Architecture review covering B5 (rotate leaked Supabase anon key, scrub `.env.local` from git history before any push to `cars24/master`), JWT signing model, B6 (Ola Maps proxy), data classification of PII columns (`dealer.phone`, `user.email`, `lead.contactPhone`), RBAC matrix sign-off (KAM/TL/Admin/internal-ops). Run penetration test against staging. Approve egress allowlist (Ola Maps, Cars24 internal services). Approve S6 (CORS + actuator lockdown) and S7 (Swagger UI off in prod). Issue SecOps go/no-go for pilot launch.
- **WHEN:** Week 1 (kickoff architecture review, key-rotation directive) → Week 4 (data classification + RBAC matrix sign-off) → Week 5 (pen test against staging) → Week 6 (go/no-go gate)
- **WHO:** Cars24 Head of Application Security + assigned Security Architect; Compliance Officer for RBAC sign-off
- **DEPENDENCIES:** Backend (§1) must complete B3, B4, B8 **before** the architecture review in Week 1. Platform (§3) staging environment live **before** the pen test can be scheduled. IdP (§5) integration design finalized **before** the JWT signing-model review.
- **ARTIFACT:** A signed SecOps approval memo with three line-items: (1) "architecture approved," (2) "pen test passed with N=0 critical / N≤2 medium," (3) "RBAC matrix signed." No memo = no pilot.

---

## 5. IdP / IT (Cars24 Identity & Workspace)

- **WHAT:** Resolve Annex B decision #1 — declare the production identity source (Cars24 IdP / Google Workspace via Cars24 / company OIDC). Provision the Superleap CRM OAuth/OIDC client (client_id + client_secret), publish OIDC discovery URL + JWKS endpoint + expected `aud`/`iss` claims. Configure SAML/OIDC redirect URIs for `crm-staging.cars24.com` and `crm.cars24.com`. Bootstrap the pilot cohort (1 TL + 8–12 KAMs) into the Workspace group `superleap-crm-pilot`. Define service accounts for CI deploy, monitoring scrape, backup job.
- **WHEN:** Week 0–1 (decision on identity source; this blocks Backend §1 and Frontend §2) → Week 2 (client_id/secret + discovery URL delivered) → Week 4 (staging redirect URIs registered) → Week 6 (prod redirect URIs + pilot cohort group populated)
- **WHO:** Cars24 IT Director / Head of Workplace Engineering; Identity & Access Management lead for OIDC client provisioning; DR Operations Lead for cohort list
- **DEPENDENCIES:** Leadership decision on Annex B #1 **before** Week 1. DR business team (§6) must hand over the named pilot cohort **before** Week 6 group provisioning.
- **ARTIFACT:** A one-page Identity Integration Spec containing: chosen IdP, OIDC discovery URL, JWKS URL, client_id, expected `aud`/`iss`, token TTL, group claim format. Delivered by end of Week 1.

---

## 6. DR Business (Dealer Referral category / Superleap business owner)

- **WHAT:** Resolve Annex B decision #5 — name the pilot zone, pilot TL, and 8–12 pilot KAMs (`dr-boss` guidance: "most disciplined TL, not the largest zone"). Sign off the reconciliation acceptance bands (KAM open leads ±1%, daily Inspecting Dealers exact, MTD GS SI ±0.5%, productive calls ±2%, working-day calendar parity). Approve the 2-week shadow-mode period (KAMs log in both Unolo and Superleap CRM). Own the cutover communication plan to the cohort. Stand up the daily standup cadence with the pilot TL for the first 2 weeks of pilot run. Define expand-or-extend criteria for the end-of-Week-8 gate.
- **WHEN:** Week 1 (pilot zone + TL + KAM list confirmed) → Week 2 (reconciliation bands signed) → Week 5 (shadow-mode plan published) → Week 6 (cohort communication sent) → Weeks 7–8 (pilot run + daily standups) → Week 8 (expand/extend decision)
- **WHO:** DR Category Head (Superleap business owner) + assigned Zone TL; DR Analytics Lead for reconciliation bands
- **DEPENDENCIES:** Platform (§3) staging URL live **before** Week 5 shadow-mode plan. SecOps (§4) go/no-go memo **before** Week 6 cohort communication. Backend (§1) reconciliation queries shipped **before** Week 5 reconciliation dry-run.
- **ARTIFACT:** A signed Pilot Charter naming: zone, TL, KAM roster, shadow-mode dates, reconciliation bands, expand/extend criteria. One page. Delivered by end of Week 2.

---

## 7. AI / ML (Cars24 Data Science / DR ML)

- **WHAT:** Out of scope for the pilot cutover (Weeks 1–8). For Weeks 9–16 expansion phase: scope a lead-scoring model on top of the new CRM lead/call/visit tables (read-only consumer of `/web/v1` events). Define the feature contract (which CRM fields ML consumes), the inference SLA, and the integration pattern (offline batch scoring vs. real-time `/web/v1/score`). Run shadow inference against pilot data only — no UI surfaces in v1.
- **WHEN:** Week 7 (kickoff scoping; feature contract draft) → Week 10 (offline scoring against pilot data) → Week 14 (decision: ship in expansion wave or defer)
- **WHO:** DR Data Science Lead; ML Platform Engineer for inference infra
- **DEPENDENCIES:** Backend (§1) `/web/v1` event stream stable for ≥2 weeks **before** scoping begins. SecOps (§4) approval on PII handling for the feature store **before** any model training. DR Business (§6) confirmation that ML output has a defined operational lever (which KAM workflow consumes a score) **before** any inference ships.
- **ARTIFACT:** A Feature Contract document listing: input fields from CRM, output schema, refresh cadence, inference SLA, downstream consumer. Delivered by end of Week 10. **Explicitly: no AI feature is on the pilot critical path.**

---

## Cross-team gate summary

| Week | Gate | Owner of "go" call |
|---|---|---|
| 1 | IdP source named; platform ticket open; pilot cohort named | Eng Manager + DR Category Head |
| 4 | FE migrated off Supabase; staging URL live; RBAC signed | Eng Manager + SecOps |
| 6 | SecOps memo signed; shadow-mode comms sent | SecOps + DR Category Head |
| 8 | Expand-or-extend decision | DR Category Head |
| 16 | ML expansion go/no-go | DR Data Science Lead |

**Single biggest risk:** Annex B decisions #1 (IdP) and #2 (cloud platform) are unmade. Without them, Weeks 1–2 cannot start. Get those two on paper this week.