/**
 * prorateTarget — convert a monthly target to the equivalent target
 * for a chosen TimePeriod, by computing the *fraction of a 30-day month*
 * the selected period covers.
 *
 * Reasoning:
 *   • Targets in the system are stored as monthly numbers (per the
 *     `users.targets` / config layer). When the user filters the home
 *     page by "Last 7 days" or "Today" the numerator is recomputed
 *     against that range — the denominator must follow or the cards
 *     become meaningless (e.g. 5/30 instead of 5/7).
 *   • We use a canonical "monthDays" of 30 so the math is stable across
 *     calendar months. MTD prorates by *days elapsed* in the current
 *     month so a card on day 10 of a 30-day month shows target = 10.
 *   • Multi-month windows (L3M, L6M, QTD, Lifetime) multiply the
 *     monthly target by the number of months covered.
 *
 * Pure function — no side effects, safe to call inside render.
 */

import { TimePeriod } from '../domain/constants';
import { resolveTimePeriodToRange } from '../time/resolveTimePeriod';

const MONTH_DAYS = 30;
const MS_PER_DAY = 86_400_000;

export interface ProrateOptions {
  now?: Date;
  customFrom?: string;
  customTo?: string;
  rounding?: 'nearest' | 'ceil' | 'floor';
}

/** Fraction of a canonical 30-day month covered by the selected period. */
export function periodFraction(
  period: TimePeriod,
  opts: ProrateOptions = {},
): number {
  const now = opts.now ?? new Date();
  const { fromISO, toISO } = resolveTimePeriodToRange(
    period,
    now,
    opts.customFrom,
    opts.customTo,
  );
  const fromMs = new Date(fromISO).getTime();
  const toMs = new Date(toISO).getTime();
  const days = Math.max(0, (toMs - fromMs) / MS_PER_DAY);
  const fraction = days / MONTH_DAYS;
  return fraction > 0 ? fraction : 1 / MONTH_DAYS;
}

/**
 * Prorate a monthly target to the selected TimePeriod's equivalent.
 * Examples (monthlyTarget = 30):
 *   TODAY → 1, LAST_7D → 7, MTD day 10/30 → 10, LAST_MONTH → 30, LAST_3M → 90
 */
export function prorateTarget(
  monthlyTarget: number,
  period: TimePeriod,
  opts: ProrateOptions = {},
): number {
  if (!Number.isFinite(monthlyTarget) || monthlyTarget <= 0) return 0;
  const raw = monthlyTarget * periodFraction(period, opts);
  const rounded =
    opts.rounding === 'ceil'
      ? Math.ceil(raw)
      : opts.rounding === 'floor'
        ? Math.floor(raw)
        : Math.round(raw);
  return Math.max(1, rounded);
}
