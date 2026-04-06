/**
 * CRM API Client — Centralized fetch wrapper for all backend calls
 *
 * Auth pattern: { apikey: ANON_KEY, Authorization: Bearer ANON_KEY }
 * Base URL: https://<projectId>.supabase.co/functions/v1/make-server-4efaad2c/crm-api
 *
 * All methods return typed responses using the standard envelope:
 *   { success: boolean, data: T, meta: object, error: { code, message } | null }
 */

import { projectId, publicAnonKey } from '../../utils/supabase/info';

// ============================================================================
// Types
// ============================================================================

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    request_id: string;
    time_scope?: string;
    role?: string;
  };
  error: { code: string; message: string } | null;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  city: string;
  region: string;
  stock_ins: number;
  i2si_pct: number;
  dcf_disbursed: number;
  stockin_equiv: number;
  projected_achievement_pct: number;
  score: number;
  lmtd_delta: number; // % change vs LMTD
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  your_rank_card: {
    rank: number;
    total: number;
    percentile: number;
    behind_text: string;
    stock_ins: number;
    i2si_pct: number;
    dcf_disbursed: number;
    stockin_equiv: number;
    projected_achievement_pct: number;
    score: number;
  };
  top3: LeaderboardEntry[];
  full_list: LeaderboardEntry[];
  notes: string;
}

export interface IncentiveSummary {
  projected_incentive: number;
  base_incentive: number;
  boosters: { label: string; amount: number; explanation: string }[];
  reducers: { label: string; amount: number; explanation: string }[];
  gates: { label: string; passed: boolean; explanation: string; impact: string }[];
  slab_info: {
    achievement_pct: number;
    i2si_pct: number;
    per_si_rate: number;
    slab_label: string;
  };
  explanations: string[];
  meta: {
    target_si: number;
    achieved_si: number;
    target_i2si: number;
    achieved_i2si: number;
    days_elapsed: number;
    days_in_month: number;
    score: number;
  };
}

export interface CEPUpdateRequest {
  cep: number | null;
}

export interface CEPUpdateResponse {
  lead_id: string;
  cep: number | null;
  updated_at: string;
}

// ── Leads List / Detail (Phase D) ──

export interface LeadListItem {
  lead_id: string;
  dealer_id: string;
  assigned_to: string; // employee_id of assigned KAM
  dealer_name: string;
  dealer_code: string;
  kam_name: string;
  customer_name: string;
  reg_no: string;
  car: string;
  make?: string;
  model?: string;
  year?: number;
  channel: string;
  lead_type?: string;
  stage: string;
  sub_stage?: string;
  status: string;
  cep: number | null;
  cep_confidence?: string | null;
  c24_quote?: number | null;  // NGS/GS only
  ltv?: number | null;        // DCF only
  created_at: string;
  updated_at: string;
  inspection_date?: string | null;
  days_old: number;
}

export interface LeadListResponse {
  items: LeadListItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface LeadDetailResponse extends LeadListItem {
  customer_phone?: string;
  variant?: string | null;
  cep_notes?: string | null;
  expected_revenue: number;
  actual_revenue: number;
  city?: string;
  region?: string;
  converted_at?: string | null;
  dealer_snapshot: {
    id: string;
    name: string;
    code: string;
    city: string;
    segment: string;
    phone: string;
  };
  timeline: unknown[];
}

export interface LeadListParams {
  page?: number;
  pageSize?: number;
  timeScope?: string;
  channel?: string;
  stage?: string;
  kam_id?: string;
  dealer_id?: string;
  cep_status?: 'pending' | 'captured';
  status?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// Base Fetch
// ============================================================================

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4efaad2c/crm-api`;

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'apikey': publicAnonKey,
  'Authorization': `Bearer ${publicAnonKey}`,
};

/** Max retries for transient network / cold-start failures. */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET';
  let lastErr: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...DEFAULT_HEADERS,
          ...(options.headers as Record<string, string> || {}),
        },
      });

      const json = await res.json() as ApiEnvelope<T>;

      if (!res.ok || !json.success) {
        const errMsg = json.error?.message || `HTTP ${res.status}`;
        console.error(`[CRM API] ${method} ${path} failed:`, errMsg);
        throw new Error(errMsg);
      }

      return json;
    } catch (err) {
      lastErr = err;
      const isNetworkError = err instanceof TypeError && err.message === 'Failed to fetch';

      if (isNetworkError && attempt < MAX_RETRIES) {
        // Transient / cold-start — wait and retry
        console.log(`[CRM API] ${method} ${path}: retry ${attempt + 1}/${MAX_RETRIES} after network error`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }

      // Final attempt or non-retryable error — log and throw
      if (isNetworkError) {
        console.warn(`[CRM API] ${method} ${path}: server unreachable after ${attempt + 1} attempt(s)`);
      } else {
        console.error(`[CRM API] ${method} ${path} error:`, err);
      }
      throw err;
    }
  }

  // Should never reach here, but satisfy TypeScript
  throw lastErr;
}

// ============================================================================
// CEP Endpoints (Phase A)
// ============================================================================

export async function updateLeadCEP(
  leadId: string,
  cep: number | null,
): Promise<CEPUpdateResponse> {
  const res = await apiFetch<CEPUpdateResponse>(`/v1/leads/${leadId}/cep`, {
    method: 'PATCH',
    body: JSON.stringify({ cep }),
  });
  return res.data;
}

// ============================================================================
// Leaderboard Endpoints (Phase B)
// ============================================================================

export async function getLeaderboard(params: {
  scope: 'kam' | 'tl';
  timeScope?: string;
  region?: string;
  team_id?: string;
  current_user_id?: string;
}): Promise<LeaderboardResponse> {
  const qs = new URLSearchParams();
  qs.set('scope', params.scope);
  if (params.timeScope) qs.set('time_scope', params.timeScope);
  if (params.region) qs.set('region', params.region);
  if (params.team_id) qs.set('team_id', params.team_id);
  if (params.current_user_id) qs.set('current_user_id', params.current_user_id);

  const res = await apiFetch<LeaderboardResponse>(`/v1/leaderboard?${qs.toString()}`);
  return res.data;
}

// ============================================================================
// Incentive Endpoints (Phase C)
// ============================================================================

export async function getIncentiveSummary(params: {
  timeScope?: string;
  user_id?: string;
}): Promise<IncentiveSummary> {
  const qs = new URLSearchParams();
  if (params.timeScope) qs.set('time_scope', params.timeScope);
  if (params.user_id) qs.set('user_id', params.user_id);

  const res = await apiFetch<IncentiveSummary>(`/v1/incentives/summary?${qs.toString()}`);
  return res.data;
}

// ============================================================================
// Leads Endpoints (Phase D)
// ============================================================================

export async function getLeadList(params: LeadListParams): Promise<LeadListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', params.page.toString());
  if (params.pageSize) qs.set('page_size', params.pageSize.toString());
  if (params.timeScope) qs.set('time_scope', params.timeScope);
  if (params.channel) qs.set('channel', params.channel);
  if (params.stage) qs.set('stage', params.stage);
  if (params.kam_id) qs.set('kam_id', params.kam_id);
  if (params.dealer_id) qs.set('dealer_id', params.dealer_id);
  if (params.cep_status) qs.set('cep_status', params.cep_status);
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);

  const res = await apiFetch<LeadListResponse>(`/v1/leads/list?${qs.toString()}`);
  return res.data;
}

export async function getLeadDetail(leadId: string): Promise<LeadDetailResponse> {
  const res = await apiFetch<LeadDetailResponse>(`/v1/leads/${leadId}`);
  return res.data;
}