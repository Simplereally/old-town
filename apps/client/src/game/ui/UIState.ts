import type {
  ChatPacket,
  DialogueViewPacket,
  InventoryDelta,
  InventorySlotChange,
  PlayerVarValue,
  ShopViewPacket,
  SkillDelta,
  VarbitDelta,
} from "@old-town/shared";

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
  private _listeners = new Set<() => void>();

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
    this._notify();
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
    this._notify();
  }

  /** Apply a full skills snapshot (from FullStatePacket). */
  setSkills(skills: readonly SkillDelta[]): void {
    this._skills.clear();
    for (const skill of skills) {
      this._skills.set(skill.skillId, skill);
    }
    this._notify();
  }

  /** Apply a skill delta (from TickDeltaPacket). */
  applySkillDelta(delta: readonly SkillDelta[]): void {
    for (const skill of delta) {
      this._skills.set(skill.skillId, skill);
    }
    this._notify();
  }

  /** Apply a full vars snapshot (from FullStatePacket). */
  setVars(vars: readonly VarbitDelta[]): void {
    this._vars.clear();
    for (const v of vars) {
      this._vars.set(v.varId, v.value);
    }
    this._notify();
  }

  /** Apply a varbit delta (from TickDeltaPacket). */
  applyVarbitDelta(delta: readonly VarbitDelta[]): void {
    for (const v of delta) {
      this._vars.set(v.varId, v.value);
    }
    this._notify();
  }

  setEquipment(slots: readonly (string | null)[]): void {
    this._equipment.clear();
    for (let i = 0, len = slots.length; i < len; i++) {
      const itemId = slots[i];
      if (itemId) {
        this._equipment.set(i, itemId);
      }
    }
    this._notify();
  }

  get dialogue(): DialogueViewPacket | undefined {
    return this._dialogue;
  }

  setDialogue(dialogue: DialogueViewPacket): void {
    this._dialogue = dialogue;
    this._notify();
  }

  clearDialogue(): void {
    this._dialogue = undefined;
    this._notify();
  }

  get bank(): ReadonlyMap<number, InventorySlotChange> {
    return this._bank;
  }

  setBank(delta: InventoryDelta): void {
    this._bank.clear();
    for (const change of delta.changes) {
      this._bank.set(change.slot, change);
    }
    this._notify();
  }

  applyBankDelta(delta: InventoryDelta): void {
    for (const change of delta.changes) {
      if (change.itemId === null) {
        this._bank.delete(change.slot);
      } else {
        this._bank.set(change.slot, change);
      }
    }
    this._notify();
  }

  clearBank(): void {
    this._bank.clear();
    this._notify();
  }

  get shop(): ShopViewPacket | undefined {
    return this._shop;
  }

  setShop(shop: ShopViewPacket): void {
    this._shop = shop;
    this._notify();
  }

  clearShop(): void {
    this._shop = undefined;
    this._notify();
  }

  /** Append chat messages (from TickDeltaPacket). */
  addChat(messages: readonly ChatPacket[]): void {
    this._chat.push(...messages);
    while (this._chat.length > 200) {
      this._chat.shift();
    }
    this._notify();
  }

  /** Clear all chat history. */
  clearChat(): void {
    this._chat = [];
    this._notify();
  }

  /** Register a listener that fires whenever state changes. */
  onChange(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notify(): void {
    for (const listener of this._listeners) {
      listener();
    }
  }
}
