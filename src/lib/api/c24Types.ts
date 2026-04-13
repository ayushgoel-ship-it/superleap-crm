/**
 * Cars24 API Types — Request/Response shapes for vehicle service & partners-lead service
 *
 * These types mirror the actual Cars24 KAM panel API contracts.
 * Source: panels-referral-kam-main codebase (April 2026)
 */

// ============================================================================
// Vehicle Service Types
// ============================================================================

export interface CarMake {
  make_display: string;
  make_id: number;
}

export interface CarYear {
  year: string;
  year_id: number;
}

export interface CarModel {
  model_display: string;
  model_id: number;
}

export interface CarVariant {
  variant_display_name: string;
  variant_id: number;
  transmission_type?: string;
}

export interface CarVariantGroup {
  variants: CarVariant[];
}

export interface CarCity {
  city_name: string;
  city_id: number;
}

export interface CarState {
  state_name: string;
  state_id: number;
}

export interface RTOCode {
  rto_code: string;
  rto_id: number;
}

export interface VehicleLookupResponse {
  detail: {
    brand: { make_id: number; make_display: string };
    year: { year: string; year_id: number };
    model: { model_id: number; model_display: string };
    ds_details: Array<{
      variant: {
        variant_id: number;
        variant_display_name: string;
        transmission_type: string;
      };
    }>;
    RTO: { rto_detail_id: number; rto_code: string };
    fuelType: string;
    states: { state_id: number; state_name: string };
  };
}

// ============================================================================
// Partners Lead Service Types
// ============================================================================

export interface PriceRangeRequest {
  cxNumber: string;
  cxRegNo: string;
  cxName: string;
  makeId: number;
  make: string;
  modelId: number;
  model: string;
  variantId: number;
  variant: string;
  year: string;
  yearId: number;
  stateId: number;
  state: string;
  city: string;
  cityId: number;
  rtoId: number;
  rtoCode: string;
  transmission: string;
  kmsDriven: string;
  fuelType: string;
  ownership: string;
  leadType: string;
}

export interface PriceRangeResponse {
  estimatedPrice: {
    min: number;
    max: number;
  };
}

export interface CreateLeadRequest extends PriceRangeRequest {
  dealerExpectedPrice: string;
}

export interface CreateLeadResponse {
  leadStatus: 'ACCEPTED' | 'DUPLICATE';
  leadId?: string;
}

// ============================================================================
// Appointment Booking Types
// ============================================================================

export interface TimeSlot {
  time: string;
  time_range: string;
}

export interface DateSlot {
  date: string;
  time: {
    Morning: Record<string, TimeSlot>;
    Afternoon: Record<string, TimeSlot>;
    Evening: Record<string, TimeSlot>;
  };
}

export interface StoreInfo {
  location_id: string;
  location_name: string;
  city_id: string;
  address_detail: {
    address1: string;
    address2: string;
  };
  date_slot: Record<string, DateSlot>;
}

export interface SlotsResponse {
  slotsAndStoresDetails: {
    zone: {
      location_id: string;
      zone_id: string;
    } | null;
    slots: Record<string, StoreInfo>;
  };
  attributes: {
    leadDetails: {
      cxName: string;
      cxNumber: string;
    };
  };
}

export interface BookAppointmentRequest {
  appointment: {
    fullName: string;
    location: string;
    phone: string;
    date: string;
    time: string;
    rescheduleSource: string;
    zoneId?: string;
    cityId?: string;
  };
  appointmentGeo: {
    userLat: number;
    userLng: number;
    addressType: string;
    appointmentAddress: string;
    address1?: string;
    address2?: string;
  };
}

export interface OtpVerifyRequest {
  otp: string;
}

// ============================================================================
// Ola Maps Types
// ============================================================================

export interface OlaMapsAutocompleteResult {
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  geometry: {
    location: { lat: number; lng: number };
  };
}

export interface OlaMapsReverseGeocodeResult {
  geometry: {
    location: { lat: number; lng: number };
  };
  formatted_address: string;
  address_components: Array<{
    types: string[];
    long_name: string;
  }>;
}

// ============================================================================
// Form State Types (for React components)
// ============================================================================

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface LeadFormValues {
  leadType: SelectOption;
  registrationNumber: string;
  ownerPhoneNumber: string;
  ownerName: string;
  brand: SelectOption;
  year: SelectOption;
  model: SelectOption;
  variant: SelectOption;
  state: SelectOption;
  location: SelectOption;
  rtoCode: SelectOption;
  kilometers: SelectOption;
  fuelType: SelectOption;
  transmission: SelectOption;
  ownership: SelectOption;
}

export interface LocationGeometry {
  latitude: number;
  longitude: number;
  place: string;
  pincode?: string;
  locationId?: string;
  cityId?: string;
  zoneId?: string;
  address1?: string;
  address2?: string;
}

export interface SelectedSlot {
  date: string;
  time?: 'morning' | 'afternoon' | 'evening';
  hour?: string;
  timeRange?: string;
}

export interface TransformedSlot {
  date: string;
  time: {
    morning: Array<{ time: string; hour: string; timeRange: string }>;
    afternoon: Array<{ time: string; hour: string; timeRange: string }>;
    evening: Array<{ time: string; hour: string; timeRange: string }>;
  };
}

export interface StoreOption {
  locationId: string;
  locationName: string;
  cityId: string;
  address: string;
  slots: TransformedSlot[];
}

export const KILOMETERS_OPTIONS: SelectOption[] = [
  { label: 'Upto 10,000 km', value: '10000' },
  { label: '10,000 - 20,000 km', value: '20000' },
  { label: '20,000 - 30,000 km', value: '30000' },
  { label: '30,000 - 40,000 km', value: '40000' },
  { label: '40,000 - 50,000 km', value: '50000' },
  { label: '50,000 - 60,000 km', value: '60000' },
  { label: '60,000 - 70,000 km', value: '70000' },
  { label: '70,000 - 80,000 km', value: '80000' },
  { label: '80,000 - 90,000 km', value: '90000' },
  { label: '90,000 - 100,000 km', value: '100000' },
  { label: 'Above 100,000 km', value: '100001' },
];

export const EMPTY_OPTION: SelectOption = { label: '', value: '' };

export function getInitialLeadFormValues(): LeadFormValues {
  return {
    leadType: EMPTY_OPTION,
    registrationNumber: '',
    ownerPhoneNumber: '',
    ownerName: '',
    brand: EMPTY_OPTION,
    year: EMPTY_OPTION,
    model: EMPTY_OPTION,
    variant: EMPTY_OPTION,
    state: EMPTY_OPTION,
    location: EMPTY_OPTION,
    rtoCode: EMPTY_OPTION,
    kilometers: EMPTY_OPTION,
    fuelType: EMPTY_OPTION,
    transmission: EMPTY_OPTION,
    ownership: EMPTY_OPTION,
  };
}
