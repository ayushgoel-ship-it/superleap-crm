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
 * Time Options:
 *   Primary chips: MTD, D-1, LMTD
 *   More dropdown: Last 30D, Last 3M, Last 6M, Custom
 */

import { useState, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useFilterScope, type FilterScope } from '../../contexts/FilterContext';
import { TimePeriod } from '../../lib/domain/constants';
import { getTLsByRegions, type Region } from '../../data/adminOrgData';
import { getRuntimeDBSync } from '../../data/runtimeDB';

interface AdminCommonFiltersProps {
  scope: FilterScope;
}

import { CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';

// Primary time chips shown directly
const PRIMARY_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.MTD,
  TimePeriod.D_MINUS_1,
  TimePeriod.LMTD,
];

// Secondary options inside "More" dropdown
const SECONDARY_TIME_OPTIONS: TimePeriod[] = [
  TimePeriod.LAST_30D,
  TimePeriod.LAST_3M,
  TimePeriod.LAST_6M,
  TimePeriod.CUSTOM,
];

// Labels
const TIME_LABELS = CANONICAL_TIME_LABELS;

export function AdminCommonFilters({ scope }: AdminCommonFiltersProps) {
  const { state, setFilter, resetFilters } = useFilterScope(scope);

  const [showMoreTimePicker, setShowMoreTimePicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showTLPicker, setShowTLPicker] = useState(false);

  // Current selections
  const currentTime = state.time_period ?? TimePeriod.MTD;
  const currentRegion = state.region_id ?? null;
  const currentTL = state.tl_id ?? null;

  // Available regions
  const regions: Region[] = ['NCR', 'West', 'South', 'East'];

  // Available TLs — from org hierarchy via getRuntimeDBSync
  const availableTLs = useMemo(() => {
    const db = getRuntimeDBSync();
    if (!db?.org?.tls) return [];
    let tls = db.org.tls.map(tl => ({
      tlId: tl.id,
      tlName: tl.name || 'TL',
      region: tl.region || 'NCR',
    }));
    // Filter by selected region if one is selected
    if (currentRegion) {
      tls = tls.filter(tl => tl.region === currentRegion);
    }
    return tls;
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
    <div className="bg-white border-b border-gray-200 px-4 py-2.5 space-y-2">
      {/* Row 1: Time filters */}
      <div className="flex items-center gap-2">
        {PRIMARY_TIME_OPTIONS.map(period => {
          const isActive = currentTime === period;
          return (
            <button
              key={period}
              onClick={() => setFilter({ time_period: period })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {TIME_LABELS[period]}
            </button>
          );
        })}

        {/* More Time Options Dropdown */}
        <div className="relative">
          {(() => {
            const isSecondaryActive = SECONDARY_TIME_OPTIONS.includes(currentTime);
            const moreLabel = isSecondaryActive ? (TIME_LABELS[currentTime] ?? String(currentTime)) : 'More';
            return (
              <button
                onClick={() => setShowMoreTimePicker(!showMoreTimePicker)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${
                  isSecondaryActive
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{moreLabel}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            );
          })()}

          {showMoreTimePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoreTimePicker(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
                {SECONDARY_TIME_OPTIONS.map(period => (
                  <button
                    key={period}
                    onClick={() => {
                      setFilter({ time_period: period });
                      setShowMoreTimePicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 whitespace-nowrap ${
                      currentTime === period ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {TIME_LABELS[period]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Region + TL + Clear */}
      <div className="flex items-center gap-2">
        {/* Region Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRegionPicker(!showRegionPicker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${
              currentRegion
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span>Region: {currentRegion || 'All'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showRegionPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRegionPicker(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
                <button
                  onClick={() => { setFilter({ region_id: null, tl_id: null }); setShowRegionPicker(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!currentRegion ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                >
                  All Regions
                </button>
                {regions.map(region => (
                  <button
                    key={region}
                    onClick={() => { setFilter({ region_id: region, tl_id: null }); setShowRegionPicker(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentRegion === region ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* TL Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTLPicker(!showTLPicker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors max-w-[180px] ${
              currentTL
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span className="truncate">{getTLLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
          </button>

          {showTLPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTLPicker(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                <button
                  onClick={() => { setFilter({ tl_id: null }); setShowTLPicker(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!currentTL ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                >
                  All TLs
                </button>
                {availableTLs.length === 0 && (
                  <div className="px-4 py-2 text-xs text-gray-400">No TLs available</div>
                )}
                {availableTLs.map(tl => (
                  <button
                    key={tl.tlId}
                    onClick={() => { setFilter({ tl_id: tl.tlId }); setShowTLPicker(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentTL === tl.tlId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    <div className="truncate">{tl.tlName}</div>
                    <div className="text-xs text-gray-400">{tl.region}</div>
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
            className="flex items-center gap-1 px-2.5 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
}