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
  id: string; // LEAD_ID from source
  dealerId: string; // DEALER_CODE (string form)
  dealerName: string;
  dealerCode: string; // DEALER_CODE
  kamId: string;
  kamName: string;
  kamPhone?: string;
  tlId: string;

  // Customer info
  customerName: string;
  customerPhone: string;

  // Vehicle info
  regNo?: string; // CX_REG_NO
  registrationNumber?: string; // Alias
  make: string; // MAKE
  model: string; // MODEL
  year: number; // YEAR
  variant?: string; // VARIANT

  // Business info
  channel: 'NGS' | 'GS' | 'DCF';
  leadType: 'Seller' | 'Inventory'; // DL_TYPE
  stage: string; // Derived from dates
  currentStage?: string; // Alias
  status: string; // Active, Won, Lost
  appointmentStatus?: string; // APPOINTMENT_STATUS from source

  // Financial
  expectedRevenue: number;
  actualRevenue: number;
  cep?: number | null;
  cepConfidence?: 'confirmed' | 'estimated' | 'dealer_told' | 'approximate';
  cepNotes?: string;
  c24Quote?: number | null; // LATEST_C24Q
  maxC24Quote?: number | null; // MAX_C24_QUOTE
  targetPrice?: number | null; // TARGET_PRICE
  sellerAgreedPrice?: number | null; // SELLERAGREEDPRICE
  bidAmount?: number | null; // BID_AMOUNT

  // Rank columns (from source — used for dedup in metrics)
  regApptRank?: number;
  regInspRank?: number;
  regTokenRank?: number;
  regStockinRank?: number;

  // Key dates
  createdAt: string; // LEAD_DATE
  updatedAt: string;
  leadDate?: string; // LEAD_DATE
  dealCreationDate?: string;
  originalApptDate?: string;
  currentApptDate?: string;
  inspectionDate?: string; // INSPECTION_DATE
  tokenDate?: string; // TOKEN_DATE
  stockinDate?: string; // STOCKIN_DATE
  stockOutDate?: string;
  finalTokenDate?: string; // FINAL_TOKEN_DATE
  finalSiDate?: string; // FINAL_SI_DATE
  latestOcbRaisedAt?: string;
  convertedAt?: string;

  // Flags
  gsFlag?: number;
  franchiseFlag?: number;
  ocbRunCount?: number;
  verified?: string;

  // Metadata
  city: string;
  region: RegionKey;
  inspectionCity?: string;
  inspectionRegion?: string;
  dealerRegion?: string;
  growthZone?: string;
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
