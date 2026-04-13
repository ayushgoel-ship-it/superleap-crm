/**
 * DCF overallStatus helpers — CANONICAL (Wave 1A)
 *
 * DATA CONTRACT
 * -------------
 *   A DCF lead is "disbursed" iff
 *     dcf_leads.funnel_loan_state IN ('DISBURSAL', 'COMPLETED')
 *   and `disbursal_datetime` is guaranteed non-null whenever the above
 *   holds. The Supabase adapter (`supabaseRaw.ts`) encodes this by writing
 *   lowercase `'disbursed'` into `overallStatus` on runtimeDB load.
 *
 * HISTORY
 * -------
 *   Before Wave 1A, ~20 call sites compared against uppercase `'DISBURSED'`
 *   and silently matched zero rows, corrupting DCF disbursal counts and
 *   GMV across Leaderboard, Simulators, TLHome, Admin pages, etc. Every
 *   comparison now goes through `isDisbursed()` which is casing-tolerant.
 *
 * ALWAYS use this helper. Never compare `overallStatus` to a string
 * literal in new code.
 */

export type DCFOverallStatus =
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'pending'
  | string; // tolerate unknown for forward-compat

export interface HasDCFStatus {
  overallStatus?: DCFOverallStatus | null;
  disbursalDate?: string | null;
}

/** Normalize to lowercase for comparison — tolerates mixed-case legacy rows. */
export function normalizeDCFStatus(raw: string | null | undefined): string {
  return (raw || '').toLowerCase();
}

/** True iff this DCF lead is in the terminal 'disbursed' state. */
export function isDisbursed(lead: HasDCFStatus): boolean {
  return normalizeDCFStatus(lead.overallStatus) === 'disbursed';
}

/** True iff rejected. */
export function isRejected(lead: HasDCFStatus): boolean {
  return normalizeDCFStatus(lead.overallStatus) === 'rejected';
}

/** Active = not terminal (not disbursed, not rejected). */
export function isActiveDCF(lead: HasDCFStatus): boolean {
  const s = normalizeDCFStatus(lead.overallStatus);
  return s !== 'disbursed' && s !== 'rejected';
}
