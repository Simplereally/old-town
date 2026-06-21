-- Old Town persistence subsystem: versioned character snapshots, world session leasing, and an
-- exactly-once item/economy ledger. Builds on 0001 without changing the local dev adapter.

BEGIN;

-- character_state: the doc's "compact snapshot" table (subsystem items 1 & 6).
-- Hot lookup columns (world/position/hitpoints) plus JSONB sub-objects, carrying an optimistic
-- `version` that the adapter bumps on every save to detect duplicate sessions / stale writes.
CREATE TABLE IF NOT EXISTS character_state (
  character_id uuid PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  version bigint NOT NULL DEFAULT 1,
  content_version integer NOT NULL DEFAULT 1,
  world_id text NOT NULL DEFAULT 'old_town_dev',
  tile_x integer NOT NULL,
  tile_y integer NOT NULL,
  plane smallint NOT NULL DEFAULT 0,
  health integer NOT NULL,
  max_health integer NOT NULL,
  combat_style text,
  skills jsonb NOT NULL DEFAULT '{}'::jsonb,
  inventory jsonb NOT NULL DEFAULT '{}'::jsonb,
  equipment jsonb NOT NULL DEFAULT '{}'::jsonb,
  bank jsonb NOT NULL DEFAULT '{}'::jsonb,
  quest_vars jsonb NOT NULL DEFAULT '{}'::jsonb,
  saved_at bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT character_state_version_valid CHECK (version > 0),
  CONSTRAINT character_state_content_version_valid CHECK (content_version > 0),
  CONSTRAINT character_state_plane_valid CHECK (plane >= 0 AND plane <= 3),
  CONSTRAINT character_state_health_valid CHECK (health >= 0 AND max_health > 0 AND health <= max_health),
  CONSTRAINT character_state_combat_style_valid
    CHECK (combat_style IS NULL OR combat_style IN ('stab', 'slash', 'crush', 'ranged', 'magic')),
  CONSTRAINT character_state_skills_object CHECK (jsonb_typeof(skills) = 'object'),
  CONSTRAINT character_state_inventory_object CHECK (jsonb_typeof(inventory) = 'object'),
  CONSTRAINT character_state_equipment_object CHECK (jsonb_typeof(equipment) = 'object'),
  CONSTRAINT character_state_bank_object CHECK (jsonb_typeof(bank) = 'object'),
  CONSTRAINT character_state_quest_vars_object CHECK (jsonb_typeof(quest_vars) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_character_state_world
  ON character_state (world_id);

CREATE INDEX IF NOT EXISTS idx_character_state_content_version
  ON character_state (content_version);

-- world_sessions: durable "one live owner per character" lease (subsystem item 5).
-- Keyed by the game-facing character id (dev name / future account character id) so the lease
-- store stays decoupled from identity-row resolution.
CREATE TABLE IF NOT EXISTS world_sessions (
  character_id text PRIMARY KEY,
  world_id text NOT NULL,
  session_id text NOT NULL,
  lease_expires_at bigint NOT NULL,
  last_heartbeat_at bigint NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT world_sessions_character_not_blank CHECK (length(trim(character_id)) > 0),
  CONSTRAINT world_sessions_session_not_blank CHECK (length(trim(session_id)) > 0),
  CONSTRAINT world_sessions_lease_valid CHECK (lease_expires_at >= last_heartbeat_at)
);

CREATE INDEX IF NOT EXISTS idx_world_sessions_world
  ON world_sessions (world_id);

CREATE INDEX IF NOT EXISTS idx_world_sessions_lease_expires
  ON world_sessions (lease_expires_at);

-- Item/economy ledger hardening (subsystem item 7): stamp content version and enforce
-- exactly-once application of dupe-sensitive mutations via an idempotency key.
ALTER TABLE audit_item_transactions
  ADD COLUMN IF NOT EXISTS content_version integer NOT NULL DEFAULT 1;

ALTER TABLE audit_item_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_item_transactions_idempotency
  ON audit_item_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMIT;
