/**
 * LEAD API
 * 
 * All lead-related backend calls.
 * Currently uses mock data, ready to swap to real API.
 */

import { ENV, logger } from '../config/env';
import { http, ApiResponse } from './client';
import { getLeads, getLeadById } from '../data/dtoSelectors';
import { LeadDTO } from '../contracts/lead.contract';

/**
 * Fetch all leads
 */
export async function fetchLeads(params?: {
  kamId?: string;
  tlId?: string;
  dealerId?: string;
  channel?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ApiResponse<LeadDTO[]>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('fetchLeads (MOCK)', params);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let leads = getLeads();
      
      // Apply filters
      if (params?.kamId) {
        leads = leads.filter(l => l.kamId === params.kamId);
      }
      if (params?.dealerId) {
        leads = leads.filter(l => l.dealerId === params.dealerId);
      }
      if (params?.channel) {
        leads = leads.filter(l => l.channel === params.channel);
      }
      if (params?.status) {
        leads = leads.filter(l => l.status === params.status);
      }
      
      return {
        success: true,
        data: leads
      };
    }
    
    // Production mode
    logger.info('fetchLeads (API)', params);
    const response = await http.get<ApiResponse<LeadDTO[]>>('/leads', params);
    return response;
    
  } catch (error) {
    logger.error('fetchLeads failed', error);
    throw error;
  }
}

/**
 * Fetch single lead by ID
 */
export async function fetchLeadById(leadId: string): Promise<ApiResponse<LeadDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('fetchLeadById (MOCK)', leadId);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const lead = getLeadById(leadId);
      
      if (!lead) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Lead ${leadId} not found`
          }
        };
      }
      
      return {
        success: true,
        data: lead
      };
    }
    
    // Production mode
    logger.info('fetchLeadById (API)', leadId);
    const response = await http.get<ApiResponse<LeadDTO>>(`/leads/${leadId}`);
    return response;
    
  } catch (error) {
    logger.error('fetchLeadById failed', error);
    throw error;
  }
}

/**
 * Create new lead
 */
export async function createLead(leadData: {
  dealerId: string;
  ownerName: string;
  ownerPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  channel: string;
  expectedPrice?: number;
}): Promise<ApiResponse<LeadDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('createLead (MOCK)', leadData);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock success response
      return {
        success: true,
        data: {
          ...leadData,
          id: `lead-${Date.now()}`,
          kamId: 'kam-ncr-01', // Mock
          status: 'Fresh',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any
      };
    }
    
    // Production mode
    logger.info('createLead (API)', leadData);
    const response = await http.post<ApiResponse<LeadDTO>>('/leads', leadData);
    return response;
    
  } catch (error) {
    logger.error('createLead failed', error);
    throw error;
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  leadId: string,
  status: string,
  notes?: string
): Promise<ApiResponse<LeadDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('updateLeadStatus (MOCK)', { leadId, status, notes });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: getLeadById(leadId)!
      };
    }
    
    // Production mode
    logger.info('updateLeadStatus (API)', { leadId, status, notes });
    const response = await http.patch<ApiResponse<LeadDTO>>(
      `/leads/${leadId}/status`,
      { status, notes }
    );
    return response;
    
  } catch (error) {
    logger.error('updateLeadStatus failed', error);
    throw error;
  }
}

/**
 * Add CEP (Customer Evaluation Point) to lead
 */
export async function addLeadCEP(
  leadId: string,
  cepData: {
    amount: number;
    notes?: string;
  }
): Promise<ApiResponse<LeadDTO>> {
  try {
    // Mock mode
    if (ENV.USE_MOCK_DATA) {
      logger.debug('addLeadCEP (MOCK)', { leadId, cepData });
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        success: true,
        data: getLeadById(leadId)!
      };
    }
    
    // Production mode
    logger.info('addLeadCEP (API)', { leadId, cepData });
    const response = await http.post<ApiResponse<LeadDTO>>(
      `/leads/${leadId}/cep`,
      cepData
    );
    return response;
    
  } catch (error) {
    logger.error('addLeadCEP failed', error);
    throw error;
  }
}
