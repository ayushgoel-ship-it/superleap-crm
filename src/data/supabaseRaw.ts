import { supabase } from '@/lib/supabase/client';
import type { Dealer, CallLog, VisitLog, Lead, DCFLead, AdminOrg, LocationChangeRequest, DealerMetricPeriod } from './types';

/**
 * DATA ADAPTER — Maps canonical Supabase tables to frontend types.
 *
 * Canonical tables:
 *   sell_leads_master   — 85 cols, all sell leads (from company backend)
 *   dcf_leads_master    — 90 cols, all DCF leads
 *   dealers_master      — derived from unique dealer_codes
 *
 * Legacy tables still used:
 *   call_events, visits  — activity data (not in canonical source)
 *   org_raw              — org hierarchy
 *   location_requests    — location changes
 */

// ── Region mapping ──
const REGION_MAP: Record<string, string> = {
  NDL: 'NCR', NRJ: 'NCR', NHP: 'NCR', NHR: 'NCR', UPW: 'NCR', UPE: 'NCR',
  MUM: 'West', PUN: 'West', GJN: 'West', GJS: 'West', AMD: 'West', WMH: 'West', WMP: 'West', EWB: 'West',
  BLR: 'South', STS: 'South',
  EBR: 'East', EOR: 'East',
};

function toRegionKey(raw: string | null): 'NCR' | 'West' | 'South' | 'East' {
  if (!raw) return 'NCR';
  return (REGION_MAP[raw] || 'NCR') as any;
}

// ── Paginated fetch ──
async function fetchAll<T = any>(table: string, select: string, pageSize = 1000): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (error) {
      console.error(`Supabase: Failed to fetch ${table} (offset ${from}).`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// ── Stage derivation from dates ──
function deriveStage(row: any): string {
  if (row.stockin_date || row.final_si_date) return 'Stock-in';
  if (row.token_date || row.final_token_date) return 'PR Punched';
  if (row.inspection_date) return 'Inspection Done';
  if (row.current_appt_date) return 'Inspection Scheduled';
  if (row.deal_creation_date) return 'Deal Created';
  return 'Lead Created';
}

function deriveStatus(row: any): string {
  if (row.stockin_date || row.final_si_date) return 'Won';
  if (row.appointment_status === 'CANCELLED') return 'Lost';
  return 'Active';
}

// ════════════════════════════════════════════════════════════════════
// DEALERS — from dealers_master
// ════════════════════════════════════════════════════════════════════

export async function fetchDealersRaw(): Promise<Dealer[]> {
  const data = await fetchAll('dealers_master', '*');
  if (data.length === 0) return [];

  const emptyMetric: DealerMetricPeriod = { leads: 0, inspections: 0, sis: 0, dcf: 0 };
  const emptyMetrics = () => ({
    mtd: { ...emptyMetric }, 'd-1': { ...emptyMetric }, today: { ...emptyMetric },
    'last-7d': { ...emptyMetric }, 'last-30d': { ...emptyMetric },
    'last-6m': { ...emptyMetric }, lifetime: { ...emptyMetric },
  });

  return data.map((d: any) => ({
    id: String(d.dealer_code),
    name: d.dealer_name || `Dealer-${d.dealer_code}`,
    code: String(d.dealer_code),
    city: d.dealer_city || 'Unknown',
    region: toRegionKey(d.dealer_region),
    kamId: 'unassigned',
    kamName: 'Unassigned KAM',
    tlId: 'tl-default',
    lastVisit: new Date().toISOString(),
    lastContact: new Date().toISOString(),
    lastVisitDaysAgo: 0,
    lastContactDaysAgo: 0,
    phone: d.phone || '',
    email: d.email || '',
    latitude: d.latitude || 28.5 + Math.random() * 0.3,
    longitude: d.longitude || 77.0 + Math.random() * 0.5,
    metrics: emptyMetrics(),
    tags: [],
    segment: (d.segment || 'B') as const,
    status: (d.status || 'active') as const,
  }));
}

// ════════════════════════════════════════════════════════════════════
// LEADS — from sell_leads_master (canonical 85-col table)
// ════════════════════════════════════════════════════════════════════

export async function fetchLeadsRaw(): Promise<Lead[]> {
  const data = await fetchAll('sell_leads_master', '*');
  if (data.length === 0) return [];

  return data.map((l: any) => {
    const stage = deriveStage(l);
    const status = deriveStatus(l);
    const channel = l.gs_flag === 1 ? 'GS' : 'NGS';
    const leadDate = l.lead_date || l.deal_creation_date || new Date().toISOString();

    return {
      id: String(l.lead_id),
      dealerId: String(l.dealer_code || ''),
      dealerName: '', // Will be enriched in runtimeDB
      dealerCode: String(l.dealer_code || ''),
      kamId: 'unassigned',
      kamName: 'Unassigned',
      kamPhone: '',
      tlId: 'tl-default',

      customerName: 'Customer',
      customerPhone: '',

      regNo: l.cx_reg_no || '',
      make: l.make || '',
      model: l.model || '',
      year: l.year || 0,
      variant: l.variant || '',

      channel: channel as 'NGS' | 'GS' | 'DCF',
      leadType: (l.dl_type === 'seller' ? 'Seller' : 'Inventory') as 'Seller' | 'Inventory',
      stage,
      currentStage: stage,
      status,
      appointmentStatus: l.appointment_status || '',

      expectedRevenue: Number(l.target_price) || 0,
      actualRevenue: Number(l.selleragreedprice) || 0,
      cep: null,
      c24Quote: Number(l.latest_c24q) || null,
      maxC24Quote: Number(l.max_c24_quote) || null,
      targetPrice: Number(l.target_price) || null,
      sellerAgreedPrice: Number(l.selleragreedprice) || null,
      bidAmount: Number(l.bid_amount) || null,

      // Rank columns — critical for metric dedup
      regApptRank: l.reg_appt_rank ?? null,
      regInspRank: l.reg_insp_rank ?? null,
      regTokenRank: l.reg_token_rank ?? null,
      regStockinRank: l.reg_stockin_rank ?? null,

      // Dates
      createdAt: leadDate,
      updatedAt: leadDate,
      leadDate,
      dealCreationDate: l.deal_creation_date || null,
      originalApptDate: l.original_appt_date || null,
      currentApptDate: l.current_appt_date || null,
      inspectionDate: l.inspection_date || undefined,
      tokenDate: l.token_date || undefined,
      stockinDate: l.stockin_date || undefined,
      stockOutDate: l.stock_out_date || undefined,
      finalTokenDate: l.final_token_date || undefined,
      finalSiDate: l.final_si_date || undefined,
      latestOcbRaisedAt: l.latest_ocb_raisedat ? String(l.latest_ocb_raisedat) : undefined,

      // Flags
      gsFlag: l.gs_flag,
      franchiseFlag: l.franchise_flag,
      ocbRunCount: l.ocb_run_count,
      verified: l.verified,

      // Metadata
      city: l.inspection_city || 'Unknown',
      region: toRegionKey(l.dealer_region),
      inspectionCity: l.inspection_city || undefined,
      inspectionRegion: l.inspection_region || undefined,
      dealerRegion: l.dealer_region || undefined,
      growthZone: l.growth_zone || undefined,
    };
  });
}

// ════════════════════════════════════════════════════════════════════
// CALLS — from call_events (unchanged legacy table)
// ════════════════════════════════════════════════════════════════════

export async function fetchCallsRaw(): Promise<CallLog[]> {
  const data = await fetchAll('call_events', '*');
  if (data.length === 0) return [];

  return data.map((c: any) => ({
    id: c.call_id,
    dealerId: c.dealer_id || 'unknown',
    dealerName: '', // Enriched from dealers_master via runtimeDB
    dealerCode: String(c.dealer_id || 'DLR-UN'),
    callDate: c.start_time,
    callTime: new Date(c.start_time).toLocaleTimeString(),
    duration: c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : '0s',
    durationSec: c.duration || 0,
    kamId: c.kam_id || 'unassigned',
    kamName: 'KAM', // Enriched from users via runtimeDB
    tlId: 'tl-default',
    outcome: c.outcome || 'Connected',
    isProductive: c.is_productive ?? ['converted', 'interested'].includes(c.outcome),
    productivitySource: 'AI',
    phone: c.customer_phone || '',
    callStatus: c.outcome === 'not_interested' ? 'NOT_CONNECTED' : 'CONNECTED',
    recordingStatus: 'AVAILABLE',
    feedbackStatus: c.notes ? 'SUBMITTED' : 'PENDING',
  }));
}

// ════════════════════════════════════════════════════════════════════
// VISITS — from visits (unchanged legacy table)
// ════════════════════════════════════════════════════════════════════

export async function fetchVisitsRaw(): Promise<VisitLog[]> {
  const data = await fetchAll('visits', '*');
  if (data.length === 0) return [];

  return data.map((v: any) => ({
    id: v.visit_id,
    dealerId: v.dealer_id,
    dealerName: '', // Enriched from dealers_master via runtimeDB
    dealerCode: String(v.dealer_id || 'DLR-UN'),
    visitDate: v.scheduled_at,
    visitTime: new Date(v.scheduled_at).toLocaleTimeString(),
    duration: v.duration_minutes ? `${v.duration_minutes}m` : '30m',
    kamId: v.kam_id || 'unassigned',
    kamName: 'KAM', // Enriched from users via runtimeDB
    tlId: 'tl-default',
    checkInLocation: { latitude: Number(v.geo_lat) || 28.5, longitude: Number(v.geo_lng) || 77.2 },
    isProductive: v.is_productive ?? v.status === 'completed',
    productivitySource: 'Geofence',
    visitType: v.visit_type || 'Planned',
    status: v.status === 'completed' ? 'COMPLETED' : v.status === 'cancelled' ? 'CANCELLED' : 'NOT_STARTED',
    checkInAt: v.check_in_at || undefined,
    completedAt: v.check_out_at || undefined,
  }));
}

// ════════════════════════════════════════════════════════════════════
// DCF — from dcf_leads_master (canonical 90-col table)
// ════════════════════════════════════════════════════════════════════

export async function fetchDcfLeadsRaw(): Promise<DCFLead[]> {
  const data = await fetchAll('dcf_leads_master', '*');
  if (data.length === 0) return [];

  return data.map((dcf: any) => {
    const valuation = Number(dcf.valuation_price) || 500000;
    const loanAmt = Number(dcf.gross_disbursal) || Number(dcf.total_loan_sanction) || Math.round(valuation * 0.7);
    const tenure = Number(dcf.loan_tenure) || Number(dcf.ds_tenure) || 48;
    const roi = Number(dcf.roi_per_annum) || Number(dcf.ds_roi) || 12;

    // Parse funnel state "STAGE | SUB_STAGE"
    const funnelRaw = dcf.funnel_loan_state || '';
    const funnelParts = funnelRaw.split('|').map((s: string) => s.trim());
    const funnelStage = funnelParts[0] || 'SOURCING';
    const funnelSubStage = funnelParts[1] || funnelParts[0] || 'LEAD_CREATION';

    // Derive overall status from funnel
    let overallStatus = funnelStage.toLowerCase();
    if (dcf.disbursal_datetime) overallStatus = 'disbursed';
    else if (dcf.approval_date) overallStatus = 'approved';
    else if (dcf.login_date) overallStatus = 'in_progress';

    // RAG from red_flag
    const ragStatus = dcf.red_flag === 1 ? 'red' : (dcf.risk_bucket === 'B' || dcf.risk_bucket === 'C') ? 'amber' : 'green';

    return {
      id: dcf.lead_id || `dcf-${dcf.id}`,
      customerName: dcf.customer_name || 'Customer',
      customerPhone: '',
      city: dcf.dealer_city || 'Unknown',
      regNo: dcf.registration_no || '',
      car: [dcf.make, dcf.model, dcf.year].filter(Boolean).join(' ') || 'Unknown Vehicle',
      carValue: valuation,
      ltv: Number(dcf.final_offer_ltv) || Number(dcf.system_ltv) || Math.round((loanAmt / valuation) * 100),
      loanAmount: loanAmt,
      roi,
      tenure,
      emi: loanAmt > 0 && tenure > 0 ? Math.round(loanAmt / tenure) : 0,
      dealerId: String(dcf.dealer_code || 'unknown'),
      dealerName: dcf.dealer_name || 'Unknown',
      dealerCode: String(dcf.dealer_code || 'DLR'),
      dealerCity: dcf.dealer_city || 'Unknown',
      channel: 'DCF',
      ragStatus: ragStatus as 'green' | 'amber' | 'red',
      bookFlag: dcf.ds_channel || 'Partner Book',
      carDocsFlag: dcf.banking_flag === 'COMPLETED' ? 'Received' : 'Pending',
      conversionOwner: dcf.rm_mapping || 'KAM',
      conversionEmail: '',
      conversionPhone: '',
      kamId: 'unassigned',
      kamName: dcf.tl_mapping || 'KAM',
      tlId: 'tl-default',
      firstDisbursalForDealer: false,
      commissionEligible: !!dcf.disbursal_datetime,
      baseCommission: 5000,
      boosterApplied: false,
      totalCommission: dcf.disbursal_datetime ? 5000 : 0,
      currentFunnel: funnelStage,
      currentSubStage: funnelSubStage,
      overallStatus,
      createdAt: dcf.lead_creation_date || new Date().toISOString(),
      lastUpdatedAt: dcf.disbursal_datetime || dcf.approval_date || dcf.login_date || dcf.lead_creation_date || new Date().toISOString(),
      disbursalDate: dcf.disbursal_datetime || undefined,
      cibilScore: Number(dcf.cibil_score) || undefined,
      employmentType: dcf.employment_details || undefined,
    };
  });
}

// ════════════════════════════════════════════════════════════════════
// LOCATION REQUESTS — unchanged
// ════════════════════════════════════════════════════════════════════

export async function fetchLocationRequestsRaw(): Promise<LocationChangeRequest[]> {
  const { data, error } = await supabase.from('location_requests').select('*');
  if (error) {
    console.error('Supabase: Failed to fetch location requests.', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  return data.map((lr: any) => ({
    id: lr.request_id,
    dealerId: lr.dealer_id,
    requestedBy: lr.requested_by,
    oldLat: lr.old_lat,
    oldLng: lr.old_lng,
    newLat: lr.new_lat,
    newLng: lr.new_lng,
    reason: lr.reason,
    status: lr.status,
    decidedAt: lr.decided_at,
    decidedBy: lr.decided_by,
    rejectionReason: lr.rejection_reason,
    createdAt: lr.created_at,
    updatedAt: lr.updated_at,
  }));
}

// ════════════════════════════════════════════════════════════════════
// ORG — unchanged
// ════════════════════════════════════════════════════════════════════

export async function fetchOrgRaw(): Promise<AdminOrg | null> {
  // Build org from users + teams tables
  const [usersData, teamsData] = await Promise.all([
    fetchAll('users', '*'),
    fetchAll('teams', '*'),
  ]);

  if (usersData.length === 0 && teamsData.length === 0) return null;

  // Build TL → KAMs hierarchy from users
  const tls: any[] = [];
  const tlMap = new Map<string, any>();

  for (const u of usersData) {
    if (u.role === 'tl') {
      const tl = {
        id: u.user_id,
        name: u.name || 'TL',
        region: toRegionKey(u.region) as any,
        phone: u.phone || '',
        email: u.email || '',
        kams: [] as any[],
      };
      tlMap.set(u.user_id, tl);
      tls.push(tl);
    }
  }

  for (const u of usersData) {
    if (u.role === 'kam') {
      const kam = {
        id: u.user_id,
        name: u.name || 'KAM',
        region: toRegionKey(u.region) as any,
        city: u.city || '',
        phone: u.phone || '',
        email: u.email || '',
        tlId: u.team_id || 'tl-default',
      };
      const tl = tlMap.get(u.team_id);
      if (tl) tl.kams.push(kam);
    }
  }

  return {
    regions: ['NCR', 'West', 'South', 'East'] as any,
    tls,
  };
}
