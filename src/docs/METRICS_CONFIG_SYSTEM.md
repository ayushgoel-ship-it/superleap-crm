# SuperLeap CRM — Metrics Configuration System

**Last Updated:** February 10, 2026
**Phase:** 5 (Backend-Driven CRM Design)
**Core Principle:** Metric logic lives in config tables, not in frontend code.

---

## 0. Architecture

```
┌─────────────────────────────────┐
│     metric_definitions          │  ← What to calculate
│     (metric_key, sql_template,  │
│      display_name, unit, ...)   │
└────────────┬────────────────────┘
             │ referenced by
             ▼
┌─────────────────────────────────┐
│     dashboard_layouts           │  ← Where to show it
│     (dashboard_key, role,       │
│      tiles: [{metric_key, ...}])│
└────────────┬────────────────────┘
             │ consumed by
             ▼
┌─────────────────────────────────┐
│     API Server                  │  ← Executes SQL, returns values
│     GET /v1/dashboard/home      │
└────────────┬────────────────────┘
             │ renders
             ▼
┌─────────────────────────────────┐
│     Frontend (pure renderer)    │  ← No formulas, no hardcoded labels
└─────────────────────────────────┘
```

---

## 1. Table: `metric_definitions`

### 1.1 Schema

```sql
CREATE TABLE metric_definitions (
  metric_key        TEXT PRIMARY KEY,             -- e.g., 'si_achievement'
  display_name      TEXT NOT NULL,                -- UI label, e.g., 'Stock-Ins (SI)'
  description       TEXT,                         -- Tooltip / help text
  unit              TEXT NOT NULL DEFAULT 'count', -- count, percent, currency_inr, score_0_100, ratio
  calc_type         TEXT NOT NULL,                -- count, sum, avg, ratio, percent, custom_sql
  
  -- SQL template with named parameters
  -- Bind params: :user_id, :team_id, :start_date, :end_date, :dealer_id, :region
  sql_template      TEXT NOT NULL,
  
  -- Dimension/filter support
  dimensions_allowed TEXT[] DEFAULT '{}',          -- e.g., ['channel', 'region', 'dealer_id']
  filters_allowed    TEXT[] DEFAULT '{}',          -- e.g., ['status', 'segment']
  
  -- Display config
  default_time_scope TEXT DEFAULT 'mtd',           -- d-1, last-7d, mtd, last-30d, last-6m
  rag_thresholds     JSONB,                       -- e.g., {"green_min": 80, "amber_min": 50}
  format_pattern     TEXT,                        -- e.g., '#,##0', '0.0%'
  
  -- Targeting & gates
  has_target         BOOLEAN DEFAULT FALSE,       -- Whether this metric has a target value
  target_source      TEXT,                        -- SQL to fetch target, e.g., 'targets.si_target'
  gate_threshold     NUMERIC,                     -- e.g., 75 for input_score gate
  
  -- Lifecycle
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  deprecated_at     TIMESTAMPTZ,                  -- Soft deprecation
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        TEXT                           -- admin user_id
);
```

### 1.2 Full Metric Definitions Inventory

```sql
INSERT INTO metric_definitions (metric_key, display_name, unit, calc_type, sql_template, dimensions_allowed, default_time_scope, has_target, rag_thresholds) VALUES

-- ===================== SI & LEAD METRICS =====================

('si_achievement', 'Stock-Ins (SI)', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage = ''Stock-in'' AND status = ''Won'' AND converted_at BETWEEN :start_date AND :end_date',
 '{"channel", "region", "dealer_id"}', 'mtd', TRUE,
 '{"green_min": 90, "amber_min": 70}'),

('si_c2b', 'SI — C2B', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage = ''Stock-in'' AND status = ''Won'' AND channel = ''C2B'' AND converted_at BETWEEN :start_date AND :end_date',
 '{"region"}', 'mtd', FALSE, NULL),

('si_c2d', 'SI — C2D', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage = ''Stock-in'' AND status = ''Won'' AND channel = ''C2D'' AND converted_at BETWEEN :start_date AND :end_date',
 '{"region"}', 'mtd', FALSE, NULL),

('si_gs', 'SI — GS', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage = ''Stock-in'' AND status = ''Won'' AND channel = ''GS'' AND converted_at BETWEEN :start_date AND :end_date',
 '{"region"}', 'mtd', FALSE, NULL),

('leads_created', 'Leads Created', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date',
 '{"channel", "dealer_id", "region"}', 'mtd', FALSE,
 '{"green_min": 30, "amber_min": 15}'),

('inspections', 'Inspections', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage IN (''Inspection Scheduled'', ''Inspection Done'', ''Stock-in'') AND inspection_date BETWEEN :start_date AND :end_date',
 '{"channel", "dealer_id"}', 'mtd', FALSE, NULL),

('i2si', 'I2SI %', 'percent', 'ratio',
 'SELECT ROUND(CAST(COUNT(CASE WHEN stage = ''Stock-in'' AND status = ''Won'' THEN 1 END) AS NUMERIC) / NULLIF(COUNT(CASE WHEN stage IN (''Inspection Scheduled'', ''Inspection Done'', ''Stock-in'') THEN 1 END), 0) * 100, 1) FROM leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date',
 '{"channel"}', 'mtd', FALSE,
 '{"green_min": 60, "amber_min": 40}'),

-- ===================== PRODUCTIVITY METRICS =====================

('input_score', 'Input Score', 'score_0_100', 'custom_sql',
 'SELECT LEAST(100, ROUND(((SELECT COUNT(*) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date)::NUMERIC / NULLIF((SELECT call_target FROM targets WHERE user_id = :user_id AND month = :month), 0) * 0.5 + (SELECT COUNT(*) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date)::NUMERIC / NULLIF((SELECT visit_target FROM targets WHERE user_id = :user_id AND month = :month), 0) * 0.5) * 100, 0))',
 '{}', 'mtd', FALSE,
 '{"green_min": 75, "amber_min": 50}'),

('quality_score', 'Quality Score', 'score_0_100', 'custom_sql',
 'SELECT ROUND(((SELECT COUNT(*) FILTER (WHERE is_productive) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date)::NUMERIC / NULLIF((SELECT COUNT(*) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date), 0) * 0.5 + (SELECT COUNT(*) FILTER (WHERE is_productive) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date)::NUMERIC / NULLIF((SELECT COUNT(*) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date), 0) * 0.5) * 100, 0)',
 '{}', 'mtd', FALSE,
 '{"green_min": 80, "amber_min": 60}'),

('calls_total', 'Total Calls', 'count', 'count',
 'SELECT COUNT(*) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', 'mtd', TRUE, NULL),

('calls_productive', 'Productive Calls', 'count', 'count',
 'SELECT COUNT(*) FROM call_events WHERE kam_user_id = :user_id AND is_productive = true AND call_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', 'mtd', FALSE, NULL),

('call_productivity_rate', 'Call Productivity', 'percent', 'ratio',
 'SELECT ROUND(COUNT(*) FILTER (WHERE is_productive)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', 'mtd', FALSE,
 '{"green_min": 70, "amber_min": 50}'),

('visits_total', 'Total Visits', 'count', 'count',
 'SELECT COUNT(*) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', 'mtd', TRUE, NULL),

('visits_productive', 'Productive Visits', 'count', 'count',
 'SELECT COUNT(*) FROM visit_events WHERE kam_user_id = :user_id AND is_productive = true AND visit_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', 'mtd', FALSE, NULL),

('visit_productivity_rate', 'Visit Productivity', 'percent', 'ratio',
 'SELECT ROUND(COUNT(*) FILTER (WHERE is_productive)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', 'mtd', FALSE,
 '{"green_min": 70, "amber_min": 50}'),

('geofence_compliance', 'Geofence Compliance', 'percent', 'ratio',
 'SELECT ROUND(COUNT(*) FILTER (WHERE is_within_geofence)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) FROM visit_events WHERE kam_user_id = :user_id AND status = ''COMPLETED'' AND visit_date BETWEEN :start_date AND :end_date',
 '{}', 'mtd', FALSE,
 '{"green_min": 85, "amber_min": 70}'),

-- ===================== INCENTIVE METRICS =====================

('projected_earnings', 'Projected Earnings', 'currency_inr', 'custom_sql',
 'SELECT calculate_projected_incentive(:user_id, :month)',
 '{}', 'mtd', FALSE,
 '{"green_min": 20000, "amber_min": 10000}'),

('total_earnings', 'Total Earnings', 'currency_inr', 'custom_sql',
 'SELECT calculate_actual_incentive(:user_id, :month)',
 '{}', 'mtd', FALSE, NULL),

('dcf_commission', 'DCF Commission', 'currency_inr', 'sum',
 'SELECT COALESCE(SUM(total_commission), 0) FROM dcf_leads WHERE kam_user_id = :user_id AND overall_status = ''DISBURSED'' AND disbursal_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', 'mtd', FALSE, NULL),

-- ===================== DCF METRICS =====================

('dcf_leads_count', 'DCF Leads', 'count', 'count',
 'SELECT COUNT(*) FROM dcf_leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date',
 '{"dealer_id", "rag_status"}', 'mtd', FALSE, NULL),

('dcf_disbursed_count', 'DCF Disbursed', 'count', 'count',
 'SELECT COUNT(*) FROM dcf_leads WHERE kam_user_id = :user_id AND overall_status = ''DISBURSED'' AND disbursal_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', 'mtd', FALSE, NULL),

('dcf_gmv', 'DCF GMV', 'currency_inr', 'sum',
 'SELECT COALESCE(SUM(loan_amount), 0) FROM dcf_leads WHERE kam_user_id = :user_id AND overall_status = ''DISBURSED'' AND disbursal_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', 'mtd', FALSE, NULL),

-- ===================== DEALER METRICS =====================

('dealers_active', 'Active Dealers', 'count', 'count',
 'SELECT COUNT(*) FROM dealers WHERE kam_user_id = :user_id AND status = ''active'' AND deleted_at IS NULL',
 '{"segment", "region"}', 'lifetime', FALSE, NULL),

('dealers_dormant', 'Dormant Dealers', 'count', 'count',
 'SELECT COUNT(*) FROM dealers WHERE kam_user_id = :user_id AND status = ''dormant'' AND deleted_at IS NULL',
 '{"segment", "region"}', 'lifetime', FALSE,
 '{"green_min": 0, "amber_min": 3}');
```

---

## 2. Table: `dashboard_layouts`

### 2.1 Schema

```sql
CREATE TABLE dashboard_layouts (
  layout_id       TEXT PRIMARY KEY,
  dashboard_key   TEXT NOT NULL,                -- kam_home, tl_home, admin_home, kam_performance, etc.
  role            TEXT NOT NULL,                -- KAM, TL, ADMIN
  display_name    TEXT NOT NULL,                -- e.g., "KAM Home Dashboard"
  
  tiles           JSONB NOT NULL,              -- Array of tile configs (see below)
  
  version         INT NOT NULL DEFAULT 1,      -- For A/B testing or rollback
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by      TEXT                          -- admin user_id
);
```

### 2.2 Tile Config Schema (within `tiles` JSONB)

```typescript
interface TileConfig {
  tile_id: string;              // Unique within dashboard
  metric_key: string;           // References metric_definitions.metric_key
  position: number;             // Render order
  size: 'small' | 'medium' | 'large';
  type: 'count' | 'percent' | 'currency' | 'progress' | 'gauge' | 'trend';
  
  // Override display (optional — falls back to metric_definitions)
  display_name_override?: string;
  subtitle_template?: string;   // e.g., "{{value}} of {{target}} target"
  
  // Breakdown (optional — adds sub-values)
  breakdown_metrics?: string[]; // e.g., ['si_c2b', 'si_c2d', 'si_gs']
  
  // Trend (optional — adds sparkline)
  show_trend?: boolean;
  trend_days?: number;          // Default: 7
  
  // Navigation action
  action?: {
    type: 'navigate' | 'modal';
    target: string;             // Route key
    filter?: Record<string, string>;
  };
  
  // Visibility conditions
  visible_if?: {
    role?: string[];
    min_value?: number;         // Only show if value >= this
  };
}
```

---

## 3. Example Dashboard Configs

### 3.1 KAM Home Dashboard (8 tiles)

```sql
INSERT INTO dashboard_layouts (layout_id, dashboard_key, role, display_name, tiles) VALUES
('layout-kam-home-v1', 'kam_home', 'KAM', 'KAM Home Dashboard', '[
  {
    "tile_id": "tile-si-achievement",
    "metric_key": "si_achievement",
    "position": 1,
    "size": "large",
    "type": "progress",
    "subtitle_template": "{{value}} of {{target}} target",
    "breakdown_metrics": ["si_c2b", "si_c2d", "si_gs"],
    "show_trend": true,
    "trend_days": 7,
    "action": {"type": "navigate", "target": "dealers", "filter": {"status": "active"}}
  },
  {
    "tile_id": "tile-projected-earnings",
    "metric_key": "projected_earnings",
    "position": 2,
    "size": "medium",
    "type": "currency",
    "subtitle_template": "Based on current run rate",
    "breakdown_metrics": ["total_earnings", "dcf_commission"]
  },
  {
    "tile_id": "tile-leads-created",
    "metric_key": "leads_created",
    "position": 3,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "leads"}
  },
  {
    "tile_id": "tile-inspections",
    "metric_key": "inspections",
    "position": 4,
    "size": "small",
    "type": "count"
  },
  {
    "tile_id": "tile-i2si",
    "metric_key": "i2si",
    "position": 5,
    "size": "small",
    "type": "percent",
    "subtitle_template": "Inspection to Stock-In"
  },
  {
    "tile_id": "tile-input-score",
    "metric_key": "input_score",
    "position": 6,
    "size": "medium",
    "type": "gauge",
    "subtitle_template": "Gate: {{gate}}",
    "action": {"type": "navigate", "target": "productivity"}
  },
  {
    "tile_id": "tile-call-productivity",
    "metric_key": "call_productivity_rate",
    "position": 7,
    "size": "small",
    "type": "percent",
    "breakdown_metrics": ["calls_productive", "calls_total"]
  },
  {
    "tile_id": "tile-visit-productivity",
    "metric_key": "visit_productivity_rate",
    "position": 8,
    "size": "small",
    "type": "percent",
    "breakdown_metrics": ["visits_productive", "visits_total"]
  }
]');
```

### 3.2 TL Home Dashboard (8 tiles)

```sql
INSERT INTO dashboard_layouts (layout_id, dashboard_key, role, display_name, tiles) VALUES
('layout-tl-home-v1', 'tl_home', 'TL', 'TL Home Dashboard', '[
  {
    "tile_id": "tile-team-si",
    "metric_key": "si_achievement",
    "display_name_override": "Team Stock-Ins",
    "position": 1,
    "size": "large",
    "type": "progress",
    "subtitle_template": "{{value}} of {{target}} team target",
    "breakdown_metrics": ["si_c2b", "si_c2d", "si_gs"],
    "show_trend": true,
    "action": {"type": "navigate", "target": "dealers"}
  },
  {
    "tile_id": "tile-tl-earnings",
    "metric_key": "projected_earnings",
    "display_name_override": "TL Projected Earnings",
    "position": 2,
    "size": "medium",
    "type": "currency"
  },
  {
    "tile_id": "tile-kams-above-target",
    "metric_key": "kams_above_target",
    "display_name_override": "KAMs Above Target",
    "position": 3,
    "size": "small",
    "type": "count",
    "subtitle_template": "of {{total}} KAMs"
  },
  {
    "tile_id": "tile-team-leads",
    "metric_key": "leads_created",
    "display_name_override": "Team Leads Created",
    "position": 4,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "leads"}
  },
  {
    "tile_id": "tile-team-i2si",
    "metric_key": "i2si",
    "display_name_override": "Team I2SI %",
    "position": 5,
    "size": "small",
    "type": "percent"
  },
  {
    "tile_id": "tile-team-input-score",
    "metric_key": "input_score",
    "display_name_override": "Avg Team Input Score",
    "position": 6,
    "size": "medium",
    "type": "gauge",
    "subtitle_template": "Avg across {{kam_count}} KAMs"
  },
  {
    "tile_id": "tile-pending-reviews",
    "metric_key": "pending_tl_reviews",
    "display_name_override": "Pending Call Reviews",
    "position": 7,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "visits"}
  },
  {
    "tile_id": "tile-team-dcf",
    "metric_key": "dcf_leads_count",
    "display_name_override": "Team DCF Leads",
    "position": 8,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "dcf"}
  }
]');
```

---

## 4. How Common Changes Work Without Frontend Code Changes

### 4.1 Rename a Metric

**Scenario:** Rename "Stock-Ins (SI)" to "Cars Stocked In".

```sql
UPDATE metric_definitions
SET display_name = 'Cars Stocked In', updated_at = NOW(), updated_by = 'admin-01'
WHERE metric_key = 'si_achievement';
```

**Effect:** Next `GET /v1/dashboard/home` returns `"display_name": "Cars Stocked In"`. Frontend renders new label automatically.

### 4.2 Change Calculation Logic

**Scenario:** I2SI should only count inspections that occurred (not scheduled).

```sql
UPDATE metric_definitions
SET sql_template = 'SELECT ROUND(
  CAST(COUNT(CASE WHEN stage = ''Stock-in'' AND status = ''Won'' THEN 1 END) AS NUMERIC) /
  NULLIF(COUNT(CASE WHEN stage IN (''Inspection Done'', ''Stock-in'') THEN 1 END), 0) * 100, 1)
  FROM leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date',
    updated_at = NOW(), updated_by = 'admin-01'
WHERE metric_key = 'i2si';
```

**Effect:** API server executes new SQL. Frontend receives different value. No code deploy needed.

### 4.3 Change RAG Thresholds

**Scenario:** Make I2SI "green" require 70% instead of 60%.

```sql
UPDATE metric_definitions
SET rag_thresholds = '{"green_min": 70, "amber_min": 45}',
    updated_at = NOW(), updated_by = 'admin-01'
WHERE metric_key = 'i2si';
```

### 4.4 Add a New Tile to Dashboard

**Scenario:** Add a "DCF GMV" tile to KAM home dashboard.

```sql
-- 1. Metric already exists in metric_definitions (dcf_gmv)

-- 2. Add tile to layout
UPDATE dashboard_layouts
SET tiles = tiles || '[{
  "tile_id": "tile-dcf-gmv",
  "metric_key": "dcf_gmv",
  "position": 9,
  "size": "small",
  "type": "currency",
  "action": {"type": "navigate", "target": "dcf"}
}]'::jsonb,
    updated_at = NOW(), updated_by = 'admin-01'
WHERE layout_id = 'layout-kam-home-v1';
```

### 4.5 Remove a Tile

**Scenario:** Remove "Inspections" tile from KAM home.

```sql
UPDATE dashboard_layouts
SET tiles = tiles - (
  SELECT ordinality - 1
  FROM jsonb_array_elements(tiles) WITH ORDINALITY
  WHERE value->>'tile_id' = 'tile-inspections'
)::int,
    updated_at = NOW(), updated_by = 'admin-01'
WHERE layout_id = 'layout-kam-home-v1';
```

Or simpler: filter in application code before returning:
```python
tiles = [t for t in layout.tiles if t['tile_id'] != 'tile-inspections']
```

### 4.6 Reorder Tiles

```sql
-- Swap positions of tile-i2si (5) and tile-input-score (6)
UPDATE dashboard_layouts
SET tiles = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'tile_id' = 'tile-i2si' THEN jsonb_set(elem, '{position}', '6')
      WHEN elem->>'tile_id' = 'tile-input-score' THEN jsonb_set(elem, '{position}', '5')
      ELSE elem
    END ORDER BY (elem->>'position')::int
  )
  FROM jsonb_array_elements(tiles) AS elem
),
    updated_at = NOW()
WHERE layout_id = 'layout-kam-home-v1';
```

### 4.7 A/B Test a New Dashboard Layout

```sql
-- Create variant B
INSERT INTO dashboard_layouts (layout_id, dashboard_key, role, display_name, tiles, version)
VALUES ('layout-kam-home-v2', 'kam_home', 'KAM', 'KAM Home Dashboard (variant B)', '[...]', 2);

-- Route 50% of users to v2 via feature flag in API server
-- No frontend changes needed
```

### 4.8 Deprecate a Metric

```sql
UPDATE metric_definitions
SET enabled = false, deprecated_at = NOW(), updated_by = 'admin-01'
WHERE metric_key = 'old_metric';
```

API server excludes disabled metrics from responses. Tiles referencing disabled metrics are skipped.

---

## 5. API Server Execution Flow

```
1. Request: GET /v1/dashboard/home?time_scope=mtd
2. Auth: Extract user_id, role from JWT
3. Fetch layout:
   SELECT tiles FROM dashboard_layouts
   WHERE dashboard_key = '{role}_home' AND role = :role AND enabled = true
   ORDER BY version DESC LIMIT 1
4. For each tile:
   a. Fetch metric_definitions WHERE metric_key = tile.metric_key AND enabled = true
   b. Resolve time scope → start_date, end_date
   c. Execute sql_template with bind params (:user_id, :start_date, :end_date, ...)
   d. Fetch target if has_target = true
   e. Compute RAG from value vs rag_thresholds
   f. Format subtitle from subtitle_template
   g. If breakdown_metrics, execute each and include
   h. If show_trend, execute sql_template for each of last N days
5. Assemble response tiles array
6. Return JSON envelope
```

### 5.1 Caching Strategy

| Data | Cache TTL | Invalidation |
|------|-----------|-------------|
| `metric_definitions` | 5 minutes | On admin update (cache-bust via version) |
| `dashboard_layouts` | 5 minutes | On admin update |
| Metric values (per user) | 60 seconds | On data write (call/visit/lead creation) |
| Trend data | 5 minutes | Time-based expiry |

---

## 6. Admin API for Config Management

### 6.1 `GET /v1/admin/metrics` — List All Metrics

```json
{
  "data": [
    {
      "metric_key": "si_achievement",
      "display_name": "Stock-Ins (SI)",
      "unit": "count",
      "calc_type": "count",
      "enabled": true,
      "used_in_dashboards": ["kam_home", "tl_home"],
      "updated_at": "2026-02-10T00:00:00Z"
    }
  ]
}
```

### 6.2 `PATCH /v1/admin/metrics/:metric_key` — Update Metric

```json
{
  "display_name": "Cars Stocked In",
  "rag_thresholds": { "green_min": 80, "amber_min": 50 }
}
```

### 6.3 `GET /v1/admin/dashboards` — List Layouts

### 6.4 `PUT /v1/admin/dashboards/:layout_id/tiles` — Replace Tiles Config

---

*End of METRICS_CONFIG_SYSTEM.md*
