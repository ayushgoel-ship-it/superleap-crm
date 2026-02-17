# Edge Function Testing Guide — Phase 6D

**Phase:** 6D — CRM API via Supabase Edge Function
**For:** Non-technical founder testing

---

## Overview

The CRM API is now deployed as a Supabase Edge Function. It reuses the same
config-driven architecture from Phase 6B: reads `dashboard_layouts` and
`metric_definitions` from your database, executes SQL templates, and returns
structured JSON responses.

---

## Base URL

All CRM API endpoints live at:

```
https://fdmlyrgiktljuyuthgki.supabase.co/functions/v1/make-server-4efaad2c/crm-api
```

---

## Step 1: Test Health Check (Browser — No Auth Required)

Open this URL in your browser:

```
https://fdmlyrgiktljuyuthgki.supabase.co/functions/v1/make-server-4efaad2c/crm-api/health
```

### What "PASS" Looks Like:

```json
{
  "status": "ok",
  "service": "superleap-crm-api",
  "phase": "6D",
  "runtime": "supabase-edge-function",
  "timestamp": "2026-02-10T06:00:00.000Z"
}
```

---

## Step 2: Test Database Verification (Browser — No Auth Required)

Open this URL in your browser:

```
https://fdmlyrgiktljuyuthgki.supabase.co/functions/v1/make-server-4efaad2c/crm-api/verify-db
```

### What "PASS" Looks Like:

```json
{
  "success": true,
  "phase": "6D",
  "summary": "All checks passed — CRM API is ready",
  "checks": [
    { "step": "connection", "status": "PASS", "detail": "Connected via postgresjs. PostgreSQL 15..." },
    { "step": "tables", "status": "PASS", "detail": "15/15 tables found. All present." },
    { "step": "metric_definitions", "status": "PASS", "detail": "26 metric definitions found" },
    { "step": "dashboard_layouts", "status": "PASS", "detail": "3 dashboard layouts found" },
    { "step": "referential_integrity", "status": "PASS", "detail": "All dashboard tile metric_keys reference existing metric_definitions" }
  ]
}
```

### If Tables Are Missing:

This means the Phase 6A migrations haven't been run yet. See `/backend_api/README.md`
Step 3 for instructions on running them via the Supabase SQL Editor.

---

## Step 3: Test Dashboard Endpoint

The dashboard endpoint requires an `Authorization` header, so you can't test
it directly in a browser address bar. Use one of these methods:

### Option A: Supabase Dashboard "Test" UI

1. Go to: https://supabase.com/dashboard/project/fdmlyrgiktljuyuthgki
2. Click **"Edge Functions"** in the left sidebar
3. You'll see the function listed — click on it
4. Use the **"Test"** panel to send a request:
   - **Method:** GET
   - **Path:** `/make-server-4efaad2c/crm-api/v1/dashboard/home`
   - **Headers:**
     ```
     Authorization: Bearer <your-anon-key>
     X-User-Role: KAM
     X-User-Id: kam-ncr-01
     X-User-Name: Rahul Sharma
     ```
5. Click **"Send"**

### Option B: cURL (from Terminal)

```bash
curl -s \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbWx5cmdpa3RsanV5dXRoZ2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTYyMjQsImV4cCI6MjA4NjI3MjIyNH0.P6td3mqAoKYz6wdgPa9Bs2GytZH4x11n2vuTl6oVb3s" \
  -H "X-User-Role: ADMIN" \
  -H "X-User-Id: admin-test" \
  "https://fdmlyrgiktljuyuthgki.supabase.co/functions/v1/make-server-4efaad2c/crm-api/v1/dashboard/home?time_scope=mtd" \
  | python3 -m json.tool
```

### Option C: Browser Console (on any page)

Open browser Developer Tools (F12) → Console tab, and paste:

```javascript
fetch(
  "https://fdmlyrgiktljuyuthgki.supabase.co/functions/v1/make-server-4efaad2c/crm-api/v1/dashboard/home?time_scope=mtd",
  {
    headers: {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbWx5cmdpa3RsanV5dXRoZ2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTYyMjQsImV4cCI6MjA4NjI3MjIyNH0.P6td3mqAoKYz6wdgPa9Bs2GytZH4x11n2vuTl6oVb3s",
      "X-User-Role": "KAM",
      "X-User-Id": "kam-ncr-01",
    }
  }
)
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)));
```

### What "PASS" Looks Like for Dashboard:

```json
{
  "success": true,
  "data": {
    "dashboard_key": "kam_home",
    "role": "KAM",
    "user_id": "kam-ncr-01",
    "user_name": "Rahul Sharma",
    "time_scope": "mtd",
    "period_label": "Feb 2026 (MTD)",
    "tiles": [
      {
        "tile_id": "kam_si",
        "metric_key": "si_count",
        "display_name": "Stock-Ins",
        "position": 1,
        "size": "medium",
        "type": "count",
        "value": 0,
        "unit": "count",
        "rag": "red"
      }
    ],
    "quick_stats": {
      "dealers_active": 0,
      "dealers_dormant": 0,
      "dealers_total": 0,
      "pending_feedback_calls": 0,
      "pending_feedback_visits": 0
    }
  },
  "meta": {
    "timestamp": "2026-02-10T06:00:00.000Z",
    "request_id": "req-1739167200000",
    "time_scope": "mtd",
    "role": "KAM"
  },
  "error": null
}
```

**Note:** If the database has no seed data in the actual data tables (leads,
dealers, etc.), all values will be 0. That's correct — the config-driven
engine is working, it's just counting empty tables. You'll see real numbers
once Phase 7 loads test data.

---

## All Available Endpoints

| Endpoint | Auth Required | Method | Description |
|----------|--------------|--------|-------------|
| `/health` | No | Browser | Health check |
| `/verify-db` | No | Browser | Database verification |
| `/v1/dashboard/home` | Yes* | cURL/Console | Config-driven dashboard |
| `/v1/leads` | Yes* | cURL/Console | List leads (paginated) |
| `/v1/leads/:id` | Yes* | cURL/Console | Lead detail |
| `/v1/dealers` | Yes* | cURL/Console | List dealers (paginated) |
| `/v1/dealers/:id` | Yes* | cURL/Console | Dealer 360 detail |
| `/v1/calls` | Yes* | cURL/Console | List call events |
| `/v1/calls/:id` | Yes* | cURL/Console | Call detail |
| `/v1/visits` | Yes* | cURL/Console | List visit events |
| `/v1/visits/:id` | Yes* | cURL/Console | Visit detail |
| `/v1/notifications` | Yes* | cURL/Console | List notifications |

*Yes = Needs `Authorization: Bearer <anon-key>` header (Supabase requirement
for Edge Functions). The CRM API itself currently uses test auth via
`X-User-Id`/`X-User-Role` headers.

### Query Parameters (all list endpoints):

| Param | Default | Description |
|-------|---------|-------------|
| `time_scope` | `mtd` | `d-1`, `last-7d`, `mtd`, `last-30d`, `last-6m`, `lifetime` |
| `page` | `1` | Page number |
| `page_size` | `20` | Items per page (max 100) |

---

## How to Lock Down for Production

Currently all `/v1/*` endpoints use test auth (X-User-Id / X-User-Role headers).
Before production:

1. **Add JWT verification middleware** to `/v1/*` routes:
   ```typescript
   // In crm_routes.tsx, add before v1 routes:
   crm.use("/v1/*", async (c, next) => {
     const token = c.req.header("Authorization")?.split(" ")[1];
     const supabase = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
     );
     const { data: { user }, error } = await supabase.auth.getUser(token);
     if (error || !user) return c.json({ error: "Unauthorized" }, 401);
     // Look up user in users table, set auth context
     c.set("auth", userToAuthContext(user));
     await next();
   });
   ```

2. **Replace getAuthContext()** to read from the middleware context instead of
   headers.

3. **Remove X-User-Id / X-User-Role header support** from production builds.

---

*End of EDGE_FUNCTION_TESTING.md*
