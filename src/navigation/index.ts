/**
 * NAVIGATION MODULE
 * 
 * Centralized navigation system for the app.
 * Import all navigation-related utilities from this file.
 */

// Routes
export { ROUTES, isValidRoute, isAdminRoute, isDCFRoute, isAuthRoute } from './routes';
export type { Route, AppRoute, AdminPage } from './routes';

// Role configuration
export { 
  ROLE_CONFIGS,
  getRoleConfig,
  getDefaultRoute,
  getBottomNavTabs,
  hasAccessToRoute,
  getActiveNavTab,
} from './roleConfig';
export type { NavTab, RoleConfig } from './roleConfig';

// Navigation helper
export {
  navigate,
  getRouteForRoleSwitch,
  shouldResetNavigationStack,
  NavigationParamBuilders,
} from './navigationHelper';
export type { NavigationParams, NavigationResult } from './navigationHelper';