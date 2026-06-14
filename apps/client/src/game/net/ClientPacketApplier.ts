import {
  type ChatPacket,
  Direction,
  type EntitySpawnPacket,
  type FullStatePacket,
  type InventoryDelta,
  type InventorySlotChange,
  type PlayerVarValue,
  type SkillDelta,
  type StatusEffectUpdate,
  type TickDeltaPacket,
  type TileCoord,
  type VarbitDelta,
  type XpDropPacket,
} from "@old-town/shared";
import type { ClientWorldStore, WorldEntity } from "./ClientWorldStore";
import type { RenderEvent, RenderSnapshot, SnapshotBuffer } from "./SnapshotBuffer";

export interface IUIState {
  readonly inventory: ReadonlyMap<number, InventorySlotChange>;
  readonly equipment: ReadonlyMap<number, string>;
  readonly skills: ReadonlyMap<string, SkillDelta>;
  readonly vars: ReadonlyMap<string, PlayerVarValue>;
  readonly chat: readonly ChatPacket[];
  readonly dialogue: import("@old-town/shared").DialogueViewPacket | undefined;
  readonly recipeList: import("@old-town/shared").RecipeListPacket | undefined;
  readonly recipeResult: import("@old-town/shared").RecipeResultPacket | undefined;
  readonly activity: import("@old-town/shared").ActivityViewPacket | undefined;
  readonly deathScreen: boolean;
  setInventory(delta: InventoryDelta): void;
  setSkills(skills: readonly SkillDelta[]): void;
  setVars(vars: readonly VarbitDelta[]): void;
  setEquipment(slots: readonly (string | null)[]): void;
  applyInventoryDelta(delta: InventoryDelta): void;
  applySkillDelta(delta: readonly SkillDelta[]): void;
  applyVarbitDelta(delta: readonly VarbitDelta[]): void;
  addChat(chat: readonly ChatPacket[]): void;
  setDialogue(dialogue: import("@old-town/shared").DialogueViewPacket): void;
  clearDialogue(): void;
  setBank(delta: InventoryDelta): void;
  applyBankDelta(delta: InventoryDelta): void;
  clearBank(): void;
  setShop(shop: import("@old-town/shared").ShopViewPacket): void;
  clearShop(): void;
  setRecipeList(packet: import("@old-town/shared").RecipeListPacket): void;
  clearRecipeList(): void;
  setRecipeResult(packet: import("@old-town/shared").RecipeResultPacket): void;
  clearRecipeResult(): void;
  setActivity(activity: import("@old-town/shared").ActivityViewPacket): void;
  clearActivity(): void;
  addXpDrops(drops: readonly XpDropPacket[]): void;
  setDeathScreen(active: boolean): void;
  setStatusEffects(effects: readonly StatusEffectUpdate[]): void;
  setContract(contract: import("@old-town/shared").ContractCompletePacket): void;
  addNotification(notification: {
    id: string;
    text: string;
    type: "success" | "failure" | "info";
    createdAt: number;
  }): void;
}

export interface PresentationEvent {
  readonly type: string;
  readonly payload: unknown;
}

export interface PurePacketApplierContext {
  readonly store: ClientWorldStore;
  readonly snapshotBuffer: SnapshotBuffer;
  readonly uiState: IUIState;
  readonly logDebug: (message: string) => void;
  readonly tileSizeWorldUnits: number;
}

export interface PurePacketApplierResult {
  readonly tick: number;
  readonly serverTime: number;
  readonly selfEntityId: number;
  readonly rejectedMoves: readonly { tile: TileCoord; tick: number }[];
  readonly presentationEvents: readonly PresentationEvent[];
  readonly debugEvents: readonly PresentationEvent[];
  readonly snapshot: RenderSnapshot;
}

/**
 * Owns all server → client packet application semantics.
 *
 * Refactored to be pure: it updates ClientWorldStore, SnapshotBuffer, and
 * UIState, and returns PresentationEvent / DebugEvent queues. It never calls
 * scene-layer methods directly. GameEngine or a render-frame applier consumes
 * the returned events.
 *
 * Full state is an authoritative reset: the store is cleared and the snapshot
 * buffer is reset before applying the new snapshot.
 */
export class ClientPacketApplier {
  private _lastClickTile: TileCoord | undefined;
  private _lastClickTick = 0;

  constructor(private readonly ctx: PurePacketApplierContext) {}

  get lastClickTile(): TileCoord | undefined {
    return this._lastClickTile;
  }

  get lastClickTick(): number {
    return this._lastClickTick;
  }

  get selfEntityId(): number {
    return this.ctx.store.selfEntityId;
  }

  recordClickTile(tile: TileCoord, tick: number): void {
    this._lastClickTile = tile;
    this._lastClickTick = tick;
  }

  applyFullState(packet: FullStatePacket): PurePacketApplierResult {
    const ctx = this.ctx;
    const store = ctx.store;
    const presentationEvents: PresentationEvent[] = [];
    const debugEvents: PresentationEvent[] = [];

    store.clear();
    ctx.snapshotBuffer.reset({
      tick: packet.tick,
      sequence: packet.tick,
      serverTimeMs: packet.serverTime,
      entities: [],
      events: [],
      regionLoads: packet.regionLoads ?? [],
      regionUnloads: [],
    });

    store.setSelfEntityId(packet.selfEntityId);

    // Clear events
    presentationEvents.push({ type: "actors.clear", payload: undefined });
    presentationEvents.push({ type: "objects.clear", payload: undefined });
    presentationEvents.push({ type: "groundItems.clear", payload: undefined });
    presentationEvents.push({ type: "hitsplats.clear", payload: undefined });
    presentationEvents.push({ type: "xpDrops.clear", payload: undefined });
    presentationEvents.push({ type: "projectiles.clear", payload: undefined });
    presentationEvents.push({ type: "chatOverhead.clear", payload: undefined });
    debugEvents.push({ type: "debug.clear", payload: undefined });

    // Region loads
    if (packet.regionLoads) {
      for (const region of packet.regionLoads) {
        presentationEvents.push({
          type: "region.load",
          payload: { regionId: region.regionId, chunks: region.chunks ?? [] },
        });
      }
    }

    // Entities
    for (const entity of packet.entities) {
      this._spawnEntity(entity, packet.selfEntityId, store, presentationEvents);
    }

    // UI state
    if (packet.inventory) {
      ctx.uiState.setInventory(packet.inventory);
    }
    if (packet.equipment) {
      ctx.uiState.setEquipment(packet.equipment.slots);
    }
    if (packet.skills) {
      ctx.uiState.setSkills(packet.skills);
    }
    if (packet.vars) {
      ctx.uiState.setVars(packet.vars);
    }
    if (packet.bank) {
      ctx.uiState.setBank(packet.bank);
    }

    const snapshot = this._buildSnapshot(
      packet.tick,
      packet.serverTime,
      presentationEvents,
      debugEvents,
      packet.regionLoads ?? [],
      [],
    );
    ctx.snapshotBuffer.reset(snapshot);

    return {
      tick: packet.tick,
      serverTime: packet.serverTime,
      selfEntityId: packet.selfEntityId,
      rejectedMoves: [],
      presentationEvents,
      debugEvents,
      snapshot,
    };
  }

  applyTickDelta(packet: TickDeltaPacket, currentTick: number): PurePacketApplierResult | null {
    const ctx = this.ctx;
    const store = ctx.store;

    if (packet.tick <= currentTick) {
      return null;
    }

    const presentationEvents: PresentationEvent[] = [];
    const debugEvents: PresentationEvent[] = [];

    // Region unloads
    if (packet.regionUnloads) {
      for (const region of packet.regionUnloads) {
        presentationEvents.push({
          type: "region.unload",
          payload: { regionId: region.regionId },
        });
      }
    }

    // Region loads
    if (packet.regionLoads) {
      for (const region of packet.regionLoads) {
        presentationEvents.push({
          type: "region.load",
          payload: { regionId: region.regionId, chunks: region.chunks ?? [] },
        });
      }
    }

    // Entity adds
    for (const entity of packet.entityAdds) {
      this._spawnEntity(entity, store.selfEntityId, store, presentationEvents);
    }

    // Entity removes
    for (const id of packet.entityRemoves) {
      store.removeEntity(id);
      presentationEvents.push({ type: "objects.remove", payload: { entityId: id } });
      presentationEvents.push({ type: "actors.remove", payload: { entityId: id } });
      presentationEvents.push({ type: "groundItems.remove", payload: { entityId: id } });
    }

    // Entity updates
    for (const update of packet.entityUpdates) {
      const changes = update.changes;
      const entityId = update.entityId;
      let entity = store.getEntity(entityId);
      const updateEntity = (updated: WorldEntity): void => {
        entity = updated;
        store.setEntity(updated);
      };

      if (changes.position) {
        if (entity) {
          const moved: WorldEntity = {
            ...entity,
            previousTile: entity.tile,
            tile: changes.position,
          };
          updateEntity({ ...moved, moveSpeed: this._deriveMoveSpeed(moved) });
        }
        presentationEvents.push({
          type: "actors.updateTile",
          payload: { entityId, tile: changes.position },
        });
      }
      if (changes.facingTile) {
        if (entity) {
          const dx = changes.facingTile.x - entity.tile.x;
          const dy = changes.facingTile.y - entity.tile.y;
          if (dx !== 0 || dy !== 0) {
            const direction = this._getDirectionFromDelta(dx, dy);
            presentationEvents.push({
              type: "actors.updateFacing",
              payload: { entityId, direction },
            });
            const updated: WorldEntity = { ...entity, facing: direction };
            updateEntity(updated);
          }
        }
      }
      if (changes.hitsplat) {
        presentationEvents.push({
          type: "hitsplats.show",
          payload: {
            entityId,
            amount: changes.hitsplat.amount,
            type: changes.hitsplat.type,
            tick: currentTick,
          },
        });
        presentationEvents.push({
          type: "actors.notifyHit",
          payload: { entityId, tick: currentTick },
        });
      }
      if (changes.healthBar) {
        if (entity) {
          const updated: WorldEntity = { ...entity, healthBar: changes.healthBar };
          updateEntity(updated);
        }
        presentationEvents.push({
          type: "actors.updateHealthBar",
          payload: {
            entityId,
            health: changes.healthBar.current,
            maxHealth: changes.healthBar.max,
          },
        });
      }
      if (changes.equipment && entityId === store.selfEntityId) {
        ctx.uiState.setEquipment(changes.equipment.slots);
      }
      if (changes.appearance) {
        if (entity) {
          const updated: WorldEntity = { ...entity, appearance: changes.appearance };
          updateEntity(updated);
        }
        presentationEvents.push({
          type: "actors.updateAppearance",
          payload: { entityId, appearance: changes.appearance },
        });
      }
      if (changes.transform) {
        presentationEvents.push({
          type: "objects.transform",
          payload: { entityId, defId: changes.transform },
        });
      }
      if (changes.overheadText) {
        presentationEvents.push({
          type: "chatOverhead.show",
          payload: { entityId, text: changes.overheadText },
        });
      }
      if (changes.animation) {
        presentationEvents.push({
          type: "actors.updateAnimation",
          payload: {
            entityId,
            animationId: changes.animation.id,
            startTick: changes.animation.startTick,
          },
        });
      }
      if (changes.moveSpeed) {
        if (entity) {
          const updated: WorldEntity = {
            ...entity,
            moveSpeedRaw: changes.moveSpeed,
            moveSpeed: this._mapMoveSpeed(changes.moveSpeed),
          };
          updateEntity(updated);
        }
        presentationEvents.push({
          type: "actors.updateMoveSpeed",
          payload: { entityId, speed: changes.moveSpeed },
        });
      }
      if (changes.facingEntity) {
        const actor = store.getEntity(entityId);
        const targetActor = store.getEntity(changes.facingEntity);
        if (actor && targetActor) {
          const dx = targetActor.tile.x - actor.tile.x;
          const dy = targetActor.tile.y - actor.tile.y;
          if (dx !== 0 || dy !== 0) {
            const direction = this._getDirectionFromDelta(dx, dy);
            presentationEvents.push({
              type: "actors.updateFacing",
              payload: { entityId, direction },
            });
            const updated: WorldEntity = { ...actor, facing: direction };
            updateEntity(updated);
          }
        }
      }
      if (changes.statusEffects) {
        ctx.uiState.setStatusEffects(changes.statusEffects);
      }
      if (changes.graphic) {
        ctx.logDebug(`Graphic play: ${changes.graphic.id}`);
      }
    }

    // Hitsplats
    if (packet.hitsplats) {
      for (const hitsplat of packet.hitsplats) {
        presentationEvents.push({
          type: "hitsplats.show",
          payload: {
            entityId: hitsplat.entityId,
            amount: hitsplat.hitsplat.amount,
            type: hitsplat.hitsplat.type,
            tick: currentTick,
          },
        });
        presentationEvents.push({
          type: "actors.notifyHit",
          payload: { entityId: hitsplat.entityId, tick: currentTick },
        });
      }
    }

    // XP drops
    if (packet.xpDrops) {
      for (const xpDrop of packet.xpDrops) {
        presentationEvents.push({
          type: "xpDrops.show",
          payload: {
            entityId: store.selfEntityId,
            skillId: xpDrop.skillId,
            amount: xpDrop.amount,
            tick: currentTick,
          },
        });
      }
      ctx.uiState.addXpDrops(packet.xpDrops);
    }

    // Death notices
    if (packet.deathNotices) {
      for (const notice of packet.deathNotices) {
        ctx.uiState.setDeathScreen(true);
        presentationEvents.push({
          type: "actors.hide",
          payload: { entityId: notice.entityId },
        });
        const entity = store.getEntity(notice.entityId);
        if (entity) {
          const updated = { ...entity, hidden: true };
          store.setEntity(updated);
        }
      }
    }

    // Respawn notices
    if (packet.respawnNotices) {
      for (const notice of packet.respawnNotices) {
        ctx.uiState.setDeathScreen(false);
        presentationEvents.push({
          type: "actors.show",
          payload: { entityId: notice.entityId },
        });
        presentationEvents.push({
          type: "actors.updateTile",
          payload: { entityId: notice.entityId, tile: notice.tile },
        });
        const entity = store.getEntity(notice.entityId);
        if (entity) {
          const updated = {
            ...entity,
            tile: notice.tile,
            previousTile: entity.tile,
            hidden: false,
          };
          store.setEntity(updated);
        }
      }
    }

    // Sounds
    if (packet.sounds) {
      for (const sound of packet.sounds) {
        ctx.logDebug(`Sound: ${sound.soundId}`);
      }
    }

    // Projectiles
    if (packet.projectiles) {
      for (const projectile of packet.projectiles) {
        presentationEvents.push({
          type: "projectiles.spawn",
          payload: {
            id: projectile.id,
            startTile: projectile.startTile,
            endTile: projectile.endTile,
            startTick: projectile.startTick,
            hitTick: projectile.hitTick,
          },
        });
      }
    }

    // Inventory deltas
    if (packet.inventoryDeltas) {
      for (const delta of packet.inventoryDeltas) {
        if (delta.containerId === "bank") {
          ctx.uiState.applyBankDelta(delta);
        } else {
          ctx.uiState.applyInventoryDelta(delta);
        }
      }
    }
    if (packet.skillDelta) {
      ctx.uiState.applySkillDelta(packet.skillDelta);
    }
    if (packet.varbitDelta) {
      ctx.uiState.applyVarbitDelta(packet.varbitDelta);
    }
    if (packet.chat) {
      ctx.uiState.addChat(packet.chat);
      for (const msg of packet.chat) {
        if (msg.channel !== "system" && msg.entityId !== undefined) {
          presentationEvents.push({
            type: "chatOverhead.show",
            payload: { entityId: msg.entityId, text: msg.text },
          });
        }
      }
    }

    // Interface opens
    if (packet.interfaceOpens) {
      for (const open of packet.interfaceOpens) {
        if (open.dialogue) {
          ctx.uiState.setDialogue(open.dialogue);
        }
        if (open.interfaceId === "bank") {
          // no-op
        }
        if (open.shop) {
          ctx.uiState.setShop(open.shop);
        }
        if (open.recipe) {
          ctx.uiState.setRecipeList(open.recipe);
        }
        if (open.activity) {
          ctx.uiState.setActivity(open.activity);
        }
      }
    }
    if (packet.interfaceCloses) {
      for (const close of packet.interfaceCloses) {
        if (close.interfaceId === "dialogue") {
          ctx.uiState.clearDialogue();
        }
        if (close.interfaceId === "bank") {
          ctx.uiState.clearBank();
        }
        if (close.interfaceId === "shop") {
          ctx.uiState.clearShop();
        }
        if (close.interfaceId === "recipe") {
          ctx.uiState.clearRecipeList();
        }
        if (close.interfaceId === "activity") {
          ctx.uiState.clearActivity();
        }
      }
    }

    if (packet.recipeLists && packet.recipeLists.length > 0) {
      const first = packet.recipeLists[0];
      if (first) ctx.uiState.setRecipeList(first);
    }

    if (packet.recipeResults && packet.recipeResults.length > 0) {
      const last = packet.recipeResults[packet.recipeResults.length - 1];
      if (last) ctx.uiState.setRecipeResult(last);
    }

    if (packet.contractComplete) {
      for (const contract of packet.contractComplete) {
        ctx.uiState.setContract(contract);
        ctx.uiState.addNotification({
          id: `contract-${contract.contractId}`,
          text: `Contract complete: ${contract.name}`,
          type: "success",
          createdAt: packet.serverTime,
        });
        ctx.logDebug(`Contract complete: ${contract.name}`);
      }
    }

    const rejectedMoves = this._applyDebugData(packet.debug, currentTick, debugEvents);

    const snapshot = this._buildSnapshot(
      packet.tick,
      packet.serverTime,
      presentationEvents,
      debugEvents,
      packet.regionLoads ?? [],
      packet.regionUnloads ?? [],
    );
    const accepted = ctx.snapshotBuffer.insert(snapshot);
    if (!accepted) {
      return null;
    }

    return {
      tick: packet.tick,
      serverTime: packet.serverTime,
      selfEntityId: store.selfEntityId,
      rejectedMoves,
      presentationEvents,
      debugEvents,
      snapshot,
    };
  }

  private _spawnEntity(
    entity: EntitySpawnPacket,
    selfEntityId: number,
    store: ClientWorldStore,
    events: PresentationEvent[],
  ): void {
    const entityId = entity.entityId;
    const kind = entity.kind;
    const tile = entity.tile;
    const defId = entity.defId;

    if (kind === "object") {
      store.setEntity({
        entityId,
        kind: "object",
        tile,
        previousTile: null,
        moveSpeed: "idle",
        facing: 0,
        appearance: {},
        healthBar: null,
        defId: defId ?? "default",
        isLocalPlayer: false,
      });
      events.push({
        type: "objects.spawn",
        payload: { entityId, tile, defId: defId ?? "default" },
      });
    } else if (kind === "player" || kind === "npc") {
      const isLocalPlayer = entityId === selfEntityId;
      const moveSpeed = this._mapMoveSpeed(entity.moveSpeed ?? "stationary");
      store.setEntity({
        entityId,
        kind,
        tile,
        previousTile: null,
        moveSpeed,
        facing: entity.facing ?? 0,
        appearance: entity.appearance ?? {},
        healthBar: entity.healthBar ?? null,
        defId: defId ?? (kind === "player" ? "player" : "npc"),
        isLocalPlayer,
        moveSpeedRaw: entity.moveSpeed ?? "stationary",
      });
      events.push({
        type: "actors.spawn",
        payload: { entityId, tile, defId, isLocalPlayer, kind },
      });
      if (entity.healthBar) {
        events.push({
          type: "actors.updateHealthBar",
          payload: {
            entityId,
            health: entity.healthBar.current,
            maxHealth: entity.healthBar.max,
          },
        });
      }
      if (entity.appearance) {
        events.push({
          type: "actors.updateAppearance",
          payload: { entityId, appearance: entity.appearance },
        });
      }
    } else if (kind === "ground_item") {
      store.setEntity({
        entityId,
        kind: "groundItem",
        tile,
        previousTile: null,
        moveSpeed: "idle",
        facing: 0,
        appearance: {},
        healthBar: null,
        defId: defId ?? "unknown",
        quantity: entity.quantity ?? 1,
        isLocalPlayer: false,
      });
      events.push({
        type: "groundItems.spawn",
        payload: {
          entityId,
          tile,
          defId: defId ?? "unknown",
          quantity: entity.quantity ?? 1,
        },
      });
    } else if (kind === "grave") {
      store.setEntity({
        entityId,
        kind: "grave",
        tile,
        previousTile: null,
        moveSpeed: "idle",
        facing: 0,
        appearance: {},
        healthBar: null,
        defId: defId ?? "grave",
        isLocalPlayer: false,
      });
      events.push({
        type: "objects.spawn",
        payload: { entityId, tile, defId: defId ?? "grave" },
      });
    } else {
      this.ctx.logDebug(`Unknown entity kind in spawn: ${kind}`);
    }
  }

  private _applyDebugData(
    debugData: TickDeltaPacket["debug"],
    currentTick: number,
    events: PresentationEvent[],
  ): { tile: TileCoord; tick: number }[] {
    const rejected: { tile: TileCoord; tick: number }[] = [];
    const ctx = this.ctx;

    if (!debugData) return rejected;

    if (debugData.paths) {
      let foundSelfPath = false;
      for (const pathData of debugData.paths) {
        const entityId = pathData.entityId;
        const path = pathData.path;
        if (entityId === ctx.store.selfEntityId) {
          foundSelfPath = true;
          if (path.length === 0 && this._lastClickTile && this._lastClickTick > currentTick - 2) {
            rejected.push({ tile: this._lastClickTile, tick: this._lastClickTick });
            ctx.logDebug(
              `Move rejected: no path to (${this._lastClickTile.x}, ${this._lastClickTile.y})`,
            );
          } else {
            for (const tile of path) {
              events.push({ type: "debug.markPathTile", payload: { tile } });
            }
          }
        }
      }
      if (!foundSelfPath && this._lastClickTile && this._lastClickTick > currentTick - 2) {
        rejected.push({ tile: this._lastClickTile, tick: this._lastClickTick });
        ctx.logDebug(
          `Move rejected: no path to (${this._lastClickTile.x}, ${this._lastClickTile.y})`,
        );
      }
    }

    if (debugData?.trueTiles) {
      for (const tt of debugData.trueTiles) {
        events.push({
          type: "debug.markTrueTile",
          payload: { tile: tt.tile, entityId: tt.entityId },
        });
      }
    }
    if (debugData?.collisionTiles) {
      for (const tile of debugData.collisionTiles) {
        events.push({ type: "debug.markCollisionTile", payload: { tile } });
      }
    }
    if (debugData?.footprints) {
      for (const tile of debugData.footprints) {
        events.push({ type: "debug.markFootprint", payload: { tile } });
      }
    }
    if (debugData?.reachTiles) {
      for (const rt of debugData.reachTiles) {
        events.push({
          type: "debug.markReachTiles",
          payload: { center: rt.center, radius: rt.radius },
        });
      }
    }
    if (debugData?.loSRays) {
      for (const ray of debugData.loSRays) {
        const start = {
          x: ray.start.x * ctx.tileSizeWorldUnits,
          y: 0.5,
          z: -ray.start.y * ctx.tileSizeWorldUnits,
        };
        const end = {
          x: ray.end.x * ctx.tileSizeWorldUnits,
          y: 0.5,
          z: -ray.end.y * ctx.tileSizeWorldUnits,
        };
        events.push({ type: "debug.markLoSRay", payload: { start, end } });
      }
    }
    if (debugData?.actionQueue) {
      events.push({
        type: "debug.setActionQueue",
        payload: { queue: debugData.actionQueue as string[] },
      });
    }
    if (debugData?.combatCooldown !== undefined) {
      events.push({
        type: "debug.setCombatCooldown",
        payload: { ticks: debugData.combatCooldown },
      });
    }
    if (debugData?.pendingHits) {
      const hits = new Map<string, number>();
      for (const h of debugData.pendingHits) {
        hits.set(h.targetId.toString(), h.amount);
      }
      events.push({ type: "debug.setPendingHits", payload: { hits } });
    }
    if (debugData?.npcLeash) {
      events.push({
        type: "debug.setNpcLeash",
        payload: { tile: debugData.npcLeash },
      });
    }
    if (debugData?.varbits) {
      const vars = new Map<string, number>();
      for (const v of debugData.varbits) {
        vars.set(v.varId, v.value);
      }
      events.push({ type: "debug.setVarbits", payload: { vars } });
    }

    return rejected;
  }

  private _getDirectionFromDelta(dx: number, dy: number): Direction {
    if (dy > 0)
      return dx > 0 ? Direction.NorthEast : dx < 0 ? Direction.NorthWest : Direction.North;
    if (dy < 0)
      return dx > 0 ? Direction.SouthEast : dx < 0 ? Direction.SouthWest : Direction.South;
    return dx > 0 ? Direction.East : Direction.West;
  }

  private _mapMoveSpeed(
    speed: "stationary" | "walk" | "run",
  ): "idle" | "walk" | "run" | "teleport" {
    if (speed === "stationary") return "idle";
    return speed;
  }

  private _deriveMoveSpeed(entity: WorldEntity): "walk" | "run" | "idle" | "teleport" {
    if (!entity.previousTile) return "idle";
    const dx = Math.abs(entity.tile.x - entity.previousTile.x);
    const dy = Math.abs(entity.tile.y - entity.previousTile.y);
    const dist = Math.max(dx, dy);
    if (dist > 1) return "teleport";
    if (dist === 0) return "idle";
    return entity.moveSpeedRaw === "run" ? "run" : "walk";
  }

  private _buildSnapshot(
    tick: number,
    serverTime: number,
    presentationEvents: PresentationEvent[],
    debugEvents: PresentationEvent[],
    regionLoads: readonly import("@old-town/shared").RegionLoadPacket[] = [],
    regionUnloads: readonly import("@old-town/shared").RegionUnloadPacket[] = [],
  ): RenderSnapshot {
    const entities = this.ctx.store.getAllEntities().map((e) => ({
      entityId: e.entityId,
      kind:
        e.kind === "groundItem"
          ? "groundItem"
          : e.kind === "grave"
            ? "object"
            : (e.kind as "player" | "npc" | "object" | "groundItem"),
      tile: e.tile,
      previousTile: e.previousTile,
      moveSpeed: e.moveSpeed,
      facing: e.facing,
      appearance: e.appearance,
      healthBar: e.healthBar,
      defId: e.defId,
      presentationFlags: e.hidden ? 1 : 0,
    }));
    const events: RenderEvent[] = [
      ...presentationEvents.map((e) => ({ type: e.type, payload: e.payload })),
      ...debugEvents.map((e) => ({ type: e.type, payload: e.payload })),
    ];
    return {
      tick,
      sequence: tick,
      serverTimeMs: serverTime,
      entities,
      events,
      regionLoads,
      regionUnloads,
    };
  }
}
