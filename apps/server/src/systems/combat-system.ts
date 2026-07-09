import {
  type CombatBonuses,
  type CombatStyleMode,
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
import { type AddXpResult, addXp, getCurrentLevel } from "../skills/skill-state";
import type { CollisionMap, Footprint } from "../world/collision";
import { validateBossAccess } from "./boss-system";
import { trackContractObjective } from "./contract-system";
import {
  type InteractionShape,
  type InteractionTarget,
  nearestFootprintTile,
  resolveInteraction,
} from "./interaction-reach";
import { handleMoveIntent } from "./movement-system";
import { npcFootprint } from "./npc-system";
import {
  applyPrayerProtection,
  hitStyleToProtectionStyle,
  type PrayerSystemContext,
  prayerBoostedLevel,
} from "./prayer-system";

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
export const RANGED_ATTACK_ANIMATION_ID = "ranged_attack";
export const DEFAULT_RANGED_HIT_DELAY_TICKS = 2;
const COMBAT_XP_PER_DAMAGE = 4;
const MAGIC_XP_PER_DAMAGE = 2;
const HITPOINTS_XP_PER_DAMAGE = 1.33;

function prayerContext(ctx: CombatSystemContext): PrayerSystemContext {
  return { world: ctx.world, deltas: ctx.deltas, registries: ctx.registries };
}

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
  const range = attackRangeTiles(ctx, owner);
  const resolution = resolveInteraction(ctx, {
    actor: owner,
    actorTile: validation.actorTile,
    actorFootprint: entityFootprint(ctx, owner),
    target: {
      ...validation.target,
      requiredDistance: range,
      requiredShape: attackShape(range),
      faceTarget: true,
    },
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
  const defenderNpc = npcDef(ctx, defenderId);
  if (defenderNpc?.aggressionMode === "peaceful") {
    return false;
  }
  if (isDead(ctx, defenderId) || isDead(ctx, attackerId)) {
    return false;
  }
  // Don't auto-retaliate while the defender is actively walking somewhere.
  // This prevents combat pathing from overriding a player's move destination.
  const movement = ctx.world.getComponent(defenderId, "movement");
  if (movement && (movement.path.length > 0 || movement.destination !== undefined)) {
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

function hasRangedStyle(item: ItemDef): boolean {
  return item.equipment?.allowedStyles?.some((style) => style === "ranged") === true;
}

function rangedWeapon(ctx: CombatSystemContext, entityId: EntityId): ItemDef | undefined {
  const item = equippedWeapon(ctx, entityId);
  return item && hasRangedStyle(item) ? item : undefined;
}

/** Whether the entity's equipped weapon (or npc def) fights at range. */
function isRangedAttacker(ctx: CombatSystemContext, entityId: EntityId): boolean {
  if (rangedWeapon(ctx, entityId)) {
    return true;
  }
  const def = npcDef(ctx, entityId);
  return def?.attackRangeTiles !== undefined && def.attackRangeTiles > 1;
}

export function attackSpeedTicks(ctx: CombatSystemContext, entityId: EntityId): number {
  const defSpeed = npcDef(ctx, entityId)?.attackSpeedTicks;
  if (defSpeed !== undefined) {
    return defSpeed;
  }
  const weapon = meleeWeapon(ctx, entityId) ?? rangedWeapon(ctx, entityId);
  return weapon?.equipment?.attackSpeedTicks ?? DEFAULT_UNARMED_SPEED_TICKS;
}

function attackRangeTiles(ctx: CombatSystemContext, entityId: EntityId): number {
  const defRange = npcDef(ctx, entityId)?.attackRangeTiles;
  if (defRange !== undefined) {
    return defRange;
  }
  const weapon = meleeWeapon(ctx, entityId) ?? rangedWeapon(ctx, entityId);
  return weapon?.equipment?.attackRangeTiles ?? DEFAULT_MELEE_RANGE_TILES;
}

/**
 * OSRS: melee (reach of a single tile) cannot strike diagonally — its reachable
 * tiles form a cardinal "plus". Reach weapons, ranged and magic (range >= 2) use the
 * Chebyshev "square" where diagonals count.
 */
function attackShape(range: number): InteractionShape {
  return range <= 1 ? "plus" : "square";
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

/**
 * Default combat style mode when the player hasn't chosen one (POC_SPEC §13.5.2).
 * Matches OSRS wiki defaults: stab→accurate (Attack), slash→aggressive (Strength),
 * crush→defensive (Defence), ranged/magic→accurate.
 */
function defaultStyleMode(style: CombatHitStyle): CombatStyleMode {
  switch (style) {
    case "slash":
      return "aggressive";
    case "crush":
      return "defensive";
    default:
      return "accurate";
  }
}

/**
 * Resolve the effective style mode for an attacker: honour the player's chosen
 * `combatStyleMode` when the weapon allows it, otherwise fall back to the style's
 * default mode.
 */
function styleModeAllowed(style: CombatHitStyle, mode: CombatStyleMode): boolean {
  if (style === "ranged" || style === "magic") {
    return mode === "accurate" || mode === "longrange";
  }
  return (
    mode === "accurate" || mode === "aggressive" || mode === "defensive" || mode === "controlled"
  );
}

function resolveStyleMode(
  ctx: CombatSystemContext,
  entityId: EntityId,
  style: CombatHitStyle,
): CombatStyleMode {
  const chosen = ctx.world.getComponent(entityId, "combatant")?.combatStyleMode;
  if (chosen && styleModeAllowed(style, chosen)) {
    return chosen;
  }
  return defaultStyleMode(style);
}

/**
 * XP award targets for a hit, derived from the style + mode (POC_SPEC §13.5.2).
 * Each entry is `{ skill, xpPerDamage }`.
 */
function styleXpTargets(
  style: CombatHitStyle,
  mode: CombatStyleMode,
): readonly { readonly skill: string; readonly xpPerDamage: number }[] {
  const melee = style === "stab" || style === "slash" || style === "crush";
  if (melee) {
    switch (mode) {
      case "aggressive":
        return [{ skill: "strength", xpPerDamage: COMBAT_XP_PER_DAMAGE }];
      case "defensive":
        return [{ skill: "defence", xpPerDamage: COMBAT_XP_PER_DAMAGE }];
      case "controlled":
        return [
          { skill: "attack", xpPerDamage: COMBAT_XP_PER_DAMAGE / 3 },
          { skill: "strength", xpPerDamage: COMBAT_XP_PER_DAMAGE / 3 },
          { skill: "defence", xpPerDamage: COMBAT_XP_PER_DAMAGE / 3 },
        ];
      default:
        return [{ skill: "attack", xpPerDamage: COMBAT_XP_PER_DAMAGE }];
    }
  }
  if (style === "ranged") {
    if (mode === "longrange") {
      return [
        { skill: "ranged", xpPerDamage: COMBAT_XP_PER_DAMAGE / 2 },
        { skill: "defence", xpPerDamage: COMBAT_XP_PER_DAMAGE / 2 },
      ];
    }
    return [{ skill: "ranged", xpPerDamage: COMBAT_XP_PER_DAMAGE }];
  }
  // magic defensive casting: 1.33 Magic + 1.0 Defence per damage (OSRS Wiki – Combat).
  if (mode === "longrange") {
    return [
      { skill: "magic", xpPerDamage: HITPOINTS_XP_PER_DAMAGE },
      { skill: "defence", xpPerDamage: 1 },
    ];
  }
  return [{ skill: "magic", xpPerDamage: MAGIC_XP_PER_DAMAGE }];
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
  const pctx = prayerContext(ctx);
  const attackRoll = computeAttackRoll(
    prayerBoostedLevel(pctx, attackerId, "attack", attacker.attackLevel),
    bonus(ctx, attackerId, attackBonusField(style)),
  );
  const defenceRoll = computeDefenceRoll(
    prayerBoostedLevel(pctx, targetId, "defence", target.defenceLevel),
    bonus(ctx, targetId, defenceBonusField(style)),
  );
  const hitChance = calculateHitChance(attackRoll, defenceRoll);
  const maxHit = computeMaxMeleeHit(
    prayerBoostedLevel(pctx, attackerId, "strength", attacker.strengthLevel),
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

/**
 * Effective defence level against magic attacks (POC_SPEC §13.4.1).
 *
 * Players use 70% Magic + 30% Defence (OSRS wiki, Combat §Player magic defence).
 * Monsters use Magic level only — Defence does not contribute (OSRS wiki, Combat
 * §Monster magic defence).
 */
export function effectiveMagicDefenceLevel(ctx: CombatSystemContext, targetId: EntityId): number {
  const targetSkills = ctx.world.getComponent(targetId, "skills");
  if (targetSkills) {
    const magic = getCurrentLevel(targetSkills, "magic");
    const defence = getCurrentLevel(targetSkills, "defence");
    return Math.floor(0.7 * magic + 0.3 * defence);
  }
  return magicLevel(ctx, targetId);
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
  const pctx = prayerContext(ctx);
  const attackRoll = computeAttackRoll(
    prayerBoostedLevel(pctx, casterId, "magic", magicLevel(ctx, casterId)),
    bonus(ctx, casterId, attackBonusField(style)),
  );
  const defenceRoll = computeDefenceRoll(
    prayerBoostedLevel(pctx, targetId, "magic", effectiveMagicDefenceLevel(ctx, targetId)),
    bonus(ctx, targetId, defenceBonusField(style)),
  );
  const hitChance = calculateHitChance(attackRoll, defenceRoll);
  const maxHit = computeMaxMagicHit(spellMaxHit, bonus(ctx, casterId, "magicDamage"));
  const hitLanded = ctx.rng.nextFloat() < hitChance;
  const damage = hitLanded ? ctx.rng.nextInt(0, maxHit) : 0;

  return { style, attackRoll, defenceRoll, hitChance, maxHit, damage, hitLanded };
}

function rangedLevel(ctx: CombatSystemContext, entityId: EntityId): number {
  const skills = ctx.world.getComponent(entityId, "skills");
  if (skills) {
    return getCurrentLevel(skills, "ranged");
  }
  return (
    npcDef(ctx, entityId)?.stats?.ranged ??
    ctx.world.getComponent(entityId, "combatant")?.attackLevel ??
    1
  );
}

export function computeMaxRangedHit(rangedLevel: number, rangedStrengthBonus: number): number {
  return Math.max(
    0,
    Math.floor(0.5 + (effectiveLevel(rangedLevel) * Math.max(0, rangedStrengthBonus + 64)) / 640),
  );
}

export function rollRangedHit(
  ctx: CombatAttackContext,
  attackerId: EntityId,
  targetId: EntityId,
): MeleeHitRoll | undefined {
  const attacker = ctx.world.getComponent(attackerId, "combatant");
  const target = ctx.world.getComponent(targetId, "combatant");
  if (!attacker || !target) {
    return undefined;
  }

  const style: CombatHitStyle = "ranged";
  const pctx = prayerContext(ctx);
  const attackRoll = computeAttackRoll(
    prayerBoostedLevel(pctx, attackerId, "ranged", rangedLevel(ctx, attackerId)),
    bonus(ctx, attackerId, attackBonusField(style)),
  );
  const defenceRoll = computeDefenceRoll(
    prayerBoostedLevel(pctx, targetId, "defence", target.defenceLevel),
    bonus(ctx, targetId, defenceBonusField(style)),
  );
  const hitChance = calculateHitChance(attackRoll, defenceRoll);
  const maxHit = computeMaxRangedHit(
    prayerBoostedLevel(pctx, attackerId, "ranged", rangedLevel(ctx, attackerId)),
    bonus(ctx, attackerId, "rangedStrength"),
  );
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
  const styleMode = resolveStyleMode(ctx, attackerId, roll.style);
  appendPendingHit(ctx, targetId, {
    sourceId: attackerId,
    targetId,
    applyTick: tick + MELEE_HIT_DELAY_TICKS,
    styleMode,
    ...roll,
  });
  ctx.world.setComponent(attackerId, "combatant", {
    ...attacker,
    nextAttackTick: tick + attackSpeedTicks(ctx, attackerId),
  });
  // Face the nearest occupied tile of the target's footprint (not its south-west
  // origin), so an attacker turns toward the adjacent edge of a multi-tile target.
  const attackerPosition = ctx.world.getComponent(attackerId, "position");
  const targetPosition = ctx.world.getComponent(targetId, "position");
  const facingTile =
    attackerPosition && targetPosition
      ? nearestFootprintTile(
          positionTile(attackerPosition),
          positionTile(targetPosition),
          entityFootprint(ctx, targetId),
        )
      : undefined;
  ctx.deltas.markEntityUpdate(attackerId, {
    ...(facingTile ? { facingTile } : {}),
    animation: { id: MELEE_ATTACK_ANIMATION_ID, startTick: tick },
  });
}

function rangedHitDelayTicks(ctx: CombatSystemContext, entityId: EntityId): number {
  return rangedWeapon(ctx, entityId)?.equipment?.hitDelayTicks ?? DEFAULT_RANGED_HIT_DELAY_TICKS;
}

function rangedProjectileId(ctx: CombatSystemContext, entityId: EntityId): string | undefined {
  return rangedWeapon(ctx, entityId)?.equipment?.projectileId;
}

function scheduleRangedAttack(
  ctx: CombatAttackContext,
  attackerId: EntityId,
  targetId: EntityId,
  tick: number,
): void {
  const attacker = ctx.world.getComponent(attackerId, "combatant");
  const roll = rollRangedHit(ctx, attackerId, targetId);
  if (!attacker || !roll) {
    return;
  }
  const hitDelay = rangedHitDelayTicks(ctx, attackerId);
  const applyTick = tick + hitDelay;
  const styleMode = resolveStyleMode(ctx, attackerId, roll.style);
  appendPendingHit(ctx, targetId, {
    sourceId: attackerId,
    targetId,
    applyTick,
    styleMode,
    ...roll,
  });
  ctx.world.setComponent(attackerId, "combatant", {
    ...attacker,
    nextAttackTick: tick + attackSpeedTicks(ctx, attackerId),
  });
  ctx.deltas.markEntityUpdate(attackerId, {
    facingEntity: targetId,
    animation: { id: RANGED_ATTACK_ANIMATION_ID, startTick: tick },
  });
  const projectileId = rangedProjectileId(ctx, attackerId);
  if (projectileId) {
    const actorPosition = ctx.world.getComponent(attackerId, "position");
    const targetPosition = ctx.world.getComponent(targetId, "position");
    if (actorPosition && targetPosition) {
      ctx.deltas.markProjectile({
        id: `${tick}:${attackerId}:${projectileId}:${targetId}`,
        projectileId,
        sourceEntityId: attackerId,
        targetEntityId: targetId,
        startTile: positionTile(actorPosition),
        endTile: positionTile(targetPosition),
        startTick: tick,
        hitTick: applyTick,
      });
    }
  }
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

    const range = attackRangeTiles(ctx, entityId);
    const target: InteractionTarget = {
      ...validation.target,
      requiredDistance: range,
      requiredShape: attackShape(range),
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

    if (isRangedAttacker(ctx, entityId)) {
      scheduleRangedAttack(ctx, entityId, targetId, tick);
    } else {
      scheduleMeleeAttack(ctx, entityId, targetId, tick);
    }
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
  styleMode: CombatStyleMode | undefined,
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
  const mode = styleMode ?? defaultStyleMode(style);
  const targets = styleXpTargets(style, mode);
  for (const { skill, xpPerDamage } of targets) {
    const result = addXp(ctx, sourceId, skill, damage * xpPerDamage);
    announceCombatLevelUp(ctx.deltas, sourceId, result, serverTime);
  }
  const hpResult = addXp(ctx, sourceId, "hitpoints", damage * HITPOINTS_XP_PER_DAMAGE);
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

  // Overhead protection prayers reduce incoming damage (POC_SPEC §13.8).
  const attackerIsPlayer = ctx.world.hasComponent(hit.sourceId, "player");
  const protectedDamage = applyPrayerProtection(
    prayerContext(ctx),
    targetId,
    hitStyleToProtectionStyle(hit.style),
    hit.damage,
    attackerIsPlayer,
  );
  const damage = Math.min(Math.max(0, protectedDamage), combatant.health);
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
    awardCombatXp(ctx, hit.sourceId, hit.style, hit.styleMode, damage, serverTime);
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
