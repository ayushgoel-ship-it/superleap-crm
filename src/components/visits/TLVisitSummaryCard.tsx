interface TLVisitSummaryCardProps {
  totalVisits: number;
  dealersCovered: number;
  topDealers: number;
  taggedDealers: number;
  untaggedDealers: number;
  productiveVisits: number;
  productivePercentage: number;
  timePeriod: string;
  selectedKAM?: string;
}

export function TLVisitSummaryCard({
  totalVisits,
  dealersCovered,
  topDealers,
  taggedDealers,
  untaggedDealers,
  productiveVisits,
  productivePercentage,
  timePeriod,
  selectedKAM,
}: TLVisitSummaryCardProps) {
  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'today':
        return 'Today';
      case 'd-1':
        return 'Yesterday';
      case 'mtd':
        return 'MTD';
      case 'last_7d':
        return 'Last 7 days';
      case 'last_30d':
        return 'Last 30 days';
      case 'custom':
        return 'Custom';
      default:
        return 'MTD';
    }
  };

  const title = selectedKAM && selectedKAM !== 'all'
    ? `Visit Summary – ${selectedKAM}`
    : 'Team Visit Summary';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900">{title}</h2>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
          {getTimePeriodLabel()}
        </span>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Total Visits</div>
          <div className="text-2xl text-gray-900">{totalVisits}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Dealers Covered</div>
          <div className="text-2xl text-gray-900">{dealersCovered}</div>
        </div>
      </div>

      {/* Dealer Type Breakdown */}
      <div className="mb-4">
        <div className="text-xs text-gray-600 mb-2">Dealer Type Breakdown</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
            <div className="text-lg text-purple-700">{topDealers}</div>
            <div className="text-xs text-gray-600">Top</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
            <div className="text-lg text-blue-700">{taggedDealers}</div>
            <div className="text-xs text-gray-600">Tagged</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
            <div className="text-lg text-gray-700">{untaggedDealers}</div>
            <div className="text-xs text-gray-600">Untagged</div>
          </div>
        </div>
      </div>

      {/* Productive Visit Rate */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-600 mb-1">Productive Visit Rate</div>
            <div className="text-sm text-green-700">
              {productivePercentage}% Productive
            </div>
          </div>
          <div className="text-lg text-green-700">
            {productiveVisits}/{totalVisits}
          </div>
        </div>
      </div>
    </div>
  );
}
