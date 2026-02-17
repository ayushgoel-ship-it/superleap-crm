import { ReactNode, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { isProfileComplete } from '../../lib/auth/authService';

interface RequireProfileCompleteProps {
  children: ReactNode;
  onIncomplete: () => void;
}

export function RequireProfileComplete({ children, onIncomplete }: RequireProfileCompleteProps) {
  const { profile } = useAuth();

  // Call onIncomplete in useEffect to avoid setState during render
  useEffect(() => {
    if (profile && !isProfileComplete(profile)) {
      onIncomplete();
    }
  }, [profile, onIncomplete]);

  if (profile && !isProfileComplete(profile)) {
    // Return loading state while redirect is happening
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Redirecting to complete profile...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}