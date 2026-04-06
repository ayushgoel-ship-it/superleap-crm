import { AuthSession, LoginCredentials, PasswordResetRequest, ProfileUpdateData, UserProfile, UserRole } from './types';
import { getImpersonationTarget } from './impersonationTargets';
import { LS_SESSION_KEY } from './storage';
import { supabase } from '@/lib/supabase/client';

// ─── Initialize (no-op for Supabase Auth — session is managed by Supabase) ──
export function initializeAuthData() {
  // Supabase Auth manages sessions automatically via cookies/localStorage
  // No seed data initialization needed
}

// ─── Login via Supabase Auth ────────────────────────────────────────────────
export async function login(credentials: LoginCredentials): Promise<{ session: AuthSession; profile: UserProfile }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error || !data.session || !data.user) {
    throw new Error(error?.message || 'Login failed');
  }

  const user = data.user;

  // Fetch the user's profile from the users table
  const { data: userRow, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError || !userRow) {
    throw new Error('User profile not found in database. Please contact admin.');
  }

  const profile: UserProfile = {
    userId: user.id,
    role: (userRow.role || 'KAM') as UserRole,
    name: userRow.name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    phone: userRow.phone || '',
    city: userRow.city || '',
    mustResetPassword: !!userRow.must_reset_password,
    createdAt: user.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const session: AuthSession = {
    userId: user.id,
    token: data.session.access_token,
    createdAt: new Date().toISOString(),
    activeRole: profile.role,
    activeActorId: user.id,
  };

  // Cache session for sync access
  localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session));

  return { session, profile };
}

// ─── Logout ────────────────────────────────────────────────────────────────
export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem(LS_SESSION_KEY);
}

// ─── Get Current Session ──────────────────────────────────────────────────
export function getSession(): AuthSession | null {
  // First try cached session for sync access
  const cached = localStorage.getItem(LS_SESSION_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
}

// ─── Get Current User Profile ─────────────────────────────────────────────
export function getCurrentUserProfile(): UserProfile | null {
  const session = getSession();
  if (!session) return null;

  // Return a cached profile from the session
  // Full profile is loaded during login and stored in AuthProvider state
  // This sync accessor is used for quick checks
  const cached = localStorage.getItem('superleap_current_profile');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
}

// Cache profile for sync access (called by AuthProvider after login)
export function cacheCurrentProfile(profile: UserProfile) {
  localStorage.setItem('superleap_current_profile', JSON.stringify(profile));
}

export function clearCachedProfile() {
  localStorage.removeItem('superleap_current_profile');
}

// ─── Update Profile ─────────────────────────────────────────────────────────
export async function updateProfile(updates: ProfileUpdateData): Promise<UserProfile> {
  const session = getSession();
  if (!session) throw new Error('Not authenticated');

  // Update in users table
  const { error } = await supabase
    .from('users')
    .update({
      name: updates.name,
      phone: updates.phone,
      city: updates.city,
    })
    .eq('user_id', session.userId);

  if (error) throw new Error('Failed to update profile: ' + error.message);

  const currentProfile = getCurrentUserProfile();
  const updatedProfile: UserProfile = {
    ...currentProfile!,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  cacheCurrentProfile(updatedProfile);
  return updatedProfile;
}

// ─── Profile Completeness Check ─────────────────────────────────────────────
export function isProfileComplete(profile: UserProfile): boolean {
  return !!(profile.name && profile.phone);
}

// ─── Password Reset via OTP ─────────────────────────────────────────────────

/** Step 1 — send 6-digit OTP to email */
export async function sendPasswordResetOTP(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
}

/** Step 2 — verify OTP and establish session */
export async function verifyPasswordResetOTP(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) throw new Error(error.message);
}

/** Step 3 — set new password (requires active session from verifyPasswordResetOTP) */
export async function setNewPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  // Sign out so the user logs in fresh with the new password
  await supabase.auth.signOut();
  localStorage.removeItem(LS_SESSION_KEY);
}

/** Legacy — kept for any existing deep-links in email */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw new Error(error.message);
}

export async function confirmPasswordReset(request: PasswordResetRequest): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: request.newPassword,
  });
  if (error) throw new Error(error.message);
}

// ─── Change Password ────────────────────────────────────────────────────────
export async function changePassword(_currentPassword: string, newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message);

  // Update profile cache
  const profile = getCurrentUserProfile();
  if (profile) {
    profile.passwordLastChangedAt = new Date().toISOString();
    cacheCurrentProfile(profile);
  }
}

// ─── Location Helper (uses real browser geolocation) ────────────────────────
export function getMockLocation(): { lat: number; lng: number; address: string; accuracy: number } {
  // This returns a default location; real geolocation is handled by the visit flow
  return {
    lat: 28.4664,
    lng: 77.0283,
    address: 'Sector 29, MG Road, Gurugram, Haryana 122001',
    accuracy: 15,
  };
}

// ─── IMPERSONATION ──────────────────────────────────────────────────────────

export function canImpersonate(): boolean {
  const profile = getCurrentUserProfile();
  return profile?.role === 'Admin' || profile?.role === 'ADMIN';
}

export function getAllowedImpersonationRoles(): ('KAM' | 'TL')[] {
  const profile = getCurrentUserProfile();
  if (profile?.role === 'Admin' || profile?.role === 'ADMIN') {
    return ['KAM', 'TL'];
  }
  return [];
}

export function setImpersonation(targetRole: 'KAM' | 'TL', targetActorId: string): void {
  const session = getSession();
  if (!session) throw new Error('Not authenticated');

  const profile = getCurrentUserProfile();
  if (profile?.role !== 'Admin' && profile?.role !== 'ADMIN') {
    throw new Error('Only Admin can impersonate');
  }

  const target = getImpersonationTarget(targetActorId);

  const updatedSession: AuthSession = {
    ...session,
    activeRole: targetRole,
    activeActorId: targetActorId,
    impersonation: {
      targetActorId,
      targetName: target?.name || targetActorId,
      targetRole,
      startedAt: new Date().toISOString(),
    },
  };

  localStorage.setItem(LS_SESSION_KEY, JSON.stringify(updatedSession));
}

export function clearImpersonation(): void {
  const session = getSession();
  if (!session) return;

  const updatedSession: AuthSession = {
    ...session,
    activeRole: getCurrentUserProfile()?.role || 'KAM',
    activeActorId: session.userId,
    impersonation: undefined,
  };

  localStorage.setItem(LS_SESSION_KEY, JSON.stringify(updatedSession));
}

export function getActiveActorProfile(): { userId: string; name: string; role: string } | null {
  const session = getSession();
  if (!session) return null;

  if (session.activeActorId === session.userId) {
    const profile = getCurrentUserProfile();
    return profile ? { userId: profile.userId, name: profile.name, role: profile.role } : null;
  }

  const target = getImpersonationTarget(session.activeActorId);
  return target ? { userId: target.userId, name: target.name, role: target.role } : null;
}

export function isImpersonating(): boolean {
  const session = getSession();
  if (!session) return false;
  return session.activeActorId !== session.userId;
}