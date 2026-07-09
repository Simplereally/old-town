import { combatLevelColor } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  calculateCombatLevel,
  InputInterpreter,
  shouldNpcAttackBeLeftClick,
} from "./InputInterpreter";

function createMockResolver(): ConstructorParameters<typeof InputInterpreter>[0] {
  return {
    getNpc: (id: string) => {
      if (id === "guard") {
        return {
          name: "Guard",
          combatLevel: 21,
          options: [
            { label: "Talk-to", actionId: "talk", priority: 10, requiredDistance: 1 },
            { label: "Attack", actionId: "attack", priority: 0, requiredDistance: 1 },
          ],
        };
      }
      if (id === "goblin") {
        return {
          name: "Goblin",
          combatLevel: 2,
          options: [{ label: "Attack", actionId: "attack", priority: 1, requiredDistance: 1 }],
        };
      }
      if (id === "knight") {
        return {
          name: "Knight",
          combatLevel: 53,
          options: [
            { label: "Pickpocket", actionId: "pickpocket", priority: 5, requiredDistance: 1 },
            { label: "Attack", actionId: "attack", priority: 20, requiredDistance: 1 },
          ],
        };
      }
      if (id === "boss") {
        return {
          name: "Old Warden",
          combatLevel: 140,
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
    getItem: (id: string) => {
      if (id === "coins") {
        return { name: "Coins" };
      }
      if (id === "pennywrought_pickaxe") {
        return { name: "Pennywrought Pickaxe" };
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
      expect(interpreter.getDefaultAction(entity)).toBe("attack");
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

  describe("getDefaultActionLabel", () => {
    it("returns the formatted attack label for a combat NPC", () => {
      const entity = { entityId: 11, kind: "npc" as const, defId: "goblin", distance: 1 };
      expect(interpreter.getDefaultActionLabel(entity)).toBe("Attack Goblin (level-2)");
    });

    it("returns the content label for an object", () => {
      const entity = { entityId: 20, kind: "object" as const, defId: "tree_oak", distance: 1 };
      expect(interpreter.getDefaultActionLabel(entity)).toBe("Chop");
    });

    it("returns the formatted pickup label for a ground item", () => {
      const entity = {
        entityId: 30,
        kind: "groundItem" as const,
        itemId: "pennywrought_pickaxe",
        quantity: 1,
        distance: 1,
      };
      expect(interpreter.getDefaultActionLabel(entity)).toBe("Pick up Pennywrought Pickaxe");
    });

    it("returns the name for a player", () => {
      const entity = { entityId: 42, kind: "player" as const, defId: "hero", distance: 1 };
      expect(interpreter.getDefaultActionLabel(entity)).toBe("hero");
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

    it("formats NPC labels with name and combat level", () => {
      const entity = { entityId: 11, kind: "npc" as const, defId: "goblin", distance: 1 };
      const options = interpreter.getContextMenuOptions(entity, { x: 10, y: 20 });
      const labels = options.map((o) => o.label);
      expect(labels).toContain("Attack Goblin (level-2)");
      expect(labels).toContain("Examine Goblin (level-2)");
    });

    it("formats non-combat NPC labels with name and level suffix on every row", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const options = interpreter.getContextMenuOptions(entity, { x: 10, y: 20 });
      const labels = options.map((o) => o.label);
      expect(labels).toContain("Talk-to Guard (level-21)");
      expect(labels).toContain("Examine Guard (level-21)");
      expect(labels).toContain("Attack Guard (level-21)");
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

    it("uses the item display name for ground item labels", () => {
      const entity = {
        entityId: 31,
        kind: "groundItem" as const,
        itemId: "pennywrought_pickaxe",
        quantity: 1,
        distance: 1,
      };
      const options = interpreter.getContextMenuOptions(entity, { x: 10, y: 20 });
      const labels = options.map((o) => o.label);
      expect(labels).toContain("Pick up Pennywrought Pickaxe");
      expect(labels).toContain("Examine Pennywrought Pickaxe");
    });

    it("only shows walk_here when no entity", () => {
      const options = interpreter.getContextMenuOptions(null, { x: 10, y: 20 });
      expect(options.map((o) => o.actionId)).toEqual(["walk_here"]);
    });

    it("appends NPC name and combat level to attackable NPC options (OSRS Choose Option)", () => {
      const entity = { entityId: 11, kind: "npc" as const, defId: "goblin", distance: 1 };
      const options = interpreter.getContextMenuOptions(
        entity,
        { x: 1, y: 2 },
        {
          playerCombatLevel: 3,
        },
      );
      const labels = options.map((o) => o.label);
      expect(labels).toContain("Attack Goblin (level-2)");
      expect(labels).toContain("Walk here");
      expect(labels).toContain("Examine Goblin (level-2)");
      // OSRS order: Attack (left-clickable) > Walk here > Examine.
      expect(options.map((o) => o.actionId)).toEqual(["attack", "walk_here", "examine"]);
    });

    it("colors the NPC name yellow and the level suffix by level difference", () => {
      const entity = { entityId: 11, kind: "npc" as const, defId: "goblin", distance: 1 };
      const options = interpreter.getContextMenuOptions(
        entity,
        { x: 1, y: 2 },
        {
          playerCombatLevel: 3,
        },
      );
      // Goblin is level 2, player is 3 → diff -1 → yellow-green (#80ff00).
      const attack = options.find((o) => o.actionId === "attack");
      expect(attack?.parts).toEqual([
        { text: "Attack " },
        { text: "Goblin", color: "#ffff00" },
        { text: " (level-2)", color: "#80ff00" },
      ]);
      const examine = options.find((o) => o.actionId === "examine");
      expect(examine?.parts).toEqual([
        { text: "Examine " },
        { text: "Goblin", color: "#ffff00" },
        { text: " (level-2)", color: "#80ff00" },
      ]);
      // "Walk here" is a generic tile action with no entity name to highlight,
      // but it still carries a plain white parts array for consistent rendering.
      const walkParts = options.find((o) => o.actionId === "walk_here")?.parts;
      expect(walkParts).toEqual([{ text: "Walk here", color: "#ffffff" }]);
    });

    it("tints the level suffix across OSRS color tiers by level difference", () => {
      const entity = (defId: string) => ({
        entityId: 11,
        kind: "npc" as const,
        defId,
        distance: 1,
      });
      // goblin is level 2: player 2 → diff 0 → true yellow.
      const equal = interpreter.getContextMenuOptions(
        entity("goblin"),
        { x: 1, y: 2 },
        {
          playerCombatLevel: 2,
        },
      );
      const equalSuffix = equal.find((o) => o.actionId === "examine")?.parts?.[2];
      expect(equalSuffix?.color).toBe("#ffff00");
      // goblin is level 2: player 50 → diff -48 → deep green.
      const deepGreen = interpreter.getContextMenuOptions(
        entity("goblin"),
        { x: 1, y: 2 },
        {
          playerCombatLevel: 50,
        },
      );
      const deepGreenSuffix = deepGreen.find((o) => o.actionId === "examine")?.parts?.[2];
      expect(deepGreenSuffix?.color).toBe("#00ff00");
      // guard is level 21: player 3 → diff +18 → dark orange.
      const darkOrange = interpreter.getContextMenuOptions(
        entity("guard"),
        { x: 1, y: 2 },
        {
          playerCombatLevel: 3,
        },
      );
      const darkOrangeSuffix = darkOrange.find((o) => o.actionId === "examine")?.parts?.[2];
      expect(darkOrangeSuffix?.color).toBe("#ff4000");
    });
  });

  describe("interpretCanvasClick", () => {
    it("chooses content-driven default for NPC", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const decision = interpreter.interpretCanvasClick(entity, null, null, undefined, undefined);
      expect(decision).toEqual({ type: "npcOption", entityId: 10, actionId: "attack" });
    });

    it("chooses content-driven default for object", () => {
      const entity = { entityId: 20, kind: "object" as const, defId: "tree_oak", distance: 1 };
      const decision = interpreter.interpretCanvasClick(entity, null, null, undefined, undefined);
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
      const decision = interpreter.interpretCanvasClick(entity, null, null, undefined, undefined);
      expect(decision).toEqual({ type: "groundItemOption", entityId: 30, actionId: "pickup" });
    });

    it("chooses walk for empty tile", () => {
      const decision = interpreter.interpretCanvasClick(
        null,
        { x: 15, y: 25 },
        null,
        undefined,
        undefined,
      );
      expect(decision).toEqual({ type: "move", tile: { x: 15, y: 25, plane: 0 } });
    });

    it("chooses move for player with tile", () => {
      const entity = { entityId: 42, kind: "player" as const, defId: "hero", distance: 1 };
      const decision = interpreter.interpretCanvasClick(
        entity,
        null,
        { x: 30, y: 32, plane: 0 },
        undefined,
        undefined,
      );
      expect(decision).toEqual({ type: "move", tile: { x: 30, y: 32, plane: 0 } });
    });

    it("chooses none for player without tile", () => {
      const entity = { entityId: 42, kind: "player" as const, defId: "hero", distance: 1 };
      const decision = interpreter.interpretCanvasClick(entity, null, null, undefined, undefined);
      expect(decision).toEqual({ type: "none" });
    });

    it("chooses cast spell when in spell target mode", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const decision = interpreter.interpretCanvasClick(
        entity,
        null,
        null,
        {
          spellId: "wind_strike",
        },
        undefined,
      );
      expect(decision.type).toBe("castSpell");
      expect(decision).toMatchObject({
        type: "castSpell",
        spellId: "wind_strike",
        target: { kind: "entity", entityId: 10 },
      });
    });

    it("chooses cast spell with tile target when no entity", () => {
      const tile = { x: 10, y: 20 };
      const decision = interpreter.interpretCanvasClick(
        null,
        tile,
        null,
        {
          spellId: "wind_strike",
        },
        undefined,
      );
      expect(decision.type).toBe("castSpell");
      expect(decision).toMatchObject({
        type: "castSpell",
        spellId: "wind_strike",
        target: { kind: "tile", tile: { x: 10, y: 20, plane: 0 } },
      });
    });

    it("uses Walk here when attack is demoted below movement", () => {
      const local = new InputInterpreter(createMockResolver(), { npcAttack: "always-right-click" });
      const entity = { entityId: 10, kind: "npc" as const, defId: "goblin", distance: 1 };
      const decision = local.interpretCanvasClick(
        entity,
        { x: 15, y: 25 },
        null,
        undefined,
        undefined,
      );
      expect(decision).toEqual({ type: "move", tile: { x: 15, y: 25, plane: 0 } });
    });

    it("chooses useItemOn with entity target when in item target mode", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const decision = interpreter.interpretCanvasClick(entity, null, null, undefined, {
        itemUid: 5,
      });
      expect(decision).toEqual({
        type: "useItemOn",
        itemUid: 5,
        target: { kind: "entity", entityId: 10 },
      });
    });

    it("chooses useItemOn with tile target when in item target mode and no entity", () => {
      const decision = interpreter.interpretCanvasClick(null, { x: 7, y: 8 }, null, undefined, {
        itemUid: 3,
      });
      expect(decision).toEqual({
        type: "useItemOn",
        itemUid: 3,
        target: { kind: "tile", tile: { x: 7, y: 8, plane: 0 } },
      });
    });
  });

  describe("NPC attack menu priority", () => {
    it("left-clicks attack when setting is left-click where available", () => {
      const local = new InputInterpreter(createMockResolver(), {
        npcAttack: "left-click-where-available",
      });
      const entity = { entityId: 11, kind: "npc" as const, defId: "goblin", distance: 1 };
      expect(
        local.interpretCanvasClick(entity, { x: 1, y: 2 }, null, undefined, undefined),
      ).toEqual({
        type: "npcOption",
        entityId: 11,
        actionId: "attack",
      });
    });

    it("hides attack and lets skilling actions become top entry", () => {
      const local = new InputInterpreter(createMockResolver(), { npcAttack: "hidden" });
      const entity = { entityId: 12, kind: "npc" as const, defId: "knight", distance: 1 };
      const options = local.getContextMenuOptions(entity, { x: 1, y: 2 });
      expect(options.map((option) => option.actionId)).not.toContain("attack");
      expect(
        local.interpretCanvasClick(entity, { x: 1, y: 2 }, null, undefined, undefined),
      ).toEqual({
        type: "npcOption",
        entityId: 12,
        actionId: "pickpocket",
      });
    });

    it("depends on combat levels with equal-or-lower NPCs left-clickable", () => {
      const local = new InputInterpreter(createMockResolver(), {
        npcAttack: "depends-on-combat-levels",
      });
      const entity = { entityId: 13, kind: "npc" as const, defId: "guard", distance: 1 };
      expect(
        local.interpretCanvasClick(entity, { x: 1, y: 2 }, null, undefined, undefined, {
          playerCombatLevel: 21,
        }),
      ).toEqual({ type: "npcOption", entityId: 13, actionId: "attack" });
    });

    it("depends on combat levels with higher NPCs requiring explicit menu attack", () => {
      const local = new InputInterpreter(createMockResolver(), {
        npcAttack: "depends-on-combat-levels",
      });
      const entity = { entityId: 14, kind: "npc" as const, defId: "guard", distance: 1 };
      expect(
        local.interpretCanvasClick(entity, { x: 1, y: 2 }, null, undefined, undefined, {
          playerCombatLevel: 20,
        }),
      ).toEqual({ type: "npcOption", entityId: 14, actionId: "talk" });
    });

    it("depends on combat levels left-clicks bosses above max player combat", () => {
      const local = new InputInterpreter(createMockResolver(), {
        npcAttack: "depends-on-combat-levels",
      });
      const entity = { entityId: 15, kind: "npc" as const, defId: "boss", distance: 1 };
      expect(
        local.interpretCanvasClick(entity, { x: 1, y: 2 }, null, undefined, undefined, {
          playerCombatLevel: 3,
        }),
      ).toEqual({ type: "npcOption", entityId: 15, actionId: "attack" });
    });

    it("applies menu swaps after vanilla settings", () => {
      const local = new InputInterpreter(createMockResolver(), {
        npcAttack: "left-click-where-available",
        menuSwaps: [{ actionId: "walk_here", priority: 200, entityKind: "npc" }],
      });
      const entity = { entityId: 16, kind: "npc" as const, defId: "goblin", distance: 1 };
      expect(
        local.interpretCanvasClick(entity, { x: 1, y: 2 }, null, undefined, undefined),
      ).toEqual({
        type: "move",
        tile: { x: 1, y: 2, plane: 0 },
      });
    });

    it("promotes spell targeting above NPC actions", () => {
      const local = new InputInterpreter(createMockResolver(), {
        npcAttack: "left-click-where-available",
      });
      const entity = { entityId: 17, kind: "npc" as const, defId: "goblin", distance: 1 };
      const options = local.getContextMenuOptions(
        entity,
        { x: 1, y: 2 },
        {
          spellMode: { spellId: "wind_strike" },
        },
      );
      expect(options[0]?.actionId).toBe("cast_spell");
    });
  });

  describe("combat helpers", () => {
    it("uses the OSRS-style attack left-click threshold", () => {
      expect(shouldNpcAttackBeLeftClick(74, 74)).toBe(true);
      expect(shouldNpcAttackBeLeftClick(73, 74)).toBe(false);
      expect(shouldNpcAttackBeLeftClick(3, 127)).toBe(true);
    });

    it("calculates a bounded combat level from visible skills", () => {
      const skills = new Map([
        ["attack", { skillId: "attack", level: 40, xp: 0, effectiveLevel: 40 }],
        ["strength", { skillId: "strength", level: 40, xp: 0, effectiveLevel: 40 }],
        ["defence", { skillId: "defence", level: 30, xp: 0, effectiveLevel: 30 }],
        ["hitpoints", { skillId: "hitpoints", level: 40, xp: 0, effectiveLevel: 40 }],
        ["prayer", { skillId: "prayer", level: 20, xp: 0, effectiveLevel: 20 }],
      ]);
      expect(calculateCombatLevel(skills)).toBeGreaterThan(3);
    });
  });

  describe("combatLevelColor", () => {
    it("returns deep green when NPC is 10+ levels lower", () => {
      expect(combatLevelColor(50, 40)).toBe("#00ff00");
      expect(combatLevelColor(50, 30)).toBe("#00ff00");
    });
    it("returns light green when NPC is 6-9 levels lower", () => {
      expect(combatLevelColor(50, 44)).toBe("#40ff00");
      expect(combatLevelColor(50, 41)).toBe("#40ff00");
    });
    it("returns yellow-green when NPC is 1-5 levels lower", () => {
      expect(combatLevelColor(50, 49)).toBe("#80ff00");
      expect(combatLevelColor(50, 45)).toBe("#80ff00");
    });
    it("returns true yellow when levels are equal", () => {
      expect(combatLevelColor(50, 50)).toBe("#ffff00");
    });
    it("returns yellow-orange when NPC is 1-5 levels higher", () => {
      expect(combatLevelColor(50, 51)).toBe("#ffc000");
      expect(combatLevelColor(50, 55)).toBe("#ffc000");
    });
    it("returns light orange when NPC is 6-10 levels higher", () => {
      expect(combatLevelColor(50, 56)).toBe("#ff8000");
      expect(combatLevelColor(50, 60)).toBe("#ff8000");
    });
    it("returns dark orange when NPC is 11-20 levels higher", () => {
      expect(combatLevelColor(50, 61)).toBe("#ff4000");
      expect(combatLevelColor(50, 70)).toBe("#ff4000");
    });
    it("returns red-orange when NPC is 21-50 levels higher", () => {
      expect(combatLevelColor(50, 71)).toBe("#ff2000");
      expect(combatLevelColor(50, 100)).toBe("#ff2000");
    });
    it("returns deep red when NPC is 51+ levels higher", () => {
      expect(combatLevelColor(50, 101)).toBe("#ff0000");
    });
    it("falls back to yellow when levels are undefined", () => {
      expect(combatLevelColor(undefined, 50)).toBe("#ffff00");
      expect(combatLevelColor(50, undefined)).toBe("#ffff00");
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

    it("chooses useItemOn when use_item_on action is selected with item mode", () => {
      const entity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
      const decision = interpreter.interpretContextMenu(entity, null, "use_item_on", undefined, {
        itemUid: 5,
      });
      expect(decision).toEqual({
        type: "useItemOn",
        itemUid: 5,
        target: { kind: "entity", entityId: 10 },
      });
    });
  });

  describe("interpretEscape", () => {
    it("chooses cancelSpellTarget when in spell mode", () => {
      const decision = interpreter.interpretEscape({ spellId: "wind_strike" }, undefined);
      expect(decision).toEqual({ type: "cancelSpellTarget" });
    });

    it("returns none when not in spell mode", () => {
      const decision = interpreter.interpretEscape(undefined, undefined);
      expect(decision).toEqual({ type: "none" });
    });

    it("chooses cancelItemTarget when in item target mode", () => {
      const decision = interpreter.interpretEscape(undefined, { itemUid: 7 });
      expect(decision).toEqual({ type: "cancelItemTarget" });
    });
  });
});
