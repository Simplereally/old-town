import type {
  EntityId,
  FullStatePacket,
  Plane,
  TickDeltaPacket,
  TileCoord,
} from "@old-town/shared";
import { createRng, ServerPacketType } from "@old-town/shared";
import { ClientPacketApplier } from "../../net/ClientPacketApplier";
import { ClientPacketIngestor } from "../../net/ClientPacketIngestor";
import { ClientWorldStore } from "../../net/ClientWorldStore";
import type { PresentationSample } from "../../net/SnapshotBuffer";
import { type RenderSnapshot, SnapshotBuffer } from "../../net/SnapshotBuffer";
import { UIState } from "../../ui/UIState";
import type { RenderClockSample } from "../RenderClock";
import { RenderClock } from "../RenderClock";
import type { RenderEntityPresentation } from "../RenderTransformCache";
import { RenderTransformCache, type RenderTransformSample } from "../RenderTransformCache";

export interface JitterHarnessOptions {
  readonly seed: number;
  readonly tickCount: number;
  readonly tickMs: number;
  readonly jitterMs: number;
  readonly duplicateRate: number;
  readonly dropRate: number;
  readonly reorderRate: number;
  readonly frameRate: number;
  readonly interpolationDelayMs: number;
  readonly freezeAfterMissingTicks: number;
  readonly snapAfterMissingTicks: number;
}

export interface FrameRecord {
  readonly frameIndex: number;
  readonly frameTimeMs: number;
  readonly clockSample: RenderClockSample;
  readonly bufferSample: PresentationSample;
  readonly acceptedPacketTicks: readonly number[];
  readonly rejectedPacketTicks: readonly number[];
  readonly entityPresentations: ReadonlyArray<{
    readonly entityId: number;
    readonly renderX: number;
    readonly renderY: number;
    readonly renderZ: number;
    readonly currTileX: number;
    readonly currTileY: number;
    readonly currTilePlane: number;
    readonly mode: PresentationSample["mode"];
  }>;
  readonly lastSyncTick: number;
  readonly latestAcceptedTick: number;
}

export interface PacketArrival {
  readonly tick: number;
  readonly packet: TickDeltaPacket;
  readonly arrivalTimeMs: number;
  readonly kind: "normal" | "duplicate" | "reordered" | "dropped";
}

export class SnapshotJitterHarness {
  readonly options: JitterHarnessOptions;
  readonly records: FrameRecord[] = [];
  readonly arrivals: PacketArrival[] = [];
  readonly path: TileCoord[] = [];
  readonly store: ClientWorldStore;
  readonly snapshotBuffer: SnapshotBuffer;
  readonly renderClock: RenderClock;
  readonly transformCache: RenderTransformCache;
  readonly ingestor: ClientPacketIngestor;
  readonly rng: ReturnType<typeof createRng>;

  constructor(options: Partial<JitterHarnessOptions> = {}) {
    this.options = {
      seed: 12345,
      tickCount: 120,
      tickMs: 600,
      jitterMs: 100,
      duplicateRate: 0.05,
      dropRate: 0.05,
      reorderRate: 0.05,
      frameRate: 60,
      interpolationDelayMs: 600,
      freezeAfterMissingTicks: 2,
      snapAfterMissingTicks: 6,
      ...options,
    };

    this.rng = createRng(this.options.seed);
    this.store = new ClientWorldStore();
    this.snapshotBuffer = new SnapshotBuffer({
      tickMs: this.options.tickMs,
      interpolationDelayMs: this.options.interpolationDelayMs,
      maxSnapshots: 32,
      freezeAfterMissingTicks: this.options.freezeAfterMissingTicks,
      snapAfterMissingTicks: this.options.snapAfterMissingTicks,
    });
    this.renderClock = new RenderClock({
      tickMs: this.options.tickMs,
      interpolationDelayMs: this.options.interpolationDelayMs,
      maxFrameDeltaMs: 100,
      serverTimeSmoothing: 0.1,
    });
    this.transformCache = new RenderTransformCache({
      initialCapacity: 4,
      tileSize: 1,
    });
    const uiState = new UIState();
    const applier = new ClientPacketApplier({
      store: this.store,
      snapshotBuffer: this.snapshotBuffer,
      uiState,
      logDebug: () => {},
      tileSizeWorldUnits: 1,
    });
    this.ingestor = new ClientPacketIngestor(applier, this.renderClock);
  }

  generatePath(): TileCoord[] {
    const path: TileCoord[] = [];
    let x = 0;
    let y = 0;
    const plane: Plane = 0 as Plane;
    for (let tick = 0; tick <= this.options.tickCount; tick++) {
      path.push({ x, y, plane });
      if (tick < this.options.tickCount) {
        const segment = Math.floor(tick / 20) % 4;
        if (segment === 0) x += 1;
        else if (segment === 1) y += 1;
        else if (segment === 2) x -= 1;
        else y -= 1;
      }
    }
    return path;
  }

  generateArrivals(): PacketArrival[] {
    const path = this.generatePath();
    const selfEntityId: EntityId = 1 as EntityId;
    const arrivals: PacketArrival[] = [];

    for (let tick = 1; tick <= this.options.tickCount; tick++) {
      const curr = path[tick] as TileCoord;
      const packet: TickDeltaPacket = {
        type: ServerPacketType.TickDelta,
        tick,
        serverTime: tick * this.options.tickMs,
        entityAdds: [],
        entityRemoves: [],
        entityUpdates: [
          {
            entityId: selfEntityId,
            mask: 0,
            changes: {
              position: curr,
              moveSpeed: tick % 2 === 0 ? "run" : "walk",
            },
          },
        ],
      };

      const idealTime = tick * this.options.tickMs;
      const jitter = this.rng.nextFloat() * this.options.jitterMs;
      const arrivalTime = idealTime + jitter;

      const dropRoll = this.rng.nextFloat();
      if (dropRoll < this.options.dropRate) {
        arrivals.push({ tick, packet, arrivalTimeMs: arrivalTime, kind: "dropped" });
        continue;
      }

      arrivals.push({ tick, packet, arrivalTimeMs: arrivalTime, kind: "normal" });

      const dupRoll = this.rng.nextFloat();
      if (dupRoll < this.options.duplicateRate) {
        arrivals.push({
          tick,
          packet,
          arrivalTimeMs: arrivalTime + 50,
          kind: "duplicate",
        });
      }
    }

    // Reorder: randomly swap adjacent pairs
    for (let i = 0; i < arrivals.length - 1; i++) {
      const reorderRoll = this.rng.nextFloat();
      if (reorderRoll < this.options.reorderRate) {
        const temp = arrivals[i] as PacketArrival;
        arrivals[i] = arrivals[i + 1] as PacketArrival;
        arrivals[i + 1] = temp;
      }
    }

    // Sort by arrival time so simulation processes in wall-clock order
    arrivals.sort((a, b) => a.arrivalTimeMs - b.arrivalTimeMs);

    return arrivals;
  }

  run(): void {
    this.records.length = 0;
    this.arrivals.length = 0;
    this.path.length = 0;

    const path = this.generatePath();
    this.path.push(...path);
    const selfEntityId: EntityId = 1 as EntityId;

    // Bootstrap with full state at tick 0
    const fullState: FullStatePacket = {
      type: ServerPacketType.FullState,
      protocolVersion: 1,
      tick: 0,
      serverTime: 0,
      selfEntityId,
      entities: [
        {
          entityId: selfEntityId,
          kind: "player",
          tile: path[0] as TileCoord,
          moveSpeed: "stationary",
          appearance: { name: "Hero", bodyId: "dev" },
        },
      ],
      regionLoads: [],
    };
    this.ingestor.ingestFullState(fullState, 0);

    // Generate packet arrivals
    const arrivals = this.generateArrivals();
    this.arrivals.push(...arrivals);

    // Simulate frames
    const frameInterval = 1000 / this.options.frameRate;
    const endTime = this.options.tickCount * this.options.tickMs + 2000;
    let arrivalIndex = 0;

    for (
      let frameTime = 0, frameIndex = 0;
      frameTime <= endTime;
      frameTime += frameInterval, frameIndex++
    ) {
      const acceptedPacketTicks: number[] = [];
      const rejectedPacketTicks: number[] = [];

      // Ingest all packets that have arrived by this frame
      while (
        arrivalIndex < arrivals.length &&
        (arrivals[arrivalIndex] as PacketArrival).arrivalTimeMs <= frameTime
      ) {
        const arrival = arrivals[arrivalIndex] as PacketArrival;
        if (arrival.kind !== "dropped") {
          const currentTick = this.snapshotBuffer.latestAcceptedTick;
          const result = this.ingestor.ingestTickDelta(
            arrival.packet,
            currentTick,
            arrival.arrivalTimeMs,
          );
          if (result) {
            acceptedPacketTicks.push(arrival.tick);
          } else {
            rejectedPacketTicks.push(arrival.tick);
          }
        }
        arrivalIndex++;
      }

      // Sample render pipeline
      const clockSample = this.renderClock.sample(frameTime);
      const bufferSample = this.snapshotBuffer.sample(clockSample.renderServerTimeMs);
      const transformSample = this._buildTransformSample(bufferSample);
      this.transformCache.applySample(transformSample);

      // Collect presentations
      const presentations: Array<{
        entityId: number;
        renderX: number;
        renderY: number;
        renderZ: number;
        currTileX: number;
        currTileY: number;
        currTilePlane: number;
        mode: PresentationSample["mode"];
      }> = [];
      this.transformCache.forEachPresentation((p: RenderEntityPresentation) => {
        presentations.push({
          entityId: p.entityId,
          renderX: p.renderX,
          renderY: p.renderY,
          renderZ: p.renderZ,
          currTileX: p.currTileX,
          currTileY: p.currTileY,
          currTilePlane: p.currTilePlane,
          mode: bufferSample.mode,
        });
      });

      this.records.push({
        frameIndex,
        frameTimeMs: frameTime,
        clockSample,
        bufferSample,
        acceptedPacketTicks,
        rejectedPacketTicks,
        entityPresentations: presentations,
        lastSyncTick: this.renderClock.lastSyncTick,
        latestAcceptedTick: this.snapshotBuffer.latestAcceptedTick,
      });
    }
  }

  private _buildTransformSample(bufferSample: PresentationSample): RenderTransformSample {
    if (bufferSample.mode === "empty") {
      const emptySnapshot: RenderSnapshot = {
        tick: -1,
        sequence: -1,
        serverTimeMs: 0,
        entities: [],
        events: [],
        regionLoads: [],
        regionUnloads: [],
      };
      return {
        alpha: bufferSample.alpha,
        mode: bufferSample.mode,
        newerSnapshot: emptySnapshot,
      };
    }

    const newerSnapshot = this.snapshotBuffer.getSnapshot(bufferSample.newerTick);
    if (!newerSnapshot) {
      // Should not happen for non-empty modes, but guard anyway
      const fallback: RenderSnapshot = {
        tick: bufferSample.newerTick,
        sequence: bufferSample.newerTick,
        serverTimeMs: bufferSample.newerTick * this.options.tickMs,
        entities: [],
        events: [],
        regionLoads: [],
        regionUnloads: [],
      };
      return {
        alpha: bufferSample.alpha,
        mode: bufferSample.mode,
        newerSnapshot: fallback,
      };
    }

    let olderSnapshot: RenderSnapshot | undefined;
    if (bufferSample.olderTick >= 0 && bufferSample.olderTick !== bufferSample.newerTick) {
      olderSnapshot = this.snapshotBuffer.getSnapshot(bufferSample.olderTick) ?? undefined;
    }

    return {
      alpha: bufferSample.alpha,
      mode: bufferSample.mode,
      snapReason: bufferSample.snapReason,
      olderSnapshot,
      newerSnapshot,
    };
  }
}
