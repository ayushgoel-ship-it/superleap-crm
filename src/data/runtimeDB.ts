import type { Dealer, CallLog, VisitLog, Lead, DCFLead, AdminOrg, LocationChangeRequest, DealerMetricPeriod } from '@/data/types';

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
  regions: ['NCR', 'West', 'South', 'East'],
  tls: [],
} as any;

// ── Dealer metrics enrichment ──

function isInPeriod(dateStr: string | undefined | null, from: Date, to: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= from && d < to;
}

function computeDealerPeriodMetrics(leads: Lead[], dcfLeads: DCFLead[], from: Date, to: Date): DealerMetricPeriod {
  let inspections = 0;
  let sis = 0;
  let totalLeads = 0;

  for (const l of leads) {
    // Count leads created in period
    if (isInPeriod(l.createdAt, from, to)) totalLeads++;
    // Inspections: rank-1 only
    if ((l.regInspRank === 1) && l.inspectionDate && isInPeriod(l.inspectionDate, from, to)) inspections++;
    // Stock-ins: rank-1 only
    const siDate = l.finalSiDate || l.stockinDate;
    if ((l.regStockinRank === 1) && siDate && isInPeriod(siDate, from, to)) sis++;
  }

  const dcfCount = dcfLeads.filter(d => isInPeriod(d.createdAt, from, to)).length;

  return { leads: totalLeads || inspections, inspections, sis, dcf: dcfCount };
}

function enrichDealerMetrics(dealers: Dealer[], leads: Lead[], dcfLeads: DCFLead[]): Dealer[] {
  // Group leads by dealer code
  const leadsByDealer = new Map<string, Lead[]>();
  const dcfByDealer = new Map<string, DCFLead[]>();

  for (const l of leads) {
    const dc = l.dealerCode;
    if (!leadsByDealer.has(dc)) leadsByDealer.set(dc, []);
    leadsByDealer.get(dc)!.push(l);
  }
  for (const d of dcfLeads) {
    const dc = d.dealerCode;
    if (!dcfByDealer.has(dc)) dcfByDealer.set(dc, []);
    dcfByDealer.get(dc)!.push(d);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const last7dStart = new Date(todayStart); last7dStart.setDate(last7dStart.getDate() - 7);
  const last30dStart = new Date(todayStart); last30dStart.setDate(last30dStart.getDate() - 30);
  const last6mStart = new Date(todayStart); last6mStart.setMonth(last6mStart.getMonth() - 6);
  const epoch = new Date(2000, 0, 1);

  return dealers.map(dealer => {
    const dl = leadsByDealer.get(dealer.code) || [];
    const dd = dcfByDealer.get(dealer.code) || [];

    // Enrich dealer name from leads if missing
    const firstLead = dl[0];
    const dealerName = dealer.name || (firstLead ? `Dealer-${dealer.code}` : dealer.name);

    // Compute latest activity date for lastVisit/lastContact
    let latestDate = '';
    for (const l of dl) {
      const d = l.inspectionDate || l.currentApptDate || l.createdAt;
      if (d && d > latestDate) latestDate = d;
    }
    const lastVisit = latestDate || new Date().toISOString();
    const daysAgo = latestDate ? Math.max(0, Math.floor((Date.now() - new Date(latestDate).getTime()) / 86400000)) : 0;

    return {
      ...dealer,
      name: dealerName,
      lastVisit,
      lastContact: lastVisit,
      lastVisitDaysAgo: daysAgo,
      lastContactDaysAgo: daysAgo,
      metrics: {
        mtd: computeDealerPeriodMetrics(dl, dd, mtdStart, tomorrowStart),
        'd-1': computeDealerPeriodMetrics(dl, dd, yesterdayStart, todayStart),
        today: computeDealerPeriodMetrics(dl, dd, todayStart, tomorrowStart),
        'last-7d': computeDealerPeriodMetrics(dl, dd, last7dStart, tomorrowStart),
        'last-30d': computeDealerPeriodMetrics(dl, dd, last30dStart, tomorrowStart),
        'last-6m': computeDealerPeriodMetrics(dl, dd, last6mStart, tomorrowStart),
        lifetime: computeDealerPeriodMetrics(dl, dd, epoch, tomorrowStart),
      },
    };
  });
}

// Enrich leads with dealer names
function enrichLeadDealerNames(leads: Lead[], dealers: Dealer[]): Lead[] {
  const dealerMap = new Map<string, string>();
  for (const d of dealers) {
    dealerMap.set(d.code, d.name);
  }
  return leads.map(l => ({
    ...l,
    dealerName: dealerMap.get(l.dealerCode) || l.dealerName || `Dealer-${l.dealerCode}`,
  }));
}

export async function loadRuntimeDB(): Promise<RuntimeDB> {
  console.log('[RuntimeDB] loadRuntimeDB called, cache exists:', !!cache);
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

  let dealers = getValue(results[0], []);
  const calls = getValue(results[1], []);
  const visits = getValue(results[2], []);
  let leads = getValue(results[3], []);
  const dcfLeads = getValue(results[4], []);
  const locationRequests = getValue(results[5], []);
  const org = getValue(results[6], null) || DEFAULT_ORG;

  // Enrich leads with dealer names
  leads = enrichLeadDealerNames(leads, dealers);

  // Enrich dealers with metrics computed from leads (using rank-based logic)
  dealers = enrichDealerMetrics(dealers, leads, dcfLeads);

  cache = {
    dealers,
    calls,
    visits,
    leads,
    dcfLeads,
    locationRequests,
    org,
  };

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`Runtime DB: ${failures.length}/${results.length} fetches failed. App will show partial data.`);
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`  Fetch ${i} rejected:`, r.reason);
    });
  }
  console.log(`[RuntimeDB] Loaded: ${cache.dealers.length} dealers, ${cache.leads.length} leads, ${cache.dcfLeads.length} dcf, ${cache.calls.length} calls, ${cache.visits.length} visits`);

  return cache;
}

// helpers
export function clearRuntimeDBCache() {
  cache = null;
}

// Sync access (selectors need sync arrays)
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
    console.warn('Runtime DB not loaded yet — returning empty defaults.');
    return EMPTY_DB;
  }
  return cache;
}
