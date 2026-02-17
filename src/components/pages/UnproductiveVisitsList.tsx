import { useState, useMemo } from 'react';
import { MapPin, AlertCircle, ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useActivity, Visit } from '../../contexts/ActivityContext';
import { VisitDetailPage } from './VisitDetailPage';

type VisitsFilterRange = 'd-1' | '7d' | '30d';

interface UnproductiveVisitsListProps {
  onBack: () => void;
}

export function UnproductiveVisitsList({ onBack }: UnproductiveVisitsListProps) {
  const { visits } = useActivity();
  const [visitsFilter, setVisitsFilter] = useState<VisitsFilterRange>('7d');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Filter visits without follow-up by selected date range
  const filteredNoFollowUpVisits = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (visitsFilter === 'd-1') {
      // Yesterday only
      cutoffDate.setDate(now.getDate() - 1);
      cutoffDate.setHours(0, 0, 0, 0);
    } else if (visitsFilter === '7d') {
      // Last 7 days
      cutoffDate.setDate(now.getDate() - 7);
    } else {
      // Last 30 days
      cutoffDate.setDate(now.getDate() - 30);
    }

    return visits.filter(v => 
      v.status === 'completed' && 
      (!v.nextAction || v.nextAction.trim() === '') &&
      v.checkInTime &&
      new Date(v.checkInTime) >= cutoffDate
    ).sort((a, b) => {
      const dateA = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
      const dateB = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
      return dateB - dateA;
    });
  }, [visits, visitsFilter]);

  // Show visit detail
  if (selectedVisit) {
    return (
      <VisitDetailPage
        visit={selectedVisit}
        onBack={() => setSelectedVisit(null)}
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
              <h1 className="text-lg text-gray-900">Non-Productive Visits</h1>
              <p className="text-sm text-gray-500">
                Visits without documented next action
              </p>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2">
            <button
              onClick={() => setVisitsFilter('d-1')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                visitsFilter === 'd-1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              D-1
            </button>
            <button
              onClick={() => setVisitsFilter('7d')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                visitsFilter === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setVisitsFilter('30d')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                visitsFilter === '30d'
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
        {filteredNoFollowUpVisits.length > 0 ? (
          <div className="space-y-3">
            {filteredNoFollowUpVisits.map((visit) => (
              <button
                key={visit.id}
                onClick={() => setSelectedVisit(visit)}
                className="w-full flex items-center justify-between p-4 bg-white border border-amber-200 hover:bg-amber-50 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{visit.dealerName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {visit.checkInTime && new Date(visit.checkInTime).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {visit.outcome && (
                      <div className="text-xs text-gray-600 mt-1 truncate">{visit.outcome}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-amber-700 font-medium">No follow-up</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-base font-medium text-green-900 mb-1">
              Great! All visits have follow-ups in this period 🎉
            </p>
            <p className="text-sm text-green-700">
              Keep documenting those next actions!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
