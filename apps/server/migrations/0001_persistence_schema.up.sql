-- Old Town persistence schema, POC_SPEC.md section 20.
-- This migration prepares the production PostgreSQL shape without changing the local dev adapter.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  character_name text NOT NULL,
  world_id text NOT NULL DEFAULT 'old_town_dev',
  tile_x integer NOT NULL,
  tile_y integer NOT NULL,
  plane smallint NOT NULL DEFAULT 0,
  health integer NOT NULL,
  max_health integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT characters_plane_valid CHECK (plane >= 0 AND plane <= 3),
  CONSTRAINT characters_health_valid CHECK (health >= 0 AND max_health > 0 AND health <= max_health),
  CONSTRAINT characters_name_not_blank CHECK (length(trim(character_name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_account_name
  ON characters (account_id, lower(character_name))
  WHERE account_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_dev_name
  ON characters (lower(character_name))
  WHERE account_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_characters_account_id
  ON characters (account_id);

CREATE TABLE IF NOT EXISTS character_skills (
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  skill_id text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  xp numeric(20, 4) NOT NULL DEFAULT 0,
  boost integer NOT NULL DEFAULT 0,
  drain integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, skill_id),
  CONSTRAINT character_skills_level_valid CHECK (level > 0),
  CONSTRAINT character_skills_xp_valid CHECK (xp >= 0)
);

CREATE INDEX IF NOT EXISTS idx_character_skills_character_id
  ON character_skills (character_id);

CREATE TABLE IF NOT EXISTS character_inventory (
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  container_id text NOT NULL,
  slot integer NOT NULL,
  item_id text NOT NULL,
  quantity integer NOT NULL,
  item_uid integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, slot),
  CONSTRAINT character_inventory_slot_valid CHECK (slot >= 0),
  CONSTRAINT character_inventory_quantity_valid CHECK (quantity > 0),
  CONSTRAINT character_inventory_uid_valid CHECK (item_uid > 0),
  CONSTRAINT character_inventory_item_not_blank CHECK (length(trim(item_id)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_character_inventory_character_id
  ON character_inventory (character_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_character_inventory_uid
  ON character_inventory (character_id, item_uid);

CREATE TABLE IF NOT EXISTS character_equipment (
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  slot text NOT NULL,
  item_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, slot),
  CONSTRAINT character_equipment_slot_not_blank CHECK (length(trim(slot)) > 0),
  CONSTRAINT character_equipment_item_not_blank CHECK (length(trim(item_id)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_character_equipment_character_id
  ON character_equipment (character_id);

CREATE TABLE IF NOT EXISTS character_quest_vars (
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  var_key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, var_key),
  CONSTRAINT character_quest_vars_key_not_blank CHECK (length(trim(var_key)) > 0),
  CONSTRAINT character_quest_vars_scalar CHECK (jsonb_typeof(value) IN ('boolean', 'number', 'string'))
);

CREATE INDEX IF NOT EXISTS idx_character_quest_vars_character_id
  ON character_quest_vars (character_id);

CREATE TABLE IF NOT EXISTS character_unlocked_content (
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  unlock_id text NOT NULL,
  unlocked_at_tick bigint,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, unlock_id),
  CONSTRAINT character_unlocked_content_id_not_blank CHECK (length(trim(unlock_id)) > 0),
  CONSTRAINT character_unlocked_content_tick_valid CHECK (unlocked_at_tick IS NULL OR unlocked_at_tick >= 0)
);

CREATE INDEX IF NOT EXISTS idx_character_unlocked_content_character_id
  ON character_unlocked_content (character_id);

CREATE TABLE IF NOT EXISTS character_bank (
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  slot integer NOT NULL,
  item_id text NOT NULL,
  quantity integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, slot),
  CONSTRAINT character_bank_slot_valid CHECK (slot >= 0),
  CONSTRAINT character_bank_quantity_valid CHECK (quantity > 0),
  CONSTRAINT character_bank_item_not_blank CHECK (length(trim(item_id)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_character_bank_character_id
  ON character_bank (character_id);

CREATE TABLE IF NOT EXISTS world_ground_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text NOT NULL,
  quantity integer NOT NULL,
  tile_x integer NOT NULL,
  tile_y integer NOT NULL,
  plane smallint NOT NULL DEFAULT 0,
  owner_character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  public_at_tick bigint NOT NULL,
  despawn_at_tick bigint NOT NULL,
  source_entity_id bigint,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT world_ground_items_quantity_valid CHECK (quantity > 0),
  CONSTRAINT world_ground_items_plane_valid CHECK (plane >= 0 AND plane <= 3),
  CONSTRAINT world_ground_items_ticks_valid CHECK (public_at_tick >= 0 AND despawn_at_tick >= public_at_tick),
  CONSTRAINT world_ground_items_item_not_blank CHECK (length(trim(item_id)) > 0),
  CONSTRAINT world_ground_items_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_world_ground_items_owner
  ON world_ground_items (owner_character_id);

CREATE INDEX IF NOT EXISTS idx_world_ground_items_visibility
  ON world_ground_items (plane, tile_x, tile_y, owner_character_id, public_at_tick, despawn_at_tick);

CREATE INDEX IF NOT EXISTS idx_world_ground_items_despawn
  ON world_ground_items (despawn_at_tick);

CREATE TABLE IF NOT EXISTS audit_item_transactions (
  id bigserial PRIMARY KEY,
  tick bigint NOT NULL,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
  item_id text NOT NULL,
  quantity integer NOT NULL,
  reason text NOT NULL,
  before_quantity integer,
  after_quantity integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_item_transactions_tick_valid CHECK (tick >= 0),
  CONSTRAINT audit_item_transactions_quantity_valid CHECK (quantity > 0),
  CONSTRAINT audit_item_transactions_before_valid CHECK (before_quantity IS NULL OR before_quantity >= 0),
  CONSTRAINT audit_item_transactions_after_valid CHECK (after_quantity IS NULL OR after_quantity >= 0),
  CONSTRAINT audit_item_transactions_item_not_blank CHECK (length(trim(item_id)) > 0),
  CONSTRAINT audit_item_transactions_reason_not_blank CHECK (length(trim(reason)) > 0),
  CONSTRAINT audit_item_transactions_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_audit_item_transactions_character_id
  ON audit_item_transactions (character_id);

CREATE INDEX IF NOT EXISTS idx_audit_item_transactions_character_tick
  ON audit_item_transactions (character_id, tick DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_audit_item_transactions_item_reason
  ON audit_item_transactions (item_id, reason);

COMMIT;
