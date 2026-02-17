import { ChevronRight } from 'lucide-react';

type ProductivityStatus = 'productive' | 'neutral' | 'not-productive';

interface TLVisitCardProps {
  dealer: string;
  dealerCode: string;
  kamName: string;
  dealerTags: string[];
  visitDate: string;
  visitTime: string;
  visitType: 'Planned' | 'Ad-hoc';
  productivity: ProductivityStatus;
  postVisitSummary: string;
  onClick: () => void;
}

export function TLVisitCard({
  dealer,
  dealerCode,
  kamName,
  dealerTags,
  visitDate,
  visitTime,
  visitType,
  productivity,
  postVisitSummary,
  onClick,
}: TLVisitCardProps) {
  const getProductivityColor = () => {
    switch (productivity) {
      case 'productive':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'neutral':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'not-productive':
        return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  const getProductivityLabel = () => {
    switch (productivity) {
      case 'productive':
        return 'Productive';
      case 'neutral':
        return 'Neutral';
      case 'not-productive':
        return 'Not Productive';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-gray-900 mb-1">{dealer}</div>
          <div className="text-sm text-gray-500">{dealerCode}</div>
        </div>
        <div className={`px-2 py-1 rounded text-xs border ${getProductivityColor()}`}>
          {getProductivityLabel()}
        </div>
      </div>

      {/* KAM Name */}
      <div className="text-xs text-gray-600 mb-2">
        Handled by: <span className="text-gray-900">{kamName}</span>
      </div>

      {/* Dealer Tags */}
      {dealerTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {dealerTags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded text-xs ${
                tag === 'Top Dealer'
                  ? 'bg-purple-100 text-purple-700'
                  : tag === 'Tagged Dealer'
                  ? 'bg-blue-100 text-blue-700'
                  : tag === 'DCF Onboarded'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Visit Date & Time */}
      <div className="text-sm text-gray-600 mb-2">
        {visitDate} • {visitTime}
      </div>

      {/* Visit Type */}
      <div className="text-xs text-gray-500 mb-3">
        Visit type: <span className="text-gray-700">{visitType}</span>
      </div>

      {/* Post-Visit Summary */}
      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-2">
        {postVisitSummary}
      </div>

      {/* Chevron */}
      <div className="flex justify-end">
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}
