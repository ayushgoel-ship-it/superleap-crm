import { ArrowLeft, IndianRupee, TrendingUp, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface DCFDealerDetailPageProps {
  onBack: () => void;
  dealerId: string;
  dateRange: string;
}

interface DealerDetails {
  id: string;
  name: string;
  code: string;
  city: string;
  status: string;
  leads: number;
  leadsTarget: number;
  approvals: number;
  approvalsTarget: number;
  disbursals: number;
  disbursalsTarget: number;
  disbursalAmount: string;
  disbursalAmountTarget: string;
}

interface LeadSummary {
  id: string;
  appId: string;
  customerName: string;
  car: string;
  stage: string;
  stageColor: string;
  date: string;
}

interface DisbursalSummary {
  id: string;
  loanId: string;
  customerName: string;
  car: string;
  amount: string;
  date: string;
}

export function DCFDealerDetailPage({ onBack, dealerId, dateRange }: DCFDealerDetailPageProps) {
  // Mock dealer data
  const dealer: DealerDetails = {
    id: dealerId,
    name: 'Gupta Auto World',
    code: 'GGN-001',
    city: 'Gurugram',
    status: 'Active',
    leads: 12,
    leadsTarget: 20,
    approvals: 8,
    approvalsTarget: 12,
    disbursals: 5,
    disbursalsTarget: 8,
    disbursalAmount: '₹21.2L',
    disbursalAmountTarget: '₹35L',
  };

  const recentLeads: LeadSummary[] = [
    { id: '1', appId: 'DL1CAC1234', customerName: 'Rajesh Verma', car: 'Maruti Swift VXI 2020', stage: 'Documentation', stageColor: 'blue', date: '2024-12-09' },
    { id: '2', appId: 'DL1CAC0123', customerName: 'Manoj Singh', car: 'Honda City VX 2020', stage: 'Approved', stageColor: 'green', date: '2024-12-03' },
    { id: '3', appId: 'DCF24110013', customerName: 'Sanjay Sharma', car: 'Maruti Baleno Delta 2020', stage: 'Disbursed', stageColor: 'green', date: '2024-11-13' },
  ];

  const recentDisbursals: DisbursalSummary[] = [
    { id: '1', loanId: 'DCF24110004', customerName: 'Rajesh Kumar', car: 'Honda City VX 2019', amount: '₹4.5L', date: '2024-11-29' },
    { id: '2', loanId: 'DCF24110013', customerName: 'Sanjay Sharma', car: 'Maruti Baleno Delta 2020', amount: '₹3.3L', date: '2024-11-13' },
    { id: '3', loanId: 'DCF24100018', customerName: 'Vikram Gupta', car: 'Hyundai Creta SX 2020', amount: '₹4.1L', date: '2024-10-25' },
    { id: '4', loanId: 'DCF24100022', customerName: 'Amit Verma', car: 'Maruti Swift VXI 2021', amount: '₹3.2L', date: '2024-10-18' },
    { id: '5', loanId: 'DCF24100025', customerName: 'Priya Sharma', car: 'Honda Amaze VX 2020', amount: '₹2.8L', date: '2024-10-12' },
  ];

  const filterChips = [
    { label: 'Channel', value: 'DCF' },
    { label: 'Date', value: dateRange },
  ];

  const getStageColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-700';
      case 'amber':
        return 'bg-amber-100 text-amber-700';
      case 'green':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900">{dealer.name}</h1>
            <div className="text-xs text-gray-500">{dealer.code} • {dealer.city}</div>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs ${
              dealer.status === 'Active'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {dealer.status}
          </span>
        </div>
        
        {/* Filter Chips */}
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {filterChips.map((chip, index) => (
            <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <span className="text-xs">
                {chip.label}: <span className="font-medium">{chip.value}</span>
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Performance Metrics */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-gray-900 mb-4">DCF Performance</h3>
          
          <div className="space-y-4">
            {/* Leads */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Leads</div>
                <div className="text-gray-900">
                  <span className="font-semibold">{dealer.leads}</span>
                  <span className="text-xs text-gray-400 ml-1">/ {dealer.leadsTarget}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${getProgressPercentage(dealer.leads, dealer.leadsTarget)}%` }}
                />
              </div>
            </div>

            {/* Approvals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Approvals</div>
                <div className="text-gray-900">
                  <span className="font-semibold">{dealer.approvals}</span>
                  <span className="text-xs text-gray-400 ml-1">/ {dealer.approvalsTarget}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all duration-300"
                  style={{ width: `${getProgressPercentage(dealer.approvals, dealer.approvalsTarget)}%` }}
                />
              </div>
            </div>

            {/* Disbursals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Disbursals</div>
                <div className="text-gray-900">
                  <span className="font-semibold">{dealer.disbursals}</span>
                  <span className="text-xs text-gray-400 ml-1">/ {dealer.disbursalsTarget}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{ width: `${getProgressPercentage(dealer.disbursals, dealer.disbursalsTarget)}%` }}
                />
              </div>
            </div>

            {/* Disbursal Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600">Disbursal Amount</div>
                <div className="text-gray-900 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  <span className="font-semibold">{dealer.disbursalAmount.replace('₹', '')}</span>
                  <span className="text-xs text-gray-400 ml-1">/ {dealer.disbursalAmountTarget.replace('₹', '')}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{ width: '60.5%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-900">Recent Leads</h3>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
              View all {dealer.leads}
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="border-b border-gray-100 last:border-0 pb-3 last:pb-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-900">{lead.customerName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{lead.appId}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getStageColor(lead.stageColor)}`}>
                    {lead.stage}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">{lead.car}</div>
                  <div className="text-xs text-gray-500">{lead.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Disbursals */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-900">Recent Disbursals</h3>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
              View all {dealer.disbursals}
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentDisbursals.map((disbursal) => (
              <div
                key={disbursal.id}
                className="border-b border-gray-100 last:border-0 pb-3 last:pb-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-900">{disbursal.customerName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{disbursal.loanId}</div>
                  </div>
                  <div className="text-xs text-green-600 flex items-center gap-1 font-medium">
                    <IndianRupee className="w-3 h-3" />
                    {disbursal.amount.replace('₹', '')}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">{disbursal.car}</div>
                  <div className="text-xs text-gray-500">{disbursal.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
