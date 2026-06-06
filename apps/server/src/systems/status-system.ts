import {
  type ContentRegistries,
  type EntityId,
  type StatusEffectDef,
  tileKey,
} from "@old-town/shared";
import type {
  ActiveStatusEffect,
  CombatantComponent,
  StatusEffectsComponent,
} from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import type { RuntimeMap } from "../world/runtime-map";

export interface StatusEffectContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly map?: RuntimeMap;
}

const DEFAULT_DOT_DAMAGE = 2;
const BURN_WATER_REDUCTION = 0.5;
const FREEZE_BLOCK_EXTRA_TICKS = 1;

function getOrCreateStatusEffects(world: World, entityId: EntityId): StatusEffectsComponent {
  const existing = world.getComponent(entityId, "statusEffects");
  if (existing) {
    return existing;
  }
  const created: StatusEffectsComponent = { entityId, effects: [] };
  world.setComponent(entityId, "statusEffects", created);
  return created;
}

function captureBaseStats(world: World, statusEffects: StatusEffectsComponent): void {
  const combatant = world.getComponent(statusEffects.entityId, "combatant");
  if (!combatant) return;
  if (statusEffects.baseAttackLevel === undefined) {
    statusEffects.baseAttackLevel = combatant.attackLevel;
  }
  if (statusEffects.baseStrengthLevel === undefined) {
    statusEffects.baseStrengthLevel = combatant.strengthLevel;
  }
  if (statusEffects.baseDefenceLevel === undefined) {
    statusEffects.baseDefenceLevel = combatant.defenceLevel;
  }
}

function findEffect(
  statusEffects: StatusEffectsComponent,
  statusEffectId: string,
): ActiveStatusEffect | undefined {
  return statusEffects.effects.find((e) => e.statusEffectId === statusEffectId);
}

function effectDef(
  registries: ContentRegistries,
  statusEffectId: string,
): StatusEffectDef | undefined {
  return registries.statusEffect.get(statusEffectId);
}

function isOnWater(world: World, map: RuntimeMap | undefined, entityId: EntityId): boolean {
  if (!map) return false;
  const position = world.getComponent(entityId, "position");
  if (!position) return false;
  const tile = map.tiles.get(
    tileKey({ x: position.x, y: position.y, plane: position.plane as 0 | 1 | 2 | 3 }),
  );
  return tile?.water === true;
}

function tookFireDamageThisTick(world: World, entityId: EntityId): boolean {
  const combatant = world.getComponent(entityId, "combatant");
  if (!combatant || !combatant.pendingHits) return false;
  const now = combatant.pendingHits.some(
    (hit) => hit.targetId === entityId && hit.style === "magic" && hit.damage > 0,
  );
  return now;
}

export function applyStatusEffect(
  ctx: StatusEffectContext,
  entityId: EntityId,
  statusEffectId: string,
  sourceEntityId?: EntityId,
  durationOverride?: number,
): boolean {
  const def = effectDef(ctx.registries, statusEffectId);
  if (!def) return false;

  const statusEffects = getOrCreateStatusEffects(ctx.world, entityId);
  const existing = findEffect(statusEffects, statusEffectId);

  if (existing) {
    // Refresh duration and stack up to maxStacks
    existing.remainingTicks = Math.max(
      existing.remainingTicks,
      durationOverride ?? def.durationTicks,
    );
    existing.stacks = Math.min(existing.stacks + 1, def.maxStacks);
    if (sourceEntityId !== undefined) {
      existing.sourceEntityId = sourceEntityId;
    }
  } else {
    const instance: ActiveStatusEffect = {
      statusEffectId,
      stacks: 1,
      remainingTicks: durationOverride ?? def.durationTicks,
      ...(sourceEntityId !== undefined ? { sourceEntityId } : {}),
    };
    statusEffects.effects.push(instance);
  }

  captureBaseStats(ctx.world, statusEffects);
  ctx.world.setComponent(entityId, "statusEffects", statusEffects);
  return true;
}

export function cureStatusEffect(
  ctx: StatusEffectContext,
  entityId: EntityId,
  statusEffectId: string,
): boolean {
  const statusEffects = ctx.world.getComponent(entityId, "statusEffects");
  if (!statusEffects) return false;

  const beforeLength = statusEffects.effects.length;
  const nextEffects = statusEffects.effects.filter((e) => e.statusEffectId !== statusEffectId);
  if (nextEffects.length === beforeLength) return false;

  const next: StatusEffectsComponent = {
    ...statusEffects,
    effects: nextEffects,
  };
  if (nextEffects.length === 0) {
    ctx.world.removeComponent(entityId, "statusEffects");
    restoreBaseStats(ctx.world, entityId, statusEffects);
  } else {
    ctx.world.setComponent(entityId, "statusEffects", next);
    recomputeCombatStats(ctx, entityId, nextEffects);
  }
  return true;
}

export function cureByItem(ctx: StatusEffectContext, entityId: EntityId, itemId: string): string[] {
  const statusEffects = ctx.world.getComponent(entityId, "statusEffects");
  if (!statusEffects) return [];

  const cured: string[] = [];
  const remaining: ActiveStatusEffect[] = [];
  for (const effect of statusEffects.effects) {
    const def = effectDef(ctx.registries, effect.statusEffectId);
    if (def && def.cureItems.includes(itemId)) {
      cured.push(effect.statusEffectId);
    } else {
      remaining.push(effect);
    }
  }

  if (cured.length === 0) return [];

  if (remaining.length === 0) {
    ctx.world.removeComponent(entityId, "statusEffects");
    restoreBaseStats(ctx.world, entityId, statusEffects);
  } else {
    const next: StatusEffectsComponent = {
      ...statusEffects,
      effects: remaining,
    };
    ctx.world.setComponent(entityId, "statusEffects", next);
    recomputeCombatStats(ctx, entityId, remaining);
  }
  return cured;
}

function restoreBaseStats(
  world: World,
  entityId: EntityId,
  statusEffects: StatusEffectsComponent,
): void {
  const combatant = world.getComponent(entityId, "combatant");
  if (!combatant) return;
  const next: CombatantComponent = {
    ...combatant,
    ...(statusEffects.baseAttackLevel !== undefined
      ? { attackLevel: statusEffects.baseAttackLevel }
      : {}),
    ...(statusEffects.baseStrengthLevel !== undefined
      ? { strengthLevel: statusEffects.baseStrengthLevel }
      : {}),
    ...(statusEffects.baseDefenceLevel !== undefined
      ? { defenceLevel: statusEffects.baseDefenceLevel }
      : {}),
  };
  world.setComponent(entityId, "combatant", next);
}

function recomputeCombatStats(
  ctx: StatusEffectContext,
  entityId: EntityId,
  effects: readonly ActiveStatusEffect[],
): void {
  const combatant = ctx.world.getComponent(entityId, "combatant");
  const statusEffects = ctx.world.getComponent(entityId, "statusEffects");
  if (!combatant || !statusEffects) return;

  const baseAttack = statusEffects.baseAttackLevel ?? combatant.attackLevel;
  const baseStrength = statusEffects.baseStrengthLevel ?? combatant.strengthLevel;
  const baseDefence = statusEffects.baseDefenceLevel ?? combatant.defenceLevel;

  let attackMod = 0;
  let strengthMod = 0;
  let defenceMod = 0;

  for (const effect of effects) {
    const def = effectDef(ctx.registries, effect.statusEffectId);
    if (!def) continue;
    const stackMult = effect.stacks;
    for (const mod of def.statModifiers) {
      const value = mod.value * stackMult;
      if (
        mod.stat === "attack" ||
        mod.stat === "stabAttack" ||
        mod.stat === "slashAttack" ||
        mod.stat === "crushAttack"
      ) {
        attackMod += value;
      } else if (mod.stat === "strength" || mod.stat === "meleeStrength") {
        strengthMod += value;
      } else if (
        mod.stat === "defence" ||
        mod.stat === "stabDefence" ||
        mod.stat === "slashDefence" ||
        mod.stat === "crushDefence"
      ) {
        defenceMod += value;
      }
    }
  }

  const next: CombatantComponent = {
    ...combatant,
    attackLevel: Math.max(1, baseAttack + attackMod),
    strengthLevel: Math.max(1, baseStrength + strengthMod),
    defenceLevel: Math.max(1, baseDefence + defenceMod),
  };
  ctx.world.setComponent(entityId, "combatant", next);
}

function applyDotDamage(
  ctx: StatusEffectContext,
  entityId: EntityId,
  effect: ActiveStatusEffect,
  def: StatusEffectDef,
  tick: number,
): void {
  const combatant = ctx.world.getComponent(entityId, "combatant");
  if (!combatant || combatant.dead || combatant.health <= 0) return;

  let damage = def.damagePerTick ?? DEFAULT_DOT_DAMAGE;
  const stacks = effect.stacks;
  damage = damage * stacks;

  // Burn reduced by water
  if (def.id === "burn" && isOnWater(ctx.world, ctx.map, entityId)) {
    damage = Math.floor(damage * BURN_WATER_REDUCTION);
  }

  if (damage <= 0) return;

  const actualDamage = Math.min(damage, combatant.health);
  const after = combatant.health - actualDamage;
  const next: CombatantComponent = {
    ...combatant,
    health: after,
    ...(effect.sourceEntityId !== undefined ? { lastDamageSourceId: effect.sourceEntityId } : {}),
  };
  ctx.world.setComponent(entityId, "combatant", next);
  ctx.deltas.markHitsplat({
    entityId,
    hitsplat: { amount: actualDamage, type: "damage" },
  });
  ctx.deltas.markEntityUpdate(entityId, {
    healthBar: { current: after, max: combatant.maxHealth },
  });
}

function applyFreeze(
  ctx: StatusEffectContext,
  entityId: EntityId,
  effect: ActiveStatusEffect,
  tick: number,
): void {
  const movement = ctx.world.getComponent(entityId, "movement");
  if (!movement) return;

  const blockedUntil = tick + FREEZE_BLOCK_EXTRA_TICKS;
  const nextBlocked = Math.max(movement.blockedUntilTick ?? 0, blockedUntil);
  ctx.world.setComponent(entityId, "movement", {
    entityId,
    mode: movement.mode,
    path: [],
    ...(movement.lastStepDirection !== undefined
      ? { lastStepDirection: movement.lastStepDirection }
      : {}),
    blockedUntilTick: nextBlocked,
  });
  ctx.deltas.markEntityUpdate(entityId, {
    moveSpeed: "stationary",
    overheadText: "Frozen",
  });
  ctx.deltas.markDebugPath(entityId, []);

  // Reduce freeze duration by fire damage (1 extra tick beyond normal decay)
  if (tookFireDamageThisTick(ctx.world, entityId)) {
    effect.remainingTicks = Math.max(0, effect.remainingTicks - 1);
  }
}

export function processStatusEffects(ctx: StatusEffectContext, tick: number): void {
  for (const [entityId, statusEffects] of ctx.world.componentEntries("statusEffects")) {
    const effects = [...statusEffects.effects];
    const activeThisTick: ActiveStatusEffect[] = [];
    const remaining: ActiveStatusEffect[] = [];

    for (const effect of effects) {
      if (effect.remainingTicks <= 0) {
        continue;
      }

      activeThisTick.push(effect);
      const def = effectDef(ctx.registries, effect.statusEffectId);
      if (!def) {
        effect.remainingTicks -= 1;
        if (effect.remainingTicks > 0) {
          remaining.push(effect);
        }
        continue;
      }

      if (def.effectType === "dot" || def.effectType === "hot") {
        if (def.effectType === "dot") {
          applyDotDamage(ctx, entityId, effect, def, tick);
        }
      } else if (def.effectType === "cc") {
        if (def.id === "freeze" || def.id === "stun") {
          applyFreeze(ctx, entityId, effect, tick);
        }
      } else if (def.effectType === "buff" || def.effectType === "debuff") {
        // Stat modifiers are applied via recomputeCombatStats after the loop
      }

      effect.remainingTicks -= 1;
      if (effect.remainingTicks > 0) {
        remaining.push(effect);
      }
    }

    // Recompute stats using all effects that were active during this tick
    if (activeThisTick.length > 0) {
      recomputeCombatStats(ctx, entityId, activeThisTick);
    }

    if (remaining.length === 0) {
      if (activeThisTick.length === 0) {
        ctx.world.removeComponent(entityId, "statusEffects");
        restoreBaseStats(ctx.world, entityId, statusEffects);
      } else {
        // Effects expired this tick; keep empty component for one tick so
        // base stats are restored on the next tick after the buff was active.
        const next: StatusEffectsComponent = {
          ...statusEffects,
          effects: [],
        };
        ctx.world.setComponent(entityId, "statusEffects", next);
      }
    } else {
      const next: StatusEffectsComponent = {
        ...statusEffects,
        effects: remaining,
      };
      ctx.world.setComponent(entityId, "statusEffects", next);
    }
  }
}
