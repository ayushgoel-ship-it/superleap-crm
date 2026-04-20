/**
 * useKamScope — DEPRECATED in Wave 1A. Prefer `useActorScope()`.
 *
 * This hook returns a KAM userId ONLY when the current actor is a KAM
 * (real or impersonated). For TL / Admin it returns undefined, which the
 * caller must interpret as "no KAM-level filter" — which is correct ONLY
 * when the caller also applies a TL-team filter via `useActorScope().kamIds`.
 *
 * The legacy risk (documented in AC-2) is that pages which relied on this
 * hook alone fell through to unfiltered selectors under TL impersonation.
 * The fix is to migrate pages to `useActorScope()` and pass both `kamId`
 * and `kamIds` to selectors. New code MUST use `useActorScope()`.
 */
import { useActorScope } from './useActorScope';

export function useKamScope(): string | undefined {
  const scope = useActorScope();
  if (scope.role === 'KAM' && scope.effectiveKamIds && scope.effectiveKamIds.length === 1) {
    return scope.effectiveKamIds[0];
  }
  return undefined;
}
