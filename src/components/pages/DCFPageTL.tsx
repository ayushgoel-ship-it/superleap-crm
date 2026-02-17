import type { PageView, DealersFilterContext, LeadsFilterContext } from '../../lib/shared/appTypes';
import { useState } from 'react';
import { IndianRupee, TrendingUp, ChevronRight, Filter, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';

interface DCFPageProps {
  onNavigateToDealers: (filter?: string, context?: string, filterContext?: DealersFilterContext) => void;
  onNavigateToLeads: (filterContext?: LeadsFilterContext) => void;
  onNavigate: (page: PageView) => void;
  onNavigateToDCFDealers?: (filterType: 'onboarded' | 'leadGiving') => void;
  onNavigateToDCFLeads?: () => void;
  onNavigateToDCFDisbursals?: () => void;
  onNavigateToDCFDealerDetail?: (dealerId: string) => void;
  onNavigateToDCFOnboardingDetail?: (dealerId: string) => void;
  onDateRangeChange?: (dateRange: string) => void;
  userRole?: 'KAM' | 'TL';
}

type OnboardingStep = 'form_filled' | 'docs_cibil' | 'inspection' | 'finance_approval' | 'onboarded';

interface OnboardingStatus {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  rejectionReason?: string;
}

type DCFStatusFilter = 'All' | 'Onboarded' | 'Not Onboarded';

interface KAMOption {
  id: string;
  name: string;
}

export function DCFPageTL({ 
  onNavigateToDealers, 
  onNavigateToLeads, 
  onNavigate,
  onNavigateToDCFDealers,
  onNavigateToDCFLeads,
  onNavigateToDCFDisbursals,
  onNavigateToDCFDealerDetail,
  onNavigateToDCFOnboardingDetail,
  onDateRangeChange,
}: DCFPageProps) {
  const [selectedDateRange, setSelectedDateRange] = useState('MTD');
  const [statusFilter, setStatusFilter] = useState<DCFStatusFilter>('All');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  
  // TL-specific: KAM filter
  const [selectedKAM, setSelectedKAM] = useState('all');
  const [showKAMDropdown, setShowKAMDropdown] = useState(false);
  
  const kamOptions: KAMOption[] = [
    { id: 'all', name: 'All KAMs' },
    { id: 'rajesh', name: 'Rajesh Kumar' },
    { id: 'priya', name: 'Priya Sharma' },
    { id: 'amit', name: 'Amit Patel' },
    { id: 'neha', name: 'Neha Singh' },
  ];
  
  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  };

  const handleKAMSelect = (kamId: string) => {
    setSelectedKAM(kamId);
    setShowKAMDropdown(false);
  };

  // Mock dealers with KAM assignments
  const allDealers = [
    {
      id: '1',
      name: 'Gupta Auto World',
      code: 'GGN-001',
      kamId: 'rajesh',
      kamName: 'Rajesh Kumar',
      onboardingStatus: 'Active',
      isOnboarded: true,
      dcfLeads: 12,
      dcfLeadsTarget: 20,
      approvals: 8,
      approvalsTarget: 12,
      disbursals: 5,
      disbursalsTarget: 8,
      disbursalAmount: 11.2,
    },
    {
      id: '2',
      name: 'City Cars',
      code: 'GGN-045',
      kamId: 'rajesh',
      kamName: 'Rajesh Kumar',
      onboardingStatus: 'Active',
      isOnboarded: true,
      dcfLeads: 6,
      dcfLeadsTarget: 15,
      approvals: 4,
      approvalsTarget: 10,
      disbursals: 3,
      disbursalsTarget: 6,
      disbursalAmount: 7.2,
    },
    {
      id: '3',
      name: 'Sharma Motors',
      code: 'GGN-002',
      kamId: 'priya',
      kamName: 'Priya Sharma',
      onboardingStatus: 'Active',
      isOnboarded: true,
      dcfLeads: 8,
      dcfLeadsTarget: 15,
      approvals: 6,
      approvalsTarget: 10,
      disbursals: 3,
      disbursalsTarget: 6,
      disbursalAmount: 6.8,
    },
    {
      id: '4',
      name: 'Balaji Wheels',
      code: 'GGN-089',
      kamId: 'priya',
      kamName: 'Priya Sharma',
      onboardingStatus: 'Active',
      isOnboarded: true,
      dcfLeads: 4,
      dcfLeadsTarget: 12,
      approvals: 2,
      approvalsTarget: 8,
      disbursals: 2,
      disbursalsTarget: 5,
      disbursalAmount: 3.4,
    },
    {
      id: '5',
      name: 'New City Autos',
      code: 'NDA-078',
      kamId: 'amit',
      kamName: 'Amit Patel',
      onboardingStatus: 'Active',
      isOnboarded: true,
      dcfLeads: 10,
      dcfLeadsTarget: 18,
      approvals: 7,
      approvalsTarget: 11,
      disbursals: 4,
      disbursalsTarget: 7,
      disbursalAmount: 9.5,
    },
    {
      id: '6',
      name: 'Prime Auto Hub',
      code: 'FBD-012',
      kamId: 'rajesh',
      kamName: 'Rajesh Kumar',
      onboardingStatus: 'Pending Docs',
      isOnboarded: false,
      onboarding: {
        currentStep: 'docs_cibil' as OnboardingStep,
        completedSteps: ['form_filled' as OnboardingStep],
      },
      dcfLeadsTarget: 20,
      approvalsTarget: 12,
      disbursalsTarget: 8,
    },
    {
      id: '7',
      name: 'Royal Car Trading',
      code: 'DEL-045',
      kamId: 'neha',
      kamName: 'Neha Singh',
      onboardingStatus: 'Active',
      isOnboarded: true,
      dcfLeads: 15,
      dcfLeadsTarget: 22,
      approvals: 11,
      approvalsTarget: 16,
      disbursals: 7,
      disbursalsTarget: 10,
      disbursalAmount: 16.5,
    },
    {
      id: '8',
      name: 'Metro Motors',
      code: 'GGN-089',
      kamId: 'priya',
      kamName: 'Priya Sharma',
      onboardingStatus: 'Inspection Pending',
      isOnboarded: false,
      onboarding: {
        currentStep: 'inspection' as OnboardingStep,
        completedSteps: ['form_filled' as OnboardingStep, 'docs_cibil' as OnboardingStep],
      },
      dcfLeadsTarget: 18,
      approvalsTarget: 11,
      disbursalsTarget: 7,
    },
    {
      id: '9',
      name: 'Elite Automobiles',
      code: 'FBD-156',
      kamId: 'amit',
      kamName: 'Amit Patel',
      onboardingStatus: 'Finance Review',
      isOnboarded: false,
      onboarding: {
        currentStep: 'finance_approval' as OnboardingStep,
        completedSteps: ['form_filled' as OnboardingStep, 'docs_cibil' as OnboardingStep, 'inspection' as OnboardingStep],
      },
      dcfLeadsTarget: 15,
      approvalsTarget: 10,
      disbursalsTarget: 6,
    },
  ];

  // Filter dealers by KAM
  const filteredByKAM = selectedKAM === 'all' 
    ? allDealers 
    : allDealers.filter(d => d.kamId === selectedKAM);

  // Filter dealers based on selected status
  const filteredDealers = filteredByKAM.filter((dealer) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Onboarded') return dealer.isOnboarded;
    if (statusFilter === 'Not Onboarded') return !dealer.isOnboarded;
    return true;
  });

  const onboardedCount = filteredByKAM.filter(d => d.isOnboarded).length;
  const notOnboardedCount = filteredByKAM.filter(d => !d.isOnboarded).length;

  // Calculate metrics based on selected KAM
  const calculateMetrics = () => {
    const dealers = filteredByKAM;
    const onboarded = dealers.filter(d => d.isOnboarded);
    
    const totalOnboarded = onboarded.length;
    const totalOnboardedTarget = selectedKAM === 'rajesh' ? 10 : selectedKAM === 'priya' ? 10 : selectedKAM === 'all' ? 20 : 8;
    const onboardedThisMonth = selectedKAM === 'rajesh' ? 2 : selectedKAM === 'priya' ? 1 : selectedKAM === 'all' ? 3 : 1;
    
    const leadGiving = onboarded.filter(d => (d.dcfLeads ?? 0) > 0).length;
    const leadGivingTarget = selectedKAM === 'rajesh' ? 8 : selectedKAM === 'priya' ? 7 : selectedKAM === 'all' ? 15 : 6;
    const leadGivingPercent = Math.round((leadGiving / Math.max(totalOnboarded, 1)) * 100);
    
    const totalDCFLeads = onboarded.reduce((sum, d) => sum + (d.dcfLeads ?? 0), 0);
    const totalDCFLeadsTarget = selectedKAM === 'rajesh' ? 25 : selectedKAM === 'priya' ? 20 : selectedKAM === 'all' ? 60 : 18;
    const dcfLeadsGrowth = selectedKAM === 'rajesh' ? 22 : selectedKAM === 'priya' ? 15 : selectedKAM === 'all' ? 28 : 18;
    
    const totalDisbursalAmount = onboarded.reduce((sum, d) => sum + (d.disbursalAmount ?? 0), 0);
    const totalDisbursalTarget = selectedKAM === 'rajesh' ? 30 : selectedKAM === 'priya' ? 25 : selectedKAM === 'all' ? 60 : 22;
    const totalDisbursalLoans = onboarded.reduce((sum, d) => sum + (d.disbursals ?? 0), 0);
    const totalDisbursalLoansTarget = selectedKAM === 'rajesh' ? 12 : selectedKAM === 'priya' ? 10 : selectedKAM === 'all' ? 25 : 9;
    
    return {
      onboarded: { achieved: totalOnboarded, target: totalOnboardedTarget, growth: onboardedThisMonth },
      leadGiving: { achieved: leadGiving, target: leadGivingTarget, percent: leadGivingPercent },
      dcfLeads: { achieved: totalDCFLeads, target: totalDCFLeadsTarget, growth: dcfLeadsGrowth },
      disbursals: { 
        amount: totalDisbursalAmount, 
        amountTarget: totalDisbursalTarget,
        loans: totalDisbursalLoans,
        loansTarget: totalDisbursalLoansTarget,
      },
    };
  };

  const metrics = calculateMetrics();

  // Metric card click handlers
  const handleOnboardedDealersClick = () => {
    if (onNavigateToDCFDealers) {
      onNavigateToDCFDealers('onboarded');
    } else {
      onNavigateToDealers(
        'DCF',
        'Showing DCF onboarded dealers',
        {
          channel: 'DCF',
          status: 'Onboarded',
          dateRange: selectedDateRange,
        }
      );
    }
  };

  const handleLeadGivingClick = () => {
    if (onNavigateToDCFDealers) {
      onNavigateToDCFDealers('leadGiving');
    } else {
      onNavigateToDealers(
        'DCF',
        'Showing DCF dealers giving leads',
        {
          channel: 'DCF',
          status: 'Onboarded',
          leadGiving: true,
          dateRange: selectedDateRange,
        }
      );
    }
  };

  const handleDCFLeadsClick = () => {
    if (onNavigateToDCFLeads) {
      onNavigateToDCFLeads();
    } else {
      onNavigateToLeads({
        channel: 'DCF',
        dateRange: selectedDateRange,
      });
    }
  };

  const handleDisbursalsClick = () => {
    if (onNavigateToDCFDisbursals) {
      onNavigateToDCFDisbursals();
    } else {
      // Navigate to the performance/loans tab
      onNavigate('performance');
    }
  };

  const handleDealerClick = (dealerId: string, isOnboarded: boolean) => {
    if (isOnboarded) {
      if (onNavigateToDCFDealerDetail) {
        onNavigateToDCFDealerDetail(dealerId);
      } else {
        // Navigate to dealer detail page with DCF context
        onNavigateToDealers(
          'DCF',
          'Viewing dealer DCF performance',
          {
            channel: 'DCF',
            dateRange: selectedDateRange,
          }
        );
      }
    } else {
      // Navigate to onboarding detail page
      if (onNavigateToDCFOnboardingDetail) {
        onNavigateToDCFOnboardingDetail(dealerId);
      }
    }
  };

  // Helper function to get step number and label for status line
  const getStepInfo = (onboarding?: OnboardingStatus) => {
    if (!onboarding) return { step: 5, label: 'Onboarded' };
    
    const stepMap: Record<OnboardingStep, { number: number; label: string }> = {
      form_filled: { number: 1, label: 'Form Filled' },
      docs_cibil: { number: 2, label: 'Docs & CIBIL' },
      inspection: { number: 3, label: 'Inspection' },
      finance_approval: { number: 4, label: 'Finance Approval' },
      onboarded: { number: 5, label: 'Onboarded' },
    };
    
    return stepMap[onboarding.currentStep] || { step: 1, label: 'Form Filled' };
  };

  const selectedKAMName = kamOptions.find(k => k.id === selectedKAM)?.name || 'All KAMs';

  return (
    <div className="p-4 space-y-6">
      {/* Date Range Selector + KAM Filter */}
      <div className="flex items-center justify-between gap-3">
        {/* Date Range Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
          {['MTD', 'Last 7 Days', 'Last 30 Days', 'QTD'].map((range) => (
            <button
              key={range}
              onClick={() => handleDateRangeChange(range)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                selectedDateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* KAM Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowKAMDropdown(!showKAMDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <span className="text-gray-500">KAM:</span>
            <span className="font-medium">{selectedKAMName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {/* KAM Dropdown Menu */}
          {showKAMDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowKAMDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                {kamOptions.map((kam) => (
                  <button
                    key={kam.id}
                    onClick={() => handleKAMSelect(kam.id)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      selectedKAM === kam.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {kam.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards - Now Clickable with Targets */}
      <div className="grid grid-cols-2 gap-3">
        {/* Onboarded Dealers Card */}
        <button
          onClick={handleOnboardedDealersClick}
          className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="text-xs text-gray-600 mb-1">Onboarded Dealers</div>
          <div className="text-2xl text-gray-900 mb-0.5">
            <span className="font-semibold">{metrics.onboarded.achieved}</span>
            <span className="text-lg text-gray-400"> / {metrics.onboarded.target}</span>
          </div>
          <div className="text-xs text-green-600 mt-1">+{metrics.onboarded.growth} this month</div>
        </button>

        {/* Lead Giving Card */}
        <button
          onClick={handleLeadGivingClick}
          className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="text-xs text-gray-600 mb-1">Lead Giving</div>
          <div className="text-2xl text-gray-900 mb-0.5">
            <span className="font-semibold">{metrics.leadGiving.achieved}</span>
            <span className="text-lg text-gray-400"> / {metrics.leadGiving.target}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">{metrics.leadGiving.percent}% active</div>
        </button>

        {/* DCF Leads (MTD) Card */}
        <button
          onClick={handleDCFLeadsClick}
          className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="text-xs text-gray-600 mb-1">DCF Leads (MTD)</div>
          <div className="text-2xl text-gray-900 mb-0.5">
            <span className="font-semibold">{metrics.dcfLeads.achieved}</span>
            <span className="text-lg text-gray-400"> / {metrics.dcfLeads.target}</span>
          </div>
          <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +{metrics.dcfLeads.growth}%
          </div>
        </button>

        {/* Disbursals Card */}
        <button
          onClick={handleDisbursalsClick}
          className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="text-xs text-gray-600 mb-1">Disbursals</div>
          <div className="text-lg text-green-600 flex items-center gap-1 mb-0.5">
            <IndianRupee className="w-4 h-4" />
            <span className="font-semibold">{metrics.disbursals.amount.toFixed(1)}L</span>
            <span className="text-base text-gray-400"> / {metrics.disbursals.amountTarget}L</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <span className="font-medium">{metrics.disbursals.loans}</span>
            <span className="text-gray-400"> / {metrics.disbursals.loansTarget}</span> loans
          </div>
        </button>
      </div>

      {/* DCF Dealers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-900">DCF Dealer Performance</h3>
          <div className="flex items-center gap-2">
            {/* Filter Chips */}
            <div className="flex gap-1">
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  statusFilter === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({filteredByKAM.length})
              </button>
              <button
                onClick={() => setStatusFilter('Onboarded')}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  statusFilter === 'Onboarded'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Onboarded ({onboardedCount})
              </button>
              <button
                onClick={() => setStatusFilter('Not Onboarded')}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  statusFilter === 'Not Onboarded'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Not Onboarded ({notOnboardedCount})
              </button>
            </div>
            {/* Filter Icon */}
            <button
              onClick={() => setShowFilterSheet(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Unified dealer cards - all same height and structure */}
        <div className="space-y-3">
          {filteredDealers.map((dealer) => {
            const stepInfo = getStepInfo(dealer.onboarding);
            const isNotOnboarded = !dealer.isOnboarded && dealer.onboarding;
            
            return (
              <button
                key={dealer.id}
                onClick={() => handleDealerClick(dealer.id, dealer.isOnboarded)}
                className={`w-full rounded-lg p-4 text-left hover:shadow-md transition-shadow active:scale-[0.99] ${
                  isNotOnboarded 
                    ? 'border-l-4 border-amber-400 bg-gradient-to-r from-amber-50/30 to-white border-t border-r border-b border-gray-200' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                {/* Row 1: Dealer name and status pill */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-gray-900 mb-1">{dealer.name}</div>
                    <div className="text-xs text-gray-500">
                      {dealer.code} • KAM: {dealer.kamName}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    dealer.isOnboarded 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {dealer.onboardingStatus}
                  </span>
                </div>

                {/* Row 2: Metrics grid - same for all dealers */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Leads</div>
                    <div className="text-lg text-gray-900">
                      {dealer.isOnboarded ? (
                        <>
                          <span className="font-medium">{dealer.dcfLeads}</span>
                          <span className="text-xs text-gray-400 ml-1">
                            / {dealer.dcfLeadsTarget}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Approvals</div>
                    <div className="text-lg text-gray-900">
                      {dealer.isOnboarded ? (
                        <>
                          <span className="font-medium">{dealer.approvals}</span>
                          <span className="text-xs text-gray-400 ml-1">
                            / {dealer.approvalsTarget}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Disbursals</div>
                    <div className="text-lg text-gray-900">
                      {dealer.isOnboarded ? (
                        <>
                          <span className="font-medium">{dealer.disbursals}</span>
                          <span className="text-xs text-gray-400 ml-1">
                            / {dealer.disbursalsTarget}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 3: DCF status line */}
                <div className="flex items-center gap-2 text-xs">
                  {dealer.isOnboarded ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-gray-600">
                        DCF status: <span className="text-gray-700">Onboarded (Step {stepInfo.step} of 5)</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-gray-600">
                        DCF status: <span className="text-amber-700">{stepInfo.label} (Step {stepInfo.step} of 5)</span>
                      </span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      {showFilterSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-900">Filter DCF Dealers</h3>
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* DCF Status Section */}
              <div>
                <div className="text-xs text-gray-500 mb-2">DCF Status</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="dcf-status"
                      checked={statusFilter === 'All'}
                      onChange={() => setStatusFilter('All')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900">All Dealers ({filteredByKAM.length})</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="dcf-status"
                      checked={statusFilter === 'Onboarded'}
                      onChange={() => setStatusFilter('Onboarded')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900">Onboarded ({onboardedCount})</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="dcf-status"
                      checked={statusFilter === 'Not Onboarded'}
                      onChange={() => setStatusFilter('Not Onboarded')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900">Not Onboarded ({notOnboardedCount})</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={() => {
                  setStatusFilter('All');
                  setShowFilterSheet(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterSheet(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}