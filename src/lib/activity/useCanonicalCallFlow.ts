/**
 * useCanonicalCallFlow — single source of truth for the KAM Call action.
 *
 * Used by both KAMStartTab and DealerDetailPageV2 so the dial → tel: →
 * UnifiedFeedbackModal → submitCallFeedback flow stays in lockstep.
 *
 * Persistence model:
 *   1. dial-time: addCall() in ActivityContext optimistically pushes a
 *      CallAttempt with productiveStatus='pending' AND synchronously
 *      invokes visit.api.registerCall to insert a row in `call_events`
 *      with a real crypto.randomUUID() id.
 *   2. submit-time: submitCallFeedback UPDATES the existing row matched
 *      by that UUID. We must NOT call registerCall again here — doing
 *      so previously caused a crash because the fallback id was a
 *      non-UUID `call-${Date.now()}` which failed the UUID_RE guard
 *      in visit.api.ts and rejected the request.
 *   3. close-without-submit: the pending row already exists, so the
 *      Pending metric in Activity reflects it on the next refresh.
 */

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { useActivity } from '../../contexts/ActivityContext';
import { useAuth } from '../../components/auth/AuthProvider';
import * as visitApi from '../../api/visit.api';
import type { UnifiedFeedbackData } from '../../components/activity/visitHelpers';

const EMPTY_SNAPSHOT = {
  leads: 0,
  inspections: 0,
  stockIns: 0,
  dcfLeads: 0,
  dcfOnboarded: 0,
  dcfDisbursed: 0,
};

export interface CallTarget {
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity?: string;
  phone?: string;
}

export interface PendingCall {
  id: string;
  dealerName: string;
}

export function useCanonicalCallFlow(opts?: { origin?: 'dealer_detail' | 'kam_start' }) {
  const origin = opts?.origin ?? 'kam_start';
  const { addCall, updateCall, refresh: refreshActivity } = useActivity();
  const { activeActor } = useAuth();
  const callStartRef = useRef<number>(0);
  const [pendingCall, setPendingCall] = useState<PendingCall | null>(null);

  const startCall = useCallback(
    (target: CallTarget) => {
      const phone = target.phone || '+919876543210';
      callStartRef.current = Date.now();

      // Open device dialer
      try {
        window.open(`tel:${phone}`, '_self');
      } catch {
        /* noop — non-mobile env */
      }

      // Persist on dial — addCall internally invokes visitApi.registerCall
      // with a real UUID and seeds productiveStatus='pending'.
      const newCall = addCall({
        dealerId: target.dealerId,
        dealerName: target.dealerName,
        dealerCode: target.dealerCode,
        dealerCity: target.dealerCity || '',
        kamName: activeActor?.name || 'Current User',
        createdAt: new Date().toISOString(),
        status: 'pending-feedback',
        connected: false,
        tags: [],
        originContext: {
          origin,
          dealerId: target.dealerId,
          dealerName: target.dealerName,
          dealerCode: target.dealerCode,
        },
        beforeSnapshot: EMPTY_SNAPSHOT,
        afterSnapshot: EMPTY_SNAPSHOT,
        productiveStatus: 'pending',
      });

      // Show feedback sheet after the user returns from the dialer
      setTimeout(
        () => setPendingCall({ id: newCall.id, dealerName: target.dealerName }),
        800,
      );
    },
    [addCall, activeActor, origin],
  );

  const closeFeedback = useCallback(() => {
    setPendingCall(null);
    refreshActivity();
  }, [refreshActivity]);

  const submitFeedback = useCallback(
    async (data: UnifiedFeedbackData) => {
      if (!pendingCall) return;
      const callId = pendingCall.id;
      updateCall(callId, {
        status: 'completed',
        connected: true,
        outcome: `Rating: ${data.rating}/5 | Met: ${data.meetingPersonRole}`,
        notes: data.note || 'Feedback submitted',
        duration: Math.max(1, Math.floor((Date.now() - callStartRef.current) / 1000)),
        productiveStatus: data.leadShared ? 'productive' : 'non_productive',
        productiveReason: data.leadShared ? 'Lead discussion during call' : 'Standard call',
      });
      setPendingCall(null);
      toast.success('Call feedback saved');

      try {
        // IMPORTANT: do NOT call registerCall here — the row already
        // exists from dial-time addCall(). submitCallFeedback UPDATEs.
        await visitApi.submitCallFeedback(callId, {
          interactionType: 'CALL',
          meetingPersonRole: data.meetingPersonRole,
          meetingPersonOtherText: data.meetingPersonOtherText,
          leadShared: data.leadShared,
          leadStatus: data.leadStatus,
          sellerLeadCount: data.sellerLeadCount,
          buyerLeadCount: data.buyerLeadCount,
          inspectionExpected: data.inspectionExpected,
          dcfDiscussed: data.dcfDiscussed,
          dcfStatus: data.dcfStatus,
          dcfCreditRange: data.dcfCreditRange,
          dcfDocsCollected: data.dcfDocsCollected,
          note: data.note,
          rating: data.rating,
        });
        refreshActivity();
      } catch (err) {
        console.error('[useCanonicalCallFlow] Failed to persist call feedback:', err);
        toast.info('Feedback queued');
      }
    },
    [pendingCall, updateCall, refreshActivity],
  );

  return { pendingCall, startCall, closeFeedback, submitFeedback };
}
