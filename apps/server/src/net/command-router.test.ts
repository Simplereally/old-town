import { ClientCommandType, entityId } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { CommandBuffer } from "../sim/command-buffer";
import { CommandRouter } from "./command-router";

const session = { id: "session-1", characterId: "dev-a" };

describe("CommandRouter", () => {
  it("routes accepted commands into the next tick buffer", () => {
    const commandBuffer = new CommandBuffer();
    const router = new CommandRouter({
      commandBuffer,
      getEntityId: () => entityId(7),
      getCurrentTick: () => 3,
    });

    expect(
      router.route(session, {
        type: ClientCommandType.MoveClick,
        commandId: 1,
        payload: { dest: { x: 1, y: 0, plane: 0 } },
      }),
    ).toEqual({ ok: true });

    const consumed = router.consumeTick(4);
    expect(consumed.groups[0]?.ownerEntityId).toBe(7);
    expect(consumed.groups[0]?.intents[0]?.kind).toBe("move");
  });

  it("rejects duplicates and per-tick spam", () => {
    const commandBuffer = new CommandBuffer();
    const router = new CommandRouter({
      commandBuffer,
      getEntityId: () => entityId(7),
      getCurrentTick: () => 0,
      spamCapPerTick: 2,
    });
    const command = {
      type: ClientCommandType.MoveClick,
      commandId: 1,
      payload: { dest: { x: 1, y: 0, plane: 0 } },
    } as const;

    expect(router.route(session, command)).toEqual({ ok: true });
    expect(router.route(session, command)).toEqual({ ok: false, reason: "duplicate" });

    expect(
      router.route(session, {
        ...command,
        commandId: 2,
      }),
    ).toEqual({ ok: true });
    expect(
      router.route(session, {
        ...command,
        commandId: 3,
      }),
    ).toEqual({ ok: false, reason: "spam_cap" });
  });
});
