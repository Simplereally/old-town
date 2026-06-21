/**
 * Approach module — owns the approach-and-begin initiation for interactions
 * that require the actor to be standing next to a target.
 *
 * When the actor is out of reach, the module walks the actor toward the target
 * and enqueues a `begin_*` poll action that re-validates reach each tick,
 * auto-starting the interaction on arrival. See ADR-009 and the `Approach`
 * term in CONTEXT.md.
 *
 * Combat and spells do not use this module — combat is target-led (the
 * `combatant.targetId` component drives resumption), and spells reject
 * out-of-range casts.
 */
import type { EntityId, TileCoord } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { ActionQueue } from "../sim/action-queue";
import { ActionQueueType, InterruptGroup } from "../sim/action-queue";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { CollisionMap } from "../world/collision";
import { handleMoveIntent } from "./movement-system";

export interface ApproachContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly actionQueue: ActionQueue;
}

export type ApproachResult = "in_reach" | "approaching";

/** Payload for the `begin_*` poll action enqueued when the actor is out of reach. */
export interface ApproachBeginPayload {
  readonly kind: string;
  readonly [key: string]: unknown;
}

function actorTileOf(world: World, owner: EntityId): TileCoord | undefined {
  const position = world.getComponent(owner, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane }
    : undefined;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

/**
 * Walks the actor toward `targetTile` and enqueues a weak `begin_*` poll
 * action (delayTicks 1, repeat interval 1, InterruptGroup.Skilling) that
 * re-validates reach each tick. The caller's `beginPayload` factory is called
 * to produce the poll payload.
 *
 * The action-queue params are owned by this module — the caller never
 * constructs the enqueue call. The action ID is stable per owner so
 * re-enqueueing replaces the previous approach.
 *
 * Use this when the caller already knows the actor is out of reach (e.g., a
 * validator returned an out-of-range reason). Use {@link approach} instead
 * when the caller wants the module to check reach.
 */
export function beginApproach(
  ctx: ApproachContext,
  owner: EntityId,
  targetTile: TileCoord,
  beginPayload: () => ApproachBeginPayload,
  tick?: number,
): void {
  handleMoveIntent(
    { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
    owner,
    { dest: targetTile },
    tick !== undefined ? { tick } : {},
  );
  ctx.actionQueue.enqueue({
    id: `approach:${owner}`,
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    repeat: { intervalTicks: 1 },
    interruptGroup: InterruptGroup.Skilling,
    payload: beginPayload(),
  });
}

/**
 * If the actor is within reach (chebyshev distance ≤ 1) of `targetTile`,
 * returns `"in_reach"` and does nothing else — the caller acts immediately.
 *
 * If the actor is out of reach, calls {@link beginApproach} and returns
 * `"approaching"`.
 *
 * Use this when the caller does not pre-check reach. When a validator already
 * determined the actor is out of range, call {@link beginApproach} directly to
 * avoid a redundant reach check and to preserve the validator's error ordering
 * (e.g., "wrong station" should be shown before walking, not after).
 */
export function approach(
  ctx: ApproachContext,
  owner: EntityId,
  targetTile: TileCoord,
  beginPayload: () => ApproachBeginPayload,
  tick?: number,
): ApproachResult {
  const actorTile = actorTileOf(ctx.world, owner);
  if (actorTile && chebyshev(actorTile, targetTile) <= 1) {
    return "in_reach";
  }
  beginApproach(ctx, owner, targetTile, beginPayload, tick);
  return "approaching";
}
