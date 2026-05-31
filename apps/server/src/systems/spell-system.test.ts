import {
  type ContentRegistries,
  type EntityId,
  type ItemDef,
  type Rng,
  type SpellDef,
  tileKey,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../items/inventory";
import { ActionQueueType, InterruptGroup } from "../sim/action-queue";
import { ActionRuntime } from "../sim/action-runtime";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionFlag, CollisionMap } from "../world/collision";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { processDamageResolutionEvents } from "./combat-system";
import {
  createSpellActionHandlers,
  handleSpellIntent,
  type SpellSystemContext,
  type TeleportActionPayload,
} from "./spell-system";

const EMBER_BEAD: ItemDef = {
  id: "ember_bead",
  name: "Ember Bead",
  stackable: true,
  tradeable: true,
  equippable: false,
  consumable: false,
  value: 1,
  tags: [],
  weight: 0,
  examine: "A small bead of warm fire.",
};

const TELEPORT_SPELL: SpellDef = {
  id: "home_teleport",
  name: "Home Teleport",
  spellbook: "common",
  requiredMagic: 1,
  beadCosts: [{ itemId: "ember_bead", quantity: 1 }],
  castXp: 10,
  rangeTiles: 0,
  targetType: "self",
  requiresLineOfSight: false,
  effect: {
    kind: "teleport",
    destination: { x: 6, y: 2, plane: 0 },
    delayTicks: 3,
  },
};

const BIND_SPELL: SpellDef = {
  id: "bind",
  name: "Bind",
  spellbook: "common",
  requiredMagic: 1,
  beadCosts: [{ itemId: "ember_bead", quantity: 2 }],
  castXp: 15,
  rangeTiles: 8,
  targetType: "entity",
  requiresLineOfSight: true,
  effect: {
    kind: "bind",
    durationTicks: 8,
    maxHit: 0,
  },
};

const DAMAGE_SPELL: SpellDef = {
  id: "fire_bolt",
  name: "Fire Bolt",
  spellbook: "common",
  requiredMagic: 1,
  beadCosts: [{ itemId: "ember_bead", quantity: 1 }],
  castXp: 12,
  rangeTiles: 8,
  targetType: "entity",
  requiresLineOfSight: true,
  cooldownTicks: 5,
  effect: {
    kind: "damage",
    maxHit: 5,
  },
};

function registries(
  spells: readonly SpellDef[] = [TELEPORT_SPELL],
): ContentRegistries {
  return {
    item: new Map([[EMBER_BEAD.id, EMBER_BEAD]]),
    npc: new Map(),
    object: new Map(),
    processingRecipe: new Map(),
    skill: new Map(),
    resourceNode: new Map(),
    spell: new Map(spells.map((s) => [s.id, s])),
    dropTable: new Map(),
    quest: new Map(),
    dialogue: new Map(),
    regionMap: new Map(),
    material: new Map(),
    animation: new Map(),
  };
}

function setup(spellDefs: readonly SpellDef[] = [TELEPORT_SPELL]): {
  readonly ctx: SpellSystemContext;
  readonly player: EntityId;
  readonly world: World;
  readonly map: RuntimeMap;
  readonly actionRuntime: ActionRuntime;
  readonly deltas: DeltaAccumulator;
} {
  const world = createWorld();
  const map = createRuntimeMap();
  const tile = { x: 4, y: 4, plane: 0 as const };
  map.tiles.set(tileKey(tile), {
    tile,
    height: 0,
    underlayId: "grass",
    collision: 0,
    water: false,
    bridge: false,
  });
  const player = world.createEntity();
  world.setComponent(player, "position", { entityId: player, x: 4, y: 4, plane: 0 });
  world.setComponent(player, "player", {
    entityId: player,
    accountId: "test",
    sessionId: "test",
    interestRadius: 32,
    spellbook: "common",
  });
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
  });
  world.setComponent(player, "skills", {
    entityId: player,
    skills: {
      magic: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  const inventory = createInventory(player, 28, catalogFromItems(new Map()));
  addItem(inventory, catalogFromItems(new Map()), "ember_bead", 10);
  world.setComponent(player, "inventory", inventory);
  const content = registries(spellDefs);
  const collision = new CollisionMap(map);
  const actionRuntime = new ActionRuntime();
  const deltas = new DeltaAccumulator();
  const ctx: SpellSystemContext = {
    world,
    collision,
    deltas,
    registries: content,
    actionRuntime,
    rng: {
      nextFloat: () => 0.5,
      nextInt: (_min, _max) => 0,
      chanceOneIn: (_chance) => false,
    } as Rng,
  };
  return { ctx, player, world, map, actionRuntime, deltas };
}

function advanceToExecution(
  actionRuntime: ActionRuntime,
  delayTicks: number,
): {
  readonly execution: {
    entry: { payload: TeleportActionPayload };
    executionCount: number;
  };
  tick: number;
  serverTime: number;
} {
  let executions: readonly {
    entry: { payload: TeleportActionPayload };
    executionCount: number;
  }[] = [];
  for (let tick = 1; tick <= delayTicks; tick += 1) {
    executions = actionRuntime.advanceTick() as unknown as typeof executions;
  }
  const execution = executions[0];
  if (!execution) {
    throw new Error("expected action execution");
  }
  return {
    execution,
    tick: delayTicks,
    serverTime: delayTicks * 600,
  };
}

describe("SpellSystem", () => {
  it("queues teleport on spell intent and completes after delay", () => {
    const { ctx, player, world, actionRuntime, deltas } = setup();
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "home_teleport", target: { kind: "none" } },
        1,
        600,
      ),
    ).toBe(true);
    expect(actionRuntime.getDebugState().length).toBe(1);

    const { execution, tick, serverTime } = advanceToExecution(actionRuntime, 3);
    const teleport = createSpellActionHandlers(ctx).teleport;
    if (!teleport) throw new Error("missing teleport handler");
    teleport(execution.entry.payload as TeleportActionPayload, {
      tick: 13,
      serverTime: 7_800,
      execution,
      selfCancel: (id) => actionRuntime.cancel(player, { id }),
    });

    expect(world.getComponent(player, "position")).toMatchObject({ x: 6, y: 2, plane: 0 });
    expect(deltas.peek().entityUpdates[0]?.changes.position).toEqual({ x: 6, y: 2, plane: 0 });
  });

  it("rejects unknown spell", () => {
    const { ctx, player, deltas } = setup();
    expect(
      handleSpellIntent(ctx, player, { spellId: "unknown", target: { kind: "none" } }, 1, 600),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("You do not know that spell.");
  });

  it("rejects spell from wrong spellbook", () => {
    const { ctx, player, world, deltas } = setup();
    world.setComponent(player, "player", {
      entityId: player,
      accountId: "test",
      sessionId: "test",
      interestRadius: 32,
      spellbook: "old_ways",
    });
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "home_teleport", target: { kind: "none" } },
        1,
        600,
      ),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("You cannot cast from that spellbook.");
  });

  it("rejects combat spell without combatant", () => {
    const { ctx, player, world, deltas } = setup([BIND_SPELL]);
    world.removeComponent(player, "combatant");
    expect(
      handleSpellIntent(ctx, player, { spellId: "bind", target: { kind: "none" } }, 1, 600),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("You are not ready to cast spells.");
  });

  it("rejects low magic level", () => {
    const { ctx, player, world, deltas } = setup();
    world.setComponent(player, "skills", {
      entityId: player,
      skills: { magic: { level: 1, xp: 0, boost: 0, drain: 0 } },
    });
    const highReq = { ...TELEPORT_SPELL, requiredMagic: 5 };
    const next = new Map(ctx.registries.spell);
    next.set(highReq.id, highReq);
    ctx.registries.spell = next;
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "home_teleport", target: { kind: "none" } },
        1,
        600,
      ),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("You need Magic level 5 to cast Home Teleport.");
  });

  it("rejects spell without required beads", () => {
    const { ctx, player, world, deltas } = setup();
    const inventory = createInventory(player, 28, catalogFromItems(new Map()));
    world.setComponent(player, "inventory", inventory);
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "home_teleport", target: { kind: "none" } },
        1,
        600,
      ),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("You do not have the required beads.");
  });

  it("rejects out of range target", () => {
    const { ctx, player, world, deltas } = setup([BIND_SPELL]);
    const target = world.createEntity();
    world.setComponent(target, "position", { entityId: target, x: 100, y: 100, plane: 0 });
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "bind", target: { kind: "entity", entityId: target } },
        1,
        600,
      ),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("That target is too far away.");
  });

  it("rejects blocked line of sight", () => {
    const { ctx, player, world, map, deltas } = setup([BIND_SPELL]);
    const target = world.createEntity();
    world.setComponent(target, "position", { entityId: target, x: 5, y: 4, plane: 0 });
    const tile = { x: 5, y: 4, plane: 0 as const };
    map.tiles.set(tileKey(tile), {
      tile,
      height: 0,
      underlayId: "grass",
      collision: CollisionFlag.BLOCK_LOS_FULL,
      water: false,
      bridge: false,
    });
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "bind", target: { kind: "entity", entityId: target } },
        1,
        600,
      ),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("You cannot see that target.");
  });

  it("consumes beads and awards xp on valid cast", () => {
    const { ctx, player, world, deltas } = setup();
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "home_teleport", target: { kind: "none" } },
        1,
        600,
      ),
    ).toBe(true);
    const inventory = world.getComponent(player, "inventory");
    expect(count(inventory ?? createInventory(player, 28, catalogFromItems(new Map())), "ember_bead")).toBe(9);
    expect(deltas.peek().skillDelta).toEqual([{ skillId: "magic", level: 1, xp: 10 }]);
    expect(deltas.peek().inventoryDelta?.changes).toEqual([
      { slot: 0, itemId: "ember_bead", quantity: 9, uid: 1 },
    ]);
  });

  it("enforces cooldown and tracks remaining time", () => {
    const { ctx, player, world, deltas } = setup([DAMAGE_SPELL]);
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "fire_bolt", target: { kind: "none" } },
        1,
        600,
      ),
    ).toBe(true);
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "fire_bolt", target: { kind: "none" } },
        2,
        1_200,
      ),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("You must wait 3s before casting Fire Bolt again.");
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "fire_bolt", target: { kind: "none" } },
        6,
        3_600,
      ),
    ).toBe(true);
    expect(deltas.peek().chat?.[0]?.text).toBe("You must wait 0s before casting Fire Bolt again.");
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "fire_bolt", target: { kind: "none" } },
        7,
        4_200,
      ),
    ).toBe(true);
    expect(deltas.peek().skillDelta).toEqual([{ skillId: "magic", level: 1, xp: 12 }]);
  });

  it("binds target and appends pending hit", () => {
    const { ctx, player, world, deltas } = setup([BIND_SPELL]);
    const target = world.createEntity();
    world.setComponent(target, "position", { entityId: target, x: 5, y: 4, plane: 0 });
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
    expect(
      handleSpellIntent(
        ctx,
        player,
        { spellId: "bind", target: { kind: "entity", entityId: target } },
        1,
        600,
      ),
    ).toBe(true);
    processDamageResolutionEvents(ctx, 1);
    const combatant = world.getComponent(target, "combatant");
    expect(combatant?.pendingHits?.length).toBe(1);
    expect(combatant?.pendingHits?.[0]?.targetId).toBe(target);
    const movement = world.getComponent(target, "movement");
    expect(movement?.blockedUntilTick).toBe(9);
  });
});
