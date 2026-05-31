import type { EntityId } from "@old-town/shared";
import {
  type ActionCancelFilter,
  type ActionExecution,
  ActionQueue,
  type ActionQueueAdvanceOptions,
  type ActionQueueDebugEntry,
  type ActionQueueEntry,
  type InterruptGroup,
} from "./action-queue";

/**
 * The server-side action runtime. Owns one {@link ActionQueue} and exposes it as the
 * canonical place where systems enqueue, cancel, and advance actions.
 *
 * `ActionRuntime` is created by the {@link SimulationKernel} and advanced during the
 * `ActionQueueTimers` tick phase. Systems do not create their own queues.
 */
export class ActionRuntime {
  private readonly queue = new ActionQueue();

  enqueue(entry: ActionQueueEntry): void {
    this.queue.enqueue(entry);
  }

  cancel(owner: EntityId, filter?: ActionCancelFilter): number {
    return this.queue.cancel(owner, filter);
  }

  interrupt(owner: EntityId, interruptGroup: InterruptGroup): number {
    return this.queue.interrupt(owner, interruptGroup);
  }

  advanceTick(options?: ActionQueueAdvanceOptions): readonly ActionExecution[] {
    return this.queue.advanceTick(options);
  }

  getDebugState(): readonly ActionQueueDebugEntry[] {
    return this.queue.getDebugState();
  }
}
