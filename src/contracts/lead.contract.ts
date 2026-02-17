/**
 * LEAD DATA CONTRACT
 * 
 * UI components must consume only these DTOs.
 * Flow: mockDatabase → selectors → LeadDTO → UI
 */

/**
 * DCF Lead DTO - Complete lead information for UI
 */
export interface DCFLeadDTO {
  // Identity
  id: string;
  
  // Customer
  customerName: string;
  customerPhone: string;
  pan: string;
  city: string;
  
  // Car details
  regNo: string;
  car: string;
  carValue: number; // in rupees
  
  // Loan details
  ltv: number | null; // percentage
  loanAmount: number | null; // in rupees
  roi: number | null; // percentage
  tenure: number | null; // months
  emi: number | null; // in rupees
  
  // Dealer context
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  channel: 'Dealer Shared' | 'Walk-in' | 'Online';
  
  // Ownership
  kamId: string;
  kamName: string;
  tlId: string;
  
  // Status
  ragStatus: 'green' | 'amber' | 'red';
  bookFlag: 'Own Book' | 'Pmax';
  carDocsFlag: 'Received' | 'Pending';
  
  // Conversion owner
  conversionOwner: string;
  conversionEmail: string;
  conversionPhone: string;
  
  // Funnel
  currentFunnel: string;
  currentSubStage: string;
  overallStatus: string;
  
  // Commission
  firstDisbursalForDealer: boolean;
  commissionEligible: boolean;
  baseCommission: number; // in rupees
  boosterApplied: boolean;
  totalCommission: number; // in rupees
  
  // Timeline
  createdAt: Date;
  lastUpdatedAt: Date;
  disbursalDate?: Date;
  utr?: string;
  
  // Additional details
  cibilScore?: number;
  cibilDate?: string;
  employmentType?: string;
  monthlyIncome?: number;
  dealerAccount?: string;
  delayMessage?: string;
  lastDCFDisbursal?: string;
}

/**
 * DCF Lead List Item DTO - Lightweight for list views
 */
export interface DCFLeadListItemDTO {
  id: string;
  customerName: string;
  car: string;
  loanAmount: number | null;
  dealerName: string;
  dealerCode: string;
  ragStatus: 'green' | 'amber' | 'red';
  currentFunnel: string;
  overallStatus: string;
  createdAt: Date;
  daysOld: number;
}

/**
 * DCF Lead Detail DTO - Enhanced for detail screen
 */
export interface DCFLeadDetailDTO extends DCFLeadDTO {
  // Dealer snapshot
  dealer: {
    id: string;
    name: string;
    code: string;
    city: string;
    segment: string;
    phone?: string;
    isDCFOnboarded: boolean;
  };
  
  // Timeline events
  timeline: DCFLeadTimelineEventDTO[];
  
  // Related leads from same dealer
  relatedLeads: {
    id: string;
    customerName: string;
    status: string;
    disbursalDate?: Date;
  }[];
  
  // Commission breakdown
  commissionBreakdown: {
    base: number;
    booster: number;
    total: number;
    status: 'Earned' | 'Pending' | 'Not Eligible';
    reason?: string;
  };
  
  // Risk assessment
  riskAssessment: {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

/**
 * DCF Lead Timeline Event DTO
 */
export interface DCFLeadTimelineEventDTO {
  id: string;
  timestamp: Date;
  eventType: 'created' | 'status_change' | 'funnel_change' | 'cibil_check' | 'doc_upload' | 'disbursed' | 'comment';
  description: string;
  actor?: string; // who performed the action
  details?: Record<string, any>;
}

/**
 * DCF Funnel Analytics DTO - For admin/TL dashboards
 */
export interface DCFFunnelAnalyticsDTO {
  // Funnel stages
  onboarding: {
    total: number;
    completed: number;
    pending: number;
    conversionRate: number; // percentage
  };
  
  conversion: {
    total: number;
    inProgress: number;
    completed: number;
    conversionRate: number;
  };
  
  disbursal: {
    total: number;
    pending: number;
    completed: number;
    conversionRate: number;
  };
  
  // Overall metrics
  totalLeads: number;
  totalDisbursed: number;
  totalGMV: number;
  avgLoanAmount: number;
  avgTimeToDisburse: number; // days
  
  // By RAG status
  byRAG: {
    green: number;
    amber: number;
    red: number;
  };
  
  // Trends
  trends: {
    leadsCreated: number[]; // 7-day trend
    disbursed: number[]; // 7-day trend
    gmv: number[]; // 7-day trend
  };
}

/**
 * DCF Dealer Onboarding Status DTO
 */
export interface DCFDealerOnboardingDTO {
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  city: string;
  
  // Onboarding status
  isOnboarded: boolean;
  onboardingDate?: Date;
  onboardedBy?: string;
  
  // Requirements
  requirements: {
    name: string;
    status: 'completed' | 'pending' | 'not_started';
    completedAt?: Date;
  }[];
  
  // Performance since onboarding
  stats: {
    totalLeads: number;
    disbursed: number;
    gmv: number;
    avgLoanAmount: number;
    conversionRate: number;
  } | null;
  
  // Next steps
  nextSteps: string[];
}

/**
 * DCF Commission Summary DTO
 */
export interface DCFCommissionSummaryDTO {
  userId: string;
  userName: string;
  role: 'KAM' | 'TL';
  
  // Current period
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  
  // Breakdown
  byStatus: {
    earned: number;
    pending: number;
    processing: number;
  };
  
  byDealer: {
    dealerId: string;
    dealerName: string;
    commission: number;
    leadsCount: number;
  }[];
  
  // Details
  commissions: DCFCommissionBreakdownDTO[];
}

/**
 * DCF Commission Breakdown DTO (imported from incentive.contract)
 */
export interface DCFCommissionBreakdownDTO {
  loanId: string;
  customerName: string;
  dealerName: string;
  loanAmount: number;
  baseCommission: number;
  boosterApplied: boolean;
  totalCommission: number;
  disbursalDate: Date;
  status: 'Paid' | 'Pending' | 'Processing';
}
