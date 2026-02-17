/**
 * VISIT + CALL API CLIENT
 *
 * Frontend API layer for the field-ops engine (Visits + Calls).
 * Calls the server routes at /make-server-4efaad2c/field-ops/*.
 */

import { projectId, publicAnonKey } from '../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4efaad2c/field-ops`;

const headers = () => ({
  'Content-Type': 'application/json',
  'apikey': publicAnonKey,
  'Authorization': `Bearer ${publicAnonKey}`,
});

// ── Types ──

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
  // NOTE: photoSignedUrl is NOT stored — generated on-the-fly by server
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

export interface AuditRecord {
  id: string;
  dealerId: string;
  dealerName: string;
  oldLat: number;
  oldLng: number;
  newLat: number;
  newLng: number;
  userId: string;
  userName: string;
  timestamp: string;
  reason: string;
  reasonNote: string | null;
  gpsAccuracy: number | null;
}

export type LocationUpdateReason =
  | 'Dealer shifted'
  | 'Wrong pinned earlier'
  | 'Map error'
  | 'Other';

// ── Core request helper ──

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers(), ...options?.headers },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const errMsg = json.error || `HTTP ${res.status}`;
      console.error(`[FieldOpsAPI] Error: ${errMsg}`, json);
      throw new Error(errMsg);
    }
    return json.data;
  } catch (err: any) {
    console.error(`[FieldOpsAPI] Request failed: ${err.message}`);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIT API
// ═══════════════════════════════════════════════════════════════════════════

/** Start a new visit — creates ACTIVE record in DB */
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
  return request<VisitRecord>(`${BASE}/visits`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** End an active visit — transitions to COMPLETED_NO_FEEDBACK */
export async function endVisit(visitId: string): Promise<VisitRecord> {
  return request<VisitRecord>(`${BASE}/visits/${visitId}/end`, {
    method: 'PATCH',
  });
}

/** Upload proof photo for a visit — stores in Supabase Storage */
export async function uploadVisitPhoto(
  visitId: string,
  base64Data: string,
  photoType: string,
  mimeType?: string,
): Promise<{ photoPath: string; photoType: string; signedUrl: string | null }> {
  return request(`${BASE}/visits/${visitId}/photo`, {
    method: 'POST',
    body: JSON.stringify({ base64Data, photoType, mimeType: mimeType || 'image/jpeg' }),
  });
}

/** Submit unified feedback — transitions to CLOSED */
export async function submitVisitFeedback(
  visitId: string,
  unifiedFeedback: Record<string, any>,
): Promise<VisitRecord> {
  return request<VisitRecord>(`${BASE}/visits/${visitId}/feedback`, {
    method: 'PATCH',
    body: JSON.stringify({ unifiedFeedback }),
  });
}

/** List visits for a user, optionally time-filtered */
export async function listVisits(
  userId: string,
  from?: string,
  to?: string,
): Promise<VisitRecord[]> {
  const params = new URLSearchParams({ userId });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return request<VisitRecord[]>(`${BASE}/visits?${params.toString()}`);
}

/** Check if new visit is blocked */
export async function checkBlocker(userId: string): Promise<VisitBlockerResult> {
  return request<VisitBlockerResult>(`${BASE}/visits/blocker?userId=${encodeURIComponent(userId)}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// CALL API
// ═══════════════════════════════════════════════════════════════════════════

/** Register a call — creates COMPLETED_NO_FEEDBACK record in DB */
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
  return request<CallRecord>(`${BASE}/calls`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** Submit call feedback — transitions to CLOSED */
export async function submitCallFeedback(
  callId: string,
  unifiedFeedback: Record<string, any>,
): Promise<CallRecord> {
  return request<CallRecord>(`${BASE}/calls/${callId}/feedback`, {
    method: 'PATCH',
    body: JSON.stringify({ unifiedFeedback }),
  });
}

/** List calls for a user, optionally time-filtered */
export async function listCalls(
  userId: string,
  from?: string,
  to?: string,
): Promise<CallRecord[]> {
  const params = new URLSearchParams({ userId });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return request<CallRecord[]>(`${BASE}/calls?${params.toString()}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// DEALER LOCATION API
// ═══════════════════════════════════════════════════════════════════════════

/** Update dealer location with audit */
export async function updateDealerLocation(params: {
  dealerId: string;
  dealerName: string;
  oldLat: number;
  oldLng: number;
  newLat: number;
  newLng: number;
  userId: string;
  userName: string;
  reason: LocationUpdateReason;
  reasonNote: string | null;
  gpsAccuracy: number | null;
}): Promise<AuditRecord> {
  return request<AuditRecord>(`${BASE}/dealer-location`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** Get dealer location audit trail */
export async function getDealerLocationAudit(dealerId: string): Promise<AuditRecord[]> {
  return request<AuditRecord[]>(
    `${BASE}/dealer-location/audit?dealerId=${encodeURIComponent(dealerId)}`,
  );
}

// ── Legacy adapter for backward compatibility ──
/** @deprecated Use submitVisitFeedback instead */
export async function submitFeedback(
  visitId: string,
  feedback: Record<string, any>,
): Promise<VisitRecord> {
  // If caller passes unifiedFeedback inside, use new path
  if (feedback.unifiedFeedback) {
    return submitVisitFeedback(visitId, feedback.unifiedFeedback);
  }
  // Otherwise wrap legacy fields into unified format
  return submitVisitFeedback(visitId, {
    interactionType: 'VISIT',
    meetingPersonRole: feedback.meetingPerson || 'Other',
    meetingPersonOtherText: feedback.meetingPerson || null,
    leadShared: (feedback.leadsDiscussed || 0) > 0,
    leadStatus: (feedback.leadsDiscussed || 0) > 0 ? 'Yes – Confirmed' : null,
    sellerLeadCount: feedback.leadsDiscussed || 0,
    buyerLeadCount: 0,
    inspectionExpected: (feedback.inspectionCount || 0) > 0,
    dcfDiscussed: false,
    dcfStatus: null,
    dcfCreditRange: null,
    dcfDocsCollected: [],
    note: feedback.notes || '',
    rating: feedback.rating || 3,
  });
}