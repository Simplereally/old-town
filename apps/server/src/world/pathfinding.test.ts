import { type TileCoord, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { CollisionFlag, CollisionMap } from "./collision";
import { findPath } from "./pathfinding";
import { type RuntimeMap, createRuntimeMap } from "./runtime-map";

function tile(x: number, y: number): TileCoord {
  return { x, y, plane: 0 };
}

function testMap(size = 12): RuntimeMap {
  const map = createRuntimeMap();
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
  return map;
}

function coords(path: readonly TileCoord[]): readonly string[] {
  return path.map((step) => `${step.x},${step.y}`);
}

describe("findPath", () => {
  it("returns a direct 8-way tile path", () => {
    const result = findPath(new CollisionMap(testMap()), tile(0, 0), tile(3, 3));

    expect(result.reached).toBe(true);
    expect(coords(result.path)).toEqual(["1,1", "2,2", "3,3"]);
  });

  it("falls back to the nearest reachable tile for blocked goals", () => {
    const collision = new CollisionMap(testMap());
    collision.addDynamic(tile(3, 3), CollisionFlag.BLOCK_FULL);

    const result = findPath(collision, tile(0, 0), tile(3, 3));

    expect(result.reached).toBe(false);
    expect(result.destination).not.toEqual(tile(3, 3));
    expect(result.path.at(-1)).toEqual(result.destination);
    expect(collision.canOccupy(result.destination)).toBe(true);
  });

  it("routes around closed door edges and straightens when opened", () => {
    const collision = new CollisionMap(testMap());
    collision.addDynamic(tile(1, 1), CollisionFlag.BLOCK_EAST);
    collision.addDynamic(tile(2, 1), CollisionFlag.BLOCK_WEST);

    const closed = findPath(collision, tile(0, 1), tile(3, 1));
    expect(coords(closed.path)).not.toEqual(["1,1", "2,1", "3,1"]);

    collision.clearDynamic(tile(1, 1));
    collision.clearDynamic(tile(2, 1));
    const opened = findPath(collision, tile(0, 1), tile(3, 1));
    expect(coords(opened.path)).toEqual(["1,1", "2,1", "3,1"]);
  });

  it("does not diagonal-clip around blocked corners", () => {
    const collision = new CollisionMap(testMap());
    collision.addDynamic(tile(1, 0), CollisionFlag.BLOCK_FULL);

    const result = findPath(collision, tile(0, 0), tile(2, 2));

    expect(result.reached).toBe(true);
    expect(coords(result.path)[0]).toBe("0,1");
  });

  it("respects large footprints", () => {
    const collision = new CollisionMap(testMap());
    collision.addDynamic(tile(2, 1), CollisionFlag.BLOCK_FULL);

    const result = findPath(collision, tile(0, 1), tile(3, 1), {
      footprint: { width: 2, length: 2 },
    });

    expect(result.path.some((step) => step.x === 1 && step.y === 1)).toBe(false);
  });

  it("caps returned path length", () => {
    const result = findPath(new CollisionMap(testMap(20)), tile(0, 0), tile(10, 0), {
      maxPathLength: 4,
    });

    expect(result.reached).toBe(false);
    expect(result.path).toHaveLength(4);
    expect(coords(result.path)).toEqual(["1,0", "2,0", "3,0", "4,0"]);
  });
});
