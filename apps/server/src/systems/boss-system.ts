/**
 * Boss system — runtime logic for boss encounters (POC_SPEC §42).
 *
 * Bosses are special NPCs with access requirements, mechanics, and unique drops.
 * The boss system hooks into the combat system to validate access requirements
 * and tracks mechanic state during combat.
 */

import type {
  BossDef,
  ContentRegistries,
  EntityId,
  Requirement,
  TileCoord,
} from "@old-town/shared";
import type { World } from "../ecs/world";
import { meetsAllRequirements } from "../quests/requirements";
import type { DeltaAccumulator } from "../sim/delta-accumulator";

export interface BossSystemContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
}

export interface BossAccessResult {
  readonly ok: boolean;
  readonly reason?: string;
  readonly bossDef?: BossDef;
}

function tileOf(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

/** Check if an NPC entity is a boss. */
export function isBoss(ctx: BossSystemContext, entityId: EntityId): { readonly isBoss: boolean; readonly bossDef?: BossDef } {
  const npc = ctx.world.getComponent(entityId, "npc");
  if (!npc) {
    return { isBoss: false };
  }
  const bossDef = ctx.registries.boss.get(npc.npcId);
  return bossDef ? { isBoss: true, bossDef } : { isBoss: false };
}

/** Validate that a player can access a boss encounter. */
export function validateBossAccess(
  ctx: BossSystemContext,
  playerId: EntityId,
  bossEntityId: EntityId,
): BossAccessResult {
  const { isBoss: bossCheck, bossDef } = isBoss(ctx, bossEntityId);
  if (!bossCheck || !bossDef) {
    return { ok: true };
  }

  const position = ctx.world.getComponent(playerId, "position");
  const bossPosition = ctx.world.getComponent(bossEntityId, "position");
  if (!position || !bossPosition) {
    return { ok: false, reason: "You cannot reach that target.", bossDef };
  }

  const playerTile = tileOf(ctx.world, playerId);
  const bossTile = tileOf(ctx.world, bossEntityId);
  if (!playerTile || !bossTile) {
    return { ok: false, reason: "You cannot reach that target.", bossDef };
  }

  // Bosses must be engaged from within 5 tiles of their lair
  if (chebyshev(playerTile, bossTile) > 5) {
    return { ok: false, reason: "You are too far from the boss lair.", bossDef };
  }

  // Check access requirements
  if (bossDef.accessRequirements.length > 0) {
    const requirements = bossDef.accessRequirements as Requirement[];
    const meetsRequirements = meetsAllRequirements(
      { world: ctx.world, registries: ctx.registries },
      playerId,
      requirements,
    );
    if (!meetsRequirements) {
      return { ok: false, reason: "You do not meet the requirements to fight this boss.", bossDef };
    }
  }

  return { ok: true, bossDef };
}

/** Get all boss mechanics for an NPC entity. */
export function getBossMechanics(
  ctx: BossSystemContext,
  entityId: EntityId,
): ReadonlyArray<{ readonly kind: string; readonly description: string }> | undefined {
  const { isBoss: bossCheck, bossDef } = isBoss(ctx, entityId);
  if (!bossCheck || !bossDef) {
    return undefined;
  }
  return bossDef.mechanics;
}

/** Get the boss category for an NPC entity. */
export function getBossCategory(
  ctx: BossSystemContext,
  entityId: EntityId,
): string | undefined {
  const { isBoss: bossCheck, bossDef } = isBoss(ctx, entityId);
  if (!bossCheck || !bossDef) {
    return undefined;
  }
  return bossDef.category;
}

/** Get the boss lair info for an NPC entity. */
export function getBossLair(
  ctx: BossSystemContext,
  entityId: EntityId,
): { readonly type: string; readonly area: string; readonly safeRating: string } | undefined {
  const { isBoss: bossCheck, bossDef } = isBoss(ctx, entityId);
  if (!bossCheck || !bossDef) {
    return undefined;
  }
  return {
    type: bossDef.lair.type,
    area: bossDef.lair.area,
    safeRating: bossDef.lair.safeRating,
  };
}

/** Get the boss drop table for an NPC entity. */
export function getBossDropTable(
  ctx: BossSystemContext,
  entityId: EntityId,
): string | undefined {
  const { isBoss: bossCheck, bossDef } = isBoss(ctx, entityId);
  if (!bossCheck || !bossDef) {
    return undefined;
  }
  return bossDef.dropTableId;
}

/** Get the boss trophy item for an NPC entity. */
export function getBossTrophy(
  ctx: BossSystemContext,
  entityId: EntityId,
): string | undefined {
  const { isBoss: bossCheck, bossDef } = isBoss(ctx, entityId);
  if (!bossCheck || !bossDef) {
    return undefined;
  }
  return bossDef.trophyId;
}

/** Get the boss unique drops for an NPC entity. */
export function getBossUniqueDrops(
  ctx: BossSystemContext,
  entityId: EntityId,
): readonly string[] {
  const { isBoss: bossCheck, bossDef } = isBoss(ctx, entityId);
  if (!bossCheck || !bossDef) {
    return [];
  }
  return bossDef.uniqueDropIds;
}
