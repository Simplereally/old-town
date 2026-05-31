import {
  ClientCommandType,
  type ContentRegistries,
  type EntityId,
  type Rng,
  ServerPacketType,
  type TileCoord,
  tileKey,
} from "@old-town/shared";
import { beforeAll, describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { createWorld, type World } from "../ecs/world";
import { addItem, catalogFromItems, count, createInventory } from "../items/inventory";
import { ItemAuditLog } from "../items/item-audit";
import type { Logger } from "../logger";
import { MemoryPersistenceAdapter } from "../persistence";
import {
  handleNpcCombatIntent,
  processCombatStartEvents,
  processDamageResolutionEvents,
} from "../systems/combat-system";
import { handleGroundItemIntent, processDeathResolution } from "../systems/ground-item-system";
import { syncNpcOccupancy } from "../systems/npc-system";
import { createResourceNodeActionHandlers } from "../systems/resource-node-system";
import {
  createSkillingActionHandlers,
  handleObjectSkillingIntent,
} from "../systems/skilling-system";
import { handleSpellIntent } from "../systems/spell-system";
import { createVarComponent } from "../vars/player-vars";
import { CollisionMap, objectCollisionFlags } from "../world/collision";
import { loadAllRegionMapsIntoWorld } from "../world/region-loader";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { ActionExecutor } from "./action-executor";
import { ActionRuntime } from "./action-runtime";
import { DeltaAccumulator } from "./delta-accumulator";
import { createSimulationKernel } from "./simulation-kernel";

interface GameplayHarness {
  readonly world: World;
  readonly map: RuntimeMap;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly actionRuntime: ActionRuntime;
  readonly itemAudit: ItemAuditLog;
  readonly rng: Rng;
  readonly ctx: GameplayContext;
  readonly executor: ActionExecutor<Record<string, unknown>>;
}

interface GameplayContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly registries: ContentRegistries;
  readonly actionRuntime: ActionRuntime;
  readonly rng: Rng;
  readonly itemAudit: ItemAuditLog;
}

const logger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

let registries: ContentRegistries;

beforeAll(async () => {
  const content = await loadContent("content");
  if (!content.ok || content.issues.length > 0) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  registries = content.registries;
});

function tile(x: number, y: number, plane = 0): TileCoord {
  return { x, y, plane: plane as TileCoord["plane"] };
}

function fixedRng(
  options: { readonly floats?: readonly number[]; readonly ints?: readonly number[] } = {},
): Rng {
  let floatIndex = 0;
  let intIndex = 0;
  return {
    nextFloat: () => options.floats?.[floatIndex++] ?? 0,
    nextInt: (min, max) => {
      const value = options.ints?.[intIndex++] ?? max;
      return Math.min(Math.max(value, min), max);
    },
    chanceOneIn: () => false,
  };
}

function addOpenTiles(map: RuntimeMap, size = 10): void {
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      const coord = tile(x, y);
      map.tiles.set(tileKey(coord), {
        tile: coord,
        height: 0,
        underlayId: "grass",
        collision: 0,
        water: false,
        bridge: false,
      });
    }
  }
}

function makeHarness(rng: Rng = fixedRng()): GameplayHarness {
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const actionRuntime = new ActionRuntime();
  const itemAudit = new ItemAuditLog();
  const ctx: GameplayContext = {
    world,
    collision,
    deltas,
    registries,
    actionRuntime,
    rng,
    itemAudit,
  };
  const executor = new ActionExecutor(
    {
      ...createSkillingActionHandlers(ctx),
      ...createResourceNodeActionHandlers(ctx),
    },
    actionRuntime.cancel.bind(actionRuntime),
  );
  return { world, map, collision, deltas, actionRuntime, itemAudit, rng, ctx, executor };
}

function addPlayer(
  harness: GameplayHarness,
  coord: TileCoord,
  options: {
    readonly attackLevel?: number;
    readonly strengthLevel?: number;
    readonly defenceLevel?: number;
    readonly magicLevel?: number;
    readonly items?: readonly { readonly itemId: string; readonly quantity: number }[];
    readonly weaponId?: string;
  } = {},
): EntityId {
  const entityId = harness.world.createEntity();
  harness.world.setComponent(entityId, "position", {
    entityId,
    x: coord.x,
    y: coord.y,
    plane: coord.plane,
  });
  harness.world.setComponent(entityId, "player", {
    entityId,
    accountId: "account",
    sessionId: `session:${entityId}`,
    interestRadius: 32,
    spellbook: "common",
  });
  harness.world.setComponent(entityId, "movement", { entityId, mode: "walk", path: [] });
  harness.world.setComponent(entityId, "vars", createVarComponent(entityId));
  harness.world.setComponent(entityId, "combatant", {
    entityId,
    health: 20,
    maxHealth: 20,
    attackLevel: options.attackLevel ?? 1,
    strengthLevel: options.strengthLevel ?? 1,
    defenceLevel: options.defenceLevel ?? 1,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 3,
    eatBlockedUntilTick: 0,
    autoRetaliate: true,
    nextAttackTick: 0,
    spellCooldowns: {},
  });
  harness.world.setComponent(entityId, "skills", {
    entityId,
    skills: {
      attack: { level: options.attackLevel ?? 1, xp: 0, boost: 0, drain: 0 },
      strength: { level: options.strengthLevel ?? 1, xp: 0, boost: 0, drain: 0 },
      defence: { level: options.defenceLevel ?? 1, xp: 0, boost: 0, drain: 0 },
      hitpoints: { level: 10, xp: 0, boost: 0, drain: 0 },
      magic: { level: options.magicLevel ?? 1, xp: 0, boost: 0, drain: 0 },
      woodcutting: { level: 1, xp: 0, boost: 0, drain: 0 },
      mining: { level: 1, xp: 0, boost: 0, drain: 0 },
    },
  });
  const inventory = createInventory(entityId, `inventory:${entityId}`, 28);
  for (const item of options.items ?? []) {
    const added = addItem(inventory, catalogFromItems(registries.item), item.itemId, item.quantity);
    expect(added.added).toBe(item.quantity);
  }
  harness.world.setComponent(entityId, "inventory", inventory);
  const weapon = options.weaponId ? registries.item.get(options.weaponId) : undefined;
  harness.world.setComponent(entityId, "equipment", {
    entityId,
    slots: { ...(weapon ? { weapon: weapon.id } : {}) },
    bonuses: weapon?.equipment?.bonuses ?? {},
  });
  return entityId;
}

function addResourceObject(
  harness: GameplayHarness,
  objectId: string,
  nodeId: string,
  coord: TileCoord,
): EntityId {
  const object = registries.object.get(objectId);
  if (!object) {
    throw new Error(`Missing object ${objectId}`);
  }
  const entityId = harness.world.createEntity();
  harness.world.setComponent(entityId, "position", {
    entityId,
    x: coord.x,
    y: coord.y,
    plane: coord.plane,
  });
  harness.world.setComponent(entityId, "object", {
    entityId,
    objectId,
    facing: 0,
    variant: 0,
  });
  harness.world.setComponent(entityId, "resourceNode", {
    entityId,
    nodeId,
    active: true,
    depleted: false,
    respawnTick: 0,
  });
  harness.collision.applyFootprint(
    coord,
    { width: object.width, length: object.length },
    objectCollisionFlags(object),
  );
  return entityId;
}

function addNpc(harness: GameplayHarness, npcId: string, coord: TileCoord): EntityId {
  const def = registries.npc.get(npcId);
  if (!def) {
    throw new Error(`Missing NPC ${npcId}`);
  }
  const entityId = harness.world.createEntity();
  harness.world.setComponent(entityId, "position", {
    entityId,
    x: coord.x,
    y: coord.y,
    plane: coord.plane,
  });
  harness.world.setComponent(entityId, "npc", {
    entityId,
    npcId,
    brainState: "idle",
    respawnTick: 0,
    wanderRadius: def.wanderRadius,
    home: coord,
    leashDistance: def.wanderRadius + (def.aggressiveRadius ?? 0) + 4,
  });
  harness.world.setComponent(entityId, "actor", {
    entityId,
    name: def.name,
    level: def.combatLevel ?? 0,
    appearanceId: npcId,
  });
  harness.world.setComponent(entityId, "combatant", {
    entityId,
    health: def.maxHp ?? 8,
    maxHealth: def.maxHp ?? 8,
    attackLevel: def.stats?.attack ?? 1,
    strengthLevel: def.stats?.strength ?? 1,
    defenceLevel: def.stats?.defence ?? 1,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: def.combatLevel ?? 3,
    eatBlockedUntilTick: 0,
    autoRetaliate: true,
    nextAttackTick: 0,
    dead: false,
    spellCooldowns: {},
  });
  syncNpcOccupancy(harness.ctx);
  return entityId;
}

function runActions(harness: GameplayHarness, startTick: number, endTick: number): void {
  for (let tick = startTick; tick <= endTick; tick += 1) {
    harness.executor.execute(harness.actionRuntime.advanceTick(), {
      tick,
      serverTime: tick * 600,
    });
  }
}

function inventoryCount(harness: GameplayHarness, entityId: EntityId, itemId: string): number {
  const inventory = harness.world.getComponent(entityId, "inventory");
  if (!inventory) {
    throw new Error("Missing inventory");
  }
  return count(inventory, itemId);
}

function skillXp(harness: GameplayHarness, entityId: EntityId, skillId: string): number {
  return harness.world.getComponent(entityId, "skills")?.skills[skillId]?.xp ?? 0;
}

describe("gameplay loop integration", () => {
  it("loads resource-node content into the seed map", () => {
    const world = createWorld();
    const map = createRuntimeMap();
    loadAllRegionMapsIntoWorld(world, map, registries);
    expect(world.componentCount("resourceNode")).toBeGreaterThanOrEqual(4);
    expect(
      Array.from(world.componentEntries("object")).some(
        ([, object]) => object.objectId === "dry_tree",
      ),
    ).toBe(true);
    expect(
      Array.from(world.componentEntries("object")).some(
        ([, object]) => object.objectId === "copper_rock",
      ),
    ).toBe(true);
  });

  it("chops a dry tree into logs and XP, depletes it, then respawns it", () => {
    const harness = makeHarness(fixedRng({ floats: [0, 0] }));
    const player = addPlayer(harness, tile(1, 1), {
      items: [{ itemId: "pennywrought_axe", quantity: 1 }],
    });
    const tree = addResourceObject(harness, "dry_tree", "dry_tree_node", tile(1, 2));

    expect(
      handleObjectSkillingIntent(
        harness.ctx,
        player,
        { objectEntityId: tree, actionId: "woodcut" },
        0,
        0,
      ),
    ).toBe(true);
    runActions(harness, 1, 4);

    expect(inventoryCount(harness, player, "dry_log")).toBe(1);
    expect(skillXp(harness, player, "woodcutting")).toBe(10);
    expect(harness.world.getComponent(tree, "resourceNode")?.depleted).toBe(true);

    runActions(harness, 5, 14);
    expect(harness.world.getComponent(tree, "resourceNode")?.depleted).toBe(false);
  });

  it("mines a copper rock into ore and mining XP", () => {
    const harness = makeHarness(fixedRng({ floats: [0, 1] }));
    const player = addPlayer(harness, tile(1, 1), {
      items: [{ itemId: "pennywrought_pickaxe", quantity: 1 }],
    });
    const rock = addResourceObject(harness, "copper_rock", "copper_rock_node", tile(1, 2));

    expect(
      handleObjectSkillingIntent(
        harness.ctx,
        player,
        { objectEntityId: rock, actionId: "mine" },
        0,
        0,
      ),
    ).toBe(true);
    runActions(harness, 1, 4);

    expect(inventoryCount(harness, player, "copper_ore")).toBe(1);
    expect(skillXp(harness, player, "mining")).toBe(15);
  });

  it("kills a goblin, creates a private drop, and picks it up", () => {
    const harness = makeHarness(fixedRng({ floats: [0], ints: [99, 0, 5] }));
    const player = addPlayer(harness, tile(1, 1), {
      attackLevel: 99,
      strengthLevel: 99,
      defenceLevel: 99,
      weaponId: "pennywrought_shortblade",
    });
    const goblin = addNpc(harness, "mud_goblin", tile(1, 2));
    const goblinCombat = harness.world.getComponent(goblin, "combatant");
    if (!goblinCombat) {
      throw new Error("Expected goblin combatant");
    }
    harness.world.setComponent(goblin, "combatant", {
      ...goblinCombat,
      health: 1,
      maxHealth: 1,
    });

    expect(
      handleNpcCombatIntent(
        harness.ctx,
        player,
        { npcEntityId: goblin, actionId: "attack" },
        600,
        1,
      ),
    ).toBe(true);
    processCombatStartEvents(harness.ctx, 1);
    processDamageResolutionEvents(harness.ctx, 2);
    processDeathResolution(harness.ctx, 2, 1_200);

    expect(harness.world.getComponent(goblin, "combatant")?.dead).toBe(true);
    const groundItem = harness.world.entityIdsWith("groundItem")[0];
    expect(groundItem).toBeDefined();
    if (groundItem === undefined) {
      throw new Error("Expected private goblin drop");
    }
    const drop = harness.world.getComponent(groundItem, "groundItem");
    expect(drop?.ownerId).toBe(player);
    const dropPosition = harness.world.getComponent(groundItem, "position");
    if (!dropPosition) {
      throw new Error("Expected drop position");
    }
    harness.world.setComponent(player, "position", {
      entityId: player,
      x: dropPosition.x,
      y: dropPosition.y,
      plane: dropPosition.plane,
    });

    expect(
      handleGroundItemIntent(
        harness.ctx,
        player,
        { groundItemEntityId: groundItem, actionId: "pickup" },
        2,
        1_200,
      ),
    ).toBe(true);
    expect(harness.world.isAlive(groundItem)).toBe(false);
    expect(inventoryCount(harness, player, drop?.itemId ?? "coin")).toBeGreaterThan(0);
  });

  it("casts a spell with bead costs, projectile travel, and delayed damage", () => {
    const harness = makeHarness(fixedRng({ floats: [0], ints: [2] }));
    const player = addPlayer(harness, tile(1, 1), {
      magicLevel: 1,
      items: [
        { itemId: "ember_bead", quantity: 3 },
        { itemId: "wit_bead", quantity: 3 },
      ],
    });
    const target = addNpc(harness, "mud_goblin", tile(3, 1));

    expect(
      handleSpellIntent(
        harness.ctx,
        player,
        { spellId: "ember_flick", target: { kind: "entity", entityId: target } },
        1,
        600,
      ),
    ).toBe(true);

    expect(inventoryCount(harness, player, "ember_bead")).toBe(2);
    expect(inventoryCount(harness, player, "wit_bead")).toBe(2);
    expect(skillXp(harness, player, "magic")).toBe(5.5);
    expect(harness.deltas.peek().projectiles?.[0]).toMatchObject({
      projectileId: "projectile_ember_flick",
      sourceEntityId: player,
      targetEntityId: target,
      hitTick: 3,
    });

    const before = harness.world.getComponent(target, "combatant")?.health;
    processDamageResolutionEvents(harness.ctx, 2);
    expect(harness.world.getComponent(target, "combatant")?.health).toBe(before);
    processDamageResolutionEvents(harness.ctx, 3);
    expect(harness.world.getComponent(target, "combatant")?.health).toBe((before ?? 0) - 2);
  });

  it("preserves dev character progress across reconnects when persistence is enabled", async () => {
    const persistence = new MemoryPersistenceAdapter();
    const kernel = createSimulationKernel({
      registries,
      logger,
      persistence,
      startServerTime: 0,
    });
    const firstSession = { id: "session-a", characterId: "persistent-dev" };
    await kernel.connectSession(firstSession);
    expect(
      kernel.routeCommand(firstSession, {
        type: ClientCommandType.MoveClick,
        commandId: 1,
        payload: { dest: tile(31, 32) },
      }),
    ).toEqual({ ok: true });
    kernel.runOneTick();
    await kernel.disconnectSession(firstSession);

    const secondState = await kernel.connectSession({
      id: "session-b",
      characterId: "persistent-dev",
    });
    expect(secondState.type).toBe(ServerPacketType.FullState);
    expect(
      secondState.entities.find((entity) => entity.entityId === secondState.selfEntityId)?.tile,
    ).toEqual(tile(31, 32));
  });
});
