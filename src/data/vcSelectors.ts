/**
 * V/C (Visits & Calls) Selectors
 * 
 * Centralized selectors for V/C module with feedback support
 */

import { CALLS, VISITS } from './mockDatabase';
import { CallLog, VisitLog } from './types';
import { normalizeKAMId, normalizeTLId, normalizeDealerId } from './mockDatabase';

/**
 * Time scope helpers
 */
const getTimeScopeDate = (scope: string): Date => {
  const now = new Date();
  switch (scope) {
    case 'd-1':
    case 'today':
      return new Date(now.setDate(now.getDate() - 1));
    case 'last-7d':
      return new Date(now.setDate(now.getDate() - 7));
    case 'last-30d':
      return new Date(now.setDate(now.getDate() - 30));
    case 'last-60d':
      return new Date(now.setDate(now.getDate() - 60));
    default:
      return new Date(now.setDate(now.getDate() - 7));
  }
};

const isWithinScope = (dateStr: string, scope: string): boolean => {
  const date = new Date(dateStr);
  const scopeDate = getTimeScopeDate(scope);
  return date >= scopeDate;
};

/**
 * CALL SELECTORS
 */

export function getCallById(callId: string): CallLog | undefined {
  return CALLS.find(c => c.id === callId);
}

export function getTodayCalls(userId: string): CallLog[] {
  const normalizedId = normalizeKAMId(userId);
  const today = new Date().toISOString().split('T')[0];
  
  return CALLS.filter(c => 
    c.kamId === normalizedId && 
    c.callDate === today
  ).sort((a, b) => b.callTime.localeCompare(a.callTime));
}

export function getCallsByScope(userId: string, scope: string): CallLog[] {
  const normalizedId = normalizeKAMId(userId);
  
  return CALLS.filter(c => 
    c.kamId === normalizedId && 
    isWithinScope(c.callDate, scope)
  ).sort((a, b) => b.callDate.localeCompare(a.callDate));
}

export function getPendingCallFeedback(userId: string): CallLog[] {
  const normalizedId = normalizeKAMId(userId);
  
  return CALLS.filter(c => 
    c.kamId === normalizedId && 
    c.feedbackStatus === 'PENDING'
  );
}

/**
 * VISIT SELECTORS
 */

export function getVisitById(visitId: string): VisitLog | undefined {
  return VISITS.find(v => v.id === visitId);
}

export function getTodayVisits(userId: string): VisitLog[] {
  const normalizedId = normalizeKAMId(userId);
  const today = new Date().toISOString().split('T')[0];
  
  return VISITS.filter(v => 
    v.kamId === normalizedId && 
    v.visitDate === today &&
    v.status === 'COMPLETED'
  ).sort((a, b) => b.visitTime.localeCompare(a.visitTime));
}

export function getPendingVisits(userId: string): VisitLog[] {
  const normalizedId = normalizeKAMId(userId);
  
  return VISITS.filter(v => 
    v.kamId === normalizedId && 
    v.status === 'CHECKED_IN'
  ).sort((a, b) => (b.checkInAt || '').localeCompare(a.checkInAt || ''));
}

export function getVisitsByScope(userId: string, scope: string): VisitLog[] {
  const normalizedId = normalizeKAMId(userId);
  
  return VISITS.filter(v => 
    v.kamId === normalizedId && 
    v.status === 'COMPLETED' &&
    isWithinScope(v.visitDate, scope)
  ).sort((a, b) => b.visitDate.localeCompare(a.visitDate));
}

export function getPendingVisitFeedback(userId: string): VisitLog[] {
  const normalizedId = normalizeKAMId(userId);
  
  return VISITS.filter(v => 
    v.kamId === normalizedId && 
    v.feedbackStatus === 'PENDING'
  );
}

/**
 * V/C DETAIL DTOs - includes feedback + productivity
 */

export interface CallDetailDTO {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  callDate: string;
  callTime: string;
  duration: string;
  outcome: string;
  
  // Feedback
  feedbackStatus: 'PENDING' | 'SUBMITTED';
  feedbackData: CallLog['feedbackData'];
  feedbackSubmittedAt?: string;
  
  // Productivity (AI/system generated)
  isProductive: boolean;
  productivitySource: string;
  transcript?: string;
  sentimentScore?: number;
  sentimentLabel?: string;
  autoTags?: string[];
  kamComments?: string;
  followUpTasks?: string[];
  recordingUrl?: string;
}

export function getCallDetailDTO(callId: string): CallDetailDTO | null {
  const call = getCallById(callId);
  if (!call) return null;
  
  return {
    id: call.id,
    dealerId: call.dealerId,
    dealerName: call.dealerName,
    dealerCode: call.dealerCode,
    callDate: call.callDate,
    callTime: call.callTime,
    duration: call.duration,
    outcome: call.outcome,
    
    feedbackStatus: call.feedbackStatus || 'PENDING',
    feedbackData: call.feedbackData,
    feedbackSubmittedAt: call.feedbackSubmittedAt,
    
    isProductive: call.isProductive,
    productivitySource: call.productivitySource,
    transcript: call.transcript,
    sentimentScore: call.sentimentScore,
    sentimentLabel: call.sentimentLabel,
    autoTags: call.autoTags,
    kamComments: call.kamComments,
    followUpTasks: call.followUpTasks,
    recordingUrl: call.recordingUrl,
  };
}

export interface VisitDetailDTO {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  visitDate: string;
  visitTime: string;
  duration: string;
  visitType: string;
  status: string;
  checkInAt?: string;
  completedAt?: string;
  
  // Feedback
  feedbackStatus: 'PENDING' | 'SUBMITTED';
  feedbackData: VisitLog['feedbackData'];
  feedbackSubmittedAt?: string;
  
  // Productivity (system generated)
  isProductive: boolean;
  productivitySource: string;
  checkInLocation: { latitude: number; longitude: number };
  checkOutLocation?: { latitude: number; longitude: number };
  outcomes?: string[];
  kamComments?: string;
  followUpTasks?: string[];
}

export function getVisitDetailDTO(visitId: string): VisitDetailDTO | null {
  const visit = getVisitById(visitId);
  if (!visit) return null;
  
  return {
    id: visit.id,
    dealerId: visit.dealerId,
    dealerName: visit.dealerName,
    dealerCode: visit.dealerCode,
    visitDate: visit.visitDate,
    visitTime: visit.visitTime,
    duration: visit.duration,
    visitType: visit.visitType,
    status: visit.status || 'COMPLETED',
    checkInAt: visit.checkInAt,
    completedAt: visit.completedAt,
    
    feedbackStatus: visit.feedbackStatus || 'PENDING',
    feedbackData: visit.feedbackData,
    feedbackSubmittedAt: visit.feedbackSubmittedAt,
    
    isProductive: visit.isProductive,
    productivitySource: visit.productivitySource,
    checkInLocation: visit.checkInLocation,
    checkOutLocation: visit.checkOutLocation,
    outcomes: visit.outcomes,
    kamComments: visit.kamComments,
    followUpTasks: visit.followUpTasks,
  };
}

/**
 * UPDATE FUNCTIONS (for feedback submission)
 */

export function updateCallFeedback(callId: string, feedbackData: CallLog['feedbackData']): boolean {
  const call = CALLS.find(c => c.id === callId);
  if (!call) return false;
  
  call.feedbackData = feedbackData;
  call.feedbackStatus = 'SUBMITTED';
  call.feedbackSubmittedAt = new Date().toISOString();
  
  return true;
}

export function updateVisitFeedback(visitId: string, feedbackData: VisitLog['feedbackData']): boolean {
  const visit = VISITS.find(v => v.id === visitId);
  if (!visit) return false;
  
  visit.feedbackData = feedbackData;
  visit.feedbackStatus = 'SUBMITTED';
  visit.feedbackSubmittedAt = new Date().toISOString();
  visit.status = 'COMPLETED';
  visit.completedAt = new Date().toISOString();
  
  return true;
}

/**
 * CREATE FUNCTIONS (for new visits)
 */

export function createVisit(params: {
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  kamId: string;
  kamName: string;
  tlId: string;
  dealerLat: number;
  dealerLng: number;
}): string {
  const visitId = `visit-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  const now = new Date();
  
  const newVisit: VisitLog = {
    id: visitId,
    dealerId: params.dealerId,
    dealerName: params.dealerName,
    dealerCode: params.dealerCode,
    visitDate: now.toISOString().split('T')[0],
    visitTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    duration: '0m',
    kamId: params.kamId,
    kamName: params.kamName,
    tlId: params.tlId,
    checkInLocation: { latitude: params.dealerLat, longitude: params.dealerLng },
    isProductive: false,
    productivitySource: 'Geofence',
    visitType: 'Unplanned',
    status: 'NOT_STARTED',
    feedbackStatus: 'PENDING',
  };
  
  VISITS.push(newVisit);
  return visitId;
}

export function markVisitCheckedIn(visitId: string, userLat: number, userLng: number, distanceM: number): boolean {
  const visit = VISITS.find(v => v.id === visitId);
  if (!visit) return false;
  
  const now = new Date();
  visit.status = 'CHECKED_IN';
  visit.checkInAt = now.toISOString();
  visit.checkInLocation = { latitude: userLat, longitude: userLng };
  // Store distance for audit/debugging
  (visit as any).checkInDistanceM = distanceM;
  
  return true;
}

export function createVisitCheckIn(dealerId: string, dealerName: string, kamId: string, kamName: string, tlId: string): string {
  const visitId = `visit-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  const now = new Date();
  
  const newVisit: VisitLog = {
    id: visitId,
    dealerId,
    dealerName,
    dealerCode: '', // TODO: get from dealer
    visitDate: now.toISOString().split('T')[0],
    visitTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    duration: '0m',
    kamId,
    kamName,
    tlId,
    checkInLocation: { latitude: 0, longitude: 0 }, // TODO: get from GPS
    isProductive: false,
    productivitySource: 'Geofence',
    visitType: 'Unplanned',
    status: 'CHECKED_IN',
    checkInAt: now.toISOString(),
    feedbackStatus: 'PENDING',
  };
  
  VISITS.push(newVisit);
  return visitId;
}