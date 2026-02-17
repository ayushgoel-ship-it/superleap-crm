/**
 * SuperLeap CRM — Database Connection Verification Script
 * Phase: 6C
 *
 * Purpose: Verify that backend_api can connect to Supabase Postgres
 * and that the Phase 6A schema + seed data are in place.
 *
 * Usage:
 *   1. Make sure .env file exists with DATABASE_URL set
 *   2. Run: npx ts-node backend_api/scripts/verify.ts
 *      (or: npx tsx backend_api/scripts/verify.ts)
 *
 * What it checks:
 *   Step 1: Can we connect to the database?
 *   Step 2: Do the Phase 6A tables exist?
 *   Step 3: Are metric_definitions seeded?
 *   Step 4: Are dashboard_layouts seeded?
 *   Step 5: Quick data integrity check
 */

import { Pool } from 'pg';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Load .env file if present (for local development)
// ---------------------------------------------------------------------------

try {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
} catch {
  // dotenv not installed — that's fine if DATABASE_URL is set in env
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;

// All tables expected from Phase 6A migrations
const EXPECTED_TABLES = [
  'teams',
  'users',
  'dealers',
  'leads',
  'dcf_leads',
  'dcf_timeline_events',
  'call_events',
  'visit_events',
  'location_requests',
  'notifications',
  'targets',
  'incentive_slabs',
  'metric_definitions',
  'dashboard_layouts',
  'audit_log',
];

// ---------------------------------------------------------------------------
// Pretty Printing
// ---------------------------------------------------------------------------

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function pass(msg: string) { console.log(`  ${GREEN}PASS${RESET}  ${msg}`); }
function fail(msg: string) { console.log(`  ${RED}FAIL${RESET}  ${msg}`); }
function warn(msg: string) { console.log(`  ${YELLOW}WARN${RESET}  ${msg}`); }
function info(msg: string) { console.log(`  ${BOLD}INFO${RESET}  ${msg}`); }

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`
${BOLD}╔══════════════════════════════════════════════════╗
║  SuperLeap CRM — Database Verification           ║
║  Phase: 6C                                        ║
╚══════════════════════════════════════════════════╝${RESET}
`);

  // -------------------------------------------------------
  // Pre-check: DATABASE_URL
  // -------------------------------------------------------
  if (!DATABASE_URL) {
    fail('DATABASE_URL environment variable is not set.');
    console.log(`
  ${BOLD}How to fix:${RESET}
  1. Copy backend_api/.env.example to backend_api/.env
  2. Open .env and paste your Supabase connection string
  3. Replace [YOUR-PASSWORD] with your database password
  4. Run this script again
`);
    process.exit(1);
  }

  // Mask password in output
  const maskedUrl = DATABASE_URL.replace(/:([^@]+)@/, ':****@');
  info(`Connecting to: ${maskedUrl}`);
  console.log('');

  // -------------------------------------------------------
  // Create connection pool
  // -------------------------------------------------------
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    options: '-c timezone=UTC',
  });

  let allPassed = true;

  try {
    // -------------------------------------------------------
    // Step 1: Connection Test
    // -------------------------------------------------------
    console.log(`${BOLD}Step 1: Connection Test${RESET}`);

    const client = await pool.connect();
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0]?.version ?? 'unknown';
    client.release();

    pass(`Connected successfully`);
    info(`PostgreSQL: ${version.substring(0, 80)}`);
    console.log('');

    // -------------------------------------------------------
    // Step 2: Table Existence Check
    // -------------------------------------------------------
    console.log(`${BOLD}Step 2: Table Existence Check (Phase 6A)${RESET}`);

    const tableResult = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    );
    const existingTables = tableResult.rows.map((r: any) => r.table_name);

    let tablesFound = 0;
    let tablesMissing = 0;

    for (const table of EXPECTED_TABLES) {
      if (existingTables.includes(table)) {
        pass(`Table "${table}" exists`);
        tablesFound++;
      } else {
        fail(`Table "${table}" is MISSING`);
        tablesMissing++;
        allPassed = false;
      }
    }

    console.log('');
    info(`${tablesFound}/${EXPECTED_TABLES.length} tables found, ${tablesMissing} missing`);

    if (tablesMissing > 0) {
      console.log(`
  ${BOLD}How to fix:${RESET}
  Run the Phase 6A migration files in order:
    psql $DATABASE_URL -f migrations/001_create_teams.sql
    psql $DATABASE_URL -f migrations/002_create_users.sql
    ... (see migrations/ folder for all files)
  
  Or run them all via the Supabase SQL Editor:
    1. Go to https://supabase.com/dashboard/project/fdmlyrgiktljuyuthgki
    2. Click "SQL Editor" in the left sidebar
    3. Paste each migration file's contents and click "Run"
`);
    }
    console.log('');

    // -------------------------------------------------------
    // Step 3: metric_definitions Seed Check
    // -------------------------------------------------------
    console.log(`${BOLD}Step 3: metric_definitions Seed Data${RESET}`);

    if (existingTables.includes('metric_definitions')) {
      const metricCount = await pool.query('SELECT COUNT(*)::int AS count FROM metric_definitions');
      const count = metricCount.rows[0]?.count ?? 0;

      if (count > 0) {
        pass(`metric_definitions has ${count} rows`);

        // Show a few sample metrics
        const samples = await pool.query(
          `SELECT metric_key, display_name, enabled
           FROM metric_definitions
           ORDER BY metric_key
           LIMIT 5`
        );
        for (const row of samples.rows) {
          info(`  ${row.metric_key} → "${row.display_name}" (enabled: ${row.enabled})`);
        }
        if (count > 5) {
          info(`  ... and ${count - 5} more`);
        }
      } else {
        warn(`metric_definitions exists but has 0 rows (not seeded yet)`);
        console.log(`
  ${BOLD}How to fix:${RESET}
  Run: psql $DATABASE_URL -f seed/metrics.sql
  Or paste seed/metrics.sql into the Supabase SQL Editor.
`);
        allPassed = false;
      }
    } else {
      fail('metric_definitions table does not exist — skipping seed check');
    }
    console.log('');

    // -------------------------------------------------------
    // Step 4: dashboard_layouts Seed Check
    // -------------------------------------------------------
    console.log(`${BOLD}Step 4: dashboard_layouts Seed Data${RESET}`);

    if (existingTables.includes('dashboard_layouts')) {
      const layoutCount = await pool.query('SELECT COUNT(*)::int AS count FROM dashboard_layouts');
      const count = layoutCount.rows[0]?.count ?? 0;

      if (count > 0) {
        pass(`dashboard_layouts has ${count} rows`);

        const layouts = await pool.query(
          `SELECT layout_id, dashboard_key, role, display_name,
                  jsonb_array_length(tiles) AS tile_count
           FROM dashboard_layouts
           ORDER BY layout_id`
        );
        for (const row of layouts.rows) {
          info(`  ${row.layout_id} → "${row.display_name}" (${row.role}, ${row.tile_count} tiles)`);
        }
      } else {
        warn(`dashboard_layouts exists but has 0 rows (not seeded yet)`);
        console.log(`
  ${BOLD}How to fix:${RESET}
  Run: psql $DATABASE_URL -f seed/dashboards.sql
  Or paste seed/dashboards.sql into the Supabase SQL Editor.
`);
        allPassed = false;
      }
    } else {
      fail('dashboard_layouts table does not exist — skipping seed check');
    }
    console.log('');

    // -------------------------------------------------------
    // Step 5: Quick Integrity Check
    // -------------------------------------------------------
    console.log(`${BOLD}Step 5: Quick Integrity Check${RESET}`);

    if (existingTables.includes('metric_definitions') && existingTables.includes('dashboard_layouts')) {
      // Check that all metric_keys referenced in dashboard tiles exist
      const orphanCheck = await pool.query(`
        SELECT DISTINCT elem->>'metric_key' AS metric_key
        FROM dashboard_layouts,
             jsonb_array_elements(tiles) AS elem
        WHERE NOT EXISTS (
          SELECT 1 FROM metric_definitions
          WHERE metric_key = elem->>'metric_key'
        )
      `);

      if (orphanCheck.rows.length === 0) {
        pass('All dashboard tile metric_keys reference existing metric_definitions');
      } else {
        warn(`${orphanCheck.rows.length} dashboard tile(s) reference missing metric_keys:`);
        for (const row of orphanCheck.rows) {
          warn(`  Missing: ${row.metric_key}`);
        }
        allPassed = false;
      }

      // Check index count
      const indexCount = await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM pg_indexes
        WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      `);
      const idxCount = indexCount.rows[0]?.count ?? 0;
      if (idxCount >= 19) {
        pass(`${idxCount} custom indexes found (expected 19+ from Phase 6A)`);
      } else if (idxCount > 0) {
        warn(`Only ${idxCount} custom indexes found (expected 19+ from Phase 6A)`);
      } else {
        warn('No custom indexes found — run migrations/013_create_indexes.sql');
      }
    } else {
      warn('Skipping integrity check — tables not yet created');
    }

  } catch (err: any) {
    console.log('');
    fail(`Connection failed: ${err.message}`);

    if (err.message.includes('password authentication failed')) {
      console.log(`
  ${BOLD}How to fix:${RESET}
  Your database password is incorrect. Check your .env file:
  1. Go to Supabase Dashboard → Project Settings → Database
  2. If you forgot your password, click "Reset database password"
  3. Update DATABASE_URL in your .env file with the new password
`);
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.log(`
  ${BOLD}How to fix:${RESET}
  Cannot reach the database host. Check:
  1. Your internet connection
  2. The hostname in DATABASE_URL is correct
  3. The project ref matches your Supabase project
`);
    } else if (err.message.includes('timeout')) {
      console.log(`
  ${BOLD}How to fix:${RESET}
  Connection timed out. This could mean:
  1. Your Supabase project is paused (go to Dashboard and resume it)
  2. There's a firewall blocking the connection
  3. Try again in a moment
`);
    }

    allPassed = false;
  } finally {
    await pool.end();
  }

  // -------------------------------------------------------
  // Summary
  // -------------------------------------------------------
  console.log('');
  console.log(`${BOLD}${'═'.repeat(52)}${RESET}`);

  if (allPassed) {
    console.log(`${GREEN}${BOLD}  ALL CHECKS PASSED${RESET}`);
    console.log(`  Backend API is ready to connect to Supabase.`);
    console.log(`  Next: run the server with "npx tsx backend_api/server.ts"`);
  } else {
    console.log(`${YELLOW}${BOLD}  SOME CHECKS NEED ATTENTION${RESET}`);
    console.log(`  Follow the "How to fix" instructions above.`);
    console.log(`  Then re-run this script to verify.`);
  }

  console.log(`${BOLD}${'═'.repeat(52)}${RESET}`);
  console.log('');

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
