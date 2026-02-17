import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  status?: 'good' | 'warning' | 'danger' | 'neutral';
  clickable?: boolean;
  targetConfig?: {
    target: number;
    currentValue: number;
    comparisonType?: 'greater-or-equal' | 'less-or-equal';
    targetLabel?: string;
    showStatusBadge?: boolean;
  };
  onClick?: () => void;
  expanded?: boolean;
  onExpandToggle?: () => void;
  expandedContent?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  status = 'neutral',
  clickable,
  targetConfig,
  onClick,
  expanded,
  onExpandToggle,
  expandedContent
}: MetricCardProps) {
  let computedStatus = status;
  let statusLabel = '';

  if (targetConfig) {
    const { target, currentValue, comparisonType = 'greater-or-equal' } = targetConfig;
    const meetsTarget = comparisonType === 'greater-or-equal'
      ? currentValue >= target
      : currentValue <= target;
    computedStatus = meetsTarget ? 'good' : 'danger';
    statusLabel = meetsTarget ? 'On Track' : 'Needs Focus';
  }

  const statusStyles = {
    good: 'bg-emerald-50/80 border-emerald-100',
    warning: 'bg-amber-50/80 border-amber-100',
    danger: 'bg-rose-50/80 border-rose-100',
    neutral: 'bg-white border-slate-100',
  };

  const valueColors = {
    good: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-rose-700',
    neutral: 'text-slate-900',
  };

  const badgeStyles = {
    good: 'bg-emerald-100 text-emerald-700',
    danger: 'bg-rose-100 text-rose-700',
    warning: 'bg-amber-100 text-amber-700',
    neutral: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className={`rounded-2xl border shadow-sm ${statusStyles[computedStatus]} transition-all duration-200
      ${(clickable || onClick || onExpandToggle) ? 'hover:shadow-md active:shadow-sm cursor-pointer' : ''}
    `}>
      <div
        className="p-4"
        onClick={onExpandToggle || onClick}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-medium text-slate-500">{title}</h4>
              {targetConfig?.showStatusBadge && statusLabel && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                  ${badgeStyles[computedStatus]}
                `}>
                  {computedStatus === 'good' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {statusLabel}
                </span>
              )}
            </div>
            {targetConfig?.targetLabel && (
              <div className="text-[11px] text-slate-400 mt-0.5">{targetConfig.targetLabel}</div>
            )}
          </div>
          {(clickable || onClick || onExpandToggle) && (
            expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <div className={`text-2xl font-bold tracking-tight ${valueColors[computedStatus]}`}>
            {value}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
              ${trend.direction === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}
            `}>
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {subtitle && (
          <div className="text-[11px] text-slate-500 mt-1">{subtitle}</div>
        )}
      </div>

      {expanded && expandedContent && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100/60">
          {expandedContent}
        </div>
      )}
    </div>
  );
}
