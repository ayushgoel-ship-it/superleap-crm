-- V011: Complete FK hardening on sell_leads_master and dcf_leads_master.
--
-- V010 added indexes and documentation notes but left kam_id / tl_id as
-- unconstrained TEXT because legacy data could contain non-UUID values.
--
-- This migration:
--   1. Creates a quarantine table preserving any orphan/non-UUID rows
--      so nothing is lost and ops can reconcile them manually.
--   2. Nulls out kam_id / tl_id on any row that (a) does not parse as
--      UUID or (b) parses but references a user_id not present in
--      public.users.
--   3. Converts the column type TEXT → UUID (safe now — every
--      remaining non-NULL value is a valid UUID present in users).
--   4. Adds FOREIGN KEY constraints (NOT VALID first for speed, then
--      VALIDATE so the constraint is trusted by the planner).
--
-- Idempotency: guarded with IF NOT EXISTS / conditional checks so
-- re-running on a partially-migrated environment is safe.
--
-- Rollback: drop the FK constraints and ALTER TYPE back to TEXT. The
-- quarantine table retains the pre-migration values.

-- ────────────────────────────────────────────────────────────────────
-- 1. Quarantine table
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_owner_quarantine_v011 (
    quarantine_id  BIGSERIAL PRIMARY KEY,
    source_table   TEXT        NOT NULL,
    lead_id        TEXT        NOT NULL,
    column_name    TEXT        NOT NULL,
    raw_value      TEXT,
    reason         TEXT        NOT NULL,
    quarantined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_owner_quarantine_v011_source
    ON lead_owner_quarantine_v011(source_table, column_name);

-- ────────────────────────────────────────────────────────────────────
-- 2. Snapshot + NULL orphans
--
-- "Orphan" means: value is NULL-eligible and either
--   (a) not a valid UUID, or
--   (b) a valid UUID that doesn't match any users.user_id
-- We preserve the raw text so a human can reconcile later.
-- ────────────────────────────────────────────────────────────────────

-- sell_leads_master.kam_id
INSERT INTO lead_owner_quarantine_v011 (source_table, lead_id, column_name, raw_value, reason)
SELECT 'sell_leads_master', lead_id::text, 'kam_id', kam_id,
       CASE
           WHEN kam_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
               THEN 'not_a_uuid'
           ELSE 'no_matching_user'
       END
FROM sell_leads_master
WHERE kam_id IS NOT NULL
  AND (
      kam_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      OR NOT EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id::text = sell_leads_master.kam_id
      )
  );

UPDATE sell_leads_master
SET kam_id = NULL
WHERE kam_id IS NOT NULL
  AND (
      kam_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      OR NOT EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id::text = sell_leads_master.kam_id
      )
  );

-- sell_leads_master.tl_id
INSERT INTO lead_owner_quarantine_v011 (source_table, lead_id, column_name, raw_value, reason)
SELECT 'sell_leads_master', lead_id::text, 'tl_id', tl_id,
       CASE
           WHEN tl_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
               THEN 'not_a_uuid'
           ELSE 'no_matching_user'
       END
FROM sell_leads_master
WHERE tl_id IS NOT NULL
  AND (
      tl_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      OR NOT EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id::text = sell_leads_master.tl_id
      )
  );

UPDATE sell_leads_master
SET tl_id = NULL
WHERE tl_id IS NOT NULL
  AND (
      tl_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      OR NOT EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id::text = sell_leads_master.tl_id
      )
  );

-- dcf_leads_master.kam_id
INSERT INTO lead_owner_quarantine_v011 (source_table, lead_id, column_name, raw_value, reason)
SELECT 'dcf_leads_master', lead_id::text, 'kam_id', kam_id,
       CASE
           WHEN kam_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
               THEN 'not_a_uuid'
           ELSE 'no_matching_user'
       END
FROM dcf_leads_master
WHERE kam_id IS NOT NULL
  AND (
      kam_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      OR NOT EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id::text = dcf_leads_master.kam_id
      )
  );

UPDATE dcf_leads_master
SET kam_id = NULL
WHERE kam_id IS NOT NULL
  AND (
      kam_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      OR NOT EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id::text = dcf_leads_master.kam_id
      )
  );

-- dcf_leads_master.tl_id
INSERT INTO lead_owner_quarantine_v011 (source_table, lead_id, column_name, raw_value, reason)
SELECT 'dcf_leads_master', lead_id::text, 'tl_id', tl_id,
       CASE
           WHEN tl_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
               THEN 'not_a_uuid'
           ELSE 'no_matching_user'
       END
FROM dcf_leads_master
WHERE tl_id IS NOT NULL
  AND (
      tl_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      OR NOT EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id::text = dcf_leads_master.tl_id
      )
  );

UPDATE dcf_leads_master
SET tl_id = NULL
WHERE tl_id IS NOT NULL
  AND (
      tl_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      OR NOT EXISTS (
          SELECT 1 FROM users u
          WHERE u.user_id::text = dcf_leads_master.tl_id
      )
  );

-- ────────────────────────────────────────────────────────────────────
-- 3. Convert TEXT → UUID
--    Safe because every remaining non-NULL value now parses and
--    references users(user_id).
-- ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'sell_leads_master' AND column_name = 'kam_id') = 'text' THEN
        ALTER TABLE sell_leads_master
            ALTER COLUMN kam_id TYPE UUID USING (kam_id::uuid);
    END IF;

    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'sell_leads_master' AND column_name = 'tl_id') = 'text' THEN
        ALTER TABLE sell_leads_master
            ALTER COLUMN tl_id TYPE UUID USING (tl_id::uuid);
    END IF;

    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'dcf_leads_master' AND column_name = 'kam_id') = 'text' THEN
        ALTER TABLE dcf_leads_master
            ALTER COLUMN kam_id TYPE UUID USING (kam_id::uuid);
    END IF;

    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'dcf_leads_master' AND column_name = 'tl_id') = 'text' THEN
        ALTER TABLE dcf_leads_master
            ALTER COLUMN tl_id TYPE UUID USING (tl_id::uuid);
    END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 4. Foreign key constraints (NOT VALID → VALIDATE)
--    NOT VALID skips a full-table scan; VALIDATE does it without a
--    long lock. Idempotent via constraint-name check.
-- ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_sell_leads_kam'
    ) THEN
        ALTER TABLE sell_leads_master
            ADD CONSTRAINT fk_sell_leads_kam
            FOREIGN KEY (kam_id) REFERENCES users(user_id)
            NOT VALID;
        ALTER TABLE sell_leads_master VALIDATE CONSTRAINT fk_sell_leads_kam;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_sell_leads_tl'
    ) THEN
        ALTER TABLE sell_leads_master
            ADD CONSTRAINT fk_sell_leads_tl
            FOREIGN KEY (tl_id) REFERENCES users(user_id)
            NOT VALID;
        ALTER TABLE sell_leads_master VALIDATE CONSTRAINT fk_sell_leads_tl;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_dcf_leads_kam'
    ) THEN
        ALTER TABLE dcf_leads_master
            ADD CONSTRAINT fk_dcf_leads_kam
            FOREIGN KEY (kam_id) REFERENCES users(user_id)
            NOT VALID;
        ALTER TABLE dcf_leads_master VALIDATE CONSTRAINT fk_dcf_leads_kam;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_dcf_leads_tl'
    ) THEN
        ALTER TABLE dcf_leads_master
            ADD CONSTRAINT fk_dcf_leads_tl
            FOREIGN KEY (tl_id) REFERENCES users(user_id)
            NOT VALID;
        ALTER TABLE dcf_leads_master VALIDATE CONSTRAINT fk_dcf_leads_tl;
    END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 5. Update column comments to reflect enforced state
-- ────────────────────────────────────────────────────────────────────
COMMENT ON COLUMN sell_leads_master.kam_id IS
    'KAM user_id owning this lead. FK-enforced to users.user_id (V011).';
COMMENT ON COLUMN sell_leads_master.tl_id IS
    'TL user_id for this lead. FK-enforced to users.user_id (V011).';
COMMENT ON COLUMN dcf_leads_master.kam_id IS
    'KAM user_id owning this DCF lead. FK-enforced to users.user_id (V011).';
COMMENT ON COLUMN dcf_leads_master.tl_id IS
    'TL user_id for this DCF lead. FK-enforced to users.user_id (V011).';
COMMENT ON TABLE lead_owner_quarantine_v011 IS
    'Pre-V011 orphan/non-UUID lead ownership values. Reconcile and drop once resolved.';
