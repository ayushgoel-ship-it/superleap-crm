import { useState, useMemo } from 'react';
import { ArrowUpDown, Search, ChevronDown } from 'lucide-react';
import { TLLeaderboardRow, TLData } from '../admin/TLLeaderboardRow';
import { getFilteredLeads, getFilteredDCFLeads, getFilteredCalls, getFilteredVisits, isStockIn, isInspection } from '../../data/canonicalMetrics';
import { getAllTLs } from '../../data/selectors';
import { TimePeriod } from '../../lib/domain/constants';
import { getSITarget, getDCFTargets } from '../../lib/metricsEngine';
import { computeKAMMetrics } from '../../lib/metrics/metricsFromDB';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';

interface TLLeaderboardPageProps {
  onViewTLDetail?: (tlId: string) => void;
  onBack?: () => void;
}

export function TLLeaderboardPage({ onViewTLDetail, onBack }: TLLeaderboardPageProps) {
  const [sortBy, setSortBy] = useState<'stockins' | 'inputScore' | 'i2si' | 'visits' | 'calls'>('stockins');
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [region, setRegion] = useState('All');
  const [showRegionFilter, setShowRegionFilter] = useState(false);

  // Build TL data from canonical metrics
  const tlData: TLData[] = useMemo(() => {
    const filters = { period, customFrom, customTo };
    const leads = getFilteredLeads(filters);
    const dcfLeads = getFilteredDCFLeads(filters);
    const calls = getFilteredCalls(filters);
    const visits = getFilteredVisits(filters);

    // Real per-KAM metrics (includes inputScore computed from actual activity)
    const kamMetricsList = computeKAMMetrics(period as TimePeriod);
    const kamMetricsById = new Map(kamMetricsList.map(k => [k.kamId, k]));

    // Per-KAM SI and DCF targets from config
    const siPerKAM = getSITarget('KAM');
    const dcfTargets = getDCFTargets('KAM');

    return getAllTLs().map(tl => {
      const tlLeads = leads.filter(l => l.tlId === tl.id);
      const tlDCF = dcfLeads.filter(l => l.tlId === tl.id);
      const tlCalls = calls.filter(c => c.tlId === tl.id);
      const tlVisits = visits.filter(v => v.tlId === tl.id);

      const si = tlLeads.filter(l => isStockIn(l.stage)).length;
      const insp = tlLeads.filter(l => isInspection(l.stage) || isStockIn(l.stage)).length;
      const i2si = insp > 0 ? Math.round((si / insp) * 100) : 0;
      const kamCount = tl.kams.length;
      const siTarget = kamCount * siPerKAM;
      const dcfDisb = tlDCF.filter(d => (d.overallStatus || '').toLowerCase() === 'disbursed').length;
      const dcfValue = tlDCF.filter(d => (d.overallStatus || '').toLowerCase() === 'disbursed').reduce((s, d) => s + (d.loanAmount || 0), 0);
      const productiveVisits = tlVisits.filter(v => v.isProductive).length;
      const productiveCalls = tlCalls.filter(c => c.isProductive).length;

      // Real avg input score: average of real inputScores for this TL's KAMs
      const tlKamMetrics = tl.kams.map(k => kamMetricsById.get(k.id)).filter(Boolean);
      const avgInputScore = tlKamMetrics.length > 0
        ? Math.round(tlKamMetrics.reduce((sum, k) => sum + k!.inputScore, 0) / tlKamMetrics.length)
        : 0;

      // Deterministic trends: proportional distribution across 7 buckets (no Math.random)
      const siPerBucket = si > 0 ? Math.floor(si / 7) : 0;
      const dcfPerBucket = dcfDisb > 0 ? Math.floor(dcfDisb / 7) : 0;
      const callsPerBucket = tlCalls.length > 0 ? Math.floor(tlCalls.length / 7) : 0;

      return {
        id: tl.id,
        name: tl.name,
        region: tl.region,
        kamCount,
        stockinsActual: si,
        stockinsTarget: siTarget,
        stockinsAchievement: siTarget > 0 ? Math.round((si / siTarget) * 100) : 0,
        dcfCount: tlDCF.length,
        dcfTarget: kamCount * dcfTargets.onboarding,
        dcfValue,
        dcfValueTarget: kamCount * dcfTargets.gmv,
        avgInputScore,
        i2si,
        productiveVisitsPercent: tlVisits.length > 0 ? Math.round((productiveVisits / tlVisits.length) * 100) : 0,
        productiveCallsPercent: tlCalls.length > 0 ? Math.round((productiveCalls / tlCalls.length) * 100) : 0,
        stockinsTrend: Array.from({ length: 7 }, () => siPerBucket),
        dcfTrend: Array.from({ length: 7 }, () => dcfPerBucket),
        callsTrend: Array.from({ length: 7 }, () => callsPerBucket),
      };
    });
  }, [period, customFrom, customTo]);

  // Filter and sort TL data
  const filteredAndSortedTLs = tlData
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

        {/* Time Filter */}
        <div className="mb-4">
          <TimeFilterControl
            mode="chips"
            chipStyle="pill"
            value={period}
            onChange={setPeriod}
            options={CANONICAL_TIME_OPTIONS}
            labelOverrides={CANONICAL_TIME_LABELS}
            allowCustom
            customFrom={customFrom}
            customTo={customTo}
            onCustomRangeChange={({ fromISO, toISO }) => { setCustomFrom(fromISO); setCustomTo(toISO); }}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
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
        Showing {filteredAndSortedTLs.length} of {tlData.length} Team Leads
      </div>
    </div>
  );
}
