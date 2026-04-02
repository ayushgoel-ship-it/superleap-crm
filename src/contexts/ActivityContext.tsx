import { createContext, useContext, useState, ReactNode } from 'react';
import {
  evaluateProductivity,
  ProductivityEvaluationResult,
  DealerMetricsSnapshot
} from '../lib/productivityEngine';
import { CALLS as CANONICAL_CALLS, VISITS as CANONICAL_VISITS } from '../data/mockDatabase';
import type { CallLog, VisitLog } from '../data/types';

export type CallStatus = 'pending-feedback' | 'completed' | 'no-answer' | 'busy';
export type VisitStatus = 'not-started' | 'in-progress' | 'completed' | 'incomplete';
export type ProductiveStatus = 'pending' | 'productive' | 'non_productive';

// Navigation origin context
export interface OriginContext {
  origin: 'dealer_detail' | 'lead_detail' | 'dealers_list' | 'leads_list' | 'calls_today' | 'visits_today';
  dealerId?: string;
  dealerName?: string;
  dealerCode?: string;
  leadId?: string;
  returnPage?: string;
}

export interface CallAttempt {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  kamName: string;
  timestamp: string;
  createdAt: string; // When the call was created
  date: string;
  duration?: number; // in seconds
  status: CallStatus;
  connected: boolean;
  outcome?: string;
  nextAction?: string;
  notes?: string;
  tags?: string[];
  originContext?: OriginContext;
  
  // Productivity evaluation (computed from engine)
  beforeSnapshot: DealerMetricsSnapshot; // Metrics before call
  afterSnapshot: DealerMetricsSnapshot; // Metrics after call (or current if pending)
  evaluationResult?: ProductivityEvaluationResult; // Computed from engine
  
  // Legacy fields (for backward compatibility, deprecated)
  productiveStatus: ProductiveStatus;
  productiveReason?: string;
}

export interface Visit {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  kamName: string;
  scheduledTime?: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt?: string; // Added to track when visit was created
  status: VisitStatus;
  purpose?: string[];
  meetingPerson?: string;
  notes?: string;
  photos?: string[];
  outcome?: string;
  nextAction?: string;
  lat?: number;
  lng?: number;
  originContext?: OriginContext;
  feedbackSubmitted?: boolean; // Explicit flag: set to true when feedback is saved
}

interface ActivityContextValue {
  calls: CallAttempt[];
  visits: Visit[];
  addCall: (call: Omit<CallAttempt, 'id' | 'timestamp' | 'date'>) => CallAttempt;
  updateCall: (id: string, updates: Partial<CallAttempt>) => void;
  addVisit: (visit: Omit<Visit, 'id'> & { id?: string }) => Visit;
  updateVisit: (id: string, updates: Partial<Visit>) => void;
  getCallsByDealer: (dealerId: string) => CallAttempt[];
  getVisitsByDealer: (dealerId: string) => Visit[];
  getTodaysCalls: () => CallAttempt[];
  getTodaysVisits: () => Visit[];
  getCallById: (id: string) => CallAttempt | undefined;
  getVisitById: (id: string) => Visit | undefined;
  getOpenVisits: (kamName: string) => Visit[];
}

const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [calls, setCalls] = useState<CallAttempt[]>([
    // Mock initial data with metric snapshots
    {
      id: 'call-1',
      dealerId: 'DLR001',
      dealerName: 'Daily Motoz',
      dealerCode: 'DR080433',
      dealerCity: 'Gurugram',
      kamName: 'Rajesh Kumar',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      date: new Date().toISOString().split('T')[0],
      duration: 180,
      status: 'completed',
      connected: true,
      outcome: 'Discussed 2 seller leads',
      tags: ['Top Dealer'],
      productiveStatus: 'productive',
      productiveReason: 'Lead created on 4 Feb',
      beforeSnapshot: { leads: 10, inspections: 5, stockIns: 3, dcfLeads: 2, dcfOnboarded: 1, dcfDisbursed: 1 },
      afterSnapshot: { leads: 11, inspections: 5, stockIns: 4, dcfLeads: 2, dcfOnboarded: 1, dcfDisbursed: 1 }, // +1 lead, +1 stock-in
    },
    {
      id: 'call-2',
      dealerId: 'DLR002',
      dealerName: 'Gupta Auto World',
      dealerCode: 'GGN-001',
      dealerCity: 'Gurgaon',
      kamName: 'Rajesh Kumar',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 240,
      status: 'completed',
      connected: true,
      outcome: 'Lead sharing discussion',
      tags: ['Top Dealer', 'DCF Onboarded'],
      productiveStatus: 'pending',
      beforeSnapshot: { leads: 8, inspections: 4, stockIns: 2, dcfLeads: 5, dcfOnboarded: 1, dcfDisbursed: 3 },
      afterSnapshot: { leads: 8, inspections: 4, stockIns: 2, dcfLeads: 5, dcfOnboarded: 1, dcfDisbursed: 3 }, // No change yet (pending)
    },
    {
      id: 'call-3',
      dealerId: 'DLR003',
      dealerName: 'Singh Motors',
      dealerCode: 'DL-002',
      dealerCity: 'Delhi',
      kamName: 'Rajesh Kumar',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 120,
      status: 'completed',
      connected: true,
      outcome: 'No immediate business',
      tags: [],
      productiveStatus: 'non_productive',
      beforeSnapshot: { leads: 5, inspections: 2, stockIns: 1, dcfLeads: 0, dcfOnboarded: 0, dcfDisbursed: 0 },
      afterSnapshot: { leads: 5, inspections: 2, stockIns: 1, dcfLeads: 0, dcfOnboarded: 0, dcfDisbursed: 0 }, // No change after 10 days
    },
    {
      id: 'call-4',
      dealerId: 'DLR004',
      dealerName: 'AutoMax Delhi',
      dealerCode: 'DL-005',
      dealerCity: 'Delhi',
      kamName: 'Rajesh Kumar',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 90,
      status: 'completed',
      connected: true,
      outcome: 'Busy with other buyers',
      tags: [],
      productiveStatus: 'non_productive',
      beforeSnapshot: { leads: 3, inspections: 1, stockIns: 1, dcfLeads: 0, dcfOnboarded: 0, dcfDisbursed: 0 },
      afterSnapshot: { leads: 3, inspections: 1, stockIns: 1, dcfLeads: 0, dcfOnboarded: 0, dcfDisbursed: 0 }, // No change yet (but within 7 days, so pending)
    },
    {
      id: 'call-5',
      dealerId: 'DLR005',
      dealerName: 'Speed Wheels',
      dealerCode: 'GGN-008',
      dealerCity: 'Gurgaon',
      kamName: 'Rajesh Kumar',
      timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 60,
      status: 'completed',
      connected: true,
      outcome: 'Not interested at the moment',
      tags: [],
      productiveStatus: 'non_productive',
      beforeSnapshot: { leads: 2, inspections: 1, stockIns: 0, dcfLeads: 0, dcfOnboarded: 0, dcfDisbursed: 0 },
      afterSnapshot: { leads: 2, inspections: 1, stockIns: 0, dcfLeads: 0, dcfOnboarded: 0, dcfDisbursed: 0 }, // No change after 8 days
    },
    {
      id: 'call-6',
      dealerId: 'DLR002',
      dealerName: 'Gupta Auto World',
      dealerCode: 'GGN-001',
      dealerCity: 'Gurgaon',
      kamName: 'Rajesh Kumar',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 45,
      status: 'completed',
      connected: true,
      outcome: 'Low inventory period',
      tags: ['Top Dealer', 'DCF Onboarded'],
      productiveStatus: 'non_productive',
      beforeSnapshot: { leads: 8, inspections: 4, stockIns: 2, dcfLeads: 5, dcfOnboarded: 1, dcfDisbursed: 3 },
      afterSnapshot: { leads: 8, inspections: 4, stockIns: 2, dcfLeads: 7, dcfOnboarded: 1, dcfDisbursed: 3 }, // +2 DCF leads
    },
    {
      id: 'call-7',
      dealerId: 'DLR006',
      dealerName: 'Royal Cars',
      dealerCode: 'DL-012',
      dealerCity: 'Delhi',
      kamName: 'Rajesh Kumar',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 75,
      status: 'completed',
      connected: true,
      outcome: 'General catch-up',
      tags: [],
      productiveStatus: 'non_productive',
      beforeSnapshot: { leads: 4, inspections: 2, stockIns: 1, dcfLeads: 1, dcfOnboarded: 0, dcfDisbursed: 0 },
      afterSnapshot: { leads: 4, inspections: 3, stockIns: 1, dcfLeads: 1, dcfOnboarded: 0, dcfDisbursed: 0 }, // +1 inspection
    },
  ].map(call => {
    // Compute productivity evaluation for each call
    const evaluationResult = evaluateProductivity({
      interactionType: 'CALL',
      interactionAt: new Date(call.timestamp),
      beforeSnapshot: call.beforeSnapshot,
      afterSnapshot: call.afterSnapshot,
      now: new Date(),
    });
    return {
      ...call,
      evaluationResult,
    };
  }));

  const [visits, setVisits] = useState<Visit[]>([
    // Mock initial data
    {
      id: 'visit-1',
      dealerId: 'DLR001',
      dealerName: 'Daily Motoz',
      dealerCode: 'DR080433',
      dealerCity: 'Gurugram',
      kamName: 'Rajesh Kumar',
      checkInTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      checkOutTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      status: 'completed',
      purpose: ['Lead Discussion', 'Relationship Building'],
      meetingPerson: 'Suresh (Owner)',
      outcome: 'Received 3 seller leads',
      nextAction: 'Schedule inspection',
    },
    {
      id: 'visit-2',
      dealerId: 'DLR002',
      dealerName: 'Gupta Auto World',
      dealerCode: 'GGN-001',
      dealerCity: 'Gurgaon',
      kamName: 'Rajesh Kumar',
      checkInTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      checkOutTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      status: 'completed',
      purpose: ['General Check-in'],
      meetingPerson: 'Rakesh (Manager)',
      outcome: 'General discussion about market',
      nextAction: '', // No follow-up documented
    },
    {
      id: 'visit-3',
      dealerId: 'DLR004',
      dealerName: 'AutoMax Delhi',
      dealerCode: 'DL-005',
      dealerCity: 'Delhi',
      kamName: 'Rajesh Kumar',
      checkInTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      checkOutTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      status: 'completed',
      purpose: ['Relationship Building'],
      meetingPerson: 'Amit (Owner)',
      outcome: 'Met the dealer, discussed business in general',
      // No nextAction field at all
    },
    {
      id: 'visit-4',
      dealerId: 'DLR005',
      dealerName: 'Speed Wheels',
      dealerCode: 'GGN-008',
      dealerCity: 'Gurgaon',
      kamName: 'Rajesh Kumar',
      checkInTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      checkOutTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
      status: 'completed',
      purpose: ['DCF Discussion'],
      meetingPerson: 'Vijay (Owner)',
      outcome: 'Explained DCF program',
      nextAction: '', // Empty string
    },
    {
      id: 'visit-5',
      dealerId: 'DLR003',
      dealerName: 'Singh Motors',
      dealerCode: 'DL-002',
      dealerCity: 'Delhi',
      kamName: 'Rajesh Kumar',
      checkInTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      checkOutTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
      status: 'completed',
      purpose: ['Lead Discussion'],
      meetingPerson: 'Rajiv (Manager)',
      outcome: 'Discussed potential leads',
      // No nextAction
    },
    {
      id: 'visit-6',
      dealerId: 'DLR006',
      dealerName: 'Royal Cars',
      dealerCode: 'DL-012',
      dealerCity: 'Delhi',
      kamName: 'Rajesh Kumar',
      checkInTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      checkOutTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
      status: 'completed',
      purpose: ['Inspection Follow-up'],
      meetingPerson: 'Mohan (Owner)',
      outcome: 'Checked on pending inspections',
      nextAction: 'Follow up next week',
    },
  ]);

  const addCall = (callData: Omit<CallAttempt, 'id' | 'timestamp' | 'date'>): CallAttempt => {
    const now = new Date();
    const newCall: CallAttempt = {
      ...callData,
      id: `call-${Date.now()}`,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      createdAt: now.toISOString(),
      productiveStatus: 'pending',
    };
    setCalls(prev => [newCall, ...prev]);

    // Sync to canonical CALLS array so dashboard metrics include this call
    if (!CANONICAL_CALLS.some(c => c.id === newCall.id)) {
      CANONICAL_CALLS.push({
        id: newCall.id,
        dealerId: newCall.dealerId,
        dealerName: newCall.dealerName,
        dealerCode: newCall.dealerCode,
        phone: '',
        callDate: newCall.date,
        callTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration: newCall.duration ? `${Math.floor(newCall.duration / 60)}m ${newCall.duration % 60}s` : '0m 0s',
        kamId: 'kam-ncr-001', // Current user
        kamName: newCall.kamName,
        tlId: 'tl-ncr-01',
        outcome: newCall.outcome || 'Connected',
        isProductive: newCall.connected,
        productivitySource: 'KAM',
      } as CallLog);
    }

    return newCall;
  };

  const updateCall = (id: string, updates: Partial<CallAttempt>) => {
    setCalls(prev => prev.map(call => call.id === id ? { ...call, ...updates } : call));
    // Sync productive status to canonical
    const canonicalCall = CANONICAL_CALLS.find(c => c.id === id);
    if (canonicalCall && updates.connected !== undefined) {
      canonicalCall.isProductive = updates.connected;
    }
  };

  const addVisit = (visitData: Omit<Visit, 'id'> & { id?: string }): Visit => {
    const newVisit: Visit = {
      ...visitData,
      id: visitData.id || `visit-${Date.now()}`,
    };
    setVisits(prev => {
      // Deduplicate: if a visit with this ID already exists, skip
      if (prev.some(v => v.id === newVisit.id)) return prev;
      return [newVisit, ...prev];
    });

    // Sync to canonical VISITS array so dashboard metrics include this visit
    if (!CANONICAL_VISITS.some(v => v.id === newVisit.id)) {
      const now = new Date();
      CANONICAL_VISITS.push({
        id: newVisit.id,
        dealerId: newVisit.dealerId,
        dealerName: newVisit.dealerName,
        dealerCode: newVisit.dealerCode,
        visitDate: now.toISOString().split('T')[0],
        visitTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration: '0m',
        kamId: 'kam-ncr-001',
        kamName: newVisit.kamName,
        tlId: 'tl-ncr-01',
        checkInLocation: { latitude: newVisit.lat || 0, longitude: newVisit.lng || 0 },
        isProductive: false, // Updated on feedback
        productivitySource: 'KAM',
        visitType: 'Unplanned',
        checkInAt: newVisit.checkInTime || now.toISOString(),
      } as VisitLog);
    }

    return newVisit;
  };

  const updateVisit = (id: string, updates: Partial<Visit>) => {
    setVisits(prev => prev.map(visit => visit.id === id ? { ...visit, ...updates } : visit));
    // Sync feedback/completion to canonical visits
    const canonicalVisit = CANONICAL_VISITS.find(v => v.id === id);
    if (canonicalVisit) {
      if (updates.checkOutTime) canonicalVisit.completedAt = updates.checkOutTime;
      if (updates.feedbackSubmitted) {
        canonicalVisit.isProductive = true;
        canonicalVisit.feedbackStatus = 'SUBMITTED';
      }
    }
  };

  const getCallsByDealer = (dealerId: string): CallAttempt[] => {
    return calls.filter(call => call.dealerId === dealerId);
  };

  const getVisitsByDealer = (dealerId: string): Visit[] => {
    return visits.filter(visit => visit.dealerId === dealerId);
  };

  const getTodaysCalls = (): CallAttempt[] => {
    const today = new Date().toISOString().split('T')[0];
    return calls.filter(call => call.date === today);
  };

  const getTodaysVisits = (): Visit[] => {
    const today = new Date().toISOString().split('T')[0];
    return visits.filter(visit => {
      // Check createdAt first (for newly created visits)
      if (visit.createdAt) {
        const createdDate = new Date(visit.createdAt).toISOString().split('T')[0];
        if (createdDate === today) return true;
      }
      // Fallback to checkInTime for older visits
      if (visit.checkInTime) {
        const visitDate = new Date(visit.checkInTime).toISOString().split('T')[0];
        return visitDate === today;
      }
      return false;
    });
  };

  const getCallById = (id: string): CallAttempt | undefined => {
    return calls.find(call => call.id === id);
  };

  const getVisitById = (id: string): Visit | undefined => {
    return visits.find(visit => visit.id === id);
  };

  const getOpenVisits = (kamName: string): Visit[] => {
    return visits.filter(visit => visit.kamName === kamName && visit.status === 'in-progress');
  };

  return (
    <ActivityContext.Provider
      value={{
        calls,
        visits,
        addCall,
        updateCall,
        addVisit,
        updateVisit,
        getCallsByDealer,
        getVisitsByDealer,
        getTodaysCalls,
        getTodaysVisits,
        getCallById,
        getVisitById,
        getOpenVisits,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}