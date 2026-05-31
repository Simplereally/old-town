import {
  type ContentRegistries,
  chebyshevDistance,
  type EntityId,
  type Rng,
  type SpellDef,
  type SpellIntent,
  type SpellTarget,
  type TileCoord,
} from "@old-town/shared";
import type { World } from "../ecs/world";
import { buildDelta, hasAll, removeItem } from "../items/inventory";
import type { ActionHandler } from "../sim/action-executor";
import { ActionQueueType, InterruptGroup, type ActionExecution } from "../sim/action-queue";
import type { ActionRuntime } from "../sim/action-runtime";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { addXp, getCurrentLevel } from "../skills/skill-state";
import type { CollisionMap } from "../world/collision";
import { appendPendingHit, rollMagicHit } from "./combat-system";
import { applyMovementBlock } from "./movement-system";

export const DEFAULT_SPELLBOOK: SpellDef["spellbook"] = "common";
export const SPELL_CAST_ANIMATION_ID = "magic_cast";
export const SPELL_BIND_OVERHEAD_TEXT = "Bound";
export const TELEPORT_CAST_ANIMATION_ID = "home_teleport_channel";

export interface TeleportActionPayload {
  readonly kind: "teleport";
  readonly spellId: string;
  readonly destination: TileCoord;
}

export type SpellPayload = TeleportActionPayload;

export type SpellKind = SpellPayload["kind"];

export type SpellHandlerTable = {
  [K in SpellKind]: ActionHandler<Extract<SpellPayload, { kind: K }>>;
};

interface ResolvedSpellTarget {
  readonly tile: TileCoord;
  readonly entityId?: EntityId;
}

export interface SpellSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly actionRuntime: ActionRuntime;
  readonly rng: Rng;
}

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function positionTile(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? {
        x: position.x,
        y: position.y,
        plane: position.plane as TileCoord["plane"],
      }
    : undefined;
}

function combatTargetRequired(spell: SpellDef): boolean {
  return spell.effect.kind === "damage" || spell.effect.kind === "bind";
}

function targetInRange(
  casterTile: TileCoord,
  targetTile: TileCoord,
  rangeTiles: number,
): boolean {
  return chebyshevDistance(casterTile, targetTile) <= rangeTiles;
}

function resolveTarget(
  ctx: SpellSystemContext,
  _owner: EntityId,
  spell: SpellDef,
  target: SpellTarget,
): ResolvedSpellTarget | string {
  switch (target.kind) {
    case "none": {
      if (combatTargetRequired(spell)) {
        return "You need a target for that spell.";
      }
      const casterTile = positionTile(ctx.world, _owner);
      if (!casterTile) {
        return "You cannot cast from here.";
      }
      return { tile: casterTile };
    }
    case "entity": {
      const entityTile = positionTile(ctx.world, target.entityId);
      if (!entityTile) {
        return "That target is not available.";
      }
      return { tile: entityTile, entityId: target.entityId };
    }
    case "tile": {
      return { tile: target.tile };
    }
  }
}

function getCooldowns(world: World, entityId: EntityId): Record<string, number> {
  const combatant = world.getComponent(entityId, "combatant");
  return combatant?.spellCooldowns ?? {};
}

function setCooldowns(world: World, entityId: EntityId, cooldowns: Record<string, number>): void {
  const combatant = world.getComponent(entityId, "combatant");
  if (!combatant) {
    return;
  }
  world.setComponent(entityId, "combatant", {
    ...combatant,
    spellCooldowns: cooldowns,
  });
}

function validateCooldown(
  ctx: SpellSystemContext,
  entityId: EntityId,
  spell: SpellDef,
  tick: number,
): string | undefined {
  if (!spell.cooldownTicks) {
    return undefined;
  }
  const cooldowns = getCooldowns(ctx.world, entityId);
  const availableTick = cooldowns[spell.id];
  if (availableTick !== undefined && availableTick > tick) {
    const remaining = Math.ceil((availableTick - tick) * 0.6);
    return `You must wait ${remaining}s before casting ${spell.name} again.`;
  }
  return undefined;
}

function setCooldown(
  ctx: SpellSystemContext,
  entityId: EntityId,
  spell: SpellDef,
  tick: number,
): void {
  if (!spell.cooldownTicks) {
    return;
  }
  const cooldowns = { ...getCooldowns(ctx.world, entityId) };
  cooldowns[spell.id] = tick + spell.cooldownTicks;
  setCooldowns(ctx.world, entityId, cooldowns);
}

function startDamageSpell(
  ctx: SpellSystemContext,
  caster: EntityId,
  spell: SpellDef,
  resolved: ResolvedSpellTarget,
  _casterTile: TileCoord,
  tick: number,
): void {
  if (spell.effect.kind !== "damage") {
    return;
  }
  const targetEntityId = resolved.entityId;
  if (!targetEntityId) {
    return;
  }
  const hit = rollMagicHit(ctx, caster, targetEntityId, spell.effect.maxHit);
  if (!hit) {
    return;
  }
  const pendingHit = {
    sourceId: caster,
    targetId: targetEntityId,
    applyTick: tick,
    style: hit.style,
    attackRoll: hit.attackRoll,
    defenceRoll: hit.defenceRoll,
    hitChance: hit.hitChance,
    maxHit: hit.maxHit,
    damage: hit.damage,
    hitLanded: hit.hitLanded,
  };
  appendPendingHit(ctx, targetEntityId, pendingHit);
}

function startBindSpell(
  ctx: SpellSystemContext,
  caster: EntityId,
  spell: SpellDef,
  resolved: ResolvedSpellTarget,
  tick: number,
): void {
  if (spell.effect.kind !== "bind") {
    return;
  }
  const targetEntityId = resolved.entityId;
  if (!targetEntityId) {
    return;
  }
  const hit = rollMagicHit(ctx, caster, targetEntityId, spell.effect.maxHit);
  if (hit && hit.damage > 0) {
    const pendingHit = {
      sourceId: caster,
      targetId: targetEntityId,
      applyTick: tick,
      style: hit.style,
      attackRoll: hit.attackRoll,
      defenceRoll: hit.defenceRoll,
      hitChance: hit.hitChance,
      maxHit: hit.maxHit,
      damage: hit.damage,
      hitLanded: hit.hitLanded,
    };
    appendPendingHit(ctx, targetEntityId, pendingHit);
  }
  applyMovementBlock(ctx, targetEntityId, tick + spell.effect.durationTicks);
}

function startTeleportSpell(
  ctx: SpellSystemContext,
  caster: EntityId,
  spell: SpellDef,
  tick: number,
): void {
  if (spell.effect.kind !== "teleport") {
    return;
  }
  const actionId = `teleport:${spell.id}:${caster}`;
  ctx.actionRuntime.cancel(caster, { id: actionId });
  const payload: TeleportActionPayload = {
    kind: "teleport",
    spellId: spell.id,
    destination: spell.effect.destination ?? { x: 0, y: 0, plane: 0 },
  };
  ctx.actionRuntime.enqueue({
    id: actionId,
    owner: caster,
    type: ActionQueueType.Weak,
    delayTicks: spell.effect.delayTicks,
    interruptGroup: InterruptGroup.Skilling,
    payload,
  });
  ctx.deltas.markEntityUpdate(caster, {
    animation: { id: TELEPORT_CAST_ANIMATION_ID, startTick: tick },
  });
}

export function completeTeleportAction(
  ctx: SpellSystemContext,
  action: ActionExecution,
  payload: TeleportActionPayload,
): void {
  const movement = ctx.world.getComponent(action.entry.owner, "movement");
  ctx.world.setComponent(action.entry.owner, "position", {
    entityId: action.entry.owner,
    ...payload.destination,
  });
  ctx.world.setComponent(action.entry.owner, "movement", {
    entityId: action.entry.owner,
    mode: movement?.mode ?? "walk",
    path: [],
    ...(movement?.lastStepDirection !== undefined
      ? { lastStepDirection: movement.lastStepDirection }
      : {}),
  });
  ctx.deltas.markEntityUpdate(action.entry.owner, {
    position: payload.destination,
    moveSpeed: "stationary",
    graphic: { id: `${payload.spellId}_arrive` },
  });
  ctx.deltas.markDebugPath(action.entry.owner, []);
}

export function createSpellActionHandlers(ctx: SpellSystemContext): SpellHandlerTable {
  return {
    teleport: (payload, actionCtx) =>
      completeTeleportAction(ctx, actionCtx.execution, payload),
  };
}

export function handleSpellIntent(
  ctx: SpellSystemContext,
  owner: EntityId,
  intent: SpellIntent,
  tick: number,
  serverTime: number,
): boolean {
  const spell = ctx.registries.spell.get(intent.spellId);
  if (!spell) {
    systemMessage(ctx.deltas, owner, "You do not know that spell.", serverTime);
    return true;
  }

  const player = ctx.world.getComponent(owner, "player");
  if (!player) {
    systemMessage(ctx.deltas, owner, "Only players can cast spells.", serverTime);
    return true;
  }
  if ((player.spellbook ?? DEFAULT_SPELLBOOK) !== spell.spellbook) {
    systemMessage(ctx.deltas, owner, "You cannot cast from that spellbook.", serverTime);
    return true;
  }
  if (combatTargetRequired(spell) && !ctx.world.getComponent(owner, "combatant")) {
    systemMessage(ctx.deltas, owner, "You are not ready to cast spells.", serverTime);
    return true;
  }

  const skills = ctx.world.getComponent(owner, "skills");
  if (getCurrentLevel(skills ?? { entityId: owner, skills: {} }, "magic") < spell.requiredMagic) {
    systemMessage(
      ctx.deltas,
      owner,
      `You need Magic level ${spell.requiredMagic} to cast ${spell.name}.`,
      serverTime,
    );
    return true;
  }

  const cooldownError = validateCooldown(ctx, owner, spell, tick);
  if (cooldownError) {
    systemMessage(ctx.deltas, owner, cooldownError, serverTime);
    return true;
  }

  const casterTile = positionTile(ctx.world, owner);
  if (!casterTile) {
    systemMessage(ctx.deltas, owner, "You cannot cast from here.", serverTime);
    return true;
  }

  const resolvedTarget = resolveTarget(ctx, owner, spell, intent.target);
  if (typeof resolvedTarget === "string") {
    systemMessage(ctx.deltas, owner, resolvedTarget, serverTime);
    return true;
  }
  if (!targetInRange(casterTile, resolvedTarget.tile, spell.rangeTiles)) {
    systemMessage(ctx.deltas, owner, "That target is too far away.", serverTime);
    return true;
  }
  if (
    spell.requiresLineOfSight &&
    !ctx.collision.hasLineOfSight(casterTile, resolvedTarget.tile, { projectile: true })
  ) {
    systemMessage(ctx.deltas, owner, "You cannot see that target.", serverTime);
    return true;
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory || !hasAll(inventory, spell.beadCosts)) {
    systemMessage(ctx.deltas, owner, "You do not have the required beads.", serverTime);
    return true;
  }

  const changes = spell.beadCosts.flatMap((cost) => {
    const result = removeItem(inventory, cost.itemId, cost.quantity);
    return result.changes;
  });
  if (changes.length > 0) {
    ctx.deltas.markInventoryDelta(buildDelta(inventory, changes));
  }
  setCooldown(ctx, owner, spell, tick);
  addXp(ctx, owner, "magic", spell.castXp);
  startDamageSpell(ctx, owner, spell, resolvedTarget, casterTile, tick);
  startBindSpell(ctx, owner, spell, resolvedTarget, tick);
  startTeleportSpell(ctx, owner, spell, tick);
  return true;
}
