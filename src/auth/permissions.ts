/**
 * CENTRALIZED PERMISSION SYSTEM
 * 
 * Single source of truth for all permission checks.
 * No screen should implement its own permission rules.
 * 
 * Usage:
 *   canAccessRoute(authRole, activeRole, '/admin/home')
 *   canPerformAction(authRole, activeRole, 'IMPERSONATE')
 */

import { UserRole } from '../lib/auth/types';

/**
 * Action Keys - All permission-gated actions
 */
export type ActionKey =
  | 'IMPERSONATE'
  | 'APPROVE_LOCATION_CHANGE'
  | 'EDIT_DEALER_LOCATION'
  | 'VIEW_ADMIN_SUMMARY'
  | 'VIEW_TEAM_VC'
  | 'VIEW_AUDIT_LOG'
  | 'EXPORT_ADMIN_DATA'
  | 'EDIT_TARGETS'
  | 'VIEW_ALL_REGIONS'
  | 'OVERRIDE_PRODUCTIVITY'
  | 'MANAGE_USERS';

/**
 * Route Pattern - For route-based permission checks
 */
type RoutePattern = string; // e.g., '/admin/*', '/kam/*'

/**
 * Permission Rules Matrix
 */
const ROLE_PERMISSIONS: Record<UserRole, {
  actions: ActionKey[];
  routes: RoutePattern[];
}> = {
  KAM: {
    actions: [
      'EDIT_DEALER_LOCATION' // KAM can request location updates
    ],
    routes: [
      '/kam/*',
      '/dealers/*',
      '/leads/*',
      '/calls/*',
      '/visits/*',
      '/dcf/*',
      '/productivity',
      '/incentive',
      '/profile'
    ]
  },
  
  TL: {
    actions: [
      'APPROVE_LOCATION_CHANGE', // TL approves location updates
      'VIEW_TEAM_VC', // TL can view team visit coverage
      'OVERRIDE_PRODUCTIVITY' // TL can override productivity flags
    ],
    routes: [
      '/tl/*',
      '/kam/*', // TL can view KAM pages
      '/dealers/*',
      '/leads/*',
      '/calls/*',
      '/visits/*',
      '/dcf/*',
      '/productivity',
      '/incentive',
      '/profile'
    ]
  },
  
  Admin: {
    actions: [
      'IMPERSONATE',
      'APPROVE_LOCATION_CHANGE', // Admin can also approve
      'VIEW_ADMIN_SUMMARY',
      'VIEW_TEAM_VC',
      'VIEW_AUDIT_LOG',
      'EXPORT_ADMIN_DATA',
      'EDIT_TARGETS',
      'VIEW_ALL_REGIONS',
      'OVERRIDE_PRODUCTIVITY',
      'MANAGE_USERS'
    ],
    routes: [
      '/admin/*',
      '/tl/*', // Admin can view TL pages when impersonating
      '/kam/*', // Admin can view KAM pages when impersonating
      '/dealers/*',
      '/leads/*',
      '/calls/*',
      '/visits/*',
      '/dcf/*',
      '/productivity',
      '/incentive',
      '/profile'
    ]
  },

  // ADMIN alias — data layer may store "ADMIN", UI normalizes to "Admin"
  ADMIN: {
    actions: [
      'IMPERSONATE',
      'APPROVE_LOCATION_CHANGE',
      'VIEW_ADMIN_SUMMARY',
      'VIEW_TEAM_VC',
      'VIEW_AUDIT_LOG',
      'EXPORT_ADMIN_DATA',
      'EDIT_TARGETS',
      'VIEW_ALL_REGIONS',
      'OVERRIDE_PRODUCTIVITY',
      'MANAGE_USERS'
    ],
    routes: [
      '/admin/*',
      '/tl/*',
      '/kam/*',
      '/dealers/*',
      '/leads/*',
      '/calls/*',
      '/visits/*',
      '/dcf/*',
      '/productivity',
      '/incentive',
      '/profile'
    ]
  }
};

/**
 * Check if a role can access a route
 * 
 * @param authRole - The real user's role
 * @param activeRole - Current viewing role (may differ during impersonation)
 * @param route - Route to check (e.g., '/admin/home')
 * @returns true if access allowed
 */
export function canAccessRoute(
  authRole: UserRole | null,
  activeRole: UserRole | null,
  route: string
): boolean {
  if (!authRole || !activeRole) return false;
  
  // For impersonation: use activeRole permissions
  const effectiveRole = activeRole;
  const permissions = ROLE_PERMISSIONS[effectiveRole];
  
  if (!permissions) return false;
  
  // Check if route matches any allowed pattern
  return permissions.routes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return route.startsWith(prefix);
    }
    return route === pattern;
  });
}

/**
 * Check if a role can perform an action
 * 
 * @param authRole - The real user's role
 * @param activeRole - Current viewing role
 * @param action - Action key to check
 * @returns true if action allowed
 */
export function canPerformAction(
  authRole: UserRole | null,
  activeRole: UserRole | null,
  action: ActionKey
): boolean {
  if (!authRole || !activeRole) return false;
  
  // Special case: IMPERSONATE requires real Admin role (not impersonated)
  if (action === 'IMPERSONATE') {
    return authRole === 'Admin' || authRole === 'ADMIN';
  }
  
  // For other actions: use activeRole permissions
  const effectiveRole = activeRole;
  const permissions = ROLE_PERMISSIONS[effectiveRole];
  
  if (!permissions) return false;
  
  return permissions.actions.includes(action);
}

/**
 * Get allowed routes for a role
 */
export function getAllowedRoutes(role: UserRole): string[] {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.routes || [];
}

/**
 * Get allowed actions for a role
 */
export function getAllowedActions(role: UserRole): ActionKey[] {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.actions || [];
}

/**
 * Get default route for role after login
 */
export function getDefaultRoute(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    KAM: '/kam/home',
    TL: '/tl/home',
    Admin: '/admin/home'
  };
  return routes[role] || '/';
}

/**
 * Check if route is a role home route
 */
export function isRoleHomeRoute(route: string): boolean {
  return ['/kam/home', '/tl/home', '/admin/home'].includes(route);
}

/**
 * Get role from route
 */
export function getRoleFromRoute(route: string): UserRole | null {
  if (route.startsWith('/admin')) return 'Admin';
  if (route.startsWith('/tl')) return 'TL';
  if (route.startsWith('/kam')) return 'KAM';
  return null;
}

/**
 * Validate role transition (for impersonation)
 */
export function canTransitionToRole(
  fromRole: UserRole,
  toRole: UserRole
): boolean {
  // Only Admin can transition to other roles
  if (fromRole !== 'Admin') return false;
  
  // Admin can impersonate TL or KAM
  return toRole === 'TL' || toRole === 'KAM';
}

/**
 * Permission Guard - Throws error if not allowed
 */
export function assertCanAccessRoute(
  authRole: UserRole | null,
  activeRole: UserRole | null,
  route: string
): void {
  if (!canAccessRoute(authRole, activeRole, route)) {
    throw new Error(
      `Access denied: ${activeRole || 'Guest'} cannot access ${route}`
    );
  }
}

/**
 * Permission Guard - Throws error if action not allowed
 */
export function assertCanPerformAction(
  authRole: UserRole | null,
  activeRole: UserRole | null,
  action: ActionKey
): void {
  if (!canPerformAction(authRole, activeRole, action)) {
    throw new Error(
      `Action denied: ${activeRole || 'Guest'} cannot perform ${action}`
    );
  }
}

/**
 * Get permission explanation (for UI)
 */
export function getPermissionExplanation(
  role: UserRole,
  action: ActionKey
): string {
  const explanations: Record<ActionKey, Record<UserRole, string>> = {
    IMPERSONATE: {
      Admin: 'You can impersonate TL or KAM to view their perspective',
      TL: 'Only Admins can impersonate other users',
      KAM: 'Only Admins can impersonate other users'
    },
    APPROVE_LOCATION_CHANGE: {
      Admin: 'You can approve dealer location changes',
      TL: 'You can approve location change requests from your KAMs',
      KAM: 'Only TL or Admin can approve location changes'
    },
    EDIT_DEALER_LOCATION: {
      Admin: 'You can edit dealer locations',
      TL: 'TLs cannot directly edit locations - KAMs must request',
      KAM: 'You can request dealer location updates (requires TL approval)'
    },
    VIEW_ADMIN_SUMMARY: {
      Admin: 'You have full access to admin dashboards',
      TL: 'Only Admins can view organization-wide summaries',
      KAM: 'Only Admins can view organization-wide summaries'
    },
    VIEW_TEAM_VC: {
      Admin: 'You can view all team visit coverage data',
      TL: 'You can view visit coverage for your team',
      KAM: 'Only TL or Admin can view team visit coverage'
    },
    VIEW_AUDIT_LOG: {
      Admin: 'You can view the full audit log',
      TL: 'Only Admins can view audit logs',
      KAM: 'Only Admins can view audit logs'
    },
    EXPORT_ADMIN_DATA: {
      Admin: 'You can export admin-level data',
      TL: 'Only Admins can export organization data',
      KAM: 'Only Admins can export organization data'
    },
    EDIT_TARGETS: {
      Admin: 'You can edit targets for all users',
      TL: 'Only Admins can edit targets',
      KAM: 'Only Admins can edit targets'
    },
    VIEW_ALL_REGIONS: {
      Admin: 'You can view data for all regions',
      TL: 'TLs can only view their assigned region',
      KAM: 'KAMs can only view their assigned dealers'
    },
    OVERRIDE_PRODUCTIVITY: {
      Admin: 'You can override productivity flags',
      TL: 'You can override productivity flags for your team',
      KAM: 'Only TL or Admin can override productivity flags'
    },
    MANAGE_USERS: {
      Admin: 'You can manage user accounts',
      TL: 'Only Admins can manage users',
      KAM: 'Only Admins can manage users'
    }
  };
  
  return explanations[action]?.[role] || 'Permission not defined';
}