import type { ObjectDef } from "@old-town/shared";
import { CollisionFlag } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { applyObjectCollision, CollisionMap, objectCollisionFlags } from "../world/collision";
import { findPath } from "../world/pathfinding";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";
import { createWorld, type World } from "../ecs/world";

function makeMap(size = 8): RuntimeMap {
  const map = createRuntimeMap();
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      map.tiles.set(`${x}:${y}:0`, {
        tile: { x, y, plane: 0 },
        height: 0,
        collision: 0,
        underlayId: "grass",
        water: false,
        bridge: false,
      });
    }
  }
  return map;
}

function addObject(
  world: World,
  objectId: string,
  x: number,
  y: number,
): number {
  const entityId = world.createEntity();
  world.setComponent(entityId, "position", { entityId, x, y, plane: 0 });
  world.setComponent(entityId, "object", { entityId, objectId, facing: 0, variant: 0 });
  return entityId;
}

const WALL_DEF: ObjectDef = {
  id: "building_wall_straight",
  name: "Town Wall",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: true,
  options: [],
  defaultRotation: 0,
};

const LARGE_2X2_DEF: ObjectDef = {
  id: "large_building",
  name: "Large Building",
  width: 2,
  length: 2,
  blocksMovement: true,
  blocksLineOfSight: false,
  options: [],
  defaultRotation: 0,
};

const DOOR_DEF: ObjectDef = {
  id: "building_door_wood",
  name: "Wooden Door",
  width: 1,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: true,
  isDoor: true,
  options: [{ label: "Open", actionId: "open", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const GATE_DEF: ObjectDef = {
  id: "building_gate_town",
  name: "Town Gate",
  width: 2,
  length: 1,
  blocksMovement: true,
  blocksLineOfSight: true,
  isDoor: true,
  isGate: true,
  options: [{ label: "Open", actionId: "open", priority: 10, requiredDistance: 1 }],
  defaultRotation: 0,
};

const L_FOOTPRINT_DEF: ObjectDef = {
  id: "l_shaped_wall",
  name: "L-Shaped Wall",
  width: 2,
  length: 2,
  blocksMovement: true,
  blocksLineOfSight: false,
  footprint: [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
  ],
  options: [],
  defaultRotation: 0,
};

const CUSTOM_COLLISION_DEF: ObjectDef = {
  id: "custom_collision_obj",
  name: "Custom Collision",
  width: 1,
  length: 1,
  blocksMovement: false,
  blocksLineOfSight: false,
  defaultCollision: CollisionFlag.BLOCK_EAST,
  options: [],
  defaultRotation: 0,
};

describe("E43-S02 — Collision mask generation from objects", () => {
  it("a wall object blocks movement on its footprint tiles", () => {
    const map = makeMap();
    const collision = new CollisionMap(map);
    const world = createWorld();
    addObject(world, "building_wall_straight", 3, 3);

    const registries = {
      object: new Map([["building_wall_straight", WALL_DEF]]),
    } as unknown as Parameters<typeof applyObjectCollision>[1];

    expect(collision.canOccupy({ x: 3, y: 3, plane: 0 })).toBe(true);
    applyObjectCollision(world, registries, collision);
    expect(collision.canOccupy({ x: 3, y: 3, plane: 0 })).toBe(false);
  });

  it("a 2×2 object blocks all 4 tiles", () => {
    const map = makeMap();
    const collision = new CollisionMap(map);
    const world = createWorld();
    addObject(world, "large_building", 2, 2);

    const registries = {
      object: new Map([["large_building", LARGE_2X2_DEF]]),
    } as unknown as Parameters<typeof applyObjectCollision>[1];

    applyObjectCollision(world, registries, collision);

    expect(collision.canOccupy({ x: 2, y: 2, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 3, y: 2, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 2, y: 3, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 3, y: 3, plane: 0 })).toBe(false);
    // Tile outside the footprint is still open.
    expect(collision.canOccupy({ x: 4, y: 4, plane: 0 })).toBe(true);
  });

  it("a door object adds BLOCK_FULL when closed (initial state)", () => {
    const map = makeMap();
    const collision = new CollisionMap(map);
    const world = createWorld();
    addObject(world, "building_door_wood", 4, 4);

    const registries = {
      object: new Map([["building_door_wood", DOOR_DEF]]),
    } as unknown as Parameters<typeof applyObjectCollision>[1];

    applyObjectCollision(world, registries, collision);
    // Door starts closed — should block.
    expect(collision.canOccupy({ x: 4, y: 4, plane: 0 })).toBe(false);
  });

  it("a gate (2×1) blocks both tiles when closed", () => {
    const map = makeMap();
    const collision = new CollisionMap(map);
    const world = createWorld();
    addObject(world, "building_gate_town", 3, 3);

    const registries = {
      object: new Map([["building_gate_town", GATE_DEF]]),
    } as unknown as Parameters<typeof applyObjectCollision>[1];

    applyObjectCollision(world, registries, collision);
    expect(collision.canOccupy({ x: 3, y: 3, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 4, y: 3, plane: 0 })).toBe(false);
  });

  it("explicit footprint offsets block only the specified tiles", () => {
    const map = makeMap();
    const collision = new CollisionMap(map);
    const world = createWorld();
    addObject(world, "l_shaped_wall", 2, 2);

    const registries = {
      object: new Map([["l_shaped_wall", L_FOOTPRINT_DEF]]),
    } as unknown as Parameters<typeof applyObjectCollision>[1];

    applyObjectCollision(world, registries, collision);

    // L-shape: (2,2), (3,2), (2,3) blocked; (3,3) open.
    expect(collision.canOccupy({ x: 2, y: 2, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 3, y: 2, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 2, y: 3, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 3, y: 3, plane: 0 })).toBe(true);
  });

  it("defaultCollision override takes precedence over blocksMovement/blocksLineOfSight", () => {
    const flags = objectCollisionFlags(CUSTOM_COLLISION_DEF);
    expect(flags).toBe(CollisionFlag.BLOCK_EAST);
    expect(flags & CollisionFlag.BLOCK_FULL).toBe(0);
  });

  it("a path exists between open tiles after collision generation", () => {
    const map = makeMap(8);
    const collision = new CollisionMap(map);
    const world = createWorld();

    // Place a wall at (3,0)-(3,5) leaving a gap at (3,6) and (3,7).
    for (let y = 0; y < 6; y++) {
      addObject(world, "building_wall_straight", 3, y);
    }

    const registries = {
      object: new Map([["building_wall_straight", WALL_DEF]]),
    } as unknown as Parameters<typeof applyObjectCollision>[1];

    applyObjectCollision(world, registries, collision);

    // Path from (0,0) to (7,0) should go around the wall through the gap.
    const result = findPath(collision, { x: 0, y: 0, plane: 0 }, { x: 7, y: 0, plane: 0 });
    expect(result.reached).toBe(true);
  });
});
