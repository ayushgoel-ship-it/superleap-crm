import { useMemo } from 'react';
import { ArrowLeft, IndianRupee } from 'lucide-react';
import { Badge } from '../ui/badge';
import { getFilteredDCFLeads } from '../../data/canonicalMetrics';
import { TimePeriod } from '../../lib/domain/constants';

interface DCFDisbursalsListPageProps {
  onBack: () => void;
  dateRange: string;
}

export function DCFDisbursalsListPage({ onBack, dateRange }: DCFDisbursalsListPageProps) {
  const disbursals = useMemo(() => {
    const period = (Object.values(TimePeriod).includes(dateRange as TimePeriod)
      ? dateRange as TimePeriod
      : TimePeriod.MTD);
    const raw = getFilteredDCFLeads({ period }).filter(l => l.overallStatus === 'DISBURSED');
    return raw.map(lead => ({
      id: lead.id,
      loanId: lead.id,
      customerName: lead.customerName,
      dealerName: lead.dealerName,
      dealerCode: lead.dealerCode,
      car: lead.car,
      amountValue: lead.loanAmount ?? 0,
      amount: `₹${((lead.loanAmount ?? 0) / 100000).toFixed(1)}L`,
      disbursedDate: (lead as any).disbursalDate ?? lead.createdAt,
      tenure: lead.tenure ? `${lead.tenure} months` : '–',
    }));
  }, [dateRange]);

  const filterChips = [
    { label: 'Section', value: 'Loans' },
    { label: 'Status', value: 'All' },
    { label: 'Channel', value: 'DCF' },
    { label: 'Stage', value: 'Disbursed' },
    { label: 'Date', value: dateRange },
  ];

  // Calculate total
  const totalAmount = disbursals.reduce((sum, d) => sum + d.amountValue, 0);
  const formatTotal = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-gray-900">DCF Disbursals</h1>
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

      {/* Summary Stats */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Total Amount</div>
            <div className="text-xl text-green-600 flex items-center gap-1 font-semibold">
              <IndianRupee className="w-5 h-5" />
              {formatTotal(totalAmount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Total Loans</div>
            <div className="text-xl text-gray-900 font-semibold">{disbursals.length}</div>
          </div>
        </div>
      </div>

      {/* Disbursals List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {disbursals.map((disbursal) => (
          <div
            key={disbursal.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="text-gray-900 mb-1">{disbursal.customerName}</div>
                <div className="text-xs text-gray-500">{disbursal.loanId}</div>
              </div>
              <div className="text-right">
                <div className="text-lg text-green-600 flex items-center justify-end gap-1 font-semibold">
                  <IndianRupee className="w-4 h-4" />
                  {disbursal.amount.replace('₹', '')}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{disbursal.tenure}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Car</div>
                <div className="text-xs text-gray-900">{disbursal.car}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Dealer</div>
                  <div className="text-xs text-gray-900">{disbursal.dealerName} • {disbursal.dealerCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Disbursed</div>
                  <div className="text-xs text-gray-900">{disbursal.disbursedDate}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
