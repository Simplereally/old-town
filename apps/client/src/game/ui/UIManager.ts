import type { ContentClient } from "./ContentClient";
import { GlobalKeydownBus } from "./GlobalKeydownBus";
import type { UIState } from "./UIState";

export interface UIManagerCallbacks {
  sendItemCommand(itemUid: number, actionId: string): void;
  sendChatCommand(text: string): void;
  enterSpellTargetMode(spellId: string): void;
  sendUiActionCommand(action: string, targetId?: string, value?: number): void;
}

/**
 * Orchestrates all UI panels: manages visibility, keyboard shortcuts, and renders
 * each panel's content from the authoritative UIState.
 */
export class UIManager {
  private readonly uiState: UIState;
  private readonly content: ContentClient;
  private readonly callbacks: UIManagerCallbacks;
  private readonly panels: Map<string, HTMLDivElement>;
  private readonly buttons: Map<string, HTMLButtonElement>;
  private readonly panelOrder = [
    "inventory-panel",
    "equipment-panel",
    "skills-panel",
    "spellbook-panel",
    "quest-panel",
    "chat-box",
  ];
  private readonly keyBindings: Record<string, string> = {
    i: "inventory-panel",
    e: "equipment-panel",
    k: "skills-panel",
    m: "spellbook-panel",
    q: "quest-panel",
    c: "chat-box",
    d: "debug-overlay",
  };
  private _unsubscribe: (() => void) | undefined;

  constructor(uiState: UIState, content: ContentClient, callbacks: UIManagerCallbacks) {
    this.uiState = uiState;
    this.content = content;
    this.callbacks = callbacks;
    this.panels = this._buildPanelMap();
    this.buttons = this._buildButtonMap();
    this._bindBarButtons();
    this._bindKeyboardShortcuts();
    this._bindChatInput();
    this._unsubscribe = uiState.onChange(() => this._renderAll());
  }

  private _barButtonListeners: Map<string, () => void> = new Map();
  private _chatSendListener: (() => void) | undefined;
  private _chatKeydownListener: ((e: KeyboardEvent) => void) | undefined;

  dispose(): void {
    this._unsubscribe?.();
    GlobalKeydownBus.unregister("ui-manager");
    for (const [panelId, listener] of this._barButtonListeners) {
      const btn = this.buttons.get(panelId);
      if (btn) {
        btn.removeEventListener("click", listener);
      }
    }
    this._barButtonListeners.clear();

    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("chat-send");
    if (input && this._chatKeydownListener) {
      input.removeEventListener("keydown", this._chatKeydownListener);
    }
    if (sendBtn && this._chatSendListener) {
      sendBtn.removeEventListener("click", this._chatSendListener);
    }
  }

  private _buildPanelMap(): Map<string, HTMLDivElement> {
    const map = new Map<string, HTMLDivElement>();
    for (const id of this.panelOrder) {
      const el = document.getElementById(id) as HTMLDivElement | null;
      if (el) map.set(id, el);
    }
    const debug = document.getElementById("debug-overlay") as HTMLDivElement | null;
    if (debug) map.set("debug-overlay", debug);
    return map;
  }

  private _buildButtonMap(): Map<string, HTMLButtonElement> {
    const map = new Map<string, HTMLButtonElement>();
    for (const btn of document.querySelectorAll<HTMLButtonElement>(".ui-bar-btn")) {
      const panelId = btn.dataset.panel;
      if (panelId) map.set(panelId, btn);
    }
    return map;
  }

  private _bindBarButtons(): void {
    for (const [panelId, btn] of this.buttons) {
      const listener = () => this.togglePanel(panelId);
      btn.addEventListener("click", listener);
      this._barButtonListeners.set(panelId, listener);
    }
  }

  private _bindKeyboardShortcuts(): void {
    GlobalKeydownBus.register("ui-manager", this._handleKeyDown);
  }

  private _bindChatInput(): void {
    const input = document.getElementById("chat-input") as HTMLInputElement | null;
    const sendBtn = document.getElementById("chat-send") as HTMLButtonElement | null;
    if (!input || !sendBtn) return;

    this._chatSendListener = () => {
      const text = input.value.trim();
      if (text) {
        this.callbacks.sendChatCommand(text);
        input.value = "";
      }
    };
    sendBtn.addEventListener("click", this._chatSendListener);

    this._chatKeydownListener = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const text = input.value.trim();
        if (text) {
          this.callbacks.sendChatCommand(text);
          input.value = "";
        }
      }
    };
    input.addEventListener("keydown", this._chatKeydownListener);
  }

  private _handleKeyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    const panelId = this.keyBindings[event.key.toLowerCase()];
    if (panelId) {
      event.preventDefault();
      this.togglePanel(panelId);
    }
  };

  togglePanel(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (!panel) return;
    const isDebugOverlay = panelId === "debug-overlay";
    const isHidden = isDebugOverlay
      ? !panel.classList.contains("visible")
      : panel.classList.contains("hidden");
    if (isHidden) {
      if (isDebugOverlay) {
        panel.classList.add("visible");
      } else {
        panel.classList.remove("hidden");
      }
    } else {
      if (isDebugOverlay) {
        panel.classList.remove("visible");
      } else {
        panel.classList.add("hidden");
      }
    }
    this._updateButtonState(panelId, isHidden);
  }

  private _updateButtonState(panelId: string, visible: boolean): void {
    const btn = this.buttons.get(panelId);
    if (btn) {
      btn.classList.toggle("active", visible);
    }
  }

  private _renderAll(): void {
    this._renderInventory();
    this._renderEquipment();
    this._renderSkills();
    this._renderSpellbook();
    this._renderQuests();
    this._renderChat();
    this._renderDialogue();
  }

  private _renderInventory(): void {
    const body = document.getElementById("inventory-body");
    if (!body) return;
    body.innerHTML = "";
    const grid = document.createElement("div");
    grid.classList.add("inventory-grid");

    for (let slot = 0; slot < 28; slot++) {
      const cell = document.createElement("div");
      cell.classList.add("inventory-cell");
      cell.title = `Slot ${slot}`;

      const item = this.uiState.inventory.get(slot);
      if (item) {
        const itemId = item.itemId ?? "";
        const quantity = item.quantity;
        const def = this.content.getItem(itemId);
        const name = def?.name ?? itemId ?? "";
        cell.textContent = name.length > 8 ? `${name.slice(0, 7)}…` : name;
        cell.title = `${name}${quantity > 1 ? ` x${quantity}` : ""}`;
        const uid = item.uid;
        if (uid !== undefined) {
          cell.addEventListener("click", () => {
            this.callbacks.sendItemCommand(uid, "use");
          });
          const allowedActionIds = new Set(["drop", "equip", "eat", "drink"]);
          const extraActions = def?.options?.filter((o) => allowedActionIds.has(o));
          if (extraActions && extraActions.length > 0) {
            cell.addEventListener("contextmenu", (e) => {
              e.preventDefault();
              const actionId = extraActions[0];
              if (actionId) {
                this.callbacks.sendItemCommand(uid, actionId);
              }
            });
          }
        }
      }
      grid.appendChild(cell);
    }
    body.appendChild(grid);
  }

  private _renderEquipment(): void {
    const body = document.getElementById("equipment-body");
    if (!body) return;
    body.innerHTML = "";
    const slots = [
      "Head",
      "Cape",
      "Amulet",
      "Weapon",
      "Body",
      "Shield",
      "Legs",
      "Hands",
      "Feet",
      "Ring",
      "Ammo",
    ];
    for (let i = 0, len = slots.length; i < len; i++) {
      const row = document.createElement("div");
      row.classList.add("ui-row");
      const label = document.createElement("span");
      label.textContent = slots[i] ?? "";
      label.classList.add("text-muted");
      const value = document.createElement("span");
      const itemId = this.uiState.equipment.get(i);
      if (itemId) {
        const def = this.content.getItem(itemId);
        value.textContent = def?.name ?? itemId;
        value.classList.add("text-bright");
      } else {
        value.textContent = "—";
        value.classList.add("text-dim");
      }
      row.appendChild(label);
      row.appendChild(value);
      body.appendChild(row);
    }
  }

  private _renderSkills(): void {
    const body = document.getElementById("skills-body");
    if (!body) return;
    body.innerHTML = "";
    const skills = Array.from(this.content.getAllSkills()).toSorted((a, b) =>
      a.name.localeCompare(b.name),
    );
    const uiSkills = this.uiState.skills;
    for (const skillDef of skills) {
      const state = uiSkills.get(skillDef.id);
      const row = document.createElement("div");
      row.classList.add("ui-row");
      const name = document.createElement("span");
      name.textContent = skillDef.name;
      const level = document.createElement("span");
      level.textContent = state ? `${state.level} / ${state.xp} XP` : "1 / 0 XP";
      level.classList.add("text-muted");
      row.appendChild(name);
      row.appendChild(level);
      body.appendChild(row);
    }
  }

  private _renderSpellbook(): void {
    const body = document.getElementById("spellbook-body");
    if (!body) return;
    body.innerHTML = "";
    const spells = Array.from(this.content.getAllSpells()).toSorted(
      (a, b) => a.requiredMagic - b.requiredMagic,
    );
    const magic = this.uiState.skills.get("magic");
    const magicLevel = magic?.level ?? 1;
    for (const spell of spells) {
      const row = document.createElement("div");
      row.classList.add("spell-row");
      const canCast = magicLevel >= spell.requiredMagic;
      row.classList.add(canCast ? "spell-can-cast" : "spell-cannot-cast");
      row.title = `${spell.name} (Magic ${spell.requiredMagic})`;
      row.textContent = `${spell.name} (Magic ${spell.requiredMagic})`;
      if (canCast) {
        row.addEventListener("click", () => {
          this.callbacks.enterSpellTargetMode(spell.id);
        });
      }
      body.appendChild(row);
    }
  }

  private _renderQuests(): void {
    const body = document.getElementById("quest-body");
    if (!body) return;
    body.innerHTML = "";
    const quests = Array.from(this.content.getAllQuests());
    const uiVars = this.uiState.vars;
    for (const quest of quests) {
      const stage = uiVars.get(`${quest.varPrefix}.stage`);
      if (stage === undefined || stage === 0) continue;
      const row = document.createElement("div");
      row.classList.add("ui-row-padded");
      const questStage = quest.stages.find((s) => s.stage === stage);
      row.textContent = `${quest.name}: ${questStage?.journalText ?? "In progress"}`;
      body.appendChild(row);
    }
    if (body.children.length === 0) {
      body.textContent = "No active quests.";
      body.classList.add("text-dim");
    }
  }

  private _renderChat(): void {
    const body = document.getElementById("chat-body");
    if (!body) return;
    body.innerHTML = "";
    const chat = this.uiState.chat;
    for (const msg of chat) {
      const name = msg.name ?? "System";
      const channel = msg.channel;
      const text = msg.text;
      const row = document.createElement("div");
      row.classList.add("ui-row-thin");
      const nameSpan = document.createElement("span");
      nameSpan.classList.add(channel === "system" ? "text-system" : "text-muted");
      nameSpan.textContent = `[${name}]`;
      row.appendChild(nameSpan);
      row.appendChild(document.createTextNode(` ${text}`));
      body.appendChild(row);
    }
    body.scrollTop = body.scrollHeight;
  }

  private _renderDialogue(): void {
    const box = document.getElementById("dialogue-box");
    const npcHeader = document.getElementById("dialogue-npc");
    const textEl = document.getElementById("dialogue-text");
    const optionsEl = document.getElementById("dialogue-options");
    if (!box || !npcHeader || !textEl || !optionsEl) return;

    const dialogue = this.uiState.dialogue;
    if (!dialogue) {
      box.classList.add("hidden");
      return;
    }

    const questDef = this.content.getQuest(dialogue.dialogueId);
    const def = questDef ?? this.content.getNpc(dialogue.dialogueId);
    npcHeader.textContent = def?.name ?? dialogue.dialogueId;
    textEl.textContent = "...";
    optionsEl.innerHTML = "";

    const uiVars = this.uiState.vars;
    if (questDef) {
      const stage = uiVars.get(`${questDef.varPrefix}.stage`);
      const questStage = this.content.getQuestStage(questDef.id, stage ?? -1);
      if (questStage) {
        textEl.textContent = questStage.journalText;
        for (let i = 0, len = questStage.objectives.length; i < len; i++) {
          const objective = questStage.objectives[i];
          if (!objective) continue;
          const opt = document.createElement("div");
          opt.classList.add("dialogue-option");
          opt.textContent =
            objective.kind === "talk" ? "Continue..." : `Objective: ${objective.kind}`;
          opt.addEventListener("click", () => {
            this.callbacks.sendUiActionCommand("dialogue_option", dialogue.nodeId, i);
          });
          optionsEl.appendChild(opt);
        }
      }
    }

    box.classList.remove("hidden");
  }
}
