import {
  type ContentRegistries,
  type EntityId,
  REGION_SIZE,
  type RegionMapDef,
  regionId,
  type TileCoord,
  tileKey,
} from "@old-town/shared";
import type { World } from "../ecs/world";
import type { RuntimeAreaTrigger, RuntimeMap, RuntimeTile } from "./runtime-map";

export interface LoadedRegionSummary {
  readonly regionId: string;
  readonly tileCount: number;
  readonly objectCount: number;
  readonly npcCount: number;
  readonly groundItemCount: number;
  readonly resourceNodeCount: number;
  readonly triggerCount: number;
}

function globalTile(region: RegionMapDef["region"], x: number, y: number): TileCoord {
  return {
    x: region.rx * REGION_SIZE + x,
    y: region.ry * REGION_SIZE + y,
    plane: region.plane,
  };
}

function entityNumbers(ids: readonly EntityId[]): readonly number[] {
  return ids.map((id) => id as number);
}

function tileWithZone(tile: RuntimeTile, zoneId: string): RuntimeTile {
  return { ...tile, zoneId };
}

function applyTriggerZones(map: RuntimeMap, trigger: RuntimeAreaTrigger): void {
  const zoneId = trigger.tag ?? trigger.id;
  const w = trigger.width;
  const h = trigger.height;
  for (let dx = 0; dx < w; dx += 1) {
    for (let dy = 0; dy < h; dy += 1) {
      const tile: TileCoord = {
        x: trigger.x + dx,
        y: trigger.y + dy,
        plane: trigger.plane as TileCoord["plane"],
      };
      const key = tileKey(tile);
      const current = map.tiles.get(key);
      if (current) {
        map.tiles.set(key, tileWithZone(current, zoneId));
      }
    }
  }
}

export function loadRegionMapIntoWorld(
  world: World,
  map: RuntimeMap,
  registries: ContentRegistries,
  def: RegionMapDef,
): LoadedRegionSummary {
  const id = regionId(def.region);
  const tileKeys: string[] = [];
  const overrides = new Map<string, (typeof def.tiles.overrides)[number]>();
  const tilesOverrides = def.tiles.overrides;

  for (const override of tilesOverrides) {
    overrides.set(`${override.x}:${override.y}`, override);
  }

  for (let x = 0; x < REGION_SIZE; x += 1) {
    for (let y = 0; y < REGION_SIZE; y += 1) {
      const tile = globalTile(def.region, x, y);
      const override = overrides.get(`${x}:${y}`);
      const runtimeTile: RuntimeTile = {
        tile,
        height: override?.height ?? def.tiles.default.height,
        underlayId: override?.underlayId ?? def.tiles.default.underlayId,
        ...(override?.overlayId ? { overlayId: override.overlayId } : {}),
        collision: override?.collision ?? def.tiles.default.collision,
        water: override?.water ?? false,
        bridge: override?.bridge ?? false,
      };
      const key = tileKey(tile);
      map.tiles.set(key, runtimeTile);
      tileKeys.push(key);
    }
  }

  const objectEntityIds: EntityId[] = [];
  const resourceNodeEntityIds: EntityId[] = [];
  const objectRegistry = registries.object;
  for (const placed of def.objects) {
    const objectDef = objectRegistry.get(placed.objectId);
    if (!objectDef) {
      throw new Error(`Region ${id} references missing object ${placed.objectId}`);
    }
    const entityId = world.createEntity();
    const tile = globalTile(def.region, placed.x, placed.y);
    world.setComponent(entityId, "position", { entityId, x: tile.x, y: tile.y, plane: tile.plane });
    world.setComponent(entityId, "object", {
      entityId,
      objectId: placed.objectId,
      facing: placed.rotation,
      variant: 0,
    });
    objectEntityIds.push(entityId);

    if (objectDef.resourceNodeId) {
      world.setComponent(entityId, "resourceNode", {
        entityId,
        nodeId: objectDef.resourceNodeId,
        active: true,
        depleted: false,
        respawnTick: 0,
      });
      resourceNodeEntityIds.push(entityId);
    }
  }

  const npcEntityIds: EntityId[] = [];
  const npcRegistry = registries.npc;
  for (const spawn of def.npcSpawns) {
    const npcDef = npcRegistry.get(spawn.npcId);
    if (!npcDef) {
      throw new Error(`Region ${id} references missing NPC ${spawn.npcId}`);
    }
    const entityId = world.createEntity();
    const tile = globalTile(def.region, spawn.x, spawn.y);
    world.setComponent(entityId, "position", { entityId, x: tile.x, y: tile.y, plane: tile.plane });
    world.setComponent(entityId, "npc", {
      entityId,
      npcId: spawn.npcId,
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: spawn.wanderRadius ?? npcDef.wanderRadius,
      home: tile,
      leashDistance: (spawn.wanderRadius ?? npcDef.wanderRadius) + (npcDef.aggressiveRadius ?? 0) + 4,
    });
    world.setComponent(entityId, "actor", {
      entityId,
      name: npcDef.name,
      level: npcDef.combatLevel ?? 0,
      appearanceId: spawn.npcId,
    });
    if (npcDef.maxHp) {
      world.setComponent(entityId, "combatant", {
        entityId,
        health: npcDef.maxHp,
        maxHealth: npcDef.maxHp,
        attackLevel: npcDef.stats?.attack ?? 1,
        strengthLevel: npcDef.stats?.strength ?? 1,
        defenceLevel: npcDef.stats?.defence ?? 1,
        targetId: undefined,
        attackCooldown: 0,
        combatLevel: npcDef.combatLevel ?? 3,
        eatBlockedUntilTick: 0,
        autoRetaliate: true,
        nextAttackTick: 0,
        dead: false,
        spellCooldowns: {},
      });
    }
    npcEntityIds.push(entityId);
  }

  const groundItemEntityIds: EntityId[] = [];
  for (const spawn of def.groundItemSpawns) {
    const entityId = world.createEntity();
    const tile = globalTile(def.region, spawn.x, spawn.y);
    world.setComponent(entityId, "position", { entityId, x: tile.x, y: tile.y, plane: tile.plane });
    world.setComponent(entityId, "groundItem", {
      entityId,
      itemId: spawn.itemId,
      quantity: spawn.quantity,
      publicAtTick: 0,
      despawnTick: Number.MAX_SAFE_INTEGER,
    });
    groundItemEntityIds.push(entityId);
  }

  const triggerIds: string[] = [];
  for (const trigger of def.triggers) {
    const runtimeTrigger: RuntimeAreaTrigger = {
      id: trigger.id,
      regionId: id,
      x: def.region.rx * REGION_SIZE + trigger.x,
      y: def.region.ry * REGION_SIZE + trigger.y,
      plane: def.region.plane,
      width: trigger.width,
      height: trigger.height,
      ...(trigger.tag ? { tag: trigger.tag } : {}),
    };
    map.triggers.set(trigger.id, runtimeTrigger);
    triggerIds.push(trigger.id);
    applyTriggerZones(map, runtimeTrigger);
  }

  map.regions.set(id, {
    id,
    region: def.region,
    tileKeys,
    objectEntityIds: entityNumbers(objectEntityIds),
    npcEntityIds: entityNumbers(npcEntityIds),
    groundItemEntityIds: entityNumbers(groundItemEntityIds),
    resourceNodeEntityIds: entityNumbers(resourceNodeEntityIds),
    triggerIds,
  });

  return {
    regionId: id,
    tileCount: tileKeys.length,
    objectCount: objectEntityIds.length,
    npcCount: npcEntityIds.length,
    groundItemCount: groundItemEntityIds.length,
    resourceNodeCount: resourceNodeEntityIds.length,
    triggerCount: triggerIds.length,
  };
}

export function loadAllRegionMapsIntoWorld(
  world: World,
  map: RuntimeMap,
  registries: ContentRegistries,
): readonly LoadedRegionSummary[] {
  return Array.from(registries.regionMap.entries())
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([, def]) => loadRegionMapIntoWorld(world, map, registries, def));
}
