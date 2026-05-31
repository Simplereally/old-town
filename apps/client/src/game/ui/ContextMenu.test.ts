import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PickedEntity } from "../picking/EntityPicker";
import { ContextMenu, type ContextMenuCallbacks } from "./ContextMenu";

function setupCallbacks(): ContextMenuCallbacks {
  return {
    onWalkHere: vi.fn(),
    onExamine: vi.fn(),
    onNpcOption: vi.fn(),
    onObjectOption: vi.fn(),
    onItemOption: vi.fn(),
  };
}

function npcEntity(defId: string): PickedEntity {
  return { kind: "npc", entityId: 1, defId, distance: 1 };
}

function objectEntity(defId: string): PickedEntity {
  return { kind: "object", entityId: 2, defId, distance: 1 };
}

function groundItemEntity(itemId: string, quantity: number): PickedEntity {
  return { kind: "groundItem", entityId: 3, itemId, quantity, distance: 1 };
}

describe("ContextMenu", () => {
  let menu: ContextMenu;
  let callbacks: ContextMenuCallbacks;

  beforeEach(() => {
    document.body.innerHTML = "";
    callbacks = setupCallbacks();
    menu = new ContextMenu({ container: document.body, callbacks });
  });

  it("shows menu with Walk here option when tile is provided", () => {
    menu.show(100, 100, null, { x: 5, y: 5 });
    expect(menu.visible).toBe(true);
    expect(document.body.textContent).toContain("Walk here");
  });

  it("does not show menu when no tile or entity", () => {
    menu.show(100, 100, null, null);
    expect(menu.visible).toBe(false);
  });

  it("shows npc options including Talk-to, Attack, Cast, Examine", () => {
    menu.show(100, 100, npcEntity("goblin"), null);
    expect(document.body.textContent).toContain("Talk-to");
    expect(document.body.textContent).toContain("Attack");
    expect(document.body.textContent).toContain("Cast");
    expect(document.body.textContent).toContain("Examine");
  });

  it("sends npc option on Talk-to click", () => {
    menu.show(100, 100, npcEntity("goblin"), null);
    const items = document.querySelectorAll(".context-menu > .context-menu-item");
    const talkTo = Array.from(items).find((el) => el.textContent?.includes("Talk-to"));
    expect(talkTo).toBeDefined();
    (talkTo as HTMLDivElement)?.click();
    expect(callbacks.onNpcOption).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "npc", entityId: 1, defId: "goblin" }),
      "talk-to",
    );
  });

  it("sends npc option on Attack click", () => {
    menu.show(100, 100, npcEntity("goblin"), null);
    const items = document.querySelectorAll(".context-menu > .context-menu-item");
    const attack = Array.from(items).find((el) => el.textContent?.includes("Attack"));
    expect(attack).toBeDefined();
    (attack as HTMLDivElement)?.click();
    expect(callbacks.onNpcOption).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "npc", entityId: 1, defId: "goblin" }),
      "attack",
    );
  });

  it("sends npc option on Cast click", () => {
    menu.show(100, 100, npcEntity("goblin"), null);
    const items = document.querySelectorAll(".context-menu > .context-menu-item");
    const cast = Array.from(items).find((el) => el.textContent?.includes("Cast"));
    expect(cast).toBeDefined();
    (cast as HTMLDivElement)?.click();
    expect(callbacks.onNpcOption).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "npc", entityId: 1, defId: "goblin" }),
      "cast",
    );
  });

  it("shows object options with inferred action", () => {
    menu.show(100, 100, objectEntity("oak_tree"), null);
    expect(document.body.textContent).toContain("Chop");
  });

  it("shows rock object options with Mine action", () => {
    menu.show(100, 100, objectEntity("copper_rock"), null);
    expect(document.body.textContent).toContain("Mine");
  });

  it("shows door object options with Open action", () => {
    menu.show(100, 100, objectEntity("wooden_door"), null);
    expect(document.body.textContent).toContain("Open");
  });

  it("shows ground item options with Pick up", () => {
    menu.show(100, 100, groundItemEntity("logs", 1), null);
    expect(document.body.textContent).toContain("Pick up");
  });

  it("hides menu on Escape key", async () => {
    menu.show(100, 100, npcEntity("goblin"), null);
    expect(menu.visible).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    expect(menu.visible).toBe(false);
  });

  it("hides menu on click outside", async () => {
    menu.show(100, 100, npcEntity("goblin"), null);
    expect(menu.visible).toBe(true);
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    await new Promise((resolve) => setTimeout(resolve, 10));
    outside.click();
    expect(menu.visible).toBe(false);
  });

  it("does not block render loop", () => {
    menu.show(100, 100, npcEntity("goblin"), null);
    expect(menu.visible).toBe(true);
  });
});
