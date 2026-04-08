/**
 * VISIT + CALL API CLIENT
 *
 * Frontend API layer for the field-ops engine (Visits + Calls).
 * Transformed to use Supabase Postgres directly instead of deprecated Edge Functions.
 */

import { supabase } from '../lib/supabase/client';

export interface VisitRecord {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  userId: string;
  kamName: string;
  status: 'ACTIVE' | 'COMPLETED_NO_FEEDBACK' | 'CLOSED';
  startAt: string;
  endAt: string | null;
  distanceAtStart: number | null;
  gpsAccuracyAtStart: number | null;
  geoVerified: boolean;
  lat: number | null;
  lng: number | null;
  feedback: UnifiedFeedbackRecord | null;
  photoPath: string | null;
  photoType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CallRecord {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  userId: string;
  kamName: string;
  status: 'ACTIVE' | 'COMPLETED_NO_FEEDBACK' | 'CLOSED';
  startAt: string;
  endAt: string | null;
  durationSeconds: number | null;
  feedback: UnifiedFeedbackRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedFeedbackRecord {
  interactionType: string;
  meetingPersonRole: string;
  meetingPersonOtherText: string | null;
  leadShared: boolean;
  leadStatus: string | null;
  sellerLeadCount: number;
  buyerLeadCount: number;
  inspectionExpected: boolean | null;
  dcfDiscussed: boolean;
  dcfStatus: string | null;
  dcfCreditRange: string | null;
  dcfDocsCollected: string[];
  note: string;
  rating: number;
  photoPath: string | null;
  photoType: string | null;
  submittedAt: string;
}

export interface VisitBlockerResult {
  blocked: boolean;
  blockerType: 'visit' | 'call' | null;
  reason: string | null;
  blockingVisit: VisitRecord | null;
  blockingCall: CallRecord | null;
  hasNoFeedback: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIT API
// ═══════════════════════════════════════════════════════════════════════════

export async function startVisit(params: {
  id?: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  userId: string;
  kamName: string;
  lat: number | null;
  lng: number | null;
  distanceAtStart: number | null;
  gpsAccuracyAtStart: number | null;
  geoVerified: boolean;
}): Promise<VisitRecord> {
  // If caller provided a UUID, use it so the client-side id matches the DB PK.
  // visits.visit_id is UUID; non-UUID strings like "visit-12345" would break
  // subsequent .eq('visit_id', ...) lookups for endVisit / submitVisitFeedback.
  const isUuid = (s?: string) =>
    !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  const explicitId = isUuid(params.id) ? params.id : undefined;

  // visits.dealer_id is a UUID FK to dealers(dealer_id), but the canonical
  // dealer identity in this codebase is the integer dealers_master.dealer_code.
  // We persist via dealer_code (denormalized int column on visits) and leave
  // dealer_id NULL — fetchVisitsRaw / listVisits both prefer dealer_code.
  const dealerCodeNum = Number(params.dealerCode || params.dealerId);
  if (!Number.isFinite(dealerCodeNum)) {
    throw new Error(`Cannot start visit: invalid dealer code "${params.dealerCode || params.dealerId}"`);
  }
  const insertRow: Record<string, any> = {
    kam_id: params.userId,
    geo_lat: params.lat,
    geo_lng: params.lng,
    status: 'scheduled',
    scheduled_at: new Date().toISOString(),
    check_in_at: new Date().toISOString(),
    visit_type: 'Unplanned',
    dealer_code: dealerCodeNum,
  };
  if (explicitId) insertRow.visit_id = explicitId;

  const { data, error } = await supabase
    .from('visits')
    .insert(insertRow)
    .select('*')
    .single();

  if (error) {
    console.error('[visit.api] startVisit error', error);
    throw new Error(error.message || 'Failed to start visit');
  }

  return {
    id: data?.visit_id || explicitId || `visit-${Date.now()}`,
    dealerId: params.dealerId,
    dealerName: params.dealerName,
    dealerCode: params.dealerCode,
    dealerCity: params.dealerCity,
    userId: params.userId,
    kamName: params.kamName,
    status: 'ACTIVE',
    startAt: new Date().toISOString(),
    endAt: null,
    distanceAtStart: params.distanceAtStart,
    gpsAccuracyAtStart: params.gpsAccuracyAtStart,
    geoVerified: params.geoVerified,
    lat: params.lat,
    lng: params.lng,
    feedback: null,
    photoPath: null,
    photoType: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function endVisit(visitId: string): Promise<VisitRecord> {
  if (!UUID_RE.test(visitId)) {
    console.warn('[visit.api] endVisit skipped: non-UUID visitId', visitId);
    return {} as VisitRecord;
  }
  const { error } = await supabase
    .from('visits')
    .update({
      status: 'completed',
      check_out_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('visit_id', visitId);

  if (error) console.error('[visit.api] endVisit error', error);
  return {} as VisitRecord; // Ignored largely by current UI
}

export async function uploadVisitPhoto(
  visitId: string,
  base64Data: string,
  photoType: string,
  mimeType?: string,
): Promise<{ photoPath: string; photoType: string; signedUrl: string | null }> {
  // Stubbed for APK build. In a fully live app, this would use Supabase Storage.
  console.log(`Stubbed upload photo for visit ${visitId}`);
  return {
    photoPath: `visits/${visitId}/${photoType}.jpg`,
    photoType,
    signedUrl: null
  };
}

export async function submitVisitFeedback(
  visitId: string,
  unifiedFeedback: Record<string, any>,
): Promise<VisitRecord> {
  if (!UUID_RE.test(visitId)) {
    console.warn('[visit.api] submitVisitFeedback skipped: non-UUID visitId', visitId);
    return {} as VisitRecord;
  }
  const { error } = await supabase
    .from('visits')
    .update({
      status: 'completed',
      outcome_code: unifiedFeedback.interactionType || 'VISIT',
      feedback_data: unifiedFeedback,
      notes: unifiedFeedback.note || null,
      check_out_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('visit_id', visitId);

  if (error) console.error('[visit.api] submitVisitFeedback error', error);
  return {} as VisitRecord;
}

export async function listVisits(userId: string, sinceISO?: string): Promise<VisitRecord[]> {
  let q = supabase
    .from('visits')
    .select('visit_id, dealer_id, dealer_code, kam_id, scheduled_at, status, outcome_code, notes, feedback_data, created_at, updated_at, geo_lat, geo_lng, check_in_at, check_out_at')
    .eq('kam_id', userId)
    .order('scheduled_at', { ascending: false })
    .limit(500);
  if (sinceISO) q = q.gte('scheduled_at', sinceISO);
  const { data, error } = await q;
  if (error) {
    console.error('[visit.api] listVisits error', JSON.stringify(error, null, 2), error?.message, error?.details, error?.hint, error?.code);
    return [];
  }
  const rows = data || [];

  // dealers_master keys on integer dealer_code (no UUID column). Both visits.dealer_code
  // and call_events.dealer_code are populated; use that for the join.
  const dealerCodes = [...new Set(rows.map((r: any) => r.dealer_code).filter((c: any) => c != null))];
  const dealerMap = await fetchDealerNameMap(dealerCodes);

  return rows.map((v: any) => ({
    id: v.visit_id,
    dealerId: v.dealer_code != null ? String(v.dealer_code) : (v.dealer_id || ''),
    dealerName: dealerMap.get(String(v.dealer_code)) || `Dealer ${v.dealer_code ?? ''}`.trim(),
    dealerCode: v.dealer_code != null ? String(v.dealer_code) : '',
    dealerCity: '',
    userId: v.kam_id,
    kamName: '',
    // Active = check-in stamped but not yet checked out (regardless of DB status string,
    // since the check constraint only allows scheduled/completed/cancelled/no_show).
    status: (v.check_in_at && !v.check_out_at && v.status !== 'completed') ? 'ACTIVE' : 'CLOSED',
    startAt: v.check_in_at || v.scheduled_at,
    endAt: v.check_out_at || v.updated_at,
    distanceAtStart: null,
    gpsAccuracyAtStart: null,
    geoVerified: false,
    lat: v.geo_lat,
    lng: v.geo_lng,
    feedback: v.feedback_data
      ? v.feedback_data
      : (v.notes
          ? (() => { try { return JSON.parse(v.notes); } catch { return { interactionType: v.outcome_code || 'VISIT', note: v.notes } as any; } })()
          : null),
    photoPath: null,
    photoType: null,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  } as VisitRecord));
}

// Dealer-name cache keyed by dealer_code (string). dealers_master has no UUID column,
// so we join via the integer dealer_code that's denormalized onto visits/call_events.
let _dealerNameCache: Map<string, string> | null = null;
async function fetchDealerNameMap(_dealerCodes: any[]): Promise<Map<string, string>> {
  if (_dealerNameCache) return _dealerNameCache;
  const map = new Map<string, string>();
  try {
    const { data } = await supabase.from('dealers_master').select('dealer_code, dealer_name');
    for (const r of (data || []) as any[]) {
      map.set(String(r.dealer_code), r.dealer_name);
    }
  } catch (e) {
    console.warn('[visit.api] dealer name lookup failed', e);
  }
  _dealerNameCache = map;
  return map;
}

export async function checkBlocker(userId: string): Promise<VisitBlockerResult> {
  return { blocked: false, blockerType: null, reason: null, blockingVisit: null, blockingCall: null, hasNoFeedback: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// CALL API
// ═══════════════════════════════════════════════════════════════════════════

export async function registerCall(params: {
  id?: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  userId: string;
  kamName: string;
  durationSeconds?: number;
}): Promise<CallRecord> {
  const explicitId = UUID_RE.test(params.id || '') ? params.id : undefined;
  // call_events.dealer_id is UUID; canonical identity is integer dealer_code.
  const dealerCodeNum = Number(params.dealerCode || params.dealerId);
  if (!Number.isFinite(dealerCodeNum)) {
    throw new Error(`Cannot register call: invalid dealer code "${params.dealerCode || params.dealerId}"`);
  }
  const insertRow: Record<string, any> = {
    kam_id: params.userId,
    start_time: new Date().toISOString(),
    duration: params.durationSeconds || 0,
    direction: 'outbound',
    dealer_code: dealerCodeNum,
  };
  if (explicitId) insertRow.call_id = explicitId;
  const { data, error } = await supabase
    .from('call_events')
    .insert(insertRow)
    .select('*')
    .single();

  if (error) console.error(error);

  return {
    id: data?.call_id || params.id || `call-${Date.now()}`,
    dealerId: params.dealerId,
    dealerName: params.dealerName,
    dealerCode: params.dealerCode,
    dealerCity: params.dealerCity,
    userId: params.userId,
    kamName: params.kamName,
    status: 'COMPLETED_NO_FEEDBACK',
    startAt: new Date().toISOString(),
    endAt: new Date().toISOString(),
    durationSeconds: params.durationSeconds || null,
    feedback: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function submitCallFeedback(
  callId: string,
  unifiedFeedback: Record<string, any>,
): Promise<CallRecord> {
  if (!UUID_RE.test(callId)) {
    console.warn('[visit.api] submitCallFeedback skipped: non-UUID callId', callId);
    return {} as CallRecord;
  }
  const { error } = await supabase
    .from('call_events')
    .update({
      notes: unifiedFeedback.note,
      outcome: unifiedFeedback.interactionType,
      feedback_data: unifiedFeedback,
      end_time: new Date().toISOString(),
    })
    .eq('call_id', callId);

  if (error) console.error(error);
  return {} as CallRecord;
}

export async function listCalls(userId: string, sinceISO?: string): Promise<CallRecord[]> {
  let q = supabase
    .from('call_events')
    .select('call_id, dealer_id, dealer_code, kam_id, direction, start_time, end_time, duration, outcome, notes, created_at, is_productive')
    .eq('kam_id', userId)
    .order('start_time', { ascending: false })
    .limit(500);
  if (sinceISO) q = q.gte('start_time', sinceISO);
  const { data, error } = await q;
  if (error) {
    console.error('[visit.api] listCalls error', JSON.stringify(error, null, 2), error?.message, error?.details, error?.hint, error?.code);
    return [];
  }
  const rows = data || [];
  const dealerCodes = [...new Set(rows.map((r: any) => r.dealer_code).filter((c: any) => c != null))];
  const dealerMap = await fetchDealerNameMap(dealerCodes);

  return rows.map((c: any) => ({
    id: c.call_id,
    dealerId: c.dealer_id,
    dealerName: dealerMap.get(String(c.dealer_code)) || `Dealer ${c.dealer_code ?? ''}`.trim(),
    dealerCode: c.dealer_code != null ? String(c.dealer_code) : '',
    dealerCity: '',
    userId: c.kam_id,
    kamName: '',
    status: c.notes ? 'CLOSED' : 'COMPLETED_NO_FEEDBACK',
    startAt: c.start_time,
    endAt: c.end_time,
    durationSeconds: c.duration,
    feedback: c.notes ? ({ interactionType: c.outcome || 'CALL', note: c.notes } as any) : null,
    createdAt: c.created_at || c.start_time,
    updatedAt: c.created_at || c.start_time,
  } as CallRecord));
}

// ═══════════════════════════════════════════════════════════════════════════
// DEALER LOCATION API
// ═══════════════════════════════════════════════════════════════════════════
export async function updateDealerLocation(params: any): Promise<any> {
  return {};
}

export async function getDealerLocationAudit(dealerId: string): Promise<any[]> {
  return [];
}

export async function submitFeedback(
  visitId: string,
  feedback: Record<string, any>,
): Promise<VisitRecord> {
  if (feedback.unifiedFeedback) {
    return submitVisitFeedback(visitId, feedback.unifiedFeedback);
  }
  return submitVisitFeedback(visitId, {
    interactionType: 'VISIT',
    note: feedback.notes || '',
  });
}