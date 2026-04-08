/**
 * Visit Helpers — Shared types, constants, and pure functions for the Visits engine.
 *
 * Used by VisitsTabContent, VisitModals, DealerMapView.
 */

import type { Dealer } from '../../data/types';
import type { Visit } from '../../contexts/ActivityContext';
import { TimePeriod } from '../../lib/domain/constants';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Geo-fence radius in metres — visit only auto-verified within this */
export const GEO_FENCE_RADIUS_M = 200;

/** Maximum acceptable GPS accuracy in metres */
export const MAX_GPS_ACCURACY_M = 50;

/** Accuracy threshold for dealer location update */
export const UPDATE_LOCATION_ACCURACY_M = 20;

/** Fallback location (Gurgaon/NCR) for preview environments */
export const FALLBACK_LOCATION: UserLocation = { lat: 28.4700, lng: 77.0300 };

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number; // metres
}

export type TimeFilter = TimePeriod;
export type ListFilterKey = 'nearby' | 'feedback-pending' | 'no-visit-30d';
export type ViewMode = 'list' | 'map';

export type VisitLifecycleStatus =
  | 'NOT_STARTED'
  | 'ACTIVE'
  | 'COMPLETED_NO_FEEDBACK'
  | 'CLOSED';

export type LocationUpdateReason =
  | 'Dealer shifted'
  | 'Wrong pinned earlier'
  | 'Map error'
  | 'Other';

export const LOCATION_UPDATE_REASONS: LocationUpdateReason[] = [
  'Dealer shifted',
  'Wrong pinned earlier',
  'Map error',
  'Other',
];

export type LocationBlockedReason =
  | 'permissions-policy'
  | 'denied'
  | 'unavailable';

export interface LocationBlockedState {
  blocked: true;
  reason: LocationBlockedReason;
  errorMessage: string;
  userAgent: string;
}

export interface DealerWithDistance extends Dealer {
  distanceKm: number | null;
  distanceM: number | null;
  feedbackPending: boolean;
  lastVisitObj: Visit | null;
  markerColor: 'green' | 'red' | 'amber' | 'blue';
}

export interface ScoredDealer extends DealerWithDistance {
  score: number;
  reasons: string[];
}

export interface GeoFenceState {
  visible: boolean;
  dealerId: string;
  dealerName: string;
  distanceM: number;
  dealerLat: number;
  dealerLng: number;
}

export interface FeedbackFormData {
  meetingPerson: string;
  leadsDiscussed: number;
  inspectionCount: number;
  notes: string;
  nextAction: string;
  rating: number;
}

// ── Unified Feedback Types (Visit + Call) ──

export type InteractionType = 'VISIT' | 'CALL';

export type MeetingPersonRole =
  | 'Owner'
  | 'Manager'
  | 'Sales Executive'
  | 'Accountant'
  | 'Other';

export const MEETING_PERSON_ROLES: MeetingPersonRole[] = [
  'Owner',
  'Manager',
  'Sales Executive',
  'Accountant',
  'Other',
];

export type LeadSharingStatus =
  | 'Yes – Confirmed'
  | 'Promised'
  | 'Not Interested'
  | 'No Leads';

export const LEAD_SHARING_STATUSES: LeadSharingStatus[] = [
  'Yes – Confirmed',
  'Promised',
  'Not Interested',
  'No Leads',
];

export type DCFInterestStatus =
  | 'Very Interested'
  | 'Interested'
  | 'Follow-up Required'
  | 'Not Interested';

export const DCF_INTEREST_STATUSES: DCFInterestStatus[] = [
  'Very Interested',
  'Interested',
  'Follow-up Required',
  'Not Interested',
];

export type DCFCreditRange = '<5L' | '5–10L' | '10–25L' | '25L+';

export const DCF_CREDIT_RANGES: DCFCreditRange[] = [
  '<5L',
  '5–10L',
  '10–25L',
  '25L+',
];

export type DCFDocType = 'GST' | 'Bank' | 'KYC' | 'None';

export const DCF_DOC_TYPES: DCFDocType[] = ['GST', 'Bank', 'KYC', 'None'];

export type ProofPhotoType = 'With Owner' | 'Shop Front';

export interface UnifiedFeedbackData {
  interactionType: InteractionType;

  // Section 1: Proof (VISIT only)
  photoUrl: string | null;
  photoType: ProofPhotoType | null;
  photoTimestamp: string | null;
  geoVerified: boolean;

  // Section 2: Meeting Person
  meetingPersonRole: MeetingPersonRole;
  meetingPersonOtherText: string | null;

  // Section 3: Lead Sharing
  leadShared: boolean;
  leadStatus: LeadSharingStatus | null;
  sellerLeadCount: number;
  buyerLeadCount: number;
  inspectionExpected: boolean | null;

  // Section 4: DCF Discussion
  dcfDiscussed: boolean;
  dcfStatus: DCFInterestStatus | null;
  dcfCreditRange: DCFCreditRange | null;
  dcfDocsCollected: DCFDocType[];

  // Section 5: Short Note
  note: string;

  // Section 6: Rating
  rating: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTANCE
// ═══════════════════════════════════════════════════════════════════════════

/** Haversine distance in km */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Haversine distance in metres */
export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(lat1, lon1, lat2, lon2) * 1000;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMAT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function formatDistance(km: number | null): string {
  if (km == null) return '--';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export function formatDuration(checkIn: string, checkOut: string): string {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function dealerInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// DEALER MARKER COLOR
// ═══════════════════════════════════════════════════════════════════════════

export function getDealerMarkerColor(
  dealer: { feedbackPending: boolean; lastVisitDaysAgo: number; distanceKm: number | null },
): 'green' | 'red' | 'amber' | 'blue' {
  if (dealer.feedbackPending) return 'amber';
  if (dealer.lastVisitDaysAgo >= 30) return 'red';
  if (dealer.distanceKm != null && dealer.distanceKm <= 2) return 'blue';
  if (dealer.lastVisitDaysAgo <= 7) return 'green';
  return 'blue';
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING (SUGGESTED VISIT)
// ═══════════════════════════════════════════════════════════════════════════

export function scoreDealerForVisit(
  dealer: DealerWithDistance,
  activeVisitDealerIds: Set<string>,
): ScoredDealer {
  const isActive = dealer.status?.toLowerCase() === 'active';
  if (!isActive || activeVisitDealerIds.has(dealer.id)) {
    return { ...dealer, score: -1, reasons: [] };
  }

  let score = 0;
  const reasons: string[] = [];

  // Distance score
  if (dealer.distanceKm != null) {
    if (dealer.distanceKm <= 2) { score += 40; reasons.push('Nearby'); }
    else if (dealer.distanceKm <= 5) { score += 25; reasons.push('Nearby'); }
    else if (dealer.distanceKm <= 10) { score += 10; }
  }

  // No visit in 30d
  if (dealer.lastVisitDaysAgo >= 30) {
    score += 30;
    reasons.push(`No visit in ${dealer.lastVisitDaysAgo}d`);
  }

  // Churn risk
  const m30 = dealer.metrics['last-30d'];
  if (m30 && m30.leads === 0 && m30.inspections === 0) {
    score += 30;
    reasons.push('Churn risk');
  }

  // Segment bonus
  const seg = dealer.segment as string;
  if (seg === 'Platinum' || seg === 'A') { score += 15; reasons.push('High potential'); }
  else if (seg === 'Gold' || seg === 'B') { score += 10; }
  else if (seg === 'Silver' || seg === 'C') { score += 5; }

  // Feedback pending
  if (dealer.feedbackPending) {
    score += 20;
    reasons.push('Feedback pending');
  }

  return { ...dealer, score, reasons };
}

// ═══���═══════════════════════════════════════════════════════════════════════
// TIME FILTERING
// ═══════════════════════════════════════════════════════════════════════════

export function filterVisitsByTime(
  visits: Visit[],
  filter: TimeFilter,
  customRange?: { start: string; end: string },
): Visit[] {
  const now = Date.now();
  return visits.filter((v) => {
    const t = v.checkInTime || v.createdAt || v.scheduledTime;
    if (!t) return false;
    const ts = new Date(t).getTime();

    switch (filter) {
      case TimePeriod.TODAY: {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return ts >= startOfDay.getTime();
      }
      case TimePeriod.LAST_7D:
        return now - ts <= 7 * 24 * 60 * 60 * 1000;
      case TimePeriod.LAST_30D:
        return now - ts <= 30 * 24 * 60 * 60 * 1000;
      case TimePeriod.CUSTOM:
        if (!customRange) return true;
        return ts >= new Date(customRange.start).getTime() &&
               ts <= new Date(customRange.end).getTime() + 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIT LIFECYCLE CHECKS
// ═══════════════════════════════════════════════════════════════════════════

/** Returns the lifecycle status that should block or allow new visits. */
export function getVisitBlocker(visits: Visit[]): {
  blocked: boolean;
  reason: string | null;
  blockingVisit: Visit | null;
} {
  // Check for active visit
  const active = visits.find((v) => v.status === 'in-progress');
  if (active) {
    return {
      blocked: true,
      reason: `You have an active visit at ${active.dealerName}. End it before starting a new one.`,
      blockingVisit: active,
    };
  }

  // Check for completed visit with no feedback
  // Uses feedbackSubmitted flag (set explicitly on submit) as primary check
  const noFeedback = visits.find(
    (v) => v.status === 'completed' && !v.feedbackSubmitted && !v.outcome && !v.notes,
  );
  if (noFeedback) {
    return {
      blocked: true,
      reason: `Please complete feedback for your visit to ${noFeedback.dealerName} first.`,
      blockingVisit: noFeedback,
    };
  }

  return { blocked: false, reason: null, blockingVisit: null };
}