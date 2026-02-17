/**
 * NAVIGATION HELPER
 * 
 * Provides centralized navigation logic with role-based access control.
 */

import { ROUTES, Route } from './routes';
import { hasAccessToRoute, getDefaultRoute } from './roleConfig';
import { UserRole } from '../lib/auth/types';

/**
 * Navigation parameters for different routes
 */
export interface NavigationParams {
  // Dealers params
  dealersFilter?: string | null;
  dealersContext?: string | null;
  dealersFilterContext?: any;
  
  // Leads params
  leadsFilterContext?: any;
  
  // DCF params
  dcfDealersFilterType?: 'onboarded' | 'leadGiving';
  dcfDealerId?: string;
  dcfLoanId?: string;
  dcfDateRange?: string;
  
  // Feedback params
  callId?: string;
  visitId?: string;
  feedbackOriginPage?: Route;
  
  // Admin params
  selectedTLId?: string;
}

/**
 * Navigation result
 */
export interface NavigationResult {
  /** Whether navigation was allowed */
  allowed: boolean;
  
  /** Target route (may be redirected if access denied) */
  targetRoute: Route;
  
  /** Reason if navigation was denied */
  reason?: string;
  
  /** Updated params */
  params?: NavigationParams;
}

/**
 * Navigate to a route with role-based access control
 * 
 * @param route - Target route
 * @param role - Current user role
 * @param params - Optional navigation parameters
 * @returns Navigation result with allowed status and target route
 */
export function navigate(
  route: Route | string,
  role: UserRole,
  params?: NavigationParams
): NavigationResult {
  // Check if user has access to this route
  if (!hasAccessToRoute(role, route)) {
    console.warn(`Access denied: ${role} cannot access route ${route}`);
    
    // Redirect to default home for this role
    const defaultRoute = getDefaultRoute(role);
    return {
      allowed: false,
      targetRoute: defaultRoute,
      reason: `Access denied to ${route}. Redirecting to ${defaultRoute}.`,
    };
  }
  
  // Navigation allowed
  return {
    allowed: true,
    targetRoute: route as Route,
    params,
  };
}

/**
 * Get default route for role switching
 * 
 * @param newRole - The role being switched to
 * @returns Default route for the new role
 */
export function getRouteForRoleSwitch(newRole: UserRole): Route {
  return getDefaultRoute(newRole);
}

/**
 * Check if navigation stack should be reset
 * 
 * @param oldRole - Previous role
 * @param newRole - New role
 * @returns Whether to reset navigation stack
 */
export function shouldResetNavigationStack(oldRole: UserRole, newRole: UserRole): boolean {
  // Always reset when switching between admin and non-admin
  if (oldRole === 'Admin' && newRole !== 'Admin') return true;
  if (oldRole !== 'Admin' && newRole === 'Admin') return true;
  
  // Reset when switching between KAM and TL (optional, can be removed if not needed)
  if (oldRole !== newRole) return true;
  
  return false;
}

/**
 * Helper to build navigation params for common scenarios
 */
export const NavigationParamBuilders = {
  /**
   * Build params for navigating to dealers page
   */
  dealers(filter?: string, context?: string, filterContext?: any): NavigationParams {
    return {
      dealersFilter: filter,
      dealersContext: context,
      dealersFilterContext: filterContext,
    };
  },
  
  /**
   * Build params for navigating to leads page
   */
  leads(filterContext?: any): NavigationParams {
    return {
      leadsFilterContext: filterContext,
    };
  },
  
  /**
   * Build params for navigating to DCF dealers page
   */
  dcfDealers(filterType: 'onboarded' | 'leadGiving'): NavigationParams {
    return {
      dcfDealersFilterType: filterType,
    };
  },
  
  /**
   * Build params for navigating to DCF dealer detail
   */
  dcfDealerDetail(dealerId: string): NavigationParams {
    return {
      dcfDealerId: dealerId,
    };
  },
  
  /**
   * Build params for navigating to DCF loan detail
   */
  dcfLoanDetail(loanId: string): NavigationParams {
    return {
      dcfLoanId: loanId,
    };
  },
  
  /**
   * Build params for navigating to call feedback
   */
  callFeedback(callId: string, originPage: Route): NavigationParams {
    return {
      callId,
      feedbackOriginPage: originPage,
    };
  },
  
  /**
   * Build params for navigating to visit feedback
   */
  visitFeedback(visitId: string, originPage: Route): NavigationParams {
    return {
      visitId,
      feedbackOriginPage: originPage,
    };
  },
  
  /**
   * Build params for navigating to TL detail
   */
  tlDetail(tlId: string): NavigationParams {
    return {
      selectedTLId: tlId,
    };
  },
};
