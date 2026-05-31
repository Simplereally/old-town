import { entityId } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { type ActionQueueEntry, ActionQueueType, InterruptGroup } from "./action-queue";
import { ActionRuntime } from "./action-runtime";

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

describe("ActionRuntime", () => {
  it("enqueues and advances actions through the owned queue", () => {
    const runtime = new ActionRuntime();
    runtime.enqueue(action({ delayTicks: 2 }));

    expect(runtime.advanceTick()).toEqual([]);
    const executed = runtime.advanceTick();

    expect(executed).toHaveLength(1);
    expect(executed[0]?.entry.id).toBe("action-1");
    expect(runtime.getDebugState()).toEqual([]);
  });

  it("cancels weak actions by owner", () => {
    const runtime = new ActionRuntime();
    runtime.enqueue(action({ id: "weak-1" }));
    runtime.cancel(owner, { type: ActionQueueType.Weak });

    expect(runtime.getDebugState()).toEqual([]);
  });

  it("strong actions clear weak actions for the same owner", () => {
    const runtime = new ActionRuntime();
    runtime.enqueue(action({ id: "weak-1", type: ActionQueueType.Weak }));
    runtime.enqueue(action({ id: "strong-1", type: ActionQueueType.Strong }));

    expect(runtime.getDebugState().map((entry) => entry.id)).toEqual(["strong-1"]);
  });

  it("interrupts by group remove matching weak actions", () => {
    const runtime = new ActionRuntime();
    runtime.enqueue(action({ id: "skilling", interruptGroup: InterruptGroup.Skilling }));
    runtime.enqueue(action({ id: "combat", interruptGroup: InterruptGroup.Combat }));

    expect(runtime.interrupt(owner, InterruptGroup.Skilling)).toBe(1);
    expect(runtime.getDebugState().map((entry) => entry.id)).toEqual(["combat"]);
  });
});
