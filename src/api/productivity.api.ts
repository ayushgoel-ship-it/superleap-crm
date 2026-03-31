/**
 * PRODUCTIVITY API
 * 
 * Productivity metrics and tracking.
 * Uses real API via Edge Functions / Supabase REST.
 */

import { logger } from '../config/env';
import { http, ApiResponse } from './client';

/**
 * Productivity summary
 */
export interface ProductivitySummary {
  userId: string;
  date: string;
  totalCalls: number;
  productiveCalls: number;
  totalVisits: number;
  productiveVisits: number;
  dealersContacted: number;
  leadsGenerated: number;
  productivityScore: number;
}

/**
 * Fetch productivity summary
 */
export async function fetchProductivitySummary(params: {
  userId?: string;
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<ApiResponse<ProductivitySummary[]>> {
  try {
    logger.info('fetchProductivitySummary', params);
    const response = await http.get<ApiResponse<ProductivitySummary[]>>(
      '/productivity/summary',
      params
    );
    return response;
  } catch (error) {
    logger.error('fetchProductivitySummary failed', error);
    throw error;
  }
}

/**
 * Fetch productivity trend
 */
export async function fetchProductivityTrend(params: {
  userId?: string;
  tlId?: string;
  days: number;
}): Promise<ApiResponse<any[]>> {
  try {
    logger.info('fetchProductivityTrend', params);
    const response = await http.get<ApiResponse<any[]>>('/productivity/trend', params);
    return response;
  } catch (error) {
    logger.error('fetchProductivityTrend failed', error);
    throw error;
  }
}
