import type { ContentClient } from "./ContentClient";
import type { UIState } from "./UIState";

export interface UIManagerCallbacks {
  sendItemCommand(itemUid: number, option: string): void;
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
  private _chatInputListener: (() => void) | undefined;
  private _chatSendListener: (() => void) | undefined;
  private _chatKeydownListener: ((e: KeyboardEvent) => void) | undefined;

  dispose(): void {
    this._unsubscribe?.();
    document.removeEventListener("keydown", this._handleKeyDown);
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
    document.addEventListener("keydown", this._handleKeyDown);
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
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(4, 1fr)";
    grid.style.gap = "4px";

    for (let slot = 0; slot < 28; slot++) {
      const cell = document.createElement("div");
      cell.style.width = "40px";
      cell.style.height = "40px";
      cell.style.background = "rgba(40, 40, 50, 0.8)";
      cell.style.border = "1px solid #444";
      cell.style.display = "flex";
      cell.style.alignItems = "center";
      cell.style.justifyContent = "center";
      cell.style.fontSize = "10px";
      cell.style.cursor = "pointer";
      cell.style.overflow = "hidden";
      cell.style.textOverflow = "ellipsis";
      cell.style.padding = "2px";
      cell.style.textAlign = "center";
      cell.title = `Slot ${slot}`;

      const item = this.uiState.inventory.get(slot);
      if (item) {
        const def = this.content.getItem(item.itemId ?? "");
        const name = def?.name ?? item.itemId ?? "";
        cell.textContent = name.length > 8 ? `${name.slice(0, 7)}…` : name;
        cell.title = `${name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`;
        const uid = item.uid;
        if (uid !== undefined) {
          cell.addEventListener("click", () => {
            this.callbacks.sendItemCommand(uid, "use");
          });
          const itemDef = this.content.getItem(item.itemId ?? "");
          const extraOptions = itemDef?.options?.filter((o) =>
            ["drop", "equip", "eat", "drink"].includes(o),
          );
          if (extraOptions && extraOptions.length > 0) {
            cell.addEventListener("contextmenu", (e) => {
              e.preventDefault();
              const option = extraOptions[0];
              if (option) {
                this.callbacks.sendItemCommand(uid, option);
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
    for (let i = 0; i < slots.length; i++) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.padding = "3px 0";
      row.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
      const label = document.createElement("span");
      label.textContent = slots[i] ?? "";
      label.style.color = "#aaa";
      const value = document.createElement("span");
      const itemId = this.uiState.equipment.get(i);
      if (itemId) {
        const def = this.content.getItem(itemId);
        value.textContent = def?.name ?? itemId;
        value.style.color = "#fff";
      } else {
        value.textContent = "—";
        value.style.color = "#555";
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
    const skills = Array.from(this.content.getAllSkills());
    skills.sort((a, b) => a.name.localeCompare(b.name));
    for (const skillDef of skills) {
      const state = this.uiState.skills.get(skillDef.id);
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.padding = "3px 0";
      row.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
      const name = document.createElement("span");
      name.textContent = skillDef.name;
      const level = document.createElement("span");
      level.textContent = state ? `${state.level} / ${state.xp} XP` : "1 / 0 XP";
      level.style.color = "#aaa";
      row.appendChild(name);
      row.appendChild(level);
      body.appendChild(row);
    }
  }

  private _renderSpellbook(): void {
    const body = document.getElementById("spellbook-body");
    if (!body) return;
    body.innerHTML = "";
    const spells = Array.from(this.content.getAllSpells());
    spells.sort((a, b) => a.requiredMagic - b.requiredMagic);
    const magic = this.uiState.skills.get("magic");
    const magicLevel = magic?.level ?? 1;
    for (const spell of spells) {
      const row = document.createElement("div");
      row.style.padding = "4px 0";
      row.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
      row.style.cursor = "pointer";
      const canCast = magicLevel >= spell.requiredMagic;
      row.style.color = canCast ? "#fff" : "#555";
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
    for (const quest of quests) {
      const stage = this.uiState.vars.get(`${quest.varPrefix}.stage`);
      if (stage === undefined || stage === 0) continue;
      const row = document.createElement("div");
      row.style.padding = "4px 0";
      row.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
      const questStage = quest.stages.find((s) => s.stage === stage);
      row.textContent = `${quest.name}: ${questStage?.journalText ?? "In progress"}`;
      body.appendChild(row);
    }
    if (body.children.length === 0) {
      body.textContent = "No active quests.";
      body.style.color = "#555";
    }
  }

  private _renderChat(): void {
    const body = document.getElementById("chat-body");
    if (!body) return;
    body.innerHTML = "";
    for (const msg of this.uiState.chat) {
      const row = document.createElement("div");
      row.style.padding = "2px 0";
      row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
      const name = msg.name ?? "System";
      const channelColor = msg.channel === "system" ? "#ffcc00" : "#aaa";
      const nameSpan = document.createElement("span");
      nameSpan.style.color = channelColor;
      nameSpan.textContent = `[${name}]`;
      row.appendChild(nameSpan);
      row.appendChild(document.createTextNode(` ${msg.text}`));
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

    const def =
      this.content.getQuest(dialogue.dialogueId) ?? this.content.getNpc(dialogue.dialogueId);
    npcHeader.textContent = def?.name ?? dialogue.dialogueId;
    textEl.textContent = "...";
    optionsEl.innerHTML = "";

    const questDef = this.content.getQuest(dialogue.dialogueId);
    if (questDef) {
      const stage = this.uiState.vars.get(`${questDef.varPrefix}.stage`);
      const questStage = questDef.stages.find((s) => s.stage === stage);
      if (questStage) {
        textEl.textContent = questStage.journalText;
        for (let i = 0; i < questStage.objectives.length; i++) {
          const objective = questStage.objectives[i];
          if (!objective) continue;
          const opt = document.createElement("div");
          opt.style.padding = "4px";
          opt.style.marginTop = "4px";
          opt.style.background = "rgba(60, 60, 80, 0.8)";
          opt.style.cursor = "pointer";
          opt.style.borderRadius = "2px";
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
