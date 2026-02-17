/**
 * ACTIVITY DATA CONTRACT (Calls & Visits)
 * 
 * UI components must consume only these DTOs.
 * Flow: mockDatabase → selectors → ActivityDTO → UI
 */

/**
 * Call DTO - Complete call information for UI
 */
export interface CallDTO {
  // Identity
  id: string;
  callDate: Date;
  callTime: string;
  duration: string;
  
  // Dealer context
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  
  // Ownership
  kamId: string;
  kamName: string;
  tlId: string;
  
  // Outcome
  outcome: 'Connected' | 'No Answer' | 'Busy' | 'Left VM';
  isProductive: boolean;
  productivitySource: 'AI' | 'KAM' | 'TL';
  
  // Analysis
  transcript?: string;
  sentimentScore?: number;
  sentimentLabel?: 'Positive' | 'Neutral' | 'Negative';
  autoTags?: string[];
  
  // Follow-up
  kamComments?: string;
  followUpTasks?: string[];
  recordingUrl?: string;
}

/**
 * Visit DTO - Complete visit information for UI
 */
export interface VisitDTO {
  // Identity
  id: string;
  visitDate: Date;
  visitTime: string;
  duration: string;
  
  // Dealer context
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  
  // Ownership
  kamId: string;
  kamName: string;
  tlId: string;
  
  // Location
  checkInLocation: {
    latitude: number;
    longitude: number;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
  };
  distanceFromDealer: number; // in meters
  isWithinGeofence: boolean;
  
  // Outcome
  visitType: 'Planned' | 'Unplanned';
  isProductive: boolean;
  productivitySource: 'Geofence' | 'KAM' | 'TL';
  outcomes?: string[];
  
  // Follow-up
  kamComments?: string;
  followUpTasks?: string[];
}

/**
 * Call List Item DTO - Lightweight for list views
 */
export interface CallListItemDTO {
  id: string;
  dealerName: string;
  dealerCode: string;
  callDate: Date;
  duration: string;
  outcome: string;
  isProductive: boolean;
  kamName: string;
}

/**
 * Visit List Item DTO - Lightweight for list views
 */
export interface VisitListItemDTO {
  id: string;
  dealerName: string;
  dealerCode: string;
  visitDate: Date;
  duration: string;
  visitType: string;
  isProductive: boolean;
  kamName: string;
  isWithinGeofence: boolean;
}

/**
 * Call Detail DTO - Enhanced for detail screen
 */
export interface CallDetailDTO extends CallDTO {
  // Dealer snapshot
  dealer: {
    id: string;
    name: string;
    code: string;
    city: string;
    segment: string;
    phone?: string;
  };
  
  // Historical context
  previousCalls: number;
  previousProductiveCalls: number;
  daysSinceLastCall: number;
  
  // Productivity evidence
  productivityEvidence: {
    type: 'AI' | 'KAM' | 'TL';
    reason: string;
    confidence?: number;
    tags?: string[];
  };
}

/**
 * Visit Detail DTO - Enhanced for detail screen
 */
export interface VisitDetailDTO extends VisitDTO {
  // Dealer snapshot
  dealer: {
    id: string;
    name: string;
    code: string;
    city: string;
    segment: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // Historical context
  previousVisits: number;
  previousProductiveVisits: number;
  daysSinceLastVisit: number;
  
  // Geofence validation
  geofenceValidation: {
    isValid: boolean;
    distance: number; // meters
    threshold: number; // meters (e.g., 100m)
    accuracy: number; // GPS accuracy in meters
  };
  
  // Productivity evidence
  productivityEvidence: {
    type: 'Geofence' | 'KAM' | 'TL';
    reason: string;
    autoApproved: boolean;
  };
}

/**
 * Activity Timeline Item DTO - For timeline views
 */
export interface ActivityTimelineItemDTO {
  id: string;
  type: 'call' | 'visit';
  timestamp: Date;
  dealerName: string;
  dealerCode: string;
  isProductive: boolean;
  outcome: string;
  duration: string;
  kamName: string;
}

/**
 * Call Analytics DTO - For admin/TL dashboards
 */
export interface CallAnalyticsDTO {
  totalCalls: number;
  productiveCalls: number;
  productivityRate: number; // percentage
  avgDuration: string;
  
  byOutcome: {
    connected: number;
    noAnswer: number;
    busy: number;
    leftVM: number;
  };
  
  bySentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  
  trend: number[]; // 7-day trend
}

/**
 * Visit Analytics DTO - For admin/TL dashboards
 */
export interface VisitAnalyticsDTO {
  totalVisits: number;
  productiveVisits: number;
  productivityRate: number; // percentage
  avgDuration: string;
  
  byType: {
    planned: number;
    unplanned: number;
  };
  
  geofenceCompliance: {
    within: number;
    outside: number;
    complianceRate: number; // percentage
  };
  
  trend: number[]; // 7-day trend
}
