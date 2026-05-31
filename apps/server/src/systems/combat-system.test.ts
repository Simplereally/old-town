import {
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
  assignAutoRetaliateTarget,
  attackSpeedTicks,
  type CombatAttackContext,
  calculateHitChance,
  computeMaxMeleeHit,
  handleNpcCombatIntent,
  MELEE_ATTACK_ANIMATION_ID,
  processCombatStartEvents,
  processCombatTargetValidation,
  processDamageResolutionEvents,
} from "./combat-system";
import { syncNpcOccupancy } from "./npc-system";

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
    expect(world.getComponent(player, "movement")?.destination).toEqual({ x: 4, y: 0, plane: 0 });
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
      facingEntity: npc,
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
    expect(xp(world, player, "hitpoints")).toBe(2);
    expect(deltas.peek().xpDrops).toEqual([
      { skillId: "strength", amount: 8 },
      { skillId: "hitpoints", amount: 2 },
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
