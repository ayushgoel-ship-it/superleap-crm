import { supabase } from '@/lib/supabase/client';
import type { Dealer, CallLog, VisitLog, Lead, DCFLead, AdminOrg, LocationChangeRequest } from './types';

/**
 * DATA ADAPTER
 * Maps real normalized Postgres tables to the legacy nested JSON structures expected by the frontend UI.
 * This allows a seamless transition to a live Supabase DB without rewriting 100+ React components.
 */

export async function fetchDealersRaw(): Promise<Dealer[]> {
  const { data, error } = await supabase.from('dealers').select('*, users!assigned_kam_id(*)');

  if (error) {
    console.error('Supabase: Failed to fetch dealers.', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Fetch latest visit per dealer for real lastVisit
  const { data: visitData } = await supabase.from('visits').select('dealer_id, scheduled_at').order('scheduled_at', { ascending: false });
  const latestVisitMap: Record<string, string> = {};
  (visitData || []).forEach((v: any) => {
    if (!latestVisitMap[v.dealer_id]) latestVisitMap[v.dealer_id] = v.scheduled_at;
  });

  return data.map((d: any) => {
    const lastVisit = latestVisitMap[d.dealer_id] || d.created_at || new Date().toISOString();
    const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86400000));
    return {
      id: d.dealer_id,
      name: d.dealer_name,
      code: d.dealer_name.substring(0, 3).toUpperCase() + '-' + d.dealer_id.substring(0, 4),
      city: d.city || 'Unknown',
      region: 'NCR',
      kamId: d.assigned_kam_id || 'unassigned',
      kamName: d.users?.name || 'Unassigned KAM',
      tlId: d.users?.team_id || 'tl-default',
      lastVisit,
      lastContact: lastVisit,
      lastVisitDaysAgo: daysAgo,
      lastContactDaysAgo: daysAgo,
      phone: d.phone || '',
      email: '',
      latitude: 28.5 + Math.random() * 0.3,
      longitude: 77.0 + Math.random() * 0.5,
      metrics: d.metadata?.metrics || {},
      tags: d.segment_tags || [],
      segment: (d.segment_tags || []).includes('Premium') ? 'A' : (d.segment_tags || []).includes('Luxury') ? 'A+' : 'B',
      status: d.status || 'active',
    };
  });
}

export async function fetchLeadsRaw(): Promise<Lead[]> {
  const { data, error } = await supabase.from('leads').select('*, dealers(*), users!assigned_kam_id(*)');

  if (error) {
    console.error('Supabase: Failed to fetch leads.', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Map Supabase channel enum to app channel labels
  const channelMap: Record<string, string> = {
    'DealerReferral': 'C2B',
    'YardReferral': 'GS',
    'OSS': 'OSS',
    'YRS': 'YRS',
    'DCF': 'DCF',
    'Direct': 'Direct',
  };

  return data.map((l: any) => ({
    id: l.lead_id,
    dealerId: l.dealer_id,
    dealerName: l.dealers?.dealer_name || 'Unknown',
    dealerCode: l.dealers?.dealer_name ? l.dealers.dealer_name.substring(0, 3).toUpperCase() + '-' + l.dealer_id?.substring(0, 4) : 'DLR-UN',
    kamId: l.assigned_kam_id || 'unassigned',
    kamName: l.users?.name || 'Unassigned',
    kamPhone: l.users?.phone || '',
    tlId: l.users?.team_id || 'tl-default',
    customerName: l.customer_name || 'Customer',
    customerPhone: l.customer_phone || '',
    regNo: l.pricing_fields?.regNo || '',
    make: l.pricing_fields?.make || '',
    model: l.pricing_fields?.model || '',
    year: l.pricing_fields?.year || 2024,
    channel: channelMap[l.channel] || l.channel || 'Other',
    leadType: 'Seller',
    stage: l.stage,
    status: l.status === 'open' ? 'Active' : l.status,
    expectedRevenue: l.pricing_fields?.price || l.pricing_fields?.expectedRevenue || 0,
    actualRevenue: l.status === 'won' ? (l.pricing_fields?.price || 0) : 0,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    city: l.customer_city || l.dealers?.city || 'NCR',
    region: 'NCR'
  }));
}

export async function fetchCallsRaw(): Promise<CallLog[]> {
  const { data, error } = await supabase.from('call_events').select('*, leads(*), dealers(*), users!kam_id(*)');

  if (error) {
    console.error('Supabase: Failed to fetch calls.', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  return data.map((c: any) => ({
    id: c.call_id,
    dealerId: c.dealer_id || 'unknown',
    dealerName: c.dealers?.dealer_name || 'Unknown',
    dealerCode: c.dealers?.dealer_name ? c.dealers.dealer_name.substring(0, 3).toUpperCase() + '-' + (c.dealer_id || '').substring(0, 4) : 'DLR-UN',
    callDate: c.start_time,
    callTime: new Date(c.start_time).toLocaleTimeString(),
    duration: c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : '0s',
    durationSec: c.duration || 0,
    kamId: c.kam_id,
    kamName: c.users?.name || 'KAM',
    tlId: c.users?.team_id || 'tl-default',
    outcome: c.outcome || 'Connected',
    isProductive: ['converted', 'interested'].includes(c.outcome),
    productivitySource: 'AI',
    phone: c.customer_phone || '',
    callStatus: c.outcome === 'not_interested' ? 'NOT_CONNECTED' : 'CONNECTED',
    recordingStatus: 'AVAILABLE',
    feedbackStatus: c.notes ? 'SUBMITTED' : 'PENDING',
  }));
}

export async function fetchVisitsRaw(): Promise<VisitLog[]> {
  const { data, error } = await supabase.from('visits').select('*, dealers(*), users!kam_id(*)');

  if (error) {
    console.error('Supabase: Failed to fetch visits.', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  return data.map((v: any) => ({
    id: v.visit_id,
    dealerId: v.dealer_id,
    dealerName: v.dealers?.dealer_name || 'Unknown',
    dealerCode: v.dealers?.dealer_name ? v.dealers.dealer_name.substring(0, 3).toUpperCase() + '-' + (v.dealer_id || '').substring(0, 4) : 'DLR-UN',
    visitDate: v.scheduled_at,
    visitTime: new Date(v.scheduled_at).toLocaleTimeString(),
    duration: '30m',
    kamId: v.kam_id,
    kamName: v.users?.name || 'KAM',
    tlId: v.users?.team_id || 'tl-default',
    checkInLocation: { latitude: Number(v.geo_lat) || 28.5, longitude: Number(v.geo_lng) || 77.2 },
    isProductive: v.status === 'completed',
    productivitySource: 'Geofence',
    visitType: v.visit_type || 'Planned',
    status: v.status === 'completed' ? 'COMPLETED' : v.status === 'cancelled' ? 'CANCELLED' : 'NOT_STARTED',
  }));
}

export async function fetchDcfLeadsRaw(): Promise<DCFLead[]> {
  const { data, error } = await supabase.from('dcf_cases').select('*, leads(*, dealers(*), users!assigned_kam_id(*))');

  if (error) {
    console.error('Supabase: Failed to fetch DCF leads.', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  return data.map((dcf: any) => {
    const lead = dcf.leads || {};
    const dealer = lead.dealers || {};
    const kam = lead.users || {};
    const price = lead.pricing_fields?.price || 500000;
    const model = lead.pricing_fields?.model || '';
    const loanAmt = dcf.disbursed_amount || Math.round(price * 0.8);

    return {
      id: dcf.dcf_id,
      customerName: dcf.applicant_name || lead.customer_name || 'Customer',
      customerPhone: lead.customer_phone || '',
      city: lead.customer_city || dealer.city || 'NCR',
      regNo: lead.pricing_fields?.regNo || '',
      car: model,
      carValue: price,
      ltv: 80,
      loanAmount: loanAmt,
      roi: 12,
      tenure: 48,
      emi: Math.round(loanAmt / 48),
      dealerId: lead.dealer_id || 'unknown',
      dealerName: dealer.dealer_name || 'Unknown',
      dealerCode: dealer.dealer_name ? dealer.dealer_name.substring(0, 3).toUpperCase() : 'DLR',
      dealerCity: dealer.city || 'NCR',
      channel: lead.channel || 'DCF',
      ragStatus: lead.rag || 'green',
      bookFlag: lead.book_type || 'Partner Book',
      carDocsFlag: dcf.documents_status?.pan === 'received' ? 'Received' : 'Pending',
      conversionOwner: kam.name || 'KAM',
      conversionEmail: '',
      conversionPhone: kam.phone || '',
      kamId: lead.assigned_kam_id || 'unassigned',
      kamName: kam.name || 'KAM',
      tlId: kam.team_id || 'tl-default',
      firstDisbursalForDealer: false,
      commissionEligible: dcf.stage === 'disbursed',
      baseCommission: 5000,
      boosterApplied: false,
      totalCommission: dcf.stage === 'disbursed' ? 5000 : 0,
      currentFunnel: dcf.stage,
      currentSubStage: dcf.stage,
      overallStatus: dcf.stage,
      createdAt: dcf.created_at,
      lastUpdatedAt: dcf.updated_at,
    };
  });
}

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

export async function fetchOrgRaw(): Promise<AdminOrg | null> {
  const { data, error } = await supabase.from('org_raw').select('*').eq('id', 'org-1').maybeSingle();

  if (error) {
    console.error('Supabase: Failed to fetch org.', error.message);
    return null;
  }
  if (!data) return null;

  return data.payload as AdminOrg;
}