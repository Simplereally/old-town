import {
  type ContentRegistries,
  chebyshevDistance,
  type EntityId,
  type InventorySlotChange,
  type Rng,
  type SpellDef,
  type SpellIntent,
  type SpellTarget,
  type TileCoord,
} from "@old-town/shared";
import type { World } from "../ecs/world";
import { buildDelta, count, hasAll, removeItem } from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import type { ActionHandler } from "../sim/action-executor";
import { type ActionExecution, ActionQueueType, InterruptGroup } from "../sim/action-queue";
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

export interface SpellSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly actionRuntime: ActionRuntime;
  readonly rng: Rng;
  readonly itemAudit?: ItemAuditLog | undefined;
}

interface ResolvedSpellTarget {
  readonly tile: TileCoord;
  readonly entityId?: EntityId;
}

function positionTile(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function combatTargetRequired(spell: SpellDef): boolean {
  return spell.effect.kind === "damage" || spell.effect.kind === "bind";
}

function targetTypeMessage(spell: SpellDef): string {
  switch (spell.targetType) {
    case "self":
      return "That spell is cast on yourself.";
    case "entity":
      return "That spell needs an entity target.";
    case "tile":
      return "That spell needs a tile target.";
    case "item":
      return "That spell needs an item target.";
  }
}

function resolveTarget(
  ctx: SpellSystemContext,
  owner: EntityId,
  spell: SpellDef,
  target: SpellTarget,
): ResolvedSpellTarget | string {
  if (spell.targetType === "self") {
    const tile = positionTile(ctx.world, owner);
    return target.kind === "none" && tile ? { tile, entityId: owner } : targetTypeMessage(spell);
  }

  if (spell.targetType === "tile") {
    return target.kind === "tile" ? { tile: target.tile } : targetTypeMessage(spell);
  }

  if (spell.targetType === "item") {
    return targetTypeMessage(spell);
  }

  if (target.kind !== "entity") {
    return targetTypeMessage(spell);
  }

  const tile = positionTile(ctx.world, target.entityId);
  if (!tile || !ctx.world.isAlive(target.entityId)) {
    return "That target is no longer there.";
  }

  if (combatTargetRequired(spell)) {
    const combatant = ctx.world.getComponent(target.entityId, "combatant");
    if (!combatant) {
      return "That spell cannot be cast on that target.";
    }
    if (combatant.dead === true || combatant.health <= 0) {
      return "That target is already dead.";
    }
  }

  return { tile, entityId: target.entityId };
}

function targetInRange(caster: TileCoord, target: TileCoord, rangeTiles: number): boolean {
  return caster.plane === target.plane && chebyshevDistance(caster, target) <= rangeTiles;
}

function validateCooldown(
  ctx: SpellSystemContext,
  owner: EntityId,
  spell: SpellDef,
  tick: number,
): string | undefined {
  const combatant = ctx.world.getComponent(owner, "combatant");
  if (!combatant) {
    return spell.cooldownTicks === undefined ? undefined : "You are not ready to cast spells.";
  }
  const readyTick = combatant.spellCooldowns?.[spell.id] ?? 0;
  return tick >= readyTick ? undefined : "That spell is not ready yet.";
}

function setCooldown(
  ctx: SpellSystemContext,
  owner: EntityId,
  spell: SpellDef,
  tick: number,
): void {
  const cooldownTicks = spell.cooldownTicks ?? 0;
  if (cooldownTicks <= 0) {
    return;
  }
  const combatant = ctx.world.getComponent(owner, "combatant");
  if (!combatant) {
    return;
  }
  ctx.world.setComponent(owner, "combatant", {
    ...combatant,
    spellCooldowns: {
      ...(combatant.spellCooldowns ?? {}),
      [spell.id]: tick + cooldownTicks,
    },
  });
}

function projectileId(
  owner: EntityId,
  spell: SpellDef,
  target: ResolvedSpellTarget,
  tick: number,
): string {
  const targetKey =
    target.entityId !== undefined
      ? `entity:${target.entityId}`
      : `tile:${target.tile.x}:${target.tile.y}:${target.tile.plane}`;
  return `${tick}:${owner}:${spell.id}:${targetKey}`;
}

function startDamageSpell(
  ctx: SpellSystemContext,
  owner: EntityId,
  spell: SpellDef,
  target: ResolvedSpellTarget,
  casterTile: TileCoord,
  tick: number,
): void {
  if (spell.effect.kind !== "damage" || target.entityId === undefined) {
    return;
  }
  const hit = rollMagicHit(ctx, owner, target.entityId, spell.effect.maxHit);
  if (!hit) {
    return;
  }
  const hitTick = tick + (spell.effect.hitDelayTicks ?? 2);
  appendPendingHit(ctx, target.entityId, {
    sourceId: owner,
    targetId: target.entityId,
    applyTick: hitTick,
    ...hit,
  });
  ctx.deltas.markEntityUpdate(owner, {
    facingEntity: target.entityId,
    animation: { id: SPELL_CAST_ANIMATION_ID, startTick: tick },
    graphic: { id: `${spell.id}_cast` },
  });
  ctx.deltas.markProjectile({
    id: projectileId(owner, spell, target, tick),
    projectileId: spell.effect.projectileId ?? spell.id,
    sourceEntityId: owner,
    targetEntityId: target.entityId,
    startTile: casterTile,
    endTile: target.tile,
    startTick: tick,
    hitTick,
  });
}

function startBindSpell(
  ctx: SpellSystemContext,
  owner: EntityId,
  spell: SpellDef,
  target: ResolvedSpellTarget,
  tick: number,
): void {
  if (spell.effect.kind !== "bind" || target.entityId === undefined) {
    return;
  }
  ctx.deltas.markEntityUpdate(owner, {
    facingEntity: target.entityId,
    animation: { id: SPELL_CAST_ANIMATION_ID, startTick: tick },
    graphic: { id: `${spell.id}_cast` },
  });
  applyMovementBlock(ctx, target.entityId, tick + spell.effect.durationTicks, {
    overheadText: SPELL_BIND_OVERHEAD_TEXT,
    graphicId: `${spell.id}_bind`,
  });
}

function teleportActionId(owner: EntityId, spellId: string): string {
  return `teleport:${owner}:${spellId}`;
}

function startTeleportSpell(
  ctx: SpellSystemContext,
  owner: EntityId,
  spell: SpellDef,
  tick: number,
): void {
  if (spell.effect.kind !== "teleport") {
    return;
  }
  const destination = spell.effect.destination;
  if (!destination) {
    return;
  }
  const id = teleportActionId(owner, spell.id);
  const payload: TeleportActionPayload = { kind: "teleport", spellId: spell.id, destination };
  ctx.actionRuntime.cancel(owner, { id });
  ctx.actionRuntime.enqueue({
    id,
    owner,
    type: spell.effect.interruptible ? ActionQueueType.Weak : ActionQueueType.Normal,
    delayTicks: spell.effect.delayTicks,
    interruptGroup: InterruptGroup.Combat,
    payload,
  });
  ctx.deltas.markEntityUpdate(owner, {
    animation: { id: TELEPORT_CAST_ANIMATION_ID, startTick: tick },
    graphic: { id: `${spell.id}_channel` },
    moveSpeed: "stationary",
  });
}

function validateSpellEffect(spell: SpellDef): string | undefined {
  switch (spell.effect.kind) {
    case "damage":
    case "bind":
      return undefined;
    case "teleport":
      return spell.effect.destination ? undefined : "You cannot teleport from here.";
    case "alchemy":
    case "enchant":
      return "That spell is not yet implemented.";
  }
}

export function completeTeleportAction(
  ctx: SpellSystemContext,
  action: ActionExecution,
  payload: TeleportActionPayload,
): boolean {
  if (
    !ctx.world.isAlive(action.entry.owner) ||
    !ctx.world.hasComponent(action.entry.owner, "position")
  ) {
    return true;
  }
  const movement = ctx.world.getComponent(action.entry.owner, "movement");
  ctx.world.setComponent(action.entry.owner, "position", {
    entityId: action.entry.owner,
    x: payload.destination.x,
    y: payload.destination.y,
    plane: payload.destination.plane,
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
  return true;
}

export function createSpellActionHandlers(ctx: SpellSystemContext): SpellHandlerTable {
  return {
    teleport: (payload, actionCtx) => completeTeleportAction(ctx, actionCtx.execution, payload),
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

  const target = resolveTarget(ctx, owner, spell, intent.target);
  if (typeof target === "string") {
    systemMessage(ctx.deltas, owner, target, serverTime);
    return true;
  }
  if (!targetInRange(casterTile, target.tile, spell.rangeTiles)) {
    systemMessage(ctx.deltas, owner, "That target is too far away.", serverTime);
    return true;
  }
  if (
    spell.requiresLineOfSight &&
    !ctx.collision.hasLineOfSight(casterTile, target.tile, { projectile: true })
  ) {
    systemMessage(ctx.deltas, owner, "You cannot see that target.", serverTime);
    return true;
  }

  const effectError = validateSpellEffect(spell);
  if (effectError) {
    systemMessage(ctx.deltas, owner, effectError, serverTime);
    return true;
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory || !hasAll(inventory, spell.beadCosts)) {
    systemMessage(ctx.deltas, owner, "You do not have the required beads.", serverTime);
    return true;
  }

  const changes: InventorySlotChange[] = [];
  for (const cost of spell.beadCosts) {
    const beforeQuantity = count(inventory, cost.itemId);
    const removed = removeItem(inventory, cost.itemId, cost.quantity);
    changes.push(...removed.changes);
    if (removed.removed > 0) {
      ctx.itemAudit?.recordForEntity(owner, {
        tick,
        itemId: cost.itemId,
        quantity: removed.removed,
        reason: "spell_bead_cost",
        beforeQuantity,
        afterQuantity: count(inventory, cost.itemId),
        metadata: {
          spellId: spell.id,
          spellbook: spell.spellbook,
          targetKind: intent.target.kind,
        },
      });
    }
  }
  if (changes.length > 0) {
    ctx.deltas.markInventoryDelta(buildDelta(inventory, changes));
  }
  setCooldown(ctx, owner, spell, tick);
  addXp(ctx, owner, "magic", spell.castXp);
  startDamageSpell(ctx, owner, spell, target, casterTile, tick);
  startBindSpell(ctx, owner, spell, target, tick);
  startTeleportSpell(ctx, owner, spell, tick);
  return true;
}
