import type {
  ActivityViewPacket,
  ChatPacket,
  ContractCompletePacket,
  ContractProgressPacket,
  DialogueViewPacket,
  InventoryDelta,
  InventorySlotChange,
  PlayerVarValue,
  RecipeListPacket,
  RecipeResultPacket,
  ShopViewPacket,
  SkillDelta,
  StatusEffectUpdate,
  TileCoord,
  VarbitDelta,
  XpDropPacket,
} from "@old-town/shared";

export interface MinimapTile {
  readonly x: number;
  readonly y: number;
  readonly underlayId: string;
  readonly water?: boolean;
}

export interface MinimapEntity {
  readonly entityId: number;
  readonly kind: "player" | "npc" | "object";
  readonly tile: TileCoord;
  readonly defId?: string;
}

export interface Notification {
  readonly id: string;
  readonly text: string;
  readonly type: "success" | "failure" | "info";
  readonly createdAt: number;
}

export type UIStateChange =
  | "inventory"
  | "equipment"
  | "skills"
  | "vars"
  | "chat"
  | "dialogue"
  | "bank"
  | "shop"
  | "minimap"
  | "recipes"
  | "contract"
  | "statusEffects"
  | "deathScreen"
  | "notifications"
  | "xpDrops"
  | "activity";

/**
 * Client-side UI state container. Holds all authoritative state received from server
 * packets that is needed to render UI panels. Never invents state — every field is
 * populated exclusively from server deltas.
 */
export class UIState {
  private _inventory = new Map<number, InventorySlotChange>();
  private _equipment = new Map<number, string>();
  private _skills = new Map<string, SkillDelta>();
  private _vars = new Map<string, PlayerVarValue>();
  private _chat: ChatPacket[] = [];
  private _dialogue: DialogueViewPacket | undefined;
  private _bank = new Map<number, InventorySlotChange>();
  private _shop: ShopViewPacket | undefined;
  private _minimapPlayerTile: TileCoord | undefined;
  private _minimapEntities = new Map<number, MinimapEntity>();
  private _minimapTiles = new Map<string, MinimapTile>();
  private _minimapRegionTileKeys = new Map<string, Set<string>>();
  private _recipeList: RecipeListPacket | undefined;
  private _recipeResult: RecipeResultPacket | undefined;
  private _activeContract: ContractProgressPacket | undefined;
  private _contractCompletes: ContractCompletePacket[] = [];
  private _statusEffects: StatusEffectUpdate[] = [];
  private _deathScreen = false;
  private _notifications: Notification[] = [];
  private _xpDrops: XpDropPacket[] = [];
  private _activity: ActivityViewPacket | undefined;
  private _listeners = new Set<(change: UIStateChange) => void>();

  get inventory(): ReadonlyMap<number, InventorySlotChange> {
    return this._inventory;
  }

  get equipment(): ReadonlyMap<number, string> {
    return this._equipment;
  }

  get skills(): ReadonlyMap<string, SkillDelta> {
    return this._skills;
  }

  get vars(): ReadonlyMap<string, PlayerVarValue> {
    return this._vars;
  }

  get chat(): readonly ChatPacket[] {
    return this._chat;
  }

  /** Apply a full inventory snapshot (from FullStatePacket). */
  setInventory(delta: InventoryDelta): void {
    this._inventory.clear();
    for (const change of delta.changes) {
      this._inventory.set(change.slot, change);
    }
    this._notify("inventory");
  }

  /** Apply an inventory delta (from TickDeltaPacket). */
  applyInventoryDelta(delta: InventoryDelta): void {
    for (const change of delta.changes) {
      if (change.itemId === null) {
        this._inventory.delete(change.slot);
      } else {
        this._inventory.set(change.slot, change);
      }
    }
    this._notify("inventory");
  }

  /** Apply a full skills snapshot (from FullStatePacket). */
  setSkills(skills: readonly SkillDelta[]): void {
    this._skills.clear();
    for (const skill of skills) {
      this._skills.set(skill.skillId, skill);
    }
    this._notify("skills");
  }

  /** Apply a skill delta (from TickDeltaPacket). */
  applySkillDelta(delta: readonly SkillDelta[]): void {
    for (const skill of delta) {
      this._skills.set(skill.skillId, skill);
    }
    this._notify("skills");
  }

  /** Apply a full vars snapshot (from FullStatePacket). */
  setVars(vars: readonly VarbitDelta[]): void {
    this._vars.clear();
    for (const v of vars) {
      this._vars.set(v.varId, v.value);
    }
    this._notify("vars");
  }

  /** Apply a varbit delta (from TickDeltaPacket). */
  applyVarbitDelta(delta: readonly VarbitDelta[]): void {
    for (const v of delta) {
      this._vars.set(v.varId, v.value);
    }
    this._notify("vars");
  }

  setEquipment(slots: readonly (string | null)[]): void {
    this._equipment.clear();
    for (let i = 0, len = slots.length; i < len; i++) {
      const itemId = slots[i];
      if (itemId) {
        this._equipment.set(i, itemId);
      }
    }
    this._notify("equipment");
  }

  get dialogue(): DialogueViewPacket | undefined {
    return this._dialogue;
  }

  setDialogue(dialogue: DialogueViewPacket): void {
    this._dialogue = dialogue;
    this._notify("dialogue");
  }

  clearDialogue(): void {
    this._dialogue = undefined;
    this._notify("dialogue");
  }

  get bank(): ReadonlyMap<number, InventorySlotChange> {
    return this._bank;
  }

  setBank(delta: InventoryDelta): void {
    this._bank.clear();
    for (const change of delta.changes) {
      this._bank.set(change.slot, change);
    }
    this._notify("bank");
  }

  applyBankDelta(delta: InventoryDelta): void {
    for (const change of delta.changes) {
      if (change.itemId === null) {
        this._bank.delete(change.slot);
      } else {
        this._bank.set(change.slot, change);
      }
    }
    this._notify("bank");
  }

  clearBank(): void {
    this._bank.clear();
    this._notify("bank");
  }

  get shop(): ShopViewPacket | undefined {
    return this._shop;
  }

  setShop(shop: ShopViewPacket): void {
    this._shop = shop;
    this._notify("shop");
  }

  clearShop(): void {
    this._shop = undefined;
    this._notify("shop");
  }

  get minimapPlayerTile(): TileCoord | undefined {
    return this._minimapPlayerTile;
  }

  setMinimapPlayerTile(tile: TileCoord): void {
    this._minimapPlayerTile = tile;
    this._notify("minimap");
  }

  get minimapEntities(): ReadonlyMap<number, MinimapEntity> {
    return this._minimapEntities;
  }

  setMinimapEntity(entity: MinimapEntity): void {
    this._minimapEntities.set(entity.entityId, entity);
    this._notify("minimap");
  }

  updateMinimapEntityTile(entityId: number, tile: TileCoord): void {
    const existing = this._minimapEntities.get(entityId);
    if (existing) {
      this._minimapEntities.set(entityId, { ...existing, tile });
      this._notify("minimap");
    }
  }

  removeMinimapEntity(entityId: number): void {
    this._minimapEntities.delete(entityId);
    this._notify("minimap");
  }

  clearMinimapEntities(): void {
    this._minimapEntities.clear();
    this._notify("minimap");
  }

  get minimapTiles(): ReadonlyMap<string, MinimapTile> {
    return this._minimapTiles;
  }

  addMinimapTiles(regionId: string, tiles: readonly MinimapTile[]): void {
    const keys: string[] = [];
    for (const tile of tiles) {
      const key = `${tile.x}:${tile.y}`;
      this._minimapTiles.set(key, tile);
      keys.push(key);
    }
    this._minimapRegionTileKeys.set(regionId, new Set(keys));
    this._notify("minimap");
  }

  removeMinimapTilesByRegion(regionId: string): void {
    const keys = this._minimapRegionTileKeys.get(regionId);
    if (keys) {
      for (const key of keys) {
        this._minimapTiles.delete(key);
      }
      this._minimapRegionTileKeys.delete(regionId);
      this._notify("minimap");
    }
  }

  clearMinimapTiles(): void {
    this._minimapTiles.clear();
    this._minimapRegionTileKeys.clear();
    this._notify("minimap");
  }

  get recipeList(): RecipeListPacket | undefined {
    return this._recipeList;
  }

  setRecipeList(packet: RecipeListPacket): void {
    this._recipeList = packet;
    this._recipeResult = undefined;
    this._notify("recipes");
  }

  clearRecipeList(): void {
    this._recipeList = undefined;
    this._recipeResult = undefined;
    this._notify("recipes");
  }

  get recipeResult(): RecipeResultPacket | undefined {
    return this._recipeResult;
  }

  setRecipeResult(packet: RecipeResultPacket): void {
    this._recipeResult = packet;
    this._notify("recipes");
  }

  clearRecipeResult(): void {
    this._recipeResult = undefined;
    this._notify("recipes");
  }

  get activeContract(): ContractProgressPacket | undefined {
    return this._activeContract;
  }

  setActiveContract(contract: ContractProgressPacket): void {
    this._activeContract = contract;
    this._notify("contract");
  }

  clearActiveContract(): void {
    this._activeContract = undefined;
    this._notify("contract");
  }

  get contractCompletes(): readonly ContractCompletePacket[] {
    return this._contractCompletes;
  }

  addContractComplete(packet: ContractCompletePacket): void {
    this._contractCompletes.push(packet);
    while (this._contractCompletes.length > 10) {
      this._contractCompletes.shift();
    }
    this._notify("contract");
  }

  setContract(packet: ContractCompletePacket): void {
    this.addContractComplete(packet);
  }

  clearContractCompletes(): void {
    this._contractCompletes = [];
    this._notify("contract");
  }

  get statusEffects(): readonly StatusEffectUpdate[] {
    return this._statusEffects;
  }

  setStatusEffects(effects: readonly StatusEffectUpdate[]): void {
    this._statusEffects = effects.slice();
    this._notify("statusEffects");
  }

  get deathScreen(): boolean {
    return this._deathScreen;
  }

  setDeathScreen(active: boolean): void {
    this._deathScreen = active;
    this._notify("deathScreen");
  }

  get notifications(): readonly Notification[] {
    return this._notifications;
  }

  addNotification(notification: Notification): void {
    this._notifications.push(notification);
    while (this._notifications.length > 20) {
      this._notifications.shift();
    }
    this._notify("notifications");
  }

  removeNotification(id: string): void {
    this._notifications = this._notifications.filter((n) => n.id !== id);
    this._notify("notifications");
  }

  clearNotifications(): void {
    this._notifications = [];
    this._notify("notifications");
  }

  get xpDrops(): readonly XpDropPacket[] {
    return this._xpDrops;
  }

  get activity(): ActivityViewPacket | undefined {
    return this._activity;
  }

  setActivity(activity: ActivityViewPacket): void {
    this._activity = activity;
    this._notify("activity");
  }

  clearActivity(): void {
    this._activity = undefined;
    this._notify("activity");
  }

  addXpDrops(drops: readonly XpDropPacket[]): void {
    this._xpDrops.push(...drops);
    while (this._xpDrops.length > 50) {
      this._xpDrops.shift();
    }
    this._notify("xpDrops");
  }

  clearXpDrops(): void {
    this._xpDrops = [];
    this._notify("xpDrops");
  }

  /** Append chat messages (from TickDeltaPacket). */
  addChat(messages: readonly ChatPacket[]): void {
    this._chat.push(...messages);
    while (this._chat.length > 200) {
      this._chat.shift();
    }
    this._notify("chat");
  }

  /** Clear all chat history. */
  clearChat(): void {
    this._chat = [];
    this._notify("chat");
  }

  /** Register a listener that fires whenever state changes. */
  onChange(listener: (change: UIStateChange) => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notify(change: UIStateChange): void {
    for (const listener of this._listeners) {
      listener(change);
    }
  }
}
