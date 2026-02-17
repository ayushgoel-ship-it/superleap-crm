import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

interface ChannelMetric {
  channel: string;
  percentage: number;
  numerator: number;
  denominator: number;
  expectation: number;
}

interface ConversionMetricCardProps {
  title: string;
  subtitle: string;
  percentage: number;
  channelBreakdown: ChannelMetric[];
  helperText?: string;
  onDrillDown?: (channel: string) => void;
  viewMode?: 'desktop' | 'mobile';
}

export function ConversionMetricCard({
  title,
  subtitle,
  percentage,
  channelBreakdown,
  helperText,
  onDrillDown,
  viewMode = 'desktop',
}: ConversionMetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getBandColor = (actual: number, expectation: number) => {
    const diff = actual - expectation;
    if (diff >= 0) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', status: 'Meets Target' };
    if (diff >= -10) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', status: 'At Risk' };
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', status: 'Below Target' };
  };

  if (viewMode === 'mobile') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex-1 text-left">
            <div className="text-xs uppercase tracking-wide text-gray-600 mb-1">{title}</div>
            <div className="text-2xl text-gray-900 mb-1">{percentage}%</div>
            <div className="text-xs text-gray-600">{subtitle}</div>
            {helperText && <div className="text-xs text-gray-500 mt-1">{helperText}</div>}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="text-xs text-gray-600 mb-3">Breakdown by Channel</div>
            <div className="space-y-2">
              {channelBreakdown.map((metric) => {
                const band = getBandColor(metric.percentage, metric.expectation);
                return (
                  <button
                    key={metric.channel}
                    onClick={() => onDrillDown?.(metric.channel)}
                    className={`w-full p-3 rounded-lg border ${band.border} ${band.bg} ${band.text} text-left transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{metric.channel}</span>
                      <span className="text-lg">{metric.percentage}%</span>
                    </div>
                    <div className="text-xs opacity-75 mb-1">
                      {metric.numerator} / {metric.denominator} • Target: {metric.expectation}%
                    </div>
                    <div className="text-xs opacity-75">{band.status}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="text-xs uppercase tracking-wide text-gray-600 mb-1">{title}</div>
          <div className="text-3xl text-gray-900 mb-1">{percentage}%</div>
          <div className="text-sm text-gray-600">{subtitle}</div>
          {helperText && (
            <div className="text-xs text-gray-500 mt-2">{helperText}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="text-sm text-gray-900 mb-3">Breakdown by Channel</div>
          <div className="space-y-2">
            {channelBreakdown.map((metric) => {
              const band = getBandColor(metric.percentage, metric.expectation);
              return (
                <button
                  key={metric.channel}
                  onClick={() => onDrillDown?.(metric.channel)}
                  className={`w-full p-4 rounded-lg border ${band.border} ${band.bg} ${band.text} flex items-center justify-between transition-all hover:shadow-md`}
                >
                  <div>
                    <div className="text-sm mb-1">{metric.channel}</div>
                    <div className="text-xs opacity-75">
                      {metric.numerator} converted / {metric.denominator} total
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      Target: {metric.expectation}% • {band.status}
                    </div>
                  </div>
                  <div className="text-2xl">{metric.percentage}%</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
