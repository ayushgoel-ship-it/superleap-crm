import { useState, useMemo } from 'react';
import { ArrowUpDown, Search, ChevronDown } from 'lucide-react';
import { TLLeaderboardRow, TLData } from '../admin/TLLeaderboardRow';
import { TimePeriod } from '../../lib/domain/constants';
import { computeKAMMetrics } from '../../lib/metrics/metricsFromDB';

interface TLLeaderboardPageProps {
  onViewTLDetail?: (tlId: string) => void;
  onBack?: () => void;
}

export function TLLeaderboardPage({ onViewTLDetail, onBack }: TLLeaderboardPageProps) {
  const [sortBy, setSortBy] = useState<'stockins' | 'inputScore' | 'i2si' | 'visits' | 'calls'>('stockins');
  const [searchTerm, setSearchTerm] = useState('');
  const [timePeriod, setTimePeriod] = useState('MTD');
  const [region, setRegion] = useState('All');
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [showRegionFilter, setShowRegionFilter] = useState(false);

  // Build TL data from real metrics
  const mockTLData: TLData[] = useMemo(() => {
    const kamMetrics = computeKAMMetrics(TimePeriod.MTD);
    return kamMetrics.map((km, idx) => {
      const siTarget = 150;
      const dcfTarget = 25;
      const dcfValueTarget = 1500000;
      return {
        id: km.kamId || `tl-${idx}`,
        name: km.kamName,
        region: 'NCR',
        kamCount: 5,
        stockinsActual: km.stockIns,
        stockinsTarget: siTarget,
        stockinsAchievement: siTarget > 0 ? Math.round((km.stockIns / siTarget) * 100) : 0,
        dcfCount: km.dcfTotal,
        dcfTarget,
        dcfValue: km.dcfDisbursedValue * 100000,
        dcfValueTarget,
        avgInputScore: km.inputScore,
        i2si: km.i2si,
        productiveVisitsPercent: km.completedVisits > 0 ? Math.round((km.completedVisits / Math.max(km.totalVisits, 1)) * 100) : 0,
        productiveCallsPercent: km.callConnectRate,
        stockinsTrend: [km.stockIns, km.stockIns, km.stockIns, km.stockIns, km.stockIns, km.stockIns, km.stockIns],
        dcfTrend: [km.dcfDisbursals, km.dcfDisbursals, km.dcfDisbursals, km.dcfDisbursals, km.dcfDisbursals, km.dcfDisbursals, km.dcfDisbursals],
        callsTrend: [km.totalCalls, km.totalCalls, km.totalCalls, km.totalCalls, km.totalCalls, km.totalCalls, km.totalCalls],
      };
    });
  }, []);

  // Filter and sort TL data
  const filteredAndSortedTLs = mockTLData
    .filter((tl) => {
      if (region !== 'All' && tl.region !== region) return false;
      if (searchTerm && !tl.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'stockins':
          return b.stockinsAchievement - a.stockinsAchievement;
        case 'inputScore':
          return b.avgInputScore - a.avgInputScore;
        case 'i2si':
          return b.i2si - a.i2si;
        case 'visits':
          return b.productiveVisitsPercent - a.productiveVisitsPercent;
        case 'calls':
          return b.productiveCallsPercent - a.productiveCallsPercent;
        default:
          return 0;
      }
    });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl text-gray-900 mb-4">TL Leaderboard</h1>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <button
              onClick={() => setShowTimeFilter(!showTimeFilter)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between"
            >
              <span>{timePeriod}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showTimeFilter && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {['Today', 'D-1', 'L7D', 'MTD', 'Last 30', 'Last Month'].map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setTimePeriod(period);
                      setShowTimeFilter(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                  >
                    {period}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1">
            <button
              onClick={() => setShowRegionFilter(!showRegionFilter)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between"
            >
              <span>{region}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showRegionFilter && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {['All', 'NCR', 'North', 'West', 'South', 'East'].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRegion(r);
                      setShowRegionFilter(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search TL by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Sorting chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-gray-600 whitespace-nowrap">Sort by:</span>
          {[
            { id: 'stockins' as const, label: 'Stock-ins' },
            { id: 'inputScore' as const, label: 'Input Score' },
            { id: 'i2si' as const, label: 'I2SI' },
            { id: 'visits' as const, label: 'Productive Visits' },
            { id: 'calls' as const, label: 'Productive Calls' },
          ].map((sort) => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1 ${sortBy === sort.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {sort.label}
              <ArrowUpDown className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="p-4 space-y-2">
        {filteredAndSortedTLs.map((tl, index) => (
          <div key={tl.id} className="relative">
            {/* Rank badge */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm z-10">
              {index + 1}
            </div>
            <div className="ml-4">
              <TLLeaderboardRow
                tl={tl}
                onViewDetail={onViewTLDetail || (() => { })}
                compact={true}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Results count */}
      <div className="p-4 text-center text-sm text-gray-600">
        Showing {filteredAndSortedTLs.length} of {mockTLData.length} Team Leads
      </div>
    </div>
  );
}
