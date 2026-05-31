import type { QuestDef } from "@old-town/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentClient } from "./ContentClient";
import { UIManager, type UIManagerCallbacks } from "./UIManager";
import { UIState } from "./UIState";

class TestContentClient extends ContentClient {
  override getItem = vi.fn(() => undefined);
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
    <div id="dialogue-box" class="hidden"></div>
    <div id="dialogue-npc"></div>
    <div id="dialogue-text"></div>
    <div id="dialogue-options"></div>
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
});
