import { useState, useRef } from 'react';
import { ArrowLeft, Camera, User, Phone, MapPin, Navigation, KeyRound, LogOut, Mail, Calculator, Palette } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { updateProfile, changePassword, getMockLocation } from '../../../lib/auth/authService';
import { toast } from 'sonner@2.0.3';

interface ProfilePageProps {
  onBack: () => void;
  onNavigateToIncentiveSimulator?: () => void;
  onNavigateToDesignSystem?: () => void;
}

export function ProfilePage({ onBack, onNavigateToIncentiveSimulator, onNavigateToDesignSystem }: ProfilePageProps) {
  const { profile, refreshProfile, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.homeAddress || '');
  const [lat, setLat] = useState(profile?.homeLat);
  const [lng, setLng] = useState(profile?.homeLng);
  const [photoUrl, setPhotoUrl] = useState(profile?.photoDataUrl || '');

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  if (!profile) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhotoUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseLocation = () => {
    setIsGettingLocation(true);
    setTimeout(() => {
      const location = getMockLocation();
      setAddress(location.address);
      setLat(location.lat);
      setLng(location.lng);
      setIsGettingLocation(false);
      toast.success('Location detected');
    }, 1500);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        name,
        phone,
        homeAddress: address,
        homeLat: lat,
        homeLng: lng,
        photoDataUrl: photoUrl,
      });
      refreshProfile();
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      toast.success('Logged out successfully');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg text-gray-900">My Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profile Header Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-gray-900">{profile.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded ${
                  profile.role === 'KAM' ? 'bg-blue-100 text-blue-700' :
                  profile.role === 'TL' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {profile.role}
                </span>
                {profile.city && (
                  <span className="text-xs text-gray-500">• {profile.city}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Email (Read-only) */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm text-gray-900">{profile.email}</div>
            </div>
            <span className="text-xs text-gray-400">Read-only</span>
          </div>
        </div>

        {/* Editable Fields */}
        {!isEditing ? (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-sm text-gray-900">{profile.phone || 'Not set'}</div>
                </div>
              </div>
              {profile.homeAddress && (
                <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Home Address</div>
                    <div className="text-sm text-gray-900">{profile.homeAddress}</div>
                    {profile.homeLat && profile.homeLng && (
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {profile.homeLat.toFixed(4)}, {profile.homeLng.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </>
        ) : (
          <>
            {/* Edit Mode */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Home Address</label>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    disabled={isGettingLocation}
                    className="text-xs text-blue-600 flex items-center gap-1"
                  >
                    <Navigation className={`w-3 h-3 ${isGettingLocation ? 'animate-pulse' : ''}`} />
                    {isGettingLocation ? 'Detecting...' : 'Use location'}
                  </button>
                </div>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}

        {/* Change Password */}
        {!showChangePassword ? (
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-5 h-5" />
            Change Password
          </button>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Incentive Simulator */}
        {onNavigateToIncentiveSimulator && (
          <button
            onClick={onNavigateToIncentiveSimulator}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5 text-blue-600" />
            <span>Incentive Simulator</span>
          </button>
        )}

        {/* Design System */}
        {onNavigateToDesignSystem && (
          <button
            onClick={onNavigateToDesignSystem}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Palette className="w-5 h-5 text-blue-600" />
            <span>Design System</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white border-2 border-red-200 text-red-600 py-3 rounded-lg font-medium hover:bg-red-50 flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        <div className="text-center text-xs text-gray-500 pb-4">
          Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}