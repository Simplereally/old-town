import type { ActionExecution } from "./action-queue";

export interface ActionExecutionContext {
  readonly tick: number;
  readonly serverTime: number;
}

export type ActionExecutionHandler = (
  execution: ActionExecution,
  context: ActionExecutionContext | undefined,
) => boolean;

export interface ActionExecutionReport {
  readonly handled: readonly ActionExecution[];
  readonly unhandled: readonly ActionExecution[];
}

/**
 * Action execution boundary. Receives the actions that completed their timer in the
 * current tick and produces a report partitioning them into `handled` and `unhandled`.
 *
 * `SimulationKernel` creates one instance and calls {@link execute} with the result of
 * `ActionRuntime.advanceTick()` during the `ActionQueueTimers` phase.
 *
 * This is a closed, explicit boundary — no plugin registry, no generic payload dispatch.
 * Future systems (skilling, combat, spells) will wire their specific handlers here.
 *
 * Only the {@link lastReport} is retained; there is no unbounded accumulation.
 */
export class ActionExecutor {
  private report: ActionExecutionReport = { handled: [], unhandled: [] };

  constructor(private readonly handlers: readonly ActionExecutionHandler[] = []) {}

  execute(
    actions: readonly ActionExecution[],
    context?: ActionExecutionContext,
  ): ActionExecutionReport {
    const handled: ActionExecution[] = [];
    const unhandled: ActionExecution[] = [];

    for (const action of actions) {
      if (this.handlers.some((handler) => handler(action, context))) {
        handled.push(action);
      } else {
        unhandled.push(action);
      }
    }

    this.report = { handled, unhandled };
    return this.report;
  }

  get lastReport(): ActionExecutionReport {
    return this.report;
  }
}
