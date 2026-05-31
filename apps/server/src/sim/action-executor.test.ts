import { entityId } from "@old-town/shared";
import { describe, expect, it, vi } from "vitest";
import { ActionExecutor } from "./action-executor";
import { ActionQueue, ActionQueueType, InterruptGroup } from "./action-queue";

const owner = entityId(1);

function mockCancel() {
  return 0;
}

describe("ActionExecutor", () => {
  it("dispatches matching handler by payload kind", () => {
    const queue = new ActionQueue();
    const handler = vi.fn();
    const executor = new ActionExecutor({ test: handler }, mockCancel);

    queue.enqueue({
      id: "test-action",
      owner,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "test" },
    });

    const executions = queue.advanceTick();
    executor.execute(executions, { tick: 1, serverTime: 600 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "test" }),
      expect.objectContaining({ tick: 1, serverTime: 600 }),
    );
  });

  it("silently ignores unhandled kinds without throwing", () => {
    const queue = new ActionQueue();
    const executor = new ActionExecutor({}, mockCancel);

    queue.enqueue({
      id: "unknown-action",
      owner,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "unknown" },
    });

    const executions = queue.advanceTick();
    expect(() => executor.execute(executions, { tick: 1, serverTime: 600 })).not.toThrow();
  });

  it("isolates handler throws per-action, continuing to next", () => {
    const queue = new ActionQueue();
    const badHandler = vi.fn().mockImplementation(() => {
      throw new Error("boom");
    });
    const goodHandler = vi.fn();
    const cancel = vi.fn((owner, filter) => queue.cancel(owner, filter));
    const executor = new ActionExecutor({ bad: badHandler, good: goodHandler }, cancel);

    queue.enqueue({
      id: "bad-action",
      owner,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "bad" },
    });
    queue.enqueue({
      id: "good-action",
      owner,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "good" },
    });

    const executions = queue.advanceTick();
    executor.execute(executions, { tick: 1, serverTime: 600 });

    expect(badHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith(owner, { id: "bad-action" });
  });

  it("self-cancels a poisoned repeating action via the injected callback", () => {
    const queue = new ActionQueue();
    const handler = vi.fn().mockImplementation(() => {
      throw new Error("boom");
    });
    const cancel = vi.fn((owner, filter) => queue.cancel(owner, filter));
    const executor = new ActionExecutor({ repeat: handler }, cancel);

    queue.enqueue({
      id: "repeat-action",
      owner,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      repeat: { intervalTicks: 1 },
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "repeat" },
    });

    // First tick: delay expires, first execution
    const first = queue.advanceTick();
    executor.execute(first, { tick: 1, serverTime: 600 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith(owner, { id: "repeat-action" });

    // Second tick: repeat would fire, but handler was cancelled
    const second = queue.advanceTick();
    executor.execute(second, { tick: 2, serverTime: 1200 });
    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
  });
});
