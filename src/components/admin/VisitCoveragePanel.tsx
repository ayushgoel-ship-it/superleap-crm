import { Info, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

interface CoverageData {
  topDealers: {
    visited: number;
    total: number;
    percentage: number;
    trend: number;
  };
  taggedDealers: {
    visited: number;
    total: number;
    percentage: number;
    trend: number;
  };
  allDealers: {
    visited: number;
    total: number;
    percentage: number;
  };
}

interface VisitBreakdown {
  top: {
    visits: number;
    perKAMPerDay: number;
  };
  tagged: {
    visits: number;
    perKAMPerDay: number;
  };
  untagged: {
    visits: number;
    perKAMPerDay: number;
  };
}

interface VisitCoveragePanelProps {
  coverageData: CoverageData;
  breakdown: VisitBreakdown;
  onViewTopDealers?: () => void;
  onViewTaggedDealers?: () => void;
}

export function VisitCoveragePanel({
  coverageData,
  breakdown,
  onViewTopDealers,
  onViewTaggedDealers,
}: VisitCoveragePanelProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const getCoverageColor = (percentage: number): string => {
    if (percentage >= 70) return 'green';
    if (percentage >= 60) return 'amber';
    return 'red';
  };

  const topColor = getCoverageColor(coverageData.topDealers.percentage);
  const taggedColor = getCoverageColor(coverageData.taggedDealers.percentage);

  return (
    <div className="space-y-4">
      {/* Coverage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Dealers Coverage */}
        <div
          className={`bg-white border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
            topColor === 'green'
              ? 'border-green-500'
              : topColor === 'amber'
              ? 'border-amber-500'
              : 'border-red-500'
          }`}
          onClick={onViewTopDealers}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm text-gray-700">Top Dealers Coverage</h3>
              <button
                onMouseEnter={() => setShowTooltip('top')}
                onMouseLeave={() => setShowTooltip(null)}
                className="relative p-1 hover:bg-gray-100 rounded"
              >
                <Info className="w-3 h-3 text-gray-400" />
                {showTooltip === 'top' && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-10">
                    % of Top dealers that had ≥1 visit in last 30 days
                  </div>
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div
                className={`text-4xl ${
                  topColor === 'green'
                    ? 'text-green-600'
                    : topColor === 'amber'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {coverageData.topDealers.percentage}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {coverageData.topDealers.visited} of {coverageData.topDealers.total} top dealers
                visited
              </div>
            </div>

            <div className="flex items-center gap-1">
              {coverageData.topDealers.trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-xs ${
                  coverageData.topDealers.trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(coverageData.topDealers.trend)}%
              </span>
            </div>
          </div>

          <button className="mt-3 text-xs text-blue-600 hover:text-blue-700">
            View list →
          </button>
        </div>

        {/* Tagged Dealers Coverage */}
        <div
          className={`bg-white border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
            taggedColor === 'green'
              ? 'border-green-500'
              : taggedColor === 'amber'
              ? 'border-amber-500'
              : 'border-red-500'
          }`}
          onClick={onViewTaggedDealers}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm text-gray-700">Tagged Dealers Coverage</h3>
              <button
                onMouseEnter={() => setShowTooltip('tagged')}
                onMouseLeave={() => setShowTooltip(null)}
                className="relative p-1 hover:bg-gray-100 rounded"
              >
                <Info className="w-3 h-3 text-gray-400" />
                {showTooltip === 'tagged' && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-10">
                    % of Tagged dealers that had ≥1 visit in last 30 days
                  </div>
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div
                className={`text-4xl ${
                  taggedColor === 'green'
                    ? 'text-green-600'
                    : taggedColor === 'amber'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {coverageData.taggedDealers.percentage}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {coverageData.taggedDealers.visited} of {coverageData.taggedDealers.total} tagged
                dealers visited
              </div>
            </div>

            <div className="flex items-center gap-1">
              {coverageData.taggedDealers.trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-xs ${
                  coverageData.taggedDealers.trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(coverageData.taggedDealers.trend)}%
              </span>
            </div>
          </div>

          <button className="mt-3 text-xs text-blue-600 hover:text-blue-700">
            View list →
          </button>
        </div>
      </div>

      {/* Overall Coverage */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-700 mb-1">Overall Coverage (All Dealers)</div>
            <div className="text-2xl text-gray-900">{coverageData.allDealers.percentage}%</div>
            <div className="text-xs text-gray-600 mt-1">
              {coverageData.allDealers.visited} of {coverageData.allDealers.total} dealers visited
            </div>
          </div>
        </div>
      </div>

      {/* Visits per KAM/day Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm text-gray-900 mb-4">Visits / KAM / day Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* Top */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Top Dealers</div>
            <div className="text-2xl text-blue-600">{breakdown.top.perKAMPerDay}</div>
            <div className="text-xs text-gray-500 mt-1">{breakdown.top.visits} visits</div>
            <div className="mt-2">
              <div className="h-8 flex items-end gap-0.5">
                <div className="w-1/3 bg-blue-300 h-4"></div>
                <div className="w-1/3 bg-blue-400 h-6"></div>
                <div className="w-1/3 bg-blue-500 h-8"></div>
              </div>
            </div>
          </div>

          {/* Tagged */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Tagged Dealers</div>
            <div className="text-2xl text-purple-600">{breakdown.tagged.perKAMPerDay}</div>
            <div className="text-xs text-gray-500 mt-1">{breakdown.tagged.visits} visits</div>
            <div className="mt-2">
              <div className="h-8 flex items-end gap-0.5">
                <div className="w-1/3 bg-purple-300 h-5"></div>
                <div className="w-1/3 bg-purple-400 h-7"></div>
                <div className="w-1/3 bg-purple-500 h-6"></div>
              </div>
            </div>
          </div>

          {/* Untagged */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Untagged Dealers</div>
            <div className="text-2xl text-gray-600">{breakdown.untagged.perKAMPerDay}</div>
            <div className="text-xs text-gray-500 mt-1">{breakdown.untagged.visits} visits</div>
            <div className="mt-2">
              <div className="h-8 flex items-end gap-0.5">
                <div className="w-1/3 bg-gray-300 h-3"></div>
                <div className="w-1/3 bg-gray-400 h-4"></div>
                <div className="w-1/3 bg-gray-500 h-5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
