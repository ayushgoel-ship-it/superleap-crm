/**
 * DEALER API
 * 
 * All dealer-related backend calls.
 * Uses real API via Edge Functions / Supabase REST.
 */

import { logger } from '../config/env';
import { http, ApiResponse } from './client';
import { DealerDTO } from '../contracts/dealer.contract';

/**
 * Fetch all dealers
 */
export async function fetchDealers(params?: {
  kamId?: string;
  tlId?: string;
  region?: string;
  status?: string;
  channel?: string;
  leadGiving?: boolean;
}): Promise<ApiResponse<DealerDTO[]>> {
  try {
    logger.info('fetchDealers', params);
    const response = await http.get<ApiResponse<DealerDTO[]>>('/dealers', params);
    return response;
  } catch (error) {
    logger.error('fetchDealers failed', error);
    throw error;
  }
}

/**
 * Fetch single dealer by ID
 */
export async function fetchDealerById(dealerId: string): Promise<ApiResponse<DealerDTO>> {
  try {
    logger.info('fetchDealerById', dealerId);
    const response = await http.get<ApiResponse<DealerDTO>>(`/dealers/${dealerId}`);
    return response;
  } catch (error) {
    logger.error('fetchDealerById failed', error);
    throw error;
  }
}

/**
 * Update dealer location
 */
export async function updateDealerLocation(
  dealerId: string,
  location: { lat: number; lng: number; address: string }
): Promise<ApiResponse<DealerDTO>> {
  try {
    logger.info('updateDealerLocation', { dealerId, location });
    const response = await http.patch<ApiResponse<DealerDTO>>(
      `/dealers/${dealerId}/location`,
      location
    );
    return response;
  } catch (error) {
    logger.error('updateDealerLocation failed', error);
    throw error;
  }
}

/**
 * Update dealer status
 */
export async function updateDealerStatus(
  dealerId: string,
  status: string
): Promise<ApiResponse<DealerDTO>> {
  try {
    logger.info('updateDealerStatus', { dealerId, status });
    const response = await http.patch<ApiResponse<DealerDTO>>(
      `/dealers/${dealerId}/status`,
      { status }
    );
    return response;
  } catch (error) {
    logger.error('updateDealerStatus failed', error);
    throw error;
  }
}

/**
 * Request dealer location change (KAM)
 */
export async function requestLocationChange(
  dealerId: string,
  newLocation: { lat: number; lng: number; address: string },
  reason: string
): Promise<ApiResponse<any>> {
  try {
    logger.info('requestLocationChange', { dealerId, newLocation, reason });
    const response = await http.post<ApiResponse<any>>(
      `/dealers/${dealerId}/location-requests`,
      { newLocation, reason }
    );
    return response;
  } catch (error) {
    logger.error('requestLocationChange failed', error);
    throw error;
  }
}

/**
 * Approve location change (TL)
 */
export async function approveLocationChange(
  requestId: string,
  approved: boolean
): Promise<ApiResponse<any>> {
  try {
    logger.info('approveLocationChange', { requestId, approved });
    const response = await http.post<ApiResponse<any>>(
      `/location-requests/${requestId}/approve`,
      { approved }
    );
    return response;
  } catch (error) {
    logger.error('approveLocationChange failed', error);
    throw error;
  }
}
