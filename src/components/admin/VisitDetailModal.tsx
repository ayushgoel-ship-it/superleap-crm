import { X, MapPin, Clock, Camera, CheckCircle, XCircle, User, Calendar } from 'lucide-react';

interface VisitDetail {
  id: string;
  dealer: string;
  dealerCode: string;
  kam: string;
  visitDate: string;
  checkInTime: string;
  checkOutTime: string;
  visitType: 'Planned' | 'Ad-hoc';
  geofenceDistance: number;
  isProductive: boolean;
  productivityScore: number;
  productivityReasons: string[];
  leadsCreated: number;
  dcfOnboarding: boolean;
  remarkText: string;
  photos: string[];
  nextActions: string[];
  raContacted: boolean;
  paContacted: boolean;
  timeline: {
    timestamp: string;
    action: string;
    details: string;
  }[];
}

interface VisitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: VisitDetail | null;
}

export function VisitDetailModal({ isOpen, onClose, visit }: VisitDetailModalProps) {
  if (!isOpen || !visit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg text-gray-900">Visit Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {visit.dealer} ({visit.dealerCode})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Visit Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span>KAM</span>
              </div>
              <div className="text-gray-900">{visit.kam}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Visit Date</span>
              </div>
              <div className="text-gray-900">{new Date(visit.visitDate).toLocaleDateString()}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Clock className="w-4 h-4" />
                <span>Check-in Time</span>
              </div>
              <div className="text-gray-900">{visit.checkInTime}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Clock className="w-4 h-4" />
                <span>Check-out Time</span>
              </div>
              <div className="text-gray-900">{visit.checkOutTime || 'Not checked out'}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span>Geofence Check-in</span>
              </div>
              <div className={`text-sm ${visit.geofenceDistance <= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                {visit.geofenceDistance}m from dealer
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Visit Type</div>
              <div className="text-gray-900">{visit.visitType}</div>
            </div>
          </div>

          {/* Productivity Assessment */}
          <div className={`p-4 rounded-lg mb-6 ${visit.isProductive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {visit.isProductive ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className={`text-sm ${visit.isProductive ? 'text-green-900' : 'text-red-900'}`}>
                  {visit.isProductive ? 'Productive Visit' : 'Non-Productive Visit'}
                </h3>
              </div>
              <div className="text-2xl font-mono text-gray-900">{visit.productivityScore}/100</div>
            </div>

            {visit.productivityReasons.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-gray-600 mb-2">Productivity Indicators:</div>
                {visit.productivityReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                    {reason}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visit Feedback */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm text-gray-900 mb-4">Visit Feedback</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Leads Created</div>
                <div className="text-lg text-gray-900">{visit.leadsCreated}</div>
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">DCF Onboarding</div>
                <div className="text-lg text-gray-900">{visit.dcfOnboarding ? 'Yes' : 'No'}</div>
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">RA Contacted</div>
                <div className="text-sm text-gray-900">{visit.raContacted ? 'Yes' : 'No'}</div>
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">PA Contacted</div>
                <div className="text-sm text-gray-900">{visit.paContacted ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {visit.remarkText && (
              <div>
                <div className="text-xs text-gray-600 mb-1">KAM Remarks</div>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{visit.remarkText}</div>
              </div>
            )}
          </div>

          {/* Photos */}
          {visit.photos.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm text-gray-900">Photos ({visit.photos.length})</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {visit.photos.map((photo, idx) => (
                  <div key={idx} className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                    Photo {idx + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Actions */}
          {visit.nextActions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm text-gray-900 mb-3">Next Actions</h3>
              <div className="space-y-2">
                {visit.nextActions.map((action, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    {action}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-sm text-gray-900 mb-3">Visit Timeline</h3>
            <div className="space-y-3">
              {visit.timeline.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm text-gray-900">{item.action}</div>
                      <div className="text-xs text-gray-500">{item.timestamp}</div>
                    </div>
                    <div className="text-xs text-gray-600">{item.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
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
