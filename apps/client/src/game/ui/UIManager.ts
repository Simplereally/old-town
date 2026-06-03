import type { ContentClient } from "./ContentClient";
import { GlobalKeydownBus } from "./GlobalKeydownBus";
import type { UIState } from "./UIState";

export interface UIManagerCallbacks {
  sendItemCommand(itemUid: number, actionId: string): void;
  sendChatCommand(text: string): void;
  enterSpellTargetMode(spellId: string): void;
  sendUiActionCommand(action: string, targetId?: string, value?: number): void;
  sendBankCommand(action: "deposit" | "withdraw" | "open" | "close", itemUid?: number, quantity?: number): void;
  sendShopCommand(action: "buy" | "sell" | "open" | "close", itemId?: string, quantity?: number): void;
  sendRecipeCommand(recipeId: string, stationEntityId: number): void;
}

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
    "bank-panel",
    "shop-panel",
    "recipe-panel",
  ];
  private readonly keyBindings: Record<string, string> = {
    i: "inventory-panel",
    e: "equipment-panel",
    k: "skills-panel",
    m: "spellbook-panel",
    q: "quest-panel",
    c: "chat-box",
    b: "bank-panel",
    s: "shop-panel",
    d: "debug-overlay",
  };
  private _unsubscribe: (() => void) | undefined;
  private _selectedRecipeId: string | undefined;
  private _selectedQuantity = 1;
  private _recipeClickListeners: Array<() => void> = [];
  private _recipeMakeListener: (() => void) | undefined;

  constructor(uiState: UIState, content: ContentClient, callbacks: UIManagerCallbacks) {
    this.uiState = uiState;
    this.content = content;
    this.callbacks = callbacks;
    this.panels = this._buildPanelMap();
    this.buttons = this._buildButtonMap();
    this._bindBarButtons();
    this._bindKeyboardShortcuts();
    this._bindChatInput();
    this._bindRecipeMakeButton();
    this._unsubscribe = uiState.onChange(() => this._renderAll());
    this._renderAll();
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

    for (const listener of this._recipeClickListeners) {
      listener();
    }
    this._recipeClickListeners = [];
    const makeBtn = document.getElementById("recipe-make-btn");
    if (makeBtn && this._recipeMakeListener) {
      makeBtn.removeEventListener("click", this._recipeMakeListener);
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
    this._renderBank();
    this._renderShop();
    this._renderRecipes();
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
    const grid = document.createElement("div");
    grid.classList.add("skill-grid");

    const skills = Array.from(this.content.getAllSkills()).toSorted((a, b) =>
      a.name.localeCompare(b.name),
    );
    const uiSkills = this.uiState.skills;
    for (const skillDef of skills) {
      const state = uiSkills.get(skillDef.id);
      const baseLevel = state?.level ?? 1;
      const effectiveLevel = state?.effectiveLevel ?? baseLevel;
      const tile = document.createElement("div");
      tile.classList.add("skill-tile");
      tile.title = `${skillDef.name} — Level ${effectiveLevel} / ${baseLevel}`;

      const icon = document.createElement("div");
      icon.classList.add("skill-tile-icon");
      icon.textContent = this._skillIcon(skillDef.id);

      const levelText = document.createElement("div");
      levelText.classList.add("skill-tile-level");
      levelText.textContent = `${effectiveLevel}/${baseLevel}`;
      levelText.style.color = "#ffcc00";

      tile.appendChild(icon);
      tile.appendChild(levelText);
      grid.appendChild(tile);
    }
    body.appendChild(grid);
  }

  private _skillIcon(skillId: string): string {
    const map: Record<string, string> = {
      attack: "⚔️",
      strength: "💪",
      defence: "🛡️",
      hitpoints: "❤️",
      magic: "🎩",
      arms: "🦾",
      might: "⚡",
      guard: "🛡️",
      vitality: "🫀",
      ranged: "🏹",
      favour: "⭐",
      cooking: "🍳",
      smithing: "🔨",
      bowcraft: "🏹",
      tailoring: "🧵",
      handicraft: "🎨",
      beadwork: "📿",
      apothecary: "🧪",
      carpentry: "🪵",
      wayfaring: "🧭",
      sleight: "🎭",
      wardenry: "🏰",
      hearthcraft: "🔥",
      cartography: "🗺️",
      woodcutting: "🪓",
      mining: "⛏️",
      fishing: "🎣",
      trapping: "🪤",
      gardening: "🌱",
    };
    return map[skillId] ?? "❓";
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
    body.classList.remove("text-dim");
    const quests = Array.from(this.content.getAllQuests());
    const uiVars = this.uiState.vars;
    for (const quest of quests) {
      const rawStage = uiVars.get(`quest.${quest.varPrefix}.stage`);
      const stage = typeof rawStage === "number" ? rawStage : 0;
      const completed = uiVars.get(`quest.${quest.varPrefix}.completed`) === true;
      if (stage === 0 && !completed) continue;
      const row = document.createElement("div");
      row.classList.add("ui-row-padded");
      const questStage = quest.stages.find((s) => s.stage === stage);
      row.textContent = completed
        ? `${quest.name}: Completed.`
        : `${quest.name}: ${questStage?.journalText ?? "In progress"}`;
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

    npcHeader.textContent = dialogue.speakerName;
    textEl.textContent = dialogue.npcText ?? "";
    optionsEl.innerHTML = "";

    if (dialogue.options.length === 0) {
      const close = document.createElement("div");
      close.classList.add("dialogue-option");
      close.textContent = "Continue";
      close.addEventListener("click", () => {
        this.callbacks.sendUiActionCommand("dialogue_close", dialogue.dialogueId);
      });
      optionsEl.appendChild(close);
    } else {
      for (const option of dialogue.options) {
        const opt = document.createElement("div");
        opt.classList.add("dialogue-option");
        opt.textContent = option.text;
        opt.addEventListener("click", () => {
          this.callbacks.sendUiActionCommand("dialogue_option", dialogue.dialogueId, option.index);
        });
        optionsEl.appendChild(opt);
      }
    }

    box.classList.remove("hidden");
  }

  private _renderBank(): void {
    const body = document.getElementById("bank-body");
    if (!body) return;
    body.innerHTML = "";
    const grid = document.createElement("div");
    grid.classList.add("inventory-grid");

    for (let slot = 0; slot < 400; slot++) {
      const cell = document.createElement("div");
      cell.classList.add("inventory-cell");
      cell.title = `Slot ${slot}`;

      const item = this.uiState.bank.get(slot);
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
            this.callbacks.sendBankCommand("withdraw", uid, 1);
          });
        }
      }
      grid.appendChild(cell);
    }
    body.appendChild(grid);
  }

  private _renderShop(): void {
    const body = document.getElementById("shop-body");
    if (!body) return;
    body.innerHTML = "";

    const shop = this.uiState.shop;
    if (!shop) {
      body.textContent = "No shop open.";
      body.classList.add("text-dim");
      return;
    }
    body.classList.remove("text-dim");

    for (const stock of shop.stock) {
      const row = document.createElement("div");
      row.classList.add("ui-row");
      const name = document.createElement("span");
      const def = this.content.getItem(stock.itemId);
      name.textContent = def?.name ?? stock.itemId;
      const price = document.createElement("span");
      const buyPrice = Math.max(1, Math.floor(stock.price * shop.buyMultiplier));
      price.textContent = `${buyPrice} gp`;
      price.classList.add("text-muted");
      row.appendChild(name);
      row.appendChild(price);
      row.addEventListener("click", () => {
        this.callbacks.sendShopCommand("buy", stock.itemId, 1);
      });
      body.appendChild(row);
    }
  }

  private _renderRecipes(): void {
    const body = document.getElementById("recipe-body");
    const listEl = document.getElementById("recipe-list");
    const detailEl = document.getElementById("recipe-detail");
    const feedbackEl = document.getElementById("recipe-feedback");
    const headerEl = document.getElementById("recipe-header");
    const makeBtn = document.getElementById("recipe-make-btn") as HTMLButtonElement | null;
    if (!body || !listEl || !detailEl || !feedbackEl || !headerEl || !makeBtn) return;

    for (const listener of this._recipeClickListeners) {
      listener();
    }
    this._recipeClickListeners = [];

    const list = this.uiState.recipeList;
    const result = this.uiState.recipeResult;

    if (!list) {
      listEl.innerHTML = "";
      detailEl.classList.add("hidden");
      headerEl.textContent = "Recipe";
    } else {
      headerEl.textContent = list.stationName || "Recipe";

      listEl.innerHTML = "";
      for (const entry of list.recipes) {
      const row = document.createElement("div");
      row.classList.add("recipe-row");
      if (this._selectedRecipeId === entry.recipeId) {
        row.classList.add("selected");
      }

      const nameSpan = document.createElement("span");
      nameSpan.classList.add("recipe-name");
      nameSpan.textContent = entry.name;

      const levelSpan = document.createElement("span");
      levelSpan.classList.add("recipe-level");
      const skill = this.uiState.skills.get(entry.skillId);
      const playerLevel = skill?.level ?? 1;
      levelSpan.textContent = `Lvl ${entry.levelRequired}`;
      if (playerLevel < entry.levelRequired) {
        levelSpan.classList.add("too-high");
        row.classList.add("unmet");
      }

      row.appendChild(nameSpan);
      row.appendChild(levelSpan);

      const clickHandler = () => {
        this._selectedRecipeId = entry.recipeId;
        this._renderRecipes();
      };
      row.addEventListener("click", clickHandler);
      this._recipeClickListeners.push(() => row.removeEventListener("click", clickHandler));

      listEl.appendChild(row);
    }

    const selected = list.recipes.find((r) => r.recipeId === this._selectedRecipeId);
    if (selected) {
      detailEl.classList.remove("hidden");

      const ingredientsEl = document.getElementById("recipe-ingredients");
      if (ingredientsEl) {
        ingredientsEl.innerHTML = "";
        for (const ing of selected.ingredients) {
          const ingRow = document.createElement("div");
          ingRow.classList.add("ingredient-row");
          const def = this.content.getItem(ing.itemId);
          const name = def?.name ?? ing.itemId;
          ingRow.textContent = `${name} x${ing.quantity}`;
          ingredientsEl.appendChild(ingRow);
        }
      }

      const outputEl = document.getElementById("recipe-output");
      if (outputEl) {
        const def = this.content.getItem(selected.productId);
        const name = def?.name ?? selected.productId;
        outputEl.textContent = `Makes: ${name} x${selected.productQuantity} (+${selected.xp} XP)`;
      }

      const qtyEl = document.getElementById("recipe-quantity");
      if (qtyEl) {
        const qtyBtns = qtyEl.querySelectorAll(".qty-btn");
        qtyBtns.forEach((btn) => {
          btn.classList.remove("active");
        });
        const activeBtn = qtyEl.querySelector(`[data-qty="${this._selectedQuantity ?? 1}"]`);
        if (activeBtn) activeBtn.classList.add("active");
      }

      const skill = this.uiState.skills.get(selected.skillId);
      const canMake = (skill?.level ?? 1) >= selected.levelRequired;
      makeBtn.disabled = !canMake;
      makeBtn.textContent = canMake ? "Make" : "Level too low";
    } else {
      detailEl.classList.add("hidden");
      makeBtn.disabled = true;
    }

    }

    if (result) {
      feedbackEl.classList.remove("hidden");
      feedbackEl.classList.remove("success", "failure");
      feedbackEl.classList.add(result.success ? "success" : "failure");
      const productDef = result.productItemId ? this.content.getItem(result.productItemId) : undefined;
      const productName = productDef?.name ?? result.productItemId ?? "unknown";
      const xpText = result.xpReward ? ` (+${result.xpReward} XP)` : "";
      feedbackEl.textContent = result.message
        ?? (result.success ? `You made ${productName} x${result.productQuantity ?? 1}${xpText}.`
                           : `You failed to make ${productName}.`);
    } else {
      feedbackEl.classList.add("hidden");
    }
  }

  private _bindRecipeMakeButton(): void {
    const makeBtn = document.getElementById("recipe-make-btn") as HTMLButtonElement | null;
    if (!makeBtn) return;

    this._recipeMakeListener = () => {
      const list = this.uiState.recipeList;
      const selected = this._selectedRecipeId;
      if (!list || !selected) return;
      this.callbacks.sendRecipeCommand(selected, list.stationEntityId);
    };
    makeBtn.addEventListener("click", this._recipeMakeListener);
  }
}
