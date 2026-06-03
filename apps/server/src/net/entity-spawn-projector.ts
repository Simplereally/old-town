import type {
  AppearanceUpdate,
  EntityId,
  EntityKind,
  EntitySpawnPacket,
  ItemDef,
  TileCoord,
} from "@old-town/shared";
import type { World } from "../ecs/world";
import { computeAppearance } from "../systems/appearance-system";

export interface EntitySpawnProjectorResult {
  readonly spawns: readonly EntitySpawnPacket[];
  /** EntityIds that had required components missing and were skipped. */
  readonly skipped: readonly EntityId[];
}

function buildAppearance(
  world: World,
  entityId: EntityId,
  items: ReadonlyMap<string, ItemDef> | undefined,
): AppearanceUpdate | undefined {
  const actor = world.getComponent(entityId, "actor");
  if (!actor) return undefined;
  const equipment = world.getComponent(entityId, "equipment");
  if (equipment && items) {
    return computeAppearance(actor, equipment, items);
  }
  return { name: actor.name, bodyId: actor.appearanceId };
}

/**
 * Pure module: maps every alive entity in a {@link World} to its
 * {@link EntitySpawnPacket} representation.
 *
 * Deterministic rules:
 * - player component  -> kind: "player"
 * - npc component     -> kind: "npc"
 * - object component  -> kind: "object"
 * - groundItem component -> kind: "ground_item"
 * - missing position  -> skipped (reported, never silently dropped)
 */
export function projectWorldEntities(
  world: World,
  items?: ReadonlyMap<string, ItemDef>,
): EntitySpawnProjectorResult {
  const spawns: EntitySpawnPacket[] = [];
  const skipped: EntityId[] = [];

  for (const entityId of world.aliveEntityIds()) {
    const position = world.getComponent(entityId, "position");
    if (!position) {
      skipped.push(entityId);
      continue;
    }

    const tile: TileCoord = {
      x: position.x,
      y: position.y,
      plane: position.plane as TileCoord["plane"],
    };

    const player = world.getComponent(entityId, "player");
    if (player) {
      const combatant = world.getComponent(entityId, "combatant");
      const appearance = buildAppearance(world, entityId, items);
      spawns.push({
        entityId,
        kind: "player",
        tile,
        moveSpeed: "stationary",
        ...(appearance ? { appearance } : {}),
        ...(combatant
          ? { healthBar: { current: combatant.health, max: combatant.maxHealth } }
          : {}),
      });
      continue;
    }

    const npc = world.getComponent(entityId, "npc");
    if (npc) {
      const actor = world.getComponent(entityId, "actor");
      const combatant = world.getComponent(entityId, "combatant");
      spawns.push({
        entityId,
        kind: "npc",
        tile,
        defId: npc.npcId,
        moveSpeed: "stationary",
        ...(actor ? { appearance: { name: actor.name, bodyId: actor.appearanceId } } : {}),
        ...(combatant
          ? { healthBar: { current: combatant.health, max: combatant.maxHealth } }
          : {}),
      });
      continue;
    }

    const object = world.getComponent(entityId, "object");
    if (object) {
      spawns.push({
        entityId,
        kind: "object",
        tile,
        defId: object.objectId,
      });
      continue;
    }

    const groundItem = world.getComponent(entityId, "groundItem");
    if (groundItem) {
      spawns.push({
        entityId,
        kind: "ground_item",
        tile,
        defId: groundItem.itemId,
        quantity: groundItem.quantity,
      });
      continue;
    }

    const grave = world.getComponent(entityId, "grave");
    if (grave) {
      spawns.push({
        entityId,
        kind: "grave",
        tile,
        defId: "grave",
      });
    }

    // Entity has position but no recognised spawn kind — skip silently.
    // This is not an error; some entities (e.g. resource nodes) are not
    // directly spawnable and are represented by their parent object.
  }

  return { spawns, skipped };
}

/**
 * Project a single entity by id. Returns `undefined` if the entity is dead,
 * missing position, or has no recognised spawn kind.
 */
export function projectEntity(
  world: World,
  entityId: EntityId,
  items?: ReadonlyMap<string, ItemDef>,
): EntitySpawnPacket | undefined {
  if (!world.isAlive(entityId)) return undefined;

  const position = world.getComponent(entityId, "position");
  if (!position) return undefined;

  const tile: TileCoord = {
    x: position.x,
    y: position.y,
    plane: position.plane as TileCoord["plane"],
  };

  const player = world.getComponent(entityId, "player");
  if (player) {
    const combatant = world.getComponent(entityId, "combatant");
    const appearance = buildAppearance(world, entityId, items);
    return {
      entityId,
      kind: "player",
      tile,
      moveSpeed: "stationary",
      ...(appearance ? { appearance } : {}),
      ...(combatant ? { healthBar: { current: combatant.health, max: combatant.maxHealth } } : {}),
    };
  }

  const npc = world.getComponent(entityId, "npc");
  if (npc) {
    const actor = world.getComponent(entityId, "actor");
    const combatant = world.getComponent(entityId, "combatant");
    return {
      entityId,
      kind: "npc",
      tile,
      defId: npc.npcId,
      moveSpeed: "stationary",
      ...(actor ? { appearance: { name: actor.name, bodyId: actor.appearanceId } } : {}),
      ...(combatant ? { healthBar: { current: combatant.health, max: combatant.maxHealth } } : {}),
    };
  }

  const object = world.getComponent(entityId, "object");
  if (object) {
    return {
      entityId,
      kind: "object",
      tile,
      defId: object.objectId,
    };
  }

  const groundItem = world.getComponent(entityId, "groundItem");
  if (groundItem) {
    return {
      entityId,
      kind: "ground_item",
      tile,
      defId: groundItem.itemId,
      quantity: groundItem.quantity,
    };
  }

  const grave = world.getComponent(entityId, "grave");
  if (grave) {
    return {
      entityId,
      kind: "grave",
      tile,
      defId: "grave",
    };
  }

  return undefined;
}

/** Return the spawn kind for an entity, or `undefined` if unrecognised. */
export function spawnKind(world: World, entityId: EntityId): EntityKind | undefined {
  if (!world.isAlive(entityId)) return undefined;
  if (world.getComponent(entityId, "player")) return "player";
  if (world.getComponent(entityId, "npc")) return "npc";
  if (world.getComponent(entityId, "object")) return "object";
  if (world.getComponent(entityId, "groundItem")) return "ground_item";
  if (world.getComponent(entityId, "grave")) return "grave";
  return undefined;
}
