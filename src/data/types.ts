/**
 * Data Types — Single Source of Truth for all entity interfaces
 *
 * All types used by mockDatabase, selectors, and UI components
 * are defined here. Do NOT define duplicate types elsewhere.
 */

// ============================================================================
// ENUMS & UNION TYPES
// ============================================================================

export type RegionKey = 'NCR' | 'West' | 'South' | 'East';

export type DealerSegment = 'A' | 'B' | 'C' | 'D';

export type DealerTag =
  | 'Top Dealer'
  | 'DCF Onboarded'
  | 'New Dealer'
  | 'Dormant'
  | 'At Risk'
  | 'Tagged Dealer'
  | 'High Potential';

export type LeadStage =
  | 'Lead Created'
  | '3CA Completed'
  | 'Inspection Scheduled'
  | 'Inspection Done'
  | 'HB Discovered'
  | 'OCB Stage'
  | 'PR Punched'
  | 'Stock-in'
  | 'Payout Done'
  | 'Lost'
  | string; // Allow custom stages

export type CallOutcome = 'Connected' | 'No Answer' | 'Busy' | 'Left VM';

export type VisitStatus = 'NOT_STARTED' | 'CHECKED_IN' | 'COMPLETED';

// ============================================================================
// DEALER
// ============================================================================

export interface DealerMetricPeriod {
  leads: number;
  inspections: number;
  sis: number;
  dcf: number;
}

export interface Dealer {
  id: string; // Format: dealer-<region>-<seq>
  name: string;
  code: string;
  city: string;
  region: RegionKey;
  kamId: string;
  kamName: string;
  tlId: string;
  lastVisit: string;
  lastContact: string;
  lastVisitDaysAgo: number;
  lastContactDaysAgo: number;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  metrics: {
    mtd: DealerMetricPeriod;
    'd-1': DealerMetricPeriod;
    today: DealerMetricPeriod;
    'last-7d': DealerMetricPeriod;
    'last-30d': DealerMetricPeriod;
    'last-6m': DealerMetricPeriod;
    lifetime: DealerMetricPeriod;
  };
  tags: string[];
  segment: DealerSegment;
  status: 'active' | 'inactive' | 'churned';
  /** KAM-set flag: true if KAM has marked this dealer as a Top Dealer */
  isTopDealer?: boolean;
}

// ============================================================================
// CALL LOG
// ============================================================================

export interface CallLog {
  id: string; // Format: call-<timestamp>-<seq>
  dealerId: string; // Foreign key to Dealer
  dealerName: string;
  dealerCode: string;
  callDate: string; // ISO date string
  callTime: string;
  duration: string; // e.g., "6m 12s"
  kamId: string;
  kamName: string;
  tlId: string;
  outcome: CallOutcome;
  isProductive: boolean;
  productivitySource: 'AI' | 'KAM' | 'TL';
  transcript?: string;
  sentimentScore?: number;
  sentimentLabel?: 'Positive' | 'Neutral' | 'Negative';
  autoTags?: string[];
  kamComments?: string;
  followUpTasks?: string[];
  recordingUrl?: string;

  // Call attempt tracking
  phone: string;
  callStartTime?: string; // ISO string
  callEndTime?: string | null; // ISO string
  durationSec?: number | null; // Duration in seconds
  callStatus: 'ATTEMPTED' | 'CONNECTED' | 'NOT_REACHABLE' | 'BUSY' | 'CALL_BACK';
  recordingStatus: 'AVAILABLE' | 'NOT_AVAILABLE';

  // Feedback fields
  feedbackStatus: 'PENDING' | 'SUBMITTED';
  feedbackSubmittedAt?: string; // ISO string
  feedback?: {
    callOutcome: 'CONNECTED' | 'NOT_REACHABLE' | 'BUSY' | 'CALL_BACK';
    carSell: {
      discussed: boolean;
      outcome?: 'AGREED_TO_SHARE' | 'ALREADY_SHARING' | 'HESITANT' | 'NOT_INTERESTED';
      expectedSellerLeadsPerWeek?: number | null;
      expectedInventoryLeadsPerWeek?: number | null;
    };
    dcf: {
      discussed: boolean;
      status?: 'ALREADY_ONBOARDED' | 'INTERESTED' | 'NEEDS_DEMO' | 'NOT_INTERESTED';
      expectedDCFLeadsPerMonth?: number | null;
    };
    notes?: string;
    nextActions?: {
      followUpCall?: boolean;
      scheduleVisit?: boolean;
      shareTraining?: boolean;
      scheduleDCFdemo?: boolean;
      followUpDate?: string | null; // ISO string
    };
  };

  // TL Review
  tlReview?: {
    comment?: string;
    flagged?: boolean;
    markedForReview?: boolean;
    reviewedAt?: string; // ISO string
    tlId?: string;
    tlName?: string;
  };
}

// ============================================================================
// VISIT LOG
// ============================================================================

export interface VisitLog {
  id: string; // Format: visit-<timestamp>-<seq>
  dealerId: string; // Foreign key to Dealer
  dealerName: string;
  dealerCode: string;
  visitDate: string; // ISO date string
  visitTime: string;
  duration: string;
  kamId: string;
  kamName: string;
  tlId: string;
  checkInLocation: {
    latitude: number;
    longitude: number;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
  };
  isProductive: boolean;
  productivitySource: 'Geofence' | 'KAM' | 'TL';
  visitType: 'Planned' | 'Unplanned';
  outcomes?: string[];
  kamComments?: string;
  followUpTasks?: string[];
  // Visit status
  status?: VisitStatus;
  checkInAt?: string;
  completedAt?: string;
  // Feedback fields
  feedbackStatus?: 'PENDING' | 'SUBMITTED';
  feedbackData?: {
    meetingPerson?: string;
    summary?: string;
    issues?: string[];
    nextActions?: string[];
    followUpDate?: string;
    visitPurpose?: string;
    visitOutcome?: string;
    dealerMood?: string;
    inventoryDiscussed?: boolean;
    expectedLeads?: string;
    dcfDiscussed?: boolean;
    dcfStatus?: string;
    notes?: string;
  };
  feedbackSubmittedAt?: string;
}

// ============================================================================
// DEALER LOCATION CHANGE REQUEST
// ============================================================================

export interface LocationChangeRequest {
  id: string; // Format: loc-req-<timestamp>-<seq>
  dealerId: string;
  dealerName: string;
  requestedBy: string; // KAM ID
  requestedByName: string;
  oldLocation: {
    latitude: number;
    longitude: number;
  } | null;
  newLocation: {
    latitude: number;
    longitude: number;
  };
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string; // TL ID
  decidedByName?: string;
  rejectionReason?: string;
}

// ============================================================================
// LEAD (C2B / C2D / GS)
// ============================================================================

export interface Lead {
  id: string; // Format: lead-<region>-<seq>
  dealerId: string; // Foreign key to Dealer
  dealerName: string;
  dealerCode: string;
  kamId: string;
  kamName: string;
  kamPhone?: string; // Added for UI display
  tlId: string;

  // Customer info
  customerName: string;
  customerPhone: string;

  // Vehicle info
  regNo?: string; // Registration number
  registrationNumber?: string; // Alias for regNo (backward compatibility)
  make: string; // Brand (Maruti, Hyundai, etc)
  model: string; // Model name (Swift, i20, etc)
  year: number;
  variant?: string;

  // Business info
  channel: 'C2B' | 'C2D' | 'GS';
  leadType: 'Seller' | 'Inventory';
  stage: string; // PR, PLL, Stock-in, Inspection Scheduled, etc
  currentStage?: string; // Alias for stage (backward compatibility)
  status: string; // Active, Converted, Lost, etc

  // Financial
  expectedRevenue: number; // Expected payout in rupees
  actualRevenue: number; // Actual payout earned (0 if not yet paid)
  cep?: number | null; // Customer Expected Price (for C2B/C2D/GS)
  cepConfidence?: 'confirmed' | 'estimated' | 'dealer_told' | 'approximate';
  cepNotes?: string;
  c24Quote?: number | null; // C24 internal quote (for pricing alignment)

  // Dates
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  inspectionDate?: string; // ISO string
  convertedAt?: string; // ISO string when deal closed

  // Metadata
  city: string;
  region: RegionKey;
}

// ============================================================================
// DCF LEAD
// ============================================================================

export interface DCFLead {
  id: string;
  customerName: string;
  customerPhone: string;
  pan?: string;
  city: string;
  regNo: string;
  car: string;
  carValue: number;
  ltv: number; // Loan-to-value percentage
  loanAmount: number;
  roi: number; // Rate of interest
  tenure: number; // Months
  emi: number;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  channel: string; // 'Dealer Shared' | 'CARS24 Generated'
  ragStatus: 'green' | 'amber' | 'red';
  bookFlag: 'Own Book' | 'Partner Book';
  carDocsFlag: 'Received' | 'Pending' | 'Partial';
  conversionOwner: string;
  conversionEmail: string;
  conversionPhone: string;
  kamId: string;
  kamName: string;
  tlId: string;
  firstDisbursalForDealer: boolean;
  commissionEligible: boolean;
  baseCommission: number;
  boosterApplied: boolean;
  totalCommission: number;
  currentFunnel: string;
  currentSubStage: string;
  overallStatus: string;
  createdAt: string;
  lastUpdatedAt: string;
  utr?: string;
  disbursalDate?: string;
  cibilScore?: number;
  cibilDate?: string;
  employmentType?: string;
  monthlyIncome?: number;
  dealerAccount?: string;
}

// ============================================================================
// TEAM LEAD
// ============================================================================

export interface TeamLead {
  id: string; // Format: tl-<region>-<seq>
  name: string;
  region: RegionKey;
  phone: string;
  email: string;
  kams: KAM[];
}

// ============================================================================
// KAM (Key Account Manager)
// ============================================================================

export interface KAM {
  id: string; // Format: kam-<region>-<seq>
  name: string;
  region: RegionKey;
  city: string;
  phone: string;
  email: string;
  tlId: string;
}

// ============================================================================
// ADMIN ORG (Organization Structure)
// ============================================================================

export interface AdminOrg {
  regions: RegionKey[];
  tls: TeamLead[];
}
