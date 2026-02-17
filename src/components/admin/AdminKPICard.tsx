import { TrendingUp, TrendingDown, Lock, Unlock } from 'lucide-react';

interface AdminKPICardProps {
  title: string;
  actual: string | number;
  target?: string | number;
  percentage?: number;
  trend?: number[];
  status?: 'green' | 'amber' | 'red' | 'neutral';
  suffix?: string;
  gate?: boolean;
  gateValue?: number;
  size?: 'large' | 'medium';
}

export function AdminKPICard({
  title,
  actual,
  target,
  percentage,
  trend,
  status = 'neutral',
  suffix = '',
  gate,
  gateValue = 75,
  size = 'large',
}: AdminKPICardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'green':
        return 'border-green-500 bg-green-50';
      case 'amber':
        return 'border-amber-500 bg-amber-50';
      case 'red':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'green':
        return 'text-green-700';
      case 'amber':
        return 'text-amber-700';
      case 'red':
        return 'text-red-700';
      default:
        return 'text-gray-900';
    }
  };

  const isPassing = typeof actual === 'number' && actual >= gateValue;

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor()} ${size === 'large' ? 'min-h-[140px]' : 'min-h-[100px]'}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-gray-600 text-sm">{title}</span>
        {gate && (
          <div className="flex items-center gap-1">
            {isPassing ? (
              <Unlock className="w-4 h-4 text-green-600" />
            ) : (
              <Lock className="w-4 h-4 text-red-600" />
            )}
          </div>
        )}
      </div>

      <div className={`mb-2 ${getTextColor()}`}>
        {target ? (
          <div>
            <span className="text-2xl font-semibold">{actual}</span>
            <span className="text-gray-500 mx-1">/</span>
            <span className="text-xl text-gray-600">{target}</span>
            {suffix && <span className="text-sm ml-1">{suffix}</span>}
          </div>
        ) : (
          <div className="text-2xl font-semibold">
            {actual}
            {suffix && <span className="text-sm ml-1">{suffix}</span>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {percentage !== undefined && (
          <div className="flex items-center gap-1">
            {percentage >= 0 ? (
              <TrendingUp className={`w-4 h-4 ${percentage >= 100 ? 'text-green-600' : 'text-amber-600'}`} />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm ${percentage >= 100 ? 'text-green-600' : percentage >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
        )}

        {trend && trend.length > 0 && (
          <div className="flex items-end gap-0.5 h-8">
            {trend.map((value, index) => {
              const maxValue = Math.max(...trend);
              const height = (value / maxValue) * 100;
              return (
                <div
                  key={index}
                  className="w-1 bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
