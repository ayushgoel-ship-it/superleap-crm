/**
 * VISIT ENGINE
 * 
 * Centralized state machine for visit lifecycle.
 * Single source of truth for visit status and transitions.
 */

import { generateId } from '../utils/idGenerator';

export type VisitStatus = 'NOT_STARTED' | 'CHECKED_IN' | 'COMPLETED';
export type VisitType = 'activation' | 'followup' | 'dcf_pitch' | 'issue_resolution' | 'relationship';

export interface Visit {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode?: string;
  dealerLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  kamId: string;
  kamName: string;
  tlId?: string;
  status: VisitStatus;
  
  // Check-in data
  checkInTime?: string;
  checkInLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  distanceFromDealer?: number; // meters
  
  // Completion data
  completionTime?: string;
  visitType?: VisitType;
  carSell?: boolean;
  dcfInterest?: boolean;
  notes?: string;
  nextAction?: string;
  tags?: string[];
  
  // Productivity
  isProductive?: boolean;
  productivityReason?: string;
  
  // Context
  originContext?: {
    origin: 'vc_page' | 'dealer_detail';
    [key: string]: any;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface VisitFeedbackPayload {
  visitType: VisitType;
  carSell?: boolean;
  dcfInterest?: boolean;
  notes?: string;
  nextAction?: string;
  tags?: string[];
}

export interface CheckInParams {
  dealerId: string;
  dealerName: string;
  dealerCode?: string;
  dealerLocation?: Visit['dealerLocation'];
  kamId: string;
  kamName: string;
  tlId?: string;
  checkInLocation: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  distanceFromDealer: number;
  originContext?: Visit['originContext'];
}

/**
 * Start a new visit (create record + check-in)
 */
export function startVisit(params: CheckInParams): { visitId: string; visit: Visit } {
  const visitId = generateId('VISIT');
  const now = new Date().toISOString();
  
  const visit: Visit = {
    id: visitId,
    dealerId: params.dealerId,
    dealerName: params.dealerName,
    dealerCode: params.dealerCode,
    dealerLocation: params.dealerLocation,
    kamId: params.kamId,
    kamName: params.kamName,
    tlId: params.tlId,
    status: 'CHECKED_IN',
    checkInTime: now,
    checkInLocation: params.checkInLocation,
    distanceFromDealer: params.distanceFromDealer,
    originContext: params.originContext,
    createdAt: now,
    updatedAt: now,
  };
  
  return { visitId, visit };
}

/**
 * Complete a visit with feedback
 */
export function completeVisit(
  visit: Visit,
  feedback: VisitFeedbackPayload
): Visit {
  const now = new Date().toISOString();
  
  const updated: Visit = {
    ...visit,
    status: 'COMPLETED',
    completionTime: now,
    visitType: feedback.visitType,
    carSell: feedback.carSell,
    dcfInterest: feedback.dcfInterest,
    notes: feedback.notes,
    nextAction: feedback.nextAction,
    tags: feedback.tags,
    updatedAt: now,
  };
  
  // Compute productivity
  const productivity = evaluateVisitProductivity(feedback);
  updated.isProductive = productivity.isProductive;
  updated.productivityReason = productivity.reason;
  
  return updated;
}

/**
 * Get all open (checked-in but not completed) visits for a KAM
 */
export function getOpenVisits(visits: Visit[], kamId: string): Visit[] {
  return visits.filter(
    v => v.kamId === kamId && v.status === 'CHECKED_IN'
  );
}

/**
 * Check if KAM is within allowed radius
 */
export function isWithinRadius(
  dealerLocation: { lat: number; lng: number },
  kamLocation: { lat: number; lng: number },
  maxRadiusMeters: number = 200
): { withinRadius: boolean; distance: number } {
  const distance = calculateDistance(
    dealerLocation.lat,
    dealerLocation.lng,
    kamLocation.lat,
    kamLocation.lng
  );
  
  return {
    withinRadius: distance <= maxRadiusMeters,
    distance: Math.round(distance),
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Evaluate if visit is productive based on feedback
 */
function evaluateVisitProductivity(feedback: VisitFeedbackPayload): {
  isProductive: boolean;
  reason?: string;
} {
  // Explicit productivity indicators
  if (feedback.carSell) {
    return { isProductive: true, reason: 'Car sell commitment obtained' };
  }
  
  if (feedback.dcfInterest) {
    return { isProductive: true, reason: 'DCF interest expressed' };
  }
  
  // Activation visits are typically productive
  if (feedback.visitType === 'activation') {
    return { isProductive: true, reason: 'Activation visit completed' };
  }
  
  // Visit with meaningful notes
  if (feedback.notes && feedback.notes.length > 30) {
    return { isProductive: true, reason: 'Meaningful engagement documented' };
  }
  
  // Default: visit happened but no strong signal
  return { isProductive: false, reason: 'Visit completed without concrete outcome' };
}
