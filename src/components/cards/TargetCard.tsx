interface TargetCardProps {
  title: string;
  target: number;
  achieved: number;
  unit: string;
  subtitle?: string;
  inverse?: boolean;
}

export function TargetCard({ title, target, achieved, unit, subtitle, inverse }: TargetCardProps) {
  const percentage = (achieved / target) * 100;
  const isOnTrack = inverse ? achieved >= target : percentage >= 80;

  return (
    <div className="card-premium p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[13px] font-medium text-slate-500">{title}</h4>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full
          ${isOnTrack ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}
        `}>
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{achieved}</span>
        <span className="text-sm text-slate-400 font-medium">/ {target} {unit}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out
            ${isOnTrack
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              : 'bg-gradient-to-r from-amber-500 to-amber-400'
            }
          `}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {subtitle && (
        <div className="text-[11px] text-slate-400 mt-2">{subtitle}</div>
      )}
    </div>
  );
}
