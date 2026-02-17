/**
 * DEALER DATA CONTRACT
 * 
 * This is the ONLY shape of dealer data that UI components should consume.
 * UI components must NOT accept raw Dealer entities from mockDatabase.
 * 
 * Flow: mockDatabase → selectors → DealerDTO → UI
 */

import { DealerSegment, DealerTag } from '../data/types';

/**
 * Dealer DTO - Complete dealer information for UI consumption
 */
export interface DealerDTO {
  // Identity
  id: string;
  name: string;
  code: string;
  city: string;
  region: string;
  segment: DealerSegment;
  tags: DealerTag[];
  status: 'active' | 'dormant' | 'inactive';
  
  // Ownership
  kamId: string;
  kamName: string;
  tlId: string;
  
  // Contact
  phone?: string;
  email?: string;
  address?: string;
  
  // Location
  latitude?: number;
  longitude?: number;
  
  // Business Metrics (current period)
  metrics: DealerMetricsDTO;
  
  // Productivity Metrics
  productivity: DealerProductivityDTO;
  
  // Engagement
  lastInteractionAt: Date | null;
  lastVisitAt: Date | null;
  lastCallAt: Date | null;
  daysSinceLastVisit: number;
  daysSinceLastCall: number;
}

/**
 * Dealer Metrics DTO - Business performance numbers
 */
export interface DealerMetricsDTO {
  // Dealer Referral
  leads: number;
  inspections: number;
  stockIns: number;
  i2si: number; // percentage
  
  // DCF
  dcfLeads: number;
  dcfOnboarded: boolean;
  dcfDisbursed: number;
  dcfGMV: number; // in rupees
}

/**
 * Dealer Productivity DTO - Call/visit activity
 */
export interface DealerProductivityDTO {
  productiveCalls: number;
  nonProductiveCalls: number;
  totalCalls: number;
  productiveCallsPercent: number;
  
  productiveVisits: number;
  nonProductiveVisits: number;
  totalVisits: number;
  productiveVisitsPercent: number;
}

/**
 * Dealer List Item DTO - Lightweight version for list views
 */
export interface DealerListItemDTO {
  id: string;
  name: string;
  code: string;
  city: string;
  region: string;
  segment: DealerSegment;
  tags: DealerTag[];
  
  kamName: string;
  
  // Key metrics only
  stockIns: number;
  i2si: number;
  dcfLeads: number;
  
  lastVisit: string; // human-readable (e.g., "2 hours ago")
  lastVisitDaysAgo: number;
}

/**
 * Dealer 360 View DTO - Complete profile for detail screen
 */
export interface Dealer360DTO extends DealerDTO {
  // Additional aggregated data
  recentCalls: ActivitySummaryDTO;
  recentVisits: ActivitySummaryDTO;
  topLeads: LeadSummaryDTO[];
  dcfStatus: DCFStatusDTO;
}

/**
 * Activity Summary for Dealer 360
 */
export interface ActivitySummaryDTO {
  total: number;
  productive: number;
  productivityRate: number; // percentage
  last7Days: number;
}

/**
 * Lead Summary for Dealer 360
 */
export interface LeadSummaryDTO {
  id: string;
  customerName: string;
  car: string;
  stage: string;
  status: string;
  createdAt: Date;
}

/**
 * DCF Status for Dealer 360
 */
export interface DCFStatusDTO {
  isOnboarded: boolean;
  totalLeads: number;
  activeLead: number;
  disbursed: number;
  gmv: number;
  lastDisbursalDate?: Date;
}
