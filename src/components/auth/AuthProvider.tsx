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
  getActiveActorProfile,
  cacheCurrentProfile,
  clearCachedProfile,
  signInWithGoogle as authSignInWithGoogle,
  hydrateSessionFromSupabase,
} from '../../lib/auth/authService';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner@2.0.3';

interface AuthContextValue {
  session: AuthSession | null;
  profile: UserProfile | null; // Real authenticated user
  activeActor: { userId: string; name: string; role: string } | null; // Current viewing context (for impersonation)
  isLoading: boolean;
  isImpersonating: boolean;
  canImpersonate: boolean;
  login: (credentials: LoginCredentials) => Promise<{ session: AuthSession; profile: UserProfile }>;
  signInWithGoogle: () => Promise<void>;
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

    // Listen for Supabase auth state changes — this fires after the
    // Google OAuth redirect lands back on the app with a session in the
    // URL hash. We hydrate the CRM profile (users table row) at that
    // point so the rest of the app sees a fully-formed AuthSession.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sbSession) => {
      if (event === 'SIGNED_IN' && sbSession) {
        // Skip if we already have a hydrated profile for this user (e.g.
        // password login already populated state).
        const existing = getSession();
        if (existing && existing.userId === sbSession.user.id && getCurrentUserProfile()) {
          return;
        }
        try {
          const hydrated = await hydrateSessionFromSupabase();
          if (hydrated) {
            cacheCurrentProfile(hydrated.profile);
            setSession(hydrated.session);
            setProfile(hydrated.profile);
            setActiveActor({
              userId: hydrated.profile.userId,
              name: hydrated.profile.name,
              role: hydrated.profile.role,
            });
            toast.success(`Welcome, ${hydrated.profile.name}!`);
          }
        } catch (err: any) {
          toast.error(err?.message || 'Sign-in failed');
          // Make sure we're fully signed out so the user lands back on the login page.
          await authLogout();
          clearCachedProfile();
          setSession(null);
          setProfile(null);
          setActiveActor(null);
        } finally {
          setIsLoading(false);
        }
      }
      if (event === 'SIGNED_OUT') {
        clearCachedProfile();
        setSession(null);
        setProfile(null);
        setActiveActor(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
    cacheCurrentProfile(result.profile);
    setSession(result.session);
    setProfile(result.profile);
    setActiveActor({ userId: result.profile.userId, name: result.profile.name, role: result.profile.role });
    return result;
  };

  const logout = () => {
    authLogout();
    clearCachedProfile();
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
      signInWithGoogle: authSignInWithGoogle,
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