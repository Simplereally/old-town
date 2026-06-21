import {
  type CombatStyleMode,
  type ContentRegistries,
  createRng,
  type EntityId,
  type ItemDef,
  type NpcDef,
  type Rng,
  tileKey,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import type { CombatHitStyle, PendingHit } from "../ecs/components";
import { createWorld, type World } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import {
  appendPendingHit,
  assignAutoRetaliateTarget,
  assignCombatTarget,
  attackSpeedTicks,
  type CombatAttackContext,
  calculateHitChance,
  computeAttackRoll,
  computeDefenceRoll,
  computeMaxMagicHit,
  computeMaxMeleeHit,
  computeMaxRangedHit,
  effectiveMagicDefenceLevel,
  handleNpcCombatIntent,
  MELEE_ATTACK_ANIMATION_ID,
  processCombatStartEvents,
  processCombatTargetValidation,
  processDamageResolutionEvents,
  rollMagicHit,
  rollMeleeHit,
  rollRangedHit,
  validateCombatTarget,
} from "./combat-system";
import { processMovementPhase } from "./movement-system";
import { npcFootprintResolver, processNpcAiPhase, syncNpcOccupancy } from "./npc-system";

const NPC_DEF: NpcDef = {
  id: "goblin",
  name: "Goblin",
  size: 1,
  combatLevel: 3,
  maxHp: 8,
  stats: {
    attack: 2,
    strength: 2,
    defence: 2,
    ranged: 1,
    magic: 1,
    prayer: 1,
    hitpoints: 8,
  },
  attackRangeTiles: 1,
  aggressiveRadius: 2,
  wanderRadius: 2,
  respawnTicks: 5,
  options: [{ label: "Attack", actionId: "attack", priority: 10, requiredDistance: 1 }],
  movementType: "static",
  aggressionMode: "peaceful",
  contractEligible: false,
};

function registries(npcDef = NPC_DEF, items: readonly ItemDef[] = []): ContentRegistries {
  return makeRegistries({
    item: new Map(items.map((item) => [item.id, item])),
    npc: new Map([[npcDef.id, npcDef]]),
  });
}

function addOpenTiles(map: ReturnType<typeof createRuntimeMap>): void {
  for (let x = 0; x <= 8; x += 1) {
    for (let y = 0; y <= 8; y += 1) {
      const tile = { x, y, plane: 0 as const };
      map.tiles.set(tileKey(tile), {
        tile,
        height: 0,
        underlayId: "grass",
        collision: 0,
        water: false,
        bridge: false,
      });
    }
  }
}

function addCombatant(world: World, entityId: EntityId, hp = 10): void {
  world.setComponent(entityId, "combatant", {
    entityId,
    health: hp,
    maxHealth: hp,
    attackLevel: 3,
    strengthLevel: 3,
    defenceLevel: 3,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 3,
    eatBlockedUntilTick: 0,
    autoRetaliate: true,
    nextAttackTick: 0,
    dead: false,
  });
}

function setup(
  options: {
    readonly playerTile?: { readonly x: number; readonly y: number; readonly plane: 0 };
    readonly npcTile?: { readonly x: number; readonly y: number; readonly plane: 0 };
    readonly npcDef?: NpcDef;
    readonly items?: readonly ItemDef[];
    readonly rng?: Rng;
  } = {},
): {
  readonly ctx: CombatAttackContext;
  readonly world: World;
  readonly player: EntityId;
  readonly npc: EntityId;
  readonly deltas: DeltaAccumulator;
} {
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const content = registries(options.npcDef, options.items);
  const playerTile = options.playerTile ?? { x: 4, y: 5, plane: 0 as const };
  const npcTile = options.npcTile ?? { x: 4, y: 4, plane: 0 as const };

  const player = world.createEntity();
  world.setComponent(player, "position", {
    entityId: player,
    x: playerTile.x,
    y: playerTile.y,
    plane: playerTile.plane,
  });
  world.setComponent(player, "player", {
    entityId: player,
    accountId: "account",
    sessionId: "session",
    interestRadius: 8,
  });
  addCombatant(world, player, 10);

  const npc = world.createEntity();
  world.setComponent(npc, "position", {
    entityId: npc,
    x: npcTile.x,
    y: npcTile.y,
    plane: npcTile.plane,
  });
  world.setComponent(npc, "npc", {
    entityId: npc,
    npcId: options.npcDef?.id ?? NPC_DEF.id,
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: options.npcDef?.wanderRadius ?? NPC_DEF.wanderRadius,
    home: npcTile,
    leashDistance: 4,
  });
  world.setComponent(npc, "actor", {
    entityId: npc,
    name: options.npcDef?.name ?? NPC_DEF.name,
    level: options.npcDef?.combatLevel ?? NPC_DEF.combatLevel ?? 0,
    appearanceId: options.npcDef?.id ?? NPC_DEF.id,
  });
  addCombatant(world, npc, options.npcDef?.maxHp ?? NPC_DEF.maxHp ?? 8);

  const ctx = { world, collision, deltas, registries: content, rng: options.rng ?? createRng(1) };
  syncNpcOccupancy(ctx);
  return { ctx, world, player, npc, deltas };
}

function weapon(id: string, speed: number, meleeStrength: number): ItemDef {
  return {
    id,
    name: id,
    stackable: false,
    tradeable: true,
    examine: id,
    icon: `icon_${id}`,
    value: 1,
    options: ["wield"],
    tags: [],
    category: "melee",
    equipment: {
      slot: "weapon",
      attackSpeedTicks: speed,
      attackRangeTiles: 1,
      allowedStyles: ["stab"],
      bonuses: { stabAttack: 8, meleeStrength },
      requirements: [],
    },
  };
}

function rangedWeapon(id: string, speed: number, rangedStrength: number, range = 6): ItemDef {
  return {
    id,
    name: id,
    stackable: false,
    tradeable: true,
    examine: id,
    icon: `icon_${id}`,
    value: 1,
    options: ["wield"],
    tags: [],
    category: "ranged",
    equipment: {
      slot: "weapon",
      attackSpeedTicks: speed,
      attackRangeTiles: range,
      allowedStyles: ["ranged"],
      bonuses: { rangedAttack: 8, rangedStrength },
      requirements: [],
      projectileId: `projectile_${id}`,
      hitDelayTicks: 2,
    },
  };
}

function equip(world: World, entityId: EntityId, item: ItemDef): void {
  world.setComponent(entityId, "equipment", {
    entityId,
    slots: { weapon: item.id },
    bonuses: item.equipment?.bonuses ?? {},
  });
}

function target(
  world: World,
  entityId: EntityId,
  targetId: EntityId,
  nextAttackTick: number,
): void {
  const combatant = world.getComponent(entityId, "combatant");
  if (!combatant) {
    throw new Error("missing combatant");
  }
  world.setComponent(entityId, "combatant", { ...combatant, targetId, nextAttackTick });
}

function addSkills(world: World, entityId: EntityId): void {
  world.setComponent(entityId, "skills", {
    entityId,
    skills: {
      attack: { level: 1, xp: 0, boost: 0, drain: 0 },
      strength: { level: 1, xp: 0, boost: 0, drain: 0 },
      defence: { level: 1, xp: 0, boost: 0, drain: 0 },
      ranged: { level: 1, xp: 0, boost: 0, drain: 0 },
      magic: { level: 1, xp: 0, boost: 0, drain: 0 },
      hitpoints: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
}

function xp(world: World, entityId: EntityId, skillId: string): number {
  const state = world.getComponent(entityId, "skills")?.skills[skillId];
  if (!state) {
    throw new Error(`missing skill ${skillId}`);
  }
  return state.xp;
}

function queueHit(
  world: World,
  sourceId: EntityId,
  targetId: EntityId,
  options: {
    readonly applyTick: number;
    readonly damage: number;
    readonly style?: CombatHitStyle;
    readonly styleMode?: CombatStyleMode;
    readonly hitLanded?: boolean;
  },
): void {
  const combatant = world.getComponent(targetId, "combatant");
  if (!combatant) {
    throw new Error("missing target combatant");
  }
  const hit: PendingHit = {
    sourceId,
    targetId,
    applyTick: options.applyTick,
    style: options.style ?? "stab",
    attackRoll: 100,
    defenceRoll: 100,
    hitChance: 0.5,
    maxHit: options.damage,
    damage: options.damage,
    hitLanded: options.hitLanded ?? options.damage > 0,
    ...(options.styleMode ? { styleMode: options.styleMode } : {}),
  };
  world.setComponent(targetId, "combatant", {
    ...combatant,
    pendingHits: [...(combatant.pendingHits ?? []), hit],
  });
}

function fixedRng(float: number, int: number): Rng {
  return {
    nextFloat: () => float,
    nextInt: (min, max) => Math.min(Math.max(int, min), max),
    chanceOneIn: () => false,
  };
}

describe("combat target acquisition", () => {
  it("assigns a valid adjacent NPC attack target and faces it", () => {
    const { ctx, world, player, npc, deltas } = setup();

    expect(handleNpcCombatIntent(ctx, player, { npcEntityId: npc, actionId: "attack" }, 600)).toBe(
      true,
    );

    expect(world.getComponent(player, "combatant")?.targetId).toBe(npc);
    expect(deltas.peek().entityUpdates[0]?.changes.facingTile).toEqual({ x: 4, y: 4, plane: 0 });
  });

  it("keeps the target and paths toward an out-of-range NPC", () => {
    const { ctx, world, player, npc } = setup({
      playerTile: { x: 1, y: 1, plane: 0 },
      npcTile: { x: 5, y: 1, plane: 0 },
    });

    handleNpcCombatIntent(ctx, player, { npcEntityId: npc, actionId: "attack" }, 600);

    expect(world.getComponent(player, "combatant")?.targetId).toBe(npc);
    expect(world.getComponent(player, "movement")?.path.length).toBeGreaterThan(0);
    // Melee uses the cardinal "plus" reach, so it approaches the west edge tile of the
    // NPC at (5,1) rather than a diagonal corner like (4,0).
    expect(world.getComponent(player, "movement")?.destination).toEqual({ x: 4, y: 1, plane: 0 });
  });

  it("rejects spoofed NPC attack intents against non-NPC entities", () => {
    const { ctx, world, player, deltas } = setup();
    const otherPlayer = world.createEntity();
    world.setComponent(otherPlayer, "position", { entityId: otherPlayer, x: 4, y: 6, plane: 0 });
    world.setComponent(otherPlayer, "player", {
      entityId: otherPlayer,
      accountId: "other",
      sessionId: "other-session",
      interestRadius: 8,
    });
    addCombatant(world, otherPlayer, 10);

    handleNpcCombatIntent(ctx, player, { npcEntityId: otherPlayer, actionId: "attack" }, 600);

    expect(world.getComponent(player, "combatant")?.targetId).toBeUndefined();
    expect(deltas.peek().chat?.[0]?.text).toBe("You can't attack that.");
  });

  it("rejects dead NPC targets", () => {
    const { ctx, world, player, npc, deltas } = setup();
    const target = world.getComponent(npc, "combatant");
    if (!target) throw new Error("missing npc combatant");
    world.setComponent(npc, "combatant", { ...target, health: 0, dead: true });

    handleNpcCombatIntent(ctx, player, { npcEntityId: npc, actionId: "attack" }, 600);

    expect(world.getComponent(player, "combatant")?.targetId).toBeUndefined();
    expect(deltas.peek().chat?.[0]?.text).toBe("That target is already defeated.");
  });

  it("assigns auto-retaliate targets when a defender receives a hit", () => {
    const { ctx, world, player, npc } = setup();

    expect(assignAutoRetaliateTarget(ctx, npc, player)).toBe(true);

    expect(world.getComponent(npc, "combatant")?.targetId).toBe(player);
    expect(world.getComponent(npc, "npc")?.brainState).toBe("chase");
  });

  it("clears invalid targets and puts leashed NPCs into return-home state", () => {
    const { ctx, world, player, npc } = setup({ npcTile: { x: 8, y: 5, plane: 0 } });
    const npcState = world.getComponent(npc, "npc");
    const npcCombat = world.getComponent(npc, "combatant");
    if (!npcState || !npcCombat) throw new Error("missing npc");
    world.setComponent(npc, "npc", {
      ...npcState,
      home: { x: 4, y: 4, plane: 0 },
      leashDistance: 2,
      brainState: "chase",
    });
    world.setComponent(npc, "combatant", { ...npcCombat, targetId: player });

    processCombatTargetValidation(ctx);

    expect(world.getComponent(npc, "combatant")?.targetId).toBeUndefined();
    expect(world.getComponent(npc, "npc")?.brainState).toBe("returnHome");
  });
});

describe("melee attack timing and rolls", () => {
  it("queues delayed pending hits at integer weapon-speed cadence", () => {
    const blade = weapon("slow_blade", 6, 4);
    const { ctx, world, player, npc, deltas } = setup({
      items: [blade],
      rng: fixedRng(0, 1),
    });
    equip(world, player, blade);
    target(world, player, npc, 10);

    processCombatStartEvents(ctx, 10);
    processCombatStartEvents(ctx, 15);

    const pendingHits = world.getComponent(npc, "combatant")?.pendingHits ?? [];
    expect(pendingHits).toHaveLength(1);
    expect(pendingHits[0]).toMatchObject({
      sourceId: player,
      targetId: npc,
      applyTick: 11,
      style: "stab",
      damage: 1,
    });
    expect(world.getComponent(player, "combatant")?.nextAttackTick).toBe(16);
    expect(deltas.peek().entityUpdates[0]?.changes).toMatchObject({
      facingTile: { x: 4, y: 4, plane: 0 },
      animation: { id: MELEE_ATTACK_ANIMATION_ID, startTick: 10 },
    });

    processCombatStartEvents(ctx, 16);

    expect(world.getComponent(npc, "combatant")?.pendingHits).toHaveLength(2);
    expect(world.getComponent(player, "combatant")?.nextAttackTick).toBe(22);
  });

  it("keeps roll math bounded and deterministic", () => {
    expect(calculateHitChance(200, 100)).toBeGreaterThan(0.5);
    expect(calculateHitChance(200, 100)).toBeLessThan(1);
    expect(calculateHitChance(100, 200)).toBeGreaterThan(0);
    expect(calculateHitChance(100, 200)).toBeLessThan(0.5);
    expect(calculateHitChance(0, 200)).toBe(0);
    expect(computeMaxMeleeHit(1, 0)).toBe(1);
  });

  it("uses current equipment speed when a weapon is swapped before the next swing", () => {
    const slow = weapon("slow_blade", 6, 4);
    const fast = weapon("fast_sticker", 3, 1);
    const { ctx, world, player, npc } = setup({
      items: [slow, fast],
      rng: fixedRng(0, 1),
    });
    equip(world, player, slow);
    target(world, player, npc, 20);

    processCombatStartEvents(ctx, 20);
    expect(attackSpeedTicks(ctx, player)).toBe(6);
    expect(world.getComponent(player, "combatant")?.nextAttackTick).toBe(26);

    equip(world, player, fast);
    processCombatStartEvents(ctx, 26);

    expect(attackSpeedTicks(ctx, player)).toBe(3);
    expect(world.getComponent(player, "combatant")?.nextAttackTick).toBe(29);
  });
});

describe("damage resolution", () => {
  it("clamps lethal damage at zero HP and emits combat feedback", () => {
    const { ctx, world, player, npc, deltas } = setup();
    queueHit(world, player, npc, { applyTick: 30, damage: 20 });

    processDamageResolutionEvents(ctx, 30);

    expect(world.getComponent(npc, "combatant")?.health).toBe(0);
    expect(world.getComponent(npc, "combatant")?.pendingHits).toBeUndefined();
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: npc, hitsplat: { amount: 8, type: "damage" } },
    ]);
    expect(deltas.peek().entityUpdates[0]?.changes.healthBar).toEqual({ current: 0, max: 8 });
  });

  it("emits zero-damage block hits explicitly without changing HP", () => {
    const { ctx, world, player, npc, deltas } = setup();
    queueHit(world, player, npc, {
      applyTick: 12,
      damage: 0,
      hitLanded: false,
    });

    processDamageResolutionEvents(ctx, 12);

    expect(world.getComponent(npc, "combatant")?.health).toBe(8);
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: npc, hitsplat: { amount: 0, type: "block" } },
    ]);
    expect(deltas.peek().entityUpdates).toEqual([]);
  });

  it("awards style and hitpoints XP for actual damage dealt", () => {
    const { ctx, world, player, npc, deltas } = setup();
    addSkills(world, player);
    queueHit(world, player, npc, {
      applyTick: 18,
      damage: 2,
      style: "slash",
    });

    processDamageResolutionEvents(ctx, 18);

    expect(xp(world, player, "strength")).toBe(8);
    expect(xp(world, player, "hitpoints")).toBeCloseTo(2 * 1.33, 10);
    expect(deltas.peek().xpDrops).toEqual([
      { skillId: "strength", amount: 8 },
      { skillId: "hitpoints", amount: 2 * 1.33 },
    ]);
  });

  it("discards pending hits against dead targets without XP", () => {
    const { ctx, world, player, npc, deltas } = setup();
    addSkills(world, player);
    const combatant = world.getComponent(npc, "combatant");
    if (!combatant) throw new Error("missing npc combatant");
    world.setComponent(npc, "combatant", { ...combatant, health: 0, dead: true });
    queueHit(world, player, npc, { applyTick: 22, damage: 3 });

    processDamageResolutionEvents(ctx, 22);

    expect(world.getComponent(npc, "combatant")?.health).toBe(0);
    expect(world.getComponent(npc, "combatant")?.pendingHits).toBeUndefined();
    expect(deltas.peek().hitsplats).toBeUndefined();
    expect(deltas.peek().xpDrops).toBeUndefined();
    expect(xp(world, player, "attack")).toBe(0);
  });
});

describe("melee against a multi-tile (2x2) NPC", () => {
  const COW_DEF: NpcDef = {
    id: "cow",
    name: "Cow",
    size: 2,
    combatLevel: 2,
    maxHp: 8,
    stats: { attack: 1, strength: 1, defence: 1, ranged: 1, magic: 1, prayer: 1, hitpoints: 8 },
    attackRangeTiles: 1,
    aggressiveRadius: 0,
    wanderRadius: 0,
    respawnTicks: 12,
    options: [{ label: "Attack", actionId: "attack", priority: 10, requiredDistance: 1 }],
    movementType: "static",
    aggressionMode: "retaliate",
    contractEligible: false,
  };

  // Cow origin (4,4) occupies (4,4),(5,4),(4,5),(5,5).
  const onCowFootprint = (x: number, y: number): boolean => x >= 4 && x <= 5 && y >= 4 && y <= 5;
  const isCardinalToCow = (x: number, y: number): boolean =>
    (x >= 4 && x <= 5) || (y >= 4 && y <= 5);

  it("does not consider a diagonal-corner tile in melee range, but a cardinal edge is", () => {
    const corner = setup({
      npcDef: COW_DEF,
      npcTile: { x: 4, y: 4, plane: 0 },
      playerTile: { x: 3, y: 3, plane: 0 }, // diagonally off the SW corner (4,4)
    });
    handleNpcCombatIntent(
      corner.ctx,
      corner.player,
      { npcEntityId: corner.npc, actionId: "attack" },
      600,
    );
    // From a corner the attacker is out of plus range, so it must path to a cardinal tile.
    const dest = corner.world.getComponent(corner.player, "movement")?.destination;
    expect(dest).toBeDefined();
    if (dest) {
      expect(onCowFootprint(dest.x, dest.y)).toBe(false);
      expect(isCardinalToCow(dest.x, dest.y)).toBe(true);
    }

    const edge = setup({
      npcDef: COW_DEF,
      npcTile: { x: 4, y: 4, plane: 0 },
      playerTile: { x: 3, y: 4, plane: 0 }, // west of the cow's west edge — cardinally adjacent
    });
    handleNpcCombatIntent(
      edge.ctx,
      edge.player,
      { npcEntityId: edge.npc, actionId: "attack" },
      600,
    );
    // Already in range: no path is needed.
    expect(edge.world.getComponent(edge.player, "movement")?.path ?? []).toEqual([]);
  });

  it("walks up from a diagonal approach and lands a blow from a cardinal tile", () => {
    const { ctx, world, player, npc } = setup({
      npcDef: COW_DEF,
      npcTile: { x: 4, y: 4, plane: 0 },
      playerTile: { x: 2, y: 2, plane: 0 },
      rng: createRng(7),
    });
    const pc = world.getComponent(player, "combatant");
    if (!pc) throw new Error("missing player combatant");
    world.setComponent(player, "combatant", { ...pc, attackLevel: 40, strengthLevel: 40 });

    handleNpcCombatIntent(ctx, player, { npcEntityId: npc, actionId: "attack" }, 600, 1);
    const footprint = npcFootprintResolver(ctx);

    let landed = false;
    for (let tick = 1; tick <= 16 && !landed; tick += 1) {
      processMovementPhase(
        { world, collision: ctx.collision, deltas: ctx.deltas },
        tick,
        footprint,
      );
      syncNpcOccupancy(ctx);
      processCombatTargetValidation(ctx);
      processNpcAiPhase(ctx, tick);
      processCombatStartEvents(ctx, tick);
      processDamageResolutionEvents(ctx, tick);
      if ((world.getComponent(npc, "combatant")?.health ?? 8) < 8) {
        landed = true;
      }
    }

    expect(landed).toBe(true);
    const p = world.getComponent(player, "position");
    if (!p) throw new Error("missing player position");
    expect(onCowFootprint(p.x, p.y)).toBe(false);
    expect(isCardinalToCow(p.x, p.y)).toBe(true);
  });
});

describe("effectiveMagicDefenceLevel", () => {
  it("uses 70% magic + 30% defence for player targets", () => {
    const { ctx, world, player } = setup();
    world.setComponent(player, "skills", {
      entityId: player,
      skills: {
        attack: { level: 1, xp: 0, boost: 0, drain: 0 },
        strength: { level: 1, xp: 0, boost: 0, drain: 0 },
        defence: { level: 10, xp: 0, boost: 0, drain: 0 },
        ranged: { level: 1, xp: 0, boost: 0, drain: 0 },
        magic: { level: 20, xp: 0, boost: 0, drain: 0 },
        prayer: { level: 1, xp: 0, boost: 0, drain: 0 },
        hitpoints: { level: 1, xp: 0, boost: 0, drain: 0 },
      },
    });

    // floor(0.7 * 20 + 0.3 * 10) = floor(14 + 3) = 17
    expect(effectiveMagicDefenceLevel(ctx, player)).toBe(17);
  });

  it("uses magic level only for monster targets (defence irrelevant)", () => {
    const { ctx, npc } = setup();
    // NPC_DEF has stats.magic = 1, stats.defence = 2. Wiki: monsters use magic only.
    expect(effectiveMagicDefenceLevel(ctx, npc)).toBe(1);
  });

  it("a high-magic player resists spells better than a low-magic one", () => {
    const { ctx, world, player } = setup();
    const lowMagic = world.createEntity();
    world.setComponent(lowMagic, "combatant", {
      entityId: lowMagic,
      health: 10,
      maxHealth: 10,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 50,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: 3,
      eatBlockedUntilTick: 0,
    });
    world.setComponent(lowMagic, "skills", {
      entityId: lowMagic,
      skills: {
        attack: { level: 1, xp: 0, boost: 0, drain: 0 },
        strength: { level: 1, xp: 0, boost: 0, drain: 0 },
        defence: { level: 50, xp: 0, boost: 0, drain: 0 },
        ranged: { level: 1, xp: 0, boost: 0, drain: 0 },
        magic: { level: 1, xp: 0, boost: 0, drain: 0 },
        prayer: { level: 1, xp: 0, boost: 0, drain: 0 },
        hitpoints: { level: 1, xp: 0, boost: 0, drain: 0 },
      },
    });

    world.setComponent(player, "skills", {
      entityId: player,
      skills: {
        attack: { level: 1, xp: 0, boost: 0, drain: 0 },
        strength: { level: 1, xp: 0, boost: 0, drain: 0 },
        defence: { level: 1, xp: 0, boost: 0, drain: 0 },
        ranged: { level: 1, xp: 0, boost: 0, drain: 0 },
        magic: { level: 50, xp: 0, boost: 0, drain: 0 },
        prayer: { level: 1, xp: 0, boost: 0, drain: 0 },
        hitpoints: { level: 1, xp: 0, boost: 0, drain: 0 },
      },
    });

    // High-magic player: floor(0.7*50 + 0.3*1) = floor(35.3) = 35
    // Low-magic/high-defence player: floor(0.7*1 + 0.3*50) = floor(15.7) = 15
    expect(effectiveMagicDefenceLevel(ctx, player)).toBe(35);
    expect(effectiveMagicDefenceLevel(ctx, lowMagic)).toBe(15);
  });
});

describe("ranged combat", () => {
  it("computeMaxRangedHit scales with ranged level and rangedStrength bonus", () => {
    // effectiveLevel adds 8: level 1 -> 9. floor(0.5 + 9 * 64 / 640) = floor(1.4) = 1
    expect(computeMaxRangedHit(1, 0)).toBe(1);
    // level 50 -> 58, bonus 10: floor(0.5 + 58 * 74 / 640) = floor(7.21) = 7
    expect(computeMaxRangedHit(50, 10)).toBe(7);
  });

  it("schedules a ranged attack with a projectile and delayed pending hit", () => {
    const bow = rangedWeapon("lathwood_shortbow", 5, 2, 6);
    const { ctx, world, player, npc, deltas } = setup({
      playerTile: { x: 4, y: 5, plane: 0 },
      npcTile: { x: 4, y: 4, plane: 0 },
      items: [bow],
      rng: createRng(1),
    });
    addSkills(world, player);
    equip(world, player, bow);
    target(world, player, npc, 0);

    processCombatStartEvents(ctx, 1);

    const pending = world.getComponent(npc, "combatant")?.pendingHits;
    expect(pending).toHaveLength(1);
    const first = pending?.[0];
    expect(first?.style).toBe("ranged");
    expect(first?.applyTick).toBe(3); // tick 1 + 2 travel delay
    expect(deltas.peek().projectiles?.[0]).toMatchObject({
      projectileId: "projectile_lathwood_shortbow",
      sourceEntityId: player,
      targetEntityId: npc,
      startTick: 1,
      hitTick: 3,
    });
  });

  it("awards ranged and hitpoints XP on ranged damage", () => {
    const { ctx, world, player, npc } = setup();
    addSkills(world, player);
    queueHit(world, player, npc, { applyTick: 5, damage: 3, style: "ranged" });

    processDamageResolutionEvents(ctx, 5);

    expect(xp(world, player, "ranged")).toBe(12); // 3 * 4
    expect(xp(world, player, "hitpoints")).toBeCloseTo(3 * 1.33, 10);
  });

  it("longrange ranged splits XP 2 ranged + 2 defence per damage", () => {
    const { ctx, world, player, npc } = setup();
    addSkills(world, player);
    queueHit(world, player, npc, {
      applyTick: 5,
      damage: 3,
      style: "ranged",
      styleMode: "longrange",
    });

    processDamageResolutionEvents(ctx, 5);

    expect(xp(world, player, "ranged")).toBe(6); // 3 * 2
    expect(xp(world, player, "defence")).toBe(6); // 3 * 2
    expect(xp(world, player, "hitpoints")).toBeCloseTo(3 * 1.33, 10);
  });

  it("controlled melee splits XP 1.33 to attack, strength, defence per damage", () => {
    const { ctx, world, player, npc } = setup();
    addSkills(world, player);
    queueHit(world, player, npc, {
      applyTick: 5,
      damage: 3,
      style: "stab",
      styleMode: "controlled",
    });

    processDamageResolutionEvents(ctx, 5);

    expect(xp(world, player, "attack")).toBe(4); // 3 * 1.33
    expect(xp(world, player, "strength")).toBe(4); // 3 * 1.33
    expect(xp(world, player, "defence")).toBe(4); // 3 * 1.33
  });

  it("defensive melee mode awards full XP to defence", () => {
    const { ctx, world, player, npc } = setup();
    addSkills(world, player);
    queueHit(world, player, npc, {
      applyTick: 5,
      damage: 2,
      style: "stab",
      styleMode: "defensive",
    });

    processDamageResolutionEvents(ctx, 5);

    expect(xp(world, player, "defence")).toBe(8); // 2 * 4
    expect(xp(world, player, "attack")).toBe(0);
  });

  it("longrange magic splits XP 1.33 magic + 1 defence per damage", () => {
    const { ctx, world, player, npc } = setup();
    addSkills(world, player);
    queueHit(world, player, npc, {
      applyTick: 5,
      damage: 3,
      style: "magic",
      styleMode: "longrange",
    });

    processDamageResolutionEvents(ctx, 5);

    expect(xp(world, player, "magic")).toBeCloseTo(3 * 1.33, 10);
    expect(xp(world, player, "defence")).toBe(3); // 3 * 1 = 3
  });
});

describe("combat roll math", () => {
  it("computeAttackRoll uses effective level and clamps negative bonus", () => {
    // effectiveLevel(1) = 1 + 8 = 9; (0 + 64) = 64 => 576
    expect(computeAttackRoll(1, 0)).toBe(9 * 64);
    // negative bonus clamps to 0 via max(0, bonus+64)
    expect(computeAttackRoll(1, -100)).toBe(9 * 0);
    expect(computeAttackRoll(99, 20)).toBe(107 * 84);
  });

  it("computeDefenceRoll mirrors attack roll formula", () => {
    expect(computeDefenceRoll(1, 0)).toBe(9 * 64);
    expect(computeDefenceRoll(70, 150)).toBe(78 * 214);
  });

  it("computeMaxMagicHit adds floor(magicDamageBonus/10) to spell max", () => {
    expect(computeMaxMagicHit(20, 0)).toBe(20);
    expect(computeMaxMagicHit(20, 15)).toBe(21); // 20 + floor(15/10) = 21
    expect(computeMaxMagicHit(20, 25)).toBe(22); // 20 + floor(25/10) = 22
    expect(computeMaxMagicHit(20, -5)).toBe(20); // negative bonus clamped to 0
  });
});

describe("rollMeleeHit / rollMagicHit / rollRangedHit", () => {
  it("rollMeleeHit returns undefined when combatant missing", () => {
    const { ctx, player, npc } = setup();
    // Remove combatant from npc
    ctx.world.removeComponent(npc, "combatant");
    expect(rollMeleeHit(ctx as CombatAttackContext, player, npc)).toBeUndefined();
  });

  it("rollMeleeHit produces a bounded deterministic roll", () => {
    const sword = weapon("test_sword", 4, 10);
    const { ctx, world, player, npc } = setup({ items: [sword] });
    addSkills(world, player);
    equip(world, player, sword);
    const roll = rollMeleeHit(ctx as CombatAttackContext, player, npc);
    if (!roll) throw new Error("expected roll");
    expect(roll.style).toBe("stab");
    expect(roll.attackRoll).toBeGreaterThan(0);
    expect(roll.defenceRoll).toBeGreaterThan(0);
    expect(roll.hitChance).toBeGreaterThan(0);
    expect(roll.hitChance).toBeLessThanOrEqual(1);
    expect(roll.maxHit).toBeGreaterThanOrEqual(0);
    expect(roll.damage).toBeGreaterThanOrEqual(0);
    expect(roll.damage).toBeLessThanOrEqual(roll.maxHit);
  });

  it("rollMagicHit returns undefined when combatant missing", () => {
    const { ctx, player, npc } = setup();
    ctx.world.removeComponent(npc, "combatant");
    expect(rollMagicHit(ctx as CombatAttackContext, player, npc, 20)).toBeUndefined();
  });

  it("rollMagicHit computes max hit from spell + magic damage bonus", () => {
    const { ctx, world, player, npc } = setup();
    addSkills(world, player);
    const roll = rollMagicHit(ctx as CombatAttackContext, player, npc, 20);
    if (!roll) throw new Error("expected roll");
    expect(roll.style).toBe("magic");
    expect(roll.maxHit).toBe(20); // no magicDamage bonus => 20 + 0
    expect(roll.damage).toBeGreaterThanOrEqual(0);
    expect(roll.damage).toBeLessThanOrEqual(20);
  });

  it("rollRangedHit returns undefined when combatant missing", () => {
    const { ctx, player, npc } = setup();
    ctx.world.removeComponent(npc, "combatant");
    expect(rollRangedHit(ctx as CombatAttackContext, player, npc)).toBeUndefined();
  });

  it("rollRangedHit produces a bounded deterministic roll", () => {
    const bow = rangedWeapon("test_bow", 4, 10);
    const { ctx, world, player, npc } = setup({ items: [bow] });
    addSkills(world, player);
    equip(world, player, bow);
    const roll = rollRangedHit(ctx as CombatAttackContext, player, npc);
    if (!roll) throw new Error("expected roll");
    expect(roll.style).toBe("ranged");
    expect(roll.maxHit).toBeGreaterThan(0);
    expect(roll.damage).toBeGreaterThanOrEqual(0);
    expect(roll.damage).toBeLessThanOrEqual(roll.maxHit);
  });
});

describe("appendPendingHit", () => {
  it("appends a pending hit to the target combatant", () => {
    const { ctx, world, player, npc } = setup();
    const hit: PendingHit = {
      sourceId: player,
      targetId: npc,
      applyTick: 5,
      style: "stab",
      attackRoll: 100,
      defenceRoll: 100,
      hitChance: 0.5,
      maxHit: 10,
      damage: 5,
      hitLanded: true,
    };
    appendPendingHit(ctx, npc, hit);
    const combatant = world.getComponent(npc, "combatant");
    expect(combatant?.pendingHits).toHaveLength(1);
    expect(combatant?.pendingHits?.[0]).toEqual(hit);
  });

  it("does nothing when target has no combatant component", () => {
    const { ctx, world, player, npc } = setup();
    ctx.world.removeComponent(npc, "combatant");
    const hit: PendingHit = {
      sourceId: player,
      targetId: npc,
      applyTick: 5,
      style: "stab",
      attackRoll: 100,
      defenceRoll: 100,
      hitChance: 0.5,
      maxHit: 10,
      damage: 5,
      hitLanded: true,
    };
    appendPendingHit(ctx, npc, hit);
    expect(world.getComponent(npc, "combatant")).toBeUndefined();
  });
});

describe("validateCombatTarget and assignCombatTarget", () => {
  it("validateCombatTarget rejects missing attacker", () => {
    const { ctx, player, npc } = setup();
    ctx.world.removeComponent(player, "combatant");
    const result = validateCombatTarget(ctx, player, npc);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("missing_attacker");
  });

  it("validateCombatTarget rejects missing target", () => {
    const { ctx, player, npc } = setup();
    ctx.world.removeComponent(npc, "combatant");
    const result = validateCombatTarget(ctx, player, npc);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("missing_target");
  });

  it("validateCombatTarget rejects dead target", () => {
    const { ctx, world, player, npc } = setup();
    const combatant = world.getComponent(npc, "combatant");
    if (!combatant) throw new Error("missing combatant");
    world.setComponent(npc, "combatant", { ...combatant, health: 0 });
    const result = validateCombatTarget(ctx, player, npc);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("dead");
  });

  it("validateCombatTarget accepts a valid adjacent target", () => {
    const { ctx, player, npc } = setup();
    const result = validateCombatTarget(ctx, player, npc);
    expect(result.ok).toBe(true);
  });

  it("assignCombatTarget sets the targetId on the attacker combatant", () => {
    const { ctx, world, player, npc } = setup();
    assignCombatTarget(ctx, player, npc);
    expect(world.getComponent(player, "combatant")?.targetId).toBe(npc);
  });

  it("assignCombatTarget does nothing when attacker has no combatant", () => {
    const { ctx, world, player, npc } = setup();
    ctx.world.removeComponent(player, "combatant");
    assignCombatTarget(ctx, player, npc);
    expect(world.getComponent(player, "combatant")).toBeUndefined();
  });
});
