import { useMemo } from 'react';
import { ArrowLeft, IndianRupee, TrendingUp, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { getDealerById } from '../../data/selectors';
import { getFilteredDCFLeads } from '../../data/canonicalMetrics';
import { TimePeriod } from '../../lib/domain/constants';

interface DCFDealerDetailPageProps {
  onBack: () => void;
  dealerId: string;
  dateRange: string;
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

function statusToStageColor(status: string): string {
  const s = status.toUpperCase();
  if (s === 'DISBURSED') return 'green';
  if (s.includes('PENDING') || s.includes('DELAYED')) return 'amber';
  if (s === 'IN_PROGRESS') return 'blue';
  if (s === 'REJECTED') return 'red';
  return 'gray';
}

export function DCFDealerDetailPage({ onBack, dealerId, dateRange }: DCFDealerDetailPageProps) {
  // Derive dealer + DCF data from canonical sources
  const { dealer, recentLeads, recentDisbursals } = useMemo(() => {
    const period = (Object.values(TimePeriod).includes(dateRange as TimePeriod)
      ? dateRange as TimePeriod
      : TimePeriod.MTD);
    const rawDealer = getDealerById(dealerId);
    const dcfLeads = getFilteredDCFLeads({ period }).filter(l => l.dealerId === dealerId);
    const disbursed = dcfLeads.filter(l => l.overallStatus === 'DISBURSED');
    const totalDisbursalAmount = disbursed.reduce((s, l) => s + (l.loanAmount ?? 0), 0);

    const dealerData = {
      id: dealerId,
      name: rawDealer?.name ?? 'Unknown Dealer',
      code: rawDealer?.code ?? '–',
      city: rawDealer?.city ?? '–',
      status: rawDealer?.status === 'active' ? 'Active' : rawDealer?.status === 'dormant' ? 'Dormant' : 'Inactive',
      leads: dcfLeads.length,
      leadsTarget: 20,
      approvals: dcfLeads.filter(l => !['REJECTED', 'DELAYED'].includes(l.overallStatus.toUpperCase())).length,
      approvalsTarget: 12,
      disbursals: disbursed.length,
      disbursalsTarget: 8,
      disbursalAmount: `₹${(totalDisbursalAmount / 100000).toFixed(1)}L`,
      disbursalAmountTarget: '₹35L',
    };

    const leads: LeadSummary[] = dcfLeads.slice(0, 3).map(l => ({
      id: l.id,
      appId: l.id,
      customerName: l.customerName,
      car: l.car,
      stage: l.overallStatus,
      stageColor: statusToStageColor(l.overallStatus),
      date: l.createdAt,
    }));

    const disbs: DisbursalSummary[] = disbursed.map(l => ({
      id: l.id,
      loanId: l.id,
      customerName: l.customerName,
      car: l.car,
      amount: `₹${((l.loanAmount ?? 0) / 100000).toFixed(1)}L`,
      date: (l as any).disbursalDate ?? l.createdAt,
    }));

    return { dealer: dealerData, recentLeads: leads, recentDisbursals: disbs };
  }, [dealerId]);

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
