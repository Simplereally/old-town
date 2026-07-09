/**
 * Prayer system (POC_SPEC §13.8, §17.1).
 *
 * Mechanics sourced from the OSRS wiki (Prayer, Praying, Prayer_points, Prayer drain):
 *  - Prayer points max = Prayer skill level; stored as an integer on {@link PrayerComponent}.
 *  - Drain resistance = 2 × prayerBonus + 60. Each tick the sum of active prayers'
 *    `drainEffect` is added to `drainCounter`; while the counter ≥ resistance one point
 *    is lost and the counter is decremented by resistance.
 *  - Stat-boost prayers modify effective combat levels during attack/defence/max-hit
 *    rolls (see {@link prayerBoostedLevel}). "add" contributes flat levels; "multiply"
 *    scales by (1 + value). Combined: floor((base + addSum) × (1 + multiplySum)).
 *  - Overhead protection prayers reduce incoming damage by a fraction (1.0 vs NPCs,
 *    0.4 vs players in OSRS) — see {@link applyPrayerProtection}.
 *  - Conflicting prayers share a `conflictGroup`; activating one deactivates the others.
 *  - When prayer points reach 0 all prayers deactivate.
 *
 * The server is authoritative: the client only sends activate/deactivate intents.
 */
import type { ContentRegistries, EntityId, PrayerDef } from "@old-town/shared";
import type { CombatHitStyle, PrayerComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { getCurrentLevel } from "../skills/skill-state";

/** Stats a prayer can modify that feed into combat rolls. */
export type PrayerStat =
  | "attack"
  | "strength"
  | "defence"
  | "ranged"
  | "magic"
  | "rangedStrength"
  | "magicDamage";

/** Incoming damage style for protection prayers. */
export type PrayerProtectionStyle = "melee" | "ranged" | "magic";

export interface PrayerSystemContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
}

/** Base drain resistance with no prayer bonus (OSRS: 60). */
export const BASE_PRAYER_DRAIN_RESISTANCE = 60;

function prayerBonus(ctx: PrayerSystemContext, entityId: EntityId): number {
  return ctx.world.getComponent(entityId, "equipment")?.bonuses.prayer ?? 0;
}

/** Drain resistance = 2 × prayerBonus + 60 (OSRS wiki, Prayer drain). */
export function prayerDrainResistance(ctx: PrayerSystemContext, entityId: EntityId): number {
  return 2 * prayerBonus(ctx, entityId) + BASE_PRAYER_DRAIN_RESISTANCE;
}

/** All currently-active prayer definitions for an entity. */
export function activePrayerDefs(
  registries: ContentRegistries,
  prayer: PrayerComponent | undefined,
): PrayerDef[] {
  if (!prayer || prayer.activePrayers.length === 0) {
    return [];
  }
  const defs: PrayerDef[] = [];
  for (const id of prayer.activePrayers) {
    const def = registries.prayer.get(id);
    if (def) {
      defs.push(def);
    }
  }
  return defs;
}

/**
 * Combined stat modifier from all active prayers for one stat.
 * Returns `{ add, multiply }` where the effective level is
 * `floor((base + add) × (1 + multiply))`.
 */
export function prayerStatModifier(
  ctx: PrayerSystemContext,
  entityId: EntityId,
  stat: PrayerStat,
): { add: number; multiply: number } {
  const prayer = ctx.world.getComponent(entityId, "prayer");
  const defs = activePrayerDefs(ctx.registries, prayer);
  let add = 0;
  let multiply = 0;
  for (const def of defs) {
    for (const effect of def.effects) {
      if (effect.stat !== stat) {
        continue;
      }
      if (effect.mode === "add") {
        add += effect.value;
      } else {
        multiply += effect.value;
      }
    }
  }
  return { add, multiply };
}

/**
 * Apply active prayer stat modifiers to a base level.
 * Effective = floor((base + addSum) × (1 + multiplySum)), floored to a minimum of 1
 * for combat-level stats (attack/strength/defence/ranged/magic) and 0 for bonus stats
 * (rangedStrength/magicDamage) which are additive bonuses, not levels.
 */
export function prayerBoostedLevel(
  ctx: PrayerSystemContext,
  entityId: EntityId,
  stat: PrayerStat,
  baseLevel: number,
): number {
  const { add, multiply } = prayerStatModifier(ctx, entityId, stat);
  if (add === 0 && multiply === 0) {
    return baseLevel;
  }
  const isBonusStat = stat === "rangedStrength" || stat === "magicDamage";
  const raw = Math.floor((baseLevel + add) * (1 + multiply));
  return isBonusStat ? raw : Math.max(1, raw);
}

/**
 * Reduce incoming `damage` by the target's active overhead protection prayer matching
 * `style`. NPC attackers use `npcReduction`; player attackers use `playerReduction`
 * (OSRS: 1.0 vs NPCs, 0.4 vs players). Returns the reduced damage (≥ 0).
 */
export function applyPrayerProtection(
  ctx: PrayerSystemContext,
  targetId: EntityId,
  style: PrayerProtectionStyle,
  damage: number,
  attackerIsPlayer: boolean,
): number {
  if (damage <= 0) {
    return 0;
  }
  const prayer = ctx.world.getComponent(targetId, "prayer");
  const defs = activePrayerDefs(ctx.registries, prayer);
  for (const def of defs) {
    if (def.protection?.style !== style) {
      continue;
    }
    const reduction = attackerIsPlayer
      ? def.protection.playerReduction
      : def.protection.npcReduction;
    return Math.max(0, Math.floor(damage * (1 - reduction)));
  }
  return damage;
}

/** Prayer level from the skills component (base + boost - drain). */
function prayerLevel(ctx: PrayerSystemContext, entityId: EntityId): number {
  const skills = ctx.world.getComponent(entityId, "skills");
  if (!skills) {
    return 1;
  }
  return getCurrentLevel(skills, "prayer");
}

/** Whether the entity meets the required Prayer level for `def`. */
function meetsPrayerRequirement(
  ctx: PrayerSystemContext,
  entityId: EntityId,
  def: PrayerDef,
): boolean {
  return prayerLevel(ctx, entityId) >= def.requiredPrayer;
}

function setPrayerComponent(
  ctx: PrayerSystemContext,
  entityId: EntityId,
  next: PrayerComponent,
): void {
  ctx.world.setComponent(entityId, "prayer", next);
}

function deactivateAllPrayers(ctx: PrayerSystemContext, entityId: EntityId): void {
  const prayer = ctx.world.getComponent(entityId, "prayer");
  if (!prayer || prayer.activePrayers.length === 0) {
    return;
  }
  setPrayerComponent(ctx, entityId, {
    ...prayer,
    activePrayers: [],
    drainCounter: 0,
  });
}

/**
 * Handle a SetPrayer intent: activate or deactivate a single prayer.
 *
 * Activation checks the Prayer level requirement and prayer points > 0, then
 * deactivates conflicting prayers (same `conflictGroup`). Deactivation simply
 * removes the prayer from the active set. No-op if the prayer def is unknown.
 */
export function handlePrayerIntent(
  ctx: PrayerSystemContext,
  owner: EntityId,
  payload: { readonly prayerId: string; readonly active: boolean },
  serverTime: number,
): void {
  const def = ctx.registries.prayer.get(payload.prayerId);
  if (!def) {
    ctx.deltas.markChat({
      entityId: owner,
      channel: "system",
      text: "That prayer is not available.",
      serverTime,
    });
    return;
  }

  let prayer = ctx.world.getComponent(owner, "prayer");
  if (!prayer) {
    return;
  }

  const isActive = prayer.activePrayers.includes(payload.prayerId);

  if (!payload.active) {
    if (!isActive) {
      return;
    }
    setPrayerComponent(ctx, owner, {
      ...prayer,
      activePrayers: prayer.activePrayers.filter((id) => id !== payload.prayerId),
    });
    return;
  }

  // Activate
  if (isActive) {
    return;
  }
  if (!meetsPrayerRequirement(ctx, owner, def)) {
    ctx.deltas.markChat({
      entityId: owner,
      channel: "system",
      text: `You need Prayer level ${def.requiredPrayer} to use ${def.name}.`,
      serverTime,
    });
    return;
  }
  if (prayer.points <= 0) {
    ctx.deltas.markChat({
      entityId: owner,
      channel: "system",
      text: "You have no prayer points left.",
      serverTime,
    });
    return;
  }

  // Deactivate conflicting prayers (same conflict group).
  let nextActive = prayer.activePrayers;
  if (def.conflictGroup !== undefined) {
    const conflicting = activePrayerDefs(ctx.registries, prayer).filter(
      (other) => other.conflictGroup === def.conflictGroup,
    );
    if (conflicting.length > 0) {
      const conflictIds = new Set(conflicting.map((c) => c.id));
      nextActive = nextActive.filter((id) => !conflictIds.has(id));
    }
  }

  // Re-read in case we mutated above (we didn't mutate the component yet, but be safe).
  prayer = ctx.world.getComponent(owner, "prayer") ?? prayer;
  setPrayerComponent(ctx, owner, {
    ...prayer,
    activePrayers: [...nextActive, payload.prayerId],
  });
}

/**
 * Process per-tick prayer drain (tick phase 9, FoodPotionPrayerStatChanges).
 *
 * For each entity with a prayer component and at least one active prayer, accumulate
 * the sum of active prayers' drainEffect into `drainCounter`. While the counter ≥
 * resistance, subtract one prayer point and decrement the counter. When points reach
 * 0, deactivate all prayers.
 */
export function processPrayerDrainPhase(ctx: PrayerSystemContext, _tick: number): void {
  for (const [entityId, prayer] of ctx.world.componentEntries("prayer")) {
    if (prayer.activePrayers.length === 0 || prayer.points <= 0) {
      continue;
    }
    const defs = activePrayerDefs(ctx.registries, prayer);
    if (defs.length === 0) {
      // Stale ids with no defs — clear them.
      deactivateAllPrayers(ctx, entityId);
      continue;
    }
    const drainPerTick = defs.reduce((sum, def) => sum + def.drainEffect, 0);
    if (drainPerTick <= 0) {
      continue;
    }
    const resistance = prayerDrainResistance(ctx, entityId);
    let counter = prayer.drainCounter + drainPerTick;
    let points = prayer.points;
    while (counter >= resistance && points > 0) {
      points -= 1;
      counter -= resistance;
    }
    if (points <= 0) {
      points = 0;
      setPrayerComponent(ctx, entityId, {
        ...prayer,
        points: 0,
        drainCounter: 0,
        activePrayers: [],
      });
    } else {
      setPrayerComponent(ctx, entityId, {
        ...prayer,
        points,
        drainCounter: counter,
      });
    }
  }
}

/**
 * Restore `amount` prayer points to `entityId`, clamped to the entity's Prayer level.
 * Used by prayer potions (consumable `restore_prayer` effect). Emits no deltas directly;
 * the caller may sync the skill delta if needed. Returns the number of points restored.
 */
export function restorePrayerPoints(
  ctx: PrayerSystemContext,
  entityId: EntityId,
  amount: number,
): number {
  if (amount <= 0) {
    return 0;
  }
  const prayer = ctx.world.getComponent(entityId, "prayer");
  if (!prayer) {
    return 0;
  }
  const max = prayerLevel(ctx, entityId);
  const before = prayer.points;
  const after = Math.min(max, before + amount);
  const restored = after - before;
  if (restored <= 0) {
    return 0;
  }
  setPrayerComponent(ctx, entityId, { ...prayer, points: after });
  return restored;
}

/**
 * Recompute the prayer points cap when the Prayer skill level changes (e.g. level up).
 * Clamps current points down to the new max; does not raise points toward the cap.
 */
export function clampPrayerPointsToLevel(ctx: PrayerSystemContext, entityId: EntityId): void {
  const prayer = ctx.world.getComponent(entityId, "prayer");
  if (!prayer) {
    return;
  }
  const max = prayerLevel(ctx, entityId);
  if (prayer.points > max) {
    setPrayerComponent(ctx, entityId, { ...prayer, points: max });
  }
}

/** Initialize a prayer component for a newly created player entity. */
export function createPrayerComponent(entityId: EntityId, prayerLevel: number): PrayerComponent {
  return {
    entityId,
    points: prayerLevel,
    drainCounter: 0,
    activePrayers: [],
  };
}

/** Whether an entity has any active protection prayer for the given style. */
export function hasProtectionPrayer(
  ctx: PrayerSystemContext,
  entityId: EntityId,
  style: PrayerProtectionStyle,
): boolean {
  const prayer = ctx.world.getComponent(entityId, "prayer");
  const defs = activePrayerDefs(ctx.registries, prayer);
  return defs.some((def) => def.protection?.style === style);
}

/** Map a combat hit style to a prayer protection style. */
export function hitStyleToProtectionStyle(style: CombatHitStyle): PrayerProtectionStyle {
  switch (style) {
    case "ranged":
      return "ranged";
    case "magic":
      return "magic";
    default:
      return "melee";
  }
}
