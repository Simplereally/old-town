import {
  ClientCommandType,
  entityId,
  parseClientCommand,
  type SpellTarget,
} from "@old-town/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientCommandDispatcher } from "./ClientCommandDispatcher";

function createMockSocket(): { sendCommand: ReturnType<typeof vi.fn> } {
  return { sendCommand: vi.fn() };
}

function lastCall(socket: { sendCommand: ReturnType<typeof vi.fn> }): unknown {
  const calls = socket.sendCommand.mock.calls as unknown[][];
  return (calls[calls.length - 1] as unknown[])[0];
}

describe("ClientCommandDispatcher", () => {
  let dispatcher: ClientCommandDispatcher;
  let socket: { sendCommand: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    socket = createMockSocket();
    dispatcher = new ClientCommandDispatcher(
      socket as unknown as ConstructorParameters<typeof ClientCommandDispatcher>[0],
    );
  });

  it("commandId increments once per sent command", () => {
    dispatcher.setCurrentTick(5);
    dispatcher.move({ x: 10, y: 20, plane: 0 });
    dispatcher.move({ x: 11, y: 21, plane: 0 });

    const calls = socket.sendCommand.mock.calls as unknown[][];
    expect(calls.length).toBe(2);
    const call1 = (calls[0] as unknown[])[0] as { commandId: number };
    const call2 = (calls[1] as unknown[])[0] as { commandId: number };
    expect(call2.commandId).toBe(call1.commandId + 1);
  });

  it("move emits exact MoveClick packet shape and parses", () => {
    dispatcher.setCurrentTick(7);
    dispatcher.move({ x: 5, y: 10, plane: 0 });

    expect(socket.sendCommand).toHaveBeenCalledWith({
      type: ClientCommandType.MoveClick,
      commandId: 1,
      clientTickHint: 7,
      payload: { dest: { x: 5, y: 10, plane: 0 } },
    });
    expect(parseClientCommand(lastCall(socket)).ok).toBe(true);
  });

  it("npcOption emits exact NpcOption packet shape and parses", () => {
    dispatcher.setCurrentTick(3);
    dispatcher.npcOption(42, "talk");

    expect(socket.sendCommand).toHaveBeenCalledWith({
      type: ClientCommandType.NpcOption,
      commandId: 1,
      clientTickHint: 3,
      payload: { npcEntityId: entityId(42), actionId: "talk" },
    });
    expect(parseClientCommand(lastCall(socket)).ok).toBe(true);
  });

  it("objectOption emits exact ObjectOption packet shape and parses", () => {
    dispatcher.setCurrentTick(4);
    dispatcher.objectOption(20, "chop");

    expect(socket.sendCommand).toHaveBeenCalledWith({
      type: ClientCommandType.ObjectOption,
      commandId: 1,
      clientTickHint: 4,
      payload: { objectEntityId: entityId(20), actionId: "chop" },
    });
    expect(parseClientCommand(lastCall(socket)).ok).toBe(true);
  });

  it("groundItemOption emits exact GroundItemOption packet shape and parses", () => {
    dispatcher.setCurrentTick(2);
    dispatcher.groundItemOption(30, "pickup");

    expect(socket.sendCommand).toHaveBeenCalledWith({
      type: ClientCommandType.GroundItemOption,
      commandId: 1,
      clientTickHint: 2,
      payload: { groundItemEntityId: entityId(30), actionId: "pickup" },
    });
    expect(parseClientCommand(lastCall(socket)).ok).toBe(true);
  });

  it("inventoryItemOption emits exact ItemOption packet shape and parses", () => {
    dispatcher.setCurrentTick(6);
    dispatcher.inventoryItemOption(1001, "equip");

    expect(socket.sendCommand).toHaveBeenCalledWith({
      type: ClientCommandType.ItemOption,
      commandId: 1,
      clientTickHint: 6,
      payload: { itemUid: 1001, actionId: "equip" },
    });
    expect(parseClientCommand(lastCall(socket)).ok).toBe(true);
  });

  it("castSpell emits exact CastSpell packet shape and parses", () => {
    dispatcher.setCurrentTick(8);
    const target: SpellTarget = { kind: "entity", entityId: entityId(10) };
    dispatcher.castSpell("wind_strike", target);

    expect(socket.sendCommand).toHaveBeenCalledWith({
      type: ClientCommandType.CastSpell,
      commandId: 1,
      clientTickHint: 8,
      payload: { spellId: "wind_strike", target },
    });
    expect(parseClientCommand(lastCall(socket)).ok).toBe(true);
  });

  it("chat emits exact Chat packet shape and parses", () => {
    dispatcher.setCurrentTick(9);
    dispatcher.chat("hello world");

    expect(socket.sendCommand).toHaveBeenCalledWith({
      type: ClientCommandType.Chat,
      commandId: 1,
      clientTickHint: 9,
      payload: { text: "hello world" },
    });
    expect(parseClientCommand(lastCall(socket)).ok).toBe(true);
  });

  it("uiAction emits exact UiAction packet shape and parses", () => {
    dispatcher.setCurrentTick(10);
    dispatcher.uiAction("dialogue_option", "node_1", 2);

    expect(socket.sendCommand).toHaveBeenCalledWith({
      type: ClientCommandType.UiAction,
      commandId: 1,
      clientTickHint: 10,
      payload: { action: "dialogue_option", targetId: "node_1", value: 2 },
    });
    expect(parseClientCommand(lastCall(socket)).ok).toBe(true);
  });

  it("uiAction omits undefined targetId and value", () => {
    dispatcher.setCurrentTick(11);
    dispatcher.uiAction("unequip");

    expect(socket.sendCommand).toHaveBeenCalledWith({
      type: ClientCommandType.UiAction,
      commandId: 1,
      clientTickHint: 11,
      payload: { action: "unequip" },
    });
    expect(parseClientCommand(lastCall(socket)).ok).toBe(true);
  });

  it("setCurrentTick sets clientTickHint on subsequent commands", () => {
    dispatcher.setCurrentTick(5);
    dispatcher.move({ x: 1, y: 2, plane: 0 });
    dispatcher.setCurrentTick(6);
    dispatcher.move({ x: 2, y: 3, plane: 0 });

    const calls = socket.sendCommand.mock.calls as unknown[][];
    const call1 = (calls[0] as unknown[])[0] as { clientTickHint: number };
    const call2 = (calls[1] as unknown[])[0] as { clientTickHint: number };
    expect(call1.clientTickHint).toBe(5);
    expect(call2.clientTickHint).toBe(6);
  });

  it("rejects a label token (hyphenated) at the wire boundary", () => {
    dispatcher.setCurrentTick(1);
    dispatcher.npcOption(1, "talk-to");

    const result = parseClientCommand(lastCall(socket));
    expect(result.ok).toBe(false);
  });
});
