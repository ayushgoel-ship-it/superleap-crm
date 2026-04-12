-- V007: Upload metadata for file/object storage

CREATE TABLE upload_metadata (
    upload_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type  TEXT NOT NULL,
    entity_id    TEXT NOT NULL,
    file_name    TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes   BIGINT NOT NULL,
    storage_key  TEXT NOT NULL,
    uploaded_by  UUID NOT NULL REFERENCES users(user_id),
    created_at   TIMESTAMPTZ DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_upload_entity ON upload_metadata(entity_type, entity_id);
CREATE INDEX idx_upload_uploaded_by ON upload_metadata(uploaded_by);
CREATE INDEX idx_upload_not_deleted ON upload_metadata(entity_type, entity_id) WHERE deleted_at IS NULL;
