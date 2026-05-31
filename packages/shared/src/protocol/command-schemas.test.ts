import { describe, expect, it } from "vitest";
import { parseClientCommand } from "./command-schemas";
import { ClientCommandType } from "./commands";

describe("parseClientCommand — valid commands", () => {
  it("accepts a well-formed move-click command", () => {
    const result = parseClientCommand({
      type: ClientCommandType.MoveClick,
      commandId: 1,
      payload: { dest: { x: 10, y: 20, plane: 0 } },
    });
    expect(result.ok).toBe(true);
  });

  it("accepts each intent type", () => {
    const samples: unknown[] = [
      { type: "C2S_OBJECT_OPTION", commandId: 2, payload: { objectEntityId: 5, actionId: "chop" } },
      { type: "C2S_NPC_OPTION", commandId: 3, payload: { npcEntityId: 6, actionId: "attack" } },
      { type: "C2S_ITEM_OPTION", commandId: 4, payload: { itemUid: 7, actionId: "eat" } },
      {
        type: "C2S_GROUND_ITEM_OPTION",
        commandId: 4,
        payload: { groundItemEntityId: 9, actionId: "pickup" },
      },
      {
        type: "C2S_CAST_SPELL",
        commandId: 5,
        payload: { spellId: "wind_dart", target: { kind: "entity", entityId: 8 } },
      },
      { type: "C2S_CHAT", commandId: 6, payload: { text: "hello town" } },
      { type: "C2S_UI_ACTION", commandId: 7, payload: { action: "open_panel" } },
      { type: "C2S_PING", commandId: 8, payload: { clientTimeMs: 1700000000000 } },
    ];
    for (const sample of samples) {
      expect(parseClientCommand(sample).ok).toBe(true);
    }
  });

  it("accepts an optional clientTickHint", () => {
    const result = parseClientCommand({
      type: ClientCommandType.Ping,
      commandId: 9,
      clientTickHint: 42,
      payload: { clientTimeMs: 1 },
    });
    expect(result.ok).toBe(true);
  });
});

describe("parseClientCommand — rejects malformed input", () => {
  it("rejects an unknown command type", () => {
    expect(parseClientCommand({ type: "C2S_GRANT_ITEM", commandId: 1, payload: {} }).ok).toBe(
      false,
    );
  });

  it("rejects an invalid tile shape (bad plane)", () => {
    const result = parseClientCommand({
      type: ClientCommandType.MoveClick,
      commandId: 1,
      payload: { dest: { x: 1, y: 2, plane: 5 } },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-integer tile coordinate", () => {
    const result = parseClientCommand({
      type: ClientCommandType.MoveClick,
      commandId: 1,
      payload: { dest: { x: 1.5, y: 2, plane: 0 } },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a negative entity id", () => {
    const result = parseClientCommand({
      type: ClientCommandType.NpcOption,
      commandId: 1,
      payload: { npcEntityId: -3, actionId: "talk" },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a hyphenated actionId (label leak)", () => {
    const result = parseClientCommand({
      type: ClientCommandType.NpcOption,
      commandId: 1,
      payload: { npcEntityId: 5, actionId: "talk-to" },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing commandId", () => {
    const result = parseClientCommand({
      type: ClientCommandType.Chat,
      payload: { text: "hi" },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects malformed chat payloads", () => {
    expect(
      parseClientCommand({
        type: ClientCommandType.Chat,
        commandId: 1,
        payload: { text: "" },
      }).ok,
    ).toBe(false);
    expect(
      parseClientCommand({
        type: ClientCommandType.Chat,
        commandId: 2,
        payload: { text: "hi", tile: { x: 1, y: 1, plane: 0 } },
      }).ok,
    ).toBe(false);
  });
});

describe("commands express intent only (server authority)", () => {
  it("rejects extra fields smuggled into the envelope", () => {
    const result = parseClientCommand({
      type: ClientCommandType.MoveClick,
      commandId: 1,
      payload: { dest: { x: 1, y: 1, plane: 0 } },
      grantItem: "penny_sword",
      xp: 99999,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects extra fields smuggled into a payload (e.g. setting hp)", () => {
    const result = parseClientCommand({
      type: ClientCommandType.ItemOption,
      commandId: 1,
      payload: { itemUid: 1, actionId: "eat", hp: 9999 },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a tile coordinate carrying extra positional override fields", () => {
    const result = parseClientCommand({
      type: ClientCommandType.MoveClick,
      commandId: 1,
      payload: { dest: { x: 1, y: 1, plane: 0, trueX: 999 } },
    });
    expect(result.ok).toBe(false);
  });
});
