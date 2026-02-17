import type { UserRole } from '../../lib/shared/appTypes';
import { IndianRupee, Trophy, Calculator } from 'lucide-react';

interface PerformancePageProps {
  userRole: UserRole;
  onNavigate?: (page: string) => void;
  onOpenTLIncentive?: () => void;
}

export function PerformancePage({ userRole, onNavigate, onOpenTLIncentive }: PerformancePageProps) {
  const topDealers = [
    { dealer: 'Gupta Auto World', code: 'GGN-001', c24Quote: '₹2.4L', stockIns: 24 },
    { dealer: 'New City Autos', code: 'NDA-078', c24Quote: '₹1.9L', stockIns: 18 },
    { dealer: 'Sharma Motors', code: 'GGN-002', c24Quote: '₹1.7L', stockIns: 16 },
  ];

  const incentiveBreakdown = [
    { metric: 'Stock-in', achieved: 124, payout: '₹25,000' },
    { metric: 'I2SI%', achieved: '69%', payout: '₹8,000' },
    { metric: 'DCF Disbursals', achieved: '18', payout: '₹9,000' },
    { metric: 'Input Score', achieved: '87', payout: '₹3,000' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* TL Incentive Dashboard Quick Access (TL only) */}
      {userRole === 'TL' && onOpenTLIncentive && (
        <button
          onClick={onOpenTLIncentive}
          className="w-full bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-500 rounded-xl p-4 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-gray-900 mb-1">TL Incentive Dashboard</div>
                <div className="text-xs text-gray-600">View team performance & incentive calculator</div>
              </div>
            </div>
            <div className="text-2xl">›</div>
          </div>
        </button>
      )}

      {/* Leaderboard Quick Access */}
      <button
        onClick={() => onNavigate && onNavigate('leaderboard')}
        className="w-full bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-4 text-left hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-gray-900 mb-1">View Leaderboard</div>
              <div className="text-xs text-gray-600">You are Rank #7 of 42 KAMs</div>
            </div>
          </div>
          <div className="text-2xl">›</div>
        </div>
      </button>

      {/* Target Cards */}
      <div>
        <h3 className="text-gray-900 mb-3">Targets (MTD)</h3>
        <div className="space-y-3">
          {[
            { title: 'Stock-in', achieved: 124, target: 150, percent: 83 },
            { title: 'I2SI%', achieved: 69, target: 65, percent: 106 },
            { title: 'DCF Disbursals', achieved: 18, target: 25, percent: 72 },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600">{item.title}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  item.percent >= 100 ? 'bg-green-100 text-green-700' :
                  item.percent >= 80 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.percent}%
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl text-gray-900">{item.achieved}</span>
                <span className="text-sm text-gray-500">/ {item.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    item.percent >= 100 ? 'bg-green-500' :
                    item.percent >= 80 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(item.percent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div>
        <h3 className="text-gray-900 mb-3">Lead Funnel (MTD)</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          {[
            { stage: 'Leads', count: 287, max: 287 },
            { stage: 'Inspections', count: 243, max: 287 },
            { stage: 'SIs', count: 198, max: 287 },
            { stage: 'Buys', count: 156, max: 287 },
            { stage: 'Stock-ins', count: 124, max: 287 },
          ].map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{item.stage}</span>
                <span className="text-gray-900">{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(item.count / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Dealers */}
      <div>
        <h3 className="text-gray-900 mb-3">Top Dealers</h3>
        <div className="space-y-2">
          {topDealers.map((dealer, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm text-gray-900">{dealer.dealer}</div>
                  <div className="text-xs text-gray-500">{dealer.code}</div>
                </div>
                <div className="text-green-600">{dealer.c24Quote}</div>
              </div>
              <div className="text-xs text-gray-600">
                Stock-ins: {dealer.stockIns}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incentive Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-900">Incentive Breakdown</h3>
          <div className="flex items-center gap-1 text-green-600">
            <IndianRupee className="w-4 h-4" />
            <span className="text-lg">45,000</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
          {incentiveBreakdown.map((item, idx) => (
            <div key={idx} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-900">{item.metric}</div>
                  <div className="text-xs text-gray-500">Achieved: {item.achieved}</div>
                </div>
                <div className="text-green-600">{item.payout}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}