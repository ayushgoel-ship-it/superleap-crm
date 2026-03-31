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
    .from('leads')
    .insert({
      dealer_id: leadData.dealerId,
      customer_name: leadData.ownerName,
      customer_phone: leadData.ownerPhone,
      channel: leadData.channel === 'C2B' ? 'DealerReferral' : 'GS',
      pricing_fields: {
        make: leadData.vehicleMake,
        model: leadData.vehicleModel,
        year: leadData.vehicleYear,
        expectedRevenue: leadData.expectedPrice || 0
      },
      stage: 'created',
      status: 'open'
    })
    .select('*')
    .single();

  if (error) {
    console.error(error);
    return { success: false, error: { code: 'INSERT_FAILED', message: error.message } };
  }

  // Update audit log
  await supabase.from('lead_timeline_events').insert({
    lead_id: data.lead_id,
    event_type: 'lead_created',
    event_payload: leadData
  });

  return {
    success: true,
    data: {
      ...leadData,
      id: data.lead_id,
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
    .from('leads')
    .update({ stage: status, updated_at: new Date().toISOString() })
    .eq('lead_id', leadId);

  if (error) {
    console.error(error);
    return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
  }

  await supabase.from('lead_timeline_events').insert({
    lead_id: leadId,
    event_type: 'stage_changed',
    event_payload: { newStage: status, notes }
  });

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
    .from('leads')
    .update({
      pricing_fields: { cep: cepData.amount, cepNotes: cepData.notes },
      updated_at: new Date().toISOString()
    })
    .eq('lead_id', leadId);

  if (error) console.error(error);

  await supabase.from('lead_timeline_events').insert({
    lead_id: leadId,
    event_type: 'cep_added',
    event_payload: cepData
  });

  return { success: true, data: getLeadById(leadId)! };
}
