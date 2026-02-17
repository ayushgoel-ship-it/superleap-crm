/**
 * CENTRALIZED ROUTE DEFINITIONS
 * 
 * Single source of truth for all app routes.
 * Import ROUTES from this file instead of using string literals.
 */

import { AppRoute } from '../lib/domain/constants';

/**
 * Route constants - use these throughout the app
 */
export const ROUTES = {
  // Auth
  AUTH_LOGIN: AppRoute.AUTH_LOGIN,
  AUTH_FORGOT_PASSWORD: AppRoute.AUTH_FORGOT_PASSWORD,
  
  // Profile
  PROFILE: AppRoute.PROFILE,
  PROFILE_COMPLETE: AppRoute.PROFILE_COMPLETE,
  
  // KAM/TL Pages
  HOME: AppRoute.HOME,
  DEALERS: AppRoute.DEALERS,
  LEADS: AppRoute.LEADS,
  LEAD_DETAIL: AppRoute.LEAD_DETAIL,
  LEAD_CREATE: AppRoute.LEAD_CREATE,
  VISITS: AppRoute.VISITS,
  NOTIFICATIONS: AppRoute.NOTIFICATIONS,
  /** @deprecated Unmounted — Phase 4.5 */
  VISIT_DETAIL: AppRoute.VISIT_DETAIL,
  /** @deprecated Unmounted — Phase 4.5 */
  CALL_DETAIL: AppRoute.CALL_DETAIL,
  /** @deprecated Unmounted — Phase 4.5 */
  TL_CALL_DETAIL: AppRoute.TL_CALL_DETAIL,
  DCF: AppRoute.DCF,
  DCF_DEALERS: AppRoute.DCF_DEALERS,
  DCF_LEADS: AppRoute.DCF_LEADS,
  DCF_DISBURSALS: AppRoute.DCF_DISBURSALS,
  DCF_DEALER_DETAIL: AppRoute.DCF_DEALER_DETAIL,
  DCF_LEAD_DETAIL: AppRoute.DCF_LEAD_DETAIL,
  DCF_ONBOARDING_DETAIL: AppRoute.DCF_ONBOARDING_DETAIL,
  DCF_ONBOARDING: AppRoute.DCF_ONBOARDING,
  /** @deprecated Unmounted — Phase 4.5 */
  DCF_ONBOARDING_FORM: AppRoute.DCF_ONBOARDING_FORM,
  PERFORMANCE: AppRoute.PERFORMANCE,
  PRODUCTIVITY: AppRoute.PRODUCTIVITY,
  LEADERBOARD: AppRoute.LEADERBOARD,
  INCENTIVE_SIMULATOR: AppRoute.INCENTIVE_SIMULATOR,
  CALL_FEEDBACK: AppRoute.CALL_FEEDBACK,
  VISIT_FEEDBACK: AppRoute.VISIT_FEEDBACK,
  /** @deprecated Unmounted — Phase 4.5 */
  VISIT_CHECKIN: AppRoute.VISIT_CHECKIN,
  
  // Navigation Detail Pages (no bottom nav)
  DEALER_LOCATION_UPDATE: AppRoute.DEALER_LOCATION_UPDATE,
  
  // Admin Pages
  ADMIN_HOME: AppRoute.ADMIN_HOME,
  ADMIN_DEALERS: AppRoute.ADMIN_DEALERS,
  ADMIN_LEADS: AppRoute.ADMIN_LEADS,
  ADMIN_VC: AppRoute.ADMIN_VC,
  ADMIN_DCF: AppRoute.ADMIN_DCF,
  ADMIN_DASHBOARD: AppRoute.ADMIN_DASHBOARD,
  ADMIN_TL_LEADERBOARD: AppRoute.ADMIN_TL_LEADERBOARD,
  ADMIN_TL_DETAIL: AppRoute.ADMIN_TL_DETAIL,
  
  // Demo Pages
  DEMO_LOCATION_UPDATE: AppRoute.DEMO_LOCATION_UPDATE,
  DEMO_VISIT_FEEDBACK: AppRoute.DEMO_VISIT_FEEDBACK,
} as const;

/**
 * Admin bottom-nav page subset — backward compatibility alias for Route.
 * @see ROUTES.ADMIN_HOME, ROUTES.ADMIN_DEALERS, ROUTES.ADMIN_LEADS, ROUTES.ADMIN_VC, ROUTES.ADMIN_DCF
 */
export type AdminPage = 'admin-home' | 'admin-dealers' | 'admin-leads' | 'admin-vc' | 'admin-dcf';

/**
 * Type for route values
 */
export type Route = typeof ROUTES[keyof typeof ROUTES];

/**
 * Type alias for backward compatibility
 */
export type { AppRoute };

/**
 * Helper to check if a string is a valid route
 */
export function isValidRoute(route: string): route is Route {
  return Object.values(ROUTES).includes(route as Route);
}

/**
 * Helper to check if a route is an admin route
 */
export function isAdminRoute(route: Route | string): boolean {
  const adminRoutes = [
    ROUTES.ADMIN_HOME,
    ROUTES.ADMIN_DEALERS,
    ROUTES.ADMIN_LEADS,
    ROUTES.ADMIN_VC,
    ROUTES.ADMIN_DCF,
    ROUTES.ADMIN_DASHBOARD,
    ROUTES.ADMIN_TL_LEADERBOARD,
    ROUTES.ADMIN_TL_DETAIL,
  ];
  return adminRoutes.includes(route as Route);
}

/**
 * Helper to check if a route is a DCF route
 */
export function isDCFRoute(route: Route | string): boolean {
  const dcfRoutes = [
    ROUTES.DCF,
    ROUTES.DCF_DEALERS,
    ROUTES.DCF_LEADS,
    ROUTES.DCF_DISBURSALS,
    ROUTES.DCF_DEALER_DETAIL,
    ROUTES.DCF_LEAD_DETAIL,
    ROUTES.DCF_ONBOARDING_DETAIL,
    ROUTES.DCF_ONBOARDING,
    ROUTES.DCF_ONBOARDING_FORM, // @deprecated but kept for backward compat
  ];
  return dcfRoutes.includes(route as Route);
}

/**
 * Helper to check if a route is an auth route
 */
export function isAuthRoute(route: Route | string): boolean {
  const authRoutes = [
    ROUTES.AUTH_LOGIN,
    ROUTES.AUTH_FORGOT_PASSWORD,
    ROUTES.PROFILE_COMPLETE,
  ];
  return authRoutes.includes(route as Route);
}