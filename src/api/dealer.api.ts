/**
 * DEALER API
 * 
 * All dealer-related backend calls.
 * Currently uses mock data, ready to swap to real API.
 */

import { ENV, logger } from '../config/env';
import { http, ApiResponse } from './client';
import { getDealers, getDealerById } from '../data/dtoSelectors';
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
    // Mock mode: use local data
    if (ENV.USE_MOCK_DATA) {
      logger.debug('fetchDealers (MOCK)', params);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let dealers = getDealers();
      
      // Apply filters
      if (params?.kamId) {
        dealers = dealers.filter(d => d.kamId === params.kamId);
      }
      if (params?.status) {
        dealers = dealers.filter(d => d.status === params.status);
      }
      if (params?.channel) {
        dealers = dealers.filter(d => d.channel === params.channel);
      }
      if (params?.leadGiving !== undefined) {
        dealers = dealers.filter(d => d.leadGiving === params.leadGiving);
      }
      
      return {
        success: true,
        data: dealers
      };
    }
    
    // Production mode: call real API
    logger.info('fetchDealers (API)', params);
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
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('fetchDealerById (MOCK)', dealerId);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const dealer = getDealerById(dealerId);
      
      if (!dealer) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Dealer ${dealerId} not found`
          }
        };
      }
      
      return {
        success: true,
        data: dealer
      };
    }
    
    // Production mode
    logger.info('fetchDealerById (API)', dealerId);
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
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('updateDealerLocation (MOCK)', { dealerId, location });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In mock mode, just return success
      // Real update would happen in mockDatabase
      return {
        success: true,
        data: getDealerById(dealerId)!
      };
    }
    
    // Production mode
    logger.info('updateDealerLocation (API)', { dealerId, location });
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
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('updateDealerStatus (MOCK)', { dealerId, status });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: getDealerById(dealerId)!
      };
    }
    
    // Production mode
    logger.info('updateDealerStatus (API)', { dealerId, status });
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
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('requestLocationChange (MOCK)', { dealerId, newLocation, reason });
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        success: true,
        data: {
          requestId: `req-${Date.now()}`,
          status: 'pending',
          message: 'Location change request submitted for TL approval'
        }
      };
    }
    
    // Production mode
    logger.info('requestLocationChange (API)', { dealerId, newLocation, reason });
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
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('approveLocationChange (MOCK)', { requestId, approved });
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        success: true,
        data: {
          requestId,
          status: approved ? 'approved' : 'rejected',
          message: approved ? 'Location change approved' : 'Location change rejected'
        }
      };
    }
    
    // Production mode
    logger.info('approveLocationChange (API)', { requestId, approved });
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
