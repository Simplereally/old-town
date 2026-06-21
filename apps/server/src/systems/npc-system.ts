import type { ContentRegistries, EntityId, NpcDef, Plane, Rng, TileCoord } from "@old-town/shared";
import type { NpcComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import { projectEntity } from "../net/entity-spawn-projector";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionFlag, type CollisionMap, type Footprint } from "../world/collision";
import { type FootprintResolver, handleMoveIntent } from "./movement-system";

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
  const size = npcDef(ctx, entityId)?.size ?? 1;
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

function moveNpcToward(
  ctx: NpcSystemContext,
  entityId: EntityId,
  dest: TileCoord,
  tick: number,
): void {
  handleMoveIntent(
    { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
    entityId,
    { dest },
    { footprint: npcFootprint(ctx, entityId), tick },
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
): EntityId | undefined {
  let best: { entityId: EntityId; distance: number } | undefined;
  for (const playerId of ctx.world.entityIdsWith("player")) {
    if (isDeadTarget(ctx, playerId)) {
      continue;
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

  const home = npc.home ?? position;
  const candidates: TileCoord[] = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const tile = { x: position.x + dx, y: position.y + dy, plane: position.plane };
      if (
        chebyshev(home, tile) <= radius &&
        ctx.collision.canOccupy(tile, npcFootprint(ctx, entityId))
      ) {
        candidates.push(tile);
      }
    }
  }
  if (candidates.length === 0) {
    setNpc(ctx, entityId, { ...npc, brainState: "idle" });
    return;
  }
  const candidate = candidates[ctx.rng.nextInt(0, candidates.length - 1)];
  if (!candidate) {
    return;
  }
  moveNpcToward(ctx, entityId, candidate, tick);
  setNpc(ctx, entityId, { ...npc, brainState: "wander" });
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

    const aggroRadius = def.aggressiveRadius ?? 0;
    const aggroTarget = aggroRadius > 0 ? nearestAggroTarget(ctx, tile, aggroRadius) : undefined;
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
