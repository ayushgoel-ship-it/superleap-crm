/**
 * INCENTIVE API
 * 
 * Incentive calculations and payouts.
 * Uses real API via Edge Functions / Supabase REST.
 */

import { logger } from '../config/env';
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
    logger.info('calculateIncentive', params);
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
    logger.info('fetchIncentiveHistory', params);
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
    ngs?: number;
    gs?: number;
    dcf?: number;
  };
}): Promise<ApiResponse<any>> {
  try {
    logger.info('updateUserTargets', params);
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
