-- ============================================================
-- MIGRATION 009: CREATE SUPPORT TABLES
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md §3.1
-- Tables: location_requests, notifications, targets, incentive_slabs
-- ============================================================

-- LOCATION CHANGE REQUESTS
CREATE TABLE IF NOT EXISTS location_requests (
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

COMMENT ON TABLE location_requests IS 'KAM-initiated requests to update dealer GPS coordinates';

-- NOTIFICATIONS (minimal per task spec)
CREATE TABLE IF NOT EXISTS notifications (
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

COMMENT ON TABLE notifications IS 'User notifications — read_at NULL = unread';

-- TARGETS (monthly per user)
CREATE TABLE IF NOT EXISTS targets (
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

COMMENT ON TABLE targets IS 'Monthly performance targets per user';

-- INCENTIVE SLABS (config)
CREATE TABLE IF NOT EXISTS incentive_slabs (
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

COMMENT ON TABLE incentive_slabs IS 'Config: incentive payout slabs by achievement %';
