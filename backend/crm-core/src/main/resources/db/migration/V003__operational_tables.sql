-- V003: Operational tables (calls, visits, tasks, location requests, untagged dealers)

CREATE TABLE call_events (
    call_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id       TEXT,
    dealer_code     TEXT,
    dealer_name     TEXT,
    lead_id         TEXT,
    kam_id          UUID REFERENCES users(user_id),
    tl_id           TEXT,
    phone           TEXT,
    direction       TEXT CHECK (direction IN ('outbound', 'inbound')),
    call_date       DATE,
    call_time       TEXT,
    call_start_time TIMESTAMPTZ,
    call_end_time   TIMESTAMPTZ,
    duration        INTEGER,
    outcome         TEXT,
    call_status     TEXT,
    disposition_code TEXT,
    is_productive   BOOLEAN,
    productivity_source TEXT,
    auto_tags       JSONB DEFAULT '[]',
    kam_comments    TEXT,
    follow_up_tasks JSONB DEFAULT '[]',
    recording_url   TEXT,
    recording_status TEXT,
    transcript      TEXT,
    sentiment_score NUMERIC(5,2),
    sentiment_label TEXT,
    feedback        JSONB DEFAULT '{}',
    tl_review       JSONB DEFAULT '{}',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE visits (
    visit_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id         TEXT,
    dealer_code       TEXT,
    dealer_name       TEXT,
    untagged_dealer_id TEXT,
    lead_id           TEXT,
    kam_id            UUID REFERENCES users(user_id),
    tl_id             TEXT,
    visit_date        DATE,
    visit_time        TEXT,
    visit_type        TEXT CHECK (visit_type IN ('Planned', 'Unplanned')),
    status            TEXT DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'CHECKED_IN', 'COMPLETED')),
    duration          INTEGER,
    geo_lat           NUMERIC(10,7),
    geo_lng           NUMERIC(10,7),
    checkout_lat      NUMERIC(10,7),
    checkout_lng      NUMERIC(10,7),
    check_in_at       TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    is_productive     BOOLEAN,
    productivity_source TEXT,
    outcomes          JSONB DEFAULT '[]',
    kam_comments      TEXT,
    follow_up_tasks   JSONB DEFAULT '[]',
    feedback          JSONB DEFAULT '{}',
    notes             TEXT,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tasks (
    task_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type   TEXT CHECK (entity_type IN ('lead', 'dealer')),
    entity_id     TEXT NOT NULL,
    owner_user_id UUID REFERENCES users(user_id),
    due_at        TIMESTAMPTZ NOT NULL,
    status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    task_type     TEXT,
    description   TEXT,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE location_requests (
    request_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id        TEXT NOT NULL,
    dealer_name      TEXT,
    requested_by     UUID REFERENCES users(user_id),
    requested_by_name TEXT,
    old_latitude     NUMERIC(10,7),
    old_longitude    NUMERIC(10,7),
    new_latitude     NUMERIC(10,7),
    new_longitude    NUMERIC(10,7),
    reason           TEXT,
    status           TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    decided_by       UUID REFERENCES users(user_id),
    decided_by_name  TEXT,
    decided_at       TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE untagged_dealers (
    id          TEXT PRIMARY KEY,
    phone       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    city        TEXT,
    region      TEXT,
    address     TEXT,
    notes       TEXT,
    created_by  UUID REFERENCES users(user_id),
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes for call queries
CREATE INDEX idx_call_events_kam_id ON call_events(kam_id);
CREATE INDEX idx_call_events_dealer_code ON call_events(dealer_code);
CREATE INDEX idx_call_events_call_date ON call_events(call_date);
CREATE INDEX idx_call_events_start_time ON call_events(call_start_time);

-- Indexes for visit queries
CREATE INDEX idx_visits_kam_id ON visits(kam_id);
CREATE INDEX idx_visits_dealer_code ON visits(dealer_code);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
CREATE INDEX idx_visits_status ON visits(status);

-- Indexes for tasks
CREATE INDEX idx_tasks_owner ON tasks(owner_user_id);
CREATE INDEX idx_tasks_entity ON tasks(entity_type, entity_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Indexes for location requests
CREATE INDEX idx_location_requests_dealer ON location_requests(dealer_id);
CREATE INDEX idx_location_requests_status ON location_requests(status);

-- Indexes for untagged dealers
CREATE INDEX idx_untagged_dealers_created_by ON untagged_dealers(created_by);
