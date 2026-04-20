# Schema Changelog

All Flyway migrations applied to the CRM PostgreSQL database.

---

## V009 — C24 Integration & Appointments (2026-04-13)

**Migration**: `V009__c24_integration_and_appointments.sql`

### sell_leads_master — New columns

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `c24_lead_id` | TEXT | — | Lead ID from Cars24 API |
| `c24_lead_status` | TEXT | — | ACCEPTED or DUPLICATE |
| `external_source` | TEXT | ORGANIC | ORGANIC or C24_KAM_PANEL |
| `fuel_type` | TEXT | — | Petrol, Diesel, CNG, Electric, Hybrid |
| `transmission` | TEXT | — | Manual, Automatic |
| `ownership` | TEXT | — | 1st, 2nd, 3rd, 4th, 5+ |
| `kilometers` | TEXT | — | Odometer range |

### appointments — New table

Tracks Cars24 appointment bookings for vehicle inspection.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `appointment_id` | TEXT | UNIQUE |
| `lead_id` | TEXT | NOT NULL |
| `c24_lead_id` | TEXT | — |
| `dealer_code` | TEXT | — |
| `customer_name` | TEXT | — |
| `customer_phone` | TEXT | — |
| `appointment_type` | TEXT | CHECK: STORE, HOME |
| `status` | TEXT | CHECK: SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW |
| `scheduled_date` | DATE | NOT NULL |
| `scheduled_time` | TEXT | — |
| `time_period` | TEXT | — |
| `store_id` | TEXT | — |
| `store_name` | TEXT | — |
| `store_address` | TEXT | — |
| `location_lat` | NUMERIC(10,7) | — |
| `location_lng` | NUMERIC(10,7) | — |
| `address` | TEXT | — |
| `city` | TEXT | — |
| `zone_id` | TEXT | — |
| `city_id` | TEXT | — |
| `otp_verified` | BOOLEAN | DEFAULT false |
| `is_reschedule` | BOOLEAN | DEFAULT false |
| `rescheduled_from` | UUID FK | REFERENCES appointments(id) |
| `kam_id` | TEXT | — |
| `tl_id` | TEXT | — |
| `metadata` | JSONB | DEFAULT '{}' |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() |

### New indexes

- `idx_sell_leads_c24_lead_id` on `sell_leads_master(c24_lead_id)`
- `idx_sell_leads_external_source` on `sell_leads_master(external_source)`
- `idx_appt_lead_id` on `appointments(lead_id)`
- `idx_appt_c24_lead_id` on `appointments(c24_lead_id)`
- `idx_appt_dealer_code` on `appointments(dealer_code)`
- `idx_appt_status` on `appointments(status)`
- `idx_appt_scheduled_date` on `appointments(scheduled_date)`
- `idx_appt_kam_id` on `appointments(kam_id)`

---

## V008 — Async Jobs (initial)

**Migration**: `V008__async_jobs.sql`

## V007 — Upload Metadata (initial)

**Migration**: `V007__upload_metadata.sql`

## V006 — Audit Log (initial)

**Migration**: `V006__audit_log.sql`

## V005 — Config Tables (initial)

**Migration**: `V005__config_tables.sql`

## V004 — Timeline & Notification Tables (initial)

**Migration**: `V004__timeline_and_notification_tables.sql`

## V003 — Operational Tables (initial)

**Migration**: `V003__operational_tables.sql`
- `call_events`, `visits`, `untagged_dealers`, `location_requests`

## V002 — Dealer & Lead Tables (initial)

**Migration**: `V002__dealer_and_lead_tables.sql`
- `dealers_master`, `sell_leads_master`, `dcf_leads_master`

## V001 — Identity Tables (initial)

**Migration**: `V001__identity_tables.sql`
- `users`, `teams`
