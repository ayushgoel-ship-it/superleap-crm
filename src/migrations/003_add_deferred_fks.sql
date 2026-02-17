-- ============================================================
-- MIGRATION 003: ADD DEFERRED FOREIGN KEYS
-- Phase: 6A | Resolves circular dependency: teams ↔ users
-- ============================================================

-- teams.tl_user_id → users.user_id
ALTER TABLE teams
  ADD CONSTRAINT fk_teams_tl_user
  FOREIGN KEY (tl_user_id) REFERENCES users(user_id);
