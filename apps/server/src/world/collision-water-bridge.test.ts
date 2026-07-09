import { type TileCoord, tileKey } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { CollisionMap } from "./collision";
import { createRuntimeMap, type RuntimeMap, type RuntimeTile } from "./runtime-map";

function tile(x: number, y: number): TileCoord {
  return { x, y, plane: 0 };
}

function makeTile(
  x: number,
  y: number,
  overrides: Partial<Pick<RuntimeTile, "water" | "bridge" | "height" | "collision">> = {},
): RuntimeTile {
  return {
    tile: { x, y, plane: 0 },
    height: overrides.height ?? 0,
    underlayId: "grass",
    collision: overrides.collision ?? 0,
    water: overrides.water ?? false,
    bridge: overrides.bridge ?? false,
  };
}

function mapFromTiles(tiles: RuntimeTile[]): RuntimeMap {
  const map = createRuntimeMap();
  for (const t of tiles) {
    map.tiles.set(tileKey(t.tile), t);
  }
  return map;
}

describe("E42-S04 — Water, bridge, and elevation collision", () => {
  it("water tiles block movement", () => {
    const map = mapFromTiles([makeTile(0, 0), makeTile(1, 0, { water: true })]);
    const collision = new CollisionMap(map);

    expect(collision.canStep(tile(0, 0), tile(1, 0))).toBe(false);
  });

  it("bridge tiles over water allow movement", () => {
    const map = mapFromTiles([makeTile(0, 0), makeTile(1, 0, { water: true, bridge: true })]);
    const collision = new CollisionMap(map);

    expect(collision.canStep(tile(0, 0), tile(1, 0))).toBe(true);
  });

  it("height difference blocks movement between non-bridge tiles", () => {
    const map = mapFromTiles([makeTile(0, 0, { height: 0 }), makeTile(1, 0, { height: 1 })]);
    const collision = new CollisionMap(map);

    expect(collision.canStep(tile(0, 0), tile(1, 0))).toBe(false);
  });

  it("same height tiles allow movement", () => {
    const map = mapFromTiles([makeTile(0, 0, { height: 2 }), makeTile(1, 0, { height: 2 })]);
    const collision = new CollisionMap(map);

    expect(collision.canStep(tile(0, 0), tile(1, 0))).toBe(true);
  });

  it("bridge tiles allow crossing height differences over water", () => {
    const map = mapFromTiles([
      makeTile(0, 0, { water: true, bridge: true, height: 0 }),
      makeTile(1, 0, { water: true, bridge: true, height: 1 }),
    ]);
    const collision = new CollisionMap(map);

    expect(collision.canStep(tile(0, 0), tile(1, 0))).toBe(true);
  });

  it("water tile cannot be occupied", () => {
    const map = mapFromTiles([makeTile(0, 0, { water: true })]);
    const collision = new CollisionMap(map);

    expect(collision.canOccupy(tile(0, 0))).toBe(false);
  });

  it("bridge tile over water can be occupied", () => {
    const map = mapFromTiles([makeTile(0, 0, { water: true, bridge: true })]);
    const collision = new CollisionMap(map);

    expect(collision.canOccupy(tile(0, 0))).toBe(true);
  });
});
