import { MapPin, CheckCircle, Clock, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

interface LocationHistoryEntry {
  id: string;
  source: string;
  changedBy?: string;
  role?: string;
  previousLat?: number;
  previousLong?: number;
  newLat: number;
  newLong: number;
  newAddress: string;
  status: 'Original' | 'Auto-approved' | 'Approved' | 'Pending' | 'Rejected';
  approvedBy?: string;
  timestamp: string;
  gpsAccuracy?: string;
  comment?: string;
  distanceMoved?: number;
}

interface DealerLocationHistoryProps {
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  history: LocationHistoryEntry[];
  onClose: () => void;
}

export function DealerLocationHistory({
  dealerId,
  dealerName,
  dealerCode,
  history,
  onClose,
}: DealerLocationHistoryProps) {
  const [selectedEntry, setSelectedEntry] = useState<LocationHistoryEntry | null>(null);

  return (
    <>
      {/* Main History View */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl animate-in fade-in zoom-in duration-200 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg text-gray-900">Location History</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {dealerName} • {dealerCode}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm text-gray-900 font-medium">
                          {entry.source}
                        </h4>
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                            Current
                          </span>
                        )}
                      </div>
                      {entry.changedBy && (
                        <div className="text-xs text-gray-500">
                          Changed by {entry.changedBy} ({entry.role})
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        entry.status === 'Original'
                          ? 'bg-gray-100 text-gray-700'
                          : entry.status === 'Auto-approved'
                          ? 'bg-green-100 text-green-700'
                          : entry.status === 'Approved'
                          ? 'bg-green-100 text-green-700'
                          : entry.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Coordinates</div>
                      <div className="text-xs text-gray-900 font-mono">
                        {entry.newLat.toFixed(6)}, {entry.newLong.toFixed(6)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Date</div>
                      <div className="text-xs text-gray-900">{entry.timestamp}</div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">Address</div>
                    <div className="text-xs text-gray-900">{entry.newAddress}</div>
                  </div>

                  {/* Approval info */}
                  {entry.approvedBy && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>
                        Approved by {entry.approvedBy}
                        {entry.comment && ` • ${entry.comment}`}
                      </span>
                    </div>
                  )}

                  {/* Distance moved */}
                  {entry.distanceMoved !== undefined && entry.distanceMoved > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                      <MapPin className="w-3 h-3" />
                      <span>Moved {entry.distanceMoved}m from previous location</span>
                    </div>
                  )}

                  {/* GPS Accuracy */}
                  {entry.gpsAccuracy && (
                    <div className="text-xs text-gray-500">
                      GPS Accuracy: {entry.gpsAccuracy}
                    </div>
                  )}

                  {/* View Details */}
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                  >
                    View details
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1 text-xs text-blue-900">
              <div>• Each dealer allows only one auto-approved location correction.</div>
              <div>• Further changes require TL approval.</div>
              <div>• All updates are audited with GPS and timestamps.</div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg text-gray-900">Location Details</h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Map Preview */}
              <div className="h-48 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg relative overflow-hidden border border-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute">
                    <MapPin className="w-8 h-8 text-blue-600 fill-blue-200" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-lg p-2">
                  <div className="text-xs text-gray-900 font-medium">{selectedEntry.newAddress}</div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Source</div>
                  <div className="text-sm text-gray-900">{selectedEntry.source}</div>
                </div>

                {selectedEntry.changedBy && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Changed By</div>
                    <div className="text-sm text-gray-900">
                      {selectedEntry.changedBy} ({selectedEntry.role})
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-gray-600 mb-1">Status</div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      selectedEntry.status === 'Original'
                        ? 'bg-gray-100 text-gray-700'
                        : selectedEntry.status === 'Auto-approved'
                        ? 'bg-green-100 text-green-700'
                        : selectedEntry.status === 'Approved'
                        ? 'bg-green-100 text-green-700'
                        : selectedEntry.status === 'Pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selectedEntry.status}
                  </span>
                </div>

                {selectedEntry.approvedBy && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Approved By</div>
                    <div className="text-sm text-gray-900">{selectedEntry.approvedBy}</div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-gray-600 mb-1">Timestamp</div>
                  <div className="text-sm text-gray-900">{selectedEntry.timestamp}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-1">Coordinates</div>
                  <div className="text-sm text-gray-900 font-mono">
                    {selectedEntry.newLat.toFixed(6)}, {selectedEntry.newLong.toFixed(6)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-1">Address</div>
                  <div className="text-sm text-gray-900">{selectedEntry.newAddress}</div>
                </div>

                {selectedEntry.gpsAccuracy && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">GPS Accuracy</div>
                    <div className="text-sm text-gray-900">{selectedEntry.gpsAccuracy}</div>
                  </div>
                )}

                {selectedEntry.distanceMoved !== undefined && selectedEntry.distanceMoved > 0 && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Distance Moved</div>
                    <div className="text-sm text-gray-900">{selectedEntry.distanceMoved}m</div>
                  </div>
                )}

                {selectedEntry.comment && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Comment</div>
                    <div className="text-sm text-gray-900">{selectedEntry.comment}</div>
                  </div>
                )}

                {selectedEntry.previousLat && selectedEntry.previousLong && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Previous Coordinates</div>
                    <div className="text-sm text-gray-900 font-mono">
                      {selectedEntry.previousLat.toFixed(6)}, {selectedEntry.previousLong.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
