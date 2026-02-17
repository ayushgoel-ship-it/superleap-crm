import { ArrowLeft, MapPin, CheckCircle, XCircle, Clock, User, Calendar, FileText } from 'lucide-react';
import { Visit, VisitStatus } from '../../contexts/ActivityContext';
import { ProductivityEvidenceCard } from '../productivity/ProductivityEvidenceCard';
import { computeVisitProductivity } from '../../lib/productivity/productivityService';
import { getDealerActivity } from '../../lib/productivity/mockDealerActivity';

interface VisitDetailPageProps {
  visit: Visit;
  onBack: () => void;
}

export function VisitDetailPage({ visit, onBack }: VisitDetailPageProps) {
  // Compute productivity evidence
  const dealerActivity = getDealerActivity(visit.dealerId);
  const productivityEvidence = visit.checkInTime 
    ? computeVisitProductivity(visit.checkInTime, dealerActivity) 
    : null;

  const getStatusBadge = () => {
    switch (visit.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            In Progress
          </span>
        );
      case 'not-started':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            Not Started
          </span>
        );
      case 'incomplete':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
            <XCircle className="w-4 h-4" />
            Incomplete
          </span>
        );
      default:
        return null;
    }
  };

  const getVisitDuration = () => {
    if (!visit.checkInTime || !visit.checkOutTime) return null;
    
    const checkIn = new Date(visit.checkInTime);
    const checkOut = new Date(visit.checkOutTime);
    const durationMs = checkOut.getTime() - checkIn.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg text-gray-900">Visit Details</h1>
                <div className="text-sm text-gray-500">
                  {visit.checkInTime ? new Date(visit.checkInTime).toLocaleDateString('en-US', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  }) : 'Scheduled'}
                </div>
              </div>
            </div>
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Dealer Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm text-gray-600 mb-3">Dealer Information</h3>
          <div className="space-y-2">
            <div>
              <div className="text-gray-900 font-medium">{visit.dealerName}</div>
              <div className="text-sm text-gray-500">{visit.dealerCode} • {visit.dealerCity}</div>
            </div>
          </div>
        </div>

        {/* Visit Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm text-gray-600 mb-3">Visit Information</h3>
          <div className="space-y-3">
            {visit.scheduledTime && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Scheduled</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900">
                    {new Date(visit.scheduledTime).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(visit.scheduledTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            )}

            {visit.checkInTime && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Check-in</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900">
                    {new Date(visit.checkInTime).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(visit.checkInTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            )}

            {visit.checkOutTime && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-gray-600">Check-out</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900">
                    {new Date(visit.checkOutTime).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(visit.checkOutTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            )}

            {getVisitDuration() && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Duration</span>
                </div>
                <div className="text-sm text-gray-900">{getVisitDuration()}</div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">KAM</span>
              </div>
              <div className="text-sm text-gray-900">{visit.kamName}</div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="text-sm text-gray-600 mb-2">Visit Status</div>
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Productivity Evidence */}
        {productivityEvidence && (
          <ProductivityEvidenceCard evidence={productivityEvidence} interactionType="visit" />
        )}

        {/* Visit Purpose */}
        {visit.purpose && visit.purpose.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm text-gray-600 mb-3">Visit Purpose</h3>
            <div className="flex flex-wrap gap-2">
              {visit.purpose.map((p, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meeting Person */}
        {visit.meetingPerson && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm text-gray-600 mb-2">Meeting Person</h3>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{visit.meetingPerson}</span>
            </div>
          </div>
        )}

        {/* Visit Feedback */}
        {visit.status === 'completed' && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm text-gray-600 mb-3">Visit Feedback</h3>
            
            {visit.outcome && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Discussion Summary</div>
                <div className="text-sm text-gray-900">{visit.outcome}</div>
              </div>
            )}

            {visit.nextAction && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Next Actions</div>
                <div className="text-sm text-gray-900">{visit.nextAction}</div>
              </div>
            )}

            {visit.notes && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Additional Notes</div>
                <div className="text-sm text-gray-900">{visit.notes}</div>
              </div>
            )}

            {!visit.outcome && !visit.nextAction && !visit.notes && (
              <div className="text-sm text-gray-500 italic">No feedback recorded</div>
            )}
          </div>
        )}

        {/* Photos */}
        {visit.photos && visit.photos.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm text-gray-600 mb-3">Photos ({visit.photos.length})</h3>
            <div className="grid grid-cols-2 gap-2">
              {visit.photos.map((photo, idx) => (
                <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={photo} 
                    alt={`Visit photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Info */}
        {visit.lat && visit.lng && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm text-gray-600 mb-3">Location</h3>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="text-sm text-gray-900">
                Lat: {visit.lat.toFixed(6)}, Lng: {visit.lng.toFixed(6)}
              </div>
            </div>
          </div>
        )}

        {(visit.status === 'not-started' || visit.status === 'incomplete') && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-medium text-amber-900">
                {visit.status === 'not-started' ? 'Visit Not Started' : 'Visit Incomplete'}
              </h3>
            </div>
            <p className="text-sm text-amber-800">
              {visit.status === 'not-started' 
                ? 'This visit has not been started yet.'
                : 'This visit was started but not completed. Please complete the visit feedback.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}