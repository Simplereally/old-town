import type { ContentRegistries, EntityId, NpcDef, Plane, Rng, TileCoord } from "@old-town/shared";
import type { NpcComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import { projectEntity } from "../net/entity-spawn-projector";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionFlag, type CollisionMap, type Footprint } from "../world/collision";
import { type FootprintResolver, handleMoveIntent, type MoveIntentResult } from "./movement-system";

export interface NpcSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly rng: Rng;
}

function positionTile(position: {
  readonly x: number;
  readonly y: number;
  readonly plane: Plane;
}): TileCoord {
  return { x: position.x, y: position.y, plane: position.plane };
}

function sameTile(a: TileCoord, b: TileCoord): boolean {
  return a.x === b.x && a.y === b.y && a.plane === b.plane;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

function npcDef(
  ctx: Pick<NpcSystemContext, "world" | "registries">,
  entityId: EntityId,
): NpcDef | undefined {
  const npc = ctx.world.getComponent(entityId, "npc");
  return npc ? ctx.registries.npc.get(npc.npcId) : undefined;
}

export function npcFootprint(
  ctx: Pick<NpcSystemContext, "world" | "registries">,
  entityId: EntityId,
): Footprint {
  const def = npcDef(ctx, entityId);
  if (!def) {
    // Player or other non-NPC entity: players pass through NPC-occupied tiles (OSRS).
    return { width: 1, length: 1, ignoreNpcOccupancy: true };
  }
  const size = def.size ?? 1;
  return { width: size, length: size };
}

export function npcFootprintResolver(
  ctx: Pick<NpcSystemContext, "world" | "registries">,
): FootprintResolver {
  return (entityId) => npcFootprint(ctx, entityId);
}

function setNpc(ctx: Pick<NpcSystemContext, "world">, entityId: EntityId, npc: NpcComponent): void {
  ctx.world.setComponent(entityId, "npc", npc);
}

function clearNpcOccupancy(
  ctx: Pick<NpcSystemContext, "world" | "collision" | "registries">,
  entityId: EntityId,
  npc: NpcComponent,
): NpcComponent {
  const occupiedTile = npc.occupiedTile;
  if (occupiedTile) {
    ctx.collision.clearFootprint(
      occupiedTile,
      npcFootprint(ctx, entityId),
      CollisionFlag.OCCUPIED_NPC,
    );
  }
  const { occupiedTile: _occupiedTile, ...cleared } = npc;
  return cleared;
}

function syncNpcOccupancyForEntity(
  ctx: Pick<NpcSystemContext, "world" | "collision" | "registries">,
  entityId: EntityId,
): void {
  const npc = ctx.world.getComponent(entityId, "npc");
  const position = ctx.world.getComponent(entityId, "position");
  const combatant = ctx.world.getComponent(entityId, "combatant");
  if (!npc) {
    return;
  }
  if (
    !position ||
    npc.brainState === "dead" ||
    npc.brainState === "respawning" ||
    combatant?.dead
  ) {
    setNpc(ctx, entityId, clearNpcOccupancy(ctx, entityId, npc));
    return;
  }

  const tile = positionTile(position);
  if (npc.occupiedTile && sameTile(npc.occupiedTile, tile)) {
    return;
  }
  const cleared = clearNpcOccupancy(ctx, entityId, npc);
  ctx.collision.applyFootprint(tile, npcFootprint(ctx, entityId), CollisionFlag.OCCUPIED_NPC);
  setNpc(ctx, entityId, { ...cleared, occupiedTile: tile });
}

export function syncNpcOccupancy(
  ctx: Pick<NpcSystemContext, "world" | "collision" | "registries">,
): void {
  for (const entityId of ctx.world.entityIdsWith("npc")) {
    syncNpcOccupancyForEntity(ctx, entityId);
  }
}

/**
 * NPCs path locally toward a wander/chase/return target and re-path every tick, so they
 * never need a region-wide search. Capping exploration keeps a target that is unreachable
 * for the NPC's footprint (common for multi-tile NPCs in tight terrain) cheap instead of
 * triggering an exhaustive A* per attempt.
 */
const NPC_PATH_MAX_VISITED = 256;

function moveNpcToward(
  ctx: NpcSystemContext,
  entityId: EntityId,
  dest: TileCoord,
  tick: number,
): MoveIntentResult {
  return handleMoveIntent(
    { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
    entityId,
    { dest },
    { footprint: npcFootprint(ctx, entityId), tick, maxVisited: NPC_PATH_MAX_VISITED },
  );
}

function isDeadTarget(ctx: NpcSystemContext, entityId: EntityId): boolean {
  if (!ctx.world.isAlive(entityId)) {
    return true;
  }
  const combatant = ctx.world.getComponent(entityId, "combatant");
  return combatant?.dead === true || (combatant?.health ?? 1) <= 0;
}

function nearestAggroTarget(
  ctx: NpcSystemContext,
  origin: TileCoord,
  radius: number,
  npcCombatLevel: number | undefined,
): EntityId | undefined {
  let best: { entityId: EntityId; distance: number } | undefined;
  for (const playerId of ctx.world.entityIdsWith("player")) {
    if (isDeadTarget(ctx, playerId)) {
      continue;
    }
    // OSRS unaggressive rule: an NPC will not auto-attack a player whose combat
    // level is more than double its own. When the NPC has no combat level we
    // leave the gate open (default to aggressive) so content without levels is
    // unaffected.
    if (npcCombatLevel !== undefined) {
      const playerCombat = ctx.world.getComponent(playerId, "combatant")?.combatLevel;
      if (playerCombat !== undefined && playerCombat > npcCombatLevel * 2) {
        continue;
      }
    }
    const position = ctx.world.getComponent(playerId, "position");
    if (!position) {
      continue;
    }
    const distance = chebyshev(origin, positionTile(position));
    if (distance > radius) {
      continue;
    }
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && playerId < best.entityId)
    ) {
      best = { entityId: playerId, distance };
    }
  }
  return best?.entityId;
}

function killNpc(
  ctx: NpcSystemContext,
  entityId: EntityId,
  npc: NpcComponent,
  def: NpcDef,
  tick: number,
): void {
  const combatant = ctx.world.getComponent(entityId, "combatant");
  if (combatant) {
    ctx.world.setComponent(entityId, "combatant", {
      ...combatant,
      health: 0,
      targetId: undefined,
      dead: true,
    });
  }
  ctx.world.removeComponent(entityId, "movement");
  const cleared = clearNpcOccupancy(ctx, entityId, npc);
  setNpc(ctx, entityId, {
    ...cleared,
    brainState: "respawning",
    respawnTick: tick + def.respawnTicks,
  });
  ctx.deltas.markEntityRemove(entityId);
}

function respawnNpc(ctx: NpcSystemContext, entityId: EntityId, npc: NpcComponent): void {
  const home = npc.home;
  if (home) {
    ctx.world.setComponent(entityId, "position", {
      entityId,
      x: home.x,
      y: home.y,
      plane: home.plane,
    });
  }
  const combatant = ctx.world.getComponent(entityId, "combatant");
  if (combatant) {
    ctx.world.setComponent(entityId, "combatant", {
      ...combatant,
      health: combatant.maxHealth,
      targetId: undefined,
      dead: false,
      nextAttackTick: 0,
    });
  }
  ctx.world.removeComponent(entityId, "movement");
  const { occupiedTile: _occupiedTile, ...cleared } = npc;
  setNpc(ctx, entityId, { ...cleared, brainState: "idle", respawnTick: 0 });
  syncNpcOccupancyForEntity(ctx, entityId);
  const spawn = projectEntity(ctx.world, entityId);
  if (spawn) {
    ctx.deltas.markEntityAdd(spawn);
  }
}

function maybeHandleDeathOrRespawn(
  ctx: NpcSystemContext,
  entityId: EntityId,
  npc: NpcComponent,
  def: NpcDef,
  tick: number,
): boolean {
  const combatant = ctx.world.getComponent(entityId, "combatant");
  if (npc.brainState === "respawning") {
    if (tick >= npc.respawnTick) {
      respawnNpc(ctx, entityId, npc);
    }
    return true;
  }
  if (npc.brainState === "dead" || combatant?.dead || (combatant?.health ?? 1) <= 0) {
    killNpc(ctx, entityId, npc, def, tick);
    return true;
  }
  return false;
}

function returnHome(
  ctx: NpcSystemContext,
  entityId: EntityId,
  npc: NpcComponent,
  position: TileCoord,
  tick: number,
): void {
  const home = npc.home ?? position;
  if (sameTile(position, home)) {
    ctx.world.removeComponent(entityId, "movement");
    setNpc(ctx, entityId, { ...npc, brainState: "idle" });
    return;
  }
  moveNpcToward(ctx, entityId, home, tick);
  setNpc(ctx, entityId, { ...npc, brainState: "returnHome" });
}

/**
 * OSRS wander roll: an idle, out-of-combat NPC that supports wandering rolls a
 * 1% chance per tick (10 in 1000) to pick a wander destination. See
 * docs/spatial/movement-ecology.md and POC_SPEC §14.3.
 */
const WANDER_ROLL_CHANCE_ONE_IN = 100;

function maybeWander(
  ctx: NpcSystemContext,
  entityId: EntityId,
  npc: NpcComponent,
  position: TileCoord,
  tick: number,
): void {
  const radius = npc.wanderRadius;
  if (radius <= 0 || (ctx.world.getComponent(entityId, "movement")?.path.length ?? 0) > 0) {
    return;
  }
  // OSRS: the probability check only runs when no movement is pending; a roll of
  // 10 in 1000 (1%) gates whether a wander destination is selected this tick.
  if (!ctx.rng.chanceOneIn(WANDER_ROLL_CHANCE_ONE_IN)) {
    return;
  }

  // OSRS: select a random coordinate within the NPC's wander range measured from
  // its static origin spawn point, then path to it. The pathfinder falls back to
  // the closest approach point when the exact tile is blocked.
  const home = npc.home ?? position;
  const dest: TileCoord = {
    x: ctx.rng.nextInt(home.x - radius, home.x + radius),
    y: ctx.rng.nextInt(home.y - radius, home.y + radius),
    plane: home.plane,
  };
  const result = moveNpcToward(ctx, entityId, dest, tick);
  setNpc(ctx, entityId, { ...npc, brainState: result.pathLength > 0 ? "wander" : "idle" });
}

export function processNpcAiPhase(ctx: NpcSystemContext, tick: number): void {
  for (const [entityId, npc] of ctx.world.componentEntries("npc")) {
    const def = ctx.registries.npc.get(npc.npcId);
    const position = ctx.world.getComponent(entityId, "position");
    if (!def || !position) {
      continue;
    }
    if (maybeHandleDeathOrRespawn(ctx, entityId, npc, def, tick)) {
      continue;
    }

    const tile = positionTile(position);
    const combatant = ctx.world.getComponent(entityId, "combatant");
    const targetId = combatant?.targetId;
    if (targetId !== undefined) {
      const targetPosition = ctx.world.getComponent(targetId, "position");
      const leashDistance = npc.leashDistance ?? npc.wanderRadius + (def.aggressiveRadius ?? 0) + 4;
      if (
        !targetPosition ||
        isDeadTarget(ctx, targetId) ||
        chebyshev(tile, npc.home ?? tile) > leashDistance
      ) {
        if (combatant) {
          ctx.world.setComponent(entityId, "combatant", { ...combatant, targetId: undefined });
        }
        returnHome(ctx, entityId, npc, tile, tick);
        continue;
      }

      const targetTile = positionTile(targetPosition);
      if (chebyshev(tile, targetTile) <= (def.attackRangeTiles ?? 1)) {
        setNpc(ctx, entityId, { ...npc, brainState: "attack" });
      } else {
        moveNpcToward(ctx, entityId, targetTile, tick);
        setNpc(ctx, entityId, { ...npc, brainState: "chase" });
      }
      continue;
    }

    if (npc.brainState === "returnHome") {
      returnHome(ctx, entityId, npc, tile, tick);
      continue;
    }

    const aggroRadius = def.aggressionMode === "aggressive" ? (def.aggressiveRadius ?? 0) : 0;
    const aggroTarget =
      aggroRadius > 0 ? nearestAggroTarget(ctx, tile, aggroRadius, def.combatLevel) : undefined;
    if (aggroTarget !== undefined && combatant) {
      ctx.world.setComponent(entityId, "combatant", { ...combatant, targetId: aggroTarget });
      const targetPosition = ctx.world.getComponent(aggroTarget, "position");
      if (targetPosition) {
        moveNpcToward(ctx, entityId, positionTile(targetPosition), tick);
      }
      setNpc(ctx, entityId, { ...npc, brainState: "chase" });
      continue;
    }

    maybeWander(ctx, entityId, npc, tile, tick);
  }
}
