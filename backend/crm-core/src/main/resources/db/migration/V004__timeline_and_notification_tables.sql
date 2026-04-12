-- V004: Timeline events, visit events, notifications

CREATE TABLE lead_timeline_events (
    event_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id       TEXT NOT NULL,
    event_type    TEXT NOT NULL,
    event_payload JSONB DEFAULT '{}',
    actor_user_id UUID REFERENCES users(user_id),
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dcf_timeline_events (
    event_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dcf_id        TEXT NOT NULL,
    event_type    TEXT NOT NULL,
    event_payload JSONB DEFAULT '{}',
    actor_user_id UUID REFERENCES users(user_id),
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE visit_events (
    event_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id      UUID REFERENCES visits(visit_id),
    dealer_id     TEXT,
    dealer_code   TEXT,
    kam_id        UUID REFERENCES users(user_id),
    event_type    TEXT NOT NULL,
    event_payload JSONB DEFAULT '{}',
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL,
    type            TEXT NOT NULL,
    title           TEXT,
    message         TEXT,
    target_type     TEXT,
    target_id       TEXT,
    is_read         BOOLEAN DEFAULT false,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    read_at         TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_lead_timeline_lead_id ON lead_timeline_events(lead_id);
CREATE INDEX idx_lead_timeline_actor ON lead_timeline_events(actor_user_id);
CREATE INDEX idx_dcf_timeline_dcf_id ON dcf_timeline_events(dcf_id);
CREATE INDEX idx_visit_events_visit_id ON visit_events(visit_id);
CREATE INDEX idx_visit_events_kam_id ON visit_events(kam_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
