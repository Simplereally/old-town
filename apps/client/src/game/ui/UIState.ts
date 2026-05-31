import type {
  InventoryDelta,
  InventorySlotChange,
  SkillDelta,
  VarbitDelta,
} from "@old-town/shared";
import type { ChatPacket } from "@old-town/shared";

/**
 * Client-side UI state container. Holds all authoritative state received from server
 * packets that is needed to render UI panels. Never invents state — every field is
 * populated exclusively from server deltas.
 */
export class UIState {
  private _inventory = new Map<number, InventorySlotChange>();
  private _equipment = new Map<number, string>();
  private _skills = new Map<string, SkillDelta>();
  private _vars = new Map<string, number>();
  private _chat: ChatPacket[] = [];
  private _dialogue: { dialogueId: string; nodeId: string } | undefined;
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

  get vars(): ReadonlyMap<string, number> {
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
    for (let i = 0; i < slots.length; i++) {
      const itemId = slots[i];
      if (itemId) {
        this._equipment.set(i, itemId);
      }
    }
    this._notify();
  }

  get dialogue(): { dialogueId: string; nodeId: string } | undefined {
    return this._dialogue;
  }

  setDialogue(dialogueId: string, nodeId: string): void {
    this._dialogue = { dialogueId, nodeId };
    this._notify();
  }

  clearDialogue(): void {
    this._dialogue = undefined;
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
