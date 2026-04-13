# Schema Changelog

## 2026-04-13: Data Architecture Cleanup

### Migration: V1__drop_unused_columns_and_tables.sql

**Context**: Full data architecture audit traced every Supabase column through the adapter layer (supabaseRaw.ts), runtime enrichment (runtimeDB.ts), metrics computation (metricsFromDB.ts, canonicalMetrics.ts), and UI rendering. Columns confirmed unused were dropped. Frontend `select('*')` calls replaced with explicit column lists.

### Dropped Columns (47 total)

| Table | Columns Dropped | Reason |
|-------|----------------|--------|
| dealers_master (4) | ifsc, tier, tier_updated_at, legacy_code | Never mapped by adapter. ifsc=PII. tier/legacy unused. |
| sell_leads_master (23) | sub_source, payment_status/amount/date/mode/reference, c2d_remarks, customer_email, quote_amount/date, offer_amount/date, final_price, negotiation_notes, rejection_reason/date, is_duplicate, assigned_to/at, priority, tags, lost_reason/date | NOT_IN_ADAPTER. select('*') fetched them but adapter never accessed row.field for any of these. |
| dcf_leads_master (20) | kam_id_clean, tl_id_clean, dealer_id_clean, region_clean, status_clean, kam_id_2, tl_id_2, dealer_id_2, region_2, status_2, disbursal_amount_2, sanction_amount_2, mapping_source/confidence/version/notes, raw_kam/tl/dealer/region | Dead clusters: _clean (5), _2 (7), mapping (4), raw import (4). All ingestion/debug artefacts. |

### Dropped Tables (3)

| Table | Reason |
|-------|--------|
| kpi_targets | No adapter, no page, no metric reads from it |
| metric_definitions | No adapter, no page, no metric reads from it |
| dashboard_layouts | No adapter, no page, no metric reads from it |

### Columns Kept (per user decision, even though unused)

| Table | Column | Reason to Keep |
|-------|--------|---------------|
| dealers_master | gst_number, pan_number, bank_account | Future onboarding module |
| sell_leads_master | refund_status/amount/date/reason | Future refund workflow |
| sell_leads_master | c2d_status, c2d_date, c2d_amount | Future C2D flow |
| sell_leads_master | duplicate_of | Future dedup logic |
| call_events | device_id, sim_slot | User chose to keep |
| users | last_login_at | Future: notify TL when KAM inactive |
| users | avatar_url | Future: profile photo |
| targets | stretch_value | Future: stretch targets |
| audit_log | ip_address, user_agent | User chose to keep |

### Frontend Fixes (8 issues resolved)

| # | Fix | Files Changed |
|---|-----|--------------|
| 1 | I2SI rounding: standardized to 1 decimal everywhere | metricsFromDB.ts, AdminHomePage.tsx |
| 2 | NGS%: now computes NGS stock-ins / NGS inspections (was duplicate of I2SI) | AdminHomePage.tsx |
| 3 | DCF GMV: standardized to lakhs everywhere (AdminHome was showing rupees) | AdminHomePage.tsx |
| 4 | Leaderboard ranking text: updated to match actual formula | LeaderboardPage.tsx |
| 5 | Leaderboard: switched from stage-based to rank-based counting (consistent with HomePage) | LeaderboardPage.tsx |
| 6 | Input score cap: added tooltip explaining cap at 95 | TLHomeView.tsx |
| 7 | DCF targets: documented as hardcoded (pending targets table migration) | — |
| 8 | LMTD label: changed to "vs Last Month Same Period" | TLHomeView.tsx |

### Frontend Data Fetching

All `select('*')` replaced with explicit column lists in supabaseRaw.ts:
- dealers_master: 23 columns (was ~30+)
- sell_leads_master: 48 columns (was ~85+)
- dcf_leads_master: 41 columns (was ~90+)
- call_events: 14 columns
- visits: 14 columns
- users: 11 columns
- teams: 2 columns
- targets: 11 columns
- incentive_slabs: 9 columns
- incentive_rules: 7 columns
- untagged_dealers: 9 columns
- location_requests: 13 columns
