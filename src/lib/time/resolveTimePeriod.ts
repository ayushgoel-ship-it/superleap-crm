/**
 * CANONICAL TIME PERIOD RESOLVER
 * Phase 3 — Single source of truth for converting TimePeriod → concrete date range.
 *
 * Timezone: All date math uses LOCAL timezone (IST for CARS24).
 * Semantics: fromISO is inclusive, toISO is exclusive (start of next boundary).
 *
 * Usage:
 *   import { resolveTimePeriodToRange } from '../lib/time/resolveTimePeriod';
 *   const { fromISO, toISO } = resolveTimePeriodToRange(TimePeriod.MTD);
 */

import { TimePeriod, type TimeResolvedRange } from '../domain/constants';

// ── Helpers ──

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfNextDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function firstOfNextMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function firstOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1);
}

function toISO(d: Date): string {
  return d.toISOString();
}

// ── Main Resolver ──

/**
 * Resolve a TimePeriod enum value to a concrete [fromISO, toISO) date range.
 *
 * @param period   - The canonical TimePeriod value.
 * @param now      - Override "now" for testing. Defaults to `new Date()`.
 * @param customFrom - ISO string for CUSTOM start (required when period === CUSTOM).
 * @param customTo   - ISO string for CUSTOM end (required when period === CUSTOM).
 *
 * @returns TimeResolvedRange with fromISO (inclusive) and toISO (exclusive).
 * @throws  Error if CUSTOM is selected without valid from/to.
 */
export function resolveTimePeriodToRange(
  period: TimePeriod,
  now: Date = new Date(),
  customFrom?: string,
  customTo?: string,
): TimeResolvedRange {
  const today = startOfDay(now);
  const tomorrow = startOfNextDay(now);

  switch (period) {
    case TimePeriod.TODAY:
      return { fromISO: toISO(today), toISO: toISO(tomorrow) };

    case TimePeriod.D_MINUS_1: {
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      return { fromISO: toISO(yesterday), toISO: toISO(today) };
    }

    case TimePeriod.LAST_7D: {
      const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      return { fromISO: toISO(from), toISO: toISO(tomorrow) };
    }

    case TimePeriod.LAST_30D: {
      const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
      return { fromISO: toISO(from), toISO: toISO(tomorrow) };
    }

    case TimePeriod.MTD:
      return { fromISO: toISO(firstOfMonth(today)), toISO: toISO(tomorrow) };

    case TimePeriod.LMTD: {
      // Last-month-to-date: same day-of-month in previous month, up to that day (exclusive).
      // e.g. If today is Feb 13, LMTD = Jan 1 → Jan 14 (exclusive) = Jan 1..Jan 13.
      const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevMonthSameDay = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() + 1);
      return { fromISO: toISO(prevMonthStart), toISO: toISO(prevMonthSameDay) };
    }

    case TimePeriod.LAST_MONTH: {
      const prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { fromISO: toISO(prevStart), toISO: toISO(firstOfMonth(today)) };
    }

    case TimePeriod.QTD:
      return { fromISO: toISO(firstOfQuarter(today)), toISO: toISO(tomorrow) };

    case TimePeriod.LAST_6M: {
      const from = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      return { fromISO: toISO(from), toISO: toISO(tomorrow) };
    }

    case TimePeriod.LIFETIME:
      return { fromISO: toISO(new Date(2020, 0, 1)), toISO: toISO(tomorrow) };

    case TimePeriod.CUSTOM: {
      if (!customFrom || !customTo) {
        throw new Error('TimePeriod.CUSTOM requires both customFrom and customTo ISO strings.');
      }
      const from = new Date(customFrom);
      const to = new Date(customTo);
      if (from > to) {
        throw new Error(`Custom range invalid: from (${customFrom}) is after to (${customTo}).`);
      }
      return { fromISO: from.toISOString(), toISO: to.toISOString() };
    }

    default: {
      // Fallback to MTD
      console.warn(`[resolveTimePeriodToRange] Unknown period "${period}", falling back to MTD.`);
      return { fromISO: toISO(firstOfMonth(today)), toISO: toISO(tomorrow) };
    }
  }
}

// ── Cutoff helper (returns ms timestamp for simple client-side filtering) ──

/**
 * Returns a millisecond timestamp cutoff for client-side array filtering.
 * Items with date >= cutoff are "in range".
 * Useful for mock-data screens that don't query a real DB.
 */
export function getTimePeriodCutoffMs(
  period: TimePeriod,
  now: Date = new Date(),
): number {
  const { fromISO } = resolveTimePeriodToRange(period, now);
  return new Date(fromISO).getTime();
}

// ── Label Map ──

/**
 * Default human-readable labels for each TimePeriod.
 * Screens can override individual labels via TimeFilterControl's `labelOverrides` prop.
 */
export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  [TimePeriod.TODAY]: 'Today',
  [TimePeriod.D_MINUS_1]: 'D-1',
  [TimePeriod.MTD]: 'MTD',
  [TimePeriod.LMTD]: 'LMTD',
  [TimePeriod.LAST_MONTH]: 'Last Month',
  [TimePeriod.LAST_7D]: 'Last 7D',
  [TimePeriod.LAST_30D]: 'Last 30D',
  [TimePeriod.LAST_6M]: 'Last 6M',
  [TimePeriod.LIFETIME]: 'Lifetime',
  [TimePeriod.QTD]: 'QTD',
  [TimePeriod.CUSTOM]: 'Custom',
};

// ── Admin Mock Scaling ──

/**
 * Time-period scaling factors relative to MTD (baseline = 1.0).
 * Moved here from adminFilterHelpers.ts for centralization.
 * Used by admin pages to scale mock metrics by selected time period.
 *
 * D-1:        daily rate (~1/15 of MTD for mid-month)
 * LMTD:       ~90% of current MTD (last-month-to-date comparison)
 * Last Month: ~108% of MTD (full month completed)
 */
const TIME_MULTIPLIERS: Partial<Record<TimePeriod, number>> = {
  [TimePeriod.D_MINUS_1]: 0.065,
  [TimePeriod.MTD]: 1.0,
  [TimePeriod.LMTD]: 0.90,
  [TimePeriod.LAST_MONTH]: 1.08,
  [TimePeriod.TODAY]: 0.065,
  [TimePeriod.LAST_7D]: 0.45,
  [TimePeriod.LAST_30D]: 1.0,
  [TimePeriod.QTD]: 2.8,
  [TimePeriod.LAST_6M]: 6.0,
  [TimePeriod.LIFETIME]: 12.0,
};

export function getTimeMultiplier(period: TimePeriod): number {
  return TIME_MULTIPLIERS[period] ?? 1.0;
}
