/**
 * ACTIVITY METRICS — canonical, pure-function selectors for Calls + Visits.
 *
 * Single source of truth for the Activity module's 6-metric summary.
 * Consumed by KAM/TL/Admin activity views to guarantee identical math.
 *
 * Inputs are already-time-filtered arrays of CallAttempt + Visit. Selectors
 * never reach into context or fetch data themselves so they remain trivially
 * testable and reusable across roles.
 */

import type { CallAttempt, Visit } from '../../contexts/ActivityContext';

export interface ActivityMetricsInput {
  calls: CallAttempt[];
  visits: Visit[];
  /** Number of dealers in the visible scope (KAM-tagged set or all dealers for TL/Admin). */
  scopeDealerCount: number;
  /** Number of working days in the selected time range; min 1. */
  numberOfDays: number;
}

export interface ActivityMetrics {
  /** % of scope dealers that received at least one call in the period. */
  partnerCoverageCallPct: number;
  /** % of scope dealers that received at least one visit in the period. */
  partnerCoverageVisitPct: number;
  /** % of all interactions (calls + visits) marked productive. */
  productivePct: number;
  /** Average calls per day across the period. */
  avgCallsPerDay: number;
  /** Average visits per day across the period. */
  avgVisitsPerDay: number;
  /** Total interactions (calls + visits) in the period. */
  totalInteractions: number;
  /** Pending-feedback count (calls only — visits never sit pending). */
  pendingFeedback: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const cap100 = (n: number) => Math.min(100, n);
const pct = (num: number, den: number) => (den > 0 ? cap100(round1((num / den) * 100)) : 0);

/** Normalize a string key for dedupe (trim + lowercase). */
const norm = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  return s || null;
};

/**
 * Build a unique-dealer key for an interaction. Uses dealerId when present,
 * else dealerCode, so multiple calls/visits to the same dealer collapse to one.
 */
const dealerKey = (i: { dealerId?: string; dealerCode?: string }): string | null =>
  norm(i.dealerId) || norm(i.dealerCode);

/**
 * Pending-feedback predicate (calls only).
 *
 * CONTRACT: a freshly-dialed call (created via ActivityContext.addCall →
 * visitApi.registerCall, then mapped back from listCalls()) MUST satisfy this
 * predicate so the All-Activity "Pending" metric increments by 1 immediately.
 *
 * The CallAttempt shape (mapped from call_events) does not expose feedback_data
 * directly. Instead, mapCallRecordToCallAttempt sets:
 *   - productiveStatus = 'pending'        (when no notes/feedback present)
 *   - status           = 'pending-feedback'
 *   - outcome          = undefined
 *
 * So we count a call as pending if ANY of these three hold true. Once
 * submitCallFeedback writes notes/feedback_data, the next refresh will flip
 * productiveStatus → 'productive'/'non_productive', status → 'completed', and
 * outcome → set, dropping it from the pending count.
 *
 * Visits are excluded entirely (per the new "in-progress / completed-with-feedback"
 * lifecycle — no pending-feedback state for visits).
 */
function isCallPending(c: CallAttempt): boolean {
  return c.productiveStatus === 'pending' || c.status === 'pending-feedback' || !c.outcome;
}

export function computeActivityMetrics(input: ActivityMetricsInput): ActivityMetrics {
  const { calls, visits, scopeDealerCount, numberOfDays } = input;
  const days = Math.max(1, numberOfDays);

  // Unique-dealer dedupe by id||code (string-normalized).
  const callDealerKeys = new Set<string>();
  for (const c of calls) {
    const k = dealerKey(c);
    if (k) callDealerKeys.add(k);
  }
  const visitDealerKeys = new Set<string>();
  for (const v of visits) {
    const k = dealerKey(v);
    if (k) visitDealerKeys.add(k);
  }

  const productiveCalls = calls.filter((c) => c.productiveStatus === 'productive').length;
  const productiveVisits = visits.filter(
    (v) => v.status === 'completed' && (v.feedbackSubmitted === true || !!v.outcome),
  ).length;

  const totalInteractions = calls.length + visits.length;
  const productiveTotal = productiveCalls + productiveVisits;

  const pendingCalls = calls.filter(isCallPending).length;

  return {
    // Coverage = unique-dealer / total tagged dealers, capped at 100.
    partnerCoverageCallPct: pct(callDealerKeys.size, scopeDealerCount),
    partnerCoverageVisitPct: pct(visitDealerKeys.size, scopeDealerCount),
    productivePct: pct(productiveTotal, totalInteractions),
    avgCallsPerDay: round1(calls.length / days),
    avgVisitsPerDay: round1(visits.length / days),
    totalInteractions,
    pendingFeedback: pendingCalls,
  };
}

/** Filter a calls array to a [fromMs, toMs) window using `timestamp`. */
export function filterCallsByRange(calls: CallAttempt[], fromMs: number, toMs: number): CallAttempt[] {
  return calls.filter((c) => {
    const t = new Date(c.timestamp).getTime();
    return t >= fromMs && t < toMs;
  });
}

/** Filter a visits array to a [fromMs, toMs) window using checkInTime || createdAt || scheduledTime. */
export function filterVisitsByRange(visits: Visit[], fromMs: number, toMs: number): Visit[] {
  return visits.filter((v) => {
    const t = v.checkInTime || v.createdAt || v.scheduledTime;
    if (!t) return false;
    const ms = new Date(t).getTime();
    return ms >= fromMs && ms < toMs;
  });
}

/** Number of whole days in [from, to); always ≥1. */
export function daysInRange(fromMs: number, toMs: number): number {
  return Math.max(1, Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000)));
}
