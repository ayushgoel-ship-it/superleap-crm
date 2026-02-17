-- ============================================================
-- MIGRATION 001: CREATE TEAMS TABLE
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md §3.1
-- Note: tl_user_id FK added in 003 after users table exists
-- ============================================================

CREATE TABLE IF NOT EXISTS teams (
  team_id       TEXT PRIMARY KEY,           -- e.g., 'team-ncr-01'
  team_name     TEXT NOT NULL,
  tl_user_id    TEXT NOT NULL,              -- FK added in migration 003
  region        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE teams IS 'Organizational teams, each led by one TL';
COMMENT ON COLUMN teams.team_id IS 'Format: team-{region}-{seq}';
COMMENT ON COLUMN teams.tl_user_id IS 'FK to users(user_id) — added in migration 003';
