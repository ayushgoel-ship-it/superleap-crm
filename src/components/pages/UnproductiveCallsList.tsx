import { useState, useMemo } from 'react';
import { Phone, XCircle, ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useActivity, CallAttempt } from '../../contexts/ActivityContext';
import { getNonProductiveInteractions } from '../../lib/productivityEngine';
import { CallDetailPage } from './CallDetailPage';

type CallsFilterRange = 'd-1' | '7d' | '30d';

interface UnproductiveCallsListProps {
  onBack: () => void;
}

export function UnproductiveCallsList({ onBack }: UnproductiveCallsListProps) {
  const { calls } = useActivity();
  const [callsFilter, setCallsFilter] = useState<CallsFilterRange>('d-1');
  const [selectedCall, setSelectedCall] = useState<CallAttempt | null>(null);

  // Get all non-productive calls using the engine
  const nonProductiveCalls = useMemo(() => {
    return getNonProductiveInteractions(calls);
  }, [calls]);

  // Filter by selected date range
  const filteredNonProductiveCalls = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (callsFilter === 'd-1') {
      // Yesterday only
      cutoffDate.setDate(now.getDate() - 1);
      cutoffDate.setHours(0, 0, 0, 0);
    } else if (callsFilter === '7d') {
      // Last 7 days
      cutoffDate.setDate(now.getDate() - 7);
    } else {
      // Last 30 days
      cutoffDate.setDate(now.getDate() - 30);
    }

    return nonProductiveCalls.filter(call => 
      new Date(call.timestamp) >= cutoffDate
    );
  }, [nonProductiveCalls, callsFilter]);

  // Group by dealer
  const groupedByDealer = useMemo(() => {
    const grouped: Record<string, CallAttempt[]> = {};
    
    filteredNonProductiveCalls.forEach(call => {
      if (!grouped[call.dealerId]) {
        grouped[call.dealerId] = [];
      }
      grouped[call.dealerId].push(call);
    });

    return Object.entries(grouped).map(([dealerId, calls]) => ({
      dealerId,
      dealerName: calls[0].dealerName,
      dealerCode: calls[0].dealerCode,
      count: calls.length,
      calls: calls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    })).sort((a, b) => b.count - a.count);
  }, [filteredNonProductiveCalls]);

  // Show call detail
  if (selectedCall) {
    return (
      <CallDetailPage
        call={selectedCall}
        onBack={() => setSelectedCall(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg text-gray-900">Non-Productive Calls</h1>
              <p className="text-sm text-gray-500">
                Calls that did not lead to any business activity
              </p>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2">
            <button
              onClick={() => setCallsFilter('d-1')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                callsFilter === 'd-1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              D-1
            </button>
            <button
              onClick={() => setCallsFilter('7d')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                callsFilter === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setCallsFilter('30d')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                callsFilter === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 days
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredNonProductiveCalls.length > 0 ? (
          <div className="space-y-3">
            {groupedByDealer.map((dealer) => (
              <div key={dealer.dealerId} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{dealer.dealerName}</div>
                    <div className="text-xs text-gray-500">{dealer.dealerCode}</div>
                  </div>
                  <div className="text-sm text-red-600 font-medium">
                    {dealer.count} call{dealer.count > 1 ? 's' : ''}
                  </div>
                </div>
                
                {/* List of calls */}
                <div className="space-y-2">
                  {dealer.calls.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-200 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-600">
                            {new Date(call.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          {call.outcome && (
                            <div className="text-xs text-gray-500 truncate">{call.outcome}</div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-base font-medium text-green-900 mb-1">
              Great job — no non-productive calls in this period 🎉
            </p>
            <p className="text-sm text-green-700">
              Keep up the excellent work!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}