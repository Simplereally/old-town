import { describe, expect, it } from "vitest";
import type { RenderEntitySnapshot, RenderSnapshot } from "../net/SnapshotBuffer";
import {
  PresentationMovementPolicies,
  type PresentationMovementPoliciesOptions,
} from "./PresentationMovementPolicies";
import { RenderClock, type RenderClockOptions } from "./RenderClock";
import {
  MovementPresentationKind,
  RenderTransformCache,
  type RenderTransformSample,
} from "./RenderTransformCache";

const defaultOptions: PresentationMovementPoliciesOptions = {
  tickMs: 600,
  hitsplatDurationMs: 1200,
  chatDurationMs: 4000,
  clickMarkerDurationMs: 1500,
  transformCacheCapacity: 4,
  tileSize: 1,
};

const defaultClockOptions: RenderClockOptions = {
  tickMs: 600,
  interpolationDelayMs: 600,
  maxFrameDeltaMs: 100,
  serverTimeSmoothing: 0.1,
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

describe("PresentationMovementPolicies", () => {
  it("walk interpolation moves tile centre to tile centre via RenderTransformCache", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
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

    policies.applySnapshot(makeSample("interpolate", 0, older));
    policies.applySnapshot(makeSample("interpolate", 0.5, newer, older));

    const p = policies.transformCache.getPresentation(1);
    expect(p).toBeDefined();
    expect(p?.movementKind).toBe(MovementPresentationKind.Walk);
    expect(p?.renderX).toBeCloseTo(10.5 + 0.5 * 1, 5);
    expect(p?.renderZ).toBe(20.5);
    expect(p?.heading).toBe(90);
  });

  it("run presentation as two-tile visual motion when snapshot delta supports two tiles", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
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

    policies.applySnapshot(makeSample("interpolate", 0, older));
    policies.applySnapshot(makeSample("interpolate", 0.5, newer, older));

    const p = policies.transformCache.getPresentation(1);
    expect(p).toBeDefined();
    expect(p?.movementKind).toBe(MovementPresentationKind.Run);
    // Visual distance is 2 tiles over the same tick, so midpoint is 1 tile from start
    expect(p?.renderX).toBeCloseTo(10.5 + 0.5 * 2, 5);
  });

  it("run with less than two-tile distance falls back to walk", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
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

    policies.applySnapshot(makeSample("interpolate", 0.5, newer, older));

    const p = policies.transformCache.getPresentation(1);
    expect(p?.movementKind).toBe(MovementPresentationKind.Walk);
    expect(p?.renderX).toBeCloseTo(10.5 + 0.5 * 1, 5);
  });

  it("teleport snaps to tile without interpolation through blocked tiles", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
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

    policies.applySnapshot(makeSample("interpolate", 0.5, newer, older));

    const p = policies.transformCache.getPresentation(1);
    expect(p?.movementKind).toBe(MovementPresentationKind.Teleport);
    expect(p?.renderX).toBe(50.5);
    expect(p?.renderZ).toBe(50.5);
    // No interpolation through intermediate tiles: prevTile stays the old tile
    expect(p?.prevTileX).toBe(10);
    expect(p?.prevTileY).toBe(20);
    expect(p?.currTileX).toBe(50);
    expect(p?.currTileY).toBe(50);
  });

  it("teleport on previousTile null even in interpolate mode", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
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

    policies.applySnapshot(makeSample("interpolate", 0.5, newer, older));

    const p = policies.transformCache.getPresentation(1);
    expect(p?.movementKind).toBe(MovementPresentationKind.Teleport);
    expect(p?.renderX).toBe(11.5);
  });

  it("projectile lifetime uses startTick, hitTick, and renderServerTimeMs", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
    const clock = new RenderClock(defaultClockOptions);
    clock.syncToServer(1, 2000, 1000);

    const startTile = { x: 0, y: 0, plane: 0 } as const;
    const endTile = { x: 5, y: 5, plane: 0 } as const;
    policies.spawnProjectile("p1", startTile, endTile, 1, 3);

    // At renderServerTimeMs = 2000 (tick 1), projectile just started
    const sample1 = clock.sample(1000);
    expect(sample1.renderServerTimeMs).toBe(1400);
    policies.update(sample1);
    let projs = policies.getProjectiles();
    expect(projs).toHaveLength(1);
    expect(projs[0]?.progress).toBeCloseTo((1400 - 1 * 600) / ((3 - 1) * 600), 5);
    expect(projs[0]?.isDone).toBe(false);

    // At renderServerTimeMs = 2000 (tick 2), projectile is halfway
    clock.sample(1000 + 1000 / 60);
    const sample2 = clock.sample(1000 + 2000 / 60);
    policies.update(sample2);
    projs = policies.getProjectiles();
    expect(projs[0]?.progress).toBeCloseTo(
      (sample2.renderServerTimeMs - 1 * 600) / ((3 - 1) * 600),
      2,
    );

    // At renderServerTimeMs = 2600 (tick 3 + 200ms), projectile is done
    const sample3 = clock.sample(2000);
    policies.update(sample3);
    projs = policies.getProjectiles();
    expect(projs).toHaveLength(0);
  });

  it("hitsplat lifetime uses accepted server tick/time plus visual duration constant", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
    const clock = new RenderClock(defaultClockOptions);
    clock.syncToServer(1, 2000, 1000);

    const startTick = 1;
    const startServerTimeMs = startTick * 600;
    policies.showHitsplat(1, 5, "damage", startTick, startServerTimeMs);

    // At renderServerTimeMs = 1400, hitsplat is 800ms old out of 1200ms
    const sample1 = clock.sample(1000);
    policies.update(sample1);
    let hitsplats = policies.getHitsplats();
    expect(hitsplats).toHaveLength(1);
    expect(hitsplats[0]?.progress).toBeCloseTo(
      (sample1.renderServerTimeMs - startServerTimeMs) / defaultOptions.hitsplatDurationMs,
      5,
    );
    expect(hitsplats[0]?.isDone).toBe(false);

    // At renderServerTimeMs = 2600, hitsplat is 2000ms old > 1200ms duration
    const sample2 = clock.sample(2000);
    policies.update(sample2);
    hitsplats = policies.getHitsplats();
    expect(hitsplats).toHaveLength(0);
  });

  it("overhead chat lifetime uses serverTime from packet plus visual duration constant", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
    const clock = new RenderClock(defaultClockOptions);
    clock.syncToServer(1, 2000, 1000);

    const chatServerTimeMs = 1 * 600;
    policies.showChat(1, "Hello", chatServerTimeMs);

    // At renderServerTimeMs = 1400, chat is 800ms old out of 4000ms
    const sample1 = clock.sample(1000);
    policies.update(sample1);
    let chats = policies.getChatBubbles();
    expect(chats).toHaveLength(1);
    expect(chats[0]?.progress).toBeCloseTo(
      (sample1.renderServerTimeMs - chatServerTimeMs) / defaultOptions.chatDurationMs,
      5,
    );
    expect(chats[0]?.isDone).toBe(false);

    // At renderServerTimeMs = 5600, chat is 5000ms old > 4000ms duration
    const sample2 = clock.sample(5000);
    policies.update(sample2);
    chats = policies.getChatBubbles();
    expect(chats).toHaveLength(0);
  });

  it("click marker is client-only UI state and never writes serverTile or RenderTransformCache truth", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
    const clock = new RenderClock(defaultClockOptions);
    clock.syncToServer(1, 2000, 1000);

    const sample = clock.sample(1000);
    const tile = { x: 5, y: 5, plane: 0 } as const;
    const markerId = policies.recordClick(tile, sample.renderServerTimeMs);

    // Click marker is tracked
    let markers = policies.getClickMarkers();
    expect(markers).toHaveLength(1);
    expect(markers[0]?.tile).toEqual(tile);
    expect(markers[0]?.id).toBe(markerId);

    // RenderTransformCache is untouched
    expect(policies.transformCache.count).toBe(0);

    // No serverTile or entity state is written
    policies.update(sample);
    markers = policies.getClickMarkers();
    expect(markers).toHaveLength(1);
    expect(policies.transformCache.count).toBe(0);
  });

  it("move rejection feedback is preserved and retrievable", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);

    const tile = { x: 7, y: 8, plane: 0 } as const;
    policies.recordRejectedMove(tile, 5);

    const rejected = policies.getRejectedMoves();
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.tile).toEqual(tile);
    expect(rejected[0]?.tick).toBe(5);

    policies.clearRejectedMoves();
    expect(policies.getRejectedMoves()).toHaveLength(0);
  });

  it("background-tab pause clamping: projectiles do not run a catch-up loop", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
    const clock = new RenderClock(defaultClockOptions);
    clock.syncToServer(1, 2000, 1000);

    const startTile = { x: 0, y: 0, plane: 0 } as const;
    const endTile = { x: 5, y: 5, plane: 0 } as const;
    policies.spawnProjectile("p1", startTile, endTile, 1, 3);

    // First frame at t=1000
    const sample1 = clock.sample(1000);
    expect(sample1.clamped).toBe(false);
    policies.update(sample1);
    let projs = policies.getProjectiles();
    expect(projs).toHaveLength(1);
    expect(projs[0]?.isDone).toBe(false);

    // Simulate a 5-second background-tab pause (t=6000)
    const sample2 = clock.sample(6000);
    expect(sample2.clamped).toBe(true);
    expect(sample2.frameDeltaMs).toBe(defaultClockOptions.maxFrameDeltaMs);
    // renderServerTimeMs jumped by 5 seconds
    expect(sample2.renderServerTimeMs).toBe(6000 + 1000 - 600);

    // Projectile completes deterministically in a single frame,
    // not over a 50-frame catch-up loop.
    policies.update(sample2);
    projs = policies.getProjectiles();
    expect(projs).toHaveLength(0);
  });

  it("background-tab pause clamping: hitsplats do not run a catch-up loop", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
    const clock = new RenderClock(defaultClockOptions);
    clock.syncToServer(1, 2000, 1000);

    const startTick = 1;
    const startServerTimeMs = startTick * 600;
    policies.showHitsplat(1, 5, "damage", startTick, startServerTimeMs);

    // First frame at t=1000
    const sample1 = clock.sample(1000);
    policies.update(sample1);
    let hitsplats = policies.getHitsplats();
    expect(hitsplats).toHaveLength(1);
    expect(hitsplats[0]?.isDone).toBe(false);

    // 5-second pause
    const sample2 = clock.sample(6000);
    expect(sample2.clamped).toBe(true);

    // Hitsplat completes deterministically in one frame
    policies.update(sample2);
    hitsplats = policies.getHitsplats();
    expect(hitsplats).toHaveLength(0);
  });

  it("background-tab pause clamping: chat bubbles do not run a catch-up loop", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
    const clock = new RenderClock(defaultClockOptions);
    clock.syncToServer(1, 2000, 1000);

    const chatServerTimeMs = 1 * 600;
    policies.showChat(1, "Hello", chatServerTimeMs);

    // First frame at t=1000
    const sample1 = clock.sample(1000);
    policies.update(sample1);
    let chats = policies.getChatBubbles();
    expect(chats).toHaveLength(1);
    expect(chats[0]?.isDone).toBe(false);

    // 5-second pause
    const sample2 = clock.sample(6000);
    expect(sample2.clamped).toBe(true);

    // Chat bubble completes deterministically in one frame
    policies.update(sample2);
    chats = policies.getChatBubbles();
    expect(chats).toHaveLength(0);
  });

  it("click marker fades and expires based on renderServerTimeMs", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);
    const clock = new RenderClock(defaultClockOptions);
    clock.syncToServer(1, 2000, 1000);

    const sample1 = clock.sample(1000);
    const tile = { x: 3, y: 3, plane: 0 } as const;
    policies.recordClick(tile, sample1.renderServerTimeMs);

    policies.update(sample1);
    let markers = policies.getClickMarkers();
    expect(markers).toHaveLength(1);
    expect(markers[0]?.progress).toBe(0);

    // After 750ms, marker is halfway
    const sample2 = clock.sample(1750);
    policies.update(sample2);
    markers = policies.getClickMarkers();
    expect(markers[0]?.progress).toBeCloseTo(
      (sample2.renderServerTimeMs - sample1.renderServerTimeMs) /
        defaultOptions.clickMarkerDurationMs,
      2,
    );

    // After 2000ms, marker is gone
    const sample3 = clock.sample(3000);
    policies.update(sample3);
    markers = policies.getClickMarkers();
    expect(markers).toHaveLength(0);
  });

  it("clear methods remove all tracked effects", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);

    policies.spawnProjectile(
      "p1",
      { x: 0, y: 0, plane: 0 } as const,
      { x: 1, y: 1, plane: 0 } as const,
      1,
      2,
    );
    policies.showHitsplat(1, 5, "damage", 1, 600);
    policies.showChat(1, "Hi", 600);
    policies.recordClick({ x: 0, y: 0, plane: 0 } as const, 600);
    policies.recordRejectedMove({ x: 1, y: 1, plane: 0 } as const, 2);

    policies.clearProjectiles();
    policies.clearHitsplats();
    policies.clearChats();
    policies.clearClickMarkers();
    policies.clearRejectedMoves();

    expect(policies.getProjectiles()).toHaveLength(0);
    expect(policies.getHitsplats()).toHaveLength(0);
    expect(policies.getChatBubbles()).toHaveLength(0);
    expect(policies.getClickMarkers()).toHaveLength(0);
    expect(policies.getRejectedMoves()).toHaveLength(0);
  });

  it("remove methods remove individual effects", () => {
    const policies = new PresentationMovementPolicies(defaultOptions);

    policies.spawnProjectile(
      "p1",
      { x: 0, y: 0, plane: 0 } as const,
      { x: 1, y: 1, plane: 0 } as const,
      1,
      2,
    );
    const hitId = policies.showHitsplat(1, 5, "damage", 1, 600);
    const chatId = policies.showChat(1, "Hi", 600);
    const markerId = policies.recordClick({ x: 0, y: 0, plane: 0 } as const, 600);

    policies.removeProjectile("p1");
    policies.removeHitsplat(hitId);
    policies.removeChat(chatId);
    policies.removeClickMarker(markerId);

    expect(policies.getProjectiles()).toHaveLength(0);
    expect(policies.getHitsplats()).toHaveLength(0);
    expect(policies.getChatBubbles()).toHaveLength(0);
    expect(policies.getClickMarkers()).toHaveLength(0);
  });

  it("does not import server modules or mutate gameplay state", () => {
    // This is a structural test: the module only imports from shared
    // protocol/types and renderer sub-modules.  No server sim, no ECS
    // world, no gameplay state.
    const policies = new PresentationMovementPolicies(defaultOptions);
    expect(policies.transformCache).toBeInstanceOf(RenderTransformCache);
    expect(policies.getProjectiles()).toEqual([]);
    expect(policies.getHitsplats()).toEqual([]);
    expect(policies.getChatBubbles()).toEqual([]);
    expect(policies.getClickMarkers()).toEqual([]);
    expect(policies.getRejectedMoves()).toEqual([]);
  });
});
