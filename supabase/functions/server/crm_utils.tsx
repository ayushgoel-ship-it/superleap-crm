/**
 * CRM API — Shared Utilities (Deno/Supabase Edge Function)
 * Phase: 6D | Ported from: /backend_api/utils/*.ts
 *
 * Merged: timeScope, roleConfig, formatters, responseEnvelope
 * All pure functions — no DB access, no side effects (except response helpers).
 */

import type { Context } from "npm:hono";

// ============================================================================
// TIME SCOPE (from /backend_api/utils/timeScope.ts)
// ============================================================================

export interface DateRange {
  start_date: string; // ISO-8601 UTC timestamp
  end_date: string;   // ISO-8601 UTC timestamp
  month: string;      // 'YYYY-MM' for target lookups
}

export type TimeScope = "d-1" | "last-7d" | "mtd" | "last-30d" | "last-6m" | "lifetime";

const VALID_SCOPES: TimeScope[] = ["d-1", "last-7d", "mtd", "last-30d", "last-6m", "lifetime"];

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function nowInIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

function istMidnightToUTC(istDate: Date): string {
  const midnight = new Date(
    Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate())
  );
  midnight.setTime(midnight.getTime() - IST_OFFSET_MS);
  return midnight.toISOString();
}

function istEndOfDayToUTC(istDate: Date): string {
  const endOfDay = new Date(
    Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate(), 23, 59, 59, 999)
  );
  endOfDay.setTime(endOfDay.getTime() - IST_OFFSET_MS);
  return endOfDay.toISOString();
}

export function resolveTimeScope(scope?: string): DateRange {
  const validScope: TimeScope = VALID_SCOPES.includes(scope as TimeScope)
    ? (scope as TimeScope)
    : "mtd";

  const now = nowInIST();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  let startIST: Date;
  let endIST: Date = now;

  switch (validScope) {
    case "d-1": {
      startIST = new Date(Date.UTC(year, month, day - 1));
      endIST = new Date(Date.UTC(year, month, day - 1, 23, 59, 59));
      break;
    }
    case "last-7d":
      startIST = new Date(Date.UTC(year, month, day - 7));
      break;
    case "mtd":
      startIST = new Date(Date.UTC(year, month, 1));
      break;
    case "last-30d":
      startIST = new Date(Date.UTC(year, month, day - 30));
      break;
    case "last-6m":
      startIST = new Date(Date.UTC(year, month - 6, 1));
      break;
    case "lifetime":
      startIST = new Date(Date.UTC(2020, 0, 1));
      break;
    default:
      startIST = new Date(Date.UTC(year, month, 1));
  }

  return {
    start_date: istMidnightToUTC(startIST),
    end_date: istEndOfDayToUTC(endIST),
    month: monthStr,
  };
}

// ============================================================================
// ROLE CONFIG (from /backend_api/utils/roleConfig.ts)
// ============================================================================

export type UserRole = "KAM" | "TL" | "ADMIN";

export interface AuthContext {
  user_id: string;
  role: UserRole;
  team_id: string | null;
  name: string;
  region: string;
  impersonating?: {
    user_id: string;
    role: UserRole;
    team_id: string | null;
  };
}

export function getEffectiveContext(auth: AuthContext): AuthContext {
  if (auth.role === "ADMIN" && auth.impersonating) {
    return {
      ...auth.impersonating,
      name: auth.name,
      region: auth.region,
    };
  }
  return auth;
}

export function dashboardKeyForRole(role: UserRole): string {
  switch (role) {
    case "KAM":
      return "kam_home";
    case "TL":
      return "tl_home";
    case "ADMIN":
      return "admin_home";
  }
}

export interface RoleFilter {
  clause: string;
  params: unknown[];
  paramOffset: number;
}

export function roleFilterForTable(
  auth: AuthContext,
  table: "leads" | "dealers" | "call_events" | "visit_events" | "dcf_leads" | "notifications",
  paramIndex: number = 1
): RoleFilter {
  const effective = getEffectiveContext(auth);

  if (effective.role === "ADMIN") {
    return { clause: "1=1", params: [], paramOffset: 0 };
  }

  if (table === "notifications") {
    return {
      clause: `user_id = $${paramIndex}`,
      params: [effective.user_id],
      paramOffset: 1,
    };
  }

  if (effective.role === "TL") {
    return {
      clause: `tl_user_id = $${paramIndex}`,
      params: [effective.user_id],
      paramOffset: 1,
    };
  }

  // KAM
  return {
    clause: `kam_user_id = $${paramIndex}`,
    params: [effective.user_id],
    paramOffset: 1,
  };
}

// ============================================================================
// FORMATTERS (from /backend_api/utils/formatters.ts)
// ============================================================================

export function formatDuration(durationSec: number | null): string {
  if (durationSec == null || durationSec <= 0) return "0m 0s";
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}m ${seconds}s`;
}

export function formatCurrencyINR(amount: number | null): string {
  if (amount == null) return "0";
  return amount.toLocaleString("en-IN");
}

export function formatTimeIST(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export function daysOld(createdAt: string | null): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysSinceLabel(timestamp: string | null): string {
  if (!timestamp) return "Never";
  const days = daysOld(timestamp);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function computeRAG(
  value: number,
  thresholds: { green_min?: number; amber_min?: number } | null
): "green" | "amber" | "red" | null {
  if (!thresholds) return null;
  const { green_min, amber_min } = thresholds;
  if (green_min != null && value >= green_min) return "green";
  if (amber_min != null && value >= amber_min) return "amber";
  return "red";
}

// ============================================================================
// RESPONSE ENVELOPE (adapted from /backend_api/utils/responseEnvelope.ts for Hono)
// ============================================================================

interface Meta {
  timestamp: string;
  request_id: string;
  time_scope?: string;
  role?: string;
}

/**
 * Build a successful response envelope (for Hono c.json()).
 */
export function successEnvelope(
  data: unknown,
  extra?: { time_scope?: string; role?: string; request_id?: string }
) {
  const meta: Meta = {
    timestamp: new Date().toISOString(),
    request_id: extra?.request_id || `req-${Date.now()}`,
    ...(extra?.time_scope && { time_scope: extra.time_scope }),
    ...(extra?.role && { role: extra.role }),
  };

  return {
    success: true,
    data,
    meta,
    error: null,
  };
}

/**
 * Build an error response envelope (for Hono c.json()).
 */
export function errorEnvelope(
  code: string,
  message: string,
  extra?: { request_id?: string }
) {
  return {
    success: false,
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: extra?.request_id || `req-${Date.now()}`,
    },
    error: { code, message },
  };
}

/**
 * Pagination helpers.
 */
export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
}

export function buildPagination(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    page,
    page_size: pageSize,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: page < totalPages,
  };
}

export function parsePagination(query: Record<string, string>): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.page_size, 10) || 20));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}
