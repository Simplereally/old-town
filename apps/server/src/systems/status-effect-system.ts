/**
 * Status-effect system (new tick phase).
 *
 * Maintains a flat {@link StatusEffectComponent} on entities with active effects.
 * Each tick:
 *   - DOTs deal damage, HOTs restore health.
 *   - Buff/debuff stat modifiers are applied against captured base stats.
 *   - Durations are decremented; expired effects are removed and base stats restored.
 *   - Deltas are emitted via the accumulator so the client can render them.
 */
import type { EntityId } from "@old-town/shared/types/ids";
import type { ActiveEffect, StatusEffectComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";

export interface StatusEffectContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
}

function getOrCreateComponent(
  world: World,
  entityId: EntityId,
): StatusEffectComponent {
  const existing = world.getComponent(entityId, "statusEffect");
  if (existing) {
    return existing;
  }
  const created: StatusEffectComponent = { entityId, activeEffects: [] };
  world.setComponent(entityId, "statusEffect", created);
  return created;
}

function captureBaseStats(world: World, component: StatusEffectComponent): void {
  if (component.baseStats) {
    return;
  }
  const combatant = world.getComponent(component.entityId, "combatant");
  if (!combatant) {
    return;
  }
  component.baseStats = {
    attackLevel: combatant.attackLevel,
    strengthLevel: combatant.strengthLevel,
    defenceLevel: combatant.defenceLevel,
  };
}

function restoreBaseStats(
  world: World,
  entityId: EntityId,
  component: StatusEffectComponent,
): void {
  const combatant = world.getComponent(entityId, "combatant");
  if (!combatant || !component.baseStats) {
    return;
  }
  world.setComponent(entityId, "combatant", {
    ...combatant,
    attackLevel: component.baseStats.attackLevel,
    strengthLevel: component.baseStats.strengthLevel,
    defenceLevel: component.baseStats.defenceLevel,
  });
}

function recomputeStats(
  world: World,
  entityId: EntityId,
  effects: readonly ActiveEffect[],
  baseStats?: StatusEffectComponent["baseStats"],
): void {
  const combatant = world.getComponent(entityId, "combatant");
  if (!combatant || !baseStats) {
    return;
  }
  let attackMod = 0;
  let strengthMod = 0;
  let defenceMod = 0;

  for (const effect of effects) {
    for (const [stat, value] of Object.entries(effect.statModifiers ?? {})) {
      if (stat === "attackLevel" || stat === "attack" || stat === "stabAttack" || stat === "slashAttack" || stat === "crushAttack") {
        attackMod += value;
      } else if (stat === "strengthLevel" || stat === "strength" || stat === "meleeStrength") {
        strengthMod += value;
      } else if (stat === "defenceLevel" || stat === "defence" || stat === "stabDefence" || stat === "slashDefence" || stat === "crushDefence") {
        defenceMod += value;
      }
    }
  }

  world.setComponent(entityId, "combatant", {
    ...combatant,
    attackLevel: Math.max(1, baseStats.attackLevel + attackMod),
    strengthLevel: Math.max(1, baseStats.strengthLevel + strengthMod),
    defenceLevel: Math.max(1, baseStats.defenceLevel + defenceMod),
  });
}

/** Apply (or refresh) an active effect on an entity. */
export function applyStatusEffect(
  ctx: StatusEffectContext,
  entityId: EntityId,
  effect: ActiveEffect,
): void {
  const component = getOrCreateComponent(ctx.world, entityId);
  const existing = component.activeEffects.find(
    (e) => e.effectId === effect.effectId,
  );
  if (existing) {
    existing.durationTicks = Math.max(
      existing.durationTicks,
      effect.durationTicks,
    );
    if (effect.damagePerTick !== undefined) {
      existing.damagePerTick = effect.damagePerTick;
    }
    if (effect.healPerTick !== undefined) {
      existing.healPerTick = effect.healPerTick;
    }
    if (effect.statModifiers !== undefined) {
      existing.statModifiers = effect.statModifiers;
    }
  } else {
    component.activeEffects.push(effect);
  }
  captureBaseStats(ctx.world, component);
  ctx.world.setComponent(entityId, "statusEffect", { ...component });
  recomputeStats(ctx.world, entityId, component.activeEffects, component.baseStats);
}

/** Remove a specific effect by id. Returns true if it was present. */
export function cureStatusEffect(
  ctx: StatusEffectContext,
  entityId: EntityId,
  effectId: string,
): boolean {
  const component = ctx.world.getComponent(entityId, "statusEffect");
  if (!component) {
    return false;
  }
  const next = component.activeEffects.filter((e) => e.effectId !== effectId);
  if (next.length === component.activeEffects.length) {
    return false;
  }
  if (next.length === 0) {
    ctx.world.removeComponent(entityId, "statusEffect");
    restoreBaseStats(ctx.world, entityId, component);
  } else {
    const updated: StatusEffectComponent = {
      entityId,
      activeEffects: next,
      ...(component.baseStats !== undefined ? { baseStats: component.baseStats } : {}),
    };
    ctx.world.setComponent(entityId, "statusEffect", updated);
    recomputeStats(ctx.world, entityId, next, component.baseStats);
  }
  return true;
}

/** Tick-phase entry: process all active effects. */
export function processStatusEffectTick(
  ctx: StatusEffectContext,
  _tick: number,
): void {
  for (const [entityId, component] of ctx.world.componentEntries("statusEffect")) {
    const activeEffects = [...component.activeEffects];
    const activeThisTick: ActiveEffect[] = [];
    const remaining: ActiveEffect[] = [];

    for (const effect of activeEffects) {
      if (effect.durationTicks <= 0) {
        continue;
      }

      activeThisTick.push(effect);

      // DOT
      if (effect.damagePerTick && effect.damagePerTick > 0) {
        const combatant = ctx.world.getComponent(entityId, "combatant");
        if (combatant && !combatant.dead && combatant.health > 0) {
          const damage = Math.min(effect.damagePerTick, combatant.health);
          const after = combatant.health - damage;
          ctx.world.setComponent(entityId, "combatant", {
            ...combatant,
            health: after,
          });
          ctx.deltas.markHitsplat({
            entityId,
            hitsplat: { amount: damage, type: "damage" },
          });
          ctx.deltas.markEntityUpdate(entityId, {
            healthBar: { current: after, max: combatant.maxHealth },
          });
        }
      }

      // HOT
      if (effect.healPerTick && effect.healPerTick > 0) {
        const combatant = ctx.world.getComponent(entityId, "combatant");
        if (combatant && !combatant.dead && combatant.health > 0) {
          const before = combatant.health;
          const after = Math.min(combatant.maxHealth, before + effect.healPerTick);
          const healed = after - before;
          if (healed > 0) {
            ctx.world.setComponent(entityId, "combatant", {
              ...combatant,
              health: after,
            });
            ctx.deltas.markHitsplat({
              entityId,
              hitsplat: { amount: healed, type: "heal" },
            });
            ctx.deltas.markEntityUpdate(entityId, {
              healthBar: { current: after, max: combatant.maxHealth },
            });
          }
        }
      }

      effect.durationTicks -= 1;
      if (effect.durationTicks > 0) {
        remaining.push(effect);
      }
    }

    if (activeThisTick.length > 0) {
      recomputeStats(ctx.world, entityId, activeThisTick, component.baseStats);
    }

    if (remaining.length === 0) {
      if (activeThisTick.length === 0) {
        ctx.world.removeComponent(entityId, "statusEffect");
        restoreBaseStats(ctx.world, entityId, component);
      } else {
        // Effects expired this tick; keep empty component for one tick so
        // base stats are restored on the next tick after the buff was active.
        const empty: StatusEffectComponent = {
          entityId,
          activeEffects: [],
          ...(component.baseStats !== undefined ? { baseStats: component.baseStats } : {}),
        };
        ctx.world.setComponent(entityId, "statusEffect", empty);
      }
    } else {
      const updated: StatusEffectComponent = {
        entityId,
        activeEffects: remaining,
        ...(component.baseStats !== undefined ? { baseStats: component.baseStats } : {}),
      };
      ctx.world.setComponent(entityId, "statusEffect", updated);
    }

    ctx.deltas.markEntityUpdate(entityId, {
      statusEffects: remaining,
    });
  }
}
