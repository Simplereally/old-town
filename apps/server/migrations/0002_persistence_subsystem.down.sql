-- Down migration for 0002_persistence_subsystem.up.sql.

BEGIN;

DROP INDEX IF EXISTS idx_audit_item_transactions_idempotency;
ALTER TABLE audit_item_transactions DROP COLUMN IF EXISTS idempotency_key;
ALTER TABLE audit_item_transactions DROP COLUMN IF EXISTS content_version;

DROP TABLE IF EXISTS world_sessions;
DROP TABLE IF EXISTS character_state;

COMMIT;
