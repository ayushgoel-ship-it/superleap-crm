# SuperLeap CRM — Backend API Server

**Phase:** 6C (Supabase Connected)
**For:** Non-technical founder

---

## What This Is

This is the "brain" that sits between the database and the mobile app. When a
KAM opens their home screen, the app asks this server: "What tiles should I
show, and what are the numbers?"

The server:
1. Looks up the **dashboard layout** for that user's role (KAM/TL/Admin)
2. For each tile, reads the **metric definition** from the config table
3. Runs the SQL formula stored in the config table
4. Sends back the results in a standard format

**The key insight:** No business logic lives in this code. All formulas, labels,
thresholds, and tile layouts live in the database config tables. If you want to
rename a metric or change a formula, you update the database — not this code.

---

## Quick Start (Step by Step)

### Step 1: Get Your Database Connection String

1. Open your browser and go to:
   **https://supabase.com/dashboard/project/fdmlyrgiktljuyuthgki**

2. Click **"Project Settings"** (the gear icon at the bottom-left of the sidebar)

3. Click **"Database"** in the left menu

4. Scroll down to the **"Connection string"** section

5. Click the **"URI"** tab

6. You'll see something like:
   ```
   postgresql://postgres.fdmlyrgiktljuyuthgki:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

7. Replace `[YOUR-PASSWORD]` with your database password
   (this is the password you set when you created the Supabase project)

> **Forgot your password?** On the same page, click "Reset database password"
> to set a new one.

---

### Step 2: Create Your .env File

1. In the `backend_api/` folder, find the file called **`.env.example`**

2. Make a copy of it and name the copy **`.env`**

3. Open `.env` in any text editor

4. Replace the `DATABASE_URL` line with the connection string from Step 1:
   ```
   DATABASE_URL=postgresql://postgres.fdmlyrgiktljuyuthgki:YOUR_ACTUAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

5. Save the file

> **Important:** Never share your `.env` file or commit it to Git. It contains
> your database password.

---

### Step 3: Create the Database Tables

Before the API can work, the database needs the tables from Phase 6A.

1. Go to: **https://supabase.com/dashboard/project/fdmlyrgiktljuyuthgki**

2. Click **"SQL Editor"** in the left sidebar

3. Click **"New query"**

4. Open each file in the `migrations/` folder (in order, 001 through 013),
   copy its contents, paste into the SQL Editor, and click **"Run"**

   Run them in this order:
   - `001_create_teams.sql`
   - `002_create_users.sql`
   - `003_add_deferred_fks.sql`
   - `004_create_dealers.sql`
   - `005_create_leads.sql`
   - `006_create_dcf_tables.sql`
   - `007_create_call_events.sql`
   - `008_create_visit_events.sql`
   - `009_create_support_tables.sql`
   - `010_create_metric_definitions.sql`
   - `011_create_dashboard_layouts.sql`
   - `012_create_audit_log.sql`
   - `013_create_indexes.sql`

5. Then run the seed files:
   - `seed/metrics.sql` (loads 26 metric definitions)
   - `seed/dashboards.sql` (loads 3 dashboard layouts)

> **Tip:** You can also paste multiple files into one query. Just make sure
> they're in the correct order.

---

### Step 4: Verify the Connection

#### Option A: Live Verification (Recommended — No Setup Needed)

The Supabase Edge Function has a built-in verify endpoint. Just open this URL
in your browser:

```
https://fdmlyrgiktljuyuthgki.supabase.co/functions/v1/make-server-4efaad2c/verify-db
```

You should see a JSON response like:
```json
{
  "success": true,
  "phase": "6C",
  "summary": "All checks passed — backend_api is ready",
  "checks": [
    { "step": "connection", "status": "PASS", "detail": "Connected to Supabase Postgres" },
    { "step": "tables", "status": "PASS", "detail": "15/15 tables found. All present." },
    { "step": "metric_definitions", "status": "PASS", "detail": "26 metric definitions found" },
    { "step": "dashboard_layouts", "status": "PASS", "detail": "3 dashboard layouts found" }
  ]
}
```

If any checks show "WARN" or "FAIL", follow the instructions in Step 3 above.

#### Option B: Local Verification Script

If you have Node.js installed on your computer:

```bash
cd backend_api
npx tsx scripts/verify.ts
```

This will print a detailed report showing:
- Whether the database connection works
- Which tables exist
- How many metrics and dashboards are seeded
- Any issues that need fixing

---

### Step 5: What Comes Next

Once verification passes, the backend is ready. The typical next steps are:

- **Phase 7:** Deploy the API server and connect the frontend
- **Phase 8:** Load real data into the tables (users, dealers, leads, etc.)

You do NOT need to write any code to change metrics or dashboards.
See the "How to Change Things" section below.

---

## How It Works (Plain English)

```
App (phone) → "Show me my dashboard"
                    ↓
API Server → reads dashboard_layouts table → "KAM gets 8 tiles"
                    ↓
           → for each tile, reads metric_definitions → "SI = count leads where..."
                    ↓
           → runs the formula against actual data
                    ↓
           → sends back: { tile: "Stock-Ins", value: 18, target: 25, color: "amber" }
                    ↓
App → renders the tile (it doesn't know what "Stock-In" means, it just shows it)
```

---

## How to Change Things (No Code Needed)

| What You Want to Change | Where to Change It | How |
|------------------------|-------------------|-----|
| Rename a metric | Supabase SQL Editor | `UPDATE metric_definitions SET display_name = 'New Name' WHERE metric_key = '...'` |
| Change a formula | Supabase SQL Editor | `UPDATE metric_definitions SET sql_template = '...' WHERE metric_key = '...'` |
| Change red/amber/green thresholds | Supabase SQL Editor | `UPDATE metric_definitions SET rag_thresholds = '{"green_min": 80, "amber_min": 50}' WHERE metric_key = '...'` |
| Add a tile to a dashboard | Supabase SQL Editor | See `docs/VERIFICATION/CONFIG_DRIVEN_DASHBOARD.md` |
| Remove a tile | Supabase SQL Editor | See `docs/VERIFICATION/CONFIG_DRIVEN_DASHBOARD.md` |
| Reorder tiles | Supabase SQL Editor | Update `position` values in `dashboard_layouts.tiles` |

**None of these require code changes.** The API reads from the database every time.

---

## Files Explained

| File | What It Does |
|------|-------------|
| `.env.example` | Template for your database connection settings |
| `.env` | Your actual settings (you create this — never share it) |
| `server.ts` | Starts the web server and wires everything together |
| `db.ts` | Connects to Supabase Postgres (with SSL) |
| `metricsEngine.ts` | Takes a SQL formula + parameters, runs it safely, returns a number |
| `dashboardService.ts` | Builds the complete dashboard response for a user |
| `routes/dashboard.ts` | Handles `GET /v1/dashboard/home` |
| `routes/leads.ts` | Handles `GET /v1/leads` and `GET /v1/leads/:lead_id` |
| `routes/dealers.ts` | Handles `GET /v1/dealers` and `GET /v1/dealers/:dealer_id` |
| `routes/calls.ts` | Handles `GET /v1/calls` and `GET /v1/calls/:call_id` |
| `routes/visits.ts` | Handles `GET /v1/visits` and `GET /v1/visits/:visit_id` |
| `routes/notifications.ts` | Handles `GET /v1/notifications` |
| `middleware/auth.ts` | Checks who the user is and what they can see |
| `middleware/errorHandler.ts` | Makes sure errors come back in a consistent format |
| `utils/timeScope.ts` | Converts "mtd" to actual dates (Feb 1 → today) |
| `utils/formatters.ts` | Formats durations ("372 seconds" → "6m 12s") |
| `utils/roleConfig.ts` | Defines what each role can see |
| `utils/responseEnvelope.ts` | Wraps all responses in the standard format |
| `scripts/verify.ts` | Tests database connection and reports what's working |

---

## What This Does NOT Do

- Does NOT store or compute business logic — that's in `metric_definitions`
- Does NOT know metric names — those come from the database
- Does NOT decide tile order — that's in `dashboard_layouts`
- Does NOT hard-code any formulas — those are SQL templates in the database

---

*End of README.md*
