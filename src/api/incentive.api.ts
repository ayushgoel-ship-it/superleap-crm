/**
 * INCENTIVE API
 * 
 * Incentive calculations and payouts.
 * Currently uses mock data, ready to swap to real API.
 */

import { ENV, logger } from '../config/env';
import { http, ApiResponse } from './client';
import { IncentiveResultDTO } from '../contracts/incentive.contract';

/**
 * Calculate incentive for user
 */
export async function calculateIncentive(params: {
  userId: string;
  month: string; // YYYY-MM format
}): Promise<ApiResponse<IncentiveResultDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('calculateIncentive (MOCK)', params);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Would use incentiveEngine in real implementation
      const mockResult: IncentiveResultDTO = {
        userId: params.userId,
        month: params.month,
        totalPayout: 45000,
        breakdown: {
          c2b: 15000,
          c2d: 12000,
          gs: 10000,
          dcf: 8000
        },
        targets: {
          c2b: { achieved: 12, target: 15, percentage: 80 },
          c2d: { achieved: 8, target: 10, percentage: 80 },
          gs: { achieved: 5, target: 8, percentage: 62.5 },
          dcf: { achieved: 3, target: 5, percentage: 60 }
        },
        calculatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: mockResult
      };
    }
    
    // Production mode
    logger.info('calculateIncentive (API)', params);
    const response = await http.post<ApiResponse<IncentiveResultDTO>>(
      '/incentives/calculate',
      params
    );
    return response;
    
  } catch (error) {
    logger.error('calculateIncentive failed', error);
    throw error;
  }
}

/**
 * Fetch incentive history
 */
export async function fetchIncentiveHistory(params: {
  userId: string;
  months?: number; // Last N months
}): Promise<ApiResponse<IncentiveResultDTO[]>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('fetchIncentiveHistory (MOCK)', params);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: []
      };
    }
    
    // Production mode
    logger.info('fetchIncentiveHistory (API)', params);
    const response = await http.get<ApiResponse<IncentiveResultDTO[]>>(
      '/incentives/history',
      params
    );
    return response;
    
  } catch (error) {
    logger.error('fetchIncentiveHistory failed', error);
    throw error;
  }
}

/**
 * Update user targets (Admin only)
 */
export async function updateUserTargets(params: {
  userId: string;
  month: string;
  targets: {
    c2b?: number;
    c2d?: number;
    gs?: number;
    dcf?: number;
  };
}): Promise<ApiResponse<any>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('updateUserTargets (MOCK)', params);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        success: true,
        data: {
          message: 'Targets updated successfully'
        }
      };
    }
    
    // Production mode
    logger.info('updateUserTargets (API)', params);
    const response = await http.put<ApiResponse<any>>(
      `/users/${params.userId}/targets`,
      { month: params.month, targets: params.targets }
    );
    return response;
    
  } catch (error) {
    logger.error('updateUserTargets failed', error);
    throw error;
  }
}
