import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface InputScoreData {
  visits: number;
  targetVisits: number;
  connects: number;
  targetConnects: number;
  avgInspectingDealers: number;
  targetInspectingDealers: number;
  uniqueRaisePercent: number;
  targetUniqueRaise: number;
  raiseQuality: number;
  hbtpValue: number;
  targetQualityRatio: number;
  sis?: number;
  sisTarget?: number;
  dcfDisbursalsValue?: number;
  dcfDisbursalsTarget?: number;
}

interface InputScoreCardProps {
  data: InputScoreData;
  targetScore?: number;
  mode?: 'KAM' | 'TL';
}

export function InputScoreCard({ data, targetScore = 85, mode = 'KAM' }: InputScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const calculateVisitsConnectsScore = () => {
    const visitsRatio = Math.min(data.visits / data.targetVisits, 1);
    const callsRatio = Math.min(data.connects / data.targetConnects, 1);
    return Math.max(visitsRatio, callsRatio) * 25;
  };

  const calculateProductivityScore = () => {
    if (!data.sis || !data.sisTarget || !data.dcfDisbursalsValue || !data.dcfDisbursalsTarget) {
      return calculateVisitsConnectsScore();
    }
    const siThreshold = 20;
    const dcfThreshold = 15;
    const sisRatio = data.sis / siThreshold;
    const dcfRatio = data.dcfDisbursalsValue / dcfThreshold;
    if (sisRatio >= 1 && dcfRatio >= 1) return 25;
    const avgRatio = Math.min((sisRatio + dcfRatio) / 2, 1);
    return avgRatio * 25;
  };

  const calculateInspectingDealersScore = () => Math.min(data.avgInspectingDealers / data.targetInspectingDealers, 1) * 25;
  const calculateUniqueRaiseScore = () => Math.min(data.uniqueRaisePercent / data.targetUniqueRaise, 1) * 25;
  const calculateRaiseQualityScore = () => {
    const targetQuality = data.targetQualityRatio * data.hbtpValue;
    if (data.raiseQuality <= targetQuality) return 25;
    const qualityRatio = Math.min(targetQuality / data.raiseQuality, 1);
    return qualityRatio * 25;
  };

  const firstComponentScore = mode === 'TL' ? calculateProductivityScore() : calculateVisitsConnectsScore();
  const inspectingDealersScore = calculateInspectingDealersScore();
  const uniqueRaiseScore = calculateUniqueRaiseScore();
  const raiseQualityScore = calculateRaiseQualityScore();
  const totalScore = Math.round(firstComponentScore + inspectingDealersScore + uniqueRaiseScore + raiseQualityScore);
  const isOnTarget = totalScore >= targetScore;

  // Circular progress calculation
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="card-premium overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors active:bg-slate-100/50"
      >
        {/* Circular Score */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#f1f5f9" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="36" fill="none"
              stroke={isOnTarget ? '#10b981' : '#f59e0b'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-800">{totalScore}</span>
          </div>
        </div>

        <div className="flex-1 text-left">
          <div className="text-[13px] font-semibold text-slate-700 mb-0.5">
            {mode === 'TL' ? 'Team Input Score' : 'Input Score'}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
              ${isOnTarget ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}
            `}>
              {isOnTarget ? 'On Track' : 'Below Target'}
            </span>
            <span className="text-[11px] text-slate-400">Target: {targetScore}</span>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-4 animate-fade-in">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            4 components \u2022 25 pts each
          </div>

          {mode === 'TL' ? (
            <ComponentRow
              label="Productivity of KAMs"
              score={firstComponentScore}
              maxScore={25}
              description={`${data.sis || 0} SIs (target ${data.sisTarget || 20}) \u2022 \u20B9${data.dcfDisbursalsValue || 0}L DCF`}
              status={firstComponentScore >= 20 ? 'good' : firstComponentScore >= 15 ? 'warning' : 'poor'}
            />
          ) : (
            <ComponentRow
              label="Visits / Connects"
              score={firstComponentScore}
              maxScore={25}
              description={`${data.visits} visits (${data.targetVisits}) \u2022 ${data.connects} connects (${data.targetConnects})`}
              status={firstComponentScore >= 20 ? 'good' : firstComponentScore >= 15 ? 'warning' : 'poor'}
            />
          )}

          <ComponentRow
            label="Inspecting Dealers"
            score={inspectingDealersScore}
            maxScore={25}
            description={`Avg ${data.avgInspectingDealers.toFixed(1)}/day (target ${data.targetInspectingDealers})`}
            status={inspectingDealersScore >= 20 ? 'good' : inspectingDealersScore >= 15 ? 'warning' : 'poor'}
          />

          <ComponentRow
            label="Unique Raise %"
            score={uniqueRaiseScore}
            maxScore={25}
            description={`${data.uniqueRaisePercent}% (target ${data.targetUniqueRaise}%)`}
            status={uniqueRaiseScore >= 20 ? 'good' : uniqueRaiseScore >= 15 ? 'warning' : 'poor'}
          />

          <ComponentRow
            label="Raise Quality vs HBTP"
            score={raiseQualityScore}
            maxScore={25}
            description={`Quality ${data.raiseQuality.toFixed(2)} (target \u2264 ${(data.targetQualityRatio * data.hbtpValue).toFixed(2)})`}
            status={raiseQualityScore >= 20 ? 'good' : raiseQualityScore >= 15 ? 'warning' : 'poor'}
          />

          {!isOnTarget && (
            <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 mb-1.5">
                <Zap className="w-3 h-3" /> Quick Wins
              </div>
              <div className="text-[11px] text-indigo-600 space-y-1 leading-relaxed">
                {firstComponentScore < 20 && mode === 'TL' && (
                  <div>
                    \u2022 {(data.sis || 0) < (data.sisTarget || 20)
                      ? `+${((data.sisTarget || 20) - (data.sis || 0)).toFixed(0)} SIs`
                      : `+\u20B9${((data.dcfDisbursalsTarget || 15) - (data.dcfDisbursalsValue || 0)).toFixed(0)}L DCF`}
                  </div>
                )}
                {firstComponentScore < 20 && mode === 'KAM' && (
                  <div>
                    \u2022 {data.visits < data.targetVisits
                      ? `+${(data.targetVisits - data.visits).toFixed(0)} visits/day`
                      : `+${(data.targetConnects - data.connects).toFixed(0)} connects/day`}
                  </div>
                )}
                {inspectingDealersScore < 20 && (
                  <div>\u2022 +{(data.targetInspectingDealers - data.avgInspectingDealers).toFixed(1)} inspecting dealers/day</div>
                )}
                {uniqueRaiseScore < 20 && (
                  <div>\u2022 +{(data.targetUniqueRaise - data.uniqueRaisePercent).toFixed(0)}% unique raise</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ComponentRow({
  label, score, maxScore, description, status
}: {
  label: string; score: number; maxScore: number;
  description: string; status: 'good' | 'warning' | 'poor';
}) {
  const percentage = (score / maxScore) * 100;
  const barColor = status === 'good' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-rose-500';
  const textColor = status === 'good' ? 'text-emerald-700' : status === 'warning' ? 'text-amber-700' : 'text-rose-700';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-700">{label}</span>
        <span className={`text-[13px] font-bold ${textColor}`}>
          {Math.round(score)}/{maxScore}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-[11px] text-slate-400">{description}</div>
    </div>
  );
}
