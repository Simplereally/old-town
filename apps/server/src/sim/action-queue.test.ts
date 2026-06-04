import { entityId } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  ActionQueue,
  type ActionQueueEntry,
  ActionQueueType,
  InterruptGroup,
} from "./action-queue";

const owner = entityId(1);

function action(
  overrides: Partial<ActionQueueEntry<{ kind: string }>> = {},
): ActionQueueEntry<{ kind: string }> {
  return {
    id: "action-1",
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    interruptGroup: InterruptGroup.Skilling,
    payload: { kind: "test" },
    ...overrides,
  };
}

describe("ActionQueue", () => {
  it("executes actions after tick delays without timers", () => {
    const queue = new ActionQueue();
    queue.enqueue(action({ delayTicks: 2 }));

    expect(queue.advanceTick()).toEqual([]);
    const executed = queue.advanceTick();

    expect(executed).toHaveLength(1);
    expect(executed[0]?.entry.id).toBe("action-1");
    expect(queue.getDebugState()).toEqual([]);
  });

  it("cancels weak actions by interruption group", () => {
    const queue = new ActionQueue();
    queue.enqueue(action({ id: "skilling", interruptGroup: InterruptGroup.Skilling }));
    queue.enqueue(action({ id: "combat", interruptGroup: InterruptGroup.Combat }));

    expect(queue.interrupt(owner, InterruptGroup.Skilling)).toBe(1);

    expect(queue.getDebugState().map((entry) => entry.id)).toEqual(["combat"]);
  });

  it("cancels actions by owner and type filter", () => {
    const queue = new ActionQueue();
    queue.enqueue(action({ id: "weak-1", type: ActionQueueType.Weak }));
    queue.enqueue(action({ id: "normal-1", type: ActionQueueType.Normal }));

    expect(queue.cancel(owner, { type: ActionQueueType.Weak })).toBe(1);

    expect(queue.getDebugState().map((entry) => entry.id)).toEqual(["normal-1"]);
  });

  it("strong actions clear weak actions for the same owner", () => {
    const queue = new ActionQueue();
    queue.enqueue(action({ id: "weak-1", type: ActionQueueType.Weak }));
    queue.enqueue(action({ id: "normal-1", type: ActionQueueType.Normal }));
    queue.enqueue(action({ id: "strong-1", type: ActionQueueType.Strong }));

    expect(queue.getDebugState().map((entry) => entry.id)).toEqual(["normal-1", "strong-1"]);
  });

  it("soft actions survive interrupts and execute when due", () => {
    const queue = new ActionQueue();
    queue.enqueue(
      action({
        id: "soft-hit",
        type: ActionQueueType.Soft,
        interruptGroup: InterruptGroup.Combat,
      }),
    );

    expect(queue.interrupt(owner, InterruptGroup.Combat)).toBe(0);
    expect(queue.advanceTick().map((execution) => execution.entry.id)).toEqual(["soft-hit"]);
  });

  it("pauses normal actions for blocked modal owners", () => {
    const queue = new ActionQueue();
    queue.enqueue(action({ id: "dialogue-choice", type: ActionQueueType.Normal }));

    expect(queue.advanceTick({ blockedOwners: new Set([owner]) })).toEqual([]);
    expect(queue.getDebugState()[0]?.remainingDelayTicks).toBe(1);
    expect(queue.advanceTick().map((execution) => execution.entry.id)).toEqual(["dialogue-choice"]);
  });

  it("repeats actions until the validator fails", () => {
    const queue = new ActionQueue();
    queue.enqueue(
      action({
        id: "woodcutting",
        repeat: { intervalTicks: 1 },
      }),
    );
    const executed: number[] = [];

    for (let i = 0; i < 3; i += 1) {
      const [execution] = queue.advanceTick({
        shouldRepeat: (candidate) => candidate.executionCount < 2,
      });
      if (execution) {
        executed.push(execution.executionCount);
      }
    }

    expect(executed).toEqual([1, 2]);
    expect(queue.getDebugState()).toEqual([]);
  });

  it("caps repeated actions with maxRepeats", () => {
    const queue = new ActionQueue();
    queue.enqueue(
      action({
        id: "limited-repeat",
        repeat: { intervalTicks: 1, maxRepeats: 2 },
      }),
    );

    const executed = [...queue.advanceTick(), ...queue.advanceTick(), ...queue.advanceTick()].map(
      (execution) => execution.executionCount,
    );

    expect(executed).toEqual([1, 2]);
  });
});
