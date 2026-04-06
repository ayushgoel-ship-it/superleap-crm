/**
 * INCENTIVE DATA CONTRACT
 * 
 * UI components must consume only these DTOs.
 * Flow: incentiveEngine → selectors → IncentiveDTO → UI
 */

/**
 * Incentive Summary DTO - For home dashboard cards
 */
export interface IncentiveSummaryDTO {
  // Current period earnings
  totalEarnings: number; // in rupees
  baseIncentive: number;
  multiplierBonus: number;
  dcfCommission: number;
  
  // Progress
  siAchieved: number;
  siTarget: number;
  siAchievementPercent: number;
  
  // Gates status
  inputScoreGateMet: boolean;
  qualityScoreGateMet: boolean;
  allGatesMet: boolean;
  
  // Projection
  projectedEarnings: number; // extrapolated to end of month
  projectedMultiplier: number; // current slab multiplier
}

/**
 * Incentive Detail DTO - For incentive simulator/detail screen
 */
export interface IncentiveDetailDTO extends IncentiveSummaryDTO {
  // SI breakdown
  siBreakdown: {
    ngs: number;
    gs: number;
  };
  
  // Slab details
  currentSlab: {
    range: string; // e.g., "75-90%"
    multiplier: number;
    baseAmount: number;
  };
  
  nextSlab: {
    range: string;
    multiplier: number;
    siNeededToUnlock: number;
    potentialEarnings: number;
  } | null;
  
  // DCF breakdown
  dcfCommissions: DCFCommissionBreakdownDTO[];
  
  // Historical
  lastMonthEarnings: number;
  last3MonthsAvg: number;
  
  // What-if scenarios
  scenarios: IncentiveScenarioDTO[];
}

/**
 * DCF Commission Breakdown DTO
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

/**
 * Incentive Scenario DTO - For what-if analysis
 */
export interface IncentiveScenarioDTO {
  name: string;
  description: string;
  
  // Inputs
  siAchieved: number;
  inputScore: number;
  qualityScore: number;
  dcfCount: number;
  
  // Outputs
  totalEarnings: number;
  baseIncentive: number;
  multiplierBonus: number;
  dcfCommission: number;
  
  // Comparison
  vsCurrentEarnings: number; // difference
  vsCurrentPercent: number; // percentage change
}

/**
 * KAM Incentive DTO - For TL view
 */
export interface KAMIncentiveDTO {
  kamId: string;
  kamName: string;
  region: string;
  
  // Earnings
  totalEarnings: number;
  
  // SI
  siAchieved: number;
  siTarget: number;
  siAchievementPercent: number;
  
  // Gates
  inputScore: number;
  qualityScore: number;
  allGatesMet: boolean;
  
  // DCF
  dcfCount: number;
  dcfCommission: number;
  
  // Status
  isOnTrack: boolean;
  projectedEarnings: number;
}

/**
 * TL Incentive DTO - For TL incentive dashboard
 */
export interface TLIncentiveDTO {
  tlId: string;
  tlName: string;
  region: string;
  
  // Team SI
  teamSIAchieved: number;
  teamSITarget: number;
  teamSIAchievementPercent: number;
  
  // TL earnings
  tlBaseIncentive: number;
  tlMultiplierBonus: number;
  tlDCFCommission: number;
  tlTotalEarnings: number;
  
  // Team performance
  kamsAboveTarget: number;
  kamsBelowTarget: number;
  avgKAMInputScore: number;
  
  // TL-specific gates
  teamInputScoreGateMet: boolean;
  teamQualityScoreGateMet: boolean;
  
  // KAMs under TL
  kams: KAMIncentiveDTO[];
  
  // Projections
  projectedTLEarnings: number;
  projectedTeamEarnings: number;
}

/**
 * Incentive Leaderboard Item DTO
 */
export interface IncentiveLeaderboardItemDTO {
  rank: number;
  userId: string;
  userName: string;
  role: 'KAM' | 'TL';
  region: string;
  
  totalEarnings: number;
  siAchieved: number;
  siTarget: number;
  siAchievementPercent: number;
  
  trend: 'up' | 'down' | 'stable';
}

/**
 * Incentive History DTO - For historical view
 */
export interface IncentiveHistoryDTO {
  userId: string;
  userName: string;
  
  history: {
    month: string; // 'YYYY-MM'
    totalEarnings: number;
    baseIncentive: number;
    multiplierBonus: number;
    dcfCommission: number;
    siAchieved: number;
    siTarget: number;
    siAchievementPercent: number;
  }[];
  
  totals: {
    ytd: number; // year to date
    last3Months: number;
    last6Months: number;
    last12Months: number;
  };
  
  averages: {
    last3Months: number;
    last6Months: number;
    last12Months: number;
  };
}

/**
 * Incentive Slab Reference DTO - For education/reference
 */
export interface IncentiveSlabReferenceDTO {
  role: 'KAM' | 'TL';
  
  slabs: {
    range: string; // e.g., "75-90%"
    minPercent: number;
    maxPercent: number;
    multiplier: number;
    description: string;
  }[];
  
  gates: {
    name: string;
    threshold: number;
    description: string;
    impact: string;
  }[];
  
  dcfRules: {
    baseCommission: number;
    boosterCondition: string;
    boosterAmount: number;
  };
}
