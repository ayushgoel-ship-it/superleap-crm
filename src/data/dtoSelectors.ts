/**
 * DTO SELECTOR LAYER
 * 
 * These selectors transform raw entities into DTOs for UI consumption.
 * UI components must NEVER import raw entities - only DTOs.
 * 
 * Flow: mockDatabase → raw selectors → DTO selectors → UI
 */

import {
  getDealerById,
  getCallsByDealerId,
  getVisitsByDealerId,
  getDCFLeadsByDealerId,
  getCallsByKAM,
  getVisitsByKAM,
  getDealersByKAM,
  getDCFLeadsByKAM,
  getCallById,
  getVisitById,
  getDCFLeadById,
  getLeadsByDealerId
} from './selectors';

import {
  DealerDTO,
  Dealer360DTO,
  DealerListItemDTO,
  DealerMetricsDTO,
  DealerProductivityDTO
} from '../contracts/dealer.contract';

import {
  CallDTO,
  VisitDTO,
  CallDetailDTO,
  VisitDetailDTO
} from '../contracts/activity.contract';

import {
  DCFLeadDTO,
  DCFLeadDetailDTO
} from '../contracts/lead.contract';

import {
  ProductivitySummaryDTO
} from '../contracts/productivity.contract';

import {
  IncentiveSummaryDTO
} from '../contracts/incentive.contract';

import { validateDTO, DealerDTOSchema, CallDTOSchema, VisitDTOSchema } from '../lib/validate';
import { round } from '../lib/domain/metrics';

/**
 * ==========================================
 * DEALER DTOs
 * ==========================================
 */

/**
 * Get full Dealer DTO
 */
export function getDealerDTO(dealerId: string): DealerDTO | null {
  const dealer = getDealerById(dealerId);
  if (!dealer) return null;
  
  const calls = getCallsByDealerId(dealerId);
  const visits = getVisitsByDealerId(dealerId);
  
  const productiveCalls = calls.filter(c => c.isProductive).length;
  const nonProductiveCalls = calls.filter(c => !c.isProductive).length;
  const totalCalls = calls.length;
  
  const productiveVisits = visits.filter(v => v.isProductive).length;
  const nonProductiveVisits = visits.filter(v => !v.isProductive).length;
  const totalVisits = visits.length;
  
  const dto: DealerDTO = {
    id: dealer.id,
    name: dealer.name,
    code: dealer.code,
    city: dealer.city,
    region: dealer.region,
    segment: dealer.segment,
    tags: dealer.tags,
    status: dealer.status,
    
    kamId: dealer.kamId,
    kamName: dealer.kamName,
    tlId: dealer.tlId,
    
    phone: dealer.phone,
    email: dealer.email,
    address: dealer.address,
    
    latitude: dealer.latitude,
    longitude: dealer.longitude,
    
    metrics: {
      leads: dealer.metrics.mtd.leads,
      inspections: dealer.metrics.mtd.inspections,
      stockIns: dealer.metrics.mtd.sis,
      i2si: dealer.metrics.mtd.inspections > 0
        ? round((dealer.metrics.mtd.sis / dealer.metrics.mtd.inspections) * 100, 1)
        : 0,
      dcfLeads: dealer.metrics.mtd.dcf,
      dcfOnboarded: dealer.tags.includes('DCF Onboarded'),
      dcfDisbursed: 0, // Would come from DCF_LEADS count
      dcfGMV: 0
    },
    
    productivity: {
      productiveCalls,
      nonProductiveCalls,
      totalCalls,
      productiveCallsPercent: totalCalls > 0 ? round((productiveCalls / totalCalls) * 100, 1) : 0,
      productiveVisits,
      nonProductiveVisits,
      totalVisits,
      productiveVisitsPercent: totalVisits > 0 ? round((productiveVisits / totalVisits) * 100, 1) : 0
    },
    
    lastInteractionAt: null, // Would compute from calls/visits
    lastVisitAt: null,
    lastCallAt: null,
    daysSinceLastVisit: dealer.lastVisitDaysAgo,
    daysSinceLastCall: dealer.lastContactDaysAgo
  };
  
  // Validate in dev mode
  validateDTO('DealerDTO', dto, DealerDTOSchema);
  
  return dto;
}

/**
 * Get Dealer 360 DTO (complete profile)
 */
export function getDealer360DTO(dealerId: string): Dealer360DTO | null {
  const base = getDealerDTO(dealerId);
  if (!base) return null;
  
  const calls = getCallsByDealerId(dealerId);
  const visits = getVisitsByDealerId(dealerId);
  const dcfLeads = getDCFLeadsByDealerId(dealerId);
  
  const productiveCalls = calls.filter(c => c.isProductive).length;
  const productiveVisits = visits.filter(v => v.isProductive).length;
  
  const dto: Dealer360DTO = {
    ...base,
    
    recentCalls: {
      total: calls.length,
      productive: productiveCalls,
      productivityRate: calls.length > 0 ? round((productiveCalls / calls.length) * 100, 1) : 0,
      last7Days: calls.filter(c => {
        const days = Math.floor((Date.now() - new Date(c.callDate).getTime()) / (1000 * 60 * 60 * 24));
        return days <= 7;
      }).length
    },
    
    recentVisits: {
      total: visits.length,
      productive: productiveVisits,
      productivityRate: visits.length > 0 ? round((productiveVisits / visits.length) * 100, 1) : 0,
      last7Days: visits.filter(v => {
        const days = Math.floor((Date.now() - new Date(v.visitDate).getTime()) / (1000 * 60 * 60 * 24));
        return days <= 7;
      }).length
    },
    
    topLeads: dcfLeads.slice(0, 5).map(lead => ({
      id: lead.id,
      customerName: lead.customerName,
      car: lead.car,
      stage: lead.currentFunnel,
      status: lead.overallStatus,
      createdAt: new Date(lead.createdAt)
    })),
    
    dcfStatus: {
      isOnboarded: base.metrics.dcfOnboarded,
      totalLeads: dcfLeads.length,
      activeLead: dcfLeads.filter(l => !l.disbursalDate).length,
      disbursed: dcfLeads.filter(l => l.disbursalDate).length,
      gmv: dcfLeads
        .filter(l => l.disbursalDate && l.loanAmount)
        .reduce((sum, l) => sum + (l.loanAmount || 0), 0),
      lastDisbursalDate: dcfLeads
        .filter(l => l.disbursalDate)
        .sort((a, b) => new Date(b.disbursalDate!).getTime() - new Date(a.disbursalDate!).getTime())[0]
        ?.disbursalDate
        ? new Date(dcfLeads[0].disbursalDate!)
        : undefined
    }
  };
  
  return dto;
}

/**
 * Get lightweight Dealer List Item DTO
 */
export function getDealerListItemDTO(dealerId: string): DealerListItemDTO | null {
  const dealer = getDealerById(dealerId);
  if (!dealer) return null;
  
  return {
    id: dealer.id,
    name: dealer.name,
    code: dealer.code,
    city: dealer.city,
    region: dealer.region,
    segment: dealer.segment,
    tags: dealer.tags,
    kamName: dealer.kamName,
    stockIns: dealer.metrics.mtd.sis,
    i2si: dealer.metrics.mtd.inspections > 0
      ? round((dealer.metrics.mtd.sis / dealer.metrics.mtd.inspections) * 100, 1)
      : 0,
    dcfLeads: dealer.metrics.mtd.dcf,
    lastVisit: dealer.lastVisit,
    lastVisitDaysAgo: dealer.lastVisitDaysAgo
  };
}

/**
 * ==========================================
 * ACTIVITY DTOs (Calls & Visits)
 * ==========================================
 */

/**
 * Get Call DTO
 */
export function getCallDTO(callId: string): CallDTO | null {
  const call = getCallById(callId);
  if (!call) return null;
  
  const dto: CallDTO = {
    id: call.id,
    callDate: new Date(call.callDate),
    callTime: call.callTime,
    duration: call.duration,
    
    dealerId: call.dealerId,
    dealerName: call.dealerName,
    dealerCode: call.dealerCode,
    dealerCity: call.dealerName, // Mock - should be from dealer
    
    kamId: call.kamId,
    kamName: call.kamName,
    tlId: call.tlId,
    
    outcome: call.outcome,
    isProductive: call.isProductive,
    productivitySource: call.productivitySource,
    
    transcript: call.transcript,
    sentimentScore: call.sentimentScore,
    sentimentLabel: call.sentimentLabel,
    autoTags: call.autoTags,
    
    kamComments: call.kamComments,
    followUpTasks: call.followUpTasks,
    recordingUrl: call.recordingUrl
  };
  
  validateDTO('CallDTO', dto, CallDTOSchema);
  
  return dto;
}

/**
 * Get Call Detail DTO (enhanced)
 */
export function getCallDetailDTO(callId: string): CallDetailDTO | null {
  const base = getCallDTO(callId);
  if (!base) return null;
  
  const dealer = getDealerById(base.dealerId);
  if (!dealer) return base as CallDetailDTO;
  
  const allCalls = getCallsByDealerId(base.dealerId);
  const previousCalls = allCalls.filter(c => c.id !== callId);
  const previousProductiveCalls = previousCalls.filter(c => c.isProductive);
  
  const dto: CallDetailDTO = {
    ...base,
    
    dealer: {
      id: dealer.id,
      name: dealer.name,
      code: dealer.code,
      city: dealer.city,
      segment: dealer.segment,
      phone: dealer.phone
    },
    
    previousCalls: previousCalls.length,
    previousProductiveCalls: previousProductiveCalls.length,
    daysSinceLastCall: dealer.lastContactDaysAgo,
    
    productivityEvidence: {
      type: base.productivitySource,
      reason: base.isProductive ? 'Productive conversation detected' : 'No meaningful discussion',
      confidence: base.sentimentScore,
      tags: base.autoTags
    }
  };
  
  return dto;
}

/**
 * Get Visit DTO
 */
export function getVisitDTO(visitId: string): VisitDTO | null {
  const visit = getVisitById(visitId);
  if (!visit) return null;
  
  const dto: VisitDTO = {
    id: visit.id,
    visitDate: new Date(visit.visitDate),
    visitTime: visit.visitTime,
    duration: visit.duration,
    
    dealerId: visit.dealerId,
    dealerName: visit.dealerName,
    dealerCode: visit.dealerCode,
    dealerCity: visit.dealerName, // Mock
    
    kamId: visit.kamId,
    kamName: visit.kamName,
    tlId: visit.tlId,
    
    checkInLocation: visit.checkInLocation,
    checkOutLocation: visit.checkOutLocation,
    distanceFromDealer: 0, // Would calculate from dealer lat/lng
    isWithinGeofence: true, // Mock - would validate
    
    visitType: visit.visitType,
    isProductive: visit.isProductive,
    productivitySource: visit.productivitySource,
    outcomes: visit.outcomes,
    
    kamComments: visit.kamComments,
    followUpTasks: visit.followUpTasks
  };
  
  validateDTO('VisitDTO', dto, VisitDTOSchema);
  
  return dto;
}

/**
 * Get Visit Detail DTO (enhanced)
 */
export function getVisitDetailDTO(visitId: string): VisitDetailDTO | null {
  const base = getVisitDTO(visitId);
  if (!base) return null;
  
  const dealer = getDealerById(base.dealerId);
  if (!dealer) return base as VisitDetailDTO;
  
  const allVisits = getVisitsByDealerId(base.dealerId);
  const previousVisits = allVisits.filter(v => v.id !== visitId);
  const previousProductiveVisits = previousVisits.filter(v => v.isProductive);
  
  const dto: VisitDetailDTO = {
    ...base,
    
    dealer: {
      id: dealer.id,
      name: dealer.name,
      code: dealer.code,
      city: dealer.city,
      segment: dealer.segment,
      address: dealer.address,
      latitude: dealer.latitude,
      longitude: dealer.longitude
    },
    
    previousVisits: previousVisits.length,
    previousProductiveVisits: previousProductiveVisits.length,
    daysSinceLastVisit: dealer.lastVisitDaysAgo,
    
    geofenceValidation: {
      isValid: true, // Mock
      distance: 50, // Mock: 50 meters
      threshold: 100, // 100m threshold
      accuracy: 10 // 10m GPS accuracy
    },
    
    productivityEvidence: {
      type: base.productivitySource,
      reason: base.isProductive ? 'Within geofence, sufficient duration' : 'Did not meet productivity criteria',
      autoApproved: base.productivitySource === 'Geofence'
    }
  };
  
  return dto;
}

/**
 * ==========================================
 * DCF LEAD DTOs
 * ==========================================
 */

/**
 * Get DCF Lead DTO
 */
export function getDCFLeadDTO(leadId: string): DCFLeadDTO | null {
  const lead = getDCFLeadById(leadId);
  if (!lead) return null;
  
  return {
    id: lead.id,
    customerName: lead.customerName,
    customerPhone: lead.customerPhone,
    pan: lead.pan,
    city: lead.city,
    regNo: lead.regNo,
    car: lead.car,
    carValue: lead.carValue,
    ltv: lead.ltv,
    loanAmount: lead.loanAmount,
    roi: lead.roi,
    tenure: lead.tenure,
    emi: lead.emi,
    dealerId: lead.dealerId,
    dealerName: lead.dealerName,
    dealerCode: lead.dealerCode,
    dealerCity: lead.dealerCity,
    channel: lead.channel,
    kamId: lead.kamId,
    kamName: lead.kamName,
    tlId: lead.tlId,
    ragStatus: lead.ragStatus,
    bookFlag: lead.bookFlag,
    carDocsFlag: lead.carDocsFlag,
    conversionOwner: lead.conversionOwner,
    conversionEmail: lead.conversionEmail,
    conversionPhone: lead.conversionPhone,
    currentFunnel: lead.currentFunnel,
    currentSubStage: lead.currentSubStage,
    overallStatus: lead.overallStatus,
    firstDisbursalForDealer: lead.firstDisbursalForDealer,
    commissionEligible: lead.commissionEligible,
    baseCommission: lead.baseCommission,
    boosterApplied: lead.boosterApplied,
    totalCommission: lead.totalCommission,
    createdAt: new Date(lead.createdAt),
    lastUpdatedAt: new Date(lead.lastUpdatedAt),
    disbursalDate: lead.disbursalDate ? new Date(lead.disbursalDate) : undefined,
    utr: lead.utr,
    cibilScore: lead.cibilScore,
    cibilDate: lead.cibilDate,
    employmentType: lead.employmentType,
    monthlyIncome: lead.monthlyIncome,
    dealerAccount: lead.dealerAccount,
    delayMessage: lead.delayMessage,
    lastDCFDisbursal: lead.lastDCFDisbursal
  };
}

/**
 * ==========================================
 * HELPER FUNCTIONS
 * ==========================================
 */

/**
 * Get multiple dealers as DTOs
 */
export function getDealerDTOs(dealerIds: string[]): DealerDTO[] {
  return dealerIds
    .map(id => getDealerDTO(id))
    .filter((d): d is DealerDTO => d !== null);
}

/**
 * Get all dealers for a KAM as DTOs
 */
export function getKAMDealerDTOs(kamId: string): DealerDTO[] {
  const dealers = getDealersByKAM(kamId);
  return dealers.map(d => getDealerDTO(d.id)).filter((d): d is DealerDTO => d !== null);
}

/**
 * Get all calls for a KAM as DTOs
 */
export function getKAMCallDTOs(kamId: string): CallDTO[] {
  const calls = getCallsByKAM(kamId);
  return calls.map(c => getCallDTO(c.id)).filter((c): c is CallDTO => c !== null);
}

/**
 * Get all visits for a KAM as DTOs
 */
export function getKAMVisitDTOs(kamId: string): VisitDTO[] {
  const visits = getVisitsByKAM(kamId);
  return visits.map(v => getVisitDTO(v.id)).filter((v): d is VisitDTO => v !== null);
}

/**
 * ==========================================
 * TIME-SCOPED DEALER360 SELECTORS
 * ==========================================
 */

export type TimeScope = 'd-1' | 'last-7d' | 'mtd' | 'last-month' | 'last-6m';

interface TimeScopedOptions {
  timeScope: TimeScope;
}

/**
 * Filter items by time scope
 */
function filterByTimeScope<T extends { createdAt?: string; callDate?: string; visitDate?: string }>(
  items: T[],
  scope: TimeScope
): T[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let startDate: Date;
  
  switch (scope) {
    case 'd-1':
      // Yesterday
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'last-7d':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'mtd':
      // Month to date
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last-month':
      // Last 30 days
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'last-6m':
      // Last 6 months
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    default:
      startDate = new Date(0); // All time
  }
  
  return items.filter(item => {
    const itemDate = new Date(item.createdAt || item.callDate || item.visitDate || 0);
    return itemDate >= startDate && itemDate <= now;
  });
}

/**
 * Get dealer metrics for specific time scope
 */
export function getDealerMetricsForScope(dealerId: string, scope: TimeScope): DealerMetricsDTO {
  const dealer = getDealerById(dealerId);
  if (!dealer) {
    return {
      leads: 0,
      inspections: 0,
      stockIns: 0,
      i2si: 0,
      dcfLeads: 0,
      dcfOnboarded: false,
      dcfDisbursed: 0,
      dcfGMV: 0,
    };
  }
  
  // Map scope to dealer.metrics key
  const metricsKey = scope === 'last-month' ? 'last-30d' : scope === 'mtd' ? 'mtd' : scope;
  const metrics = dealer.metrics[metricsKey] || dealer.metrics.mtd;
  
  return {
    leads: metrics.leads,
    inspections: metrics.inspections,
    stockIns: metrics.sis,
    i2si: metrics.inspections > 0 ? round((metrics.sis / metrics.inspections) * 100, 1) : 0,
    dcfLeads: metrics.dcf,
    dcfOnboarded: dealer.tags.includes('DCF Onboarded'),
    dcfDisbursed: 0, // Would come from DCF_LEADS filtered by scope
    dcfGMV: 0,
  };
}

/**
 * Get dealer activities (calls + visits) for specific time scope
 */
export function getDealerActivitiesForScope(dealerId: string, scope: TimeScope) {
  const calls = getCallsByDealerId(dealerId);
  const visits = getVisitsByDealerId(dealerId);
  
  const filteredCalls = filterByTimeScope(calls, scope);
  const filteredVisits = filterByTimeScope(visits, scope);
  
  // Combine and sort by date (most recent first)
  const activities = [
    ...filteredCalls.map(c => ({
      id: c.id,
      type: 'call' as const,
      dealerId: c.dealerId,
      dealerName: c.dealerName,
      date: c.callDate,
      time: c.callTime,
      duration: c.duration,
      isProductive: c.isProductive,
      outcome: c.outcome,
      hasRecording: !!c.recordingUrl,
    })),
    ...filteredVisits.map(v => ({
      id: v.id,
      type: 'visit' as const,
      dealerId: v.dealerId,
      dealerName: v.dealerName,
      date: v.visitDate,
      time: v.visitTime,
      duration: v.duration,
      isProductive: v.isProductive,
      visitType: v.visitType,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return activities;
}

/**
 * Get dealer leads for specific time scope
 */
export function getDealerLeadsForScope(dealerId: string, scope: TimeScope) {
  // Get all leads for this dealer
  const allLeads = getLeadsByDealerId(dealerId);
  
  // Filter by time scope
  const now = new Date();
  const filteredLeads = allLeads.filter(lead => {
    const leadDate = new Date(lead.createdAt);
    
    switch (scope) {
      case 'd-1': {
        // Yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return leadDate >= yesterday && leadDate <= yesterdayEnd;
      }
      case 'last-7d': {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return leadDate >= sevenDaysAgo;
      }
      case 'mtd': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return leadDate >= monthStart;
      }
      case 'last-month': {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return leadDate >= thirtyDaysAgo;
      }
      case 'last-6m': {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return leadDate >= sixMonthsAgo;
      }
      default:
        return true;
    }
  });
  
  return filteredLeads;
}

/**
 * Get dealer DCF loans for specific time scope
 */
export function getDealerDCFLoansForScope(dealerId: string, scope: TimeScope) {
  const dcfLeads = getDCFLeadsByDealerId(dealerId);
  const filtered = filterByTimeScope(dcfLeads, scope);
  
  return filtered.map(lead => ({
    id: lead.id,
    dealerId: lead.dealerId,
    dealerName: lead.dealerName,
    customerName: lead.customerName,
    car: lead.car,
    loanAmount: lead.loanAmount || 0,
    status: lead.disbursalDate
      ? 'Disbursed'
      : lead.currentSubStage === 'Approved'
      ? 'Approved'
      : 'Docs Pending',
    date: lead.createdAt,
    disbursalDate: lead.disbursalDate,
  }));
}

/**
 * Get complete Dealer360 data for specific time scope
 */
export function getDealer360ForScope(
  dealerId: string,
  options: TimeScopedOptions
): Dealer360DTO & { activities: any[]; leads: any[]; dcfLoans: any[] } | null {
  const base = getDealer360DTO(dealerId);
  if (!base) return null;
  
  const { timeScope } = options;
  
  return {
    ...base,
    metrics: getDealerMetricsForScope(dealerId, timeScope),
    activities: getDealerActivitiesForScope(dealerId, timeScope),
    leads: getDealerLeadsForScope(dealerId, timeScope),
    dcfLoans: getDealerDCFLoansForScope(dealerId, timeScope),
  };
}