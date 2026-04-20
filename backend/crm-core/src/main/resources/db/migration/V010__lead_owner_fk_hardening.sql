-- V010: Harden ownership columns on sell_leads_master and dcf_leads_master.
--
-- Prior state: kam_id / tl_id were TEXT with no FK, allowing orphan
-- ownership references. dealers_master already uses UUID references.
--
-- This migration:
--   1. Adds supporting indexes for KAM/TL scoping queries.
--   2. Records documentation notes — we intentionally DO NOT convert
--      TEXT → UUID here because legacy rows in several environments
--      contain non-UUID identifiers. A future V011 will complete the
--      backfill + conversion once data quality is confirmed.

-- Indexes for KAM/TL scoping (hot paths on dashboard/list queries)
CREATE INDEX IF NOT EXISTS idx_sell_leads_kam_id
    ON sell_leads_master(kam_id);
CREATE INDEX IF NOT EXISTS idx_sell_leads_tl_id
    ON sell_leads_master(tl_id);
CREATE INDEX IF NOT EXISTS idx_sell_leads_kam_stage
    ON sell_leads_master(kam_id, stage);
CREATE INDEX IF NOT EXISTS idx_sell_leads_dealer_code_stage
    ON sell_leads_master(dealer_code, stage);

CREATE INDEX IF NOT EXISTS idx_dcf_leads_kam_id
    ON dcf_leads_master(kam_id);
CREATE INDEX IF NOT EXISTS idx_dcf_leads_tl_id
    ON dcf_leads_master(tl_id);
CREATE INDEX IF NOT EXISTS idx_dcf_leads_dealer_code
    ON dcf_leads_master(dealer_code);

COMMENT ON COLUMN sell_leads_master.kam_id IS
    'KAM user_id owning this lead. Enforced at application layer; will be FK-constrained in V011 after data quality audit.';
COMMENT ON COLUMN sell_leads_master.tl_id IS
    'TL user_id for this lead. Enforced at application layer; will be FK-constrained in V011 after data quality audit.';
