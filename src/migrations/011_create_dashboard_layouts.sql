-- ============================================================
-- MIGRATION 011: CREATE DASHBOARD LAYOUTS TABLE
-- Phase: 6A | Source: docs/METRICS_CONFIG_SYSTEM.md §2.1
-- This is the richer schema from the config system doc,
-- which extends the base schema in DATA_ARCHITECTURE.md §3.1
-- ============================================================

CREATE TABLE IF NOT EXISTS dashboard_layouts (
  layout_id       TEXT PRIMARY KEY,
  dashboard_key   TEXT NOT NULL,                -- kam_home, tl_home, admin_home, etc.
  role            TEXT NOT NULL,                -- KAM, TL, ADMIN
  display_name    TEXT NOT NULL,                -- e.g., "KAM Home Dashboard"

  tiles           JSONB NOT NULL,              -- Array of tile configs (TileConfig[])

  version         INT NOT NULL DEFAULT 1,      -- For A/B testing or rollback
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by      TEXT                          -- admin user_id
);

COMMENT ON TABLE dashboard_layouts IS 'Config: dashboard tile layouts per role — tiles is a JSONB array of TileConfig objects';
COMMENT ON COLUMN dashboard_layouts.tiles IS 'Array of {tile_id, metric_key, position, size, type, subtitle_template, breakdown_metrics, show_trend, action, visible_if}';
COMMENT ON COLUMN dashboard_layouts.version IS 'Supports A/B testing — highest enabled version served by default';
