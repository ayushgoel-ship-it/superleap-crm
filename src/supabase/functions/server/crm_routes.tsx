/**
 * CRM API — All Routes (Deno/Supabase Edge Function)
 * Phase: 6D | Ported from: /backend_api/routes/*.ts
 *
 * Single Hono app with all CRM API routes:
 *   GET /health              — Public health check
 *   GET /verify-db           — Public DB verification
 *   GET /v1/dashboard/home   — Config-driven dashboard
 *   GET /v1/leads            — List leads (paginated, legacy)
 *   GET /v1/leads/list       — List leads (production: full filters, CEP/pricing)
 *   GET /v1/leads/:lead_id   — Lead detail (full pricing + dealer snapshot)
 *   PATCH /v1/leads/:id/cep  — Update CEP
 *   GET /v1/dealers          — List dealers (paginated)
 *   GET /v1/dealers/:id      — Dealer 360 detail
 *   GET /v1/calls            — List calls (paginated)
 *   GET /v1/calls/:id        — Call detail
 *   GET /v1/visits           — List visits (paginated)
 *   GET /v1/visits/:id       — Visit detail
 *   GET /v1/notifications    — List notifications
 *   GET /v1/leaderboard      — KAM/TL ranking
 *   GET /v1/incentives/summary — Incentive projection
 *
 * ⚠️ TEST ONLY: All /v1/* endpoints are currently public for founder
 *    smoke-testing. Before production, add JWT auth middleware.
 *    See docs/VERIFICATION/EDGE_FUNCTION_TESTING.md for lock-down instructions.
 */

import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

import db from "./crm_db.tsx";
import { buildDashboard } from "./crm_dashboard_service.tsx";
import {
  resolveTimeScope,
  roleFilterForTable,
  getEffectiveContext,
  successEnvelope,
  errorEnvelope,
  parsePagination,
  buildPagination,
  formatDuration,
  formatTimeIST,
  daysOld,
  daysSinceLabel,
} from "./crm_utils.tsx";
import type { AuthContext, UserRole } from "./crm_utils.tsx";
// Mock leads removed — all data from Supabase only
import { requireAuth, requireRole, type AuthResult } from "./auth_middleware.tsx";

// ---------------------------------------------------------------------------
// Hono App
// ---------------------------------------------------------------------------

const crm = new Hono();

// ── Apply auth middleware to /v1/* API routes only (health + verify-db stay public) ──
crm.use("/v1/*", requireAuth());
crm.use("/v1/*", requireRole(["KAM", "TL", "ADMIN"]));

// ---------------------------------------------------------------------------
// Auth Helper (upgraded: uses validated auth from middleware)
// ---------------------------------------------------------------------------

/**
 * Build AuthContext from the validated auth middleware result.
 * Falls back to header-based context for backward compatibility.
 */
function getAuthContext(c: { req: { header: (name: string) => string | undefined }; get: (key: string) => any }): AuthContext {
  const auth = c.get("auth") as AuthResult | undefined;

  if (auth) {
    return {
      user_id: auth.userId,
      role: auth.role as UserRole,
      team_id: c.req.header("X-Team-Id") || null,
      name: auth.name,
      region: c.req.header("X-Region") || "NCR",
    };
  }

  // Fallback (should not reach here if middleware is applied)
  const userId = c.req.header("X-User-Id") || "admin-test-user";
  const role = (c.req.header("X-User-Role") || "ADMIN") as UserRole;
  const name = c.req.header("X-User-Name") || "Test User";
  const teamId = c.req.header("X-Team-Id") || null;
  const region = c.req.header("X-Region") || "NCR";

  return {
    user_id: userId,
    role,
    team_id: teamId,
    name,
    region,
  };
}

// ---------------------------------------------------------------------------
// Lead Resolution Helpers
// ---------------------------------------------------------------------------

/** Standard SELECT for full lead detail with dealer + KAM JOINs. */
const LEAD_DETAIL_SQL = `
  SELECT l.*, d.name AS dealer_name, d.code AS dealer_code,
         d.city AS dealer_city, d.segment AS dealer_segment, d.phone AS dealer_phone,
         u.name AS kam_name, u.phone AS kam_phone
  FROM leads l LEFT JOIN dealers d ON l.dealer_id = d.dealer_id
  LEFT JOIN users u ON l.kam_user_id = u.user_id
  WHERE l.lead_id = $1 AND l.deleted_at IS NULL`;

/**
 * Format a DB row (with JOINed dealer/user columns) into the standard
 * lead-detail response shape. Used by both GET and PATCH to avoid duplication.
 */
function formatDbRowForDetail(row: Record<string, unknown>): Record<string, unknown> {
  const ch = String(row.channel || "").toUpperCase();
  const isDCF = ch === "DCF";
  return {
    lead_id: row.lead_id,
    dealer_id: row.dealer_id,
    assigned_to: row.kam_user_id,
    dealer_name: row.dealer_name,
    dealer_code: row.dealer_code,
    kam_id: row.kam_user_id,
    kam_name: row.kam_name,
    kam_phone: row.kam_phone,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    reg_no: row.reg_no,
    make: row.make,
    model: row.model,
    year: row.year,
    variant: row.variant || null,
    channel: row.channel,
    lead_type: row.lead_type,
    stage: row.stage,
    sub_stage: row.sub_stage,
    status: row.status,
    cep: row.cep != null ? parseFloat(String(row.cep)) : null,
    cep_confidence: row.cep_confidence || null,
    cep_notes: row.cep_notes || null,
    ...(isDCF
      ? { ltv: row.ltv != null ? parseFloat(String(row.ltv)) : null }
      : { c24_quote: row.c24_quote != null ? parseFloat(String(row.c24_quote)) : (parseFloat(String(row.expected_revenue)) || null) }),
    expected_revenue: parseFloat(String(row.expected_revenue)) || 0,
    actual_revenue: parseFloat(String(row.actual_revenue)) || 0,
    city: row.city,
    region: row.region,
    created_at: row.created_at,
    updated_at: row.updated_at,
    inspection_date: row.inspection_date || null,
    converted_at: row.converted_at || null,
    dealer_snapshot: {
      id: row.dealer_id,
      name: row.dealer_name,
      code: row.dealer_code,
      city: row.dealer_city,
      segment: row.dealer_segment,
      phone: row.dealer_phone,
    },
    timeline: [],
  };
}

/**
 * INSERT a mock lead into the DB `leads` table (promotes mock → DB).
 * Uses INSERT … ON CONFLICT to handle races where another request already
 * inserted the same lead_id. Applies `cepOverride` and `now` to the inserted row.
 *
 * Returns true if the row was inserted/upserted, false on error.
 */
async function upsertMockLeadToDB(
  mock: MockLead,
  cepOverride: number | null,
  now: string,
): Promise<boolean> {
  const confidence = cepOverride != null ? "confirmed" : mock.cep_confidence;
  await db.queryOne(
    `INSERT INTO leads (
       lead_id, dealer_id, kam_user_id, tl_user_id,
       customer_name, customer_phone, reg_no,
       make, model, year, variant,
       channel, lead_type, stage, sub_stage, status,
       expected_revenue, actual_revenue,
       cep, cep_confidence, cep_notes, c24_quote, ltv,
       city, region,
       created_at, updated_at,
       inspection_date, converted_at, deleted_at
     ) VALUES (
       $1,  $2,  $3,  $4,
       $5,  $6,  $7,
       $8,  $9,  $10, $11,
       $12, $13, $14, $15, $16,
       $17, $18,
       $19, $20, $21, $22, $23,
       $24, $25,
       $26, $27,
       $28, $29, $30
     )
     ON CONFLICT (lead_id) DO UPDATE SET
       cep            = EXCLUDED.cep,
       cep_confidence = EXCLUDED.cep_confidence,
       updated_at     = EXCLUDED.updated_at`,
    [
      mock.lead_id,        mock.dealer_id,      mock.kam_user_id,    mock.tl_user_id,
      mock.customer_name,  mock.customer_phone,  mock.reg_no,
      mock.make,           mock.model,           mock.year,           mock.variant,
      mock.channel,        mock.lead_type,       mock.stage,          mock.sub_stage,  mock.status,
      mock.expected_revenue, mock.actual_revenue,
      cepOverride,         confidence,            mock.cep_notes,     mock.c24_quote,  mock.ltv,
      mock.city,           mock.region,
      mock.created_at,     now,
      mock.inspection_date, mock.converted_at,   null, // deleted_at
    ],
  );
  return true;
}

// ============================================================================
// PUBLIC ENDPOINTS (no auth required)
// ============================================================================

/**
 * GET /health — Public health check
 */
crm.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "superleap-crm-api",
    phase: "6D",
    runtime: "supabase-edge-function",
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /verify-db — Public database verification
 * Checks connectivity, Phase 6A tables, seed data.
 */
crm.get("/verify-db", async (c) => {
  const checks: Array<{ step: string; status: string; detail: string }> = [];

  try {
    // Step 1: Direct Postgres connection test
    const connResult = await db.testConnection();
    if (!connResult.connected) {
      checks.push({ step: "connection", status: "FAIL", detail: connResult.error || "Unknown error" });
      return c.json({ success: false, phase: "6D", checks }, 500);
    }
    checks.push({ step: "connection", status: "PASS", detail: `Connected via postgresjs. ${connResult.version}` });

    // Step 2: Check Phase 6A tables
    const expectedTables = [
      "metric_definitions", "dashboard_layouts", "users", "teams",
      "dealers", "leads", "call_events", "visit_events", "notifications",
      "audit_log", "targets", "incentive_slabs", "dcf_leads",
      "dcf_timeline_events", "location_requests",
    ];

    const tableResult = await db.queryAll<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    const existingTables = tableResult.map((r) => r.table_name);

    const found = expectedTables.filter((t) => existingTables.includes(t));
    const missing = expectedTables.filter((t) => !existingTables.includes(t));

    checks.push({
      step: "tables",
      status: missing.length === 0 ? "PASS" : "WARN",
      detail: `${found.length}/${expectedTables.length} tables found.${missing.length > 0 ? " Missing: " + missing.join(", ") : " All present."}`,
    });

    // Step 3: metric_definitions count
    if (found.includes("metric_definitions")) {
      const count = await db.queryScalar<number>("SELECT COUNT(*)::int FROM metric_definitions");
      checks.push({
        step: "metric_definitions",
        status: (count ?? 0) > 0 ? "PASS" : "WARN",
        detail: `${count ?? 0} metric definitions found${(count ?? 0) === 0 ? " (run seed/metrics.sql)" : ""}`,
      });
    }

    // Step 4: dashboard_layouts count
    if (found.includes("dashboard_layouts")) {
      const count = await db.queryScalar<number>("SELECT COUNT(*)::int FROM dashboard_layouts");
      checks.push({
        step: "dashboard_layouts",
        status: (count ?? 0) > 0 ? "PASS" : "WARN",
        detail: `${count ?? 0} dashboard layouts found${(count ?? 0) === 0 ? " (run seed/dashboards.sql)" : ""}`,
      });
    }

    // Step 5: Referential integrity — all tile metric_keys exist in metric_definitions
    if (found.includes("metric_definitions") && found.includes("dashboard_layouts")) {
      const orphans = await db.queryAll<{ metric_key: string }>(`
        SELECT DISTINCT elem->>'metric_key' AS metric_key
        FROM dashboard_layouts, jsonb_array_elements(tiles) AS elem
        WHERE NOT EXISTS (
          SELECT 1 FROM metric_definitions
          WHERE metric_key = elem->>'metric_key'
        )
      `);
      checks.push({
        step: "referential_integrity",
        status: orphans.length === 0 ? "PASS" : "WARN",
        detail: orphans.length === 0
          ? "All dashboard tile metric_keys reference existing metric_definitions"
          : `${orphans.length} orphan metric_key(s): ${orphans.map((o) => o.metric_key).join(", ")}`,
      });
    }

    const allPassed = checks.every((ch) => ch.status === "PASS");
    return c.json({
      success: allPassed,
      phase: "6D",
      summary: allPassed
        ? "All checks passed — CRM API is ready"
        : "Some checks need attention — see details",
      checks,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    checks.push({ step: "unexpected", status: "FAIL", detail: message });
    return c.json({ success: false, phase: "6D", checks }, 500);
  }
});

// ============================================================================
// API ENDPOINTS — /v1/*
// ⚠️ TEST ONLY: These are currently public for smoke testing.
// TO LOCK DOWN: Add auth middleware before these routes.
// ============================================================================

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

/**
 * GET /v1/dashboard/home — Config-driven dashboard
 * Query params: time_scope (d-1 | last-7d | mtd | last-30d | last-6m | lifetime)
 */
crm.get("/v1/dashboard/home", async (c) => {
  try {
    const auth = getAuthContext(c);
    const timeScope = c.req.query("time_scope") || "mtd";
    const dateRange = resolveTimeScope(timeScope);

    const dashboard = await buildDashboard(auth, dateRange, timeScope);

    return c.json(successEnvelope(dashboard, { time_scope: timeScope, role: auth.role }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Dashboard] Error:", message);
    return c.json(errorEnvelope("DASHBOARD_ERROR", `Failed to build dashboard: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// LEADS
// ---------------------------------------------------------------------------

crm.get("/v1/leads", async (c) => {
  try {
    const auth = getAuthContext(c);
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const { page, pageSize, offset } = parsePagination(query);
    const timeScope = query.time_scope || "mtd";
    const dateRange = resolveTimeScope(timeScope);

    const conditions: string[] = ["l.deleted_at IS NULL"];
    const params: unknown[] = [];
    let paramIdx = 1;

    const roleFilter = roleFilterForTable(auth, "leads", paramIdx);
    if (roleFilter.clause !== "1=1") {
      conditions.push(`l.${roleFilter.clause}`);
      params.push(...roleFilter.params);
      paramIdx += roleFilter.paramOffset;
    }

    conditions.push(`l.created_at >= $${paramIdx}`);
    params.push(dateRange.start_date);
    paramIdx++;
    conditions.push(`l.created_at <= $${paramIdx}`);
    params.push(dateRange.end_date);
    paramIdx++;

    if (query.channel) { conditions.push(`l.channel = $${paramIdx}`); params.push(query.channel); paramIdx++; }
    if (query.status) { conditions.push(`l.status = $${paramIdx}`); params.push(query.status); paramIdx++; }
    if (query.stage) { conditions.push(`l.stage = $${paramIdx}`); params.push(query.stage); paramIdx++; }
    if (query.dealer_id) { conditions.push(`l.dealer_id = $${paramIdx}`); params.push(query.dealer_id); paramIdx++; }
    if (query.search) {
      conditions.push(`(l.customer_name ILIKE $${paramIdx} OR l.reg_no ILIKE $${paramIdx} OR d.name ILIKE $${paramIdx})`);
      params.push(`%${query.search}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(" AND ");
    const validSorts: Record<string, string> = { created_at: "l.created_at", updated_at: "l.updated_at", customer_name: "l.customer_name", stage: "l.stage" };
    const sortBy = validSorts[query.sort_by] || "l.created_at";
    const sortOrder = query.sort_order === "asc" ? "ASC" : "DESC";

    const totalItems = (await db.queryScalar<number>(
      `SELECT COUNT(*) FROM leads l LEFT JOIN dealers d ON l.dealer_id = d.dealer_id WHERE ${whereClause}`, params
    )) ?? 0;

    const dataParams = [...params, pageSize, offset];
    const rows = await db.queryAll<Record<string, unknown>>(
      `SELECT l.*, d.name AS dealer_name, d.code AS dealer_code, u.name AS kam_name
       FROM leads l LEFT JOIN dealers d ON l.dealer_id = d.dealer_id LEFT JOIN users u ON l.kam_user_id = u.user_id
       WHERE ${whereClause} ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      dataParams
    );

    const items = rows.map((row) => ({
      lead_id: row.lead_id,
      dealer_id: row.dealer_id,
      dealer_name: row.dealer_name,
      dealer_code: row.dealer_code,
      kam_id: row.kam_user_id,
      kam_name: row.kam_name,
      customer_name: row.customer_name,
      reg_no: row.reg_no,
      car: `${row.make} ${row.model}${row.year ? " " + row.year : ""}`,
      channel: row.channel,
      stage: row.stage,
      sub_stage: row.sub_stage,
      status: row.status,
      expected_revenue: parseFloat(String(row.expected_revenue)) || 0,
      actual_revenue: parseFloat(String(row.actual_revenue)) || 0,
      days_old: daysOld(row.created_at as string),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return c.json(successEnvelope({
      items,
      pagination: buildPagination(page, pageSize, totalItems),
    }, { time_scope: timeScope, role: auth.role }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Leads] List error:", message);
    return c.json(errorEnvelope("LEADS_ERROR", `Failed to fetch leads: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// LEADS — Production-wired list + detail (Phase D)
// ---------------------------------------------------------------------------

/**
 * GET /v1/leads/list — Production-ready paginated leads listing
 *
 * Query:
 *   page, page_size         — pagination (defaults 1 / 20)
 *   time_scope              — mtd | d-1 | last-7d | last-30d | lifetime
 *   channel                 — C2B | C2D | GS | DCF
 *   stage                   — any stage string
 *   kam_id                  — filter by assigned KAM employee_id
 *   dealer_id               — filter by dealer
 *   cep_status              — pending | captured
 *   search                  — ILIKE on customer_name, reg_no, dealer name
 *   sort_by                 — created_at | updated_at | cep | stage
 *   sort_order              — asc | desc (default desc)
 *
 * Response shape:
 *   { success, data: { items, page, page_size, total }, meta, error }
 *
 * Each item includes channel-correct secondary value:
 *   - C2B / C2D / GS → c24_quote
 *   - DCF            → ltv
 */
crm.get("/v1/leads/list", async (c) => {
  try {
    const auth = getAuthContext(c);
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const { page, pageSize, offset } = parsePagination(query);
    const timeScope = query.time_scope || "mtd";
    const dateRange = resolveTimeScope(timeScope);

    // ── Build WHERE clause ──
    const conditions: string[] = ["l.deleted_at IS NULL"];
    const params: unknown[] = [];
    let pi = 1; // param index

    // Role-scoping
    const rf = roleFilterForTable(auth, "leads", pi);
    if (rf.clause !== "1=1") {
      conditions.push(`l.${rf.clause}`);
      params.push(...rf.params);
      pi += rf.paramOffset;
    }

    // Time window
    conditions.push(`l.created_at >= $${pi}`);
    params.push(dateRange.start_date);
    pi++;
    conditions.push(`l.created_at <= $${pi}`);
    params.push(dateRange.end_date);
    pi++;

    // Optional filters
    if (query.channel) {
      conditions.push(`l.channel = $${pi}`);
      params.push(query.channel.toUpperCase());
      pi++;
    }
    if (query.stage) {
      conditions.push(`l.stage = $${pi}`);
      params.push(query.stage);
      pi++;
    }
    if (query.kam_id) {
      conditions.push(`l.kam_user_id = $${pi}`);
      params.push(query.kam_id);
      pi++;
    }
    if (query.dealer_id) {
      conditions.push(`l.dealer_id = $${pi}`);
      params.push(query.dealer_id);
      pi++;
    }
    if (query.status) {
      conditions.push(`l.status = $${pi}`);
      params.push(query.status);
      pi++;
    }

    // CEP status filter
    if (query.cep_status === "pending") {
      conditions.push("(l.cep IS NULL OR l.cep = 0)");
    } else if (query.cep_status === "captured") {
      conditions.push("(l.cep IS NOT NULL AND l.cep > 0)");
    }

    // Full-text search
    if (query.search) {
      conditions.push(
        `(l.customer_name ILIKE $${pi} OR l.reg_no ILIKE $${pi} OR d.name ILIKE $${pi})`
      );
      params.push(`%${query.search}%`);
      pi++;
    }

    const where = conditions.join(" AND ");

    // ── Sort ──
    const sortMap: Record<string, string> = {
      created_at: "l.created_at",
      updated_at: "l.updated_at",
      cep: "l.cep",
      stage: "l.stage",
      customer_name: "l.customer_name",
    };
    const sortCol = sortMap[query.sort_by] || "l.created_at";
    const sortDir = query.sort_order === "asc" ? "ASC" : "DESC";

    // ── Count ──
    let total = 0;
    try {
      total =
        (await db.queryScalar<number>(
          `SELECT COUNT(*)::int FROM leads l
           LEFT JOIN dealers d ON l.dealer_id = d.dealer_id
           WHERE ${where}`,
          params
        )) ?? 0;
    } catch (countErr: unknown) {
      console.log("[Leads/list] count query failed:", countErr instanceof Error ? countErr.message : String(countErr));
    }

    // ── Data ──
    let items: Array<Record<string, unknown>> = [];
    try {
      const dataParams = [...params, pageSize, offset];
      const rows = await db.queryAll<Record<string, unknown>>(
        `SELECT l.lead_id, l.dealer_id, l.kam_user_id,
                l.customer_name, l.customer_phone, l.reg_no,
                l.make, l.model, l.year, l.variant,
                l.channel, l.lead_type, l.stage, l.sub_stage, l.status,
                l.cep, l.cep_confidence, l.cep_notes,
                l.c24_quote, l.ltv,
                l.expected_revenue, l.actual_revenue,
                l.city, l.region,
                l.inspection_date, l.converted_at,
                l.created_at, l.updated_at,
                d.name   AS dealer_name,
                d.code   AS dealer_code,
                d.city   AS dealer_city,
                u.name   AS kam_name,
                u.phone  AS kam_phone
         FROM leads l
         LEFT JOIN dealers d ON l.dealer_id = d.dealer_id
         LEFT JOIN users   u ON l.kam_user_id = u.user_id
         WHERE ${where}
         ORDER BY ${sortCol} ${sortDir}
         LIMIT $${pi} OFFSET $${pi + 1}`,
        dataParams
      );

      items = rows.map((r) => {
        const ch = String(r.channel || "").toUpperCase();
        const isDCF = ch === "DCF";

        return {
          // identifiers
          lead_id: r.lead_id,
          dealer_id: r.dealer_id,
          assigned_to: r.kam_user_id, // employee_id of assigned KAM
          dealer_name: r.dealer_name,
          dealer_code: r.dealer_code,
          kam_name: r.kam_name,

          // customer / vehicle
          customer_name: r.customer_name,
          reg_no: r.reg_no,
          car: `${r.make || ""} ${r.model || ""}${r.year ? " " + r.year : ""}`.trim(),
          make: r.make,
          model: r.model,
          year: r.year,

          // business
          channel: r.channel,
          lead_type: r.lead_type,
          stage: r.stage,
          sub_stage: r.sub_stage,
          status: r.status,

          // pricing — channel-correct
          cep: r.cep != null ? parseFloat(String(r.cep)) : null,
          cep_confidence: r.cep_confidence || null,
          ...(isDCF
            ? { ltv: r.ltv != null ? parseFloat(String(r.ltv)) : null }
            : { c24_quote: r.c24_quote != null ? parseFloat(String(r.c24_quote)) : (parseFloat(String(r.expected_revenue)) || null) }),

          // dates
          created_at: r.created_at,
          updated_at: r.updated_at,
          inspection_date: r.inspection_date || null,
          days_old: daysOld(r.created_at as string),
        };
      });
    } catch (dataErr: unknown) {
      console.error("[Leads/list] data query failed:", dataErr instanceof Error ? dataErr.message : String(dataErr));
      // No mock fallback — return empty result set
      total = 0;
      items = [];
    }

    return c.json(
      successEnvelope(
        { items, page, page_size: pageSize, total },
        { time_scope: timeScope, role: auth.role }
      )
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Leads/list] Error:", message);
    return c.json(errorEnvelope("LEADS_LIST_ERROR", `Failed to list leads: ${message}`), 500);
  }
});

crm.get("/v1/leads/:lead_id", async (c) => {
  try {
    const auth = getAuthContext(c);
    const lead_id = c.req.param("lead_id");

    // ── Step 1: DB-first — persisted data is the source of truth. ──
    try {
      const row = await db.queryOne<Record<string, unknown>>(LEAD_DETAIL_SQL, [lead_id]);
      if (row) {
        console.log(`[Leads] db_read | lead_id=${lead_id} | cep=${row.cep} | updated_at=${row.updated_at}`);
        return c.json(successEnvelope(formatDbRowForDetail(row)));
      }
    } catch (dbErr: unknown) {
      console.error("[Leads] DB detail lookup failed:", dbErr instanceof Error ? dbErr.message : String(dbErr));
    }

    // ── Not found ──
    return c.json(errorEnvelope("NOT_FOUND", `Lead '${lead_id}' not found`), 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Leads] Detail error:", message);
    return c.json(errorEnvelope("LEADS_ERROR", `Failed to fetch lead detail: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// DEALERS
// ---------------------------------------------------------------------------

crm.get("/v1/dealers", async (c) => {
  try {
    const auth = getAuthContext(c);
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const { page, pageSize, offset } = parsePagination(query);
    const timeScope = query.time_scope || "mtd";
    const dateRange = resolveTimeScope(timeScope);

    const conditions: string[] = ["d.deleted_at IS NULL"];
    const params: unknown[] = [];
    let paramIdx = 1;

    const roleFilter = roleFilterForTable(auth, "dealers", paramIdx);
    if (roleFilter.clause !== "1=1") { conditions.push(`d.${roleFilter.clause}`); params.push(...roleFilter.params); paramIdx += roleFilter.paramOffset; }
    if (query.segment) { conditions.push(`d.segment = $${paramIdx}`); params.push(query.segment); paramIdx++; }
    if (query.status) { conditions.push(`d.status = $${paramIdx}`); params.push(query.status); paramIdx++; }
    if (query.search) { conditions.push(`(d.name ILIKE $${paramIdx} OR d.code ILIKE $${paramIdx})`); params.push(`%${query.search}%`); paramIdx++; }

    const whereClause = conditions.join(" AND ");
    const totalItems = (await db.queryScalar<number>(`SELECT COUNT(*) FROM dealers d WHERE ${whereClause}`, params)) ?? 0;

    const dateParams = [dateRange.start_date, dateRange.end_date];
    const dataParams = [...params, ...dateParams, pageSize, offset];
    const dsIdx = paramIdx;
    const deIdx = paramIdx + 1;

    const rows = await db.queryAll<Record<string, unknown>>(
      `SELECT d.*, u.name AS kam_name,
              (SELECT COUNT(*) FROM leads l WHERE l.dealer_id = d.dealer_id AND l.deleted_at IS NULL
               AND l.created_at >= $${dsIdx} AND l.created_at <= $${deIdx}) AS leads_count,
              (SELECT COUNT(*) FROM leads l WHERE l.dealer_id = d.dealer_id AND l.deleted_at IS NULL
               AND l.stage = 'Stock-in' AND l.status = 'Won'
               AND l.converted_at >= $${dsIdx} AND l.converted_at <= $${deIdx}) AS stock_ins_count
       FROM dealers d LEFT JOIN users u ON d.kam_user_id = u.user_id
       WHERE ${whereClause} ORDER BY d.name ASC
       LIMIT $${deIdx + 1} OFFSET $${deIdx + 2}`,
      dataParams
    );

    const items = rows.map((row) => ({
      dealer_id: row.dealer_id, name: row.name, code: row.code,
      city: row.city, region: row.region, segment: row.segment,
      status: row.status, kam_id: row.kam_user_id, kam_name: row.kam_name,
      metrics: {
        leads: parseInt(String(row.leads_count)) || 0,
        stock_ins: parseInt(String(row.stock_ins_count)) || 0,
      },
    }));

    return c.json(successEnvelope({
      items,
      pagination: buildPagination(page, pageSize, totalItems),
    }, { time_scope: timeScope, role: auth.role }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Dealers] List error:", message);
    return c.json(errorEnvelope("DEALERS_ERROR", `Failed to fetch dealers: ${message}`), 500);
  }
});

crm.get("/v1/dealers/:dealer_id", async (c) => {
  try {
    const auth = getAuthContext(c);
    const dealer_id = c.req.param("dealer_id");
    const timeScope = c.req.query("time_scope") || "mtd";
    const dateRange = resolveTimeScope(timeScope);

    const dealer = await db.queryOne<Record<string, unknown>>(
      `SELECT d.*, u.name AS kam_name FROM dealers d
       LEFT JOIN users u ON d.kam_user_id = u.user_id
       WHERE d.dealer_id = $1 AND d.deleted_at IS NULL`, [dealer_id]
    );
    if (!dealer) return c.json(errorEnvelope("NOT_FOUND", `Dealer '${dealer_id}' not found`), 404);

    const leadMetrics = await db.queryOne<Record<string, unknown>>(
      `SELECT COUNT(*) AS leads,
              COUNT(*) FILTER (WHERE stage = 'Stock-in' AND status = 'Won') AS stock_ins
       FROM leads WHERE dealer_id = $1 AND deleted_at IS NULL
       AND created_at >= $2 AND created_at <= $3`,
      [dealer_id, dateRange.start_date, dateRange.end_date]
    );

    return c.json(successEnvelope({
      dealer_id: dealer.dealer_id, name: dealer.name, code: dealer.code,
      city: dealer.city, region: dealer.region, segment: dealer.segment,
      status: dealer.status, kam_id: dealer.kam_user_id, kam_name: dealer.kam_name,
      metrics: {
        leads: parseInt(String(leadMetrics?.leads)) || 0,
        stock_ins: parseInt(String(leadMetrics?.stock_ins)) || 0,
      },
    }, { time_scope: timeScope, role: auth.role }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Dealers] Detail error:", message);
    return c.json(errorEnvelope("DEALERS_ERROR", `Failed to fetch dealer detail: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// CALLS
// ---------------------------------------------------------------------------

crm.get("/v1/calls", async (c) => {
  try {
    const auth = getAuthContext(c);
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const { page, pageSize, offset } = parsePagination(query);
    const timeScope = query.time_scope || "last-7d";
    const dateRange = resolveTimeScope(timeScope);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    const roleFilter = roleFilterForTable(auth, "call_events", paramIdx);
    if (roleFilter.clause !== "1=1") { conditions.push(`c.${roleFilter.clause}`); params.push(...roleFilter.params); paramIdx += roleFilter.paramOffset; }
    conditions.push(`c.call_date >= $${paramIdx}`); params.push(dateRange.start_date); paramIdx++;
    conditions.push(`c.call_date <= $${paramIdx}`); params.push(dateRange.end_date); paramIdx++;
    if (query.dealer_id) { conditions.push(`c.dealer_id = $${paramIdx}`); params.push(query.dealer_id); paramIdx++; }
    if (query.feedback_status) { conditions.push(`c.feedback_status = $${paramIdx}`); params.push(query.feedback_status); paramIdx++; }

    const whereClause = conditions.length > 0 ? conditions.join(" AND ") : "1=1";
    const totalItems = (await db.queryScalar<number>(`SELECT COUNT(*) FROM call_events c WHERE ${whereClause}`, params)) ?? 0;

    const dataParams = [...params, pageSize, offset];
    const rows = await db.queryAll<Record<string, unknown>>(
      `SELECT c.*, d.name AS dealer_name, d.code AS dealer_code, u.name AS kam_name
       FROM call_events c LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
       LEFT JOIN users u ON c.kam_user_id = u.user_id
       WHERE ${whereClause} ORDER BY c.call_date DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`, dataParams
    );

    const items = rows.map((row) => ({
      call_id: row.call_id, dealer_id: row.dealer_id, dealer_name: row.dealer_name,
      kam_id: row.kam_user_id, kam_name: row.kam_name,
      call_date: row.call_date, duration: formatDuration(row.duration_sec as number),
      call_status: row.call_status, outcome: row.outcome,
      is_productive: row.is_productive, feedback_status: row.feedback_status,
    }));

    return c.json(successEnvelope({
      items, pagination: buildPagination(page, pageSize, totalItems),
    }, { time_scope: timeScope, role: auth.role }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Calls] List error:", message);
    return c.json(errorEnvelope("CALLS_ERROR", `Failed to fetch calls: ${message}`), 500);
  }
});

crm.get("/v1/calls/:call_id", async (c) => {
  try {
    const call_id = c.req.param("call_id");
    const row = await db.queryOne<Record<string, unknown>>(
      `SELECT c.*, d.name AS dealer_name, d.code AS dealer_code, u.name AS kam_name
       FROM call_events c LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
       LEFT JOIN users u ON c.kam_user_id = u.user_id WHERE c.call_id = $1`, [call_id]
    );
    if (!row) return c.json(errorEnvelope("NOT_FOUND", `Call '${call_id}' not found`), 404);

    return c.json(successEnvelope({
      call_id: row.call_id, dealer_id: row.dealer_id, dealer_name: row.dealer_name,
      kam_id: row.kam_user_id, kam_name: row.kam_name,
      call_date: row.call_date, call_start_time: row.call_start_time,
      duration: formatDuration(row.duration_sec as number), duration_sec: row.duration_sec,
      call_status: row.call_status, outcome: row.outcome,
      is_productive: row.is_productive, feedback_status: row.feedback_status,
      feedback: row.feedback_data || null,
    }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Calls] Detail error:", message);
    return c.json(errorEnvelope("CALLS_ERROR", `Failed to fetch call detail: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// VISITS
// ---------------------------------------------------------------------------

crm.get("/v1/visits", async (c) => {
  try {
    const auth = getAuthContext(c);
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const { page, pageSize, offset } = parsePagination(query);
    const timeScope = query.time_scope || "last-7d";
    const dateRange = resolveTimeScope(timeScope);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    const roleFilter = roleFilterForTable(auth, "visit_events", paramIdx);
    if (roleFilter.clause !== "1=1") { conditions.push(`v.${roleFilter.clause}`); params.push(...roleFilter.params); paramIdx += roleFilter.paramOffset; }
    conditions.push(`v.visit_date >= $${paramIdx}`); params.push(dateRange.start_date); paramIdx++;
    conditions.push(`v.visit_date <= $${paramIdx}`); params.push(dateRange.end_date); paramIdx++;
    if (query.dealer_id) { conditions.push(`v.dealer_id = $${paramIdx}`); params.push(query.dealer_id); paramIdx++; }
    if (query.feedback_status) { conditions.push(`v.feedback_status = $${paramIdx}`); params.push(query.feedback_status); paramIdx++; }

    const whereClause = conditions.length > 0 ? conditions.join(" AND ") : "1=1";
    const totalItems = (await db.queryScalar<number>(`SELECT COUNT(*) FROM visit_events v WHERE ${whereClause}`, params)) ?? 0;

    const dataParams = [...params, pageSize, offset];
    const rows = await db.queryAll<Record<string, unknown>>(
      `SELECT v.*, d.name AS dealer_name, d.code AS dealer_code, u.name AS kam_name
       FROM visit_events v LEFT JOIN dealers d ON v.dealer_id = d.dealer_id
       LEFT JOIN users u ON v.kam_user_id = u.user_id
       WHERE ${whereClause} ORDER BY v.visit_date DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`, dataParams
    );

    const items = rows.map((row) => ({
      visit_id: row.visit_id, dealer_id: row.dealer_id, dealer_name: row.dealer_name,
      kam_id: row.kam_user_id, kam_name: row.kam_name,
      visit_date: row.visit_date, visit_type: row.visit_type, status: row.status,
      duration: formatDuration(row.duration_sec as number),
      is_productive: row.is_productive, feedback_status: row.feedback_status,
    }));

    return c.json(successEnvelope({
      items, pagination: buildPagination(page, pageSize, totalItems),
    }, { time_scope: timeScope, role: auth.role }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Visits] List error:", message);
    return c.json(errorEnvelope("VISITS_ERROR", `Failed to fetch visits: ${message}`), 500);
  }
});

crm.get("/v1/visits/:visit_id", async (c) => {
  try {
    const visit_id = c.req.param("visit_id");
    const row = await db.queryOne<Record<string, unknown>>(
      `SELECT v.*, d.name AS dealer_name, d.code AS dealer_code, u.name AS kam_name
       FROM visit_events v LEFT JOIN dealers d ON v.dealer_id = d.dealer_id
       LEFT JOIN users u ON v.kam_user_id = u.user_id WHERE v.visit_id = $1`, [visit_id]
    );
    if (!row) return c.json(errorEnvelope("NOT_FOUND", `Visit '${visit_id}' not found`), 404);

    return c.json(successEnvelope({
      visit_id: row.visit_id, dealer_id: row.dealer_id, dealer_name: row.dealer_name,
      kam_id: row.kam_user_id, kam_name: row.kam_name,
      visit_date: row.visit_date, visit_type: row.visit_type, status: row.status,
      duration: formatDuration(row.duration_sec as number), duration_sec: row.duration_sec,
      is_productive: row.is_productive, feedback_status: row.feedback_status,
      feedback: row.feedback_data || null,
      check_in: row.check_in_at ? { latitude: row.check_in_lat, longitude: row.check_in_lng, at: row.check_in_at } : null,
      check_out: row.completed_at ? { latitude: row.check_out_lat, longitude: row.check_out_lng, at: row.completed_at } : null,
    }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Visits] Detail error:", message);
    return c.json(errorEnvelope("VISITS_ERROR", `Failed to fetch visit detail: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------

crm.get("/v1/notifications", async (c) => {
  try {
    const auth = getAuthContext(c);
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const { page, pageSize, offset } = parsePagination(query);
    const userId = auth.user_id;

    const totalItems = (await db.queryScalar<number>(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1`, [userId]
    )) ?? 0;

    const unreadCount = (await db.queryScalar<number>(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`, [userId]
    )) ?? 0;

    const rows = await db.queryAll<Record<string, unknown>>(
      `SELECT notification_id, type, priority, title, body, data, read_at, created_at
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [userId, pageSize, offset]
    );

    const items = rows.map((row) => ({
      notification_id: row.notification_id, type: row.type, priority: row.priority,
      title: row.title, body: row.body, data: row.data || {},
      read: row.read_at != null, created_at: row.created_at,
    }));

    return c.json(successEnvelope({
      items, pagination: buildPagination(page, pageSize, totalItems),
      unread_count: unreadCount,
    }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Notifications] Error:", message);
    return c.json(errorEnvelope("NOTIFICATIONS_ERROR", `Failed to fetch notifications: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// CEP UPDATE (Phase A)
// ---------------------------------------------------------------------------

/**
 * PATCH /v1/leads/:lead_id/cep — Update Customer Expected Price
 * Body: { cep: number | string | null }
 * Validation: cep field MUST be present; value must be null OR numeric >= 1000
 *
 * Architecture (write-through):
 *   1. Resolve lead: DB → mock → 404.
 *   2. If source == DB  → UPDATE DB row.
 *   3. If source == mock → INSERT (promote mock → DB), apply CEP.
 *   4. Always re-fetch from DB and return the persisted record.
 *   5. If DB is entirely unavailable, graceful-degrade to in-memory mock.
 *
 * Returns: full lead detail (same shape as GET /v1/leads/:lead_id)
 */
crm.patch("/v1/leads/:lead_id/cep", async (c) => {
  try {
    const lead_id = c.req.param("lead_id");
    const body = await c.req.json() as Record<string, unknown>;

    // ── Validate: cep field must be present in body ──
    if (!("cep" in body)) {
      return c.json(errorEnvelope("BAD_REQUEST", "Missing required field: cep"), 400);
    }

    // ── Parse: support both string and number ──
    let cepValue: number | null = null;
    if (body.cep !== null && body.cep !== undefined && body.cep !== "") {
      const parsed = typeof body.cep === "string" ? parseFloat(body.cep) : Number(body.cep);
      if (typeof parsed !== "number" || isNaN(parsed) || parsed < 1000) {
        return c.json(errorEnvelope("VALIDATION_ERROR", "CEP must be null or a number >= 1000"), 400);
      }
      cepValue = parsed;
    }

    const now = new Date().toISOString();
    const confidence = cepValue != null ? "confirmed" : null;

    // ── Step 1: Resolve lead — DB only ──
    let source: "db" | null = null;

    try {
      const existing = await db.queryOne<Record<string, unknown>>(
        `SELECT lead_id FROM leads WHERE lead_id = $1 AND deleted_at IS NULL`,
        [lead_id],
      );
      if (existing) {
        source = "db";
      }
    } catch (dbErr: unknown) {
      console.log("[CEP] DB resolve failed:", dbErr instanceof Error ? dbErr.message : String(dbErr));
    }

    if (!source) {
      return c.json(errorEnvelope("NOT_FOUND", `Lead '${lead_id}' not found`), 404);
    }

    // ── Step 2: Write to DB ──
    try {
      if (source === "db") {
        // Lead already in DB → simple UPDATE
        const updated = await db.queryOne<Record<string, unknown>>(
          `UPDATE leads SET cep = $1, cep_confidence = $2, updated_at = $3
           WHERE lead_id = $4 AND deleted_at IS NULL
           RETURNING lead_id`,
          [cepValue, confidence, now, lead_id],
        );
        if (!updated) {
          return c.json(errorEnvelope("CEP_UPDATE_ERROR", `DB UPDATE returned 0 rows for lead '${lead_id}'`), 500);
        }
      }

      // ── Step 3: Re-fetch persisted record ──
      const row = await db.queryOne<Record<string, unknown>>(LEAD_DETAIL_SQL, [lead_id]);
      if (row) {
        console.log(`[CEP] db_write | lead_id=${lead_id} | new_cep=${cepValue} | source=${source} | updated_at=${row.updated_at}`);
        return c.json(successEnvelope(formatDbRowForDetail(row)));
      }

      // Wrote but re-fetch missed (should not happen)
      console.error(`[CEP] DB wrote but re-fetch returned null | lead_id=${lead_id}`);
      return c.json(errorEnvelope("CEP_UPDATE_ERROR", `DB write succeeded for lead '${lead_id}' but re-fetch failed`), 500);
    } catch (dbWriteErr: unknown) {
      const errMsg = dbWriteErr instanceof Error ? dbWriteErr.message : String(dbWriteErr);
      console.log(`[CEP] DB write failed (source=${source}), graceful-degrade to mock | error: ${errMsg}`);

      return c.json(errorEnvelope("CEP_UPDATE_ERROR", `Failed to persist CEP update for lead '${lead_id}': ${errMsg}`), 500);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[CEP] Update error:", message);
    return c.json(errorEnvelope("CEP_UPDATE_ERROR", `Failed to update CEP: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// LEADERBOARD (Phase B)
// ---------------------------------------------------------------------------

/**
 * GET /v1/leaderboard — Ranked leaderboard for KAMs or TLs
 * Query: scope=kam|tl, time_scope, region, team_id, current_user_id
 */
crm.get("/v1/leaderboard", async (c) => {
  try {
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const scope = (query.scope || "kam") as "kam" | "tl";
    const timeScope = query.time_scope || "mtd";
    const currentUserId = query.current_user_id || "kam-ncr-01";
    const dateRange = resolveTimeScope(timeScope);

    // Try database first
    let entries: Array<{
      id: string; name: string; city: string; region: string;
      stock_ins: number; inspections: number; dcf_disbursed: number;
    }> = [];

    try {
      if (scope === "kam") {
        const rows = await db.queryAll<Record<string, unknown>>(`
          SELECT u.user_id, u.name, u.city, u.region,
            COALESCE((SELECT COUNT(*) FROM leads l
              WHERE l.kam_user_id = u.user_id AND l.stage = 'Stock-in' AND l.status = 'Won'
              AND l.converted_at >= $1 AND l.converted_at <= $2 AND l.deleted_at IS NULL), 0) AS stock_ins,
            COALESCE((SELECT COUNT(*) FROM leads l
              WHERE l.kam_user_id = u.user_id AND l.stage IN ('Inspection Done','Inspection Scheduled')
              AND l.created_at >= $1 AND l.created_at <= $2 AND l.deleted_at IS NULL), 0) AS inspections,
            COALESCE((SELECT COUNT(*) FROM dcf_leads dl
              WHERE dl.kam_user_id = u.user_id AND dl.overall_status = 'DISBURSED'
              AND dl.disbursal_date >= $1 AND dl.disbursal_date <= $2), 0) AS dcf_disbursed
          FROM users u WHERE u.role = 'KAM' AND u.is_active = true
          ORDER BY stock_ins DESC
        `, [dateRange.start_date, dateRange.end_date]);

        entries = rows.map(r => ({
          id: String(r.user_id), name: String(r.name), city: String(r.city || ""),
          region: String(r.region || ""), stock_ins: Number(r.stock_ins),
          inspections: Number(r.inspections), dcf_disbursed: Number(r.dcf_disbursed),
        }));
      } else {
        const rows = await db.queryAll<Record<string, unknown>>(`
          SELECT t.team_id, t.team_name AS name, t.region,
            COALESCE((SELECT COUNT(*) FROM leads l
              WHERE l.tl_user_id = t.tl_user_id AND l.stage = 'Stock-in' AND l.status = 'Won'
              AND l.converted_at >= $1 AND l.converted_at <= $2 AND l.deleted_at IS NULL), 0) AS stock_ins,
            COALESCE((SELECT COUNT(*) FROM leads l
              WHERE l.tl_user_id = t.tl_user_id AND l.stage IN ('Inspection Done','Inspection Scheduled')
              AND l.created_at >= $1 AND l.created_at <= $2 AND l.deleted_at IS NULL), 0) AS inspections,
            COALESCE((SELECT COUNT(*) FROM dcf_leads dl
              WHERE dl.tl_user_id = t.tl_user_id AND dl.overall_status = 'DISBURSED'
              AND dl.disbursal_date >= $1 AND dl.disbursal_date <= $2), 0) AS dcf_disbursed
          FROM teams t WHERE t.is_active = true
          ORDER BY stock_ins DESC
        `, [dateRange.start_date, dateRange.end_date]);

        entries = rows.map(r => ({
          id: String(r.team_id), name: String(r.name), city: "",
          region: String(r.region || ""), stock_ins: Number(r.stock_ins),
          inspections: Number(r.inspections), dcf_disbursed: Number(r.dcf_disbursed),
        }));
      }
    } catch (dbErr: unknown) {
      console.log("[Leaderboard] DB query failed, using mock data:", dbErr instanceof Error ? dbErr.message : String(dbErr));
    }

    // Generate mock data if DB returned nothing
    if (entries.length === 0) {
      const mockNames = scope === "kam"
        ? [
            { name: "Amit Verma", city: "Gurgaon", region: "NCR" },
            { name: "Sneha Kapoor", city: "Delhi", region: "NCR" },
            { name: "Rohan Desai", city: "Mumbai", region: "West" },
            { name: "Karthik Reddy", city: "Bangalore", region: "South" },
            { name: "Kavita Patil", city: "Pune", region: "West" },
            { name: "Vikram Malhotra", city: "Noida", region: "NCR" },
            { name: "Anjali Nair", city: "Chennai", region: "South" },
            { name: "Rahul Bose", city: "Kolkata", region: "East" },
            { name: "Priyanka Das", city: "Bhubaneswar", region: "East" },
            { name: "Priya Sharma", city: "Faridabad", region: "NCR" },
          ]
        : [
            { name: "Rajesh Kumar", city: "", region: "NCR" },
            { name: "Amit Sharma", city: "", region: "West" },
            { name: "Priya Iyer", city: "", region: "South" },
            { name: "Neha Singh", city: "", region: "NCR" },
            { name: "Suresh Ghosh", city: "", region: "East" },
          ];

      entries = mockNames.map((m, i) => ({
        id: `${scope}-${i + 1}`,
        name: m.name,
        city: m.city,
        region: m.region,
        stock_ins: Math.max(0, 28 - i * 3 + Math.floor(Math.random() * 4)),
        inspections: Math.max(0, 45 - i * 4 + Math.floor(Math.random() * 6)),
        dcf_disbursed: Math.max(0, 8 - i + Math.floor(Math.random() * 3)),
      }));
    }

    // Compute scores and rank
    const withScores = entries.map(e => {
      const i2si = e.inspections > 0 ? (e.stock_ins / e.inspections) * 100 : 0;
      const stockinEquiv = e.stock_ins + (3 * e.dcf_disbursed);
      return { ...e, i2si_pct: Math.round(i2si * 10) / 10, stockin_equiv: stockinEquiv };
    });

    // Normalize and rank
    const maxEquiv = Math.max(...withScores.map(s => s.stockin_equiv), 1);
    const maxAch = 100; // default target achievement cap

    const scored = withScores.map(s => {
      const normEquiv = s.stockin_equiv / maxEquiv;
      const projectedAch = Math.min(s.stockin_equiv * 3.5, 150); // simplified projection
      const normAch = Math.min(projectedAch / maxAch, 1.5);
      const score = Math.round((0.60 * normEquiv + 0.40 * normAch) * 100);
      const lmtdDelta = Math.round((Math.random() - 0.3) * 25);
      return {
        ...s,
        projected_achievement_pct: Math.round(projectedAch),
        score,
        lmtd_delta: lmtdDelta,
        is_current_user: s.id === currentUserId || s.name === "Amit Verma",
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const ranked = scored.map((s, i) => ({
      rank: i + 1,
      id: s.id,
      name: s.name,
      city: s.city,
      region: s.region,
      stock_ins: s.stock_ins,
      i2si_pct: s.i2si_pct,
      dcf_disbursed: s.dcf_disbursed,
      stockin_equiv: s.stockin_equiv,
      projected_achievement_pct: s.projected_achievement_pct,
      score: s.score,
      lmtd_delta: s.lmtd_delta,
      is_current_user: s.is_current_user,
    }));

    const myCard = ranked.find(r => r.is_current_user) || ranked[0];
    const aheadEntry = myCard.rank > 1 ? ranked[myCard.rank - 2] : null;
    const behindText = aheadEntry
      ? `${aheadEntry.stockin_equiv - myCard.stockin_equiv} SI-equiv behind #${aheadEntry.rank} (${aheadEntry.name.split(" ")[0]})`
      : "You're #1!";

    return c.json(successEnvelope({
      your_rank_card: {
        rank: myCard.rank,
        total: ranked.length,
        percentile: Math.round((1 - (myCard.rank - 1) / ranked.length) * 100),
        behind_text: behindText,
        stock_ins: myCard.stock_ins,
        i2si_pct: myCard.i2si_pct,
        dcf_disbursed: myCard.dcf_disbursed,
        stockin_equiv: myCard.stockin_equiv,
        projected_achievement_pct: myCard.projected_achievement_pct,
        score: myCard.score,
      },
      top3: ranked.slice(0, 3),
      full_list: ranked,
      notes: `Rank = 60% SI-equiv (SI + 3×DCF) + 40% projected achievement%. ${scope.toUpperCase()} scope, ${timeScope} window.`,
    }, { time_scope: timeScope }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Leaderboard] Error:", message);
    return c.json(errorEnvelope("LEADERBOARD_ERROR", `Failed to compute leaderboard: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// INCENTIVE SUMMARY (Phase C)
// ---------------------------------------------------------------------------

/**
 * GET /v1/incentives/summary — TL (or KAM) incentive projection
 * Query: time_scope, user_id
 */
crm.get("/v1/incentives/summary", async (c) => {
  try {
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const timeScope = query.time_scope || "mtd";
    const dateRange = resolveTimeScope(timeScope);

    // Default slab table (TL incentive rules)
    // Achievement bands: <95%, 95-110%, >110%
    // I2SI bands: <12%, 12-15%, >15%
    const SLAB_TABLE: Record<string, Record<string, number>> = {
      "below_95": { "below_12": 400, "12_to_15": 500, "above_15": 600 },
      "95_to_110": { "below_12": 600, "12_to_15": 800, "above_15": 1000 },
      "above_110": { "below_12": 800, "12_to_15": 1100, "above_15": 1400 },
    };

    // Try to get real data
    let achieved_si = 0;
    let target_si = 30;
    let inspections = 0;
    let dcf_onboardings = 0;
    let dcf_gmv = 0;
    let score = 72;

    try {
      // Attempt DB query for real metrics
      const metrics = await db.queryOne<Record<string, unknown>>(`
        SELECT
          COALESCE((SELECT COUNT(*) FROM leads WHERE tl_user_id = $1 AND stage = 'Stock-in' AND status = 'Won'
            AND converted_at >= $2 AND converted_at <= $3 AND deleted_at IS NULL), 0) AS si_count,
          COALESCE((SELECT COUNT(*) FROM leads WHERE tl_user_id = $1
            AND stage IN ('Inspection Done','Inspection Scheduled')
            AND created_at >= $2 AND created_at <= $3 AND deleted_at IS NULL), 0) AS insp_count
      `, [query.user_id || "tl-ncr-01", dateRange.start_date, dateRange.end_date]);

      if (metrics) {
        achieved_si = Number(metrics.si_count) || 0;
        inspections = Number(metrics.insp_count) || 0;
      }
    } catch (dbErr: unknown) {
      console.log("[Incentive] DB query failed, using mock:", dbErr instanceof Error ? dbErr.message : String(dbErr));
      // Use reasonable mock defaults
      achieved_si = 22;
      inspections = 38;
      dcf_onboardings = 5;
      dcf_gmv = 3200000;
      score = 72;
    }

    // If no DB data, use mock
    if (achieved_si === 0 && inspections === 0) {
      achieved_si = 22;
      inspections = 38;
      dcf_onboardings = 5;
      dcf_gmv = 3200000;
    }

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const i2si = inspections > 0 ? (achieved_si / inspections) * 100 : 0;
    const achievementPct = target_si > 0 ? (achieved_si / target_si) * 100 : 0;

    // Determine slab
    const achBand = achievementPct >= 110 ? "above_110" : achievementPct >= 95 ? "95_to_110" : "below_95";
    const i2siBand = i2si >= 15 ? "above_15" : i2si >= 12 ? "12_to_15" : "below_12";
    const perSiRate = SLAB_TABLE[achBand][i2siBand];
    const slabLabel = `${achBand.replace(/_/g, " ")} × ${i2siBand.replace(/_/g, " ")}`;

    const baseIncentive = achieved_si * perSiRate;

    // Boosters
    const boosters: Array<{ label: string; amount: number; explanation: string }> = [];
    if (i2si >= 12) {
      boosters.push({ label: "I2SI Target Achieved", amount: 5000, explanation: "I2SI ≥ 12% — full booster" });
    }
    if (dcf_onboardings > 0) {
      boosters.push({ label: "DCF Onboardings", amount: dcf_onboardings * 100, explanation: `${dcf_onboardings} onboardings × ₹100` });
    }
    if (dcf_gmv > 0) {
      const gmvBonus = Math.round(dcf_gmv * 0.003);
      boosters.push({ label: "DCF GMV Bonus", amount: gmvBonus, explanation: `₹${(dcf_gmv / 100000).toFixed(1)}L × 0.3%` });
    }

    // Reducers (none currently but structure is ready)
    const reducers: Array<{ label: string; amount: number; explanation: string }> = [];

    // Gates
    const gates: Array<{ label: string; passed: boolean; explanation: string; impact: string }> = [];
    if (score >= 70) {
      gates.push({ label: "Score Gate (≥70)", passed: true, explanation: `Score: ${score} — Full incentive`, impact: "100%" });
    } else if (score >= 50) {
      gates.push({ label: "Score Gate (50-70)", passed: false, explanation: `Score: ${score} — 50% incentive`, impact: "50%" });
    } else {
      gates.push({ label: "Score Gate (<50)", passed: false, explanation: `Score: ${score} — No incentive`, impact: "0%" });
    }

    // Gate multiplier
    const gateMultiplier = score >= 70 ? 1.0 : score >= 50 ? 0.5 : 0;
    const totalBoosters = boosters.reduce((s, b) => s + b.amount, 0);
    const totalReducers = reducers.reduce((s, r) => s + r.amount, 0);
    const projectedIncentive = Math.round((baseIncentive + totalBoosters - totalReducers) * gateMultiplier);

    // Projected EOM
    const projectedSI = Math.round((achieved_si / Math.max(daysElapsed, 1)) * daysInMonth);
    const projectedAchPct = target_si > 0 ? Math.round((projectedSI / target_si) * 100) : 0;

    return c.json(successEnvelope({
      projected_incentive: projectedIncentive,
      base_incentive: baseIncentive,
      boosters,
      reducers,
      gates,
      slab_info: {
        achievement_pct: Math.round(achievementPct),
        i2si_pct: Math.round(i2si * 10) / 10,
        per_si_rate: perSiRate,
        slab_label: slabLabel,
      },
      explanations: [
        `Base: ${achieved_si} SI × ₹${perSiRate}/SI = ₹${baseIncentive.toLocaleString("en-IN")}`,
        `Slab: ${slabLabel}`,
        `Projected EOM: ${projectedSI} SI (${projectedAchPct}% achievement)`,
        "Only 10% SB considered (applied if SB metric available)",
      ],
      meta: {
        target_si,
        achieved_si,
        target_i2si: 12,
        achieved_i2si: Math.round(i2si * 10) / 10,
        days_elapsed: daysElapsed,
        days_in_month: daysInMonth,
        score,
      },
    }, { time_scope: timeScope }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Incentive] Error:", message);
    return c.json(errorEnvelope("INCENTIVE_ERROR", `Failed to compute incentive summary: ${message}`), 500);
  }
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default crm;