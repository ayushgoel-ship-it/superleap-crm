import { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, Camera, CheckCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function VisitFeedbackDemo() {
  // Section expansion states
  const [contextExpanded, setContextExpanded] = useState(true);
  const [carSellExpanded, setCarSellExpanded] = useState(true);
  const [dcfExpanded, setDcfExpanded] = useState(true);
  const [additionalNotesExpanded, setAdditionalNotesExpanded] = useState(false);
  const [nextActionsExpanded, setNextActionsExpanded] = useState(true);

  // Form data - PRE-FILLED WITH MOCK DATA
  const [shopPhotoTaken, setShopPhotoTaken] = useState(true);
  const [meetingPerson, setMeetingPerson] = useState('Owner');
  const [meetingPersonName, setMeetingPersonName] = useState('Ramesh Gupta');

  // Car Sell - PRE-FILLED
  const [carSellDiscussed, setCarSellDiscussed] = useState(true);
  const [carSellSummary, setCarSellSummary] = useState('Dealer agreed to increase lead sharing frequency. Discussed payout delays and stock quality concerns.');
  const [carSellIssues, setCarSellIssues] = useState<string[]>(['Payouts', 'Stock quality']);
  const [carSellOutcome, setCarSellOutcome] = useState('agreed');
  const [expectedSellerLeads, setExpectedSellerLeads] = useState('3');
  const [expectedInventoryLeads, setExpectedInventoryLeads] = useState('1');
  const [appointmentAgreed, setAppointmentAgreed] = useState(false);

  // DCF - PRE-FILLED
  const [dcfDiscussed, setDcfDiscussed] = useState(true);
  const [dcfSummary, setDcfSummary] = useState('Dealer showed interest in DCF program. Currently working with local financiers but open to NBFC partnership.');
  const [dcfStatus, setDcfStatus] = useState('interested');
  const [expectedDcfLeads, setExpectedDcfLeads] = useState('5');
  const [preferredNbfc, setPreferredNbfc] = useState('Shriram');
  const [dcfActions, setDcfActions] = useState<string[]>(['Schedule DCF demo']);

  // Additional notes
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [internalRemarks, setInternalRemarks] = useState('');

  // Next actions - PRE-FILLED
  const [nextActions, setNextActions] = useState<string[]>(['Follow-up call']);
  const [followUpDate, setFollowUpDate] = useState('2025-12-18');

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

  const dcfActionsList = [
    'Schedule DCF demo',
    'Share DCF training material',
    'Follow-up with NBFC RM'
  ];

  const nextActionsList = [
    'Follow-up call',
    'Send training material',
    'Review payout status',
    'Schedule DCF demo'
  ];

  const toggleIssue = (issue: string) => {
    if (carSellIssues.includes(issue)) {
      setCarSellIssues(carSellIssues.filter(i => i !== issue));
    } else {
      setCarSellIssues([...carSellIssues, issue]);
    }
  };

  const toggleDcfAction = (action: string) => {
    if (dcfActions.includes(action)) {
      setDcfActions(dcfActions.filter(a => a !== action));
    } else {
      setDcfActions([...dcfActions, action]);
    }
  };

  const toggleNextAction = (action: string) => {
    if (nextActions.includes(action)) {
      setNextActions(nextActions.filter(a => a !== action));
    } else {
      setNextActions([...nextActions, action]);
    }
  };

  const showQuantifiedOutcome = carSellOutcome === 'agreed' || carSellOutcome === 'already_sharing';
  const showDcfOutcome = dcfStatus === 'already_onboarded' || dcfStatus === 'interested';

  const isFormValid = () => {
    if (!shopPhotoTaken || !meetingPerson) return false;
    if (carSellDiscussed && !carSellOutcome) return false;
    if (dcfDiscussed && !dcfStatus) return false;
    if (nextActions.length > 0 && !followUpDate) return false;
    return true;
  };

  const handleComplete = () => {
    if (!isFormValid()) {
      toast.error('Please complete all required fields');
      return;
    }

    toast.success('Visit completed. Feedback saved for Car Sell and DCF.');
  };

  const getCarSellSummary = () => {
    if (!carSellDiscussed) return 'Not discussed';
    if (carSellOutcome === 'agreed') return 'Agreed to share leads';
    if (carSellOutcome === 'already_sharing') return 'Already sharing';
    if (carSellOutcome === 'hesitant') return 'Hesitant';
    if (carSellOutcome === 'not_interested') return 'Not interested';
    return 'Discussed';
  };

  const getDcfSummary = () => {
    if (!dcfDiscussed) return 'Not discussed';
    if (dcfStatus === 'already_onboarded') return 'Already onboarded';
    if (dcfStatus === 'interested') return 'Interested';
    if (dcfStatus === 'not_interested') return 'Not interested';
    if (dcfStatus === 'needs_demo') return 'Needs demo';
    return 'Discussed';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <button className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg text-gray-900">Visit Feedback</h1>
            <div className="text-sm text-gray-500">Gupta Auto World</div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <div className="text-sm text-blue-900">Visit in progress</div>
          </div>
          <div className="text-sm text-blue-700 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Started at 10:15 AM
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* SECTION A: VISIT CONTEXT */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setContextExpanded(!contextExpanded)}
            className="w-full bg-white px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-gray-900 font-medium">Visit Context</h3>
              {shopPhotoTaken && meetingPerson && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
            {contextExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {contextExpanded && (
            <div className="bg-white px-4 py-4 space-y-4">
              {/* Shop Photo */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Shop Photo <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={() => setShopPhotoTaken(!shopPhotoTaken)}
                  className={`w-full border-2 border-dashed rounded-lg p-6 transition-colors ${
                    shopPhotoTaken
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  {shopPhotoTaken ? (
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-sm text-green-700">gupta_auto_world.jpg</div>
                      <div className="text-xs text-green-600 mt-1">Photo captured at 10:16 AM</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">Tap to capture shop photo (required)</div>
                    </div>
                  )}
                </button>
              </div>

              {/* Meeting Person */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Meeting Person <span className="text-red-500">*</span>
                </label>
                <select
                  value={meetingPerson}
                  onChange={(e) => setMeetingPerson(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select person</option>
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option>
                  <option value="Staff">Staff</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Meeting Person Name */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Meeting Person Name</label>
                <input
                  type="text"
                  value={meetingPersonName}
                  onChange={(e) => setMeetingPersonName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Visit Type */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Visit Type</label>
                <div className="flex">
                  <span className="px-3 py-1.5 rounded-lg text-sm bg-blue-100 text-blue-700">
                    Planned
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION B: CAR SELL FEEDBACK */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setCarSellExpanded(!carSellExpanded)}
            className="w-full bg-white px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-gray-900 font-medium">Car Sell Discussion</h3>
              <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                {getCarSellSummary()}
              </span>
            </div>
            {carSellExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {carSellExpanded && (
            <div className="bg-white px-4 py-4 space-y-4">
              {/* Car Sell Discussed Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-700 font-medium">Car sell discussed?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCarSellDiscussed(true)}
                    className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                      carSellDiscussed
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setCarSellDiscussed(false)}
                    className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                      !carSellDiscussed
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {!carSellDiscussed ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                  Car sell not discussed in this visit
                </div>
              ) : (
                <>
                  {/* Discussion Summary */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Discussion Summary</label>
                    <textarea
                      value={carSellSummary}
                      onChange={(e) => setCarSellSummary(e.target.value)}
                      placeholder="Key discussion points about selling cars..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      rows={3}
                    />
                  </div>

                  {/* Issues Discussed */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Issues Discussed</label>
                    <div className="flex flex-wrap gap-2">
                      {carSellIssuesList.map((issue) => (
                        <button
                          key={issue}
                          onClick={() => toggleIssue(issue)}
                          className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-colors ${
                            carSellIssues.includes(issue)
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          {issue}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Outcome */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Outcome of Car Sell Discussion <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {carSellOutcomeOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            carSellOutcome === option.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="carSellOutcome"
                            value={option.value}
                            checked={carSellOutcome === option.value}
                            onChange={(e) => setCarSellOutcome(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-900">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Quantified Outcome */}
                  {showQuantifiedOutcome && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div className="text-sm text-blue-900 font-medium mb-2">Expected Lead Volume</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-blue-700 mb-1">Seller leads/week</label>
                          <input
                            type="number"
                            value={expectedSellerLeads}
                            onChange={(e) => setExpectedSellerLeads(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-blue-700 mb-1">Inventory leads/week</label>
                          <input
                            type="number"
                            value={expectedInventoryLeads}
                            onChange={(e) => setExpectedInventoryLeads(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inspection / Appointment */}
                  <div>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appointmentAgreed}
                        onChange={(e) => setAppointmentAgreed(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Any inspection / appointment agreed?</span>
                    </label>
                    {appointmentAgreed && (
                      <button className="w-full mt-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        Create Appointment
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* SECTION C: DCF FEEDBACK */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setDcfExpanded(!dcfExpanded)}
            className="w-full bg-white px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-gray-900 font-medium">DCF (Loan) Discussion</h3>
              <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                {getDcfSummary()}
              </span>
            </div>
            {dcfExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {dcfExpanded && (
            <div className="bg-white px-4 py-4 space-y-4">
              {/* DCF Discussed Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-700 font-medium">DCF discussed?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDcfDiscussed(true)}
                    className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                      dcfDiscussed
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDcfDiscussed(false)}
                    className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                      !dcfDiscussed
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {!dcfDiscussed ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                  DCF not discussed in this visit
                </div>
              ) : (
                <>
                  {/* DCF Discussion Summary */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">DCF Discussion Summary</label>
                    <textarea
                      value={dcfSummary}
                      onChange={(e) => setDcfSummary(e.target.value)}
                      placeholder="Key discussion points on loans / NBFC..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                      rows={3}
                    />
                  </div>

                  {/* DCF Status */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      DCF Status <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {dcfStatusOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            dcfStatus === option.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="dcfStatus"
                            value={option.value}
                            checked={dcfStatus === option.value}
                            onChange={(e) => setDcfStatus(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-900">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* DCF Outcome */}
                  {showDcfOutcome && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                      <div className="text-sm text-purple-900 font-medium mb-2">DCF Details</div>
                      <div>
                        <label className="block text-xs text-purple-700 mb-1">Expected DCF leads/month</label>
                        <input
                          type="number"
                          value={expectedDcfLeads}
                          onChange={(e) => setExpectedDcfLeads(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-purple-700 mb-1">Preferred NBFC</label>
                        <select
                          value={preferredNbfc}
                          onChange={(e) => setPreferredNbfc(e.target.value)}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm bg-white"
                        >
                          <option value="">Select NBFC</option>
                          <option value="Shriram">Shriram</option>
                          <option value="Bajaj">Bajaj</option>
                          <option value="Axis">Axis</option>
                          <option value="HDFC">HDFC</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* DCF Actions */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">DCF Actions</label>
                    <div className="space-y-2">
                      {dcfActionsList.map((action) => (
                        <label
                          key={action}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={dcfActions.includes(action)}
                            onChange={() => toggleDcfAction(action)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* SECTION D: ADDITIONAL NOTES */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setAdditionalNotesExpanded(!additionalNotesExpanded)}
            className="w-full bg-white px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <h3 className="text-gray-900 font-medium">Additional Notes</h3>
            {additionalNotesExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {additionalNotesExpanded && (
            <div className="bg-white px-4 py-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Free-text Notes</label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any other observations or comments..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Internal Remarks <span className="text-xs text-gray-500">(TL visible)</span>
                </label>
                <textarea
                  value={internalRemarks}
                  onChange={(e) => setInternalRemarks(e.target.value)}
                  placeholder="Internal notes for Team Lead review..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION E: NEXT ACTIONS */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setNextActionsExpanded(!nextActionsExpanded)}
            className="w-full bg-white px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-gray-900 font-medium">Next Actions</h3>
              {nextActions.length > 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                  {nextActions.length} selected
                </span>
              )}
            </div>
            {nextActionsExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {nextActionsExpanded && (
            <div className="bg-white px-4 py-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Select Actions</label>
                <div className="space-y-2">
                  {nextActionsList.map((action) => (
                    <label
                      key={action}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300"
                    >
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
              </div>

              {nextActions.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Next Follow-up Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer - Complete Visit */}
      <div className="p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleComplete}
          className="w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700"
        >
          <CheckCircle className="w-5 h-5" />
          Complete Visit
        </button>
      </div>
    </div>
  );
}