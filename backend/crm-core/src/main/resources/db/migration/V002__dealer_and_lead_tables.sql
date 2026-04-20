-- V002: Dealer and lead reference tables

CREATE TABLE dealers_master (
    dealer_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_code       TEXT UNIQUE,
    dealer_name       TEXT NOT NULL,
    phone             TEXT,
    city              TEXT,
    region            TEXT,
    address           TEXT,
    segment           TEXT,
    status            TEXT DEFAULT 'active',
    kam_id            UUID REFERENCES users(user_id),
    tl_id             UUID REFERENCES users(user_id),
    sell_onboarded    TEXT DEFAULT 'N',
    dcf_onboarded     TEXT DEFAULT 'N',
    bank_account_status TEXT,
    is_top            BOOLEAN DEFAULT false,
    metadata          JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sell_leads_master (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id             TEXT UNIQUE,
    dealer_id           TEXT,
    dealer_code         TEXT,
    dealer_name         TEXT,
    customer_name       TEXT,
    customer_phone      TEXT,
    channel             TEXT CHECK (channel IN ('DealerReferral','YardReferral','OSS','YRS','DCF','Direct','C2B','C2D','GS')),
    lead_type           TEXT,
    stage               TEXT,
    status              TEXT DEFAULT 'open' CHECK (status IN ('open','won','lost')),
    rag_status          TEXT CHECK (rag_status IN ('green','amber','red')),
    make                TEXT,
    model               TEXT,
    year                TEXT,
    variant             TEXT,
    reg_no              TEXT,
    city                TEXT,
    region              TEXT,
    inspection_city     TEXT,
    growth_zone         TEXT,
    gs_flag             TEXT,
    franchise_flag      TEXT,
    verified            TEXT,
    expected_revenue    NUMERIC(15,2),
    actual_revenue      NUMERIC(15,2),
    cep                 NUMERIC(15,2),
    cep_confidence      TEXT,
    c24_quote           NUMERIC(15,2),
    max_c24_quote       NUMERIC(15,2),
    target_price        NUMERIC(15,2),
    seller_agreed_price NUMERIC(15,2),
    bid_amount          NUMERIC(15,2),
    current_appt_date   TIMESTAMPTZ,
    inspection_date     TIMESTAMPTZ,
    token_date          TIMESTAMPTZ,
    stockin_date        TIMESTAMPTZ,
    stock_out_date      TIMESTAMPTZ,
    final_token_date    TIMESTAMPTZ,
    final_si_date       TIMESTAMPTZ,
    latest_ocb_raised_at TIMESTAMPTZ,
    converted_at        TIMESTAMPTZ,
    reg_appt_rank       INTEGER,
    reg_insp_rank       INTEGER,
    reg_token_rank      INTEGER,
    reg_stockin_rank    INTEGER,
    ocb_run_count       INTEGER DEFAULT 0,
    kam_id              TEXT,
    tl_id               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dcf_leads_master (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dcf_id              TEXT UNIQUE,
    dealer_id           TEXT,
    dealer_code         TEXT,
    dealer_city         TEXT,
    dealer_account      TEXT,
    customer_name       TEXT,
    customer_phone      TEXT,
    pan                 TEXT,
    reg_no              TEXT,
    car_value           NUMERIC(15,2),
    loan_amount         NUMERIC(15,2),
    roi                 NUMERIC(8,4),
    tenure              INTEGER,
    emi                 NUMERIC(15,2),
    ltv                 NUMERIC(8,4),
    final_offer_ltv     NUMERIC(8,4),
    rag_status          TEXT CHECK (rag_status IN ('green','amber','red')),
    red_flag            TEXT,
    risk_bucket         TEXT,
    book_flag           TEXT,
    car_docs_flag       TEXT,
    current_funnel      TEXT,
    current_sub_stage   TEXT,
    overall_status      TEXT,
    funnel_loan_state   TEXT,
    cibil_score         INTEGER,
    cibil_date          TIMESTAMPTZ,
    employment_type     TEXT,
    monthly_income      NUMERIC(15,2),
    conversion_owner    TEXT,
    conversion_email    TEXT,
    conversion_phone    TEXT,
    commission_eligible BOOLEAN DEFAULT false,
    base_commission     NUMERIC(15,2),
    booster_applied     NUMERIC(15,2),
    total_commission    NUMERIC(15,2),
    disbursal_date      TIMESTAMPTZ,
    disbursal_utr       TEXT,
    kam_id              TEXT,
    kam_name            TEXT,
    tl_id               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Indexes for dealer queries
CREATE INDEX idx_dealers_master_code ON dealers_master(dealer_code);
CREATE INDEX idx_dealers_master_kam_id ON dealers_master(kam_id);
CREATE INDEX idx_dealers_master_tl_id ON dealers_master(tl_id);
CREATE INDEX idx_dealers_master_city ON dealers_master(city);
CREATE INDEX idx_dealers_master_region ON dealers_master(region);
CREATE INDEX idx_dealers_master_segment ON dealers_master(segment);
CREATE INDEX idx_dealers_master_status ON dealers_master(status);

-- Indexes for lead queries
CREATE INDEX idx_sell_leads_lead_id ON sell_leads_master(lead_id);
CREATE INDEX idx_sell_leads_dealer_code ON sell_leads_master(dealer_code);
CREATE INDEX idx_sell_leads_kam_id ON sell_leads_master(kam_id);
CREATE INDEX idx_sell_leads_status ON sell_leads_master(status);
CREATE INDEX idx_sell_leads_channel ON sell_leads_master(channel);
CREATE INDEX idx_sell_leads_created_at ON sell_leads_master(created_at);

-- Indexes for DCF queries
CREATE INDEX idx_dcf_leads_dcf_id ON dcf_leads_master(dcf_id);
CREATE INDEX idx_dcf_leads_dealer_code ON dcf_leads_master(dealer_code);
CREATE INDEX idx_dcf_leads_kam_id ON dcf_leads_master(kam_id);
CREATE INDEX idx_dcf_leads_rag ON dcf_leads_master(rag_status);
