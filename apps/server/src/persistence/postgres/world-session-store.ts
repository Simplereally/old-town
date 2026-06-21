/**
 * World session leasing — the "one live owner per character" invariant (subsystem item 5).
 *
 * A character can be actively owned by exactly one world process at a time. The durable truth is
 * the `world_sessions` table; this storage-neutral {@link WorldSessionStore} lets the rule also be
 * enforced in-memory for tests and the offline POC. A lease is taken on login, renewed by
 * heartbeat, released on logout/world-hop, and recoverable after a crash once it expires.
 */
import type { WorldSessionAcquireResult, WorldSessionLease } from "@old-town/shared";
import { parseWorldSessionLease } from "@old-town/shared";
import type { SqlClient } from "./sql-client";
import { SQL } from "./statements";

export interface WorldSessionAcquireInput {
  readonly characterId: string;
  readonly worldId: string;
  readonly sessionId: string;
  /** Epoch ms "now". */
  readonly now: number;
  /** How long the acquired lease stays valid without a heartbeat. */
  readonly leaseDurationMs: number;
}

export interface WorldSessionHeartbeatInput {
  readonly characterId: string;
  readonly sessionId: string;
  readonly now: number;
  readonly leaseDurationMs: number;
}

export interface WorldSessionReleaseInput {
  readonly characterId: string;
  readonly sessionId: string;
}

export interface WorldSessionStore {
  /** Acquire (or take over an expired) lease. Rejects if another live session owns the character. */
  acquire(input: WorldSessionAcquireInput): Promise<WorldSessionAcquireResult>;
  /** Extend our lease. Returns false if we no longer hold it (lost the race / was kicked). */
  renew(input: WorldSessionHeartbeatInput): Promise<boolean>;
  /** Release the lease if we still own it. No-op otherwise. */
  release(input: WorldSessionReleaseInput): Promise<void>;
}

/** Pure decision: may `sessionId` take the lease given the current holder (if any) at `now`? */
function decideAcquire(
  current: WorldSessionLease | undefined,
  input: WorldSessionAcquireInput,
): { take: true; recoveredFromExpiredLease: boolean } | { take: false; heldBy: WorldSessionLease } {
  if (!current) {
    return { take: true, recoveredFromExpiredLease: false };
  }
  if (current.sessionId === input.sessionId) {
    return { take: true, recoveredFromExpiredLease: false };
  }
  if (input.now < current.leaseExpiresAt) {
    return { take: false, heldBy: current };
  }
  return { take: true, recoveredFromExpiredLease: true };
}

function leaseFrom(input: WorldSessionAcquireInput): WorldSessionLease {
  return parseWorldSessionLease({
    characterId: input.characterId,
    worldId: input.worldId,
    sessionId: input.sessionId,
    leaseExpiresAt: input.now + input.leaseDurationMs,
    lastHeartbeatAt: input.now,
  });
}

/** In-memory lease store for tests and the single-process POC. */
export class MemoryWorldSessionStore implements WorldSessionStore {
  private readonly leases = new Map<string, WorldSessionLease>();

  async acquire(input: WorldSessionAcquireInput): Promise<WorldSessionAcquireResult> {
    const key = leaseKey(input.characterId);
    const decision = decideAcquire(this.leases.get(key), input);
    if (!decision.take) {
      return { ok: false, reason: "already_owned", heldBy: decision.heldBy };
    }
    const lease = leaseFrom(input);
    this.leases.set(key, lease);
    return { ok: true, lease, recoveredFromExpiredLease: decision.recoveredFromExpiredLease };
  }

  async renew(input: WorldSessionHeartbeatInput): Promise<boolean> {
    const key = leaseKey(input.characterId);
    const current = this.leases.get(key);
    if (!current || current.sessionId !== input.sessionId) {
      return false;
    }
    this.leases.set(key, {
      ...current,
      leaseExpiresAt: input.now + input.leaseDurationMs,
      lastHeartbeatAt: input.now,
    });
    return true;
  }

  async release(input: WorldSessionReleaseInput): Promise<void> {
    const key = leaseKey(input.characterId);
    const current = this.leases.get(key);
    if (current && current.sessionId === input.sessionId) {
      this.leases.delete(key);
    }
  }
}

/**
 * PostgreSQL-backed lease store. Acquisition is a single atomic upsert (see `SQL.acquireWorldSession`)
 * so two contenders can never both believe they won — including the first-login case where no row
 * exists yet and `SELECT ... FOR UPDATE` would lock nothing.
 */
export class PostgresWorldSessionStore implements WorldSessionStore {
  constructor(private readonly client: SqlClient) {}

  async acquire(input: WorldSessionAcquireInput): Promise<WorldSessionAcquireResult> {
    const lease = leaseFrom(input);
    const acquired = await this.client.query<{ was_update: unknown }>(SQL.acquireWorldSession, [
      lease.characterId,
      lease.worldId,
      lease.sessionId,
      lease.leaseExpiresAt,
      lease.lastHeartbeatAt,
      input.now,
    ]);
    if (acquired.rowCount === 0) {
      // A live lease is held by another session; report the holder.
      const held = await this.client.query<WorldSessionRow>(SQL.getWorldSession, [
        input.characterId,
      ]);
      const heldBy = held.rows[0] ? rowToLease(held.rows[0]) : lease;
      return { ok: false, reason: "already_owned", heldBy };
    }
    const wasUpdate = acquired.rows[0]?.was_update === true || acquired.rows[0]?.was_update === "t";
    return { ok: true, lease, recoveredFromExpiredLease: wasUpdate };
  }

  async renew(input: WorldSessionHeartbeatInput): Promise<boolean> {
    const result = await this.client.query(SQL.renewWorldSession, [
      input.characterId,
      input.sessionId,
      input.now + input.leaseDurationMs,
      input.now,
    ]);
    return result.rowCount > 0;
  }

  async release(input: WorldSessionReleaseInput): Promise<void> {
    await this.client.query(SQL.releaseWorldSession, [input.characterId, input.sessionId]);
  }
}

interface WorldSessionRow {
  readonly [column: string]: unknown;
  readonly character_id: unknown;
  readonly world_id: unknown;
  readonly session_id: unknown;
  readonly lease_expires_at: unknown;
  readonly last_heartbeat_at: unknown;
}

function rowToLease(row: WorldSessionRow): WorldSessionLease {
  return parseWorldSessionLease({
    characterId: String(row.character_id),
    worldId: String(row.world_id),
    sessionId: String(row.session_id),
    leaseExpiresAt: toInt(row.lease_expires_at),
    lastHeartbeatAt: toInt(row.last_heartbeat_at),
  });
}

function leaseKey(characterId: string): string {
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
