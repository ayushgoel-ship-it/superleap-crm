/**
 * ID Normalization Utilities
 *
 * Canonical ID format uses Supabase UUIDs for users (KAMs, TLs)
 * and integer dealer_code strings for dealers.
 *
 * These functions exist as a compatibility layer — they pass through
 * canonical IDs unchanged. No mock/legacy data dependency.
 */

export const normalizeDealerId = (id: string): string => id;
export const normalizeTLId = (id: string): string => id;
export const normalizeKAMId = (id: string): string => id;

/**
 * Generate an untagged dealer ID from phone number
 * Format: UT-<last10digits> to clearly distinguish from onboarded dealer codes
 */
export function makeUntaggedDealerId(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `UT-${digits}`;
}
