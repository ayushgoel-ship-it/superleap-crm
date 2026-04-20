/**
 * Shared App Types — Extracted from App.tsx to break circular imports
 *
 * Components must import these types from HERE (not from App.tsx)
 * to avoid circular dependency chains.
 */

import type { Route } from '../../navigation';
import type { BusinessChannel } from '../domain/constants';

// Re-export UserRole from canonical source
export type { UserRole } from '../auth/types';

// Legacy PageView alias.
// Intentionally widened to `Route | string` so in-flight route strings
// (e.g. feature-flagged / auth flow routes) compile while we finish
// migrating every call-site to the ROUTES constants.
// Tracked in TS_STRICT_DEBT.md — tighten back to `Route` once burn-down
// is complete.
// eslint-disable-next-line @typescript-eslint/ban-types
export type PageView = Route | (string & {});

// Navigation context types
// `channel` accepts enum values OR the equivalent string literals for
// ergonomic call-sites — both resolve to the same BusinessChannel runtime value.
export interface DealersFilterContext {
  channel?: BusinessChannel | `${BusinessChannel}`;
  status?: string;
  leadGiving?: boolean;
  dateRange?: string;
}

export interface LeadsFilterContext {
  channel?: BusinessChannel | `${BusinessChannel}`;
  dateRange?: string;
}
