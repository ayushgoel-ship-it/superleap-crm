/**
 * ADMIN COMMON FILTERS
 * 
 * Unified filter bar for ALL Admin tabs
 * Single-select for Region and TL (leader view)
 * 
 * Filter State Contract:
 * - time_period: TimePeriod enum
 * - region_id: string | null
 * - tl_id: string | null
 * 
 * Time Options: MTD, LMTD, LM, L7D, L30D, D-1
 */

import { useState, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useFilterScope, type FilterScope } from '../../contexts/FilterContext';
import { TimePeriod } from '../../lib/domain/constants';
import { getTLsByRegions, type Region } from '../../data/adminOrgMock';
import { getRuntimeDBSync } from '../../data/runtimeDB';

interface AdminCommonFiltersProps {
  scope: FilterScope;
}

// Time options for Admin (leader view)
const ADMIN_TIME_OPTIONS = [
  TimePeriod.MTD,
  TimePeriod.LMTD,
  TimePeriod.LAST_MONTH,
  TimePeriod.LAST_7D,
  TimePeriod.LAST_30D,
  TimePeriod.D_MINUS_1,
] as const;

// Short labels for time periods
const TIME_LABELS: Record<string, string> = {
  [TimePeriod.MTD]: 'MTD',
  [TimePeriod.LMTD]: 'LMTD',
  [TimePeriod.LAST_MONTH]: 'LM',
  [TimePeriod.LAST_7D]: 'L7D',
  [TimePeriod.LAST_30D]: 'L30D',
  [TimePeriod.D_MINUS_1]: 'D-1',
};

export function AdminCommonFilters({ scope }: AdminCommonFiltersProps) {
  const { state, setFilter, resetFilters } = useFilterScope(scope);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showTLPicker, setShowTLPicker] = useState(false);

  // Current selections
  const currentTime = state.time_period ?? TimePeriod.MTD;
  const currentRegion = state.region_id ?? null;
  const currentTL = state.tl_id ?? null;

  // Available regions
  const regions: Region[] = ['NCR', 'West', 'South', 'East'];

  // Available TLs — from real Supabase data via getRuntimeDBSync
  const availableTLs = useMemo(() => {
    const db = getRuntimeDBSync();
    // Get unique KAMs from dealers (these are the people who appear in dashboards)
    const kamMap = new Map<string, { tlId: string; tlName: string; region: string }>();
    db.dealers.forEach(d => {
      if (d.kamId && d.kamId !== 'unassigned' && !kamMap.has(d.kamId)) {
        kamMap.set(d.kamId, { tlId: d.kamId, tlName: d.kamName || 'KAM', region: d.region || 'NCR' });
      }
    });
    return Array.from(kamMap.values());
  }, [currentRegion]);

  // Labels
  const getTimeLabel = () => TIME_LABELS[currentTime] || String(currentTime);
  const getRegionLabel = () => currentRegion || 'All';
  const getTLLabel = () => {
    if (!currentTL) return 'TL: All';
    const tl = availableTLs.find(t => t.tlId === currentTL);
    return tl?.tlName || 'TL: All';
  };

  // Active filter count
  const activeCount = [currentRegion, currentTL].filter(Boolean).length;

  // Handle reset
  const handleReset = () => {
    resetFilters();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {/* Time Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]"
          >
            <span className="truncate">{getTimeLabel()}</span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>

          {showTimePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTimePicker(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[100px]">
                {ADMIN_TIME_OPTIONS.map(period => (
                  <button
                    key={period}
                    onClick={() => {
                      setFilter({ time_period: period });
                      setShowTimePicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 whitespace-nowrap ${currentTime === period ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                  >
                    {TIME_LABELS[period]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Region Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowRegionPicker(!showRegionPicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]"
          >
            <span className="truncate">{getRegionLabel()}</span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>

          {showRegionPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRegionPicker(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
                <button
                  onClick={() => {
                    setFilter({ region_id: null });
                    setShowRegionPicker(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 whitespace-nowrap ${!currentRegion ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                >
                  All
                </button>
                {regions.map(region => (
                  <button
                    key={region}
                    onClick={() => {
                      setFilter({ region_id: region, tl_id: null }); // Reset TL when region changes
                      setShowRegionPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 whitespace-nowrap ${currentRegion === region ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* TL Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowTLPicker(!showTLPicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]"
          >
            <span className="truncate">{getTLLabel()}</span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>

          {showTLPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTLPicker(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                <button
                  onClick={() => {
                    setFilter({ tl_id: null });
                    setShowTLPicker(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 whitespace-nowrap ${!currentTL ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                >
                  TL: All
                </button>
                {availableTLs.map(tl => (
                  <button
                    key={tl.tlId}
                    onClick={() => {
                      setFilter({ tl_id: tl.tlId });
                      setShowTLPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentTL === tl.tlId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                  >
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">{tl.tlName}</div>
                    <div className="text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">{tl.region}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Clear Button */}
        {activeCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
            {activeCount > 1 && (
              <span className="ml-1 bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {activeCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}