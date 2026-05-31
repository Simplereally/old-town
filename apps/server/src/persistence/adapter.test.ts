import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHARACTER_SNAPSHOT_VERSION, type CharacterSnapshot } from "@old-town/shared";
import { afterEach, describe, expect, it } from "vitest";
import {
  DisabledPersistenceAdapter,
  JsonFilePersistenceAdapter,
  MemoryPersistenceAdapter,
  PersistenceValidationError,
} from "./adapter";
import { createPersistenceAdapter } from "./factory";

const snapshot: CharacterSnapshot = {
  version: CHARACTER_SNAPSHOT_VERSION,
  characterId: "dev-a",
  savedAt: 1_700_000_000,
  position: { x: 30, y: 32, plane: 0 },
  hitpoints: { health: 10, maxHealth: 10 },
  skills: { cooking: { level: 2, xp: 90, boost: 0, drain: 0 } },
  inventory: {
    containerId: "inventory:dev-a",
    capacity: 28,
    nextUid: 2,
    slots: [{ slot: 0, itemId: "bread", quantity: 5, uid: 1 }],
  },
  equipment: { slots: {} },
  vars: { "quest.points": 1 },
  bank: { slots: [] },
};

const auditRecord = {
  id: 1,
  tick: 12,
  characterId: "dev-a",
  itemId: "coin",
  quantity: 10,
  reason: "quest_reward",
  beforeQuantity: 0,
  afterQuantity: 10,
  metadata: { questId: "smoke_over_old_town" },
} as const;

let tmpDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tmpDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tmpDirs = [];
});

async function tempFile(name: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "old-town-persistence-"));
  tmpDirs.push(dir);
  return join(dir, name);
}

describe("persistence adapters", () => {
  it("roundtrips through memory storage and returns defensive copies", async () => {
    const adapter = new MemoryPersistenceAdapter();

    await adapter.saveCharacter(snapshot);
    await adapter.recordItemTransaction(auditRecord);
    const loaded = await adapter.loadCharacter(snapshot.characterId);
    expect(loaded).toEqual(snapshot);
    expect(loaded).not.toBe(snapshot);
    await expect(adapter.recentItemTransactions()).resolves.toEqual([auditRecord]);

    if (loaded) {
      loaded.inventory.slots[0] = { slot: 0, itemId: "coin", quantity: 1, uid: 1 };
    }
    await expect(adapter.loadCharacter(snapshot.characterId)).resolves.toEqual(snapshot);
  });

  it("roundtrips through JSON-file storage", async () => {
    const filePath = await tempFile("characters.json");
    const adapter = new JsonFilePersistenceAdapter(filePath);

    await adapter.saveCharacter(snapshot);
    await adapter.recordItemTransaction(auditRecord);

    const raw = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    expect(raw).toMatchObject({
      version: 1,
      characters: { "dev-a": { characterId: "dev-a" } },
      auditItemTransactions: [{ characterId: "dev-a", itemId: "coin", reason: "quest_reward" }],
    });

    const reloaded = new JsonFilePersistenceAdapter(filePath);
    await expect(reloaded.loadCharacter("dev-a")).resolves.toEqual(snapshot);
    await expect(reloaded.recentItemTransactions()).resolves.toEqual([auditRecord]);
    await expect(reloaded.loadCharacter("missing")).resolves.toBeUndefined();
  });

  it("rejects invalid snapshots before save and after load", async () => {
    const memory = new MemoryPersistenceAdapter();
    const invalid = { ...snapshot, position: { x: 30.5, y: 32, plane: 0 } };
    await expect(memory.saveCharacter(invalid as CharacterSnapshot)).rejects.toBeInstanceOf(
      PersistenceValidationError,
    );

    const filePath = await tempFile("invalid-characters.json");
    await writeFile(
      filePath,
      JSON.stringify({
        version: 1,
        characters: { "dev-a": invalid },
      }),
      "utf8",
    );

    const file = new JsonFilePersistenceAdapter(filePath);
    await expect(file.loadCharacter("dev-a")).rejects.toBeInstanceOf(PersistenceValidationError);

    await expect(
      memory.recordItemTransaction({ ...auditRecord, quantity: 0 }),
    ).rejects.toBeInstanceOf(PersistenceValidationError);
  });

  it("uses disabled storage when config turns dev persistence off", async () => {
    const adapter = createPersistenceAdapter({ enabled: false, filePath: "unused.json" });

    expect(adapter).toBeInstanceOf(DisabledPersistenceAdapter);
    expect(adapter.enabled).toBe(false);
    await expect(adapter.saveCharacter(snapshot)).resolves.toBeUndefined();
    await expect(adapter.recordItemTransaction(auditRecord)).resolves.toBeUndefined();
    await expect(adapter.recentItemTransactions()).resolves.toEqual([]);
    await expect(adapter.loadCharacter(snapshot.characterId)).resolves.toBeUndefined();
  });

  it("uses JSON-file storage when config turns dev persistence on", async () => {
    const filePath = await tempFile("configured.json");
    const adapter = createPersistenceAdapter({ enabled: true, filePath });

    expect(adapter).toBeInstanceOf(JsonFilePersistenceAdapter);
    expect(adapter.enabled).toBe(true);
    await adapter.saveCharacter(snapshot);
    await adapter.recordItemTransaction(auditRecord);
    await expect(adapter.loadCharacter(snapshot.characterId)).resolves.toEqual(snapshot);
    await expect(adapter.recentItemTransactions()).resolves.toEqual([auditRecord]);
  });
});
