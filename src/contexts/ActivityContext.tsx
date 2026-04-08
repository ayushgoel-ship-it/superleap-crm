import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  evaluateProductivity,
  ProductivityEvaluationResult,
  DealerMetricsSnapshot
} from '../lib/productivityEngine';
import {
  listCalls,
  listVisits,
  registerCall,
  startVisit,
  endVisit,
  submitCallFeedback,
  submitVisitFeedback,
  type CallRecord,
  type VisitRecord,
} from '../api/visit.api';
import { useAuth } from '../components/auth/AuthProvider';

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
  createdAt: string;
  date: string;
  duration?: number;
  status: CallStatus;
  connected: boolean;
  outcome?: string;
  nextAction?: string;
  notes?: string;
  tags?: string[];
  originContext?: OriginContext;
  beforeSnapshot: DealerMetricsSnapshot;
  afterSnapshot: DealerMetricsSnapshot;
  evaluationResult?: ProductivityEvaluationResult;
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
  createdAt?: string;
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
  feedbackSubmitted?: boolean;
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
  refresh: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

const EMPTY_SNAPSHOT: DealerMetricsSnapshot = {
  leads: 0, inspections: 0, stockIns: 0, dcfLeads: 0, dcfOnboarded: 0, dcfDisbursed: 0,
};

// ── Mappers from Supabase row shapes → local interfaces ──
function mapCallRecordToCallAttempt(c: CallRecord): CallAttempt {
  const ts = c.startAt || c.createdAt || new Date().toISOString();
  const hasFeedback = !!c.feedback;
  const productiveStatus: ProductiveStatus = hasFeedback ? 'productive' : 'pending';
  const status: CallStatus = hasFeedback ? 'completed' : 'pending-feedback';
  return {
    id: c.id,
    dealerId: c.dealerId,
    dealerName: c.dealerName,
    dealerCode: c.dealerCode || '',
    dealerCity: c.dealerCity || '',
    kamName: c.kamName || '',
    timestamp: ts,
    createdAt: c.createdAt || ts,
    date: ts.split('T')[0],
    duration: c.durationSeconds || undefined,
    status,
    connected: true,
    outcome: c.feedback?.note,
    productiveStatus,
    beforeSnapshot: EMPTY_SNAPSHOT,
    afterSnapshot: EMPTY_SNAPSHOT,
    evaluationResult: evaluateProductivity({
      interactionType: 'CALL',
      interactionAt: new Date(ts),
      beforeSnapshot: EMPTY_SNAPSHOT,
      afterSnapshot: EMPTY_SNAPSHOT,
      now: new Date(),
    }),
  };
}

function mapVisitRecordToVisit(v: VisitRecord): Visit {
  const status: VisitStatus =
    v.status === 'CLOSED' ? 'completed'
    : v.status === 'COMPLETED_NO_FEEDBACK' ? 'completed'
    : 'in-progress';
  return {
    id: v.id,
    dealerId: v.dealerId,
    dealerName: v.dealerName,
    dealerCode: v.dealerCode || '',
    dealerCity: v.dealerCity || '',
    kamName: v.kamName || '',
    checkInTime: v.startAt || undefined,
    checkOutTime: v.endAt || undefined,
    createdAt: v.createdAt || v.startAt || undefined,
    status,
    outcome: v.feedback?.note,
    feedbackSubmitted: !!v.feedback,
    lat: v.lat || undefined,
    lng: v.lng || undefined,
  };
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { activeActor } = useAuth();
  const userId = activeActor?.userId;

  const [calls, setCalls] = useState<CallAttempt[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) {
      // TODO: no current user — running unauthenticated, skip backend fetch.
      return;
    }
    try {
      const [callRecords, visitRecords] = await Promise.all([
        listCalls(userId),
        listVisits(userId),
      ]);
      setCalls(callRecords.map(mapCallRecordToCallAttempt));
      setVisits(visitRecords.map(mapVisitRecordToVisit));
    } catch (err) {
      console.warn('[ActivityContext] refresh failed', err);
    }
  }, [userId]);

  useEffect(() => {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.log('[ActivityContext] userId =', userId);
    }
    refresh();
    // Periodic refresh (30s) + refresh on window focus
    const intervalId = window.setInterval(() => { refresh(); }, 30_000);
    const onFocus = () => { refresh(); };
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, userId]);

  const genUuid = () =>
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

  const addCall = (callData: Omit<CallAttempt, 'id' | 'timestamp' | 'date'>): CallAttempt => {
    const now = new Date();
    const tempId = genUuid();
    const newCall: CallAttempt = {
      ...callData,
      id: tempId,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      createdAt: now.toISOString(),
      productiveStatus: 'pending',
    };
    setCalls(prev => [newCall, ...prev]);

    // Persist to Supabase with explicit UUID so later feedback updates can match
    registerCall({
      id: tempId,
      dealerId: callData.dealerId,
      dealerName: callData.dealerName,
      dealerCode: callData.dealerCode,
      dealerCity: callData.dealerCity,
      userId: userId || 'unknown',
      kamName: callData.kamName,
      durationSeconds: callData.duration,
    })
      .then(rec => {
        setCalls(prev => prev.map(c => c.id === tempId ? { ...c, id: rec.id } : c));
        refresh();
      })
      .catch(err => console.warn('[ActivityContext] addCall persist failed', err));

    return newCall;
  };

  const updateCall = (id: string, updates: Partial<CallAttempt>) => {
    setCalls(prev => prev.map(call => call.id === id ? { ...call, ...updates } : call));

    // If feedback fields are present → submit to Supabase
    const hasFeedback = updates.outcome != null || updates.notes != null
      || updates.productiveStatus === 'productive' || updates.productiveStatus === 'non_productive'
      || updates.status === 'completed';
    if (hasFeedback) {
      submitCallFeedback(id, {
        interactionType: 'CALL',
        note: updates.outcome || updates.notes || '',
      })
        .then(() => refresh())
        .catch(err => console.warn('[ActivityContext] updateCall persist failed', err));
    }
  };

  const addVisit = (visitData: Omit<Visit, 'id'> & { id?: string }): Visit => {
    // Generate a real UUID so the client-side id matches the visits.visit_id
    // primary key (UUID). Using `visit-${Date.now()}` would cause subsequent
    // endVisit / submitVisitFeedback .eq('visit_id', ...) lookups to fail and
    // the visit would remain stuck in-progress after feedback submit.
    const genId = () =>
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now().toString(16)}-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          });
    const newVisit: Visit = {
      ...visitData,
      id: visitData.id || genId(),
    };
    setVisits(prev => {
      if (prev.some(v => v.id === newVisit.id)) return prev;
      return [newVisit, ...prev];
    });

    // Persist
    startVisit({
      id: newVisit.id,
      dealerId: visitData.dealerId,
      dealerName: visitData.dealerName,
      dealerCode: visitData.dealerCode,
      dealerCity: visitData.dealerCity,
      userId: userId || 'unknown',
      kamName: visitData.kamName,
      lat: visitData.lat ?? null,
      lng: visitData.lng ?? null,
      distanceAtStart: null,
      gpsAccuracyAtStart: null,
      geoVerified: false,
    })
      .then(rec => {
        setVisits(prev => prev.map(v => v.id === newVisit.id ? { ...v, id: rec.id } : v));
        refresh();
      })
      .catch(err => console.warn('[visit] addVisit persist failed', err));

    return newVisit;
  };

  const updateVisit = (id: string, updates: Partial<Visit>) => {
    setVisits(prev => prev.map(visit => visit.id === id ? { ...visit, ...updates } : visit));

    const hasFeedback = updates.outcome != null || updates.notes != null
      || updates.feedbackSubmitted === true || updates.purpose != null;
    const isCompleted = updates.status === 'completed';

    if (hasFeedback) {
      submitVisitFeedback(id, {
        interactionType: 'VISIT',
        note: updates.outcome || updates.notes || '',
      })
        .then(() => refresh())
        .catch(err => console.warn('[ActivityContext] updateVisit persist failed', err));
    }
    if (isCompleted) {
      endVisit(id)
        .then(() => refresh())
        .catch(err => console.warn('[ActivityContext] endVisit failed', err));
    }
  };

  const getCallsByDealer = (dealerId: string): CallAttempt[] =>
    calls.filter(call => call.dealerId === dealerId);

  const getVisitsByDealer = (dealerId: string): Visit[] =>
    visits.filter(visit => visit.dealerId === dealerId);

  const getTodaysCalls = (): CallAttempt[] => {
    const today = new Date().toISOString().split('T')[0];
    return calls.filter(call => call.date === today);
  };

  const getTodaysVisits = (): Visit[] => {
    const today = new Date().toISOString().split('T')[0];
    return visits.filter(visit => {
      if (visit.createdAt) {
        const createdDate = new Date(visit.createdAt).toISOString().split('T')[0];
        if (createdDate === today) return true;
      }
      if (visit.checkInTime) {
        const visitDate = new Date(visit.checkInTime).toISOString().split('T')[0];
        return visitDate === today;
      }
      return false;
    });
  };

  const getCallById = (id: string): CallAttempt | undefined => calls.find(c => c.id === id);
  const getVisitById = (id: string): Visit | undefined => visits.find(v => v.id === id);
  const getOpenVisits = (kamName: string): Visit[] =>
    visits.filter(v => v.kamName === kamName && v.status === 'in-progress');

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
        refresh,
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
