/**
 * ROUTE GUARD
 * 
 * Enforces route-based permissions.
 * Redirects unauthorized users to their home page.
 * Logs blocked attempts to audit log.
 */

import { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { canAccessRoute, getDefaultRoute } from '../../auth/permissions';
import { logAuditEvent } from '../../auth/auditLog';
import { toast } from 'sonner@2.0.3';
import { Shield } from 'lucide-react';

interface RouteGuardProps {
  children: ReactNode;
  requiredRole?: 'KAM' | 'TL' | 'Admin';
  allowedRoles?: Array<'KAM' | 'TL' | 'Admin'>;
}

/**
 * RouteGuard - Protects routes based on role
 */
export function RouteGuard({ children, requiredRole, allowedRoles }: RouteGuardProps) {
  const { authUser, authRole, activeRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (isLoading) return;
    
    // Check authentication
    if (!authUser || !authRole) {
      toast.error('Please log in to continue');
      navigate('/login', { replace: true });
      return;
    }
    
    // Check specific required role
    if (requiredRole && activeRole !== requiredRole) {
      handleUnauthorized();
      return;
    }
    
    // Check allowed roles list
    if (allowedRoles && !allowedRoles.includes(activeRole!)) {
      handleUnauthorized();
      return;
    }
    
    // Check route access
    if (!canAccessRoute(authRole, activeRole, location.pathname)) {
      handleUnauthorized();
      return;
    }
  }, [authUser, authRole, activeRole, isLoading, location.pathname]);
  
  const handleUnauthorized = () => {
    // Log audit event
    logAuditEvent('ROUTE_BLOCKED', {
      userId: authUser?.userId,
      name: authUser?.name,
      role: activeRole,
      route: location.pathname,
      timestamp: new Date().toISOString()
    });
    
    // Show error
    toast.error(`Access denied: ${activeRole}s cannot access this page`);
    
    // Redirect to home
    const defaultRoute = getDefaultRoute(activeRole!);
    navigate(defaultRoute, { replace: true });
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show unauthorized state (brief, before redirect)
  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Unauthorized - Redirecting...</p>
        </div>
      </div>
    );
  }
  
  // Render protected content
  return <>{children}</>;
}

/**
 * Admin-only route guard
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiredRole="Admin">{children}</RouteGuard>;
}

/**
 * TL-only route guard
 */
export function TLRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiredRole="TL">{children}</RouteGuard>;
}

/**
 * KAM-only route guard
 */
export function KAMRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiredRole="KAM">{children}</RouteGuard>;
}

/**
 * TL or Admin route guard
 */
export function TLOrAdminRoute({ children }: { children: ReactNode }) {
  return <RouteGuard allowedRoles={['TL', 'Admin']}>{children}</RouteGuard>;
}