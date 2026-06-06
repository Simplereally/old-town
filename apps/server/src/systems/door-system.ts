import type { ContentRegistries } from "@old-town/shared/content/content-registries";
import type { ObjectDef } from "@old-town/shared/content-schemas/object";
import type { Rng } from "@old-town/shared/math/rng";
import type { TileCoord } from "@old-town/shared/types/coords";
import type { EntityId } from "@old-town/shared/types/ids";
import type { DoorStateComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap } from "../world/collision";
import { objectCollisionFlags } from "../world/collision";
import { rollDropTable, spawnGroundItem } from "./ground-item-system";

export interface DoorSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly rng: Rng;
}

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, text, channel: "system", serverTime });
}

function tileOf(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function isDoor(objectDef: ObjectDef): boolean {
  return objectDef.id.includes("door") || objectDef.id.includes("hatch");
}

function isChest(objectDef: ObjectDef): boolean {
  return objectDef.id.includes("chest");
}

function applyDoorCollision(
  collision: CollisionMap,
  tile: TileCoord,
  def: ObjectDef,
  isOpen: boolean,
): void {
  const flags = objectCollisionFlags(def);
  if (isOpen) {
    collision.clearDynamic(tile, flags);
  } else {
    collision.addDynamic(tile, flags);
  }
}

function spawnChestContents(
  ctx: DoorSystemContext,
  objectEntityId: EntityId,
  objectDef: ObjectDef,
  tick: number,
  serverTime: number,
): void {
  const tile = tileOf(ctx.world, objectEntityId);
  if (!tile) return;

  const dropTable = objectDef.dropTableId
    ? ctx.registries.dropTable.get(objectDef.dropTableId)
    : undefined;

  if (dropTable) {
    const drops = rollDropTable(dropTable, ctx.rng);
    for (const drop of drops) {
      spawnGroundItem(ctx, drop.itemId, drop.quantity, tile, {
        tick,
        sourceEntityId: objectEntityId,
      });
    }
  } else {
    // Generic fallback: spawn a few coins for any chest without a drop table.
    spawnGroundItem(ctx, "coin", 5, tile, {
      tick,
      sourceEntityId: objectEntityId,
    });
  }
}

export function handleDoorOpenIntent(
  ctx: DoorSystemContext,
  owner: EntityId,
  objectEntityId: EntityId,
  objectDef: ObjectDef,
  serverTime: number,
  tick?: number,
): boolean {
  if (!isDoor(objectDef) && !isChest(objectDef)) {
    return false;
  }

  const tile = tileOf(ctx.world, objectEntityId);
  if (!tile) {
    return false;
  }

  let doorState = ctx.world.getComponent(objectEntityId, "doorState");
  if (!doorState) {
    doorState = {
      entityId: objectEntityId,
      isOpen: false,
    };
  }

  const nextOpen = !doorState.isOpen;

  const nextState: DoorStateComponent = {
    ...doorState,
    entityId: objectEntityId,
    isOpen: nextOpen,
  };
  ctx.world.setComponent(objectEntityId, "doorState", nextState);

  if (isDoor(objectDef)) {
    applyDoorCollision(ctx.collision, tile, objectDef, nextOpen);

    const soundId = nextOpen ? "door_open" : "door_close";
    const animId = nextOpen ? "door_open" : "door_close";
    ctx.deltas.markSound({ soundId, tile, volume: 1 });
    ctx.deltas.markEntityUpdate(objectEntityId, {
      animation: { id: animId },
    });

    const actionText = nextOpen ? "You open the door." : "You close the door.";
    systemMessage(ctx.deltas, owner, actionText, serverTime);
  } else if (isChest(objectDef)) {
    const soundId = nextOpen ? "chest_open" : "chest_close";
    const animId = nextOpen ? "chest_open" : "chest_close";
    ctx.deltas.markSound({ soundId, tile, volume: 1 });
    ctx.deltas.markEntityUpdate(objectEntityId, {
      animation: { id: animId },
    });

    if (nextOpen) {
      spawnChestContents(ctx, objectEntityId, objectDef, tick ?? 0, serverTime);
      systemMessage(ctx.deltas, owner, "You open the chest and find some items.", serverTime);
    } else {
      systemMessage(ctx.deltas, owner, "You close the chest.", serverTime);
    }
  }

  return true;
}
