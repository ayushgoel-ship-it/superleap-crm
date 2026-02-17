-- ============================================================
-- MIGRATION 005: CREATE LEADS TABLE (C2B / C2D / GS)
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md §3.1
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  lead_id       TEXT PRIMARY KEY,           -- e.g., 'lead-ncr-001'
  dealer_id     TEXT NOT NULL REFERENCES dealers(dealer_id),
  kam_user_id   TEXT NOT NULL REFERENCES users(user_id),
  tl_user_id    TEXT NOT NULL REFERENCES users(user_id),

  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT,

  -- Vehicle
  reg_no        TEXT,
  make          TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INT,
  variant       TEXT,

  -- Business
  channel       TEXT NOT NULL CHECK (channel IN ('C2B', 'C2D', 'GS')),
  lead_type     TEXT NOT NULL CHECK (lead_type IN ('Seller', 'Inventory')),
  stage         TEXT NOT NULL,              -- PR, PLL, Inspection Scheduled, Stock-in, etc.
  sub_stage     TEXT,
  status        TEXT NOT NULL DEFAULT 'Active'
                  CHECK (status IN ('Active', 'Won', 'Lost', 'Expired')),

  -- Financial
  expected_revenue NUMERIC(12, 2) DEFAULT 0,
  actual_revenue   NUMERIC(12, 2) DEFAULT 0,
  cep            NUMERIC(12, 2),           -- Customer Expected Price

  -- Location
  city          TEXT,
  region        TEXT NOT NULL,

  -- Dates
  inspection_date TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

COMMENT ON TABLE leads IS 'C2B/C2D/GS leads from dealer referrals';
COMMENT ON COLUMN leads.stage IS 'PR → PLL → Inspection Scheduled → Inspection Done → Stock-in';
COMMENT ON COLUMN leads.cep IS 'Customer Expected Price';
