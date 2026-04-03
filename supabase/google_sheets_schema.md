# Google Sheets Schema for Superleap CRM

## How It Works
1. Create a Google Sheet with the 7 tabs below
2. Paste the `google_sheets_sync.gs` script into Extensions → Apps Script
3. Deploy as Web App, run "Superleap CRM → Sync Now"
4. Data flows: Sheets → Supabase `*_raw` tables → App

---

## Sheet 1: `Dealers`

| Column | Type | Required | Example |
|--------|------|----------|---------|
| dealer_id | text | Yes | `dealer-ncr-001` |
| name | text | Yes | `Daily Motoz` |
| code | text | Yes | `DR080433` |
| city | text | Yes | `Gurugram` |
| region | text | Yes | `NCR` |
| segment | text | Yes | `A` / `B` / `C` |
| status | text | Yes | `active` / `inactive` |
| kam_user_id | text | No | `kam-ncr-01` |
| phone | text | No | `+919876543210` |
| email | text | No | `contact@dealer.com` |
| latitude | number | No | `28.4595` |
| longitude | number | No | `77.0266` |
| tags | text | No | `Top Dealer, DCF Onboarded` |

## Sheet 2: `Leads`

| Column | Type | Required | Example |
|--------|------|----------|---------|
| lead_id | text | Yes | `lead-ncr-001` |
| dealer_id | text | Yes | `dealer-ncr-001` |
| customer_name | text | Yes | `Ramesh Kumar` |
| customer_phone | text | Yes | `+919812345678` |
| reg_no | text | No | `HR26DK8888` |
| make | text | Yes | `Maruti` |
| model | text | Yes | `Swift VXI` |
| year | number | Yes | `2021` |
| channel | text | Yes | `C2B` / `C2D` / `GS` |
| stage | text | Yes | `Lead Created` / `Inspection Scheduled` / `Stock-in` / etc. |
| status | text | Yes | `Active` / `Converted` / `Lost` |
| expected_revenue | number | No | `8500` |
| city | text | No | `Gurugram` |
| kam_user_id | text | No | `kam-ncr-01` |
| created_at | date | No | `2026-02-04` |

## Sheet 3: `Calls`

| Column | Type | Required | Example |
|--------|------|----------|---------|
| call_id | text | Yes | `call-20260205-001` |
| dealer_id | text | Yes | `dealer-ncr-001` |
| kam_user_id | text | Yes | `kam-ncr-01` |
| call_date | date | Yes | `2026-02-05` |
| call_time | text | No | `10:30 AM` |
| duration_sec | number | No | `272` |
| outcome | text | Yes | `Connected` / `No Answer` / `Busy` |
| feedback_status | text | No | `PENDING` / `SUBMITTED` |
| notes | text | No | `Discussed new leads` |
| customer_phone | text | No | `+919876543210` |

## Sheet 4: `Visits`

| Column | Type | Required | Example |
|--------|------|----------|---------|
| visit_id | text | Yes | `visit-20260205-001` |
| dealer_id | text | Yes | `dealer-ncr-001` |
| kam_user_id | text | Yes | `kam-ncr-01` |
| visit_date | date | Yes | `2026-02-05` |
| visit_type | text | Yes | `Planned` / `Unplanned` |
| status | text | Yes | `COMPLETED` / `CHECKED_IN` / `NOT_STARTED` |
| check_in_lat | number | No | `28.4595` |
| check_in_lng | number | No | `77.0266` |
| duration_min | number | No | `45` |
| notes | text | No | `Productive visit` |

## Sheet 5: `DCF_Leads`

| Column | Type | Required | Example |
|--------|------|----------|---------|
| dcf_id | text | Yes | `dcf-001` |
| customer_name | text | Yes | `Suresh Patel` |
| dealer_id | text | Yes | `dealer-ncr-001` |
| loan_amount | number | Yes | `400000` |
| car_value | number | No | `500000` |
| roi | number | No | `12` |
| tenure | number | No | `48` |
| emi | number | No | `10000` |
| stage | text | Yes | `Applied` / `Approved` / `Disbursed` |
| status | text | Yes | `green` / `amber` / `red` |
| kam_user_id | text | No | `kam-ncr-01` |

## Sheet 6: `Org`

| Column | Type | Required | Example |
|--------|------|----------|---------|
| user_id | text | Yes | `kam-ncr-01` |
| name | text | Yes | `Amit Verma` |
| role | text | Yes | `KAM` / `TL` / `ADMIN` |
| region | text | Yes | `NCR` |
| city | text | No | `Gurugram` |
| phone | text | No | `+919876543201` |
| email | text | Yes | `amit@cars24.com` |
| tl_id | text | No | `tl-ncr-01` (for KAMs) |

## Sheet 7: `Config`

| Column | Type | Required | Example |
|--------|------|----------|---------|
| key | text | Yes | `target_calls_per_day` |
| value | text | Yes | `15` |
