import { ClientCommandType, entityId } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { CommandBuffer, IntentKind } from "./command-buffer";

const player = entityId(1);

function source(targetTick: number, ownerEntityId = player) {
  return {
    ownerEntityId,
    connectionId: "conn-1",
    receivedTick: targetTick - 1,
    targetTick,
  };
}

describe("CommandBuffer", () => {
  it("accepts validated commands and normalizes them into intents", () => {
    const buffer = new CommandBuffer();

    const result = buffer.accept(
      {
        type: ClientCommandType.MoveClick,
        commandId: 10,
        payload: { dest: { x: 12, y: 34, plane: 0 } },
      },
      source(1),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.intent).toEqual({
      kind: IntentKind.Move,
      ownerEntityId: player,
      connectionId: "conn-1",
      commandId: 10,
      receivedTick: 0,
      targetTick: 1,
      payload: { dest: { x: 12, y: 34, plane: 0 } },
    });

    const consumed = buffer.consumeTick(1);
    expect(consumed.groups).toEqual([
      {
        ownerEntityId: player,
        intents: [result.intent],
      },
    ]);
    expect(buffer.pendingCount).toBe(0);
  });

  it("keeps commands closed until their deterministic tick boundary", () => {
    const buffer = new CommandBuffer();
    buffer.accept(
      {
        type: ClientCommandType.Chat,
        commandId: 11,
        payload: { text: "hello" },
      },
      source(2),
    );

    expect(buffer.consumeTick(1).groups).toEqual([]);
    const consumed = buffer.consumeTick(2);

    expect(consumed.groups).toHaveLength(1);
    expect(consumed.groups[0]?.intents[0]?.kind).toBe(IntentKind.Chat);
  });

  it("rejects malformed commands before they can reach simulation systems", () => {
    const buffer = new CommandBuffer();

    const result = buffer.accept(
      {
        type: ClientCommandType.MoveClick,
        commandId: 12,
        payload: { dest: { x: 1, y: 2, plane: 9 } },
      },
      source(1),
    );

    expect(result).toMatchObject({ ok: false, reason: "malformed" });
    expect(buffer.pendingCount).toBe(0);
  });

  it("rejects duplicate command ids per connection and player", () => {
    const buffer = new CommandBuffer();
    const command = {
      type: ClientCommandType.Ping,
      commandId: 13,
      payload: { clientTimeMs: 100 },
    };

    expect(buffer.accept(command, source(1)).ok).toBe(true);
    expect(buffer.accept(command, source(1))).toEqual({ ok: false, reason: "duplicate" });

    const otherPlayer = buffer.accept(command, source(1, entityId(2)));
    expect(otherPlayer.ok).toBe(true);
  });

  it("rejects commands for an already closed tick", () => {
    const buffer = new CommandBuffer();

    expect(buffer.consumeTick(1).groups).toEqual([]);
    const result = buffer.accept(
      {
        type: ClientCommandType.NpcOption,
        commandId: 14,
        payload: { npcEntityId: 5, option: "talk" },
      },
      source(1),
    );

    expect(result).toEqual({ ok: false, reason: "late" });
    expect(buffer.pendingCount).toBe(0);
  });
});
