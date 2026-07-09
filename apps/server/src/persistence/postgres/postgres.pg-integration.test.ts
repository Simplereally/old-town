/**
 * Real PostgreSQL integration tests (Phase 2 item 3).
 *
 * Skipped unless OLD_TOWN_TEST_DATABASE_URL is set — `bun run test:postgres` points it at the
 * docker-compose database. These exercise the LITERAL SQL and constraints (which the in-memory fake
 * cannot validate): migrations, snapshot round-trip, optimistic version conflict, idempotent
 * economy commits, same-key/different-payload rejection, atomic snapshot+ledger, and the session
 * lease race + expiry.
 */

import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  CHARACTER_SNAPSHOT_VERSION,
  type CharacterSnapshot,
  type ItemTransactionAuditEvent,
} from "@old-town/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PersistenceIdempotencyConflictError, PersistenceVersionConflictError } from "../adapter";
import { createPgSqlClient } from "./pg-sql-client";
import { type OutboxRow, PostgresPersistenceAdapter } from "./postgres-adapter";
import type { SqlClient } from "./sql-client";
import { PostgresWorldSessionStore } from "./world-session-store";

const DATABASE_URL = process.env.OLD_TOWN_TEST_DATABASE_URL;
const MIGRATIONS_DIR = resolve("apps/server/migrations");

let client: SqlClient;

function snapshot(characterId: string, coins: number): CharacterSnapshot {
  return {
    version: CHARACTER_SNAPSHOT_VERSION,
    characterId,
    savedAt: 1_700_000_000,
    position: { x: 30, y: 32, plane: 0 },
    hitpoints: { health: 10, maxHealth: 10 },
    skills: { cooking: { level: 2, xp: 90, boost: 0, drain: 0 } },
    inventory: {
      containerId: `inventory:${characterId}`,
      capacity: 28,
      nextUid: 2,
      slots: coins > 0 ? [{ slot: 0, itemId: "coin", quantity: coins, uid: 1 }] : [],
    },
    equipment: { slots: {} },
    vars: { "quest.points": 1 },
    bank: { capacity: 400, nextUid: 1, slots: [] },
  };
}

function ledger(characterId: string, quantity: number): ItemTransactionAuditEvent {
  return { tick: 12, characterId, itemId: "coin", quantity, reason: "bank_withdraw", metadata: {} };
}

async function runMigrations(direction: "up" | "down"): Promise<void> {
  const suffix = `.${direction}.sql`;
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(suffix)).sort();
  const ordered = direction === "down" ? files.reverse() : files;
  for (const file of ordered) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    await client.query(sql);
  }
}

const uniqueName = (): string => `pg-${randomUUID()}`;

describe.skipIf(!DATABASE_URL)("PostgreSQL integration", () => {
  beforeAll(async () => {
    client = await createPgSqlClient({ connectionString: DATABASE_URL as string });
    await runMigrations("down").catch(() => undefined); // ignore: tables may not exist yet
    await runMigrations("up");
  });

  afterAll(async () => {
    await client?.close();
  });

  it("round-trips a character snapshot and bumps the version on each save", async () => {
    const name = uniqueName();
    const adapter = new PostgresPersistenceAdapter({ client });
    expect(await adapter.loadCharacter(name)).toBeUndefined();

    await adapter.saveCharacter({ ...snapshot(name, 5) });
    expect(adapter.currentVersion(name)).toBe(1);

    await adapter.saveCharacter({ ...snapshot(name, 5), savedAt: 1_700_000_600 });
    expect(adapter.currentVersion(name)).toBe(2);

    const loaded = await adapter.loadCharacter(name);
    expect(loaded?.savedAt).toBe(1_700_000_600);
    expect(loaded?.inventory.slots[0]?.quantity).toBe(5);
  });

  it("rejects a stale save across two processes (DB-level optimistic concurrency)", async () => {
    const name = uniqueName();
    const a = new PostgresPersistenceAdapter({ client });
    const b = new PostgresPersistenceAdapter({ client });

    await a.saveCharacter(snapshot(name, 1));
    await a.loadCharacter(name);
    await b.loadCharacter(name);
    await b.saveCharacter({ ...snapshot(name, 2), savedAt: 1_700_000_600 });

    await expect(
      a.saveCharacter({ ...snapshot(name, 3), savedAt: 1_700_000_900 }),
    ).rejects.toBeInstanceOf(PersistenceVersionConflictError);
  });

  it("applies an idempotent economy commit exactly once and rejects a different payload", async () => {
    const name = uniqueName();
    const adapter = new PostgresPersistenceAdapter({ client });
    const key = `bank:${name}:withdraw:1`;

    const first = await adapter.commitItemMutation({
      idempotencyKey: key,
      tick: 12,
      characters: [{ characterId: name, snapshot: snapshot(name, 5) }],
      ledger: [ledger(name, 5)],
    });
    const second = await adapter.commitItemMutation({
      idempotencyKey: key,
      tick: 12,
      characters: [{ characterId: name, snapshot: snapshot(name, 5) }],
      ledger: [ledger(name, 5)],
    });
    expect(first.status).toBe("committed");
    expect(second.status).toBe("replayed");

    await expect(
      adapter.commitItemMutation({
        idempotencyKey: key,
        tick: 12,
        characters: [{ characterId: name, snapshot: snapshot(name, 99) }],
        ledger: [ledger(name, 99)],
      }),
    ).rejects.toBeInstanceOf(PersistenceIdempotencyConflictError);
  });

  it("commits snapshot + ledger atomically (bank mutation)", async () => {
    const name = uniqueName();
    const adapter = new PostgresPersistenceAdapter({ client });
    await adapter.commitItemMutation({
      idempotencyKey: `bank:${name}:deposit:1`,
      tick: 30,
      characters: [{ characterId: name, snapshot: snapshot(name, 7) }],
      ledger: [ledger(name, 7)],
    });

    const loaded = await adapter.loadCharacter(name);
    expect(loaded?.inventory.slots[0]?.quantity).toBe(7);
    const recent = await adapter.recentItemTransactions(10);
    expect(recent.some((r) => r.characterId === name && r.quantity === 7)).toBe(true);
  });

  it("commits a trade across two characters atomically", async () => {
    const alice = uniqueName();
    const bob = uniqueName();
    const adapter = new PostgresPersistenceAdapter({ client });
    const result = await adapter.commitItemMutation({
      idempotencyKey: `trade:${alice}:${bob}`,
      tick: 40,
      characters: [
        { characterId: alice, snapshot: snapshot(alice, 0) },
        { characterId: bob, snapshot: snapshot(bob, 10) },
      ],
      ledger: [ledger(alice, 10), ledger(bob, 10)],
    });
    expect(result.status).toBe("committed");
    expect((await adapter.loadCharacter(alice))?.inventory.slots).toHaveLength(0);
    expect((await adapter.loadCharacter(bob))?.inventory.slots[0]?.quantity).toBe(10);
  });

  it("enforces one live owner per character, with expiry-based recovery", async () => {
    const name = uniqueName();
    const store = new PostgresWorldSessionStore(client);

    const first = await store.acquire({
      characterId: name,
      worldId: "w1",
      sessionId: "s1",
      now: 1_000,
      leaseDurationMs: 60_000,
    });
    expect(first.ok).toBe(true);

    const second = await store.acquire({
      characterId: name,
      worldId: "w2",
      sessionId: "s2",
      now: 2_000,
      leaseDurationMs: 60_000,
    });
    expect(second.ok).toBe(false);

    // After expiry, a new session can recover ownership.
    const recovered = await store.acquire({
      characterId: name,
      worldId: "w2",
      sessionId: "s2",
      now: 1_000 + 60_001,
      leaseDurationMs: 60_000,
    });
    expect(recovered.ok).toBe(true);
    if (recovered.ok) {
      expect(recovered.recoveredFromExpiredLease).toBe(true);
    }
  });

  it("first-login acquire is a single atomic winner (no double ownership)", async () => {
    const name = uniqueName();
    const store = new PostgresWorldSessionStore(client);
    // Two brand-new concurrent acquires for a character with no existing row.
    const [a, b] = await Promise.all([
      store.acquire({
        characterId: name,
        worldId: "w",
        sessionId: "a",
        now: 1,
        leaseDurationMs: 60_000,
      }),
      store.acquire({
        characterId: name,
        worldId: "w",
        sessionId: "b",
        now: 1,
        leaseDurationMs: 60_000,
      }),
    ]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
  });

  it("down + up migrations are reversible", async () => {
    await runMigrations("down");
    await runMigrations("up");
    const result = await client.query("SELECT to_regclass('public.character_state') AS reg");
    expect(result.rows[0]?.reg).toBe("character_state");
  });

  it("two concurrent identical idempotency keys: one commits, one replays, effect applied once", async () => {
    const name = uniqueName();
    const adapter = new PostgresPersistenceAdapter({ client });
    const key = `bank:${name}:concurrent:same`;

    const payload = {
      idempotencyKey: key,
      tick: 50,
      characters: [{ characterId: name, snapshot: snapshot(name, 5) }],
      ledger: [ledger(name, 5)],
      outbox: [{ topic: "bank.withdraw", payload: { characterId: name, amount: 5 } }],
    };

    const [a, b] = await Promise.all([
      adapter.commitItemMutation(payload),
      adapter.commitItemMutation(payload),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual(["committed", "replayed"]);

    // Snapshot applied exactly once — coins are 5, not 10.
    const loaded = await adapter.loadCharacter(name);
    expect(loaded?.inventory.slots[0]?.quantity).toBe(5);

    // Ledger has exactly one row for this character.
    const recent = await adapter.recentItemTransactions(50);
    const rows = recent.filter((r) => r.characterId === name);
    expect(rows).toHaveLength(1);

    // Outbox drained exactly once.
    expect(await adapter.drainOutbox(() => {})).toBe(1);
    expect(await adapter.drainOutbox(() => {})).toBe(0);
  });

  it("two concurrent same key + different payload: one commits, one throws, no partial writes", async () => {
    const name = uniqueName();
    const adapter = new PostgresPersistenceAdapter({ client });
    const key = `bank:${name}:concurrent:conflict`;

    const payloadA = {
      idempotencyKey: key,
      tick: 60,
      characters: [{ characterId: name, snapshot: snapshot(name, 5) }],
      ledger: [ledger(name, 5)],
      outbox: [{ topic: "bank.withdraw.a", payload: { v: "a" } }],
    };
    const payloadB = {
      idempotencyKey: key,
      tick: 60,
      characters: [{ characterId: name, snapshot: snapshot(name, 99) }],
      ledger: [ledger(name, 99)],
      outbox: [{ topic: "bank.withdraw.b", payload: { v: "b" } }],
    };

    const results = await Promise.allSettled([
      adapter.commitItemMutation(payloadA),
      adapter.commitItemMutation(payloadB),
    ]);

    const committed = results.filter(
      (r) => r.status === "fulfilled" && r.value.status === "committed",
    );
    const rejected = results.filter((r) => r.status === "rejected");
    expect(committed).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      PersistenceIdempotencyConflictError,
    );

    // The committed payload won — coins are 5 (if payloadA won) or 99 (if payloadB won), not both.
    // Either winner is acceptable; the point is exactly one applied.
    const loaded = await adapter.loadCharacter(name);
    const finalCoins = loaded?.inventory.slots[0]?.quantity;
    expect([5, 99]).toContain(finalCoins);

    // Exactly one ledger row (from the winner), no partial write from the rejected payload.
    const recent = await adapter.recentItemTransactions(50);
    const rows = recent.filter((r) => r.characterId === name);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.quantity).toBe(finalCoins);

    // Exactly one outbox event (from the winner).
    expect(await adapter.drainOutbox(() => {})).toBe(1);
    expect(await adapter.drainOutbox(() => {})).toBe(0);
  });

  it("opposite-order two-character commits do not deadlock (deterministic lock order)", async () => {
    const alice = uniqueName();
    const bob = uniqueName();
    const adapter = new PostgresPersistenceAdapter({ client });

    // Pre-create both characters so both commits hit the update (lock) path, not insert.
    await adapter.saveCharacter(snapshot(alice, 0));
    await adapter.saveCharacter(snapshot(bob, 0));

    // Commit A: input order alice, bob. Commit B: input order bob, alice.
    // The adapter sorts by characterId internally, so both lock alice-then-bob — no deadlock.
    const commitA = {
      idempotencyKey: `trade:${alice}:${bob}:a`,
      tick: 70,
      characters: [
        { characterId: alice, snapshot: snapshot(alice, 10) },
        { characterId: bob, snapshot: snapshot(bob, 0) },
      ],
      ledger: [ledger(alice, 10), ledger(bob, 10)],
    };
    const commitB = {
      idempotencyKey: `trade:${alice}:${bob}:b`,
      tick: 70,
      characters: [
        { characterId: bob, snapshot: snapshot(bob, 20) },
        { characterId: alice, snapshot: snapshot(alice, 0) },
      ],
      ledger: [ledger(bob, 20), ledger(alice, 20)],
    };

    // If the adapter did NOT sort, this Promise.all would deadlock (lock_timeout would abort one
    // with a raw pg error). Both should commit cleanly.
    const [resultA, resultB] = await Promise.all([
      adapter.commitItemMutation(commitA),
      adapter.commitItemMutation(commitB),
    ]);
    expect(resultA.status).toBe("committed");
    expect(resultB.status).toBe("committed");

    // Final state: both commits applied. Each transaction writes both characters atomically, so
    // the final snapshot depends on which transaction commits last — non-deterministic under
    // Promise.all. The test's purpose is deadlock prevention, not commit ordering.
    // commitA wins → alice=10, bob=0. commitB wins → alice=0, bob=20.
    const aliceLoaded = await adapter.loadCharacter(alice);
    const bobLoaded = await adapter.loadCharacter(bob);
    const aliceCoins =
      aliceLoaded?.inventory.slots.length === 0 ? 0 : aliceLoaded?.inventory.slots[0]?.quantity;
    const bobCoins =
      bobLoaded?.inventory.slots.length === 0 ? 0 : bobLoaded?.inventory.slots[0]?.quantity;
    expect([
      [10, 0],
      [0, 20],
    ]).toContainEqual([aliceCoins, bobCoins]);

    // Two ledger rows per character (one from each commit).
    const recent = await adapter.recentItemTransactions(50);
    expect(recent.filter((r) => r.characterId === alice)).toHaveLength(2);
    expect(recent.filter((r) => r.characterId === bob)).toHaveLength(2);
  });

  it("concurrent outbox drainers do not double-handle events (FOR UPDATE SKIP LOCKED)", async () => {
    // Insert 6 outbox rows directly so we control the batch sizes.
    for (let i = 0; i < 6; i++) {
      await client.query("INSERT INTO economy_outbox (topic, payload) VALUES ($1, $2)", [
        `drain-test-${i}`,
        { index: i },
      ]);
    }

    const adapter = new PostgresPersistenceAdapter({ client });
    const handledIds = new Set<number>();
    const handledMutex = { current: 0 };

    // Two concurrent drainers, each claiming up to 5 rows. With 6 rows total and
    // FOR UPDATE SKIP LOCKED, one drainer gets a batch and the other gets the
    // remainder — no row is claimed by both.
    const trackHandler = (row: OutboxRow): void => {
      const id = Number(row.id);
      expect(handledIds.has(id)).toBe(false); // no double-handle
      handledIds.add(id);
      handledMutex.current += 1;
    };

    const [countA, countB] = await Promise.all([
      adapter.drainOutbox(trackHandler, 5),
      adapter.drainOutbox(trackHandler, 5),
    ]);

    // All 6 events handled exactly once across both drainers.
    expect(countA + countB).toBe(6);
    expect(handledIds.size).toBe(6);

    // A follow-up drain finds nothing — all rows are marked processed.
    expect(await adapter.drainOutbox(() => {}, 100)).toBe(0);
  });
});
