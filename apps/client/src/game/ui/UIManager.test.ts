import type { QuestDef } from "@old-town/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentClient } from "./ContentClient";
import { UIManager, type UIManagerCallbacks } from "./UIManager";
import { UIState } from "./UIState";

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
    <div id="status-effects-panel" class="hidden"></div>
    <div id="death-screen" class="hidden"></div>
    <div id="notification-toast" class="hidden"></div>
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
      sendUiActionCommand: vi.fn(),
      sendBankCommand: vi.fn(),
      sendShopCommand: vi.fn(),
      sendRecipeCommand: vi.fn(),
    };
    manager = new UIManager(uiState, content, callbacks);
  });

  it("toggles panel visibility on bar button click", () => {
    const btn = document.querySelector("[data-panel='inventory-panel']") as HTMLButtonElement;
    const panel = document.getElementById("inventory-panel") as HTMLDivElement;
    expect(panel.classList.contains("hidden")).toBe(true);
    btn.click();
    expect(panel.classList.contains("hidden")).toBe(false);
    btn.click();
    expect(panel.classList.contains("hidden")).toBe(true);
  });

  it("toggles panel visibility on keyboard shortcut", () => {
    const panel = document.getElementById("inventory-panel") as HTMLDivElement;
    expect(panel.classList.contains("hidden")).toBe(true);
    const event = new KeyboardEvent("keydown", { key: "i" });
    document.dispatchEvent(event);
    expect(panel.classList.contains("hidden")).toBe(false);
  });

  it("sends chat command on Enter in chat input", () => {
    const input = document.getElementById("chat-input") as HTMLInputElement;
    input.value = "hello";
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    input.dispatchEvent(event);
    expect(callbacks.sendChatCommand).toHaveBeenCalledWith("hello");
    expect(input.value).toBe("");
  });

  it("does not send chat command when text is empty", () => {
    const input = document.getElementById("chat-input") as HTMLInputElement;
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
    const input = document.getElementById("chat-input") as HTMLInputElement;
    const panel = document.getElementById("inventory-panel") as HTMLDivElement;
    expect(panel.classList.contains("hidden")).toBe(true);
    const event = new KeyboardEvent("keydown", { key: "i" });
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

    const makeBtn = document.getElementById("recipe-make-btn") as HTMLButtonElement | null;
    expect(makeBtn?.textContent).toBe("Make");
    expect(makeBtn?.disabled).toBe(false);

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

    const makeBtn = document.getElementById("recipe-make-btn") as HTMLButtonElement | null;
    expect(makeBtn?.disabled).toBe(true);
    expect(makeBtn?.textContent).toBe("Level too low");
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

    const makeBtn = document.getElementById("recipe-make-btn") as HTMLButtonElement | null;
    makeBtn?.click();

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

    const stopBtn = document.querySelector(".activity-stop-btn") as HTMLButtonElement | null;
    expect(stopBtn).not.toBeNull();
    stopBtn?.click();
    expect(callbacks.sendUiActionCommand).toHaveBeenCalledWith("activity_stop", "woodcutting_oak");
  });

  it("toggles activity panel on keyboard shortcut", () => {
    const panel = document.getElementById("activity-panel") as HTMLDivElement;
    expect(panel.classList.contains("hidden")).toBe(true);
    const event = new KeyboardEvent("keydown", { key: "a" });
    document.dispatchEvent(event);
    expect(panel.classList.contains("hidden")).toBe(false);
  });
});
