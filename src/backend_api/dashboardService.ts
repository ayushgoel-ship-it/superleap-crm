/**
 * Dashboard Service — Assembles Config-Driven Dashboard Responses
 * Phase: 6B | Source: docs/METRICS_CONFIG_SYSTEM.md §5 (execution flow)
 *
 * This is the orchestrator that:
 *   1. Loads dashboard_layout for the user's role
 *   2. For each tile, loads the metric_definition
 *   3. Executes the sql_template via metricsEngine
 *   4. Assembles the response matching API_CONTRACTS.md §5.1
 *
 * NO business logic lives here. This is a thin execution layer.
 */

import db from './db';
import metricsEngine, {
  MetricDefinition,
  executeMetric,
  executeMetricWithTarget,
  executeMetricTrend,
  getMetric,
} from './metricsEngine';
import { DateRange } from './utils/timeScope';
import { AuthContext, getEffectiveContext, dashboardKeyForRole } from './utils/roleConfig';
import { computeRAG, formatCurrencyINR } from './utils/formatters';

// ---------------------------------------------------------------------------
// Types (matches API_CONTRACTS.md §5.2 DashboardTile interface)
// ---------------------------------------------------------------------------

interface TileConfig {
  tile_id: string;
  metric_key: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  type: 'count' | 'percent' | 'currency' | 'progress' | 'gauge' | 'trend';
  display_name_override?: string;
  subtitle_template?: string;
  breakdown_metrics?: string[];
  show_trend?: boolean;
  trend_days?: number;
  action?: {
    type: 'navigate' | 'modal' | 'external';
    target: string;
    filter?: Record<string, string>;
  };
  visible_if?: {
    role?: string[];
    min_value?: number;
  };
}

interface DashboardLayout {
  layout_id: string;
  dashboard_key: string;
  role: string;
  display_name: string;
  tiles: TileConfig[];
  version: number;
  enabled: boolean;
}

export interface DashboardTileResponse {
  tile_id: string;
  metric_key: string;
  display_name: string;
  position: number;
  size: string;
  type: string;
  value: number;
  target?: number;
  unit: string;
  formatted_value?: string;
  achievement_percent?: number;
  rag?: 'green' | 'amber' | 'red' | null;
  gate?: number;
  gate_met?: boolean;
  subtitle?: string;
  trend_7d?: number[];
  breakdown?: Record<string, number>;
  components?: Record<string, number>;
  action?: TileConfig['action'];
}

// ---------------------------------------------------------------------------
// Layout Cache (TTL: 5 minutes per METRICS_CONFIG_SYSTEM.md §5.1)
// ---------------------------------------------------------------------------

let layoutCache: Map<string, DashboardLayout> = new Map();
let layoutCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Load dashboard layout for a role.
 * Source: METRICS_CONFIG_SYSTEM.md §5 step 3.
 * "ORDER BY version DESC LIMIT 1" — highest enabled version wins.
 */
async function getLayout(dashboardKey: string, role: string): Promise<DashboardLayout | null> {
  const cacheKey = `${dashboardKey}:${role}`;
  const now = Date.now();

  if (layoutCache.has(cacheKey) && now - layoutCacheTimestamp < CACHE_TTL_MS) {
    return layoutCache.get(cacheKey)!;
  }

  const row = await db.queryOne<any>(
    `SELECT layout_id, dashboard_key, role, display_name, tiles, version, enabled
     FROM dashboard_layouts
     WHERE dashboard_key = $1 AND role = $2 AND enabled = true
     ORDER BY version DESC
     LIMIT 1`,
    [dashboardKey, role]
  );

  if (!row) return null;

  const layout: DashboardLayout = {
    ...row,
    tiles: typeof row.tiles === 'string' ? JSON.parse(row.tiles) : row.tiles,
  };

  layoutCache.set(cacheKey, layout);
  layoutCacheTimestamp = now;

  return layout;
}

/**
 * Force-clear layout cache.
 */
export function invalidateLayoutCache(): void {
  layoutCache.clear();
  layoutCacheTimestamp = 0;
}

// ---------------------------------------------------------------------------
// Dashboard Assembly
// ---------------------------------------------------------------------------

/**
 * Build the complete dashboard response.
 *
 * Flow (from METRICS_CONFIG_SYSTEM.md §5):
 *   1. Auth: extract user_id, role from JWT
 *   2. Fetch layout: dashboard_layouts WHERE dashboard_key = '{role}_home'
 *   3. For each tile:
 *      a. Fetch metric_definitions WHERE metric_key = tile.metric_key AND enabled
 *      b. Resolve time scope → start_date, end_date
 *      c. Execute sql_template with bind params
 *      d. Fetch target if has_target = true
 *      e. Compute RAG from value vs rag_thresholds
 *      f. Format subtitle from subtitle_template
 *      g. If breakdown_metrics, execute each and include
 *      h. If show_trend, execute sql_template for each of last N days
 *   4. Assemble response tiles array
 *   5. Return JSON envelope
 */
export async function buildDashboard(
  auth: AuthContext,
  dateRange: DateRange,
  timeScope: string
): Promise<{
  dashboard_key: string;
  role: string;
  user_id: string;
  user_name: string;
  time_scope: string;
  period_label: string;
  tiles: DashboardTileResponse[];
  quick_stats: Record<string, number>;
}> {
  const effective = getEffectiveContext(auth);
  const dashboardKey = dashboardKeyForRole(effective.role);

  // Step 2: Load layout
  const layout = await getLayout(dashboardKey, effective.role);
  if (!layout) {
    return {
      dashboard_key: dashboardKey,
      role: effective.role,
      user_id: effective.user_id,
      user_name: auth.name,
      time_scope: timeScope,
      period_label: '',
      tiles: [],
      quick_stats: {},
    };
  }

  // Step 3: Process each tile
  const tiles: DashboardTileResponse[] = [];

  for (const tileConfig of layout.tiles) {
    const tile = await buildTile(tileConfig, effective, dateRange);
    if (tile) {
      tiles.push(tile);
    }
  }

  // Sort tiles by position
  tiles.sort((a, b) => a.position - b.position);

  // Build quick_stats (supplementary data per API_CONTRACTS.md §5.1)
  const quickStats = await buildQuickStats(effective, dateRange);

  // Period label
  const periodLabel = buildPeriodLabel(timeScope, dateRange);

  return {
    dashboard_key: dashboardKey,
    role: effective.role,
    user_id: effective.user_id,
    user_name: auth.name,
    time_scope: timeScope,
    period_label: periodLabel,
    tiles,
    quick_stats: quickStats,
  };
}

/**
 * Build a single dashboard tile response.
 * Steps 3a–3h from METRICS_CONFIG_SYSTEM.md §5.
 */
async function buildTile(
  config: TileConfig,
  auth: AuthContext,
  dateRange: DateRange
): Promise<DashboardTileResponse | null> {
  // 3a. Fetch metric definition
  const def = await getMetric(config.metric_key);
  if (!def) {
    // Metric disabled or deleted — skip tile (METRICS_CONFIG_SYSTEM.md §4.8)
    return null;
  }

  // Visibility check
  if (config.visible_if) {
    if (config.visible_if.role && !config.visible_if.role.includes(auth.role)) {
      return null;
    }
  }

  // 3c. Execute sql_template + 3d. Fetch target
  const metricResult = await executeMetricWithTarget(config.metric_key, auth, dateRange);

  // Visibility: min_value check (after computing value)
  if (config.visible_if?.min_value != null && metricResult.value < config.visible_if.min_value) {
    return null;
  }

  // 3e. Compute RAG
  const rag = computeRAG(metricResult.value, def.rag_thresholds);

  // 3f. Format subtitle
  const subtitle = resolveSubtitle(config.subtitle_template, {
    value: metricResult.value,
    target: metricResult.target,
    gate: metricResult.gate,
  });

  // Formatted value for currency types
  const formattedValue = def.unit === 'currency_inr'
    ? formatCurrencyINR(metricResult.value)
    : undefined;

  // Build tile response
  const tile: DashboardTileResponse = {
    tile_id: config.tile_id,
    metric_key: config.metric_key,
    display_name: config.display_name_override ?? def.display_name,
    position: config.position,
    size: config.size,
    type: config.type,
    value: metricResult.value,
    unit: def.unit,
    ...(formattedValue && { formatted_value: formattedValue }),
    ...(metricResult.target != null && { target: metricResult.target }),
    ...(metricResult.achievement_percent != null && {
      achievement_percent: metricResult.achievement_percent
    }),
    ...(rag && { rag }),
    ...(metricResult.gate != null && {
      gate: metricResult.gate,
      gate_met: metricResult.gate_met,
    }),
    ...(subtitle && { subtitle }),
    ...(config.action && { action: config.action }),
  };

  // 3g. Breakdown metrics
  if (config.breakdown_metrics && config.breakdown_metrics.length > 0) {
    const breakdown: Record<string, number> = {};
    for (const bKey of config.breakdown_metrics) {
      breakdown[bKey] = await executeMetric(bKey, auth, dateRange);
    }
    // Use 'breakdown' for sub-channel splits, 'components' for composition
    if (config.type === 'progress' || config.type === 'count') {
      tile.breakdown = breakdown;
    } else {
      tile.components = breakdown;
    }
  }

  // 3h. Trend sparkline
  if (config.show_trend) {
    const trendDays = config.trend_days ?? 7;
    tile.trend_7d = await executeMetricTrend(config.metric_key, auth, trendDays);
  }

  return tile;
}

// ---------------------------------------------------------------------------
// Quick Stats (supplementary data per API_CONTRACTS.md §5.1)
// ---------------------------------------------------------------------------

async function buildQuickStats(
  auth: AuthContext,
  dateRange: DateRange
): Promise<Record<string, number>> {
  const effective = getEffectiveContext(auth);

  // These are simple counts, not driven by metric_definitions.
  // They appear in quick_stats only, not as tiles.
  const dealerFilter = effective.role === 'ADMIN'
    ? { clause: '1=1', params: [] as any[] }
    : effective.role === 'TL'
      ? { clause: 'tl_user_id = $1', params: [effective.user_id] }
      : { clause: 'kam_user_id = $1', params: [effective.user_id] };

  const [activeDealers, dormantDealers, totalDealers] = await Promise.all([
    db.queryScalar<number>(
      `SELECT COUNT(*) FROM dealers WHERE status = 'active' AND deleted_at IS NULL AND ${dealerFilter.clause}`,
      dealerFilter.params
    ),
    db.queryScalar<number>(
      `SELECT COUNT(*) FROM dealers WHERE status = 'dormant' AND deleted_at IS NULL AND ${dealerFilter.clause}`,
      dealerFilter.params
    ),
    db.queryScalar<number>(
      `SELECT COUNT(*) FROM dealers WHERE deleted_at IS NULL AND ${dealerFilter.clause}`,
      dealerFilter.params
    ),
  ]);

  const kamFilter = effective.role === 'ADMIN'
    ? { clause: '1=1', params: [] as any[] }
    : effective.role === 'TL'
      ? { clause: 'tl_user_id = $1', params: [effective.user_id] }
      : { clause: 'kam_user_id = $1', params: [effective.user_id] };

  const [pendingCalls, pendingVisits] = await Promise.all([
    db.queryScalar<number>(
      `SELECT COUNT(*) FROM call_events WHERE feedback_status = 'PENDING' AND ${kamFilter.clause}`,
      kamFilter.params
    ),
    db.queryScalar<number>(
      `SELECT COUNT(*) FROM visit_events WHERE feedback_status = 'PENDING' AND ${kamFilter.clause}`,
      kamFilter.params
    ),
  ]);

  return {
    dealers_active: activeDealers ?? 0,
    dealers_dormant: dormantDealers ?? 0,
    dealers_total: totalDealers ?? 0,
    pending_feedback_calls: pendingCalls ?? 0,
    pending_feedback_visits: pendingVisits ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve subtitle template with actual values.
 * Templates use {{value}}, {{target}}, {{gate}} placeholders.
 */
function resolveSubtitle(
  template: string | undefined,
  values: { value: number; target?: number; gate?: number }
): string | undefined {
  if (!template) return undefined;

  let result = template;
  result = result.replace(/\{\{value\}\}/g, String(values.value));
  if (values.target != null) {
    result = result.replace(/\{\{target\}\}/g, String(values.target));
  }
  if (values.gate != null) {
    result = result.replace(/\{\{gate\}\}/g, String(values.gate));
  }
  return result;
}

function buildPeriodLabel(scope: string, dateRange: DateRange): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m] = dateRange.month.split('-');
  const monthName = monthNames[parseInt(m, 10) - 1];

  switch (scope) {
    case 'd-1': return 'Yesterday';
    case 'last-7d': return 'Last 7 Days';
    case 'mtd': return `${monthName} ${y} (MTD)`;
    case 'last-30d': return 'Last 30 Days';
    case 'last-6m': return 'Last 6 Months';
    case 'lifetime': return 'All Time';
    default: return `${monthName} ${y} (MTD)`;
  }
}

export default { buildDashboard, invalidateLayoutCache };
