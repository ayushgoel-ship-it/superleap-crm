import { ChevronRight } from 'lucide-react';

export interface TLData {
  id: string;
  name: string;
  region: string;
  kamCount: number;
  stockinsActual: number;
  stockinsTarget: number;
  stockinsAchievement: number;
  dcfCount: number;
  dcfTarget: number;
  dcfValue: number;
  dcfValueTarget: number;
  avgInputScore: number;
  i2si: number;
  productiveVisitsPercent: number;
  productiveCallsPercent: number;
  stockinsTrend: number[];
  dcfTrend: number[];
  callsTrend: number[];
}

interface TLLeaderboardRowProps {
  tl: TLData;
  onViewDetail: (tlId: string) => void;
  compact?: boolean;
}

export function TLLeaderboardRow({ tl, onViewDetail, compact = false }: TLLeaderboardRowProps) {
  // Determine row color band based on achievement and input score
  const getRowStatus = () => {
    if (tl.stockinsAchievement >= 100 && tl.avgInputScore >= 75) return 'green';
    if (tl.stockinsAchievement < 75 || tl.avgInputScore < 70) return 'red';
    return 'amber';
  };

  const status = getRowStatus();

  const getBandColor = () => {
    switch (status) {
      case 'green':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'amber':
        return 'bg-amber-50 border-l-4 border-amber-500';
      case 'red':
        return 'bg-red-50 border-l-4 border-red-500';
    }
  };

  const getValueColor = (value: number, greenThreshold: number, redThreshold: number) => {
    if (value >= greenThreshold) return 'text-green-700';
    if (value < redThreshold) return 'text-red-700';
    return 'text-amber-700';
  };

  if (compact) {
    return (
      <div
        onClick={() => onViewDetail(tl.id)}
        className={`p-4 rounded-lg ${getBandColor()} cursor-pointer hover:shadow-md transition-shadow mb-2`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-gray-900">{tl.name}</div>
            <div className="text-xs text-gray-600">{tl.region} • {tl.kamCount} KAMs</div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">Stock-ins</span>
            <span className={getValueColor(tl.stockinsAchievement, 100, 75)}>
              {tl.stockinsAchievement.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                tl.stockinsAchievement >= 100
                  ? 'bg-green-500'
                  : tl.stockinsAchievement >= 75
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(tl.stockinsAchievement, 100)}%` }}
            />
          </div>
        </div>

        {/* Inline metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-gray-600">Input Score: </span>
            <span className={getValueColor(tl.avgInputScore, 75, 70)}>{tl.avgInputScore}</span>
          </div>
          <div>
            <span className="text-gray-600">I2SI: </span>
            <span className={getValueColor(tl.i2si, 20, 15)}>{tl.i2si.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop/Wide view
  return (
    <div className={`grid grid-cols-12 gap-4 p-4 rounded-lg ${getBandColor()} mb-2 items-center`}>
      {/* TL Name & Region */}
      <div className="col-span-2">
        <div className="text-gray-900">{tl.name}</div>
        <div className="text-xs text-gray-600">{tl.region} • {tl.kamCount} KAMs</div>
      </div>

      {/* Stock-ins with progress */}
      <div className="col-span-2">
        <div className="text-sm mb-1">
          {tl.stockinsActual} / {tl.stockinsTarget}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${
              tl.stockinsAchievement >= 100
                ? 'bg-green-500'
                : tl.stockinsAchievement >= 75
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(tl.stockinsAchievement, 100)}%` }}
          />
        </div>
        <div className={`text-xs mt-0.5 ${getValueColor(tl.stockinsAchievement, 100, 75)}`}>
          {tl.stockinsAchievement.toFixed(1)}%
        </div>
      </div>

      {/* DCF Count */}
      <div className="col-span-1 text-sm">
        <div>{tl.dcfCount} / {tl.dcfTarget}</div>
        <div className="text-xs text-gray-600">
          {((tl.dcfCount / tl.dcfTarget) * 100).toFixed(0)}%
        </div>
      </div>

      {/* DCF Value */}
      <div className="col-span-1 text-sm">
        <div>₹{(tl.dcfValue / 100000).toFixed(1)}L</div>
        <div className="text-xs text-gray-600">
          / ₹{(tl.dcfValueTarget / 100000).toFixed(1)}L
        </div>
      </div>

      {/* Input Score */}
      <div className={`col-span-1 text-sm ${getValueColor(tl.avgInputScore, 75, 70)}`}>
        {tl.avgInputScore}
      </div>

      {/* I2SI */}
      <div className={`col-span-1 text-sm ${getValueColor(tl.i2si, 20, 15)}`}>
        {tl.i2si.toFixed(0)}%
      </div>

      {/* Productive Visits % */}
      <div className={`col-span-1 text-sm ${getValueColor(tl.productiveVisitsPercent, 70, 50)}`}>
        {tl.productiveVisitsPercent.toFixed(0)}%
      </div>

      {/* Productive Calls % */}
      <div className={`col-span-1 text-sm ${getValueColor(tl.productiveCallsPercent, 70, 50)}`}>
        {tl.productiveCallsPercent.toFixed(0)}%
      </div>

      {/* Mini trend sparklines */}
      <div className="col-span-1">
        <div className="flex gap-1 h-6">
          {tl.stockinsTrend.map((value, idx) => {
            const maxVal = Math.max(...tl.stockinsTrend);
            const height = (value / maxVal) * 100;
            return (
              <div
                key={idx}
                className="w-1 bg-blue-400 rounded-t"
                style={{ height: `${height}%`, alignSelf: 'flex-end' }}
              />
            );
          })}
        </div>
      </div>

      {/* Action */}
      <div className="col-span-1">
        <button
          onClick={() => onViewDetail(tl.id)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
        >
          View
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
