/**
 * DEALER LOCATION UPDATE PAGE
 * 
 * Allows KAM to update dealer location with following rules:
 * - First time: KAM can set directly
 * - Second time onwards: Requires TL approval
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner@2.0.3';
import { getDealerDTO } from '../../data/dtoSelectors';
import { useAuth } from '../auth/AuthProvider';
import { getCurrentPosition } from '../../lib/geo';

interface DealerLocationUpdatePageProps {
  dealerId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function DealerLocationUpdatePage({
  dealerId,
  onBack,
  onSuccess,
}: DealerLocationUpdatePageProps) {
  const { profile } = useAuth();
  const dealer = getDealerDTO(dealerId);

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');

  // Check if dealer has location set
  const hasExistingLocation = dealer?.latitude && dealer?.longitude;
  const requiresTLApproval = hasExistingLocation; // First time: direct, second time: TL approval

  useEffect(() => {
    if (hasExistingLocation && dealer) {
      setCurrentLocation({ lat: dealer.latitude!, lng: dealer.longitude! });
    }
  }, [dealerId]); // Only depend on dealerId, not the dealer object itself

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const position = await getCurrentPosition();
      setCurrentLocation(position);
      toast.success('Location captured successfully');
    } catch (error: any) {
      toast.error(error.message || 'Could not get your location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentLocation) {
      toast.error('Please capture location first');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      if (requiresTLApproval) {
        // Create location change request for TL approval
        toast.success('Location update request sent to Team Lead for approval', {
          description: 'You will be notified once approved',
        });
      } else {
        // Direct update (first time)
        toast.success('Dealer location updated successfully!');
      }

      // TODO: Save to centralized mock DB
      // if (requiresTLApproval) {
      //   createLocationChangeRequest(dealerId, currentLocation, address, profile.id);
      // } else {
      //   updateDealerLocation(dealerId, currentLocation, address);
      // }

      setIsSubmitting(false);
      onSuccess();
    }, 1500);
  };

  if (!dealer) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Dealer not found</p>
            <Button onClick={onBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg text-gray-900">Update Dealer Location</h1>
              <p className="text-sm text-gray-600">{dealer.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Info Banner */}
        {requiresTLApproval ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-1">TL Approval Required</p>
              <p className="text-sm text-amber-700">
                This dealer already has a location set. Any changes will require Team Lead approval
                before taking effect.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">First Time Location Setup</p>
              <p className="text-sm text-blue-700">
                This dealer doesn't have a location set. You can set it directly without approval.
              </p>
            </div>
          </div>
        )}

        {/* Current Location */}
        {hasExistingLocation && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Current Location</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {dealer.latitude?.toFixed(6)}, {dealer.longitude?.toFixed(6)}
                </span>
              </div>
              {dealer.city && (
                <p className="text-sm text-gray-600 ml-6">{dealer.city}</p>
              )}
            </div>
          </Card>
        )}

        {/* New Location */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {requiresTLApproval ? 'Proposed Location' : 'Dealer Location'}
          </h3>

          <div className="space-y-3">
            {/* Capture Location Button */}
            <Button
              onClick={handleGetCurrentLocation}
              disabled={isLoadingLocation}
              variant="outline"
              className="w-full"
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  {currentLocation && !hasExistingLocation
                    ? 'Refresh Location'
                    : 'Use Current Location'}
                </>
              )}
            </Button>

            {/* Location Display */}
            {currentLocation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 mb-1">Location Captured</p>
                    <p className="text-sm text-green-700">
                      Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Address */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Address (Optional)
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                placeholder="Enter dealer shop address for reference"
              />
            </div>

            {/* Google Maps Link (Optional) */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Google Maps Link (Optional)
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        </Card>

        {/* Guidelines */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Guidelines</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Ensure you are at the dealer's actual shop location before capturing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>This location will be used for visit check-in geo-fencing (200m radius)</span>
            </li>
            {requiresTLApproval && (
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Your Team Lead will review and approve this location change</span>
              </li>
            )}
          </ul>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <Button
          onClick={handleSubmit}
          disabled={!currentLocation || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : requiresTLApproval ? (
            'Submit for Approval'
          ) : (
            'Save Location'
          )}
        </Button>
      </div>
    </div>
  );
}