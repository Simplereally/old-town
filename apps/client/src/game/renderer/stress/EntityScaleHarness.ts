import type { Plane } from "@old-town/shared";
import type {
  RenderEntitySnapshot,
  RenderSnapshot,
  SnapshotBufferOptions,
} from "../../net/SnapshotBuffer";
import { SnapshotBuffer } from "../../net/SnapshotBuffer";
import { RenderClock, type RenderClockOptions } from "../RenderClock";
import { RendererMetrics } from "../RendererMetrics";
import { RenderTransformCache, type RenderTransformCacheOptions } from "../RenderTransformCache";

export interface EntityScaleHarnessOptions {
  readonly entityCount?: number;
  readonly tickCount?: number;
  readonly tickMs?: number;
  readonly interpolationDelayMs?: number;
  readonly initialCapacity?: number;
  readonly tileSize?: number;
  readonly frameDeltaMs?: number;
}

export interface FrameMetrics {
  readonly frameIndex: number;
  readonly rafNowMs: number;
  readonly renderServerTimeMs: number;
  readonly entityCount: number;
  readonly transformUpdateDurationMs: number;
  readonly sampleMode: string;
  readonly alpha: number;
}

export interface SimulationResult {
  readonly frames: readonly FrameMetrics[];
  readonly finalCacheCount: number;
  readonly metrics: RendererMetrics;
  readonly snapshotBuffer: SnapshotBuffer;
  readonly transformCache: RenderTransformCache;
  readonly clock: RenderClock;
  readonly maxObservedCapacity: number;
}

/** Deterministic pseudo-random for stable paths. */
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function entityKind(entityId: number): RenderEntitySnapshot["kind"] {
  return entityId % 3 === 0 ? "player" : "npc";
}

function entityDefId(entityId: number): string {
  const kind = entityKind(entityId);
  return kind === "player" ? `player:hero_${entityId}` : `npc:villager_${entityId}`;
}

function entityAppearance(entityId: number): RenderEntitySnapshot["appearance"] {
  return {
    name: entityKind(entityId) === "player" ? `Player_${entityId}` : `NPC_${entityId}`,
    bodyId: entityKind(entityId) === "player" ? "body:hero" : "body:villager",
    colors: [entityId % 256, (entityId * 7) % 256, (entityId * 13) % 256],
  };
}

function baseTile(entityId: number): { x: number; y: number; plane: Plane } {
  return {
    x: (entityId * 7) % 200,
    y: (entityId * 13) % 200,
    plane: 0 as Plane,
  };
}

/** Generate a deterministic tile path for an entity across ticks. */
export function generateEntityPath(
  entityId: number,
  tickCount: number,
): Array<{ x: number; y: number; plane: Plane }> {
  const rand = lcg(entityId * 1234567);
  const path: Array<{ x: number; y: number; plane: Plane }> = [];
  let { x, y, plane } = baseTile(entityId);

  for (let tick = 0; tick < tickCount; tick++) {
    const r = rand();
    if (r < 0.25) {
      x += 1;
    } else if (r < 0.5) {
      x -= 1;
    } else if (r < 0.75) {
      y += 1;
    } else {
      y -= 1;
    }
    x = Math.max(0, Math.min(319, x));
    y = Math.max(0, Math.min(319, y));
    path.push({ x, y, plane });
  }

  return path;
}

/** Build a single entity snapshot for a given tick. */
export function buildEntitySnapshot(entityId: number, tick: number): RenderEntitySnapshot {
  const path = generateEntityPath(entityId, tick + 1);
  const tile = path[tick]!;
  const previousTile = tick > 0 ? path[tick - 1]! : null;
  const dx = previousTile ? Math.abs(tile.x - previousTile.x) : 0;
  const dy = previousTile ? Math.abs(tile.y - previousTile.y) : 0;
  let moveSpeed: RenderEntitySnapshot["moveSpeed"] = "idle";
  if (previousTile === null) {
    moveSpeed = "idle";
  } else if (dx + dy >= 2) {
    moveSpeed = "run";
  } else if (dx + dy === 1) {
    moveSpeed = "walk";
  } else {
    moveSpeed = "idle";
  }

  return {
    entityId,
    kind: entityKind(entityId),
    tile,
    previousTile,
    moveSpeed,
    facing: (entityId * 37 + tick * 17) % 360,
    appearance: entityAppearance(entityId),
    healthBar: null,
    defId: entityDefId(entityId),
  };
}

/** Build a full render snapshot for a given tick with the provided entity ids. */
export function buildSnapshot(tick: number, entityIds: readonly number[]): RenderSnapshot {
  const entities: RenderEntitySnapshot[] = entityIds.map((id) => buildEntitySnapshot(id, tick));
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

/**
 * Stress harness that simulates 1000 entities moving deterministically
 * across 60+ server ticks, feeding SnapshotBuffer and RenderTransformCache
 * with fake RAF timestamps.
 */
export class EntityScaleHarness {
  private readonly _entityCount: number;
  private readonly _tickCount: number;
  private readonly _tickMs: number;
  private readonly _interpolationDelayMs: number;
  private readonly _frameDeltaMs: number;
  private readonly _entityIds: readonly number[];

  readonly snapshotBuffer: SnapshotBuffer;
  readonly clock: RenderClock;
  readonly transformCache: RenderTransformCache;
  readonly metrics: RendererMetrics;

  private _frames: FrameMetrics[] = [];
  private _maxObservedCapacity = 0;
  private _currentTick = 0;

  constructor(options: EntityScaleHarnessOptions = {}) {
    this._entityCount = options.entityCount ?? 1000;
    this._tickCount = options.tickCount ?? 64;
    this._tickMs = options.tickMs ?? 600;
    this._interpolationDelayMs = options.interpolationDelayMs ?? 600;
    this._frameDeltaMs = options.frameDeltaMs ?? 1000 / 60;
    this._entityIds = Array.from({ length: this._entityCount }, (_, i) => i + 1);

    const snapshotOptions: SnapshotBufferOptions = {
      tickMs: this._tickMs,
      interpolationDelayMs: this._interpolationDelayMs,
      maxSnapshots: 32,
      freezeAfterMissingTicks: 2,
      snapAfterMissingTicks: 6,
    };
    this.snapshotBuffer = new SnapshotBuffer(snapshotOptions);

    const clockOptions: RenderClockOptions = {
      tickMs: this._tickMs,
      interpolationDelayMs: this._interpolationDelayMs,
      maxFrameDeltaMs: 100,
      serverTimeSmoothing: 0.1,
    };
    this.clock = new RenderClock(clockOptions);

    const cacheOptions: RenderTransformCacheOptions = {
      initialCapacity: options.initialCapacity ?? 4,
      tileSize: options.tileSize ?? 1,
    };
    this.transformCache = new RenderTransformCache(cacheOptions);

    this.metrics = new RendererMetrics();
  }

  /** Run the full simulation: generate snapshots and feed them through the pipeline. */
  run(): SimulationResult {
    // Pre-generate all snapshots
    const snapshots: RenderSnapshot[] = [];
    for (let tick = 0; tick < this._tickCount; tick++) {
      snapshots.push(buildSnapshot(tick, this._entityIds));
    }

    // Seed the buffer with the first snapshot
    this.snapshotBuffer.reset(snapshots[0]!);
    this.clock.syncToServer(snapshots[0]!.tick, snapshots[0]!.serverTimeMs, 0);

    // Feed remaining snapshots
    for (let i = 1; i < snapshots.length; i++) {
      this.snapshotBuffer.insert(snapshots[i]!);
    }

    // Simulate frames at fake RAF timestamps
    let rafNowMs = 0;
    for (let frame = 0; frame < this._tickCount * 2; frame++) {
      rafNowMs += this._frameDeltaMs;
      this._simulateFrame(frame, rafNowMs);
    }

    return {
      frames: this._frames,
      finalCacheCount: this.transformCache.count,
      metrics: this.metrics,
      snapshotBuffer: this.snapshotBuffer,
      transformCache: this.transformCache,
      clock: this.clock,
      maxObservedCapacity: this._maxObservedCapacity,
    };
  }

  /** Run a single frame at a fake RAF timestamp. */
  stepFrame(rafNowMs: number): FrameMetrics {
    const frameIndex = this._frames.length;
    this._simulateFrame(frameIndex, rafNowMs);
    return this._frames[this._frames.length - 1]!;
  }

  /** Inject a snapshot at the current tick. */
  injectSnapshot(snapshot: RenderSnapshot): void {
    this.snapshotBuffer.insert(snapshot);
  }

  private _simulateFrame(frameIndex: number, rafNowMs: number): void {
    const clockSample = this.clock.sample(rafNowMs);
    const bufferSample = this.snapshotBuffer.sample(clockSample.renderServerTimeMs);

    const olderSnapshot =
      bufferSample.olderTick >= 0
        ? this.snapshotBuffer.getSnapshot(bufferSample.olderTick)
        : undefined;
    const newerSnapshot =
      bufferSample.newerTick >= 0
        ? this.snapshotBuffer.getSnapshot(bufferSample.newerTick)
        : undefined;

    const transformSample = {
      alpha: bufferSample.alpha,
      mode: bufferSample.mode,
      newerSnapshot: newerSnapshot ?? {
        tick: 0,
        sequence: 0,
        serverTimeMs: 0,
        entities: [],
        events: [],
        regionLoads: [],
        regionUnloads: [],
      },
      olderSnapshot,
      snapReason: bufferSample.snapReason,
    };

    const t0 = performance.now();
    this.transformCache.applySample(transformSample);
    const t1 = performance.now();

    const entityCount = this.transformCache.count;
    this.metrics.recordEntityCount(entityCount);
    this.metrics.recordFrame(clockSample.frameDeltaMs, 0, 0, 0);

    // Track capacity growth
    const internalCapacity = (this.transformCache as any)._capacity as number;
    if (internalCapacity > this._maxObservedCapacity) {
      this._maxObservedCapacity = internalCapacity;
    }

    this._frames.push({
      frameIndex,
      rafNowMs,
      renderServerTimeMs: clockSample.renderServerTimeMs,
      entityCount,
      transformUpdateDurationMs: t1 - t0,
      sampleMode: bufferSample.mode,
      alpha: bufferSample.alpha,
    });
  }

  get entityIds(): readonly number[] {
    return this._entityIds;
  }

  get entityCount(): number {
    return this._entityCount;
  }

  get tickCount(): number {
    return this._tickCount;
  }

  get frames(): readonly FrameMetrics[] {
    return this._frames;
  }

  get maxObservedCapacity(): number {
    return this._maxObservedCapacity;
  }
}
