/**
 * UNTAGGED DEALER API
 *
 * Canonical writer for `untagged_dealers` (KAM-only flow). Untagged dealers
 * appear only in the KAM "All Activity" feed and are required to start a
 * visit on a dealer not yet present in dealers_master.
 *
 * F4 (open question default): table columns confirmed via Supabase MCP
 *   list_tables(project=fdmlyrgiktljuyuthgki) — id, phone, name, city,
 *   region, address, notes, created_by, created_at, updated_at.
 *
 * Spec: creation requires { name, phone }; id is derived as UT-<phone last 10>.
 */

import { supabase } from '../lib/supabase/client';

export interface UntaggedDealerInput {
  name: string;
  phone: string;
  city?: string;
  region?: string;
  address?: string;
  notes?: string;
  createdBy?: string; // KAM user_id (uuid)
}

export interface UntaggedDealerRow {
  id: string;
  phone: string;
  name: string | null;
  city: string | null;
  region: string | null;
  address: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

function deriveUntaggedId(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const last10 = digits.slice(-10) || `${Date.now()}`;
  return `UT-${last10}`;
}

export async function createUntaggedDealer(input: UntaggedDealerInput): Promise<UntaggedDealerRow> {
  if (!input.name?.trim()) throw new Error('Untagged dealer requires a name');
  if (!input.phone?.trim()) throw new Error('Untagged dealer requires a phone');

  const id = deriveUntaggedId(input.phone);
  const payload: Record<string, any> = {
    id,
    phone: input.phone.trim(),
    name: input.name.trim(),
    city: input.city ?? null,
    region: input.region ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
    created_by: input.createdBy ?? null,
  };

  // Upsert on phone (unique key) so re-entry of same phone returns the existing row.
  const { data, error } = await supabase
    .from('untagged_dealers')
    .upsert(payload, { onConflict: 'phone' })
    .select('*')
    .single();
  if (error) throw error;

  return {
    id: data.id,
    phone: data.phone,
    name: data.name,
    city: data.city,
    region: data.region,
    address: data.address,
    notes: data.notes,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

export async function listUntaggedDealers(): Promise<UntaggedDealerRow[]> {
  const { data, error } = await supabase
    .from('untagged_dealers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id,
    phone: d.phone,
    name: d.name,
    city: d.city,
    region: d.region,
    address: d.address,
    notes: d.notes,
    createdBy: d.created_by,
    createdAt: d.created_at,
  }));
}
