import {
  ACTIVE_SCENE_SIZE,
  CHUNK_SIZE,
  type ContentRegistries,
  type EntityId,
  type EquipmentUpdate,
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
  type VarDelta,
} from "@old-town/shared";
import type { InventoryComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import { createEquipment, equipmentUpdate } from "../items/equipment";
import { addItem, catalogFromItems, createInventory, toInventoryDelta } from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import { DisabledPersistenceAdapter, type PersistenceAdapter } from "../persistence";
import { applyCharacterSnapshot, snapshotCharacter } from "../persistence/character-state";
import { computeCombatLevel } from "../skills/combat-level";
import { maxHealthForHitpointsLevel } from "../skills/skill-state";
import { groundItemVisibleToPlayer } from "../systems/ground-item-system";
import { createVarComponent, toVarDeltas } from "../vars/player-vars";
import type { RuntimeMap } from "../world/runtime-map";
import { projectWorldEntities } from "./entity-spawn-projector";
import type { TransportSession } from "./websocket-transport";

export const DEV_SPAWN_TILE: TileCoord = { x: 30, y: 32, plane: 0 };

const STARTER_ITEMS: readonly { itemId: string; quantity: number }[] = [
  { itemId: "pennywrought_axe", quantity: 1 },
  { itemId: "pennywrought_pickaxe", quantity: 1 },
  { itemId: "bread", quantity: 5 },
  { itemId: "raw_fish", quantity: 5 },
  { itemId: "ember_bead", quantity: 20 },
  { itemId: "gust_bead", quantity: 20 },
  { itemId: "wit_bead", quantity: 20 },
  { itemId: "writ_bead", quantity: 20 },
];

export class DevSessionManager {
  private readonly entityBySession = new Map<string, EntityId>();
  private readonly characterIdByEntity = new Map<EntityId, string>();

  constructor(
    private readonly world: World,
    private readonly map: RuntimeMap,
    private readonly registries: ContentRegistries,
    private readonly persistence: PersistenceAdapter = new DisabledPersistenceAdapter(),
    private readonly itemAudit?: ItemAuditLog,
  ) {}

  async bootstrap(
    session: TransportSession,
    tick = 0,
    serverTime = Date.now(),
  ): Promise<FullStatePacket> {
    const entityId =
      this.entityBySession.get(session.id) ?? (await this.createPlayer(session, tick, serverTime));
    this.entityBySession.set(session.id, entityId);
    this.characterIdByEntity.set(entityId, session.characterId);
    return this.fullState(entityId, tick, serverTime);
  }

  async remove(session: TransportSession, serverTime = Date.now()): Promise<void> {
    const entityId = this.entityBySession.get(session.id);
    try {
      if (entityId !== undefined && this.world.isAlive(entityId)) {
        await this.persistence.saveCharacter(
          snapshotCharacter(
            { world: this.world, registries: this.registries },
            entityId,
            session.characterId,
            serverTime,
          ),
        );
      }
    } finally {
      if (entityId !== undefined && this.world.isAlive(entityId)) {
        this.world.destroyEntity(entityId);
      }
      if (entityId !== undefined) {
        this.characterIdByEntity.delete(entityId);
      }
      this.entityBySession.delete(session.id);
    }
  }

  getEntityId(session: TransportSession): EntityId | undefined {
    return this.entityBySession.get(session.id);
  }

  entityIds(): readonly EntityId[] {
    return Array.from(this.entityBySession.values()).toSorted(
      (a, b) => (a as number) - (b as number),
    );
  }

  characterIdForEntity(entityId: EntityId): string | undefined {
    return this.characterIdByEntity.get(entityId);
  }

  fullStateForSession(
    session: TransportSession,
    tick = 0,
    serverTime = Date.now(),
  ): FullStatePacket | undefined {
    const entityId = this.entityBySession.get(session.id);
    return entityId === undefined ? undefined : this.fullState(entityId, tick, serverTime);
  }

  private fullState(entityId: EntityId, tick: number, serverTime: number): FullStatePacket {
    const { spawns } = projectWorldEntities(this.world);

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
      entities: spawns.filter((spawn) =>
        this.entityVisibleToPlayer(entityId, spawn.entityId, tick),
      ),
      inventory: this.inventoryDelta(entityId),
      equipment: this.equipmentUpdate(entityId),
      skills: this.skillDeltas(entityId),
      vars: this.varDeltas(entityId),
      regionLoads: this.regionLoads(),
    };
  }

  private async createPlayer(
    session: TransportSession,
    tick: number,
    serverTime: number,
  ): Promise<EntityId> {
    const snapshot = await this.persistence.loadCharacter(session.characterId);
    const entityId = this.world.createEntity();
    try {
      this.applyDefaultPlayerComponents(entityId, session, {
        auditStarterItems: snapshot === undefined,
        tick,
        serverTime,
      });
      if (snapshot) {
        applyCharacterSnapshot(
          { world: this.world, registries: this.registries },
          entityId,
          snapshot,
        );
      }
    } catch (error) {
      this.world.destroyEntity(entityId);
      throw error;
    }
    return entityId;
  }

  private applyDefaultPlayerComponents(
    entityId: EntityId,
    session: TransportSession,
    options: {
      readonly auditStarterItems: boolean;
      readonly tick: number;
      readonly serverTime: number;
    },
  ): void {
    this.world.setComponent(entityId, "position", {
      entityId,
      x: DEV_SPAWN_TILE.x,
      y: DEV_SPAWN_TILE.y,
      plane: DEV_SPAWN_TILE.plane,
    });
    this.world.setComponent(entityId, "player", {
      entityId,
      accountId: "dev",
      sessionId: session.id,
      interestRadius: ACTIVE_SCENE_SIZE / 2,
      spellbook: "common",
    });
    this.world.setComponent(entityId, "actor", {
      entityId,
      name: session.characterId,
      level: 3,
      appearanceId: "dev_player",
    });
    this.world.setComponent(entityId, "movement", {
      entityId,
      mode: "walk",
      path: [],
    });
    this.world.setComponent(
      entityId,
      "inventory",
      this.createStarterInventory(entityId, session.characterId, options),
    );
    this.world.setComponent(entityId, "equipment", createEquipment(entityId));
    this.world.setComponent(entityId, "vars", createVarComponent(entityId));
    this.world.setComponent(entityId, "skills", {
      entityId,
      skills: Object.fromEntries(
        Array.from(this.registries.skill.keys())
          .toSorted()
          .map((skillId) => [skillId, { level: 1, xp: 0, boost: 0, drain: 0 }]),
      ),
    });
    const hitpointsLevel =
      this.world.getComponent(entityId, "skills")?.skills.hitpoints?.level ?? 1;
    const maxHealth = maxHealthForHitpointsLevel(hitpointsLevel);
    this.world.setComponent(entityId, "combatant", {
      entityId,
      health: maxHealth,
      maxHealth,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 1,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: computeCombatLevel(this.world, entityId),
      eatBlockedUntilTick: 0,
      autoRetaliate: true,
      nextAttackTick: 0,
      dead: false,
      spellCooldowns: {},
    });
  }

  private createStarterInventory(
    entityId: EntityId,
    characterId: string,
    options: {
      readonly auditStarterItems: boolean;
      readonly tick: number;
      readonly serverTime: number;
    },
  ): InventoryComponent {
    const inventory = createInventory(entityId, `inventory:${entityId}`, INVENTORY_SIZE);
    const catalog = catalogFromItems(this.registries.item);
    for (const { itemId, quantity } of STARTER_ITEMS) {
      const result = addItem(inventory, catalog, itemId, quantity);
      if (options.auditStarterItems && result.added > 0) {
        this.itemAudit?.record({
          tick: options.tick,
          characterId,
          itemId,
          quantity: result.added,
          reason: "starter_item",
          beforeQuantity: 0,
          afterQuantity: result.added,
          metadata: {
            entityId,
            source: "dev_session_bootstrap",
            serverTime: options.serverTime,
          },
        });
      }
    }
    return inventory;
  }

  private inventoryDelta(entityId: EntityId): InventoryDelta {
    const inventory = this.world.getComponent(entityId, "inventory");
    if (!inventory) {
      return { containerId: `inventory:${entityId}`, changes: [] };
    }
    return toInventoryDelta(inventory);
  }

  private equipmentUpdate(entityId: EntityId): EquipmentUpdate {
    const equipment = this.world.getComponent(entityId, "equipment");
    return equipment ? equipmentUpdate(equipment) : { slots: [] };
  }

  private skillDeltas(entityId: EntityId): readonly SkillDelta[] {
    const skills = this.world.getComponent(entityId, "skills");
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

  private varDeltas(entityId: EntityId): readonly VarDelta[] {
    return toVarDeltas(this.world, entityId);
  }

  private entityVisibleToPlayer(playerId: EntityId, entityId: EntityId, tick: number): boolean {
    const groundItem = this.world.getComponent(entityId, "groundItem");
    return groundItem ? groundItemVisibleToPlayer(groundItem, playerId, tick) : true;
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
