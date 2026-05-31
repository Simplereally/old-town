import {
  Direction,
  type EntityId,
  type EntitySpawnPacket,
  type FullStatePacket,
  type TickDeltaPacket,
  type TileCoord,
} from "@old-town/shared";
import { Vector3 } from "three";
import type { ActorRenderer } from "../scene/ActorRenderer";
import type { ChatOverheadLayer } from "../scene/ChatOverheadLayer";
import type { DebugLayer } from "../scene/DebugLayer";
import type { GroundItemLayer } from "../scene/GroundItemLayer";
import type { HitsplatLayer } from "../scene/HitsplatLayer";
import type { ObjectRenderer } from "../scene/ObjectRenderer";
import type { TerrainLayer } from "../scene/TerrainLayer";
import type { UIState } from "../ui/UIState";

export interface PacketApplierContext {
  readonly terrain: TerrainLayer;
  readonly objects: ObjectRenderer;
  readonly actors: ActorRenderer;
  readonly groundItems: GroundItemLayer;
  readonly hitsplats: HitsplatLayer;
  readonly chatOverhead: ChatOverheadLayer;
  readonly debug: DebugLayer | undefined;
  readonly uiState: UIState;
  readonly selfEntityId: number;
  readonly logDebug: (message: string) => void;
  readonly tileSizeWorldUnits: number;
}

export interface PacketApplierResult {
  readonly tick: number;
  readonly serverTime: number;
  readonly selfEntityId: number;
  readonly rejectedMoves: readonly { tile: TileCoord; tick: number }[];
}

/**
 * Owns all server → client packet application semantics.
 * GameEngine routes socket packets here; this module decides what layers
 * to update, what entities to spawn/remove, and what UI state to mutate.
 *
 * Full state is an authoritative reset: all layers are cleared before
 * applying the new snapshot.
 */
export class ClientPacketApplier {
  private _lastClickTile: TileCoord | undefined;
  private _lastClickTick = 0;
  private _selfEntityId = 0;

  constructor(private readonly ctx: PacketApplierContext) {}

  get lastClickTile(): TileCoord | undefined {
    return this._lastClickTile;
  }

  get lastClickTick(): number {
    return this._lastClickTick;
  }

  get selfEntityId(): number {
    return this._selfEntityId;
  }

  applyFullState(packet: FullStatePacket): PacketApplierResult {
    const ctx = this.ctx;
    this._selfEntityId = packet.selfEntityId;
    ctx.actors.clear();
    ctx.objects.clear();
    ctx.groundItems.clear();
    ctx.hitsplats.clear();
    ctx.chatOverhead.clear();
    ctx.debug?.clear();

    if (packet.regionLoads) {
      for (const region of packet.regionLoads) {
        if (region.chunks) {
          for (const chunk of region.chunks) {
            ctx.terrain.loadChunk(region.regionId, chunk);
          }
        }
      }
    }

    for (const entity of packet.entities) {
      this._spawnEntity(entity, this._selfEntityId);
    }

    if (packet.inventory) {
      ctx.uiState.setInventory(packet.inventory);
    }
    if (packet.skills) {
      ctx.uiState.setSkills(packet.skills);
    }
    if (packet.vars) {
      ctx.uiState.setVars(packet.vars);
    }

    return {
      tick: packet.tick,
      serverTime: packet.serverTime,
      selfEntityId: packet.selfEntityId,
      rejectedMoves: [],
    };
  }

  applyTickDelta(packet: TickDeltaPacket, currentTick: number): PacketApplierResult {
    const ctx = this.ctx;

    if (packet.regionUnloads) {
      for (const region of packet.regionUnloads) {
        ctx.terrain.unloadRegion(region.regionId);
      }
    }

    if (packet.regionLoads) {
      for (const region of packet.regionLoads) {
        if (region.chunks) {
          for (const chunk of region.chunks) {
            ctx.terrain.loadChunk(region.regionId, chunk);
          }
        }
      }
    }

    for (const entity of packet.entityAdds) {
      this._spawnEntity(entity, this._selfEntityId);
    }

    for (const id of packet.entityRemoves) {
      ctx.objects.remove(id);
      ctx.actors.remove(id);
      ctx.groundItems.remove(id);
    }

    for (const update of packet.entityUpdates) {
      const changes = update.changes;
      if (changes.position) {
        ctx.actors.updateTile(update.entityId, changes.position);
      }
      if (changes.facingTile) {
        const actor = ctx.actors.getActorState(update.entityId);
        if (actor) {
          const dx = changes.facingTile.x - actor.serverTile.x;
          const dy = changes.facingTile.y - actor.serverTile.y;
          if (dx !== 0 || dy !== 0) {
            const direction = this._getDirectionFromDelta(dx, dy);
            ctx.actors.updateFacing(update.entityId, direction);
          }
        }
      }
      if (changes.hitsplat) {
        ctx.hitsplats.show(update.entityId, changes.hitsplat.amount, changes.hitsplat.type);
      }
      if (changes.equipment && update.entityId === this._selfEntityId) {
        ctx.uiState.setEquipment(changes.equipment.slots);
      }
      if (changes.appearance) {
        ctx.actors.updateAppearance(update.entityId, changes.appearance);
      }
      if (changes.transform) {
        ctx.objects.transform(update.entityId, changes.transform);
      }
    }

    if (packet.hitsplats) {
      for (const hitsplat of packet.hitsplats) {
        ctx.hitsplats.show(hitsplat.entityId, hitsplat.hitsplat.amount, hitsplat.hitsplat.type);
      }
    }

    if (packet.inventoryDelta) {
      ctx.uiState.applyInventoryDelta(packet.inventoryDelta);
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
          const actor = ctx.actors.getActorState(msg.entityId);
          if (actor) {
            ctx.chatOverhead.show(msg.entityId, msg.text, actor.visualPosition);
          }
        }
      }
    }

    if (packet.interfaceOpens) {
      for (const open of packet.interfaceOpens) {
        ctx.uiState.setDialogue(open.interfaceId, "start");
      }
    }

    const rejectedMoves = this._applyDebugData(packet.debug, currentTick);

    return {
      tick: packet.tick,
      serverTime: packet.serverTime,
      selfEntityId: this._selfEntityId,
      rejectedMoves,
    };
  }

  private _spawnEntity(entity: EntitySpawnPacket, selfEntityId: number): void {
    const ctx = this.ctx;
    const entityId = entity.entityId;
    const kind = entity.kind;
    const tile = entity.tile;
    const defId = entity.defId;

    if (kind === "object") {
      ctx.objects.spawn(entityId, tile, defId ?? "default");
    } else if (kind === "player" || kind === "npc") {
      ctx.actors.spawn(entityId, tile, defId, entityId === selfEntityId, kind);
      if (kind === "player" && entityId === selfEntityId && entity.appearance) {
        ctx.actors.updateAppearance(entityId, entity.appearance);
      }
    } else if (kind === "ground_item") {
      ctx.groundItems.spawn(entityId, tile, defId ?? "unknown", entity.quantity ?? 1);
    } else {
      ctx.logDebug(`Unknown entity kind in spawn: ${kind}`);
    }
  }

  private _applyDebugData(
    debugData: TickDeltaPacket["debug"],
    currentTick: number,
  ): { tile: TileCoord; tick: number }[] {
    const ctx = this.ctx;
    const rejected: { tile: TileCoord; tick: number }[] = [];

    if (!debugData) return rejected;

    if (debugData.paths) {
      let foundSelfPath = false;
      for (const pathData of debugData.paths) {
        const entityId = pathData.entityId;
        const path = pathData.path;
        if (entityId === this._selfEntityId) {
          foundSelfPath = true;
          if (
            path.length === 0 &&
            this._lastClickTile &&
            this._lastClickTick > currentTick - 2
          ) {
            rejected.push({ tile: this._lastClickTile, tick: this._lastClickTick });
            ctx.logDebug(
              `Move rejected: no path to (${this._lastClickTile.x}, ${this._lastClickTile.y})`,
            );
          } else {
            for (const tile of path) {
              ctx.debug?.markPathTile(tile);
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
        ctx.debug?.markTrueTile(tt.tile, tt.entityId);
      }
    }
    if (debugData?.collisionTiles) {
      for (const tile of debugData.collisionTiles) {
        ctx.debug?.markCollisionTile(tile);
      }
    }
    if (debugData?.footprints) {
      for (const tile of debugData.footprints) {
        ctx.debug?.markFootprint(tile);
      }
    }
    if (debugData?.reachTiles) {
      for (const rt of debugData.reachTiles) {
        ctx.debug?.markReachTiles(rt.center, rt.radius);
      }
    }
    if (debugData?.loSRays) {
      for (const ray of debugData.loSRays) {
        const start = new Vector3(
          ray.start.x * ctx.tileSizeWorldUnits,
          0.5,
          -ray.start.y * ctx.tileSizeWorldUnits,
        );
        const end = new Vector3(
          ray.end.x * ctx.tileSizeWorldUnits,
          0.5,
          -ray.end.y * ctx.tileSizeWorldUnits,
        );
        ctx.debug?.markLoSRay(start, end);
      }
    }
    if (debugData?.actionQueue) {
      ctx.debug?.setActionQueue(debugData.actionQueue as string[]);
    }
    if (debugData?.combatCooldown !== undefined) {
      ctx.debug?.setCombatCooldown(debugData.combatCooldown);
    }
    if (debugData?.pendingHits) {
      const hits = new Map<string, number>();
      for (const h of debugData.pendingHits) {
        hits.set(h.targetId.toString(), h.amount);
      }
      ctx.debug?.setPendingHits(hits);
    }
    if (debugData?.npcLeash) {
      ctx.debug?.setNpcLeash(debugData.npcLeash);
    }
    if (debugData?.varbits) {
      const vars = new Map<string, number>();
      for (const v of debugData.varbits) {
        vars.set(v.varId, v.value);
      }
      ctx.debug?.setVarbits(vars);
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

  /** Record a click tile for move-rejection tracking. */
  recordClickTile(tile: TileCoord, tick: number): void {
    this._lastClickTile = tile;
    this._lastClickTick = tick;
  }
}
