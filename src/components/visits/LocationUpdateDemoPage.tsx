import { useState } from 'react';
import { TLLocationApprovalCard } from './TLLocationApprovalCard';
import { DealerLocationHistory } from './DealerLocationHistory';
import { ChevronLeft, MapPin, History } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Mock data for location update requests
const mockLocationUpdateRequests = [
  {
    requestId: 'LOC-REQ-10291',
    dealerId: 'GGN-001',
    dealerName: 'Gupta Auto World',
    dealerCode: 'GGN-001',
    requestedBy: 'Rajesh Kumar',
    role: 'KAM',
    previousLat: 28.459500,
    previousLong: 77.026600,
    proposedLat: 28.460800,
    proposedLong: 77.027900,
    proposedAddress: 'Near IFFCO Chowk, Gurugram, Haryana 122002',
    timestamp: '04 Dec 2025, 11:10',
    status: 'Pending' as const,
    gpsAccuracy: '±9m',
    proofPhoto: 'shop_front.jpg',
  },
];

// Mock dealer location history
const mockLocationHistory = [
  {
    id: '3',
    source: 'Manual Update',
    changedBy: 'Rajesh Kumar',
    role: 'KAM',
    previousLat: 28.459500,
    previousLong: 77.026600,
    newLat: 28.460800,
    newLong: 77.027900,
    newAddress: 'Near IFFCO Chowk, Gurugram, Haryana 122002',
    status: 'Approved' as const,
    approvedBy: 'Anil Verma (TL)',
    timestamp: '04 Dec 2025 11:22',
    gpsAccuracy: '±9m',
    comment: 'Location verified via photo',
    distanceMoved: 190,
  },
  {
    id: '2',
    source: 'Manual Update',
    changedBy: 'Rajesh Kumar',
    role: 'KAM',
    previousLat: 28.458100,
    previousLong: 77.024900,
    newLat: 28.459500,
    newLong: 77.026600,
    newAddress: 'Sector 29, MG Road, Gurugram, Haryana 122001',
    status: 'Auto-approved' as const,
    approvedBy: 'System',
    timestamp: '03 Dec 2025 16:20',
    gpsAccuracy: '±12m',
    comment: 'First manual correction',
    distanceMoved: 180,
  },
  {
    id: '1',
    source: 'Dealer Onboarding',
    newLat: 28.458100,
    newLong: 77.024900,
    newAddress: 'Sector 29, MG Road, Gurugram, Haryana 122001',
    status: 'Original' as const,
    timestamp: '01 Nov 2024',
  },
];

export function LocationUpdateDemoPage() {
  const [activeView, setActiveView] = useState<'tl_notifications' | 'location_history'>('tl_notifications');
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [requests, setRequests] = useState(mockLocationUpdateRequests);

  const handleApprove = (requestId: string, comment?: string) => {
    setRequests(requests.filter(r => r.requestId !== requestId));
    toast.success('Location update approved');
  };

  const handleReject = (requestId: string, comment: string) => {
    setRequests(requests.filter(r => r.requestId !== requestId));
    toast.error('Location update rejected');
  };

  const handleRequestChanges = (requestId: string, comment: string) => {
    setRequests(requests.filter(r => r.requestId !== requestId));
    toast.info('Change request sent to KAM');
  };

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <h1 className="text-lg text-gray-900">Location Updates</h1>
              <div className="text-sm text-gray-500">TL Anil Verma</div>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('tl_notifications')}
              className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                activeView === 'tl_notifications'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setActiveView('location_history')}
              className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                activeView === 'location_history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeView === 'tl_notifications' && (
            <>
              {requests.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-900">Pending Approval Requests</h3>
                    <div className="text-xs text-gray-500">{requests.length} pending</div>
                  </div>

                  {requests.map((request) => (
                    <TLLocationApprovalCard
                      key={request.requestId}
                      update={request}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onRequestChanges={handleRequestChanges}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-gray-500 mb-2">No pending approval requests</div>
                  <div className="text-sm text-gray-400">
                    Location update requests will appear here
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-xs text-blue-900">
                <div className="font-medium mb-2">Approval Guidelines:</div>
                <div>• Verify GPS accuracy is within acceptable range (±15m)</div>
                <div>• Check proof photo matches dealer shop front</div>
                <div>• Distance moved should be reasonable (&lt;500m typical)</div>
                <div>• All updates are permanently audited</div>
              </div>
            </>
          )}

          {activeView === 'location_history' && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-900">Location Change History</h3>
                  <button
                    onClick={() => setShowLocationHistory(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <History className="w-3 h-3" />
                    View full history
                  </button>
                </div>

                {/* Dealer Cards with Location History Summary */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-gray-900 mb-1">Gupta Auto World</h4>
                      <div className="text-xs text-gray-500">GGN-001 • Gurugram</div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">
                      Top Dealer
                    </span>
                  </div>

                  {/* Location Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Total Updates</div>
                      <div className="text-lg text-gray-900">2</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Auto-approved</div>
                      <div className="text-lg text-green-600">1</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">TL Approved</div>
                      <div className="text-lg text-blue-600">1</div>
                    </div>
                  </div>

                  {/* Current Location */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="text-xs text-blue-700 mb-1">Current Location</div>
                    <div className="text-sm text-blue-900 font-mono mb-1">
                      28.460800, 77.027900
                    </div>
                    <div className="text-xs text-blue-700">
                      Near IFFCO Chowk, Gurugram, Haryana 122002
                    </div>
                  </div>

                  {/* Last Update */}
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <span>Last updated:</span>
                    <span className="text-gray-900">04 Dec 2025 by Rajesh Kumar</span>
                  </div>

                  <button
                    onClick={() => setShowLocationHistory(true)}
                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    View Location History
                  </button>
                </div>

                {/* Safety Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1 text-xs text-amber-900">
                  <div className="font-medium mb-2">Safety & Guardrails:</div>
                  <div>• Each dealer allows only one auto-approved location correction</div>
                  <div>• Further changes require TL approval</div>
                  <div>• All updates are audited with GPS and timestamps</div>
                  <div>• Abuse may result in escalation to Admin</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Location History Modal */}
      {showLocationHistory && (
        <DealerLocationHistory
          dealerId="GGN-001"
          dealerName="Gupta Auto World"
          dealerCode="GGN-001"
          history={mockLocationHistory}
          onClose={() => setShowLocationHistory(false)}
        />
      )}
    </>
  );
}