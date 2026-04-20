/**
 * Cars24 API Client — Direct HTTP client for vehicle & partners-lead services
 *
 * Auth: Basic auth header (service credential) + x-auth-key (user session)
 * Base URLs configured via environment variables with production defaults.
 *
 * Used for: Lead creation, appointment booking, vehicle lookup, price estimation
 */

import type {
  CarMake,
  CarYear,
  CarModel,
  CarVariant,
  CarVariantGroup,
  CarCity,
  CarState,
  RTOCode,
  VehicleLookupResponse,
  PriceRangeRequest,
  PriceRangeResponse,
  CreateLeadRequest,
  CreateLeadResponse,
  SlotsResponse,
  BookAppointmentRequest,
  OtpVerifyRequest,
  OlaMapsAutocompleteResult,
  OlaMapsReverseGeocodeResult,
} from './c24Types';

// ============================================================================
// Configuration
// ============================================================================

// In dev mode, use Vite proxy paths to bypass CORS.
// In production, use the direct URLs (or env overrides).
const IS_DEV = import.meta.env.DEV;

const VEHICLE_BASE =
  import.meta.env.VITE_C24_VEHICLE_URL || (IS_DEV ? '/c24-vehicle' : 'https://gateway.24c.in/vehicle');
const PARTNERS_LEAD_BASE =
  import.meta.env.VITE_C24_PARTNERS_LEAD_URL || (IS_DEV ? '/c24-partners' : 'https://gateway.24c.in/partners-lead');
const OLA_MAPS_BASE =
  IS_DEV ? '/ola-maps' : 'https://api.olamaps.io/places/v1';
const OLA_MAPS_API_KEY =
  import.meta.env.VITE_OLA_MAPS_API_KEY || '';

// Basic auth for Cars24 internal gateway (same as KAM panel)
const BASIC_AUTH = 'Basic YzI0X2FwaTpCMHctOWVnc3lNUk1nbTFGQko5Q2J2YTVJYXdOQmVSZg==';

// ============================================================================
// Session Token Management
// ============================================================================

const SESSION_TOKEN_KEY = 'c24_session_token';

export function getC24SessionToken(): string {
  return localStorage.getItem(SESSION_TOKEN_KEY) || '';
}

export function setC24SessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function hasC24SessionToken(): boolean {
  return !!localStorage.getItem(SESSION_TOKEN_KEY);
}

// ============================================================================
// Base Fetch Helpers
// ============================================================================

function vehicleHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': BASIC_AUTH,
    'x-auth-key': getC24SessionToken(),
    'origin_source': 'kam-panel',
  };
}

function partnersHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': BASIC_AUTH,
    'x-auth-key': getC24SessionToken(),
  };
}

async function vehicleFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${VEHICLE_BASE}${path}`, {
    headers: vehicleHeaders(),
  });
  if (!res.ok) throw new Error(`Vehicle API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function partnersFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${PARTNERS_LEAD_BASE}${path}`, {
    ...options,
    headers: {
      ...partnersHeaders(),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Partners API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ============================================================================
// Vehicle Service APIs
// ============================================================================

export async function getCarMakes(): Promise<{ detail: CarMake[] }> {
  return vehicleFetch('/make');
}

export async function getYears(makeId: number): Promise<{ detail: CarYear[] }> {
  return vehicleFetch(`/make/${makeId}/years`);
}

export async function getModels(
  makeId: number,
  year: string,
): Promise<{ detail: CarModel[] }> {
  return vehicleFetch(`/make/${makeId}/model/${year}`);
}

export async function getVariants(
  modelId: number,
  year: string,
): Promise<{ detail: Record<string, CarVariantGroup[]> }> {
  return vehicleFetch(`/variant-fuel-list?modelId=${modelId}&year=${year}`);
}

/** Flatten the nested variants response into a simple array */
export function flattenVariants(
  data: { detail: Record<string, CarVariantGroup[]> } | null,
): Array<{ label: string; value: number }> {
  if (!data?.detail) return [];
  return Object.values(data.detail).flatMap((groups) =>
    groups.flatMap((g) =>
      g.variants.map((v) => ({
        label: v.variant_display_name,
        value: v.variant_id,
      })),
    ),
  );
}

export async function getCities(): Promise<{ detail: CarCity[] }> {
  return vehicleFetch('/city');
}

export async function getStates(): Promise<{ detail: CarState[] }> {
  return vehicleFetch('/get-states');
}

export async function getRTOCodes(
  stateId: number,
): Promise<{ detail: RTOCode[] }> {
  return vehicleFetch(`/get-rto-list/${stateId}`);
}

export async function lookupVehicle(
  regNo: string,
): Promise<VehicleLookupResponse> {
  return vehicleFetch(`/v6/vehicle-number/${encodeURIComponent(regNo)}`);
}

// ============================================================================
// Partners Lead Service APIs
// ============================================================================

export async function estimatePrice(
  dealerCode: string,
  payload: PriceRangeRequest,
): Promise<PriceRangeResponse> {
  return partnersFetch(
    `/v1/kam/db/estimate-price?dealerCode=${encodeURIComponent(dealerCode)}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function createLead(
  dealerCode: string,
  payload: CreateLeadRequest,
): Promise<CreateLeadResponse> {
  return partnersFetch(
    `/v1/kam/db/leads?dealerCode=${encodeURIComponent(dealerCode)}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function getSlots(
  leadId: string,
  dealerCode: string,
  latitude: number,
  longitude: number,
): Promise<SlotsResponse> {
  return partnersFetch(
    `/v1/kam/db/leads/${encodeURIComponent(leadId)}/store-and-zones?dealerCode=${encodeURIComponent(dealerCode)}&latitude=${latitude}&longitude=${longitude}`,
  );
}

export async function bookAppointment(
  leadId: string,
  dealerCode: string,
  payload: BookAppointmentRequest,
): Promise<unknown> {
  return partnersFetch(
    `/v1/kam/db/leads/${encodeURIComponent(leadId)}/book-appointment?dealerCode=${encodeURIComponent(dealerCode)}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function rescheduleAppointment(
  leadId: string,
  dealerCode: string,
  payload: BookAppointmentRequest,
): Promise<unknown> {
  return partnersFetch(
    `/v1/kam/db/leads/${encodeURIComponent(leadId)}/reschedule-appointment?dealerCode=${encodeURIComponent(dealerCode)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

export async function sendAppointmentOtp(
  leadId: string,
  dealerCode: string,
): Promise<unknown> {
  return partnersFetch(
    `/v1/kam/db/leads/${encodeURIComponent(leadId)}/appointment-otp?dealerCode=${encodeURIComponent(dealerCode)}`,
  );
}

export async function verifyAppointmentOtp(
  leadId: string,
  dealerCode: string,
  payload: OtpVerifyRequest,
): Promise<unknown> {
  return partnersFetch(
    `/v1/kam/db/leads/${encodeURIComponent(leadId)}/appointment-otp?dealerCode=${encodeURIComponent(dealerCode)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

// ============================================================================
// Ola Maps APIs (direct fetch, no gateway)
// ============================================================================

export async function searchLocation(
  query: string,
): Promise<OlaMapsAutocompleteResult[]> {
  if (!OLA_MAPS_API_KEY) {
    console.warn('[C24 API] OLA_MAPS_API_KEY not configured');
    return [];
  }
  const res = await fetch(
    `${OLA_MAPS_BASE}/autocomplete?input=${encodeURIComponent(query)}&api_key=${OLA_MAPS_API_KEY}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.predictions || [];
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<OlaMapsReverseGeocodeResult | null> {
  if (!OLA_MAPS_API_KEY) return null;
  const res = await fetch(
    `${OLA_MAPS_BASE}/reverse-geocode?latlng=${lat},${lng}&api_key=${OLA_MAPS_API_KEY}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] || null;
}
