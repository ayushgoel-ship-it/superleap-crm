/**
 * Formatters
 * Phase: 6B | Source: docs/DRD_DATA_RULEBOOK.md §6.3, §6.4
 *
 * Pure functions — no side effects, no DB access.
 */

/**
 * Format seconds into human-readable duration.
 * Rule (DRD §6.3): "{minutes}m {seconds}s"
 * NULL/0 → "0m 0s"
 */
export function formatDuration(durationSec: number | null): string {
  if (durationSec == null || durationSec <= 0) return '0m 0s';
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Format INR currency with Indian grouping (1,23,456).
 */
export function formatCurrencyINR(amount: number | null): string {
  if (amount == null) return '0';
  return amount.toLocaleString('en-IN');
}

/**
 * Compute call_time display from call_start_time ISO string.
 * Returns "HH:MM AM/PM" in IST.
 */
export function formatTimeIST(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  // Convert to IST (UTC+05:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/**
 * Compute days_old from created_at timestamp.
 */
export function daysOld(createdAt: string | null): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Compute "Today", "Yesterday", "3 days ago" etc from a timestamp.
 */
export function daysSinceLabel(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  const days = daysOld(timestamp);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/**
 * RAG color computation from value and thresholds.
 * Source: METRICS_CONFIG_SYSTEM.md — rag_thresholds JSON: {"green_min": N, "amber_min": N}
 */
export function computeRAG(
  value: number,
  thresholds: { green_min?: number; amber_min?: number } | null
): 'green' | 'amber' | 'red' | null {
  if (!thresholds) return null;
  const { green_min, amber_min } = thresholds;
  if (green_min != null && value >= green_min) return 'green';
  if (amber_min != null && value >= amber_min) return 'amber';
  return 'red';
}
