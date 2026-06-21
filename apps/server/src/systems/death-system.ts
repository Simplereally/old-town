import { type EntityId, GAME_TICK_MS, type TileCoord } from "@old-town/shared";
import type { CombatantComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap } from "../world/collision";
import type { RuntimeMap } from "../world/runtime-map";

export const PLAYER_RESPAWN_DELAY_TICKS = 5;

export interface DeathSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly map: RuntimeMap;
}

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function removePendingHits(combatant: CombatantComponent): Omit<CombatantComponent, "pendingHits"> {
  const { pendingHits: _pendingHits, ...withoutPendingHits } = combatant;
  return withoutPendingHits;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function resolveRespawnTile(
  map: RuntimeMap,
  position: { x: number; y: number; plane: number } | undefined,
  fallback?: TileCoord,
): TileCoord {
  const points = map.deathRespawnPoints;
  if (points.length > 0) {
    if (position) {
      const pos = { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] };
      let best = points[0]?.tile;
      if (!best) {
        return fallback ?? { x: 0, y: 0, plane: 0 };
      }
      let bestDist = chebyshev(pos, best);
      for (let i = 1; i < points.length; i += 1) {
        const candidate = points[i]?.tile;
        if (!candidate) continue;
        const dist = chebyshev(pos, candidate);
        if (dist < bestDist) {
          best = candidate;
          bestDist = dist;
        }
      }
      return best;
    }
    return points[0]?.tile ?? fallback ?? { x: 0, y: 0, plane: 0 };
  }
  return fallback ?? { x: 0, y: 0, plane: 0 };
}

export function processPlayerRespawn(
  ctx: DeathSystemContext,
  tick: number,
  serverTime = tick * GAME_TICK_MS,
  defaultSpawnTile?: TileCoord,
): void {
  for (const [entityId, combatant] of ctx.world.componentEntries("combatant")) {
    if (!ctx.world.hasComponent(entityId, "player")) {
      continue;
    }
    if (combatant.dead !== true || combatant.respawnTick === undefined) {
      continue;
    }
    if (tick < combatant.respawnTick) {
      continue;
    }

    const position = ctx.world.getComponent(entityId, "position");
    const respawnTile = resolveRespawnTile(ctx.map, position, defaultSpawnTile);

    const respawnedCombatant = {
      ...removePendingHits(combatant),
      health: combatant.maxHealth,
      targetId: undefined,
      dead: false,
    };
    delete (respawnedCombatant as CombatantComponent).respawnTick;
    ctx.world.setComponent(entityId, "combatant", respawnedCombatant as CombatantComponent);

    ctx.world.setComponent(entityId, "position", {
      entityId,
      x: respawnTile.x,
      y: respawnTile.y,
      plane: respawnTile.plane,
    });

    ctx.world.setComponent(entityId, "movement", {
      entityId,
      mode: "walk",
      path: [],
    });

    ctx.deltas.markEntityUpdate(entityId, {
      position: respawnTile,
      healthBar: { current: combatant.maxHealth, max: combatant.maxHealth },
    });

    ctx.deltas.markDeathNotice({ entityId });
    ctx.deltas.markRespawnNotice({ entityId, tile: respawnTile });

    systemMessage(ctx.deltas, entityId, "You have respawned.", serverTime);
  }
}
