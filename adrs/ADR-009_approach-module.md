# ADR-009: Approach Module

## Status

Accepted

## Context

When a player clicks an interactable entity (resource node, station, object, activity) from out of reach, the server must walk the actor toward the target and auto-start the interaction on arrival. This "approach and auto-start" pattern was hand-rolled per system with four near-identical implementations and one broken one:

1. **Skilling gather** (`skilling-system.ts`): `chebyshev > 1` → `handleMoveIntent(dest: nodeTile)` + `enqueueBeginGather` (weak, `delayTicks: 1, repeat: { intervalTicks: 1 }`, `InterruptGroup.Skilling`). The `begin_gather` action polls every tick, re-validates reach via `validateGatherAction`, and when in range self-cancels and enqueues the real `gather` action.
2. **Skilling process** (`skilling-system.ts`): same shape, `begin_process` payload with `recipeId`.
3. **Object interact** (`object-interaction-router.ts`): same shape, `begin_interact` payload with `actionId`.
4. **Activity** (`activity-system.ts`): **broken** — moves the actor but never enqueues a `begin_activity` poll. The `_enqueueBeginActivity` function was written (the author knew the pattern) but never called from the out-of-reach path. The player walks to the activity object and then nothing happens — they must click again. Same bug class as the minimap-cleanup bug (a function defined but never called because the concept has no home).

The `begin_*` poll-until-in-range mechanism is load-bearing and blessed by ADR-007. This ADR is about the *initiation* of the approach, not the polling itself.

Two other systems check reach but do **not** use the Approach pattern, and this ADR records why they are excluded:

- **Combat** uses `resolveInteraction` (pathfinding with attack shapes and line-of-sight) and does **not** enqueue a `begin_*` poll. Resumption is **target-led**: the `combatant.targetId` component drives the combat system's per-tick processing, which re-evaluates reach every tick and re-approaches or attacks. This is a fundamentally different control structure from the action-led `begin_*` poll. Collapsing combat into the Approach module would be a category error.
- **Spell** rejects out-of-range casts with "That target is too far away." — no movement, no retry. This is a deliberate design choice: spells have a range and the player must manually walk closer and re-cast.

## Decision

1. **Extract an `approach` module** at `apps/server/src/systems/approach.ts`. It owns the approach-and-begin initiation: approach movement, `begin_*` poll enqueue, action-queue params, and action ID generation. The module exports two functions:

   - `approach(ctx, owner, targetTile, beginPayload, tick?) → "in_reach" | "approaching"` — checks reach (chebyshev ≤ 1); returns `"in_reach"` if the actor is close enough, otherwise calls `beginApproach` and returns `"approaching"`. Used by sites that do not pre-check reach (object interact, activity).
   - `beginApproach(ctx, owner, targetTile, beginPayload, tick?) → void` — walks the actor toward `targetTile` and enqueues the `begin_*` poll. Used by sites that already know they are out of range from their own validator (skilling gather, skilling process). Calling `beginApproach` directly preserves the validator's error ordering — e.g., "wrong station" is shown before walking, not after.

2. **The module owns the action-queue params.** The `begin_*` poll is always `{ type: Weak, delayTicks: 1, repeat: { intervalTicks: 1 }, interruptGroup: InterruptGroup.Skilling }`. These params are the poll-until-in-range contract and are identical across all approach sites. The caller never constructs the enqueue call.

3. **The module owns the action ID.** The ID is `approach:${owner}`, stable per owner so the caller can cancel a previous approach by ID before re-enqueueing (the action queue throws on duplicate IDs, so cancellation must happen first). Today the ID schemes are inconsistent (`actionId("begin-gather", owner)` vs `begin-interact:${owner}` vs `begin-activity:${activityId}:${owner}`); the module unifies this.

4. **The caller owns the begin payload.** Each site has a different payload shape (`begin_gather` has `nodeEntityId`, `begin_process` has `recipeId`, `begin_interact` has `actionId`, `begin_activity` has `activityId`). The caller passes a factory `() => BeginPayload` that the module calls to produce the poll payload. The module does not know about game content.

5. **The caller owns the in-reach action.** On `"in_reach"`, the caller acts immediately (enqueue gather, start activity, invoke object option). The module does not run the in-reach action — that would require it to know about game content.

6. **`validateGatherAction` and `validateProcessAction` keep their reach checks.** The poll handlers (`handleBeginGather`, `handleGather`, `handleBeginProcess`) call these validators every tick and need the `out_of_range` reason to distinguish "keep polling" from "cancel and message." The skilling sites call `beginApproach` (not `approach`) to avoid a redundant reach check and to preserve the validators' error ordering (depletion, wrong-station, and missing-items checks run before reach, so their messages are shown immediately rather than after walking).

7. **The activity bug is fixed by this deepening.** The activity intent handler restructures to call `approach` first; on `"approaching"`, the module enqueues the `begin_activity` poll. `_enqueueBeginActivity` is deleted — the module owns the enqueue. The player now auto-starts the activity on arrival instead of standing there.

8. **Combat and spell are excluded.** Combat is target-led, not action-led. Spell rejects out-of-range casts. Neither uses the `begin_*` poll pattern. A future architecture review should not re-suggest collapsing them into the Approach module.

9. **Facing delta is not owned by the module.** `enqueueGather` sets `deltas.markEntityUpdate(owner, { facingTile: targetTile })` on the in-reach path. Facing is part of "start the interaction," not "walk toward it." The caller sets facing when it acts on `"in_reach"`.

10. **Footprint resolution is not owned by the module.** The Move intent (direct click) passes a footprint so players ignore NPC occupancy. The approach sites do not pass a footprint today — players path around NPCs when approaching a target. The module preserves this existing behavior. If the design team wants approach to use footprint, that is a future gameplay decision.

## Consequences

- `approach.ts` is ~110 lines. The interface is two functions with small signatures; the implementation hides the move intent, begin enqueue, action-queue params, and action ID generation.
- `skilling-system.ts` shrinks: `enqueueBeginGather` and `enqueueBeginProcess` are deleted (the module owns the enqueue). The gather/process intent handlers call `beginApproach` instead of hand-rolling `handleMoveIntent + enqueueBegin*`.
- `object-interaction-router.ts` shrinks: `enqueueBeginInteract` is deleted. The object intent handler calls `approach` instead of hand-rolling the chebyshev check + `handleMoveIntent + enqueueBeginInteract`.
- `activity-system.ts` shrinks: `_enqueueBeginActivity` is deleted. The activity intent handler calls `approach` instead of hand-rolling the chebyshev check + `handleMoveIntent` (with the begin enqueue missing — the bug). **The activity auto-start bug is fixed.**
- The approach mechanics (move intent, begin enqueue params, action ID) are tested once in `approach.test.ts` instead of being re-asserted per system.
- Per-system tests shrink to: "when `in_reach`, the right thing happens (gather starts / process starts / interact runs / activity starts)." They stop re-asserting the approach mechanics.
- **No gameplay behavior change** for skilling gather, skilling process, or object interact — the validators' error ordering is preserved (skilling sites call `beginApproach` only after the validator confirms `out_of_range`, so depletion/wrong-station/missing-items messages still show immediately). The only behavior change is the activity bug fix: the player now auto-starts activities on arrival instead of standing there.
- The durable term **Approach** is added to `CONTEXT.md`: the act of moving an actor toward a target that is out of reach and queuing a `begin_*` poll action that re-validates reach each tick, auto-starting the interaction on arrival. Distinct from Reach (the distance) and from the Action Queue (where the poll lives).

## Related

- `POC_SPEC.md` §10 (Action queue system)
- ADR-007 (Typed Action Payload Spine) — blessed the `begin_*` poll-until-in-range pattern; this ADR sits in front of it
- ADR-003 (Intent-to-Action Spine) — the Approach module is called from intent handlers, not the dispatcher
- `apps/server/src/systems/approach.ts`
- `apps/server/src/systems/skilling-system.ts`
- `apps/server/src/systems/object-interaction-router.ts`
- `apps/server/src/systems/activity-system.ts`
- `CONTEXT.md` — Approach term
