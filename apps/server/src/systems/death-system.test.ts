import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { processPlayerRespawn } from "./death-system";

function getCombatant(
  world: World,
  entityId: import("@old-town/shared").EntityId,
): import("../ecs/components").CombatantComponent {
  const c = world.getComponent(entityId, "combatant");
  if (!c) throw new Error("combatant missing");
  return c;
}

function addOpenTiles(map: RuntimeMap): void {
  for (let x = 0; x < 64; x += 1) {
    for (let y = 0; y < 64; y += 1) {
      map.tiles.set(`${x}:${y}:0`, {
        tile: { x, y, plane: 0 },
        height: 0,
        underlayId: "grass",
        collision: 0,
        water: false,
        bridge: false,
      });
    }
  }
}

function addPlayer(world: World, x = 1, y = 1): import("@old-town/shared").EntityId {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "player", {
    entityId,
    accountId: `account:${entityId}`,
    sessionId: `session:${entityId}`,
    interestRadius: 8,
  });
  world.setComponent(entityId, "inventory", createInventory(entityId, `inventory:${entityId}`, 28));
  world.setComponent(entityId, "combatant", {
    entityId,
    health: 10,
    maxHealth: 10,
    attackLevel: 1,
    strengthLevel: 1,
    defenceLevel: 1,
    targetId: undefined,
    attackCooldown: 0,
    combatLevel: 3,
    eatBlockedUntilTick: 0,
    autoRetaliate: true,
    nextAttackTick: 0,
    dead: false,
    spellCooldowns: {},
  });
  return entityId;
}

function setup() {
  const world = createWorld();
  const map = createRuntimeMap();
  addOpenTiles(map);
  map.deathRespawnPoints.push({
    tile: { x: 30, y: 32, plane: 0 },
    respawnType: "nearest",
    priority: 0,
  });
  const collision = new CollisionMap(map);
  const deltas = new DeltaAccumulator();
  const ctx = { world, collision, deltas, map };
  return { ctx, world, deltas };
}

describe("death system", () => {
  it("does not respawn a living player", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10);

    processPlayerRespawn(ctx, 100);

    const combatant = world.getComponent(player, "combatant");
    expect(combatant?.health).toBe(10);
    expect(combatant?.dead).toBe(false);
    expect(combatant?.respawnTick).toBeUndefined();
  });

  it("does not respawn a dead player before the timer expires", () => {
    const { ctx, world } = setup();
    const player = addPlayer(world, 10, 10);
    world.setComponent(player, "combatant", {
      ...getCombatant(world, player),
      health: 0,
      dead: true,
      respawnTick: 100,
    });

    processPlayerRespawn(ctx, 99);

    const combatant = world.getComponent(player, "combatant");
    expect(combatant?.health).toBe(0);
    expect(combatant?.dead).toBe(true);
    expect(combatant?.respawnTick).toBe(100);
  });

  it("respawns a dead player when the timer expires", () => {
    const { ctx, world, deltas } = setup();
    const player = addPlayer(world, 10, 10);
    world.setComponent(player, "combatant", {
      ...getCombatant(world, player),
      health: 0,
      dead: true,
      respawnTick: 100,
    });

    processPlayerRespawn(ctx, 100);

    const combatant = world.getComponent(player, "combatant");
    expect(combatant?.health).toBe(10);
    expect(combatant?.dead).toBe(false);
    expect(combatant?.respawnTick).toBeUndefined();

    const position = world.getComponent(player, "position");
    expect(position?.x).toBe(30);
    expect(position?.y).toBe(32);
    expect(position?.plane).toBe(0);

    const movement = world.getComponent(player, "movement");
    expect(movement?.path).toEqual([]);

    const delta = deltas.peek();
    expect(delta.entityUpdates?.[0]).toMatchObject({
      entityId: player,
      changes: {
        position: { x: 30, y: 32, plane: 0 },
        healthBar: { current: 10, max: 10 },
      },
    });
    expect(delta.respawnNotices?.[0]).toMatchObject({
      entityId: player,
      tile: { x: 30, y: 32, plane: 0 },
    });
    expect(delta.chat?.[0]?.text).toBe("You have respawned.");
  });

  it("respawns at a custom spawn tile", () => {
    const world = createWorld();
    const map = createRuntimeMap();
    addOpenTiles(map);
    const collision = new CollisionMap(map);
    const deltas = new DeltaAccumulator();
    const ctx = { world, collision, deltas, map };
    const player = addPlayer(world, 10, 10);
    world.setComponent(player, "combatant", {
      ...getCombatant(world, player),
      health: 0,
      dead: true,
      respawnTick: 100,
    });

    const customSpawn = { x: 5, y: 5, plane: 0 as 0 };
    processPlayerRespawn(ctx, 100, 60_000, customSpawn);

    const position = world.getComponent(player, "position");
    expect(position?.x).toBe(5);
    expect(position?.y).toBe(5);
  });

  it("respawns multiple dead players independently", () => {
    const { ctx, world } = setup();
    const player1 = addPlayer(world, 10, 10);
    const player2 = addPlayer(world, 20, 20);

    world.setComponent(player1, "combatant", {
      ...getCombatant(world, player1),
      health: 0,
      dead: true,
      respawnTick: 100,
    });
    world.setComponent(player2, "combatant", {
      ...getCombatant(world, player2),
      health: 0,
      dead: true,
      respawnTick: 200,
    });

    processPlayerRespawn(ctx, 100);

    expect(world.getComponent(player1, "combatant")?.dead).toBe(false);
    expect(world.getComponent(player2, "combatant")?.dead).toBe(true);

    processPlayerRespawn(ctx, 200);

    expect(world.getComponent(player2, "combatant")?.dead).toBe(false);
  });
});
