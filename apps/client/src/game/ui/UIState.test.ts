import { describe, expect, it } from "vitest";
import { UIState } from "./UIState";

describe("UIState", () => {
  it("sets inventory from full snapshot", () => {
    const state = new UIState();
    state.setInventory({
      containerId: "inv:1",
      changes: [
        { slot: 0, itemId: "axe", quantity: 1 },
        { slot: 1, itemId: "log", quantity: 5 },
      ],
    });

    expect(state.inventory.get(0)).toEqual({ slot: 0, itemId: "axe", quantity: 1 });
    expect(state.inventory.get(1)).toEqual({ slot: 1, itemId: "log", quantity: 5 });
  });

  it("applies inventory delta — add, update, remove", () => {
    const state = new UIState();
    state.setInventory({
      containerId: "inv:1",
      changes: [{ slot: 0, itemId: "axe", quantity: 1 }],
    });

    state.applyInventoryDelta({
      containerId: "inv:1",
      changes: [
        { slot: 0, itemId: "axe", quantity: 2 },
        { slot: 1, itemId: "log", quantity: 3 },
        { slot: 2, itemId: null, quantity: 0 },
      ],
    });

    expect(state.inventory.get(0)?.quantity).toBe(2);
    expect(state.inventory.get(1)?.itemId).toBe("log");
    expect(state.inventory.has(2)).toBe(false);
  });

  it("sets skills from full snapshot", () => {
    const state = new UIState();
    state.setSkills([
      { skillId: "woodcutting", level: 1, xp: 0, effectiveLevel: 1 },
      { skillId: "mining", level: 5, xp: 388, effectiveLevel: 5 },
    ]);

    expect(state.skills.get("woodcutting")).toEqual({
      skillId: "woodcutting",
      level: 1,
      xp: 0,
      effectiveLevel: 1,
    });
    expect(state.skills.get("mining")?.xp).toBe(388);
  });

  it("applies skill delta — updates existing skill", () => {
    const state = new UIState();
    state.setSkills([{ skillId: "woodcutting", level: 1, xp: 0, effectiveLevel: 1 }]);
    state.applySkillDelta([{ skillId: "woodcutting", level: 2, xp: 83, effectiveLevel: 2 }]);

    expect(state.skills.get("woodcutting")).toEqual({
      skillId: "woodcutting",
      level: 2,
      xp: 83,
      effectiveLevel: 2,
    });
  });

  it("sets vars from full snapshot", () => {
    const state = new UIState();
    state.setVars([
      { varId: "quest.smoke.stage", value: 1 },
      { varId: "quest.smoke.started", value: true },
      { varId: "quest.smoke.lastSpeaker", value: "baker" },
    ]);

    expect(state.vars.get("quest.smoke.stage")).toBe(1);
    expect(state.vars.get("quest.smoke.started")).toBe(true);
    expect(state.vars.get("quest.smoke.lastSpeaker")).toBe("baker");
  });

  it("applies varbit delta", () => {
    const state = new UIState();
    state.setVars([{ varId: "quest.smoke.stage", value: 0 }]);
    state.applyVarbitDelta([{ varId: "quest.smoke.stage", value: 2 }]);

    expect(state.vars.get("quest.smoke.stage")).toBe(2);
  });

  it("tracks active dialogue from server packets", () => {
    const state = new UIState();
    state.setDialogue({
      dialogueId: "baker_dialogue",
      nodeId: "start",
      speakerName: "Baker",
      npcText: "Hello.",
      options: [{ index: 0, text: "Continue" }],
    });

    expect(state.dialogue?.speakerName).toBe("Baker");
    state.clearDialogue();
    expect(state.dialogue).toBeUndefined();
  });

  it("accumulates chat messages up to a cap", () => {
    const state = new UIState();
    const messages = Array.from({ length: 250 }, (_, i) => ({
      text: `msg${i}`,
      channel: "public" as const,
      serverTime: i,
    }));

    state.addChat(messages);
    expect(state.chat.length).toBe(200);
    expect(state.chat[0]?.text).toBe("msg50");
  });

  it("notifies listeners on change", () => {
    const state = new UIState();
    let calls = 0;
    const unsubscribe = state.onChange(() => {
      calls += 1;
    });

    state.setSkills([{ skillId: "woodcutting", level: 1, xp: 0, effectiveLevel: 1 }]);
    expect(calls).toBe(1);

    state.applySkillDelta([{ skillId: "woodcutting", level: 2, xp: 83, effectiveLevel: 2 }]);
    expect(calls).toBe(2);

    unsubscribe();
    state.setSkills([]);
    expect(calls).toBe(2);
  });

  it("clearChat resets chat and notifies", () => {
    const state = new UIState();
    let called = false;
    state.onChange(() => {
      called = true;
    });

    state.addChat([{ text: "hello", channel: "public", serverTime: 0 }]);
    expect(state.chat.length).toBe(1);

    state.clearChat();
    expect(state.chat.length).toBe(0);
    expect(called).toBe(true);
  });
});
