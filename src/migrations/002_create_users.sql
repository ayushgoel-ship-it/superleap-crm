-- ============================================================
-- MIGRATION 002: CREATE USERS TABLE
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md §3.1
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
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

COMMENT ON TABLE users IS 'All CRM users: KAMs, TLs, Admins';
COMMENT ON COLUMN users.user_id IS 'Format: {role}-{region}-{seq}';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete — NULL means active row (P4)';
