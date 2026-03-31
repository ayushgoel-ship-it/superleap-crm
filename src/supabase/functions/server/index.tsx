import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

import * as kv from "./kv_store.tsx";
import crmRoutes from "./crm_routes.tsx";
import visitRoutes from "./visit_routes.tsx";

const app = new Hono();

// ==========================================================
// GLOBAL MIDDLEWARE
// ==========================================================

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type", "Authorization", "apikey",
      "X-User-Id", "X-User-Role", "X-User-Name", "X-Team-Id", "X-Region",
      "x-sync-secret"
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ==========================================================
// HEALTH
// ==========================================================

app.get("/make-server-4efaad2c/health", (c) => {
  return c.json({ status: "ok" });
});

// ==========================================================
// SYNC ROUTES
// ==========================================================

app.get("/make-server-4efaad2c/sync/ping", (c) => {
  return c.json({
    ok: true,
    ts: new Date().toISOString(),
    hasSecret: Boolean(Deno.env.get("SYNC_SECRET")),
  });
});

app.post("/make-server-4efaad2c/sync/push", async (c) => {
  const expectedSecret = Deno.env.get("SYNC_SECRET") ?? "";
  const receivedSecret = c.req.header("x-sync-secret") ?? "";

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  async function upsert(table: string, rows: any[] = []) {
    if (!rows.length) return { table, upserted: 0 };

    const { error } = await supabase
      .from(table)
      .upsert(
        rows.map((r) => ({ id: r.id, payload: r.payload })),
        { onConflict: "id" }
      );

    if (error) throw new Error(`${table}: ${error.message}`);

    return { table, upserted: rows.length };
  }

  try {
    const results = [];

    results.push(await upsert("dealers_raw", body.dealers));
    results.push(await upsert("leads_raw", body.leads));
    results.push(await upsert("calls_raw", body.calls));
    results.push(await upsert("visits_raw", body.visits));
    results.push(await upsert("dcf_leads_raw", body.dcf_leads));
    results.push(await upsert("location_requests_raw", body.location_requests));
    results.push(await upsert("org_raw", body.org));

    return c.json({
      ok: true,
      source: body.source ?? "unknown",
      snapshot_id: body.snapshot_id ?? null,
      results,
      ts: new Date().toISOString(),
    });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

// ==========================================================
// EXISTING CRM + FIELD OPS
// ==========================================================

app.route("/make-server-4efaad2c/crm-api", crmRoutes);
app.route("/make-server-4efaad2c/field-ops", visitRoutes);

// ==========================================================
// START SERVER
// ==========================================================

Deno.serve(app.fetch);