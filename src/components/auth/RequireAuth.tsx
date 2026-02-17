import { ReactNode, useEffect } from 'react';
import { useAuth } from './AuthProvider';

interface RequireAuthProps {
  children: ReactNode;
  onUnauthenticated: () => void;
}

export function RequireAuth({ children, onUnauthenticated }: RequireAuthProps) {
  const { session, isLoading } = useAuth();

  // Call onUnauthenticated in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && !session) {
      onUnauthenticated();
    }
  }, [isLoading, session, onUnauthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    // Return loading state while redirect is happening
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}