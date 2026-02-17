/**
 * TIME PERIOD TO DATE RANGE RESOLVER
 * 
 * Converts TimePeriod enum to {start_date, end_date} in ISO format
 * Used by Admin pages to filter data by time range
 * 
 * Supports:
 * - MTD: month-to-date
 * - LMTD: last-month-to-date (same day count as MTD but previous month)
 * - LM: full last calendar month
 * - L7D: last 7 days
 * - L30D: last 30 days
 * - D-1: yesterday only
 */

import { TimePeriod } from '../domain/constants';

export interface DateRange {
  start_date: string; // ISO date format YYYY-MM-DD
  end_date: string;   // ISO date format YYYY-MM-DD
}

/**
 * Get ISO date string for a Date object
 */
function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Resolve TimePeriod enum to concrete date range
 */
export function resolveTimePeriodToRange(period: TimePeriod | string = TimePeriod.MTD): DateRange {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  switch (period) {
    case TimePeriod.MTD: {
      // Month-to-date: 1st of current month to today
      const start = new Date(currentYear, currentMonth, 1);
      return {
        start_date: toISODate(start),
        end_date: toISODate(today),
      };
    }

    case TimePeriod.LMTD: {
      // Last-month-to-date: same day count as current MTD but in previous month
      const daysElapsed = currentDay;
      const lastMonth = currentMonth - 1;
      const lastMonthYear = lastMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = lastMonth < 0 ? 11 : lastMonth;
      
      const start = new Date(lastMonthYear, adjustedMonth, 1);
      const end = new Date(lastMonthYear, adjustedMonth, Math.min(daysElapsed, new Date(lastMonthYear, adjustedMonth + 1, 0).getDate()));
      
      return {
        start_date: toISODate(start),
        end_date: toISODate(end),
      };
    }

    case TimePeriod.LAST_MONTH: {
      // Full last calendar month
      const lastMonth = currentMonth - 1;
      const lastMonthYear = lastMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = lastMonth < 0 ? 11 : lastMonth;
      
      const start = new Date(lastMonthYear, adjustedMonth, 1);
      const end = new Date(lastMonthYear, adjustedMonth + 1, 0); // last day of month
      
      return {
        start_date: toISODate(start),
        end_date: toISODate(end),
      };
    }

    case TimePeriod.LAST_7D: {
      // Last 7 days (including today)
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      
      return {
        start_date: toISODate(start),
        end_date: toISODate(today),
      };
    }

    case TimePeriod.LAST_30D: {
      // Last 30 days (including today)
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      
      return {
        start_date: toISODate(start),
        end_date: toISODate(today),
      };
    }

    case TimePeriod.D_MINUS_1: {
      // Yesterday only
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      return {
        start_date: toISODate(yesterday),
        end_date: toISODate(yesterday),
      };
    }

    case TimePeriod.TODAY: {
      // Today only
      return {
        start_date: toISODate(today),
        end_date: toISODate(today),
      };
    }

    default:
      // Default to MTD
      const start = new Date(currentYear, currentMonth, 1);
      return {
        start_date: toISODate(start),
        end_date: toISODate(today),
      };
  }
}

/**
 * Get day count for a date range (inclusive)
 */
export function getDayCount(range: DateRange): number {
  const start = new Date(range.start_date);
  const end = new Date(range.end_date);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive
}

/**
 * Check if a date falls within a range
 */
export function isDateInRange(date: string | Date, range: DateRange): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const start = new Date(range.start_date);
  const end = new Date(range.end_date);
  return checkDate >= start && checkDate <= end;
}
