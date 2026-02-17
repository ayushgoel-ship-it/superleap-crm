# Verification: Config-Driven Dashboard

**Phase:** 6A
**Purpose:** Prove that dashboard metrics, labels, calculation logic, and tile
ordering can all be changed purely via SQL updates — no frontend code changes.

---

## 0. Pre-Requisites

Run all migrations in order, then seed:

```bash
# Migrations (in order)
psql $DATABASE_URL -f migrations/001_create_teams.sql
psql $DATABASE_URL -f migrations/002_create_users.sql
psql $DATABASE_URL -f migrations/003_add_deferred_fks.sql
psql $DATABASE_URL -f migrations/004_create_dealers.sql
psql $DATABASE_URL -f migrations/005_create_leads.sql
psql $DATABASE_URL -f migrations/006_create_dcf_tables.sql
psql $DATABASE_URL -f migrations/007_create_call_events.sql
psql $DATABASE_URL -f migrations/008_create_visit_events.sql
psql $DATABASE_URL -f migrations/009_create_support_tables.sql
psql $DATABASE_URL -f migrations/010_create_metric_definitions.sql
psql $DATABASE_URL -f migrations/011_create_dashboard_layouts.sql
psql $DATABASE_URL -f migrations/012_create_audit_log.sql
psql $DATABASE_URL -f migrations/013_create_indexes.sql

# Seeds
psql $DATABASE_URL -f seed/metrics.sql
psql $DATABASE_URL -f seed/dashboards.sql
```

---

## 1. Verify Schema Completeness

### 1.1 Table Count

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables (14):**
- `audit_log`
- `call_events`
- `dashboard_layouts`
- `dcf_leads`
- `dcf_timeline_events`
- `dealers`
- `incentive_slabs`
- `leads`
- `location_requests`
- `metric_definitions`
- `notifications`
- `targets`
- `teams`
- `users`
- `visit_events`

### 1.2 Index Count

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;
```

**Expected: 21 indexes** (19 from DATA_ARCHITECTURE + 2 audit_log indexes)

### 1.3 Foreign Key Integrity

```sql
SELECT
  tc.constraint_name,
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;
```

### 1.4 Seed Data Verification

```sql
-- Metric definitions: expect 26 rows
SELECT COUNT(*) AS metric_count FROM metric_definitions;

-- Dashboard layouts: expect 3 rows
SELECT layout_id, dashboard_key, role, display_name,
       jsonb_array_length(tiles) AS tile_count
FROM dashboard_layouts
ORDER BY layout_id;

-- All metric_keys referenced by dashboards exist in metric_definitions
SELECT DISTINCT elem->>'metric_key' AS referenced_metric
FROM dashboard_layouts,
     jsonb_array_elements(tiles) AS elem
WHERE NOT EXISTS (
  SELECT 1 FROM metric_definitions
  WHERE metric_key = elem->>'metric_key'
);
-- Expected: 0 rows (no orphan references)
```

---

## 2. Verification: Rename a Metric (No Code Change)

**Scenario:** Rename "Stock-Ins (SI)" to "Cars Stocked In"

```sql
-- BEFORE
SELECT metric_key, display_name FROM metric_definitions
WHERE metric_key = 'si_achievement';
-- → 'Stock-Ins (SI)'

-- CHANGE
UPDATE metric_definitions
SET display_name = 'Cars Stocked In',
    updated_at = NOW(),
    updated_by = 'admin-01'
WHERE metric_key = 'si_achievement';

-- AFTER
SELECT metric_key, display_name FROM metric_definitions
WHERE metric_key = 'si_achievement';
-- → 'Cars Stocked In'

-- REVERT
UPDATE metric_definitions
SET display_name = 'Stock-Ins (SI)',
    updated_at = NOW(),
    updated_by = 'admin-01'
WHERE metric_key = 'si_achievement';
```

**Proof:** The frontend calls `GET /v1/dashboard/home`. The API fetches
`display_name` from `metric_definitions`. The frontend renders whatever label
the API returns. No frontend code references the string "Stock-Ins (SI)".

---

## 3. Verification: Change Calculation Logic (No Code Change)

**Scenario:** I2SI should only count inspections that actually occurred (not just
scheduled).

```sql
-- BEFORE
SELECT metric_key, sql_template FROM metric_definitions
WHERE metric_key = 'i2si';
-- → includes 'Inspection Scheduled'

-- CHANGE
UPDATE metric_definitions
SET sql_template = 'SELECT ROUND(
  CAST(COUNT(CASE WHEN stage = ''Stock-in'' AND status = ''Won'' THEN 1 END) AS NUMERIC) /
  NULLIF(COUNT(CASE WHEN stage IN (''Inspection Done'', ''Stock-in'') THEN 1 END), 0) * 100, 1)
  FROM leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date',
    updated_at = NOW(),
    updated_by = 'admin-01'
WHERE metric_key = 'i2si';

-- AFTER
SELECT metric_key, sql_template FROM metric_definitions
WHERE metric_key = 'i2si';
-- → 'Inspection Scheduled' removed from SQL

-- REVERT
UPDATE metric_definitions
SET sql_template = 'SELECT ROUND(CAST(COUNT(CASE WHEN stage = ''Stock-in'' AND status = ''Won'' THEN 1 END) AS NUMERIC) / NULLIF(COUNT(CASE WHEN stage IN (''Inspection Scheduled'', ''Inspection Done'', ''Stock-in'') THEN 1 END), 0) * 100, 1) FROM leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date',
    updated_at = NOW(),
    updated_by = 'admin-01'
WHERE metric_key = 'i2si';
```

**Proof:** The API server executes `sql_template` at request time. Changing the
template changes the calculation. No frontend code contains any formula.

---

## 4. Verification: Reorder Dashboard Tiles (No Code Change)

**Scenario:** Swap positions of "I2SI %" (position 5) and "Input Score"
(position 6) on the KAM Home dashboard.

```sql
-- BEFORE
SELECT elem->>'tile_id' AS tile_id,
       (elem->>'position')::int AS position
FROM dashboard_layouts,
     jsonb_array_elements(tiles) AS elem
WHERE layout_id = 'layout-kam-home-v1'
ORDER BY (elem->>'position')::int;

-- CHANGE: swap positions 5 ↔ 6
UPDATE dashboard_layouts
SET tiles = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'tile_id' = 'tile-i2si'
        THEN jsonb_set(elem, '{position}', '6')
      WHEN elem->>'tile_id' = 'tile-input-score'
        THEN jsonb_set(elem, '{position}', '5')
      ELSE elem
    END ORDER BY (elem->>'position')::int
  )
  FROM jsonb_array_elements(tiles) AS elem
),
    updated_at = NOW(),
    updated_by = 'admin-01'
WHERE layout_id = 'layout-kam-home-v1';

-- AFTER
SELECT elem->>'tile_id' AS tile_id,
       (elem->>'position')::int AS position
FROM dashboard_layouts,
     jsonb_array_elements(tiles) AS elem
WHERE layout_id = 'layout-kam-home-v1'
ORDER BY (elem->>'position')::int;
-- tile-input-score → 5, tile-i2si → 6

-- REVERT
UPDATE dashboard_layouts
SET tiles = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'tile_id' = 'tile-i2si'
        THEN jsonb_set(elem, '{position}', '5')
      WHEN elem->>'tile_id' = 'tile-input-score'
        THEN jsonb_set(elem, '{position}', '6')
      ELSE elem
    END ORDER BY (elem->>'position')::int
  )
  FROM jsonb_array_elements(tiles) AS elem
),
    updated_at = NOW(),
    updated_by = 'admin-01'
WHERE layout_id = 'layout-kam-home-v1';
```

**Proof:** The frontend reads the `tiles` array from the API response and
renders in `position` order. Changing position values changes the render order.
No frontend code hardcodes tile positions.

---

## 5. Verification: Add a New Tile (No Code Change)

**Scenario:** Add "DCF GMV" tile to KAM Home dashboard as tile #9.

```sql
-- The metric already exists
SELECT metric_key, display_name FROM metric_definitions
WHERE metric_key = 'dcf_gmv';
-- → 'DCF GMV'

-- Add tile
UPDATE dashboard_layouts
SET tiles = tiles || '[{
  "tile_id": "tile-dcf-gmv",
  "metric_key": "dcf_gmv",
  "position": 9,
  "size": "small",
  "type": "currency",
  "action": {"type": "navigate", "target": "dcf"}
}]'::jsonb,
    updated_at = NOW(),
    updated_by = 'admin-01'
WHERE layout_id = 'layout-kam-home-v1';

-- Verify
SELECT jsonb_array_length(tiles) AS tile_count
FROM dashboard_layouts
WHERE layout_id = 'layout-kam-home-v1';
-- → 9
```

---

## 6. Verification: Disable a Metric (No Code Change)

**Scenario:** Deprecate the "Geofence Compliance" metric.

```sql
UPDATE metric_definitions
SET enabled = FALSE,
    deprecated_at = NOW(),
    updated_at = NOW(),
    updated_by = 'admin-01'
WHERE metric_key = 'geofence_compliance';

-- API server query (simplified):
-- SELECT * FROM metric_definitions WHERE enabled = true;
-- → geofence_compliance excluded
-- → Dashboard tiles referencing it are skipped by API server
```

---

## 7. Verification: Change RAG Thresholds (No Code Change)

**Scenario:** Make I2SI "green" require 70% instead of 60%.

```sql
-- BEFORE
SELECT metric_key, rag_thresholds FROM metric_definitions
WHERE metric_key = 'i2si';
-- → {"green_min": 60, "amber_min": 40}

-- CHANGE
UPDATE metric_definitions
SET rag_thresholds = '{"green_min": 70, "amber_min": 45}',
    updated_at = NOW(),
    updated_by = 'admin-01'
WHERE metric_key = 'i2si';

-- AFTER
SELECT metric_key, rag_thresholds FROM metric_definitions
WHERE metric_key = 'i2si';
-- → {"green_min": 70, "amber_min": 45}
```

---

## 8. Frontend Dependency Scan

To confirm zero frontend dependency on metric labels, formulas, or tile positions:

```bash
# Search for hardcoded metric labels in frontend
grep -r "Stock-Ins" components/ pages/ --include="*.tsx" --include="*.ts"
# Expected: 0 matches (labels come from API)

# Search for hardcoded SQL or formulas
grep -r "COUNT.*leads.*Stock-in" components/ pages/ --include="*.tsx" --include="*.ts"
# Expected: 0 matches (formulas live in metric_definitions.sql_template)

# Search for hardcoded tile positions
grep -r "position.*[0-9].*tile" components/ pages/ --include="*.tsx" --include="*.ts"
# Expected: 0 matches (positions come from dashboard_layouts.tiles)
```

---

## 9. Summary

| Operation | Changed | Not Changed |
|-----------|---------|-------------|
| Rename metric | `metric_definitions.display_name` | Frontend code |
| Change formula | `metric_definitions.sql_template` | Frontend code |
| Change RAG thresholds | `metric_definitions.rag_thresholds` | Frontend code |
| Reorder tiles | `dashboard_layouts.tiles[].position` | Frontend code |
| Add new tile | `dashboard_layouts.tiles` (append) | Frontend code |
| Remove tile | `dashboard_layouts.tiles` (filter) | Frontend code |
| Disable metric | `metric_definitions.enabled` | Frontend code |
| A/B test layout | New `dashboard_layouts` row | Frontend code |

**Conclusion:** All 8 common dashboard changes are achievable via SQL updates to
`metric_definitions` and `dashboard_layouts`. The frontend is a pure renderer
(P5) and the system is configuration-over-code (P8).

---

*End of CONFIG_DRIVEN_DASHBOARD.md*
