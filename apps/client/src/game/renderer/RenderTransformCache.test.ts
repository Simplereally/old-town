import { describe, expect, it } from "vitest";
import type { RenderEntitySnapshot, RenderSnapshot } from "../net/SnapshotBuffer";
import {
  MovementPresentationKind,
  RenderTransformCache,
  type RenderTransformCacheOptions,
  type RenderTransformSample,
} from "./RenderTransformCache";

const defaultOptions: RenderTransformCacheOptions = {
  initialCapacity: 4,
  tileSize: 1,
};

function makeEntity(
  id: number,
  tile: { x: number; y: number; plane: number },
  extra?: Partial<RenderEntitySnapshot>,
): RenderEntitySnapshot {
  return {
    entityId: id,
    kind: "player",
    tile,
    previousTile: null,
    moveSpeed: "idle",
    facing: 0,
    appearance: {},
    healthBar: null,
    defId: "player:guard",
    ...extra,
  } as RenderEntitySnapshot;
}

function makeSnapshot(tick: number, entities: RenderEntitySnapshot[]): RenderSnapshot {
  return {
    tick,
    sequence: tick,
    serverTimeMs: tick * 600,
    entities,
    events: [],
    regionLoads: [],
    regionUnloads: [],
  };
}

function makeSample(
  mode: RenderTransformSample["mode"],
  alpha: number,
  newerSnapshot: RenderSnapshot,
  olderSnapshot?: RenderSnapshot,
  snapReason?: string,
): RenderTransformSample {
  return {
    alpha,
    mode,
    newerSnapshot,
    olderSnapshot,
    snapReason,
  } as RenderTransformSample;
}

describe("RenderTransformCache", () => {
  it("adds an entity on first sample and exposes plain numbers", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const entity = makeEntity(1, { x: 10, y: 20, plane: 0 });
    const sample = makeSample("interpolate", 0, makeSnapshot(1, [entity]));
    cache.applySample(sample);

    expect(cache.count).toBe(1);
    const p = cache.getPresentation(1);
    expect(p).toBeDefined();
    expect(p?.entityId).toBe(1);
    expect(p?.currTileX).toBe(10);
    expect(p?.currTileY).toBe(20);
    expect(p?.currTilePlane).toBe(0);
    expect(p?.renderX).toBe(10.5);
    expect(p?.renderZ).toBe(20.5);
    expect(p?.renderY).toBe(0);
    expect(p?.movementKind).toBe(MovementPresentationKind.Teleport);
    expect(p?.renderHandleId).toBe(-1);
    expect(p?.kind).toBe("player");
    expect(p?.defId).toBe("player:guard");
  });

  it("walk interpolation moves tile centre to tile centre", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const older = makeSnapshot(1, [
      makeEntity(1, { x: 10, y: 20, plane: 0 }, { moveSpeed: "idle" }),
    ]);
    const newer = makeSnapshot(2, [
      makeEntity(
        1,
        { x: 11, y: 20, plane: 0 },
        {
          moveSpeed: "walk",
          previousTile: { x: 10, y: 20, plane: 0 },
          facing: 90,
        },
      ),
    ]);

    cache.applySample(makeSample("interpolate", 0, older));
    cache.applySample(makeSample("interpolate", 0.5, newer, older));

    const p = cache.getPresentation(1);
    expect(p).toBeDefined();
    expect(p?.movementKind).toBe(MovementPresentationKind.Walk);
    expect(p?.renderX).toBeCloseTo(10.5 + 0.5 * 1, 5);
    expect(p?.renderZ).toBe(20.5);
    expect(p?.heading).toBe(90);
  });

  it("run interpolation when snapshot proves two-tile move", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const older = makeSnapshot(1, [
      makeEntity(1, { x: 10, y: 20, plane: 0 }, { moveSpeed: "idle" }),
    ]);
    const newer = makeSnapshot(2, [
      makeEntity(
        1,
        { x: 12, y: 20, plane: 0 },
        {
          moveSpeed: "run",
          previousTile: { x: 10, y: 20, plane: 0 },
          facing: 90,
        },
      ),
    ]);

    cache.applySample(makeSample("interpolate", 0, older));
    cache.applySample(makeSample("interpolate", 0.5, newer, older));

    const p = cache.getPresentation(1);
    expect(p).toBeDefined();
    expect(p?.movementKind).toBe(MovementPresentationKind.Run);
    // Visual distance is 2 tiles over the same tick, so midpoint is 1 tile from start
    expect(p?.renderX).toBeCloseTo(10.5 + 0.5 * 2, 5);
  });

  it("run with less than two-tile distance falls back to walk", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const older = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    const newer = makeSnapshot(2, [
      makeEntity(
        1,
        { x: 11, y: 20, plane: 0 },
        {
          moveSpeed: "run",
          previousTile: { x: 10, y: 20, plane: 0 },
        },
      ),
    ]);

    cache.applySample(makeSample("interpolate", 0.5, newer, older));

    const p = cache.getPresentation(1);
    expect(p?.movementKind).toBe(MovementPresentationKind.Walk);
    expect(p?.renderX).toBeCloseTo(10.5 + 0.5 * 1, 5);
  });

  it("teleport snaps to tile without interpolation", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const older = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    const newer = makeSnapshot(2, [
      makeEntity(
        1,
        { x: 50, y: 50, plane: 0 },
        {
          moveSpeed: "teleport",
          previousTile: { x: 10, y: 20, plane: 0 },
        },
      ),
    ]);

    cache.applySample(makeSample("interpolate", 0.5, newer, older));

    const p = cache.getPresentation(1);
    expect(p?.movementKind).toBe(MovementPresentationKind.Teleport);
    expect(p?.renderX).toBe(50.5);
    expect(p?.renderZ).toBe(50.5);
  });

  it("teleport on previousTile null even in interpolate mode", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const older = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    const newer = makeSnapshot(2, [
      makeEntity(
        1,
        { x: 11, y: 20, plane: 0 },
        {
          moveSpeed: "walk",
          previousTile: null,
        },
      ),
    ]);

    cache.applySample(makeSample("interpolate", 0.5, newer, older));

    const p = cache.getPresentation(1);
    expect(p?.movementKind).toBe(MovementPresentationKind.Teleport);
    expect(p?.renderX).toBe(11.5);
  });

  it("snap mode renders at current tile", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const older = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    const newer = makeSnapshot(2, [
      makeEntity(
        1,
        { x: 15, y: 25, plane: 0 },
        { moveSpeed: "walk", previousTile: { x: 10, y: 20, plane: 0 } },
      ),
    ]);

    cache.applySample(makeSample("snap", 0, newer, older, "Missing ticks"));

    const p = cache.getPresentation(1);
    expect(p?.renderX).toBe(15.5);
    expect(p?.renderZ).toBe(25.5);
    expect(p?.movementKind).toBe(MovementPresentationKind.Walk);
  });

  it("hold_latest renders at current tile without movement", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const older = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    const newer = makeSnapshot(2, [
      makeEntity(1, { x: 10, y: 20, plane: 0 }, { previousTile: { x: 10, y: 20, plane: 0 } }),
    ]);

    cache.applySample(makeSample("hold_latest", 0, newer, older));

    const p = cache.getPresentation(1);
    expect(p?.renderX).toBe(10.5);
    expect(p?.renderZ).toBe(20.5);
    expect(p?.movementKind).toBe(MovementPresentationKind.Idle);
  });

  it("freeze mode renders at current tile", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const snapshot = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);

    cache.applySample(makeSample("freeze", 0, snapshot));

    const p = cache.getPresentation(1);
    expect(p?.renderX).toBe(10.5);
    expect(p?.renderZ).toBe(20.5);
  });

  it("empty mode removes all entities", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const snapshot = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    cache.applySample(makeSample("interpolate", 0, snapshot));
    expect(cache.count).toBe(1);

    cache.applySample(makeSample("empty", 0, makeSnapshot(2, [])));
    expect(cache.count).toBe(0);
    expect(cache.getPresentation(1)).toBeUndefined();
  });

  it("removes entities absent from the newest snapshot", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const s1 = makeSnapshot(1, [
      makeEntity(1, { x: 10, y: 20, plane: 0 }),
      makeEntity(2, { x: 20, y: 30, plane: 0 }),
    ]);
    cache.applySample(makeSample("interpolate", 0, s1));
    expect(cache.count).toBe(2);

    const s2 = makeSnapshot(2, [
      makeEntity(1, { x: 11, y: 20, plane: 0 }, { previousTile: { x: 10, y: 20, plane: 0 } }),
    ]);
    cache.applySample(makeSample("interpolate", 0, s2, s1));
    expect(cache.count).toBe(1);
    expect(cache.getPresentation(1)).toBeDefined();
    expect(cache.getPresentation(2)).toBeUndefined();
  });

  it("forEachPresentation iterates all entities without allocating arrays", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const snapshot = makeSnapshot(1, [
      makeEntity(1, { x: 10, y: 20, plane: 0 }),
      makeEntity(2, { x: 20, y: 30, plane: 0 }),
    ]);
    cache.applySample(makeSample("interpolate", 0, snapshot));

    const seen: number[] = [];
    let firstRef: unknown;
    cache.forEachPresentation((p) => {
      seen.push(p.entityId);
      if (firstRef === undefined) {
        firstRef = p;
      }
    });
    expect(seen).toEqual([1, 2]);
    // The callback receives the same object reference (scratch) each time
    expect(firstRef).toBeDefined();
  });

  it("getPresentation returns undefined for missing entity", () => {
    const cache = new RenderTransformCache(defaultOptions);
    expect(cache.getPresentation(99)).toBeUndefined();
  });

  it("typed-array capacity growth preserves existing entities", () => {
    const cache = new RenderTransformCache({ initialCapacity: 2, tileSize: 1 });
    const s1 = makeSnapshot(1, [
      makeEntity(1, { x: 10, y: 20, plane: 0 }),
      makeEntity(2, { x: 20, y: 30, plane: 0 }),
    ]);
    cache.applySample(makeSample("interpolate", 0, s1));
    expect(cache.count).toBe(2);

    const s2 = makeSnapshot(2, [
      makeEntity(1, { x: 11, y: 20, plane: 0 }, { previousTile: { x: 10, y: 20, plane: 0 } }),
      makeEntity(2, { x: 21, y: 30, plane: 0 }, { previousTile: { x: 20, y: 30, plane: 0 } }),
      makeEntity(3, { x: 30, y: 40, plane: 0 }),
      makeEntity(4, { x: 40, y: 50, plane: 0 }),
    ]);
    cache.applySample(makeSample("interpolate", 0, s2, s1));
    expect(cache.count).toBe(4);

    const p1 = cache.getPresentation(1);
    const p2 = cache.getPresentation(2);
    const p3 = cache.getPresentation(3);
    const p4 = cache.getPresentation(4);

    expect(p1).toBeDefined();
    expect(p2).toBeDefined();
    expect(p3).toBeDefined();
    expect(p4).toBeDefined();
    expect(p1?.currTileX).toBe(11);
    expect(p2?.currTileX).toBe(21);
    expect(p3?.currTileX).toBe(30);
    expect(p4?.currTileX).toBe(40);
  });

  it("does not expose stale removed entities after swap removal", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const s1 = makeSnapshot(1, [
      makeEntity(1, { x: 10, y: 20, plane: 0 }),
      makeEntity(2, { x: 20, y: 30, plane: 0 }),
      makeEntity(3, { x: 30, y: 40, plane: 0 }),
    ]);
    cache.applySample(makeSample("interpolate", 0, s1));

    const s2 = makeSnapshot(2, [
      makeEntity(1, { x: 11, y: 20, plane: 0 }, { previousTile: { x: 10, y: 20, plane: 0 } }),
      makeEntity(3, { x: 31, y: 40, plane: 0 }, { previousTile: { x: 30, y: 40, plane: 0 } }),
    ]);
    cache.applySample(makeSample("interpolate", 0, s2, s1));

    // Entity 2 was removed; it should not be accessible
    expect(cache.getPresentation(2)).toBeUndefined();
    expect(cache.count).toBe(2);

    // Ensure the swapped-in entity 3 is at the correct index
    const p3 = cache.getPresentation(3);
    expect(p3).toBeDefined();
    expect(p3?.currTileX).toBe(31);
  });

  it("newer entity without previousTile and no older entity snaps to tile", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const older = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    const newer = makeSnapshot(2, [makeEntity(2, { x: 5, y: 5, plane: 0 }, { moveSpeed: "walk" })]);

    cache.applySample(makeSample("interpolate", 0.5, newer, older));

    const p = cache.getPresentation(2);
    expect(p).toBeDefined();
    expect(p?.movementKind).toBe(MovementPresentationKind.Teleport);
    expect(p?.renderX).toBe(5.5);
    expect(p?.renderZ).toBe(5.5);
  });

  it("older snapshot tile is used when previousTile is null but older entity exists", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const older = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    const newer = makeSnapshot(2, [
      makeEntity(
        1,
        { x: 11, y: 20, plane: 0 },
        {
          moveSpeed: "walk",
          previousTile: null,
        },
      ),
    ]);

    cache.applySample(makeSample("interpolate", 0.5, newer, older));

    const p = cache.getPresentation(1);
    expect(p?.movementKind).toBe(MovementPresentationKind.Teleport);
    // Because previousTile is null, we treat it as teleport even though older entity exists
    expect(p?.renderX).toBe(11.5);
  });

  it("setRenderHandleId updates and returns true for existing entity", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const snapshot = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    cache.applySample(makeSample("interpolate", 0, snapshot));

    expect(cache.setRenderHandleId(1, 42)).toBe(true);
    expect(cache.getPresentation(1)?.renderHandleId).toBe(42);
    expect(cache.setRenderHandleId(99, 42)).toBe(false);
  });

  it("setDebugName stores metadata", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const snapshot = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    cache.applySample(makeSample("interpolate", 0, snapshot));

    expect(cache.setDebugName(1, "Hero")).toBe(true);
    expect(cache.getPresentation(1)?.debugName).toBe("Hero");
    expect(cache.setDebugName(99, "Villain")).toBe(false);
  });

  it("forEachPresentation does not allocate arrays per entity", () => {
    const cache = new RenderTransformCache(defaultOptions);
    const snapshot = makeSnapshot(1, [
      makeEntity(1, { x: 10, y: 20, plane: 0 }),
      makeEntity(2, { x: 20, y: 30, plane: 0 }),
    ]);
    cache.applySample(makeSample("interpolate", 0, snapshot));

    const refs: unknown[] = [];
    cache.forEachPresentation((p) => {
      refs.push(p);
    });
    // All callbacks receive the same scratch object reference
    expect(refs[0]).toBe(refs[1]);
  });

  it("tileSize option scales render positions", () => {
    const cache = new RenderTransformCache({ initialCapacity: 4, tileSize: 2 });
    const snapshot = makeSnapshot(1, [makeEntity(1, { x: 10, y: 20, plane: 0 })]);
    cache.applySample(makeSample("interpolate", 0, snapshot));

    const p = cache.getPresentation(1);
    expect(p?.renderX).toBe(10 * 2 + 1);
    expect(p?.renderZ).toBe(20 * 2 + 1);
  });
});
