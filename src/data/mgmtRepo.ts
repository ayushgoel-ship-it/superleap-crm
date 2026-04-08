/**
 * MGMT REPO — Single write layer for the Admin Management console.
 *
 * All admin writes go through this module. Every successful write
 * invalidates the runtime DB cache so that the next read pulls fresh
 * canonical data from Supabase.
 *
 * Read paths continue to use runtimeDB / configFromDB unchanged.
 */

import { supabase } from '@/lib/supabase/client';
import { clearRuntimeDBCache } from '@/data/runtimeDB';

// ── Helper: invoke an edge function with the caller's JWT ──

async function invoke<T = any>(
  fn: string,
  body: unknown,
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    // supabase-js wraps non-2xx as error; try to extract message
    const msg = (error as any).context?.responseText || error.message || 'Edge function failed';
    return { data: null, error: msg };
  }
  if (data && typeof data === 'object' && 'error' in (data as any)) {
    return { data: null, error: (data as any).error as string };
  }
  return { data: data as T, error: null };
}

// ── Users ──

export interface CreateUserInput {
  email: string;
  name: string;
  phone?: string;
  role: 'KAM' | 'TL' | 'ADMIN' | 'SUPER_ADMIN';
  team_id?: string;          // KAM → required (TL's user_id)
  region?: string;
  city?: string;
}

export interface CreateUserResult {
  ok: true;
  user_id: string;
  temp_password: string;
  must_reset_password: true;
}

export async function createUser(input: CreateUserInput) {
  const r = await invoke<CreateUserResult>('mgmt-create-user', input);
  if (!r.error) clearRuntimeDBCache();
  return r;
}

export interface DeactivateBlocker {
  type: string;
  count: number;
  message: string;
}

export async function deactivateUser(user_id: string, dry_run = false) {
  const r = await invoke<{ ok: boolean; blockers?: DeactivateBlocker[]; can_deactivate?: boolean }>(
    'mgmt-deactivate-user',
    { user_id, dry_run },
  );
  if (!r.error && !dry_run) clearRuntimeDBCache();
  return r;
}

/** Direct field update on public.users (name, phone, region, city, team_id). */
export async function updateUser(user_id: string, patch: Record<string, any>) {
  const { error } = await supabase.from('users').update(patch).eq('user_id', user_id);
  if (error) return { data: null, error: error.message };
  await supabase.from('audit_log').insert({
    action: 'user_update', entity_type: 'user', entity_id: user_id,
    new_values: patch, change_summary: `Updated user ${user_id}`,
  });
  clearRuntimeDBCache();
  return { data: { ok: true }, error: null };
}

// ── Targets ──

export interface TargetPatch {
  si_target?: number;
  call_target?: number;
  visit_target?: number;
  i2si_target?: number;
  input_score_gate?: number;
  quality_score_gate?: number;
  dcf_leads_target?: number;
  dcf_onboarding_target?: number;
  dcf_disbursals_target?: number;
  dcf_gmv_target_lakhs?: number;
}

export async function updateTarget(target_id: string, patch: TargetPatch) {
  const { error } = await supabase.from('targets').update(patch).eq('target_id', target_id);
  if (error) return { data: null, error: error.message };
  await supabase.from('audit_log').insert({
    action: 'target_update', entity_type: 'target', entity_id: target_id,
    new_values: patch, change_summary: `Updated target ${target_id}`,
  });
  clearRuntimeDBCache();
  return { data: { ok: true }, error: null };
}

export async function initializeMonth(month: string, source_month?: string) {
  const r = await invoke<{ ok: true; month: string; source_month: string | null; inserted: number; already_existed: number }>(
    'mgmt-initialize-month',
    { month, source_month },
  );
  if (!r.error) clearRuntimeDBCache();
  return r;
}

// ── Dealer reassignment ──

export interface ReassignImpact {
  dealers_affected: number;
  leads_affected: number;
  calls_affected: number;
  visits_affected: number;
  new_kam_id: string | null;
  new_tl_id: string | null;
}

export async function reassignDealers(dealer_ids: string[], new_kam_id: string | null, dry_run = false) {
  const r = await invoke<{ ok: true; dry_run?: boolean; impact: ReassignImpact }>(
    'mgmt-reassign-dealers',
    { dealer_ids, new_kam_id, dry_run },
  );
  if (!r.error && !dry_run) clearRuntimeDBCache();
  return r;
}

// ── Bulk upload ──

export type BulkUploadType = 'targets' | 'dealer_kam_mapping';

export async function bulkUpload(type: BulkUploadType, rows: Record<string, any>[], dry_run = false) {
  const r = await invoke<{ ok: true; dry_run: boolean; processed: number; errors: { row: number; error: string }[] }>(
    'mgmt-bulk-upload',
    { type, rows, dry_run },
  );
  if (!r.error && !dry_run) clearRuntimeDBCache();
  return r;
}

// ── Export ──

export interface ExportRequest {
  entity: 'users' | 'dealers' | 'leads' | 'calls' | 'visits' | 'dcf_leads' | 'targets' | 'audit_log';
  fields: string[];
  filters?: Record<string, any>;
  date_field?: string;
  from?: string;
  to?: string;
}

/**
 * Calls the mgmt-export edge function and returns a Blob the caller can download.
 * Uses raw fetch (not supabase.functions.invoke) so we can grab CSV body + headers.
 */
export async function exportToCsv(req: ExportRequest): Promise<{ blob: Blob | null; rowCount: number; error: string | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { blob: null, rowCount: 0, error: 'Not authenticated' };

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mgmt-export`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => 'export failed');
    return { blob: null, rowCount: 0, error: msg };
  }
  const rowCount = parseInt(res.headers.get('X-Row-Count') || '0', 10);
  const blob = await res.blob();
  return { blob, rowCount, error: null };
}

/** Trigger a browser download of an exported CSV. */
export function downloadCsv(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Password reset (first-login flow) ──

/**
 * Updates the user's password via Supabase Auth and clears must_reset_password.
 * Called from the forced-reset screen on first login.
 */
export async function completePasswordReset(newPassword: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
  if (pwErr) return { data: null, error: pwErr.message };

  const { error: flagErr } = await supabase.from('users').update({ must_reset_password: false }).eq('user_id', user.id);
  if (flagErr) return { data: null, error: flagErr.message };

  return { data: { ok: true }, error: null };
}
