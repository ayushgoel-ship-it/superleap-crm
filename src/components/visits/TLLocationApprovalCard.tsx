import { MapPin, CheckCircle, XCircle, MessageSquare, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface LocationUpdate {
  requestId: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  requestedBy: string;
  role: string;
  previousLat: number;
  previousLong: number;
  proposedLat: number;
  proposedLong: number;
  proposedAddress: string;
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  gpsAccuracy: string;
  proofPhoto?: string;
}

interface TLLocationApprovalCardProps {
  update: LocationUpdate;
  onApprove: (requestId: string, comment?: string) => void;
  onReject: (requestId: string, comment: string) => void;
  onRequestChanges: (requestId: string, comment: string) => void;
}

export function TLLocationApprovalCard({
  update,
  onApprove,
  onReject,
  onRequestChanges,
}: TLLocationApprovalCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [comment, setComment] = useState('');

  const distanceMoved = Math.round(
    Math.sqrt(
      Math.pow((update.proposedLat - update.previousLat) * 111000, 2) +
      Math.pow((update.proposedLong - update.previousLong) * 111000, 2)
    )
  );

  const handleAction = (type: 'approve' | 'reject' | 'request_changes') => {
    setActionType(type);
    if (type === 'approve') {
      setComment('Location verified via photo');
    } else {
      setComment('');
    }
    setShowActionModal(true);
  };

  const handleSubmitAction = () => {
    if (actionType === 'approve') {
      onApprove(update.requestId, comment);
    } else if (actionType === 'reject') {
      onReject(update.requestId, comment);
    } else {
      onRequestChanges(update.requestId, comment);
    }
    setShowActionModal(false);
    setComment('');
  };

  return (
    <>
      {/* Notification Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="text-gray-900 mb-1">Location update request</h4>
            <div className="text-sm text-gray-600">{update.dealerName}</div>
            <div className="text-xs text-gray-500 mt-1">
              Requested by {update.requestedBy} • {update.timestamp}
            </div>
          </div>
          <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">
            Pending
          </span>
        </div>

        {/* Map Preview */}
        <div className="mb-3 h-32 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg relative overflow-hidden border border-gray-200">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Old location (grey) */}
            <div className="absolute top-6 left-6">
              <MapPin className="w-5 h-5 text-gray-400 fill-gray-200" />
              <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">Old</div>
            </div>

            {/* New location (blue) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <MapPin className="w-6 h-6 text-blue-600 fill-blue-200" />
              <div className="text-xs text-blue-600 mt-0.5 whitespace-nowrap">New</div>
            </div>

            {/* Distance badge */}
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur rounded-md px-2 py-1">
              <div className="text-xs text-gray-700 font-medium">{distanceMoved}m moved</div>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">GPS Accuracy:</span>
            <span className="text-gray-900">{update.gpsAccuracy}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">New Address:</span>
            <span className="text-gray-900 text-right flex-1 ml-2">{update.proposedAddress}</span>
          </div>
          {update.proofPhoto && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Proof Photo:</span>
              <button className="text-blue-600 hover:underline">{update.proofPhoto}</button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('approve')}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => handleAction('request_changes')}
            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAction('reject')}
            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* View Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-3 text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
        >
          View technical details
          <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>

        {/* Technical Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Request ID:</span>
              <span className="text-gray-900 font-mono">{update.requestId}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Dealer ID:</span>
              <span className="text-gray-900 font-mono">{update.dealerCode}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Old Coordinates:</span>
              <span className="text-gray-900 font-mono text-xs">
                {update.previousLat.toFixed(6)}, {update.previousLong.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">New Coordinates:</span>
              <span className="text-gray-900 font-mono text-xs">
                {update.proposedLat.toFixed(6)}, {update.proposedLong.toFixed(6)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  actionType === 'approve'
                    ? 'bg-green-100'
                    : actionType === 'reject'
                    ? 'bg-red-100'
                    : 'bg-amber-100'
                }`}>
                  {actionType === 'approve' && <CheckCircle className="w-8 h-8 text-green-600" />}
                  {actionType === 'reject' && <XCircle className="w-8 h-8 text-red-600" />}
                  {actionType === 'request_changes' && <MessageSquare className="w-8 h-8 text-amber-600" />}
                </div>
                
                <h3 className="text-lg text-gray-900 mb-2">
                  {actionType === 'approve' && 'Approve Location Update'}
                  {actionType === 'reject' && 'Reject Location Update'}
                  {actionType === 'request_changes' && 'Request Changes'}
                </h3>
                
                <p className="text-sm text-gray-500">
                  {update.dealerName} • {update.dealerCode}
                </p>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm text-gray-700 mb-2">
                  Comment {actionType !== 'approve' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? 'Optional: Add approval note...'
                      : actionType === 'reject'
                      ? 'Required: Reason for rejection...'
                      : 'Required: What needs to be changed...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-3 mb-6 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Distance moved:</span>
                  <span className="text-gray-900">{distanceMoved}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">GPS Accuracy:</span>
                  <span className="text-gray-900">{update.gpsAccuracy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Requested by:</span>
                  <span className="text-gray-900">{update.requestedBy}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setComment('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAction}
                  disabled={actionType !== 'approve' && !comment.trim()}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    actionType === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : actionType === 'reject'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  } ${
                    actionType !== 'approve' && !comment.trim()
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {actionType === 'approve' && 'Approve'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'request_changes' && 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
