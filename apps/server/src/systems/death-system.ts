import { type EntityId, GAME_TICK_MS, type TileCoord } from "@old-town/shared";
import type { CombatantComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap } from "../world/collision";

export const PLAYER_RESPAWN_DELAY_TICKS = 5;

export interface DeathSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
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

export function processPlayerRespawn(
  ctx: DeathSystemContext,
  tick: number,
  serverTime = tick * GAME_TICK_MS,
  defaultSpawnTile: TileCoord = { x: 30, y: 32, plane: 0 },
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

    // Respawn the player
    const respawnTile = defaultSpawnTile;

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
