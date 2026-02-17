/**
 * CALL ATTEMPT ENGINE
 * 
 * Centralized logic for managing call attempts and feedback.
 * Single source of truth for call lifecycle.
 */

import { generateId } from '../utils/idGenerator';

export type CallAttemptStatus = 'ATTEMPTED' | 'COMPLETED';
export type FeedbackStatus = 'PENDING' | 'SUBMITTED';
export type RecordingStatus = 'AVAILABLE' | 'NOT_AVAILABLE' | 'PROCESSING';
export type CallOutcome = 'connected' | 'not_reachable' | 'busy' | 'callback_requested' | 'switched_off';

export interface CallAttempt {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode?: string;
  kamId: string;
  kamName: string;
  tlId?: string;
  phone?: string;
  timestamp: string;
  status: CallAttemptStatus;
  feedbackStatus: FeedbackStatus;
  recordingStatus: RecordingStatus;
  duration?: number; // seconds
  
  // Feedback data (populated after submission)
  outcome?: CallOutcome;
  connected?: boolean;
  carSell?: boolean;
  dcfInterest?: boolean;
  notes?: string;
  nextAction?: string;
  tags?: string[];
  
  // Productivity (computed after feedback)
  isProductive?: boolean;
  productivityReason?: string;
  
  // Context
  originContext?: {
    origin: 'dealer_detail' | 'dealer_list' | 'vc_page' | 'today_tab';
    dealerId?: string;
    [key: string]: any;
  };
}

export interface CallFeedbackPayload {
  outcome: CallOutcome;
  connected: boolean;
  carSell?: boolean;
  dcfInterest?: boolean;
  notes?: string;
  nextAction?: string;
  tags?: string[];
}

/**
 * Start a new call attempt
 */
export function startCallAttempt(params: {
  dealerId: string;
  dealerName: string;
  dealerCode?: string;
  kamId: string;
  kamName: string;
  tlId?: string;
  phone?: string;
  originContext?: CallAttempt['originContext'];
}): { callId: string; callAttempt: CallAttempt } {
  const callId = generateId('CALL');
  
  const callAttempt: CallAttempt = {
    id: callId,
    dealerId: params.dealerId,
    dealerName: params.dealerName,
    dealerCode: params.dealerCode,
    kamId: params.kamId,
    kamName: params.kamName,
    tlId: params.tlId,
    phone: params.phone,
    timestamp: new Date().toISOString(),
    status: 'ATTEMPTED',
    feedbackStatus: 'PENDING',
    recordingStatus: 'AVAILABLE', // Mock: assume recording always available
    originContext: params.originContext,
  };
  
  return { callId, callAttempt };
}

/**
 * Submit call feedback
 */
export function submitCallFeedback(
  callAttempt: CallAttempt,
  feedback: CallFeedbackPayload
): CallAttempt {
  const updated: CallAttempt = {
    ...callAttempt,
    status: 'COMPLETED',
    feedbackStatus: 'SUBMITTED',
    outcome: feedback.outcome,
    connected: feedback.connected,
    carSell: feedback.carSell,
    dcfInterest: feedback.dcfInterest,
    notes: feedback.notes,
    nextAction: feedback.nextAction,
    tags: feedback.tags,
  };
  
  // Compute productivity based on feedback
  const productivity = evaluateCallProductivity(feedback);
  updated.isProductive = productivity.isProductive;
  updated.productivityReason = productivity.reason;
  
  return updated;
}

/**
 * Evaluate if call is productive based on feedback
 */
function evaluateCallProductivity(feedback: CallFeedbackPayload): {
  isProductive: boolean;
  reason?: string;
} {
  // Connected calls are more likely productive
  if (!feedback.connected) {
    return { isProductive: false, reason: 'Not connected' };
  }
  
  // Explicit productivity indicators
  if (feedback.carSell) {
    return { isProductive: true, reason: 'Car sell commitment' };
  }
  
  if (feedback.dcfInterest) {
    return { isProductive: true, reason: 'DCF interest expressed' };
  }
  
  // Connected + positive outcome
  if (feedback.outcome === 'connected' && feedback.notes && feedback.notes.length > 20) {
    return { isProductive: true, reason: 'Connected with meaningful discussion' };
  }
  
  // Default: connected but no strong signal
  return { isProductive: false, reason: 'Connected but no concrete outcome' };
}

/**
 * Mock call duration (for demo)
 */
export function generateMockCallDuration(): number {
  return Math.floor(Math.random() * 300) + 60; // 60-360 seconds
}
