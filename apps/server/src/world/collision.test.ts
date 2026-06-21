import { type TileCoord, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { CollisionFlag, CollisionMap } from "./collision";
import { createRuntimeMap, type RuntimeMap } from "./runtime-map";

function tile(x: number, y: number): TileCoord {
  return { x, y, plane: 0 };
}

function testMap(size = 6): RuntimeMap {
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

describe("CollisionMap", () => {
  it("blocks cardinal steps with directional edge flags and can revert dynamics", () => {
    const collision = new CollisionMap(testMap());

    collision.addDynamic(tile(1, 1), CollisionFlag.BLOCK_EAST);

    expect(collision.canStep(tile(1, 1), tile(2, 1))).toBe(false);
    expect(collision.canStep(tile(1, 1), tile(1, 2))).toBe(true);

    collision.clearDynamic(tile(1, 1), CollisionFlag.BLOCK_EAST);
    expect(collision.canStep(tile(1, 1), tile(2, 1))).toBe(true);
  });

  it("prevents diagonal clipping around blocked corners", () => {
    const collision = new CollisionMap(testMap());

    collision.addDynamic(tile(2, 1), CollisionFlag.BLOCK_FULL);

    expect(collision.canStep(tile(1, 1), tile(2, 2))).toBe(false);
  });

  it("rejects occupying full-blocked tiles", () => {
    const collision = new CollisionMap(testMap());

    collision.addDynamic(tile(3, 3), CollisionFlag.BLOCK_FULL);

    expect(collision.canOccupy(tile(3, 3))).toBe(false);
    expect(collision.canOccupy(tile(3, 4))).toBe(true);
  });

  it("separates movement from line-of-sight edge blocks", () => {
    const collision = new CollisionMap(testMap());

    collision.addDynamic(tile(1, 1), CollisionFlag.BLOCK_LOS_EAST);

    expect(collision.canStep(tile(1, 1), tile(2, 1))).toBe(true);
    expect(collision.hasLineOfSight(tile(1, 1), tile(2, 1))).toBe(false);
  });

  it("uses projectile-specific blocking only for projectile traces", () => {
    const collision = new CollisionMap(testMap());

    collision.addDynamic(tile(2, 1), CollisionFlag.PROJECTILE_BLOCK);

    expect(collision.hasLineOfSight(tile(1, 1), tile(3, 1))).toBe(true);
    expect(collision.hasLineOfSight(tile(1, 1), tile(3, 1), { projectile: true })).toBe(false);
  });

  it("checks every tile and leading edge of large footprints", () => {
    const collision = new CollisionMap(testMap());
    const footprint = { width: 2, length: 2 };

    collision.addDynamic(tile(2, 1), CollisionFlag.BLOCK_FULL);
    expect(collision.canOccupy(tile(1, 1), footprint)).toBe(false);

    collision.clearDynamic(tile(2, 1));
    collision.addDynamic(tile(2, 1), CollisionFlag.BLOCK_EAST);

    expect(collision.canStep(tile(1, 1), tile(2, 1), footprint)).toBe(false);
    collision.clearDynamic(tile(2, 1));
    expect(collision.canStep(tile(1, 1), tile(2, 1), footprint)).toBe(true);
  });
});
