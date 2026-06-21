/**
 * SQL statements issued by the PostgreSQL persistence layer.
 *
 * Every statement begins with a leading SQL block comment tagged `op:<name>`. The real `pg`
 * driver treats the comment as a no-op, while the in-memory test client dispatches on the tag
 * (see `readOpTag`) instead of parsing SQL — so behavioural tests (versioning, idempotency,
 * round-trips) stay faithful and robust without a live database. Keep the tag as the literal first
 * token of each statement.
 */

export const SQL = {
  ping: "/* op:ping */ SELECT 1 AS ok",

  findCharacterIdByDevName:
    "/* op:characters.find-by-dev-name */ SELECT id FROM characters WHERE account_id IS NULL AND lower(character_name) = lower($1)",

  insertDevCharacter:
    "/* op:characters.insert-dev */ INSERT INTO characters (character_name, world_id, tile_x, tile_y, plane, health, max_health) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",

  updateCharacterHeadline:
    "/* op:characters.update-headline */ UPDATE characters SET world_id = $2, tile_x = $3, tile_y = $4, plane = $5, health = $6, max_health = $7, updated_at = now() WHERE id = $1",

  loadCharacterStateByDevName: `/* op:character_state.load-by-dev-name */
SELECT c.id AS character_id,
       s.version, s.content_version, s.world_id,
       s.tile_x, s.tile_y, s.plane, s.health, s.max_health, s.combat_style,
       s.skills, s.inventory, s.equipment, s.bank, s.quest_vars, s.saved_at
FROM characters c
JOIN character_state s ON s.character_id = c.id
WHERE c.account_id IS NULL AND lower(c.character_name) = lower($1)`,

  findStateVersion:
    "/* op:character_state.find-version */ SELECT version FROM character_state WHERE character_id = $1",

  insertCharacterState: `/* op:character_state.insert */
INSERT INTO character_state
  (character_id, version, content_version, world_id, tile_x, tile_y, plane, health, max_health,
   combat_style, skills, inventory, equipment, bank, quest_vars, saved_at, updated_at)
VALUES
  ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now())`,

  updateCharacterStateOptimistic: `/* op:character_state.update-optimistic */
UPDATE character_state SET
  version = version + 1,
  content_version = $3,
  world_id = $4,
  tile_x = $5,
  tile_y = $6,
  plane = $7,
  health = $8,
  max_health = $9,
  combat_style = $10,
  skills = $11,
  inventory = $12,
  equipment = $13,
  bank = $14,
  quest_vars = $15,
  saved_at = $16,
  updated_at = now()
WHERE character_id = $1 AND version = $2`,

  resolveCharacterIdByDevName:
    "/* op:characters.resolve-id */ SELECT id FROM characters WHERE account_id IS NULL AND lower(character_name) = lower($1)",

  insertItemLedgerEntry: `/* op:audit.insert */
INSERT INTO audit_item_transactions
  (tick, character_id, item_id, quantity, reason, before_quantity, after_quantity,
   content_version, idempotency_key, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING`,

  recentItemLedgerEntries: `/* op:audit.recent */
SELECT a.id, a.tick, c.character_name AS character_id, a.item_id, a.quantity, a.reason,
       a.before_quantity, a.after_quantity, a.idempotency_key, a.metadata
FROM audit_item_transactions a
JOIN characters c ON c.id = a.character_id
ORDER BY a.id DESC
LIMIT $1`,

  getWorldSession: `/* op:world_session.get */
SELECT character_id, world_id, session_id, lease_expires_at, last_heartbeat_at
FROM world_sessions
WHERE character_id = $1`,

  // Single-statement atomic acquire: INSERT wins when no row exists; on conflict the DO UPDATE only
  // fires when the existing lease has expired (< $6) or it is our own session — otherwise zero rows
  // are returned and acquisition is rejected. This closes the first-login race that a SELECT FOR
  // UPDATE leaves open (it locks nothing when the row does not yet exist). `was_update` (xmax <> 0)
  // distinguishes a takeover from a fresh insert.
  acquireWorldSession: `/* op:world_session.acquire */
INSERT INTO world_sessions (character_id, world_id, session_id, lease_expires_at, last_heartbeat_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (character_id) DO UPDATE SET
  world_id = EXCLUDED.world_id,
  session_id = EXCLUDED.session_id,
  lease_expires_at = EXCLUDED.lease_expires_at,
  last_heartbeat_at = EXCLUDED.last_heartbeat_at,
  updated_at = now()
WHERE world_sessions.lease_expires_at < $6 OR world_sessions.session_id = $3
RETURNING (xmax <> 0) AS was_update`,

  renewWorldSession: `/* op:world_session.renew */
UPDATE world_sessions SET lease_expires_at = $3, last_heartbeat_at = $4, updated_at = now()
WHERE character_id = $1 AND session_id = $2`,

  releaseWorldSession: `/* op:world_session.release */
DELETE FROM world_sessions WHERE character_id = $1 AND session_id = $2`,

  // Anchor acquisition: INSERT the idempotency key FIRST, before any character/ledger/outbox
  // write. ON CONFLICT DO NOTHING means a brand-new key returns a row (this txn owns it) while an
  // existing key returns no rows (fall through to lockCommitForReplay to compare hashes). This
  // closes the gap where SELECT FOR UPDATE locks nothing on a first-time key.
  tryInsertEconomyCommit: `/* op:economy.try-insert-commit */
INSERT INTO economy_commits (idempotency_key, payload_hash, tick)
VALUES ($1, $2, $3)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING payload_hash`,

  // Fallback for the replay/conflict path: the try-insert returned no rows, so the key already
  // exists. Lock it FOR UPDATE so we read a stable hash, then compare.
  lockEconomyCommit: `/* op:economy.lock-commit */
SELECT payload_hash FROM economy_commits WHERE idempotency_key = $1 FOR UPDATE`,

  insertOutboxEvent: `/* op:economy.insert-outbox */
INSERT INTO economy_outbox (topic, payload) VALUES ($1, $2)`,

  // At-least-once drain: FOR UPDATE SKIP LOCKED lets multiple drain workers claim disjoint
  // batches without blocking each other. Must run inside a transaction; rows are marked processed
  // after the handler succeeds. If the process crashes between handle and mark, the row is
  // re-delivered — handlers MUST be idempotent.
  drainOutbox: `/* op:economy.drain-outbox */
SELECT id, topic, payload FROM economy_outbox
WHERE processed_at IS NULL
ORDER BY id ASC
LIMIT $1
FOR UPDATE SKIP LOCKED`,

  markOutboxProcessed: `/* op:economy.mark-outbox */
UPDATE economy_outbox SET processed_at = now() WHERE id = ANY($1::bigint[])`,
} as const;

/** Extract the `op:<name>` tag from a tagged statement (used by the in-memory test client). */
export function readOpTag(statement: string): string | undefined {
  return /^\s*\/\*\s*op:([\w.-]+)\s*\*\//.exec(statement)?.[1];
}
