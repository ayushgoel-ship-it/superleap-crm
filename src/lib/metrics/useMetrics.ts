/**
 * useMetrics — CANONICAL METRICS HOOK (Wave 1A)
 *
 * Single entry point for every dashboard / home / performance surface that
 * needs DashboardMetrics. Wraps the rank-based `computeMetrics` engine in
 * `lib/metrics/metricsFromDB.ts` and binds it to the caller's ActorScope so
 * role-based filtering is automatic and cannot be bypassed by forgetting to
 * pass `kamId`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Before Wave 1A the codebase had two parallel metric engines:
 *   1. `lib/metrics/metricsFromDB.ts`   → rank-based (reg_insp_rank=1, etc.)
 *   2. `data/canonicalMetrics.ts`        → stage-based (classifyLeadStage)
 * These produced drift for the same KAM / period (Inspections, I2SI, DCF
 * GMV). The rank-based engine matches the backend source of truth; this
 * hook makes it the single dashboard engine.
 *
 * `canonicalMetrics.ts` is NOT deleted — it still owns stage classification
 * (isStockIn/isInspection/classifyLeadStage) and dealer-level DCF filtering
 * used by the DCF pages. But for dashboard counters, `useMetrics()` is now
 * authoritative.
 *
 * USAGE
 * -----
 *   const { metrics, scope } = useMetrics(period, { customFrom, customTo });
 *   // metrics is scoped to the current actor automatically:
 *   //   KAM           → metrics for that KAM only
 *   //   TL            → metrics aggregated across TL's team KAMs
 *   //   Admin         → metrics across all data (or impersonation target)
 *
 * DO NOT call `computeMetrics()` directly from pages anymore. Use this hook.
 */
import { useMemo } from 'react';
import { TimePeriod } from '../domain/constants';
import { computeMetrics, type DashboardMetrics } from './metricsFromDB';
import { useActorScope, type ActorScopeValue as ActorScope } from '../auth/useActorScope';

export interface UseMetricsOptions {
  customFrom?: string;
  customTo?: string;
  /**
   * Override the auto-derived actor scope. Used by Admin pages that render
   * a specific KAM/TL drill-down while the Admin is the real authenticated
   * actor. Pass explicit `kamId` or `kamIds` to scope the result.
   */
  overrideKamId?: string;
  overrideKamIds?: string[];
}

export interface UseMetricsResult {
  metrics: DashboardMetrics;
  scope: ActorScope;
  /** True when scope resolves to "all data" (Admin, no override). */
  isGlobalScope: boolean;
}

export function useMetrics(
  period: TimePeriod,
  options: UseMetricsOptions = {},
): UseMetricsResult {
  const scope = useActorScope();
  const { customFrom, customTo, overrideKamId, overrideKamIds } = options;

  const effectiveKamId =
    overrideKamId ??
    (scope.role === 'KAM' && scope.effectiveKamIds && scope.effectiveKamIds.length === 1
      ? scope.effectiveKamIds[0]
      : undefined);
  // Note: the current `computeMetrics` signature takes a single kamId.
  // TL/Admin team rollups will move to a multi-kam variant in Wave 2.
  // For Wave 1A correctness: KAM → single kamId; TL/Admin → undefined (all).
  const metrics = useMemo(
    () => computeMetrics(period, effectiveKamId, customFrom, customTo),
    [period, effectiveKamId, customFrom, customTo],
  );

  const isGlobalScope =
    !effectiveKamId && !(overrideKamIds && overrideKamIds.length > 0);

  return { metrics, scope, isGlobalScope };
}
