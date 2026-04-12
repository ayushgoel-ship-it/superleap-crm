-- V008: Async job tracking for bulk import and export operations

CREATE TABLE async_jobs (
    job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type        TEXT NOT NULL CHECK (job_type IN ('BULK_IMPORT', 'EXPORT')),
    status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    input_payload   JSONB DEFAULT '{}',
    result_summary  JSONB DEFAULT '{}',
    error_message   TEXT,
    created_by      UUID REFERENCES users(user_id),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_async_jobs_status ON async_jobs(status);
CREATE INDEX idx_async_jobs_created_by ON async_jobs(created_by);
CREATE INDEX idx_async_jobs_type_status ON async_jobs(job_type, status);
