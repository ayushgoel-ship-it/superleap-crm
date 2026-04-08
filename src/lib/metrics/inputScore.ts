/**
 * KAM Composite Input Score — single source of truth.
 *
 * Formula (locked):
 *   visits/3     ×30 (clamped 0..1)
 * + calls/5      ×30 (clamped 0..1)
 * + uniqueDealersCalled/3 ×20 (clamped 0..1)
 * + conversionRate/50     ×20 (clamped 0..1)
 *
 * Returns an integer 0–100.
 */
export interface InputScoreInputs {
  completedVisits: number;
  totalCalls: number;
  uniqueDealersCalled: number;
  /** Conversion rate expressed as a percent (0–100). */
  conversionRate: number;
}

export function computeInputScore(m: InputScoreInputs): number {
  const visit = Math.min((m.completedVisits || 0) / 3, 1) * 30;
  const call = Math.min((m.totalCalls || 0) / 5, 1) * 30;
  const dealer = Math.min((m.uniqueDealersCalled || 0) / 3, 1) * 20;
  const conv = Math.min((m.conversionRate || 0) / 50, 1) * 20;
  return Math.round(visit + call + dealer + conv);
}

/** Returns each component (unrounded) for debug / UI reasoning panels. */
export function computeInputScoreBreakdown(m: InputScoreInputs) {
  return {
    visit: Math.min((m.completedVisits || 0) / 3, 1) * 30,
    call: Math.min((m.totalCalls || 0) / 5, 1) * 30,
    dealer: Math.min((m.uniqueDealersCalled || 0) / 3, 1) * 20,
    conversion: Math.min((m.conversionRate || 0) / 50, 1) * 20,
  };
}
