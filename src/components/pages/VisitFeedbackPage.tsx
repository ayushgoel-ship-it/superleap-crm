import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Camera, Clock, AlertCircle } from 'lucide-react';
import { useActivity } from '../../contexts/ActivityContext';
import { toast } from 'sonner@2.0.3';

interface VisitFeedbackPageProps {
  visitId: string;
  onBack: () => void;
}

export function VisitFeedbackPage({ visitId, onBack }: VisitFeedbackPageProps) {
  const { visits, updateVisit } = useActivity();
  
  // Section expansion states
  const [contextExpanded, setContextExpanded] = useState(true);
  const [carSellExpanded, setCarSellExpanded] = useState(true);
  const [dcfExpanded, setDcfExpanded] = useState(false);
  const [additionalNotesExpanded, setAdditionalNotesExpanded] = useState(false);
  const [nextActionsExpanded, setNextActionsExpanded] = useState(false);

  // Form data
  const [shopPhotoTaken, setShopPhotoTaken] = useState(false);
  const [meetingPerson, setMeetingPerson] = useState('');
  const [meetingPersonName, setMeetingPersonName] = useState('');

  // Car Sell
  const [carSellDiscussed, setCarSellDiscussed] = useState(true);
  const [carSellSummary, setCarSellSummary] = useState('');
  const [carSellIssues, setCarSellIssues] = useState<string[]>([]);
  const [carSellOutcome, setCarSellOutcome] = useState('');
  const [expectedSellerLeads, setExpectedSellerLeads] = useState('');
  const [expectedInventoryLeads, setExpectedInventoryLeads] = useState('');

  // DCF
  const [dcfDiscussed, setDcfDiscussed] = useState(false);
  const [dcfSummary, setDcfSummary] = useState('');
  const [dcfStatus, setDcfStatus] = useState('');
  const [expectedDcfLeads, setExpectedDcfLeads] = useState('');

  // Additional notes
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Next actions
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState('');

  // Find the visit
  const visit = visits.find(v => v.id === visitId);

  useEffect(() => {
    if (!visit) {
      toast.error('Visit not found');
      onBack();
    }
  }, [visit, onBack]);

  if (!visit) {
    return null;
  }

  const carSellIssuesList = [
    'Lead sharing',
    'Payouts',
    'App issues',
    'Stock quality',
    'Pricing concerns',
    'Training needed'
  ];

  const carSellOutcomeOptions = [
    { value: 'agreed', label: 'Dealer agreed to share leads' },
    { value: 'already_sharing', label: 'Dealer already sharing, no change' },
    { value: 'hesitant', label: 'Dealer hesitant / blocked' },
    { value: 'not_interested', label: 'Dealer not interested currently' }
  ];

  const dcfStatusOptions = [
    { value: 'already_onboarded', label: 'Dealer already onboarded' },
    { value: 'interested', label: 'Dealer interested, onboarding pending' },
    { value: 'not_interested', label: 'Dealer not interested' },
    { value: 'needs_demo', label: 'Dealer needs demo / training' }
  ];

  const nextActionsList = [
    'Follow-up call',
    'Send training material',
    'Review payout status',
    'Schedule DCF demo'
  ];

  const toggleCarSellIssue = (issue: string) => {
    setCarSellIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const toggleNextAction = (action: string) => {
    setNextActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  // Validation
  const isValid = () => {
    if (!meetingPerson) return false;
    if (meetingPerson === 'Other' && !meetingPersonName) return false;
    if (carSellDiscussed && !carSellOutcome) return false;
    if (dcfDiscussed && !dcfStatus) return false;
    if (nextActions.length > 0 && !followUpDate) return false;
    return true;
  };

  const handleSubmit = () => {
    const feedback = {
      meetingPerson: meetingPerson === 'Other' ? meetingPersonName : meetingPerson,
      shopPhotoTaken,
      carSell: {
        discussed: carSellDiscussed,
        summary: carSellSummary,
        issues: carSellIssues,
        outcome: carSellOutcome,
        expectedSellerLeads: expectedSellerLeads ? parseInt(expectedSellerLeads) : null,
        expectedInventoryLeads: expectedInventoryLeads ? parseInt(expectedInventoryLeads) : null,
      },
      dcf: {
        discussed: dcfDiscussed,
        summary: dcfSummary,
        status: dcfStatus,
        expectedDcfLeads: expectedDcfLeads ? parseInt(expectedDcfLeads) : null,
      },
      additionalNotes,
      nextActions,
      followUpDate: nextActions.length > 0 ? followUpDate : null,
      submittedAt: new Date().toISOString(),
    };

    // Update the visit with feedback and mark as completed
    updateVisit(visitId, {
      status: 'completed',
      meetingPerson: meetingPerson === 'Other' ? meetingPersonName : meetingPerson,
      outcome: carSellOutcome,
      notes: additionalNotes,
      nextAction: nextActions.join(', '),
      checkOutTime: new Date().toISOString(),
    });

    toast.success('Visit feedback submitted successfully');
    onBack();
  };

  const visitTime = visit.checkInTime 
    ? new Date(visit.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg text-gray-900">Visit Feedback</h1>
            <div className="text-sm text-gray-500">{visit.dealerName}</div>
          </div>
          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Feedback Pending
          </span>
        </div>

        {/* Visit Info Bar */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {visitTime}
          </span>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border-b border-amber-200 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            Feedback required to complete this visit
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Section A: Visit Context */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setContextExpanded(!contextExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">A. Visit Context</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${contextExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {contextExpanded && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              {/* Read-only info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dealer:</span>
                  <span className="text-gray-900">{visit.dealerName} ({visit.dealerCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visit time:</span>
                  <span className="text-gray-900">{visitTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">City:</span>
                  <span className="text-gray-900">{visit.dealerCity}</span>
                </div>
              </div>

              {/* Shop Photo */}
              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Shop photo taken?</span>
                  <button
                    onClick={() => setShopPhotoTaken(!shopPhotoTaken)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      shopPhotoTaken ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        shopPhotoTaken ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Meeting Person */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Met with <span className="text-red-500">*</span>
                </label>
                <select
                  value={meetingPerson}
                  onChange={(e) => setMeetingPerson(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {meetingPerson === 'Other' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={meetingPersonName}
                    onChange={(e) => setMeetingPersonName(e.target.value)}
                    placeholder="Enter name..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section B: Car Sell Discussion */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setCarSellExpanded(!carSellExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">B. Car Sell Discussion</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${carSellExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {carSellExpanded && (
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
                  {/* Summary */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Quick summary</label>
                    <textarea
                      value={carSellSummary}
                      onChange={(e) => setCarSellSummary(e.target.value)}
                      placeholder="Brief summary of discussion..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Issues Discussed */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Issues discussed (if any)</label>
                    <div className="space-y-2">
                      {carSellIssuesList.map(issue => (
                        <label key={issue} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={carSellIssues.includes(issue)}
                            onChange={() => toggleCarSellIssue(issue)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">{issue}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Outcome */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Outcome <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {carSellOutcomeOptions.map(option => (
                        <label key={option.value} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="carSellOutcome"
                            value={option.value}
                            checked={carSellOutcome === option.value}
                            onChange={(e) => setCarSellOutcome(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Expected Leads */}
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

        {/* Section C: DCF Discussion */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setDcfExpanded(!dcfExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">C. DCF (Loan) Discussion</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dcfExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {dcfExpanded && (
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
                  {/* Summary */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Quick summary</label>
                    <textarea
                      value={dcfSummary}
                      onChange={(e) => setDcfSummary(e.target.value)}
                      placeholder="Brief summary of DCF discussion..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                    />
                  </div>

                  {/* DCF Status */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      DCF Status <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {dcfStatusOptions.map(option => (
                        <label key={option.value} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="dcfStatus"
                            value={option.value}
                            checked={dcfStatus === option.value}
                            onChange={(e) => setDcfStatus(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
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

        {/* Section D: Additional Notes */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setAdditionalNotesExpanded(!additionalNotesExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">D. Additional Notes</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${additionalNotesExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {additionalNotesExpanded && (
            <div className="p-4 border-t border-gray-200">
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any other important notes..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Section E: Next Actions */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setNextActionsExpanded(!nextActionsExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-gray-900 font-medium">E. Next Actions</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${nextActionsExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {nextActionsExpanded && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              {/* Action Checkboxes */}
              <div className="space-y-2">
                {nextActionsList.map(action => (
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