/**
 * PHASE 6 — CANONICAL FILTERBAR COMPONENT
 *
 * Replaces all inline filter UI across the app.
 * Reads/writes to FilterContext via useFilterScope().
 *
 * Supports three layout modes:
 *   - "chips"    — segmented pill row (KAM/TL pages)
 *   - "dropdown" — button + popover (Admin scope bar)
 *   - "mixed"    — dropdown for time + chips for secondary
 *
 * Props:
 *   scope       — which FilterScope this bar manages
 *   config      — which filters to show and their options
 *   layoutMode  — visual layout
 *
 * Non-negotiable: chips stay chips, dropdowns stay dropdowns.
 * This component preserves existing visual patterns.
 */

import { useState, useMemo } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { useFilterScope, type FilterScope, type FilterState } from '../../contexts/FilterContext';
import { TimePeriod } from '../../lib/domain/constants';
import { TIME_PERIOD_LABELS } from '../../lib/time/resolveTimePeriod';
import type { Region } from '../../data/adminOrgData';

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface FilterConfig {
  /** Time period options to show */
  timeOptions?: TimePeriod[];
  /** Time display mode */
  timeMode?: 'chips' | 'dropdown';
  /** Chip style variant */
  chipStyle?: 'segmented' | 'pill';
  /** Region picker (admin) */
  showRegionPicker?: boolean;
  availableRegions?: string[];
  /** TL picker (admin) */
  showTLPicker?: boolean;
  availableTLs?: { tlId: string; tlName: string; region: string }[];
  /** Channel filter */
  showChannelFilter?: boolean;
  channelOptions?: { key: string; label: string }[];
  /** Status/category filters */
  showStatusFilter?: boolean;
  statusOptions?: { key: string; label: string }[];
  showCategoryFilter?: boolean;
  categoryOptions?: { key: string; label: string }[];
  /** Lead type filter */
  showLeadTypeFilter?: boolean;
  leadTypeOptions?: { key: string; label: string }[];
  /** Search input */
  showSearch?: boolean;
  searchPlaceholder?: string;
  /** Label overrides for time periods */
  labelOverrides?: Partial<Record<TimePeriod, string>>;
}

export interface FilterBarProps {
  scope: FilterScope;
  config: FilterConfig;
  layoutMode?: 'chips' | 'dropdown' | 'mixed';
  className?: string;
}

// ============================================================================
// PRESETS
// ============================================================================

export const ADMIN_FILTER_CONFIG: FilterConfig = {
  timeOptions: [TimePeriod.D_MINUS_1, TimePeriod.MTD, TimePeriod.LMTD, TimePeriod.LAST_MONTH],
  timeMode: 'dropdown',
  showRegionPicker: true,
  availableRegions: ['NCR', 'West', 'South', 'East'],
};

export const ADMIN_WITH_TL_CONFIG: FilterConfig = {
  ...ADMIN_FILTER_CONFIG,
  showTLPicker: true,
};

export const LEADS_FILTER_CONFIG: FilterConfig = {
  timeOptions: [TimePeriod.MTD, TimePeriod.TODAY, TimePeriod.D_MINUS_1, TimePeriod.LAST_7D, TimePeriod.LAST_30D],
  timeMode: 'chips',
  chipStyle: 'pill',
};

export const VISITS_FILTER_CONFIG: FilterConfig = {
  timeOptions: [TimePeriod.TODAY, TimePeriod.LAST_7D, TimePeriod.LAST_30D],
  timeMode: 'chips',
  chipStyle: 'segmented',
};

export const ACTIVITY_FILTER_CONFIG: FilterConfig = {
  timeOptions: [TimePeriod.TODAY, TimePeriod.LAST_7D, TimePeriod.MTD],
  timeMode: 'chips',
  chipStyle: 'segmented',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function FilterBar({ scope, config, layoutMode = 'chips', className = '' }: FilterBarProps) {
  const { state, setFilter, resetFilters, activeFilterCount } = useFilterScope(scope);

  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTLPicker, setShowTLPicker] = useState(false);

  const getTimeLabel = (p: TimePeriod): string => {
    if (config.labelOverrides?.[p]) return config.labelOverrides[p]!;
    return TIME_PERIOD_LABELS[p] ?? String(p);
  };

  const timeOptions = config.timeOptions ?? Object.values(TimePeriod).filter(t => t !== TimePeriod.CUSTOM);
  const currentTime = state.time ?? TimePeriod.MTD;
  const timeMode = config.timeMode ?? (layoutMode === 'dropdown' ? 'dropdown' : 'chips');

  // Region helpers
  const selectedRegions = (state.region ?? []) as string[];
  const allRegions = config.availableRegions ?? [];

  const toggleRegion = (region: string) => {
    const current = selectedRegions;
    if (current.includes(region)) {
      setFilter({ region: current.filter(r => r !== region) });
    } else {
      setFilter({ region: [...current, region] });
    }
  };

  const getRegionLabel = () => {
    if (selectedRegions.length === 0) return 'All Regions';
    if (selectedRegions.length === 1) return selectedRegions[0];
    return `${selectedRegions.length} Regions`;
  };

  // TL helpers
  const selectedTL = state.tl?.[0] ?? '';
  const availableTLs = useMemo(() => {
    if (!config.availableTLs) return [];
    if (selectedRegions.length === 0) return config.availableTLs;
    return config.availableTLs.filter(t => selectedRegions.includes(t.region));
  }, [config.availableTLs, selectedRegions]);

  const getTLLabel = () => {
    if (!selectedTL) return 'All TLs';
    const tl = availableTLs.find(t => t.tlId === selectedTL);
    return tl?.tlName || 'All TLs';
  };

  // ── Time Chips ──
  const renderTimeChips = () => {
    if (config.chipStyle === 'pill') {
      return (
        <div className="flex flex-wrap gap-2">
          {timeOptions.map(period => (
            <button
              key={period}
              onClick={() => setFilter({ time: period })}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium
                transition-all duration-150 min-h-[36px] whitespace-nowrap
                ${currentTime === period
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              {getTimeLabel(period)}
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
        {timeOptions.map(period => (
          <button
            key={period}
            onClick={() => setFilter({ time: period })}
            className={`flex-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 min-h-[36px]
              ${currentTime === period
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }
            `}
          >
            {getTimeLabel(period)}
          </button>
        ))}
      </div>
    );
  };

  // ── Time Dropdown ──
  const renderTimeDropdown = () => (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setShowTimePicker(!showTimePicker)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
      >
        <span>{getTimeLabel(currentTime)}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {showTimePicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTimePicker(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
            {timeOptions.map(period => (
              <button
                key={period}
                onClick={() => {
                  setFilter({ time: period });
                  setShowTimePicker(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  currentTime === period ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                {getTimeLabel(period)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ── Region Picker ──
  const renderRegionPicker = () => {
    if (!config.showRegionPicker) return null;
    return (
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowRegionPicker(!showRegionPicker)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-300"
        >
          <span>{getRegionLabel()}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showRegionPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowRegionPicker(false)} />
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[180px]">
              <div className="px-3 py-1 flex items-center justify-between border-b border-gray-200 pb-2 mb-1">
                <span className="text-xs font-medium text-gray-500">SELECT REGIONS</span>
                <button
                  onClick={() => setFilter({ region: [...allRegions] })}
                  className="text-xs text-blue-600 font-medium"
                >
                  Select All
                </button>
              </div>
              {allRegions.map(region => (
                <button
                  key={region}
                  onClick={() => toggleRegion(region)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-700">{region}</span>
                  {selectedRegions.includes(region) && (
                    <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
              <div className="border-t border-gray-200 mt-1 pt-2 px-3">
                <button
                  onClick={() => setFilter({ region: [] })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── TL Picker ──
  const renderTLPicker = () => {
    if (!config.showTLPicker) return null;
    return (
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
                  setFilter({ tl: [] });
                  setShowTLPicker(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  !selectedTL ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                All TLs
              </button>
              {availableTLs.map(tl => (
                <button
                  key={tl.tlId}
                  onClick={() => {
                    setFilter({ tl: [tl.tlId] });
                    setShowTLPicker(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    selectedTL === tl.tlId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div>{tl.tlName}</div>
                  <div className="text-xs text-gray-500">{tl.region}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Search Input ──
  const renderSearch = () => {
    if (!config.showSearch) return null;
    return (
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={state.search ?? ''}
          onChange={e => setFilter({ search: e.target.value || undefined })}
          placeholder={config.searchPlaceholder ?? 'Search...'}
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {state.search && (
          <button
            onClick={() => setFilter({ search: undefined })}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    );
  };

  // ── Selected Region Chips ──
  const renderSelectedRegionChips = () => {
    if (!config.showRegionPicker) return null;
    if (selectedRegions.length === 0 || selectedRegions.length >= 4) return null;

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Selected:</span>
        {selectedRegions.map(region => (
          <div
            key={region}
            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
          >
            <span>{region}</span>
            <button
              onClick={() => toggleRegion(region)}
              className="hover:bg-blue-100 rounded p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // ── Clear All + Active Count ──
  const renderClearAll = () => {
    if (activeFilterCount <= 0) return null;
    return (
      <button
        onClick={resetFilters}
        className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
        <span>Reset</span>
        {activeFilterCount > 1 && (
          <span className="ml-1 bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
      </button>
    );
  };

  // ============================================================================
  // RENDER — ADMIN / DROPDOWN LAYOUT
  // ============================================================================

  if (layoutMode === 'dropdown' || layoutMode === 'mixed') {
    return (
      <div className={`bg-white border-b border-gray-200 px-4 py-3 space-y-2 ${className}`}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {renderTimeDropdown()}
          {renderRegionPicker()}
          {renderTLPicker()}
          {renderSearch()}
          {renderClearAll()}
        </div>
        {renderSelectedRegionChips()}
      </div>
    );
  }

  // ============================================================================
  // RENDER — CHIPS LAYOUT
  // ============================================================================

  return (
    <div className={className}>
      {renderTimeChips()}
    </div>
  );
}