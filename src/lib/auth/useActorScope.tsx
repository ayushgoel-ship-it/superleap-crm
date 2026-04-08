/**
 * useActorScope — Role-aware data scoping for KAM, TL, Admin.
 *
 * Returns the effective KAM-id set that all page data should be filtered by,
 * plus the underlying team roster (for KAM filter dropdowns) and a setter
 * that narrows the scope to a single KAM.
 *
 *   - KAM:   kamIds = [self.userId], teamKamIds = [self.userId], locked = true
 *   - TL:    teamKamIds = getKAMsByTL(tl.userId), kamIds = kamFilter ? [kamFilter] : teamKamIds
 *   - Admin: teamKamIds = all KAMs, kamIds = kamFilter ? [kamFilter] : undefined (global)
 *
 * Pages should:
 *   1. read `effectiveKamIds` and pass it into MetricFilters / dealer selectors
 *   2. render <KAMFilter /> in their header (hidden for pure KAM)
 *   3. use `actorName` as the header label for the TL/KAM (never a raw userId)
 */
import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { getKAMsByTL, getAllKAMs, getTLById } from '../../data/selectors';

export type ActorRole = 'KAM' | 'TL' | 'Admin' | 'Other';

export interface ActorScopeValue {
  role: ActorRole;
  selfId: string;
  /** Display name — full_name from users/ORG, never a raw id. */
  actorName: string;
  /** Full team roster (KAMs) that this actor is allowed to see. */
  teamKams: { id: string; name: string }[];
  /** Currently selected KAM id for the overlay filter ("all" → no overlay). */
  kamFilter: string;
  setKamFilter: (kamId: string) => void;
  /**
   * Effective kamIds to filter data by. undefined means "no KAM filter"
   * (Admin global with no overlay). For TL/KAM this is always a concrete list.
   */
  effectiveKamIds: string[] | undefined;
}

const ActorScopeContext = createContext<ActorScopeValue | undefined>(undefined);

export function ActorScopeProvider({ children }: { children: ReactNode }) {
  const { activeActor } = useAuth();
  const [kamFilter, setKamFilter] = useState<string>('all');

  const rawRole = (activeActor?.role || '').toUpperCase();
  const role: ActorRole =
    rawRole === 'KAM' ? 'KAM' : rawRole === 'TL' ? 'TL' : rawRole === 'ADMIN' ? 'Admin' : 'Other';
  const selfId = activeActor?.userId || '';

  // Reset overlay whenever the active actor changes.
  useEffect(() => {
    setKamFilter('all');
  }, [selfId, role]);

  const value = useMemo<ActorScopeValue>(() => {
    let teamKams: { id: string; name: string }[] = [];
    let actorName = activeActor?.name || '';

    if (role === 'KAM') {
      teamKams = activeActor ? [{ id: selfId, name: activeActor.name }] : [];
    } else if (role === 'TL') {
      teamKams = getKAMsByTL(selfId).map((k) => ({ id: k.id, name: k.name }));
      const tl = getTLById(selfId);
      if (tl?.name) actorName = tl.name;
    } else if (role === 'Admin') {
      teamKams = getAllKAMs().map((k) => ({ id: k.id, name: k.name }));
    }

    let effectiveKamIds: string[] | undefined;
    if (role === 'KAM') {
      effectiveKamIds = [selfId];
    } else if (role === 'TL') {
      effectiveKamIds =
        kamFilter && kamFilter !== 'all' ? [kamFilter] : teamKams.map((k) => k.id);
    } else if (role === 'Admin') {
      effectiveKamIds = kamFilter && kamFilter !== 'all' ? [kamFilter] : undefined;
    } else {
      effectiveKamIds = [];
    }

    return {
      role,
      selfId,
      actorName,
      teamKams,
      kamFilter,
      setKamFilter,
      effectiveKamIds,
    };
  }, [role, selfId, activeActor, kamFilter]);

  return <ActorScopeContext.Provider value={value}>{children}</ActorScopeContext.Provider>;
}

export function useActorScope(): ActorScopeValue {
  const ctx = useContext(ActorScopeContext);
  if (!ctx) {
    // Safe fallback — allows unit tests / islands without the provider.
    return {
      role: 'Other',
      selfId: '',
      actorName: '',
      teamKams: [],
      kamFilter: 'all',
      setKamFilter: () => {},
      effectiveKamIds: undefined,
    };
  }
  return ctx;
}
