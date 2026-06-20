/**
 * Entity spawn/update data structures embedded in server → client packets.
 * These describe *what changed* for an entity in a tick. The bitmask machinery that
 * says *which* fields are present lives in `update-mask.ts` (E01-S05).
 *
 * Everything here is plain data — no Three.js or vector classes — so packets remain
 * pure JSON.
 */
import type { Direction } from "../math/direction";
import type { TileCoord } from "../types/coords";
import type { EntityId } from "../types/ids";

/** Category of a spawned entity. */
export type EntityKind = "player" | "npc" | "object" | "ground_item" | "grave" | "projectile";

/** Kind of damage/effect number shown above an entity. */
export type HitsplatType = "damage" | "block" | "heal" | "poison";

/** A single damage/heal number applied to an entity. */
export interface Hitsplat {
  readonly amount: number;
  readonly type: HitsplatType;
}

/** Current/maximum health for a health bar overlay. */
export interface HealthBar {
  readonly current: number;
  readonly max: number;
}

/** Presentational movement speed of an entity this tick. */
export type MoveSpeed = "stationary" | "walk" | "run";

/** An animation to play (content id; tightened in E01-S06). */
export interface AnimationPlay {
  readonly id: string;
  readonly startTick?: number;
}

/** A spot-graphic to play (content id). */
export interface GraphicPlay {
  readonly id: string;
  readonly height?: number;
}

/** A single active status effect on an entity. */
export interface StatusEffectUpdate {
  readonly effectId: string;
  readonly durationTicks: number;
  readonly damagePerTick?: number;
  readonly healPerTick?: number;
  readonly statModifiers?: Record<string, number>;
}

/** Renderable identity of a player/NPC. */
export interface AppearanceUpdate {
  readonly bodyId?: string;
  readonly colors?: readonly number[];
  readonly name?: string;
}

/** Visible equipment. */
export interface EquipmentUpdate {
  /** Equipped item content ids by slot index; `null` = empty slot. */
  readonly slots: readonly (string | null)[];
}

/**
 * All possible per-entity changes in a single tick. Every field is optional; the
 * accompanying mask (E01-S05) declares which are present.
 */
export interface EntityUpdatePayload {
  readonly position?: TileCoord;
  readonly facingTile?: TileCoord;
  readonly facingEntity?: EntityId;
  readonly animation?: AnimationPlay;
  readonly graphic?: GraphicPlay;
  readonly hitsplat?: Hitsplat;
  readonly overheadText?: string;
  readonly appearance?: AppearanceUpdate;
  readonly equipment?: EquipmentUpdate;
  readonly healthBar?: HealthBar;
  /** NPC transform/morph target (content id). */
  readonly transform?: string;
  readonly moveSpeed?: MoveSpeed;
  readonly statusEffects?: readonly StatusEffectUpdate[];
  /** Door/gate open state for object entities. */
  readonly doorState?: { isOpen: boolean };
}

/** A masked update for one already-known entity. */
export interface EntityUpdatePacket {
  readonly entityId: EntityId;
  /** Bitmask of {@link import("./update-mask").EntityUpdateMask} flags. */
  readonly mask: number;
  readonly changes: EntityUpdatePayload;
}

/** A newly visible entity entering the player's interest area. */
export interface EntitySpawnPacket {
  readonly entityId: EntityId;
  readonly kind: EntityKind;
  readonly tile: TileCoord;
  /** Content id of the entity's definition (npc/object/item type), where applicable. */
  readonly defId?: string;
  readonly facing?: Direction;
  readonly appearance?: AppearanceUpdate;
  readonly healthBar?: HealthBar;
  readonly moveSpeed?: MoveSpeed;
  /** For ground items: stack quantity. */
  readonly quantity?: number;
}

/** An entity leaving the player's interest area. */
export interface EntityRemovePacket {
  readonly entityId: EntityId;
}
