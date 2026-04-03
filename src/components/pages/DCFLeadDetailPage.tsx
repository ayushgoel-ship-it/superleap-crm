import { useState } from 'react';
import { ArrowLeft, Phone, Mail, ChevronDown, ChevronUp, Check, Clock, AlertCircle } from 'lucide-react';
import { getRuntimeDBSync } from '../../data/runtimeDB';

interface DCFLeadDetailPageProps {
  loanId: string;
  onBack: () => void;
}

interface DCFLeadData {
  loan_id: string;
  customer_name: string;
  customer_phone: string;
  pan: string;
  city: string;
  reg_no: string;
  car: string;
  car_value: number;
  ltv: number | null;
  loan_amount: number | null;
  roi: number | null;
  tenure: number | null;
  emi: number | null;
  dealer_name: string;
  dealer_code: string;
  dealer_city: string;
  channel: string;
  rag_status: 'green' | 'amber' | 'red';
  book_flag: 'Own Book' | 'Pmax';
  car_docs_flag: string;
  conversion_owner: string;
  conversion_email: string;
  conversion_phone: string;
  kam_name: string;
  first_disbursal_for_dealer: string;
  commission_eligible: boolean;
  base_commission: number;
  booster_applied: string;
  total_commission: number;
  current_funnel: string;
  current_sub_stage: string;
  overall_status: string;
  created_at: string;
  last_updated_at: string;
  utr?: string;
  disbursal_date?: string;
  cibil_score: number;
  cibil_date: string;
  employment_type?: string;
  monthly_income?: number;
  dealer_account?: string;
  last_dcf_disbursal?: string;
  delay_message?: string;
}

// Build DCF lead data from Supabase
function getDCFLeadFromDB(loanId: string): DCFLeadData | null {
  const db = getRuntimeDBSync();
  const dcfLead = db.dcfLeads.find((d: any) => d.loanId === loanId || d.id === loanId);
  if (!dcfLead) return null;

  const ragStatus: 'green' | 'amber' | 'red' = dcfLead.status === 'disbursed' ? 'green'
    : dcfLead.status === 'approved' ? 'amber'
      : 'red';

  return {
    loan_id: dcfLead.loanId || dcfLead.id || loanId,
    customer_name: dcfLead.customerName || 'Unknown Customer',
    customer_phone: dcfLead.customerPhone || '',
    pan: dcfLead.pan || 'N/A',
    city: dcfLead.city || 'NCR',
    reg_no: dcfLead.regNo || 'N/A',
    car: dcfLead.carModel || 'Unknown Car',
    car_value: dcfLead.carValue || 0,
    ltv: dcfLead.ltv || null,
    loan_amount: dcfLead.loanAmount || null,
    roi: dcfLead.roi || null,
    tenure: dcfLead.tenure || null,
    emi: dcfLead.emi || null,
    dealer_name: dcfLead.dealerName || 'Unknown Dealer',
    dealer_code: dcfLead.dealerCode || 'N/A',
    dealer_city: dcfLead.dealerCity || dcfLead.city || 'NCR',
    channel: dcfLead.channel || 'Direct',
    rag_status: ragStatus,
    book_flag: dcfLead.bookFlag || 'Own Book',
    car_docs_flag: dcfLead.carDocsReceived ? 'Received' : 'Pending',
    conversion_owner: dcfLead.conversionOwner || 'Not assigned',
    conversion_email: dcfLead.conversionEmail || '',
    conversion_phone: dcfLead.conversionPhone || '',
    kam_name: dcfLead.kamName || 'N/A',
    first_disbursal_for_dealer: dcfLead.firstDisbursal ? 'YES' : 'NO',
    commission_eligible: dcfLead.status === 'disbursed',
    base_commission: dcfLead.commission || 0,
    booster_applied: dcfLead.firstDisbursal ? 'YES' : 'NO',
    total_commission: dcfLead.commission || 0,
    current_funnel: dcfLead.currentFunnel || 'SOURCING',
    current_sub_stage: dcfLead.currentSubStage || 'LEAD_CREATION',
    overall_status: dcfLead.status?.toUpperCase() || 'PENDING',
    created_at: dcfLead.createdAt || new Date().toISOString(),
    last_updated_at: dcfLead.updatedAt || new Date().toISOString(),
    utr: dcfLead.utr,
    disbursal_date: dcfLead.disbursalDate,
    cibil_score: dcfLead.cibilScore || 0,
    cibil_date: dcfLead.cibilDate || '',
    employment_type: dcfLead.employmentType,
    monthly_income: dcfLead.monthlyIncome,
    dealer_account: dcfLead.dealerAccount,
    delay_message: dcfLead.delayMessage,
  };
}

export function DCFLeadDetailPage({ loanId, onBack }: DCFLeadDetailPageProps) {
  const [journeyExpanded, setJourneyExpanded] = useState(false);
  const [expandedFunnels, setExpandedFunnels] = useState<Set<string>>(new Set());

  const leadData = getDCFLeadFromDB(loanId);

  if (!leadData) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50">
        <div className="text-gray-500">Lead not found</div>
        <button onClick={onBack} className="mt-4 text-blue-600">Go back</button>
      </div>
    );
  }

  const toggleFunnel = (funnel: string) => {
    const newExpanded = new Set(expandedFunnels);
    if (newExpanded.has(funnel)) {
      newExpanded.delete(funnel);
    } else {
      newExpanded.add(funnel);
    }
    setExpandedFunnels(newExpanded);
  };

  const expandAllFunnels = () => {
    const allFunnels = journeyFunnels.map(f => f.name);
    setExpandedFunnels(new Set(allFunnels));
  };

  const collapseAllFunnels = () => {
    setExpandedFunnels(new Set());
  };

  const getRAGColor = (rag: 'green' | 'amber' | 'red') => {
    switch (rag) {
      case 'green': return 'bg-green-100 text-green-700 border-green-300';
      case 'amber': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'red': return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  // Define journey stages
  const journeyFunnels = [
    {
      name: 'SOURCING',
      stages: [
        { id: 'LEAD_CREATION', label: 'Lead Creation' },
        { id: 'BASIC_DETAILS', label: 'Basic Details' },
        { id: 'ADDRESS_DETAILS', label: 'Address Details' },
        { id: 'ADDITIONAL_DETAILS', label: 'Additional Details' },
        { id: 'BANKING', label: 'Banking' },
        { id: 'COAPP_DETAILS', label: 'Co-app Details' },
        { id: 'ASSET_NEEDED', label: 'Asset Needed' },
        { id: 'PA_OFFER', label: 'PA Offer' },
        { id: 'INSPECTION', label: 'Inspection' },
      ]
    },
    {
      name: 'CREDIT',
      stages: [
        { id: 'UNDERWRITING', label: 'Underwriting' },
        { id: 'CREDIT_INITIATED', label: 'Credit Initiated' },
        { id: 'PA_OFFER', label: 'PA Offer' },
        { id: 'DC_VALIDATION', label: 'DC Validation' },
      ]
    },
    {
      name: 'CONVERSION',
      stages: [
        { id: 'OFFER_DISCOUNT', label: 'Offer Discount' },
        { id: 'TNC_PENDING', label: 'T&C Pending' },
        { id: 'DOC_UPLOAD', label: 'Doc Upload' },
        { id: 'BENEFICIARY_DETAILS', label: 'Beneficiary Details' },
        { id: 'TNC_ACCEPTANCE', label: 'T&C Acceptance' },
        { id: 'ADDITIONAL_INFO', label: 'Additional Info' },
      ]
    },
    {
      name: 'BAJAJ',
      stages: [
        { id: 'PARTNER_APPROVAL', label: 'Partner Approval' },
      ]
    },
    {
      name: 'FULFILMENT',
      stages: [
        { id: 'AGREEMENT', label: 'Agreement' },
        { id: 'REFERENCE_CALLING', label: 'Reference Calling' },
        { id: 'KYC', label: 'KYC' },
        { id: 'NACH', label: 'NACH' },
      ]
    },
    {
      name: 'RISK',
      stages: [
        { id: 'RCU', label: 'RCU' },
        { id: 'RTO_KIT_APPROVAL', label: 'RTO Kit Approval' },
        { id: 'FINAL_QC', label: 'Final QC' },
        { id: 'FCU', label: 'FCU' },
        { id: 'RTO', label: 'RTO' },
      ]
    },
    {
      name: 'DISBURSAL',
      stages: [
        { id: 'DISBURSAL', label: 'Disbursal' },
      ]
    },
  ];

  const getStageStatus = (funnelName: string, stageId: string): 'completed' | 'current' | 'future' => {
    const currentFunnelIndex = journeyFunnels.findIndex(f => f.name === leadData.current_funnel);
    const thisFunnelIndex = journeyFunnels.findIndex(f => f.name === funnelName);

    if (thisFunnelIndex < currentFunnelIndex) return 'completed';
    if (thisFunnelIndex > currentFunnelIndex) return 'future';

    // Same funnel - check sub-stage
    const currentStageIndex = journeyFunnels[thisFunnelIndex].stages.findIndex(s => s.id === leadData.current_sub_stage);
    const thisStageIndex = journeyFunnels[thisFunnelIndex].stages.findIndex(s => s.id === stageId);

    if (thisStageIndex < currentStageIndex) return 'completed';
    if (thisStageIndex === currentStageIndex) return 'current';
    return 'future';
  };

  const getFunnelStatus = (funnelName: string): 'completed' | 'current' | 'future' => {
    const currentFunnelIndex = journeyFunnels.findIndex(f => f.name === leadData.current_funnel);
    const thisFunnelIndex = journeyFunnels.findIndex(f => f.name === funnelName);

    if (thisFunnelIndex < currentFunnelIndex) return 'completed';
    if (thisFunnelIndex === currentFunnelIndex) return 'current';
    return 'future';
  };

  const getTotalProgress = () => {
    const currentFunnelIndex = journeyFunnels.findIndex(f => f.name === leadData.current_funnel);
    const currentFunnel = journeyFunnels[currentFunnelIndex];
    const currentStageIndex = currentFunnel?.stages.findIndex(s => s.id === leadData.current_sub_stage) || 0;

    let completedStages = 0;
    for (let i = 0; i < currentFunnelIndex; i++) {
      completedStages += journeyFunnels[i].stages.length;
    }
    completedStages += currentStageIndex;

    const totalStages = journeyFunnels.reduce((sum, f) => sum + f.stages.length, 0) + 1; // +1 for car docs

    return { completed: completedStages, total: totalStages };
  };

  const progress = getTotalProgress();

  // Auto-expand current funnel when journey is expanded
  const handleExpandJourney = () => {
    setJourneyExpanded(true);
    setExpandedFunnels(new Set([leadData.current_funnel]));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg text-gray-900">DCF Lead Detail</h1>
              <div className="text-sm text-gray-500">{leadData.loan_id}</div>
            </div>
          </div>

          {/* Top 3 Chips */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded text-xs bg-gray-100 text-gray-900 border border-gray-300">
              Stage: {leadData.current_funnel} / {leadData.current_sub_stage}
            </span>
            <span className={`px-3 py-1.5 rounded text-xs border ${getRAGColor(leadData.rag_status)}`}>
              Channel: {leadData.channel}
            </span>
            <span className="px-3 py-1.5 rounded text-xs bg-indigo-100 text-indigo-700 border border-indigo-300">
              {leadData.book_flag}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current State Summary Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-gray-900 font-medium mb-3">Current State</h3>

          {/* Status + Last Updated */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="text-2xl font-semibold text-gray-900 mb-1">{leadData.overall_status}</div>
            <div className="text-sm text-gray-500">
              Last updated: {leadData.last_updated_at}
            </div>
            {leadData.delay_message && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {leadData.delay_message}
              </div>
            )}
          </div>

          {/* Loan Numbers */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Loan Numbers</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Car value:</span>
                <span className="text-gray-900 ml-2">₹{leadData.car_value.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Loan amount:</span>
                <span className="text-gray-900 ml-2">
                  {leadData.loan_amount ? `₹${leadData.loan_amount.toLocaleString()}` : 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">LTV:</span>
                <span className="text-gray-900 ml-2">{leadData.ltv ? `${leadData.ltv}%` : 'Pending'}</span>
              </div>
              <div>
                <span className="text-gray-600">ROI:</span>
                <span className="text-gray-900 ml-2">{leadData.roi ? `${leadData.roi}% p.a.` : 'Pending'}</span>
              </div>
              <div>
                <span className="text-gray-600">Tenure:</span>
                <span className="text-gray-900 ml-2">
                  {leadData.tenure ? `${leadData.tenure} months` : 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">EMI:</span>
                <span className="text-gray-900 ml-2">
                  {leadData.emi ? `₹${leadData.emi.toLocaleString()}` : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Parties</div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="text-gray-900 ml-2">{leadData.customer_name} • {leadData.customer_phone}</span>
              </div>
              <div>
                <span className="text-gray-600">Dealer:</span>
                <span className="text-gray-900 ml-2">{leadData.dealer_name} ({leadData.dealer_code})</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
                <div className="text-gray-700 font-medium mb-1">
                  Conversion Owner: {leadData.conversion_owner}
                </div>
                {leadData.conversion_owner !== 'Not assigned' ? (
                  <div className="flex items-center gap-3 text-sm">
                    <a href={`mailto:${leadData.conversion_email}`} className="text-blue-600 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {leadData.conversion_email}
                    </a>
                    <a href={`tel:${leadData.conversion_phone}`} className="text-blue-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {leadData.conversion_phone}
                    </a>
                  </div>
                ) : (
                  <div className="text-sm text-amber-600">Assigning in progress</div>
                )}
              </div>
            </div>
          </div>

          {/* Commission */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Commission (KAM)</div>
            {leadData.commission_eligible ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                  <Check className="w-4 h-4" />
                  Commission Eligible
                </div>
                <div className="text-gray-700 space-y-1">
                  <div>0.5% of loan value = ₹{leadData.base_commission.toLocaleString()}</div>
                  {leadData.booster_applied === 'YES' && (
                    <div className="text-green-700 font-medium">
                      Booster: 2× (Dealer's 1st disbursal)
                    </div>
                  )}
                  <div className="text-lg font-semibold text-green-700 mt-2">
                    Total: ₹{leadData.total_commission.toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                Not eligible (not disbursed / rule unmet)
              </div>
            )}
          </div>
        </div>

        {/* Loan Journey - Collapsible */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {!journeyExpanded ? (
            // Collapsed State
            <div>
              <button
                onClick={handleExpandJourney}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex-1 text-left">
                  <div className="text-gray-900 font-medium">Loan Journey</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Progress: {progress.completed}/{progress.total} completed
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-sm">Expand</span>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              {/* Current Stage Summary */}
              <div className="px-4 pb-4 border-t border-gray-200 pt-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Current:</span> {journeyFunnels.findIndex(f => f.name === leadData.current_funnel) + 1}. {leadData.current_funnel} → {leadData.current_sub_stage}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Expanded State
            <div>
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-gray-900 font-medium">Loan Journey</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Progress: {progress.completed}/{progress.total} completed
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandAllFunnels}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Expand All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={collapseAllFunnels}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Collapse All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setJourneyExpanded(false)}
                    className="text-blue-600 flex items-center gap-1"
                  >
                    <span className="text-sm">Collapse</span>
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Funnel Accordion */}
              <div className="p-4 space-y-3">
                {journeyFunnels.map((funnel, funnelIndex) => {
                  const funnelStatus = getFunnelStatus(funnel.name);
                  const isCurrent = leadData.current_funnel === funnel.name;
                  const isExpanded = expandedFunnels.has(funnel.name);

                  return (
                    <div
                      key={funnel.name}
                      className={`border rounded-lg overflow-hidden ${isCurrent ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'
                        }`}
                    >
                      <button
                        onClick={() => toggleFunnel(funnel.name)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${funnelStatus === 'completed' ? 'bg-green-600' :
                              funnelStatus === 'current' ? 'bg-blue-600' :
                                'bg-gray-300'
                            }`}>
                            {funnelStatus === 'completed' ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : funnelStatus === 'current' ? (
                              <Clock className="w-4 h-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-900'
                            }`}>
                            {funnelIndex + 1}. {funnel.name}
                          </span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                          }`} />
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-3 space-y-2 border-t border-gray-200 pt-3">
                          {funnel.stages.map((stage) => {
                            const stageStatus = getStageStatus(funnel.name, stage.id);
                            const isCurrentStage = leadData.current_sub_stage === stage.id;

                            return (
                              <div
                                key={stage.id}
                                className={`flex items-start gap-3 p-2 rounded-lg ${isCurrentStage ? 'bg-blue-100 border border-blue-300' :
                                    stageStatus === 'completed' ? 'bg-green-50' :
                                      'bg-gray-50'
                                  }`}
                              >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${stageStatus === 'completed' ? 'bg-green-600' :
                                    stageStatus === 'current' ? 'bg-blue-600' :
                                      'bg-gray-300'
                                  }`}>
                                  {stageStatus === 'completed' ? (
                                    <Check className="w-3 h-3 text-white" />
                                  ) : stageStatus === 'current' ? (
                                    <Clock className="w-3 h-3 text-white" />
                                  ) : (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium ${isCurrentStage ? 'text-blue-900' : 'text-gray-900'
                                    }`}>
                                    {stage.label}
                                  </div>
                                  {isCurrentStage && leadData.current_funnel === 'CONVERSION' && stage.id === 'DOC_UPLOAD' && (
                                    <div className="text-xs text-amber-700 mt-0.5">
                                      Waiting for docs from customer
                                    </div>
                                  )}
                                  {isCurrentStage && leadData.rag_status === 'red' && (
                                    <div className="text-xs text-red-700 mt-0.5 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      Attention required
                                    </div>
                                  )}
                                  {stageStatus === 'completed' && (
                                    <div className="text-xs text-gray-600 mt-0.5">Completed</div>
                                  )}
                                  {stageStatus === 'future' && (
                                    <div className="text-xs text-gray-500 mt-0.5">Pending</div>
                                  )}
                                  {isCurrentStage && (
                                    <div className="text-xs text-blue-700 mt-1 font-medium">In Progress</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Car Docs Stage */}
                <div className={`border rounded-lg p-4 ${leadData.car_docs_flag === 'Received'
                    ? 'border-green-300 bg-green-50'
                    : 'border-orange-300 bg-orange-50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${leadData.car_docs_flag === 'Received' ? 'bg-green-600' : 'bg-orange-500'
                      }`}>
                      {leadData.car_docs_flag === 'Received' ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">8. Car Docs</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        Status: {leadData.car_docs_flag}
                        {leadData.car_docs_flag === 'Received' && ' • RC received ✅ • 12 docs on file'}
                        {leadData.car_docs_flag === 'Pending' && ' • RC pending from dealer'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}