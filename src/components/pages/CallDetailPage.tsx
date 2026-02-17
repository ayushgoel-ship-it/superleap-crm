/**
 * CALL DETAIL PAGE
 * 
 * Shows quantifiable productivity metrics using the centralized engine.
 * Displays deltas and explanations for why a call is productive/non-productive.
 */

import { ArrowLeft, Phone, CheckCircle, XCircle, AlertCircle, Calendar, User, FileText, TrendingUp } from 'lucide-react';
import { CallAttempt } from '../../contexts/ActivityContext';
import { getStatusBadgeColor, formatDelta } from '../../lib/productivityEngine';

interface CallDetailPageProps {
  call: CallAttempt;
  onBack: () => void;
}

export function CallDetailPage({ call, onBack }: CallDetailPageProps) {
  const evaluationResult = call.evaluationResult;
  
  if (!evaluationResult) {
    // Fallback if evaluation not computed
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="p-4 flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg text-gray-900">Call Details</h1>
          </div>
        </div>
        <div className="flex-1 p-4">
          <p className="text-gray-500">Productivity evaluation not available</p>
        </div>
      </div>
    );
  }

  const { status, deltas, explanationLines, daysSinceInteraction } = evaluationResult;
  const badgeStyle = getStatusBadgeColor(status);

  // Format call date
  const callDate = new Date(call.timestamp);
  const formattedDate = callDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <Phone className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg text-gray-900">Call Details</h1>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{call.dealerName}</div>
              <div className="text-xs text-gray-500">{call.dealerCode}</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${badgeStyle.bg} ${badgeStyle.text}`}>
              {badgeStyle.label}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Call Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">Call Information</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Date & Time</div>
                <div className="text-sm text-gray-900">{formattedDate}</div>
              </div>
            </div>

            {call.duration && (
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="text-sm text-gray-900">{Math.floor(call.duration / 60)} min {call.duration % 60} sec</div>
                </div>
              </div>
            )}

            {call.outcome && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">Outcome</div>
                  <div className="text-sm text-gray-900">{call.outcome}</div>
                </div>
              </div>
            )}

            {call.kamName && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">KAM</div>
                  <div className="text-sm text-gray-900">{call.kamName}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Productivity Analysis - Quantifiable */}
        <div className={`border rounded-xl p-4 ${
          status === 'PRODUCTIVE' ? 'bg-green-50 border-green-200' :
          status === 'NON_PRODUCTIVE' ? 'bg-red-50 border-red-200' :
          'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {status === 'PRODUCTIVE' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'NON_PRODUCTIVE' && <XCircle className="w-5 h-5 text-red-600" />}
            {status === 'PENDING' && <AlertCircle className="w-5 h-5 text-amber-600" />}
            <h3 className="font-medium text-gray-900">Productivity Analysis</h3>
          </div>

          <div className="space-y-2">
            {explanationLines.map((line, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700">{line}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Metric Deltas - Show detailed breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Business Impact</h3>
          </div>

          <div className="space-y-3">
            {/* Leads */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Leads</span>
              <span className={`text-sm font-medium ${
                deltas.leads > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {formatDelta(deltas.leads)}
              </span>
            </div>

            {/* Inspections */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Inspections</span>
              <span className={`text-sm font-medium ${
                deltas.inspections > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {formatDelta(deltas.inspections)}
              </span>
            </div>

            {/* Stock-ins */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Stock-ins</span>
              <span className={`text-sm font-medium ${
                deltas.stockIns > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {formatDelta(deltas.stockIns)}
              </span>
            </div>

            {/* DCF Leads */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">DCF Leads</span>
              <span className={`text-sm font-medium ${
                deltas.dcfLeads > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {formatDelta(deltas.dcfLeads)}
              </span>
            </div>

            {/* DCF Onboarding */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">DCF Onboarding</span>
              <span className={`text-sm font-medium ${
                deltas.dcfOnboarded > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {formatDelta(deltas.dcfOnboarded)}
              </span>
            </div>

            {/* DCF Disbursement */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">DCF Disbursement</span>
              <span className={`text-sm font-medium ${
                deltas.dcfDisbursed > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {formatDelta(deltas.dcfDisbursed)}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {call.notes && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-700">{call.notes}</p>
          </div>
        )}

        {/* Tags */}
        {call.tags && call.tags.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {call.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
