import { useState } from 'react';
import { ArrowUpDown, Search, ChevronDown } from 'lucide-react';
import { TLLeaderboardRow, TLData } from '../admin/TLLeaderboardRow';

interface TLLeaderboardPageProps {
  onViewTLDetail?: (tlId: string) => void;
  onBack?: () => void;
}

// Mock TL data (reusing from AdminDashboard)
const mockTLData: TLData[] = [
  {
    id: 'tl1',
    name: 'Nikhil Verma',
    region: 'North',
    kamCount: 8,
    stockinsActual: 420,
    stockinsTarget: 500,
    stockinsAchievement: 84,
    dcfCount: 34,
    dcfTarget: 40,
    dcfValue: 1240000,
    dcfValueTarget: 1500000,
    avgInputScore: 78,
    i2si: 21,
    productiveVisitsPercent: 68,
    productiveCallsPercent: 60,
    stockinsTrend: [12, 10, 14, 11, 13, 15, 14],
    dcfTrend: [4, 5, 6, 4, 5, 6, 4],
    callsTrend: [55, 58, 60, 62, 61, 59, 60],
  },
  {
    id: 'tl2',
    name: 'Seema Rao',
    region: 'West',
    kamCount: 6,
    stockinsActual: 280,
    stockinsTarget: 350,
    stockinsAchievement: 80,
    dcfCount: 20,
    dcfTarget: 30,
    dcfValue: 720000,
    dcfValueTarget: 1000000,
    avgInputScore: 72,
    i2si: 17,
    productiveVisitsPercent: 55,
    productiveCallsPercent: 45,
    stockinsTrend: [8, 9, 10, 11, 10, 12, 10],
    dcfTrend: [2, 3, 3, 4, 3, 3, 2],
    callsTrend: [40, 42, 45, 46, 44, 45, 45],
  },
  {
    id: 'tl3',
    name: 'Harsh Gupta',
    region: 'East',
    kamCount: 5,
    stockinsActual: 150,
    stockinsTarget: 220,
    stockinsAchievement: 68,
    dcfCount: 9,
    dcfTarget: 20,
    dcfValue: 340000,
    dcfValueTarget: 800000,
    avgInputScore: 64,
    i2si: 11,
    productiveVisitsPercent: 40,
    productiveCallsPercent: 35,
    stockinsTrend: [5, 4, 6, 5, 4, 6, 5],
    dcfTrend: [1, 2, 1, 1, 2, 1, 1],
    callsTrend: [30, 32, 35, 36, 34, 35, 35],
  },
  {
    id: 'tl4',
    name: 'Priya Sharma',
    region: 'South',
    kamCount: 7,
    stockinsActual: 540,
    stockinsTarget: 450,
    stockinsAchievement: 120,
    dcfCount: 42,
    dcfTarget: 35,
    dcfValue: 1680000,
    dcfValueTarget: 1400000,
    avgInputScore: 82,
    i2si: 24,
    productiveVisitsPercent: 78,
    productiveCallsPercent: 72,
    stockinsTrend: [15, 16, 18, 17, 19, 20, 18],
    dcfTrend: [5, 6, 7, 6, 7, 6, 5],
    callsTrend: [68, 70, 72, 73, 72, 72, 72],
  },
  {
    id: 'tl5',
    name: 'Rajesh Kumar',
    region: 'NCR',
    kamCount: 9,
    stockinsActual: 680,
    stockinsTarget: 600,
    stockinsAchievement: 113,
    dcfCount: 48,
    dcfTarget: 45,
    dcfValue: 1920000,
    dcfValueTarget: 1800000,
    avgInputScore: 80,
    i2si: 22,
    productiveVisitsPercent: 75,
    productiveCallsPercent: 68,
    stockinsTrend: [18, 20, 22, 21, 23, 24, 22],
    dcfTrend: [6, 7, 8, 7, 8, 7, 5],
    callsTrend: [65, 66, 68, 69, 68, 68, 68],
  },
  {
    id: 'tl6',
    name: 'Anjali Desai',
    region: 'West',
    kamCount: 6,
    stockinsActual: 380,
    stockinsTarget: 400,
    stockinsAchievement: 95,
    dcfCount: 28,
    dcfTarget: 32,
    dcfValue: 1120000,
    dcfValueTarget: 1280000,
    avgInputScore: 76,
    i2si: 19,
    productiveVisitsPercent: 65,
    productiveCallsPercent: 58,
    stockinsTrend: [10, 11, 13, 12, 14, 13, 12],
    dcfTrend: [3, 4, 5, 4, 5, 4, 3],
    callsTrend: [52, 54, 58, 60, 58, 58, 58],
  },
];

export function TLLeaderboardPage({ onViewTLDetail, onBack }: TLLeaderboardPageProps) {
  const [sortBy, setSortBy] = useState<'stockins' | 'inputScore' | 'i2si' | 'visits' | 'calls'>('stockins');
  const [searchTerm, setSearchTerm] = useState('');
  const [timePeriod, setTimePeriod] = useState('MTD');
  const [region, setRegion] = useState('All');
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [showRegionFilter, setShowRegionFilter] = useState(false);

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
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1 ${
                sortBy === sort.id
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
                onViewDetail={onViewTLDetail || (() => {})}
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
