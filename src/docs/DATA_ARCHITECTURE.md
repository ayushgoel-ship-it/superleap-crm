# SuperLeap CRM — Data Architecture

**Last Updated:** February 10, 2026
**Phase:** 5 (Backend-Driven CRM Design)
**Status:** Design Complete (docs only, no code changes)

---

## 0. Design Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| P1 | **IDs are immutable, globally unique, and prefixed** | Format: `{entity}-{region}-{seq}` (e.g., `dealer-ncr-001`). Never reuse or reassign. |
| P2 | **Timestamps in UTC ISO-8601** | All `_at` columns stored as `timestamptz`. Display-layer converts to IST (UTC+05:30). |
| P3 | **Append-only event log** | Calls, visits, lead stage changes, location requests are events. Source rows are never mutated; corrections are new rows with `supersedes_id`. |
| P4 | **Soft-delete only** | `deleted_at IS NULL` is the live-row predicate. Hard deletes are prohibited in the serving layer. |
| P5 | **Frontend is a pure renderer** | All metric values, tile labels, thresholds, and RAG colors come from the API. The frontend never contains business formulas. |
| P6 | **Auditability** | Every mutation carries `created_by`, `updated_by`, `created_at`, `updated_at`. Change history is queryable. |
| P7 | **Idempotent ingestion** | Each source row has a natural key. Re-ingesting the same sheet row produces an upsert, not a duplicate. |
| P8 | **Configuration over code** | Metric definitions, dashboard layouts, slab tables, and gate thresholds live in config tables, not in application code. |

---

## 1. Source Layer — Google Sheets Tab Plan (V1)

In V1, Google Sheets is the operational data entry layer. Each tab maps 1:1 to a staging table in BigQuery.

### 1.1 Tab Inventory

| Tab Name | Owner | Approx Rows | Refresh Cadence | Natural Key |
|----------|-------|-------------|-----------------|-------------|
| `Users` | HR/Admin | ~200 | Weekly | `user_id` |
| `Teams` | HR/Admin | ~20 | Weekly | `team_id` |
| `Dealers` | Ops | ~2,000 | Daily | `dealer_id` |
| `Leads_NGS_GS` | Ops/KAM | ~50,000/mo | Real-time (Form) | `lead_id` |
| `DCF_Leads` | DCF Ops | ~5,000/mo | Daily | `loan_id` |
| `Call_Events` | Telephony/CRM | ~100,000/mo | Hourly | `call_id` |
| `Visit_Events` | Mobile App | ~30,000/mo | Real-time | `visit_id` |
| `Location_Requests` | Mobile App | ~500/mo | Real-time | `request_id` |
| `Targets` | Admin | ~200 | Monthly | `user_id + month` |
| `Incentive_Slabs` | Finance | ~10 | Quarterly | `role + slab_name` |
| `Notifications` | System | ~50,000/mo | Real-time | `notification_id` |

### 1.2 Required Columns Per Tab

#### Users
```
user_id | name | email | phone | role (KAM|TL|ADMIN) | team_id | region | 
status (active|inactive) | joined_at | profile_complete (bool) | created_at | updated_at
```

#### Teams
```
team_id | team_name | tl_user_id | region | created_at | updated_at
```

#### Dealers
```
dealer_id | name | code | city | region | segment (A|B|C) | tags (comma-sep) |
status (active|dormant|inactive) | kam_user_id | tl_user_id | 
phone | email | address | latitude | longitude |
dcf_onboarded (bool) | dcf_onboarded_at |
created_at | updated_at | deleted_at
```

#### Leads_NGS_GS
```
lead_id | dealer_id | kam_user_id | tl_user_id |
customer_name | customer_phone | 
reg_no | make | model | year | variant |
channel (NGS|GS) | lead_type (Seller|Inventory) |
stage | sub_stage | status (Active|Won|Lost|Expired) |
expected_revenue | actual_revenue | cep |
city | region |
inspection_date | converted_at |
created_at | updated_at
```

#### DCF_Leads
```
loan_id | dealer_id | kam_user_id | tl_user_id |
customer_name | customer_phone | pan | city |
reg_no | car | car_value |
ltv | loan_amount | roi | tenure | emi |
channel (Dealer Shared|Walk-in|Online) |
rag_status (green|amber|red) | book_flag (Own Book|Pmax) | car_docs_flag (Received|Pending) |
conversion_owner | conversion_email | conversion_phone |
current_funnel | current_sub_stage | overall_status |
first_disbursal_for_dealer (bool) | commission_eligible (bool) |
base_commission | booster_applied (bool) | total_commission |
cibil_score | cibil_date | employment_type | monthly_income |
disbursal_date | utr |
created_at | updated_at
```

#### Call_Events
```
call_id | dealer_id | kam_user_id | tl_user_id | phone |
call_date | call_time | call_start_time | call_end_time | duration_sec |
call_status (ATTEMPTED|CONNECTED|NOT_REACHABLE|BUSY|CALL_BACK) |
outcome (Connected|No Answer|Busy|Left VM) |
is_productive (bool) | productivity_source (AI|KAM|TL) |
recording_status (AVAILABLE|NOT_AVAILABLE) | recording_url |
transcript | sentiment_score | sentiment_label (Positive|Neutral|Negative) |
auto_tags (comma-sep) |
feedback_status (PENDING|SUBMITTED) | feedback_submitted_at |
feedback_call_outcome | feedback_car_sell_discussed (bool) | feedback_car_sell_outcome |
feedback_dcf_discussed (bool) | feedback_dcf_status |
feedback_notes | feedback_follow_up_date |
tl_review_comment | tl_review_flagged (bool) | tl_review_at | tl_reviewer_id |
created_at | updated_at
```

#### Visit_Events
```
visit_id | dealer_id | kam_user_id | tl_user_id |
visit_date | visit_time | visit_type (Planned|Unplanned) |
status (NOT_STARTED|CHECKED_IN|COMPLETED) |
check_in_lat | check_in_lng | check_in_at |
check_out_lat | check_out_lng | completed_at |
duration_sec |
is_productive (bool) | productivity_source (Geofence|KAM|TL) |
outcomes (comma-sep) |
feedback_status (PENDING|SUBMITTED) | feedback_submitted_at |
feedback_meeting_person | feedback_summary | feedback_visit_purpose | feedback_visit_outcome |
feedback_dealer_mood | feedback_inventory_discussed (bool) |
feedback_dcf_discussed (bool) | feedback_dcf_status |
feedback_notes | feedback_follow_up_date |
created_at | updated_at
```

#### Targets
```
target_id | user_id | role | month (YYYY-MM) |
si_target | call_target | visit_target |
input_score_gate | quality_score_gate |
created_at | updated_at | updated_by
```

---

## 2. Canonical Data Model (Entities & Relationships)

### 2.1 Entity-Relationship Diagram (textual)

```
                    ┌──────────┐
                    │  teams   │
                    │  (team)  │
                    └────┬─────┘
                         │ 1:N
              ┌──────────┴──────────┐
              │                     │
         ┌────┴─────┐         ┌────┴─────┐
         │  users   │         │  users   │
         │  (TL)    │         │  (KAM)   │
         └────┬─────┘         └────┬─────┘
              │ 1:N                │ 1:N
              │                    │
         ┌────┴────────────────────┴─────┐
         │          dealers              │
         └───┬──────┬──────┬──────┬──────┘
             │      │      │      │
          1:N│   1:N│   1:N│   1:N│
             │      │      │      │
      ┌──────┴┐  ┌──┴───┐ ┌┴─────┐ ┌┴──────────────┐
      │ leads │  │calls │ │visits│ │dcf_leads      │
      └───────┘  └──────┘ └──────┘ └───────────────┘
                                         │ 1:N
                                    ┌────┴──────────┐
                                    │dcf_timeline   │
                                    │events         │
                                    └───────────────┘

      ┌────────────────┐    ┌──────────────────┐
      │location_requests│    │  notifications   │
      │  (dealer)       │    │  (user)          │
      └────────────────┘    └──────────────────┘

      ┌──────────────┐    ┌────────────────────┐
      │  targets     │    │ metric_definitions │
      │  (user+month)│    │ (config)           │
      └──────────────┘    └────────────────────┘
```

### 2.2 Key Relationships

| Parent | Child | Cardinality | FK Column |
|--------|-------|-------------|-----------|
| `teams` | `users` | 1:N | `users.team_id` |
| `users` (KAM) | `dealers` | 1:N | `dealers.kam_user_id` |
| `users` (TL) | `dealers` | 1:N | `dealers.tl_user_id` |
| `dealers` | `leads` | 1:N | `leads.dealer_id` |
| `dealers` | `call_events` | 1:N | `call_events.dealer_id` |
| `dealers` | `visit_events` | 1:N | `visit_events.dealer_id` |
| `dealers` | `dcf_leads` | 1:N | `dcf_leads.dealer_id` |
| `dealers` | `location_requests` | 1:N | `location_requests.dealer_id` |
| `users` (KAM) | `call_events` | 1:N | `call_events.kam_user_id` |
| `users` (KAM) | `visit_events` | 1:N | `visit_events.kam_user_id` |
| `users` (KAM) | `leads` | 1:N | `leads.kam_user_id` |
| `dcf_leads` | `dcf_timeline_events` | 1:N | `dcf_timeline_events.loan_id` |
| `users` | `notifications` | 1:N | `notifications.user_id` |
| `users` | `targets` | 1:N (per month) | `targets.user_id` |

---

## 3. Serving DB Schema (PostgreSQL)

### 3.1 Core Tables

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  user_id       TEXT PRIMARY KEY,           -- e.g., 'kam-ncr-01'
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL CHECK (role IN ('KAM', 'TL', 'ADMIN')),
  team_id       TEXT REFERENCES teams(team_id),
  region        TEXT NOT NULL,              -- NCR, West, South, East
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ                -- soft delete
);

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
  team_id       TEXT PRIMARY KEY,           -- e.g., 'team-ncr-01'
  team_name     TEXT NOT NULL,
  tl_user_id    TEXT NOT NULL REFERENCES users(user_id),
  region        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEALERS
-- ============================================================
CREATE TABLE dealers (
  dealer_id     TEXT PRIMARY KEY,           -- e.g., 'dealer-ncr-001'
  name          TEXT NOT NULL,
  code          TEXT UNIQUE NOT NULL,       -- e.g., 'DR080433'
  city          TEXT NOT NULL,
  region        TEXT NOT NULL,
  segment       TEXT NOT NULL CHECK (segment IN ('A', 'B', 'C')),
  tags          TEXT[] NOT NULL DEFAULT '{}', -- array of tags
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'dormant', 'inactive')),
  kam_user_id   TEXT NOT NULL REFERENCES users(user_id),
  tl_user_id    TEXT NOT NULL REFERENCES users(user_id),
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  latitude      NUMERIC(10, 7),
  longitude     NUMERIC(10, 7),
  dcf_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  dcf_onboarded_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ                -- soft delete
);

-- ============================================================
-- LEADS (NGS / GS)
-- ============================================================
CREATE TABLE leads (
  lead_id       TEXT PRIMARY KEY,           -- e.g., 'lead-ncr-001'
  dealer_id     TEXT NOT NULL REFERENCES dealers(dealer_id),
  kam_user_id   TEXT NOT NULL REFERENCES users(user_id),
  tl_user_id    TEXT NOT NULL REFERENCES users(user_id),
  
  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Vehicle
  reg_no        TEXT,
  make          TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INT,
  variant       TEXT,
  
  -- Business
  channel       TEXT NOT NULL CHECK (channel IN ('NGS', 'GS')),
  lead_type     TEXT NOT NULL CHECK (lead_type IN ('Seller', 'Inventory')),
  stage         TEXT NOT NULL,              -- PR, PLL, Inspection Scheduled, Stock-in, etc.
  sub_stage     TEXT,
  status        TEXT NOT NULL DEFAULT 'Active'
                  CHECK (status IN ('Active', 'Won', 'Lost', 'Expired')),
  
  -- Financial
  expected_revenue NUMERIC(12, 2) DEFAULT 0,
  actual_revenue   NUMERIC(12, 2) DEFAULT 0,
  cep            NUMERIC(12, 2),           -- Customer Expected Price
  
  -- Location
  city          TEXT,
  region        TEXT NOT NULL,
  
  -- Dates
  inspection_date TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- DCF LEADS (Dealer Car Finance)
-- ============================================================
CREATE TABLE dcf_leads (
  loan_id       TEXT PRIMARY KEY,           -- e.g., 'dcf-ncr-001'
  dealer_id     TEXT NOT NULL REFERENCES dealers(dealer_id),
  kam_user_id   TEXT NOT NULL REFERENCES users(user_id),
  tl_user_id    TEXT NOT NULL REFERENCES users(user_id),
  
  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  pan           TEXT,
  city          TEXT,
  
  -- Vehicle
  reg_no        TEXT,
  car           TEXT NOT NULL,              -- e.g., 'Maruti Swift 2019'
  car_value     NUMERIC(12, 2),
  
  -- Loan
  ltv           NUMERIC(5, 2),             -- Loan-to-Value %
  loan_amount   NUMERIC(12, 2),
  roi           NUMERIC(5, 2),             -- Rate of Interest %
  tenure        INT,                        -- months
  emi           NUMERIC(12, 2),
  
  -- Channel
  channel       TEXT CHECK (channel IN ('Dealer Shared', 'Walk-in', 'Online')),
  
  -- Status
  rag_status    TEXT NOT NULL DEFAULT 'green'
                  CHECK (rag_status IN ('green', 'amber', 'red')),
  book_flag     TEXT CHECK (book_flag IN ('Own Book', 'Pmax')),
  car_docs_flag TEXT CHECK (car_docs_flag IN ('Received', 'Pending')),
  
  -- Conversion
  conversion_owner TEXT,
  conversion_email TEXT,
  conversion_phone TEXT,
  
  -- Funnel
  current_funnel    TEXT NOT NULL,          -- Onboarding, CIBIL Check, Doc Collection, etc.
  current_sub_stage TEXT,
  overall_status    TEXT NOT NULL,          -- IN_PROGRESS, DISBURSED, REJECTED, etc.
  
  -- Commission
  first_disbursal_for_dealer BOOLEAN DEFAULT FALSE,
  commission_eligible        BOOLEAN DEFAULT FALSE,
  base_commission            NUMERIC(12, 2) DEFAULT 0,
  booster_applied            BOOLEAN DEFAULT FALSE,
  total_commission           NUMERIC(12, 2) DEFAULT 0,
  
  -- Financials
  cibil_score       INT,
  employment_type   TEXT,
  monthly_income    NUMERIC(12, 2),
  
  -- Disbursal
  disbursal_date    TIMESTAMPTZ,
  utr               TEXT,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- DCF TIMELINE EVENTS
-- ============================================================
CREATE TABLE dcf_timeline_events (
  event_id      TEXT PRIMARY KEY,
  loan_id       TEXT NOT NULL REFERENCES dcf_leads(loan_id),
  event_type    TEXT NOT NULL CHECK (event_type IN (
                  'created', 'status_change', 'funnel_change',
                  'cibil_check', 'doc_upload', 'disbursed', 'comment')),
  description   TEXT NOT NULL,
  actor         TEXT,                       -- user_id of who performed action
  details       JSONB,                      -- flexible key-value
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CALL EVENTS
-- ============================================================
CREATE TABLE call_events (
  call_id       TEXT PRIMARY KEY,           -- e.g., 'call-1707500000-001'
  dealer_id     TEXT NOT NULL REFERENCES dealers(dealer_id),
  kam_user_id   TEXT NOT NULL REFERENCES users(user_id),
  tl_user_id    TEXT NOT NULL REFERENCES users(user_id),
  phone         TEXT NOT NULL,
  
  -- Timing
  call_date     DATE NOT NULL,
  call_time     TEXT,                       -- HH:MM display
  call_start_time TIMESTAMPTZ,
  call_end_time   TIMESTAMPTZ,
  duration_sec    INT,
  
  -- Status & Outcome
  call_status   TEXT NOT NULL DEFAULT 'ATTEMPTED'
                  CHECK (call_status IN ('ATTEMPTED', 'CONNECTED', 'NOT_REACHABLE', 'BUSY', 'CALL_BACK')),
  outcome       TEXT CHECK (outcome IN ('Connected', 'No Answer', 'Busy', 'Left VM')),
  
  -- Productivity
  is_productive       BOOLEAN NOT NULL DEFAULT FALSE,
  productivity_source TEXT CHECK (productivity_source IN ('AI', 'KAM', 'TL')),
  
  -- Recording & Analysis
  recording_status TEXT DEFAULT 'NOT_AVAILABLE'
                     CHECK (recording_status IN ('AVAILABLE', 'NOT_AVAILABLE')),
  recording_url    TEXT,
  transcript       TEXT,
  sentiment_score  NUMERIC(5, 2),          -- 0-100
  sentiment_label  TEXT CHECK (sentiment_label IN ('Positive', 'Neutral', 'Negative')),
  auto_tags        TEXT[],
  
  -- Feedback
  feedback_status TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (feedback_status IN ('PENDING', 'SUBMITTED')),
  feedback_submitted_at TIMESTAMPTZ,
  feedback_data   JSONB,                    -- structured feedback payload
  
  -- TL Review
  tl_review       JSONB,                    -- {comment, flagged, reviewed_at, tl_id}
  
  -- Metadata
  kam_comments    TEXT,
  follow_up_tasks TEXT[],
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VISIT EVENTS
-- ============================================================
CREATE TABLE visit_events (
  visit_id      TEXT PRIMARY KEY,           -- e.g., 'visit-1707500000-001'
  dealer_id     TEXT NOT NULL REFERENCES dealers(dealer_id),
  kam_user_id   TEXT NOT NULL REFERENCES users(user_id),
  tl_user_id    TEXT NOT NULL REFERENCES users(user_id),
  
  -- Timing
  visit_date    DATE NOT NULL,
  visit_time    TEXT,
  visit_type    TEXT NOT NULL CHECK (visit_type IN ('Planned', 'Unplanned')),
  status        TEXT NOT NULL DEFAULT 'NOT_STARTED'
                  CHECK (status IN ('NOT_STARTED', 'CHECKED_IN', 'COMPLETED')),
  
  -- Location
  check_in_lat  NUMERIC(10, 7),
  check_in_lng  NUMERIC(10, 7),
  check_in_at   TIMESTAMPTZ,
  check_out_lat NUMERIC(10, 7),
  check_out_lng NUMERIC(10, 7),
  completed_at  TIMESTAMPTZ,
  duration_sec  INT,
  
  -- Geofence
  distance_from_dealer INT,                -- meters
  is_within_geofence   BOOLEAN,
  
  -- Productivity
  is_productive       BOOLEAN NOT NULL DEFAULT FALSE,
  productivity_source TEXT CHECK (productivity_source IN ('Geofence', 'KAM', 'TL')),
  outcomes            TEXT[],
  
  -- Feedback
  feedback_status TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (feedback_status IN ('PENDING', 'SUBMITTED')),
  feedback_submitted_at TIMESTAMPTZ,
  feedback_data   JSONB,                    -- structured feedback payload
  
  -- Metadata
  kam_comments    TEXT,
  follow_up_tasks TEXT[],
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LOCATION CHANGE REQUESTS
-- ============================================================
CREATE TABLE location_requests (
  request_id    TEXT PRIMARY KEY,
  dealer_id     TEXT NOT NULL REFERENCES dealers(dealer_id),
  requested_by  TEXT NOT NULL REFERENCES users(user_id),
  
  old_lat       NUMERIC(10, 7),
  old_lng       NUMERIC(10, 7),
  new_lat       NUMERIC(10, 7) NOT NULL,
  new_lng       NUMERIC(10, 7) NOT NULL,
  
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  decided_at    TIMESTAMPTZ,
  decided_by    TEXT REFERENCES users(user_id),
  rejection_reason TEXT,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  notification_id TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(user_id),
  type          TEXT NOT NULL,              -- lead_update, visit_reminder, payout, etc.
  priority      TEXT NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  title         TEXT NOT NULL,
  body          TEXT,
  data          JSONB,                      -- {lead_id, dealer_id, action_url, etc.}
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TARGETS (monthly per user)
-- ============================================================
CREATE TABLE targets (
  target_id     TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(user_id),
  role          TEXT NOT NULL CHECK (role IN ('KAM', 'TL')),
  month         TEXT NOT NULL,              -- 'YYYY-MM'
  
  si_target     INT NOT NULL DEFAULT 0,
  call_target   INT NOT NULL DEFAULT 0,
  visit_target  INT NOT NULL DEFAULT 0,
  input_score_gate  NUMERIC(5, 2) DEFAULT 75,
  quality_score_gate NUMERIC(5, 2) DEFAULT 80,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    TEXT REFERENCES users(user_id),
  
  UNIQUE (user_id, month)
);

-- ============================================================
-- INCENTIVE SLABS (config)
-- ============================================================
CREATE TABLE incentive_slabs (
  slab_id       TEXT PRIMARY KEY,
  role          TEXT NOT NULL CHECK (role IN ('KAM', 'TL')),
  slab_name     TEXT NOT NULL,              -- e.g., '100-109%', '110%+'
  min_percent   NUMERIC(5, 2) NOT NULL,
  max_percent   NUMERIC(5, 2),             -- NULL = unbounded
  rate_per_si   NUMERIC(10, 2) NOT NULL,   -- e.g., 1000, 1500
  description   TEXT,
  effective_from DATE NOT NULL,
  effective_to   DATE,                      -- NULL = still active
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- METRIC DEFINITIONS (config) — see METRICS_CONFIG_SYSTEM.md
-- ============================================================
CREATE TABLE metric_definitions (
  metric_key    TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL,
  unit          TEXT NOT NULL DEFAULT 'count',
  calc_type     TEXT NOT NULL CHECK (calc_type IN (
                  'count', 'sum', 'avg', 'ratio', 'percent', 'custom_sql')),
  sql_template  TEXT NOT NULL,
  dimensions_allowed TEXT[] DEFAULT '{}',
  filters_allowed    TEXT[] DEFAULT '{}',
  default_time_scope TEXT DEFAULT 'mtd',
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DASHBOARD LAYOUT (config)
-- ============================================================
CREATE TABLE dashboard_layouts (
  layout_id     TEXT PRIMARY KEY,
  dashboard_key TEXT NOT NULL,              -- e.g., 'kam_home', 'tl_home'
  role          TEXT NOT NULL,
  tiles         JSONB NOT NULL,             -- array of tile configs
  version       INT NOT NULL DEFAULT 1,
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2 Top Indexes (aligned to app queries)

```sql
-- ============================================================
-- INDEX PLAN (15+ indexes aligned to APP_FLOWS queries)
-- ============================================================

-- IDX-01: Dealers by KAM (Dealers list, Home dashboard)
CREATE INDEX idx_dealers_kam ON dealers(kam_user_id) WHERE deleted_at IS NULL;

-- IDX-02: Dealers by TL (TL team view)
CREATE INDEX idx_dealers_tl ON dealers(tl_user_id) WHERE deleted_at IS NULL;

-- IDX-03: Dealers by region + status (Admin filters)
CREATE INDEX idx_dealers_region_status ON dealers(region, status) WHERE deleted_at IS NULL;

-- IDX-04: Dealers by segment (filter on DealersPage)
CREATE INDEX idx_dealers_segment ON dealers(segment) WHERE deleted_at IS NULL;

-- IDX-05: Leads by dealer (DealerDetail leads section)
CREATE INDEX idx_leads_dealer ON leads(dealer_id, created_at DESC) WHERE deleted_at IS NULL;

-- IDX-06: Leads by KAM + channel (LeadsPageV3 filters)
CREATE INDEX idx_leads_kam_channel ON leads(kam_user_id, channel, created_at DESC) WHERE deleted_at IS NULL;

-- IDX-07: Leads by status (LeadsPageV3 status filter)
CREATE INDEX idx_leads_status ON leads(status, stage) WHERE deleted_at IS NULL;

-- IDX-08: Call events by KAM + date (VisitsPage calls tab, today/last-7d)
CREATE INDEX idx_calls_kam_date ON call_events(kam_user_id, call_date DESC);

-- IDX-09: Call events by dealer (DealerDetail activity)
CREATE INDEX idx_calls_dealer ON call_events(dealer_id, call_date DESC);

-- IDX-10: Call events by TL + date (TL call review)
CREATE INDEX idx_calls_tl_date ON call_events(tl_user_id, call_date DESC);

-- IDX-11: Call events feedback pending (KAM pending feedback list)
CREATE INDEX idx_calls_feedback_pending ON call_events(kam_user_id, feedback_status)
  WHERE feedback_status = 'PENDING';

-- IDX-12: Visit events by KAM + date (VisitsPage visits tab)
CREATE INDEX idx_visits_kam_date ON visit_events(kam_user_id, visit_date DESC);

-- IDX-13: Visit events by dealer (DealerDetail activity)
CREATE INDEX idx_visits_dealer ON visit_events(dealer_id, visit_date DESC);

-- IDX-14: DCF leads by dealer (DCF dealer detail)
CREATE INDEX idx_dcf_dealer ON dcf_leads(dealer_id, created_at DESC) WHERE deleted_at IS NULL;

-- IDX-15: DCF leads by KAM + status (DCF hub, funnel filters)
CREATE INDEX idx_dcf_kam_status ON dcf_leads(kam_user_id, rag_status, overall_status)
  WHERE deleted_at IS NULL;

-- IDX-16: Notifications by user + unread (bell badge count)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- IDX-17: Location requests by dealer + status (pending approvals)
CREATE INDEX idx_loc_req_status ON location_requests(dealer_id, status)
  WHERE status = 'PENDING';

-- IDX-18: Targets by user + month (incentive calc)
CREATE INDEX idx_targets_user_month ON targets(user_id, month);

-- IDX-19: DCF timeline by loan (lead detail timeline)
CREATE INDEX idx_dcf_timeline_loan ON dcf_timeline_events(loan_id, timestamp DESC);
```

---

## 4. Optional Analytics Model (BigQuery)

For future dashboards, org-wide analytics, and data science workloads.

### 4.1 Staging vs Curated

| Layer | Dataset | Purpose | Retention |
|-------|---------|---------|-----------|
| **Staging** | `superleap_staging` | Raw sheet data, 1:1 with tabs, append-only with `_ingested_at` | 90 days |
| **Curated** | `superleap_curated` | Cleaned, deduplicated, typed. Matches Postgres schema. | Indefinite |
| **Analytics** | `superleap_analytics` | Pre-aggregated rollups (daily/weekly/monthly by KAM, TL, region) | Indefinite |

### 4.2 Key Analytical Tables

```
-- Curated layer (mirrors Postgres)
superleap_curated.dealers
superleap_curated.leads
superleap_curated.dcf_leads
superleap_curated.call_events
superleap_curated.visit_events

-- Analytics layer (pre-aggregated)
superleap_analytics.daily_kam_metrics     -- one row per KAM per day
superleap_analytics.daily_dealer_metrics  -- one row per dealer per day
superleap_analytics.monthly_incentive_snapshot -- one row per user per month
superleap_analytics.dcf_funnel_daily      -- funnel stage counts per day
```

### 4.3 daily_kam_metrics Schema

```sql
CREATE TABLE superleap_analytics.daily_kam_metrics (
  date            DATE,
  kam_user_id     STRING,
  region          STRING,
  tl_user_id      STRING,
  
  -- Lead metrics
  leads_created   INT64,
  leads_c2b       INT64,
  leads_c2d       INT64,
  leads_gs        INT64,
  inspections     INT64,
  stock_ins       INT64,
  
  -- Activity metrics
  calls_total     INT64,
  calls_productive INT64,
  calls_connected INT64,
  visits_total    INT64,
  visits_productive INT64,
  visits_planned  INT64,
  
  -- DCF metrics
  dcf_leads_created INT64,
  dcf_disbursed     INT64,
  dcf_gmv           NUMERIC,
  
  -- Computed
  i2si            FLOAT64,
  call_productivity_rate FLOAT64,
  visit_productivity_rate FLOAT64,
  
  _ingested_at    TIMESTAMP
);
```

---

*End of DATA_ARCHITECTURE.md*
