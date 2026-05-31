import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  type CharacterSnapshot,
  type ItemTransactionAuditRecord,
  parseCharacterSnapshot,
  parseItemTransactionAuditRecord,
} from "@old-town/shared";
import { z } from "zod";

const JSON_STORE_VERSION = 1;

const jsonStoreSchema = z
  .object({
    version: z.literal(JSON_STORE_VERSION),
    characters: z.record(z.string().min(1), z.unknown()).default({}),
    auditItemTransactions: z.array(z.unknown()).default([]),
  })
  .strict();

export type PersistenceAdapterKind = "disabled" | "memory" | "json_file";

export interface PersistenceAdapter {
  readonly kind: PersistenceAdapterKind;
  readonly enabled: boolean;
  loadCharacter(characterId: string): Promise<CharacterSnapshot | undefined>;
  saveCharacter(snapshot: CharacterSnapshot): Promise<void>;
  recordItemTransaction(record: ItemTransactionAuditRecord): Promise<void>;
  recentItemTransactions(limit?: number): Promise<readonly ItemTransactionAuditRecord[]>;
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

export class MemoryPersistenceAdapter implements PersistenceAdapter {
  readonly kind = "memory";
  readonly enabled = true;
  private readonly snapshots = new Map<string, CharacterSnapshot>();
  private readonly itemTransactions: ItemTransactionAuditRecord[] = [];

  async loadCharacter(characterId: string): Promise<CharacterSnapshot | undefined> {
    const snapshot = this.snapshots.get(characterId);
    return snapshot ? cloneSnapshot(validateSnapshot(snapshot, "load")) : undefined;
  }

  async saveCharacter(snapshot: CharacterSnapshot): Promise<void> {
    const validated = validateSnapshot(snapshot, "save");
    this.snapshots.set(validated.characterId, cloneSnapshot(validated));
  }

  async recordItemTransaction(record: ItemTransactionAuditRecord): Promise<void> {
    this.itemTransactions.push(cloneAuditRecord(validateItemTransaction(record, "save")));
  }

  async recentItemTransactions(limit = 50): Promise<readonly ItemTransactionAuditRecord[]> {
    return recent(this.itemTransactions, limit).map(cloneAuditRecord);
  }
}

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

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: unknown }).code === "ENOENT"
  );
}
