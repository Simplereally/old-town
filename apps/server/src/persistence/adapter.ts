import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  type CharacterSnapshot,
  type ItemTransactionAuditEvent,
  type ItemTransactionAuditRecord,
  parseCharacterSnapshot,
  parseItemTransactionAuditEvent,
  parseItemTransactionAuditRecord,
} from "@old-town/shared";
import { z } from "zod";
import {
  type EconomyCommitInput,
  type EconomyCommitResult,
  economyPayloadHash,
  type EconomyStore,
} from "./economy";

const JSON_STORE_VERSION = 1;

const jsonStoreSchema = z
  .object({
    version: z.literal(JSON_STORE_VERSION),
    characters: z.record(z.string().min(1), z.unknown()).default({}),
    auditItemTransactions: z.array(z.unknown()).default([]),
  })
  .strict();

export type PersistenceAdapterKind = "disabled" | "memory" | "json_file" | "postgres";

export interface PersistenceAdapter {
  readonly kind: PersistenceAdapterKind;
  readonly enabled: boolean;
  loadCharacter(characterId: string): Promise<CharacterSnapshot | undefined>;
  saveCharacter(snapshot: CharacterSnapshot): Promise<void>;
  recordItemTransaction(record: ItemTransactionAuditRecord): Promise<void>;
  recentItemTransactions(limit?: number): Promise<readonly ItemTransactionAuditRecord[]>;
  /**
   * Atomic economy transaction (snapshot + ledger + outbox in one commit). Present only on durable
   * adapters (Postgres, Memory); absent on disabled/json so a mutation is never silently dropped.
   */
  commitItemMutation?(input: EconomyCommitInput): Promise<EconomyCommitResult>;
  /** Verify the backing store is reachable. Resolves for stores that are always ready. */
  ping?(): Promise<void>;
  /** Release any pooled connections / file handles held by the adapter. */
  close?(): Promise<void>;
}

export class PersistenceValidationError extends Error {
  constructor(
    message: string,
    override readonly cause: unknown,
  ) {
    super(message);
    this.name = "PersistenceValidationError";
  }
}

/**
 * Thrown when an optimistic save loses the version race: the stored row advanced
 * past the version the world process loaded. Signals a duplicate session, a stale
 * save, or a crash-recovery edge case rather than a routine failure.
 */
export class PersistenceVersionConflictError extends Error {
  constructor(
    readonly characterId: string,
    readonly expectedVersion: number,
  ) {
    super(
      `Optimistic save conflict for character "${characterId}" at expected version ${expectedVersion}`,
    );
    this.name = "PersistenceVersionConflictError";
  }
}

/** Thrown when persistence configuration is invalid for the selected driver. */
export class PersistenceConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceConfigError";
  }
}

/**
 * Thrown when an idempotency key is replayed with a *different* payload — a genuine bug (two
 * distinct economic effects collided on one key) rather than a safe retry. Never silently ignored.
 */
export class PersistenceIdempotencyConflictError extends Error {
  constructor(readonly idempotencyKey: string) {
    super(`Idempotency key "${idempotencyKey}" was replayed with a different payload`);
    this.name = "PersistenceIdempotencyConflictError";
  }
}

/**
 * Thrown when a stored save's `content_version` does not match the running build and no migration
 * path upgrades it. Prevents silently loading mystery-meat state after item/quest/region changes.
 */
export class PersistenceContentVersionError extends Error {
  constructor(
    readonly characterId: string,
    readonly storedVersion: number,
    readonly currentVersion: number,
  ) {
    super(
      `Character "${characterId}" content_version ${storedVersion} is incompatible with build content_version ${currentVersion} and no migration is registered`,
    );
    this.name = "PersistenceContentVersionError";
  }
}

export class DisabledPersistenceAdapter implements PersistenceAdapter {
  readonly kind = "disabled";
  readonly enabled = false;

  async loadCharacter(_characterId: string): Promise<CharacterSnapshot | undefined> {
    return undefined;
  }

  async saveCharacter(snapshot: CharacterSnapshot): Promise<void> {
    validateSnapshot(snapshot, "save");
  }

  async recordItemTransaction(record: ItemTransactionAuditRecord): Promise<void> {
    validateItemTransaction(record, "save");
  }

  async recentItemTransactions(_limit = 50): Promise<readonly ItemTransactionAuditRecord[]> {
    return [];
  }
}

export class MemoryPersistenceAdapter implements PersistenceAdapter, EconomyStore {
  readonly kind = "memory";
  readonly enabled = true;
  private readonly snapshots = new Map<string, CharacterSnapshot>();
  private readonly itemTransactions: ItemTransactionAuditRecord[] = [];
  private readonly seenIdempotencyKeys = new Set<string>();
  private readonly versions = new Map<string, number>();
  /** Idempotency anchor: key -> payload hash, mirrors the Postgres `economy_commits` table. */
  private readonly economyCommits = new Map<string, string>();
  private readonly outboxEvents: { topic: string; payload: Record<string, unknown> }[] = [];
  private nextAuditId = 1;

  async loadCharacter(characterId: string): Promise<CharacterSnapshot | undefined> {
    const snapshot = this.snapshots.get(characterId);
    return snapshot ? cloneSnapshot(validateSnapshot(snapshot, "load")) : undefined;
  }

  async saveCharacter(snapshot: CharacterSnapshot): Promise<void> {
    const validated = validateSnapshot(snapshot, "save");
    this.snapshots.set(validated.characterId, cloneSnapshot(validated));
  }

  async recordItemTransaction(record: ItemTransactionAuditRecord): Promise<void> {
    const validated = validateItemTransaction(record, "save");
    if (isDuplicateIdempotencyKey(this.seenIdempotencyKeys, validated.idempotencyKey)) {
      return;
    }
    this.nextAuditId = Math.max(this.nextAuditId, validated.id + 1);
    this.itemTransactions.push(cloneAuditRecord(validated));
  }

  async recentItemTransactions(limit = 50): Promise<readonly ItemTransactionAuditRecord[]> {
    return recent(this.itemTransactions, limit).map(cloneAuditRecord);
  }

  /** Last version this process believes is durable for the character (testing / metrics aid). */
  currentVersion(characterId: string): number | undefined {
    return this.versions.get(characterId.toLowerCase());
  }

  /** Atomic in-memory economy transaction — the same contract the Postgres adapter enforces. */
  async commitItemMutation(input: EconomyCommitInput): Promise<EconomyCommitResult> {
    const hash = economyPayloadHash(input);
    const existing = this.economyCommits.get(input.idempotencyKey);
    if (existing !== undefined) {
      if (existing === hash) {
        return { status: "replayed" };
      }
      throw new PersistenceIdempotencyConflictError(input.idempotencyKey);
    }

    // Sort characters by canonical characterId BEFORE any mutation so multi-character commits
    // always apply in the same order (mirrors the Postgres adapter's deadlock prevention).
    const characters = [...input.characters].sort((a, b) =>
      a.characterId.localeCompare(b.characterId),
    );

    // Validate everything (and check optimistic versions) before mutating anything.
    const validatedCharacters = characters.map((commit) => {
      const snapshot = validateSnapshot(commit.snapshot, "save");
      const key = snapshot.characterId.toLowerCase();
      const current = this.versions.get(key) ?? 0;
      const expected = commit.expectedVersion ?? current;
      if (current !== 0 && expected !== current) {
        throw new PersistenceVersionConflictError(snapshot.characterId, expected);
      }
      return { key, snapshot, nextVersion: current + 1 };
    });
    const ledger = input.ledger.map((event) => validateItemTransactionEvent(event));

    const versions: Record<string, number> = {};
    for (const { key, snapshot, nextVersion } of validatedCharacters) {
      this.snapshots.set(snapshot.characterId, cloneSnapshot(snapshot));
      this.versions.set(key, nextVersion);
      versions[snapshot.characterId] = nextVersion;
    }
    for (const event of ledger) {
      this.itemTransactions.push(
        parseItemTransactionAuditRecord({ ...event, id: this.nextAuditId }),
      );
      this.nextAuditId += 1;
    }
    for (const event of input.outbox ?? []) {
      this.outboxEvents.push({ topic: event.topic, payload: { ...event.payload } });
    }
    this.economyCommits.set(input.idempotencyKey, hash);
    return { status: "committed", versions };
  }

  /** Drain and return queued outbox events (test/inspection aid). At-least-once semantics. */
  drainOutbox(): { topic: string; payload: Record<string, unknown> }[] {
    return this.outboxEvents.splice(0, this.outboxEvents.length);
  }
}

/**
 * @deprecated JSON-file persistence is retained only for tiny smoke tests and "save a local
 * sandbox character" demos / debug export. It is not a supported multiplayer development path —
 * use the Postgres driver (default) for local/dev/prod and the Memory driver for tests. See the
 * persistence subsystem notes (item 4).
 */
export class JsonFilePersistenceAdapter implements PersistenceAdapter {
  readonly kind = "json_file";
  readonly enabled = true;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async loadCharacter(characterId: string): Promise<CharacterSnapshot | undefined> {
    await this.writeQueue;
    const store = await this.readStore();
    const snapshot = store.characters[characterId];
    return snapshot === undefined ? undefined : validateSnapshot(snapshot, "load");
  }

  async saveCharacter(snapshot: CharacterSnapshot): Promise<void> {
    const validated = validateSnapshot(snapshot, "save");
    await this.enqueueWrite(async () => {
      const store = await this.readStore();
      store.characters[validated.characterId] = validated;
      await this.writeStore(store);
    });
  }

  async recordItemTransaction(record: ItemTransactionAuditRecord): Promise<void> {
    const validated = validateItemTransaction(record, "save");
    await this.enqueueWrite(async () => {
      const store = await this.readStore();
      if (validated.idempotencyKey !== undefined) {
        const duplicate = store.auditItemTransactions.some(
          (existing) => existing.idempotencyKey === validated.idempotencyKey,
        );
        if (duplicate) {
          return;
        }
      }
      store.auditItemTransactions.push(validated);
      await this.writeStore(store);
    });
  }

  async recentItemTransactions(limit = 50): Promise<readonly ItemTransactionAuditRecord[]> {
    await this.writeQueue;
    const store = await this.readStore();
    return recent(store.auditItemTransactions, limit).map(cloneAuditRecord);
  }

  private async readStore(): Promise<JsonStore> {
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(this.filePath, "utf8"));
    } catch (error) {
      if (isMissingFileError(error)) {
        return emptyStore();
      }
      throw error;
    }

    const parsed = jsonStoreSchema.safeParse(raw);
    if (!parsed.success) {
      throw new PersistenceValidationError("Invalid persistence store file", parsed.error);
    }

    const characters: Record<string, CharacterSnapshot> = {};
    for (const [characterId, snapshot] of Object.entries(parsed.data.characters)) {
      const validated = validateSnapshot(snapshot, "load");
      if (validated.characterId !== characterId) {
        throw new PersistenceValidationError(
          `Snapshot key "${characterId}" does not match characterId "${validated.characterId}"`,
          undefined,
        );
      }
      characters[characterId] = validated;
    }
    const auditItemTransactions = parsed.data.auditItemTransactions.map((record) =>
      validateItemTransaction(record, "load"),
    );
    return { version: parsed.data.version, characters, auditItemTransactions };
  }

  private async writeStore(store: JsonStore): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
    await rename(tmpPath, this.filePath);
  }

  private async enqueueWrite(write: () => Promise<void>): Promise<void> {
    const run = this.writeQueue.then(write, write);
    this.writeQueue = run.catch(() => undefined);
    await run;
  }
}

interface JsonStore {
  readonly version: typeof JSON_STORE_VERSION;
  readonly characters: Record<string, CharacterSnapshot>;
  readonly auditItemTransactions: ItemTransactionAuditRecord[];
}

function emptyStore(): JsonStore {
  return { version: JSON_STORE_VERSION, characters: {}, auditItemTransactions: [] };
}

function validateSnapshot(snapshot: unknown, phase: "load" | "save"): CharacterSnapshot {
  try {
    return parseCharacterSnapshot(snapshot);
  } catch (error) {
    throw new PersistenceValidationError(`Invalid character snapshot during ${phase}`, error);
  }
}

function validateItemTransaction(
  record: unknown,
  phase: "load" | "save",
): ItemTransactionAuditRecord {
  try {
    return parseItemTransactionAuditRecord(record);
  } catch (error) {
    throw new PersistenceValidationError(`Invalid item transaction during ${phase}`, error);
  }
}

function validateItemTransactionEvent(event: unknown): ItemTransactionAuditEvent {
  try {
    return parseItemTransactionAuditEvent(event);
  } catch (error) {
    throw new PersistenceValidationError("Invalid item transaction during commit", error);
  }
}

function cloneSnapshot(snapshot: CharacterSnapshot): CharacterSnapshot {
  return structuredClone(snapshot);
}

function cloneAuditRecord(record: ItemTransactionAuditRecord): ItemTransactionAuditRecord {
  return structuredClone(record);
}

function recent<T>(entries: readonly T[], limit: number): readonly T[] {
  const safeLimit = Math.max(0, Math.floor(limit));
  return entries.slice(Math.max(0, entries.length - safeLimit));
}

/** Records the key as seen and reports whether it was already present (a duplicate). */
function isDuplicateIdempotencyKey(seen: Set<string>, key: string | undefined): boolean {
  if (key === undefined) {
    return false;
  }
  if (seen.has(key)) {
    return true;
  }
  seen.add(key);
  return false;
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: unknown }).code === "ENOENT"
  );
}
