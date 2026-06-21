import {
  type CombatBonuses,
  type ContentRegistries,
  type EntityId,
  GAME_TICK_MS,
  type ItemDef,
  type NpcIntent,
  type Plane,
  type Rng,
  type TileCoord,
} from "@old-town/shared";
import type { CombatantComponent, CombatHitStyle, PendingHit } from "../ecs/components";
import type { World } from "../ecs/world";
import type { ActionQueue } from "../sim/action-queue";
import { InterruptGroup } from "../sim/action-queue";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { addXp, getCurrentLevel, type AddXpResult } from "../skills/skill-state";
import type { CollisionMap, Footprint } from "../world/collision";
import { validateBossAccess } from "./boss-system";
import { trackContractObjective } from "./contract-system";
import { type InteractionTarget, resolveInteraction } from "./interaction-reach";
import { handleMoveIntent } from "./movement-system";
import { npcFootprint } from "./npc-system";

export interface CombatSystemContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly actionQueue?: ActionQueue;
}

export interface CombatAttackContext extends CombatSystemContext {
  readonly rng: Rng;
}

export type CombatTargetFailure =
  | "missing_attacker"
  | "missing_target"
  | "not_attackable"
  | "dead"
  | "unreachable";

export interface CombatTargetValidation {
  readonly ok: boolean;
  readonly reason?: CombatTargetFailure;
  readonly actorTile?: TileCoord;
  readonly target?: InteractionTarget;
}

const ATTACK_ACTIONS = new Set(["attack"]);
const ONE_TILE: Footprint = { width: 1, length: 1 };
const MELEE_STYLES = new Set<CombatHitStyle>(["stab", "slash", "crush"]);

export const DEFAULT_UNARMED_SPEED_TICKS = 4;
export const DEFAULT_MELEE_RANGE_TILES = 1;
export const MELEE_HIT_DELAY_TICKS = 1;
export const MELEE_ATTACK_ANIMATION_ID = "melee_attack";
const COMBAT_XP_PER_DAMAGE = 4;
const HITPOINTS_XP_PER_DAMAGE = 1;

function positionTile(position: {
  readonly x: number;
  readonly y: number;
  readonly plane: Plane;
}): TileCoord {
  return { x: position.x, y: position.y, plane: position.plane };
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function announceCombatLevelUp(
  deltas: DeltaAccumulator,
  owner: EntityId,
  result: AddXpResult | undefined,
  serverTime: number,
): void {
  if (result?.levelUp) {
    systemMessage(
      deltas,
      owner,
      `Congratulations! You've advanced to level ${result.newLevel} ${result.skillId}.`,
      serverTime,
    );
  }
}

function targetFailureText(reason: CombatTargetFailure): string {
  switch (reason) {
    case "dead":
      return "That target is already defeated.";
    case "unreachable":
      return "You cannot reach that target.";
    default:
      return "You can't attack that.";
  }
}

function isDead(ctx: CombatSystemContext, entityId: EntityId): boolean {
  if (!ctx.world.isAlive(entityId)) {
    return true;
  }
  const combatant = ctx.world.getComponent(entityId, "combatant");
  return combatant?.dead === true || (combatant?.health ?? 1) <= 0;
}

function canAttackNpc(ctx: CombatSystemContext, targetId: EntityId): boolean {
  const npc = ctx.world.getComponent(targetId, "npc");
  if (!npc) {
    return false;
  }
  return (
    ctx.registries.npc
      .get(npc.npcId)
      ?.options.some((option) => ATTACK_ACTIONS.has(option.actionId)) === true
  );
}

function npcDef(ctx: CombatSystemContext, entityId: EntityId) {
  const npc = ctx.world.getComponent(entityId, "npc");
  return npc ? ctx.registries.npc.get(npc.npcId) : undefined;
}

function attackOption(
  ctx: CombatSystemContext,
  targetId: EntityId,
): {
  readonly requiredDistance: number;
  readonly requiresLineOfSight?: boolean;
} {
  const npc = ctx.world.getComponent(targetId, "npc");
  const option = npc
    ? ctx.registries.npc
        .get(npc.npcId)
        ?.options.find((candidate) => ATTACK_ACTIONS.has(candidate.actionId))
    : undefined;
  return {
    requiredDistance: option?.requiredDistance ?? 1,
    ...(option?.requiresLineOfSight !== undefined
      ? { requiresLineOfSight: option.requiresLineOfSight }
      : {}),
  };
}

function entityFootprint(ctx: CombatSystemContext, entityId: EntityId): Footprint {
  return ctx.world.hasComponent(entityId, "npc") ? npcFootprint(ctx, entityId) : ONE_TILE;
}

function combatTarget(ctx: CombatSystemContext, targetId: EntityId): InteractionTarget | undefined {
  const position = ctx.world.getComponent(targetId, "position");
  if (!position) {
    return undefined;
  }
  const option = attackOption(ctx, targetId);
  return {
    origin: positionTile(position),
    footprint: entityFootprint(ctx, targetId),
    requiredDistance: option.requiredDistance,
    faceTarget: true,
    ...(option.requiresLineOfSight !== undefined
      ? { requiresLineOfSight: option.requiresLineOfSight }
      : {}),
  };
}

export function validateCombatTarget(
  ctx: CombatSystemContext,
  attackerId: EntityId,
  targetId: EntityId,
): CombatTargetValidation {
  const attacker = ctx.world.getComponent(attackerId, "combatant");
  const actorPosition = ctx.world.getComponent(attackerId, "position");
  const target = ctx.world.getComponent(targetId, "combatant");
  if (!attacker || !actorPosition) {
    return { ok: false, reason: "missing_attacker" };
  }
  if (!target || !ctx.world.getComponent(targetId, "position")) {
    return { ok: false, reason: "missing_target" };
  }
  if (!canAttackNpc(ctx, targetId) && !ctx.world.hasComponent(targetId, "player")) {
    return { ok: false, reason: "not_attackable" };
  }
  if (isDead(ctx, targetId)) {
    return { ok: false, reason: "dead" };
  }
  const interactionTarget = combatTarget(ctx, targetId);
  if (!interactionTarget) {
    return { ok: false, reason: "missing_target" };
  }
  return { ok: true, actorTile: positionTile(actorPosition), target: interactionTarget };
}

export function assignCombatTarget(
  ctx: CombatSystemContext,
  attackerId: EntityId,
  targetId: EntityId,
): void {
  const combatant = ctx.world.getComponent(attackerId, "combatant");
  if (!combatant) {
    return;
  }
  ctx.world.setComponent(attackerId, "combatant", { ...combatant, targetId });
}

export function handleNpcCombatIntent(
  ctx: CombatSystemContext,
  owner: EntityId,
  intent: NpcIntent,
  serverTime: number,
  tick?: number,
): boolean {
  if (!ATTACK_ACTIONS.has(intent.actionId)) {
    return false;
  }
  if (!ctx.world.hasComponent(intent.npcEntityId, "npc")) {
    systemMessage(ctx.deltas, owner, targetFailureText("not_attackable"), serverTime);
    return true;
  }
  const validation = validateCombatTarget(ctx, owner, intent.npcEntityId);
  if (!validation.ok || !validation.actorTile || !validation.target) {
    systemMessage(
      ctx.deltas,
      owner,
      targetFailureText(validation.reason ?? "not_attackable"),
      serverTime,
    );
    return true;
  }

  // Boss access validation
  const bossAccess = validateBossAccess(
    { world: ctx.world, deltas: ctx.deltas, registries: ctx.registries },
    owner,
    intent.npcEntityId,
  );
  if (!bossAccess.ok) {
    systemMessage(
      ctx.deltas,
      owner,
      bossAccess.reason ?? "You cannot fight that boss.",
      serverTime,
    );
    return true;
  }

  assignCombatTarget(ctx, owner, intent.npcEntityId);
  const resolution = resolveInteraction(ctx, {
    actor: owner,
    actorTile: validation.actorTile,
    actorFootprint: entityFootprint(ctx, owner),
    target: validation.target,
  });
  if (resolution.kind === "ready") {
    return true;
  }
  if (resolution.kind === "path") {
    handleMoveIntent(
      { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
      owner,
      { dest: resolution.destination },
      { footprint: entityFootprint(ctx, owner), ...(tick !== undefined ? { tick } : {}) },
    );
    return true;
  }

  const combatant = ctx.world.getComponent(owner, "combatant");
  if (combatant) {
    ctx.world.setComponent(owner, "combatant", { ...combatant, targetId: undefined });
  }
  systemMessage(ctx.deltas, owner, targetFailureText("unreachable"), serverTime);
  return true;
}

export function assignAutoRetaliateTarget(
  ctx: CombatSystemContext,
  defenderId: EntityId,
  attackerId: EntityId,
): boolean {
  const defender = ctx.world.getComponent(defenderId, "combatant");
  if (!defender || defender.autoRetaliate === false || defender.targetId !== undefined) {
    return false;
  }
  if (isDead(ctx, defenderId) || isDead(ctx, attackerId)) {
    return false;
  }
  ctx.world.setComponent(defenderId, "combatant", { ...defender, targetId: attackerId });
  const npc = ctx.world.getComponent(defenderId, "npc");
  if (npc) {
    ctx.world.setComponent(defenderId, "npc", { ...npc, brainState: "chase" });
  }
  return true;
}

function clearTarget(ctx: CombatSystemContext, entityId: EntityId): void {
  const combatant = ctx.world.getComponent(entityId, "combatant");
  if (combatant?.targetId !== undefined) {
    ctx.world.setComponent(entityId, "combatant", { ...combatant, targetId: undefined });
  }
}

function equippedWeapon(ctx: CombatSystemContext, entityId: EntityId): ItemDef | undefined {
  const itemId = ctx.world.getComponent(entityId, "equipment")?.slots.weapon;
  const item = itemId ? ctx.registries.item.get(itemId) : undefined;
  return item?.equipment?.slot === "weapon" ? item : undefined;
}

function hasMeleeStyle(item: ItemDef): boolean {
  return item.equipment?.allowedStyles?.some((style) => MELEE_STYLES.has(style)) === true;
}

function meleeWeapon(ctx: CombatSystemContext, entityId: EntityId): ItemDef | undefined {
  const item = equippedWeapon(ctx, entityId);
  return item && hasMeleeStyle(item) ? item : undefined;
}

export function attackSpeedTicks(ctx: CombatSystemContext, entityId: EntityId): number {
  const defSpeed = npcDef(ctx, entityId)?.attackSpeedTicks;
  if (defSpeed !== undefined) {
    return defSpeed;
  }
  return meleeWeapon(ctx, entityId)?.equipment?.attackSpeedTicks ?? DEFAULT_UNARMED_SPEED_TICKS;
}

function attackRangeTiles(ctx: CombatSystemContext, entityId: EntityId): number {
  const defRange = npcDef(ctx, entityId)?.attackRangeTiles;
  if (defRange !== undefined) {
    return defRange;
  }
  return meleeWeapon(ctx, entityId)?.equipment?.attackRangeTiles ?? DEFAULT_MELEE_RANGE_TILES;
}

function meleeStyle(ctx: CombatSystemContext, entityId: EntityId): CombatHitStyle {
  const styles = meleeWeapon(ctx, entityId)?.equipment?.allowedStyles ?? [];
  // Honour the player's chosen style when the equipped weapon supports it; otherwise fall
  // back to the weapon's first melee style (and unarmed always resolves to crush).
  const preferred = ctx.world.getComponent(entityId, "combatant")?.combatStyle;
  if (preferred && MELEE_STYLES.has(preferred) && styles.includes(preferred)) {
    return preferred;
  }
  return styles.find((style) => MELEE_STYLES.has(style)) ?? "crush";
}

function bonus(ctx: CombatSystemContext, entityId: EntityId, field: keyof CombatBonuses): number {
  return (
    (ctx.world.getComponent(entityId, "equipment")?.bonuses[field] ?? 0) +
    (npcDef(ctx, entityId)?.bonuses?.[field] ?? 0)
  );
}

function attackBonusField(style: CombatHitStyle): keyof CombatBonuses {
  switch (style) {
    case "stab":
      return "stabAttack";
    case "slash":
      return "slashAttack";
    case "crush":
      return "crushAttack";
    case "ranged":
      return "rangedAttack";
    case "magic":
      return "magicAttack";
  }
}

function defenceBonusField(style: CombatHitStyle): keyof CombatBonuses {
  switch (style) {
    case "stab":
      return "stabDefence";
    case "slash":
      return "slashDefence";
    case "crush":
      return "crushDefence";
    case "ranged":
      return "rangedDefence";
    case "magic":
      return "magicDefence";
  }
}

function styleSkill(style: CombatHitStyle): string {
  switch (style) {
    case "stab":
      return "attack";
    case "slash":
      return "strength";
    case "crush":
      return "defence";
    case "ranged":
      return "ranged";
    case "magic":
      return "magic";
  }
}

function effectiveLevel(level: number): number {
  return Math.max(0, level) + 8;
}

export function computeAttackRoll(level: number, attackBonus: number): number {
  return effectiveLevel(level) * Math.max(0, attackBonus + 64);
}

export function computeDefenceRoll(level: number, defenceBonus: number): number {
  return effectiveLevel(level) * Math.max(0, defenceBonus + 64);
}

export function calculateHitChance(attackRoll: number, defenceRoll: number): number {
  if (attackRoll <= 0 || defenceRoll < 0) {
    return 0;
  }
  if (attackRoll > defenceRoll) {
    return 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
  }
  return attackRoll / (2 * (defenceRoll + 1));
}

export function computeMaxMeleeHit(strengthLevel: number, meleeStrengthBonus: number): number {
  return Math.max(
    0,
    Math.floor(0.5 + (effectiveLevel(strengthLevel) * Math.max(0, meleeStrengthBonus + 64)) / 640),
  );
}

export function computeMaxMagicHit(spellMaxHit: number, magicDamageBonus: number): number {
  return Math.max(0, spellMaxHit + Math.floor(Math.max(0, magicDamageBonus) / 10));
}

export interface MeleeHitRoll {
  readonly style: CombatHitStyle;
  readonly attackRoll: number;
  readonly defenceRoll: number;
  readonly hitChance: number;
  readonly maxHit: number;
  readonly damage: number;
  readonly hitLanded: boolean;
}

export function rollMeleeHit(
  ctx: CombatAttackContext,
  attackerId: EntityId,
  targetId: EntityId,
): MeleeHitRoll | undefined {
  const attacker = ctx.world.getComponent(attackerId, "combatant");
  const target = ctx.world.getComponent(targetId, "combatant");
  if (!attacker || !target) {
    return undefined;
  }

  const style = meleeStyle(ctx, attackerId);
  const attackRoll = computeAttackRoll(
    attacker.attackLevel,
    bonus(ctx, attackerId, attackBonusField(style)),
  );
  const defenceRoll = computeDefenceRoll(
    target.defenceLevel,
    bonus(ctx, targetId, defenceBonusField(style)),
  );
  const hitChance = calculateHitChance(attackRoll, defenceRoll);
  const maxHit = computeMaxMeleeHit(
    attacker.strengthLevel,
    bonus(ctx, attackerId, "meleeStrength"),
  );
  const hitLanded = ctx.rng.nextFloat() < hitChance;
  const damage = hitLanded ? ctx.rng.nextInt(0, maxHit) : 0;

  return { style, attackRoll, defenceRoll, hitChance, maxHit, damage, hitLanded };
}

function magicLevel(ctx: CombatSystemContext, entityId: EntityId): number {
  const skills = ctx.world.getComponent(entityId, "skills");
  if (skills) {
    return getCurrentLevel(skills, "magic");
  }
  return (
    npcDef(ctx, entityId)?.stats?.magic ??
    ctx.world.getComponent(entityId, "combatant")?.attackLevel ??
    1
  );
}

export function rollMagicHit(
  ctx: CombatAttackContext,
  casterId: EntityId,
  targetId: EntityId,
  spellMaxHit: number,
): MeleeHitRoll | undefined {
  const target = ctx.world.getComponent(targetId, "combatant");
  if (!ctx.world.getComponent(casterId, "combatant") || !target) {
    return undefined;
  }

  const style: CombatHitStyle = "magic";
  const attackRoll = computeAttackRoll(
    magicLevel(ctx, casterId),
    bonus(ctx, casterId, attackBonusField(style)),
  );
  const defenceRoll = computeDefenceRoll(
    Math.max(target.defenceLevel, magicLevel(ctx, targetId)),
    bonus(ctx, targetId, defenceBonusField(style)),
  );
  const hitChance = calculateHitChance(attackRoll, defenceRoll);
  const maxHit = computeMaxMagicHit(spellMaxHit, bonus(ctx, casterId, "magicDamage"));
  const hitLanded = ctx.rng.nextFloat() < hitChance;
  const damage = hitLanded ? ctx.rng.nextInt(0, maxHit) : 0;

  return { style, attackRoll, defenceRoll, hitChance, maxHit, damage, hitLanded };
}

export function appendPendingHit(
  ctx: CombatSystemContext,
  targetId: EntityId,
  hit: PendingHit,
): void {
  const target = ctx.world.getComponent(targetId, "combatant");
  if (!target) {
    return;
  }
  ctx.world.setComponent(targetId, "combatant", {
    ...target,
    pendingHits: [...(target.pendingHits ?? []), hit],
  });
}

function scheduleMeleeAttack(
  ctx: CombatAttackContext,
  attackerId: EntityId,
  targetId: EntityId,
  tick: number,
): void {
  const attacker = ctx.world.getComponent(attackerId, "combatant");
  const roll = rollMeleeHit(ctx, attackerId, targetId);
  if (!attacker || !roll) {
    return;
  }
  appendPendingHit(ctx, targetId, {
    sourceId: attackerId,
    targetId,
    applyTick: tick + MELEE_HIT_DELAY_TICKS,
    ...roll,
  });
  ctx.world.setComponent(attackerId, "combatant", {
    ...attacker,
    nextAttackTick: tick + attackSpeedTicks(ctx, attackerId),
  });
  ctx.deltas.markEntityUpdate(attackerId, {
    facingEntity: targetId,
    animation: { id: MELEE_ATTACK_ANIMATION_ID, startTick: tick },
  });
}

export function processCombatStartEvents(ctx: CombatAttackContext, tick: number): void {
  for (const [entityId, combatant] of ctx.world.componentEntries("combatant")) {
    const targetId = combatant.targetId;
    if (targetId === undefined || combatant.dead || combatant.health <= 0) {
      continue;
    }

    const validation = validateCombatTarget(ctx, entityId, targetId);
    if (!validation.ok || !validation.actorTile || !validation.target) {
      clearTarget(ctx, entityId);
      continue;
    }

    const target: InteractionTarget = {
      ...validation.target,
      requiredDistance: attackRangeTiles(ctx, entityId),
      faceTarget: true,
    };
    const resolution = resolveInteraction(ctx, {
      actor: entityId,
      actorTile: validation.actorTile,
      actorFootprint: entityFootprint(ctx, entityId),
      target,
    });

    if (resolution.kind === "path") {
      handleMoveIntent(
        { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
        entityId,
        { dest: resolution.destination },
        { footprint: entityFootprint(ctx, entityId), tick },
      );
      continue;
    }
    if (resolution.kind === "unreachable") {
      clearTarget(ctx, entityId);
      continue;
    }
    if (tick < (combatant.nextAttackTick ?? 0)) {
      continue;
    }

    scheduleMeleeAttack(ctx, entityId, targetId, tick);
  }
}

function updatePendingHits(
  ctx: CombatSystemContext,
  targetId: EntityId,
  combatant: CombatantComponent,
  pendingHits: PendingHit[],
): void {
  const next: CombatantComponent = { ...combatant, pendingHits };
  if (pendingHits.length === 0) {
    delete next.pendingHits;
  }
  ctx.world.setComponent(targetId, "combatant", next);
}

function awardCombatXp(
  ctx: CombatSystemContext,
  sourceId: EntityId,
  style: CombatHitStyle,
  damage: number,
  serverTime: number,
): void {
  if (damage <= 0) {
    return;
  }
  const source = ctx.world.getComponent(sourceId, "combatant");
  if (!source || source.dead || source.health <= 0) {
    return;
  }
  const styleResult = addXp(ctx, sourceId, styleSkill(style), damage * COMBAT_XP_PER_DAMAGE);
  const hpResult = addXp(ctx, sourceId, "hitpoints", damage * HITPOINTS_XP_PER_DAMAGE);
  announceCombatLevelUp(ctx.deltas, sourceId, styleResult, serverTime);
  announceCombatLevelUp(ctx.deltas, sourceId, hpResult, serverTime);
}

function applyPendingHit(
  ctx: CombatSystemContext,
  targetId: EntityId,
  combatant: CombatantComponent,
  hit: PendingHit,
  serverTime: number,
): CombatantComponent {
  if (hit.targetId !== targetId || combatant.dead || combatant.health <= 0) {
    return combatant;
  }

  const damage = Math.min(Math.max(0, hit.damage), combatant.health);
  const after = combatant.health - damage;
  const hitsplat = {
    amount: damage,
    type: damage > 0 ? ("damage" as const) : ("block" as const),
  };
  const next = {
    ...combatant,
    health: after,
    lastDamageSourceId: hit.sourceId,
  };
  ctx.world.setComponent(targetId, "combatant", next);
  ctx.deltas.markHitsplat({ entityId: targetId, hitsplat });
  if (damage > 0) {
    ctx.actionQueue?.interrupt(targetId, InterruptGroup.Combat);
    ctx.deltas.markEntityUpdate(targetId, {
      healthBar: { current: after, max: combatant.maxHealth },
    });
    awardCombatXp(ctx, hit.sourceId, hit.style, damage, serverTime);
  }
  if (after > 0) {
    assignAutoRetaliateTarget(ctx, targetId, hit.sourceId);
  }
  if (after <= 0) {
    const npc = ctx.world.getComponent(targetId, "npc");
    if (npc && hit.sourceId) {
      trackContractObjective(ctx, hit.sourceId, "kill", npc.npcId);
    }
  }
  return ctx.world.getComponent(targetId, "combatant") ?? next;
}

export function processDamageResolutionEvents(ctx: CombatSystemContext, tick: number): void {
  for (const [targetId, combatant] of ctx.world.componentEntries("combatant")) {
    const pendingHits = combatant.pendingHits ?? [];
    if (pendingHits.length === 0) {
      continue;
    }

    let current = combatant;
    const future: PendingHit[] = [];
    for (const hit of pendingHits) {
      if (hit.applyTick > tick) {
        future.push(hit);
        continue;
      }
      current = applyPendingHit(ctx, targetId, current, hit, tick * GAME_TICK_MS);
    }

    const latest = ctx.world.getComponent(targetId, "combatant") ?? current;
    updatePendingHits(ctx, targetId, latest, future);
  }
}

export function processCombatTargetValidation(ctx: CombatSystemContext): void {
  for (const [entityId, combatant] of ctx.world.componentEntries("combatant")) {
    const targetId = combatant.targetId;
    if (targetId === undefined) {
      continue;
    }
    const validation = validateCombatTarget(ctx, entityId, targetId);
    if (!validation.ok) {
      clearTarget(ctx, entityId);
      continue;
    }
    const npc = ctx.world.getComponent(entityId, "npc");
    const position = ctx.world.getComponent(entityId, "position");
    if (npc?.home && position) {
      const leashDistance = npc.leashDistance ?? npc.wanderRadius + 4;
      if (chebyshev(positionTile(position), npc.home) > leashDistance) {
        clearTarget(ctx, entityId);
        ctx.world.setComponent(entityId, "npc", { ...npc, brainState: "returnHome" });
      }
    }
  }
}
