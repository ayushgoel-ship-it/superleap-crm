/**
 * Database Connection Abstraction
 * Phase: 6C | Source: docs/DATA_ARCHITECTURE.md
 *
 * Uses node-postgres (pg) with a connection pool.
 * All queries use parameterized binding — never string interpolation.
 *
 * Environment variable: DATABASE_URL
 * Format: postgresql://postgres.[ref]:[password]@host:port/dbname
 *
 * Supabase requires SSL for external connections.
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// ---------------------------------------------------------------------------
// Startup Validation
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  console.error(`
╔═══════════════════════════════════════════════════════════╗
║  ERROR: DATABASE_URL is not set!                         ║
║                                                          ║
║  1. Copy .env.example to .env                            ║
║  2. Paste your Supabase connection string                ║
║  3. Replace [YOUR-PASSWORD] with your database password  ║
║                                                          ║
║  See backend_api/README.md for step-by-step guide.       ║
╚═══════════════════════════════════════════════════════════╝
  `);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Connection Pool
// ---------------------------------------------------------------------------

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase requires SSL for external connections
  ssl: { rejectUnauthorized: false },
  // Supabase connection pooler (Supavisor) recommended settings
  max: 20,                   // max connections in pool
  idleTimeoutMillis: 30000,  // close idle connections after 30s
  connectionTimeoutMillis: 5000,
  // All timestamps stored in UTC (P2)
  options: '-c timezone=UTC',
});

pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

// ---------------------------------------------------------------------------
// Query Helpers
// ---------------------------------------------------------------------------

/**
 * Execute a parameterized query against the pool.
 * SAFETY: All user-supplied values MUST go through the `params` array.
 * NEVER concatenate values into the `text` string.
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 120));
  }

  return result;
}

/**
 * Get a single row or null.
 */
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

/**
 * Get all rows.
 */
export async function queryAll<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute a query that returns a single scalar value.
 * Used by metricsEngine to execute sql_template and get a number.
 */
export async function queryScalar<T = number>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query(text, params);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const firstKey = Object.keys(row)[0];
  return row[firstKey] ?? null;
}

/**
 * Get a client from the pool for transaction use.
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Graceful shutdown — drain pool.
 */
export async function shutdown(): Promise<void> {
  await pool.end();
  console.log('[DB] Pool drained');
}

export default {
  query,
  queryOne,
  queryAll,
  queryScalar,
  getClient,
  shutdown,
};