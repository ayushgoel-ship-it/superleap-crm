import { X, Phone, Clock, Play, Pause, Volume2, MessageSquare, Tag, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface CallDetail {
  id: string;
  dealer: string;
  dealerCode: string;
  kam: string;
  callDate: string;
  callTime: string;
  duration: string;
  outcome: 'Connected' | 'No Answer' | 'Busy' | 'Left VM';
  isProductive: boolean;
  productivitySource: 'AI' | 'KAM' | 'TL';
  transcript: string;
  sentimentScore: number;
  sentimentLabel: 'Positive' | 'Neutral' | 'Negative';
  autoTags: string[];
  kamComments: string;
  followUpTasks: string[];
  recordingUrl?: string;
}

interface CallDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: CallDetail | null;
  onMarkProductive?: (callId: string, productive: boolean) => void;
}

export function CallDetailModal({ isOpen, onClose, call, onMarkProductive }: CallDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  if (!isOpen || !call) return null;

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Mock playback - in real app would control audio element
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg text-gray-900">Call Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {call.dealer} ({call.dealerCode})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Call Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Phone className="w-4 h-4" />
                <span>KAM</span>
              </div>
              <div className="text-gray-900">{call.kam}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Clock className="w-4 h-4" />
                <span>Call Date & Time</span>
              </div>
              <div className="text-gray-900">
                {new Date(call.callDate).toLocaleDateString()} {call.callTime}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Duration</div>
              <div className="text-gray-900">{call.duration}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Outcome</div>
              <span
                className={`inline-block px-2 py-1 rounded text-xs ${
                  call.outcome === 'Connected'
                    ? 'bg-green-100 text-green-700'
                    : call.outcome === 'Left VM'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {call.outcome}
              </span>
            </div>
          </div>

          {/* Recording Playback */}
          {call.recordingUrl && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm text-gray-900">Call Recording</h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayback}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${playbackProgress}%` }}
                  ></div>
                </div>

                <div className="text-sm text-gray-600 min-w-[60px] text-right">
                  {call.duration}
                </div>
              </div>
            </div>
          )}

          {/* Productivity Assessment */}
          <div className={`p-4 rounded-lg mb-6 ${call.isProductive ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {call.isProductive ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                <h3 className={`text-sm ${call.isProductive ? 'text-green-900' : 'text-amber-900'}`}>
                  {call.isProductive ? 'Productive Call' : 'Non-Productive Call'}
                </h3>
              </div>
              <span className="text-xs text-gray-600">
                Marked by: {call.productivitySource}
              </span>
            </div>

            {onMarkProductive && (
              <div className="flex gap-2">
                <button
                  onClick={() => onMarkProductive(call.id, true)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                >
                  Mark Productive
                </button>
                <button
                  onClick={() => onMarkProductive(call.id, false)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
                >
                  Mark Non-Productive
                </button>
              </div>
            )}
          </div>

          {/* AI Tags & Sentiment */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm text-gray-900">Auto-Suggested Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {call.autoTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm text-gray-900">Sentiment Analysis</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      call.sentimentLabel === 'Positive'
                        ? 'bg-green-500'
                        : call.sentimentLabel === 'Negative'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${call.sentimentScore}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-900">{call.sentimentLabel}</span>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm text-gray-900">Call Transcript (AI Generated)</h3>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
              {call.transcript}
            </div>
          </div>

          {/* KAM Comments */}
          {call.kamComments && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm text-gray-900 mb-3">KAM Comments</h3>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                {call.kamComments}
              </div>
            </div>
          )}

          {/* Follow-up Tasks */}
          {call.followUpTasks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm text-gray-900 mb-3">Follow-up Tasks</h3>
              <div className="space-y-2">
                {call.followUpTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    {task}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              Create Follow-up
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
