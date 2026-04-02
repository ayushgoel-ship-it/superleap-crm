/**
 * Data Selectors - Single Query API
 * All data access should go through these selectors
 */

import { DEALERS, CALLS, VISITS, DCF_LEADS, ORG, normalizeDealerId, normalizeTLId, normalizeKAMId, LEADS } from './mockDatabase';
import { Dealer, CallLog, VisitLog, DCFLead, TeamLead, KAM, RegionKey, Lead } from './types';

/**
 * Dealer Selectors
 */

export function getDealerById(id: string): Dealer | undefined {
  const normalizedId = normalizeDealerId(id);
  return DEALERS.find(d => d.id === normalizedId);
}

export function getDealerByCode(code: string): Dealer | undefined {
  return DEALERS.find(d => d.code === code);
}

export function getAllDealers(): Dealer[] {
  return DEALERS;
}

export function getDealersByRegion(region: RegionKey): Dealer[] {
  return DEALERS.filter(d => d.region === region);
}

export function getDealersByKAM(kamId: string): Dealer[] {
  const normalizedKAMId = normalizeKAMId(kamId);
  return DEALERS.filter(d => d.kamId === normalizedKAMId);
}

export function getDealersByTL(tlId: string): Dealer[] {
  const normalizedTLId = normalizeTLId(tlId);
  return DEALERS.filter(d => d.tlId === normalizedTLId);
}

export function searchDealers(query: string): Dealer[] {
  if (!query) return DEALERS;
  
  const lowerQuery = query.toLowerCase();
  return DEALERS.filter(d => 
    d.name.toLowerCase().includes(lowerQuery) ||
    d.code.toLowerCase().includes(lowerQuery) ||
    d.city.toLowerCase().includes(lowerQuery) ||
    d.kamName.toLowerCase().includes(lowerQuery)
  );
}

export function getDealersByStatus(status: 'active' | 'dormant' | 'inactive'): Dealer[] {
  return DEALERS.filter(d => d.status === status);
}

export function getDealersBySegment(segment: 'A' | 'B' | 'C'): Dealer[] {
  return DEALERS.filter(d => d.segment === segment);
}

export function getDealersByTag(tag: string): Dealer[] {
  return DEALERS.filter(d => d.tags.includes(tag as any));
}

/**
 * Call Log Selectors
 */

export function getCallById(id: string): CallLog | undefined {
  return CALLS.find(c => c.id === id);
}

export function getAllCalls(): CallLog[] {
  return CALLS;
}

export function getCallsByDealerId(dealerId: string): CallLog[] {
  const normalizedId = normalizeDealerId(dealerId);
  return CALLS.filter(c => c.dealerId === normalizedId);
}

export function getCallsByKAM(kamId: string): CallLog[] {
  const normalizedKAMId = normalizeKAMId(kamId);
  return CALLS.filter(c => c.kamId === normalizedKAMId);
}

export function getCallsByTL(tlId: string): CallLog[] {
  const normalizedTLId = normalizeTLId(tlId);
  return CALLS.filter(c => c.tlId === normalizedTLId);
}

export function getCallsByDateRange(startDate: string, endDate: string): CallLog[] {
  return CALLS.filter(c => c.callDate >= startDate && c.callDate <= endDate);
}

export function getProductiveCalls(): CallLog[] {
  return CALLS.filter(c => c.isProductive);
}

export function getUnproductiveCalls(): CallLog[] {
  return CALLS.filter(c => !c.isProductive);
}

/**
 * NEW: Call Management Selectors (for Call Attempt flow with mandatory feedback)
 */

/**
 * Create a new call attempt (initiated when "Call now" is clicked)
 */
export function createCallAttempt(params: {
  dealerId: string;
  kamId: string;
  phone: string;
}): CallLog {
  const { dealerId, kamId, phone } = params;
  const normalizedDealerId = normalizeDealerId(dealerId);
  const normalizedKAMId = normalizeKAMId(kamId);
  
  // Get dealer and KAM info
  const dealer = DEALERS.find(d => d.id === normalizedDealerId);
  if (!dealer) throw new Error(`Dealer not found: ${dealerId}`);
  
  const kamList = getAllKAMs();
  const kam = kamList.find(k => k.id === normalizedKAMId);
  if (!kam) throw new Error(`KAM not found: ${kamId}`);
  
  // Generate new call ID
  const timestamp = Date.now();
  const seq = CALLS.length + 1;
  const callId = `call-${timestamp}-${String(seq).padStart(3, '0')}`;
  
  const now = new Date();
  const callDate = now.toISOString().split('T')[0];
  const callTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  // Create new call attempt
  const newCall: CallLog = {
    id: callId,
    dealerId: normalizedDealerId,
    dealerName: dealer.name,
    dealerCode: dealer.code,
    phone,
    callDate,
    callTime,
    duration: '0m 0s',
    kamId: normalizedKAMId,
    kamName: kam.name,
    tlId: dealer.tlId,
    outcome: 'Connected', // Default, will be updated via feedback
    callStatus: 'ATTEMPTED',
    recordingStatus: 'AVAILABLE',
    recordingUrl: `recording-${callId}.mp3`, // Mock recording URL
    callStartTime: now.toISOString(),
    callEndTime: null,
    durationSec: null,
    feedbackStatus: 'PENDING',
    isProductive: false, // Will be determined by productivity engine later
    productivitySource: 'KAM',
  };
  
  // Add to CALLS array
  CALLS.push(newCall);
  
  return newCall;
}

/**
 * End a call attempt (set duration and end time)
 */
export function endCallAttempt(callId: string, params: { durationSec: number }): CallLog | undefined {
  const call = CALLS.find(c => c.id === callId);
  if (!call) return undefined;
  
  const { durationSec } = params;
  call.callEndTime = new Date().toISOString();
  call.durationSec = durationSec;
  
  // Format duration string
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  call.duration = `${minutes}m ${seconds}s`;
  
  return call;
}

/**
 * Submit call feedback (mark as SUBMITTED and update feedback data)
 */
export function submitCallFeedback(callId: string, feedbackPayload: NonNullable<CallLog['feedback']>): CallLog | undefined {
  const call = CALLS.find(c => c.id === callId);
  if (!call) return undefined;
  
  call.feedbackStatus = 'SUBMITTED';
  call.feedbackSubmittedAt = new Date().toISOString();
  call.feedback = feedbackPayload;
  
  // Map callOutcome to callStatus
  const outcomeMapping: Record<string, CallLog['callStatus']> = {
    'CONNECTED': 'CONNECTED',
    'NOT_REACHABLE': 'NOT_REACHABLE',
    'BUSY': 'BUSY',
    'CALL_BACK': 'CALL_BACK',
  };
  call.callStatus = outcomeMapping[feedbackPayload.callOutcome] || 'ATTEMPTED';
  
  // Map to legacy outcome field
  call.outcome = feedbackPayload.callOutcome === 'CONNECTED' ? 'Connected' : 
                 feedbackPayload.callOutcome === 'NOT_REACHABLE' ? 'No Answer' :
                 feedbackPayload.callOutcome === 'BUSY' ? 'Busy' : 'Left VM';
  
  return call;
}

/**
 * Get today's calls for a user (KAM or TL)
 */
export function getTodayCallsForUser(userId: string, timeScope: 'today' | 'last-7d' | 'last-30d' = 'today'): CallLog[] {
  const normalizedUserId = normalizeKAMId(userId);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  let startDate: string;
  if (timeScope === 'today') {
    startDate = today;
  } else if (timeScope === 'last-7d') {
    const date = new Date(now);
    date.setDate(date.getDate() - 7);
    startDate = date.toISOString().split('T')[0];
  } else {
    const date = new Date(now);
    date.setDate(date.getDate() - 30);
    startDate = date.toISOString().split('T')[0];
  }
  
  return CALLS
    .filter(c => (c.kamId === normalizedUserId || c.tlId === normalizedUserId) && c.callDate >= startDate)
    .sort((a, b) => {
      const dateA = new Date(`${a.callDate} ${a.callTime}`);
      const dateB = new Date(`${b.callDate} ${b.callTime}`);
      return dateB.getTime() - dateA.getTime();
    });
}

/**
 * Get all calls for a user (KAM), capped to last 60 days
 */
export function getAllCallsForUser(userId: string, timeScope: 'last-7d' | 'last-30d' | 'last-60d' = 'last-60d', maxDays: number = 60): CallLog[] {
  const normalizedUserId = normalizeKAMId(userId);
  const now = new Date();
  
  let daysBack: number;
  if (timeScope === 'last-7d') {
    daysBack = 7;
  } else if (timeScope === 'last-30d') {
    daysBack = 30;
  } else {
    daysBack = Math.min(maxDays, 60);
  }
  
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysBack);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  return CALLS
    .filter(c => c.kamId === normalizedUserId && c.callDate >= startDateStr)
    .sort((a, b) => {
      const dateA = new Date(`${a.callDate} ${a.callTime}`);
      const dateB = new Date(`${b.callDate} ${b.callTime}`);
      return dateB.getTime() - dateA.getTime();
    });
}

/**
 * Get calls for TL with scope filters
 */
export function getCallsForTL(tlId: string, scopeFilters?: {
  kamId?: string;
  dealerId?: string;
  feedbackStatus?: 'PENDING' | 'SUBMITTED';
  timeScope?: 'today' | 'last-7d' | 'last-30d';
}): CallLog[] {
  const normalizedTLId = normalizeTLId(tlId);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  let startDate: string = today;
  if (scopeFilters?.timeScope === 'last-7d') {
    const date = new Date(now);
    date.setDate(date.getDate() - 7);
    startDate = date.toISOString().split('T')[0];
  } else if (scopeFilters?.timeScope === 'last-30d') {
    const date = new Date(now);
    date.setDate(date.getDate() - 30);
    startDate = date.toISOString().split('T')[0];
  }
  
  return CALLS
    .filter(c => {
      if (c.tlId !== normalizedTLId) return false;
      if (scopeFilters?.kamId && c.kamId !== normalizeKAMId(scopeFilters.kamId)) return false;
      if (scopeFilters?.dealerId && c.dealerId !== normalizeDealerId(scopeFilters.dealerId)) return false;
      if (scopeFilters?.feedbackStatus && c.feedbackStatus !== scopeFilters.feedbackStatus) return false;
      if (c.callDate < startDate) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.callDate} ${a.callTime}`);
      const dateB = new Date(`${b.callDate} ${b.callTime}`);
      return dateB.getTime() - dateA.getTime();
    });
}

/**
 * Get call detail DTO (includes feedback + recording info + productivity separately)
 */
export function getCallDetailDTO(callId: string): (CallLog & { dealer?: Dealer; kam?: KAM }) | undefined {
  const call = CALLS.find(c => c.id === callId);
  if (!call) return undefined;
  
  const dealer = DEALERS.find(d => d.id === call.dealerId);
  const kamList = getAllKAMs();
  const kam = kamList.find(k => k.id === call.kamId);
  
  return {
    ...call,
    dealer,
    kam,
  };
}

/**
 * Submit TL review for a call
 */
export function submitTLReview(callId: string, review: {
  comment?: string;
  flagged?: boolean;
  markedForReview?: boolean;
  tlId: string;
  tlName: string;
}): CallLog | undefined {
  const call = CALLS.find(c => c.id === callId);
  if (!call) return undefined;
  
  call.tlReview = {
    comment: review.comment,
    flagged: review.flagged,
    markedForReview: review.markedForReview,
    reviewedAt: new Date().toISOString(),
    tlId: review.tlId,
    tlName: review.tlName,
  };
  
  return call;
}

/**
 * Visit Log Selectors
 */

export function getVisitById(id: string): VisitLog | undefined {
  return VISITS.find(v => v.id === id);
}

export function getAllVisits(): VisitLog[] {
  return VISITS;
}

export function getVisitsByDealerId(dealerId: string): VisitLog[] {
  const normalizedId = normalizeDealerId(dealerId);
  return VISITS.filter(v => v.dealerId === normalizedId);
}

export function getVisitsByKAM(kamId: string): VisitLog[] {
  const normalizedKAMId = normalizeKAMId(kamId);
  return VISITS.filter(v => v.kamId === normalizedKAMId);
}

export function getVisitsByTL(tlId: string): VisitLog[] {
  const normalizedTLId = normalizeTLId(tlId);
  return VISITS.filter(v => v.tlId === normalizedTLId);
}

export function getVisitsByDateRange(startDate: string, endDate: string): VisitLog[] {
  return VISITS.filter(v => v.visitDate >= startDate && v.visitDate <= endDate);
}

export function getProductiveVisits(): VisitLog[] {
  return VISITS.filter(v => v.isProductive);
}

export function getUnproductiveVisits(): VisitLog[] {
  return VISITS.filter(v => !v.isProductive);
}

/**
 * Lead Selectors (C2B/C2D/GS)
 */

export function getLeadById(id: string): Lead | undefined {
  if (!id) return undefined;
  return LEADS.find(l => l.id === id);
}

export function getAllLeads(): Lead[] {
  return LEADS;
}

export function getAllLeadIds(): string[] {
  return LEADS.map(l => l.id);
}

export function getLeadsByDealerId(dealerId: string): Lead[] {
  const normalizedId = normalizeDealerId(dealerId);
  return LEADS.filter(l => l.dealerId === normalizedId);
}

export function getLeadsByKAM(kamId: string): Lead[] {
  const normalizedKAMId = normalizeKAMId(kamId);
  return LEADS.filter(l => l.kamId === normalizedKAMId);
}

export function getLeadsByTL(tlId: string): Lead[] {
  const normalizedTLId = normalizeTLId(tlId);
  return LEADS.filter(l => l.tlId === normalizedTLId);
}

export function getLeadsByChannel(channel: 'C2B' | 'C2D' | 'GS' | 'NGS' | 'DCF'): Lead[] {
  if (channel === 'NGS') {
    return LEADS.filter(l => l.channel === 'C2B' || l.channel === 'C2D');
  }
  return LEADS.filter(l => l.channel === channel);
}

export function getLeadsByStage(stage: string): Lead[] {
  return LEADS.filter(l => l.stage === stage);
}

export function getLeadsByStatus(status: string): Lead[] {
  return LEADS.filter(l => l.status === status);
}

export function searchLeads(query: string): Lead[] {
  if (!query) return LEADS;
  
  const lowerQuery = query.toLowerCase();
  return LEADS.filter(l =>
    l.id.toLowerCase().includes(lowerQuery) ||
    l.customerName.toLowerCase().includes(lowerQuery) ||
    l.dealerName.toLowerCase().includes(lowerQuery) ||
    l.regNo?.toLowerCase().includes(lowerQuery) ||
    `${l.make} ${l.model}`.toLowerCase().includes(lowerQuery)
  );
}

/**
 * DCF Lead Selectors
 */

export function getDCFLeadById(id: string): DCFLead | undefined {
  return DCF_LEADS.find(l => l.id === id);
}

/**
 * Unified lead lookup — searches both LEADS and DCF_LEADS.
 * Returns the lead and its source type so callers can route correctly.
 */
export function getAnyLeadById(id: string): { lead: Lead | DCFLead; source: 'stock' | 'dcf' } | undefined {
  const stockLead = LEADS.find(l => l.id === id);
  if (stockLead) return { lead: stockLead, source: 'stock' };
  const dcfLead = DCF_LEADS.find(l => l.id === id);
  if (dcfLead) return { lead: dcfLead, source: 'dcf' };
  return undefined;
}

export function getAllDCFLeads(): DCFLead[] {
  return DCF_LEADS;
}

export function getDCFLeadsByDealerId(dealerId: string): DCFLead[] {
  const normalizedId = normalizeDealerId(dealerId);
  return DCF_LEADS.filter(l => l.dealerId === normalizedId);
}

export function getDCFLeadsByKAM(kamId: string): DCFLead[] {
  const normalizedKAMId = normalizeKAMId(kamId);
  return DCF_LEADS.filter(l => l.kamId === normalizedKAMId);
}

export function getDCFLeadsByTL(tlId: string): DCFLead[] {
  const normalizedTLId = normalizeTLId(tlId);
  return DCF_LEADS.filter(l => l.tlId === normalizedTLId);
}

export function getDCFLeadsByStatus(ragStatus: 'green' | 'amber' | 'red'): DCFLead[] {
  return DCF_LEADS.filter(l => l.ragStatus === ragStatus);
}

export function getDCFLeadsByFunnel(funnel: string): DCFLead[] {
  return DCF_LEADS.filter(l => l.currentFunnel === funnel);
}

export function getDisbursedDCFLeads(): DCFLead[] {
  return DCF_LEADS.filter(l => l.overallStatus === 'DISBURSED');
}

export function searchDCFLeads(query: string): DCFLead[] {
  if (!query) return DCF_LEADS;
  
  const lowerQuery = query.toLowerCase();
  return DCF_LEADS.filter(l =>
    l.id.toLowerCase().includes(lowerQuery) ||
    l.customerName.toLowerCase().includes(lowerQuery) ||
    l.dealerName.toLowerCase().includes(lowerQuery) ||
    l.car.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Organization Selectors
 */

export function getAllTLs(): TeamLead[] {
  return ORG.tls;
}

export function getTLById(id: string): TeamLead | undefined {
  const normalizedId = normalizeTLId(id);
  return ORG.tls.find(tl => tl.id === normalizedId);
}

export function getTLsByRegion(region: RegionKey): TeamLead[] {
  return ORG.tls.filter(tl => tl.region === region);
}

export function getAllKAMs(): KAM[] {
  return ORG.tls.flatMap(tl => tl.kams);
}

export function getKAMById(id: string): KAM | undefined {
  const normalizedId = normalizeKAMId(id);
  const allKAMs = getAllKAMs();
  return allKAMs.find(kam => kam.id === normalizedId);
}

export function getKAMsByTL(tlId: string): KAM[] {
  const normalizedId = normalizeTLId(tlId);
  const tl = getTLById(normalizedId);
  return tl?.kams || [];
}

export function getKAMsByRegion(region: RegionKey): KAM[] {
  return ORG.tls
    .filter(tl => tl.region === region)
    .flatMap(tl => tl.kams);
}

export function getAllRegions(): RegionKey[] {
  return ORG.regions;
}

/**
 * Aggregation Helpers
 */

export function getDealerMetrics(dealerId: string) {
  const dealer = getDealerById(dealerId);
  if (!dealer) return null;

  const calls = getCallsByDealerId(dealerId);
  const visits = getVisitsByDealerId(dealerId);
  const dcfLeads = getDCFLeadsByDealerId(dealerId);

  return {
    dealer,
    totalCalls: calls.length,
    productiveCalls: calls.filter(c => c.isProductive).length,
    totalVisits: visits.length,
    productiveVisits: visits.filter(v => v.isProductive).length,
    totalDCFLeads: dcfLeads.length,
    disbursedDCFLeads: dcfLeads.filter(l => l.overallStatus === 'DISBURSED').length,
  };
}

export function getKAMMetrics(kamId: string) {
  const kam = getKAMById(kamId);
  if (!kam) return null;

  const dealers = getDealersByKAM(kamId);
  const calls = getCallsByKAM(kamId);
  const visits = getVisitsByKAM(kamId);
  const dcfLeads = getDCFLeadsByKAM(kamId);

  return {
    kam,
    totalDealers: dealers.length,
    activeDealers: dealers.filter(d => d.status === 'active').length,
    totalCalls: calls.length,
    productiveCalls: calls.filter(c => c.isProductive).length,
    totalVisits: visits.length,
    productiveVisits: visits.filter(v => v.isProductive).length,
    totalDCFLeads: dcfLeads.length,
    disbursedDCFLeads: dcfLeads.filter(l => l.overallStatus === 'DISBURSED').length,
  };
}

/**
 * Toggle Top Dealer status for a dealer
 */
export function toggleTopDealer(dealerCode: string): boolean {
  const dealer = DEALERS.find(d => d.code === dealerCode);
  if (!dealer) return false;
  dealer.isTopDealer = !dealer.isTopDealer;
  // Sync tags array
  if (dealer.isTopDealer) {
    if (!dealer.tags.includes('Top Dealer')) dealer.tags.push('Top Dealer' as any);
  } else {
    dealer.tags = dealer.tags.filter((t: string) => t !== 'Top Dealer') as any;
  }
  return dealer.isTopDealer;
}

export function getTLMetrics(tlId: string) {
  const tl = getTLById(tlId);
  if (!tl) return null;

  const dealers = getDealersByTL(tlId);
  const calls = getCallsByTL(tlId);
  const visits = getVisitsByTL(tlId);
  const dcfLeads = getDCFLeadsByTL(tlId);

  return {
    tl,
    totalDealers: dealers.length,
    activeDealers: dealers.filter(d => d.status === 'active').length,
    totalCalls: calls.length,
    productiveCalls: calls.filter(c => c.isProductive).length,
    totalVisits: visits.length,
    productiveVisits: visits.filter(v => v.isProductive).length,
    totalDCFLeads: dcfLeads.length,
    disbursedDCFLeads: dcfLeads.filter(l => l.overallStatus === 'DISBURSED').length,
  };
}