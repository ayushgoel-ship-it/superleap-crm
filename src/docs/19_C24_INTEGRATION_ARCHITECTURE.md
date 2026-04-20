# D7 — Cars24 Integration Architecture

**Date**: 2026-04-13
**Status**: Complete
**Phase**: Backend + Frontend Integration
**Depends on**: D3 (Legacy Backend Contracts), B1–B5 (Backend Setup), DB1–DB2 (Database)

---

## Scope

This document defines the architecture for integrating Cars24 (C24) external APIs
into the SuperLeap CRM, covering:

1. Lead creation via C24 partners-lead API
2. Appointment booking (store + home inspection)
3. Vehicle catalog lookup
4. Location search via Ola Maps
5. Backend proxy layer (security boundary)
6. Database extensions for tracking C24 data

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React)                            │
│                                                                 │
│  LeadCreationFlow.tsx ──────────┐                               │
│  BookAppointmentFlow.tsx ───────┤                               │
│  C24SessionSetup.tsx ───────────┘                               │
│       │                                                         │
│       ▼  (X-C24-Session-Token header)                           │
│  c24Api.ts ─── currently direct ──▶ gateway.24c.in              │
│       │         (to be migrated)                                │
│       ▼  (future: via backend proxy)                            │
└───────┼─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│               Backend (Spring Boot)                             │
│                                                                 │
│  Cars24ProxyController ─── /web/v1/c24/* ──────────────────────│
│       │                                                         │
│       ├── Cars24VehicleService  ──▶ gateway.24c.in/vehicle      │
│       ├── Cars24LeadService     ──▶ gateway.24c.in/partners-lead│
│       └── OlaMapsService        ──▶ api.olamaps.io              │
│                                                                 │
│  AppointmentController ─── /web/v1/appointments/* ─────────────│
│       │                                                         │
│       ├── AppointmentCommandService  ──▶ PostgreSQL             │
│       └── AppointmentQueryService    ──▶ PostgreSQL             │
│                                                                 │
│  LeadController (extended) ─── c24_lead_id tracking ───────────│
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL                                    │
│                                                                 │
│  sell_leads_master  ── + c24_lead_id, c24_lead_status,         │
│                          external_source, fuel_type,            │
│                          transmission, ownership, kilometers    │
│                                                                 │
│  appointments (NEW) ── appointment tracking with store/home,   │
│                          OTP verification, reschedule chain     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. External Services

### 2.1 Vehicle Service (`gateway.24c.in/vehicle`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/make` | GET | Car brand list |
| `/v1/year?makeId=` | GET | Years for a make |
| `/v1/model?makeId=&year=` | GET | Models for make+year |
| `/v1/variant?modelId=&year=` | GET | Variants for model+year |
| `/v1/state` | GET | All states |
| `/v1/city?stateId=` | GET | Cities for state |
| `/v1/rto?stateId=` | GET | RTO codes for state |
| `/v6/vehicle-number/{regNo}` | GET | Vehicle lookup by registration |

**Auth**: `Authorization: Basic {encoded}` + `x-auth-key: {session_token}`

### 2.2 Partners Lead Service (`gateway.24c.in/partners-lead`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/kam/db/{dealerCode}/estimate-price` | POST | Price range estimation |
| `/v1/kam/db/{dealerCode}/leads` | POST | Create lead |
| `/v1/kam/db/{dealerCode}/leads/{leadId}/slots` | GET | Available appointment slots |
| `/v1/kam/db/{dealerCode}/leads/{leadId}/book-appointment` | POST | Book appointment |
| `/v1/kam/db/{dealerCode}/leads/{leadId}/reschedule-appointment` | POST | Reschedule |
| `/v1/kam/db/{dealerCode}/leads/{leadId}/send-appointment-otp` | POST | Send OTP |
| `/v1/kam/db/{dealerCode}/leads/{leadId}/verify-appointment-otp` | POST | Verify OTP |

**Auth**: Same as vehicle service.

### 2.3 Ola Maps (`api.olamaps.io/places/v1`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/autocomplete?input=&api_key=` | GET | Location search |
| `/reverse-geocode?latlng=&api_key=` | GET | Reverse geocode |

**Auth**: `api_key` query parameter.

---

## 3. Backend Proxy Layer

### Why proxy?

The frontend currently calls C24 APIs directly with hardcoded Basic Auth
credentials in `c24Api.ts`. This is a security risk:

- Credentials are visible in browser DevTools
- Session tokens in localStorage can be exfiltrated via XSS
- No server-side audit trail for API calls

### Proxy architecture

```
Frontend                  Backend                     External
────────                  ───────                     ────────
c24Api.ts ──── POST ────▶ Cars24ProxyController       
  headers:                    │ injects:               
  X-C24-Session-Token         │ Authorization: Basic    
  Authorization: Bearer       │ x-auth-key              
                              │                        
                              ▼                        
                         Cars24LeadService ──────────▶ gateway.24c.in
                              │                        
                              ▼                        
                         AppointmentCommandService     
                              │ persists locally        
                              ▼                        
                         PostgreSQL (appointments)     
```

### Backend endpoints

All proxy endpoints live under `/web/v1/c24/`:

| CRM Endpoint | Proxies To |
|--------------|------------|
| `GET  /c24/vehicle/makes` | Vehicle `/v1/make` |
| `GET  /c24/vehicle/years?make_id=` | Vehicle `/v1/year` |
| `GET  /c24/vehicle/models?make_id=&year=` | Vehicle `/v1/model` |
| `GET  /c24/vehicle/variants?model_id=&year=` | Vehicle `/v1/variant` |
| `GET  /c24/vehicle/states` | Vehicle `/v1/state` |
| `GET  /c24/vehicle/cities?state_id=` | Vehicle `/v1/city` |
| `GET  /c24/vehicle/rto-codes?state_id=` | Vehicle `/v1/rto` |
| `GET  /c24/vehicle/lookup/{regNo}` | Vehicle `/v6/vehicle-number/{regNo}` |
| `POST /c24/leads/{dealerCode}/estimate-price` | Partners `/v1/kam/db/{dc}/estimate-price` |
| `POST /c24/leads/{dealerCode}/create` | Partners `/v1/kam/db/{dc}/leads` |
| `GET  /c24/leads/{dc}/{leadId}/slots?lat=&lng=` | Partners `/v1/kam/db/{dc}/leads/{id}/slots` |
| `POST /c24/leads/{dc}/{leadId}/book-appointment` | Partners book-appointment |
| `POST /c24/leads/{dc}/{leadId}/reschedule-appointment` | Partners reschedule |
| `POST /c24/leads/{dc}/{leadId}/send-otp` | Partners send-appointment-otp |
| `POST /c24/leads/{dc}/{leadId}/verify-otp` | Partners verify-appointment-otp |
| `GET  /c24/maps/autocomplete?query=` | Ola Maps autocomplete |
| `GET  /c24/maps/reverse-geocode?lat=&lng=` | Ola Maps reverse-geocode |

---

## 4. Database Schema

### V009 Migration — `V009__c24_integration_and_appointments.sql`

#### 4.1 sell_leads_master extensions

| Column | Type | Purpose |
|--------|------|---------|
| `c24_lead_id` | TEXT | Lead ID from C24 API response |
| `c24_lead_status` | TEXT | ACCEPTED or DUPLICATE |
| `external_source` | TEXT | ORGANIC (manual) or C24_KAM_PANEL |
| `fuel_type` | TEXT | Petrol, Diesel, CNG, Electric, Hybrid |
| `transmission` | TEXT | Manual, Automatic |
| `ownership` | TEXT | 1st, 2nd, 3rd, 4th, 5+ |
| `kilometers` | TEXT | Odometer range |

#### 4.2 appointments table (new)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | Internal ID |
| `appointment_id` | TEXT UNIQUE | APPT-{uuid8} |
| `lead_id` | TEXT | CRM lead reference |
| `c24_lead_id` | TEXT | C24 external lead reference |
| `dealer_code` | TEXT | Dealer for the appointment |
| `customer_name/phone` | TEXT | Customer details |
| `appointment_type` | TEXT | STORE or HOME |
| `status` | TEXT | SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW |
| `scheduled_date` | DATE | Appointment date |
| `scheduled_time` | TEXT | Time slot (e.g., "10:00") |
| `time_period` | TEXT | morning, afternoon, evening |
| `store_id/name/address` | TEXT | Store details (if STORE type) |
| `location_lat/lng` | NUMERIC | Geo coordinates |
| `otp_verified` | BOOLEAN | Whether OTP was verified |
| `is_reschedule` | BOOLEAN | Whether this is a rescheduled appointment |
| `rescheduled_from` | UUID FK | Link to original appointment |
| `kam_id/tl_id` | TEXT | Ownership |

---

## 5. Configuration

### Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `C24_BASIC_AUTH` | Yes | — | Base64 Basic auth credential for C24 APIs |
| `C24_SESSION_TOKEN` | No | — | Default session token (overridden per-request) |
| `C24_VEHICLE_URL` | No | `https://gateway.24c.in/vehicle` | Vehicle service base URL |
| `C24_PARTNERS_LEAD_URL` | No | `https://gateway.24c.in/partners-lead` | Partners lead service URL |
| `C24_VEHICLE_ENABLED` | No | `true` | Feature flag |
| `C24_PARTNERS_LEAD_ENABLED` | No | `true` | Feature flag |
| `OLA_MAPS_URL` | No | `https://api.olamaps.io/places/v1` | Ola Maps base URL |
| `OLA_MAPS_API_KEY` | Yes | — | Ola Maps API key |
| `OLA_MAPS_ENABLED` | No | `true` | Feature flag |

### Frontend environment variables (current, to be deprecated)

| Variable | Purpose |
|----------|---------|
| `VITE_C24_VEHICLE_URL` | Direct vehicle service URL |
| `VITE_C24_PARTNERS_LEAD_URL` | Direct partners lead URL |
| `VITE_OLA_MAPS_API_KEY` | Ola Maps key (exposed to browser) |

These will be removed once the frontend is migrated to use backend proxy endpoints.

---

## 6. Frontend Components

### Lead Creation Flow (`LeadCreationFlow.tsx`)

3-step Sheet overlay:
1. **Lead Details**: Lead type, registration number, phone, name
2. **Car Details**: Brand → Year → Model → Variant (cascading), State → RTO, fuel, transmission, ownership, kilometers
3. **Price Range & Submit**: Estimate price, set dealer expected price, submit

### Appointment Booking Flow (`BookAppointmentFlow.tsx`)

3-step Sheet overlay:
1. **Location Search**: Ola Maps autocomplete, store vs home toggle
2. **Slot Selection**: Date dropdown, morning/afternoon/evening time grid
3. **Confirmation**: OTP verification (skipped for reschedule)

### Session Setup (`C24SessionSetup.tsx`)

Inline widget for configuring the C24 session token in localStorage.

---

## 7. Migration Path

### Phase 1 (Current — Complete)
- Frontend calls C24 APIs directly via `c24Api.ts`
- Session token in localStorage
- No backend persistence of C24 leads/appointments

### Phase 2 (Backend Ready — This PR)
- Backend proxy controller created with full endpoint coverage
- Database migration for `appointments` table and `sell_leads_master` extensions
- Entity, repository, service, controller layers aligned with existing patterns
- Configuration via environment variables

### Phase 3 (Frontend Migration — Next)
- Update `c24Api.ts` to call backend proxy instead of C24 directly
- Remove hardcoded Basic Auth from frontend
- Remove `VITE_C24_*` and `VITE_OLA_MAPS_*` env vars
- Add `X-C24-Session-Token` header pass-through

### Phase 4 (Data Sync — Future)
- After C24 lead creation, persist `c24_lead_id` in `sell_leads_master`
- After appointment booking, persist in `appointments` table
- Add appointment timeline events to lead detail view
- Metrics engine integration (optional)

---

## 8. Observability

### Micrometer counters

| Metric | Description |
|--------|-------------|
| `crm.c24.leads.created` | Leads created via C24 API proxy |
| `crm.c24.appointments.booked` | Appointments booked via C24 API proxy |
| `crm.appointments.created` | Appointments persisted locally |
| `crm.appointments.rescheduled` | Appointments rescheduled |

### Audit events

| Action | Table | Description |
|--------|-------|-------------|
| `APPOINTMENT_BOOK` | appointments | New appointment created |
| `APPOINTMENT_RESCHEDULE` | appointments | Appointment rescheduled |
| `APPOINTMENT_STATUS_UPDATE` | appointments | Status change |

---

## 9. Coverage Checklist

- [x] Vehicle catalog proxy (8 endpoints)
- [x] Partners lead proxy (7 endpoints)
- [x] Ola Maps proxy (2 endpoints)
- [x] Appointments table migration
- [x] sell_leads_master C24 field extensions
- [x] AppointmentEntity + Repository
- [x] AppointmentCommandService + AppointmentQueryService
- [x] AppointmentController (CRUD)
- [x] Cars24Properties configuration
- [x] application.yml environment variable mapping
- [x] Micrometer metrics
- [x] Audit logging
- [ ] Frontend migration to backend proxy (Phase 3)
- [ ] Integration tests for proxy endpoints
- [ ] E2E test for lead creation → appointment booking flow
