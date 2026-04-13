-- ============================================================================
-- V1: Drop unused columns and tables
-- Date: 2026-04-13
-- Source: Data Architecture Audit (docs/data-audit.xlsx)
-- ============================================================================
-- This migration drops columns and tables that are confirmed unused by the
-- frontend adapter layer (supabaseRaw.ts). All select('*') calls have been
-- replaced with explicit column lists, so these columns are no longer fetched.
--
-- Columns marked "Keep" by the user (even though unused) are NOT dropped here.
-- Those are: gst_number, pan_number, bank_account (dealers_master),
--            refund_*, c2d_status/date/amount, duplicate_of (sell_leads_master),
--            device_id, sim_slot (call_events),
--            last_login_at, avatar_url (users),
--            stretch_value (targets),
--            ip_address, user_agent (audit_log)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. dealers_master — drop 4 columns
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE dealers_master DROP COLUMN IF EXISTS ifsc;
ALTER TABLE dealers_master DROP COLUMN IF EXISTS tier;
ALTER TABLE dealers_master DROP COLUMN IF EXISTS tier_updated_at;
ALTER TABLE dealers_master DROP COLUMN IF EXISTS legacy_code;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. sell_leads_master — drop 23 columns
-- ────────────────────────────────────────────────────────────────────────────
-- Payment cluster (5 cols — payment_status kept by user as "Keep")
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS sub_source;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS payment_status;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS payment_amount;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS payment_date;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS payment_mode;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS payment_reference;

-- C2D cluster (1 col — c2d_status/date/amount kept by user)
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS c2d_remarks;

-- Quote / Offer / Price cluster
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS customer_email;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS quote_amount;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS quote_date;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS offer_amount;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS offer_date;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS final_price;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS negotiation_notes;

-- Rejection cluster
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS rejection_reason;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS rejection_date;

-- Dedup (duplicate_of kept by user)
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS is_duplicate;

-- Assignment / Priority / Tags / Lost
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS assigned_at;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS priority;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS tags;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS lost_reason;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS lost_date;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. dcf_leads_master — drop 20 columns
-- ────────────────────────────────────────────────────────────────────────────
-- _clean cluster (5)
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS kam_id_clean;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS tl_id_clean;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS dealer_id_clean;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS region_clean;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS status_clean;

-- _2 cluster (7)
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS kam_id_2;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS tl_id_2;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS dealer_id_2;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS region_2;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS status_2;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS disbursal_amount_2;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS sanction_amount_2;

-- mapping cluster (4)
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS mapping_source;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS mapping_confidence;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS mapping_version;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS mapping_notes;

-- raw import artefacts (4)
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS raw_kam;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS raw_tl;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS raw_dealer;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS raw_region;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Drop 3 unused tables
-- ────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS kpi_targets;
DROP TABLE IF EXISTS metric_definitions;
DROP TABLE IF EXISTS dashboard_layouts;

-- ────────────────────────────────────────────────────────────────────────────
-- Summary:
--   dealers_master:    -4 columns (ifsc, tier, tier_updated_at, legacy_code)
--   sell_leads_master: -23 columns (payment cluster, quote/offer, assignment, etc.)
--   dcf_leads_master:  -20 columns (_clean, _2, mapping, raw clusters)
--   Dropped tables:    kpi_targets, metric_definitions, dashboard_layouts
--   Total:             47 columns dropped + 3 tables dropped
-- ────────────────────────────────────────────────────────────────────────────
