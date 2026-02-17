/**
 * Visit-related UI types
 *
 * Extracted from /components/pages/UnifiedVisitsPage.tsx during Phase 2B
 * orphan cluster cleanup (Feb 9, 2026). These types are used by visit
 * sub-components that were part of the UnifiedVisitsPage feature.
 */

export type DealerType = 'top' | 'tagged' | 'untagged';
export type VisitStatus = 'not-started' | 'in-progress' | 'completed';

export interface Dealer {
  id: string;
  name: string;
  code: string;
  type: DealerType;
  category: string;
  address: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
  distance?: string;
  distanceMeters?: number;
  rating?: number;
  reviewCount?: number;
  leadsMTD?: number;
  sisMTD?: number;
  isGMBProspect?: boolean;
}

export interface Visit {
  id: string;
  dealer: Dealer;
  status: VisitStatus;
  scheduledTime?: string;
  checkInTime?: string;
  checkOutTime?: string;
  purpose?: string[];
  notes?: string;
  meetingPerson?: string;
  photos?: string[];
}
