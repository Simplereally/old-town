/** World session lease contract (POC persistence subsystem item 5).
 *
 * Encodes the "one live owner per character" invariant: a character can be actively
 * owned by exactly one world process at a time. The durable truth lives in PostgreSQL
 * (`world_sessions`); this storage-neutral shape is what stores and callers exchange so
 * the rule can also be enforced by an in-memory store for tests and the offline POC.
 */
import { z } from "zod";
import { nonNegInt } from "../content-schemas";

export const worldSessionLeaseSchema = z
  .object({
    /** Stable character identifier (dev name or future account character id). */
    characterId: z.string().min(1).max(128),
    /** Logical world/process that owns the character. */
    worldId: z.string().min(1).max(64),
    /** Transport session that acquired the lease. */
    sessionId: z.string().min(1).max(128),
    /** Epoch milliseconds after which the lease is considered abandoned (crash recovery). */
    leaseExpiresAt: nonNegInt,
    /** Epoch milliseconds of the last heartbeat that renewed the lease. */
    lastHeartbeatAt: nonNegInt,
  })
  .strict();

export type WorldSessionLease = z.infer<typeof worldSessionLeaseSchema>;

export function parseWorldSessionLease(value: unknown): WorldSessionLease {
  return worldSessionLeaseSchema.parse(value);
}

/** Outcome of attempting to acquire a character's world session lease. */
export type WorldSessionAcquireResult =
  | {
      readonly ok: true;
      readonly lease: WorldSessionLease;
      readonly recoveredFromExpiredLease: boolean;
    }
  | { readonly ok: false; readonly reason: "already_owned"; readonly heldBy: WorldSessionLease };
