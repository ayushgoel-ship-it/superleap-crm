/**
 * ACTIVITY API
 * 
 * All activity-related backend calls (calls, visits).
 * Currently uses mock data, ready to swap to real API.
 */

import { ENV, logger } from '../config/env';
import { http, ApiResponse } from './client';
import { getActivities, getActivityById } from '../data/dtoSelectors';
import { ActivityDTO } from '../contracts/activity.contract';

/**
 * Fetch all activities
 */
export async function fetchActivities(params?: {
  kamId?: string;
  tlId?: string;
  dealerId?: string;
  type?: 'call' | 'visit';
  dateFrom?: string;
  dateTo?: string;
  productive?: boolean;
}): Promise<ApiResponse<ActivityDTO[]>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('fetchActivities (MOCK)', params);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let activities = getActivities();
      
      // Apply filters
      if (params?.kamId) {
        activities = activities.filter(a => a.kamId === params.kamId);
      }
      if (params?.dealerId) {
        activities = activities.filter(a => a.dealerId === params.dealerId);
      }
      if (params?.type) {
        activities = activities.filter(a => a.type === params.type);
      }
      if (params?.productive !== undefined) {
        activities = activities.filter(a => a.productive === params.productive);
      }
      
      return {
        success: true,
        data: activities
      };
    }
    
    // Production mode
    logger.info('fetchActivities (API)', params);
    const response = await http.get<ApiResponse<ActivityDTO[]>>('/activities', params);
    return response;
    
  } catch (error) {
    logger.error('fetchActivities failed', error);
    throw error;
  }
}

/**
 * Fetch single activity by ID
 */
export async function fetchActivityById(activityId: string): Promise<ApiResponse<ActivityDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('fetchActivityById (MOCK)', activityId);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const activity = getActivityById(activityId);
      
      if (!activity) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Activity ${activityId} not found`
          }
        };
      }
      
      return {
        success: true,
        data: activity
      };
    }
    
    // Production mode
    logger.info('fetchActivityById (API)', activityId);
    const response = await http.get<ApiResponse<ActivityDTO>>(`/activities/${activityId}`);
    return response;
    
  } catch (error) {
    logger.error('fetchActivityById failed', error);
    throw error;
  }
}

/**
 * Log a call
 */
export async function logCall(callData: {
  dealerId: string;
  kamId: string;
  duration: number;
  notes?: string;
  outcome?: string;
}): Promise<ApiResponse<ActivityDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('logCall (MOCK)', callData);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        success: true,
        data: {
          id: `call-${Date.now()}`,
          type: 'call',
          ...callData,
          createdAt: new Date().toISOString(),
          productive: (callData.duration || 0) >= 60
        } as any
      };
    }
    
    // Production mode
    logger.info('logCall (API)', callData);
    const response = await http.post<ApiResponse<ActivityDTO>>('/activities/calls', callData);
    return response;
    
  } catch (error) {
    logger.error('logCall failed', error);
    throw error;
  }
}

/**
 * Check in to visit
 */
export async function checkInVisit(visitData: {
  dealerId: string;
  kamId: string;
  lat: number;
  lng: number;
}): Promise<ApiResponse<ActivityDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('checkInVisit (MOCK)', visitData);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: {
          id: `visit-${Date.now()}`,
          type: 'visit',
          ...visitData,
          createdAt: new Date().toISOString(),
          checkInTime: new Date().toISOString(),
          productive: true
        } as any
      };
    }
    
    // Production mode
    logger.info('checkInVisit (API)', visitData);
    const response = await http.post<ApiResponse<ActivityDTO>>('/activities/visits/check-in', visitData);
    return response;
    
  } catch (error) {
    logger.error('checkInVisit failed', error);
    throw error;
  }
}

/**
 * Check out from visit
 */
export async function checkOutVisit(
  visitId: string,
  checkOutData: {
    lat: number;
    lng: number;
    notes?: string;
    outcomes?: string[];
  }
): Promise<ApiResponse<ActivityDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('checkOutVisit (MOCK)', { visitId, checkOutData });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: getActivityById(visitId)!
      };
    }
    
    // Production mode
    logger.info('checkOutVisit (API)', { visitId, checkOutData });
    const response = await http.post<ApiResponse<ActivityDTO>>(
      `/activities/visits/${visitId}/check-out`,
      checkOutData
    );
    return response;
    
  } catch (error) {
    logger.error('checkOutVisit failed', error);
    throw error;
  }
}

/**
 * Override productivity flag (TL only)
 */
export async function overrideProductivity(
  activityId: string,
  productive: boolean,
  reason: string
): Promise<ApiResponse<ActivityDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('overrideProductivity (MOCK)', { activityId, productive, reason });
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        success: true,
        data: getActivityById(activityId)!
      };
    }
    
    // Production mode
    logger.info('overrideProductivity (API)', { activityId, productive, reason });
    const response = await http.post<ApiResponse<ActivityDTO>>(
      `/activities/${activityId}/override-productivity`,
      { productive, reason }
    );
    return response;
    
  } catch (error) {
    logger.error('overrideProductivity failed', error);
    throw error;
  }
}
