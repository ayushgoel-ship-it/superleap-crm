/**
 * Metrics Engine — Config-Driven SQL Executor
 * Phase: 6B | Source: docs/METRICS_CONFIG_SYSTEM.md §5
 *
 * This is the core of the config-driven architecture.
 * It reads sql_template from metric_definitions, substitutes named
 * parameters with positional $N bindings, and executes safely.
 *
 * CRITICAL SAFETY RULES:
 * - NEVER use string interpolation for user-supplied values
 * - ALL values go through parameterized query binding ($1, $2, ...)
 * - sql_template is treated as trusted (authored by admins in DB)
 * - Bind params (:user_id, :start_date, etc.) are replaced with $N
 */

import db from './db';
import { DateRange } from './utils/timeScope';
import { AuthContext, getEffectiveContext } from './utils/roleConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricDefinition {
  metric_key: string;
  display_name: string;
  description: string | null;
  unit: string;
  calc_type: string;
  sql_template: string;
  dimensions_allowed: string[];
  filters_allowed: string[];
  default_time_scope: string;
  rag_thresholds: { green_min?: number; amber_min?: number } | null;
  format_pattern: string | null;
  has_target: boolean;
  target_source: string | null;
  gate_threshold: number | null;
  enabled: boolean;
}

export interface MetricResult {
  metric_key: string;
  value: number;
  target?: number;
  achievement_percent?: number;
  gate?: number;
  gate_met?: boolean;
}

// ---------------------------------------------------------------------------
// Metric Definition Cache (TTL: 5 minutes per METRICS_CONFIG_SYSTEM.md §5.1)
// ---------------------------------------------------------------------------

let metricCache: Map<string, MetricDefinition> = new Map();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load all enabled metric definitions from the database.
 * Cached for 5 minutes (per METRICS_CONFIG_SYSTEM.md §5.1).
 */
export async function getMetricDefinitions(): Promise<Map<string, MetricDefinition>> {
  const now = Date.now();
  if (metricCache.size > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return metricCache;
  }

  const rows = await db.queryAll<MetricDefinition>(
    `SELECT metric_key, display_name, description, unit, calc_type,
            sql_template, dimensions_allowed, filters_allowed,
            default_time_scope, rag_thresholds, format_pattern,
            has_target, target_source, gate_threshold, enabled
     FROM metric_definitions
     WHERE enabled = true`
  );

  metricCache = new Map();
  for (const row of rows) {
    metricCache.set(row.metric_key, row);
  }
  cacheTimestamp = now;

  return metricCache;
}

/**
 * Fetch a single metric definition by key.
 */
export async function getMetric(metricKey: string): Promise<MetricDefinition | null> {
  const defs = await getMetricDefinitions();
  return defs.get(metricKey) ?? null;
}

/**
 * Force-clear the cache (e.g., after admin updates metric_definitions).
 */
export function invalidateCache(): void {
  metricCache.clear();
  cacheTimestamp = 0;
}

// ---------------------------------------------------------------------------
// Safe SQL Template Execution
// ---------------------------------------------------------------------------

/**
 * Named parameter tokens recognized in sql_template.
 * Source: METRICS_CONFIG_SYSTEM.md §1.1 — bind params list.
 */
interface BindParams {
  user_id: string;
  team_id?: string | null;
  start_date: string;
  end_date: string;
  month: string;
  dealer_id?: string;
  region?: string;
}

/**
 * Replace named :param tokens in sql_template with positional $N params.
 * Returns the rewritten SQL and ordered values array.
 *
 * Example:
 *   Input:  "SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND ..."
 *   Output: { sql: "SELECT COUNT(*) FROM leads WHERE kam_user_id = $1 AND ...", values: ['kam-ncr-01'] }
 *
 * SAFETY: This only replaces known parameter names. Unknown tokens are left as-is
 * (they'll cause a Postgres error, which is safer than silent injection).
 */
function bindTemplate(
  template: string,
  params: BindParams
): { sql: string; values: any[] } {
  const paramMap: Record<string, any> = {
    ':user_id': params.user_id,
    ':team_id': params.team_id ?? null,
    ':start_date': params.start_date,
    ':end_date': params.end_date,
    ':month': params.month,
    ':dealer_id': params.dealer_id ?? null,
    ':region': params.region ?? null,
  };

  const values: any[] = [];
  let paramIndex = 1;
  let sql = template;

  // Replace each named param with $N, collecting values in order.
  // Process longer tokens first to avoid partial matches.
  const tokens = Object.keys(paramMap).sort((a, b) => b.length - a.length);

  for (const token of tokens) {
    // Replace ALL occurrences of this token
    while (sql.includes(token)) {
      sql = sql.replace(token, `$${paramIndex}`);
      values.push(paramMap[token]);
      paramIndex++;
    }
  }

  return { sql, values };
}

/**
 * Execute a metric's sql_template and return the scalar result.
 *
 * Flow (from METRICS_CONFIG_SYSTEM.md §5):
 *   1. Load metric definition
 *   2. Bind named params to positional $N
 *   3. Execute parameterized query
 *   4. Return numeric result (NULL → 0 per DRD §0)
 */
export async function executeMetric(
  metricKey: string,
  auth: AuthContext,
  dateRange: DateRange,
  overrides?: { dealer_id?: string; region?: string }
): Promise<number> {
  const def = await getMetric(metricKey);
  if (!def) {
    console.warn(`[MetricsEngine] Unknown/disabled metric: ${metricKey}`);
    return 0;
  }

  const effective = getEffectiveContext(auth);

  const bindParams: BindParams = {
    user_id: effective.user_id,
    team_id: effective.team_id,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    month: dateRange.month,
    dealer_id: overrides?.dealer_id,
    region: overrides?.region ?? effective.region,
  };

  const { sql, values } = bindTemplate(def.sql_template, bindParams);

  try {
    const result = await db.queryScalar<number>(sql, values);
    // DRD §0: NULL → 0
    return result ?? 0;
  } catch (err: any) {
    console.error(`[MetricsEngine] Error executing ${metricKey}:`, err.message);
    console.error(`[MetricsEngine] SQL:`, sql.substring(0, 200));
    return 0;
  }
}

/**
 * Execute a metric and also fetch its target (if has_target = true).
 * Returns the full MetricResult with achievement %.
 */
export async function executeMetricWithTarget(
  metricKey: string,
  auth: AuthContext,
  dateRange: DateRange,
  overrides?: { dealer_id?: string }
): Promise<MetricResult> {
  const def = await getMetric(metricKey);
  const value = await executeMetric(metricKey, auth, dateRange, overrides);

  const result: MetricResult = { metric_key: metricKey, value };

  if (def?.has_target && def.target_source) {
    const target = await fetchTarget(def.target_source, auth, dateRange);
    result.target = target;
    result.achievement_percent = target > 0
      ? Math.round((value / target) * 1000) / 10
      : 0;
  }

  if (def?.gate_threshold != null) {
    result.gate = def.gate_threshold;
    result.gate_met = value >= def.gate_threshold;
  }

  return result;
}

/**
 * Fetch target value from the targets table.
 * target_source is a column reference like 'targets.si_target'.
 */
async function fetchTarget(
  targetSource: string,
  auth: AuthContext,
  dateRange: DateRange
): Promise<number> {
  const effective = getEffectiveContext(auth);

  // Parse "targets.column_name"
  const parts = targetSource.split('.');
  if (parts.length !== 2 || parts[0] !== 'targets') {
    console.warn(`[MetricsEngine] Invalid target_source: ${targetSource}`);
    return 0;
  }

  const column = parts[1];
  // Whitelist valid target columns to prevent injection
  const validColumns = ['si_target', 'call_target', 'visit_target',
    'input_score_gate', 'quality_score_gate'];
  if (!validColumns.includes(column)) {
    console.warn(`[MetricsEngine] Unknown target column: ${column}`);
    return 0;
  }

  const row = await db.queryOne<any>(
    `SELECT ${column} FROM targets WHERE user_id = $1 AND month = $2`,
    [effective.user_id, dateRange.month]
  );

  return row?.[column] ?? 0;
}

/**
 * Execute a metric for each of the last N days (for trend/sparkline).
 * Source: METRICS_CONFIG_SYSTEM.md §5 step 4h.
 */
export async function executeMetricTrend(
  metricKey: string,
  auth: AuthContext,
  days: number = 7
): Promise<number[]> {
  const results: number[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dayRange: DateRange = {
      start_date: dayStart.toISOString(),
      end_date: dayEnd.toISOString(),
      month: `${dayStart.getUTCFullYear()}-${String(dayStart.getUTCMonth() + 1).padStart(2, '0')}`,
    };

    const value = await executeMetric(metricKey, auth, dayRange);
    results.push(value);
  }

  return results;
}

export default {
  getMetricDefinitions,
  getMetric,
  invalidateCache,
  executeMetric,
  executeMetricWithTarget,
  executeMetricTrend,
};
