import {
  buildEntityUpdate,
  type ChatPacket,
  type DebugPathData,
  type DebugTickData,
  type EntityId,
  type EntitySpawnPacket,
  type EntityUpdatePacket,
  type EntityUpdatePayload,
  type HitsplatPacket,
  type InterfaceOpenPacket,
  type InventoryDelta,
  type InventorySlotChange,
  ServerPacketType,
  type SkillDelta,
  type TickDeltaPacket,
  type TileCoord,
  type VarbitDelta,
  type XpDropPacket,
} from "@old-town/shared";

export interface DirtyState {
  readonly entityAdds: readonly EntitySpawnPacket[];
  readonly entityRemoves: readonly EntityId[];
  readonly entityUpdates: readonly EntityUpdatePacket[];
  readonly inventoryDelta?: InventoryDelta;
  readonly skillDelta?: readonly SkillDelta[];
  readonly varbitDelta?: readonly VarbitDelta[];
  readonly chat?: readonly ChatPacket[];
  readonly hitsplats?: readonly HitsplatPacket[];
  readonly xpDrops?: readonly XpDropPacket[];
  readonly interfaceOpens?: readonly InterfaceOpenPacket[];
  readonly debug?: DebugTickData;
}

interface InventoryDeltaBuilder {
  readonly containerId: string;
  readonly changesBySlot: Map<number, InventorySlotChange>;
}

function entityOrder(a: EntityId, b: EntityId): number {
  return (a as number) - (b as number);
}

function hasPayloadFields(payload: EntityUpdatePayload): boolean {
  return Object.values(payload).some((value) => value !== undefined);
}

export class DeltaAccumulator {
  private readonly entityAdds = new Map<EntityId, EntitySpawnPacket>();
  private readonly entityRemoves = new Set<EntityId>();
  private readonly entityUpdates = new Map<EntityId, EntityUpdatePayload>();
  private inventoryDelta: InventoryDeltaBuilder | undefined;
  private readonly skillDeltas = new Map<string, SkillDelta>();
  private readonly varbitDeltas = new Map<string, VarbitDelta>();
  private chatPackets: ChatPacket[] = [];
  private hitsplatPackets: HitsplatPacket[] = [];
  private xpDropPackets: XpDropPacket[] = [];
  private interfaceOpenPackets: InterfaceOpenPacket[] = [];
  private readonly debugPaths = new Map<EntityId, DebugPathData>();

  markEntityAdd(spawn: EntitySpawnPacket): void {
    this.entityRemoves.delete(spawn.entityId);
    this.entityAdds.set(spawn.entityId, spawn);
  }

  markEntityRemove(entityId: EntityId): void {
    const removedPendingAdd = this.entityAdds.delete(entityId);
    this.entityUpdates.delete(entityId);
    if (!removedPendingAdd) {
      this.entityRemoves.add(entityId);
    }
  }

  markEntityUpdate(entityId: EntityId, changes: EntityUpdatePayload): void {
    if (this.entityRemoves.has(entityId) || !hasPayloadFields(changes)) {
      return;
    }

    this.entityUpdates.set(entityId, {
      ...(this.entityUpdates.get(entityId) ?? {}),
      ...changes,
    });
  }

  markInventoryDelta(delta: InventoryDelta): void {
    let inventoryDelta = this.inventoryDelta;
    if (!inventoryDelta) {
      inventoryDelta = {
        containerId: delta.containerId,
        changesBySlot: new Map(),
      };
      this.inventoryDelta = inventoryDelta;
    }
    if (inventoryDelta.containerId !== delta.containerId) {
      throw new Error("A tick delta packet can only carry one inventory container delta");
    }
    const changesBySlot = inventoryDelta.changesBySlot;
    for (const change of delta.changes) {
      changesBySlot.set(change.slot, change);
    }
  }

  markSkillDelta(delta: SkillDelta): void {
    this.skillDeltas.set(delta.skillId, delta);
  }

  markVarbitDelta(delta: VarbitDelta): void {
    this.varbitDeltas.set(delta.varId, delta);
  }

  markChat(packet: ChatPacket): void {
    this.chatPackets.push(packet);
  }

  markHitsplat(packet: HitsplatPacket): void {
    this.hitsplatPackets.push(packet);
  }

  markXpDrop(packet: XpDropPacket): void {
    this.xpDropPackets.push(packet);
  }

  markInterfaceOpen(packet: InterfaceOpenPacket): void {
    this.interfaceOpenPackets.push(packet);
  }

  markDebugPath(entityId: EntityId, path: readonly TileCoord[]): void {
    this.debugPaths.set(entityId, { entityId, path });
  }

  peek(): DirtyState {
    const inventoryDelta = this.buildInventoryDelta();

    const entityAdds =
      this.entityAdds.size === 0
        ? []
        : Array.from(this.entityAdds.values()).toSorted((a, b) =>
            entityOrder(a.entityId, b.entityId),
          );

    const entityRemoves =
      this.entityRemoves.size === 0 ? [] : Array.from(this.entityRemoves).toSorted(entityOrder);

    const entityUpdates =
      this.entityUpdates.size === 0
        ? []
        : Array.from(this.entityUpdates.entries())
            .toSorted(([a], [b]) => entityOrder(a, b))
            .map(([entityId, changes]) => buildEntityUpdate(entityId, changes));

    return {
      entityAdds,
      entityRemoves,
      entityUpdates,
      ...(inventoryDelta ? { inventoryDelta } : {}),
      ...(this.skillDeltas.size > 0
        ? {
            skillDelta: Array.from(this.skillDeltas.values()).toSorted((a, b) =>
              a.skillId.localeCompare(b.skillId),
            ),
          }
        : {}),
      ...(this.varbitDeltas.size > 0
        ? {
            varbitDelta: Array.from(this.varbitDeltas.values()).toSorted((a, b) =>
              a.varId.localeCompare(b.varId),
            ),
          }
        : {}),
      ...(this.chatPackets.length > 0 ? { chat: [...this.chatPackets] } : {}),
      ...(this.hitsplatPackets.length > 0 ? { hitsplats: [...this.hitsplatPackets] } : {}),
      ...(this.xpDropPackets.length > 0 ? { xpDrops: [...this.xpDropPackets] } : {}),
      ...(this.interfaceOpenPackets.length > 0
        ? { interfaceOpens: [...this.interfaceOpenPackets] }
        : {}),
      ...(this.debugPaths.size > 0
        ? {
            debug: {
              paths: Array.from(this.debugPaths.values()).toSorted((a, b) =>
                entityOrder(a.entityId, b.entityId),
              ),
            },
          }
        : {}),
    };
  }

  peekPacket(tick: number, serverTime: number): TickDeltaPacket {
    return {
      type: ServerPacketType.TickDelta,
      tick,
      serverTime,
      ...this.peek(),
    };
  }

  consume(tick: number, serverTime: number): TickDeltaPacket {
    const packet = this.peekPacket(tick, serverTime);
    this.clear();
    return packet;
  }

  private buildInventoryDelta(): InventoryDelta | undefined {
    const inventoryDelta = this.inventoryDelta;
    if (!inventoryDelta) {
      return undefined;
    }
    let changes = Array.from(inventoryDelta.changesBySlot.values());
    if (changes.length > 1) {
      changes = changes.toSorted((a, b) => a.slot - b.slot);
    }
    return {
      containerId: inventoryDelta.containerId,
      changes,
    };
  }

  private clear(): void {
    this.entityAdds.clear();
    this.entityRemoves.clear();
    this.entityUpdates.clear();
    this.inventoryDelta = undefined;
    this.skillDeltas.clear();
    this.varbitDeltas.clear();
    this.chatPackets = [];
    this.hitsplatPackets = [];
    this.xpDropPackets = [];
    this.interfaceOpenPackets = [];
    this.debugPaths.clear();
  }
}
