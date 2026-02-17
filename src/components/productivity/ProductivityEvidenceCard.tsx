import { TrendingUp, TrendingDown, Clock, Target, AlertCircle } from 'lucide-react';
import { ProductivityEvidence } from '../../lib/productivity/productivityService';

interface ProductivityEvidenceCardProps {
  evidence: ProductivityEvidence;
  interactionType: 'call' | 'visit';
}

export function ProductivityEvidenceCard({ evidence, interactionType }: ProductivityEvidenceCardProps) {
  const { 
    daysSinceInteraction, 
    windowDays, 
    isWindowComplete, 
    daysRemaining, 
    activityDelta, 
    isProductive, 
    whyText, 
    status 
  } = evidence;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">Business Movement Since This {interactionType === 'call' ? 'Call' : 'Visit'}</h3>
      </div>

      {/* Timeline Info */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Days since {interactionType}</div>
          <div className="text-lg font-bold text-gray-900">{daysSinceInteraction}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 mb-1">Tracking window</div>
          <div className="text-lg font-bold text-blue-700">{windowDays} days</div>
        </div>
        <div className={`rounded-lg p-3 ${
          status === 'productive' 
            ? 'bg-green-50' 
            : status === 'provisional' 
              ? 'bg-amber-50' 
              : 'bg-red-50'
        }`}>
          <div className={`text-xs mb-1 ${
            status === 'productive' 
              ? 'text-green-600' 
              : status === 'provisional' 
                ? 'text-amber-600' 
                : 'text-red-600'
          }`}>
            Status
          </div>
          <div className={`text-xs font-bold ${
            status === 'productive' 
              ? 'text-green-700' 
              : status === 'provisional' 
                ? 'text-amber-700' 
                : 'text-red-700'
          }`}>
            {status === 'productive' ? 'Productive' : status === 'provisional' ? 'Provisional' : 'Non-Productive'}
          </div>
        </div>
      </div>

      {/* Window status alert */}
      {!isWindowComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-900 font-medium">Window still running</p>
            <p className="text-xs text-amber-700 mt-0.5">{daysRemaining} days remaining in tracking period</p>
          </div>
        </div>
      )}

      {/* Activity Deltas */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-700 mb-2">Activity Changes</div>
        <div className="grid grid-cols-2 gap-2">
          {/* Leads */}
          <div className={`rounded-lg p-2 border ${
            activityDelta.leadsDelta > 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Leads</span>
              <span className={`text-sm font-bold ${
                activityDelta.leadsDelta > 0 ? 'text-green-700' : 'text-gray-400'
              }`}>
                {activityDelta.leadsDelta > 0 ? '+' : ''}{activityDelta.leadsDelta}
              </span>
            </div>
          </div>

          {/* Inspections */}
          <div className={`rounded-lg p-2 border ${
            activityDelta.inspectionsDelta > 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Inspections</span>
              <span className={`text-sm font-bold ${
                activityDelta.inspectionsDelta > 0 ? 'text-green-700' : 'text-gray-400'
              }`}>
                {activityDelta.inspectionsDelta > 0 ? '+' : ''}{activityDelta.inspectionsDelta}
              </span>
            </div>
          </div>

          {/* Stock-ins */}
          <div className={`rounded-lg p-2 border ${
            activityDelta.stockInsDelta > 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Stock-ins</span>
              <span className={`text-sm font-bold ${
                activityDelta.stockInsDelta > 0 ? 'text-green-700' : 'text-gray-400'
              }`}>
                {activityDelta.stockInsDelta > 0 ? '+' : ''}{activityDelta.stockInsDelta}
              </span>
            </div>
          </div>

          {/* DCF Onboarding */}
          <div className={`rounded-lg p-2 border ${
            activityDelta.dcfOnboardingDelta > 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">DCF Onb.</span>
              <span className={`text-sm font-bold ${
                activityDelta.dcfOnboardingDelta > 0 ? 'text-green-700' : 'text-gray-400'
              }`}>
                {activityDelta.dcfOnboardingDelta > 0 ? '+' : ''}{activityDelta.dcfOnboardingDelta}
              </span>
            </div>
          </div>

          {/* DCF Leads */}
          <div className={`rounded-lg p-2 border ${
            activityDelta.dcfLeadsDelta > 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">DCF Leads</span>
              <span className={`text-sm font-bold ${
                activityDelta.dcfLeadsDelta > 0 ? 'text-green-700' : 'text-gray-400'
              }`}>
                {activityDelta.dcfLeadsDelta > 0 ? '+' : ''}{activityDelta.dcfLeadsDelta}
              </span>
            </div>
          </div>

          {/* DCF Disbursals */}
          <div className={`rounded-lg p-2 border ${
            activityDelta.dcfDisbursalDelta > 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">DCF Disb.</span>
              <span className={`text-sm font-bold ${
                activityDelta.dcfDisbursalDelta > 0 ? 'text-green-700' : 'text-gray-400'
              }`}>
                {activityDelta.dcfDisbursalDelta > 0 ? '+' : ''}{activityDelta.dcfDisbursalDelta}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Why / Why Not Summary */}
      <div className={`rounded-lg p-3 border ${
        isProductive 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start gap-2">
          {isProductive ? (
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <p className={`text-xs ${
            isProductive ? 'text-green-800' : 'text-red-800'
          }`}>
            {whyText}
          </p>
        </div>
      </div>

      {/* No movement message */}
      {!isProductive && Object.values(activityDelta).every(v => v === 0) && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">No movement observed in this window.</p>
          </div>
        </div>
      )}
    </div>
  );
}
