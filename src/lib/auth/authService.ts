import { AuthSession, LoginCredentials, PasswordResetRequest, ProfileUpdateData, UserProfile } from './types';
import { SEED_USERS } from './mockUsers';
import { getImpersonationTarget } from './impersonationTargets';
import { 
  LS_SESSION_KEY, 
  LS_PROFILE_KEY, 
  LS_PASSWORDS_KEY, 
  LS_RESET_KEY,
  LS_OTP_TIMESTAMP_KEY 
} from './storage';

// Initialize mock data on first load
export function initializeAuthData() {
  // Initialize passwords
  const passwords = localStorage.getItem(LS_PASSWORDS_KEY);
  if (!passwords) {
    const passwordMap: Record<string, string> = {};
    SEED_USERS.forEach(user => {
      passwordMap[user.email] = user.password;
    });
    localStorage.setItem(LS_PASSWORDS_KEY, JSON.stringify(passwordMap));
  }

  // Initialize profiles
  const profiles = localStorage.getItem(LS_PROFILE_KEY);
  if (!profiles) {
    const profileMap: Record<string, UserProfile> = {};
    SEED_USERS.forEach(user => {
      profileMap[user.userId] = {
        userId: user.userId,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        homeAddress: user.profileComplete ? getDefaultAddress(user.city || 'Gurugram') : undefined,
        homeLat: user.profileComplete ? getDefaultLat(user.city || 'Gurugram') : undefined,
        homeLng: user.profileComplete ? getDefaultLng(user.city || 'Gurugram') : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profileMap));
  }
}

function getDefaultAddress(city: string): string {
  const addresses: Record<string, string> = {
    'Gurugram': 'Sector 29, MG Road, Gurugram, Haryana 122001',
    'Delhi': 'Connaught Place, New Delhi, Delhi 110001',
    'Noida': 'Sector 18, Noida, Uttar Pradesh 201301',
  };
  return addresses[city] || addresses['Gurugram'];
}

function getDefaultLat(city: string): number {
  const lats: Record<string, number> = {
    'Gurugram': 28.4664,
    'Delhi': 28.6139,
    'Noida': 28.5706,
  };
  return lats[city] || lats['Gurugram'];
}

function getDefaultLng(city: string): number {
  const lngs: Record<string, number> = {
    'Gurugram': 77.0283,
    'Delhi': 77.2090,
    'Noida': 77.3272,
  };
  return lngs[city] || lngs['Gurugram'];
}

// Login
export async function login(credentials: LoginCredentials): Promise<{ session: AuthSession; profile: UserProfile }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const passwordMap = JSON.parse(localStorage.getItem(LS_PASSWORDS_KEY) || '{}');
  const profileMap = JSON.parse(localStorage.getItem(LS_PROFILE_KEY) || '{}');

  const storedPassword = passwordMap[credentials.email];
  if (!storedPassword || storedPassword !== credentials.password) {
    throw new Error('Invalid email or password');
  }

  // Find user
  const user = SEED_USERS.find(u => u.email === credentials.email);
  if (!user) {
    throw new Error('User not found');
  }

  const profile = profileMap[user.userId];
  if (!profile) {
    throw new Error('Profile not found');
  }

  // Create session
  const session: AuthSession = {
    userId: user.userId,
    token: `mock_token_${user.userId}_${Date.now()}`,
    createdAt: new Date().toISOString(),
    activeRole: profile.role, // Default to own role
    activeActorId: user.userId, // Default to self
  };

  // Store session
  localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session));

  return { session, profile };
}

// Logout
export function logout() {
  localStorage.removeItem(LS_SESSION_KEY);
}

// Get current session
export function getSession(): AuthSession | null {
  const sessionData = localStorage.getItem(LS_SESSION_KEY);
  if (!sessionData) return null;
  
  try {
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
}

// Get current user profile
export function getCurrentUserProfile(): UserProfile | null {
  const session = getSession();
  if (!session) return null;

  const profileMap = JSON.parse(localStorage.getItem(LS_PROFILE_KEY) || '{}');
  return profileMap[session.userId] || null;
}

// Update profile
export async function updateProfile(updates: ProfileUpdateData): Promise<UserProfile> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const session = getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const profileMap = JSON.parse(localStorage.getItem(LS_PROFILE_KEY) || '{}');
  const currentProfile = profileMap[session.userId];
  
  if (!currentProfile) {
    throw new Error('Profile not found');
  }

  const updatedProfile: UserProfile = {
    ...currentProfile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  profileMap[session.userId] = updatedProfile;
  localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profileMap));

  return updatedProfile;
}

// Check if profile is complete
export function isProfileComplete(profile: UserProfile): boolean {
  return !!(profile.name && profile.phone);
}

// Request password reset (generates OTP)
export async function requestPasswordReset(email: string): Promise<string> {
  // Check rate limiting (30 seconds)
  const lastOtpTime = localStorage.getItem(LS_OTP_TIMESTAMP_KEY);
  if (lastOtpTime) {
    const elapsed = Date.now() - parseInt(lastOtpTime, 10);
    if (elapsed < 30000) {
      const remaining = Math.ceil((30000 - elapsed) / 1000);
      throw new Error(`Please wait ${remaining} seconds before requesting another OTP`);
    }
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const passwordMap = JSON.parse(localStorage.getItem(LS_PASSWORDS_KEY) || '{}');
  if (!passwordMap[email]) {
    throw new Error('Email not found');
  }

  // Generate mock OTP
  const otp = '123456'; // Fixed for demo
  
  // Store reset state
  const resetState = {
    email,
    otp,
    expiresAt: Date.now() + 300000, // 5 minutes
  };
  localStorage.setItem(LS_RESET_KEY, JSON.stringify(resetState));
  localStorage.setItem(LS_OTP_TIMESTAMP_KEY, Date.now().toString());

  return otp;
}

// Confirm password reset
export async function confirmPasswordReset(request: PasswordResetRequest): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const resetState = JSON.parse(localStorage.getItem(LS_RESET_KEY) || '{}');
  
  if (!resetState.email || resetState.email !== request.email) {
    throw new Error('Invalid reset request');
  }

  if (resetState.otp !== request.otp) {
    throw new Error('Invalid OTP');
  }

  if (Date.now() > resetState.expiresAt) {
    throw new Error('OTP expired. Please request a new one');
  }

  // Update password
  const passwordMap = JSON.parse(localStorage.getItem(LS_PASSWORDS_KEY) || '{}');
  passwordMap[request.email] = request.newPassword;
  localStorage.setItem(LS_PASSWORDS_KEY, JSON.stringify(passwordMap));

  // Update passwordLastChangedAt in profile
  const profileMap = JSON.parse(localStorage.getItem(LS_PROFILE_KEY) || '{}');
  const user = SEED_USERS.find(u => u.email === request.email);
  if (user && profileMap[user.userId]) {
    profileMap[user.userId].passwordLastChangedAt = new Date().toISOString();
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profileMap));
  }

  // Clear reset state
  localStorage.removeItem(LS_RESET_KEY);
  localStorage.removeItem(LS_OTP_TIMESTAMP_KEY);
}

// Change password (while logged in)
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const session = getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const profile = getCurrentUserProfile();
  if (!profile) {
    throw new Error('Profile not found');
  }

  const passwordMap = JSON.parse(localStorage.getItem(LS_PASSWORDS_KEY) || '{}');
  
  if (passwordMap[profile.email] !== currentPassword) {
    throw new Error('Current password is incorrect');
  }

  passwordMap[profile.email] = newPassword;
  localStorage.setItem(LS_PASSWORDS_KEY, JSON.stringify(passwordMap));

  // Update passwordLastChangedAt
  const profileMap = JSON.parse(localStorage.getItem(LS_PROFILE_KEY) || '{}');
  if (profileMap[session.userId]) {
    profileMap[session.userId].passwordLastChangedAt = new Date().toISOString();
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profileMap));
  }
}

// Mock location helper
export function getMockLocation(): { lat: number; lng: number; address: string; accuracy: number } {
  return {
    lat: 28.4664,
    lng: 77.0283,
    address: 'Sector 29, MG Road, Gurugram, Haryana 122001',
    accuracy: 15, // meters
  };
}

// ==================== IMPERSONATION FUNCTIONS ====================

/**
 * Check if current user can impersonate (only Admin can)
 */
export function canImpersonate(): boolean {
  const profile = getCurrentUserProfile();
  return profile?.role === 'Admin' || profile?.role === 'ADMIN';
}

/**
 * Get what roles the current user can impersonate
 * KAM: none
 * TL: none
 * Admin: KAM, TL
 */
export function getAllowedImpersonationRoles(): ('KAM' | 'TL')[] {
  const profile = getCurrentUserProfile();
  if (profile?.role === 'Admin' || profile?.role === 'ADMIN') {
    return ['KAM', 'TL'];
  }
  return [];
}

/**
 * Set impersonation (Admin only)
 */
export function setImpersonation(targetRole: 'KAM' | 'TL', targetActorId: string): void {
  const session = getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const profile = getCurrentUserProfile();
  if (profile?.role !== 'Admin' && profile?.role !== 'ADMIN') {
    throw new Error('Only Admin can impersonate');
  }

  // Look up target name for richer impersonation state
  const target = getImpersonationTarget(targetActorId);

  // Update session with impersonation data
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

/**
 * Clear impersonation (back to own role)
 */
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

/**
 * Get active actor profile (for impersonation)
 */
export function getActiveActorProfile(): { userId: string; name: string; role: string } | null {
  const session = getSession();
  if (!session) return null;

  // If not impersonating, return own profile
  if (session.activeActorId === session.userId) {
    const profile = getCurrentUserProfile();
    return profile ? { userId: profile.userId, name: profile.name, role: profile.role } : null;
  }

  // If impersonating, look up from impersonation targets
  const target = getImpersonationTarget(session.activeActorId);
  
  return target ? { userId: target.userId, name: target.name, role: target.role } : null;
}

/**
 * Check if currently impersonating
 */
export function isImpersonating(): boolean {
  const session = getSession();
  if (!session) return false;
  return session.activeActorId !== session.userId;
}