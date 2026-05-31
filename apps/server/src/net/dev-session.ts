import {
  ACTIVE_SCENE_SIZE,
  CHUNK_SIZE,
  type ContentRegistries,
  EQUIPMENT_SLOT_COUNT,
  type EntityId,
  type EntitySpawnPacket,
  type FullStatePacket,
  GAME_TICK_MS,
  INVENTORY_SIZE,
  type InventoryDelta,
  PLANES,
  PROTOCOL_VERSION,
  REGION_SIZE,
  type RegionId,
  type RegionLoadPacket,
  type RegionTileData,
  ServerPacketType,
  type SkillDelta,
  TILE_SIZE_WORLD_UNITS,
  type TileCoord,
} from "@old-town/shared";
import type { World } from "../ecs/world";
import type { RuntimeMap } from "../world/runtime-map";
import type { TransportSession } from "./websocket-transport";

export const DEV_SPAWN_TILE: TileCoord = { x: 30, y: 32, plane: 0 };

const STARTER_ITEMS = ["pennywrought_axe", "pennywrought_pickaxe"] as const;

export class DevSessionManager {
  private readonly entityBySession = new Map<string, EntityId>();

  constructor(
    private readonly world: World,
    private readonly map: RuntimeMap,
    private readonly registries: ContentRegistries,
  ) {}

  bootstrap(session: TransportSession, tick = 0, serverTime = Date.now()): FullStatePacket {
    const entityId = this.entityBySession.get(session.id) ?? this.createPlayer(session);
    this.entityBySession.set(session.id, entityId);

    return {
      type: ServerPacketType.FullState,
      protocolVersion: PROTOCOL_VERSION,
      tick,
      serverTime,
      worldConstants: {
        gameTickMs: GAME_TICK_MS,
        tileSizeWorldUnits: TILE_SIZE_WORLD_UNITS,
        chunkSize: CHUNK_SIZE,
        regionSize: REGION_SIZE,
        activeSceneSize: ACTIVE_SCENE_SIZE,
        planes: PLANES,
      },
      selfEntityId: entityId,
      entities: this.visibleEntitySpawns(),
      inventory: this.inventoryDelta(entityId),
      skills: this.skillDeltas(entityId),
      regionLoads: this.regionLoads(),
    };
  }

  remove(session: TransportSession): void {
    const entityId = this.entityBySession.get(session.id);
    if (entityId !== undefined && this.world.isAlive(entityId)) {
      this.world.destroyEntity(entityId);
    }
    this.entityBySession.delete(session.id);
  }

  getEntityId(session: TransportSession): EntityId | undefined {
    return this.entityBySession.get(session.id);
  }

  private createPlayer(session: TransportSession): EntityId {
    const entityId = this.world.createEntity();
    this.world.stores.position.set(entityId, {
      entityId,
      x: DEV_SPAWN_TILE.x,
      y: DEV_SPAWN_TILE.y,
      plane: DEV_SPAWN_TILE.plane,
    });
    this.world.stores.player.set(entityId, {
      entityId,
      accountId: "dev",
      sessionId: session.id,
      interestRadius: ACTIVE_SCENE_SIZE / 2,
    });
    this.world.stores.actor.set(entityId, {
      entityId,
      name: session.characterId,
      level: 3,
      appearanceId: "dev_player",
    });
    this.world.stores.movement.set(entityId, {
      entityId,
      mode: "walk",
      path: [],
    });
    this.world.stores.inventory.set(entityId, {
      entityId,
      capacity: INVENTORY_SIZE,
      items: this.defaultInventory(),
    });
    this.world.stores.equipment.set(entityId, {
      entityId,
      slots: Object.fromEntries(
        Array.from({ length: EQUIPMENT_SLOT_COUNT }, (_, slot) => [`slot_${slot}`, undefined]),
      ),
    });
    this.world.stores.skills.set(entityId, {
      entityId,
      skills: Object.fromEntries(
        Array.from(this.registries.skill.keys())
          .toSorted()
          .map((skillId) => [skillId, { level: 1, xp: 0 }]),
      ),
    });
    this.world.stores.combatant.set(entityId, {
      entityId,
      health: 10,
      maxHealth: 10,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 1,
      targetId: undefined,
      attackCooldown: 0,
    });
    return entityId;
  }

  private defaultInventory(): (readonly [string, number] | undefined)[] {
    const items: (readonly [string, number] | undefined)[] = Array.from({
      length: INVENTORY_SIZE,
    });
    STARTER_ITEMS.forEach((itemId, slot) => {
      if (this.registries.item.has(itemId)) {
        items[slot] = [itemId, 1] as const;
      }
    });
    return items;
  }

  private visibleEntitySpawns(): readonly EntitySpawnPacket[] {
    return Array.from(this.world.stores.player.keys())
      .toSorted((a, b) => (a as number) - (b as number))
      .map((entityId) => {
        const position = this.world.stores.position.get(entityId);
        const actor = this.world.stores.actor.get(entityId);
        const combatant = this.world.stores.combatant.get(entityId);
        if (!position) {
          throw new Error(`Player ${entityId} is missing position`);
        }
        return {
          entityId,
          kind: "player",
          tile: { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] },
          moveSpeed: "stationary",
          ...(actor ? { appearance: { name: actor.name, bodyId: actor.appearanceId } } : {}),
          ...(combatant
            ? { healthBar: { current: combatant.health, max: combatant.maxHealth } }
            : {}),
        };
      });
  }

  private inventoryDelta(entityId: EntityId): InventoryDelta {
    const inventory = this.world.stores.inventory.get(entityId);
    return {
      containerId: `inventory:${entityId}`,
      changes:
        inventory?.items.flatMap((item, slot) =>
          item ? [{ slot, itemId: item[0], quantity: item[1] }] : [],
        ) ?? [],
    };
  }

  private skillDeltas(entityId: EntityId): readonly SkillDelta[] {
    const skills = this.world.stores.skills.get(entityId);
    if (!skills) {
      return [];
    }
    return Object.entries(skills.skills)
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([skillId, state]) => ({
        skillId,
        level: state.level,
        xp: state.xp,
      }));
  }

  private regionLoads(): readonly RegionLoadPacket[] {
    return Array.from(this.map.regions.values())
      .toSorted((a, b) => a.id.localeCompare(b.id))
      .map((region) => ({
        region: region.region,
        regionId: region.id,
        chunks: this.buildChunksForRegion(region.id),
      }));
  }

  private buildChunksForRegion(regionId: RegionId): NonNullable<RegionLoadPacket["chunks"]> {
    const region = this.map.regions.get(regionId);
    if (!region) return [];

    const chunkMap = new Map<string, { cx: number; cy: number; tiles: RegionTileData[] }>();
    for (const tileKey of region.tileKeys) {
      const tile = this.map.tiles.get(tileKey);
      if (!tile) continue;
      const cx = Math.floor(tile.tile.x / CHUNK_SIZE);
      const cy = Math.floor(tile.tile.y / CHUNK_SIZE);
      const chunkKey = `${cx}:${cy}`;
      if (!chunkMap.has(chunkKey)) {
        chunkMap.set(chunkKey, { cx, cy, tiles: [] });
      }
      const chunk = chunkMap.get(chunkKey);
      if (!chunk) continue;
      chunk.tiles.push({
        x: tile.tile.x,
        y: tile.tile.y,
        height: tile.height,
        underlayId: tile.underlayId,
        ...(tile.overlayId ? { overlayId: tile.overlayId } : {}),
        collision: tile.collision,
        ...(tile.water ? { water: true } : {}),
        ...(tile.bridge ? { bridge: true } : {}),
      });
    }
    return Array.from(chunkMap.values());
  }
}
