import {
  CHARACTER_SNAPSHOT_VERSION,
  type CharacterSnapshot,
  type ItemTransactionAuditEvent,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  MemoryPersistenceAdapter,
  PersistenceIdempotencyConflictError,
  PersistenceVersionConflictError,
} from "./adapter";
import { type EconomyStore, economyPayloadHash } from "./economy";
import { InMemorySqlClient } from "./postgres/fake-sql-client";
import { PostgresPersistenceAdapter } from "./postgres/postgres-adapter";

function snapshot(characterId: string, coins: number, savedAt = 1_700_000_000): CharacterSnapshot {
  return {
    version: CHARACTER_SNAPSHOT_VERSION,
    characterId,
    savedAt,
    position: { x: 30, y: 32, plane: 0 },
    hitpoints: { health: 10, maxHealth: 10 },
    skills: {},
    inventory: {
      containerId: `inventory:${characterId}`,
      capacity: 28,
      nextUid: 2,
      slots: coins > 0 ? [{ slot: 0, itemId: "coin", quantity: coins, uid: 1 }] : [],
    },
    equipment: { slots: {} },
    vars: {},
    bank: { capacity: 400, nextUid: 1, slots: [] },
  };
}

function ledger(characterId: string, quantity: number, reason: string): ItemTransactionAuditEvent {
  return { tick: 12, characterId, itemId: "coin", quantity, reason, metadata: {} };
}

// Both durable adapters implement EconomyStore + load/recent; assert the contract on each.
type Subject = EconomyStore & {
  loadCharacter(id: string): Promise<CharacterSnapshot | undefined>;
  recentItemTransactions(limit?: number): Promise<readonly { itemId: string; quantity: number }[]>;
  currentVersion(id: string): number | undefined;
};

const subjects: ReadonlyArray<readonly [string, () => Subject]> = [
  [
    "PostgresPersistenceAdapter",
    () => new PostgresPersistenceAdapter({ client: new InMemorySqlClient() }) as unknown as Subject,
  ],
  ["MemoryPersistenceAdapter", () => new MemoryPersistenceAdapter() as unknown as Subject],
];

describe.each(subjects)("EconomyStore.commitItemMutation — %s", (_name, make) => {
  it("commits a single character's snapshot and ledger atomically", async () => {
    const store = make();
    const result = await store.commitItemMutation({
      idempotencyKey: "bank:dev-a:withdraw:1",
      tick: 12,
      characters: [{ characterId: "dev-a", snapshot: snapshot("dev-a", 5) }],
      ledger: [ledger("dev-a", 5, "bank_withdraw")],
    });

    expect(result.status).toBe("committed");
    expect((await store.loadCharacter("dev-a"))?.inventory.slots[0]?.quantity).toBe(5);
    expect(await store.recentItemTransactions()).toHaveLength(1);
    expect(store.currentVersion("dev-a")).toBe(1);
  });

  it("commits a trade across two characters atomically", async () => {
    const store = make();
    const result = await store.commitItemMutation({
      idempotencyKey: "trade:42:accept",
      tick: 20,
      characters: [
        { characterId: "alice", snapshot: snapshot("alice", 0) },
        { characterId: "bob", snapshot: snapshot("bob", 10) },
      ],
      ledger: [ledger("alice", 10, "trade_out"), ledger("bob", 10, "trade_in")],
    });

    expect(result.status).toBe("committed");
    expect((await store.loadCharacter("alice"))?.inventory.slots).toHaveLength(0);
    expect((await store.loadCharacter("bob"))?.inventory.slots[0]?.quantity).toBe(10);
    expect(await store.recentItemTransactions()).toHaveLength(2);
  });

  it("replays a repeated key + same payload as a safe no-op (exactly once)", async () => {
    const store = make();
    const input = {
      idempotencyKey: "bank:dev-a:withdraw:1",
      tick: 12,
      characters: [{ characterId: "dev-a", snapshot: snapshot("dev-a", 5) }],
      ledger: [ledger("dev-a", 5, "bank_withdraw")],
    };
    const first = await store.commitItemMutation(input);
    const second = await store.commitItemMutation(input);

    expect(first.status).toBe("committed");
    expect(second.status).toBe("replayed");
    expect(await store.recentItemTransactions()).toHaveLength(1);
    expect(store.currentVersion("dev-a")).toBe(1);
  });

  it("throws when a key is replayed with a different payload", async () => {
    const store = make();
    await store.commitItemMutation({
      idempotencyKey: "bank:dev-a:withdraw:1",
      tick: 12,
      characters: [{ characterId: "dev-a", snapshot: snapshot("dev-a", 5) }],
      ledger: [ledger("dev-a", 5, "bank_withdraw")],
    });

    await expect(
      store.commitItemMutation({
        idempotencyKey: "bank:dev-a:withdraw:1",
        tick: 12,
        characters: [{ characterId: "dev-a", snapshot: snapshot("dev-a", 99) }],
        ledger: [ledger("dev-a", 99, "bank_withdraw")],
      }),
    ).rejects.toBeInstanceOf(PersistenceIdempotencyConflictError);
  });

  it("rejects a commit with a stale expected version (optimistic concurrency)", async () => {
    const store = make();
    await store.commitItemMutation({
      idempotencyKey: "k1",
      tick: 1,
      characters: [{ characterId: "dev-a", snapshot: snapshot("dev-a", 1) }],
      ledger: [ledger("dev-a", 1, "bank_withdraw")],
    });
    // Version is now 1. A commit asserting it is still 0 must lose.
    await expect(
      store.commitItemMutation({
        idempotencyKey: "k2",
        tick: 2,
        characters: [{ characterId: "dev-a", snapshot: snapshot("dev-a", 2), expectedVersion: 0 }],
        ledger: [ledger("dev-a", 2, "bank_withdraw")],
      }),
    ).rejects.toBeInstanceOf(PersistenceVersionConflictError);
  });
});

describe("economyPayloadHash — array order canonicalization", () => {
  it("produces identical hashes for [alice,bob] vs [bob,alice] characters", () => {
    const inputAB = {
      idempotencyKey: "trade:1",
      tick: 10,
      characters: [
        { characterId: "alice", snapshot: snapshot("alice", 5) },
        { characterId: "bob", snapshot: snapshot("bob", 10) },
      ],
      ledger: [ledger("alice", 5, "trade_out"), ledger("bob", 10, "trade_in")],
      outbox: [{ topic: "trade.complete", payload: { id: 1 } }],
    };
    const inputBA = {
      idempotencyKey: "trade:1",
      tick: 10,
      characters: [
        { characterId: "bob", snapshot: snapshot("bob", 10) },
        { characterId: "alice", snapshot: snapshot("alice", 5) },
      ],
      ledger: [ledger("bob", 10, "trade_in"), ledger("alice", 5, "trade_out")],
      outbox: [{ topic: "trade.complete", payload: { id: 1 } }],
    };
    expect(economyPayloadHash(inputBA)).toBe(economyPayloadHash(inputAB));
  });

  it("produces identical hashes for reordered ledger and outbox arrays", () => {
    const base = {
      idempotencyKey: "k",
      tick: 5,
      characters: [{ characterId: "a", snapshot: snapshot("a", 1) }],
      ledger: [ledger("a", 1, "r1"), ledger("a", 2, "r2")],
      outbox: [
        { topic: "t1", payload: { x: 1 } },
        { topic: "t2", payload: { y: 2 } },
      ],
    };
    const reordered = {
      ...base,
      ledger: [ledger("a", 2, "r2"), ledger("a", 1, "r1")],
      outbox: [
        { topic: "t2", payload: { y: 2 } },
        { topic: "t1", payload: { x: 1 } },
      ],
    };
    expect(economyPayloadHash(reordered)).toBe(economyPayloadHash(base));
  });

  it("produces different hashes for genuinely different payloads", () => {
    const a = {
      idempotencyKey: "k",
      tick: 5,
      characters: [{ characterId: "a", snapshot: snapshot("a", 5) }],
      ledger: [],
    };
    const b = {
      idempotencyKey: "k",
      tick: 5,
      characters: [{ characterId: "a", snapshot: snapshot("a", 99) }],
      ledger: [],
    };
    expect(economyPayloadHash(b)).not.toBe(economyPayloadHash(a));
  });
});

describe.each(subjects)("EconomyStore replay with reordered arrays — %s", (_name, make) => {
  it("treats a replay with reordered character/ledger arrays as replayed, not conflict", async () => {
    const store = make();
    const first = await store.commitItemMutation({
      idempotencyKey: "trade:reorder:1",
      tick: 10,
      characters: [
        { characterId: "alice", snapshot: snapshot("alice", 5) },
        { characterId: "bob", snapshot: snapshot("bob", 10) },
      ],
      ledger: [ledger("alice", 5, "trade_out"), ledger("bob", 10, "trade_in")],
    });
    expect(first.status).toBe("committed");

    // Same mutation, but arrays in opposite order — must be replayed, not a conflict.
    const second = await store.commitItemMutation({
      idempotencyKey: "trade:reorder:1",
      tick: 10,
      characters: [
        { characterId: "bob", snapshot: snapshot("bob", 10) },
        { characterId: "alice", snapshot: snapshot("alice", 5) },
      ],
      ledger: [ledger("bob", 10, "trade_in"), ledger("alice", 5, "trade_out")],
    });
    expect(second.status).toBe("replayed");
  });
});
