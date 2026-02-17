# SuperLeap CRM — DAG Design (Data Pipeline)

**Last Updated:** February 10, 2026
**Phase:** 5 (Backend-Driven CRM Design)
**Status:** Design Complete (docs only)

---

## 0. Architecture Overview

```
Google Sheets (Source)
       │
       ▼
  ┌──────────┐     ┌────────────────┐     ┌────────────────┐     ┌──────────┐
  │ Extract  │────▶│ BigQuery       │────▶│ Transform &    │────▶│ Postgres │
  │ (Sheets  │     │ Staging        │     │ Validate       │     │ Serving  │
  │  API)    │     │ (raw, append)  │     │ (dbt / SQL)    │     │ DB       │
  └──────────┘     └────────────────┘     └────────────────┘     └──────────┘
                                                                       │
                                                                       ▼
                                                                  ┌──────────┐
                                                                  │ API      │
                                                                  │ Server   │
                                                                  └──────────┘
                                                                       │
                                                                       ▼
                                                                  ┌──────────┐
                                                                  │ Frontend │
                                                                  │ (Renderer│
                                                                  │  only)   │
                                                                  └──────────┘
```

---

## 1. Preferred Implementation Stack

| Component | Choice | Justification |
|-----------|--------|---------------|
| Source | Google Sheets | V1 operational entry. Low-cost, familiar to ops team. |
| Extract | Google Sheets API v4 | Native auth via service account; supports batch reads. |
| Staging | BigQuery | Cost-effective for append-only staging. Scales to millions of rows. Schema-on-read for raw data. |
| Transform | dbt (BigQuery) | SQL-first transforms, testable, version-controlled. Runs as BQ jobs. |
| Orchestration | **Cloud Composer (managed Airflow)** | GCP-native, handles cron + dependencies + retries + alerting. Dagster was considered but Composer has tighter GCP integration (BQ, Sheets, Cloud SQL) and lower ops overhead for a small team. |
| Serving DB | Cloud SQL (Postgres 15) | Indexed, relational, supports the complex joins needed for dealer-360 and incentive calculations. |
| API | Express.js / Fastify | JSON REST endpoints matching `API_CONTRACTS.md`. |
| Cache | Redis (optional V2) | For dashboard metric snapshots and notification badge counts. |

### Why Composer (Airflow) over Dagster

| Factor | Composer (Airflow) | Dagster |
|--------|-------------------|---------|
| GCP Integration | Native (BQ, GCS, Cloud SQL operators built-in) | Requires custom integrations |
| Team Familiarity | Airflow widely known | Smaller ecosystem |
| Managed Service | Fully managed on GCP | Dagster Cloud or self-host |
| Cost (small team) | ~$300/mo for small env | ~$500/mo Dagster Cloud |
| Maturity | Battle-tested, large community | Newer, growing |
| Verdict | **Selected for V1** | Consider for V2 if asset-based orchestration needed |

---

## 2. Detailed DAG Steps

### 2.1 DAG: `superleap_daily_sync` (runs hourly for calls/visits, daily for others)

```
[1] extract_sheets
       │
       ▼
[2] load_staging_bq
       │
       ▼
[3] validate_staging
       │
       ├── pass ──▶ [4] transform_curated
       │                    │
       │                    ▼
       │              [5] upsert_serving_pg
       │                    │
       │                    ▼
       │              [6] publish_notifications
       │                    │
       │                    ▼
       │              [7] audit_log
       │
       └── fail ──▶ [3a] dead_letter_rows
                          │
                          ▼
                    [3b] alert_data_quality
```

### 2.2 Step Details

#### [1] `extract_sheets` — Extract from Google Sheets

| Attribute | Value |
|-----------|-------|
| Operator | `GoogleSheetsReadOperator` (custom or community) |
| Auth | Service account with `sheets.readonly` scope |
| Inputs | Spreadsheet IDs + tab names from Airflow Variables |
| Outputs | Raw CSV/JSON per tab → GCS bucket `gs://superleap-data/raw/{date}/{tab}.json` |
| Idempotency | Output path includes `{execution_date}`; re-runs overwrite same path |
| Timeout | 5 minutes per tab |
| Retry | 3 retries with exponential backoff (30s, 60s, 120s) |

```python
extract_dealers = GoogleSheetsReadOperator(
    task_id='extract_dealers',
    spreadsheet_id=Variable.get('SUPERLEAP_SHEET_ID'),
    range_='Dealers!A:Z',
    output_path=f'gs://superleap-data/raw/{{{{ ds }}}}/dealers.json',
)
```

#### [2] `load_staging_bq` — Load to BigQuery Staging

| Attribute | Value |
|-----------|-------|
| Operator | `GCSToBigQueryOperator` |
| Target | `superleap_staging.{tab_name}` |
| Write disposition | `WRITE_APPEND` (append-only with `_ingested_at` column) |
| Schema | Auto-detect + explicit `_ingested_at TIMESTAMP`, `_source_file STRING` |
| Partitioning | `_ingested_at` (daily partition) |

```python
load_dealers_staging = GCSToBigQueryOperator(
    task_id='load_dealers_staging',
    bucket='superleap-data',
    source_objects=[f'raw/{{{{ ds }}}}/dealers.json'],
    destination_project_dataset_table='superleap_staging.dealers',
    write_disposition='WRITE_APPEND',
    source_format='NEWLINE_DELIMITED_JSON',
)
```

#### [3] `validate_staging` — Data Quality Checks

| Check Type | Examples |
|-----------|---------|
| **Schema** | All required columns present; data types match |
| **Uniqueness** | `dealer_id` unique within batch (dedup if needed) |
| **Referential** | `kam_user_id` in leads exists in users staging |
| **Range** | `latitude` between -90 and 90; `duration_sec >= 0` |
| **Enum** | `channel IN ('C2B', 'C2D', 'GS')`; `status IN ('Active', 'Won', 'Lost', 'Expired')` |
| **Freshness** | At least 1 row with `_ingested_at` within last 2 hours (for hourly tabs) |
| **Volume** | Row count within 2x of previous day (detect mass deletes or duplicates) |

Implementation: dbt tests + custom SQL assertions.

```sql
-- dbt test: uniqueness
SELECT dealer_id, COUNT(*)
FROM {{ ref('stg_dealers') }}
GROUP BY dealer_id
HAVING COUNT(*) > 1;
-- Expect 0 rows
```

#### [3a] `dead_letter_rows` — Quarantine Failed Rows

| Attribute | Value |
|-----------|-------|
| Table | `superleap_staging.dead_letter` |
| Schema | `table_name, row_data (JSON), error_type, error_message, ingested_at` |
| Purpose | Rows that fail validation are moved here for manual review |
| Alerting | If `dead_letter` count > 10 in a run, trigger PagerDuty alert |

#### [3b] `alert_data_quality` — Alerting

| Channel | Condition |
|---------|-----------|
| Slack `#data-alerts` | Any validation failure |
| PagerDuty | > 10 dead-letter rows OR freshness check failure |
| Email (Admin) | Daily summary of data quality scores |

#### [4] `transform_curated` — Transform & Deduplicate

| Attribute | Value |
|-----------|-------|
| Engine | dbt running on BigQuery |
| Source | `superleap_staging.*` |
| Target | `superleap_curated.*` |
| Strategy | MERGE (upsert by natural key) |
| Dedup | `ROW_NUMBER() OVER (PARTITION BY {natural_key} ORDER BY _ingested_at DESC) = 1` |

Key transforms:

```sql
-- Curated dealers (dedup + type cast)
CREATE OR REPLACE TABLE superleap_curated.dealers AS
SELECT
  dealer_id,
  name,
  code,
  city,
  region,
  CAST(segment AS STRING) AS segment,
  SPLIT(tags, ',') AS tags,
  status,
  kam_user_id,
  tl_user_id,
  CAST(latitude AS FLOAT64) AS latitude,
  CAST(longitude AS FLOAT64) AS longitude,
  CAST(dcf_onboarded AS BOOL) AS dcf_onboarded,
  PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%S', created_at) AS created_at,
  PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%S', updated_at) AS updated_at,
  NULL AS deleted_at
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY dealer_id ORDER BY _ingested_at DESC
  ) AS rn
  FROM superleap_staging.dealers
) WHERE rn = 1;
```

Aggregation tables:

```sql
-- Daily KAM metrics (analytics layer)
CREATE OR REPLACE TABLE superleap_analytics.daily_kam_metrics AS
SELECT
  DATE(l.created_at) AS date,
  l.kam_user_id,
  u.region,
  l.tl_user_id,
  COUNT(*) AS leads_created,
  COUNTIF(l.channel = 'C2B') AS leads_c2b,
  COUNTIF(l.channel = 'C2D') AS leads_c2d,
  COUNTIF(l.channel = 'GS') AS leads_gs,
  COUNTIF(l.stage IN ('Inspection Scheduled', 'Inspection Done', 'Stock-in')) AS inspections,
  COUNTIF(l.stage = 'Stock-in' AND l.status = 'Won') AS stock_ins,
  CURRENT_TIMESTAMP() AS _ingested_at
FROM superleap_curated.leads l
JOIN superleap_curated.users u ON l.kam_user_id = u.user_id
GROUP BY 1, 2, 3, 4;
```

#### [5] `upsert_serving_pg` — Upsert to Postgres

| Attribute | Value |
|-----------|-------|
| Operator | `BigQueryToPostgresOperator` (custom) or `PythonOperator` with `psycopg2` |
| Strategy | `INSERT ... ON CONFLICT (pk) DO UPDATE SET ...` |
| Batch size | 1000 rows per transaction |
| Ordering | Upsert `users` → `teams` → `dealers` → `leads`, `dcf_leads`, `call_events`, `visit_events` (respect FK order) |
| Timeout | 10 minutes per table |

```python
def upsert_dealers():
    rows = bq_client.query("SELECT * FROM superleap_curated.dealers").result()
    with pg_conn.cursor() as cur:
        for batch in chunks(rows, 1000):
            execute_values(cur, """
                INSERT INTO dealers (dealer_id, name, code, ...)
                VALUES %s
                ON CONFLICT (dealer_id) DO UPDATE SET
                  name = EXCLUDED.name,
                  code = EXCLUDED.code,
                  ...
                  updated_at = NOW()
            """, batch)
    pg_conn.commit()
```

#### [6] `publish_notifications` — Generate System Notifications

| Trigger | Notification |
|---------|-------------|
| Lead stage change | "Lead {reg_no} moved to {new_stage}" |
| Visit due today | "Visit scheduled with {dealer_name} today" |
| Payout processed | "Your incentive of ₹{amount} has been processed" |
| DCF disbursal | "DCF loan {loan_id} disbursed — ₹{amount}" |
| Target updated | "Your SI target for {month} updated to {target}" |

Implementation: Compare current vs previous snapshot; insert new notifications.

#### [7] `audit_log` — Pipeline Audit Trail

| Field | Value |
|-------|-------|
| Table | `superleap_staging.pipeline_audit_log` |
| Schema | `run_id, dag_id, task_id, status, rows_extracted, rows_validated, rows_rejected, rows_upserted, started_at, completed_at, error_message` |
| Retention | 365 days |

---

## 3. DAG Schedule

| DAG | Schedule | Tabs Included | SLA |
|-----|----------|---------------|-----|
| `superleap_hourly_sync` | Every hour | `Call_Events`, `Visit_Events` | 15 min |
| `superleap_daily_sync` | 06:00 IST daily | `Dealers`, `Leads`, `DCF_Leads`, `Users`, `Teams` | 30 min |
| `superleap_weekly_targets` | Monday 06:00 IST | `Targets`, `Incentive_Slabs` | 10 min |
| `superleap_daily_aggregation` | 07:00 IST daily | Analytics rollups | 20 min |

---

## 4. Failure Handling

### 4.1 Retry Policy

| Task | Max Retries | Backoff | Timeout |
|------|-------------|---------|---------|
| `extract_sheets` | 3 | Exponential (30s, 60s, 120s) | 5 min |
| `load_staging_bq` | 3 | Exponential (30s, 60s, 120s) | 10 min |
| `validate_staging` | 1 | None | 5 min |
| `transform_curated` | 2 | 60s | 15 min |
| `upsert_serving_pg` | 3 | 60s | 10 min |
| `publish_notifications` | 2 | 30s | 5 min |

### 4.2 Failure Scenarios

| Scenario | Handling |
|----------|----------|
| Sheets API rate limit | Retry with exponential backoff; if persistent, alert and skip tab |
| BQ load failure | Retry; if persistent, the staging table has previous data (no data loss) |
| Validation failure (< 10 rows) | Quarantine bad rows in dead-letter; continue with clean rows |
| Validation failure (> 10 rows) | HALT pipeline; alert PagerDuty; require manual approval to proceed |
| Postgres upsert failure | Retry with smaller batch size; if table-level failure, rollback and alert |
| Postgres connection timeout | Retry 3x; if persistent, write to GCS fallback and alert for manual upsert |
| DAG timeout | Alert; next scheduled run will pick up the delta |

### 4.3 Data Quality Reports

Daily automated report sent to `#data-quality` Slack channel:

```
SuperLeap Data Quality Report — 2026-02-10
==========================================
Tables Synced:    11/11 ✅
Rows Extracted:   125,432
Rows Validated:   125,410 (99.98%)
Rows Rejected:    22 (0.02%)
  - dealers: 0
  - leads: 3 (missing channel)
  - call_events: 15 (future dates)
  - visit_events: 4 (invalid coordinates)
Freshness:        All tables within SLA ✅
Dead Letter:      22 rows (review: https://...)
```

---

## 5. Security

### 5.1 Secrets Management

| Secret | Storage | Access |
|--------|---------|--------|
| Google Sheets service account key | GCP Secret Manager | Composer service account only |
| BigQuery credentials | GCP IAM (workload identity) | Composer, dbt |
| Postgres connection string | GCP Secret Manager | Composer, API server |
| API server JWT signing key | GCP Secret Manager | API server only |

### 5.2 Access Control

| Principal | BigQuery | Postgres | Sheets |
|-----------|----------|----------|--------|
| Composer SA | `staging.*` (read/write), `curated.*` (read/write), `analytics.*` (read/write) | All tables (read/write) | Read-only |
| dbt SA | `staging.*` (read), `curated.*` (read/write), `analytics.*` (read/write) | None | None |
| API server | None (reads Postgres only) | All tables (read-only) | None |
| Admin users | `curated.*` (read), `analytics.*` (read) | Read-only (via pgAdmin) | Read/write |
| KAM/TL users | None | None (via API only) | Data entry only |

### 5.3 PII Masking

| Field | Table | Masking Rule |
|-------|-------|-------------|
| `customer_phone` | `leads`, `dcf_leads` | Hash in BQ analytics layer; cleartext in Postgres (API-level access control) |
| `customer_name` | `leads`, `dcf_leads` | Cleartext in Postgres; masked in BQ analytics (`SUBSTR(name, 1, 2) || '***'`) |
| `pan` | `dcf_leads` | Encrypted at rest in Postgres (`pgcrypto`); never in BQ |
| `email` | `users`, `dealers` | Cleartext in Postgres; hashed in BQ analytics |
| `phone` | `users`, `dealers`, `call_events` | Cleartext in Postgres; last-4-digits only in BQ analytics |

### 5.4 Audit Logs

| Event | Logged To |
|-------|-----------|
| Pipeline run start/end | `pipeline_audit_log` (BQ) |
| Schema changes | dbt manifest + git |
| Config changes (targets, slabs) | `targets` / `incentive_slabs` table `updated_by` + `updated_at` |
| API data access | API server request logs (Cloud Logging) |
| Admin data exports | `admin_action_log` table |
| Impersonation start/end | `admin_action_log` with `action = 'IMPERSONATE'` |

---

## 6. Future Enhancements (V2)

| Enhancement | Description |
|-------------|-------------|
| Real-time events | Replace hourly call/visit sync with Pub/Sub + Cloud Functions for near-real-time |
| CDC from source DB | If CARS24 provides a database instead of Sheets, use Change Data Capture (Debezium) |
| dbt Cloud | Move dbt runs to dbt Cloud for better observability and scheduling |
| Materialized views | Pre-aggregate common queries (dealer-360, KAM dashboard) as Postgres materialized views refreshed every 15 min |
| Data catalog | Implement DataHub or Google Data Catalog for lineage tracking |

---

*End of DAG_DESIGN.md*
