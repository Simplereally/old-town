import { describe, expect, it } from "vitest";
import { InMemorySqlClient } from "./fake-sql-client";
import {
  MemoryWorldSessionStore,
  PostgresWorldSessionStore,
  type WorldSessionStore,
} from "./world-session-store";

const LEASE_MS = 60_000;

function acquireInput(sessionId: string, now: number, characterId = "dev-a") {
  return { characterId, worldId: "world-1", sessionId, now, leaseDurationMs: LEASE_MS };
}

// Run the same contract against both implementations so they cannot drift.
const implementations: ReadonlyArray<readonly [string, () => WorldSessionStore]> = [
  ["MemoryWorldSessionStore", () => new MemoryWorldSessionStore()],
  ["PostgresWorldSessionStore", () => new PostgresWorldSessionStore(new InMemorySqlClient())],
];

describe.each(implementations)("%s", (_name, make) => {
  it("grants a lease for an unowned character", async () => {
    const store = make();
    const result = await store.acquire(acquireInput("session-1", 1_000));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recoveredFromExpiredLease).toBe(false);
      expect(result.lease).toMatchObject({
        characterId: "dev-a",
        sessionId: "session-1",
        leaseExpiresAt: 61_000,
      });
    }
  });

  it("rejects a second live session for the same character", async () => {
    const store = make();
    await store.acquire(acquireInput("session-1", 1_000));
    const result = await store.acquire(acquireInput("session-2", 2_000));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("already_owned");
      expect(result.heldBy.sessionId).toBe("session-1");
    }
  });

  it("lets the same session re-acquire its own lease idempotently", async () => {
    const store = make();
    await store.acquire(acquireInput("session-1", 1_000));
    const result = await store.acquire(acquireInput("session-1", 5_000));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lease.leaseExpiresAt).toBe(65_000);
    }
  });

  it("recovers a character whose lease has expired (crash recovery)", async () => {
    const store = make();
    await store.acquire(acquireInput("session-1", 1_000));
    const result = await store.acquire(acquireInput("session-2", 1_000 + LEASE_MS + 1));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recoveredFromExpiredLease).toBe(true);
      expect(result.lease.sessionId).toBe("session-2");
    }
  });

  it("renews only for the owning session", async () => {
    const store = make();
    await store.acquire(acquireInput("session-1", 1_000));
    await expect(
      store.renew({
        characterId: "dev-a",
        sessionId: "session-1",
        now: 30_000,
        leaseDurationMs: LEASE_MS,
      }),
    ).resolves.toBe(true);
    await expect(
      store.renew({
        characterId: "dev-a",
        sessionId: "intruder",
        now: 30_000,
        leaseDurationMs: LEASE_MS,
      }),
    ).resolves.toBe(false);
  });

  it("releases the lease so another session can take over immediately", async () => {
    const store = make();
    await store.acquire(acquireInput("session-1", 1_000));
    await store.release({ characterId: "dev-a", sessionId: "session-1" });

    const result = await store.acquire(acquireInput("session-2", 2_000));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recoveredFromExpiredLease).toBe(false);
    }
  });

  it("ignores a release from a non-owning session", async () => {
    const store = make();
    await store.acquire(acquireInput("session-1", 1_000));
    await store.release({ characterId: "dev-a", sessionId: "intruder" });

    const result = await store.acquire(acquireInput("session-2", 2_000));
    expect(result.ok).toBe(false);
  });
});
