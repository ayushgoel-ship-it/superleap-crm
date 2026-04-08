/**
 * useKamScope — Single source of truth for KAM data scoping.
 *
 * Returns the KAM userId that the current view should be scoped to:
 *   - KAM role (or impersonating a KAM): returns the active actor's userId
 *   - TL / Admin / others: returns undefined (no KAM filter — full team/global rollup)
 *
 * Pages and selectors should pass this value as the `kamId` filter to ensure
 * a KAM only ever sees their own data, never global aggregates.
 */
import { useAuth } from '../../components/auth/AuthProvider';

export function useKamScope(): string | undefined {
  const { activeActor } = useAuth();
  if (!activeActor) return undefined;
  const role = (activeActor.role || '').toUpperCase();
  return role === 'KAM' ? activeActor.userId : undefined;
}
