/**
 * Time Scope Resolver
 * Phase: 6B | Source: docs/DRD_DATA_RULEBOOK.md §0, API_CONTRACTS.md §0.3
 *
 * Converts time_scope strings into concrete UTC date ranges.
 * All date math is performed in IST (UTC+05:30), then converted to UTC
 * for database queries (P2: timestamps in UTC ISO-8601).
 */

export interface DateRange {
  start_date: string;  // ISO-8601 UTC timestamp
  end_date: string;    // ISO-8601 UTC timestamp
  month: string;       // 'YYYY-MM' for target lookups
}

/**
 * Supported time scopes (from API_CONTRACTS.md §0.3):
 *   d-1, last-7d, mtd (default), last-30d, last-6m, lifetime
 */
export type TimeScope = 'd-1' | 'last-7d' | 'mtd' | 'last-30d' | 'last-6m' | 'lifetime';

const VALID_SCOPES: TimeScope[] = ['d-1', 'last-7d', 'mtd', 'last-30d', 'last-6m', 'lifetime'];

/**
 * IST offset: UTC+05:30
 * We compute "today in IST" then convert boundaries to UTC.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function nowInIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

function istMidnightToUTC(istDate: Date): string {
  // Set to midnight IST, convert to UTC
  const midnight = new Date(
    Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate())
  );
  // IST midnight = UTC 18:30 previous day
  midnight.setTime(midnight.getTime() - IST_OFFSET_MS);
  return midnight.toISOString();
}

function istEndOfDayToUTC(istDate: Date): string {
  // Set to 23:59:59.999 IST, convert to UTC
  const endOfDay = new Date(
    Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate(), 23, 59, 59, 999)
  );
  endOfDay.setTime(endOfDay.getTime() - IST_OFFSET_MS);
  return endOfDay.toISOString();
}

export function resolveTimeScope(scope?: string): DateRange {
  const validScope: TimeScope = (VALID_SCOPES.includes(scope as TimeScope))
    ? scope as TimeScope
    : 'mtd';

  const now = nowInIST();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  let startIST: Date;
  let endIST: Date = now; // default: up to "now"

  switch (validScope) {
    case 'd-1': {
      // Yesterday in IST
      startIST = new Date(Date.UTC(year, month, day - 1));
      endIST = new Date(Date.UTC(year, month, day - 1, 23, 59, 59));
      break;
    }
    case 'last-7d': {
      startIST = new Date(Date.UTC(year, month, day - 7));
      break;
    }
    case 'mtd': {
      // First of current month in IST
      startIST = new Date(Date.UTC(year, month, 1));
      break;
    }
    case 'last-30d': {
      startIST = new Date(Date.UTC(year, month, day - 30));
      break;
    }
    case 'last-6m': {
      startIST = new Date(Date.UTC(year, month - 6, 1));
      break;
    }
    case 'lifetime': {
      // Far past
      startIST = new Date(Date.UTC(2020, 0, 1));
      break;
    }
    default: {
      startIST = new Date(Date.UTC(year, month, 1));
    }
  }

  return {
    start_date: istMidnightToUTC(startIST),
    end_date: istEndOfDayToUTC(endIST),
    month: monthStr,
  };
}

/**
 * Human-readable period label for API response.
 */
export function periodLabel(scope: string, dateRange: DateRange): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m] = dateRange.month.split('-');
  const monthName = monthNames[parseInt(m, 10) - 1];

  switch (scope) {
    case 'd-1': return 'Yesterday';
    case 'last-7d': return 'Last 7 Days';
    case 'mtd': return `${monthName} ${y} (MTD)`;
    case 'last-30d': return 'Last 30 Days';
    case 'last-6m': return 'Last 6 Months';
    case 'lifetime': return 'All Time';
    default: return `${monthName} ${y} (MTD)`;
  }
}
