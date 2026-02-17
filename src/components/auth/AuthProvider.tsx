import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthSession, UserProfile, LoginCredentials, ImpersonationTarget } from '../../lib/auth/types';
import { 
  login as authLogin, 
  logout as authLogout, 
  getSession, 
  getCurrentUserProfile,
  initializeAuthData,
  setImpersonation as authSetImpersonation,
  clearImpersonation as authClearImpersonation,
  canImpersonate,
  isImpersonating,
  getActiveActorProfile
} from '../../lib/auth/authService';

interface AuthContextValue {
  session: AuthSession | null;
  profile: UserProfile | null; // Real authenticated user
  activeActor: { userId: string; name: string; role: string } | null; // Current viewing context (for impersonation)
  isLoading: boolean;
  isImpersonating: boolean;
  canImpersonate: boolean;
  login: (credentials: LoginCredentials) => Promise<{ session: AuthSession; profile: UserProfile }>;
  logout: () => void;
  refreshProfile: () => void;
  refreshSession: () => void;
  setImpersonation: (targetRole: 'KAM' | 'TL', targetActorId: string) => void;
  clearImpersonation: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeActor, setActiveActor] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth data and load session on mount
  useEffect(() => {
    initializeAuthData();
    loadSession();
  }, []);

  const loadSession = () => {
    const currentSession = getSession();
    const currentProfile = getCurrentUserProfile();
    
    // Safety: auto-clear impersonation state if the real user is not Admin
    if (currentSession && currentProfile && currentSession.activeActorId !== currentSession.userId) {
      const isAdmin = currentProfile.role === 'Admin' || currentProfile.role === 'ADMIN';
      if (!isAdmin) {
        // Non-admin user has stale impersonation data — clear it
        authClearImpersonation();
        const cleanSession = getSession();
        const cleanActiveActor = getActiveActorProfile();
        setSession(cleanSession);
        setProfile(currentProfile);
        setActiveActor(cleanActiveActor);
        setIsLoading(false);
        return;
      }
    }
    
    const currentActiveActor = getActiveActorProfile();
    
    setSession(currentSession);
    setProfile(currentProfile);
    setActiveActor(currentActiveActor);
    setIsLoading(false);
  };

  const login = async (credentials: LoginCredentials) => {
    const result = await authLogin(credentials);
    setSession(result.session);
    setProfile(result.profile);
    setActiveActor({ userId: result.profile.userId, name: result.profile.name, role: result.profile.role });
    return result;
  };

  const logout = () => {
    authLogout();
    setSession(null);
    setProfile(null);
    setActiveActor(null);
  };

  const refreshProfile = () => {
    const currentProfile = getCurrentUserProfile();
    setProfile(currentProfile);
  };

  const refreshSession = () => {
    loadSession();
  };

  const setImpersonationHandler = (targetRole: 'KAM' | 'TL', targetActorId: string) => {
    authSetImpersonation(targetRole, targetActorId);
    loadSession(); // Reload to get updated session
  };

  const clearImpersonationHandler = () => {
    authClearImpersonation();
    loadSession(); // Reload to get updated session
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      profile, 
      activeActor,
      isLoading, 
      isImpersonating: isImpersonating(),
      canImpersonate: canImpersonate(),
      login, 
      logout, 
      refreshProfile,
      refreshSession,
      setImpersonation: setImpersonationHandler,
      clearImpersonation: clearImpersonationHandler
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}