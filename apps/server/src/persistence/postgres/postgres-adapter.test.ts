import {
  CHARACTER_SNAPSHOT_VERSION,
  type CharacterSnapshot,
  type ItemTransactionAuditRecord,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { PersistenceContentVersionError, PersistenceVersionConflictError } from "../adapter";
import { InMemorySqlClient } from "./fake-sql-client";
import { type OutboxRow, PostgresPersistenceAdapter } from "./postgres-adapter";

function baseSnapshot(overrides: Partial<CharacterSnapshot> = {}): CharacterSnapshot {
  return {
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
    bank: { capacity: 400, nextUid: 1, slots: [] },
    ...overrides,
  };
}

function auditRecord(
  overrides: Partial<ItemTransactionAuditRecord> = {},
): ItemTransactionAuditRecord {
  return {
    id: 1,
    tick: 12,
    characterId: "dev-a",
    itemId: "coin",
    quantity: 10,
    reason: "quest_reward",
    beforeQuantity: 0,
    afterQuantity: 10,
    metadata: { questId: "smoke_over_old_town" },
    ...overrides,
  };
}

function makeAdapter(client = new InMemorySqlClient()) {
  return new PostgresPersistenceAdapter({ client, worldId: "old_town_dev", contentVersion: 3 });
}

describe("PostgresPersistenceAdapter", () => {
  it("round-trips a character through insert and reload", async () => {
    const adapter = makeAdapter();

    expect(await adapter.loadCharacter("dev-a")).toBeUndefined();
    await adapter.saveCharacter(baseSnapshot());

    const loaded = await adapter.loadCharacter("dev-a");
    expect(loaded).toEqual(baseSnapshot());
    expect(adapter.currentVersion("dev-a")).toBe(1);
  });

  it("bumps the optimistic version on each save", async () => {
    const adapter = makeAdapter();
    await adapter.saveCharacter(baseSnapshot());
    await adapter.saveCharacter(baseSnapshot({ savedAt: 1_700_000_600 }));
    expect(adapter.currentVersion("dev-a")).toBe(2);

    const loaded = await adapter.loadCharacter("dev-a");
    expect(loaded?.savedAt).toBe(1_700_000_600);
  });

  it("rejects a stale save when another process advanced the version (optimistic concurrency)", async () => {
    const shared = new InMemorySqlClient();
    const worldA = makeAdapter(shared);
    const worldB = makeAdapter(shared);

    await worldA.saveCharacter(baseSnapshot());
    await worldA.loadCharacter("dev-a");
    await worldB.loadCharacter("dev-a");

    // World B writes first, advancing the row to version 2.
    await worldB.saveCharacter(baseSnapshot({ savedAt: 1_700_000_600 }));

    // World A still believes it holds version 1 → its save must lose the race.
    await expect(
      worldA.saveCharacter(baseSnapshot({ savedAt: 1_700_000_900 })),
    ).rejects.toBeInstanceOf(PersistenceVersionConflictError);
  });

  it("records an item ledger row and reads it back, mapping the uuid owner to the dev name", async () => {
    const adapter = makeAdapter();
    await adapter.saveCharacter(baseSnapshot());
    await adapter.recordItemTransaction(auditRecord());

    const recent = await adapter.recentItemTransactions();
    expect(recent).toHaveLength(1);
    expect(recent[0]).toMatchObject({
      characterId: "dev-a",
      itemId: "coin",
      quantity: 10,
      reason: "quest_reward",
    });
  });

  it("applies an idempotent economic mutation exactly once", async () => {
    const adapter = makeAdapter();
    await adapter.saveCharacter(baseSnapshot());

    const key = "bank:dev-a:withdraw:tick-12";
    await adapter.recordItemTransaction(auditRecord({ idempotencyKey: key }));
    await adapter.recordItemTransaction(auditRecord({ id: 2, idempotencyKey: key }));

    const recent = await adapter.recentItemTransactions();
    expect(recent).toHaveLength(1);
  });

  it("skips ledger writes for synthetic owners that are not real characters", async () => {
    const client = new InMemorySqlClient();
    const adapter = makeAdapter(client);

    await adapter.recordItemTransaction(
      auditRecord({ characterId: "world", reason: "ground_despawn" }),
    );
    await adapter.recordItemTransaction(
      auditRecord({ id: 2, characterId: "entity:42", reason: "ground_despawn" }),
    );

    expect(await adapter.recentItemTransactions()).toHaveLength(0);
    expect(client.executedOps).not.toContain("audit.insert");
  });

  it("auto-creates a stub character row when a ledger write precedes the first save", async () => {
    const adapter = makeAdapter();
    // No saveCharacter yet — mirrors starter-item auditing at player creation.
    await adapter.recordItemTransaction(auditRecord({ reason: "starter_item" }));

    const recent = await adapter.recentItemTransactions();
    expect(recent).toHaveLength(1);
    expect(recent[0]?.characterId).toBe("dev-a");
  });

  it("pings without throwing", async () => {
    await expect(makeAdapter().ping()).resolves.toBeUndefined();
  });

  it("rejects loading a save whose content_version is incompatible and unmigratable", async () => {
    const client = new InMemorySqlClient();
    const writer = new PostgresPersistenceAdapter({ client, contentVersion: 1 });
    await writer.saveCharacter(baseSnapshot());

    const reader = new PostgresPersistenceAdapter({ client, contentVersion: 2 });
    await expect(reader.loadCharacter("dev-a")).rejects.toBeInstanceOf(PersistenceContentVersionError);
  });

  it("migrates a stale-content save through the registered migrator on load", async () => {
    const client = new InMemorySqlClient();
    await new PostgresPersistenceAdapter({ client, contentVersion: 1 }).saveCharacter(baseSnapshot());

    const reader = new PostgresPersistenceAdapter({
      client,
      contentVersion: 2,
      contentMigrator: (snapshot) => ({ ...snapshot, savedAt: snapshot.savedAt + 1 }),
    });
    const loaded = await reader.loadCharacter("dev-a");
    expect(loaded?.savedAt).toBe(baseSnapshot().savedAt + 1);
  });

  it("writes outbox events in the same commit and drains them once", async () => {
    const adapter = makeAdapter();
    await adapter.commitItemMutation({
      idempotencyKey: "trade:1:accept",
      tick: 5,
      characters: [{ characterId: "dev-a", snapshot: baseSnapshot() }],
      ledger: [],
      outbox: [{ topic: "trade.completed", payload: { tradeId: 1 } }],
    });

    const drained: OutboxRow[] = [];
    const count = await adapter.drainOutbox((row) => {
      drained.push(row);
    });
    expect(count).toBe(1);
    expect(drained[0]?.topic).toBe("trade.completed");

    // Already processed — a second drain yields nothing (exactly-once fan-out).
    expect(await adapter.drainOutbox(() => {})).toBe(0);
  });
});
