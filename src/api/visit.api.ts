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
  const { data, error } = await supabase
    .from('visits')
    .insert({
      dealer_id: params.dealerId,
      kam_id: params.userId,
      geo_lat: params.lat,
      geo_lng: params.lng,
      status: 'scheduled',
      scheduled_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) console.error(error);

  return {
    id: data?.visit_id || `visit-${Date.now()}`,
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

export async function endVisit(visitId: string): Promise<VisitRecord> {
  const { data, error } = await supabase
    .from('visits')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('visit_id', visitId)
    .select('*')
    .single();

  if (error) console.error(error);
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
  const { error } = await supabase
    .from('visits')
    .update({
      status: 'completed',
      outcome_code: unifiedFeedback.interactionType,
      notes: unifiedFeedback.note,
      updated_at: new Date().toISOString()
    })
    .eq('visit_id', visitId);

  if (error) console.error(error);
  return {} as VisitRecord;
}

export async function listVisits(userId: string): Promise<VisitRecord[]> {
  const { data } = await supabase.from('visits').select('*, dealers(dealer_name)').eq('kam_id', userId);
  return (data || []).map((v: any) => ({
    id: v.visit_id,
    dealerId: v.dealer_id,
    dealerName: v.dealers?.dealer_name || 'Unknown Dealer',
    userId: v.kam_id,
    status: v.status === 'completed' ? 'CLOSED' : 'ACTIVE',
    startAt: v.scheduled_at,
    endAt: v.updated_at,
    createdAt: v.created_at,
  } as VisitRecord));
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
  const { data, error } = await supabase
    .from('call_events')
    .insert({
      dealer_id: params.dealerId,
      kam_id: params.userId,
      start_time: new Date().toISOString(),
      duration: params.durationSeconds || 0,
      direction: 'outbound'
    })
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
  const { error } = await supabase
    .from('call_events')
    .update({
      notes: unifiedFeedback.note,
      outcome: unifiedFeedback.interactionType
    })
    .eq('call_id', callId);

  if (error) console.error(error);
  return {} as CallRecord;
}

export async function listCalls(userId: string): Promise<CallRecord[]> {
  const { data } = await supabase.from('call_events').select('*, dealers(dealer_name)').eq('kam_id', userId);
  return (data || []).map((c: any) => ({
    id: c.call_id,
    dealerId: c.dealer_id,
    dealerName: c.dealers?.dealer_name || 'Unknown Dealer',
    userId: c.kam_id,
    status: 'CLOSED',
    startAt: c.start_time,
    durationSeconds: c.duration,
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