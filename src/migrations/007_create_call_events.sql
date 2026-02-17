-- ============================================================
-- MIGRATION 007: CREATE CALL EVENTS TABLE
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md §3.1
-- ============================================================

CREATE TABLE IF NOT EXISTS call_events (
  call_id       TEXT PRIMARY KEY,           -- e.g., 'call-1707500000-001'
  dealer_id     TEXT NOT NULL REFERENCES dealers(dealer_id),
  kam_user_id   TEXT NOT NULL REFERENCES users(user_id),
  tl_user_id    TEXT NOT NULL REFERENCES users(user_id),
  phone         TEXT NOT NULL,

  -- Timing
  call_date     DATE NOT NULL,
  call_time     TEXT,                       -- HH:MM display
  call_start_time TIMESTAMPTZ,
  call_end_time   TIMESTAMPTZ,
  duration_sec    INT,

  -- Status & Outcome
  call_status   TEXT NOT NULL DEFAULT 'ATTEMPTED'
                  CHECK (call_status IN ('ATTEMPTED', 'CONNECTED', 'NOT_REACHABLE', 'BUSY', 'CALL_BACK')),
  outcome       TEXT CHECK (outcome IN ('Connected', 'No Answer', 'Busy', 'Left VM')),

  -- Productivity
  is_productive       BOOLEAN NOT NULL DEFAULT FALSE,
  productivity_source TEXT CHECK (productivity_source IN ('AI', 'KAM', 'TL')),

  -- Recording & Analysis
  recording_status TEXT DEFAULT 'NOT_AVAILABLE'
                     CHECK (recording_status IN ('AVAILABLE', 'NOT_AVAILABLE')),
  recording_url    TEXT,
  transcript       TEXT,
  sentiment_score  NUMERIC(5, 2),          -- 0-100
  sentiment_label  TEXT CHECK (sentiment_label IN ('Positive', 'Neutral', 'Negative')),
  auto_tags        TEXT[],

  -- Feedback (JSONB payload — see API_CONTRACTS.md §3.4)
  feedback_status TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (feedback_status IN ('PENDING', 'SUBMITTED')),
  feedback_submitted_at TIMESTAMPTZ,
  feedback_data   JSONB,                    -- structured feedback payload

  -- TL Review
  tl_review       JSONB,                    -- {comment, flagged, reviewed_at, tl_id}

  -- Metadata
  kam_comments    TEXT,
  follow_up_tasks TEXT[],

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE call_events IS 'Telephony call events — append-only source rows (P3)';
COMMENT ON COLUMN call_events.feedback_data IS 'Structured JSON: call_outcome, car_sell, dcf, notes, next_actions';
COMMENT ON COLUMN call_events.tl_review IS 'JSON: {comment, flagged, reviewed_at, tl_id}';
