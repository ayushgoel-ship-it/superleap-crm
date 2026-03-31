/**
 * CRM API — Database Connection (Deno/Supabase Edge Function)
 * Phase: 6D | Ported from: /backend_api/db.ts
 *
 * Uses dynamic import for postgresjs (npm:postgres) so the Edge Function
 * can still start even if the package fails to load. All routes have
 * try/catch + mock fallback, so a DB failure is graceful.
 *
 * Connection: CRM_DB_URL environment variable (set as Edge Function secret).
 *
 * SAFETY: All queries use parameterized binding. Never string interpolation.
 */

// ---------------------------------------------------------------------------
// Lazy / Dynamic Connection
// ---------------------------------------------------------------------------

let sql: any = null;
let postgresFactory: ((url: string, opts?: any) => any) | null = null;
let importAttempted = false;
let importError: string | null = null;

async function ensurePostgresModule(): Promise<boolean> {
  if (postgresFactory) return true;
  if (importAttempted) return false; // already failed once

  importAttempted = true;
  try {
    const mod = await import("npm:postgres");
    postgresFactory = mod.default;
    return true;
  } catch (err: unknown) {
    importError = err instanceof Error ? err.message : String(err);
    console.error("[CRM-DB] Failed to import npm:postgres:", importError);
    return false;
  }
}

async function getConnection(): Promise<any> {
  if (sql) return sql;

  const ok = await ensurePostgresModule();
  if (!ok || !postgresFactory) {
    throw new Error(
      `npm:postgres unavailable (${importError || "unknown"}). DB queries will use mock fallback.`
    );
  }

  const dbUrl = Deno.env.get("CRM_DB_URL");
  if (!dbUrl) {
    throw new Error(
      "CRM_DB_URL is not set. Add it as an Edge Function secret."
    );
  }

  sql = postgresFactory(dbUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    connection: { timezone: "UTC" },
    prepare: false,
  });

  return sql;
}

// ---------------------------------------------------------------------------
// Query Helpers (matching /backend_api/db.ts interface)
// ---------------------------------------------------------------------------

/**
 * Execute a parameterized query. Uses .unsafe() to accept raw SQL + params array.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const db = await getConnection();
  const start = Date.now();

  const result = await db.unsafe(text, params ?? []);
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`[CRM-DB] Slow query (${duration}ms):`, text.substring(0, 120));
  }

  return Array.from(result) as T[];
}

/**
 * Get a single row or null.
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Get all rows.
 */
export async function queryAll<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  return query<T>(text, params);
}

/**
 * Execute a query that returns a single scalar value.
 */
export async function queryScalar<T = number>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query(text, params);
  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown>;
  const firstKey = Object.keys(row)[0];
  return (row[firstKey] as T) ?? null;
}

/**
 * Test connectivity — used by /verify-db endpoint.
 */
export async function testConnection(): Promise<{
  connected: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const db = await getConnection();
    const result = await db.unsafe("SELECT version()");
    return {
      connected: true,
      version: String((result[0] as Record<string, unknown>)?.version ?? "unknown").substring(0, 100),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { connected: false, error: message };
  }
}

export default {
  query,
  queryOne,
  queryAll,
  queryScalar,
  testConnection,
};
