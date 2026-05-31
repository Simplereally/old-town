import type { EntityId } from "@old-town/shared";

export type ActionId = string;

export const ActionQueueType = {
  Weak: "weak",
  Normal: "normal",
  Strong: "strong",
  Soft: "soft",
} as const;

export type ActionQueueType = (typeof ActionQueueType)[keyof typeof ActionQueueType];

export const InterruptGroup = {
  Movement: "movement",
  Combat: "combat",
  Skilling: "skilling",
  Dialogue: "dialogue",
  Interface: "interface",
} as const;

export type InterruptGroup = (typeof InterruptGroup)[keyof typeof InterruptGroup];

export interface ActionRepeat {
  readonly intervalTicks: number;
  /** Maximum total executions, including the first execution. */
  readonly maxRepeats?: number;
}

export interface ActionQueueEntry<TPayload = unknown> {
  readonly id: ActionId;
  readonly owner: EntityId;
  readonly type: ActionQueueType;
  readonly delayTicks: number;
  readonly repeat?: ActionRepeat;
  readonly interruptGroup: InterruptGroup;
  readonly payload: TPayload;
}

interface QueuedAction {
  readonly entry: ActionQueueEntry;
  readonly remainingDelayTicks: number;
  readonly executions: number;
}

export interface ActionExecution {
  readonly entry: ActionQueueEntry;
  readonly executionCount: number;
}

export interface ActionQueueAdvanceOptions {
  readonly blockedOwners?: ReadonlySet<EntityId>;
  readonly shouldRepeat?: (execution: ActionExecution) => boolean;
}

export interface ActionCancelFilter {
  readonly id?: ActionId;
  readonly type?: ActionQueueType;
  readonly interruptGroup?: InterruptGroup;
}

export interface ActionQueueDebugEntry {
  readonly id: ActionId;
  readonly owner: EntityId;
  readonly type: ActionQueueType;
  readonly interruptGroup: InterruptGroup;
  readonly remainingDelayTicks: number;
  readonly executions: number;
  readonly repeat?: ActionRepeat;
  readonly payload: unknown;
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
}

function matchesFilter(entry: ActionQueueEntry, filter: ActionCancelFilter): boolean {
  return (
    (filter.id === undefined || entry.id === filter.id) &&
    (filter.type === undefined || entry.type === filter.type) &&
    (filter.interruptGroup === undefined || entry.interruptGroup === filter.interruptGroup)
  );
}

export class ActionQueue {
  private actions: QueuedAction[] = [];

  enqueue(entry: ActionQueueEntry): void {
    this.validateEntry(entry);
    if (
      this.actions.some(
        (action) => action.entry.owner === entry.owner && action.entry.id === entry.id,
      )
    ) {
      throw new Error(`Action ${entry.id} already queued for entity ${entry.owner}`);
    }

    if (entry.type === ActionQueueType.Strong) {
      this.cancel(entry.owner, { type: ActionQueueType.Weak });
    }

    this.actions.push({
      entry,
      remainingDelayTicks: entry.delayTicks,
      executions: 0,
    });
  }

  cancel(owner: EntityId, filter: ActionCancelFilter = {}): number {
    const actions = this.actions;
    const before = actions.length;
    this.actions = actions.filter((action) => {
      return action.entry.owner !== owner || !matchesFilter(action.entry, filter);
    });
    return before - this.actions.length;
  }

  interrupt(owner: EntityId, interruptGroup: InterruptGroup): number {
    return this.cancel(owner, {
      type: ActionQueueType.Weak,
      interruptGroup,
    });
  }

  advanceTick(options: ActionQueueAdvanceOptions = {}): readonly ActionExecution[] {
    const executed: ActionExecution[] = [];
    const next: QueuedAction[] = [];
    const blockedOwners = options.blockedOwners;

    for (const action of this.actions) {
      if (
        action.entry.type === ActionQueueType.Normal &&
        blockedOwners?.has(action.entry.owner) === true
      ) {
        next.push(action);
        continue;
      }

      const remainingDelayTicks = Math.max(0, action.remainingDelayTicks - 1);
      if (remainingDelayTicks > 0) {
        next.push({ ...action, remainingDelayTicks });
        continue;
      }

      const execution: ActionExecution = {
        entry: action.entry,
        executionCount: action.executions + 1,
      };
      executed.push(execution);

      if (this.shouldRequeue(action.entry, execution, options.shouldRepeat)) {
        next.push({
          entry: action.entry,
          remainingDelayTicks: action.entry.repeat.intervalTicks,
          executions: execution.executionCount,
        });
      }
    }

    this.actions = next;
    return executed;
  }

  getDebugState(): readonly ActionQueueDebugEntry[] {
    return this.actions.map((action) => ({
      id: action.entry.id,
      owner: action.entry.owner,
      type: action.entry.type,
      interruptGroup: action.entry.interruptGroup,
      remainingDelayTicks: action.remainingDelayTicks,
      executions: action.executions,
      ...(action.entry.repeat ? { repeat: { ...action.entry.repeat } } : {}),
      payload: action.entry.payload,
    }));
  }

  private validateEntry(entry: ActionQueueEntry): void {
    assertNonNegativeInteger(entry.delayTicks, "delayTicks");
    if (!entry.repeat) {
      return;
    }

    assertPositiveInteger(entry.repeat.intervalTicks, "repeat.intervalTicks");
    if (entry.repeat.maxRepeats !== undefined) {
      assertPositiveInteger(entry.repeat.maxRepeats, "repeat.maxRepeats");
    }
  }

  private shouldRequeue(
    entry: ActionQueueEntry,
    execution: ActionExecution,
    shouldRepeat: ActionQueueAdvanceOptions["shouldRepeat"],
  ): entry is ActionQueueEntry & { readonly repeat: ActionRepeat } {
    if (!entry.repeat) {
      return false;
    }
    if (
      entry.repeat.maxRepeats !== undefined &&
      execution.executionCount >= entry.repeat.maxRepeats
    ) {
      return false;
    }
    return shouldRepeat?.(execution) ?? true;
  }
}
