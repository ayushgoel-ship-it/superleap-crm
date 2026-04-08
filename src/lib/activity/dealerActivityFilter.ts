/**
 * dealerActivityFilter — canonical AND-combined filter for the Activity module.
 *
 * Four independent flags (default 'all'):
 *   • dealerFlag : 'all' | 'top'    | 'tagged'
 *   • dcfFlag    : 'all' | 'onboarded' | 'not_onboarded'
 *   • inspecting : 'all' | 'yes' | 'no'
 *   • activity   : 'all' | 'active' | 'inactive'   (≥1 call OR visit in last 30d)
 *
 * "Tagged" definition (per spec): tagged-to-KAM minus Top dealers.
 * When kamId is undefined (TL/Admin scope) "Tagged" means kamId is set on the
 * dealer (i.e. assigned to any KAM) and not Top.
 *
 * Inspecting: dealer has at least one Lead with regInspRank===1 AND
 *   inspectionDate within last 30 days, matched on BOTH dealer.id and dealer.code.
 *
 * Activity: dealer has at least one CallAttempt OR Visit in the last 30 days,
 *   matched on dealerId OR dealerCode (string-normalized).
 */

import type { Dealer, Lead } from '../../data/types';
import type { CallAttempt, Visit } from '../../contexts/ActivityContext';

export type DealerFlag = 'all' | 'top' | 'tagged';
export type DcfFlag = 'all' | 'onboarded' | 'not_onboarded';
export type InspectingFlag = 'all' | 'yes' | 'no';
export type ActivityFlag = 'all' | 'active' | 'inactive';

export interface DealerFilterState {
  dealerFlag: DealerFlag;
  dcfFlag: DcfFlag;
  inspecting: InspectingFlag;
  activity: ActivityFlag;
}

export const DEFAULT_DEALER_FILTER: DealerFilterState = {
  dealerFlag: 'all',
  dcfFlag: 'all',
  inspecting: 'all',
  activity: 'all',
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Build the set of dealer ids/codes that are currently "inspecting"
 * (regInspRank===1 AND inspectionDate within the last 30 days).
 */
export function buildInspectingDealerKeys(leads: Lead[], nowMs: number = Date.now()): Set<string> {
  const cutoff = nowMs - THIRTY_DAYS_MS;
  const keys = new Set<string>();
  for (const l of leads) {
    if (l.regInspRank !== 1) continue;
    const insp = l.inspectionDate;
    if (!insp) continue;
    const t = new Date(insp).getTime();
    if (!Number.isFinite(t) || t < cutoff) continue;
    if (l.dealerId) keys.add(String(l.dealerId));
    if (l.dealerCode) keys.add(String(l.dealerCode));
  }
  return keys;
}

/**
 * Build the set of dealer ids/codes with ≥1 call OR visit in the last 30 days.
 * Used for the Activity (30d) filter.
 */
export function buildActiveDealerKeys(
  calls: CallAttempt[],
  visits: Visit[],
  nowMs: number = Date.now(),
): Set<string> {
  const cutoff = nowMs - THIRTY_DAYS_MS;
  const keys = new Set<string>();
  for (const c of calls) {
    const t = new Date(c.timestamp || c.createdAt || 0).getTime();
    if (!Number.isFinite(t) || t < cutoff) continue;
    if (c.dealerId) keys.add(String(c.dealerId));
    if (c.dealerCode) keys.add(String(c.dealerCode));
  }
  for (const v of visits) {
    const t = new Date(v.checkInTime || v.createdAt || v.scheduledTime || 0).getTime();
    if (!Number.isFinite(t) || t < cutoff) continue;
    if (v.dealerId) keys.add(String(v.dealerId));
    if (v.dealerCode) keys.add(String(v.dealerCode));
  }
  return keys;
}

export function isDealerInspecting(dealer: Pick<Dealer, 'id' | 'code'>, keys: Set<string>): boolean {
  return keys.has(String(dealer.id)) || keys.has(String(dealer.code));
}

export function isDealerActive(dealer: Pick<Dealer, 'id' | 'code'>, keys: Set<string>): boolean {
  return keys.has(String(dealer.id)) || keys.has(String(dealer.code));
}

export interface ApplyDealerFilterInput {
  dealers: Dealer[];
  filter: DealerFilterState;
  inspectingKeys: Set<string>;
  /** Active-dealer key set (≥1 call/visit in last 30d). Required when activity !== 'all'. */
  activeKeys?: Set<string>;
  /** When defined, restricts the "tagged" semantics to this KAM. */
  kamScopeId?: string;
}

export function applyDealerFilter(input: ApplyDealerFilterInput): Dealer[] {
  const { dealers, filter, inspectingKeys, activeKeys, kamScopeId } = input;
  return dealers.filter((d) => {
    // Dealer flag
    if (filter.dealerFlag === 'top' && !d.isTopDealer) return false;
    if (filter.dealerFlag === 'tagged') {
      if (d.isTopDealer) return false;
      if (kamScopeId) {
        if (d.kamId !== kamScopeId) return false;
      } else if (!d.kamId) {
        return false;
      }
    }

    // DCF flag
    if (filter.dcfFlag === 'onboarded' && d.dcfOnboarded !== 'Y') return false;
    if (filter.dcfFlag === 'not_onboarded' && d.dcfOnboarded === 'Y') return false;

    // Inspecting flag
    if (filter.inspecting !== 'all') {
      const inspecting = isDealerInspecting(d, inspectingKeys);
      if (filter.inspecting === 'yes' && !inspecting) return false;
      if (filter.inspecting === 'no' && inspecting) return false;
    }

    // Activity (30d) flag
    if (filter.activity !== 'all') {
      const active = activeKeys ? isDealerActive(d, activeKeys) : false;
      if (filter.activity === 'active' && !active) return false;
      if (filter.activity === 'inactive' && active) return false;
    }

    return true;
  });
}
