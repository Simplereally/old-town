-- Atomic economy transactions (Phase 2 items 4 & 12).
-- `economy_commits` is the idempotency anchor: one row per economic mutation, recording a payload
-- hash so a replayed key with a different payload is rejected. `economy_outbox` records downstream
-- effects written in the SAME transaction as the mutation, drained later by a worker.

BEGIN;

CREATE TABLE IF NOT EXISTS economy_commits (
  idempotency_key text PRIMARY KEY,
  payload_hash text NOT NULL,
  tick bigint NOT NULL,
  committed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT economy_commits_key_not_blank CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT economy_commits_hash_not_blank CHECK (length(trim(payload_hash)) > 0),
  CONSTRAINT economy_commits_tick_valid CHECK (tick >= 0)
);

CREATE TABLE IF NOT EXISTS economy_outbox (
  id bigserial PRIMARY KEY,
  topic text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT economy_outbox_topic_not_blank CHECK (length(trim(topic)) > 0),
  CONSTRAINT economy_outbox_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

-- Drain worker scans unprocessed rows oldest-first.
CREATE INDEX IF NOT EXISTS idx_economy_outbox_unprocessed
  ON economy_outbox (id)
  WHERE processed_at IS NULL;

COMMIT;
