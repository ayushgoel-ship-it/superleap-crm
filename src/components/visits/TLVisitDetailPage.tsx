import { ArrowLeft, TrendingUp, TrendingDown, Minus, Calendar, MapPin } from 'lucide-react';

type ProductivityStatus = 'productive' | 'neutral' | 'not-productive';

interface TLVisitDetailPageProps {
  dealer: string;
  dealerCode: string;
  city: string;
  kamName: string;
  dealerTags: string[];
  visitDate: string;
  visitTime: string;
  visitType: 'Planned' | 'Ad-hoc';
  visitPurpose: string;
  productivity: ProductivityStatus;
  productivityExplanation: string;
  beforeAfterData: {
    leads: { before: number; after: number };
    inspections: { before: number; after: number };
    stockIns: { before: number; after: number };
    dcfLeads: { before: number; after: number };
  };
  visitDetails: {
    meetingPerson: string;
    discussionPoints: string;
    actionItems: string[];
    nextFollowUpDate: string;
  };
  shopPhotos: string[];
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
  onBack: () => void;
}

export function TLVisitDetailPage({
  dealer,
  dealerCode,
  city,
  kamName,
  dealerTags,
  visitDate,
  visitTime,
  visitType,
  visitPurpose,
  productivity,
  productivityExplanation,
  beforeAfterData,
  visitDetails,
  shopPhotos,
  recentActivity,
  onBack,
}: TLVisitDetailPageProps) {
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

  const getTrendIcon = (before: number, after: number) => {
    if (after > before) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (after < before) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (before: number, after: number) => {
    if (after > before) return 'text-green-600';
    if (after < before) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg text-gray-900">{dealer}</h1>
            <div className="text-sm text-gray-500">
              {dealerCode} • {city}
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-xs border flex-shrink-0 ${getProductivityColor()}`}>
            {getProductivityLabel()}
          </div>
        </div>

        {/* KAM Name */}
        <div className="text-sm text-gray-600 mb-3">
          Visited by <span className="text-gray-900">{kamName}</span>
        </div>

        {/* Dealer Tags */}
        {dealerTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Visit Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-gray-900 mb-3">Visit Summary</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-600">Visit Date & Time:</span>{' '}
                <span className="text-gray-900">{visitDate} • {visitTime}</span>
              </div>
            </div>

            <div className="text-sm">
              <span className="text-gray-600">Visit Type:</span>{' '}
              <span className={`px-2 py-0.5 rounded text-xs ${
                visitType === 'Planned' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {visitType}
              </span>
            </div>

            <div className="text-sm">
              <span className="text-gray-600">Visit Purpose:</span>{' '}
              <span className="text-gray-900">{visitPurpose}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-300">
              <div className="text-xs text-gray-600 mb-1">Productivity Analysis</div>
              <div className="text-sm text-gray-900">{productivityExplanation}</div>
            </div>
          </div>
        </div>

        {/* Dealer Performance Snapshot */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-gray-900 mb-3">Dealer Performance (Before vs After)</h2>
          <div className="text-xs text-gray-500 mb-3">7 days before visit vs 7 days after visit</div>

          <div className="space-y-3">
            {/* Leads */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getTrendIcon(beforeAfterData.leads.before, beforeAfterData.leads.after)}
                <span className="text-sm text-gray-700">Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{beforeAfterData.leads.before}</span>
                <span className="text-gray-400">→</span>
                <span className={`text-sm ${getTrendColor(beforeAfterData.leads.before, beforeAfterData.leads.after)}`}>
                  {beforeAfterData.leads.after}
                </span>
              </div>
            </div>

            {/* Inspections */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getTrendIcon(beforeAfterData.inspections.before, beforeAfterData.inspections.after)}
                <span className="text-sm text-gray-700">Inspections</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{beforeAfterData.inspections.before}</span>
                <span className="text-gray-400">→</span>
                <span className={`text-sm ${getTrendColor(beforeAfterData.inspections.before, beforeAfterData.inspections.after)}`}>
                  {beforeAfterData.inspections.after}
                </span>
              </div>
            </div>

            {/* Stock-ins */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getTrendIcon(beforeAfterData.stockIns.before, beforeAfterData.stockIns.after)}
                <span className="text-sm text-gray-700">Stock-ins</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{beforeAfterData.stockIns.before}</span>
                <span className="text-gray-400">→</span>
                <span className={`text-sm ${getTrendColor(beforeAfterData.stockIns.before, beforeAfterData.stockIns.after)}`}>
                  {beforeAfterData.stockIns.after}
                </span>
              </div>
            </div>

            {/* DCF Leads */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getTrendIcon(beforeAfterData.dcfLeads.before, beforeAfterData.dcfLeads.after)}
                <span className="text-sm text-gray-700">DCF Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{beforeAfterData.dcfLeads.before}</span>
                <span className="text-gray-400">→</span>
                <span className={`text-sm ${getTrendColor(beforeAfterData.dcfLeads.before, beforeAfterData.dcfLeads.after)}`}>
                  {beforeAfterData.dcfLeads.after}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visit Details & Feedback */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-gray-900 mb-3">Visit Details & Feedback</h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Meeting Person</div>
              <div className="text-sm text-gray-900">{visitDetails.meetingPerson}</div>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">Discussion Points</div>
              <div className="text-sm text-gray-900 whitespace-pre-line">{visitDetails.discussionPoints}</div>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-2">Action Items Agreed</div>
              <ul className="space-y-1">
                {visitDetails.actionItems.map((item, index) => (
                  <li key={index} className="text-sm text-gray-900 flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">Next Follow-up Date</div>
              <div className="text-sm text-gray-900">{visitDetails.nextFollowUpDate}</div>
            </div>

            {/* Shop Photos */}
            {shopPhotos.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-2">Shop Photos</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {shopPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center"
                    >
                      <MapPin className="w-6 h-6 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Around Visit */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-gray-900 mb-3">Recent Activity Around Visit</h2>
          <div className="text-xs text-gray-500 mb-3">Activity ±7 days around visit date</div>
          
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{activity.description}</div>
                  <div className="text-xs text-gray-500">{activity.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
