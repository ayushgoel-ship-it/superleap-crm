-- ============================================================
-- MIGRATION 010: CREATE METRIC DEFINITIONS TABLE
-- Phase: 6A | Source: docs/METRICS_CONFIG_SYSTEM.md §1.1
-- This is the richer schema from the config system doc,
-- which extends the base schema in DATA_ARCHITECTURE.md §3.1
-- ============================================================

CREATE TABLE IF NOT EXISTS metric_definitions (
  metric_key        TEXT PRIMARY KEY,             -- e.g., 'si_achievement'
  display_name      TEXT NOT NULL,                -- UI label, e.g., 'Stock-Ins (SI)'
  description       TEXT,                         -- Tooltip / help text
  unit              TEXT NOT NULL DEFAULT 'count', -- count, percent, currency_inr, score_0_100, ratio
  calc_type         TEXT NOT NULL CHECK (calc_type IN (
                      'count', 'sum', 'avg', 'ratio', 'percent', 'custom_sql')),

  -- SQL template with named parameters
  -- Bind params: :user_id, :team_id, :start_date, :end_date, :dealer_id, :region, :month
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

COMMENT ON TABLE metric_definitions IS 'Config: metric calculation definitions — frontend never contains formulas (P5, P8)';
COMMENT ON COLUMN metric_definitions.sql_template IS 'Parameterized SQL executed by API server at request time';
COMMENT ON COLUMN metric_definitions.rag_thresholds IS 'JSON: {"green_min": N, "amber_min": N} — value >= green_min → green, >= amber_min → amber, else red';
