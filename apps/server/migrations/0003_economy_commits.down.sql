-- Down migration for 0003_economy_commits.up.sql.

BEGIN;

DROP INDEX IF EXISTS idx_economy_outbox_unprocessed;
DROP TABLE IF EXISTS economy_outbox;
DROP TABLE IF EXISTS economy_commits;

COMMIT;
