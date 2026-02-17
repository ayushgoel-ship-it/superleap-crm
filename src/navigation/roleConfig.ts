/**
 * ROLE-BASED NAVIGATION CONFIGURATION
 * 
 * Defines bottom navigation tabs and accessible routes for each role.
 * Single source of truth for role-based routing.
 */

import { Home, Users, FileText, MapPin, IndianRupee, Phone, Activity } from 'lucide-react';
import { ROUTES, Route } from './routes';
import { UserRole } from '../lib/auth/types';

/**
 * Navigation tab definition
 */
export interface NavTab {
  id: Route;
  label: string;
  icon: typeof Home;
}

/**
 * Role configuration
 */
export interface RoleConfig {
  /** Default route when user logs in or switches to this role */
  defaultRoute: Route;
  
  /** Bottom navigation tabs for this role */
  bottomNavTabs: NavTab[];
  
  /** All routes accessible by this role (for access control) */
  accessibleRoutes: Route[];
}

/**
 * Admin role configuration (shared by both "Admin" and "ADMIN" keys)
 */
const ADMIN_ROLE_CONFIG: RoleConfig = {
  defaultRoute: ROUTES.ADMIN_HOME,
  bottomNavTabs: [
    { id: ROUTES.ADMIN_HOME, label: 'Home', icon: Home },
    { id: ROUTES.ADMIN_DEALERS, label: 'Dealers', icon: Users },
    { id: ROUTES.ADMIN_LEADS, label: 'Leads', icon: FileText },
    { id: ROUTES.ADMIN_VC, label: 'V/C', icon: Phone },
    { id: ROUTES.ADMIN_DCF, label: 'DCF', icon: IndianRupee },
  ],
  accessibleRoutes: [
    // Admin pages
    ROUTES.ADMIN_HOME,
    ROUTES.ADMIN_DEALERS,
    ROUTES.ADMIN_LEADS,
    ROUTES.ADMIN_VC,
    ROUTES.ADMIN_DCF,
    ROUTES.ADMIN_DASHBOARD,
    ROUTES.ADMIN_TL_LEADERBOARD,
    ROUTES.ADMIN_TL_DETAIL,
    
    // When impersonating, admin can access KAM/TL routes
    ROUTES.HOME,
    ROUTES.DEALERS,
    ROUTES.LEADS,
    ROUTES.VISITS,
    ROUTES.NOTIFICATIONS,
    ROUTES.LEAD_DETAIL,
    ROUTES.LEAD_CREATE,
    ROUTES.DEALER_LOCATION_UPDATE,
    ROUTES.DCF,
    ROUTES.DCF_DEALERS,
    ROUTES.DCF_LEADS,
    ROUTES.DCF_DISBURSALS,
    ROUTES.DCF_DEALER_DETAIL,
    ROUTES.DCF_LEAD_DETAIL,
    ROUTES.DCF_ONBOARDING_DETAIL,
    ROUTES.DCF_ONBOARDING,
    ROUTES.PERFORMANCE,
    ROUTES.PRODUCTIVITY,
    ROUTES.LEADERBOARD,
    ROUTES.INCENTIVE_SIMULATOR,
    ROUTES.CALL_FEEDBACK,
    ROUTES.VISIT_FEEDBACK,
    ROUTES.PROFILE,
    
    // Auth pages
    ROUTES.AUTH_LOGIN,
    ROUTES.AUTH_FORGOT_PASSWORD,
    ROUTES.PROFILE_COMPLETE,
    
    // Demo pages
    ROUTES.DEMO_LOCATION_UPDATE,
    ROUTES.DEMO_VISIT_FEEDBACK,
  ],
};

/**
 * Navigation configuration for each role
 */
export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  KAM: {
    defaultRoute: ROUTES.HOME,
    bottomNavTabs: [
      { id: ROUTES.HOME, label: 'Home', icon: Home },
      { id: ROUTES.DEALERS, label: 'Dealers', icon: Users },
      { id: ROUTES.LEADS, label: 'Leads', icon: FileText },
      { id: ROUTES.VISITS, label: 'Activity', icon: Activity },
      { id: ROUTES.DCF, label: 'DCF', icon: IndianRupee },
    ],
    accessibleRoutes: [
      // Core pages
      ROUTES.HOME,
      ROUTES.DEALERS,
      ROUTES.LEADS,
      ROUTES.VISITS,
      ROUTES.NOTIFICATIONS,
      
      // Detail / action pages (no bottom nav)
      ROUTES.LEAD_DETAIL,
      ROUTES.LEAD_CREATE,
      ROUTES.DEALER_LOCATION_UPDATE,
      
      // DCF pages
      ROUTES.DCF,
      ROUTES.DCF_DEALERS,
      ROUTES.DCF_LEADS,
      ROUTES.DCF_DISBURSALS,
      ROUTES.DCF_DEALER_DETAIL,
      ROUTES.DCF_LEAD_DETAIL,
      ROUTES.DCF_ONBOARDING_DETAIL,
      ROUTES.DCF_ONBOARDING,
      
      // Other pages
      ROUTES.PERFORMANCE,
      ROUTES.PRODUCTIVITY,
      ROUTES.LEADERBOARD,
      ROUTES.INCENTIVE_SIMULATOR,
      ROUTES.CALL_FEEDBACK,
      ROUTES.VISIT_FEEDBACK,
      ROUTES.PROFILE,
      
      // Auth pages (always accessible)
      ROUTES.AUTH_LOGIN,
      ROUTES.AUTH_FORGOT_PASSWORD,
      ROUTES.PROFILE_COMPLETE,
    ],
  },
  
  TL: {
    defaultRoute: ROUTES.HOME,
    bottomNavTabs: [
      { id: ROUTES.HOME, label: 'Home', icon: Home },
      { id: ROUTES.DEALERS, label: 'Dealers', icon: Users },
      { id: ROUTES.LEADS, label: 'Leads', icon: FileText },
      { id: ROUTES.VISITS, label: 'Activity', icon: Activity },
      { id: ROUTES.DCF, label: 'DCF', icon: IndianRupee },
    ],
    accessibleRoutes: [
      // Core pages (same as KAM)
      ROUTES.HOME,
      ROUTES.DEALERS,
      ROUTES.LEADS,
      ROUTES.VISITS,
      ROUTES.NOTIFICATIONS,
      
      // Detail / action pages (no bottom nav)
      ROUTES.LEAD_DETAIL,
      ROUTES.LEAD_CREATE,
      ROUTES.DEALER_LOCATION_UPDATE,
      
      // DCF pages
      ROUTES.DCF,
      ROUTES.DCF_DEALERS,
      ROUTES.DCF_LEADS,
      ROUTES.DCF_DISBURSALS,
      ROUTES.DCF_DEALER_DETAIL,
      ROUTES.DCF_LEAD_DETAIL,
      ROUTES.DCF_ONBOARDING_DETAIL,
      ROUTES.DCF_ONBOARDING,
      
      // Other pages
      ROUTES.PERFORMANCE,
      ROUTES.PRODUCTIVITY,
      ROUTES.LEADERBOARD,
      ROUTES.INCENTIVE_SIMULATOR,
      ROUTES.CALL_FEEDBACK,
      ROUTES.VISIT_FEEDBACK,
      ROUTES.PROFILE,
      
      // Auth pages (always accessible)
      ROUTES.AUTH_LOGIN,
      ROUTES.AUTH_FORGOT_PASSWORD,
      ROUTES.PROFILE_COMPLETE,
    ],
  },
  
  Admin: ADMIN_ROLE_CONFIG,

  // ADMIN alias — data/auth layer stores "ADMIN", UI layer normalizes to "Admin"
  ADMIN: ADMIN_ROLE_CONFIG,
};

/**
 * Get role configuration
 */
export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_CONFIGS[role];
}

/**
 * Get default route for a role
 */
export function getDefaultRoute(role: UserRole): Route {
  return ROLE_CONFIGS[role].defaultRoute;
}

/**
 * Get bottom nav tabs for a role
 */
export function getBottomNavTabs(role: UserRole): NavTab[] {
  return ROLE_CONFIGS[role].bottomNavTabs;
}

/**
 * Check if a role has access to a route
 */
export function hasAccessToRoute(role: UserRole, route: Route | string): boolean {
  const config = ROLE_CONFIGS[role];
  return config.accessibleRoutes.includes(route as Route);
}

/**
 * Check if a route should highlight a specific nav tab
 * For example, all DCF-related routes should highlight the DCF tab
 */
export function getActiveNavTab(currentRoute: Route | string): Route | null {
  // DCF routes all highlight the DCF tab
  if (currentRoute === ROUTES.DCF || 
      currentRoute === ROUTES.DCF_DEALERS || 
      currentRoute === ROUTES.DCF_LEADS || 
      currentRoute === ROUTES.DCF_DISBURSALS || 
      currentRoute === ROUTES.DCF_DEALER_DETAIL ||
      currentRoute === ROUTES.DCF_LEAD_DETAIL ||
      currentRoute === ROUTES.DCF_ONBOARDING_DETAIL ||
      currentRoute === ROUTES.DCF_ONBOARDING) {
    return ROUTES.DCF;
  }
  
  // Admin DCF route highlights admin DCF tab
  if (currentRoute === ROUTES.ADMIN_DCF) {
    return ROUTES.ADMIN_DCF;
  }
  
  // Most routes map directly to themselves
  return currentRoute as Route;
}