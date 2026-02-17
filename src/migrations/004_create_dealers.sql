-- ============================================================
-- MIGRATION 004: CREATE DEALERS TABLE
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md §3.1
-- ============================================================

CREATE TABLE IF NOT EXISTS dealers (
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

COMMENT ON TABLE dealers IS 'Dealer partners in the CARS24 referral network';
COMMENT ON COLUMN dealers.segment IS 'Tier: A (high), B (mid), C (low)';
COMMENT ON COLUMN dealers.tags IS 'Freeform tags, e.g. Top Dealer, DCF Onboarded';
