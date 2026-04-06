import { useState } from 'react';
import { ChevronLeft, Phone, Clock, Building2, User, MessageSquare, Play, Pause, Volume2 } from 'lucide-react';

type CallOutcome = 'connected_positive' | 'connected_neutral' | 'connected_negative' | 'not_reachable' | 'switched_off' | 'wrong_number' | 'call_back_later';
type ProductiveStatus = 'productive' | 'non_productive' | 'unknown';
type Channel = 'NGS' | 'GS' | 'DCF';

interface CallDetailProps {
  dealerName: string;
  dealerCode: string;
  city: string;
  contactName: string;
  contactRole: string;
  contactPhone: string;
  date: string;
  time: string;
  duration: string;
  outcome: CallOutcome;
  productive: ProductiveStatus;
  channel?: Channel;
  purpose?: string;
  keyActions?: string[];
  followUpType?: string;
  followUpDate?: string;
  followUpTime?: string;
  notes?: string;
  kamName?: string; // For TL view
  userRole?: 'KAM' | 'TL';
  onBack: () => void;
}

export function CallDetail({
  dealerName,
  dealerCode,
  city,
  contactName,
  contactRole,
  contactPhone,
  date,
  time,
  duration,
  outcome,
  productive,
  channel,
  purpose,
  keyActions = [],
  followUpType,
  followUpDate,
  followUpTime,
  notes,
  kamName,
  userRole = 'KAM',
  onBack,
}: CallDetailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [tlNotes, setTlNotes] = useState('Good discovery questions, but confirm next steps more clearly.');

  const getOutcomeLabel = (outcome: CallOutcome) => {
    const labels: Record<CallOutcome, string> = {
      connected_positive: 'Connected – Positive',
      connected_neutral: 'Connected – Neutral',
      connected_negative: 'Connected – Negative',
      not_reachable: 'Not reachable',
      switched_off: 'Switched off',
      wrong_number: 'Wrong number',
      call_back_later: 'Call back later',
    };
    return labels[outcome];
  };

  const getOutcomeColor = (outcome: CallOutcome) => {
    if (outcome === 'connected_positive') return 'bg-green-100 text-green-700';
    if (outcome === 'connected_neutral') return 'bg-blue-100 text-blue-700';
    if (outcome === 'connected_negative') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getActionLabel = (actionId: string) => {
    const labels: Record<string, string> = {
      dealer_committed_leads: 'Dealer committed leads',
      dcf_onboarding: 'Dealer agreed to DCF onboarding',
      visit_scheduled: 'Visit scheduled',
      pricing_feedback: 'Pricing feedback shared',
      complaint: 'Complaint / issue raised',
      no_outcome: 'No clear outcome',
      other: 'Other',
    };
    return labels[actionId] || actionId;
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // In real app, this would control actual audio playback
  };

  // Mock AI summary data
  const aiSummary = {
    bullets: [
      'Dealer agreed to share 3 seller leads this week.',
      'DCF interest is moderate; requested rate sheet on WhatsApp.',
      'Follow-up scheduled in 2 days to confirm visits.',
    ],
    sentiment: 'Positive' as 'Positive' | 'Neutral' | 'Negative',
    productiveReason: 'Productive – dealer committed new leads.',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg text-gray-900">Call Details</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Dealer & Contact Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-gray-900">{dealerName}</h2>
                <span className="text-xs text-gray-500">{dealerCode}</span>
              </div>
              <div className="text-sm text-gray-600">{city}</div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                {contactName} • {contactRole}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{contactPhone}</span>
            </div>
            {kamName && userRole === 'TL' && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">KAM: {kamName}</span>
              </div>
            )}
          </div>

          {/* Date/Time/Duration */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{date} • {time} • {duration}</span>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs ${getOutcomeColor(outcome)}`}>
              {getOutcomeLabel(outcome)}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs ${
                productive === 'productive'
                  ? 'bg-green-100 text-green-700'
                  : productive === 'non_productive'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {productive === 'productive'
                ? 'Productive'
                : productive === 'non_productive'
                ? 'Non-productive'
                : 'Not analysed'}
            </span>
          </div>
        </div>

        {/* Call Meta */}
        {(channel || purpose) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <h3 className="text-sm text-gray-900">Call Information</h3>
            {channel && (
              <div className="text-sm">
                <span className="text-gray-600">Channel: </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    channel === 'NGS'
                      ? 'bg-violet-100 text-violet-700'
                      : channel === 'GS'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {channel}
                </span>
              </div>
            )}
            {purpose && (
              <div className="text-sm">
                <span className="text-gray-600">Purpose: </span>
                <span className="text-gray-900">{purpose}</span>
              </div>
            )}
          </div>
        )}

        {/* Outcome & Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm text-gray-900">Outcome & Actions</h3>
          
          <div>
            <div className="text-xs text-gray-600 mb-1">Outcome</div>
            <span className={`px-3 py-1 rounded-full text-xs ${getOutcomeColor(outcome)}`}>
              {getOutcomeLabel(outcome)}
            </span>
          </div>

          {keyActions.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-2">Key actions</div>
              <div className="flex flex-wrap gap-2">
                {keyActions.map((action, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                  >
                    {getActionLabel(action)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Details */}
          {followUpType && followUpType !== 'none' && (
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Next follow-up</div>
              {followUpType === 'call' && followUpDate && (
                <div className="text-sm text-gray-900">
                  Follow-up call: {followUpDate}
                  {followUpTime && `, ${followUpTime}`}
                </div>
              )}
              {followUpType === 'visit' && followUpDate && (
                <div className="text-sm text-gray-900">
                  Next visit planned: {followUpDate}
                  {followUpTime && ` at ${followUpTime}`}
                </div>
              )}
              {followUpType === 'task' && (
                <div className="text-sm text-gray-900">Task created</div>
              )}
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Notes</div>
              <div className="text-sm text-gray-700">{notes}</div>
            </div>
          )}
        </div>

        {/* AI Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-900">AI Call Summary</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                aiSummary.sentiment === 'Positive'
                  ? 'bg-green-100 text-green-700'
                  : aiSummary.sentiment === 'Negative'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {aiSummary.sentiment}
            </span>
          </div>

          <div className="space-y-2">
            {aiSummary.bullets.map((bullet, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span className="text-sm text-gray-700 flex-1">{bullet}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-purple-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">AI Productive tag:</span>
              <span className="text-xs text-purple-700">{aiSummary.productiveReason}</span>
            </div>
          </div>
        </div>

        {/* Call Recording */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm text-gray-900">Call recording ({duration})</h3>
          
          {/* Audio Player */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayback}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={playbackProgress}
                    onChange={(e) => setPlaybackProgress(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <Volume2 className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>0:00</span>
              <span>{duration}</span>
            </div>
          </div>
        </div>

        {/* TL Notes Section (only for TL) */}
        {userRole === 'TL' && (
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 space-y-3">
            <h3 className="text-sm text-amber-900">TL Notes (Coaching)</h3>
            <textarea
              value={tlNotes}
              onChange={(e) => setTlNotes(e.target.value)}
              placeholder="Add coaching notes..."
              rows={3}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-white"
            />
            <button className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm">
              Save TL Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
