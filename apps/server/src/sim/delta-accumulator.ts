import {
  type ChatPacket,
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
  type VarbitDelta,
  type XpDropPacket,
  buildEntityUpdate,
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
    if (!this.inventoryDelta) {
      this.inventoryDelta = {
        containerId: delta.containerId,
        changesBySlot: new Map(),
      };
    }
    if (this.inventoryDelta.containerId !== delta.containerId) {
      throw new Error("A tick delta packet can only carry one inventory container delta");
    }
    for (const change of delta.changes) {
      this.inventoryDelta.changesBySlot.set(change.slot, change);
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

  peek(): DirtyState {
    const inventoryDelta = this.buildInventoryDelta();

    return {
      entityAdds: Array.from(this.entityAdds.values()).sort((a, b) =>
        entityOrder(a.entityId, b.entityId),
      ),
      entityRemoves: Array.from(this.entityRemoves).sort(entityOrder),
      entityUpdates: Array.from(this.entityUpdates.entries())
        .sort(([a], [b]) => entityOrder(a, b))
        .map(([entityId, changes]) => buildEntityUpdate(entityId, changes)),
      ...(inventoryDelta ? { inventoryDelta } : {}),
      ...(this.skillDeltas.size > 0
        ? {
            skillDelta: Array.from(this.skillDeltas.values()).sort((a, b) =>
              a.skillId.localeCompare(b.skillId),
            ),
          }
        : {}),
      ...(this.varbitDeltas.size > 0
        ? {
            varbitDelta: Array.from(this.varbitDeltas.values()).sort((a, b) =>
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
    if (!this.inventoryDelta) {
      return undefined;
    }
    return {
      containerId: this.inventoryDelta.containerId,
      changes: Array.from(this.inventoryDelta.changesBySlot.values()).sort(
        (a, b) => a.slot - b.slot,
      ),
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
  }
}
