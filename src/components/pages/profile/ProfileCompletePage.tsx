import { useState } from 'react';
import { User, Phone, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { updateProfile, getMockLocation } from '../../../lib/auth/authService';
import { toast } from 'sonner@2.0.3';

interface ProfileCompletePageProps {
  onComplete: () => void;
}

export function ProfileCompletePage({ onComplete }: ProfileCompletePageProps) {
  const { profile, refreshProfile } = useAuth();
  
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.homeAddress || '');
  const [lat, setLat] = useState(profile?.homeLat);
  const [lng, setLng] = useState(profile?.homeLng);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState('');

  const handleUseLocation = () => {
    setIsGettingLocation(true);
    // Simulate GPS delay
    setTimeout(() => {
      const location = getMockLocation();
      setAddress(location.address);
      setLat(location.lat);
      setLng(location.lng);
      setIsGettingLocation(false);
      toast.success('Location detected', {
        description: `Accuracy: ${location.accuracy}m`,
      });
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (phone.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        homeAddress: address.trim() || undefined,
        homeLat: lat,
        homeLng: lng,
      });
      
      refreshProfile();
      toast.success('Profile completed successfully!');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
            <p className="text-gray-600">Please provide the following details to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 h-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Home Address */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Home Address <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={isGettingLocation}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Navigation className={`w-3 h-3 ${isGettingLocation ? 'animate-pulse' : ''}`} />
                  {isGettingLocation ? 'Detecting...' : 'Use my location'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none"
                  placeholder="Enter your home address"
                />
              </div>
              {lat && lng && (
                <div className="mt-2 flex gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Lat: {lat.toFixed(4)}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Lng: {lng.toFixed(4)}
                  </span>
                  <span className="text-xs text-gray-500 px-2 py-1">📍 Location saved</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Location is simulated in prototype (GPS not active)
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : (
                'Save & Continue'
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              Fields marked with <span className="text-red-500">*</span> are required
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}