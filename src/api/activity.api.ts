/**
 * ACTIVITY API
 * 
 * All activity-related backend calls (calls, visits).
 * Uses real API via Edge Functions / Supabase REST.
 */

import { logger } from '../config/env';
import { http, ApiResponse } from './client';
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
    logger.info('fetchActivities', params);
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
    logger.info('fetchActivityById', activityId);
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
    logger.info('logCall', callData);
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
    logger.info('checkInVisit', visitData);
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
    logger.info('checkOutVisit', { visitId, checkOutData });
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
    logger.info('overrideProductivity', { activityId, productive, reason });
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
