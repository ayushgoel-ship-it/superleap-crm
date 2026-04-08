# SuperLeap CRM — Data Rulebook (DRD)

**Last Updated:** February 10, 2026
**Phase:** 5 (Backend-Driven CRM Design)
**Purpose:** Defines computation rules for EVERY metric, status, and derived field shown in the UI.

---

## 0. Conventions

- **Time scopes:** `d-1` (yesterday), `last-7d`, `mtd` (1st of month to now), `last-30d`, `last-6m`, `lifetime`
- **Default scope:** `mtd` unless specified otherwise
- **Timezone:** All date filters applied in IST (UTC+05:30), stored in UTC
- **NULL handling:** Nulls in numerators = 0; nulls in denominators = metric returns 0 (not NULL)
- **SQL templates** use `:kam_user_id`, `:dealer_id`, `:start_date`, `:end_date` as bind params

---

## 1. Home Dashboard Metrics (KAM / TL)

### 1.1 SI Achievement

| Field | Value |
|-------|-------|
| `metric_key` | `si_achievement` |
| `display_name` | Stock-Ins (SI) |
| `unit` | `count / target` |
| `dimensions` | `channel` (NGS, GS), `region` |
| Source tables | `leads`, `targets` |
| Filters | `leads.kam_user_id = :user_id`, `leads.status = 'Won'`, `leads.stage = 'Stock-in'`, `leads.converted_at BETWEEN :start_date AND :end_date` |
| **Formula** | `si_achieved = COUNT(*) FROM leads WHERE stage = 'Stock-in' AND status = 'Won'` |
| Target | `targets.si_target WHERE user_id = :user_id AND month = :month` |
| Achievement % | `ROUND(si_achieved / NULLIF(si_target, 0) * 100, 1)` |
| Edge cases | If no target row exists for month, use 0 (achievement = ∞, cap at 999%). If `si_target = 0`, achievement = 0%. |
| Refresh | Real-time (on lead stage change) |

### 1.2 SI Breakdown by Channel

| Field | Value |
|-------|-------|
| `metric_key` | `si_by_channel` |
| `display_name` | SI by Channel |
| `unit` | `count` |
| Source | `leads` |
| **Formula** | `COUNT(*) FROM leads WHERE stage = 'Stock-in' AND status = 'Won' AND channel = :channel AND converted_at BETWEEN :start AND :end` |
| Variants | `si_c2b`, `si_c2d`, `si_gs` — one per channel |

### 1.3 Total Leads Created

| Field | Value |
|-------|-------|
| `metric_key` | `leads_created` |
| `display_name` | Leads Created |
| `unit` | `count` |
| Source | `leads` |
| **Formula** | `COUNT(*) FROM leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start AND :end` |
| Dimensions | `channel`, `dealer_id` |

### 1.4 Inspections

| Field | Value |
|-------|-------|
| `metric_key` | `inspections` |
| `display_name` | Inspections |
| `unit` | `count` |
| Source | `leads` |
| **Formula** | `COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage IN ('Inspection Scheduled', 'Inspection Done', 'Stock-in') AND inspection_date BETWEEN :start AND :end` |
| Edge cases | If a lead skips inspection (direct Stock-in), it still counts as an inspection. |

### 1.5 I2SI (Inspection to Stock-In Ratio)

| Field | Value |
|-------|-------|
| `metric_key` | `i2si` |
| `display_name` | I2SI % |
| `unit` | `percent` |
| Source | `leads` |
| **Formula** | `ROUND(COUNT(CASE WHEN stage = 'Stock-in' AND status = 'Won' THEN 1 END) / NULLIF(COUNT(CASE WHEN stage IN ('Inspection Scheduled', 'Inspection Done', 'Stock-in') THEN 1 END), 0) * 100, 1)` |
| Edge cases | 0 inspections → I2SI = 0% |

### 1.6 Projected Earnings

| Field | Value |
|-------|-------|
| `metric_key` | `projected_earnings` |
| `display_name` | Projected Earnings |
| `unit` | `currency_inr` |
| Source | `leads`, `targets`, `incentive_slabs`, `dcf_leads` |
| **Formula** | See incentive engine rules in Section 5 |
| Refresh | Daily (overnight batch) |

### 1.7 Total Earnings (Actual)

| Field | Value |
|-------|-------|
| `metric_key` | `total_earnings` |
| `display_name` | Total Earnings |
| `unit` | `currency_inr` |
| **Formula** | `si_incentive + dcf_commission` where SI incentive = `si_actual * rate_per_si * score_multiplier` |

---

## 2. Productivity Metrics

### 2.1 Input Score

| Field | Value |
|-------|-------|
| `metric_key` | `input_score` |
| `display_name` | Input Score |
| `unit` | `score_0_100` |
| Source | `call_events`, `visit_events`, `targets` |
| **Formula** | `ROUND((calls_total / NULLIF(call_target, 0) * 0.5 + visits_total / NULLIF(visit_target, 0) * 0.5) * 100, 0)` capped at 100 |
| Gate | `targets.input_score_gate` (default 75). If `input_score < gate`, see slab multiplier rules. |
| Edge cases | If targets are 0, input_score = 0. |

### 2.2 Quality Score

| Field | Value |
|-------|-------|
| `metric_key` | `quality_score` |
| `display_name` | Quality Score |
| `unit` | `score_0_100` |
| Source | `call_events`, `visit_events` |
| **Formula** | `ROUND((productive_calls / NULLIF(total_calls, 0) * 0.5 + productive_visits / NULLIF(total_visits, 0) * 0.5) * 100, 0)` |
| Gate | `targets.quality_score_gate` (default 80) |

### 2.3 Call Productivity Rate

| Field | Value |
|-------|-------|
| `metric_key` | `call_productivity_rate` |
| `display_name` | Call Productivity |
| `unit` | `percent` |
| Source | `call_events` |
| **Formula** | `ROUND(COUNT(CASE WHEN is_productive THEN 1 END) / NULLIF(COUNT(*), 0) * 100, 1)` |
| Filters | `kam_user_id = :user_id`, `call_date BETWEEN :start AND :end` |

### 2.4 Visit Productivity Rate

| Field | Value |
|-------|-------|
| `metric_key` | `visit_productivity_rate` |
| `display_name` | Visit Productivity |
| `unit` | `percent` |
| Source | `visit_events` |
| **Formula** | `ROUND(COUNT(CASE WHEN is_productive THEN 1 END) / NULLIF(COUNT(*), 0) * 100, 1)` |

### 2.5 Total Calls

| Field | Value |
|-------|-------|
| `metric_key` | `calls_total` |
| `display_name` | Total Calls |
| `unit` | `count` |
| Source | `call_events` |
| **Formula** | `COUNT(*) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start AND :end` |

### 2.6 Total Visits

| Field | Value |
|-------|-------|
| `metric_key` | `visits_total` |
| `display_name` | Total Visits |
| `unit` | `count` |
| Source | `visit_events` |
| **Formula** | `COUNT(*) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start AND :end` |

### 2.7 Geofence Compliance Rate

| Field | Value |
|-------|-------|
| `metric_key` | `geofence_compliance` |
| `display_name` | Geofence Compliance |
| `unit` | `percent` |
| Source | `visit_events` |
| **Formula** | `ROUND(COUNT(CASE WHEN is_within_geofence THEN 1 END) / NULLIF(COUNT(*), 0) * 100, 1)` |
| Filter | `status = 'COMPLETED'` (only completed visits) |

### 2.8 Productive Calls / Visits (absolute)

| `metric_key` | `productive_calls` / `productive_visits` |
|---|---|
| **Formula** | `COUNT(*) WHERE is_productive = true` |

### 2.9 Productivity Red Flags

| `metric_key` | `red_flags` |
|---|---|
| Rule | Generated when: input_score < gate, call_productivity < 50%, visit_productivity < 50%, or geofence violations > 3 in 7 days |
| Output | Array of `{ type, severity, message, count, threshold, actual }` |

---

## 3. Dealer Metrics

### 3.1 Dealer Activity Stage Derivation

The frontend uses `deriveDealerActivityStage()` from `data/canonicalMetrics.ts` to compute a 4-tier activity stage. Dormancy is COMPUTED from activity data, not read from a stored status column.

| Stage | Rule |
|-------|------|
| `Transacting` | Has active deals/stock-ins in the time period |
| `Inspecting` | Has inspections but no stock-ins |
| `Lead Giving` | Sharing leads but no inspections |
| `Dormant` | No meaningful activity in the time period |

```typescript
// Frontend usage
import { deriveDealerActivityStage } from '../data/canonicalMetrics';

const stage = deriveDealerActivityStage(dealer);
// Returns: 'Transacting' | 'Inspecting' | 'Lead Giving' | 'Dormant'
```

For backend SQL contexts, the equivalent derivation is:

```sql
CASE
  WHEN has_stock_ins_in_period THEN 'Transacting'
  WHEN has_inspections_in_period THEN 'Inspecting'
  WHEN has_leads_in_period THEN 'Lead Giving'
  ELSE 'Dormant'
END
```

### 3.2 Days Since Last Visit / Call

| Field | Value |
|-------|-------|
| `metric_key` | `days_since_last_visit` / `days_since_last_call` |
| Source | `visit_events` / `call_events` |
| **Formula** | `EXTRACT(DAY FROM NOW() - MAX(visit_date)) FROM visit_events WHERE dealer_id = :dealer_id` |
| Edge case | No visits → returns NULL; UI renders "Never visited" |

### 3.3 Dealer-Level I2SI

Same formula as Section 1.5 but scoped to `dealer_id` instead of `kam_user_id`.

### 3.4 Dealer DCF Metrics

| Metric | Formula |
|--------|---------|
| `dcf_leads_count` | `COUNT(*) FROM dcf_leads WHERE dealer_id = :dealer_id AND created_at BETWEEN ...` |
| `dcf_disbursed_count` | `COUNT(*) FROM dcf_leads WHERE dealer_id = :dealer_id AND overall_status = 'DISBURSED'` |
| `dcf_gmv` | `SUM(loan_amount) FROM dcf_leads WHERE dealer_id = :dealer_id AND overall_status = 'DISBURSED'` |

---

## 4. Lead Status & Stage Derivation Rules

### 4.1 Lead Stages (NGS/GS)

| Stage (enum) | Description | Transition From | Transition To |
|-------------|-------------|-----------------|---------------|
| `PR` | Prospect / Lead Created | (entry) | `PLL`, `Inspection Scheduled` |
| `PLL` | Prospect Lead Listed | `PR` | `Inspection Scheduled` |
| `Inspection Scheduled` | Inspection booked | `PR`, `PLL` | `Inspection Done` |
| `Inspection Done` | Inspection completed | `Inspection Scheduled` | `Negotiation`, `Stock-in` |
| `Negotiation` | Price negotiation | `Inspection Done` | `Stock-in`, `Lost` |
| `Stock-in` | Car stocked in (deal closed) | `Negotiation`, `Inspection Done` | (terminal for SI count) |
| `Sold` | Car sold to end buyer | `Stock-in` | (terminal) |

### 4.2 Lead Status

| Status | Rule |
|--------|------|
| `Active` | Default. Lead is in-progress. |
| `Won` | `stage = 'Stock-in'` or `stage = 'Sold'` AND `converted_at IS NOT NULL` |
| `Lost` | Explicitly marked lost by KAM/TL/system |
| `Expired` | `status = 'Active'` AND `updated_at < NOW() - INTERVAL '90 days'` (system auto-expire) |

### 4.3 DCF Funnel States

| Funnel Stage | overall_status values | Description |
|-------------|----------------------|-------------|
| Onboarding | `ONBOARDING` | Dealer being onboarded to DCF |
| CIBIL Check | `CIBIL_CHECK` | Credit check in progress |
| Doc Collection | `DOC_COLLECTION` | Documents being collected |
| Loan Sanctioned | `SANCTIONED` | Loan approved |
| Disbursed | `DISBURSED` | Money disbursed to dealer |
| Rejected | `REJECTED` | Application rejected (terminal) |

### 4.4 DCF RAG Status Derivation

| RAG | Rule |
|-----|------|
| `green` | Lead age < 7 days AND progressing (sub-stage changed in last 48h) |
| `amber` | Lead age 7–14 days OR no sub-stage change in 48–96h |
| `red` | Lead age > 14 days OR no sub-stage change in > 96h OR explicitly flagged |

```sql
CASE
  WHEN EXTRACT(DAY FROM NOW() - created_at) > 14
    OR EXTRACT(HOUR FROM NOW() - updated_at) > 96 THEN 'red'
  WHEN EXTRACT(DAY FROM NOW() - created_at) > 7
    OR EXTRACT(HOUR FROM NOW() - updated_at) > 48 THEN 'amber'
  ELSE 'green'
END
```

---

## 5. Incentive Calculation Rules

### 5.1 SI-Based Incentive

**CRITICAL GATE:** If `si_achieved < si_target`, total SI incentive = 0.

```
achievement_pct = si_achieved / si_target * 100

IF achievement_pct < 100:
  si_incentive = 0
ELIF achievement_pct >= 100 AND achievement_pct < 110:
  si_incentive = si_achieved * 1000    -- ₹1000 per SI on ALL SIs
ELIF achievement_pct >= 110:
  si_incentive = si_achieved * 1500    -- ₹1500 per SI on ALL SIs
```

### 5.2 Input Score Gate Multiplier

```
IF input_score < 50:
  score_multiplier = 0.0   -- ZERO payout
ELIF input_score < 70:
  score_multiplier = 0.5   -- 50% payout
ELSE:
  score_multiplier = 1.0   -- Full payout
```

### 5.3 DCF Commission

3 line items:

| Line Item | Formula |
|-----------|---------|
| GMV Total | `SUM(loan_amount WHERE overall_status = 'DISBURSED') * 0.01` |
| GMV First Disbursal | `SUM(loan_amount WHERE first_disbursal_for_dealer = true AND overall_status = 'DISBURSED') * 0.005` |
| Onboarding Bonus | `COUNT(DISTINCT dealer_id WHERE dcf_onboarded = true AND dcf_onboarded_at BETWEEN :start AND :end) * 300` |

### 5.4 Total Incentive

```
total_before_score = si_incentive + dcf_total_commission
total_after_score  = total_before_score * score_multiplier
```

### 5.5 Projection Logic

```
days_elapsed = day_of_month(NOW())
days_in_month = days_in_month(NOW())
run_rate = si_achieved_mtd / days_elapsed
projected_si = ROUND(run_rate * days_in_month)
```

Then apply slab logic to `projected_si` to get `projected_earnings`.

---

## 6. Call / Visit Output Format Rules

### 6.1 Call Productivity Determination

| Priority | Source | Rule |
|----------|--------|------|
| 1 | TL Override | If `tl_review.flagged = true` or TL explicitly marks productive/non-productive |
| 2 | KAM Self-Assessment | KAM marks productive during feedback submission |
| 3 | AI Analysis | `sentiment_label = 'Positive'` AND `duration_sec >= 120` → productive |
| 4 | Default | `is_productive = false`, `productivity_source = 'KAM'` |

### 6.2 Visit Productivity Determination

| Priority | Source | Rule |
|----------|--------|------|
| 1 | TL Override | TL overrides productivity flag |
| 2 | KAM Self-Assessment | KAM marks during visit feedback |
| 3 | Geofence Auto | `is_within_geofence = true` AND `duration_sec >= 600` (10 min) → productive |
| 4 | Default | `is_productive = false`, `productivity_source = 'Geofence'` |

### 6.3 Call Duration Format

```
Input:  duration_sec (integer, seconds)
Output: "{minutes}m {seconds}s"    -- e.g., "6m 12s"
Rule:   IF duration_sec IS NULL → "0m 0s"
```

### 6.4 Visit Duration Format

Same as call duration. Additionally:
- `duration_sec = EXTRACT(EPOCH FROM completed_at - check_in_at)` if both timestamps exist
- If `completed_at IS NULL`, visit is still in progress → duration = "In Progress"

---

## 7. Validation Rules Per Table

### 7.1 users

| Field | Rule |
|-------|------|
| `user_id` | NOT NULL, UNIQUE, matches `^(kam\|tl\|admin)-[a-z]+-\d+$` |
| `email` | NOT NULL, UNIQUE, valid email format |
| `role` | IN ('KAM', 'TL', 'ADMIN') |
| `status` | IN ('active', 'inactive') |
| `team_id` | Must reference existing team (except ADMIN) |

### 7.2 dealers

| Field | Rule |
|-------|------|
| `dealer_id` | NOT NULL, UNIQUE, matches `^dealer-[a-z]+-\d+$` |
| `code` | NOT NULL, UNIQUE |
| `segment` | IN ('A', 'B', 'C') |
| `status` | IN ('active', 'dormant', 'inactive') |
| `kam_user_id` | Must reference existing user with role = 'KAM' |
| `tl_user_id` | Must reference existing user with role = 'TL' |
| `latitude` | Between -90 and 90 (if provided) |
| `longitude` | Between -180 and 180 (if provided) |

### 7.3 leads

| Field | Rule |
|-------|------|
| `lead_id` | NOT NULL, UNIQUE |
| `dealer_id` | Must reference existing dealer |
| `channel` | IN ('NGS', 'GS') |
| `lead_type` | IN ('Seller', 'Inventory') |
| `status` | IN ('Active', 'Won', 'Lost', 'Expired') |
| `expected_revenue` | >= 0 |
| `actual_revenue` | >= 0 |
| Referential | `kam_user_id` must match `dealers.kam_user_id` for the given `dealer_id` |

### 7.4 call_events

| Field | Rule |
|-------|------|
| `call_id` | NOT NULL, UNIQUE |
| `call_date` | NOT NULL, not in future |
| `call_status` | IN ('ATTEMPTED', 'CONNECTED', 'NOT_REACHABLE', 'BUSY', 'CALL_BACK') |
| `feedback_status` | IN ('PENDING', 'SUBMITTED') |
| `duration_sec` | >= 0 (if not null) |
| `sentiment_score` | Between 0 and 100 (if not null) |
| Temporal | `call_end_time >= call_start_time` (if both provided) |

### 7.5 visit_events

| Field | Rule |
|-------|------|
| `visit_id` | NOT NULL, UNIQUE |
| `visit_date` | NOT NULL, not in future |
| `visit_type` | IN ('Planned', 'Unplanned') |
| `status` | IN ('NOT_STARTED', 'CHECKED_IN', 'COMPLETED') |
| `check_in_lat` | Between -90 and 90 (if not null) |
| `check_in_lng` | Between -180 and 180 (if not null) |
| Temporal | `completed_at >= check_in_at` (if both provided) |
| Geofence | `distance_from_dealer` must be recalculated from check-in coords vs dealer coords |

### 7.6 dcf_leads

| Field | Rule |
|-------|------|
| `loan_id` | NOT NULL, UNIQUE |
| `rag_status` | IN ('green', 'amber', 'red') |
| `overall_status` | IN ('ONBOARDING', 'CIBIL_CHECK', 'DOC_COLLECTION', 'SANCTIONED', 'DISBURSED', 'REJECTED') |
| `loan_amount` | > 0 (if not null) |
| `ltv` | Between 0 and 100 (if not null) |
| `base_commission` | >= 0 |
| `total_commission` | >= `base_commission` |
| `disbursal_date` | Required when `overall_status = 'DISBURSED'` |

### 7.7 location_requests

| Field | Rule |
|-------|------|
| `status` | IN ('PENDING', 'APPROVED', 'REJECTED') |
| `decided_by` | Required when status != 'PENDING' |
| `decided_at` | Required when status != 'PENDING' |
| `rejection_reason` | Required when status = 'REJECTED' |

### 7.8 Cross-Table Referential Integrity

| Constraint | Rule |
|-----------|------|
| Dealer → KAM | `dealers.kam_user_id` must exist in `users` with `role = 'KAM'` |
| Dealer → TL | `dealers.tl_user_id` must exist in `users` with `role = 'TL'` |
| Lead → Dealer | `leads.dealer_id` must exist in `dealers` |
| Call → Dealer | `call_events.dealer_id` must exist in `dealers` |
| Visit → Dealer | `visit_events.dealer_id` must exist in `dealers` |
| Target uniqueness | `(user_id, month)` is unique in `targets` |

---

## 8. Admin / TL Aggregate Metrics

### 8.1 TL Team Summary

| Metric | Formula |
|--------|---------|
| `team_si_achieved` | `SUM(si_achieved) FROM leads WHERE tl_user_id = :tl_id AND ...` |
| `team_si_target` | `SUM(si_target) FROM targets WHERE user_id IN (SELECT user_id FROM users WHERE team_id = :team_id)` |
| `kams_above_target` | `COUNT(DISTINCT kam_user_id) WHERE kam_si_achieved >= kam_si_target` |
| `avg_kam_input_score` | `AVG(input_score) across team KAMs` |
| `team_health_score` | `kams_above_gate / total_kams * 100` |

### 8.2 Admin Org Summary

| Metric | Formula |
|--------|---------|
| `org_total_si` | `SUM(si_achieved) across all KAMs` |
| `org_total_dealers` | `COUNT(*) FROM dealers WHERE deleted_at IS NULL` |
| `org_active_dealers` | `COUNT(*) FROM dealers WHERE status = 'active'` |
| `org_dormant_dealers` | `COUNT(*) FROM dealers WHERE status = 'dormant'` |
| `org_total_dcf_gmv` | `SUM(loan_amount) FROM dcf_leads WHERE overall_status = 'DISBURSED'` |

---

*End of DRD_DATA_RULEBOOK.md*
