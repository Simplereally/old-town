import type { CombatStyle } from "@old-town/shared";
import { MAX_SKILL_LEVEL, type SkillDef, xpForLevel } from "@old-town/shared";
import { type AudioSettings, loadAudioSettings, saveAudioSettings } from "../audio/AudioSettings";
import type {
  InputInterpreterSettings,
  MouseButtonMode,
  NpcAttackSetting,
} from "../input/InputInterpreter";
import type { WeaponModelMode } from "../scene/WeaponGltfLoader";
import type { ContentClient } from "./ContentClient";
import { GlobalKeydownBus } from "./GlobalKeydownBus";
import type { IconAtlas } from "./IconAtlas";
import { PLACEHOLDER_DATA_URI } from "./IconAtlas";
import { loadRenderSettings, type RenderSettings, saveRenderSettings } from "./RenderSettings";
import { SidebarTabs } from "./SidebarTabs";
import type { UIState, UIStateChange } from "./UIState";

export interface UIManagerCallbacks {
  sendItemCommand(itemUid: number, actionId: string): void;
  sendChatCommand(text: string): void;
  enterSpellTargetMode(spellId: string): void;
  enterItemTargetMode(itemUid: number): void;
  sendUiActionCommand(action: string, targetId?: string, value?: number): void;
  sendBankCommand(
    action: "deposit" | "withdraw" | "open" | "close",
    itemUid?: number,
    quantity?: number,
  ): void;
  sendShopCommand(
    action: "buy" | "sell" | "open" | "close",
    itemId?: string,
    quantity?: number,
  ): void;
  sendRecipeCommand(recipeId: string, stationEntityId: number): void;
  sendSetCombatStyle(style: CombatStyle): void;
  setInputSettings(settings: Partial<InputInterpreterSettings>): void;
  setRenderSettings(settings: Partial<RenderSettings>): void;
  setAudioSettings(settings: Partial<AudioSettings>): void;
  /** Immediate client-local UI cue (E47-S02). */
  playUiSound(soundId: string): void;
}

const ITEM_ACTIONS = new Set(["drop", "equip", "wield", "wear", "eat", "drink", "bury"]);

/**
 * Item options that a left-click performs directly (OSRS-style primary action).
 * "drop" is intentionally excluded (destructive) and "use" enters target mode.
 */
const PRIMARY_ITEM_ACTIONS = new Set(["equip", "wield", "wear", "eat", "drink", "bury"]);

const SETTINGS_STORAGE_KEY = "old-town-input-settings";
const SETTINGS_VERSION = 1;

const NPC_ATTACK_OPTIONS: ReadonlyArray<{ value: NpcAttackSetting; label: string; hint: string }> =
  [
    {
      value: "depends-on-combat-levels",
      label: "Depends on combat levels",
      hint: "Left-click Attack only on NPCs at or below your combat level.",
    },
    {
      value: "left-click-where-available",
      label: "Left-click where available",
      hint: "Always left-click Attack on NPCs.",
    },
    {
      value: "always-right-click",
      label: "Always right-click",
      hint: "Attack is never left-click; right-click to target.",
    },
    {
      value: "hidden",
      label: "Hidden",
      hint: "Attack option is removed from the menu entirely.",
    },
  ];

const MOUSE_BUTTON_OPTIONS: ReadonlyArray<{ value: MouseButtonMode; label: string; hint: string }> =
  [
    {
      value: "two-button",
      label: "Two-button mouse",
      hint: "Left-click acts, right-click opens menu.",
    },
    {
      value: "one-button",
      label: "One-button mouse",
      hint: "Left-click always opens the context menu.",
    },
  ];

const WEAPON_MODEL_OPTIONS: ReadonlyArray<{ value: WeaponModelMode; label: string; hint: string }> =
  [
    {
      value: "glb",
      label: "Blender models",
      hint: "Stylized low-poly weapon meshes authored in Blender.",
    },
    {
      value: "procedural",
      label: "Procedural models",
      hint: "Classic Three.js primitive weapon shapes.",
    },
  ];

const DEFAULT_INPUT_SETTINGS: InputInterpreterSettings = {
  npcAttack: "left-click-where-available",
  mouseButtons: "two-button",
  menuSwaps: [],
};

function loadStoredSettings(): InputInterpreterSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_INPUT_SETTINGS;
    const parsed = JSON.parse(raw) as { v?: number } & Partial<InputInterpreterSettings>;
    // Discard entries from a previous schema version so default changes take effect.
    if (parsed.v !== SETTINGS_VERSION) return DEFAULT_INPUT_SETTINGS;
    return {
      npcAttack: parsed.npcAttack ?? DEFAULT_INPUT_SETTINGS.npcAttack,
      mouseButtons: parsed.mouseButtons ?? DEFAULT_INPUT_SETTINGS.mouseButtons,
      menuSwaps: parsed.menuSwaps ?? DEFAULT_INPUT_SETTINGS.menuSwaps,
    };
  } catch {
    return DEFAULT_INPUT_SETTINGS;
  }
}

function saveStoredSettings(settings: InputInterpreterSettings): void {
  try {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ v: SETTINGS_VERSION, ...settings }),
    );
  } catch {
    // Ignore storage errors (e.g. private mode quota).
  }
}

/** Display metadata for each attack style: button label and the combat skill it trains. */
const COMBAT_STYLE_META: Record<CombatStyle, { readonly name: string; readonly trains: string }> = {
  stab: { name: "Stab", trains: "Attack" },
  slash: { name: "Slash", trains: "Strength" },
  crush: { name: "Crush", trains: "Defence" },
  ranged: { name: "Shoot", trains: "Ranged" },
  magic: { name: "Cast", trains: "Magic" },
};

/** Equipment slot index of the weapon (matches EQUIPMENT_SLOTS order). */
const WEAPON_SLOT_INDEX = 3;

/** Tab shown in the sidebar on first load. */
const DEFAULT_TAB = "inventory";

/** Keyboard shortcuts for panels that are NOT sidebar tabs (e.g. activity). */
const LEGACY_PANEL_KEYS: Record<string, string> = {
  a: "activity-panel",
};

export class UIManager {
  private readonly uiState: UIState;
  private readonly content: ContentClient;
  private readonly callbacks: UIManagerCallbacks;
  private readonly icons: IconAtlas | undefined;
  private readonly panels: Map<string, HTMLDivElement>;
  /** Tabbed sidebar controller (top + bottom `.sb-tab` rows). */
  private readonly sidebar: SidebarTabs;
  private readonly panelOrder = [
    "inventory-panel",
    "equipment-panel",
    "combat-panel",
    "skills-panel",
    "spellbook-panel",
    "quest-panel",
    "sidebar-placeholder",
    "bank-panel",
    "shop-panel",
    "recipe-panel",
    "contract-panel",
    "activity-panel",
    "settings-panel",
    "status-effects-panel",
    "death-screen",
    "notification-toast",
  ];
  private readonly _unsubscribe: (() => void) | undefined;
  /** Skill id currently being hovered (undefined when no skill tile is hovered). */
  private _hoveredSkillId: string | undefined;
  /** Last cursor position, used to keep the tooltip pinned during real-time XP updates. */
  private _tooltipX = 0;
  private _tooltipY = 0;
  private _selectedRecipeId: string | undefined;
  private _selectedQuantity = 1;
  private _recipeClickListeners: Array<() => void> = [];
  private _recipeMakeListener: (() => void) | undefined;

  constructor(
    uiState: UIState,
    content: ContentClient,
    callbacks: UIManagerCallbacks,
    icons?: IconAtlas,
  ) {
    this.uiState = uiState;
    this.content = content;
    this.callbacks = callbacks;
    this.icons = icons;
    this.panels = this._buildPanelMap();
    this.sidebar = new SidebarTabs({
      renderPage: (pageId) => {
        // Switching away from the skills tab must clear the hover tooltip,
        // since SidebarTabs hides the panel directly (not via togglePanel).
        if (pageId !== "skills-panel") {
          this._hoveredSkillId = undefined;
          this._hideSkillTooltip();
        }
        this._renderPanel(pageId);
      },
    });
    this._bindKeyboardShortcuts();
    this._bindChatInput();
    this._bindRecipeMakeButton();
    this._unsubscribe = uiState.onChange((change) => this._renderChange(change));
    this._renderAll();
    this.sidebar.select(DEFAULT_TAB);
  }

  private _chatSendListener: (() => void) | undefined;
  private _chatKeydownListener: ((e: KeyboardEvent) => void) | undefined;

  dispose(): void {
    this._unsubscribe?.();
    GlobalKeydownBus.unregister("ui-manager");
    this.sidebar.dispose();

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
      const el = document.getElementById(id);
      if (el instanceof HTMLDivElement) map.set(id, el);
    }
    const debug = document.getElementById("debug-overlay");
    if (debug instanceof HTMLDivElement) map.set("debug-overlay", debug);
    return map;
  }

  private _bindKeyboardShortcuts(): void {
    GlobalKeydownBus.register("ui-manager", this._handleKeyDown);
  }

  private _bindChatInput(): void {
    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("chat-send");
    if (!(input instanceof HTMLInputElement) || !(sendBtn instanceof HTMLButtonElement)) return;

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
    const key = event.key.toLowerCase();
    const tabId = SidebarTabs.tabForKey(key);
    if (tabId && this.sidebar.has(tabId)) {
      event.preventDefault();
      this.sidebar.select(tabId);
      return;
    }
    const legacyPanelId = LEGACY_PANEL_KEYS[key];
    if (legacyPanelId) {
      event.preventDefault();
      this.togglePanel(legacyPanelId);
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
      this.callbacks.playUiSound("ui_panel_open");
    } else {
      if (isDebugOverlay) {
        panel.classList.remove("visible");
      } else {
        panel.classList.add("hidden");
      }
      if (panelId === "skills-panel") {
        this._hoveredSkillId = undefined;
        this._hideSkillTooltip();
      }
      this.callbacks.playUiSound("ui_click");
    }
    this._updateButtonState(panelId, isHidden);
    if (isHidden && !isDebugOverlay && panelId !== "activity-panel") {
      this._renderPanel(panelId);
    }
  }

  /**
   * Open the default set of UI panels on first load after receiving the
   * initial full-state packet. The sidebar is tabbed (one page visible at a
   * time), so the inventory tab is selected as the default page; skills,
   * equipment, combat, etc. are reachable via their sidebar tabs. The chat
   * and minimap clusters are always visible.
   */
  openDefaultPanels(): void {
    this.sidebar.select(DEFAULT_TAB);
    document.getElementById("chat-cluster")?.classList.remove("hidden");
    document.getElementById("minimap-cluster")?.classList.remove("hidden");
  }

  private _updateButtonState(_panelId: string, _visible: boolean): void {
    // Sidebar tab highlighting is owned by SidebarTabs.select(); legacy panel
    // toggles (debug overlay, etc.) have no associated button.
  }

  private _renderAll(): void {
    this._renderInventory();
    this._renderEquipment();
    this._renderCombat();
    this._renderSkills();
    this._renderSpellbook();
    this._renderQuests();
    this._renderChat();
    this._renderDialogue();
    this._renderBank();
    this._renderShop();
    this._renderRecipes();
    this._renderMinimap();
    this._renderContract();
    this._renderActivity();
    this._renderStatusEffects();
    this._renderDeathScreen();
    this._renderNotifications();
  }

  private _renderChange(change: UIStateChange): void {
    switch (change) {
      case "inventory":
        this._renderInventory();
        break;
      case "equipment":
        this._renderEquipment();
        this._renderCombat();
        break;
      case "combatStyle":
        this._renderCombat();
        break;
      case "skills":
        this._renderSkills();
        this._renderSpellbook();
        this._renderRecipes();
        this._renderCombat();
        break;
      case "vars":
        this._renderQuests();
        break;
      case "chat":
        this._renderChat();
        break;
      case "dialogue":
        this._renderDialogue();
        break;
      case "bank":
        this._renderBank();
        break;
      case "shop":
        this._renderShop();
        break;
      case "minimap":
        if (this._isPanelVisible("minimap-panel")) {
          this._renderMinimap();
        }
        break;
      case "recipes":
        this._renderRecipes();
        break;
      case "contract":
        this._renderContract();
        break;
      case "statusEffects":
        this._renderStatusEffects();
        break;
      case "deathScreen":
        this._renderDeathScreen();
        break;
      case "notifications":
        this._renderNotifications();
        break;
      case "activity":
        this._renderActivity();
        break;
      case "xpDrops":
        break;
    }
  }

  private _renderPanel(panelId: string): void {
    switch (panelId) {
      case "inventory-panel":
        this._renderInventory();
        break;
      case "equipment-panel":
        this._renderEquipment();
        break;
      case "combat-panel":
        this._renderCombat();
        break;
      case "skills-panel":
        this._renderSkills();
        break;
      case "spellbook-panel":
        this._renderSpellbook();
        break;
      case "quest-panel":
        this._renderQuests();
        break;
      case "chat-box":
        this._renderChat();
        break;
      case "bank-panel":
        this._renderBank();
        break;
      case "shop-panel":
        this._renderShop();
        break;
      case "recipe-panel":
        this._renderRecipes();
        break;
      case "minimap-panel":
        this._renderMinimap();
        break;
      case "contract-panel":
        this._renderContract();
        break;
      case "settings-panel":
        this._renderSettings();
        break;
    }
  }

  private _isPanelVisible(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    return panel ? !panel.classList.contains("hidden") : false;
  }

  private _renderIconInto(cell: HTMLDivElement, iconAssetId: string): void {
    const resolved = iconAssetId ? this.icons?.resolveIcon(iconAssetId) : null;
    const img = document.createElement("img");
    img.classList.add("item-icon");
    if (resolved) {
      img.src = resolved.atlasUrl;
      const { x, y, w, h } = resolved.cell;
      img.style.objectFit = "none";
      img.style.objectPosition = `-${x}px -${y}px`;
      img.style.width = `${w}px`;
      img.style.height = `${h}px`;
      img.alt = iconAssetId;
    } else {
      img.src = PLACEHOLDER_DATA_URI;
      img.classList.add("item-icon-missing");
      img.alt = iconAssetId ? `missing: ${iconAssetId}` : "missing icon";
    }
    cell.appendChild(img);
  }

  private _renderQuantityBadge(cell: HTMLDivElement, quantity: number): void {
    const badge = document.createElement("span");
    badge.classList.add("item-qty-badge");
    badge.textContent = String(quantity);
    cell.appendChild(badge);
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
        const iconAssetId = def?.icon ?? "";
        this._renderIconInto(cell, iconAssetId);
        if (quantity > 1) {
          this._renderQuantityBadge(cell, quantity);
        }
        cell.title = `${name}${quantity > 1 ? ` x${quantity}` : ""}`;
        const uid = item.uid;
        if (uid !== undefined) {
          const primaryAction = def?.options?.find((o) => PRIMARY_ITEM_ACTIONS.has(o));
          if (primaryAction) {
            cell.addEventListener("click", () => {
              this.callbacks.playUiSound("ui_click");
              this.callbacks.sendItemCommand(uid, primaryAction);
            });
          } else {
            cell.addEventListener("click", () => {
              this.callbacks.playUiSound("ui_click");
              this.callbacks.enterItemTargetMode(uid);
            });
          }
          const extraActions = def?.options?.filter((o) => ITEM_ACTIONS.has(o));
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
    const grid = document.createElement("div");
    grid.classList.add("equipment-grid");
    for (let i = 0, len = slots.length; i < len; i++) {
      const cell = document.createElement("div");
      cell.classList.add("equipment-cell");
      cell.title = slots[i] ?? "";
      const itemId = this.uiState.equipment.get(i);
      if (itemId) {
        const def = this.content.getItem(itemId);
        const name = def?.name ?? itemId;
        const iconAssetId = def?.icon ?? "";
        this._renderIconInto(cell, iconAssetId);
        cell.title = `${slots[i]}: ${name}`;
      } else {
        const label = document.createElement("span");
        label.textContent = slots[i] ?? "";
        label.classList.add("text-dim");
        cell.appendChild(label);
      }
      grid.appendChild(cell);
    }
    body.appendChild(grid);
  }

  private _renderCombat(): void {
    const body = document.getElementById("combat-body");
    if (!body) return;
    body.innerHTML = "";

    // Combat stat summary: Attack / Strength / Defence / Hitpoints.
    const stats = document.createElement("div");
    stats.classList.add("combat-stats");
    for (const skillId of ["attack", "strength", "defence", "hitpoints"]) {
      const state = this.uiState.skills.get(skillId);
      const level = state?.effectiveLevel ?? state?.level ?? 1;
      const stat = document.createElement("div");
      stat.classList.add("combat-stat");
      stat.title = skillId;
      const icon = document.createElement("span");
      icon.classList.add("combat-stat-icon");
      icon.textContent = this._skillIcon(skillId);
      const lvl = document.createElement("span");
      lvl.classList.add("combat-stat-level");
      lvl.textContent = String(level);
      stat.appendChild(icon);
      stat.appendChild(lvl);
      stats.appendChild(stat);
    }
    body.appendChild(stats);

    // Equipped weapon and the attack styles it offers.
    const weaponId = this.uiState.equipment.get(WEAPON_SLOT_INDEX);
    const weaponDef = weaponId ? this.content.getItem(weaponId) : undefined;

    const weaponRow = document.createElement("div");
    weaponRow.classList.add("combat-weapon");
    weaponRow.textContent = weaponDef?.name ?? "Unarmed";
    body.appendChild(weaponRow);

    const allowed = (weaponDef?.equipment?.allowedStyles ?? []) as CombatStyle[];
    // Unarmed strikes resolve to crush (Defence) on the server; show that as a fixed style.
    const styles: CombatStyle[] = allowed.length > 0 ? allowed : ["crush"];
    const selectable = allowed.length > 0;
    const preference = this.uiState.combatStyle as CombatStyle | undefined;
    const activeStyle: CombatStyle =
      preference && styles.includes(preference) ? preference : (styles[0] ?? "crush");

    for (const style of styles) {
      const meta = COMBAT_STYLE_META[style];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.classList.add("combat-style-btn");
      if (style === activeStyle) btn.classList.add("active");
      const name = document.createElement("span");
      name.classList.add("combat-style-name");
      name.textContent = meta.name;
      const trains = document.createElement("span");
      trains.classList.add("combat-style-skill");
      trains.textContent = `trains ${meta.trains}`;
      btn.appendChild(name);
      btn.appendChild(trains);
      if (selectable) {
        btn.addEventListener("click", () => {
          this.uiState.setCombatStyle(style); // optimistic: highlight immediately
          this.callbacks.sendSetCombatStyle(style);
        });
      } else {
        btn.disabled = true;
      }
      body.appendChild(btn);
    }

    if (!selectable) {
      const hint = document.createElement("div");
      hint.classList.add("combat-hint", "text-dim");
      hint.textContent = "Unarmed strikes train Defence. Wield a weapon to choose a style.";
      body.appendChild(hint);
    }
  }

  private _renderSkills(): void {
    const body = document.getElementById("skills-body");
    if (!body) return;
    body.innerHTML = "";
    const grid = document.createElement("div");
    grid.classList.add("skill-grid");

    const columnOneOrder = [
      "attack",
      "strength",
      "defence",
      "hitpoints",
      "ranged",
      "prayer",
      "magic",
      "favour",
      "beadwork",
      "carpentry",
    ];
    const allSkills = [...this.content.getAllSkills()];
    const columnOneSkills = columnOneOrder
      .map((id) => allSkills.find((s) => s.id === id))
      .filter((s): s is SkillDef => s !== undefined);
    const otherSkills = allSkills
      .filter((s) => !columnOneOrder.includes(s.id))
      .toSorted((a, b) => a.name.localeCompare(b.name));

    const columns = 3;
    const rows = Math.ceil(allSkills.length / columns);
    const gridSkills: (SkillDef | undefined)[] = new Array(rows * columns).fill(undefined);
    const columnOnePositions = Array.from({ length: rows }, (_, row) => row * columns);
    for (let i = 0; i < columnOneSkills.length; i += 1) {
      const position = columnOnePositions[i];
      if (position !== undefined) {
        gridSkills[position] = columnOneSkills[i];
      }
    }
    let otherIndex = 0;
    for (let i = 0; i < gridSkills.length; i += 1) {
      if (gridSkills[i] === undefined && otherIndex < otherSkills.length) {
        gridSkills[i] = otherSkills[otherIndex];
        otherIndex += 1;
      }
    }
    const skills = gridSkills.filter((s): s is SkillDef => s !== undefined);
    const uiSkills = this.uiState.skills;
    for (const skillDef of skills) {
      const state = uiSkills.get(skillDef.id);
      const baseLevel = state?.level ?? 1;
      const effectiveLevel = state?.effectiveLevel ?? baseLevel;
      const xp = state?.xp ?? 0;
      const isMaxed = baseLevel >= MAX_SKILL_LEVEL;
      const nextLevel = Math.min(baseLevel + 1, MAX_SKILL_LEVEL);
      const nextXp = isMaxed ? 0 : xpForLevel(nextLevel);
      const xpToNext = isMaxed ? 0 : Math.max(0, nextXp - xp);

      const fmt = (n: number): string => n.toLocaleString("en-US");

      const tile = document.createElement("div");
      tile.classList.add("skill-tile");
      tile.title = isMaxed
        ? `${skillDef.name} — Level ${effectiveLevel} / ${baseLevel} (Max)`
        : `${skillDef.name} — Level ${effectiveLevel} / ${baseLevel} — XP ${fmt(xp)} — Next at ${fmt(nextXp)} — ${fmt(xpToNext)} to next`;

      const icon = document.createElement("div");
      icon.classList.add("skill-tile-icon");
      icon.textContent = this._skillIcon(skillDef.id);

      const levelText = document.createElement("div");
      levelText.classList.add("skill-tile-level");
      levelText.textContent = `${effectiveLevel}/${baseLevel}`;

      tile.appendChild(icon);
      tile.appendChild(levelText);

      tile.addEventListener("mouseenter", (e: MouseEvent) => {
        this._tooltipX = e.clientX;
        this._tooltipY = e.clientY;
        this._hoveredSkillId = skillDef.id;
        this._refreshSkillTooltip();
      });
      tile.addEventListener("mouseleave", () => {
        this._hoveredSkillId = undefined;
        this._hideSkillTooltip();
      });

      grid.appendChild(tile);
    }
    body.appendChild(grid);

    // If a skill tooltip was visible before the re-render, refresh it with live data.
    if (this._hoveredSkillId !== undefined) {
      this._refreshSkillTooltip();
    }
  }

  /**
   * Refresh the skill tooltip from live {@link uiState} for the currently hovered skill.
   * Called on mouseenter and whenever _renderSkills re-runs (e.g. XP drops arrive) so the
   * tooltip updates in real time while hovered — matching OSRS native tooltip behavior.
   */
  private _refreshSkillTooltip(): void {
    const skillId = this._hoveredSkillId;
    if (skillId === undefined) return;
    const tooltip = document.getElementById("skill-tooltip");
    if (!tooltip) return;
    const def = this.content.getSkill(skillId);
    if (!def) {
      this._hideSkillTooltip();
      return;
    }
    const state = this.uiState.skills.get(skillId);
    const baseLevel = state?.level ?? 1;
    const effectiveLevel = state?.effectiveLevel ?? baseLevel;
    const xp = state?.xp ?? 0;
    const isMaxed = baseLevel >= MAX_SKILL_LEVEL;
    const nextXp = isMaxed ? 0 : xpForLevel(Math.min(baseLevel + 1, MAX_SKILL_LEVEL));
    const xpToNext = isMaxed ? 0 : Math.max(0, nextXp - xp);
    const fmt = (n: number): string => n.toLocaleString("en-US");
    const lines = [def.name, `Level: ${effectiveLevel}/${baseLevel}`, `XP: ${fmt(xp)}`];
    if (isMaxed) {
      lines.push("Next Level At: Max");
    } else {
      lines.push(`Next Level At: ${fmt(nextXp)}`);
      lines.push(`XP to next: ${fmt(xpToNext)}`);
    }
    tooltip.textContent = lines.join("\n");
    tooltip.classList.remove("hidden");
    // Clamp to viewport so the tooltip doesn't overflow off-screen.
    const offsetX = 12;
    const offsetY = 12;
    let left = this._tooltipX + offsetX;
    let top = this._tooltipY + offsetY;
    const rect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (left + rect.width > vw) left = Math.max(0, this._tooltipX - rect.width - offsetX);
    if (top + rect.height > vh) top = Math.max(0, this._tooltipY - rect.height - offsetY);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  private _hideSkillTooltip(): void {
    document.getElementById("skill-tooltip")?.classList.add("hidden");
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
    const spells = [...this.content.getAllSpells()].toSorted(
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
    const quests = [...this.content.getAllQuests()];
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
        this.callbacks.playUiSound("ui_select");
        this.callbacks.sendUiActionCommand("dialogue_close", dialogue.dialogueId);
      });
      optionsEl.appendChild(close);
    } else {
      for (const option of dialogue.options) {
        const opt = document.createElement("div");
        opt.classList.add("dialogue-option");
        opt.textContent = option.text;
        opt.addEventListener("click", () => {
          this.callbacks.playUiSound("ui_select");
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
        const iconAssetId = def?.icon ?? "";
        this._renderIconInto(cell, iconAssetId);
        if (quantity > 1) {
          this._renderQuantityBadge(cell, quantity);
        }
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
    const makeBtn = document.getElementById("recipe-make-btn");
    if (
      !body ||
      !listEl ||
      !detailEl ||
      !feedbackEl ||
      !headerEl ||
      !(makeBtn instanceof HTMLButtonElement)
    )
      return;

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
      const productDef = result.productItemId
        ? this.content.getItem(result.productItemId)
        : undefined;
      const productName = productDef?.name ?? result.productItemId ?? "unknown";
      const xpText = result.xpReward ? ` (+${result.xpReward} XP)` : "";
      feedbackEl.textContent =
        result.message ??
        (result.success
          ? `You made ${productName} x${result.productQuantity ?? 1}${xpText}.`
          : `You failed to make ${productName}.`);
    } else {
      feedbackEl.classList.add("hidden");
    }
  }

  private _renderMinimap(): void {
    const canvas = document.getElementById("minimap-canvas") as HTMLCanvasElement | null;
    const panel = document.getElementById("minimap-panel");
    if (!canvas || !panel) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tiles = this.uiState.minimapTiles;
    const playerTile = this.uiState.minimapPlayerTile;
    const entities = this.uiState.minimapEntities;

    const tileSize = 4;
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    if (playerTile) {
      const baseX = playerTile.x * tileSize;
      const baseY = playerTile.y * tileSize;
      for (const [, tile] of tiles) {
        const dx = tile.x * tileSize - baseX;
        const dy = tile.y * tileSize - baseY;
        ctx.fillStyle = tile.water ? "#4466aa" : "#3a5a3a";
        ctx.fillRect(offsetX + dx, offsetY + dy, tileSize, tileSize);
      }
      for (const [, entity] of entities) {
        const dx = entity.tile.x * tileSize - baseX;
        const dy = entity.tile.y * tileSize - baseY;
        const color =
          entity.kind === "player" ? "#ffcc00" : entity.kind === "npc" ? "#ff4444" : "#888888";
        ctx.fillStyle = color;
        ctx.fillRect(offsetX + dx, offsetY + dy, tileSize, tileSize);
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(offsetX - 1, offsetY - 1, 2, 2);
    }
  }

  private _renderContract(): void {
    const body = document.getElementById("contract-body");
    const panel = document.getElementById("contract-panel");
    const bar = document.getElementById("contract-progress-bar");
    const fill = document.getElementById("contract-progress-fill");
    if (!body || !panel || !bar || !fill) return;

    const contract = this.uiState.activeContract;
    if (!contract) {
      body.innerHTML = '<div class="text-dim">No active contract.</div>';
      bar.style.display = "none";
      return;
    }

    bar.style.display = "block";
    const pct =
      contract.required > 0 ? Math.min(100, (contract.current / contract.required) * 100) : 0;
    fill.style.width = `${pct}%`;

    body.innerHTML = `
      <div class="text-bright">${contract.objectiveKind}</div>
      <div class="text-muted">${contract.current} / ${contract.required}</div>
    `;
    body.appendChild(bar);
  }

  private _renderActivity(): void {
    const body = document.getElementById("activity-body");
    const panel = document.getElementById("activity-panel");
    if (!body || !panel) return;

    const activity = this.uiState.activity;
    if (!activity) {
      body.innerHTML = '<div class="text-dim">No active activity.</div>';
      panel.classList.add("hidden");
      this._updateButtonState("activity-panel", false);
      return;
    }

    panel.classList.remove("hidden");
    this._updateButtonState("activity-panel", true);
    body.innerHTML = "";

    const nameRow = document.createElement("div");
    nameRow.classList.add("activity-row");
    nameRow.innerHTML = `<span class="activity-label">Name</span><span class="activity-value">${activity.name}</span>`;
    body.appendChild(nameRow);

    const categoryRow = document.createElement("div");
    categoryRow.classList.add("activity-row");
    categoryRow.innerHTML = `<span class="activity-label">Category</span><span class="activity-value">${activity.category}</span>`;
    body.appendChild(categoryRow);

    const riskRow = document.createElement("div");
    riskRow.classList.add("activity-row");
    const riskClass =
      activity.risk === "low"
        ? "activity-risk-low"
        : activity.risk === "high"
          ? "activity-risk-high"
          : "activity-risk-medium";
    riskRow.innerHTML = `<span class="activity-label">Risk</span><span class="activity-value ${riskClass}">${activity.risk}</span>`;
    body.appendChild(riskRow);

    const loopRow = document.createElement("div");
    loopRow.classList.add("activity-row");
    loopRow.innerHTML = `<span class="activity-label">Loop</span>`;
    body.appendChild(loopRow);

    const loopDesc = document.createElement("div");
    loopDesc.classList.add("activity-value");
    loopDesc.style.paddingTop = "2px";
    loopDesc.style.lineHeight = "1.4";
    loopDesc.textContent = activity.loopDescription;
    body.appendChild(loopDesc);

    const stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.classList.add("activity-stop-btn");
    stopBtn.textContent = "Stop";
    stopBtn.addEventListener("click", () => {
      this.callbacks.sendUiActionCommand("activity_stop", activity.activityId);
    });
    body.appendChild(stopBtn);
  }

  private _renderStatusEffects(): void {
    const panel = document.getElementById("status-effects-panel");
    if (!panel) return;
    const effects = this.uiState.statusEffects;
    if (effects.length === 0) {
      panel.classList.add("hidden");
      return;
    }
    panel.classList.remove("hidden");
    panel.innerHTML = "";
    for (const effect of effects) {
      const badge = document.createElement("div");
      badge.classList.add("status-effect-badge");
      badge.textContent = effect.effectId.slice(0, 2);
      const dur = document.createElement("span");
      dur.classList.add("duration");
      dur.textContent = `${effect.durationTicks}`;
      badge.appendChild(dur);
      panel.appendChild(badge);
    }
  }

  private _renderDeathScreen(): void {
    const screen = document.getElementById("death-screen");
    if (!screen) return;
    if (this.uiState.deathScreen) {
      screen.classList.remove("hidden");
    } else {
      screen.classList.add("hidden");
    }
  }

  private _renderNotifications(): void {
    const container = document.getElementById("notification-toast");
    if (!container) return;
    const notes = this.uiState.notifications;
    if (notes.length === 0) {
      container.classList.add("hidden");
      return;
    }
    container.classList.remove("hidden");
    container.innerHTML = "";
    for (const note of notes) {
      const el = document.createElement("div");
      el.classList.add("toast-item", note.type);
      el.textContent = note.text;
      container.appendChild(el);
    }
  }

  private _bindRecipeMakeButton(): void {
    const makeBtn = document.getElementById("recipe-make-btn");
    if (!(makeBtn instanceof HTMLButtonElement)) return;

    this._recipeMakeListener = () => {
      const list = this.uiState.recipeList;
      const selected = this._selectedRecipeId;
      if (!list || !selected) return;
      this.callbacks.sendRecipeCommand(selected, list.stationEntityId);
    };
    makeBtn.addEventListener("click", this._recipeMakeListener);
  }

  private _renderSettings(): void {
    const body = document.getElementById("settings-body");
    if (!body) return;
    body.innerHTML = "";

    const settings = loadStoredSettings();

    // NPC attack option setting.
    const npcRow = document.createElement("div");
    npcRow.classList.add("settings-row");
    const npcLabel = document.createElement("div");
    npcLabel.classList.add("settings-label");
    npcLabel.textContent = "NPC Attack Option";
    npcRow.appendChild(npcLabel);
    const npcSelect = document.createElement("select");
    npcSelect.classList.add("settings-select");
    for (const opt of NPC_ATTACK_OPTIONS) {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === settings.npcAttack) option.selected = true;
      npcSelect.appendChild(option);
    }
    npcRow.appendChild(npcSelect);
    const npcHint = document.createElement("div");
    npcHint.classList.add("settings-hint");
    npcHint.textContent =
      NPC_ATTACK_OPTIONS.find((o) => o.value === settings.npcAttack)?.hint ?? "";
    npcRow.appendChild(npcHint);
    npcSelect.addEventListener("change", () => {
      const value = npcSelect.value as NpcAttackSetting;
      const next = { ...loadStoredSettings(), npcAttack: value };
      saveStoredSettings(next);
      this.callbacks.setInputSettings({ npcAttack: value });
      npcHint.textContent = NPC_ATTACK_OPTIONS.find((o) => o.value === value)?.hint ?? "";
    });
    body.appendChild(npcRow);

    // Mouse button mode setting.
    const mouseRow = document.createElement("div");
    mouseRow.classList.add("settings-row");
    const mouseLabel = document.createElement("div");
    mouseLabel.classList.add("settings-label");
    mouseLabel.textContent = "Mouse Mode";
    mouseRow.appendChild(mouseLabel);
    const mouseSelect = document.createElement("select");
    mouseSelect.classList.add("settings-select");
    for (const opt of MOUSE_BUTTON_OPTIONS) {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === settings.mouseButtons) option.selected = true;
      mouseSelect.appendChild(option);
    }
    mouseRow.appendChild(mouseSelect);
    const mouseHint = document.createElement("div");
    mouseHint.classList.add("settings-hint");
    mouseHint.textContent =
      MOUSE_BUTTON_OPTIONS.find((o) => o.value === settings.mouseButtons)?.hint ?? "";
    mouseRow.appendChild(mouseHint);
    mouseSelect.addEventListener("change", () => {
      const value = mouseSelect.value as MouseButtonMode;
      const next = { ...loadStoredSettings(), mouseButtons: value };
      saveStoredSettings(next);
      this.callbacks.setInputSettings({ mouseButtons: value });
      mouseHint.textContent = MOUSE_BUTTON_OPTIONS.find((o) => o.value === value)?.hint ?? "";
    });
    body.appendChild(mouseRow);

    // Weapon model source setting.
    const renderSettings = loadRenderSettings();
    const weaponRow = document.createElement("div");
    weaponRow.classList.add("settings-row");
    const weaponLabel = document.createElement("div");
    weaponLabel.classList.add("settings-label");
    weaponLabel.textContent = "Weapon Models";
    weaponRow.appendChild(weaponLabel);
    const weaponSelect = document.createElement("select");
    weaponSelect.classList.add("settings-select");
    for (const opt of WEAPON_MODEL_OPTIONS) {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === renderSettings.weaponModels) option.selected = true;
      weaponSelect.appendChild(option);
    }
    weaponRow.appendChild(weaponSelect);
    const weaponHint = document.createElement("div");
    weaponHint.classList.add("settings-hint");
    weaponHint.textContent =
      WEAPON_MODEL_OPTIONS.find((o) => o.value === renderSettings.weaponModels)?.hint ?? "";
    weaponRow.appendChild(weaponHint);
    weaponSelect.addEventListener("change", () => {
      const value = weaponSelect.value as WeaponModelMode;
      const next = { ...loadRenderSettings(), weaponModels: value };
      saveRenderSettings(next);
      this.callbacks.setRenderSettings({ weaponModels: value });
      weaponHint.textContent = WEAPON_MODEL_OPTIONS.find((o) => o.value === value)?.hint ?? "";
    });
    body.appendChild(weaponRow);

    // Audio settings (E47-S01).
    const audioSettings = loadAudioSettings();

    const muteRow = document.createElement("div");
    muteRow.classList.add("settings-row");
    const muteLabel = document.createElement("div");
    muteLabel.classList.add("settings-label");
    muteLabel.textContent = "Mute Audio";
    muteRow.appendChild(muteLabel);
    const muteSelect = document.createElement("select");
    muteSelect.classList.add("settings-select");
    for (const opt of [
      { value: "false", label: "Off" },
      { value: "true", label: "On" },
    ]) {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if ((audioSettings.muted ? "true" : "false") === opt.value) option.selected = true;
      muteSelect.appendChild(option);
    }
    muteRow.appendChild(muteSelect);
    muteSelect.addEventListener("change", () => {
      const muted = muteSelect.value === "true";
      const next = { ...loadAudioSettings(), muted };
      saveAudioSettings(next);
      this.callbacks.setAudioSettings({ muted });
    });
    body.appendChild(muteRow);

    const addVolumeRow = (
      label: string,
      key: "masterVolume" | "ambientVolume",
      hint: string,
    ): void => {
      const row = document.createElement("div");
      row.classList.add("settings-row");
      const rowLabel = document.createElement("div");
      rowLabel.classList.add("settings-label");
      rowLabel.textContent = label;
      row.appendChild(rowLabel);
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "100";
      slider.step = "1";
      slider.value = String(Math.round(audioSettings[key] * 100));
      slider.classList.add("settings-range");
      row.appendChild(slider);
      const rowHint = document.createElement("div");
      rowHint.classList.add("settings-hint");
      rowHint.textContent = hint;
      row.appendChild(rowHint);
      slider.addEventListener("input", () => {
        const value = Number(slider.value) / 100;
        const next = { ...loadAudioSettings(), [key]: value };
        saveAudioSettings(next);
        this.callbacks.setAudioSettings({ [key]: value });
      });
      body.appendChild(row);
    };

    addVolumeRow("Master Volume", "masterVolume", "Overall audio level.");
    addVolumeRow("Ambient Volume", "ambientVolume", "District ambience and positional sources.");
  }

  /** Load persisted input settings at construction time so the engine can apply them immediately. */
  static loadInputSettings(): InputInterpreterSettings {
    return loadStoredSettings();
  }
}
