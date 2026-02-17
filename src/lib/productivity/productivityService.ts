// Productivity Evidence Service
// Single source of truth for productivity calculations

import { ProductivityStatus, PRODUCTIVITY_WINDOWS } from '../domain/constants';

export interface ActivityDelta {
  leadsDelta: number;
  inspectionsDelta: number;
  stockInsDelta: number;
  dcfOnboardingDelta: number;
  dcfLeadsDelta: number;
  dcfDisbursalDelta: number;
}

export interface ProductivityEvidence {
  interactionDate: string;
  daysSinceInteraction: number;
  windowDays: number;
  windowEndDate: string;
  isWindowComplete: boolean;
  daysRemaining: number;
  activityDelta: ActivityDelta;
  isProductive: boolean;
  whyText: string;
  status: ProductivityStatus;
}

export interface DealerActivity {
  dealerId: string;
  leads: Array<{ id: string; createdAt: string; type: string }>;
  inspections: Array<{ id: string; scheduledAt: string }>;
  stockIns: Array<{ id: string; stockedAt: string }>;
  dcfOnboarding: Array<{ id: string; onboardedAt: string }>;
  dcfLeads: Array<{ id: string; createdAt: string }>;
  dcfDisbursals: Array<{ id: string; disbursedAt: string }>;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Count activities within a date range
 */
function countActivitiesInRange(
  activities: Array<{ createdAt?: string; scheduledAt?: string; stockedAt?: string; onboardedAt?: string; disbursedAt?: string }>,
  startDate: Date,
  endDate: Date
): number {
  return activities.filter(activity => {
    const activityDate = new Date(
      activity.createdAt || 
      activity.scheduledAt || 
      activity.stockedAt || 
      activity.onboardedAt || 
      activity.disbursedAt || 
      ''
    );
    return activityDate >= startDate && activityDate <= endDate;
  }).length;
}

/**
 * Compute productivity evidence for a call
 * Window: 7 days after call
 */
export function computeCallProductivity(
  callTimestamp: string,
  dealerActivity: DealerActivity
): ProductivityEvidence {
  const interactionDate = new Date(callTimestamp);
  const today = new Date();
  const windowDays = PRODUCTIVITY_WINDOWS.CALL;
  const windowEndDate = new Date(interactionDate);
  windowEndDate.setDate(windowEndDate.getDate() + windowDays);
  
  const daysSinceInteraction = daysBetween(interactionDate, today);
  const isWindowComplete = today >= windowEndDate;
  const daysRemaining = isWindowComplete ? 0 : Math.max(0, daysBetween(today, windowEndDate));
  
  // Compute deltas (activities AFTER the call within window)
  const windowEnd = isWindowComplete ? windowEndDate : today;
  
  const activityDelta: ActivityDelta = {
    leadsDelta: countActivitiesInRange(dealerActivity.leads, interactionDate, windowEnd),
    inspectionsDelta: countActivitiesInRange(dealerActivity.inspections, interactionDate, windowEnd),
    stockInsDelta: countActivitiesInRange(dealerActivity.stockIns, interactionDate, windowEnd),
    dcfOnboardingDelta: countActivitiesInRange(dealerActivity.dcfOnboarding, interactionDate, windowEnd),
    dcfLeadsDelta: countActivitiesInRange(dealerActivity.dcfLeads, interactionDate, windowEnd),
    dcfDisbursalDelta: countActivitiesInRange(dealerActivity.dcfDisbursals, interactionDate, windowEnd),
  };
  
  // Determine if productive (any delta > 0)
  const totalActivity = Object.values(activityDelta).reduce((sum, val) => sum + val, 0);
  const isProductive = totalActivity > 0;
  
  // Generate why text
  let whyText = '';
  let status: ProductivityStatus = 'non_productive';
  
  if (isProductive) {
    const activities: string[] = [];
    if (activityDelta.leadsDelta > 0) activities.push(`Leads +${activityDelta.leadsDelta}`);
    if (activityDelta.inspectionsDelta > 0) activities.push(`Inspections +${activityDelta.inspectionsDelta}`);
    if (activityDelta.stockInsDelta > 0) activities.push(`Stock-ins +${activityDelta.stockInsDelta}`);
    if (activityDelta.dcfOnboardingDelta > 0) activities.push(`DCF onboarding +${activityDelta.dcfOnboardingDelta}`);
    if (activityDelta.dcfLeadsDelta > 0) activities.push(`DCF leads +${activityDelta.dcfLeadsDelta}`);
    if (activityDelta.dcfDisbursalDelta > 0) activities.push(`DCF disbursal +${activityDelta.dcfDisbursalDelta}`);
    
    whyText = `Productive because after this call: ${activities.join(', ')}`;
    status = isWindowComplete ? 'productive' : 'provisional';
  } else {
    whyText = `Non-productive because there was no change in Leads/Inspections/Stock-ins/DCF in the ${windowDays} days after this call.`;
    status = isWindowComplete ? 'non_productive' : 'provisional';
  }
  
  return {
    interactionDate: callTimestamp,
    daysSinceInteraction,
    windowDays,
    windowEndDate: windowEndDate.toISOString(),
    isWindowComplete,
    daysRemaining,
    activityDelta,
    isProductive,
    whyText,
    status,
  };
}

/**
 * Compute productivity evidence for a visit
 * Window: 30 days after visit
 */
export function computeVisitProductivity(
  visitTimestamp: string,
  dealerActivity: DealerActivity
): ProductivityEvidence {
  const interactionDate = new Date(visitTimestamp);
  const today = new Date();
  const windowDays = PRODUCTIVITY_WINDOWS.VISIT;
  const windowEndDate = new Date(interactionDate);
  windowEndDate.setDate(windowEndDate.getDate() + windowDays);
  
  const daysSinceInteraction = daysBetween(interactionDate, today);
  const isWindowComplete = today >= windowEndDate;
  const daysRemaining = isWindowComplete ? 0 : Math.max(0, daysBetween(today, windowEndDate));
  
  // Compute deltas (activities AFTER the visit within window)
  const windowEnd = isWindowComplete ? windowEndDate : today;
  
  const activityDelta: ActivityDelta = {
    leadsDelta: countActivitiesInRange(dealerActivity.leads, interactionDate, windowEnd),
    inspectionsDelta: countActivitiesInRange(dealerActivity.inspections, interactionDate, windowEnd),
    stockInsDelta: countActivitiesInRange(dealerActivity.stockIns, interactionDate, windowEnd),
    dcfOnboardingDelta: countActivitiesInRange(dealerActivity.dcfOnboarding, interactionDate, windowEnd),
    dcfLeadsDelta: countActivitiesInRange(dealerActivity.dcfLeads, interactionDate, windowEnd),
    dcfDisbursalDelta: countActivitiesInRange(dealerActivity.dcfDisbursals, interactionDate, windowEnd),
  };
  
  // Determine if productive (any delta > 0)
  const totalActivity = Object.values(activityDelta).reduce((sum, val) => sum + val, 0);
  const isProductive = totalActivity > 0;
  
  // Generate why text
  let whyText = '';
  let status: ProductivityStatus = 'non_productive';
  
  if (isProductive) {
    const activities: string[] = [];
    if (activityDelta.leadsDelta > 0) activities.push(`Leads +${activityDelta.leadsDelta}`);
    if (activityDelta.inspectionsDelta > 0) activities.push(`Inspections +${activityDelta.inspectionsDelta}`);
    if (activityDelta.stockInsDelta > 0) activities.push(`Stock-ins +${activityDelta.stockInsDelta}`);
    if (activityDelta.dcfOnboardingDelta > 0) activities.push(`DCF onboarding +${activityDelta.dcfOnboardingDelta}`);
    if (activityDelta.dcfLeadsDelta > 0) activities.push(`DCF leads +${activityDelta.dcfLeadsDelta}`);
    if (activityDelta.dcfDisbursalDelta > 0) activities.push(`DCF disbursal +${activityDelta.dcfDisbursalDelta}`);
    
    whyText = `Productive because after this visit: ${activities.join(', ')}`;
    status = isWindowComplete ? 'productive' : 'provisional';
  } else {
    whyText = `Non-productive because there was no change in Leads/Inspections/Stock-ins/DCF in the ${windowDays} days after this visit.`;
    status = isWindowComplete ? 'non_productive' : 'provisional';
  }
  
  return {
    interactionDate: visitTimestamp,
    daysSinceInteraction,
    windowDays,
    windowEndDate: windowEndDate.toISOString(),
    isWindowComplete,
    daysRemaining,
    activityDelta,
    isProductive,
    whyText,
    status,
  };
}