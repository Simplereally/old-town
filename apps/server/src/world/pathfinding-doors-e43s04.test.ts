import { CollisionFlag } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { CollisionMap } from "../world/collision";
import { findPath } from "../world/pathfinding";
import { createRuntimeMap, type RuntimeMap } from "../world/runtime-map";

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

describe("E43-S04 — Pathfinding through interactable doors", () => {
  it("routes through a closed door tile when isClosedDoor is provided", () => {
    const map = makeMap(8);
    const collision = new CollisionMap(map);

    // Solid wall column at x=3 with a single door at y=0.
    for (let y = 0; y < 8; y++) {
      collision.addDynamic({ x: 3, y, plane: 0 }, CollisionFlag.BLOCK_FULL);
    }

    // Without the door predicate, no path exists (wall column is solid).
    const withoutDoor = findPath(collision, { x: 0, y: 0, plane: 0 }, { x: 6, y: 0, plane: 0 });
    expect(withoutDoor.reached).toBe(false);

    // With the door predicate, the path routes through the door tile.
    const withDoor = findPath(
      collision,
      { x: 0, y: 0, plane: 0 },
      { x: 6, y: 0, plane: 0 },
      {
        isClosedDoor: (t) => t.x === 3 && t.y === 0,
      },
    );
    expect(withDoor.reached).toBe(true);
    expect(withDoor.path.some((t) => t.x === 3 && t.y === 0)).toBe(true);
    expect(withDoor.doorTiles).toEqual([{ x: 3, y: 0, plane: 0 }]);
  });

  it("emits doorTiles in path order for the caller to queue open-interactions", () => {
    const map = makeMap(8);
    const collision = new CollisionMap(map);

    // Two wall columns at x=3 and x=5, each with a single door at y=0.
    for (let y = 0; y < 8; y++) {
      collision.addDynamic({ x: 3, y, plane: 0 }, CollisionFlag.BLOCK_FULL);
      collision.addDynamic({ x: 5, y, plane: 0 }, CollisionFlag.BLOCK_FULL);
    }

    const result = findPath(
      collision,
      { x: 0, y: 0, plane: 0 },
      { x: 7, y: 0, plane: 0 },
      {
        isClosedDoor: (t) => (t.x === 3 || t.x === 5) && t.y === 0,
      },
    );

    expect(result.reached).toBe(true);
    expect(result.doorTiles).toEqual([
      { x: 3, y: 0, plane: 0 },
      { x: 5, y: 0, plane: 0 },
    ]);
  });

  it("path is recomputed when the door is locked (predicate returns false)", () => {
    const map = makeMap(8);
    const collision = new CollisionMap(map);

    // Wall column at x=3, solid.
    for (let y = 0; y < 8; y++) {
      collision.addDynamic({ x: 3, y, plane: 0 }, CollisionFlag.BLOCK_FULL);
    }

    // First, path through the door.
    const open = findPath(
      collision,
      { x: 0, y: 0, plane: 0 },
      { x: 6, y: 0, plane: 0 },
      {
        isClosedDoor: (t) => t.x === 3 && t.y === 0,
      },
    );
    expect(open.reached).toBe(true);
    expect(open.doorTiles).toHaveLength(1);

    // Now the door is "locked" — predicate returns false, no path exists.
    const locked = findPath(
      collision,
      { x: 0, y: 0, plane: 0 },
      { x: 6, y: 0, plane: 0 },
      {
        isClosedDoor: () => false,
      },
    );
    expect(locked.reached).toBe(false);
    expect(locked.doorTiles).toEqual([]);
  });

  it("path avoids locked doors and finds an alternative route when available", () => {
    const map = makeMap(10);
    const collision = new CollisionMap(map);

    // Wall column at x=3 from y=0 to y=6, leaving a gap at y=7 and y=8.
    for (let y = 0; y <= 6; y++) {
      collision.addDynamic({ x: 3, y, plane: 0 }, CollisionFlag.BLOCK_FULL);
    }

    const result = findPath(
      collision,
      { x: 0, y: 0, plane: 0 },
      { x: 6, y: 0, plane: 0 },
      {
        isClosedDoor: () => false,
      },
    );

    expect(result.reached).toBe(true);
    expect(result.path.every((t) => !(t.x === 3 && t.y <= 6))).toBe(true);
    expect(result.doorTiles).toEqual([]);
  });

  it("door cost penalty makes the pathfinder prefer non-door routes when equal length", () => {
    const map = makeMap(8);
    const collision = new CollisionMap(map);

    // Door at (3,0) — direct route. No walls around it, so going around is possible.
    collision.addDynamic({ x: 3, y: 0, plane: 0 }, CollisionFlag.BLOCK_FULL);

    // Without door predicate, the path goes around (diagonal).
    const around = findPath(collision, { x: 0, y: 0, plane: 0 }, { x: 6, y: 0, plane: 0 });

    // With door predicate, the path can go through but the penalty makes it prefer the diagonal.
    const through = findPath(
      collision,
      { x: 0, y: 0, plane: 0 },
      { x: 6, y: 0, plane: 0 },
      {
        isClosedDoor: (t) => t.x === 3 && t.y === 0,
      },
    );

    expect(around.reached).toBe(true);
    expect(through.reached).toBe(true);
    expect(around.path.some((t) => t.x === 3 && t.y === 0)).toBe(false);
    if (through.path.some((t) => t.x === 3 && t.y === 0)) {
      expect(through.doorTiles).toEqual([{ x: 3, y: 0, plane: 0 }]);
    }
  });
});
