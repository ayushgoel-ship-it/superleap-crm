/**
 * LEAD API
 * 
 * Re-written to directly use Supabase Postgres instead of mock or edge functions.
 */

import { supabase } from '../lib/supabase/client';
import { ApiResponse } from './client';
import { LeadDTO } from '../contracts/lead.contract';
import { getLeads, getLeadById } from '../data/dtoSelectors';

export async function fetchLeads(params?: any): Promise<ApiResponse<LeadDTO[]>> {
  // Read path still heavily relies on cache for rapid list UI rendering,
  // but cache is populated by Supabase raw adapter on boot.
  let leads = getLeads();

  if (params?.kamId) leads = leads.filter(l => l.kamId === params.kamId);
  if (params?.dealerId) leads = leads.filter(l => l.dealerId === params.dealerId);
  if (params?.channel) leads = leads.filter(l => l.channel === params.channel);
  if (params?.status) leads = leads.filter(l => l.status === params.status);

  return { success: true, data: leads };
}

export async function fetchLeadById(leadId: string): Promise<ApiResponse<LeadDTO>> {
  const lead = getLeadById(leadId);
  if (!lead) return { success: false, error: { code: 'NOT_FOUND', message: `Not found` } };
  return { success: true, data: lead };
}

export async function createLead(leadData: any): Promise<ApiResponse<LeadDTO>> {
  const { data, error } = await supabase
    .from('sell_leads_master')
    .insert({
      dealer_code: leadData.dealerId ? Number(leadData.dealerId) : null,
      cx_reg_no: leadData.regNo || null,
      dl_type: leadData.leadType === 'Seller' ? 'seller' : 'inventory',
      gs_flag: leadData.channel === 'GS' ? 1 : 0,
      make: leadData.vehicleMake,
      model: leadData.vehicleModel,
      year: leadData.vehicleYear,
      target_price: leadData.expectedPrice || 0,
      lead_date: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    console.error(error);
    return { success: false, error: { code: 'INSERT_FAILED', message: error.message } };
  }

  // Update audit log
  return {
    success: true,
    data: {
      ...leadData,
      id: data.id || data.lead_id,
      kamId: 'kam-assigned',
      status: 'Active',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as any
  };
}

export async function updateLeadStatus(
  leadId: string,
  status: string,
  notes?: string
): Promise<ApiResponse<LeadDTO>> {
  const { error } = await supabase
    .from('sell_leads_master')
    .update({ appointment_status: status })
    .eq('lead_id', leadId);

  if (error) {
    console.error(error);
    return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
  }

  return { success: true, data: getLeadById(leadId)! };
}

export async function addLeadCEP(
  leadId: string,
  cepData: {
    amount: number;
    notes?: string;
  }
): Promise<ApiResponse<LeadDTO>> {
  const { error } = await supabase
    .from('sell_leads_master')
    .update({
      target_price: cepData.amount,
    })
    .eq('lead_id', leadId);

  if (error) console.error(error);

  return { success: true, data: getLeadById(leadId)! };
}
