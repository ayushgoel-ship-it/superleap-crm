/**
 * PRODUCTIVITY API
 * 
 * Productivity metrics and tracking.
 * Currently uses mock data, ready to swap to real API.
 */

import { ENV, logger } from '../config/env';
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
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('fetchProductivitySummary (MOCK)', params);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Mock data
      const mockData: ProductivitySummary[] = [
        {
          userId: params.userId || 'kam-ncr-01',
          date: '2024-02-05',
          totalCalls: 12,
          productiveCalls: 8,
          totalVisits: 5,
          productiveVisits: 4,
          dealersContacted: 8,
          leadsGenerated: 3,
          productivityScore: 75
        }
      ];
      
      return {
        success: true,
        data: mockData
      };
    }
    
    // Production mode
    logger.info('fetchProductivitySummary (API)', params);
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
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('fetchProductivityTrend (MOCK)', params);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: []
      };
    }
    
    // Production mode
    logger.info('fetchProductivityTrend (API)', params);
    const response = await http.get<ApiResponse<any[]>>('/productivity/trend', params);
    return response;
    
  } catch (error) {
    logger.error('fetchProductivityTrend failed', error);
    throw error;
  }
}
