/**
 * PHASE 6 — UNIFIED FILTER CONTEXT
 *
 * Manages filter state across the entire app with:
 *   - Per-scope isolation (activity, admin, leads, dealers, visits)
 *   - URL search param persistence (replaceState, popstate)
 *   - Derived time range via resolveTimePeriodToRange()
 *   - Memoized selectors to prevent unnecessary re-renders
 *
 * Usage:
 *   const { state, setFilter, resetFilters, derivedTimeRange } = useFilterScope('leads');
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { TimePeriod, type TimeResolvedRange } from '../lib/domain/constants';
import { resolveTimePeriodToRange } from '../lib/time/resolveTimePeriod';

// ============================================================================
// CANONICAL FILTER STATE
// ============================================================================

export interface FilterState {
  time?: TimePeriod;
  customRange?: { fromISO: string; toISO: string };
  region?: string[];
  tl?: string[];
  status?: string[]
  channel?: string[];
  dealerCategory?: string[];
  leadType?: string[];
  search?: string;
  // Admin single-select contract
  time_period?: TimePeriod;
  region_id?: string | null;
  tl_id?: string | null;
}

/** All scopes that can hold independent filter state */
export type FilterScope =
  | 'activity'
  | 'admin_home'
  | 'admin_dealers'
  | 'admin_leads'
  | 'admin_activity'
  | 'admin_dcf'
  | 'leads'
  | 'dealers'
  | 'visits';

/** Defaults per scope */
const SCOPE_DEFAULTS: Record<FilterScope, FilterState> = {
  activity: { time: TimePeriod.TODAY },
  admin_home: { time: TimePeriod.MTD },
  admin_dealers: { time: TimePeriod.MTD },
  admin_leads: { time: TimePeriod.MTD },
  admin_activity: { time: TimePeriod.MTD },
  admin_dcf: { time: TimePeriod.MTD },
  leads: { time: TimePeriod.MTD },
  dealers: {},
  visits: { time: TimePeriod.TODAY },
};

// ============================================================================
// URL SERIALIZATION
// ============================================================================

const PARAM_KEY_MAP: Record<string, string> = {
  time: 'time',
  region: 'region',
  tl: 'tl',
  status: 'status',
  channel: 'channel',
  dealerCategory: 'cat',
  leadType: 'ltype',
  search: 'q',
  time_period: 'time_period',
  region_id: 'region_id',
  tl_id: 'tl_id',
};

function serializeToURL(scope: FilterScope, state: FilterState): void {
  // Safety check for preview environments
  if (typeof window === 'undefined' || !window.location || !window.history) return;
  
  try {
    const params = new URLSearchParams(window.location.search);

    // Clear all filter params (only filter keys, preserve others)
    Object.values(PARAM_KEY_MAP).forEach(k => params.delete(k));
    params.delete('scope');

    // Set scope
    params.set('scope', scope);

    // Serialize non-default values
    const defaults = SCOPE_DEFAULTS[scope];

    if (state.time && state.time !== defaults.time) {
      params.set(PARAM_KEY_MAP.time, state.time);
    }
    if (state.region && state.region.length > 0) {
      params.set(PARAM_KEY_MAP.region, state.region.join(','));
    }
    if (state.tl && state.tl.length > 0) {
      params.set(PARAM_KEY_MAP.tl, state.tl.join(','));
    }
    if (state.status && state.status.length > 0) {
      params.set(PARAM_KEY_MAP.status, state.status.join(','));
    }
    if (state.channel && state.channel.length > 0) {
      params.set(PARAM_KEY_MAP.channel, state.channel.join(','));
    }
    if (state.dealerCategory && state.dealerCategory.length > 0) {
      params.set(PARAM_KEY_MAP.dealerCategory, state.dealerCategory.join(','));
    }
    if (state.leadType && state.leadType.length > 0) {
      params.set(PARAM_KEY_MAP.leadType, state.leadType.join(','));
    }
    if (state.search) {
      params.set(PARAM_KEY_MAP.search, state.search);
    }

    // Admin single-select contract
    if (state.time_period) {
      params.set(PARAM_KEY_MAP.time_period, state.time_period);
    }
    if (state.region_id) {
      params.set(PARAM_KEY_MAP.region_id, state.region_id);
    }
    if (state.tl_id) {
      params.set(PARAM_KEY_MAP.tl_id, state.tl_id);
    }

    const qs = params.toString();
    const newURL = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({ scope, filterState: state }, '', newURL);
  } catch (err) {
    // Silently fail in environments where URL manipulation isn't supported
    console.warn('[FilterContext] URL serialization failed:', err);
  }
}

function deserializeFromURL(scope: FilterScope): FilterState | null {
  // Safety check for preview environments
  if (typeof window === 'undefined' || !window.location) return null;
  
  try {
    const params = new URLSearchParams(window.location.search);
    const urlScope = params.get('scope');
    if (urlScope !== scope) return null;

    const state: FilterState = { ...SCOPE_DEFAULTS[scope] };

    const time = params.get(PARAM_KEY_MAP.time);
    if (time && Object.values(TimePeriod).includes(time as TimePeriod)) {
      state.time = time as TimePeriod;
    }

    const region = params.get(PARAM_KEY_MAP.region);
    if (region) state.region = region.split(',').filter(Boolean);

    const tl = params.get(PARAM_KEY_MAP.tl);
    if (tl) state.tl = tl.split(',').filter(Boolean);

    const status = params.get(PARAM_KEY_MAP.status);
    if (status) state.status = status.split(',').filter(Boolean);

    const channel = params.get(PARAM_KEY_MAP.channel);
    if (channel) state.channel = channel.split(',').filter(Boolean);

    const cat = params.get(PARAM_KEY_MAP.dealerCategory);
    if (cat) state.dealerCategory = cat.split(',').filter(Boolean);

    const ltype = params.get(PARAM_KEY_MAP.leadType);
    if (ltype) state.leadType = ltype.split(',').filter(Boolean);

    const search = params.get(PARAM_KEY_MAP.search);
    if (search) state.search = search;

    // Admin single-select contract
    const time_period = params.get(PARAM_KEY_MAP.time_period);
    if (time_period && Object.values(TimePeriod).includes(time_period as TimePeriod)) {
      state.time_period = time_period as TimePeriod;
    }

    const region_id = params.get(PARAM_KEY_MAP.region_id);
    if (region_id) state.region_id = region_id;

    const tl_id = params.get(PARAM_KEY_MAP.tl_id);
    if (tl_id) state.tl_id = tl_id;

    return state;
  } catch (err) {
    // Silently fail in environments where URL reading isn't supported
    console.warn('[FilterContext] URL deserialization failed:', err);
    return null;
  }
}

// ============================================================================
// CONTEXT VALUE
// ============================================================================

interface ScopeAPI {
  state: FilterState;
  setFilter: (partial: Partial<FilterState>) => void;
  resetFilters: () => void;
  derivedTimeRange: TimeResolvedRange;
  activeFilterCount: number;
}

interface FilterContextValue {
  scopes: Record<FilterScope, FilterState>;
  setScopeFilter: (scope: FilterScope, partial: Partial<FilterState>) => void;
  resetScope: (scope: FilterScope) => void;
  resetAll: () => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function FilterProvider({ children }: { children: ReactNode }) {
  const [scopes, setScopes] = useState<Record<FilterScope, FilterState>>(() => {
    // Deep clone defaults
    const initial = {} as Record<FilterScope, FilterState>;
    for (const [scope, defaults] of Object.entries(SCOPE_DEFAULTS)) {
      initial[scope as FilterScope] = { ...defaults };
    }
    return initial;
  });

  // Popstate listener for back button
  useEffect(() => {
    // Safety check for environments without window
    if (typeof window === 'undefined') return;
    
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.scope && event.state?.filterState) {
        const scope = event.state.scope as FilterScope;
        setScopes(prev => ({
          ...prev,
          [scope]: event.state.filterState,
        }));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setScopeFilter = useCallback(
    (scope: FilterScope, partial: Partial<FilterState>) => {
      setScopes(prev => {
        const next = { ...prev[scope], ...partial };
        // Sync to URL
        serializeToURL(scope, next);
        return { ...prev, [scope]: next };
      });
    },
    [],
  );

  const resetScope = useCallback((scope: FilterScope) => {
    setScopes(prev => {
      const defaults = { ...SCOPE_DEFAULTS[scope] };
      serializeToURL(scope, defaults);
      return { ...prev, [scope]: defaults };
    });
  }, []);

  const resetAll = useCallback(() => {
    setScopes(() => {
      const fresh = {} as Record<FilterScope, FilterState>;
      for (const [scope, defaults] of Object.entries(SCOPE_DEFAULTS)) {
        fresh[scope as FilterScope] = { ...defaults };
      }
      // Clear URL (with safety check)
      if (typeof window !== 'undefined' && window.history) {
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch (err) {
          console.warn('[FilterContext] Failed to clear URL:', err);
        }
      }
      return fresh;
    });
  }, []);

  const value = useMemo<FilterContextValue>(
    () => ({ scopes, setScopeFilter, resetScope, resetAll }),
    [scopes, setScopeFilter, resetScope, resetAll],
  );

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Scoped filter hook — returns state + actions for a single scope.
 * Hydrates from URL on first mount for that scope.
 * 
 * Gracefully degrades to standalone local state when no FilterProvider
 * is in the tree (e.g., Figma preview isolation).
 */
export function useFilterScope(scope: FilterScope): ScopeAPI {
  const ctx = useContext(FilterContext);
  const hasProvider = ctx != null;

  // Standalone local state (always initialized to satisfy rules of hooks)
  const [localState, setLocalState] = useState<FilterState>(() => ({ ...SCOPE_DEFAULTS[scope] }));

  const hydrated = useRef(false);

  // Hydrate from URL once per scope mount (only when provider is available)
  useEffect(() => {
    if (!hasProvider || !ctx || hydrated.current) return;
    hydrated.current = true;
    const fromURL = deserializeFromURL(scope);
    if (fromURL) {
      ctx.setScopeFilter(scope, fromURL);
    } else {
      // Write current state to URL for this scope
      serializeToURL(scope, ctx.scopes[scope]);
    }
  }, [scope, hasProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve which state to use — context-backed or local
  const state = hasProvider && ctx?.scopes?.[scope] ? ctx.scopes[scope] : (localState ?? { ...SCOPE_DEFAULTS[scope] });

  const setFilter = useCallback(
    (partial: Partial<FilterState>) => {
      if (ctx) {
        ctx.setScopeFilter(scope, partial);
      } else {
        setLocalState(prev => ({ ...prev, ...partial }));
      }
    },
    [ctx, scope],
  );

  const resetFilters = useCallback(() => {
    if (ctx) {
      ctx.resetScope(scope);
    } else {
      setLocalState({ ...SCOPE_DEFAULTS[scope] });
    }
  }, [ctx, scope]);

  const derivedTimeRange = useMemo<TimeResolvedRange>(() => {
    const period = state.time ?? TimePeriod.MTD;
    try {
      return resolveTimePeriodToRange(
        period,
        new Date(),
        state.customRange?.fromISO,
        state.customRange?.toISO,
      );
    } catch {
      return resolveTimePeriodToRange(TimePeriod.MTD);
    }
  }, [state.time, state.customRange]);

  const activeFilterCount = useMemo(() => {
    const defaults = SCOPE_DEFAULTS[scope];
    let count = 0;
    if (state.time && state.time !== defaults.time) count++;
    if (state.region && state.region.length > 0) count++;
    if (state.tl && state.tl.length > 0) count++;
    if (state.status && state.status.length > 0) count++;
    if (state.channel && state.channel.length > 0) count++;
    if (state.dealerCategory && state.dealerCategory.length > 0) count++;
    if (state.leadType && state.leadType.length > 0) count++;
    if (state.search) count++;
    return count;
  }, [state, scope]);

  return useMemo(
    () => ({ state, setFilter, resetFilters, derivedTimeRange, activeFilterCount }),
    [state, setFilter, resetFilters, derivedTimeRange, activeFilterCount],
  );
}

/**
 * Low-level access to the raw FilterContext (for cross-scope operations).
 */
export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilterContext must be used within a FilterProvider');
  return ctx;
}

/**
 * Helper: Get scope defaults (for external comparisons).
 */
export function getFilterDefaults(scope: FilterScope): FilterState {
  return { ...SCOPE_DEFAULTS[scope] };
}