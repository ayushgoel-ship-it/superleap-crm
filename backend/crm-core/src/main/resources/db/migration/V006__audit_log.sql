-- V006: Audit log

CREATE TABLE audit_log (
    log_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id       UUID REFERENCES users(user_id),
    actor_role     TEXT,
    action         TEXT NOT NULL,
    entity_type    TEXT NOT NULL,
    entity_id      TEXT NOT NULL,
    old_values     JSONB,
    new_values     JSONB,
    change_summary TEXT,
    request_id     TEXT,
    ip_address     TEXT,
    user_agent     TEXT,
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
