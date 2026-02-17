# Decision: Database Choice for SuperLeap CRM

**Date:** February 10, 2026
**Phase:** 6A (Database + Config Foundation)
**Decision:** **Option A — Supabase Postgres**
**Status:** Accepted

---

## Context

SuperLeap CRM requires a PostgreSQL serving database to power the config-driven
dashboard, metrics engine, and all CRUD endpoints defined in API_CONTRACTS.md.
Two options were evaluated:

| Criterion | Supabase Postgres | Cloud SQL Postgres |
|-----------|------------------|--------------------|
| **Setup speed** | Minutes (hosted, managed) | Hours (VPC, IAM, proxy) |
| **Built-in Auth** | Yes (JWT, RLS, row-level security) | Bring-your-own |
| **REST/Realtime API** | Yes (PostgREST auto-generated) | No |
| **Connection pooling** | PgBouncer built-in (Supavisor) | Must configure manually |
| **Migrations** | CLI (`supabase db push`) | Cloud SQL Auth Proxy + manual |
| **Cost at V1 scale** | Free tier covers ~200 users, 2K dealers | ~$30-50/mo minimum |
| **Scaling ceiling** | Pro plan scales to millions of rows | Virtually unlimited |
| **BQ integration** | Via pg_cron + Postgres FDW or DAG | Native via Datastream |
| **Vendor lock-in** | Low (standard Postgres, exportable) | Low (standard Postgres) |

## Decision

**Supabase Postgres** is selected for Phase 6A because:

1. **Speed:** Zero-config managed Postgres with instant provisioning. No VPC
   setup or proxy configuration needed for the initial build.

2. **Auth alignment:** Supabase Auth issues JWTs with `user_id`, `role`,
   `team_id` claims — matching the API_CONTRACTS.md auth model exactly. RLS
   policies can enforce role-based scoping (KAM sees own data, TL sees team,
   ADMIN sees all) at the database level.

3. **PostgREST layer:** Auto-generated REST endpoints can serve as a rapid
   prototype backend while the full API server is built, reducing time-to-first
   working dashboard.

4. **Cost:** Free tier is sufficient for development and pilot. Pro plan
   ($25/mo) covers production at V1 scale (~200 users, ~100K events/month).

5. **Migration path:** If scale demands it later, Supabase Postgres is standard
   Postgres — `pg_dump` and restore to Cloud SQL is a zero-downtime migration
   via logical replication.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Supabase outage | Standard Postgres — can failover to any managed PG |
| Scale beyond Supabase limits | Migrate to Cloud SQL via `pg_dump` / logical replication |
| BQ pipeline complexity | Use Cloud Composer DAG to read from Supabase via connection string (same as Cloud SQL) |
| Vendor-specific features creep | Limit usage to standard Postgres features + RLS. No Supabase-specific Edge Functions in Phase 6A. |

## Constraints

- All SQL in `/migrations/*.sql` uses **standard PostgreSQL** syntax only.
- No Supabase-specific extensions are required in the schema.
- The schema is portable to any Postgres 15+ instance.

---

*End of DB_CHOICE.md*
