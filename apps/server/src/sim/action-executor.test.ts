import { entityId } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { ActionExecutor } from "./action-executor";
import { ActionQueue, ActionQueueType, InterruptGroup } from "./action-queue";

const owner = entityId(1);

describe("ActionExecutor", () => {
  it("returns all executions as unhandled when no handlers are wired", () => {
    const queue = new ActionQueue();
    const executor = new ActionExecutor();

    queue.enqueue({
      id: "test-action",
      owner,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "test" },
    });

    const executions = queue.advanceTick();
    const report = executor.execute(executions);

    expect(report.handled).toEqual([]);
    expect(report.unhandled).toHaveLength(1);
    expect(report.unhandled[0]?.entry.id).toBe("test-action");
  });

  it("does not silently drop multiple executions", () => {
    const queue = new ActionQueue();
    const executor = new ActionExecutor();

    queue.enqueue({
      id: "action-a",
      owner,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "a" },
    });
    queue.enqueue({
      id: "action-b",
      owner,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      interruptGroup: InterruptGroup.Combat,
      payload: { kind: "b" },
    });

    const executions = queue.advanceTick();
    const report = executor.execute(executions);

    expect(report.unhandled).toHaveLength(2);
    const ids = report.unhandled.map((e) => e.entry.id);
    expect(ids).toContain("action-a");
    expect(ids).toContain("action-b");
  });

  it("lastReport is replaced on each execute, not accumulated", () => {
    const queue = new ActionQueue();
    const executor = new ActionExecutor();

    queue.enqueue({
      id: "action-a",
      owner,
      type: ActionQueueType.Weak,
      delayTicks: 1,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "a" },
    });

    const first = queue.advanceTick();
    executor.execute(first);
    expect(executor.lastReport.unhandled).toHaveLength(1);
    expect(executor.lastReport.unhandled[0]?.entry.id).toBe("action-a");

    // Second tick with no new queued actions
    const second = queue.advanceTick();
    executor.execute(second);
    expect(executor.lastReport.unhandled).toEqual([]);
    expect(executor.lastReport.handled).toEqual([]);
  });

  it("accumulates executions across multiple ticks via repeated queue", () => {
    const queue = new ActionQueue();
    const executor = new ActionExecutor();

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
    executor.execute(first);
    expect(executor.lastReport.unhandled).toHaveLength(1);
    expect(executor.lastReport.unhandled[0]?.executionCount).toBe(1);

    // Second tick: repeat fires
    const second = queue.advanceTick();
    executor.execute(second);
    expect(executor.lastReport.unhandled).toHaveLength(1);
    expect(executor.lastReport.unhandled[0]?.executionCount).toBe(2);
  });
});
