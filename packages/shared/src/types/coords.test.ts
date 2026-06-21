import { describe, expect, it } from "vitest";
import {
  CHUNK_SIZE,
  CHUNKS_PER_REGION,
  PLANES,
  REGION_SIZE,
  TILE_SIZE_WORLD_UNITS,
} from "../constants";
import {
  chunkId,
  chunkToRegion,
  isPlane,
  PACKED_TILE_AXIS_MAX,
  packTile,
  regionId,
  type TileCoord,
  tileKey,
  tileToChunk,
  tileToRegion,
  unpackTile,
} from "./coords";

describe("spatial constants (POC_SPEC §4)", () => {
  it("matches the spec values", () => {
    expect(TILE_SIZE_WORLD_UNITS).toBe(1);
    expect(CHUNK_SIZE).toBe(8);
    expect(REGION_SIZE).toBe(64);
    expect(PLANES).toBe(4);
    // A region is 8×8 chunks of 8×8 tiles.
    expect(CHUNKS_PER_REGION).toBe(8);
    expect(REGION_SIZE / CHUNK_SIZE).toBe(8);
  });
});

describe("tileToChunk (8×8 chunks)", () => {
  it("maps tiles into 8-tile chunks", () => {
    expect(tileToChunk({ x: 0, y: 0, plane: 0 })).toEqual({ cx: 0, cy: 0, plane: 0 });
    expect(tileToChunk({ x: 7, y: 7, plane: 0 })).toEqual({ cx: 0, cy: 0, plane: 0 });
    expect(tileToChunk({ x: 8, y: 8, plane: 0 })).toEqual({ cx: 1, cy: 1, plane: 0 });
    expect(tileToChunk({ x: 10, y: 20, plane: 2 })).toEqual({ cx: 1, cy: 2, plane: 2 });
  });

  it("floors negative coordinates toward -infinity", () => {
    expect(tileToChunk({ x: -1, y: -1, plane: 0 })).toEqual({ cx: -1, cy: -1, plane: 0 });
    expect(tileToChunk({ x: -8, y: -9, plane: 0 })).toEqual({ cx: -1, cy: -2, plane: 0 });
  });
});

describe("tileToRegion (64×64 regions)", () => {
  it("maps tiles into 64-tile regions", () => {
    expect(tileToRegion({ x: 0, y: 0, plane: 0 })).toEqual({ rx: 0, ry: 0, plane: 0 });
    expect(tileToRegion({ x: 63, y: 63, plane: 1 })).toEqual({ rx: 0, ry: 0, plane: 1 });
    expect(tileToRegion({ x: 64, y: 128, plane: 1 })).toEqual({ rx: 1, ry: 2, plane: 1 });
  });

  it("floors negative coordinates", () => {
    expect(tileToRegion({ x: -1, y: -65, plane: 3 })).toEqual({ rx: -1, ry: -2, plane: 3 });
  });
});

describe("chunkToRegion", () => {
  it("maps 8 chunks per region axis", () => {
    expect(chunkToRegion({ cx: 0, cy: 0, plane: 0 })).toEqual({ rx: 0, ry: 0, plane: 0 });
    expect(chunkToRegion({ cx: 7, cy: 7, plane: 0 })).toEqual({ rx: 0, ry: 0, plane: 0 });
    expect(chunkToRegion({ cx: 8, cy: 16, plane: 2 })).toEqual({ rx: 1, ry: 2, plane: 2 });
  });

  it("floors negative chunk coordinates toward -infinity", () => {
    expect(chunkToRegion({ cx: -1, cy: -1, plane: 0 })).toEqual({ rx: -1, ry: -1, plane: 0 });
    expect(chunkToRegion({ cx: -9, cy: -8, plane: 1 })).toEqual({ rx: -2, ry: -1, plane: 1 });
  });

  it("is consistent with tileToRegion via tileToChunk", () => {
    const tile: TileCoord = { x: 130, y: 200, plane: 1 };
    expect(chunkToRegion(tileToChunk(tile))).toEqual(tileToRegion(tile));
  });

  it("is consistent with tileToRegion for negative tiles", () => {
    const tile: TileCoord = { x: -130, y: -200, plane: 2 };
    expect(chunkToRegion(tileToChunk(tile))).toEqual(tileToRegion(tile));
  });
});

describe("stable string keys", () => {
  it("formats region/chunk/tile keys with plane", () => {
    expect(regionId({ rx: 1, ry: 2, plane: 3 })).toBe("1:2:3");
    expect(chunkId({ cx: 4, cy: 5, plane: 0 })).toBe("4:5:0");
    expect(tileKey({ x: 10, y: 20, plane: 2 })).toBe("10:20:2");
  });

  it("encodes negative coordinates in keys", () => {
    expect(tileKey({ x: -3, y: -4, plane: 1 })).toBe("-3:-4:1");
  });
});

describe("isPlane", () => {
  it("accepts 0..3 and rejects others", () => {
    for (const plane of [0, 1, 2, 3]) {
      expect(isPlane(plane)).toBe(true);
    }
    for (const bad of [-1, 4, 1.5, Number.NaN]) {
      expect(isPlane(bad)).toBe(false);
    }
  });
});

describe("packed tile keys (optional fast path)", () => {
  it("round-trips coordinates across all planes", () => {
    const samples: TileCoord[] = [
      { x: 0, y: 0, plane: 0 },
      { x: 1, y: 2, plane: 1 },
      { x: 100, y: 250, plane: 2 },
      { x: PACKED_TILE_AXIS_MAX, y: PACKED_TILE_AXIS_MAX, plane: 3 },
    ];
    for (const tile of samples) {
      expect(unpackTile(packTile(tile))).toEqual(tile);
    }
  });

  it("produces distinct packed values for tiles differing only by plane", () => {
    const packedByPlane = [0, 1, 2, 3].map((plane) =>
      packTile({ x: 100, y: 200, plane: plane as 0 | 1 | 2 | 3 }),
    );
    expect(new Set(packedByPlane).size).toBe(4);
  });

  it("produces distinct packed values for tiles differing only by x or y", () => {
    const a = packTile({ x: 1, y: 2, plane: 0 });
    const b = packTile({ x: 2, y: 1, plane: 0 });
    expect(a).not.toBe(b);
  });

  it("rejects coordinates outside the packable range", () => {
    expect(() => packTile({ x: -1, y: 0, plane: 0 })).toThrow(RangeError);
    expect(() => packTile({ x: PACKED_TILE_AXIS_MAX + 1, y: 0, plane: 0 })).toThrow(RangeError);
    expect(() => packTile({ x: 0, y: -1, plane: 0 })).toThrow(RangeError);
    expect(() => packTile({ x: 0, y: PACKED_TILE_AXIS_MAX + 1, plane: 0 })).toThrow(RangeError);
  });
});
