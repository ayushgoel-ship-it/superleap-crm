-- ============================================================
-- MIGRATION 012: CREATE AUDIT LOG TABLE (append-only)
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md P3, P6
-- Append-only — no UPDATE or DELETE permitted on this table.
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  log_id        BIGSERIAL PRIMARY KEY,       -- auto-increment for ordering
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Who
  actor_id      TEXT NOT NULL,               -- user_id or 'system'
  actor_role    TEXT,                         -- KAM, TL, ADMIN, system

  -- What
  action        TEXT NOT NULL,               -- INSERT, UPDATE, DELETE, LOGIN, CONFIG_CHANGE, etc.
  entity_type   TEXT NOT NULL,               -- table name: leads, dealers, metric_definitions, etc.
  entity_id     TEXT NOT NULL,               -- PK of the affected row

  -- Change details
  old_values    JSONB,                       -- previous values (NULL for INSERT)
  new_values    JSONB,                       -- new values (NULL for DELETE)
  change_summary TEXT,                       -- human-readable: "stage: PR → Inspection Scheduled"

  -- Context
  request_id    TEXT,                        -- correlation ID from API request
  ip_address    TEXT,
  user_agent    TEXT,

  -- Metadata
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent accidental mutation of audit rows
COMMENT ON TABLE audit_log IS 'Append-only audit trail — never UPDATE or DELETE rows (P3, P6)';
COMMENT ON COLUMN audit_log.old_values IS 'JSON snapshot of changed fields before mutation';
COMMENT ON COLUMN audit_log.new_values IS 'JSON snapshot of changed fields after mutation';

-- Index for querying audit by entity
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id, timestamp DESC);

-- Index for querying audit by actor
CREATE INDEX idx_audit_actor ON audit_log(actor_id, timestamp DESC);
