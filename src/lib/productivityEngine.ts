/**
 * PRODUCTIVITY ENGINE
 * 
 * Single source of truth for Call & Visit productivity evaluation.
 * All productivity logic MUST go through this engine.
 * 
 * CANONICAL RULES:
 * - PRODUCTIVE: ANY metric increased within 7 days
 * - NON_PRODUCTIVE: 7+ days passed AND all deltas = 0
 * - PENDING: Within 7 days AND all deltas = 0
 */

// ============================================================================
// TYPES
// ============================================================================

export type InteractionType = 'CALL' | 'VISIT';

export type ProductivityStatus = 'PRODUCTIVE' | 'NON_PRODUCTIVE' | 'PENDING';

/**
 * Snapshot of dealer metrics at a point in time
 */
export interface DealerMetricsSnapshot {
  leads: number;
  inspections: number;
  stockIns: number;
  dcfLeads: number;
  dcfOnboarded: number;
  dcfDisbursed: number;
}

/**
 * Delta between two snapshots
 */
export interface MetricDeltas {
  leads: number;
  inspections: number;
  stockIns: number;
  dcfLeads: number;
  dcfOnboarded: number;
  dcfDisbursed: number;
}

/**
 * Input for productivity evaluation
 */
export interface ProductivityEvaluationInput {
  interactionType: InteractionType;
  interactionAt: Date;
  beforeSnapshot: DealerMetricsSnapshot;
  afterSnapshot: DealerMetricsSnapshot;
  now: Date;
}

/**
 * Result of productivity evaluation
 */
export interface ProductivityEvaluationResult {
  status: ProductivityStatus;
  daysSinceInteraction: number;
  deltas: MetricDeltas;
  explanationLines: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Productivity evaluation window (7 days)
 */
export const PRODUCTIVITY_WINDOW_DAYS = 7;

/**
 * Metric display names for explanations
 */
const METRIC_LABELS: Record<keyof MetricDeltas, string> = {
  leads: 'Lead',
  inspections: 'Inspection',
  stockIns: 'Stock-in',
  dcfLeads: 'DCF Lead',
  dcfOnboarded: 'DCF Onboarding',
  dcfDisbursed: 'DCF Disbursement',
};

/**
 * Metric display names (plural)
 */
const METRIC_LABELS_PLURAL: Record<keyof MetricDeltas, string> = {
  leads: 'Leads',
  inspections: 'Inspections',
  stockIns: 'Stock-ins',
  dcfLeads: 'DCF Leads',
  dcfOnboarded: 'DCF Onboardings',
  dcfDisbursed: 'DCF Disbursements',
};

// ============================================================================
// CORE ENGINE
// ============================================================================

/**
 * Calculate deltas between two snapshots
 */
function calculateDeltas(
  before: DealerMetricsSnapshot,
  after: DealerMetricsSnapshot
): MetricDeltas {
  return {
    leads: after.leads - before.leads,
    inspections: after.inspections - before.inspections,
    stockIns: after.stockIns - before.stockIns,
    dcfLeads: after.dcfLeads - before.dcfLeads,
    dcfOnboarded: after.dcfOnboarded - before.dcfOnboarded,
    dcfDisbursed: after.dcfDisbursed - before.dcfDisbursed,
  };
}

/**
 * Calculate days between two dates
 */
function calculateDaysSince(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = to.getTime() - from.getTime();
  return Math.floor(diff / msPerDay);
}

/**
 * Check if any metric increased
 */
function hasAnyIncrease(deltas: MetricDeltas): boolean {
  return Object.values(deltas).some((delta) => delta > 0);
}

/**
 * Generate quantitative explanation lines
 */
function generateExplanations(
  deltas: MetricDeltas,
  daysSince: number,
  status: ProductivityStatus,
  interactionType: InteractionType
): string[] {
  const lines: string[] = [];
  
  // Add days since interaction
  const interactionLabel = interactionType.toLowerCase();
  lines.push(`Last activity: ${daysSince} ${daysSince === 1 ? 'day' : 'days'} ago`);
  
  if (status === 'PRODUCTIVE') {
    // Show what changed (only positive deltas)
    lines.push(`Changes since ${interactionLabel}:`);
    
    const positiveChanges: string[] = [];
    (Object.keys(deltas) as Array<keyof MetricDeltas>).forEach((key) => {
      const delta = deltas[key];
      if (delta > 0) {
        const label = delta === 1 ? METRIC_LABELS[key] : METRIC_LABELS_PLURAL[key];
        positiveChanges.push(`+${delta} ${label}`);
      }
    });
    
    lines.push(...positiveChanges);
    
  } else if (status === 'NON_PRODUCTIVE') {
    // Show no activity for X days
    lines.push(`No qualifying activity within ${PRODUCTIVITY_WINDOW_DAYS} days`);
    lines.push('Change since ' + interactionLabel + ':');
    lines.push('Leads: +0');
    lines.push('Inspections: +0');
    lines.push('Stock-ins: +0');
    lines.push('DCF: +0');
    
  } else if (status === 'PENDING') {
    // Show waiting status
    const daysRemaining = PRODUCTIVITY_WINDOW_DAYS - daysSince;
    lines.push(`Evaluation window: ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`);
    lines.push('Current change since ' + interactionLabel + ':');
    lines.push('Leads: +0');
    lines.push('Inspections: +0');
    lines.push('Stock-ins: +0');
    lines.push('DCF: +0');
  }
  
  return lines;
}

/**
 * MAIN PRODUCTIVITY EVALUATION FUNCTION
 * 
 * This is the ONLY function that determines productivity status.
 * All UI components MUST use this function.
 * 
 * @param input - Evaluation input with snapshots and dates
 * @returns Productivity result with status, deltas, and explanations
 */
export function evaluateProductivity(
  input: ProductivityEvaluationInput
): ProductivityEvaluationResult {
  const { interactionAt, beforeSnapshot, afterSnapshot, now, interactionType } = input;
  
  // Calculate days since interaction
  const daysSince = calculateDaysSince(interactionAt, now);
  
  // Calculate deltas
  const deltas = calculateDeltas(beforeSnapshot, afterSnapshot);
  
  // Determine status based on canonical rules
  let status: ProductivityStatus;
  
  if (hasAnyIncrease(deltas)) {
    // Rule 1: ANY metric increased = PRODUCTIVE
    status = 'PRODUCTIVE';
  } else if (daysSince >= PRODUCTIVITY_WINDOW_DAYS) {
    // Rule 2: 7+ days passed, no deltas = NON_PRODUCTIVE
    status = 'NON_PRODUCTIVE';
  } else {
    // Rule 3: Within 7 days, no deltas = PENDING
    status = 'PENDING';
  }
  
  // Generate quantitative explanations
  const explanationLines = generateExplanations(deltas, daysSince, status, interactionType);
  
  return {
    status,
    daysSinceInteraction: daysSince,
    deltas,
    explanationLines,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all productive interactions from a list
 */
export function getProductiveInteractions<T extends { evaluationResult?: ProductivityEvaluationResult }>(
  interactions: T[]
): T[] {
  return interactions.filter(
    (interaction) => interaction.evaluationResult?.status === 'PRODUCTIVE'
  );
}

/**
 * Get all non-productive interactions from a list
 */
export function getNonProductiveInteractions<T extends { evaluationResult?: ProductivityEvaluationResult }>(
  interactions: T[]
): T[] {
  return interactions.filter(
    (interaction) => interaction.evaluationResult?.status === 'NON_PRODUCTIVE'
  );
}

/**
 * Get all pending interactions from a list
 */
export function getPendingInteractions<T extends { evaluationResult?: ProductivityEvaluationResult }>(
  interactions: T[]
): T[] {
  return interactions.filter(
    (interaction) => interaction.evaluationResult?.status === 'PENDING'
  );
}

/**
 * Count interactions by status
 */
export function countInteractionsByStatus(
  interactions: Array<{ evaluationResult?: ProductivityEvaluationResult }>
): {
  productive: number;
  nonProductive: number;
  pending: number;
  total: number;
} {
  const productive = getProductiveInteractions(interactions).length;
  const nonProductive = getNonProductiveInteractions(interactions).length;
  const pending = getPendingInteractions(interactions).length;
  
  return {
    productive,
    nonProductive,
    pending,
    total: interactions.length,
  };
}

/**
 * Format delta for display
 */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

/**
 * Get status badge color
 */
export function getStatusBadgeColor(status: ProductivityStatus): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case 'PRODUCTIVE':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Productive',
      };
    case 'NON_PRODUCTIVE':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: 'Non-productive',
      };
    case 'PENDING':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        label: 'Pending',
      };
  }
}

/**
 * Check if interaction is within evaluation window
 */
export function isWithinEvaluationWindow(interactionAt: Date, now: Date): boolean {
  const daysSince = calculateDaysSince(interactionAt, now);
  return daysSince < PRODUCTIVITY_WINDOW_DAYS;
}

/**
 * Get remaining days in evaluation window
 */
export function getRemainingDaysInWindow(interactionAt: Date, now: Date): number {
  const daysSince = calculateDaysSince(interactionAt, now);
  const remaining = PRODUCTIVITY_WINDOW_DAYS - daysSince;
  return Math.max(0, remaining);
}
