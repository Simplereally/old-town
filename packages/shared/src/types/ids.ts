/**
 * Branded (opaque) identifier types. A brand tags a base primitive with a unique
 * compile-time label so two ids with the same underlying representation cannot be
 * accidentally swapped. Brands exist only in the type system — at runtime an
 * `EntityId` is just a number and an `ItemId` is just a string.
 */

/** Internal brand key. Never emitted at runtime. */
declare const brand: unique symbol;

/** A `Base` value tagged with a unique compile-time label `B`. */
export type Brand<Base, B extends string> = Base & { readonly [brand]: B };

/**
 * Runtime instance id for any spawned entity — player, NPC, object, ground item, or
 * projectile. Assigned by the server; monotonically increasing within a world process.
 */
export type EntityId = Brand<number, "EntityId">;

/** Monotonically increasing simulation tick counter (600ms quantum). */
export type Tick = Brand<number, "Tick">;

/** Stable string key for a region: `${rx}:${ry}:${plane}`. */
export type RegionId = Brand<string, "RegionId">;

/** Stable string key for a chunk: `${cx}:${cy}:${plane}`. */
export type ChunkId = Brand<string, "ChunkId">;

/** Content-definition id for an item type, snake_case (e.g. "bronze_hatchet"). */
export type ItemId = Brand<string, "ItemId">;

/** Content-definition id for an NPC type, snake_case (e.g. "town_guard"). */
export type NpcId = Brand<string, "NpcId">;

/** Content-definition id for a world-object type, snake_case (e.g. "oak_tree"). */
export type ObjectId = Brand<string, "ObjectId">;

function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, received ${value}`);
  }
}

/** Construct an {@link EntityId} from a raw number, validating it is a non-negative integer. */
export function entityId(value: number): EntityId {
  assertNonNegativeSafeInteger(value, "EntityId");
  return value as EntityId;
}

/** Construct a {@link Tick} from a raw number, validating it is a non-negative integer. */
export function tick(value: number): Tick {
  assertNonNegativeSafeInteger(value, "Tick");
  return value as Tick;
}
