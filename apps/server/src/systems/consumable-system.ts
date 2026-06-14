/**
 * Consumable (food/potion) stat-change system (POC_SPEC §13.9, §9.1 phase 9).
 *
 * Eating is split across two tick phases on purpose:
 *
 *   - **Input close (phase 1):** the eat *request* is validated and the food is consumed
 *     (one unit leaves the inventory immediately) and the eat delay is applied. This lives in
 *     {@link import("../items/item-actions").handleItemIntent}, which enqueues the heal here.
 *   - **Food/potion/prayer/stat changes (phase 9):** the HP restore is *applied* here, by
 *     {@link ConsumableSystem.processConsumablePhase}.
 *
 * The canonical tick order ({@link import("../sim/tick-loop").TICK_PHASE_ORDER}) runs phase 9
 * strictly *after* phase 8 (`DamageResolutionEvents`). The documented, structurally-enforced
 * consequence: within a single tick a delayed hit that resolves this tick lands *before* food
 * heals. Healing never pre-empts a same-tick incoming hit — the ordering is deterministic, not
 * incidental (POC_SPEC §13.9 demands this be an explicit choice, not an accident).
 *
 * Heals are clamped to `maxHealth`; food cannot overheal (no content field opts into it yet).
 */
import type { EntityId } from "@old-town/shared";
import type { ContentRegistries } from "@old-town/shared";
import type { World } from "../ecs/world";
import { boostSkill } from "../skills/skill-state";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { applyStatusEffect, cureStatusEffect } from "./status-system";

export interface ConsumableContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
}

/** A heal queued at input close, awaiting application in the stat-change phase. */
interface PendingHeal {
  readonly entityId: EntityId;
  readonly heal: number;
}

/** A status effect cure queued at input close, awaiting application in the stat-change phase. */
interface PendingCure {
  readonly entityId: EntityId;
  readonly statusEffectId: string;
}

/** A status effect application queued at input close, awaiting application in the stat-change phase. */
interface PendingApplyStatus {
  readonly entityId: EntityId;
  readonly statusEffectId: string;
}

/** A skill boost queued at input close, awaiting application in the stat-change phase. */
interface PendingBoost {
  readonly entityId: EntityId;
  readonly skillId: string;
  readonly amount: number;
}

export class ConsumableSystem {
  /** Heals queued this tick, drained (FIFO) during {@link processConsumablePhase}. */
  private pending: PendingHeal[] = [];
  /** Cures queued this tick, drained (FIFO) during {@link processConsumablePhase}. */
  private pendingCures: PendingCure[] = [];
  /** Status applications queued this tick, drained (FIFO) during {@link processConsumablePhase}. */
  private pendingApplyStatus: PendingApplyStatus[] = [];
  /** Boosts queued this tick, drained (FIFO) during {@link processConsumablePhase}. */
  private pendingBoosts: PendingBoost[] = [];

  /**
   * Queue a heal of `heal` hitpoints for `entityId`, to be applied during this tick's
   * stat-change phase. A non-positive heal is ignored (drinking a no-heal potion still
   * consumes the item at the call site, but produces no health delta here).
   */
  enqueueHeal(entityId: EntityId, heal: number): void {
    if (heal > 0) {
      this.pending.push({ entityId, heal });
    }
  }

  /** Queue a cure of `statusEffectId` for `entityId`. */
  enqueueCure(entityId: EntityId, statusEffectId: string): void {
    this.pendingCures.push({ entityId, statusEffectId });
  }

  /** Queue a status effect application of `statusEffectId` for `entityId`. */
  enqueueApplyStatus(entityId: EntityId, statusEffectId: string): void {
    this.pendingApplyStatus.push({ entityId, statusEffectId });
  }

  /** Queue a skill boost of `amount` for `skillId` on `entityId`. */
  enqueueBoost(entityId: EntityId, skillId: string, amount: number): void {
    if (amount > 0) {
      this.pendingBoosts.push({ entityId, skillId, amount });
    }
  }

  /** Whether any heals are queued (for tests/diagnostics). */
  get pendingCount(): number {
    return this.pending.length;
  }

  /** Whether any cures are queued (for tests/diagnostics). */
  get pendingCureCount(): number {
    return this.pendingCures.length;
  }

  /** Whether any status applications are queued (for tests/diagnostics). */
  get pendingApplyStatusCount(): number {
    return this.pendingApplyStatus.length;
  }

  /** Whether any boosts are queued (for tests/diagnostics). */
  get pendingBoostCount(): number {
    return this.pendingBoosts.length;
  }

  /**
   * Apply every queued heal, cure, status, and boost (tick phase 9). Each heal is clamped to
   * the actor's `maxHealth`; when it actually restores hitpoints, a `heal` hitsplat and a
   * refreshed health bar are emitted. An actor already at full health produces no deltas
   * (and no hitsplat noise). Cures and boosts are applied immediately.
   */
  processConsumablePhase(ctx: ConsumableContext): void {
    const heals = this.pending;
    this.pending = [];
    for (const { entityId, heal } of heals) {
      applyHeal(ctx, entityId, heal);
    }

    const cures = this.pendingCures;
    this.pendingCures = [];
    for (const { entityId, statusEffectId } of cures) {
      cureStatusEffect(ctx, entityId, statusEffectId);
    }

    const applyStatuses = this.pendingApplyStatus;
    this.pendingApplyStatus = [];
    for (const { entityId, statusEffectId } of applyStatuses) {
      applyStatusEffect(ctx, entityId, statusEffectId);
    }

    const boosts = this.pendingBoosts;
    this.pendingBoosts = [];
    for (const { entityId, skillId, amount } of boosts) {
      boostSkill(ctx, entityId, skillId, amount);
    }
  }
}

/** Restore `heal` HP to a combatant, clamped to its max, emitting health/hitsplat deltas. */
function applyHeal(ctx: ConsumableContext, entityId: EntityId, heal: number): void {
  const combatant = ctx.world.getComponent(entityId, "combatant");
  if (!combatant) {
    return;
  }
  const before = combatant.health;
  const after = Math.min(combatant.maxHealth, before + heal);
  const restored = after - before;
  if (restored <= 0) {
    // Already at (or above) max — the food was still consumed, but nothing to restore.
    return;
  }
  combatant.health = after;
  ctx.deltas.markHitsplat({ entityId, hitsplat: { amount: restored, type: "heal" } });
  ctx.deltas.markEntityUpdate(entityId, {
    healthBar: { current: after, max: combatant.maxHealth },
  });
}
