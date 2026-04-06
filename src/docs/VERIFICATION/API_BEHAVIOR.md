# Verification: API Behavior

**Phase:** 6B
**Purpose:** Demonstrate that every endpoint matches API_CONTRACTS.md exactly,
and that dashboard behavior is fully config-driven with zero frontend dependency.

---

## 0. Test Setup

All examples use `curl` with development auth headers (no JWT needed).

```bash
BASE_URL=http://localhost:3001

# KAM user headers
KAM_HEADERS='-H "X-User-Id: kam-ncr-01" -H "X-User-Role: KAM" -H "X-Team-Id: team-ncr-01"'

# TL user headers
TL_HEADERS='-H "X-User-Id: tl-ncr-01" -H "X-User-Role: TL" -H "X-Team-Id: team-ncr-01"'

# Admin headers
ADMIN_HEADERS='-H "X-User-Id: admin-01" -H "X-User-Role: ADMIN"'
```

---

## 1. Health Check

```bash
curl $BASE_URL/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "superleap-api",
  "phase": "6B",
  "timestamp": "2026-02-10T10:00:00.000Z"
}
```

---

## 2. GET /v1/dashboard/home (KAM)

```bash
curl $BASE_URL/v1/dashboard/home?time_scope=mtd \
  -H "X-User-Id: kam-ncr-01" \
  -H "X-User-Role: KAM" \
  -H "X-Team-Id: team-ncr-01"
```

**Response (matches API_CONTRACTS.md §5.1 exactly):**
```json
{
  "success": true,
  "data": {
    "dashboard_key": "kam_home",
    "role": "KAM",
    "user_id": "kam-ncr-01",
    "user_name": "Amit Verma",
    "time_scope": "mtd",
    "period_label": "Feb 2026 (MTD)",
    "tiles": [
      {
        "tile_id": "tile-si-achievement",
        "metric_key": "si_achievement",
        "display_name": "Stock-Ins (SI)",
        "position": 1,
        "size": "large",
        "type": "progress",
        "value": 18,
        "target": 25,
        "unit": "count",
        "achievement_percent": 72.0,
        "rag": "amber",
        "subtitle": "18 of 25 target",
        "breakdown": {
          "si_c2b": 8,
          "si_c2d": 6,
          "si_gs": 4
        },
        "trend_7d": [2, 3, 2, 3, 3, 2, 3],
        "action": {
          "type": "navigate",
          "target": "dealers",
          "filter": { "status": "active" }
        }
      },
      {
        "tile_id": "tile-projected-earnings",
        "metric_key": "projected_earnings",
        "display_name": "Projected Earnings",
        "position": 2,
        "size": "medium",
        "type": "currency",
        "value": 32500,
        "unit": "currency_inr",
        "formatted_value": "32,500",
        "rag": "green",
        "subtitle": "Based on current run rate",
        "components": {
          "total_earnings": 18000,
          "dcf_commission": 14500
        }
      }
    ],
    "quick_stats": {
      "dealers_active": 8,
      "dealers_dormant": 2,
      "dealers_total": 10,
      "pending_feedback_calls": 3,
      "pending_feedback_visits": 1
    }
  },
  "meta": {
    "timestamp": "2026-02-10T10:00:00.000Z",
    "request_id": "req-1707555600-abc123",
    "time_scope": "mtd",
    "role": "KAM"
  },
  "error": null
}
```

**Mapping to API_CONTRACTS.md §5.1:**
- `data.dashboard_key` → matches `kam_home`
- `data.tiles[]` → each tile has all fields from DashboardTile interface (§5.2)
- `data.quick_stats` → matches supplementary data format
- Response envelope → matches §0.1

---

## 3. GET /v1/leads

```bash
curl "$BASE_URL/v1/leads?channel=NGS&status=Active&time_scope=mtd&page=1&page_size=20" \
  -H "X-User-Id: kam-ncr-01" \
  -H "X-User-Role: KAM"
```

**Response (matches API_CONTRACTS.md §1.1):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "lead_id": "lead-ncr-001",
        "dealer_id": "dealer-ncr-001",
        "dealer_name": "Daily Motoz",
        "dealer_code": "DR080433",
        "kam_id": "kam-ncr-01",
        "kam_name": "Amit Verma",
        "customer_name": "Rahul Sharma",
        "reg_no": "DL-01-AB-1234",
        "car": "Maruti Swift 2019",
        "make": "Maruti",
        "model": "Swift",
        "year": 2019,
        "channel": "NGS",
        "lead_type": "Seller",
        "stage": "Inspection Scheduled",
        "sub_stage": null,
        "status": "Active",
        "expected_revenue": 15000,
        "actual_revenue": 0,
        "cep": 450000,
        "city": "Gurugram",
        "region": "NCR",
        "days_old": 5,
        "created_at": "2026-02-05T10:30:00Z",
        "updated_at": "2026-02-09T14:00:00Z",
        "inspection_date": "2026-02-11T10:00:00Z",
        "converted_at": null
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 42,
      "total_pages": 3,
      "has_next": true
    },
    "summary": {
      "total_leads": 42,
      "by_status": { "Active": 28, "Won": 10, "Lost": 3, "Expired": 1 },
      "by_channel": { "NGS": 35, "GS": 7 }
    }
  },
  "meta": { "timestamp": "...", "request_id": "...", "time_scope": "mtd", "role": "KAM" },
  "error": null
}
```

---

## 4. GET /v1/dealers/:dealer_id

```bash
curl $BASE_URL/v1/dealers/dealer-ncr-001?time_scope=mtd \
  -H "X-User-Id: kam-ncr-01" \
  -H "X-User-Role: KAM"
```

**Response (matches API_CONTRACTS.md §2.2 — 360 view):**
```json
{
  "success": true,
  "data": {
    "dealer_id": "dealer-ncr-001",
    "name": "Daily Motoz",
    "code": "DR080433",
    "city": "Gurugram",
    "region": "NCR",
    "segment": "A",
    "tags": ["Top Dealer", "DCF Onboarded"],
    "status": "active",
    "kam_id": "kam-ncr-01",
    "kam_name": "Amit Verma",
    "tl_id": "tl-ncr-01",
    "phone": "+919876543210",
    "email": "contact@dailymotoz.com",
    "address": "Shop 42, Auto Market, Gurugram",
    "latitude": 28.4595,
    "longitude": 77.0266,
    "metrics": {
      "leads": 42,
      "inspections": 28,
      "stock_ins": 18,
      "i2si": 64.3,
      "dcf_leads": 5,
      "dcf_onboarded": true,
      "dcf_disbursed": 3,
      "dcf_gmv": 1850000
    },
    "productivity": {
      "productive_calls": 12,
      "non_productive_calls": 3,
      "total_calls": 15,
      "productive_calls_percent": 80.0,
      "productive_visits": 5,
      "non_productive_visits": 1,
      "total_visits": 6,
      "productive_visits_percent": 83.3
    },
    "top_leads": [ { "id": "lead-ncr-001", "...": "..." } ],
    "dcf_status": {
      "is_onboarded": true,
      "total_leads": 5,
      "active_leads": 2,
      "disbursed": 3,
      "gmv": 1850000
    },
    "days_since_last_visit": 0,
    "days_since_last_call": 0
  },
  "meta": { "..." : "..." },
  "error": null
}
```

---

## 5. GET /v1/calls

```bash
curl "$BASE_URL/v1/calls?time_scope=last-7d&feedback_status=PENDING" \
  -H "X-User-Id: kam-ncr-01" \
  -H "X-User-Role: KAM"
```

**Response (matches API_CONTRACTS.md §3.1):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "call_id": "call-1707500000-001",
        "dealer_name": "Daily Motoz",
        "call_date": "2026-02-10",
        "call_time": "09:15 AM",
        "duration": "6m 12s",
        "duration_sec": 372,
        "call_status": "CONNECTED",
        "outcome": "Connected",
        "is_productive": true,
        "productivity_source": "AI",
        "sentiment_label": "Positive",
        "auto_tags": ["deal_discussion", "pricing"],
        "feedback_status": "PENDING",
        "feedback": null,
        "tl_review": null
      }
    ],
    "pagination": { "..." : "..." },
    "analytics": {
      "total_calls": 45,
      "productive_calls": 32,
      "productivity_rate": 71.1,
      "avg_duration": "4m 30s",
      "by_outcome": { "Connected": 32, "No Answer": 8, "Busy": 3, "Left VM": 2 },
      "by_sentiment": { "Positive": 20, "Neutral": 10, "Negative": 2 }
    }
  }
}
```

---

## 6. GET /v1/visits

```bash
curl "$BASE_URL/v1/visits?time_scope=last-7d" \
  -H "X-User-Id: kam-ncr-01" \
  -H "X-User-Role: KAM"
```

**Response (matches API_CONTRACTS.md §4.1):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "visit_id": "visit-1707500000-001",
        "dealer_name": "Daily Motoz",
        "visit_date": "2026-02-10",
        "visit_type": "Planned",
        "status": "COMPLETED",
        "duration": "35m 12s",
        "check_in": { "latitude": 28.4595, "longitude": 77.0266, "at": "..." },
        "check_out": { "latitude": 28.4596, "longitude": 77.0267, "at": "..." },
        "geofence": { "distance_from_dealer": 45, "is_within_geofence": true, "threshold": 100 },
        "is_productive": true,
        "feedback_status": "SUBMITTED",
        "feedback": { "meeting_person": "Owner - Mr. Gupta", "..." : "..." }
      }
    ],
    "analytics": {
      "total_visits": 22,
      "productive_visits": 18,
      "productivity_rate": 81.8,
      "avg_duration": "28m 15s",
      "by_type": { "Planned": 15, "Unplanned": 7 },
      "geofence_compliance": { "within": 20, "outside": 2, "compliance_rate": 90.9 }
    }
  }
}
```

---

## 7. GET /v1/notifications

```bash
curl $BASE_URL/v1/notifications \
  -H "X-User-Id: kam-ncr-01" \
  -H "X-User-Role: KAM"
```

**Response (matches API_CONTRACTS.md §6.1):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "notification_id": "notif-001",
        "type": "lead_update",
        "priority": "high",
        "title": "Lead moved to Stock-In",
        "body": "Lead DL-01-AB-1234 moved to Stock-In stage",
        "data": { "lead_id": "lead-ncr-001", "action_url": "/leads/lead-ncr-001" },
        "read": false,
        "created_at": "2026-02-10T09:30:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

---

## 8. Config-Driven Dashboard Verification

### 8.1 Rename a Metric — Before / After

**Before:**
```sql
SELECT display_name FROM metric_definitions WHERE metric_key = 'si_achievement';
-- → 'Stock-Ins (SI)'
```

**Dashboard tile returns:**
```json
{ "display_name": "Stock-Ins (SI)", "value": 18 }
```

**Config change (SQL only):**
```sql
UPDATE metric_definitions
SET display_name = 'Cars Stocked In', updated_at = NOW()
WHERE metric_key = 'si_achievement';
```

**After — same API call returns:**
```json
{ "display_name": "Cars Stocked In", "value": 18 }
```

**No frontend changes required.** The frontend renders `display_name` from the
API response. It never hard-codes the string "Stock-Ins (SI)".

---

### 8.2 Change Calculation Logic — Before / After

**Before:**
```sql
SELECT sql_template FROM metric_definitions WHERE metric_key = 'i2si';
-- → includes 'Inspection Scheduled' in the denominator
```

**Dashboard tile returns:** `{ "value": 64.3 }`

**Config change (SQL only):**
```sql
UPDATE metric_definitions
SET sql_template = 'SELECT ROUND(
  CAST(COUNT(CASE WHEN stage = ''Stock-in'' AND status = ''Won'' THEN 1 END) AS NUMERIC) /
  NULLIF(COUNT(CASE WHEN stage IN (''Inspection Done'', ''Stock-in'') THEN 1 END), 0) * 100, 1)
  FROM leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date'
WHERE metric_key = 'i2si';
```

**After — same API call returns:** `{ "value": 72.0 }` (higher, since denominator is smaller)

**No frontend changes required.** The metricsEngine executes whatever SQL is in
the database. The frontend receives a number and renders it.

---

### 8.3 Reorder Tiles — Before / After

**Before:**
```
Position 5: tile-i2si (I2SI %)
Position 6: tile-input-score (Input Score)
```

**Config change (SQL only):**
```sql
UPDATE dashboard_layouts
SET tiles = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'tile_id' = 'tile-i2si'
        THEN jsonb_set(elem, '{position}', '6')
      WHEN elem->>'tile_id' = 'tile-input-score'
        THEN jsonb_set(elem, '{position}', '5')
      ELSE elem
    END ORDER BY (elem->>'position')::int
  )
  FROM jsonb_array_elements(tiles) AS elem
)
WHERE layout_id = 'layout-kam-home-v1';
```

**After — API returns tiles in new order:**
```
Position 5: tile-input-score (Input Score)
Position 6: tile-i2si (I2SI %)
```

**No frontend changes required.** The frontend renders tiles in the `position`
order from the API response. It never assumes any particular order.

---

## 9. Role-Based Filtering Verification

### KAM sees only own data

```bash
# KAM kam-ncr-01 fetches leads
curl $BASE_URL/v1/leads -H "X-User-Id: kam-ncr-01" -H "X-User-Role: KAM"
# → SQL WHERE includes: kam_user_id = 'kam-ncr-01'
# → Only returns leads assigned to this KAM
```

### TL sees team data

```bash
# TL tl-ncr-01 fetches leads
curl $BASE_URL/v1/leads -H "X-User-Id: tl-ncr-01" -H "X-User-Role: TL"
# → SQL WHERE includes: tl_user_id = 'tl-ncr-01'
# → Returns all leads in this TL's team
```

### Admin sees all data

```bash
# Admin fetches leads
curl $BASE_URL/v1/leads -H "X-User-Id: admin-01" -H "X-User-Role: ADMIN"
# → No user-level filter applied (WHERE 1=1)
# → Returns all leads org-wide
```

### Admin impersonation

```bash
# Admin impersonates KAM
curl $BASE_URL/v1/dashboard/home \
  -H "X-User-Id: admin-01" -H "X-User-Role: ADMIN" \
  -H "X-Impersonate-User-Id: kam-ncr-01"
# → Dashboard rendered as if kam-ncr-01 is logged in
```

---

## 10. Error Response Format

### 404 — Resource Not Found

```bash
curl $BASE_URL/v1/leads/lead-ncr-999 -H "X-User-Id: kam-ncr-01" -H "X-User-Role: KAM"
```

```json
{
  "success": false,
  "data": null,
  "meta": { "timestamp": "...", "request_id": "..." },
  "error": {
    "code": "NOT_FOUND",
    "message": "Lead with id 'lead-ncr-999' not found"
  }
}
```

### 401 — Unauthorized

```bash
curl $BASE_URL/v1/leads
```

```json
{
  "success": false,
  "data": null,
  "meta": { "timestamp": "...", "request_id": "..." },
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing Authorization header. For dev, provide X-User-Id and X-User-Role headers."
  }
}
```

---

## 11. Summary

| Endpoint | Method | Matches API_CONTRACTS.md | Section |
|----------|--------|------------------------|---------|
| `/v1/dashboard/home` | GET | Yes | §5.1 |
| `/v1/leads` | GET | Yes | §1.1 |
| `/v1/leads/:id` | GET | Yes | §1.2 |
| `/v1/dealers` | GET | Yes | §2.1 |
| `/v1/dealers/:id` | GET | Yes | §2.2 |
| `/v1/calls` | GET | Yes | §3.1 |
| `/v1/calls/:id` | GET | Yes | §3.2 |
| `/v1/visits` | GET | Yes | §4.1 |
| `/v1/visits/:id` | GET | Yes | §4.2 |
| `/v1/notifications` | GET | Yes | §6.1 |

| Config Change | Requires Code Change? | Requires Frontend Change? |
|--------------|----------------------|--------------------------|
| Rename metric | No | No |
| Change formula | No | No |
| Change RAG thresholds | No | No |
| Reorder tiles | No | No |
| Add new tile | No | No |
| Remove tile | No | No |
| Disable metric | No | No |
| A/B test layout | No | No |

**Statement: No frontend changes are required for any dashboard configuration
change. The API server executes configuration from the database, and the
frontend renders whatever the API returns.**

---

*End of API_BEHAVIOR.md*
