# ADR-007: Typed Action Payload Spine

## Status

Implemented

## Context

ADR-003 established the intent-to-action spine: `IntentDispatcher` routes all consumed intents, and the `SimulationKernel` owns the single canonical `ActionQueue`. ADR-003's consequences state that future systems "use the kernel-owned `actionQueue.enqueue` with a typed `ActionQueueEntry`." That intent was never realized in the implementation.

The `ActionQueueEntry` generic parameter defaults to `TPayload = unknown`, and the `payload` field is `unknown` at every boundary — queue storage, `ActionExecution`, and `ActionQueueDebugEntry`. The only connection between the producer that enqueues an action and the consumer that executes it is a runtime string check on `payload.kind` with `as` casts.

Today there are **two hand-rolled dispatch sites** for the same discriminant:

1. `SimulationKernel` inline closure (`simulation-kernel.ts:113–128`) peels off `payload.kind === "resource_respawn"` and delegates to `respawnResourceNode`; everything else falls through to `handleSkillingAction`.
2. `handleSkillingAction` (`skilling-system.ts:569–588`) runs its own `switch` over the same `kind` field for the four skilling kinds (`begin_gather`, `gather`, `begin_process`, `process`).

The split between these two layers is determined by which module happens to own the handler function — not by any real distinction. `resource_respawn` carries `InterruptGroup.Skilling` like the rest. Two dispatch sites for one discriminant is accidental complexity.

The `ActionExecutor` uses a chain-of-responsibility pattern: `ActionExecutionHandler[]` iterates handlers until one returns `true`. The `boolean` return is vestigial — all production handlers return `true` in every branch; the lone `false` is the "unmatched" default in `handleSkillingAction`. The `ActionExecutionReport` (`handled`/`unhandled` partition) is read only in tests; production code discards the return value. Repeat continuation is controlled entirely by `ActionQueue.shouldRequeue`, not by the handler return.

This is a **type erasure problem**, not a dispatch-pattern problem. The systems are doing the right thing locally — `SkillingPayload` is already a proper discriminated union inside `skilling-system.ts`, and `ResourceNodeRespawnPayload` is properly typed in `resource-node-system.ts`. The rot is entirely at the queue/executor boundary where `payload: unknown` severs the type link.

## Decision

1. **Each system owns its action payload and handler-table slice types.** The kernel imports those slice types with `import type` and composes the concrete `ActionHandlerTable` at the same site that constructs the action table. No separate payload-union module is required unless a future runtime codec or schema needs one.

2. **`ActionQueueEntry` stays content-agnostic.** The generic parameter is widened to `TPayload extends { kind: string }`, never constrained to a global payload union. The queue is a low-level primitive and must not depend on skilling, combat, or any game system. The `satisfies` annotations at current enqueue call sites become real type contracts through the narrowed `TPayload` bound.

3. **`ActionExecutor` stays content-agnostic, symmetric to the queue.** The executor is generic over its table shape: `TTable extends Record<string, ActionHandler<never>>`. It imports only `ActionContext` and `ActionExecution` (low-level, content-free) and does nothing but `table[payload.kind](payload, ctx)` inside a per-action try/catch. The concrete intersection of per-system handler-table slices is built in the kernel and passed to `new ActionExecutor(table)`. The executor is a leaf; action kinds are named only by system payload definitions and the kernel table type.

4. **The executor dispatches via a typed handler table at the kernel composition site.** Each system contributes a slice factory: `createSkillingActionHandlers(deps): SkillingSlice`, `createResourceNodeActionHandlers(deps): ResourceNodeSlice`. The kernel composes the slices at construction time and annotates the result with the private `ActionHandlerTable` type. Dispatch is `table[payload.kind](payload, ctx)` — O(1), exhaustive for the composed table, no caller-side casts. A missing kind is a **compile error**, not a runtime "unhandled" report.

5. **`ActionContext` is the minimal execution envelope.** It contains only: `tick`, `serverTime`, `execution: ActionExecution`, and `selfCancel: (id: ActionId) => void`. No system-specific dependencies (world, collision, registries, rng). Per-system dependencies are **closure-captured** inside the slice factories — each system keeps its narrow deps; the table signature stays uniform.

6. **The `ActionExecutionHandler` boolean return and `ActionExecutionReport` are deleted.** The chain-of-responsibility pattern is retired. Keyed dispatch makes it unnecessary: "unhandled" is unrepresentable when the table is exhaustive.

7. **The action handler contract is `=> void`.**
   - **Expected failure** (validation fails, node depleted, inventory full) is communicated via domain effects: system message + self-cancel. All four current handlers already do this.
   - **Unexpected throw** is isolated per-action inside the executor. The executor wraps each handler call in a try/catch: on throw, it logs the kind, owner, and execution count, invokes the injected `selfCancel` callback to remove the poisoned repeating action, and continues to the next action. This is a narrowly-scoped softening of `TickLoop`'s phase-level fail-loud rethrow — justified because at action granularity, per-entity isolation is the correct posture for an authoritative MMO.

8. **The two hand-rolled dispatch sites are collapsed into one.** The kernel inline closure and `handleSkillingAction`'s internal switch are both deleted. The current handler functions (`handleBeginGather`, `handleGather`, `handleBeginProcess`, `handleProcess`, `respawnResourceNode`) have incompatible signatures (e.g., extra `ctx`/`action`/`tick` parameters, `respawnResourceNode` takes `(ctx, nodeEntityId)`). The slice factories adapt them to the uniform `(payload, ctx) => void` table signature. `handleSkillingAction` as a wrapper function is deleted.

9. **Relationship to ADR-003 is fulfillment, not supersession.** ADR-003's intent-side switch (`IntentKind` is a closed wire-protocol enum) stands unchanged. The action-execution side gets a typed keyed table because it is an internal closed set that grows as systems land. The asymmetry is intentional: wire-facing enum with switch (ADR-003), internal union with exhaustive table (this ADR).

10. **Implementation note:** `selfCancel` in `ActionContext` is constructed per-action by the executor: `selfCancel = (id) => cancel(execution.entry.owner, { id })`. This closes over the current action's owner. The `cancel` capability is injected into the executor as a plain callback (constructor parameter) — no import edge, DAG unaffected.

11. **Known follow-ups, documented but untouched in this ADR:**
   - The `shouldRepeat` hook on `ActionQueueAdvanceOptions` is wired nowhere; all repeat termination is via self-cancel. Real latent redundancy, but orthogonal to typing.
   - The `begin→repeat` polling pattern (`begin_gather` repeats every tick as an in-range poll, then self-cancels and enqueues the real `gather` action) is load-bearing and preserved exactly.

## Consequences

- `ActionQueueEntry` is no longer `unknown` at the payload boundary. The type system guarantees that every enqueued action carries a payload with a `kind: string` discriminant.
- `ActionExecutor` no longer holds a `readonly ActionExecutionHandler[]`. It is generic over a `TTable` and performs keyed dispatch via `table[payload.kind](payload, ctx)`. The concrete table is typed as the intersection of per-system handler-table slices at the kernel composition site and passed in.
- `ActionExecutionReport`, `handled`, `unhandled`, and `lastReport` are deleted. The concept of "unhandled action" is promoted from runtime to compile-time.
- `action-executor.test.ts` is rewritten: partition assertions become tests for keyed dispatch correctness and per-action fault isolation.
- `simulation-kernel.ts` shrinks: the inline closure (lines 113–128) is replaced by a table composition call.
- `skilling-system.ts` shrinks: `handleSkillingAction` (the wrapper function, lines 569–588) is deleted; the four `handleX` functions remain exported, repurposed via a slice factory to feed the table.
- `SkillingPayload` is **repurposed**, not deleted: it types the skilling system's slice of the table (`{ [K in SkillingActionKind]: ... }`).
- Test blast radius: `intent-dispatcher.test.ts` enqueues `{ action: "woodcut" }` payloads **without a `kind` field** — these must be rewritten to use a real discriminant, or they become a type error. The test payloads are currently synthetic (not testing real execution), so they should adopt a `kind` value.
- The import graph is a DAG:
  ```
  kernel → systems → queue (leaf)
  kernel → system handler table slice types (type-only)
  kernel → action-executor (leaf; depends only on ActionContext/ActionExecution)
  ```
  Both queue and executor are content-agnostic leaves; the composed table type lives at the kernel composition site; type-only imports add no runtime coupling and no cycle.

## Related

- `POC_SPEC.md` §10 (Action queue system)
- `ADR-003_intent-to-action-spine.md` — Intent-side routing, deferred plugin registry
- `apps/server/src/sim/action-queue.ts`
- `apps/server/src/sim/action-executor.ts`
- `apps/server/src/sim/simulation-kernel.ts`
- `apps/server/src/systems/skilling-system.ts`
- `apps/server/src/systems/resource-node-system.ts`
- `apps/server/src/sim/action-executor.test.ts`
