import { useState } from 'react';
import { Info, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

interface DealerStateMetricsProps {
  leadGivingCount: number;
  inspectingCount: number;
  transactingCount: number;
  i2tPercent: number;
  totalDealers: number;
  deltas?: {
    leadGiving: number;
    inspecting: number;
    transacting: number;
  };
  onFilterByState?: (state: 'lead-giving' | 'inspecting' | 'transacting') => void;
  onViewI2TDetail?: () => void;
  tlName?: string;
  viewMode?: 'desktop' | 'mobile';
}

export function DealerStateMetrics({
  leadGivingCount,
  inspectingCount,
  transactingCount,
  i2tPercent,
  totalDealers,
  deltas,
  onFilterByState,
  onViewI2TDetail,
  tlName,
  viewMode = 'desktop',
}: DealerStateMetricsProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const getI2TBand = () => {
    if (i2tPercent < 30) return { color: 'bg-red-100 border-red-500 text-red-700', label: 'Poor' };
    if (i2tPercent < 60) return { color: 'bg-amber-100 border-amber-500 text-amber-700', label: 'Medium' };
    return { color: 'bg-green-100 border-green-500 text-green-700', label: 'Good' };
  };

  const i2tBand = getI2TBand();

  const MetricTile = ({
    title,
    value,
    delta,
    color,
    onClick,
    isPercentage = false,
  }: {
    title: string;
    value: number | string;
    delta?: number;
    color: string;
    onClick?: () => void;
    isPercentage?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`${color} p-4 rounded-lg border-2 transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } flex flex-col items-center justify-center min-h-[100px]`}
    >
      <div className="text-xs uppercase tracking-wide mb-2 opacity-75">{title}</div>
      <div className="text-3xl mb-1">
        {value}
        {isPercentage && '%'}
      </div>
      {delta !== undefined && delta !== 0 && (
        <div className="flex items-center gap-1 text-xs">
          {delta > 0 ? (
            <>
              <TrendingUp className="w-3 h-3" />
              <span>+{delta}</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-3 h-3" />
              <span>{delta}</span>
            </>
          )}
          <span className="opacity-75">vs Last Month</span>
        </div>
      )}
      {!delta && <div className="text-xs opacity-50">of {totalDealers} dealers</div>}
    </button>
  );

  if (viewMode === 'mobile') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        {/* Header with Info */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-gray-900">Dealer States & Conversion</h3>
          <button
            onMouseEnter={() => setShowTooltip('info')}
            onMouseLeave={() => setShowTooltip(null)}
            className="p-1 hover:bg-gray-100 rounded relative"
          >
            <Info className="w-4 h-4 text-gray-500" />
            {showTooltip === 'info' && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 z-10">
                <div className="mb-2">
                  <strong>Lead-giving:</strong> Dealers with leads but no inspections
                </div>
                <div className="mb-2">
                  <strong>Inspecting:</strong> Dealers with inspections (may have leads)
                </div>
                <div className="mb-2">
                  <strong>Transacting:</strong> Dealers with stock-ins
                </div>
                <div>
                  <strong>I→T%:</strong> % of inspecting dealers who transacted
                </div>
              </div>
            )}
          </button>
        </div>

        {/* TL Badge */}
        {tlName && (
          <div className="mb-3 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
            Showing: TL — {tlName}
          </div>
        )}

        {/* Metrics Grid - 2x2 on mobile */}
        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            title="Lead-giving"
            value={leadGivingCount}
            delta={deltas?.leadGiving}
            color="bg-blue-50 border-blue-200 text-blue-700"
            onClick={() => onFilterByState?.('lead-giving')}
          />
          <MetricTile
            title="Inspecting"
            value={inspectingCount}
            delta={deltas?.inspecting}
            color="bg-green-50 border-green-200 text-green-700"
            onClick={() => onFilterByState?.('inspecting')}
          />
          <MetricTile
            title="Transacting"
            value={transactingCount}
            delta={deltas?.transacting}
            color="bg-indigo-50 border-indigo-200 text-indigo-700"
            onClick={() => onFilterByState?.('transacting')}
          />
          <div
            onClick={onViewI2TDetail}
            className={`${i2tBand.color} p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center min-h-[100px]`}
          >
            <div className="text-xs uppercase tracking-wide mb-2 opacity-75">I→T%</div>
            <div className="text-3xl mb-1">{i2tPercent}%</div>
            <div className="text-xs opacity-75">{i2tBand.label}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Tap any tile to filter dealer list</span>
            <button className="text-blue-600 flex items-center gap-1">
              View sample
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm text-gray-900">Dealer States & Conversion</h3>
          <button
            onMouseEnter={() => setShowTooltip('info')}
            onMouseLeave={() => setShowTooltip(null)}
            className="p-1 hover:bg-gray-100 rounded relative"
          >
            <Info className="w-4 h-4 text-gray-500" />
            {showTooltip === 'info' && (
              <div className="absolute left-0 top-full mt-1 w-80 bg-gray-900 text-white text-xs rounded-lg p-4 z-10">
                <div className="mb-2">
                  <strong>Lead-giving:</strong> Dealers with leads but no inspections in the period
                </div>
                <div className="mb-2">
                  <strong>Inspecting:</strong> Dealers with at least 1 inspection (may have leads)
                </div>
                <div className="mb-2">
                  <strong>Transacting:</strong> Dealers with stock-ins (highest priority)
                </div>
                <div>
                  <strong>I→T% (Inspect→Transact):</strong> Percentage of inspecting dealers who successfully transacted (stock-ins)
                </div>
              </div>
            )}
          </button>
        </div>

        {tlName && (
          <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded">
            Showing: TL — {tlName}
          </div>
        )}
      </div>

      {/* Metrics Grid - 4 tiles in a row on desktop */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <MetricTile
          title="Lead-giving"
          value={leadGivingCount}
          delta={deltas?.leadGiving}
          color="bg-blue-50 border-blue-200 text-blue-700"
          onClick={() => onFilterByState?.('lead-giving')}
        />
        <MetricTile
          title="Inspecting"
          value={inspectingCount}
          delta={deltas?.inspecting}
          color="bg-green-50 border-green-200 text-green-700"
          onClick={() => onFilterByState?.('inspecting')}
        />
        <MetricTile
          title="Transacting"
          value={transactingCount}
          delta={deltas?.transacting}
          color="bg-indigo-50 border-indigo-200 text-indigo-700"
          onClick={() => onFilterByState?.('transacting')}
        />
        <div
          onClick={onViewI2TDetail}
          className={`${i2tBand.color} p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center`}
        >
          <div className="text-xs uppercase tracking-wide mb-2 opacity-75">I→T%</div>
          <div className="text-3xl mb-1">{i2tPercent}%</div>
          <div className="text-xs opacity-75">{i2tBand.label} Conversion</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-gray-200">
        <span>Click any tile to filter dealer list below</span>
        <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View sample dealers
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
