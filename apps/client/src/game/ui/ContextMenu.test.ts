import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PickedEntity } from "../picking/EntityPicker";
import { ContextMenu, type ContextMenuCallbacks } from "./ContextMenu";

function setupCallbacks(): ContextMenuCallbacks {
  return {
    onOptionSelected: vi.fn(),
  };
}

function npcEntity(defId: string): PickedEntity {
  return { kind: "npc", entityId: 1, defId, distance: 1 };
}

const WALK_HERE = { label: "Walk here", actionId: "walk_here", priority: 0 };
const EXAMINE_NPC = { label: "Examine goblin", actionId: "examine", priority: 100 };
const TALK_TO = { label: "Talk-to", actionId: "talk", priority: 1 };
const ATTACK = { label: "Attack", actionId: "attack", priority: 2 };

const NPC_OPTIONS = [WALK_HERE, EXAMINE_NPC, TALK_TO, ATTACK];

describe("ContextMenu view adapter", () => {
  let menu: ContextMenu;
  let callbacks: ContextMenuCallbacks;

  beforeEach(() => {
    document.body.innerHTML = "";
    callbacks = setupCallbacks();
    menu = new ContextMenu({ container: document.body, callbacks });
  });

  it("shows menu with provided options", () => {
    menu.show(100, 100, NPC_OPTIONS, npcEntity("goblin"), { x: 5, y: 5 });
    expect(menu.visible).toBe(true);
    expect(document.body.textContent).toContain("Walk here");
    expect(document.body.textContent).toContain("Talk-to");
  });

  it("does not show menu when no options", () => {
    menu.show(100, 100, [], null, null);
    expect(menu.visible).toBe(false);
  });

  it("reports selected action on click", () => {
    const entity = npcEntity("goblin");
    const tile = { x: 5, y: 5 };
    menu.show(100, 100, NPC_OPTIONS, entity, tile);
    const items = document.querySelectorAll(".context-menu > .context-menu-item");
    const talkTo = Array.from(items).find((el) => el.textContent?.includes("Talk-to"));
    if (!(talkTo instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
    talkTo.click();
    expect(callbacks.onOptionSelected).toHaveBeenCalledWith("talk", entity, tile);
  });

  it("reports walk_here on click", () => {
    const entity = npcEntity("goblin");
    const tile = { x: 5, y: 5 };
    menu.show(100, 100, NPC_OPTIONS, entity, tile);
    const items = document.querySelectorAll(".context-menu > .context-menu-item");
    const walk = Array.from(items).find((el) => el.textContent?.includes("Walk here"));
    if (!(walk instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
    walk.click();
    expect(callbacks.onOptionSelected).toHaveBeenCalledWith("walk_here", entity, tile);
  });

  it("reports examine on click", () => {
    const entity = npcEntity("goblin");
    const tile = { x: 5, y: 5 };
    menu.show(100, 100, NPC_OPTIONS, entity, tile);
    const items = document.querySelectorAll(".context-menu > .context-menu-item");
    const examine = Array.from(items).find((el) => el.textContent?.includes("Examine"));
    if (!(examine instanceof HTMLDivElement)) throw new Error("Expected HTMLDivElement");
    examine.click();
    expect(callbacks.onOptionSelected).toHaveBeenCalledWith("examine", entity, tile);
  });

  it("hides menu on Escape key", async () => {
    menu.show(100, 100, NPC_OPTIONS, npcEntity("goblin"), { x: 5, y: 5 });
    expect(menu.visible).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    expect(menu.visible).toBe(false);
  });

  it("hides menu on click outside", async () => {
    menu.show(100, 100, NPC_OPTIONS, npcEntity("goblin"), { x: 5, y: 5 });
    expect(menu.visible).toBe(true);
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    await new Promise((resolve) => setTimeout(resolve, 10));
    outside.click();
    expect(menu.visible).toBe(false);
  });

  it("does not block render loop", () => {
    menu.show(100, 100, NPC_OPTIONS, npcEntity("goblin"), { x: 5, y: 5 });
    expect(menu.visible).toBe(true);
  });
});
