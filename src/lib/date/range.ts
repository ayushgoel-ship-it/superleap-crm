/**
 * Canonical date-range predicate used by metric aggregators.
 *
 * Semantics: half-open [from, to) — matches `resolveTimePeriodToRange`
 * which already returns an exclusive upper bound.
 */
export function isDateInRange(
  dateStr: string | undefined | null,
  from: Date,
  to: Date,
): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d >= from && d < to;
}
