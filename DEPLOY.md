# Superleap CRM — Deploy Runbook

This is the short, operator-facing guide for getting a build out to an
environment and rolling it back if something goes wrong. It covers
both halves of the stack:

- **Frontend** — Vite/React SPA, shipped as an `nginx:alpine` image
  (`./Dockerfile`, root of the repo).
- **Backend** — Spring Boot multi-module (`backend/crm-api` entrypoint,
  `backend/Dockerfile` for the runtime image), plus Flyway migrations
  under `backend/crm-core/src/main/resources/db/migration/`.

CI lives in `.github/workflows/ci.yml`. It gates merges by
type-checking the FE, running FE smoke tests, building the FE image,
and running the BE Maven `verify` target (unit + integration tests).

---

## 0. Prerequisites (one-time)

- Docker + Buildx
- `gh` CLI authenticated against `ayushgoel-ship-it/superleap-crm`
- Container registry credentials (`docker login <registry>`)
- `kubectl` / Fly / ECS CLI depending on the target — examples below
  use generic `docker push` + SSH; adapt to the actual platform.

Environment variables the FE image reads at **build time**
(see `Dockerfile` ARGs):

| Var                            | Purpose                              |
| ------------------------------ | ------------------------------------ |
| `VITE_SUPABASE_URL`            | Supabase project URL                 |
| `VITE_SUPABASE_ANON_KEY`       | Supabase anon key                    |
| `VITE_C24_VEHICLE_URL`         | Cars24 vehicle API                   |
| `VITE_C24_PARTNERS_LEAD_URL`   | Cars24 partners lead API             |
| `VITE_OLA_MAPS_API_KEY`        | Ola Maps key                         |
| `VITE_USE_MOCK_DATA`           | `false` for real envs                |

Backend runtime env (see `backend/docker-compose.yml`):

| Var                          | Purpose                         |
| ---------------------------- | ------------------------------- |
| `SPRING_PROFILES_ACTIVE`     | `dev` / `staging` / `prod`      |
| `CRM_DB_HOST/PORT/NAME`      | Postgres coordinates            |
| `CRM_DB_USERNAME/PASSWORD`   | Postgres credentials            |
| `CRM_JWT_SECRET`             | ≥32-byte shared secret          |
| `CRM_JWT_ISSUER/AUDIENCE`    | Must match what the FE sends    |

---

## 1. Pre-flight checks

Run from a clean checkout of `main` (or the release tag):

```bash
# FE
npm ci --no-audit --no-fund
npm run type-check    # must be clean (baseline is 0 errors)
npm test              # vitest smoke tests
npm run build         # verifies prod bundle builds

# BE
cd backend
./mvnw -B clean verify
```

If any of these fail, **do not proceed** — fix on `main` first.

---

## 2. Build & tag images

Use the commit SHA as the immutable tag; optionally also tag
`staging` / `prod` for the rollout target.

```bash
SHA=$(git rev-parse --short HEAD)
REGISTRY=<your-registry>          # e.g. ghcr.io/ayushgoel-ship-it

# Frontend
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  --build-arg VITE_C24_VEHICLE_URL="$VITE_C24_VEHICLE_URL" \
  --build-arg VITE_C24_PARTNERS_LEAD_URL="$VITE_C24_PARTNERS_LEAD_URL" \
  --build-arg VITE_OLA_MAPS_API_KEY="$VITE_OLA_MAPS_API_KEY" \
  -t $REGISTRY/superleap-crm-fe:$SHA \
  -t $REGISTRY/superleap-crm-fe:prod \
  .

# Backend
docker build \
  -f backend/Dockerfile \
  -t $REGISTRY/superleap-crm-api:$SHA \
  -t $REGISTRY/superleap-crm-api:prod \
  backend
```

Smoke-test locally before pushing:

```bash
docker run --rm -p 8080:8080 $REGISTRY/superleap-crm-fe:$SHA
# hit http://localhost:8080 — SPA should load
```

---

## 3. Push & deploy

```bash
docker push $REGISTRY/superleap-crm-fe:$SHA
docker push $REGISTRY/superleap-crm-fe:prod
docker push $REGISTRY/superleap-crm-api:$SHA
docker push $REGISTRY/superleap-crm-api:prod
```

Then trigger the platform-specific rollout. Two typical shapes:

**Kubernetes**
```bash
kubectl -n superleap set image \
  deploy/crm-fe  crm-fe=$REGISTRY/superleap-crm-fe:$SHA
kubectl -n superleap set image \
  deploy/crm-api crm-api=$REGISTRY/superleap-crm-api:$SHA
kubectl -n superleap rollout status deploy/crm-api --timeout=3m
kubectl -n superleap rollout status deploy/crm-fe  --timeout=3m
```

**SSH / docker-compose host**
```bash
ssh $HOST "cd /opt/superleap && \
  docker compose pull && \
  docker compose up -d --remove-orphans"
```

---

## 4. Database migrations

Flyway is invoked by the Spring Boot app on startup, so **migrations
run automatically** the moment the new BE image boots. Plan accordingly:

- For additive-only migrations (new tables, new columns nullable),
  there is no coordination cost.
- For schema-tightening migrations (e.g. `V011__lead_owner_fk_enforce`
  converts `TEXT → UUID` and adds FKs), deploy during a low-traffic
  window. The migration is idempotent but holds brief `ACCESS EXCLUSIVE`
  locks while it `ALTER TABLE`s.
- Orphan/legacy values are quarantined into `lead_owner_quarantine_v011`
  before type conversion — review that table post-deploy and reconcile.

Verify migration state after rollout:

```bash
docker exec -it crm-api sh -c \
  "curl -s localhost:8080/actuator/flyway | jq '.contexts.application.flywayBeans.flyway.migrations[-3:]'"
```

---

## 5. Post-deploy smoke

- [ ] FE loads, login succeeds (`/` → Supabase Auth round-trip)
- [ ] BE `/actuator/health` returns `UP`
- [ ] One KAM lead page renders (reads go through backend)
- [ ] A write path succeeds (e.g. log a call) and the row persists
- [ ] ErrorBoundary reporter is firing (see `src/lib/telemetry/errorReporter.ts`
      — once Sentry/DSN is wired, confirm a test exception reaches the dashboard)

---

## 6. Rollback

**Fast path (no schema change involved):** repoint to the previous SHA.

```bash
kubectl -n superleap set image deploy/crm-fe  crm-fe=$REGISTRY/superleap-crm-fe:$PREV_SHA
kubectl -n superleap set image deploy/crm-api crm-api=$REGISTRY/superleap-crm-api:$PREV_SHA
```

**Schema-tightening migrations** (e.g. V011) cannot be auto-reverted by
redeploying an older image — older code will break if the column type
or FK is incompatible. Options, from least to most destructive:

1. Keep the new schema and roll only the FE back.
2. Manually reverse the schema change:
   ```sql
   ALTER TABLE sell_leads_master DROP CONSTRAINT IF EXISTS fk_sell_leads_kam;
   ALTER TABLE sell_leads_master DROP CONSTRAINT IF EXISTS fk_sell_leads_tl;
   ALTER TABLE sell_leads_master ALTER COLUMN kam_id TYPE TEXT USING kam_id::text;
   ALTER TABLE sell_leads_master ALTER COLUMN tl_id  TYPE TEXT USING tl_id::text;
   -- repeat for dcf_leads_master
   ```
   Then `DELETE FROM flyway_schema_history WHERE version = '011';`
   and redeploy the older BE image.
3. Restore from the pre-migration DB snapshot (preferred if a recent
   one is available — coordinate with DBA).

---

## 7. On-call quick reference

| Symptom                              | Likely cause                           | First check                                            |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------------ |
| FE white screen post-deploy          | Bundle asset path mismatch             | nginx container logs; `/assets/*` 404s                 |
| 401s on every API call               | JWT secret/issuer/audience mismatch    | `CRM_JWT_*` env on BE vs Supabase config               |
| BE fails to start                    | Flyway migration error                 | BE startup logs; `flyway_schema_history.success = f`   |
| FK violation on lead write           | Legacy orphan kam_id/tl_id             | `lead_owner_quarantine_v011` table                     |
| Intermittent 5xx under load          | DB pool exhaustion                     | Spring actuator `/metrics` — `hikari.*`                |

---

## 8. Files that matter

- `Dockerfile`, `docker/nginx.conf` — frontend image
- `backend/Dockerfile`, `backend/docker-compose.yml` — backend image + local stack
- `backend/crm-core/src/main/resources/db/migration/` — Flyway migrations
- `src/config/env.ts` — compile-time env plumbing for the FE
- `src/lib/telemetry/errorReporter.ts` — reporter facade; wire Sentry here
- `.github/workflows/ci.yml` — CI gate (type-check + smoke tests + builds)
- `TS_STRICT_DEBT.md` — TypeScript strictness state & burn-down history
