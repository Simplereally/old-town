import { describe, expect, it } from "vitest";
import { InputInterpreter } from "./InputInterpreter";

function createMockResolver(): ConstructorParameters<typeof InputInterpreter>[0] {
  return {
    getNpc: (id: string) => {
      if (id === "guard") {
        return {
          options: [
            { label: "Talk-to", actionId: "talk", priority: 10, requiredDistance: 1 },
            { label: "Attack", actionId: "attack", priority: 0, requiredDistance: 1 },
          ],
        };
      }
      if (id === "goblin") {
        return {
          options: [{ label: "Attack", actionId: "attack", priority: 1, requiredDistance: 1 }],
        };
      }
      return undefined;
    },
    getObject: (id: string) => {
      if (id === "tree_oak") {
        return {
          options: [{ label: "Chop", actionId: "woodcut", priority: 10, requiredDistance: 1 }],
        };
      }
      if (id === "rock_copper") {
        return {
          options: [{ label: "Mine", actionId: "mine", priority: 10, requiredDistance: 1 }],
        };
      }
      if (id === "door_wooden") {
        return {
          options: [{ label: "Open", actionId: "open", priority: 10, requiredDistance: 1 }],
        };
      }
      return undefined;
    },
  };
}

describe("InputInterpreter content-driven", () => {
  const interpreter = new InputInterpreter(createMockResolver());

  describe("getDefaultAction", () => {
    it("returns highest-priority content option for NPC", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      expect(interpreter.getDefaultAction(entity)).toBe("talk");
    });

    it("returns highest-priority content option for object", () => {
      const entity = { entityId: 20, kind: "object" as const, defId: "tree_oak", distance: 1 };
      expect(interpreter.getDefaultAction(entity)).toBe("woodcut");
    });

    it("returns fallback for NPC without content options", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "unknown", distance: 1 };
      expect(interpreter.getDefaultAction(entity)).toBe("talk");
    });

    it("returns fallback for object without content options", () => {
      const entity = { entityId: 20, kind: "object" as const, defId: "unknown", distance: 1 };
      expect(interpreter.getDefaultAction(entity)).toBe("use");
    });

    it("returns pickup for ground item", () => {
      const entity = {
        entityId: 30,
        kind: "groundItem" as const,
        itemId: "coins",
        quantity: 5,
        distance: 1,
      };
      expect(interpreter.getDefaultAction(entity)).toBe("pickup");
    });

    it("returns undefined for player", () => {
      const entity = { entityId: 42, kind: "player" as const, defId: "hero", distance: 1 };
      expect(interpreter.getDefaultAction(entity)).toBeUndefined();
    });
  });

  describe("getContextMenuOptions", () => {
    it("builds options from content for NPC", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const options = interpreter.getContextMenuOptions(entity, { x: 10, y: 20 });
      const actions = options.map((o) => o.actionId);
      expect(actions).toContain("walk_here");
      expect(actions).toContain("examine");
      expect(actions).toContain("talk");
      expect(actions).toContain("attack");
    });

    it("builds options from content for object", () => {
      const entity = { entityId: 20, kind: "object" as const, defId: "tree_oak", distance: 1 };
      const options = interpreter.getContextMenuOptions(entity, { x: 10, y: 20 });
      const actions = options.map((o) => o.actionId);
      expect(actions).toContain("walk_here");
      expect(actions).toContain("examine");
      expect(actions).toContain("woodcut");
    });

    it("includes pickup for ground item", () => {
      const entity = {
        entityId: 30,
        kind: "groundItem" as const,
        itemId: "coins",
        quantity: 5,
        distance: 1,
      };
      const options = interpreter.getContextMenuOptions(entity, { x: 10, y: 20 });
      const actions = options.map((o) => o.actionId);
      expect(actions).toContain("walk_here");
      expect(actions).toContain("examine");
      expect(actions).toContain("pickup");
    });

    it("only shows walk-here when no entity", () => {
      const options = interpreter.getContextMenuOptions(null, { x: 10, y: 20 });
      expect(options.map((o) => o.actionId)).toEqual(["walk_here"]);
    });
  });

  describe("interpretCanvasClick", () => {
    it("chooses content-driven default for NPC", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const decision = interpreter.interpretCanvasClick(entity, null, null, undefined);
      expect(decision).toEqual({ type: "npcOption", entityId: 10, actionId: "talk" });
    });

    it("chooses content-driven default for object", () => {
      const entity = { entityId: 20, kind: "object" as const, defId: "tree_oak", distance: 1 };
      const decision = interpreter.interpretCanvasClick(entity, null, null, undefined);
      expect(decision).toEqual({ type: "objectOption", entityId: 20, actionId: "woodcut" });
    });

    it("chooses pickup for ground item", () => {
      const entity = {
        entityId: 30,
        kind: "groundItem" as const,
        itemId: "coins",
        quantity: 5,
        distance: 1,
      };
      const decision = interpreter.interpretCanvasClick(entity, null, null, undefined);
      expect(decision).toEqual({ type: "groundItemOption", entityId: 30, actionId: "pickup" });
    });

    it("chooses walk for empty tile", () => {
      const decision = interpreter.interpretCanvasClick(null, { x: 15, y: 25 }, null, undefined);
      expect(decision).toEqual({ type: "move", tile: { x: 15, y: 25, plane: 0 } });
    });

    it("chooses move for player with tile", () => {
      const entity = { entityId: 42, kind: "player" as const, defId: "hero", distance: 1 };
      const decision = interpreter.interpretCanvasClick(
        entity,
        null,
        { x: 30, y: 32, plane: 0 },
        undefined,
      );
      expect(decision).toEqual({ type: "move", tile: { x: 30, y: 32, plane: 0 } });
    });

    it("chooses none for player without tile", () => {
      const entity = { entityId: 42, kind: "player" as const, defId: "hero", distance: 1 };
      const decision = interpreter.interpretCanvasClick(entity, null, null, undefined);
      expect(decision).toEqual({ type: "none" });
    });

    it("chooses cast spell when in spell target mode", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const decision = interpreter.interpretCanvasClick(entity, null, null, {
        spellId: "wind_strike",
      });
      expect(decision.type).toBe("castSpell");
      expect(decision).toMatchObject({
        type: "castSpell",
        spellId: "wind_strike",
        target: { kind: "entity", entityId: 10 },
      });
    });

    it("chooses cast spell with tile target when no entity", () => {
      const tile = { x: 10, y: 20 };
      const decision = interpreter.interpretCanvasClick(null, tile, null, {
        spellId: "wind_strike",
      });
      expect(decision.type).toBe("castSpell");
      expect(decision).toMatchObject({
        type: "castSpell",
        spellId: "wind_strike",
        target: { kind: "tile", tile: { x: 10, y: 20, plane: 0 } },
      });
    });
  });

  describe("interpretContextMenu", () => {
    it("chooses move for walk_here", () => {
      const decision = interpreter.interpretContextMenu(null, { x: 10, y: 20 }, "walk_here");
      expect(decision).toEqual({ type: "move", tile: { x: 10, y: 20, plane: 0 } });
    });

    it("chooses examine for examine option", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const decision = interpreter.interpretContextMenu(entity, null, "examine");
      expect(decision.type).toBe("examine");
      expect((decision as { entity: unknown }).entity).toBe(entity);
    });

    it("chooses npcOption for npc content action", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const decision = interpreter.interpretContextMenu(entity, null, "attack");
      expect(decision).toEqual({ type: "npcOption", entityId: 10, actionId: "attack" });
    });

    it("chooses objectOption for object content action", () => {
      const entity = { entityId: 20, kind: "object" as const, defId: "tree_oak", distance: 1 };
      const decision = interpreter.interpretContextMenu(entity, null, "woodcut");
      expect(decision).toEqual({ type: "objectOption", entityId: 20, actionId: "woodcut" });
    });

    it("chooses groundItemOption for ground item action", () => {
      const entity = {
        entityId: 30,
        kind: "groundItem" as const,
        itemId: "coins",
        quantity: 5,
        distance: 1,
      };
      const decision = interpreter.interpretContextMenu(entity, null, "pickup");
      expect(decision).toEqual({ type: "groundItemOption", entityId: 30, actionId: "pickup" });
    });

    it("returns none for unknown action", () => {
      const decision = interpreter.interpretContextMenu(null, null, "unknown");
      expect(decision).toEqual({ type: "none" });
    });
  });

  describe("interpretEscape", () => {
    it("chooses cancelSpellTarget when in spell mode", () => {
      const decision = interpreter.interpretEscape({ spellId: "wind_strike" });
      expect(decision).toEqual({ type: "cancelSpellTarget" });
    });

    it("returns none when not in spell mode", () => {
      const decision = interpreter.interpretEscape(undefined);
      expect(decision).toEqual({ type: "none" });
    });
  });
});
