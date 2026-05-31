import {
  type ContentRegistries,
  type EntityId,
  type EntityUpdatePayload,
  type ItemDef,
  type Rng,
  type SpellDef,
  type TileCoord,
  tileKey,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import { type ActionExecution, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionFlag, CollisionMap } from "../world/collision";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { appendPendingHit, processDamageResolutionEvents } from "./combat-system";
import {
  createSpellActionHandlers,
  handleSpellIntent,
  SPELL_BIND_OVERHEAD_TEXT,
  SPELL_CAST_ANIMATION_ID,
  type SpellSystemContext,
  TELEPORT_CAST_ANIMATION_ID,
  type TeleportActionPayload,
} from "./spell-system";

const EMBER_FLICK: SpellDef = {
  id: "ember_flick",
  name: "Ember Flick",
  spellbook: "common",
  requiredMagic: 1,
  beadCosts: [
    { itemId: "ember_bead", quantity: 1 },
    { itemId: "wit_bead", quantity: 1 },
  ],
  castXp: 5.5,
  rangeTiles: 6,
  targetType: "entity",
  requiresLineOfSight: true,
  cooldownTicks: 4,
  effect: {
    kind: "damage",
    maxHit: 2,
    hitDelayTicks: 2,
    projectileId: "projectile_ember_flick",
  },
};

const BONE_BIND: SpellDef = {
  id: "bone_bind",
  name: "Bone Bind",
  spellbook: "common",
  requiredMagic: 1,
  beadCosts: [
    { itemId: "bone_bead", quantity: 1 },
    { itemId: "wit_bead", quantity: 1 },
  ],
  castXp: 6,
  rangeTiles: 6,
  targetType: "entity",
  requiresLineOfSight: true,
  cooldownTicks: 10,
  effect: {
    kind: "bind",
    durationTicks: 5,
    maxHit: 0,
  },
};

const HOMEWARD_MURMUR: SpellDef = {
  id: "homeward_murmur",
  name: "Homeward Murmur",
  spellbook: "common",
  requiredMagic: 1,
  beadCosts: [
    { itemId: "gust_bead", quantity: 1 },
    { itemId: "writ_bead", quantity: 1 },
  ],
  castXp: 10,
  rangeTiles: 0,
  targetType: "self",
  requiresLineOfSight: false,
  cooldownTicks: 100,
  effect: {
    kind: "teleport",
    destination: { x: 6, y: 2, plane: 0 },
    delayTicks: 3,
    interruptible: true,
  },
};

const BEAD_IDS = ["ember_bead", "wit_bead", "bone_bead", "gust_bead", "writ_bead"] as const;
const HOME_DELAY_TICKS = 3;

function bead(id: (typeof BEAD_IDS)[number]): ItemDef {
  return {
    id,
    name: id,
    stackable: true,
    tradeable: true,
    examine: id,
    icon: id,
    value: 1,
    options: [],
    tags: [],
  };
}

const ITEMS = new Map(BEAD_IDS.map((id) => [id, bead(id)]));
const CATALOG = catalogFromItems(ITEMS);

function registries(spells: readonly SpellDef[]): ContentRegistries {
  return {
    item: ITEMS,
    npc: new Map(),
    object: new Map(),
    processingRecipe: new Map(),
    skill: new Map(),
    resourceNode: new Map(),
    spell: new Map(spells.map((spell) => [spell.id, spell])),
    dropTable: new Map(),
    quest: new Map(),
    dialogue: new Map(),
    regionMap: new Map(),
    material: new Map(),
    animation: new Map(),
  };
}

function rng(float = 0, int = 2): Rng {
  return {
    nextFloat: () => float,
    nextInt: (min, max) => Math.min(Math.max(int, min), max),
    chanceOneIn: () => false,
  };
}

function addOpenTiles(map: RuntimeMap): void {
  for (let x = 0; x <= 8; x += 1) {
    for (let y = 0; y <= 4; y += 1) {
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

function addPlayer(world: World, tile: TileCoord = { x: 1, y: 1, plane: 0 }): EntityId {
  const player = world.createEntity();
  world.setComponent(player, "position", {
    entityId: player,
    x: tile.x,
    y: tile.y,
    plane: tile.plane,
  });
  world.setComponent(player, "player", {
    entityId: player,
    accountId: "account",
    sessionId: "session",
    interestRadius: 32,
    spellbook: "common",
  });
  world.setComponent(player, "movement", { entityId: player, mode: "walk", path: [] });
  world.setComponent(player, "combatant", {
    entityId: player,
    health: 10,
    maxHealth: 10,
    attackLevel: 1,
    strengthLevel: 1,
    defenceLevel: 1,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 1,
    eatBlockedUntilTick: 0,
    spellCooldowns: {},
  });
  world.setComponent(player, "skills", {
    entityId: player,
    skills: {
      magic: { level: 1, xp: 0, boost: 0, drain: 0 },
      hitpoints: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  const inventory = createInventory(player, `inventory:${player}`, 28);
  for (const itemId of BEAD_IDS) {
    addItem(inventory, CATALOG, itemId, 10);
  }
  world.setComponent(player, "inventory", inventory);
  return player;
}

function addTarget(world: World, tile: TileCoord = { x: 3, y: 1, plane: 0 }): EntityId {
  const target = world.createEntity();
  world.setComponent(target, "position", {
    entityId: target,
    x: tile.x,
    y: tile.y,
    plane: tile.plane,
  });
  world.setComponent(target, "movement", {
    entityId: target,
    mode: "walk",
    path: [{ x: tile.x + 1, y: tile.y, plane: tile.plane }],
  });
  world.setComponent(target, "combatant", {
    entityId: target,
    health: 10,
    maxHealth: 10,
    attackLevel: 1,
    strengthLevel: 1,
    defenceLevel: 1,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 1,
    eatBlockedUntilTick: 0,
  });
  return target;
}

function setup(
  spells: readonly SpellDef[] = [EMBER_FLICK],
  roll: Rng = rng(),
): {
  readonly ctx: SpellSystemContext;
  readonly world: World;
  readonly map: RuntimeMap;
  readonly player: EntityId;
  readonly target: EntityId;
  readonly actionRuntime: ActionRuntime;
  readonly deltas: DeltaAccumulator;
  readonly itemAudit: ItemAuditLog;
} {
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  const player = addPlayer(world);
  const target = addTarget(world);
  const actionRuntime = new ActionRuntime();
  const deltas = new DeltaAccumulator();
  const itemAudit = new ItemAuditLog();
  const ctx: SpellSystemContext = {
    world,
    collision: new CollisionMap(map),
    deltas,
    registries: registries(spells),
    actionRuntime,
    rng: roll,
    itemAudit,
  };
  return { ctx, world, map, player, target, actionRuntime, deltas, itemAudit };
}

function cast(
  ctx: SpellSystemContext,
  player: EntityId,
  spellId: string,
  target: EntityId,
  tick = 10,
): boolean {
  return handleSpellIntent(
    ctx,
    player,
    { spellId, target: { kind: "entity", entityId: target } },
    tick,
    tick * 600,
  );
}

function firstEntityUpdate(
  deltas: DeltaAccumulator,
  entityId: EntityId,
): EntityUpdatePayload | undefined {
  return deltas.peek().entityUpdates.find((update) => update.entityId === entityId)?.changes;
}

function executeQueuedTeleport(ctx: SpellSystemContext, actionRuntime: ActionRuntime): void {
  let executions: readonly ActionExecution[] = [];
  for (let i = 0; i < HOME_DELAY_TICKS; i += 1) {
    executions = actionRuntime.advanceTick();
  }
  const execution = executions[0];
  if (!execution) {
    throw new Error("expected queued teleport action");
  }
  createSpellActionHandlers(ctx).teleport(execution.entry.payload as TeleportActionPayload, {
    tick: 13,
    serverTime: 7_800,
    execution,
    selfCancel: (id) => actionRuntime.cancel(execution.entry.owner, { id }),
  });
}

describe("SpellSystem", () => {
  it("consumes bead costs, sets cooldown, and emits projectile deltas on a valid combat spell", () => {
    const { ctx, world, player, target, deltas, itemAudit } = setup();

    expect(cast(ctx, player, "ember_flick", target)).toBe(true);

    const inventory = world.getComponent(player, "inventory");
    expect(inventory && count(inventory, "ember_bead")).toBe(9);
    expect(inventory && count(inventory, "wit_bead")).toBe(9);
    expect(itemAudit.snapshot().map((record) => record.reason)).toEqual([
      "spell_bead_cost",
      "spell_bead_cost",
    ]);
    expect(itemAudit.snapshot()[0]).toMatchObject({
      itemId: "ember_bead",
      beforeQuantity: 10,
      afterQuantity: 9,
      metadata: expect.objectContaining({ spellId: "ember_flick" }),
    });
    expect(world.getComponent(player, "combatant")?.spellCooldowns?.ember_flick).toBe(14);
    expect(deltas.peek().chat).toBeUndefined();
    expect(deltas.peek().projectiles).toEqual([
      {
        id: `${10}:${player}:ember_flick:entity:${target}`,
        projectileId: "projectile_ember_flick",
        sourceEntityId: player,
        targetEntityId: target,
        startTile: { x: 1, y: 1, plane: 0 },
        endTile: { x: 3, y: 1, plane: 0 },
        startTick: 10,
        hitTick: 12,
      },
    ]);
  });

  it("schedules magic damage for the projectile impact tick and awards combat xp on impact", () => {
    const { ctx, world, player, target, deltas } = setup();

    cast(ctx, player, "ember_flick", target);

    expect(world.getComponent(target, "combatant")?.pendingHits).toMatchObject([
      { sourceId: player, targetId: target, applyTick: 12, style: "magic", damage: 2 },
    ]);
    expect(firstEntityUpdate(deltas, player)).toMatchObject({
      facingEntity: target,
      animation: { id: SPELL_CAST_ANIMATION_ID, startTick: 10 },
      graphic: { id: "ember_flick_cast" },
    });
    expect(deltas.peek().skillDelta).toEqual([{ skillId: "magic", level: 1, xp: 5.5 }]);

    deltas.consume(10, 6_000);
    processDamageResolutionEvents(ctx, 11);
    expect(deltas.peek().hitsplats).toBeUndefined();

    processDamageResolutionEvents(ctx, 12);
    expect(world.getComponent(target, "combatant")?.health).toBe(8);
    expect(world.getComponent(target, "combatant")?.pendingHits).toBeUndefined();
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: target, hitsplat: { amount: 2, type: "damage" } },
    ]);
    expect(firstEntityUpdate(deltas, target)).toMatchObject({
      healthBar: { current: 8, max: 10 },
    });
    expect(deltas.peek().skillDelta).toEqual([
      { skillId: "hitpoints", level: 1, xp: 2 },
      { skillId: "magic", level: 1, xp: 13.5 },
    ]);
  });

  it("drops a queued magic hit if the target dies before impact", () => {
    const { ctx, world, player, target, deltas } = setup();
    cast(ctx, player, "ember_flick", target);
    deltas.consume(10, 6_000);

    const combatant = world.getComponent(target, "combatant");
    if (!combatant) throw new Error("expected target combatant");
    world.setComponent(target, "combatant", { ...combatant, dead: true, health: 0 });

    processDamageResolutionEvents(ctx, 12);

    expect(world.getComponent(target, "combatant")?.pendingHits).toBeUndefined();
    expect(deltas.peek().hitsplats).toBeUndefined();
  });

  it("rejects missing beads without partial consumption", () => {
    const { ctx, world, player, target, deltas } = setup();
    const inventory = world.getComponent(player, "inventory");
    if (!inventory) throw new Error("expected inventory");
    inventory.slots = inventory.slots.map((slot) =>
      slot?.itemId === "wit_bead" ? undefined : slot,
    );

    expect(cast(ctx, player, "ember_flick", target)).toBe(true);

    expect(count(inventory, "ember_bead")).toBe(10);
    expect(deltas.peek().inventoryDelta).toBeUndefined();
    expect(deltas.peek().chat?.[0]?.text).toBe("You do not have the required beads.");
  });

  it("rejects low magic level, wrong target shape, blocked line of sight, cooldown, and spellbook mismatch", () => {
    const highReq = { ...EMBER_FLICK, requiredMagic: 5 };
    {
      const { ctx, player, target, deltas } = setup([highReq]);
      cast(ctx, player, "ember_flick", target);
      expect(deltas.consume(10, 6_000).chat?.[0]?.text).toBe(
        "You need Magic level 5 to cast Ember Flick.",
      );
    }

    {
      const { ctx, player, deltas } = setup();
      handleSpellIntent(
        ctx,
        player,
        { spellId: "ember_flick", target: { kind: "none" } },
        10,
        6_000,
      );
      expect(deltas.consume(10, 6_000).chat?.[0]?.text).toBe("That spell needs an entity target.");
    }

    {
      const { ctx, map, player, target, deltas } = setup();
      const blockedTile = { x: 2, y: 1, plane: 0 as const };
      map.tiles.set(tileKey(blockedTile), {
        tile: blockedTile,
        height: 0,
        underlayId: "grass",
        collision: CollisionFlag.PROJECTILE_BLOCK,
        water: false,
        bridge: false,
      });
      cast(ctx, player, "ember_flick", target);
      expect(deltas.consume(10, 6_000).chat?.[0]?.text).toBe("You cannot see that target.");
    }

    {
      const { ctx, player, target, deltas } = setup();
      cast(ctx, player, "ember_flick", target);
      deltas.consume(10, 6_000);
      cast(ctx, player, "ember_flick", target, 11);
      expect(deltas.consume(11, 6_600).chat?.[0]?.text).toBe("That spell is not ready yet.");
    }

    const { ctx, world, player, target, deltas } = setup();
    world.setComponent(player, "skills", {
      entityId: player,
      skills: {
        magic: { level: 1, xp: 0, boost: 0, drain: 0 },
        hitpoints: { level: 1, xp: 0, boost: 0, drain: 0 },
      },
    });
    world.setComponent(player, "player", {
      entityId: player,
      accountId: "account",
      sessionId: "session",
      interestRadius: 32,
      spellbook: "old_ways",
    });
    cast(ctx, player, "ember_flick", target, 14);
    expect(deltas.consume(14, 8_400).chat?.[0]?.text).toBe("You cannot cast from that spellbook.");
  });

  it("applies reusable bind movement blocks with status feedback", () => {
    const { ctx, world, player, target, deltas } = setup([BONE_BIND]);

    expect(cast(ctx, player, "bone_bind", target)).toBe(true);

    expect(world.getComponent(target, "combatant")?.pendingHits).toBeUndefined();
    expect(world.getComponent(target, "movement")).toMatchObject({
      path: [],
      blockedUntilTick: 15,
    });
    expect(firstEntityUpdate(deltas, target)).toMatchObject({
      moveSpeed: "stationary",
      overheadText: SPELL_BIND_OVERHEAD_TEXT,
      graphic: { id: "bone_bind_bind" },
    });
    expect(firstEntityUpdate(deltas, player)).toMatchObject({
      facingEntity: target,
      animation: { id: SPELL_CAST_ANIMATION_ID, startTick: 10 },
      graphic: { id: "bone_bind_cast" },
    });
    expect(deltas.peek().skillDelta).toEqual([{ skillId: "magic", level: 1, xp: 6 }]);
  });

  it("queues and completes home teleport through the action runtime", () => {
    const { ctx, world, player, actionRuntime, deltas } = setup([HOMEWARD_MURMUR]);

    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "homeward_murmur", target: { kind: "none" } },
        10,
        6_000,
      ),
    ).toBe(true);

    expect(actionRuntime.getDebugState()).toMatchObject([
      {
        id: `teleport:${player}:homeward_murmur`,
        owner: player,
        type: ActionQueueType.Weak,
        interruptGroup: InterruptGroup.Combat,
        remainingDelayTicks: 3,
      },
    ]);
    expect(firstEntityUpdate(deltas, player)).toMatchObject({
      animation: { id: TELEPORT_CAST_ANIMATION_ID, startTick: 10 },
      graphic: { id: "homeward_murmur_channel" },
      moveSpeed: "stationary",
    });
    deltas.consume(10, 6_000);

    executeQueuedTeleport(ctx, actionRuntime);

    expect(world.getComponent(player, "position")).toMatchObject({ x: 6, y: 2, plane: 0 });
    expect(world.getComponent(player, "movement")).toMatchObject({ path: [] });
    expect(firstEntityUpdate(deltas, player)).toMatchObject({
      position: { x: 6, y: 2, plane: 0 },
      moveSpeed: "stationary",
      graphic: { id: "homeward_murmur_arrive" },
    });
  });

  it("cancels home teleport on movement without refunding consumed beads", () => {
    const { ctx, world, player, actionRuntime } = setup([HOMEWARD_MURMUR]);

    handleSpellIntent(
      ctx,
      player,
      { spellId: "homeward_murmur", target: { kind: "none" } },
      10,
      6_000,
    );
    actionRuntime.cancel(player, { type: ActionQueueType.Weak });
    for (let i = 0; i < HOME_DELAY_TICKS; i += 1) {
      expect(actionRuntime.advanceTick()).toEqual([]);
    }

    const inventory = world.getComponent(player, "inventory");
    expect(world.getComponent(player, "position")).toMatchObject({ x: 1, y: 1, plane: 0 });
    expect(inventory && count(inventory, "gust_bead")).toBe(9);
    expect(inventory && count(inventory, "writ_bead")).toBe(9);
  });

  it("cancels home teleport when combat damage lands", () => {
    const { ctx, world, player, target, actionRuntime, deltas } = setup([HOMEWARD_MURMUR]);
    handleSpellIntent(
      ctx,
      player,
      { spellId: "homeward_murmur", target: { kind: "none" } },
      10,
      6_000,
    );
    deltas.consume(10, 6_000);

    appendPendingHit(ctx, player, {
      sourceId: target,
      targetId: player,
      applyTick: 11,
      style: "magic",
      attackRoll: 1,
      defenceRoll: 1,
      hitChance: 1,
      maxHit: 1,
      damage: 1,
      hitLanded: true,
    });
    processDamageResolutionEvents(ctx, 11);

    expect(actionRuntime.getDebugState()).toEqual([]);
    expect(world.getComponent(player, "position")).toMatchObject({ x: 1, y: 1, plane: 0 });
    expect(deltas.peek().hitsplats).toEqual([
      { entityId: player, hitsplat: { amount: 1, type: "damage" } },
    ]);
  });
});
