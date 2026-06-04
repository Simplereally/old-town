/**
 * Entity update bitmask (POC_SPEC §8.2). A single {@link EntityUpdatePacket} can carry
 * many changes at once: the `mask` is the OR of the flags for the fields present in
 * `changes`, so entities are patched incrementally rather than fully replaced.
 *
 * These helpers are the shared contract between the server delta builder
 * ({@link buildEntityUpdate}) and the client delta applier ({@link decomposeMask}).
 */
import type { EntityId } from "../types/ids";
import type { EntityUpdatePacket, EntityUpdatePayload } from "./entity-update";

export enum EntityUpdateMask {
  POSITION = 1, // 1 << 0
  FACING_TILE = 2, // 1 << 1
  FACING_ENTITY = 4, // 1 << 2
  ANIMATION = 8, // 1 << 3
  GRAPHIC = 16, // 1 << 4
  HITSPLAT = 32, // 1 << 5
  OVERHEAD_TEXT = 64, // 1 << 6
  APPEARANCE = 128, // 1 << 7
  EQUIPMENT = 256, // 1 << 8
  HEALTH_BAR = 512, // 1 << 9
  TRANSFORM = 1024, // 1 << 10
  MOVE_SPEED = 2048, // 1 << 11
  STATUS_EFFECTS = 4096, // 1 << 12
}

/**
 * Typed payload map: each mask flag governs exactly one {@link EntityUpdatePayload}
 * field. This is the single source of truth linking bits to fields, used in both
 * directions (build a mask from a payload; apply a payload field per set bit).
 */
export const MASK_FIELDS: ReadonlyArray<readonly [EntityUpdateMask, keyof EntityUpdatePayload]> = [
  [EntityUpdateMask.POSITION, "position"],
  [EntityUpdateMask.FACING_TILE, "facingTile"],
  [EntityUpdateMask.FACING_ENTITY, "facingEntity"],
  [EntityUpdateMask.ANIMATION, "animation"],
  [EntityUpdateMask.GRAPHIC, "graphic"],
  [EntityUpdateMask.HITSPLAT, "hitsplat"],
  [EntityUpdateMask.OVERHEAD_TEXT, "overheadText"],
  [EntityUpdateMask.APPEARANCE, "appearance"],
  [EntityUpdateMask.EQUIPMENT, "equipment"],
  [EntityUpdateMask.HEALTH_BAR, "healthBar"],
  [EntityUpdateMask.TRANSFORM, "transform"],
  [EntityUpdateMask.MOVE_SPEED, "moveSpeed"],
  [EntityUpdateMask.STATUS_EFFECTS, "statusEffects"],
];

/** All defined mask bits OR'd together. */
export const ALL_MASKS: number = MASK_FIELDS.reduce((acc, [bit]) => acc | bit, 0);

/** Whether a flag is set in a mask. */
export function hasFlag(mask: number, flag: EntityUpdateMask): boolean {
  return (mask & flag) !== 0;
}

/** Combine flags into a single mask. */
export function composeMask(...flags: EntityUpdateMask[]): number {
  return flags.reduce((acc, flag) => acc | flag, 0);
}

/** Expand a mask into its set flags, in canonical (low-to-high bit) order. */
export function decomposeMask(mask: number): EntityUpdateMask[] {
  const out: EntityUpdateMask[] = [];
  for (const [bit] of MASK_FIELDS) {
    if ((mask & bit) !== 0) {
      out.push(bit);
    }
  }
  return out;
}

/** Derive the mask implied by which fields a payload carries. */
export function maskFromPayload(payload: EntityUpdatePayload): number {
  let mask = 0;
  for (const [bit, field] of MASK_FIELDS) {
    if (payload[field] !== undefined) {
      mask |= bit;
    }
  }
  return mask;
}

/**
 * Whether a payload exactly matches a mask: every set bit has its field present, every
 * present field has its bit set, and no undefined bits are set.
 */
export function payloadMatchesMask(mask: number, payload: EntityUpdatePayload): boolean {
  if ((mask & ~ALL_MASKS) !== 0) {
    return false;
  }
  for (const [bit, field] of MASK_FIELDS) {
    const present = payload[field] !== undefined;
    const set = (mask & bit) !== 0;
    if (present !== set) {
      return false;
    }
  }
  return true;
}

/** Build a well-formed {@link EntityUpdatePacket}, computing the mask from the changes. */
export function buildEntityUpdate(id: EntityId, changes: EntityUpdatePayload): EntityUpdatePacket {
  return { entityId: id, mask: maskFromPayload(changes), changes };
}

/** Throw if a packet's mask and payload disagree (guards the delta builder/applier). */
export function assertValidEntityUpdate(packet: EntityUpdatePacket): void {
  if (!payloadMatchesMask(packet.mask, packet.changes)) {
    throw new Error(
      `EntityUpdatePacket for entity ${packet.entityId} has mask ${packet.mask} that does not match its payload`,
    );
  }
}
