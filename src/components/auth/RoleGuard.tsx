/**
 * RoleGuard — declarative permission gate (Wave 1A)
 *
 * Wrap any admin/TL page or section in <RoleGuard action="VIEW_ADMIN_SUMMARY">
 * to enforce permissions at render time. This closes AC-1 (admin pages that
 * previously called `getRuntimeDBSync()` with no role check) and gives us a
 * single place to log denied access attempts.
 *
 * USAGE
 * -----
 *   <RoleGuard action="VIEW_ADMIN_SUMMARY">
 *     <AdminHomePage />
 *   </RoleGuard>
 *
 *   <RoleGuard route="/admin/users">
 *     <AdminUsersPage />
 *   </RoleGuard>
 *
 * Either `action` or `route` may be specified (not both required). If both
 * are given, both must pass.
 *
 * On denial: renders a minimal "Access denied" card AND logs a PERMISSION_DENIED
 * audit event once per mount. The guard never throws — it degrades gracefully
 * so that a stray link can never crash the app.
 */
import { ComponentType, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import {
  canAccessRoute,
  canPerformAction,
  type ActionKey,
} from '../../auth/permissions';
import { logAuditEvent } from '../../auth/auditLog';

interface RoleGuardProps {
  children: ReactNode;
  action?: ActionKey;
  route?: string;
  /** Optional fallback UI. Defaults to a minimal denied card. */
  fallback?: ReactNode;
}

export function RoleGuard({ children, action, route, fallback }: RoleGuardProps) {
  const { profile, activeActor } = useAuth();
  const authRole = (profile?.role ?? null) as any;
  const activeRole = (activeActor?.role ?? null) as any;

  const allowedAction = action ? canPerformAction(authRole, activeRole, action) : true;
  const allowedRoute = route ? canAccessRoute(authRole, activeRole, route) : true;
  const allowed = allowedAction && allowedRoute;

  // Log denials exactly once per mount (avoids render-loop spam).
  const loggedRef = useRef(false);
  useEffect(() => {
    if (!allowed && !loggedRef.current) {
      loggedRef.current = true;
      try {
        logAuditEvent('PERMISSION_DENIED', {
          userId: activeActor?.userId || 'unknown',
          name: activeActor?.name || 'Unknown',
          role: activeRole || 'Unknown',
          action: action || 'ROUTE',
          route: route || undefined,
        });
      } catch {
        // Never let audit logging break rendering.
      }
    }
  }, [allowed, action, route, activeActor?.userId, activeActor?.name, activeRole]);

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
      <div className="text-sm font-semibold">Access denied</div>
      <div className="mt-1 text-xs text-rose-700">
        {activeRole || 'Your role'} is not authorized to {action ? `perform "${action}"` : `view ${route}`}.
      </div>
    </div>
  );
}

/**
 * Higher-order helper: wrap any component so it renders only when the
 * current actor has the given permission. Use at the import site in App.tsx
 * to enforce guards uniformly across mobile/desktop render branches.
 */
export function withRoleGuard<P extends object>(
  Comp: ComponentType<P>,
  action: ActionKey,
): ComponentType<P> {
  const Wrapped = (props: P) => (
    <RoleGuard action={action}>
      <Comp {...props} />
    </RoleGuard>
  );
  Wrapped.displayName = `withRoleGuard(${Comp.displayName || Comp.name || 'Component'})`;
  return Wrapped;
}
