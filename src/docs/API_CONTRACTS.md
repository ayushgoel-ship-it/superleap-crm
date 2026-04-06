# API Contracts — SuperLeap CRM

## Base URL
```
https://<projectId>.supabase.co/functions/v1/make-server-4efaad2c/crm-api
```

## Auth Pattern (all endpoints)
```
Headers:
  Content-Type: application/json
  apikey: <SUPABASE_ANON_KEY>
  Authorization: Bearer <SUPABASE_ANON_KEY>
```

## Standard Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "ISO-8601",
    "request_id": "req-...",
    "time_scope": "mtd",
    "role": "KAM"
  },
  "error": null
}
```

---

## Mock Fallback Consistency

> **Mock fallback supported consistently for list, detail, and CEP patch.**
>
> When the Postgres DB is unavailable or the leads table is empty, all three leads
> endpoints (`GET /v1/leads/list`, `GET /v1/leads/:lead_id`, `PATCH /v1/leads/:lead_id/cep`)
> resolve leads from a shared in-memory mock dataset (`mock_leads.tsx`). This ensures:
>
> - A lead returned by the list endpoint can always be fetched via the detail endpoint
> - CEP patches against mock leads persist in-memory for the lifetime of the Edge Function instance
> - Response shapes are identical regardless of data source (DB vs mock)
>
> Resolution order for all endpoints: **DB → Mock → 404**

---

## Endpoints

### Phase A — CEP

#### `PATCH /v1/leads/:lead_id/cep`
Update Customer Expected Price for a lead.

**Body:**
```json
{ "cep": 350000 }
```
- `cep`: `number | null` — must be `null` or `>= 1000`

**Response:**
```json
{
  "success": true,
  "data": {
    "lead_id": "lead-ncr-001",
    "cep": 350000,
    "updated_at": "2026-02-11T10:30:00Z"
  }
}
```

---

### Phase B — Leaderboard

#### `GET /v1/leaderboard`
Ranked leaderboard for KAMs or TLs.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| scope | `kam \| tl` | `kam` | Ranking scope |
| time_scope | `mtd \| d-1 \| l7d \| last_month \| lmtd` | `mtd` | Time window |
| region | string | — | Filter by region |
| team_id | string | — | Filter by team |
| current_user_id | string | — | Highlight current user |

**Response:**
```json
{
  "success": true,
  "data": {
    "your_rank_card": {
      "rank": 3,
      "total": 10,
      "percentile": 70,
      "behind_text": "2 SI-equiv behind #2 (Sneha)",
      "stock_ins": 22,
      "i2si_pct": 58.9,
      "dcf_disbursed": 5,
      "stockin_equiv": 37,
      "projected_achievement_pct": 93,
      "score": 78
    },
    "top3": [ ... ],
    "full_list": [
      {
        "rank": 1,
        "id": "kam-1",
        "name": "Amit Verma",
        "city": "Gurgaon",
        "region": "NCR",
        "stock_ins": 28,
        "i2si_pct": 62.2,
        "dcf_disbursed": 8,
        "stockin_equiv": 52,
        "projected_achievement_pct": 120,
        "score": 92,
        "lmtd_delta": 12,
        "is_current_user": true
      }
    ],
    "notes": "Rank = 60% SI-equiv + 40% projected achievement%."
  }
}
```

**Rank Logic:**
```
stockin_equiv = SI_count + (3 × DCF_disbursed_count)
projected_value = (value_so_far / days_elapsed) × days_in_month
rank_score = 0.60 × normalize(stockin_equiv) + 0.40 × normalize(achievement%)
```

---

### Phase C — Incentive Summary

#### `GET /v1/incentives/summary`
TL/KAM incentive projection with slab breakdown.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| time_scope | string | `mtd` | Time window |
| user_id | string | — | Target user |

**Response:**
```json
{
  "success": true,
  "data": {
    "projected_incentive": 42500,
    "base_incentive": 35200,
    "boosters": [
      { "label": "I2SI Target Achieved", "amount": 5000, "explanation": "I2SI ≥ 12%" },
      { "label": "DCF Onboardings", "amount": 500, "explanation": "5 × ₹100" },
      { "label": "DCF GMV Bonus", "amount": 1800, "explanation": "₹6.0L × 0.3%" }
    ],
    "reducers": [],
    "gates": [
      { "label": "Score Gate (≥70)", "passed": true, "explanation": "Score: 72 — Full", "impact": "100%" }
    ],
    "slab_info": {
      "achievement_pct": 87,
      "i2si_pct": 14.1,
      "per_si_rate": 800,
      "slab_label": "95 to 110 × 12 to 15"
    },
    "explanations": [
      "Base: 22 SI × ₹800/SI = ₹17,600",
      "Slab: 95_to_110 × 12_to_15",
      "Projected EOM: 30 SI (100% achievement)"
    ],
    "meta": {
      "target_si": 30,
      "achieved_si": 22,
      "target_i2si": 12,
      "achieved_i2si": 14.1,
      "days_elapsed": 11,
      "days_in_month": 28,
      "score": 72
    }
  }
}
```

**TL Incentive Slab Matrix (₹/SI):**
| Achievement | I2SI <12% | I2SI 12-15% | I2SI >15% |
|-------------|-----------|-------------|-----------|
| <95% | ₹400 | ₹500 | ₹600 |
| 95-110% | ₹600 | ₹800 | ₹1,000 |
| >110% | ₹800 | ₹1,100 | ₹1,400 |

**Score Gate:**
- ≥70: Full incentive (100%)
- 50-70: Half incentive (50%)
- <50: Zero incentive (0%)

---

### Phase D — Leads (Production-Wired)

#### `GET /v1/leads/list`
Production-ready paginated leads listing with full filter support.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | `1` | Page number |
| page_size | int | `20` | Items per page (max 100) |
| time_scope | string | `mtd` | Time window: `mtd`, `d-1`, `last-7d`, `last-30d`, `lifetime` |
| channel | string | — | Filter: `NGS`, `GS`, `DCF` |
| stage | string | — | Filter by stage (e.g. `Inspection Done`, `PLL`, `Stock-in`) |
| kam_id | string | — | Filter by assigned KAM employee_id |
| dealer_id | string | — | Filter by dealer |
| cep_status | string | — | `pending` (CEP null/0) or `captured` (CEP > 0) |
| status | string | — | Filter: `Active`, `Won`, `Lost` |
| search | string | — | ILIKE on customer_name, reg_no, dealer name |
| sort_by | string | `created_at` | Sort column: `created_at`, `updated_at`, `cep`, `stage` |
| sort_order | string | `desc` | `asc` or `desc` |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "lead_id": "lead-ncr-001",
        "dealer_id": "DLR-NCR-001",
        "assigned_to": "kam-ncr-01",
        "dealer_name": "Autoworld Motors",
        "dealer_code": "DLR-NCR-001",
        "kam_name": "Amit Verma",
        "customer_name": "Rajesh Gupta",
        "reg_no": "DL-01-AB-1234",
        "car": "Maruti Swift 2019",
        "channel": "NGS",
        "lead_type": "Seller",
        "stage": "Inspection Done",
        "status": "Active",
        "cep": 450000,
        "cep_confidence": "confirmed",
        "c24_quote": 480000,
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2026-02-10T14:20:00Z",
        "inspection_date": "2026-01-20T09:00:00Z",
        "days_old": 27
      }
    ],
    "page": 1,
    "page_size": 20,
    "total": 42
  }
}
```

**Channel-correct pricing fields:**
- NGS / GS channels → `c24_quote` (C24 internal quote)
- DCF channel → `ltv` (Lifetime Value)
- All channels → `cep` (Customer Expected Price)

---

#### `GET /v1/leads/:lead_id`
Full lead detail with all pricing fields, dealer snapshot, and identifiers.

**Response:**
```json
{
  "success": true,
  "data": {
    "lead_id": "lead-ncr-001",
    "dealer_id": "DLR-NCR-001",
    "assigned_to": "kam-ncr-01",
    "kam_id": "kam-ncr-01",
    "kam_name": "Amit Verma",
    "kam_phone": "+919876543210",

    "customer_name": "Rajesh Gupta",
    "customer_phone": "+919123456789",
    "reg_no": "DL-01-AB-1234",
    "make": "Maruti", "model": "Swift", "year": 2019,

    "channel": "NGS",
    "lead_type": "Seller",
    "stage": "Inspection Done",
    "status": "Active",

    "cep": 450000,
    "cep_confidence": "confirmed",
    "cep_notes": "Dealer confirmed price during call",
    "c24_quote": 480000,
    "expected_revenue": 480000,
    "actual_revenue": 0,

    "city": "Delhi", "region": "NCR",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-02-10T14:20:00Z",
    "inspection_date": "2026-01-20T09:00:00Z",
    "converted_at": null,

    "dealer_snapshot": {
      "id": "DLR-NCR-001",
      "name": "Autoworld Motors",
      "code": "DLR-NCR-001",
      "city": "Delhi",
      "segment": "Platinum",
      "phone": "+919876543210"
    },
    "timeline": []
  }
}
```

---

### All Endpoints (Summary)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/verify-db` | Database verification |
| GET | `/v1/dashboard/home` | Config-driven dashboard |
| GET | `/v1/leads` | List leads — legacy (paginated) |
| **GET** | **`/v1/leads/list`** | **List leads — production (paginated, full filters, CEP/pricing)** |
| **GET** | **`/v1/leads/:lead_id`** | **Lead detail (full pricing + dealer snapshot)** |
| **PATCH** | **`/v1/leads/:lead_id/cep`** | **Update CEP** |
| GET | `/v1/dealers` | List dealers (paginated) |
| GET | `/v1/dealers/:dealer_id` | Dealer 360 detail |
| GET | `/v1/calls` | List calls (paginated) |
| GET | `/v1/calls/:call_id` | Call detail |
| GET | `/v1/visits` | List visits (paginated) |
| GET | `/v1/visits/:visit_id` | Visit detail |
| GET | `/v1/notifications` | List notifications |
| GET | `/v1/leaderboard` | KAM/TL leaderboard |
| GET | `/v1/incentives/summary` | Incentive projection |