import type { QuestDef } from "@old-town/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentClient } from "./ContentClient";
import { IconAtlas } from "./IconAtlas";
import { UIManager, type UIManagerCallbacks } from "./UIManager";
import { UIState } from "./UIState";

/** Clear localStorage in jsdom envs that lack Storage.prototype.clear. */
function clearLocalStorage(): void {
  localStorage.clear();
}

// jsdom in some Bun versions provides a localStorage object whose
// getItem/setItem/removeItem/clear are undefined. Install a minimal in-memory
// Storage shim so UIManager's persistence tests can run.
if (
  typeof localStorage !== "undefined" &&
  (typeof localStorage.getItem !== "function" ||
    typeof localStorage.setItem !== "function" ||
    typeof localStorage.removeItem !== "function" ||
    typeof localStorage.clear !== "function")
) {
  const store = new Map<string, string>();
  const shim = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
  Object.defineProperty(globalThis, "localStorage", { value: shim, configurable: true, writable: true });
}

function mockCanvas(): void {
  const mockCtx = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    fill: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    setTransform: vi.fn(),
    fillStyle: "",
  } as unknown as CanvasRenderingContext2D;
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return mockCtx;
    return null;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

class TestContentClient extends ContentClient {
  override getItem = vi.fn((_itemId: string) => undefined);
  override getSkill = vi.fn(() => undefined);
  override getAllSkills = vi.fn(() => []);
  override getSpell = vi.fn(() => undefined);
  override getAllSpells = vi.fn(() => []);
  override getNpc = vi.fn(() => undefined);
  override getQuest = vi.fn(() => undefined);
  override getDialogue = vi.fn(() => undefined);
  override getAllQuests = vi.fn<() => QuestDef[]>(() => []);
  override getObject = vi.fn(() => undefined);
  getAllItems = vi.fn(() => []);
  getAllNpcs = vi.fn(() => []);
  getAllObjects = vi.fn(() => []);
}

function setupTestEnv(): void {
  mockCanvas();
  document.body.innerHTML = `
    <div id="inventory-panel" class="hidden"></div>
    <div id="inventory-body"></div>
    <div id="equipment-panel" class="hidden"></div>
    <div id="equipment-body"></div>
    <div id="combat-panel" class="hidden"></div>
    <div id="combat-body"></div>
    <div id="skills-panel" class="hidden"></div>
    <div id="skills-body"></div>
    <div id="spellbook-panel" class="hidden"></div>
    <div id="spellbook-body"></div>
    <div id="quest-panel" class="hidden"></div>
    <div id="quest-body"></div>
    <div id="chat-box" class="hidden"></div>
    <div id="chat-body"></div>
    <input id="chat-input" />
    <button id="chat-send"></button>
    <div id="debug-overlay" class="hidden"></div>
    <button class="ui-bar-btn" data-panel="inventory-panel"></button>
    <button class="ui-bar-btn" data-panel="equipment-panel"></button>
    <button class="ui-bar-btn" data-panel="combat-panel"></button>
    <button class="ui-bar-btn" data-panel="skills-panel"></button>
    <button class="ui-bar-btn" data-panel="spellbook-panel"></button>
    <button class="ui-bar-btn" data-panel="quest-panel"></button>
    <button class="ui-bar-btn" data-panel="chat-box"></button>
    <button class="ui-bar-btn" data-panel="recipe-panel"></button>
    <button class="ui-bar-btn" data-panel="contract-panel"></button>
    <div id="dialogue-box" class="hidden"></div>
    <div id="dialogue-npc"></div>
    <div id="dialogue-text"></div>
    <div id="dialogue-options"></div>
    <div id="recipe-panel" class="hidden">
      <div class="ui-panel-header" id="recipe-header">Recipe</div>
      <div class="ui-panel-body" id="recipe-body">
        <div id="recipe-list"></div>
        <div id="recipe-detail" class="recipe-detail hidden">
          <div id="recipe-ingredients"></div>
          <div id="recipe-output"></div>
          <div id="recipe-quantity" class="recipe-quantity">
            <button class="qty-btn active" data-qty="1">1</button>
            <button class="qty-btn" data-qty="5">5</button>
            <button class="qty-btn" data-qty="10">10</button>
            <button class="qty-btn" data-qty="x">X</button>
          </div>
          <button id="recipe-make-btn" class="recipe-make-btn"></button>
        </div>
        <div id="recipe-feedback" class="recipe-feedback hidden"></div>
      </div>
    </div>
    <div id="minimap-panel" class="hidden">
      <div class="ui-panel-body">
        <canvas id="minimap-canvas" width="160" height="120"></canvas>
      </div>
    </div>
    <div id="contract-panel" class="hidden">
      <div class="ui-panel-body" id="contract-body"></div>
      <div id="contract-progress-bar"><div id="contract-progress-fill"></div></div>
    </div>
    <div id="activity-panel" class="hidden">
      <div class="ui-panel-body" id="activity-body"></div>
    </div>
    <div id="settings-panel" class="hidden">
      <div class="ui-panel-body" id="settings-body"></div>
    </div>
    <button class="ui-bar-btn" data-panel="settings-panel"></button>
    <div id="status-effects-panel" class="hidden"></div>
    <div id="death-screen" class="hidden"></div>
    <div id="notification-toast" class="hidden"></div>
    <div id="skill-tooltip" class="hidden"></div>
    <div id="sidebar-placeholder" class="hidden"><h2 id="sidebar-placeholder-title"></h2></div>
    <button type="button" class="sb-tab" data-tab="inventory" data-page="inventory-panel"></button>
    <button type="button" class="sb-tab" data-tab="equipment" data-page="equipment-panel"></button>
    <button type="button" class="sb-tab" data-tab="combat" data-page="combat-panel"></button>
    <button type="button" class="sb-tab" data-tab="skills" data-page="skills-panel"></button>
    <button type="button" class="sb-tab" data-tab="magic" data-page="spellbook-panel"></button>
    <button type="button" class="sb-tab" data-tab="quests" data-page="quest-panel"></button>
    <button type="button" class="sb-tab" data-tab="settings" data-page="settings-panel"></button>
    <button type="button" class="sb-tab" data-tab="prayer"></button>
  `;
}

describe("UIManager", () => {
  let uiState: UIState;
  let content: TestContentClient;
  let callbacks: UIManagerCallbacks;
  let manager: UIManager;

  beforeEach(() => {
    setupTestEnv();
    uiState = new UIState();
    content = new TestContentClient();
    callbacks = {
      sendItemCommand: vi.fn(),
      sendChatCommand: vi.fn(),
      enterSpellTargetMode: vi.fn(),
      enterItemTargetMode: vi.fn(),
      sendUiActionCommand: vi.fn(),
      sendBankCommand: vi.fn(),
      sendShopCommand: vi.fn(),
      sendRecipeCommand: vi.fn(),
      sendSetCombatStyle: vi.fn(),
      setInputSettings: vi.fn(),
    };
    manager = new UIManager(uiState, content, callbacks);
  });

  it("shows panel on sidebar tab click", () => {
    const btn = document.querySelector(".sb-tab[data-tab='equipment']");
    const panel = document.getElementById("equipment-panel");
    if (!(btn instanceof HTMLButtonElement) || !(panel instanceof HTMLDivElement)) throw new Error("Missing elements");
    expect(panel.classList.contains("hidden")).toBe(true);
    btn.click();
    expect(panel.classList.contains("hidden")).toBe(false);
  });

  it("renders weapon attack styles and selecting one sends the command optimistically", () => {
    content.getItem.mockImplementation(
      (id: string) =>
        (id === "pennywrought_shortblade"
          ? {
              id,
              name: "Pennywrought Shortblade",
              equipment: { slot: "weapon", allowedStyles: ["stab", "slash", "crush"] },
            }
          : undefined) as unknown as undefined,
    );
    uiState.setEquipment([null, null, null, "pennywrought_shortblade"]);
    uiState.setSkills([{ skillId: "strength", level: 3, xp: 0, effectiveLevel: 3 }]);

    manager.togglePanel("combat-panel");

    const body = document.getElementById("combat-body");
    const buttons = body?.querySelectorAll(".combat-style-btn");
    expect(buttons?.length).toBe(3);
    // Default active style is the weapon's first style: stab → Attack.
    expect(
      body?.querySelector(".combat-style-btn.active .combat-style-name")?.textContent,
    ).toBe("Stab");

    const slash = [...(buttons ?? [])].find((b) => b.textContent?.includes("Slash"));
    (slash as HTMLButtonElement).click();

    expect(callbacks.sendSetCombatStyle).toHaveBeenCalledWith("slash");
    expect(uiState.combatStyle).toBe("slash");
    // Optimistic re-render now highlights Slash (which trains Strength).
    expect(
      document.querySelector("#combat-body .combat-style-btn.active .combat-style-name")
        ?.textContent,
    ).toBe("Slash");
  });

  it("shows Unarmed with no selectable styles when no weapon is equipped", () => {
    uiState.setEquipment([]);
    manager.togglePanel("combat-panel");
    const body = document.getElementById("combat-body");
    expect(body?.querySelector(".combat-weapon")?.textContent).toBe("Unarmed");
    const buttons = body?.querySelectorAll<HTMLButtonElement>(".combat-style-btn");
    expect(buttons?.length).toBe(1);
    expect(buttons?.[0]?.disabled).toBe(true);
  });

  it("toggles panel visibility on keyboard shortcut", () => {
    const panel = document.getElementById("equipment-panel");
    if (!(panel instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
    expect(panel.classList.contains("hidden")).toBe(true);
    const event = new KeyboardEvent("keydown", { key: "e" });
    document.dispatchEvent(event);
    expect(panel.classList.contains("hidden")).toBe(false);
  });

  it("sends chat command on Enter in chat input", () => {
    const input = document.getElementById("chat-input");
    if (!(input instanceof HTMLInputElement)) throw new Error("Expected HTMLInputElement");
    input.value = "hello";
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    input.dispatchEvent(event);
    expect(callbacks.sendChatCommand).toHaveBeenCalledWith("hello");
    expect(input.value).toBe("");
  });

  it("does not send chat command when text is empty", () => {
    const input = document.getElementById("chat-input");
    if (!(input instanceof HTMLInputElement)) throw new Error("Expected HTMLInputElement");
    input.value = "   ";
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    input.dispatchEvent(event);
    expect(callbacks.sendChatCommand).not.toHaveBeenCalled();
  });

  it("renders only the changed UI surface on state updates", () => {
    content.getAllQuests.mockClear();

    uiState.addChat([{ text: "hello", channel: "public", serverTime: 0 }]);

    expect(document.getElementById("chat-body")?.textContent).toContain("hello");
    expect(content.getAllQuests).not.toHaveBeenCalled();
  });

  it("does not intercept keyboard shortcuts when input is focused", () => {
    const input = document.getElementById("chat-input");
    const panel = document.getElementById("equipment-panel");
    if (!(input instanceof HTMLInputElement) || !(panel instanceof HTMLDivElement)) throw new Error("Missing elements");
    expect(panel.classList.contains("hidden")).toBe(true);
    const event = new KeyboardEvent("keydown", { key: "e" });
    Object.defineProperty(event, "target", { value: input, writable: false });
    document.dispatchEvent(event);
    expect(panel.classList.contains("hidden")).toBe(true);
  });

  it("renders active quest journal text and completed quest state", () => {
    const quest: QuestDef = {
      id: "smoke_over_old_town",
      name: "Smoke Over Old Town",
      questPoints: 1,
      requirements: [],
      varPrefix: "smoke_over_old_town",
      stages: [
        { stage: 0, journalText: "Not started.", objectives: [], triggers: [] },
        { stage: 10, journalText: "Gather three dry logs.", objectives: [], triggers: [] },
      ],
      rewards: [],
    };
    content.getAllQuests.mockReturnValue([quest]);

    uiState.setVars([{ varId: "quest.smoke_over_old_town.stage", value: 10 }]);

    const body = document.getElementById("quest-body");
    expect(body?.textContent).toBe("Smoke Over Old Town: Gather three dry logs.");
    expect(body?.classList.contains("text-dim")).toBe(false);

    uiState.applyVarbitDelta([
      { varId: "quest.smoke_over_old_town.completed", value: true },
      { varId: "quest.smoke_over_old_town.stage", value: 41 },
    ]);

    expect(body?.textContent).toBe("Smoke Over Old Town: Completed.");
  });

  it("disposes without error", () => {
    expect(() => manager.dispose()).not.toThrow();
  });

  it("renders server-provided dialogue options and sends selected original index", () => {
    uiState.setDialogue({
      dialogueId: "baker_dialogue",
      nodeId: "start",
      speakerName: "Baker",
      npcText: "The oven needs help.",
      options: [
        { index: 0, text: "What happened?" },
        { index: 2, text: "Goodbye." },
      ],
    });

    expect(document.getElementById("dialogue-box")?.classList.contains("hidden")).toBe(false);
    expect(document.getElementById("dialogue-npc")?.textContent).toBe("Baker");
    expect(document.getElementById("dialogue-text")?.textContent).toBe("The oven needs help.");

    const options = document.querySelectorAll<HTMLDivElement>(".dialogue-option");
    expect(options).toHaveLength(2);
    options[1]?.click();
    expect(callbacks.sendUiActionCommand).toHaveBeenCalledWith(
      "dialogue_option",
      "baker_dialogue",
      2,
    );
  });

  it("renders a close command for dialogue nodes without options", () => {
    uiState.setDialogue({
      dialogueId: "baker_dialogue",
      nodeId: "end",
      speakerName: "Baker",
      npcText: "Mind the smoke.",
      options: [],
    });

    const close = document.querySelector<HTMLDivElement>(".dialogue-option");
    expect(close?.textContent).toBe("Continue");
    close?.click();
    expect(callbacks.sendUiActionCommand).toHaveBeenCalledWith("dialogue_close", "baker_dialogue");
  });

  it("renders recipe list when setRecipeList is called", () => {
    uiState.setRecipeList({
      interfaceId: "recipe",
      stationEntityId: 42,
      stationName: "Range",
      recipes: [
        {
          recipeId: "cooked_fish",
          name: "Cooked Fish",
          skillId: "cooking",
          levelRequired: 1,
          xp: 40,
          ingredients: [{ itemId: "raw_fish", quantity: 1 }],
          productId: "cooked_fish",
          productQuantity: 1,
        },
      ],
    });

    const rows = document.querySelectorAll(".recipe-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toContain("Cooked Fish");
    expect(document.getElementById("recipe-header")?.textContent).toBe("Range");
  });

  it("highlights selected recipe on click", () => {
    uiState.setRecipeList({
      interfaceId: "recipe",
      stationEntityId: 42,
      stationName: "Range",
      recipes: [
        {
          recipeId: "r1",
          name: "Recipe One",
          skillId: "cooking",
          levelRequired: 1,
          xp: 10,
          ingredients: [],
          productId: "p1",
          productQuantity: 1,
        },
        {
          recipeId: "r2",
          name: "Recipe Two",
          skillId: "cooking",
          levelRequired: 5,
          xp: 20,
          ingredients: [],
          productId: "p2",
          productQuantity: 1,
        },
      ],
    });

    const rows = document.querySelectorAll<HTMLDivElement>(".recipe-row");
    rows[0]?.click();
    const rowsAfter = document.querySelectorAll<HTMLDivElement>(".recipe-row");
    expect(rowsAfter[0]?.classList.contains("selected")).toBe(true);
    expect(rowsAfter[1]?.classList.contains("selected")).toBe(false);
  });

  it("shows detail panel and Make button on selection", () => {
    uiState.setSkills([{ skillId: "cooking", level: 10, xp: 1000, effectiveLevel: 10 }]);
    content.getItem.mockImplementation((itemId: string) => {
      if (itemId === "cooked_fish")
        return { name: "Cooked Fish" } as unknown as ReturnType<typeof content.getItem>;
      return undefined;
    });
    uiState.setRecipeList({
      interfaceId: "recipe",
      stationEntityId: 42,
      stationName: "Range",
      recipes: [
        {
          recipeId: "r1",
          name: "Recipe One",
          skillId: "cooking",
          levelRequired: 1,
          xp: 40,
          ingredients: [{ itemId: "raw_fish", quantity: 1 }],
          productId: "cooked_fish",
          productQuantity: 1,
        },
      ],
    });

    const rows = document.querySelectorAll<HTMLDivElement>(".recipe-row");
    rows[0]?.click();

    const detail = document.getElementById("recipe-detail");
    expect(detail?.classList.contains("hidden")).toBe(false);

    const makeBtn = document.getElementById("recipe-make-btn");
    if (!(makeBtn instanceof HTMLButtonElement)) throw new Error("Expected HTMLButtonElement");
    expect(makeBtn.textContent).toBe("Make");
    expect(makeBtn.disabled).toBe(false);

    const output = document.getElementById("recipe-output");
    expect(output?.textContent).toContain("Cooked Fish");
    expect(output?.textContent).toContain("(+40 XP)");
  });

  it("disables Make button when level requirement is not met", () => {
    uiState.setSkills([{ skillId: "cooking", level: 5, xp: 100, effectiveLevel: 5 }]);
    uiState.setRecipeList({
      interfaceId: "recipe",
      stationEntityId: 42,
      stationName: "Range",
      recipes: [
        {
          recipeId: "r1",
          name: "Hard Recipe",
          skillId: "cooking",
          levelRequired: 10,
          xp: 100,
          ingredients: [],
          productId: "p1",
          productQuantity: 1,
        },
      ],
    });

    const rows = document.querySelectorAll<HTMLDivElement>(".recipe-row");
    rows[0]?.click();

    const makeBtn = document.getElementById("recipe-make-btn");
    if (!(makeBtn instanceof HTMLButtonElement)) throw new Error("Expected HTMLButtonElement");
    expect(makeBtn.disabled).toBe(true);
    expect(makeBtn.textContent).toBe("Level too low");
  });

  it("sends RecipeSelect command on Make click", () => {
    uiState.setSkills([{ skillId: "cooking", level: 10, xp: 1000, effectiveLevel: 10 }]);
    uiState.setRecipeList({
      interfaceId: "recipe",
      stationEntityId: 99,
      stationName: "Range",
      recipes: [
        {
          recipeId: "r1",
          name: "Recipe One",
          skillId: "cooking",
          levelRequired: 1,
          xp: 10,
          ingredients: [],
          productId: "p1",
          productQuantity: 1,
        },
      ],
    });

    const rows = document.querySelectorAll<HTMLDivElement>(".recipe-row");
    rows[0]?.click();

    const makeBtn = document.getElementById("recipe-make-btn");
    if (!(makeBtn instanceof HTMLButtonElement)) throw new Error("Expected HTMLButtonElement");
    makeBtn.click();

    expect(callbacks.sendRecipeCommand).toHaveBeenCalledWith("r1", 99);
  });

  it("shows success feedback on setRecipeResult", () => {
    uiState.setRecipeResult({
      recipeId: "r1",
      success: true,
      productItemId: "cooked_fish",
      productQuantity: 1,
      xpReward: 40,
      message: "You cook the fish.",
    });

    const feedback = document.getElementById("recipe-feedback");
    expect(feedback?.classList.contains("hidden")).toBe(false);
    expect(feedback?.classList.contains("success")).toBe(true);
    expect(feedback?.textContent).toContain("You cook the fish.");
  });

  it("shows failure feedback on setRecipeResult", () => {
    uiState.setRecipeResult({
      recipeId: "r1",
      success: false,
      message: "You burn the fish.",
    });

    const feedback = document.getElementById("recipe-feedback");
    expect(feedback?.classList.contains("hidden")).toBe(false);
    expect(feedback?.classList.contains("failure")).toBe(true);
    expect(feedback?.textContent).toContain("You burn the fish.");
  });

  it("clears panel on clearRecipeList", () => {
    uiState.setRecipeList({
      interfaceId: "recipe",
      stationEntityId: 42,
      stationName: "Range",
      recipes: [
        {
          recipeId: "r1",
          name: "Recipe One",
          skillId: "cooking",
          levelRequired: 1,
          xp: 10,
          ingredients: [],
          productId: "p1",
          productQuantity: 1,
        },
      ],
    });

    uiState.clearRecipeList();

    expect(document.getElementById("recipe-list")?.innerHTML).toBe("");
    expect(document.getElementById("recipe-detail")?.classList.contains("hidden")).toBe(true);
    expect(document.getElementById("recipe-feedback")?.classList.contains("hidden")).toBe(true);
  });

  it("disposes without error with recipe panel attached", () => {
    expect(() => manager.dispose()).not.toThrow();
  });

  it("renders activity panel when activity is set", () => {
    uiState.setActivity({
      activityId: "woodcutting_oak",
      name: "Woodcutting",
      category: "Gathering",
      loopDescription: "Chopping oak trees.",
      risk: "low",
    });

    const panel = document.getElementById("activity-panel");
    const body = document.getElementById("activity-body");
    expect(panel?.classList.contains("hidden")).toBe(false);
    expect(body?.textContent).toContain("Woodcutting");
    expect(body?.textContent).toContain("Gathering");
    expect(body?.textContent).toContain("low");
    expect(body?.textContent).toContain("Chopping oak trees.");
  });

  it("hides activity panel and clears body when activity is cleared", () => {
    uiState.setActivity({
      activityId: "woodcutting_oak",
      name: "Woodcutting",
      category: "Gathering",
      loopDescription: "Chopping oak trees.",
      risk: "low",
    });
    uiState.clearActivity();

    const panel = document.getElementById("activity-panel");
    const body = document.getElementById("activity-body");
    expect(panel?.classList.contains("hidden")).toBe(true);
    expect(body?.textContent).toContain("No active activity.");
  });

  it("sends activity_stop command on Stop button click", () => {
    uiState.setActivity({
      activityId: "woodcutting_oak",
      name: "Woodcutting",
      category: "Gathering",
      loopDescription: "Chopping oak trees.",
      risk: "low",
    });

    const stopBtn = document.querySelector(".activity-stop-btn");
    expect(stopBtn).not.toBeNull();
    if (!(stopBtn instanceof HTMLButtonElement)) throw new Error("Expected HTMLButtonElement");
    stopBtn.click();
    expect(callbacks.sendUiActionCommand).toHaveBeenCalledWith("activity_stop", "woodcutting_oak");
  });

  it("toggles activity panel on keyboard shortcut", () => {
    const panel = document.getElementById("activity-panel");
    if (!(panel instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
    expect(panel.classList.contains("hidden")).toBe(true);
    const event = new KeyboardEvent("keydown", { key: "a" });
    document.dispatchEvent(event);
    expect(panel.classList.contains("hidden")).toBe(false);
  });

  describe("skills panel hover tooltip (OSRS-style progress)", () => {
    function makeSkill(id: string, name: string): {
      id: string;
      name: string;
      maxLevel: number;
      xpTableId: "oldtown_default";
      combat: boolean;
      unlocks: never[];
    } {
      return { id, name, maxLevel: 99, xpTableId: "oldtown_default", combat: false, unlocks: [] };
    }

    it("shows current xp, next-level xp, and xp-to-next on hover", () => {
      const cooking = makeSkill("cooking", "Cooking");
      content.getSkill = vi.fn((id: string) => (id === "cooking" ? cooking : undefined));
      content.getAllSkills = vi.fn(() => [cooking]);
      // 1154 xp = exactly level 10; next level (11) at 1358 → 204 to next.
      uiState.setSkills([
        { skillId: "cooking", level: 10, xp: 1154, effectiveLevel: 10 },
      ]);
      manager.togglePanel("skills-panel");

      const tile = document.querySelector<HTMLDivElement>(".skill-tile");
      expect(tile).toBeDefined();
      expect(tile?.title).toContain("Cooking");
      expect(tile?.title).toContain("XP 1,154");
      expect(tile?.title).toContain("Next at 1,358");
      expect(tile?.title).toContain("204 to next");

      tile?.dispatchEvent(new MouseEvent("mouseenter", { clientX: 100, clientY: 100 }));
      const tooltip = document.getElementById("skill-tooltip");
      expect(tooltip?.classList.contains("hidden")).toBe(false);
      expect(tooltip?.textContent).toContain("Cooking");
      expect(tooltip?.textContent).toContain("Level: 10/10");
      expect(tooltip?.textContent).toContain("XP: 1,154");
      expect(tooltip?.textContent).toContain("Next Level At: 1,358");
      expect(tooltip?.textContent).toContain("XP to next: 204");
    });

    it("shows Max and no xp-to-next at level 99", () => {
      const attack = makeSkill("attack", "Attack");
      content.getSkill = vi.fn((id: string) => (id === "attack" ? attack : undefined));
      content.getAllSkills = vi.fn(() => [attack]);
      uiState.setSkills([
        { skillId: "attack", level: 99, xp: 13_034_431, effectiveLevel: 99 },
      ]);
      manager.togglePanel("skills-panel");

      const tile = document.querySelector<HTMLDivElement>(".skill-tile");
      expect(tile?.title).toContain("Max");
      expect(tile?.title).not.toContain("to next");

      tile?.dispatchEvent(new MouseEvent("mouseenter", { clientX: 50, clientY: 50 }));
      const tooltip = document.getElementById("skill-tooltip");
      expect(tooltip?.textContent).toContain("Next Level At: Max");
      expect(tooltip?.textContent).not.toContain("XP to next");
    });

    it("hides the tooltip on mouseleave and when the panel is closed", () => {
      const cooking = makeSkill("cooking", "Cooking");
      content.getSkill = vi.fn((id: string) => (id === "cooking" ? cooking : undefined));
      content.getAllSkills = vi.fn(() => [cooking]);
      uiState.setSkills([{ skillId: "cooking", level: 1, xp: 0, effectiveLevel: 1 }]);
      manager.togglePanel("skills-panel");

      const tile = document.querySelector<HTMLDivElement>(".skill-tile");
      tile?.dispatchEvent(new MouseEvent("mouseenter", { clientX: 10, clientY: 10 }));
      expect(document.getElementById("skill-tooltip")?.classList.contains("hidden")).toBe(false);

      tile?.dispatchEvent(new MouseEvent("mouseleave"));
      expect(document.getElementById("skill-tooltip")?.classList.contains("hidden")).toBe(true);

      // Reopen + re-show, then close the panel → tooltip hides.
      tile?.dispatchEvent(new MouseEvent("mouseenter", { clientX: 10, clientY: 10 }));
      expect(document.getElementById("skill-tooltip")?.classList.contains("hidden")).toBe(false);
      manager.togglePanel("skills-panel"); // visible → hidden
      expect(document.getElementById("skill-tooltip")?.classList.contains("hidden")).toBe(true);
    });

    it("updates the tooltip in real time when XP changes while hovered", () => {
      const cooking = makeSkill("cooking", "Cooking");
      content.getSkill = vi.fn((id: string) => (id === "cooking" ? cooking : undefined));
      content.getAllSkills = vi.fn(() => [cooking]);
      uiState.setSkills([
        { skillId: "cooking", level: 10, xp: 1154, effectiveLevel: 10 },
      ]);
      manager.togglePanel("skills-panel");

      const tile = document.querySelector<HTMLDivElement>(".skill-tile");
      tile?.dispatchEvent(new MouseEvent("mouseenter", { clientX: 100, clientY: 100 }));
      const tooltip = document.getElementById("skill-tooltip");
      expect(tooltip?.textContent).toContain("XP: 1,154");
      expect(tooltip?.textContent).toContain("XP to next: 204");

      // Simulate an XP drop arriving: 200 XP gained → 1354 total, 4 to next.
      uiState.applySkillDelta([
        { skillId: "cooking", level: 10, xp: 1354, effectiveLevel: 10 },
      ]);

      // Tooltip should now reflect the new XP without re-hovering.
      expect(tooltip?.textContent).toContain("XP: 1,354");
      expect(tooltip?.textContent).toContain("XP to next: 4");
      expect(tooltip?.classList.contains("hidden")).toBe(false);
    });

    it("hides the tooltip when switching to a different sidebar tab", () => {
      const cooking = makeSkill("cooking", "Cooking");
      content.getSkill = vi.fn((id: string) => (id === "cooking" ? cooking : undefined));
      content.getAllSkills = vi.fn(() => [cooking]);
      uiState.setSkills([{ skillId: "cooking", level: 1, xp: 0, effectiveLevel: 1 }]);
      manager.togglePanel("skills-panel");

      const tile = document.querySelector<HTMLDivElement>(".skill-tile");
      tile?.dispatchEvent(new MouseEvent("mouseenter", { clientX: 100, clientY: 100 }));
      expect(document.getElementById("skill-tooltip")?.classList.contains("hidden")).toBe(false);

      // Click the inventory tab — SidebarTabs hides the skills panel directly,
      // not via togglePanel, so the tooltip cleanup must happen in the renderPage callback.
      const invTab = document.querySelector<HTMLButtonElement>(".sb-tab[data-tab='inventory']");
      invTab?.click();
      expect(document.getElementById("skill-tooltip")?.classList.contains("hidden")).toBe(true);
    });
  });

  describe("icon rendering (E41-S02)", () => {
    function makeIconAtlas(iconAssetId: string): IconAtlas {
      const atlas = new IconAtlas();
      // Inject a resolved index without going through fetch.
      (atlas as unknown as { _index: unknown })._index = {
        version: 1,
        atlas: "atlas-0.svg",
        cellSize: 64,
        cells: { [iconAssetId]: { x: 64, y: 0, w: 64, h: 64 } },
      };
      (atlas as unknown as { _atlasUrl: string })._atlasUrl =
        "http://localhost/assets/items/atlases/atlas-0.svg";
      (atlas as unknown as { _ready: boolean })._ready = true;
      return atlas;
    }

    it("inventory renders an <img> sprite for an occupied slot", () => {
      content.getItem = vi.fn(() => ({
        id: "test_sword",
        name: "Test Sword",
        icon: "icon_test_sword",
        stackable: false,
        tradeable: true,
        examine: "A test sword.",
        value: 1,
        options: ["wield"],
        tags: [],
      })) as unknown as typeof content.getItem;
      const atlas = makeIconAtlas("icon_test_sword");
      new UIManager(uiState, content, callbacks, atlas);
      uiState.setInventory({
        containerId: "inventory",
        changes: [{ slot: 0, itemId: "test_sword", quantity: 1, uid: 1 }],
      });

      const cell = document.querySelector("#inventory-body .inventory-cell");
      if (!(cell instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
      expect(cell).toBeTruthy();
      const img = cell.querySelector("img.item-icon");
      expect(img).not.toBeNull();
      expect(img instanceof HTMLImageElement ? img.src : "").toContain("atlas-0.svg");
      expect(img instanceof HTMLImageElement ? img.alt : "").toBe("icon_test_sword");
    });

    it("inventory renders a placeholder img for an unresolved icon", () => {
      content.getItem = vi.fn(() => ({
        id: "no_art_item",
        name: "No Art Item",
        icon: "icon_missing",
        stackable: false,
        tradeable: true,
        examine: "No art.",
        value: 1,
        options: [],
        tags: [],
      })) as unknown as typeof content.getItem;
      const atlas = makeIconAtlas("icon_other");
      new UIManager(uiState, content, callbacks, atlas);
      uiState.setInventory({
        containerId: "inventory",
        changes: [{ slot: 0, itemId: "no_art_item", quantity: 1, uid: 2 }],
      });

      const cell = document.querySelector("#inventory-body .inventory-cell");
      if (!(cell instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
      const img = cell.querySelector("img.item-icon-missing");
      expect(img).not.toBeNull();
      expect(img instanceof HTMLImageElement ? img.src : "").toMatch(/^data:image\/svg\+xml/);
    });

    it("inventory renders a quantity badge for stackable items", () => {
      content.getItem = vi.fn(() => ({
        id: "arrows",
        name: "Arrows",
        icon: "icon_arrows",
        stackable: true,
        tradeable: true,
        examine: "Arrows.",
        value: 1,
        options: [],
        tags: [],
      })) as unknown as typeof content.getItem;
      const atlas = makeIconAtlas("icon_arrows");
      new UIManager(uiState, content, callbacks, atlas);
      uiState.setInventory({
        containerId: "inventory",
        changes: [{ slot: 5, itemId: "arrows", quantity: 42, uid: 3 }],
      });

      const cells = document.querySelectorAll("#inventory-body .inventory-cell");
      const occupiedCell = cells[5];
      if (!(occupiedCell instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
      const badge = occupiedCell.querySelector(".item-qty-badge");
      expect(badge).not.toBeNull();
      expect(badge instanceof HTMLSpanElement ? badge.textContent : "").toBe("42");
    });

    it("equipment renders an icon grid with placeholder for empty slots", () => {
      content.getItem = vi.fn(() => ({
        id: "test_helm",
        name: "Test Helm",
        icon: "icon_test_helm",
        stackable: false,
        tradeable: true,
        examine: "A helm.",
        value: 1,
        options: ["wear"],
        tags: [],
      })) as unknown as typeof content.getItem;
      const atlas = makeIconAtlas("icon_test_helm");
      new UIManager(uiState, content, callbacks, atlas);
      // Equipment slot 0 = Head
      (uiState as unknown as { _equipment: Map<number, string> })._equipment.set(0, "test_helm");
      (uiState as unknown as { _notify: (c: string) => void })._notify("equipment");

      const cells = document.querySelectorAll("#equipment-body .equipment-cell");
      expect(cells.length).toBe(11);
      const headCell = cells[0];
      if (!(headCell instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
      const img = headCell.querySelector("img.item-icon");
      expect(img).not.toBeNull();
      // Empty slot (slot 1 = Cape) should have a label, no img
      const capeCell = cells[1];
      if (!(capeCell instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
      expect(capeCell.querySelector("img")).toBeNull();
    });
  });

  describe("settings panel", () => {
    beforeEach(() => {
      clearLocalStorage();
    });

    it("renders NPC attack and mouse mode selects with persisted values", () => {
      localStorage.setItem(
        "old-town-input-settings",
        JSON.stringify({ v: 1, npcAttack: "always-right-click", mouseButtons: "one-button", menuSwaps: [] }),
      );
      manager.togglePanel("settings-panel");
      const body = document.getElementById("settings-body");
      const selects = body?.querySelectorAll<HTMLSelectElement>(".settings-select");
      expect(selects?.length).toBe(2);
      expect(selects?.[0]?.value).toBe("always-right-click");
      expect(selects?.[1]?.value).toBe("one-button");
    });

    it("calls setInputSettings and persists when NPC attack option changes", () => {
      manager.togglePanel("settings-panel");
      const body = document.getElementById("settings-body");
      const npcSelect = body?.querySelectorAll<HTMLSelectElement>(".settings-select")[0];
      if (!npcSelect) throw new Error("Expected NPC attack select");
      npcSelect.value = "hidden";
      npcSelect.dispatchEvent(new Event("change"));
      expect(callbacks.setInputSettings).toHaveBeenCalledWith({ npcAttack: "hidden" });
      const stored = JSON.parse(localStorage.getItem("old-town-input-settings") ?? "{}");
      expect(stored.npcAttack).toBe("hidden");
    });

    it("calls setInputSettings and persists when mouse mode changes", () => {
      manager.togglePanel("settings-panel");
      const body = document.getElementById("settings-body");
      const mouseSelect = body?.querySelectorAll<HTMLSelectElement>(".settings-select")[1];
      if (!mouseSelect) throw new Error("Expected mouse mode select");
      mouseSelect.value = "one-button";
      mouseSelect.dispatchEvent(new Event("change"));
      expect(callbacks.setInputSettings).toHaveBeenCalledWith({ mouseButtons: "one-button" });
      const stored = JSON.parse(localStorage.getItem("old-town-input-settings") ?? "{}");
      expect(stored.mouseButtons).toBe("one-button");
    });
  });

  describe("loadInputSettings defaults", () => {
    beforeEach(() => {
      clearLocalStorage();
    });

    it("defaults npcAttack to left-click-where-available when no stored settings", () => {
      const settings = UIManager.loadInputSettings();
      expect(settings.npcAttack).toBe("left-click-where-available");
    });

    it("respects an explicitly chosen depends-on-combat-levels persisted setting", () => {
      localStorage.setItem(
        "old-town-input-settings",
        JSON.stringify({
          v: 1,
          npcAttack: "depends-on-combat-levels",
          mouseButtons: "two-button",
          menuSwaps: [],
        }),
      );
      const settings = UIManager.loadInputSettings();
      expect(settings.npcAttack).toBe("depends-on-combat-levels");
    });

    it("resets stale settings from a previous schema version to defaults", () => {
      // Simulate a stale entry from before the settings version was introduced.
      // Old-format entries have no `v` field; they should be discarded.
      localStorage.setItem(
        "old-town-input-settings",
        JSON.stringify({ npcAttack: "depends-on-combat-levels", mouseButtons: "two-button", menuSwaps: [] }),
      );
      const settings = UIManager.loadInputSettings();
      expect(settings.npcAttack).toBe("left-click-where-available");
    });
  });
});
