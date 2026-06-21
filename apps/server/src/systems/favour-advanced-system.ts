import type { ContentRegistries } from "@old-town/shared/content/content-registries";
import type { EntityId } from "@old-town/shared/types/ids";
import type { World } from "../ecs/world";
import { count, removeItem } from "../items/inventory";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { deductXp } from "../skills/skill-state";
import { applyStatusEffect, type StatusEffectContext } from "./status-effect-system";

export interface BoonDef {
  id: string;
  name: string;
  requiredFavour: number;
  effectId: string;
  durationTicks: number;
  favourCost: number;
}

export interface OathDef {
  id: string;
  name: string;
  requiredFavour: number;
  restriction: string;
  benefit: {
    skillId: string;
    boostAmount: number;
  };
  favourCost: number;
}

export interface RiteDef {
  id: string;
  name: string;
  requiredFavour: number;
  requiredItems: Array<{ itemId: string; quantity: number }>;
  outcome: {
    xpRewards?: Array<{ skillId: string; amount: number }>;
    itemRewards?: Array<{ itemId: string; quantity: number }>;
    statusEffectId?: string;
    effectDurationTicks?: number;
  };
  favourCost: number;
}

export interface FavourAdvancedContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
}

function systemMessage(
  ctx: FavourAdvancedContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

export function getFavourLevel(world: World, entityId: EntityId): number {
  const skills = world.getComponent(entityId, "skills");
  if (!skills) return 0;
  const favour = skills.skills.favour;
  if (!favour) return 0;
  return favour.level;
}

export function hasFavour(world: World, entityId: EntityId, requiredLevel: number): boolean {
  return getFavourLevel(world, entityId) >= requiredLevel;
}

export function deductFavourXp(
  ctx: FavourAdvancedContext,
  entityId: EntityId,
  amount: number,
): boolean {
  const result = deductXp({ world: ctx.world, deltas: ctx.deltas }, entityId, "favour", amount);
  return result !== undefined;
}

export function getActiveOathId(world: World, entityId: EntityId): string | undefined {
  const vars = world.getComponent(entityId, "vars");
  if (!vars) return undefined;
  const value = vars.values["favour:activeOath"];
  return typeof value === "string" ? value : undefined;
}

export function hasActiveOath(world: World, entityId: EntityId, oathId: string): boolean {
  return getActiveOathId(world, entityId) === oathId;
}

export function activateBoon(
  ctx: FavourAdvancedContext,
  entityId: EntityId,
  boon: BoonDef,
  serverTime: number,
): boolean {
  if (!hasFavour(ctx.world, entityId, boon.requiredFavour)) {
    systemMessage(
      ctx,
      entityId,
      `You need Favour level ${boon.requiredFavour} to activate ${boon.name}.`,
      serverTime,
    );
    return false;
  }

  const success = deductFavourXp(ctx, entityId, boon.favourCost);
  if (!success) {
    systemMessage(
      ctx,
      entityId,
      "You do not have enough Favour to activate this boon.",
      serverTime,
    );
    return false;
  }

  const statusCtx: StatusEffectContext = {
    world: ctx.world,
    deltas: ctx.deltas,
  };

  applyStatusEffect(statusCtx, entityId, {
    effectId: boon.effectId,
    durationTicks: boon.durationTicks,
  });

  systemMessage(ctx, entityId, `The ${boon.name} boon washes over you.`, serverTime);
  return true;
}

export function bindOath(
  ctx: FavourAdvancedContext,
  entityId: EntityId,
  oath: OathDef,
  serverTime: number,
): boolean {
  if (!hasFavour(ctx.world, entityId, oath.requiredFavour)) {
    systemMessage(
      ctx,
      entityId,
      `You need Favour level ${oath.requiredFavour} to bind the ${oath.name}.`,
      serverTime,
    );
    return false;
  }

  const currentOath = getActiveOathId(ctx.world, entityId);
  if (currentOath) {
    systemMessage(
      ctx,
      entityId,
      "You are already bound to an oath. You must break it first.",
      serverTime,
    );
    return false;
  }

  const success = deductFavourXp(ctx, entityId, oath.favourCost);
  if (!success) {
    systemMessage(ctx, entityId, "You do not have enough Favour to bind this oath.", serverTime);
    return false;
  }

  const vars = ctx.world.getComponent(entityId, "vars");
  if (vars) {
    vars.values["favour:activeOath"] = oath.id;
    vars.values[`favour:oath:${oath.id}:restriction`] = oath.restriction;
  } else {
    ctx.world.setComponent(entityId, "vars", {
      entityId,
      values: {
        "favour:activeOath": oath.id,
        [`favour:oath:${oath.id}:restriction`]: oath.restriction,
      },
    });
  }

  const skills = ctx.world.getComponent(entityId, "skills");
  if (skills) {
    const skill = skills.skills[oath.benefit.skillId];
    if (skill) {
      skill.boost += oath.benefit.boostAmount;
      ctx.deltas.markSkillDelta({
        skillId: oath.benefit.skillId,
        level: skill.level,
        xp: skill.xp,
        effectiveLevel: Math.max(1, skill.level + skill.boost - skill.drain),
      });
    }
  }

  systemMessage(ctx, entityId, `You bind the ${oath.name} oath. ${oath.restriction}`, serverTime);
  return true;
}

export function breakOath(
  ctx: FavourAdvancedContext,
  entityId: EntityId,
  serverTime: number,
): boolean {
  const currentOathId = getActiveOathId(ctx.world, entityId);
  if (!currentOathId) {
    systemMessage(ctx, entityId, "You are not bound to any oath.", serverTime);
    return false;
  }

  const vars = ctx.world.getComponent(entityId, "vars");
  if (vars) {
    delete vars.values["favour:activeOath"];
    delete vars.values[`favour:oath:${currentOathId}:restriction`];
  }

  systemMessage(ctx, entityId, "You break your oath.", serverTime);
  return true;
}

export function performRite(
  ctx: FavourAdvancedContext,
  entityId: EntityId,
  rite: RiteDef,
  serverTime: number,
): boolean {
  if (!hasFavour(ctx.world, entityId, rite.requiredFavour)) {
    systemMessage(
      ctx,
      entityId,
      `You need Favour level ${rite.requiredFavour} to perform ${rite.name}.`,
      serverTime,
    );
    return false;
  }

  const inventory = ctx.world.getComponent(entityId, "inventory");
  if (!inventory) {
    systemMessage(ctx, entityId, "You need an inventory to perform this rite.", serverTime);
    return false;
  }

  for (const req of rite.requiredItems) {
    if (count(inventory, req.itemId) < req.quantity) {
      systemMessage(
        ctx,
        entityId,
        `You need ${req.quantity} ${req.itemId} to perform ${rite.name}.`,
        serverTime,
      );
      return false;
    }
  }

  const success = deductFavourXp(ctx, entityId, rite.favourCost);
  if (!success) {
    systemMessage(ctx, entityId, "You do not have enough Favour to perform this rite.", serverTime);
    return false;
  }

  for (const req of rite.requiredItems) {
    const removed = removeItem(inventory, req.itemId, req.quantity);
    if (removed.removed > 0) {
      ctx.deltas.markInventoryDelta({
        containerId: inventory.containerId,
        changes: removed.changes,
      });
    }
  }

  const statusCtx: StatusEffectContext = {
    world: ctx.world,
    deltas: ctx.deltas,
  };

  if (rite.outcome.xpRewards) {
    for (const reward of rite.outcome.xpRewards) {
      const skills = ctx.world.getComponent(entityId, "skills");
      const skill = skills?.skills[reward.skillId];
      if (skill) {
        skill.xp += reward.amount;
        const newLevel = skill.level;
        ctx.deltas.markXpDrop({ skillId: reward.skillId, amount: reward.amount });
        ctx.deltas.markSkillDelta({
          skillId: reward.skillId,
          level: newLevel,
          xp: skill.xp,
          effectiveLevel: Math.max(1, newLevel + skill.boost - skill.drain),
        });
      }
    }
  }

  if (rite.outcome.statusEffectId) {
    applyStatusEffect(statusCtx, entityId, {
      effectId: rite.outcome.statusEffectId,
      durationTicks: rite.outcome.effectDurationTicks ?? 10,
    });
  }

  systemMessage(ctx, entityId, `You complete the ${rite.name} rite.`, serverTime);
  return true;
}
