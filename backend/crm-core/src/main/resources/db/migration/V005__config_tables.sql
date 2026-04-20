-- V005: Configuration tables (targets, incentives, metrics, dashboard)

CREATE TABLE targets (
    target_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       TEXT NOT NULL,
    user_name     TEXT,
    team_id       TEXT,
    role          TEXT,
    period        TEXT NOT NULL,
    si_target     INTEGER DEFAULT 0,
    call_target   INTEGER DEFAULT 0,
    visit_target  INTEGER DEFAULT 0,
    dcf_leads_target INTEGER DEFAULT 0,
    dcf_disbursal_target INTEGER DEFAULT 0,
    revenue_target NUMERIC(15,2) DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE incentive_slabs (
    slab_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slab_name     TEXT NOT NULL,
    metric_key    TEXT NOT NULL,
    min_value     NUMERIC(15,2),
    max_value     NUMERIC(15,2),
    payout_amount NUMERIC(15,2),
    payout_type   TEXT DEFAULT 'fixed' CHECK (payout_type IN ('fixed', 'percentage')),
    role_scope    TEXT,
    effective_from TIMESTAMPTZ,
    effective_to  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE incentive_rules (
    rule_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope         TEXT CHECK (scope IN ('team', 'role', 'individual')),
    metric_key    TEXT NOT NULL,
    threshold     NUMERIC(15,2),
    payout        NUMERIC(15,2),
    description   TEXT,
    effective_from TIMESTAMPTZ,
    effective_to  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE incentive_earnings (
    earning_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(user_id),
    period        TEXT NOT NULL,
    metric_values JSONB DEFAULT '{}',
    payout_amount NUMERIC(15,2),
    status        TEXT DEFAULT 'calculated',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE metric_definitions (
    metric_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_key    TEXT UNIQUE NOT NULL,
    display_name  TEXT NOT NULL,
    description   TEXT,
    unit          TEXT,
    aggregation   TEXT DEFAULT 'sum',
    source_table  TEXT,
    source_column TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dashboard_layouts (
    layout_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(user_id),
    layout_config JSONB DEFAULT '{}',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_targets_user_period ON targets(user_id, period);
CREATE INDEX idx_targets_team_period ON targets(team_id, period);
CREATE INDEX idx_incentive_earnings_user_period ON incentive_earnings(user_id, period);
CREATE INDEX idx_incentive_slabs_metric ON incentive_slabs(metric_key);
CREATE INDEX idx_incentive_rules_metric ON incentive_rules(metric_key);
CREATE INDEX idx_dashboard_layouts_user ON dashboard_layouts(user_id);
