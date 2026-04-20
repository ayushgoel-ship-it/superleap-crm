# Data Ownership Model

**Date:** April 10, 2026  
**Purpose:** Authoritative DB1 classification of every data entity by ownership, write authority, and backend migration target  
**Status:** Phase 3 DB1 complete

---

## Scope

- Covers all tables defined in Supabase migrations `0001`, `0002`, and `0003`.
- Classification determines which tables the Spring Boot backend owns (schema, migrations, CRUD), which it projects as read-only, and which remain in the external ETL pipeline.
- Ownership rules drive Flyway migration scope (DB2), repository design (DB3), and write API boundaries (Phase 4 A5).
- Authorization is enforced in the Java service layer, not via database RLS policies.

## Ownership Hierarchy

All data scoping follows a single inheritance chain:

```
Region
  └─ Team (tl_user_id)
       └─ KAM (user_id, team_id)
            └─ Dealer (kam_id, tl_id)
                 ├─ Leads (dealer_code → inherits kam/tl)
                 ├─ DCF Leads (dealer_code → inherits kam/tl)
                 ├─ Calls (dealer_code → inherits kam/tl)
                 ├─ Visits (dealer_code → inherits kam/tl)
                 └─ Tasks (dealer_id or lead_id → inherits kam/tl)
```

## Access Tiers

| Role | Read Scope | Write Scope |
| --- | --- | --- |
| KAM | Own dealers + all associated leads, calls, visits, DCF, tasks | Own operational records (visits, calls, tasks, location requests, untagged dealers) |
| TL | Team dealers + all associated records | Team-scoped operational records + location request approvals |
| ADMIN | All records across all regions | All operational records + user management + target/config/hierarchy admin |

## Data Classification

### CRM-Owned Operational Entities

Backend manages schema via Flyway, owns all CRUD, and enforces business rules.

| Table | Domain | Write Actors | Read Actors | Sync/Async | Notes |
| --- | --- | --- | --- | --- | --- |
| `call_events` | Activity | KAM (register + feedback), TL (review) | KAM, TL, Admin | Sync | Outcome, duration, productivity, feedback, TL review |
| `visits` | Activity | KAM (start, complete, feedback) | KAM, TL, Admin | Sync | Check-in/out, geo, proof metadata, feedback |
| `visit_events` | Activity | System (enrichment from visits) | KAM, TL, Admin | Sync | Enhanced visit records with KAM enrichment |
| `tasks` | Activity | KAM (create), system (auto-create) | KAM, TL, Admin | Sync | Reminders/tasks linked to leads or dealers |
| `lead_timeline_events` | Activity | System (on lead state change) | KAM, TL, Admin | Sync | Lead stage progression history |
| `dcf_timeline_events` | Activity | System (on DCF state change) | KAM, TL, Admin | Sync | DCF stage progression history |
| `notifications` | Alerts | System (fanout jobs) | KAM, TL | Sync read, async write | Actor-scoped alerts with deep-link metadata |
| `location_requests` | Workflow | KAM (submit), TL (approve/reject) | KAM, TL, Admin | Sync | PENDING/APPROVED/REJECTED geo-update workflow |
| `untagged_dealers` | Field ops | KAM (create) | KAM | Sync | Visit-only dealers not yet in dealer master |
| `audit_log` | Compliance | System (on every admin write) | Admin | Sync | actor_id, action, entity, old/new values, request_id |
| `upload_metadata` | Storage | KAM (visit proofs), Admin (exports) | Owner, Admin | Sync | File metadata + S3 object key; soft-delete |

### CRM-Owned Configuration Entities

Backend manages schema via Flyway, admin-only writes, broadly read.

| Table | Domain | Write Actors | Read Actors | Notes |
| --- | --- | --- | --- | --- |
| `targets` | Incentives | Admin (update, initialize month) | KAM, TL, Admin | Per-user per-period KPI targets (si, call, visit, dcf) |
| `incentive_rules` | Incentives | Admin (config update) | KAM, TL, Admin | Commission structure rules |
| `incentive_slabs` | Incentives | Admin (config update) | KAM, TL, Admin | Commission tier definitions |
| `incentive_earnings` | Incentives | System (calculation jobs) | KAM, TL, Admin | Calculated payouts per user per period |
| `metric_definitions` | Config | Admin (deploy-time) | All | Dynamic metric catalog |
| `dashboard_layouts` | Config | Each user (self) | Each user (self) | UI customization per user |

### CRM-Owned Identity Entities

Backend manages schema via Flyway. Admin writes for user/team management.

| Table | Domain | Write Actors | Read Actors | Notes |
| --- | --- | --- | --- | --- |
| `users` | Identity | Admin (create, update, deactivate) | All | user_id, name, phone, role, team_id, active flag |
| `teams` | Identity | Admin (manage hierarchy) | All | team_id, team_name, tl_user_id, region |

### Reference / Projected Entities (Read-Only)

Data originates from external systems via Google Sheets sync triggers. The CRM backend reads these tables but **MUST NOT** write to them directly. The sync pipeline (raw table triggers) is the single write authority.

| Table | Source System | Sync Mechanism | Backend Access | Notes |
| --- | --- | --- | --- | --- |
| `dealers_master` | Google Sheets via `dealers_raw` trigger | JSONB upsert trigger `process_dealers_raw_trigger()` | Read-only | Dealer identity, ownership (kam_id, tl_id), onboarding flags, segment |
| `sell_leads_master` | Google Sheets via `leads_raw` trigger | JSONB upsert trigger `process_leads_raw()` | Read-only | 85-column NGS/GS lead records; rank columns for dedup |
| `dcf_leads_master` | Google Sheets via `dcf_leads_raw` trigger | JSONB upsert trigger `process_dcf_leads_raw()` | Read-only | 90-column DCF finance cases; funnel state, commission |
| `dcf_cases` | Legacy schema (migration 0001) | Not actively synced | Read-only | Original DCF table; superseded by `dcf_leads_master` |

**Write boundary exception:** The backend MAY write `dealers_master.is_top` (top-dealer toggle) as a CRM-owned business label on a reference entity. This is the only permitted write to reference tables.

### Ingestion Buffer Tables (ETL-Owned)

These tables receive JSONB payloads from external systems. Trigger functions process them into canonical tables. The CRM backend does **NOT** manage, read, or write these directly.

| Table | Feed Source | Trigger Target |
| --- | --- | --- |
| `dealers_raw` | Google Sheets / external push | `dealers_master` |
| `leads_raw` | Google Sheets / external push | `sell_leads_master` |
| `dcf_leads_raw` | Google Sheets / external push | `dcf_leads_master` |
| `calls_raw` | Phone system / external push | `call_events` |
| `visits_raw` | Field app / external push | `visits` |
| `location_requests_raw` | External push | `location_requests` |
| `org_raw` | Organization export | `users`, `teams` |
| `targets_raw` | External push | `targets` |

### Deprecated / Transitional Tables

| Table | Status | Notes |
| --- | --- | --- |
| `kv_store_4efaad2c` | Deprecated | Auto-generated Figma Make KV store; decommission in Phase 8 C2 |
| `dcf_cases` | Superseded | Original DCF table from migration 0001; `dcf_leads_master` is the active source |
| `dcf_leads` | Processed projection | Intermediate DCF processed table from migration 0002; review if still needed |

## Write Boundaries

### Forbidden Writes

The backend **MUST NOT**:
- Write to `dealers_master` (except `is_top` toggle), `sell_leads_master`, or `dcf_leads_master` — these are sync-pipeline owned
- Write to any `*_raw` table — these are ETL-pipeline owned
- Expose raw table names or schema internals to frontend clients

### Required Write Behaviors

Every backend write operation **MUST**:
- Produce an `audit_log` entry with actor_id, action, entity_type, entity_id, old_value, new_value
- Validate authorization in the service layer using `ActorContext` (from Phase 2 B3)
- Return business-oriented responses, not raw entity shapes

## Enum Types

Managed by Flyway, used across entities:

| Enum | Values | Used By |
| --- | --- | --- |
| `user_role` | KAM, TL, ADMIN | `users` |
| `channel_type` | DealerReferral, YardReferral, OSS, YRS, DCF, Direct, C2B, C2D, GS | `sell_leads_master`, `call_events` |
| `lead_status` | open, won, lost | `sell_leads_master` |
| `lead_rag` | green, amber, red | `sell_leads_master`, `dcf_leads_master` |
| `dcf_stage` | created, in_progress, approved, rejected, disbursed | `dcf_cases`, `dcf_leads_master` |

## Mapping To Phase 3 Tasks

| Classification | Flyway Migration (DB2) | Repository (DB3) | Cache (DB4) | Storage (DB5) |
| --- | --- | --- | --- | --- |
| CRM-owned operational | Yes — full DDL | Yes — read + write repos | No — too volatile | visit proofs via `upload_metadata` |
| CRM-owned config | Yes — full DDL | Yes — read repos, admin write repos | Yes — targets, incentive rules/slabs, metric defs | No |
| CRM-owned identity | Yes — full DDL | Yes — read repos, admin write repos | Yes — org hierarchy | No |
| Reference / projected | Yes — DDL for read models | Yes — read-only repos | No — filter permutations too varied | No |
| Ingestion buffers | Yes — DDL only, no app code | No — backend does not access | No | No |
| Deprecated | No — document only | No | No | No |

## Coverage Checklist

| DB1 Requirement | Covered In |
| --- | --- |
| Mark CRM-owned operational entities | CRM-Owned Operational Entities table |
| Mark read-only/reference entities from company data | Reference / Projected Entities table |
| Define app-owned schema and naming conventions | Enum Types + all table classifications |
| Define what must remain source-of-truth elsewhere | Reference entities + Ingestion Buffer tables |
| Document write boundaries and forbidden direct writes | Write Boundaries section |
