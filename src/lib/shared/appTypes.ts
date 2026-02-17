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

// Legacy PageView alias
export type PageView = Route;

// Navigation context types
export interface DealersFilterContext {
  channel?: BusinessChannel;
  status?: string;
  leadGiving?: boolean;
  dateRange?: string;
}

export interface LeadsFilterContext {
  channel?: BusinessChannel;
  dateRange?: string;
}
