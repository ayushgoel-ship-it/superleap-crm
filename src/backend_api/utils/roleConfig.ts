/**
 * Role-Based Access Configuration
 * Phase: 6B | Source: docs/API_CONTRACTS.md §0.4, DRD_DATA_RULEBOOK.md §8
 *
 * Defines how each role's queries are scoped.
 * The API server applies automatic scoping based on JWT claims:
 *   KAM  → sees only own data (kam_user_id = jwt.user_id)
 *   TL   → sees team data (tl_user_id = jwt.user_id)
 *   ADMIN → sees all data; can impersonate via X-Impersonate-User-Id header
 */

export type UserRole = 'KAM' | 'TL' | 'ADMIN';

export interface AuthContext {
  user_id: string;
  role: UserRole;
  team_id: string | null;
  name: string;
  region: string;
  // If admin is impersonating, this holds the impersonated user
  impersonating?: {
    user_id: string;
    role: UserRole;
    team_id: string | null;
  };
}

/**
 * Returns the effective user context (handles admin impersonation).
 */
export function getEffectiveContext(auth: AuthContext): AuthContext {
  if (auth.role === 'ADMIN' && auth.impersonating) {
    return {
      ...auth.impersonating,
      name: auth.name,
      region: auth.region,
    };
  }
  return auth;
}

/**
 * Mapping from role to dashboard_key.
 * Source: METRICS_CONFIG_SYSTEM.md §3
 */
export function dashboardKeyForRole(role: UserRole): string {
  switch (role) {
    case 'KAM': return 'kam_home';
    case 'TL': return 'tl_home';
    case 'ADMIN': return 'admin_home';
  }
}

/**
 * SQL WHERE clause fragments for role-based row filtering.
 *
 * These return the clause and the parameter value to bind.
 * Tables have different column names for the same concept:
 *   - leads, call_events, visit_events: kam_user_id, tl_user_id
 *   - dealers: kam_user_id, tl_user_id
 *   - notifications: user_id
 */
export interface RoleFilter {
  clause: string;      // e.g., "kam_user_id = $1"
  params: any[];       // e.g., ['kam-ncr-01']
  paramOffset: number; // how many params were added
}

export function roleFilterForTable(
  auth: AuthContext,
  table: 'leads' | 'dealers' | 'call_events' | 'visit_events' | 'dcf_leads' | 'notifications',
  paramIndex: number = 1
): RoleFilter {
  const effective = getEffectiveContext(auth);

  if (effective.role === 'ADMIN') {
    return { clause: '1=1', params: [], paramOffset: 0 };
  }

  if (table === 'notifications') {
    return {
      clause: `user_id = $${paramIndex}`,
      params: [effective.user_id],
      paramOffset: 1,
    };
  }

  if (effective.role === 'TL') {
    return {
      clause: `tl_user_id = $${paramIndex}`,
      params: [effective.user_id],
      paramOffset: 1,
    };
  }

  // KAM
  return {
    clause: `kam_user_id = $${paramIndex}`,
    params: [effective.user_id],
    paramOffset: 1,
  };
}
