/**
 * FIELD-OPS ROUTES — Server-side persistence for Visits + Calls engine.
 *
 * KV key patterns:
 *   visit:<visitId>                    -> Visit record
 *   visits:user:<userId>              -> Array of visit IDs for a user
 *   call:<callId>                     -> Call record
 *   calls:user:<userId>               -> Array of call IDs for a user
 *   visit-unified-feedback:<visitId>  -> Full unified feedback snapshot
 *   call-unified-feedback:<callId>    -> Full unified feedback snapshot
 *   dealer-location-audit:<auditId>   -> Dealer location change audit record
 *   dealer-location-audits:<dealerId> -> Array of audit IDs for a dealer
 *
 * State machines:
 *   Visit: ACTIVE -> COMPLETED_NO_FEEDBACK -> CLOSED
 *   Call:  ACTIVE -> COMPLETED_NO_FEEDBACK -> CLOSED
 */

import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { requireAuth, requireRole, type AuthResult, type ValidRole } from "./auth_middleware.tsx";

const visitRoutes = new Hono();

// ── Apply auth middleware to all field-ops routes ──
visitRoutes.use("*", requireAuth());
// All field-ops routes allow KAM, TL, and ADMIN
visitRoutes.use("*", requireRole(["KAM", "TL", "ADMIN"]));

// ───────────────────────────────────────────────────────────────────────────
// SUPABASE STORAGE — visit-proofs bucket (private)
// ───────────────────────────────────────────────────────────────────────────

const BUCKET_NAME = "make-4efaad2c-visit-proofs";
let bucketReady = false;

async function ensureBucket(): Promise<ReturnType<typeof createClient>> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  if (!bucketReady) {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === BUCKET_NAME);
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: false });
      console.log(`[STORAGE] Created private bucket: ${BUCKET_NAME}`);
    }
    bucketReady = true;
  }
  return supabase;
}

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

interface VisitRecord {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  userId: string;
  kamName: string;
  status: "ACTIVE" | "COMPLETED_NO_FEEDBACK" | "CLOSED";
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
  // NOTE: photoSignedUrl is NEVER stored — generated on-the-fly in GET responses
  createdAt: string;
  updatedAt: string;
}

interface CallRecord {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  userId: string;
  kamName: string;
  status: "ACTIVE" | "COMPLETED_NO_FEEDBACK" | "CLOSED";
  startAt: string;
  endAt: string | null;
  durationSeconds: number | null;
  feedback: UnifiedFeedbackRecord | null;
  createdAt: string;
  updatedAt: string;
}

interface UnifiedFeedbackRecord {
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

interface AuditRecord {
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

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

async function getUserIds(prefix: string, userId: string): Promise<string[]> {
  const ids = await kv.get(`${prefix}:user:${userId}`);
  return Array.isArray(ids) ? ids : [];
}

async function saveUserId(prefix: string, userId: string, recordId: string): Promise<void> {
  const ids = await getUserIds(prefix, userId);
  if (!ids.includes(recordId)) {
    ids.unshift(recordId);
    await kv.set(`${prefix}:user:${userId}`, ids);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// POST /visits — Start a new visit
visitRoutes.post("/visits", async (c) => {
  try {
    const body = await c.req.json();
    const {
      id: clientId,
      dealerId, dealerName, dealerCode, dealerCity,
      userId, kamName, lat, lng,
      distanceAtStart, gpsAccuracyAtStart, geoVerified,
    } = body;

    if (!dealerId || !userId) {
      return c.json({ success: false, error: "dealerId and userId are required" }, 400);
    }

    // Check for existing ACTIVE or COMPLETED_NO_FEEDBACK visits
    const existingIds = await getUserIds("visits", userId);
    for (const vid of existingIds.slice(0, 20)) {
      const existing = await kv.get(`visit:${vid}`);
      if (existing && (existing.status === "ACTIVE" || existing.status === "COMPLETED_NO_FEEDBACK")) {
        return c.json({
          success: false,
          error: `Visit blocker: existing ${existing.status} visit (${existing.id}) at ${existing.dealerName}`,
          blockingVisit: existing,
        }, 409);
      }
    }

    const visitId = clientId || `visit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const visit: VisitRecord = {
      id: visitId,
      dealerId,
      dealerName: dealerName || "",
      dealerCode: dealerCode || "",
      dealerCity: dealerCity || "",
      userId,
      kamName: kamName || "User",
      status: "ACTIVE",
      startAt: now,
      endAt: null,
      distanceAtStart: distanceAtStart ?? null,
      gpsAccuracyAtStart: gpsAccuracyAtStart ?? null,
      geoVerified: geoVerified ?? false,
      lat: lat ?? null,
      lng: lng ?? null,
      feedback: null,
      photoPath: null,
      photoType: null,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`visit:${visitId}`, visit);
    await saveUserId("visits", userId, visitId);

    console.log(`[VISIT] Started visit ${visitId} for dealer ${dealerId} by user ${userId}`);
    return c.json({ success: true, data: visit }, 201);
  } catch (err: any) {
    console.log(`[VISIT ERROR] POST /visits: ${err.message}`);
    return c.json({ success: false, error: `Failed to start visit: ${err.message}` }, 500);
  }
});

// PATCH /visits/:id/end — End an active visit -> COMPLETED_NO_FEEDBACK
visitRoutes.patch("/visits/:id/end", async (c) => {
  try {
    const visitId = c.req.param("id");
    const visit: VisitRecord | null = await kv.get(`visit:${visitId}`);

    if (!visit) {
      return c.json({ success: false, error: `Visit ${visitId} not found` }, 404);
    }
    if (visit.status !== "ACTIVE") {
      return c.json({ success: false, error: `Visit ${visitId} is not ACTIVE (status: ${visit.status})` }, 409);
    }

    const now = new Date().toISOString();
    visit.status = "COMPLETED_NO_FEEDBACK";
    visit.endAt = now;
    visit.updatedAt = now;

    await kv.set(`visit:${visitId}`, visit);

    console.log(`[VISIT] Ended visit ${visitId} -> COMPLETED_NO_FEEDBACK`);
    return c.json({ success: true, data: visit });
  } catch (err: any) {
    console.log(`[VISIT ERROR] PATCH /visits/:id/end: ${err.message}`);
    return c.json({ success: false, error: `Failed to end visit: ${err.message}` }, 500);
  }
});

// POST /visits/:id/photo — Upload proof photo to Supabase Storage
visitRoutes.post("/visits/:id/photo", async (c) => {
  try {
    const visitId = c.req.param("id");
    const visit: VisitRecord | null = await kv.get(`visit:${visitId}`);
    if (!visit) {
      return c.json({ success: false, error: `Visit ${visitId} not found` }, 404);
    }

    const body = await c.req.json();
    const { base64Data, photoType, mimeType } = body;

    if (!base64Data || !photoType) {
      return c.json({ success: false, error: "base64Data and photoType are required" }, 400);
    }

    // Decode base64 to binary
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const binaryStr = atob(base64Clean);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const ext = (mimeType || "image/jpeg").split("/")[1] || "jpg";
    const filePath = `${visit.userId}/${visitId}/${Date.now()}.${ext}`;

    const supabase = await ensureBucket();

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType: mimeType || "image/jpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.log(`[STORAGE ERROR] Upload failed: ${uploadErr.message}`);
      return c.json({ success: false, error: `Photo upload failed: ${uploadErr.message}` }, 500);
    }

    // Create signed URL (valid 7 days)
    const { data: signedUrlData, error: signErr } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 7 * 24 * 60 * 60);

    const signedUrl = signedUrlData?.signedUrl || null;
    if (signErr) {
      console.log(`[STORAGE WARN] Signed URL failed: ${signErr.message}`);
    }

    // Update visit record with photo info
    visit.photoPath = filePath;
    visit.photoType = photoType;
    visit.updatedAt = new Date().toISOString();
    // NOTE: signedUrl is NOT stored in DB — only returned to caller for immediate use
    await kv.set(`visit:${visitId}`, visit);

    console.log(`[VISIT] Photo uploaded for visit ${visitId} — path: ${filePath}, type: ${photoType}`);
    return c.json({
      success: true,
      data: { photoPath: filePath, photoType, signedUrl },
    });
  } catch (err: any) {
    console.log(`[VISIT ERROR] POST /visits/:id/photo: ${err.message}`);
    return c.json({ success: false, error: `Photo upload failed: ${err.message}` }, 500);
  }
});

// PATCH /visits/:id/feedback — Submit unified feedback -> CLOSED
visitRoutes.patch("/visits/:id/feedback", async (c) => {
  try {
    const visitId = c.req.param("id");
    const body = await c.req.json();

    const visit: VisitRecord | null = await kv.get(`visit:${visitId}`);

    if (!visit) {
      return c.json({ success: false, error: `Visit ${visitId} not found` }, 404);
    }
    if (visit.status !== "COMPLETED_NO_FEEDBACK") {
      return c.json({
        success: false,
        error: `Visit ${visitId} is not in COMPLETED_NO_FEEDBACK state (status: ${visit.status})`,
      }, 409);
    }

    const { unifiedFeedback } = body;
    if (!unifiedFeedback || !unifiedFeedback.meetingPersonRole || !unifiedFeedback.rating) {
      return c.json({ success: false, error: "unifiedFeedback with meetingPersonRole and rating is required" }, 400);
    }

    const now = new Date().toISOString();

    const feedbackRecord: UnifiedFeedbackRecord = {
      interactionType: unifiedFeedback.interactionType || "VISIT",
      meetingPersonRole: unifiedFeedback.meetingPersonRole,
      meetingPersonOtherText: unifiedFeedback.meetingPersonOtherText || null,
      leadShared: !!unifiedFeedback.leadShared,
      leadStatus: unifiedFeedback.leadStatus || null,
      sellerLeadCount: unifiedFeedback.sellerLeadCount || 0,
      buyerLeadCount: unifiedFeedback.buyerLeadCount || 0,
      inspectionExpected: unifiedFeedback.inspectionExpected ?? null,
      dcfDiscussed: !!unifiedFeedback.dcfDiscussed,
      dcfStatus: unifiedFeedback.dcfStatus || null,
      dcfCreditRange: unifiedFeedback.dcfCreditRange || null,
      dcfDocsCollected: unifiedFeedback.dcfDocsCollected || [],
      note: unifiedFeedback.note || "",
      rating: unifiedFeedback.rating,
      photoPath: visit.photoPath,
      photoType: visit.photoType,
      submittedAt: now,
    };

    visit.status = "CLOSED";
    visit.feedback = feedbackRecord;
    visit.updatedAt = now;

    await kv.set(`visit:${visitId}`, visit);
    // Also store standalone feedback record for analytics
    await kv.set(`visit-unified-feedback:${visitId}`, {
      visitId,
      ...feedbackRecord,
    });

    console.log(`[VISIT] Feedback submitted for visit ${visitId} -> CLOSED (rating: ${feedbackRecord.rating})`);
    return c.json({ success: true, data: visit });
  } catch (err: any) {
    console.log(`[VISIT ERROR] PATCH /visits/:id/feedback: ${err.message}`);
    return c.json({ success: false, error: `Failed to submit feedback: ${err.message}` }, 500);
  }
});

// GET /visits?userId=xxx&from=ISO&to=ISO — List visits, optionally time-filtered
visitRoutes.get("/visits", async (c) => {
  try {
    const userId = c.req.query("userId");
    if (!userId) {
      return c.json({ success: false, error: "userId query param required" }, 400);
    }

    const from = c.req.query("from");
    const to = c.req.query("to");

    const ids = await getUserIds("visits", userId);
    if (ids.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const visitKeys = ids.slice(0, 100).map((id: string) => `visit:${id}`);
    const visits = await kv.mget(visitKeys);

    let validVisits = visits.filter((v: any) => v != null);

    // Time-filter if from/to provided
    if (from) {
      const fromTs = new Date(from).getTime();
      validVisits = validVisits.filter((v: any) => {
        const t = v.startAt || v.createdAt;
        return t && new Date(t).getTime() >= fromTs;
      });
    }
    if (to) {
      const toTs = new Date(to).getTime() + 24 * 60 * 60 * 1000; // end of day
      validVisits = validVisits.filter((v: any) => {
        const t = v.startAt || v.createdAt;
        return t && new Date(t).getTime() <= toTs;
      });
    }

    // Generate fresh signed URLs for any visits with photoPath (TTL-safe)
    const visitsWithPhotos = validVisits.filter((v: any) => v.photoPath);
    if (visitsWithPhotos.length > 0) {
      try {
        const supabase = await ensureBucket();
        for (const v of visitsWithPhotos) {
          const { data: signedUrlData } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(v.photoPath, 7 * 24 * 60 * 60); // 7 days
          (v as any).photoSignedUrl = signedUrlData?.signedUrl || null;
        }
      } catch (urlErr: any) {
        console.log(`[VISIT WARN] Failed to generate signed URLs for GET /visits: ${urlErr.message}`);
        // Continue without signed URLs — clients can request them individually
      }
    }

    return c.json({ success: true, data: validVisits });
  } catch (err: any) {
    console.log(`[VISIT ERROR] GET /visits: ${err.message}`);
    return c.json({ success: false, error: `Failed to fetch visits: ${err.message}` }, 500);
  }
});

// GET /visits/blocker?userId=xxx — Check if a new interaction is blocked (visits + calls)
visitRoutes.get("/visits/blocker", async (c) => {
  try {
    const userId = c.req.query("userId");
    if (!userId) {
      return c.json({ success: false, error: "userId query param required" }, 400);
    }

    // 1. Check visits for ACTIVE or COMPLETED_NO_FEEDBACK
    const visitIds = await getUserIds("visits", userId);
    for (const vid of visitIds.slice(0, 20)) {
      const visit: VisitRecord | null = await kv.get(`visit:${vid}`);
      if (!visit) continue;

      if (visit.status === "ACTIVE") {
        return c.json({
          success: true,
          data: {
            blocked: true,
            blockerType: "visit",
            reason: `You have an active visit at ${visit.dealerName}. End it before starting a new interaction.`,
            blockingVisit: visit,
            blockingCall: null,
            hasNoFeedback: false,
          },
        });
      }
      if (visit.status === "COMPLETED_NO_FEEDBACK") {
        return c.json({
          success: true,
          data: {
            blocked: true,
            blockerType: "visit",
            reason: `Please complete feedback for your visit to ${visit.dealerName} first.`,
            blockingVisit: visit,
            blockingCall: null,
            hasNoFeedback: true,
          },
        });
      }
    }

    // 2. Check calls for COMPLETED_NO_FEEDBACK
    const callIds = await getUserIds("calls", userId);
    for (const cid of callIds.slice(0, 20)) {
      const call: CallRecord | null = await kv.get(`call:${cid}`);
      if (!call) continue;

      if (call.status === "COMPLETED_NO_FEEDBACK") {
        return c.json({
          success: true,
          data: {
            blocked: true,
            blockerType: "call",
            reason: `Please complete feedback for your call to ${call.dealerName} first.`,
            blockingVisit: null,
            blockingCall: call,
            hasNoFeedback: true,
          },
        });
      }
    }

    return c.json({
      success: true,
      data: { blocked: false, blockerType: null, reason: null, blockingVisit: null, blockingCall: null, hasNoFeedback: false },
    });
  } catch (err: any) {
    console.log(`[VISIT ERROR] GET /visits/blocker: ${err.message}`);
    return c.json({ success: false, error: `Failed to check blocker: ${err.message}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CALL ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// POST /calls — Start/register a new call
visitRoutes.post("/calls", async (c) => {
  try {
    const body = await c.req.json();
    const {
      id: clientId,
      dealerId, dealerName, dealerCode, dealerCity,
      userId, kamName, durationSeconds,
    } = body;

    if (!dealerId || !userId) {
      return c.json({ success: false, error: "dealerId and userId are required" }, 400);
    }

    const callId = clientId || `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const call: CallRecord = {
      id: callId,
      dealerId,
      dealerName: dealerName || "",
      dealerCode: dealerCode || "",
      dealerCity: dealerCity || "",
      userId,
      kamName: kamName || "User",
      status: "COMPLETED_NO_FEEDBACK",
      startAt: now,
      endAt: now,
      durationSeconds: durationSeconds ?? null,
      feedback: null,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`call:${callId}`, call);
    await saveUserId("calls", userId, callId);

    console.log(`[CALL] Registered call ${callId} for dealer ${dealerId} by user ${userId}`);
    return c.json({ success: true, data: call }, 201);
  } catch (err: any) {
    console.log(`[CALL ERROR] POST /calls: ${err.message}`);
    return c.json({ success: false, error: `Failed to register call: ${err.message}` }, 500);
  }
});

// PATCH /calls/:id/feedback — Submit call feedback -> CLOSED
visitRoutes.patch("/calls/:id/feedback", async (c) => {
  try {
    const callId = c.req.param("id");
    const body = await c.req.json();

    const call: CallRecord | null = await kv.get(`call:${callId}`);

    if (!call) {
      return c.json({ success: false, error: `Call ${callId} not found` }, 404);
    }
    if (call.status === "CLOSED") {
      return c.json({ success: false, error: `Call ${callId} already has feedback (status: CLOSED)` }, 409);
    }

    const { unifiedFeedback } = body;
    if (!unifiedFeedback || !unifiedFeedback.meetingPersonRole || !unifiedFeedback.rating) {
      return c.json({ success: false, error: "unifiedFeedback with meetingPersonRole and rating is required" }, 400);
    }

    const now = new Date().toISOString();

    const feedbackRecord: UnifiedFeedbackRecord = {
      interactionType: "CALL",
      meetingPersonRole: unifiedFeedback.meetingPersonRole,
      meetingPersonOtherText: unifiedFeedback.meetingPersonOtherText || null,
      leadShared: !!unifiedFeedback.leadShared,
      leadStatus: unifiedFeedback.leadStatus || null,
      sellerLeadCount: unifiedFeedback.sellerLeadCount || 0,
      buyerLeadCount: unifiedFeedback.buyerLeadCount || 0,
      inspectionExpected: unifiedFeedback.inspectionExpected ?? null,
      dcfDiscussed: !!unifiedFeedback.dcfDiscussed,
      dcfStatus: unifiedFeedback.dcfStatus || null,
      dcfCreditRange: unifiedFeedback.dcfCreditRange || null,
      dcfDocsCollected: unifiedFeedback.dcfDocsCollected || [],
      note: unifiedFeedback.note || "",
      rating: unifiedFeedback.rating,
      photoPath: null,
      photoType: null,
      submittedAt: now,
    };

    call.status = "CLOSED";
    call.feedback = feedbackRecord;
    call.updatedAt = now;

    await kv.set(`call:${callId}`, call);
    await kv.set(`call-unified-feedback:${callId}`, {
      callId,
      ...feedbackRecord,
    });

    console.log(`[CALL] Feedback submitted for call ${callId} -> CLOSED (rating: ${feedbackRecord.rating})`);
    return c.json({ success: true, data: call });
  } catch (err: any) {
    console.log(`[CALL ERROR] PATCH /calls/:id/feedback: ${err.message}`);
    return c.json({ success: false, error: `Failed to submit call feedback: ${err.message}` }, 500);
  }
});

// GET /calls?userId=xxx&from=ISO&to=ISO — List calls for a user
visitRoutes.get("/calls", async (c) => {
  try {
    const userId = c.req.query("userId");
    if (!userId) {
      return c.json({ success: false, error: "userId query param required" }, 400);
    }

    const from = c.req.query("from");
    const to = c.req.query("to");

    const ids = await getUserIds("calls", userId);
    if (ids.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const callKeys = ids.slice(0, 100).map((id: string) => `call:${id}`);
    const calls = await kv.mget(callKeys);

    let validCalls = calls.filter((c: any) => c != null);

    if (from) {
      const fromTs = new Date(from).getTime();
      validCalls = validCalls.filter((c: any) => {
        const t = c.startAt || c.createdAt;
        return t && new Date(t).getTime() >= fromTs;
      });
    }
    if (to) {
      const toTs = new Date(to).getTime() + 24 * 60 * 60 * 1000;
      validCalls = validCalls.filter((c: any) => {
        const t = c.startAt || c.createdAt;
        return t && new Date(t).getTime() <= toTs;
      });
    }

    return c.json({ success: true, data: validCalls });
  } catch (err: any) {
    console.log(`[CALL ERROR] GET /calls: ${err.message}`);
    return c.json({ success: false, error: `Failed to fetch calls: ${err.message}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DEALER LOCATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// POST /dealer-location — Update dealer location with audit trail
visitRoutes.post("/dealer-location", async (c) => {
  try {
    const body = await c.req.json();
    const {
      dealerId, dealerName,
      oldLat, oldLng, newLat, newLng,
      userId, userName,
      reason, reasonNote,
      gpsAccuracy,
    } = body;

    if (!dealerId || !userId || !reason) {
      return c.json({ success: false, error: "dealerId, userId, and reason are required" }, 400);
    }

    const auditId = `loc-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const audit: AuditRecord = {
      id: auditId,
      dealerId,
      dealerName: dealerName || "",
      oldLat: oldLat ?? 0,
      oldLng: oldLng ?? 0,
      newLat: newLat ?? 0,
      newLng: newLng ?? 0,
      userId,
      userName: userName || "",
      timestamp: now,
      reason,
      reasonNote: reasonNote || null,
      gpsAccuracy: gpsAccuracy ?? null,
    };

    await kv.set(`dealer-location-audit:${auditId}`, audit);

    const auditListKey = `dealer-location-audits:${dealerId}`;
    const existingAudits = await kv.get(auditListKey);
    const auditIds = Array.isArray(existingAudits) ? existingAudits : [];
    auditIds.unshift(auditId);
    await kv.set(auditListKey, auditIds);

    await kv.set(`dealer-location:${dealerId}`, {
      lat: newLat,
      lng: newLng,
      updatedAt: now,
      updatedBy: userId,
    });

    console.log(`[AUDIT] Dealer location updated: ${dealerId} by ${userId} — reason: ${reason}`);
    return c.json({ success: true, data: audit }, 201);
  } catch (err: any) {
    console.log(`[AUDIT ERROR] POST /dealer-location: ${err.message}`);
    return c.json({ success: false, error: `Failed to update dealer location: ${err.message}` }, 500);
  }
});

// GET /dealer-location/audit?dealerId=xxx — Get audit trail for a dealer
visitRoutes.get("/dealer-location/audit", async (c) => {
  try {
    const dealerId = c.req.query("dealerId");
    if (!dealerId) {
      return c.json({ success: false, error: "dealerId query param required" }, 400);
    }

    const auditIds = await kv.get(`dealer-location-audits:${dealerId}`);
    if (!Array.isArray(auditIds) || auditIds.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const auditKeys = auditIds.slice(0, 50).map((id: string) => `dealer-location-audit:${id}`);
    const audits = await kv.mget(auditKeys);

    return c.json({ success: true, data: audits.filter((a: any) => a != null) });
  } catch (err: any) {
    console.log(`[AUDIT ERROR] GET /dealer-location/audit: ${err.message}`);
    return c.json({ success: false, error: `Failed to fetch audit trail: ${err.message}` }, 500);
  }
});

export default visitRoutes;