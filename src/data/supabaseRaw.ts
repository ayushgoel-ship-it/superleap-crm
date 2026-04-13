import { supabase } from '@/lib/supabase/client';
import type { Dealer, CallLog, VisitLog, Lead, DCFLead, AdminOrg, LocationChangeRequest, DealerMetricPeriod, UntaggedDealer } from './types';

/**
 * DATA ADAPTER — Maps canonical Supabase tables to frontend types.
 *
 * Canonical tables (source of truth):
 *   dealers_master      — canonical dealer identity + KAM/TL mapping + onboarding
 *   sell_leads_master    — 85 cols, all sell leads
 *   dcf_leads_master     — 90 cols, all DCF leads
 *
 * Operational tables:
 *   call_events          — call activity logs
 *   visits               — visit activity logs (tagged + untagged dealers)
 *   untagged_dealers     — visit-only untagged dealer registry
 *   users                — KAM/TL/Admin identity
 *   teams                — team structure
 *   location_requests    — dealer location changes
 *
 * ALL dealer ownership flows from dealers_master.kam_id / tl_id.
 * KAM/TL on leads and DCF are derived from dealer ownership, not stored separately.
 */

// ── Region mapping (source region codes → frontend RegionKey) ──
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

// ── Paginated fetch helper ──
async function fetchAll<T = any>(table: string, select: string, pageSize = 1000): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (error) {
      console.error(`[SupabaseRaw] Failed to fetch ${table} (offset ${from}):`, error.message);
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
// Canonical BBNP = final_token_date != null AND final_si_date == null
// (Stock-in branch above guarantees final_si_date is null when we reach the BBNP check.)
function deriveStage(row: any): string {
  if (row.stockin_date || row.final_si_date) return 'Stock-in';
  if (row.final_token_date || row.token_date) return 'BBNP';
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
// USER MAP — built once, shared across adapters for KAM/TL name resolution
// ════════════════════════════════════════════════════════════════════

let _userMap: Map<string, { name: string; teamId: string; role: string }> | null = null;
let _teamTlMap: Map<string, string> | null = null; // teamId → tl_user_id
let _userMapInflight: Promise<void> | null = null;

async function ensureUserMap() {
  if (_userMap) return;
  if (_userMapInflight) return _userMapInflight;
  _userMapInflight = (async () => {
    const [users, teams] = await Promise.all([
      fetchAll('users', 'user_id,name,team_id,role'),
      fetchAll('teams', 'team_id,tl_user_id'),
    ]);
    _userMap = new Map();
    _teamTlMap = new Map();
    for (const u of users) {
      _userMap.set(u.user_id, { name: u.name || '', teamId: u.team_id || '', role: u.role || '' });
    }
    for (const t of teams) {
      _teamTlMap.set(t.team_id, t.tl_user_id || '');
    }
  })();
  try { await _userMapInflight; } finally { _userMapInflight = null; }
}

function getUserName(userId: string | null): string {
  if (!userId || !_userMap) return '';
  return _userMap.get(userId)?.name || '';
}

function getUserTeamId(userId: string | null): string {
  if (!userId || !_userMap) return '';
  return _userMap.get(userId)?.teamId || '';
}

// ════════════════════════════════════════════════════════════════════
// DEALERS — from dealers_master (canonical dealer identity + mapping)
// ════════════════════════════════════════════════════════════════════

export async function fetchDealersRaw(): Promise<Dealer[]> {
  await ensureUserMap();
  const data = await fetchAll('dealers_master', 'dealer_code,dealer_name,dealer_city,dealer_region,kam_id,tl_id,phone,email,latitude,longitude,segment,status,sell_onboarded,dcf_onboarded,sell_onboarding_date,dcf_onboarding_date,onboarding_status,bank_account_status,is_top,gst_number,pan_number,bank_account,pincode');
  if (data.length === 0) return [];

  const emptyMetric: DealerMetricPeriod = { leads: 0, inspections: 0, sis: 0, dcf: 0 };
  const emptyMetrics = () => ({
    mtd: { ...emptyMetric }, 'd-1': { ...emptyMetric }, today: { ...emptyMetric },
    'last-7d': { ...emptyMetric }, 'last-30d': { ...emptyMetric },
    'last-6m': { ...emptyMetric }, lifetime: { ...emptyMetric },
  });

  return data.map((d: any) => {
    const kamId = d.kam_id || '';
    const tlId = d.tl_id || '';
    const kamName = getUserName(kamId) || 'Unassigned KAM';
    const tlName = getUserName(tlId) || '';

    // Derive tags from onboarding flags
    const tags: string[] = [];
    if (d.dcf_onboarded === 'Y') tags.push('DCF Onboarded');
    if (d.sell_onboarded === 'Y' && d.dcf_onboarded !== 'Y') tags.push('Sell Only');

    return {
      id: String(d.dealer_code),
      name: d.dealer_name || `Dealer-${d.dealer_code}`,
      code: String(d.dealer_code),
      city: d.dealer_city || 'Unknown',
      region: toRegionKey(d.dealer_region),
      kamId,
      kamName,
      tlId,
      tlName,
      lastVisit: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      lastVisitDaysAgo: 0,
      lastContactDaysAgo: 0,
      phone: d.phone || '',
      email: d.email || '',
      latitude: d.latitude || 28.5 + Math.random() * 0.3,
      longitude: d.longitude || 77.0 + Math.random() * 0.5,
      metrics: emptyMetrics(),
      tags,
      segment: (d.segment || 'B') as any,
      status: (d.status || 'active') as any,

      // Onboarding fields
      sellOnboarded: d.sell_onboarded || 'N',
      dcfOnboarded: d.dcf_onboarded || 'N',
      sellOnboardingDate: d.sell_onboarding_date || undefined,
      dcfOnboardingDate: d.dcf_onboarding_date || undefined,
      onboardingStatus: d.onboarding_status || 'Soft onboarded',
      bankAccountStatus: d.bank_account_status || 'Not verified',
      // F1/Top filter: canonical from dealers_master.is_top boolean
      isTopDealer: d.is_top === true,
    };
  });
}

// ════════════════════════════════════════════════════════════════════
// LEADS — from sell_leads_master
// KAM/TL derived from dealer ownership in dealers_master
// ════════════════════════════════════════════════════════════════════

export async function fetchLeadsRaw(): Promise<Lead[]> {
  const data = await fetchAll('sell_leads_master', 'lead_id,dealer_code,year,make,model,variant,cx_reg_no,gs_flag,dl_type,appointment_id,product_appt_id,app_id,appointment_status,target_price,selleragreedprice,latest_c24q,max_c24_quote,bid_amount,lead_date,deal_creation_date,original_appt_date,current_appt_date,inspection_date,inspection_city,inspection_region,token_date,stockin_date,stock_out_date,final_token_date,final_si_date,latest_ocb_raisedat,franchise_flag,ocb_run_count,verified,dealer_region,growth_zone,reg_appt_rank,reg_insp_rank,reg_token_rank,reg_stockin_rank,refund_status,refund_amount,refund_date,refund_reason,c2d_status,c2d_date,c2d_amount,duplicate_of');
  if (data.length === 0) return [];

  const mapped = data.map((l: any) => {
    const stage = deriveStage(l);
    const status = deriveStatus(l);
    const channel = l.gs_flag === 1 ? 'GS' : 'NGS';
    const leadDate = l.lead_date || l.deal_creation_date || new Date().toISOString();

    return {
      id: String(l.lead_id),
      dealerId: String(l.dealer_code || ''),
      dealerName: '', // Enriched in runtimeDB from dealers_master
      dealerCode: String(l.dealer_code || ''),
      kamId: '', // Enriched in runtimeDB from dealer ownership
      kamName: '',
      kamPhone: '',
      tlId: '',

      appId: l.appointment_id != null ? String(l.appointment_id) : (l.product_appt_id != null ? String(l.product_appt_id) : (l.app_id != null ? String(l.app_id) : undefined)),
      customerName: [l.year, l.make, l.model].filter(Boolean).join(' ') || `Lead #${l.lead_id}`,
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
      c24Quote: l.latest_c24q != null ? Number(l.latest_c24q) : null,
      maxC24Quote: l.max_c24_quote != null ? Number(l.max_c24_quote) : null,
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

  return mapped;
}

// ════════════════════════════════════════════════════════════════════
// CALLS — from call_events
// Uses kam_id from call_events (the KAM who made the call)
// dealer_code added for canonical dealer reference
// ════════════════════════════════════════════════════════════════════

export async function fetchCallsRaw(): Promise<CallLog[]> {
  await ensureUserMap();
  const data = await fetchAll('call_events', 'call_id,kam_id,dealer_code,dealer_id,start_time,duration,outcome,is_productive,customer_phone,notes,call_direction,recording_url,device_id,sim_slot');
  if (data.length === 0) return [];

  return data.map((c: any) => {
    const kamId = c.kam_id || '';
    const kamName = getUserName(kamId) || 'KAM';
    const tlId = getUserTeamId(kamId); // derive TL from KAM's team

    return {
      id: c.call_id,
      dealerId: c.dealer_code ? String(c.dealer_code) : (c.dealer_id || ''),
      dealerName: '', // Enriched from dealers_master via runtimeDB
      dealerCode: c.dealer_code ? String(c.dealer_code) : (c.dealer_id || ''),
      callDate: c.start_time,
      callTime: c.start_time ? new Date(c.start_time).toLocaleTimeString() : '',
      duration: c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : '0s',
      durationSec: c.duration || 0,
      kamId,
      kamName,
      tlId,
      outcome: c.outcome || 'Connected',
      isProductive: c.is_productive ?? ['converted', 'interested'].includes(c.outcome),
      productivitySource: 'AI' as const,
      phone: c.customer_phone || '',
      callStatus: c.outcome === 'not_interested' ? 'NOT_REACHABLE' : 'CONNECTED' as any,
      recordingStatus: 'AVAILABLE' as any,
      feedbackStatus: c.notes ? 'SUBMITTED' : 'PENDING' as any,
    };
  });
}

// ════════════════════════════════════════════════════════════════════
// VISITS — from visits table
// Supports both tagged (dealer_code) and untagged (untagged_dealer_id) dealers
// ════════════════════════════════════════════════════════════════════

export async function fetchVisitsRaw(): Promise<VisitLog[]> {
  await ensureUserMap();
  const data = await fetchAll('visits', 'visit_id,kam_id,dealer_code,dealer_id,untagged_dealer_id,scheduled_at,duration_minutes,geo_lat,geo_lng,is_productive,visit_type,status,check_in_at,check_out_at');
  if (data.length === 0) return [];

  return data.map((v: any) => {
    const kamId = v.kam_id || '';
    const kamName = getUserName(kamId) || 'KAM';
    const tlId = getUserTeamId(kamId);

    // Use dealer_code if available, fall back to dealer_id (UUID from old data)
    const dealerRef = v.dealer_code ? String(v.dealer_code) : (v.untagged_dealer_id || v.dealer_id || '');

    return {
      id: v.visit_id,
      dealerId: dealerRef,
      dealerName: '', // Enriched from dealers_master via runtimeDB
      dealerCode: dealerRef,
      visitDate: v.scheduled_at,
      visitTime: v.scheduled_at ? new Date(v.scheduled_at).toLocaleTimeString() : '',
      duration: v.duration_minutes ? `${v.duration_minutes}m` : '30m',
      kamId,
      kamName,
      tlId,
      checkInLocation: { latitude: Number(v.geo_lat) || 28.5, longitude: Number(v.geo_lng) || 77.2 },
      isProductive: v.is_productive ?? v.status === 'completed',
      productivitySource: 'Geofence' as const,
      visitType: v.visit_type || 'Planned',
      status: v.status === 'completed' ? 'COMPLETED' : v.status === 'cancelled' ? 'CANCELLED' : 'NOT_STARTED',
      checkInAt: v.check_in_at || undefined,
      completedAt: v.check_out_at || undefined,
    };
  });
}

// ════════════════════════════════════════════════════════════════════
// DCF — from dcf_leads_master
// KAM/TL derived from dealer ownership in dealers_master
// ════════════════════════════════════════════════════════════════════

export async function fetchDcfLeadsRaw(): Promise<DCFLead[]> {
  const data = await fetchAll('dcf_leads_master', 'lead_id,id,dealer_code,dealer_name,dealer_city,kam_id,tl_id,applicant_name,borrower_name,cust_name,customer_name,customer_mobile,mobile_no,valuation_price,gross_disbursal,total_loan_sanction,loan_tenure,ds_tenure,roi_per_annum,ds_roi,funnel_loan_state,disbursal_datetime,approval_date,login_date,red_flag,risk_bucket,rm_mapping,ds_channel,banking_flag,lead_creation_date,year,make,model,variant,vehicle_model,registration_no,final_offer_ltv,system_ltv,cibil_score,employment_details');
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

    // Customer name + phone derivation. Some upstream rows pack the mobile
    // into customer_name as a numeric/scientific-notation string. We:
    //   1. try real name fields in priority order
    //   2. recover any numeric content as the phone
    //   3. derive a stable display name from loan id last digits as final fallback
    const nameCandidates = [dcf.applicant_name, dcf.borrower_name, dcf.cust_name, dcf.customer_name];
    let resolvedName = '';
    let recoveredPhone = '';
    for (const raw of nameCandidates) {
      if (!raw) continue;
      const s = String(raw).trim();
      if (!s) continue;
      const isNumeric = /^[\d.eE+\-\s]+$/.test(s) && !isNaN(Number(s));
      if (isNumeric) {
        // Only recover as phone if it's a plain 10–13 digit string. Scientific
        // notation has already lost precision and can't be reconstructed safely.
        const digits = s.replace(/\D/g, '');
        if (!recoveredPhone && !/[eE]/.test(s) && digits.length >= 10 && digits.length <= 13) {
          recoveredPhone = digits;
        }
        continue;
      }
      resolvedName = s;
      break;
    }
    if (!resolvedName) {
      const idStr = String(dcf.lead_id || dcf.id || '');
      const last4 = idStr.slice(-4);
      resolvedName = last4 ? `Customer #${last4}` : 'Customer';
    }

    // Vehicle derivation. Fall back through model-only, variant, registration, then 'Vehicle TBD'.
    const carParts = [dcf.year, dcf.make, dcf.model].filter(Boolean).join(' ');
    const carFallback = dcf.vehicle_model || dcf.variant || dcf.model || dcf.registration_no || 'Vehicle TBD';
    const carDisplay = carParts || carFallback;

    return {
      id: dcf.lead_id || `dcf-${dcf.id}`,
      customerName: resolvedName,
      customerPhone: recoveredPhone || dcf.customer_mobile || dcf.mobile_no || '',
      city: dcf.dealer_city || 'Unknown',
      regNo: dcf.registration_no || '',
      car: carDisplay,
      carValue: valuation,
      ltv: Number(dcf.final_offer_ltv) || Number(dcf.system_ltv) || Math.round((loanAmt / valuation) * 100),
      finalOfferLtv: dcf.final_offer_ltv != null ? Number(dcf.final_offer_ltv) : null,
      loanAmount: loanAmt,
      roi,
      tenure,
      emi: loanAmt > 0 && tenure > 0 ? Math.round(loanAmt / tenure) : 0,
      dealerId: String(dcf.dealer_code || ''),
      dealerName: dcf.dealer_name || 'Unknown',
      dealerCode: String(dcf.dealer_code || ''),
      dealerCity: dcf.dealer_city || 'Unknown',
      channel: 'DCF',
      ragStatus: ragStatus as 'green' | 'amber' | 'red',
      bookFlag: dcf.ds_channel || 'Partner Book',
      carDocsFlag: dcf.banking_flag === 'COMPLETED' ? 'Received' : 'Pending',
      conversionOwner: dcf.rm_mapping || 'KAM',
      conversionEmail: '',
      conversionPhone: '',
      kamId: '', // Enriched in runtimeDB from dealer ownership
      kamName: '',
      tlId: '',
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
// UNTAGGED DEALERS — from untagged_dealers table
// ════════════════════════════════════════════════════════════════════

export async function fetchUntaggedDealersRaw(): Promise<UntaggedDealer[]> {
  const { data, error } = await supabase.from('untagged_dealers').select('id,phone,name,city,region,address,notes,created_by,created_at');
  if (error) {
    console.error('[SupabaseRaw] Failed to fetch untagged_dealers:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  return data.map((ud: any) => ({
    id: ud.id,
    phone: ud.phone,
    name: ud.name || undefined,
    city: ud.city || undefined,
    region: ud.region || undefined,
    address: ud.address || undefined,
    notes: ud.notes || undefined,
    createdBy: ud.created_by || undefined,
    createdAt: ud.created_at || new Date().toISOString(),
  }));
}

// ════════════════════════════════════════════════════════════════════
// LOCATION REQUESTS
// ════════════════════════════════════════════════════════════════════

export async function fetchLocationRequestsRaw(): Promise<LocationChangeRequest[]> {
  const { data, error } = await supabase.from('location_requests').select('request_id,dealer_id,requested_by,old_lat,old_lng,new_lat,new_lng,reason,status,decided_at,decided_by,rejection_reason,created_at');
  if (error) {
    console.error('[SupabaseRaw] Failed to fetch location_requests:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  return data.map((lr: any) => ({
    id: lr.request_id,
    dealerId: lr.dealer_id,
    dealerName: '',
    requestedBy: lr.requested_by,
    requestedByName: '',
    oldLocation: lr.old_lat ? { latitude: lr.old_lat, longitude: lr.old_lng } : null,
    newLocation: { latitude: lr.new_lat, longitude: lr.new_lng },
    reason: lr.reason,
    status: lr.status,
    decidedAt: lr.decided_at,
    decidedBy: lr.decided_by,
    rejectionReason: lr.rejection_reason,
    createdAt: lr.created_at,
  }));
}

// ════════════════════════════════════════════════════════════════════
// ORG — built from users + teams tables
// ════════════════════════════════════════════════════════════════════

export async function fetchOrgRaw(): Promise<AdminOrg | null> {
  await ensureUserMap();
  const [usersData, teamsData] = await Promise.all([
    fetchAll('users', 'user_id,name,role,region,team_id,phone,email,city,is_active,last_login_at,avatar_url'),
    fetchAll('teams', 'team_id,tl_user_id'),
  ]);

  if (usersData.length === 0 && teamsData.length === 0) return null;

  // Build TL → KAMs hierarchy
  const tls: any[] = [];
  const tlMap = new Map<string, any>();

  for (const u of usersData) {
    if (u.role === 'TL' || u.role === 'tl') {
      const tl = {
        id: u.user_id,
        name: u.name || 'TL',
        region: toRegionKey(u.region) as any,
        phone: u.phone || '',
        email: u.email || '',
        kams: [] as any[],
      };
      tlMap.set(u.user_id, tl);
      // Also map by team_id for KAM lookups
      const team = teamsData.find((t: any) => t.tl_user_id === u.user_id);
      if (team) tlMap.set(team.team_id, tl);
      tls.push(tl);
    }
  }

  for (const u of usersData) {
    if (u.role === 'KAM' || u.role === 'kam') {
      const kam = {
        id: u.user_id,
        name: u.name || 'KAM',
        region: toRegionKey(u.region) as any,
        city: u.city || '',
        phone: u.phone || '',
        email: u.email || '',
        tlId: u.team_id || '',
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

// ════════════════════════════════════════════════════════════════════
// CONFIG TABLES: targets, incentive_slabs, incentive_rules
// ════════════════════════════════════════════════════════════════════

export interface TargetRow {
  target_id: string;
  user_id: string;
  role: 'KAM' | 'TL';
  month: string; // 'YYYY-MM'
  si_target: number;
  call_target: number;
  visit_target: number;
  i2si_target: number;       // I2SI% target (e.g. 65)
  input_score_gate: number;
  quality_score_gate: number;
}

export interface IncentiveSlabRow {
  slab_id: string;
  role: 'KAM' | 'TL';
  slab_name: string;
  min_percent: number;
  max_percent: number | null;
  rate_per_si: number;
  description: string | null;
  effective_from: string;
  effective_to: string | null;
}

export interface IncentiveRuleRow {
  rule_id: string;
  scope: 'team' | 'role';
  metric_key: string;
  threshold: number | null;
  payout: number | null;
  effective_from: string | null;
  effective_to: string | null;
}

export async function fetchTargetsRaw(): Promise<TargetRow[]> {
  try {
    return await fetchAll<TargetRow>('targets', 'target_id,user_id,role,month,si_target,call_target,visit_target,i2si_target,input_score_gate,quality_score_gate,stretch_value');
  } catch (e) {
    console.warn('[SupabaseRaw] Failed to fetch targets:', e);
    return [];
  }
}

export async function fetchIncentiveSlabsRaw(): Promise<IncentiveSlabRow[]> {
  try {
    return await fetchAll<IncentiveSlabRow>('incentive_slabs', 'slab_id,role,slab_name,min_percent,max_percent,rate_per_si,description,effective_from,effective_to');
  } catch (e) {
    console.warn('[SupabaseRaw] Failed to fetch incentive_slabs:', e);
    return [];
  }
}

export async function fetchIncentiveRulesRaw(): Promise<IncentiveRuleRow[]> {
  try {
    return await fetchAll<IncentiveRuleRow>('incentive_rules', 'rule_id,scope,metric_key,threshold,payout,effective_from,effective_to');
  } catch (e) {
    console.warn('[SupabaseRaw] Failed to fetch incentive_rules:', e);
    return [];
  }
}


// ════════════════════════════════════════════════════════════════════
// DEALER WRITE — set/unset is_top flag (canonical 'Top dealer' marker)
// Used by Activity 'Top' filter and DealerDetailPageV2 star toggle.
// ════════════════════════════════════════════════════════════════════

export async function setDealerIsTop(dealerCode: string | number, isTop: boolean): Promise<boolean> {
  try {
    const code = typeof dealerCode === 'string' ? parseInt(dealerCode, 10) : dealerCode;
    if (!Number.isFinite(code)) return false;
    const { error } = await supabase
      .from('dealers_master')
      .update({ is_top: isTop })
      .eq('dealer_code', code);
    if (error) {
      console.warn('[SupabaseRaw] setDealerIsTop failed:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[SupabaseRaw] setDealerIsTop exception:', e);
    return false;
  }
}

