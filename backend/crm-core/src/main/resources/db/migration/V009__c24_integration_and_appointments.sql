-- V009: Cars24 integration columns and appointments table
--
-- Extends sell_leads_master with C24 external lead tracking fields and
-- creates a dedicated appointments table for C24 appointment bookings.

-- ── Extend sell_leads_master with C24 integration fields ──

ALTER TABLE sell_leads_master ADD COLUMN IF NOT EXISTS c24_lead_id      TEXT;
ALTER TABLE sell_leads_master ADD COLUMN IF NOT EXISTS c24_lead_status  TEXT;
ALTER TABLE sell_leads_master ADD COLUMN IF NOT EXISTS external_source  TEXT DEFAULT 'ORGANIC';
ALTER TABLE sell_leads_master ADD COLUMN IF NOT EXISTS fuel_type        TEXT;
ALTER TABLE sell_leads_master ADD COLUMN IF NOT EXISTS transmission     TEXT;
ALTER TABLE sell_leads_master ADD COLUMN IF NOT EXISTS ownership        TEXT;
ALTER TABLE sell_leads_master ADD COLUMN IF NOT EXISTS kilometers       TEXT;

COMMENT ON COLUMN sell_leads_master.c24_lead_id     IS 'Lead ID returned by Cars24 partners-lead API on creation';
COMMENT ON COLUMN sell_leads_master.c24_lead_status IS 'Status from C24: ACCEPTED, DUPLICATE';
COMMENT ON COLUMN sell_leads_master.external_source IS 'Lead origin: ORGANIC (manual), C24_KAM_PANEL (via C24 API)';
COMMENT ON COLUMN sell_leads_master.fuel_type       IS 'Fuel type: Petrol, Diesel, CNG, Electric, Hybrid';
COMMENT ON COLUMN sell_leads_master.transmission    IS 'Transmission type: Manual, Automatic';
COMMENT ON COLUMN sell_leads_master.ownership        IS 'Ownership number: 1st, 2nd, 3rd, 4th, 5+';
COMMENT ON COLUMN sell_leads_master.kilometers       IS 'Odometer reading range selected during lead creation';

CREATE INDEX IF NOT EXISTS idx_sell_leads_c24_lead_id     ON sell_leads_master(c24_lead_id);
CREATE INDEX IF NOT EXISTS idx_sell_leads_external_source ON sell_leads_master(external_source);

-- ── Appointments table ──
-- Tracks C24 appointment bookings tied to leads. Supports store and home
-- inspection types, reschedule chain, OTP verification status.

CREATE TABLE appointments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id     TEXT UNIQUE,
    lead_id            TEXT NOT NULL,
    c24_lead_id        TEXT,
    dealer_code        TEXT,
    customer_name      TEXT,
    customer_phone     TEXT,
    appointment_type   TEXT CHECK (appointment_type IN ('STORE', 'HOME')),
    status             TEXT DEFAULT 'SCHEDULED'
                       CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED','NO_SHOW')),
    scheduled_date     DATE NOT NULL,
    scheduled_time     TEXT,
    time_period        TEXT,
    store_id           TEXT,
    store_name         TEXT,
    store_address      TEXT,
    location_lat       NUMERIC(10,7),
    location_lng       NUMERIC(10,7),
    address            TEXT,
    city               TEXT,
    zone_id            TEXT,
    city_id            TEXT,
    otp_verified       BOOLEAN DEFAULT false,
    is_reschedule      BOOLEAN DEFAULT false,
    rescheduled_from   UUID REFERENCES appointments(id),
    kam_id             TEXT,
    tl_id              TEXT,
    metadata           JSONB DEFAULT '{}',
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE appointments IS 'Cars24 appointment bookings for vehicle inspection (store or home)';

CREATE INDEX idx_appt_lead_id        ON appointments(lead_id);
CREATE INDEX idx_appt_c24_lead_id    ON appointments(c24_lead_id);
CREATE INDEX idx_appt_dealer_code    ON appointments(dealer_code);
CREATE INDEX idx_appt_status         ON appointments(status);
CREATE INDEX idx_appt_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appt_kam_id         ON appointments(kam_id);
