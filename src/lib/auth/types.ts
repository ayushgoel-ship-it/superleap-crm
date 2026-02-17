export type UserRole = "KAM" | "TL" | "Admin" | "ADMIN";

export interface UserProfile {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  photoDataUrl?: string; // base64 preview
  homeAddress?: string;
  homeLat?: number;
  homeLng?: number;
  city?: string; // User's home city
  passwordLastChangedAt?: string; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface AuthSession {
  userId: string;
  token: string; // mock token
  createdAt: string;
  // Active role and impersonation
  activeRole: UserRole; // What role UI is currently showing
  activeActorId: string; // Who is being impersonated (defaults to userId)
  // Rich impersonation metadata (set when impersonating, cleared when stopping)
  impersonation?: {
    targetActorId: string;
    targetName: string;
    targetRole: UserRole;
    startedAt: string; // ISO timestamp
  };
}

export interface ImpersonationTarget {
  userId: string;
  name: string;
  role: UserRole;
  city?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  homeAddress?: string;
  homeLat?: number;
  homeLng?: number;
  city?: string;
  photoDataUrl?: string;
}