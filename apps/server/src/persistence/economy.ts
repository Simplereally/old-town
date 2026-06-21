/**
 * Atomic economy commit contract (Phase 2, item 4).
 *
 * The sacred MMO primitive is not "save character + write audit log" — those can split-brain and
 * mint dupes or eat items. It is a single **atomic game transaction**: durable character state and
 * the economic ledger move together, exactly once, or not at all.
 *
 * A commit may touch multiple characters (a trade moves both sides), appends ledger rows, and may
 * enqueue outbox events — all inside one DB transaction. Idempotency is mandatory: a replayed key
 * with the same payload is a safe no-op; a replayed key with a different payload is a hard error.
 */
import { createHash } from "node:crypto";
import type { CharacterSnapshot, ItemTransactionAuditEvent } from "@old-town/shared";

/**
 * A durable downstream effect written in the same transaction as the mutation (item 12).
 * Delivery is **at-least-once** — handlers MUST be idempotent. The outbox row carries a stable
 * `id` exposed to the handler so downstream consumers can dedupe on re-delivery.
 */
export interface OutboxEvent {
  readonly topic: string;
  readonly payload: Record<string, unknown>;
}

/** One character's post-mutation state to persist atomically. */
export interface EconomyCharacterCommit {
  readonly characterId: string;
  /** Full post-mutation snapshot to persist (the new durable truth for this character). */
  readonly snapshot: CharacterSnapshot;
  /**
   * Version the caller believes is durable, for optimistic concurrency. When omitted, the adapter
   * uses its own per-process version cache (warmed by the last load/commit).
   */
  readonly expectedVersion?: number;
}

export interface EconomyCommitInput {
  /** Mandatory dedupe key — exactly-once application of this economic mutation. */
  readonly idempotencyKey: string;
  readonly tick: number;
  /** One entry for bank/death/admin/shop; two for a player-to-player trade. */
  readonly characters: readonly EconomyCharacterCommit[];
  /** Ledger rows to append describing the item/currency movement. */
  readonly ledger: readonly ItemTransactionAuditEvent[];
  /** Optional downstream effects (broadcasts, analytics) written transactionally. */
  readonly outbox?: readonly OutboxEvent[];
}

export type EconomyCommitResult =
  | { readonly status: "committed"; readonly versions: Readonly<Record<string, number>> }
  | { readonly status: "replayed" };

/**
 * An adapter capable of atomic economic transactions. Durable adapters (Postgres, Memory) implement
 * this; the disabled/json adapters do not — an economy mutation must never be silently dropped.
 */
export interface EconomyStore {
  commitItemMutation(input: EconomyCommitInput): Promise<EconomyCommitResult>;
}

/** Narrow a persistence adapter to an {@link EconomyStore} if it supports atomic commits. */
export function asEconomyStore(value: unknown): EconomyStore | undefined {
  return value !== null &&
    typeof value === "object" &&
    typeof (value as EconomyStore).commitItemMutation === "function"
    ? (value as EconomyStore)
    : undefined;
}

/**
 * Stable content hash of a commit's effect, used to detect a replayed idempotency key carrying a
 * different payload. Deterministic across processes: object keys are sorted, and semantically
 * unordered arrays (`characters`, `ledger`, `outbox`) are canonicalized by sorting their
 * stringified element forms — so `[alice,bob]` and `[bob,alice]` hash identically. The volatile
 * `tick`/`idempotencyKey` are excluded so a genuine retry of the same effect hashes identically.
 *
 * Array order is intentionally treated as insignificant for all three arrays:
 * - `characters`: a trade/death touches both parties regardless of input order.
 * - `ledger`: the set of item movements is the same mutation regardless of row order.
 * - `outbox`: the set of downstream effects is the same regardless of enqueue order.
 */
export function economyPayloadHash(input: EconomyCommitInput): string {
  const canonical = stableStringify({
    characters: canonicalizeArray(
      input.characters.map((c) => ({ characterId: c.characterId, snapshot: c.snapshot })),
    ),
    ledger: canonicalizeArray(input.ledger),
    outbox: canonicalizeArray(input.outbox ?? []),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/** Sort an array's stringified elements so array order does not affect the hash. */
function canonicalizeArray<T>(items: readonly T[]): string[] {
  return items.map((item) => stableStringify(item)).sort();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
