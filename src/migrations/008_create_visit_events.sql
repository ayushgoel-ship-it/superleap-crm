-- ============================================================
-- MIGRATION 008: CREATE VISIT EVENTS TABLE
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md §3.1
-- ============================================================

CREATE TABLE IF NOT EXISTS visit_events (
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

  -- Feedback (JSONB payload — see API_CONTRACTS.md §4)
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

COMMENT ON TABLE visit_events IS 'Dealer visit events with geofence validation';
COMMENT ON COLUMN visit_events.distance_from_dealer IS 'Distance in meters from dealer GPS pin';
COMMENT ON COLUMN visit_events.feedback_data IS 'Structured JSON: meeting_person, summary, purpose, outcome, mood, dcf, notes';
