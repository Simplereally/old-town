# ADR-003: Intent-to-Action Spine

## Status

Accepted

## Context

The `SimulationKernel` was doing raw intent switching inline inside `TickPhase.InputClose`. Every intent kind (move, chat, item, UI, object, NPC, spell, ping) was handled with a direct `if/else` chain inside `wireTickPhases`. This had several problems:

1. **No action queue ownership.** The `ActionQueue` existed but was not created or advanced by the kernel. `TickPhase.ActionQueueTimers` was defined in the phase order but unwired.
2. **Optional action cancellation.** `handleMoveIntent` accepted an optional `actionQueue` parameter and only cancelled weak actions when one was provided. Production movement must always cancel weak actions.
3. **Silent swallowing.** Object, NPC, and spell intents were normalized in `CommandBuffer` but never handled in the kernel. They were silently dropped.
4. **Kernel bloat.** The kernel imported movement, item, and chat handlers directly, coupling it to every system.
5. **No foundation for E09+.** Skilling, combat, spells, and dialogue all need a single tick-owned action path. Each system inventing its own timing would fracture the architecture.

## Decision

1. **The `SimulationKernel` owns the queue.** The kernel creates one `ActionQueue` instance and advances it during `TickPhase.ActionQueueTimers`. No system creates its own queue.

2. **`IntentDispatcher` routes all intents.** All consumed intents pass through `dispatchIntentGroup` in `apps/server/src/sim/intent-dispatcher.ts`. The kernel no longer does raw intent switching.

3. **Movement always cancels weak actions.** The `IntentDispatcher` calls `actionQueue.cancel(owner, { type: Weak })` before routing a move intent. The `handleMoveIntent` function no longer accepts an optional `actionQueue` parameter.

4. **Item/UI actions cancel weak actions.** The `IntentDispatcher` cancels weak actions before item and UI unequip intents, matching the spec that item interaction interrupts weak actions.

5. **Object/NPC/spell intents emit explicit feedback.** If behavior is not implemented, the dispatcher emits a private system message (e.g., "Object interaction is not yet implemented.") and cancels weak actions. Never silently swallow.

6. **Chat and ping intents are unaffected.** Chat goes through `chatSystem.submit`. Ping is ignored.

7. **Strong actions clear weak actions through existing queue semantics.** `ActionQueue.enqueue` already clears weak actions when a strong action is enqueued. This behavior is preserved and tested.

8. **No generic plugin/script registry yet.** The dispatcher is a hardcoded switch. A plugin registry is deferred until E11+ when the pattern is proven.

9. **No multi-component World queries.** The dispatcher uses only the existing single-component `World` API (`getComponent`, `setComponent`, etc.).

## Consequences

- `SimulationKernel` is now thinner. It only creates deps, wires phases, and exposes the interface. All intent routing lives in `IntentDispatcher`.
- `TickPhase.ActionQueueTimers` is now wired and executes every tick.
- Future intent kinds (dialogue, teleport, trade) only require adding a case to `IntentDispatcher`, not touching the kernel.
- Future systems that need to enqueue actions (skilling, combat, spells) use the kernel-owned `actionQueue.enqueue` with a typed `ActionQueueEntry`.
- Tests verify the dispatcher behavior directly: `intent-dispatcher.test.ts` covers cancellation, feedback, and routing.
- `action-queue.test.ts` verifies queue timing, cancellation, interruption, repeat, and priority semantics directly.

## Related

- `POC_SPEC.md` §10 (Action queue system)
- `apps/server/src/sim/intent-dispatcher.ts`
- `apps/server/src/sim/simulation-kernel.ts`
- `apps/server/src/sim/action-queue.ts`
- `apps/server/src/sim/action-queue.test.ts`
- `apps/server/src/sim/intent-dispatcher.test.ts`
