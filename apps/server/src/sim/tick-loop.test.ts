import { GAME_TICK_MS } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { TICK_PHASE_ORDER, TickLoop, TickLoopError, TickPhase } from "./tick-loop";

describe("TickLoop", () => {
  it("advances exact 600ms ticks from fake time", () => {
    const loop = new TickLoop();

    expect(loop.runDueTicks(GAME_TICK_MS - 1)).toBe(0);
    expect(loop.currentTick).toBe(0);
    expect(loop.currentServerTime).toBe(0);

    expect(loop.runDueTicks(GAME_TICK_MS * 3)).toBe(3);
    expect(loop.currentTick).toBe(3);
    expect(loop.currentServerTime).toBe(GAME_TICK_MS * 3);

    expect(loop.runDueTicks(GAME_TICK_MS * 3 + GAME_TICK_MS - 1)).toBe(0);
    expect(loop.runDueTicks(GAME_TICK_MS * 4)).toBe(1);
    expect(loop.currentTick).toBe(4);
  });

  it("runs registered handlers in the fixed spec phase order", () => {
    const loop = new TickLoop();
    const seen: TickPhase[] = [];

    for (const phase of [...TICK_PHASE_ORDER].reverse()) {
      loop.registerPhase(phase, (context) => {
        seen.push(context.phase);
        expect(context.tick).toBe(1);
        expect(context.serverTime).toBe(GAME_TICK_MS);
      });
    }

    loop.runOneTick();

    expect(seen).toEqual(TICK_PHASE_ORDER);
  });

  it("keeps handler registration order within a phase", () => {
    const loop = new TickLoop();
    const seen: number[] = [];

    loop.registerPhase(TickPhase.Movement, () => seen.push(1));
    loop.registerPhase(TickPhase.Movement, () => seen.push(2));

    loop.runOneTick();

    expect(seen).toEqual([1, 2]);
  });

  it("logs phase errors and fails deterministically", () => {
    const logs: unknown[] = [];
    const loop = new TickLoop({
      logger: {
        error: (_topic, _message, metadata) => logs.push(metadata),
      },
    });
    const seen: TickPhase[] = [];

    loop.registerPhase(TickPhase.InputClose, (context) => seen.push(context.phase));
    loop.registerPhase(TickPhase.Movement, () => {
      throw new Error("movement exploded");
    });
    loop.registerPhase(TickPhase.TargetValidation, (context) => seen.push(context.phase));

    expect(() => loop.runOneTick()).toThrow(TickLoopError);
    expect(logs).toEqual([{ phase: TickPhase.Movement, tick: 1 }]);
    expect(seen).toEqual([TickPhase.InputClose]);
  });
});
