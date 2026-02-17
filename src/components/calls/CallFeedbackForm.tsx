import { useState } from 'react';
import { ChevronLeft, Phone, Clock, AlertCircle, ChevronDown, CheckCircle } from 'lucide-react';

interface Dealer {
  id: string;
  name: string;
  code: string;
  phone: string;
}

interface CallAttempt {
  callId: string;
  dealer: Dealer;
  kam: string;
  callStartTime: string;
  callDuration: string;
  callStatus: 'Attempted' | 'Completed';
  recordingStatus: 'Available' | 'Not Available';
  feedbackStatus: 'Pending' | 'Submitted';
}

interface CallFeedbackFormProps {
  callAttempt: CallAttempt;
  onSubmit: (feedback: any) => void;
  onClose: () => void;
}

export function CallFeedbackForm({ callAttempt, onSubmit, onClose }: CallFeedbackFormProps) {
  const [callOutcome, setCallOutcome] = useState('');
  const [carSellDiscussed, setCarSellDiscussed] = useState(true);
  const [carSellOutcome, setCarSellOutcome] = useState('');
  const [expectedSellerLeads, setExpectedSellerLeads] = useState('');
  const [expectedInventoryLeads, setExpectedInventoryLeads] = useState('');
  const [dcfDiscussed, setDcfDiscussed] = useState(false);
  const [dcfStatus, setDcfStatus] = useState('');
  const [expectedDcfLeads, setExpectedDcfLeads] = useState('');
  const [notes, setNotes] = useState('');
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState('');

  const [expandedSection, setExpandedSection] = useState<string>('context');

  const callOutcomes = ['Connected', 'Not reachable', 'Busy', 'Call back requested'];
  const carSellOutcomes = [
    'Dealer agreed to share leads',
    'Already sharing, no change',
    'Dealer hesitant',
    'Not interested'
  ];
  const dcfStatuses = ['Already onboarded', 'Interested', 'Needs demo', 'Not interested'];
  const actionOptions = ['Follow-up call', 'Schedule visit', 'Share training material', 'Schedule DCF demo'];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const toggleNextAction = (action: string) => {
    setNextActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  // Validation
  const isValid = () => {
    if (!callOutcome) return false;
    if (carSellDiscussed && !carSellOutcome) return false;
    if (dcfDiscussed && !dcfStatus) return false;
    if (nextActions.length > 0 && !followUpDate) return false;
    return true;
  };

  const handleSubmit = () => {
    const feedback = {
      callId: callAttempt.callId,
      callOutcome,
      carSell: {
        discussed: carSellDiscussed,
        outcome: carSellDiscussed ? carSellOutcome : null,
        expectedSellerLeads: expectedSellerLeads ? parseInt(expectedSellerLeads) : null,
        expectedInventoryLeads: expectedInventoryLeads ? parseInt(expectedInventoryLeads) : null,
      },
      dcf: {
        discussed: dcfDiscussed,
        status: dcfDiscussed ? dcfStatus : null,
        expectedDcfLeads: expectedDcfLeads ? parseInt(expectedDcfLeads) : null,
      },
      notes,
      nextActions,
      followUpDate: nextActions.length > 0 ? followUpDate : null,
      submittedAt: new Date().toISOString(),
    };
    onSubmit(feedback);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg text-gray-900">Call Feedback</h1>
            <div className="text-sm text-gray-500">{callAttempt.dealer.name}</div>
          </div>
          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ⏳ Feedback Pending
          </span>
        </div>

        {/* Call Info Bar */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {callAttempt.callDuration}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {callAttempt.callStartTime}
          </span>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border-b border-amber-200 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            Feedback required to complete this call
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Section A: Call Context */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('context')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">A. Call Context</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'context' ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSection === 'context' && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              {/* Read-only info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dealer:</span>
                  <span className="text-gray-900">{callAttempt.dealer.name} ({callAttempt.dealer.code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Call date/time:</span>
                  <span className="text-gray-900">{callAttempt.callStartTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="text-gray-900">{callAttempt.callDuration}</span>
                </div>
              </div>

              {/* Call Outcome */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Call Outcome <span className="text-red-500">*</span>
                </label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select outcome...</option>
                  {callOutcomes.map(outcome => (
                    <option key={outcome} value={outcome}>{outcome}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Section B: Car Sell Feedback */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('carSell')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">B. Car Sell Discussion</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'carSell' ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSection === 'carSell' && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Car sell discussed?</label>
                <button
                  onClick={() => setCarSellDiscussed(!carSellDiscussed)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    carSellDiscussed ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      carSellDiscussed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {carSellDiscussed && (
                <>
                  {/* Outcome */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Outcome <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {carSellOutcomes.map(outcome => (
                        <label key={outcome} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="carSellOutcome"
                            value={outcome}
                            checked={carSellOutcome === outcome}
                            onChange={(e) => setCarSellOutcome(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">{outcome}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Quantified Outcomes */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Expected seller leads/week</label>
                      <input
                        type="number"
                        value={expectedSellerLeads}
                        onChange={(e) => setExpectedSellerLeads(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Expected inventory leads/week</label>
                      <input
                        type="number"
                        value={expectedInventoryLeads}
                        onChange={(e) => setExpectedInventoryLeads(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Section C: DCF Feedback */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('dcf')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">C. DCF (Loan) Discussion</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'dcf' ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSection === 'dcf' && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">DCF discussed?</label>
                <button
                  onClick={() => setDcfDiscussed(!dcfDiscussed)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    dcfDiscussed ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dcfDiscussed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {dcfDiscussed && (
                <>
                  {/* DCF Status */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      DCF Status <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {dcfStatuses.map(status => (
                        <label key={status} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="dcfStatus"
                            value={status}
                            checked={dcfStatus === status}
                            onChange={(e) => setDcfStatus(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Expected DCF Leads */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Expected DCF leads/month</label>
                    <input
                      type="number"
                      value={expectedDcfLeads}
                      onChange={(e) => setExpectedDcfLeads(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Section D: Quick Notes */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('notes')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">D. Quick Notes</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'notes' ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSection === 'notes' && (
            <div className="p-4 border-t border-gray-200">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any important note from the call..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Section E: Next Actions */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('nextActions')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">E. Next Actions</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'nextActions' ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSection === 'nextActions' && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              {/* Action Checkboxes */}
              <div className="space-y-2">
                {actionOptions.map(action => (
                  <label key={action} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={nextActions.includes(action)}
                      onChange={() => toggleNextAction(action)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{action}</span>
                  </label>
                ))}
              </div>

              {/* Follow-up Date */}
              {nextActions.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Follow-up Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-gray-200">
        {!isValid() && (
          <div className="text-xs text-amber-600 text-center mb-2">
            ⚠️ Please complete all required fields
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={!isValid()}
          className={`w-full px-4 py-3 rounded-lg text-sm transition-colors ${
            isValid()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
}
