import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { Region, getAllRegions, getTLsByRegions, TLData } from '../../data/adminOrgData';
import { TimePeriod } from '../../lib/domain/constants';
import { ADMIN_TIME_OPTIONS } from '../filters/TimeFilterControl';

// Re-export canonical TimePeriod for backward-compatible imports
export { TimePeriod };

interface AdminScopeBarProps {
  selectedRegions: Region[];
  onRegionsChange: (regions: Region[]) => void;
  selectedTime: TimePeriod;
  onTimeChange: (time: TimePeriod) => void;
  selectedTL?: string;
  onTLChange?: (tlId: string) => void;
  showTLFilter?: boolean;
  onReset: () => void;
}

export function AdminScopeBar({
  selectedRegions,
  onRegionsChange,
  selectedTime,
  onTimeChange,
  selectedTL,
  onTLChange,
  showTLFilter = false,
  onReset,
}: AdminScopeBarProps) {
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTLPicker, setShowTLPicker] = useState(false);

  const allRegions = getAllRegions();
  const availableTLs = getTLsByRegions(selectedRegions);

  const toggleRegion = (region: Region) => {
    if (selectedRegions.includes(region)) {
      onRegionsChange(selectedRegions.filter(r => r !== region));
    } else {
      onRegionsChange([...selectedRegions, region]);
    }
  };

  const selectAllRegions = () => {
    onRegionsChange(allRegions);
  };

  const clearRegions = () => {
    onRegionsChange([]);
  };

  const getRegionLabel = () => {
    if (selectedRegions.length === 0) return 'All Regions';
    if (selectedRegions.length === 1) return selectedRegions[0];
    return `${selectedRegions.length} Regions`;
  };

  const getTLLabel = () => {
    if (!selectedTL) return 'All TLs';
    const tl = availableTLs.find(t => t.tlId === selectedTL);
    return tl?.tlName || 'All TLs';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-2">
      {/* Filter row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {/* Time Period */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
          >
            <span>{selectedTime}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showTimePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTimePicker(false)}></div>
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
                {ADMIN_TIME_OPTIONS.map((time) => (
                  <button
                    key={time}
                    onClick={() => {
                      onTimeChange(time);
                      setShowTimePicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      selectedTime === time ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Region Multi-Select */}
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
              <div className="fixed inset-0 z-40" onClick={() => setShowRegionPicker(false)}></div>
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[180px]">
                <div className="px-3 py-1 flex items-center justify-between border-b border-gray-200 pb-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">SELECT REGIONS</span>
                  <button
                    onClick={selectAllRegions}
                    className="text-xs text-blue-600 font-medium"
                  >
                    Select All
                  </button>
                </div>
                {allRegions.map((region) => (
                  <button
                    key={region}
                    onClick={() => toggleRegion(region)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span className="text-gray-700">{region}</span>
                    {selectedRegions.includes(region) && (
                      <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-200 mt-1 pt-2 px-3">
                  <button
                    onClick={clearRegions}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* TL Filter (optional) */}
        {showTLFilter && onTLChange && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowTLPicker(!showTLPicker)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-300"
            >
              <span>{getTLLabel()}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showTLPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTLPicker(false)}></div>
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => {
                      onTLChange('');
                      setShowTLPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      !selectedTL ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    All TLs
                  </button>
                  {availableTLs.map((tl) => (
                    <button
                      key={tl.tlId}
                      onClick={() => {
                        onTLChange(tl.tlId);
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
        )}

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Selected Region Chips */}
      {selectedRegions.length > 0 && selectedRegions.length < 4 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Selected:</span>
          {selectedRegions.map((region) => (
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
      )}
    </div>
  );
}