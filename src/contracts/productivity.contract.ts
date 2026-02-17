/**
 * PRODUCTIVITY DATA CONTRACT
 * 
 * UI components must consume only these DTOs.
 * Flow: productivityEngine → selectors → ProductivityDTO → UI
 */

/**
 * Productivity Summary DTO - For dashboard cards
 */
export interface ProductivitySummaryDTO {
  // Overall scores
  inputScore: number; // 0-100
  inputScoreGate: number; // threshold (e.g., 75)
  inputScoreMet: boolean;
  
  qualityScore: number; // 0-100
  qualityScoreGate: number; // threshold (e.g., 80)
  qualityScoreMet: boolean;
  
  // Call metrics
  calls: {
    total: number;
    productive: number;
    nonProductive: number;
    productivityRate: number; // percentage
    target: number;
    targetMet: boolean;
  };
  
  // Visit metrics
  visits: {
    total: number;
    productive: number;
    nonProductive: number;
    productivityRate: number; // percentage
    target: number;
    targetMet: boolean;
  };
  
  // Combined productivity
  overallProductivityRate: number; // percentage
}

/**
 * Productivity Detail DTO - For productivity dashboard
 */
export interface ProductivityDetailDTO extends ProductivitySummaryDTO {
  // Breakdown by source
  callProductivityBySource: {
    ai: number;
    kam: number;
    tl: number;
  };
  
  visitProductivityBySource: {
    geofence: number;
    kam: number;
    tl: number;
  };
  
  // Evidence counts
  evidence: {
    callTranscripts: number;
    visitGeofence: number;
    kamMarked: number;
    tlOverrides: number;
  };
  
  // Historical trends
  trends: {
    inputScore: number[]; // 7-day trend
    callProductivity: number[]; // 7-day trend
    visitProductivity: number[]; // 7-day trend
  };
  
  // Red flags
  redFlags: ProductivityRedFlagDTO[];
}

/**
 * Productivity Red Flag DTO
 */
export interface ProductivityRedFlagDTO {
  type: 'low-input-score' | 'low-call-productivity' | 'low-visit-productivity' | 'geofence-violation';
  severity: 'high' | 'medium' | 'low';
  message: string;
  count?: number;
  threshold?: number;
  actual?: number;
}

/**
 * Productivity Evidence DTO - For evidence cards
 */
export interface ProductivityEvidenceDTO {
  id: string;
  type: 'call' | 'visit';
  activityId: string;
  dealerName: string;
  dealerCode: string;
  timestamp: Date;
  isProductive: boolean;
  
  // Evidence details
  evidence: {
    source: 'AI' | 'KAM' | 'TL' | 'Geofence';
    reason: string;
    confidence?: number; // 0-100 for AI
    tags?: string[];
    location?: {
      distance: number; // meters
      withinThreshold: boolean;
    };
  };
  
  // Override history
  overrides?: {
    by: 'KAM' | 'TL';
    from: boolean;
    to: boolean;
    reason: string;
    timestamp: Date;
  }[];
}

/**
 * KAM Productivity DTO - For TL/Admin views
 */
export interface KAMProductivityDTO {
  kamId: string;
  kamName: string;
  region: string;
  tlName: string;
  
  // Scores
  inputScore: number;
  qualityScore: number;
  
  // Activity
  calls: {
    total: number;
    productive: number;
    productivityRate: number;
  };
  
  visits: {
    total: number;
    productive: number;
    productivityRate: number;
  };
  
  // Dealers managed
  dealerCount: number;
  activeDealers: number;
  dormantDealers: number;
  
  // Performance indicators
  isUnderperforming: boolean;
  redFlagCount: number;
}

/**
 * TL Productivity DTO - For Admin views
 */
export interface TLProductivityDTO {
  tlId: string;
  tlName: string;
  region: string;
  kamCount: number;
  
  // Aggregated scores
  avgInputScore: number;
  avgQualityScore: number;
  
  // Aggregated activity
  totalCalls: number;
  productiveCalls: number;
  callProductivityRate: number;
  
  totalVisits: number;
  productiveVisits: number;
  visitProductivityRate: number;
  
  // Team health
  kamsAboveGate: number;
  kamsBelowGate: number;
  teamHealthScore: number; // percentage
  
  // Performance indicators
  isUnderperforming: boolean;
  redFlagCount: number;
}

/**
 * Productivity Leaderboard Item DTO
 */
export interface ProductivityLeaderboardItemDTO {
  rank: number;
  userId: string;
  userName: string;
  role: 'KAM' | 'TL';
  region: string;
  
  inputScore: number;
  callProductivity: number;
  visitProductivity: number;
  overallScore: number; // composite
  
  trend: 'up' | 'down' | 'stable';
}

/**
 * Productivity Comparison DTO - For self vs team
 */
export interface ProductivityComparisonDTO {
  self: ProductivitySummaryDTO;
  
  team: {
    avgInputScore: number;
    avgCallProductivity: number;
    avgVisitProductivity: number;
  };
  
  region: {
    avgInputScore: number;
    avgCallProductivity: number;
    avgVisitProductivity: number;
  };
  
  percentile: {
    inputScore: number; // 0-100
    callProductivity: number;
    visitProductivity: number;
  };
}
