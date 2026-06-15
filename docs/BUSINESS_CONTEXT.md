# Business Context — Superleap CRM Go-Live

Generated 2026-06-11. Three sources: snowflake-dr (DR data ground truth), superleap-pm (business definitions), dr-boss (production prioritization).

---

## snowflake-dr (DR data ground truth)

DCF is confirmed out-of-scope of the canonical six. Now delivering tight structured output.

---

# snowflake-dr → Superleap CRM cutover data brief

## 1. Canonical Snowflake sources for the 5 KAM anchors

Scope-locked to the canonical six (declared by user 2026-04-23/24). Anything outside these is escalation, not exploration.

| Anchor | Canonical source(s) | Authoritative column(s) |
|---|---|---|
| **3-ID** (≥3 unique inspecting dealers / KAM / working day) | `CSPL_C2B_DB.PROD.C2B_GROWTH_MASTER_DATA` | `KAM_MAPPED` (B1 email) × `UCD_DEALER_CODE` × `FIRST_INSP_DATE` |
| **10 GS Stock-In** (MTD) | `C2B_GROWTH_MASTER_DATA` (spine, SI date + KAM) ⋈ `INS_C2D` (GS flag) | `STOCKIN_DATE`, `KAM_MAPPED`, `GROWTH_FLAG` ⋈ `INS_C2D.GS_FLAGS = 'gs_flagged'` |
| **10 NGS Stock-In** (MTD) | same as GS | `INS_C2D.GS_FLAGS IN ('non_gs','gs_non_assured')` — binarization decision pending user |
| **12% I2SI** (MTD) | `C2B_GROWTH_MASTER_DATA` only | `COUNT(STOCKIN_DATE) / COUNT(FIRST_INSP_DATE)` per `KAM_MAPPED` MTD |
| **DCF (10 onboard + 2 disburse)** | **NOT IN CANONICAL SIX — escalation required** | Neither C2B_GROWTH_MASTER_DATA nor INS_C2D nor FINAL_SELL_BUSINESS_SILVER_LAYER carry DCF onboarding / disbursement. Needs separate source (likely `CSPL_FT_SAP_DB.NBFC_LIVE_DBO` or `CFSPL_CF_DCF_DB_SHARED`) — user must declare. |

## 2. Exact join paths and computation

### Anchor A — 3-ID (single table)
```
C2B_GROWTH_MASTER_DATA
  WHERE GROWTH_FLAG IN ('DR','OSS','SM')
    AND FIRST_INSP_DATE = :date
    AND UCD_DEALER_CODE IS NOT NULL
    AND KAM_MAPPED IS NOT NULL
  GROUP BY KAM_MAPPED, FIRST_INSP_DATE
  → COUNT(DISTINCT UCD_DEALER_CODE)
```
Grain: KAM × day. No join needed. Working-day calendar is **NOT in canonical six** — escalation.

### Anchor B — GS / NGS SI (1 join, 1:1)
```
C2B_GROWTH_MASTER_DATA g
  LEFT JOIN INS_C2D i ON i.APPOINTMENTID = g.PUB_APPT_ID   -- TEXT=TEXT, 1:1, 92.3% hit
  WHERE g.STOCKIN_DATE BETWEEN month_start AND :date
    AND g.GROWTH_FLAG IN ('DR','OSS','SM')
  GROUP BY g.KAM_MAPPED
  → COUNT(CASE WHEN i.GS_FLAGS='gs_flagged' THEN 1 END) AS gs_si
     COUNT(CASE WHEN i.GS_FLAGS IN ('non_gs','gs_non_assured') THEN 1 END) AS ngs_si
```
**Risk:** 7.7% of stock-ins have no INS_C2D row → GS flag NULL → silently bucketed as NGS by COALESCE. Mitigate with explicit `gs_unknown` bucket.

### Anchor C — I2SI MTD
```
C2B_GROWTH_MASTER_DATA
  WHERE GROWTH_FLAG IN ('DR','OSS','SM')
  GROUP BY KAM_MAPPED
  → SUM(CASE WHEN STOCKIN_DATE >= month_start THEN 1 END)
     / NULLIF(SUM(CASE WHEN FIRST_INSP_DATE >= month_start THEN 1 END), 0)
```
Same-month numerator/denominator. **Not lagged** — confirms shared-context.

### Anchor D — DCF
**Cannot resolve from canonical six.** Recommend user declare the DCF table before CRM go-live; until then the CRM cannot reconcile DCF tiles against Snowflake — they will be CRM-internal only.

## 3. AI feature → Snowflake feature source map

| RFP AI feature | Training/serving features pulled from |
|---|---|
| **Call intelligence** (disposition mining, next-best-call) | `GROWTH_UNOLO.TASK_DETAIL` (6.66M rows; `DISPOSITION`, `APPOINTMENTID`, `BOOKINGID`, `HUBNAME`) — only call surface in scope. **`DEALER_TASKS.TYPE` is uniformly `'meeting'` — useless for call vs visit; classification must come from TASK_DETAIL.DISPOSITION.** |
| **NBA engine** (next best action per dealer/KAM/day) | Feature set = `AGENTS_DEALER_MAPPING` (current KAM, tenure) + `C2B_GROWTH_MASTER_DATA` (last inspection date, MTD SI velocity per dealer, GROWTH_FLAG, FIRST_INSP_DATE recency) + `INS_C2D` (last GS_FLAGS, last TP) + `GROWTH_UNOLO.DEALER_TASKS` (last visit date, COALESCE of dealer-code fields). Dealer-grain feature table = recommended canonical mart. |
| **Dealer Health Score** | `C2B_GROWTH_MASTER_DATA` (trailing 30/60/90-day inspections, SI, I2SI by dealer using `UCD_DEALER_CODE`), `INS_C2D` (avg `TP`, GS-flagged share, rating means across 5 condition columns), `AGENTS_DEALER_MAPPING` (tenure since first `CREATED_AT`). |
| **Anomaly detection** (sudden dealer drop, KAM funnel collapse) | Time-series at KAM × day grain from `C2B_GROWTH_MASTER_DATA` (inspections, SI, unique dealers); cross-check with `GROWTH_UNOLO.DEALER_TASKS` STATUS/CREATEDTS to distinguish dealer dormancy from KAM-attendance gaps. |
| **DCF OCR** (KYC / loan docs) | **Out of scope of canonical six.** Document images live in DCF system + S3 stage, not Snowflake fact tables. Training labels would need the DCF table that anchor D depends on — same escalation. |

**Feature-store recommendation:** vendor pulls **only via curated views** owned by snowflake-dr in `CSPL_DB.PUBLIC` (mart schema). Do not grant raw access to `MONGO_*` or `GROWTH_UNOLO.*` schemas — both have soft-delete and history-row gotchas that will corrupt features silently.

## 4. High-risk CRM-vs-Snowflake divergences (5 spots)

1. **KAM identity** — if the CRM uses `KAM_L1_EMAIL` as the field-KAM (the old, wrong rule), every KAM-grain metric will collapse 98 B1 KAMs into 23 TLs. CRM must use `KAM_MAPPED` for B1; `KAM_L1_EMAIL` is the TL rollup, `KAM_L2_EMAIL` is Sr Mgr/Head. Verified in `snowflake-canonical.md` §SCOPE LOCK.

2. **GS definition** — if CRM uses `C2B_GROWTH_MASTER_DATA.IS_GROWTH_CJ_INSP` as GS, it is **not** GS (it is Growth CJ inspection flag, ~110k rows). Authoritative GS is `INS_C2D.GS_FLAGS` with 3 states (`gs_flagged`, `gs_non_assured`, `non_gs`). CRM RAG logic that binarizes GS must declare which side `gs_non_assured` falls on — currently undecided.

3. **Dealer ↔ KAM "current" mapping** — `AGENTS_DEALER_MAPPING.IS_ACTIVE` is **always TRUE** (33,608/33,608 rows). Any CRM that filters `WHERE IS_ACTIVE=true` for current-KAM lookup gets duplicates. Must use `QUALIFY ROW_NUMBER() OVER (PARTITION BY DEALER_CODE ORDER BY UPDATED_AT DESC) = 1`.

4. **Dealer code data type** — `FINAL_SELL_BUSINESS_SILVER_LAYER.DEALER_CODE` is **NUMBER**; `AGENTS_DEALER_MAPPING.DEALER_CODE` and `C2B_GROWTH_MASTER_DATA.UCD_DEALER_CODE` are **TEXT**. CRM entity class for Dealer must store as TEXT and cast on join: `CAST(silver.DEALER_CODE AS VARCHAR)`. Leading-zero loss is the silent bug.

5. **Inspection date semantics** — `C2B_GROWTH_MASTER_DATA.FIRST_INSP_DATE` (DATE) vs `INS_C2D.INSPECTIONENDTIME` (TIMESTAMP) can differ by 1 day (TZ + late writes). For "daily unique inspecting dealers" the CRM must standardize on `FIRST_INSP_DATE` (the funnel-master date), not the INS_C2D end timestamp. If CRM ingests INS_C2D for inspector identity but joins it back to count inspections, day boundaries will drift ~3–5%.

## 5. Cutover reconciliation tests

Confirmed list, with exact Snowflake queries to run nightly during cutover (T-30 to T+14). Tolerance bands are my recommendation — user can tighten.

| Test | Snowflake query (canonical) | Tolerance |
|---|---|---|
| **Daily unique Inspecting Dealers per KAM** | `GROUP BY KAM_MAPPED, FIRST_INSP_DATE → COUNT(DISTINCT UCD_DEALER_CODE)` on `C2B_GROWTH_MASTER_DATA` WHERE `GROWTH_FLAG IN ('DR','OSS','SM')` for yesterday | **Exact** (zero variance) |
| **MTD GS SI per KAM** | Anchor B query, current month | **±1 row per KAM** (allows late `INS_C2D` arrivals) |
| **MTD NGS SI per KAM** | Anchor B query, current month | **±1 row per KAM** |
| **MTD I2SI per KAM** | Anchor C query | **±0.5 percentage points** |
| **KAM open leads** (CRM-only concept — no Snowflake equivalent) | Proxy: `COUNT(*) FROM C2B_GROWTH_MASTER_DATA WHERE KAM_MAPPED=? AND LEAD_DATE >= today-30 AND FIRST_INSP_DATE IS NULL AND STOCKIN_DATE IS NULL` | **±1% per KAM** (proxy is lossy — flag to PM) |
| **Dealer ↔ KAM current mapping** | Latest-row dedup on `AGENTS_DEALER_MAPPING` for full active universe; CRM dealer.kam_email must match for all `EMPLOYEE_STATUS='Active'` KAMs in roster Sheet | **Exact** (zero unmatched dealers) |
| **DR/OSS/SM category assignment** | `GROWTH_FLAG` per appt; CRM lead.category must match | **Exact** (refuse cutover on any mismatch) |
| **Inspector identity on SI rows** | `INS_C2D.INSPECTIONBY` joined via `APPOINTMENTID=PUB_APPT_ID`; CRM should not derive this independently | **Exact** (1:1 join, 92.3% coverage — accept 7.7% NULL) |
| **DCF onboard/disburse** | **Cannot test until DCF source declared.** CRM tile will be unreconcilable until then. | **Blocker** |

**Recommended cutover gate:** run all of the above for **7 consecutive days** with CRM and Snowflake in parallel before cutting traffic. The Dealer↔KAM mapping test and Category assignment test must pass exact (zero variance) — they are foundational and cheap to verify.

## File / table references
- Canonical map: `/Users/a30711/.claude/dealer-referral/snowflake-canonical.md`
- Shared context / anchors: `/Users/a30711/.claude/dealer-referral/shared-context.md`
- Roster Sheet (band/grade/L1-L2 — authoritative, replaces HRMS): `/Users/a30711/Documents/Projects/Dealer Referral/DR Agents/exports/team-roster-YYYY-MM-DD.csv`
- Tables (all `CSPL_C2B_DB`): `PROD.C2B_GROWTH_MASTER_DATA`, `PROD.INS_C2D`, `PROD.FINAL_SELL_BUSINESS_SILVER_LAYER`, `MONGO_C2B_C2B_DEALER_REFERRAL.AGENTS_DEALER_MAPPING`, `GROWTH_UNOLO.DEALER_TASKS`, `GROWTH_UNOLO.TASK_DETAIL`, `GROWTH_UNOLO.FIELD_EXECUTIVE_API`

## Open escalations to user
1. **DCF source declaration** — without it, anchor D and DCF OCR cannot be reconciled. Hardest blocker.
2. **Working-day calendar** — required for 3-ID denominator. Not in canonical six.
3. **GS binarization rule** — does `gs_non_assured` count as GS or NGS for the "10 GS SI" target?
4. **"KAM open leads" definition** — no Snowflake column maps directly. Need PM to define the funnel-state semantics CRM should use (LEAD_DATE-only? + no FIRST_INSP_DATE? + window?).

---

## superleap-pm (canonical business definitions)

I have everything I need. Writing the answer now.

---

# Superleap CRM — Canonical Definitions for Cars24 Cutover

Source: live read of `backend/crm-core/...` (Spring Boot, authoritative), `supabase/migrations/0001..0003` and `supabase/functions/make-server-4efaad2c/*` (legacy, being retired), and `src/lib/*` (FE — informational, not yet wired). All file paths absolute.

**Critical drift up front:** Two parallel schemas exist — Supabase `public.leads/dealers/...` (UUID, RLS, ENUM-typed) and Spring `sell_leads_master/dealers_master/...` (TEXT IDs, application-layer scoping, CHECK constraints). The new backend should ship the Spring/`*_master` shape. The Supabase ENUM `lead_status('open','won','lost')` is narrower than what production semantics require — flagged below.

---

## 1. Canonical Definitions

### Productive call / visit
- **Schema fact:** `call_events.is_productive BOOLEAN` + `productivity_source TEXT`; same on `visits.is_productive` / `productivity_source` (`/Users/a30711/superleap-crm/backend/crm-core/src/main/resources/db/migration/V003__operational_tables.sql:21-22, 58-59`).
- **Set by:** `CallCommandServiceImpl.submitFeedback` and `VisitCommandServiceImpl.completeVisit` — value comes from the actor's payload (KAM or TL override); `productivity_source` records who decided (`/Users/a30711/superleap-crm/backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/CallCommandServiceImpl.java:81-82`, `/Users/a30711/superleap-crm/backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/VisitCommandServiceImpl.java:94-95`).
- **FE-only outcome heuristic (NOT in backend):** `/Users/a30711/superleap-crm/src/lib/productivity/productivityService.ts:97-117` — "productive iff any delta>0 in dealer's Leads/Inspections/Stock-ins/DCF within `windowDays` after the interaction." This is FE-side evidence only; the backend trusts the submitted boolean. **Decision needed:** is this heuristic the canonical rule or just UI evidence? New backend must pick one.

### Disbursal recognition
- **Spring (canonical):** `dcf_leads_master.overall_status` is the funnel state; `disbursal_date TIMESTAMPTZ` and `disbursal_utr TEXT` mark the event (`V002__dealer_and_lead_tables.sql:103, 116-117`).
- **Recognition rule (from FE + edge queries):** a DCF is "disbursed" iff `overall_status = 'DISBURSED'` (uppercase in queries) AND `disbursal_date` is non-null. See `/Users/a30711/superleap-crm/src/seed/metrics.sql:94, 104, 108` and `/Users/a30711/superleap-crm/src/lib/domain/dcfStatus.ts:42` (FE normalizes to lowercase `'disbursed'`).
- **Backend gap:** `DcfCommandServiceImpl.submitOnboarding` initializes `current_funnel='application'`, `overall_status='active'` — no transition-to-disbursed command exists yet (`/Users/a30711/superleap-crm/backend/crm-core/src/main/java/com/cars24/crmcore/service/impl/DcfCommandServiceImpl.java:63-65`). New backend must own this transition.
- **Recognition timestamp for incentive periods:** `disbursal_date` (not `updated_at`).

### Inspecting Dealer uniqueness window
- **Not in backend.** Only the FE encodes it: `/Users/a30711/superleap-crm/src/lib/activity/dealerActivityFilter.ts:43-62` — a dealer is "inspecting" iff there exists a Lead with `reg_insp_rank = 1` AND `inspection_date` within **last 30 days (rolling)**. Uniqueness is per `dealer_id` or `dealer_code` (whichever matches first).
- **Schema support:** `sell_leads_master.reg_insp_rank INTEGER` and `inspection_date TIMESTAMPTZ` exist (`V002__dealer_and_lead_tables.sql:68, 59`). New backend must port this window into a query/materialized view.

### Lead status: terminal / cancelled / rescheduled
- **Spring (`sell_leads_master.status`):** CHECK `IN ('open','won','lost')` (`V002__dealer_and_lead_tables.sql:35`). **No `cancelled` and no `rescheduled` at lead level.**
- **Stale lead transition (only non-FE state mutator besides create/pricing):** `StaleLeadCleanupTask` flips `status='stale'`, `rag_status='RED'` after 30 days idle (`/Users/a30711/superleap-crm/backend/crm-api/src/main/java/com/cars24/crmapi/scheduler/StaleLeadCleanupTask.java:20-46`). **`'stale'` violates the CHECK constraint** — confirmed bug; new backend must either widen the enum or stop writing it.
- **Cancelled / rescheduled live at the appointment level only:** `appointments.status IN ('SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED','NO_SHOW')` (`V009__c24_integration_and_appointments.sql:41`). Rescheduling forks a new row with `rescheduled_from` FK; original transitions to `RESCHEDULED` (`AppointmentCommandServiceImpl.java:94-127`).
- **Mapping for new backend:**
  - Lead terminal: `won`, `lost`, `stale`
  - Lead non-terminal: `open`
  - Appointment terminal: `COMPLETED`, `CANCELLED`, `NO_SHOW`, `RESCHEDULED`
  - Appointment live: `SCHEDULED`

### RAG status formula
- **Spring `sell_leads_master.rag_status` CHECK `IN ('green','amber','red')`** (`V002__dealer_and_lead_tables.sql:36`). **No computation lives in backend services** — only the stale-cleanup batch writes `RED` after 30 inactive days (`StaleLeadCleanupTask.java:42`, note casing drift vs CHECK).
- **FE-side formulas (multiple — not authoritative):**
  - Metric-achievement RAG: `getRAGStatusByAchievement` — `>=100% → GOOD`, `>=80% → WARNING`, else DANGER (`/Users/a30711/superleap-crm/src/lib/domain/metrics.ts:138`, thresholds at `src/lib/domain/constants.ts:466-501`).
  - Config-driven dashboard RAG: `computeRAG(value, {green_min, amber_min})` reads `metric_definitions.rag_thresholds` (`supabase/functions/make-server-4efaad2c/crm_utils.tsx:218-227`).
  - DCF lead RAG: `red_flag==1 → red; risk_bucket IN ('B','C') → amber; else green` (`src/data/supabaseRaw.ts:383`).
- **Decision needed:** new backend must own one formula per entity (lead vs DCF vs metric-tile). I recommend: lead RAG = function of (days_since_last_activity, stage_age_vs_SLA); DCF RAG = function of (`red_flag`, `risk_bucket`); metric-tile RAG = config-driven via `metric_definitions.rag_thresholds`.

### Working-day calendar source
- **There isn't one.** Grepped backend + FE: zero `holiday`/`working_day`/`business_day` tables or services. The only proration is `src/lib/metrics/prorateTarget.ts:24` which uses a fixed `MONTH_DAYS = 30` and **counts calendar days, not working days**.
- **Implication:** the "3 inspecting dealers per working day" KPI in shared-context has no calendar backend behind it. New backend must add a `working_days` table or rule (and an IST timezone constant — currently the backend uses `ZoneOffset.UTC` for MTD math, `DashboardQueryServiceImpl.java:38` — drift vs IST operations).

---

## 2. Lead Funnel State Machine

**Stage column:** `sell_leads_master.stage TEXT` — no DB-level CHECK on `stage` (only on `status`). Backend-defined states:

| State | Owner | Set by |
|---|---|---|
| `new` | backend | `LeadCommandServiceImpl.createLead` line 63 |
| `appt` | (FE/external) | not written by backend services today |
| `insp` | external (C24) | reflected via `inspection_date`, `reg_insp_rank` from sheet sync |
| `token` | external (C24) | reflected via `token_date` |
| `si` (stock-in) | external (C24) | reflected via `stockin_date`, `final_si_date` |
| `stockout` | external (C24) | reflected via `stock_out_date` |

**Backend-owned transitions (today):** only `→ new` on create, and `status` flip `open → stale` by the cleanup batch. **No `won`/`lost` transition command exists.**

**Reflected (not owned) transitions:** appointment booking (`appointments` write), inspection/token/SI/stockout dates — these come in via the GSheet sync triggers (`supabase/migrations/0003_gsheets_sync_triggers.sql:16-56`) and the Spring schema mirrors them. **Source of truth for stage progression is Cars24 partners-lead API + sheet ingest, not Superleap.**

**Legal transitions to enforce in new backend:**
- `new → appt` (on appointment booking)
- `appt → insp` (on inspection_date set)
- `insp → token` (on token_date set)
- `token → si` (on stockin_date set)
- `si → stockout` (on stock_out_date set)
- Any stage `→ won` (terminal, requires `actual_revenue`)
- Any stage `→ lost` (terminal, requires loss reason)
- Any active stage `→ stale` (batch, 30d no activity)

Backward transitions and cross-stage jumps are not allowed in code today but also not blocked — new backend should reject.

---

## 3. Role-Permission Matrix

**Authoritative source:** `roles TEXT NOT NULL DEFAULT 'KAM' CHECK (role IN ('KAM','TL','ADMIN'))` (`V001__identity_tables.sql:18`); enforcement via `ActorScopeResolver` (`/Users/a30711/superleap-crm/backend/crm-api/src/main/java/com/cars24/crmapi/controller/support/ActorScopeResolver.java`).

**Current (as-is):**

| Domain | KAM | TL | ADMIN |
|---|---|---|---|
| Users | read all, update self | read all | full CRUD (`AdminUserController`) |
| Teams | read | read | full CRUD (`AdminTeamController`) |
| Dealers | read/update assigned only (via `kam_id` filter) | read/update team (no zone enforcement in code) | full CRUD |
| Leads | read/update where `kam_id=self`; insert any | read/update team | full |
| Calls | read/write where `kam_id=self`; submit-feedback gated by `ForbiddenException` for non-owner (`CallCommandServiceImpl.java:71-74`) | read/write team | full |
| Visits | start/complete where `kam_id=self`; complete blocked for non-owners (`VisitCommandServiceImpl.java:80-83`) | read/write team | full |
| Appointments | book/reschedule/update status (no owner check in service — gap) | same | same |
| Notifications | own only (`user_id=self`) | own | own + admin notify-others |
| DCF | submit onboarding any | read team | full + status transitions (when implemented) |
| Location Requests | submit | approve/reject (intended; no code today) | approve/reject |
| Targets | read own | read team | manage (`AdminTargetController` requires `ADMIN`) |
| Incentive Slabs/Rules | read | read | manage (`AdminConfigController`) |
| Audit Log | none | none | read (`AdminAuditController`) |
| Hierarchy | read | read | manage (`AdminHierarchyController`) |
| Async Jobs / Uploads | own | own | manage (`AdminJobController`) |

**Should-be in new backend:**
- **KAM** can never see another KAM's dealers/leads/calls/visits/DCF. Today the Spring code enforces this only via `ActorScopeResolver.getKamIdForScope()` passing `kam_id` into queries — **no DB-level RLS in the Spring schema**. New backend must apply it consistently at the repository layer for every list/detail query (currently inconsistent — appointments service has no owner check).
- **TL** can re-tag dealers and approve location changes **within their team/zone only**. Today there is no zone or region predicate on TL writes — only `team_id` on users. Add `region`/`zone_id` predicate to TL scope.
- **ADMIN** retains global. No change.
- Add explicit permission strings (`leads.write`, `dealers.retag`, `dcf.transition_disbursed`, `targets.write`) — `ActorScopeResolver.requirePermission` already exists but no permissions are seeded.

---

## 4. Page-Domain Invariants

| Page | Invariants the new backend must enforce |
|---|---|
| **Dashboard** | (a) Time scope = MTD by default, IST (not UTC — current bug at `DashboardQueryServiceImpl.java:38`). (b) KAM sees only own `kam_id` counts; TL sees team; Admin sees all. (c) Counts must be consistent across tiles for the same time window. (d) RAG per tile from `metric_definitions.rag_thresholds`. |
| **Dealers** | (a) `dealers_master.dealer_code` is UNIQUE (`V002:5`). (b) KAM can only see dealers where `kam_id = self`. (c) Re-tag requires TL/Admin and must move the dealer within zone. (d) Status flip `active↔inactive` is audit-logged. (e) `is_top` is read-only to KAM. (f) Location-change goes through `location_requests` → approval, never direct write. |
| **Leads** | (a) `lead_id` UNIQUE, format `LEAD-XXXXXXXX` (`LeadCommandServiceImpl.java:45`). (b) `status` ∈ `{open,won,lost,stale}` (must widen CHECK or add migration — see drift above). (c) `kam_id` is immutable from KAM role; TL/Admin can reassign. (d) Stage transitions follow the graph in §2; backward/skip jumps rejected. (e) `c24_lead_id` write-once. (f) Pricing fields (`cep`, `cep_confidence`) updatable but audited (`updatePricing`). |
| **Calls** | (a) `kam_id` of a call cannot be changed after create. (b) Feedback submission gated by ownership or TL/Admin (`CallCommandServiceImpl.java:71-74`). (c) `is_productive` requires `productivity_source`. (d) `direction ∈ ('outbound','inbound')`. |
| **Visits** | (a) Status transitions: `NOT_STARTED → CHECKED_IN → COMPLETED` only. Backend already rejects non-`CHECKED_IN → COMPLETED` (`VisitCommandServiceImpl.java:86-89`). (b) `geo_lat/lng` required at check-in (not enforced today — gap). (c) `duration` auto-computed from check-in→complete (`VisitCommandServiceImpl.java:107-110`). (d) Untagged-dealer visits go through `untagged_dealers` table (`V003:102-113`). |
| **Notifications** | (a) `user_id` scoping — user can read/update only own (current RLS + Spring `NotificationQueryService`). (b) System inserts always allowed; user-initiated inserts gated. |
| **DCF** | (a) `dcf_id` UNIQUE, format `DCF-XXXXXXXX` (`DcfCommandServiceImpl.java:45`). (b) `overall_status` transitions: `active → in_progress → approved → disbursed` or `→ rejected` (terminal). Currently only create is implemented — new backend must own the lifecycle. (c) `disbursal_date` required when `overall_status='disbursed'`. (d) `total_commission = base_commission + booster_applied` (per field semantics; no service enforces this today). (e) `commission_eligible` gates payout. |
| **Admin** | (a) Targets are immutable after the period closes (not enforced today). (b) Incentive slabs/rules require `effective_from < effective_to` and no overlap per `metric_key + role_scope`. (c) `ADMIN`-only on writes — already gated via `actorScopeResolver.requireRole("ADMIN")`. (d) Audit log is append-only and visible only to Admin (current RLS). |

---

## 5. Supabase Edge / RLS Logic to Reproduce

**Edge functions (`supabase/functions/make-server-4efaad2c/`) — to retire or port:**
- `sync/push` (`index.ts:52-100`): single ingest endpoint, gated by `x-sync-secret`, upserts into `*_raw` tables; downstream triggers normalize into `leads/calls/visits/dcf_cases/dealers`. New backend needs an equivalent secured ingest endpoint + transformation pipeline (or replace with C24 API push).
- `crm_routes.tsx`: read-side aggregation for dashboard/leaderboard (1472 lines) including the disbursal queries (`crm_routes.tsx:1124,1145`). Replace with Spring `*QueryService` impls (most already exist).
- `crm_utils.computeRAG` (`crm_utils.tsx:218-227`): config-driven `(value, {green_min, amber_min})` → RAG. Port to `MetricDefinitionEntity` + `RagService` in Spring.
- `auth_middleware.tsx:34`: enforces `KAM|TL|ADMIN` enum, falls back to `X-User-Id/X-User-Role` headers when no JWT. The Spring `AuthFilter` already replaces this; ensure no client still depends on the header fallback.

**Postgres triggers (`supabase/migrations/0003_gsheets_sync_triggers.sql`) — must reproduce or eliminate:**
- `process_dealers_raw()` (lines 22-72): `dealers_raw → dealers` normalization, including `is_active` boolean → `status` mapping, segment-tag derivation from `stage`+`verticals`.
- `process_leads_raw()` (lines 16-56): defaults `stage='Lead Created'`, `status='open'`, `rag='green'`; on-conflict-update on `lead_id`. **Note `stage='Lead Created'` ≠ the `new` the Spring backend writes** — drift.
- `process_calls_raw()`, `process_visits_raw()`, `process_dcf_leads_raw()` (lines 66-183): mirror columns from JSONB payload into typed tables.
- All triggers run `SECURITY DEFINER SET search_path = ''`.

**RLS policies (`0001_initial_schema.sql:222-308`, refined in `0002_security_and_performance_fixes.sql`):**
- KAM-scoped SELECT/UPDATE: `dealers`, `leads`, `call_events`, `visits`, `tasks` use `assigned_kam_id = auth.uid() OR role IN ('TL','ADMIN')`.
- `lead_timeline_events` SELECT gated through a join on `leads.assigned_kam_id`.
- `notifications`: `user_id = auth.uid()::text` for SELECT/UPDATE.
- `audit_log`: ADMIN-only SELECT; writes are trigger-only.
- `targets`: own + TL/ADMIN read; ADMIN-only write.
- `incentive_earnings`: own + ADMIN.
- All `*_raw` and config tables (`metric_definitions`, `incentive_slabs/rules`, `dashboard_layouts`): authenticated read, ADMIN write.

**New backend must reproduce as application-layer authorization** (the Spring schema has NO RLS — confirmed by absence of `ENABLE ROW LEVEL SECURITY` in V001–V010). Every list/detail repository method must take `kamIdForScope`/`tlIdForScope` from `ActorScopeResolver` and apply it in the SQL — currently done inconsistently (e.g. appointments service has no scope filter).

---

## Open items for human PM
1. Authoritative productivity rule: KAM-submitted boolean vs. FE evidence heuristic? Pick one.
2. Working-day calendar: do you want a `working_days` master with India holidays, or compute Mon–Sat ex-holidays at query time?
3. Lead status enum widening to include `stale` (and possibly `cancelled`) — migration + audit needed.
4. Stage label drift: backend writes `new`; sheet trigger writes `Lead Created`. Pick one.
5. RAG ownership: per-entity formula vs. config-driven everywhere.
6. IST vs UTC for all MTD/period math — fix `DashboardQueryServiceImpl` and any other `ZoneOffset.UTC` use.

---

## dr-boss (business prioritization for go-live)

**Summary**
You're framing this as a tech audit. It's not. It's a category-readiness call. The product exists to make KAMs drive 3 inspecting dealers/day and ship 10 GS SI/month. Everything that doesn't directly serve that is deferrable.

**1. Ranked priority**

1. **Cars24 cloud onboarding** — non-negotiable. No cutover without it. Owns critical path: SecOps, IdP, data residency. Start week 1.
2. **Supabase removal** — must complete before pilot. Two backends = two truths = audit failure + dealer payout reconciliation risk. No half-state in production.
3. **AI Tier-1 (one feature only)** — ship the highest-leverage one. AI is the wedge that justifies the rebuild; without it, this is just a re-platform.
4. **Operational hardening** — minimum bar for pilot (auth, audit log, payout integrity, RBAC). Everything else (perf tuning, observability polish, test coverage >70%) defers to v1.1.

**If timeline slips:** cut AI scope to one feature, defer hardening beyond pilot-minimum. Never cut migration or Supabase removal.

**2. AI Tier-1: ship first vs. wait**

**Ship first: Next-Best-Dealer / Daily Call List for KAM.** Directly attacks the 3-inspecting-dealers/day discipline gap. Every KAM, every day, immediate behavior change, measurable on inspections and unique inspecting dealer count within 2 weeks. This is the only AI feature with a direct line to GS.

**Wait for v1.1:** dealer-churn prediction, auto-summarization of dealer calls, smart payout dispute triage, lead-scoring refinements. All useful, none move the discipline metric in pilot.

**3. Half-AI + full migration vs. full-AI + Supabase present**

**Full migration, half-AI.** Non-negotiable. Supabase-in-production at pilot means:
- Two sources of truth for dealer + payout data → reconciliation breaks → trust erodes
- Cars24 SecOps will not sign off → pilot blocked anyway
- You can ship AI in v1.1; you cannot un-ship a split backend

AI is a feature. Migration is the foundation. Don't pilot on sand.

**4. Pilot cohort: confirmed, with one change**

One zone + one disciplined TL + **8-12 KAMs is right** — but **add: minimum 3 of those KAMs must be current top-quartile performers** (≥10 GS SI/month track record). Reason: if AI doesn't lift the strong KAMs' breadth/consistency, the feature is dead regardless of what the weak ones do. Weak KAMs have too many confounders.

Also: pilot zone should be a **mid-density city, not Mumbai/Delhi.** Top metros have too much organic noise to read signal cleanly.

**5. Single acceptance criterion**

**KAMs in the pilot cohort hit ≥3 unique inspecting dealers per working day on ≥70% of working days, sustained over 4 consecutive weeks — and the system is the reason (measurable via Daily Call List adoption + dealer-touch logs).**

If this fails, we shipped software. We did not ship a product that builds the dealer habit DR exists to build. Everything else — GS lift, I2SI, DCF — flows from this. Miss it and we re-scope, not re-launch.

**Companion calls made / needed**
None made. This is a prioritization call, not a data call. Recommend `snowflake-dr` post-pilot week 2 to validate the single acceptance criterion against actual KAM activity logs, and `superleap-pm` to confirm the Daily Call List feature has a clean state-transition spec before build starts.

