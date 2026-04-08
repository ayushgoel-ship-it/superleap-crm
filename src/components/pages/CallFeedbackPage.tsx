/**
 * CALL FEEDBACK PAGE — Uses UnifiedFeedbackForm for consistent data shape.
 *
 * Renders the unified 6-section feedback form in CALL mode.
 * CALL mode: photo NOT required, meeting person + rating required.
 *
 * Persists to DB via /field-ops/calls/:id/feedback.
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Phone, Clock } from 'lucide-react';
import { useActivity } from '../../contexts/ActivityContext';
import { useAuth } from '../auth/AuthProvider';
import { UnifiedFeedbackForm } from '../activity/UnifiedFeedbackForm';
import type { UnifiedFeedbackData } from '../activity/visitHelpers';
import * as visitApi from '../../api/visit.api';
import { toast } from 'sonner@2.0.3';

interface CallFeedbackPageProps {
  callId: string;
  onBack: () => void;
}

export function CallFeedbackPage({ callId, onBack }: CallFeedbackPageProps) {
  const { calls, updateCall, refresh: refreshActivity } = useActivity();
  const { activeActor } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const callAttempt = calls.find(c => c.id === callId);

  useEffect(() => {
    if (!callAttempt) {
      toast.error('Call not found');
      onBack();
    }
  }, [callAttempt, onBack]);

  if (!callAttempt) {
    return null;
  }

  const callDuration = callAttempt.duration
    ? `${Math.floor(callAttempt.duration / 60)}m ${callAttempt.duration % 60}s`
    : 'N/A';
  const callTime = new Date(callAttempt.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSubmit = async (data: UnifiedFeedbackData) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // 1. Update local ActivityContext (backward-compatible)
      const outcomeDetails: string[] = [`Rating: ${data.rating}/5`];
      if (data.meetingPersonRole) outcomeDetails.push(`Met: ${data.meetingPersonRole}`);
      if (data.leadShared && data.leadStatus) outcomeDetails.push(`Leads: ${data.leadStatus}`);
      if (data.dcfDiscussed && data.dcfStatus) outcomeDetails.push(`DCF: ${data.dcfStatus}`);

      updateCall(callId, {
        status: 'completed',
        connected: true,
        outcome: outcomeDetails.join(' | '),
        notes: data.note || 'Feedback submitted',
        productiveStatus: data.leadShared ? 'productive' : 'pending',
        productiveReason: data.leadShared ? 'Lead discussion during call' : undefined,
      });

      // 2. Register call in DB if not yet persisted, then submit feedback
      try {
        await visitApi.registerCall({
          id: callId,
          dealerId: callAttempt.dealerId,
          dealerName: callAttempt.dealerName,
          dealerCode: callAttempt.dealerCode,
          dealerCity: callAttempt.dealerCity,
          userId: activeActor?.userId || '',
          kamName: callAttempt.kamName || 'Current User',
          durationSeconds: callAttempt.duration,
        });
      } catch (regErr: any) {
        // If call already exists (409), that's fine — proceed to feedback
        if (!regErr.message?.includes('409')) {
          console.error('[CallFeedback] Failed to register call in DB:', regErr);
        }
      }

      // 3. Submit unified feedback to DB
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

      toast.success('Call feedback submitted', {
        description: `${callAttempt.dealerName} — Rating: ${data.rating}/5`,
      });
      refreshActivity();
    } catch (err: any) {
      console.error('[CallFeedback] DB persist failed:', err);
      // Local state already updated — toast warning
      toast.warning('Feedback saved locally', {
        description: 'Server sync will retry later',
      });
    } finally {
      setSubmitting(false);
      onBack();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-slate-900">Call Feedback</h1>
            <p className="text-[11px] text-slate-500">
              {callAttempt.dealerName} ({callAttempt.dealerCode})
            </p>
          </div>
        </div>

        {/* Call summary strip */}
        <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" /> {callTime}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {callDuration}
          </span>
          <span className="text-slate-400">{callAttempt.dealerCity}</span>
        </div>
      </div>

      {/* Unified Feedback Form in CALL mode */}
      <div className="flex-1 overflow-y-auto p-4">
        <UnifiedFeedbackForm
          interactionType="CALL"
          dealerName={callAttempt.dealerName}
          onSubmit={handleSubmit}
          onCancel={onBack}
          closeable
        />
      </div>
    </div>
  );
}