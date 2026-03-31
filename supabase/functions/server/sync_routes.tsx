// src/supabase/functions/server/sync_routes.tsx
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      ...extraHeaders,
    },
  });
}

function getSecret(req: Request) {
  return req.headers.get("x-sync-secret") ?? "";
}

function requireSecret(req: Request) {
  const expected = Deno.env.get("SYNC_SECRET") ?? "";
  const got = getSecret(req);
  if (!expected) return { ok: false, error: "SYNC_SECRET not set on server" };
  if (!got || got !== expected) return { ok: false, error: "Unauthorized (bad x-sync-secret)" };
  return { ok: true as const };
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!url || !serviceKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function env");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Expected payload:
 * {
 *   source: "google_sheets" | "excel" | "...",
 *   snapshot_id?: string,
 *   dealers?: Array<{ id: string, payload: any }>,
 *   leads?: Array<{ id: string, payload: any }>,
 *   calls?: Array<{ id: string, payload: any }>,
 *   visits?: Array<{ id: string, payload: any }>,
 *   dcf_leads?: Array<{ id: string, payload: any }>,
 *   org?: Array<{ id: string, payload: any }>, // typically single row
 *   location_requests?: Array<{ id: string, payload: any }>
 * }
 */

export async function syncRoutes(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Let index.tsx call us for every request; we only handle /sync/*
  if (!path.includes("/sync")) return null;

  if (req.method === "OPTIONS") return json({ ok: true });

  // health check
  if (req.method === "GET" && path.endsWith("/sync/ping")) {
    return json({
      ok: true,
      ts: new Date().toISOString(),
      hasSecret: Boolean(Deno.env.get("SYNC_SECRET")),
    });
  }

  // push snapshot
  if (req.method === "POST" && path.endsWith("/sync/push")) {
    const auth = requireSecret(req);
    if (!auth.ok) return json({ ok: false, error: auth.error }, 401);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const sb = getSupabaseAdmin();

    const upsertTable = async (table: string, rows: Array<{ id: string; payload: any }>) => {
      if (!rows || rows.length === 0) return { table, upserted: 0 };
      const { error } = await sb.from(table).upsert(
        rows.map(r => ({ id: r.id, payload: r.payload })),
        { onConflict: "id" }
      );
      if (error) throw new Error(`${table} upsert failed: ${error.message}`);
      return { table, upserted: rows.length };
    };

    try {
      const results: any[] = [];

      results.push(await upsertTable("dealers_raw", body.dealers ?? []));
      results.push(await upsertTable("leads_raw", body.leads ?? []));
      results.push(await upsertTable("calls_raw", body.calls ?? []));
      results.push(await upsertTable("visits_raw", body.visits ?? []));
      results.push(await upsertTable("dcf_leads_raw", body.dcf_leads ?? []));
      results.push(await upsertTable("location_requests_raw", body.location_requests ?? []));

      // org is usually single row; keep as array for consistency
      results.push(await upsertTable("org_raw", body.org ?? []));

      return json({
        ok: true,
        source: body.source ?? "unknown",
        snapshot_id: body.snapshot_id ?? null,
        results,
        ts: new Date().toISOString(),
      });
    } catch (e: any) {
      return json({ ok: false, error: e?.message ?? String(e) }, 500);
    }
  }

  return json({ ok: false, error: "Not found" }, 404);
}