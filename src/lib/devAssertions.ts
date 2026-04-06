/**
 * Dev Assertions - Runtime-Safe Flow Checks
 * 
 * Purpose: Development-only assertions to catch flow violations early
 * Production: NO-OP (tree-shaken out of production builds)
 * 
 * Usage:
 *   import { assertRouteExists, assertComponentExists } from '@/lib/devAssertions';
 *   assertRouteExists('DEALER_DETAIL');
 *   assertComponentExists(DealerDetailPageV2);
 */

const IS_DEV = import.meta.env?.MODE === 'development' || process.env.NODE_ENV === 'development';

/**
 * Assert that a route constant exists
 * Prevents typos in route navigation
 */
export function assertRouteExists(routeKey: string, routes: Record<string, string>): void {
  if (!IS_DEV) return; // NO-OP in production
  
  if (!(routeKey in routes)) {
    console.error(`[DEV ASSERTION] Route '${routeKey}' does not exist in routes.ts`);
    console.error('Available routes:', Object.keys(routes));
    throw new Error(`Route '${routeKey}' not found`);
  }
}

/**
 * Assert that a component is defined (not null/undefined)
 * Prevents rendering null components
 */
export function assertComponentExists(component: any, name?: string): void {
  if (!IS_DEV) return; // NO-OP in production
  
  if (!component) {
    const componentName = name || component?.name || 'Unknown';
    console.error(`[DEV ASSERTION] Component '${componentName}' is null or undefined`);
    throw new Error(`Component '${componentName}' not found`);
  }
}

/**
 * Assert that a selector returns non-null
 * Prevents missing data errors
 */
export function assertSelectorReturnsNonNull<T>(
  value: T | null | undefined,
  selectorName: string,
  entityId?: string
): asserts value is T {
  if (!IS_DEV) return; // NO-OP in production
  
  if (value === null || value === undefined) {
    const idMsg = entityId ? ` for ID '${entityId}'` : '';
    console.error(`[DEV ASSERTION] Selector '${selectorName}' returned null/undefined${idMsg}`);
    console.error('This may indicate:');
    console.error('  1. Entity does not exist in mock database');
    console.error('  2. ID normalization issue (check LEGACY_ID_MAP)');
    console.error('  3. Selector logic bug');
    throw new Error(`Selector '${selectorName}' returned null${idMsg}`);
  }
}

/**
 * Assert that an ID follows canonical format
 * Prevents legacy ID usage
 */
export function assertCanonicalId(id: string, entityType: string): void {
  if (!IS_DEV) return; // NO-OP in production
  
  const patterns: Record<string, RegExp> = {
    dealer: /^dealer-[a-z]+-\d+$/,
    kam: /^kam-[a-z]+-\d+$/,
    tl: /^tl-[a-z]+-\d+$/,
    lead: /^lead-[a-z]+-\d+$/,
    call: /^call-\d+-\d+$/,
    visit: /^visit-\d+-\d+$/,
  };
  
  const pattern = patterns[entityType.toLowerCase()];
  if (!pattern) {
    console.warn(`[DEV ASSERTION] No ID pattern defined for entity type '${entityType}'`);
    return;
  }
  
  if (!pattern.test(id)) {
    console.error(`[DEV ASSERTION] ID '${id}' does not match canonical format for ${entityType}`);
    console.error(`Expected format: ${pattern.toString()}`);
    console.error('Did you forget to normalize the ID?');
    console.error('Use: normalizeDealerId(id) from @/data/idUtils');
    throw new Error(`Non-canonical ${entityType} ID: ${id}`);
  }
}

/**
 * Assert that navigation state is valid before routing
 * Prevents invalid navigation
 */
export function assertNavigationState(
  currentPage: string,
  targetPage: string,
  validTransitions: Record<string, string[]>
): void {
  if (!IS_DEV) return; // NO-OP in production
  
  const allowedTargets = validTransitions[currentPage];
  if (!allowedTargets) {
    console.warn(`[DEV ASSERTION] No transition rules defined for page '${currentPage}'`);
    return; // Allow if no rules defined
  }
  
  if (!allowedTargets.includes(targetPage) && !allowedTargets.includes('*')) {
    console.error(`[DEV ASSERTION] Invalid navigation: ${currentPage} → ${targetPage}`);
    console.error(`Allowed transitions from '${currentPage}':`, allowedTargets);
    throw new Error(`Invalid navigation: ${currentPage} → ${targetPage}`);
  }
}

/**
 * Assert that a flow invariant holds
 * Generic assertion for business rules
 */
export function assertFlowInvariant(
  condition: boolean,
  message: string,
  context?: Record<string, any>
): void {
  if (!IS_DEV) return; // NO-OP in production
  
  if (!condition) {
    console.error(`[DEV ASSERTION] Flow invariant violated: ${message}`);
    if (context) {
      console.error('Context:', context);
    }
    throw new Error(`Flow invariant violated: ${message}`);
  }
}

/**
 * Assert that DTO shape matches expected contract
 * Prevents interface mismatches
 */
export function assertDTOShape<T extends Record<string, any>>(
  dto: T,
  requiredKeys: (keyof T)[],
  dtoName: string
): void {
  if (!IS_DEV) return; // NO-OP in production
  
  const missingKeys = requiredKeys.filter(key => !(key in dto));
  
  if (missingKeys.length > 0) {
    console.error(`[DEV ASSERTION] DTO '${dtoName}' missing required keys:`, missingKeys);
    console.error('DTO received:', dto);
    console.error('Required keys:', requiredKeys);
    throw new Error(`DTO '${dtoName}' missing keys: ${missingKeys.join(', ')}`);
  }
}

/**
 * Assert that engine calculation returns valid number
 * Prevents NaN/Infinity from engines
 */
export function assertValidNumber(
  value: number,
  calculationName: string,
  allowZero = true
): void {
  if (!IS_DEV) return; // NO-OP in production
  
  if (Number.isNaN(value)) {
    console.error(`[DEV ASSERTION] Calculation '${calculationName}' returned NaN`);
    throw new Error(`Calculation '${calculationName}' returned NaN`);
  }
  
  if (!Number.isFinite(value)) {
    console.error(`[DEV ASSERTION] Calculation '${calculationName}' returned Infinity`);
    throw new Error(`Calculation '${calculationName}' returned Infinity`);
  }
  
  if (!allowZero && value === 0) {
    console.warn(`[DEV ASSERTION] Calculation '${calculationName}' returned 0 (may be unexpected)`);
  }
}

/**
 * Assert that array is not empty
 * Prevents rendering empty lists without fallback
 */
export function assertNonEmptyArray<T>(
  array: T[],
  arrayName: string,
  context?: string
): void {
  if (!IS_DEV) return; // NO-OP in production
  
  if (!Array.isArray(array)) {
    console.error(`[DEV ASSERTION] '${arrayName}' is not an array`);
    throw new Error(`'${arrayName}' is not an array`);
  }
  
  if (array.length === 0) {
    const contextMsg = context ? ` in context: ${context}` : '';
    console.warn(`[DEV ASSERTION] Array '${arrayName}' is empty${contextMsg}`);
    console.warn('Ensure UI has empty state handling');
  }
}

/**
 * Warn about deprecated usage (non-fatal)
 * Helps migrate to new patterns
 */
export function warnDeprecated(
  oldPattern: string,
  newPattern: string,
  deprecatedSince?: string
): void {
  if (!IS_DEV) return; // NO-OP in production
  
  const sinceMsg = deprecatedSince ? ` (deprecated since ${deprecatedSince})` : '';
  console.warn(`[DEPRECATION WARNING]${sinceMsg}`);
  console.warn(`  Old: ${oldPattern}`);
  console.warn(`  New: ${newPattern}`);
  console.warn('Please update to the new pattern.');
}

/**
 * Log development-only info (removed in production)
 * Useful for debugging flows
 */
export function devLog(message: string, data?: any): void {
  if (!IS_DEV) return; // NO-OP in production
  
  console.log(`[DEV LOG] ${message}`, data !== undefined ? data : '');
}

/**
 * Performance assertion - warn if operation is slow
 * Helps catch performance regressions
 */
export function assertPerformance(
  operation: () => void,
  maxMs: number,
  operationName: string
): void {
  if (!IS_DEV) return; // NO-OP in production
  
  const start = performance.now();
  operation();
  const duration = performance.now() - start;
  
  if (duration > maxMs) {
    console.warn(`[PERFORMANCE WARNING] '${operationName}' took ${duration.toFixed(2)}ms (max: ${maxMs}ms)`);
    console.warn('Consider optimizing this operation');
  }
}

// ============================================================================
// EXPORT CONVENIENCE TYPE GUARDS
// ============================================================================

/**
 * Type guard: check if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard: check if value is non-empty string
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard: check if value is positive number
 */
export function isPositiveNumber(value: any): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

// ============================================================================
// PRODUCTION BUILD NOTE
// ============================================================================
/**
 * NOTE FOR PRODUCTION BUILDS:
 * 
 * All assertions in this file become NO-OPs in production because:
 * 1. IS_DEV check at top of each function
 * 2. Tree-shaking removes dead code (if statements with false conditions)
 * 3. Minifier removes empty function bodies
 * 
 * Result: ZERO runtime impact in production.
 * 
 * To verify:
 *   npm run build
 *   Check bundle size - assertions should be removed
 */
