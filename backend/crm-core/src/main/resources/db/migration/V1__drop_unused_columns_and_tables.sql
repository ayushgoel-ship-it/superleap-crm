-- ============================================================================
-- V1: Drop unused columns and tables
-- Date: 2026-04-13
-- Source: Data Architecture Audit — actual Supabase schema cross-referenced
--         against frontend adapter (supabaseRaw.ts) select statements.
-- ============================================================================
-- This migration drops columns and tables confirmed unused by the frontend
-- adapter layer. All select('*') calls were replaced with explicit column
-- lists, so these columns are no longer fetched.
--
-- Columns kept (per user decision, even though not in adapter):
--   sell_leads_master: refunded, refunded_at, refund_time (future refund workflow)
--   sell_leads_master: c2d_stockin_date, c2d_ocb_flag, latest_c2d_ocb_raise_date,
--                      c2d_offline_token, c2d_offline_stockin, final_c2dtoken_date,
--                      final_c2d_si_date (future C2D flow)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. dealers_master — drop 2 columns
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE dealers_master DROP COLUMN IF EXISTS growth_dealer_region;
ALTER TABLE dealers_master DROP COLUMN IF EXISTS source;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. sell_leads_master — drop 36 columns
-- ────────────────────────────────────────────────────────────────────────────
-- Status/rank artefacts
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS dl_status;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS dl_rank;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS growth_dealer_region;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS inspection_store;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS growth_inspecting_region;

-- Cancellation cluster
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS first_cancellation_date;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS first_cancellation_flag;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS cancellation_losses;

-- Flag columns (vertical, ans, b2b, elite, sof, self_bought, c2b)
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS vertical;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS ans_flag;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS b2b_flag;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS elite_flag;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS sof_flag;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS self_bought_flag;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS c2b_eligible_insp;

-- Lead purchase/expiry cluster
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS lead_purchased_date;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS lead_purchased;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS lead_expired;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS leadpurchase_price;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS lead_purchase_time;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS leadprice;

-- Seller token cluster
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS seller_token;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS seller_token_date;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS seller_token_time;

-- Inspection/payment operational columns
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS inspection_done;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS inspection_done_time;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS im_raised;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS payment_initiated;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS payment_option_selected;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS payment_done;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS self_pay;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS full_assist;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS create_offer;

-- Other unused
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS stockins;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS gfd;
ALTER TABLE sell_leads_master DROP COLUMN IF EXISTS nego_leads;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. dcf_leads_master — drop 60 columns
-- ────────────────────────────────────────────────────────────────────────────
-- Mapping/org hierarchy columns
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS channel;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS fos_mapping;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS sm_mapping;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS asm_mapping;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS rsm_mapping;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS tl_mapping;

-- Compliance/TnC/status columns
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS red_channel_reason;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS tnc_generated_date;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS tnc_accepted_timestamp;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS case_status;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS unnati;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS banking_required;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS rm_flow;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS hpa_status;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS case_status_2;

-- CC (collection center) columns
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS cc_fos;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS cc_sm;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS cc_fos_2;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS cc_sm_2;

-- Source/platform/entry metadata
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS fuel_type;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS source;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS platform_type;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS entry_point;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS region;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS onboard;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS tl_head;

-- Loan sub-components
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS loan_for_chm;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS loan_for_li;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS loan_for_mi;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS li_tenure;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS pf_amount;

-- TLA/ROI/VAS columns
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS tla;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS ds_roi_tla;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS roi_loan_amount;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS vas_income_own;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS vas_income_pmax;

-- Text/notes/misc
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS lead_text;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS lead_date_2;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS disbursal_revised;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS rsa;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS buyback;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS franchise_type;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS channel_revised;

-- BI/region flags
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS mapping_bi_city;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS delhi_flag_diy;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS refinance_dealer;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS nbfc_channel;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS disbursal_timestamp;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS revised_region;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS is_lead;

-- _clean date artefacts (ingestion preprocessing)
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS lead_date_clean;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS login_date_clean;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS approval_date_clean;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS disbursal_date_clean;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS login_date_month;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS month_col;

-- Duplicate/derived amounts
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS gross_disbursal_amount;

-- Status/remarks
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS rejection_reason;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS final_remarks;
ALTER TABLE dcf_leads_master DROP COLUMN IF EXISTS current_status;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Drop 3 unused tables
-- ────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS kpi_targets;
DROP TABLE IF EXISTS metric_definitions;
DROP TABLE IF EXISTS dashboard_layouts;

-- ────────────────────────────────────────────────────────────────────────────
-- Summary (verified against live Supabase 2026-04-13):
--   dealers_master:    22 -> 20 columns (-2: growth_dealer_region, source)
--   sell_leads_master: 86 -> 50 columns (-36 unused columns)
--   dcf_leads_master:  91 -> 31 columns (-60 unused columns)
--   Dropped tables:    kpi_targets, metric_definitions, dashboard_layouts
--   Total:             98 columns dropped + 3 tables dropped
-- ────────────────────────────────────────────────────────────────────────────
