-- V001: Identity tables (teams, users)

CREATE TABLE teams (
    team_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name     TEXT NOT NULL,
    region        TEXT,
    city          TEXT,
    tl_user_id    UUID,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
    user_id    UUID PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT,
    phone      TEXT,
    role       TEXT NOT NULL DEFAULT 'KAM' CHECK (role IN ('KAM', 'TL', 'ADMIN')),
    team_id    UUID REFERENCES teams(team_id),
    region     TEXT,
    city       TEXT,
    active     BOOLEAN DEFAULT true,
    must_reset_password BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE teams
    ADD CONSTRAINT fk_teams_tl FOREIGN KEY (tl_user_id) REFERENCES users(user_id);

CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_teams_tl_user_id ON teams(tl_user_id);
CREATE INDEX idx_teams_region ON teams(region);
