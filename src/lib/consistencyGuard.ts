/**
 * CROSS-SCREEN CONSISTENCY GUARD
 * 
 * Ensures the same metric never shows different values across screens.
 * Logs detailed mismatch reports in development mode.
 * 
 * Example:
 *   If KAM Home shows "SI: 18" but Dealer360 shows "SI: 17",
 *   this will catch it and log where the discrepancy is.
 */

interface MetricValue {
  screen: string;
  value: number | string;
  source: string; // where the value came from
  timestamp?: number;
}

interface ConsistencyCheck {
  metric: string;
  values: Record<string, number | string>;
  sources?: Record<string, string>;
}

interface ConsistencyReport {
  metric: string;
  isConsistent: boolean;
  values: MetricValue[];
  mismatchDetails?: {
    expected: number | string;
    actual: number | string;
    screens: string[];
    tolerance?: number;
  };
}

// In-memory store of metric values for cross-screen comparison
const metricRegistry = new Map<string, Map<string, MetricValue>>();

/**
 * Register a metric value from a screen
 */
export function registerMetric(
  metricKey: string,
  screen: string,
  value: number | string,
  source: string = 'unknown'
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  if (!metricRegistry.has(metricKey)) {
    metricRegistry.set(metricKey, new Map());
  }
  
  const metricMap = metricRegistry.get(metricKey)!;
  metricMap.set(screen, {
    screen,
    value,
    source,
    timestamp: Date.now()
  });
}

/**
 * Assert that a metric is consistent across screens
 * 
 * @param check - Metric name and values from different screens
 * @param tolerance - Acceptable variance for numbers (default: 0)
 * @returns Consistency report
 */
export function assertConsistentMetric(
  check: ConsistencyCheck,
  tolerance: number = 0
): ConsistencyReport {
  const { metric, values, sources = {} } = check;
  
  const metricValues: MetricValue[] = Object.entries(values).map(([screen, value]) => ({
    screen,
    value,
    source: sources[screen] || 'unknown',
    timestamp: Date.now()
  }));
  
  // Check if all values are the same
  const uniqueValues = new Set(metricValues.map(mv => mv.value));
  const isConsistent = uniqueValues.size === 1 || (
    uniqueValues.size > 1 && 
    tolerance > 0 && 
    areValuesWithinTolerance(Array.from(uniqueValues) as number[], tolerance)
  );
  
  const report: ConsistencyReport = {
    metric,
    isConsistent,
    values: metricValues
  };
  
  // If inconsistent, add mismatch details
  if (!isConsistent) {
    const sortedValues = metricValues.sort((a, b) => {
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return b.value - a.value;
      }
      return 0;
    });
    
    report.mismatchDetails = {
      expected: sortedValues[0].value,
      actual: sortedValues[sortedValues.length - 1].value,
      screens: metricValues.map(mv => mv.screen),
      tolerance
    };
    
    // Log in dev mode
    if (process.env.NODE_ENV !== 'production') {
      logConsistencyError(report);
    }
  }
  
  return report;
}

/**
 * Check if numeric values are within tolerance
 */
function areValuesWithinTolerance(values: number[], tolerance: number): boolean {
  if (values.length < 2) return true;
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return (max - min) <= tolerance;
}

/**
 * Log consistency error to console
 */
function logConsistencyError(report: ConsistencyReport): void {
  console.group(`🚨 Metric Consistency Error: ${report.metric}`);
  console.error('❌ Metric values do not match across screens:');
  
  console.table(report.values.map(mv => ({
    Screen: mv.screen,
    Value: mv.value,
    Source: mv.source
  })));
  
  if (report.mismatchDetails) {
    const { expected, actual, tolerance } = report.mismatchDetails;
    console.error(`Expected: ${expected}, Got: ${actual}`);
    if (tolerance && tolerance > 0) {
      console.error(`Tolerance: ±${tolerance}`);
    }
  }
  
  console.error('\n💡 Possible causes:');
  console.error('  1. Different selectors used');
  console.error('  2. Different time ranges applied');
  console.error('  3. Cache not invalidated');
  console.error('  4. Direct engine call instead of selector');
  
  console.groupEnd();
}

/**
 * Check all registered metrics for consistency
 */
export function checkAllMetrics(): ConsistencyReport[] {
  if (process.env.NODE_ENV === 'production') {
    return [];
  }
  
  const reports: ConsistencyReport[] = [];
  
  metricRegistry.forEach((metricMap, metricKey) => {
    const values: Record<string, number | string> = {};
    const sources: Record<string, string> = {};
    
    metricMap.forEach((metricValue, screen) => {
      values[screen] = metricValue.value;
      sources[screen] = metricValue.source;
    });
    
    const report = assertConsistentMetric({
      metric: metricKey,
      values,
      sources
    });
    
    reports.push(report);
  });
  
  return reports;
}

/**
 * Clear metric registry (useful for testing)
 */
export function clearMetricRegistry(): void {
  metricRegistry.clear();
}

/**
 * Get current metric registry (for debugging)
 */
export function getMetricRegistry(): Map<string, Map<string, MetricValue>> {
  return metricRegistry;
}

/**
 * Consistency guard for common metrics
 */
export const ConsistencyGuards = {
  /**
   * Check Stock-In consistency
   */
  stockIns(values: Record<string, number>): ConsistencyReport {
    return assertConsistentMetric({
      metric: 'Stock-Ins (MTD)',
      values
    }, 0); // Zero tolerance for SI
  },
  
  /**
   * Check I2SI consistency
   */
  i2si(values: Record<string, number>): ConsistencyReport {
    return assertConsistentMetric({
      metric: 'I2SI %',
      values
    }, 0.5); // 0.5% tolerance for rounding differences
  },
  
  /**
   * Check total earnings consistency
   */
  totalEarnings(values: Record<string, number>): ConsistencyReport {
    return assertConsistentMetric({
      metric: 'Total Earnings',
      values
    }, 1); // ₹1 tolerance for rounding
  },
  
  /**
   * Check input score consistency
   */
  inputScore(values: Record<string, number>): ConsistencyReport {
    return assertConsistentMetric({
      metric: 'Input Score',
      values
    }, 0.5); // 0.5 point tolerance
  },
  
  /**
   * Check DCF count consistency
   */
  dcfCount(values: Record<string, number>): ConsistencyReport {
    return assertConsistentMetric({
      metric: 'DCF Leads',
      values
    }, 0); // Zero tolerance for counts
  },
  
  /**
   * Check productivity rate consistency
   */
  productivityRate(values: Record<string, number>, type: 'calls' | 'visits'): ConsistencyReport {
    return assertConsistentMetric({
      metric: `${type === 'calls' ? 'Call' : 'Visit'} Productivity %`,
      values
    }, 1); // 1% tolerance for rounding
  }
};

/**
 * Create visual warning for consistency mismatch
 */
export function createConsistencyWarning(report: ConsistencyReport): void {
  if (process.env.NODE_ENV === 'production' || report.isConsistent) {
    return;
  }
  
  const badge = document.createElement('div');
  badge.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f59e0b;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 9999;
    font-family: monospace;
    font-size: 12px;
    max-width: 300px;
  `;
  
  const screens = report.values.map(v => v.screen).join(', ');
  badge.innerHTML = `
    <strong>⚠️ Metric Mismatch</strong><br>
    <strong>${report.metric}</strong><br>
    Inconsistent across: ${screens}<br>
    <small>Check console for details</small>
  `;
  
  document.body.appendChild(badge);
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    badge.remove();
  }, 8000);
}

/**
 * Hook for React components to register metrics on mount
 */
export function useMetricRegistration(
  metricKey: string,
  screen: string,
  value: number | string | undefined,
  source: string = 'selector'
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  if (value !== undefined && value !== null) {
    registerMetric(metricKey, screen, value, source);
  }
}

/**
 * Development-only consistency check runner
 * Call this periodically or on navigation to catch issues
 */
export function runConsistencyChecks(): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  const reports = checkAllMetrics();
  const inconsistencies = reports.filter(r => !r.isConsistent);
  
  if (inconsistencies.length > 0) {
    console.warn(`⚠️ Found ${inconsistencies.length} metric inconsistencies`);
    inconsistencies.forEach(report => {
      createConsistencyWarning(report);
    });
  } else if (reports.length > 0) {
    console.log(`✅ All ${reports.length} metrics are consistent`);
  }
}

/**
 * Auto-run consistency checks in dev mode
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Run checks every 10 seconds in dev mode
  setInterval(() => {
    runConsistencyChecks();
  }, 10000);
}
