/**
 * PostgreSQL persistence adapter.
 *
 * Maps the storage-neutral {@link CharacterSnapshot} / item-ledger contracts onto PostgreSQL
 * while keeping every DB mechanic — optimistic versioning, idempotent economic writes, identity
 * resolution — out of the gameplay systems. Built against the {@link SqlClient} port so it can be
 * driven by the real `pg` driver in production and an in-memory client in tests.
 *
 * Implements persistence subsystem items 1 (adapter), 6 (versioning) and 7 (item ledger).
 */
import {
  type CharacterSnapshot,
  type ItemTransactionAuditEvent,
  type ItemTransactionAuditRecord,
  parseCharacterSnapshot,
  parseItemTransactionAuditEvent,
  parseItemTransactionAuditRecord,
} from "@old-town/shared";
import type { Logger } from "../../logger";
import {
  type PersistenceAdapter,
  PersistenceContentVersionError,
  PersistenceIdempotencyConflictError,
  PersistenceValidationError,
  PersistenceVersionConflictError,
} from "../adapter";
import {
  type EconomyCommitInput,
  type EconomyCommitResult,
  economyPayloadHash,
  type EconomyStore,
} from "../economy";
import {
  type CharacterStateColumns,
  type CharacterStateRow,
  snapshotToStateColumns,
  stateRowToSnapshot,
} from "./character-state-row";
import type { SqlClient, SqlValue } from "./sql-client";
import { SQL } from "./statements";

/** Upgrades a stored snapshot from one content version to the running build, or returns undefined. */
export type ContentMigrator = (
  snapshot: CharacterSnapshot,
  fromVersion: number,
  toVersion: number,
) => CharacterSnapshot | undefined;

export interface PostgresPersistenceAdapterOptions {
  readonly client: SqlClient;
  /** Logical world that owns saves from this process. Stored on each row for later queries. */
  readonly worldId?: string;
  /** Content build version stamped onto saves and ledger rows so old data is never mystery meat. */
  readonly contentVersion?: number;
  /** Upgrades stored snapshots whose content_version is behind the running build (item 11). */
  readonly contentMigrator?: ContentMigrator;
  readonly logger?: Pick<Logger, "debug" | "warn">;
}

const DEFAULT_WORLD_ID = "old_town_dev";
const DEFAULT_CONTENT_VERSION = 1;
const STUB_CHARACTER_DEFAULTS = { tileX: 0, tileY: 0, plane: 0, health: 1, maxHealth: 1 } as const;
/** Synthetic audit owners (ground/world events) that do not map to a real character row. */
const RESERVED_CHARACTER_ID = /^(world|entity:\d+)$/;

export class PostgresPersistenceAdapter implements PersistenceAdapter, EconomyStore {
  readonly kind = "postgres";
  readonly enabled = true;
  private readonly client: SqlClient;
  private readonly worldId: string;
  private readonly contentVersion: number;
  private readonly contentMigrator: ContentMigrator | undefined;
  private readonly logger: Pick<Logger, "debug" | "warn"> | undefined;
  /** Last version this process synced per character, for optimistic concurrency on save. */
  private readonly versions = new Map<string, number>();

  constructor(options: PostgresPersistenceAdapterOptions) {
    this.client = options.client;
    this.worldId = options.worldId ?? DEFAULT_WORLD_ID;
    this.contentVersion = options.contentVersion ?? DEFAULT_CONTENT_VERSION;
    this.contentMigrator = options.contentMigrator;
    this.logger = options.logger;
  }

  /** Last version this process believes is durable for the character (testing / metrics aid). */
  currentVersion(characterId: string): number | undefined {
    return this.versions.get(versionKey(characterId));
  }

  async ping(): Promise<void> {
    await this.client.query(SQL.ping);
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async loadCharacter(characterId: string): Promise<CharacterSnapshot | undefined> {
    const result = await this.client.query<CharacterStateRow>(SQL.loadCharacterStateByDevName, [
      characterId,
    ]);
    const row = result.rows[0];
    if (!row) {
      return undefined;
    }
    let snapshot: CharacterSnapshot;
    try {
      snapshot = stateRowToSnapshot(characterId, row);
    } catch (error) {
      throw new PersistenceValidationError(
        `Invalid character_state row for "${characterId}" during load`,
        error,
      );
    }
    snapshot = this.enforceContentVersion(characterId, snapshot, toInt(row.content_version));
    this.versions.set(versionKey(characterId), toInt(row.version));
    return snapshot;
  }

  async saveCharacter(snapshot: CharacterSnapshot): Promise<void> {
    const validated = validateSnapshot(snapshot);
    await this.client.transaction(async (tx) => {
      await this.persistCharacterState(tx, validated);
    });
  }

  async commitItemMutation(input: EconomyCommitInput): Promise<EconomyCommitResult> {
    if (!input.idempotencyKey) {
      throw new PersistenceValidationError("Economy commit requires an idempotency key", undefined);
    }
    const hash = economyPayloadHash(input);
    // Sort characters by canonical characterId BEFORE any DB write so multi-character commits
    // (trade, death, group mutations) always lock/update in the same order, preventing deadlocks.
    // Copy then sort — never mutate the caller's array.
    const characters = [...input.characters].sort((a, b) =>
      a.characterId.localeCompare(b.characterId),
    );
    const ledger = input.ledger.map((event) => validateLedgerEvent(event));

    return this.client.transaction(async (tx) => {
      // 1. Anchor acquisition — INSERT the idempotency key FIRST, before any character_state,
      //    ledger, or outbox write. ON CONFLICT DO NOTHING returns a row for a brand-new key
      //    (this txn owns it) or no rows for an existing key (replay/conflict path below).
      const inserted = await tx.query<{ payload_hash: unknown }>(SQL.tryInsertEconomyCommit, [
        input.idempotencyKey,
        hash,
        input.tick,
      ]);
      if (inserted.rows.length === 0) {
        // Key already exists — lock it FOR UPDATE and compare the payload hash.
        const prior = await tx.query<{ payload_hash: unknown }>(SQL.lockEconomyCommit, [
          input.idempotencyKey,
        ]);
        const priorHash = prior.rows[0]?.payload_hash;
        if (typeof priorHash === "string" && priorHash === hash) {
          return { status: "replayed" as const };
        }
        throw new PersistenceIdempotencyConflictError(input.idempotencyKey);
      }

      // 2. This transaction owns the key — proceed with character_state + ledger + outbox writes.
      const versions: Record<string, number> = {};
      for (const commit of characters) {
        const snapshot = validateSnapshot(commit.snapshot);
        versions[snapshot.characterId] = await this.persistCharacterState(
          tx,
          snapshot,
          commit.expectedVersion,
        );
      }
      for (const event of ledger) {
        const characterId = await resolveOrCreateCharacterId(tx, event.characterId, undefined);
        await tx.query(SQL.insertItemLedgerEntry, [
          event.tick,
          characterId,
          event.itemId,
          event.quantity,
          event.reason,
          event.beforeQuantity ?? null,
          event.afterQuantity ?? null,
          this.contentVersion,
          event.idempotencyKey ?? null,
          event.metadata,
        ]);
      }
      for (const outboxEvent of input.outbox ?? []) {
        await tx.query(SQL.insertOutboxEvent, [outboxEvent.topic, outboxEvent.payload]);
      }
      return { status: "committed" as const, versions };
    });
  }

  async recordItemTransaction(record: ItemTransactionAuditRecord): Promise<void> {
    const validated = validateItemTransaction(record);
    if (RESERVED_CHARACTER_ID.test(validated.characterId)) {
      this.logger?.debug("persistence", "Skipped ledger write for synthetic owner", {
        characterId: validated.characterId,
        itemId: validated.itemId,
        reason: validated.reason,
      });
      return;
    }
    await this.client.transaction(async (tx) => {
      const characterId = await resolveOrCreateCharacterId(tx, validated.characterId, undefined);
      await tx.query(SQL.insertItemLedgerEntry, [
        validated.tick,
        characterId,
        validated.itemId,
        validated.quantity,
        validated.reason,
        validated.beforeQuantity ?? null,
        validated.afterQuantity ?? null,
        this.contentVersion,
        validated.idempotencyKey ?? null,
        validated.metadata,
      ]);
    });
  }

  async recentItemTransactions(limit = 50): Promise<readonly ItemTransactionAuditRecord[]> {
    const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
    const result = await this.client.query<ItemLedgerRow>(SQL.recentItemLedgerEntries, [safeLimit]);
    return result.rows.map((row) => rowToAuditRecord(row)).toSorted((a, b) => a.id - b.id);
  }

  /**
   * Drain unprocessed outbox events, hand them to `handle`, and mark the successful ones processed
   * (item 12). Atomic outbox with **at-least-once delivery** — handlers MUST be idempotent. If the
   * process crashes after `handle(row)` succeeds but before `processed_at` is set, the row is
   * re-delivered on the next drain. `FOR UPDATE SKIP LOCKED` lets multiple drain workers claim
   * disjoint batches safely; each drain runs in its own transaction.
   *
   * **Row locks are held for the duration of `handle(row)`.** Handlers must be fast and idempotent —
   * long-running external work (HTTP calls, heavy computation) should NOT happen inside the drain
   * transaction, as it holds `FOR UPDATE SKIP LOCKED` locks and an open DB transaction. Instead,
   * enqueue to an external queue and return quickly, or use a separate worker that reads and marks
   * rows without calling `handle` inline.
   */
  async drainOutbox(
    handle: (event: OutboxRow) => Promise<void> | void,
    limit = 100,
  ): Promise<number> {
    return this.client.transaction(async (tx) => {
      const result = await tx.query<OutboxRow>(SQL.drainOutbox, [limit]);
      const processed: number[] = [];
      for (const row of result.rows) {
        await handle(row);
        processed.push(toInt(row.id));
      }
      if (processed.length > 0) {
        await tx.query(SQL.markOutboxProcessed, [processed]);
      }
      return processed.length;
    });
  }

  /**
   * Resolve/create the identity row, refresh its headline columns, and upsert the versioned
   * `character_state` blob with optimistic concurrency. Returns the new durable version. Shared by
   * {@link saveCharacter} and {@link commitItemMutation} so both go through one code path.
   */
  private async persistCharacterState(
    tx: SqlClient,
    snapshot: CharacterSnapshot,
    expectedVersionOverride?: number,
  ): Promise<number> {
    const columns = snapshotToStateColumns(snapshot, this.worldId);
    const characterId = await resolveOrCreateCharacterId(tx, snapshot.characterId, columns);
    await tx.query(SQL.updateCharacterHeadline, [
      characterId,
      columns.worldId,
      columns.tileX,
      columns.tileY,
      columns.plane,
      columns.health,
      columns.maxHealth,
    ]);
    const existing = await tx.query<{ version: unknown }>(SQL.findStateVersion, [characterId]);
    const key = versionKey(snapshot.characterId);
    if (existing.rows.length === 0) {
      await tx.query(SQL.insertCharacterState, [
        characterId,
        this.contentVersion,
        ...stateColumnParams(columns),
      ]);
      this.versions.set(key, 1);
      return 1;
    }
    const expected =
      expectedVersionOverride ?? this.versions.get(key) ?? toInt(existing.rows[0]?.version);
    const updated = await tx.query(SQL.updateCharacterStateOptimistic, [
      characterId,
      expected,
      this.contentVersion,
      ...stateColumnParams(columns),
    ]);
    if (updated.rowCount === 0) {
      throw new PersistenceVersionConflictError(snapshot.characterId, expected);
    }
    const nextVersion = expected + 1;
    this.versions.set(key, nextVersion);
    return nextVersion;
  }

  /** Reconcile a loaded snapshot's content version with the running build (item 11). */
  private enforceContentVersion(
    characterId: string,
    snapshot: CharacterSnapshot,
    storedVersion: number,
  ): CharacterSnapshot {
    if (storedVersion === this.contentVersion) {
      return snapshot;
    }
    const migrated = this.contentMigrator?.(snapshot, storedVersion, this.contentVersion);
    if (migrated) {
      this.logger?.debug("persistence", "Migrated character content version", {
        characterId,
        from: storedVersion,
        to: this.contentVersion,
      });
      return validateSnapshot(migrated);
    }
    throw new PersistenceContentVersionError(characterId, storedVersion, this.contentVersion);
  }
}

export interface OutboxRow {
  readonly [column: string]: unknown;
  readonly id: unknown;
  readonly topic: unknown;
  readonly payload: unknown;
}

interface ItemLedgerRow {
  readonly [column: string]: unknown;
  readonly id: unknown;
  readonly tick: unknown;
  readonly character_id: unknown;
  readonly item_id: unknown;
  readonly quantity: unknown;
  readonly reason: unknown;
  readonly before_quantity: unknown;
  readonly after_quantity: unknown;
  readonly idempotency_key: unknown;
  readonly metadata: unknown;
}

/** SQL params shared by INSERT and UPDATE for `character_state`, after the leading keys. */
function stateColumnParams(columns: CharacterStateColumns): SqlValue[] {
  return [
    columns.worldId,
    columns.tileX,
    columns.tileY,
    columns.plane,
    columns.health,
    columns.maxHealth,
    columns.combatStyle,
    columns.skills as unknown as Record<string, unknown>,
    columns.inventory as unknown as Record<string, unknown>,
    columns.equipment as unknown as Record<string, unknown>,
    columns.bank as unknown as Record<string, unknown>,
    columns.questVars as unknown as Record<string, unknown>,
    columns.savedAt,
  ];
}

async function resolveOrCreateCharacterId(
  tx: SqlClient,
  devName: string,
  columns: CharacterStateColumns | undefined,
): Promise<string> {
  const found = await tx.query<{ id: unknown }>(SQL.resolveCharacterIdByDevName, [devName]);
  const existingId = found.rows[0]?.id;
  if (typeof existingId === "string") {
    return existingId;
  }
  const seed = columns ?? { worldId: DEFAULT_WORLD_ID, ...STUB_CHARACTER_DEFAULTS };
  const created = await tx.query<{ id: unknown }>(SQL.insertDevCharacter, [
    devName,
    seed.worldId,
    seed.tileX,
    seed.tileY,
    seed.plane,
    seed.health,
    seed.maxHealth,
  ]);
  const createdId = created.rows[0]?.id;
  if (typeof createdId !== "string") {
    throw new PersistenceValidationError(
      `INSERT INTO characters for "${devName}" did not return an id`,
      undefined,
    );
  }
  return createdId;
}

function rowToAuditRecord(row: ItemLedgerRow): ItemTransactionAuditRecord {
  return parseItemTransactionAuditRecord({
    id: toInt(row.id),
    tick: toInt(row.tick),
    characterId: String(row.character_id),
    itemId: String(row.item_id),
    quantity: toInt(row.quantity),
    reason: String(row.reason),
    ...(row.before_quantity === null || row.before_quantity === undefined
      ? {}
      : { beforeQuantity: toInt(row.before_quantity) }),
    ...(row.after_quantity === null || row.after_quantity === undefined
      ? {}
      : { afterQuantity: toInt(row.after_quantity) }),
    ...(typeof row.idempotency_key === "string" ? { idempotencyKey: row.idempotency_key } : {}),
    metadata: asMetadata(row.metadata),
  });
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    return JSON.parse(value) as Record<string, unknown>;
  }
  return (value ?? {}) as Record<string, unknown>;
}

function validateSnapshot(snapshot: unknown): CharacterSnapshot {
  try {
    return parseCharacterSnapshot(snapshot);
  } catch (error) {
    throw new PersistenceValidationError("Invalid character snapshot during save", error);
  }
}

function validateItemTransaction(record: unknown): ItemTransactionAuditRecord {
  try {
    return parseItemTransactionAuditRecord(record);
  } catch (error) {
    throw new PersistenceValidationError("Invalid item transaction during save", error);
  }
}

function validateLedgerEvent(event: unknown): ItemTransactionAuditEvent {
  try {
    return parseItemTransactionAuditEvent(event);
  } catch (error) {
    throw new PersistenceValidationError("Invalid ledger event during economy commit", error);
  }
}

function versionKey(characterId: string): string {
  return characterId.toLowerCase();
}

function toInt(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return Number.parseInt(value, 10);
  }
  throw new TypeError(`Expected an integer value, received ${typeof value}`);
}
