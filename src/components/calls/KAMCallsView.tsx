import { useState } from 'react';
import { Search, Phone, Filter, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, User, Building2 } from 'lucide-react';
import { UnifiedFeedbackForm } from '../activity/UnifiedFeedbackForm';
import type { UnifiedFeedbackData } from '../activity/visitHelpers';
import * as visitApi from '../../api/visit.api';
import { toast } from 'sonner@2.0.3';
import { useActivity } from '../../contexts/ActivityContext';

type CallOutcome = 'connected_positive' | 'connected_neutral' | 'connected_negative' | 'not_reachable' | 'switched_off' | 'wrong_number' | 'call_back_later';
type ProductiveStatus = 'productive' | 'non_productive' | 'unknown';
type Channel = 'C2B' | 'C2D' | 'GS' | 'DCF';
type DealerStage = 'lead_giving' | 'inspecting' | 'transacting' | 'dormant' | 'dcf_onboarded';
type FeedbackStatus = 'Pending' | 'Submitted';

interface Dealer {
  id: string;
  name: string;
  code: string;
  city: string;
  stage: DealerStage;
  phone: string;
  contactName: string;
  contactRole: string;
}

interface CallAttempt {
  callId: string;
  dealer: Dealer;
  kam: string;
  phone: string;
  callStartTime: string;
  callDuration: string;
  callStatus: 'Attempted' | 'Completed';
  recordingStatus: 'Available' | 'Not Available';
  feedbackStatus: FeedbackStatus;
  feedback?: any;
}

interface Call {
  id: string;
  dealer: Dealer;
  contactName: string;
  contactPhone: string;
  date: string;
  time: string;
  duration?: string;
  outcome?: CallOutcome;
  productive?: ProductiveStatus;
  channel?: Channel;
  scheduledTime?: string;
  status?: 'not_started' | 'completed' | 'missed' | 'rescheduled';
  purpose?: string;
  lastCall?: string;
  lastVisit?: string;
  leadsMTD?: number;
  reasonTag?: string;
  callAttempt?: CallAttempt;
}

export interface KAMCallsViewProps {
  onNavigateToCallFeedback?: (callId: string) => void;
}

export function KAMCallsView({ onNavigateToCallFeedback }: KAMCallsViewProps) {
  const { addCall } = useActivity(); // Add this to use ActivityContext
  const [activeSubTab, setActiveSubTab] = useState<'suggested' | 'today' | 'all'>('suggested');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCallFeedback, setShowCallFeedback] = useState(false);
  const [currentCallAttempt, setCurrentCallAttempt] = useState<CallAttempt | null>(null);
  const [callAttempts, setCallAttempts] = useState<CallAttempt[]>([]);
  
  // All Calls filters
  const [activeFilterTab, setActiveFilterTab] = useState<'outcome' | 'time' | 'productive' | 'channel'>('outcome');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [selectedTime, setSelectedTime] = useState<string>('mtd');
  const [selectedProductive, setSelectedProductive] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  // Mock data for Suggested Calls
  const suggestedCalls: Call[] = [
    {
      id: 'sc1',
      dealer: {
        id: 'd1',
        name: 'Daily Motoz',
        code: 'DR080433',
        city: 'Gurugram',
        stage: 'lead_giving',
        phone: '+91 98765 43210',
        contactName: 'Ramesh Kumar',
        contactRole: 'Owner',
      },
      contactName: 'Ramesh Kumar',
      contactPhone: '+91 98765 43210',
      date: '',
      time: '',
      lastCall: '12 days ago',
      lastVisit: '5 days ago',
      leadsMTD: 4,
      reasonTag: 'No call in last 7 days',
    },
    {
      id: 'sc2',
      dealer: {
        id: 'd2',
        name: 'Gupta Auto World',
        code: 'GGN-001',
        city: 'Gurugram',
        stage: 'dcf_onboarded',
        phone: '+91 98765 43211',
        contactName: 'Suresh Gupta',
        contactRole: 'Owner',
      },
      contactName: 'Suresh Gupta',
      contactPhone: '+91 98765 43211',
      date: '',
      time: '',
      lastCall: '8 days ago',
      lastVisit: '2 days ago',
      leadsMTD: 0,
      reasonTag: 'DCF onboarded, 0 DCF leads',
    },
    {
      id: 'sc3',
      dealer: {
        id: 'd3',
        name: 'Sharma Motors',
        code: 'GGN-002',
        city: 'Gurugram',
        stage: 'dormant',
        phone: '+91 98765 43212',
        contactName: 'Vijay Sharma',
        contactRole: 'Manager',
      },
      contactName: 'Vijay Sharma',
      contactPhone: '+91 98765 43212',
      date: '',
      time: '',
      lastCall: '45 days ago',
      lastVisit: 'Never',
      leadsMTD: 0,
      reasonTag: 'Previously active',
    },
  ];

  // Today's calls with call attempts
  const todaysCalls = callAttempts.map(attempt => ({
    id: attempt.callId,
    dealer: attempt.dealer,
    contactName: attempt.dealer.contactName,
    contactPhone: attempt.phone,
    date: '12 Dec',
    time: attempt.callStartTime,
    duration: attempt.callDuration,
    callAttempt: attempt,
  }));

  // Count pending feedback
  const pendingFeedbackCount = callAttempts.filter(a => a.feedbackStatus === 'Pending').length;

  const handleCallNow = (call: Call) => {
    // Create origin context
    const originContext = {
      origin: 'suggested_calls' as const,
      dealerId: call.dealer.id,
      dealerName: call.dealer.name,
      dealerCode: call.dealer.code,
    };

    // Create call attempt using ActivityContext
    const newCall = addCall({
      dealerId: call.dealer.id,
      dealerName: call.dealer.name,
      dealerCode: call.dealer.code,
      dealerCity: call.dealer.city,
      kamName: 'Rajesh Kumar', // Get from session/context
      status: 'pending-feedback',
      connected: false,
      tags: [], // Add dealer tags if available
      originContext,
    });

    // Open system dialer
    if (call.contactPhone) {
      window.location.href = `tel:${call.contactPhone}`;
    }
    
    // Navigate to call feedback page with the new call ID
    toast.success('Call initiated', {
      description: 'Opening feedback form...',
      duration: 2000,
    });

    if (onNavigateToCallFeedback) {
      onNavigateToCallFeedback(newCall.id);
    }
  };

  const handleEnterFeedback = (attempt: CallAttempt) => {
    setCurrentCallAttempt(attempt);
    setShowCallFeedback(true);
  };

  const handleFeedbackSubmit = async (data: UnifiedFeedbackData) => {
    if (currentCallAttempt) {
      // Update call attempt with feedback
      setCallAttempts(prev =>
        prev.map(a =>
          a.callId === currentCallAttempt.callId
            ? { ...a, feedbackStatus: 'Submitted' as const, feedback: data }
            : a
        )
      );
      
      // Persist to DB
      try {
        await visitApi.registerCall({
          id: currentCallAttempt.callId,
          dealerId: currentCallAttempt.dealer.id,
          dealerName: currentCallAttempt.dealer.name,
          dealerCode: currentCallAttempt.dealer.code,
          dealerCity: currentCallAttempt.dealer.city,
          userId: 'current-user',
          kamName: currentCallAttempt.kam || 'Current User',
        });
        await visitApi.submitCallFeedback(currentCallAttempt.callId, {
          interactionType: 'CALL',
          meetingPersonRole: data.meetingPersonRole,
          meetingPersonOtherText: data.meetingPersonOtherText,
          leadShared: data.leadShared,
          leadStatus: data.leadStatus,
          sellerLeadCount: data.sellerLeadCount,
          buyerLeadCount: data.buyerLeadCount,
          inspectionExpected: data.inspectionExpected,
          dcfDiscussed: data.dcfDiscussed,
          dcfStatus: data.dcfStatus,
          dcfCreditRange: data.dcfCreditRange,
          dcfDocsCollected: data.dcfDocsCollected,
          note: data.note,
          rating: data.rating,
        });
      } catch (err: any) {
        console.error('[KAMCallsView] Failed to persist call feedback to DB:', err);
      }

      toast.success('Call feedback submitted');
      setShowCallFeedback(false);
      setCurrentCallAttempt(null);
    }
  };

  const getStageLabel = (stage: DealerStage) => {
    const labels: Record<DealerStage, string> = {
      lead_giving: 'Lead giving',
      inspecting: 'Inspecting',
      transacting: 'Transacting',
      dormant: 'Dormant',
      dcf_onboarded: 'DCF Onboarded',
    };
    return labels[stage];
  };

  const getStageColor = (stage: DealerStage) => {
    const colors: Record<DealerStage, string> = {
      lead_giving: 'bg-blue-100 text-blue-700',
      inspecting: 'bg-purple-100 text-purple-700',
      transacting: 'bg-green-100 text-green-700',
      dormant: 'bg-gray-100 text-gray-600',
      dcf_onboarded: 'bg-amber-100 text-amber-700',
    };
    return colors[stage];
  };

  // If showing call feedback form
  if (showCallFeedback && currentCallAttempt) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => { setShowCallFeedback(false); setCurrentCallAttempt(null); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 rotate-180" />
          </button>
          <div>
            <h1 className="text-[15px] font-bold text-slate-900">Call Feedback</h1>
            <p className="text-[11px] text-slate-500">{currentCallAttempt.dealer.name} ({currentCallAttempt.dealer.code})</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <UnifiedFeedbackForm
            interactionType="CALL"
            dealerName={currentCallAttempt.dealer.name}
            onSubmit={handleFeedbackSubmit}
            onCancel={() => { setShowCallFeedback(false); setCurrentCallAttempt(null); }}
            closeable
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Sub-tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex px-4 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('suggested')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'suggested'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Suggested Calls
          </button>
          <button
            onClick={() => setActiveSubTab('today')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap relative ${
              activeSubTab === 'today'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Today's Calls
            {pendingFeedbackCount > 0 && (
              <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingFeedbackCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('all')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All Calls
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Suggested Calls */}
        {activeSubTab === 'suggested' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">Suggested calls</h3>
              <div className="text-xs text-gray-500">{suggestedCalls.length} dealers</div>
            </div>

            {/* Suggested Call Cards */}
            <div className="space-y-3">
              {suggestedCalls.map((call) => (
                <div key={call.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-gray-900 mb-1">{call.dealer.name}</h4>
                      <div className="text-xs text-gray-500">{call.dealer.code} • {call.dealer.city}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStageColor(call.dealer.stage)}`}>
                      {getStageLabel(call.dealer.stage)}
                    </span>
                  </div>

                  {/* Reason Tag */}
                  {call.reasonTag && (
                    <div className="mb-3">
                      <span className="px-2 py-1 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200">
                        {call.reasonTag}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                    <div>Last call: <span className="text-gray-900">{call.lastCall}</span></div>
                    <div>Last visit: <span className="text-gray-900">{call.lastVisit}</span></div>
                    <div>Leads MTD: <span className="text-gray-900">{call.leadsMTD}</span></div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900">{call.contactName}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{call.dealer.contactRole}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">{call.contactPhone}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleCallNow(call)}
                    className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Calls */}
        {activeSubTab === 'today' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">Today, Dec 12, 2025</h3>
              <div className="text-xs text-gray-500">{todaysCalls.length} calls</div>
            </div>

            {/* Pending Feedback Warning */}
            {pendingFeedbackCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    {pendingFeedbackCount} {pendingFeedbackCount === 1 ? 'call' : 'calls'} pending feedback
                  </div>
                </div>
              </div>
            )}

            {/* Today's Call Cards */}
            <div className="space-y-3">
              {todaysCalls.length === 0 && (
                <div className="card-premium p-6 flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-3">
                    <Phone className="w-5 h-5 text-sky-400" />
                  </div>
                  <p className="text-[13px] font-medium text-slate-500 mb-0.5">No calls made today</p>
                  <p className="text-[11px] text-slate-400">Start calling from Suggested Calls</p>
                </div>
              )}

              {todaysCalls.map((call) => {
                const isPendingFeedback = call.callAttempt?.feedbackStatus === 'Pending';
                
                return (
                  <div
                    key={call.id}
                    className={`bg-white border rounded-xl p-4 relative ${
                      isPendingFeedback ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                    }`}
                  >
                    {/* Red accent bar for pending feedback */}
                    {isPendingFeedback && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl" />
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1">{call.dealer.name}</h4>
                        <div className="text-xs text-gray-500">{call.dealer.code}</div>
                        
                        {isPendingFeedback && (
                          <div className="text-xs text-red-600 mt-1 font-medium">
                            Feedback pending
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                        isPendingFeedback
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-green-100 text-green-700 border border-green-300'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {isPendingFeedback ? '⏳ Feedback Pending' : '✅ Feedback Submitted'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                      <span>{call.time}</span>
                      <span>•</span>
                      <span>{call.duration}</span>
                    </div>

                    {/* CTA */}
                    {isPendingFeedback ? (
                      <button
                        onClick={() => call.callAttempt && handleEnterFeedback(call.callAttempt)}
                        className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                      >
                        Enter Feedback
                      </button>
                    ) : (
                      <button
                        className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                      >
                        View Feedback
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Calls - placeholder */}
        {activeSubTab === 'all' && (
          <div className="p-4">
            <div className="card-premium p-6 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-3">
                <Phone className="w-5 h-5 text-sky-400" />
              </div>
              <p className="text-[13px] font-medium text-slate-500 mb-0.5">All calls history</p>
              <p className="text-[11px] text-slate-400">Completed calls will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}