# Schema Changelog

## 2026-04-13: Data Architecture Cleanup (Corrected)

### Migration: V1__drop_unused_columns_and_tables.sql

**Context**: Full data architecture audit traced every Supabase column through the adapter layer (supabaseRaw.ts). Columns confirmed unused by the adapter were dropped. Frontend `select('*')` calls replaced with explicit column lists. Non-existent column references in the adapter were also cleaned up.

**IMPORTANT**: Initial audit used assumed column names that didn't match actual Supabase schema. This corrected version was built by querying `information_schema.columns` directly and cross-referencing against the adapter's actual `select()` and `row.field` usage.

### Dropped Columns (98 total)

| Table | Count | Columns Dropped | Category |
|-------|-------|----------------|----------|
| dealers_master | 2 | growth_dealer_region, source | Unused metadata |
| sell_leads_master | 36 | dl_status, dl_rank, growth_dealer_region, inspection_store, growth_inspecting_region | Status/rank artefacts |
| | | first_cancellation_date, first_cancellation_flag, cancellation_losses | Cancellation cluster |
| | | vertical, ans_flag, b2b_flag, elite_flag, sof_flag, self_bought_flag, c2b_eligible_insp | Unused flags |
| | | lead_purchased_date, lead_purchased, lead_expired, leadpurchase_price, lead_purchase_time, leadprice | Lead purchase cluster |
| | | seller_token, seller_token_date, seller_token_time | Seller token cluster |
| | | inspection_done, inspection_done_time, im_raised | Inspection operational |
| | | payment_initiated, payment_option_selected, payment_done, self_pay, full_assist, create_offer | Payment operational |
| | | stockins, gfd, nego_leads | Other unused |
| dcf_leads_master | 60 | channel, fos_mapping, sm_mapping, asm_mapping, rsm_mapping, tl_mapping | Org hierarchy |
| | | red_channel_reason, tnc_generated_date, tnc_accepted_timestamp, case_status, unnati, banking_required, rm_flow, hpa_status, case_status_2 | Compliance/status |
| | | cc_fos, cc_sm, cc_fos_2, cc_sm_2 | Collection center |
| | | fuel_type, source, platform_type, entry_point, region, onboard, tl_head | Source/metadata |
| | | loan_for_chm, loan_for_li, loan_for_mi, li_tenure, pf_amount | Loan sub-components |
| | | tla, ds_roi_tla, roi_loan_amount, vas_income_own, vas_income_pmax | TLA/ROI/VAS |
| | | lead_text, lead_date_2, disbursal_revised, rsa, buyback, franchise_type, channel_revised | Text/misc |
| | | mapping_bi_city, delhi_flag_diy, refinance_dealer, nbfc_channel, disbursal_timestamp, revised_region, is_lead | BI/region flags |
| | | lead_date_clean, login_date_clean, approval_date_clean, disbursal_date_clean, login_date_month, month_col | _clean date artefacts |
| | | gross_disbursal_amount, rejection_reason, final_remarks, current_status | Duplicate/status |

### Dropped Tables (3)

| Table | Reason |
|-------|--------|
| kpi_targets | No adapter, no page, no metric reads from it |
| metric_definitions | No adapter, no page, no metric reads from it |
| dashboard_layouts | No adapter, no page, no metric reads from it |

### Columns Kept (per user decision, even though unused by adapter)

| Table | Column | Reason to Keep |
|-------|--------|---------------|
| sell_leads_master | refunded, refunded_at, refund_time | Future refund workflow |
| sell_leads_master | c2d_stockin_date, c2d_ocb_flag, latest_c2d_ocb_raise_date, c2d_offline_token, c2d_offline_stockin, final_c2dtoken_date, final_c2d_si_date | Future C2D flow |

### Final Column Counts (verified live)

| Table | Before | After | Dropped |
|-------|--------|-------|---------|
| dealers_master | 22 | 20 | 2 |
| sell_leads_master | 86 | 50 | 36 |
| dcf_leads_master | 91 | 31 | 60 |
| **Total** | **199** | **101** | **98** |

### Frontend Adapter Fixes (supabaseRaw.ts)

| Fix | Details |
|-----|---------|
| dealers_master select | Removed 4 non-existent columns: gst_number, pan_number, bank_account, pincode |
| sell_leads_master select | Removed 9 non-existent columns: app_id, refund_status, refund_amount, refund_date, refund_reason, c2d_status, c2d_date, c2d_amount, duplicate_of |
| dcf_leads_master select | Removed 9 non-existent columns: kam_id, tl_id, applicant_name, borrower_name, cust_name, customer_mobile, mobile_no, variant, vehicle_model |
| DCF name resolution | Simplified from 4 candidates to customer_name only (others don't exist) |
| DCF car fallback | Removed vehicle_model and variant (don't exist) |
| DCF phone | Removed customer_mobile and mobile_no fallbacks (don't exist) |

### Frontend Metric Fixes (8 issues resolved)

| # | Fix | Files Changed |
|---|-----|--------------|
| 1 | I2SI rounding: standardized to 1 decimal everywhere | metricsFromDB.ts, AdminHomePage.tsx |
| 2 | NGS%: now computes NGS stock-ins / NGS inspections (was duplicate of I2SI) | AdminHomePage.tsx |
| 3 | DCF GMV: standardized to lakhs everywhere (AdminHome was showing rupees) | AdminHomePage.tsx |
| 4 | Leaderboard ranking text: updated to match actual formula | LeaderboardPage.tsx |
| 5 | Leaderboard: switched from stage-based to rank-based counting (consistent with HomePage) | LeaderboardPage.tsx |
| 6 | Input score cap: added tooltip explaining cap at 95 | TLHomeView.tsx |
| 7 | DCF targets: documented as hardcoded (pending targets table migration) | -- |
| 8 | LMTD label: changed to "vs Last Month Same Period" | TLHomeView.tsx |

### Frontend Data Fetching (select columns match actual schema)

| Table | Columns Selected | Columns in DB |
|-------|-----------------|---------------|
| dealers_master | 19 | 20 (+ id PK) |
| sell_leads_master | 39 | 50 (+ id PK + 10 kept) |
| dcf_leads_master | 31 | 31 (all fetched) |
| call_events | 14 | 14 |
| visits | 14 | 14 |
| users | 11 | 11 |
| teams | 2 | 2 |
| targets | 11 | 11 |
| incentive_slabs | 9 | 9 |
| incentive_rules | 7 | 7 |
| untagged_dealers | 9 | 9 |
| location_requests | 13 | 13 |
