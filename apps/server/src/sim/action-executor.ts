import type { EntityId } from "@old-town/shared";
import type { ActionCancelFilter, ActionExecution, ActionId } from "./action-queue";

export interface ActionExecutionContext {
  readonly tick: number;
  readonly serverTime: number;
}

export interface ActionContext {
  readonly tick: number;
  readonly serverTime: number;
  readonly execution: ActionExecution;
  readonly selfCancel: (id: ActionId) => void;
}

export type ActionHandler<TPayload extends { kind: string } = { kind: string }> = (
  payload: TPayload,
  ctx: ActionContext,
) => void;

// The default table type uses `ActionHandler<never>` so that a concrete table
// of specific-payload handlers (e.g. `ActionHandler<GatherActionPayload>`)
// remains assignable to a bare `ActionExecutor` — contravariance makes every
// specific handler a subtype of `ActionHandler<never>`. This avoids `any`
// while keeping the heterogeneous dispatch table well-typed.
export class ActionExecutor<TTable = Record<string, ActionHandler<never>>> {
  constructor(
    private readonly table: TTable,
    private readonly cancelAction: (owner: EntityId, filter: ActionCancelFilter) => number = () =>
      0,
    private readonly onMissingHandler: (
      kind: string | undefined,
      action: ActionExecution,
    ) => void = () => {},
  ) {}

  execute(
    actions: readonly ActionExecution[],
    context: ActionExecutionContext = { tick: 0, serverTime: 0 },
  ): void {
    // Deliberate dynamic-dispatch escape hatch: the precise key set is
    // enforced at the kernel table annotation (ActionHandlerTable), and
    // payloads are runtime-unknown here, so the type-erased cast is safe.
    // Do not copy this pattern elsewhere.
    const lookup = this.table as unknown as Record<
      string,
      (payload: unknown, ctx: ActionContext) => void
    >;

    for (const action of actions) {
      const payload = action.entry.payload;
      const kind = actionKind(payload);
      const handler = kind ? lookup[kind] : undefined;

      if (!handler) {
        this.onMissingHandler(kind, action);
        continue;
      }

      try {
        handler(payload, {
          tick: context.tick,
          serverTime: context.serverTime,
          execution: action,
          selfCancel: (id) => this.cancelAction(action.entry.owner, { id }),
        });
      } catch {
        this.cancelAction(action.entry.owner, { id: action.entry.id });
      }
    }
  }
}

function actionKind(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null || !("kind" in payload)) {
    return undefined;
  }
  const kind = (payload as { readonly kind?: unknown }).kind;
  return typeof kind === "string" ? kind : undefined;
}
