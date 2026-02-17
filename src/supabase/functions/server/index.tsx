import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import crmRoutes from "./crm_routes.tsx";
import visitRoutes from "./visit_routes.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type", "Authorization", "apikey",
      // CRM API test headers
      "X-User-Id", "X-User-Role", "X-User-Name", "X-Team-Id", "X-Region",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ===========================================================================
// Existing make-server endpoints
// ===========================================================================

// Health check endpoint
app.get("/make-server-4efaad2c/health", (c) => {
  return c.json({ status: "ok" });
});

// Phase 6C: Database Verification (via Supabase JS client)
app.get("/make-server-4efaad2c/verify-db", async (c) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const checks: Array<{ step: string; status: string; detail: string }> = [];

  try {
    const { data: kvTest, error: kvErr } = await supabase
      .from("kv_store_4efaad2c")
      .select("key")
      .limit(1);

    if (kvErr) {
      checks.push({ step: "connection", status: "FAIL", detail: kvErr.message });
      return c.json({ success: false, checks }, 500);
    }
    checks.push({ step: "connection", status: "PASS", detail: "Connected to Supabase Postgres" });

    const expectedTables = [
      "metric_definitions", "dashboard_layouts", "users", "teams",
      "dealers", "leads", "call_events", "visit_events", "notifications",
      "audit_log", "targets", "incentive_slabs", "dcf_leads",
      "dcf_timeline_events", "location_requests",
    ];

    const tableChecks: string[] = [];
    const missingTables: string[] = [];

    for (const table of expectedTables) {
      const { error } = await supabase.from(table).select("*").limit(0);
      if (error) {
        missingTables.push(table);
      } else {
        tableChecks.push(table);
      }
    }

    checks.push({
      step: "tables",
      status: missingTables.length === 0 ? "PASS" : "WARN",
      detail: `${tableChecks.length}/${expectedTables.length} tables found. ${missingTables.length > 0 ? "Missing: " + missingTables.join(", ") : "All present."}`,
    });

    if (tableChecks.includes("metric_definitions")) {
      const { count, error: metricErr } = await supabase
        .from("metric_definitions")
        .select("*", { count: "exact", head: true });

      if (metricErr) {
        checks.push({ step: "metric_definitions", status: "FAIL", detail: metricErr.message });
      } else {
        checks.push({
          step: "metric_definitions",
          status: (count ?? 0) > 0 ? "PASS" : "WARN",
          detail: `${count ?? 0} metric definitions found${(count ?? 0) === 0 ? " (run seed/metrics.sql)" : ""}`,
        });
      }
    }

    if (tableChecks.includes("dashboard_layouts")) {
      const { count, error: layoutErr } = await supabase
        .from("dashboard_layouts")
        .select("*", { count: "exact", head: true });

      if (layoutErr) {
        checks.push({ step: "dashboard_layouts", status: "FAIL", detail: layoutErr.message });
      } else {
        checks.push({
          step: "dashboard_layouts",
          status: (count ?? 0) > 0 ? "PASS" : "WARN",
          detail: `${count ?? 0} dashboard layouts found${(count ?? 0) === 0 ? " (run seed/dashboards.sql)" : ""}`,
        });
      }
    }

    const allPassed = checks.every((ch) => ch.status === "PASS");

    return c.json({
      success: allPassed,
      phase: "6C",
      summary: allPassed
        ? "All checks passed — backend_api is ready"
        : "Some checks need attention — see details",
      checks,
    });
  } catch (err: any) {
    checks.push({ step: "unexpected", status: "FAIL", detail: err.message });
    return c.json({ success: false, checks }, 500);
  }
});

// ===========================================================================
// Phase 6D: CRM API Routes
// Mounted at /make-server-4efaad2c/crm-api/*
//
// All CRM API endpoints are served under this prefix:
//   /make-server-4efaad2c/crm-api/health
//   /make-server-4efaad2c/crm-api/verify-db
//   /make-server-4efaad2c/crm-api/v1/dashboard/home
//   /make-server-4efaad2c/crm-api/v1/leads
//   /make-server-4efaad2c/crm-api/v1/dealers
//   /make-server-4efaad2c/crm-api/v1/calls
//   /make-server-4efaad2c/crm-api/v1/visits
//   /make-server-4efaad2c/crm-api/v1/notifications
//
// ⚠️ TEST ONLY: /v1/* endpoints are currently public.
//    See docs/VERIFICATION/EDGE_FUNCTION_TESTING.md for lock-down instructions.
// ===========================================================================

app.route("/make-server-4efaad2c/crm-api", crmRoutes);
app.route("/make-server-4efaad2c/field-ops", visitRoutes);

Deno.serve(app.fetch);