-- ============================================================
-- MIGRATION 006: CREATE DCF LEADS + DCF TIMELINE EVENTS
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md §3.1
-- ============================================================

-- DCF LEADS (Dealer Car Finance)
CREATE TABLE IF NOT EXISTS dcf_leads (
  loan_id       TEXT PRIMARY KEY,           -- e.g., 'dcf-ncr-001'
  dealer_id     TEXT NOT NULL REFERENCES dealers(dealer_id),
  kam_user_id   TEXT NOT NULL REFERENCES users(user_id),
  tl_user_id    TEXT NOT NULL REFERENCES users(user_id),

  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  pan           TEXT,
  city          TEXT,

  -- Vehicle
  reg_no        TEXT,
  car           TEXT NOT NULL,              -- e.g., 'Maruti Swift 2019'
  car_value     NUMERIC(12, 2),

  -- Loan
  ltv           NUMERIC(5, 2),             -- Loan-to-Value %
  loan_amount   NUMERIC(12, 2),
  roi           NUMERIC(5, 2),             -- Rate of Interest %
  tenure        INT,                        -- months
  emi           NUMERIC(12, 2),

  -- Channel
  channel       TEXT CHECK (channel IN ('Dealer Shared', 'Walk-in', 'Online')),

  -- Status
  rag_status    TEXT NOT NULL DEFAULT 'green'
                  CHECK (rag_status IN ('green', 'amber', 'red')),
  book_flag     TEXT CHECK (book_flag IN ('Own Book', 'Pmax')),
  car_docs_flag TEXT CHECK (car_docs_flag IN ('Received', 'Pending')),

  -- Conversion
  conversion_owner TEXT,
  conversion_email TEXT,
  conversion_phone TEXT,

  -- Funnel
  current_funnel    TEXT NOT NULL,          -- Onboarding, CIBIL Check, Doc Collection, etc.
  current_sub_stage TEXT,
  overall_status    TEXT NOT NULL,          -- IN_PROGRESS, DISBURSED, REJECTED, etc.

  -- Commission
  first_disbursal_for_dealer BOOLEAN DEFAULT FALSE,
  commission_eligible        BOOLEAN DEFAULT FALSE,
  base_commission            NUMERIC(12, 2) DEFAULT 0,
  booster_applied            BOOLEAN DEFAULT FALSE,
  total_commission           NUMERIC(12, 2) DEFAULT 0,

  -- Financials
  cibil_score       INT,
  employment_type   TEXT,
  monthly_income    NUMERIC(12, 2),

  -- Disbursal
  disbursal_date    TIMESTAMPTZ,
  utr               TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

COMMENT ON TABLE dcf_leads IS 'Dealer Car Finance loan leads';
COMMENT ON COLUMN dcf_leads.rag_status IS 'Traffic-light health: green/amber/red';

-- DCF TIMELINE EVENTS (append-only per P3)
CREATE TABLE IF NOT EXISTS dcf_timeline_events (
  event_id      TEXT PRIMARY KEY,
  loan_id       TEXT NOT NULL REFERENCES dcf_leads(loan_id),
  event_type    TEXT NOT NULL CHECK (event_type IN (
                  'created', 'status_change', 'funnel_change',
                  'cibil_check', 'doc_upload', 'disbursed', 'comment')),
  description   TEXT NOT NULL,
  actor         TEXT,                       -- user_id of who performed action
  details       JSONB,                      -- flexible key-value
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dcf_timeline_events IS 'Append-only event log for DCF leads (P3)';
