import type { Dealer, CallLog, VisitLog, Lead, DCFLead, AdminOrg, LocationChangeRequest } from '@/data/types';

import {
  fetchDealersRaw,
  fetchCallsRaw,
  fetchVisitsRaw,
  fetchLeadsRaw,
  fetchDcfLeadsRaw,
  fetchLocationRequestsRaw,
  fetchOrgRaw,
} from '@/data/supabaseRaw';

type RuntimeDB = {
  dealers: Dealer[];
  calls: CallLog[];
  visits: VisitLog[];
  leads: Lead[];
  dcfLeads: DCFLead[];
  locationRequests: LocationChangeRequest[];
  org: AdminOrg;
};

let cache: RuntimeDB | null = null;

// Default org structure when no org data is available yet
const DEFAULT_ORG: AdminOrg = {
  id: 'org-default',
  name: 'Superleap CRM',
  teams: [],
  users: [],
} as any;

export async function loadRuntimeDB(): Promise<RuntimeDB> {
  if (cache) return cache;

  // Use allSettled so one failing fetch doesn't crash everything
  const results = await Promise.allSettled([
    fetchDealersRaw(),
    fetchCallsRaw(),
    fetchVisitsRaw(),
    fetchLeadsRaw(),
    fetchDcfLeadsRaw(),
    fetchLocationRequestsRaw(),
    fetchOrgRaw(),
  ]);

  const getValue = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
    r.status === 'fulfilled' ? r.value : fallback;

  cache = {
    dealers: getValue(results[0], []),
    calls: getValue(results[1], []),
    visits: getValue(results[2], []),
    leads: getValue(results[3], []),
    dcfLeads: getValue(results[4], []),
    locationRequests: getValue(results[5], []),
    org: getValue(results[6], null) || DEFAULT_ORG,
  };

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`Runtime DB: ${failures.length}/${results.length} fetches failed. App will show partial data.`);
  }

  return cache;
}

// helpers
export function clearRuntimeDBCache() {
  cache = null;
}
// Sync access (selectors need sync arrays)
// Boot in src/main.tsx MUST call loadRuntimeDB() before App renders.
// If the DB hasn't loaded yet (or failed), return safe empty defaults instead of throwing.
const EMPTY_DB: RuntimeDB = {
  dealers: [],
  calls: [],
  visits: [],
  leads: [],
  dcfLeads: [],
  locationRequests: [],
  org: DEFAULT_ORG,
};

export function getRuntimeDBSync(): RuntimeDB {
  if (!cache) {
    console.warn('Runtime DB not loaded yet — returning empty defaults. Data will appear after successful Supabase connection.');
    return EMPTY_DB;
  }
  return cache;
}