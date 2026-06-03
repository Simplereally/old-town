import {
  buildEntityUpdate,
  type ChatPacket,
  type ContractCompletePacket,
  type ContractProgressPacket,
  type DeathNoticePacket,
  type DebugPathData,
  type DebugTickData,
  type EntityId,
  type EntitySpawnPacket,
  type EntityUpdatePacket,
  type EntityUpdatePayload,
  type HitsplatPacket,
  type InterfaceClosePacket,
  type InterfaceOpenPacket,
  type InventoryDelta,
  type InventorySlotChange,
  type ProjectilePacket,
  type RecipeListPacket,
  type RecipeResultPacket,
  type RespawnNoticePacket,
  ServerPacketType,
  type SkillDelta,
  type SoundPacket,
  type TickDeltaPacket,
  type TileCoord,
  type VarbitDelta,
  type XpDropPacket,
} from "@old-town/shared";

export interface DirtyState {
  readonly entityAdds: readonly EntitySpawnPacket[];
  readonly entityRemoves: readonly EntityId[];
  readonly entityUpdates: readonly EntityUpdatePacket[];
  readonly inventoryDeltas?: readonly InventoryDelta[];
  readonly skillDelta?: readonly SkillDelta[];
  readonly varbitDelta?: readonly VarbitDelta[];
  readonly chat?: readonly ChatPacket[];
  readonly hitsplats?: readonly HitsplatPacket[];
  readonly xpDrops?: readonly XpDropPacket[];
  readonly projectiles?: readonly ProjectilePacket[];
  readonly interfaceOpens?: readonly InterfaceOpenPacket[];
  readonly interfaceCloses?: readonly InterfaceClosePacket[];
  readonly recipeLists?: readonly RecipeListPacket[];
  readonly recipeResults?: readonly RecipeResultPacket[];
  readonly deathNotices?: readonly DeathNoticePacket[];
  readonly respawnNotices?: readonly RespawnNoticePacket[];
  readonly contractComplete?: readonly ContractCompletePacket[];
  readonly contractProgress?: readonly ContractProgressPacket[];
  readonly sounds?: readonly SoundPacket[];
  readonly debug?: DebugTickData;
}

export interface DirtyState {
  readonly entityAdds: readonly EntitySpawnPacket[];
  readonly entityRemoves: readonly EntityId[];
  readonly entityUpdates: readonly EntityUpdatePacket[];
  readonly inventoryDeltas?: readonly InventoryDelta[];
  readonly skillDelta?: readonly SkillDelta[];
  readonly varbitDelta?: readonly VarbitDelta[];
  readonly chat?: readonly ChatPacket[];
  readonly hitsplats?: readonly HitsplatPacket[];
  readonly xpDrops?: readonly XpDropPacket[];
  readonly projectiles?: readonly ProjectilePacket[];
  readonly interfaceOpens?: readonly InterfaceOpenPacket[];
  readonly interfaceCloses?: readonly InterfaceClosePacket[];
  readonly contractProgress?: readonly ContractProgressPacket[];
  readonly sounds?: readonly SoundPacket[];
  readonly debug?: DebugTickData;
}

interface InventoryDeltaBuilder {
  readonly containerId: string;
  readonly changesBySlot: Map<number, InventorySlotChange>;
}

export interface DeltaMutationObserver {
  onEntityUpdate?(entityId: EntityId, changes: EntityUpdatePayload): void;
  onInventoryDelta?(delta: InventoryDelta): void;
  onSkillDelta?(delta: SkillDelta): void;
  onVarbitDelta?(delta: VarbitDelta): void;
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
  private inventoryDeltas = new Map<string, InventoryDeltaBuilder>();
  private readonly skillDeltas = new Map<string, SkillDelta>();
  private readonly varbitDeltas = new Map<string, VarbitDelta>();
  private chatPackets: ChatPacket[] = [];
  private hitsplatPackets: HitsplatPacket[] = [];
  private xpDropPackets: XpDropPacket[] = [];
  private projectilePackets: ProjectilePacket[] = [];
  private interfaceOpenPackets: InterfaceOpenPacket[] = [];
  private interfaceClosePackets: InterfaceClosePacket[] = [];
  private recipeListPackets: RecipeListPacket[] = [];
  private recipeResultPackets: RecipeResultPacket[] = [];
  private deathNoticePackets: DeathNoticePacket[] = [];
  private respawnNoticePackets: RespawnNoticePacket[] = [];
  private contractCompletePackets: ContractCompletePacket[] = [];
  private contractProgressPackets: ContractProgressPacket[] = [];
  private soundPackets: SoundPacket[] = [];
  private readonly debugPaths = new Map<EntityId, DebugPathData>();
  private observer: DeltaMutationObserver | undefined;

  constructor(observer?: DeltaMutationObserver) {
    this.observer = observer;
  }

  setObserver(observer: DeltaMutationObserver | undefined): void {
    this.observer = observer;
  }

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
    this.observer?.onEntityUpdate?.(entityId, changes);
  }

  markInventoryDelta(delta: InventoryDelta): void {
    let builder = this.inventoryDeltas.get(delta.containerId);
    if (!builder) {
      builder = {
        containerId: delta.containerId,
        changesBySlot: new Map(),
      };
      this.inventoryDeltas.set(delta.containerId, builder);
    }
    const changesBySlot = builder.changesBySlot;
    for (const change of delta.changes) {
      changesBySlot.set(change.slot, change);
    }
    this.observer?.onInventoryDelta?.(delta);
  }

  markSkillDelta(delta: SkillDelta): void {
    this.skillDeltas.set(delta.skillId, delta);
    this.observer?.onSkillDelta?.(delta);
  }

  markVarbitDelta(delta: VarbitDelta): void {
    this.varbitDeltas.set(delta.varId, delta);
    this.observer?.onVarbitDelta?.(delta);
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

  markProjectile(packet: ProjectilePacket): void {
    this.projectilePackets.push(packet);
  }

  markInterfaceOpen(packet: InterfaceOpenPacket): void {
    this.interfaceOpenPackets.push(packet);
  }

  markInterfaceClose(packet: InterfaceClosePacket): void {
    this.interfaceClosePackets.push(packet);
  }

  markDeathNotice(packet: DeathNoticePacket): void {
    this.deathNoticePackets.push(packet);
  }

  markRespawnNotice(packet: RespawnNoticePacket): void {
    this.respawnNoticePackets.push(packet);
  }

  markContractComplete(packet: ContractCompletePacket): void {
    this.contractCompletePackets.push(packet);
  }

  markContractProgress(packet: ContractProgressPacket): void {
    this.contractProgressPackets.push(packet);
  }

  markSound(packet: SoundPacket): void {
    this.soundPackets.push(packet);
  }

  markRecipeList(packet: RecipeListPacket): void {
    this.recipeListPackets.push(packet);
  }

  markRecipeResult(packet: RecipeResultPacket): void {
    this.recipeResultPackets.push(packet);
  }

  markDebugPath(entityId: EntityId, path: readonly TileCoord[]): void {
    this.debugPaths.set(entityId, { entityId, path });
  }

  peek(): DirtyState {
    const inventoryDeltas = this.buildInventoryDeltas();

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
      ...(inventoryDeltas.length > 0 ? { inventoryDeltas } : {}),
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
      ...(this.projectilePackets.length > 0 ? { projectiles: [...this.projectilePackets] } : {}),
      ...(this.interfaceOpenPackets.length > 0
        ? { interfaceOpens: [...this.interfaceOpenPackets] }
        : {}),
      ...(this.interfaceClosePackets.length > 0
        ? { interfaceCloses: [...this.interfaceClosePackets] }
        : {}),
      ...(this.recipeListPackets.length > 0
        ? { recipeLists: [...this.recipeListPackets] }
        : {}),
      ...(this.recipeResultPackets.length > 0
        ? { recipeResults: [...this.recipeResultPackets] }
        : {}),
      ...(this.deathNoticePackets.length > 0
        ? { deathNotices: [...this.deathNoticePackets] }
        : {}),
      ...(this.respawnNoticePackets.length > 0
        ? { respawnNotices: [...this.respawnNoticePackets] }
        : {}),
      ...(this.contractCompletePackets.length > 0
        ? { contractComplete: [...this.contractCompletePackets] }
        : {}),
      ...(this.contractProgressPackets.length > 0
        ? { contractProgress: [...this.contractProgressPackets] }
        : {}),
      ...(this.soundPackets.length > 0 ? { sounds: [...this.soundPackets] } : {}),
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

  private buildInventoryDeltas(): InventoryDelta[] {
    if (this.inventoryDeltas.size === 0) {
      return [];
    }
    const deltas: InventoryDelta[] = [];
    for (const builder of this.inventoryDeltas.values()) {
      let changes = Array.from(builder.changesBySlot.values());
      if (changes.length > 1) {
        changes = changes.toSorted((a, b) => a.slot - b.slot);
      }
      deltas.push({ containerId: builder.containerId, changes });
    }
    return deltas.toSorted((a, b) => a.containerId.localeCompare(b.containerId));
  }

  private clear(): void {
    this.entityAdds.clear();
    this.entityRemoves.clear();
    this.entityUpdates.clear();
    this.inventoryDeltas.clear();
    this.skillDeltas.clear();
    this.varbitDeltas.clear();
    this.chatPackets = [];
    this.hitsplatPackets = [];
    this.xpDropPackets = [];
    this.projectilePackets = [];
    this.interfaceOpenPackets = [];
    this.interfaceClosePackets = [];
    this.recipeListPackets = [];
    this.recipeResultPackets = [];
    this.deathNoticePackets = [];
    this.respawnNoticePackets = [];
    this.contractCompletePackets = [];
    this.contractProgressPackets = [];
    this.soundPackets = [];
    this.debugPaths.clear();
  }
}
