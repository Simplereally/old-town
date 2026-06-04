import type { RegionLoadPacket, RegionUnloadPacket, TileCoord } from "@old-town/shared";

export type PresentationSampleMode =
  | "interpolate"
  | "hold_latest"
  | "freeze"
  | "snap"
  | "empty";

export interface RenderEntitySnapshot {
  readonly entityId: number;
  readonly kind: "player" | "npc" | "creature" | "projectile" | "object" | "groundItem";
  readonly tile: TileCoord;
  readonly previousTile: TileCoord | null;
  readonly moveSpeed: "walk" | "run" | "idle" | "teleport";
  readonly facing: number;
  readonly appearance: { readonly name?: string; readonly bodyId?: string; readonly colors?: readonly number[] };
  readonly healthBar: { readonly current: number; readonly max: number } | null;
  readonly defId: string;
  readonly presentationFlags?: number;
}

export interface RenderEvent {
  readonly type: string;
  readonly payload?: unknown;
}

export interface DebugSnapshot {
  readonly [key: string]: unknown;
}

export interface RenderSnapshot {
  readonly tick: number;
  readonly sequence: number;
  readonly serverTimeMs: number;
  readonly entities: readonly RenderEntitySnapshot[];
  readonly events: readonly RenderEvent[];
  readonly regionLoads: readonly RegionLoadPacket[];
  readonly regionUnloads: readonly RegionUnloadPacket[];
  readonly debug?: DebugSnapshot;
}

export interface SnapshotBufferOptions {
  readonly tickMs: number;
  readonly interpolationDelayMs: number;
  readonly maxSnapshots: number;
  readonly freezeAfterMissingTicks: number;
  readonly snapAfterMissingTicks: number;
}

export interface PresentationSample {
  readonly renderServerTimeMs: number;
  readonly olderTick: number;
  readonly newerTick: number;
  readonly alpha: number;
  readonly mode: PresentationSampleMode;
  readonly snapReason?: string;
}

export class SnapshotBuffer {
  private readonly _snapshots: RenderSnapshot[] = [];
  private _latestAcceptedTick = -1;
  private _latestAcceptedSequence = -1;

  constructor(private readonly _options: SnapshotBufferOptions) {}

  get latestAcceptedTick(): number {
    return this._latestAcceptedTick;
  }

  get depth(): number {
    return this._snapshots.length;
  }

  /** Internal read-only view for tests. */
  get snapshots(): readonly RenderSnapshot[] {
    return this._snapshots;
  }

  /** Retrieve a snapshot by tick, or undefined if not present. */
  getSnapshot(tick: number): RenderSnapshot | undefined {
    return this._snapshots.find((s) => s.tick === tick);
  }

  /** Clears existing snapshots and accepts the full-state snapshot as the new baseline. */
  reset(fullSnapshot: RenderSnapshot): void {
    this._snapshots.length = 0;
    this._snapshots.push(fullSnapshot);
    this._latestAcceptedTick = fullSnapshot.tick;
    this._latestAcceptedSequence = fullSnapshot.sequence;
  }

  /**
   * Inserts a snapshot if it is not a duplicate or older than the latest accepted.
   * Snapshots are kept sorted by tick, then sequence.
   * Returns true if accepted.
   */
  insert(snapshot: RenderSnapshot): boolean {
    if (
      snapshot.tick < this._latestAcceptedTick ||
      (snapshot.tick === this._latestAcceptedTick && snapshot.sequence <= this._latestAcceptedSequence)
    ) {
      return false;
    }

    // Insert in sorted order
    const idx = this._findInsertIndex(snapshot);
    this._snapshots.splice(idx, 0, snapshot);

    if (snapshot.tick > this._latestAcceptedTick ||
      (snapshot.tick === this._latestAcceptedTick && snapshot.sequence > this._latestAcceptedSequence)) {
      this._latestAcceptedTick = snapshot.tick;
      this._latestAcceptedSequence = snapshot.sequence;
    }

    this._trim();
    return true;
  }

  /**
   * Samples the buffer for the requested render server time.
   * The input is already adjusted for interpolation delay by the caller.
   */
  sample(renderServerTimeMs: number): PresentationSample {
    const snapshots = this._snapshots;
    if (snapshots.length === 0) {
      return {
        renderServerTimeMs,
        olderTick: -1,
        newerTick: -1,
        alpha: 0,
        mode: "empty",
      };
    }

    const targetTick = renderServerTimeMs / this._options.tickMs;

    // Find the last snapshot with tick < targetTick
    let olderIndex = -1;
    for (let i = 0; i < snapshots.length; i++) {
      const snap = snapshots[i];
      if (snap === undefined) continue;
      if (snap.tick < targetTick) {
        olderIndex = i;
      } else {
        break;
      }
    }

    // Both an older and a newer bracketing snapshot exist
    if (olderIndex >= 0 && olderIndex + 1 < snapshots.length) {
      const older = snapshots[olderIndex];
      const newer = snapshots[olderIndex + 1];
      if (older === undefined || newer === undefined) {
        return {
          renderServerTimeMs,
          olderTick: -1,
          newerTick: -1,
          alpha: 0,
          mode: "empty",
        };
      }
      const tickDelta = newer.tick - older.tick;
      const alpha = tickDelta === 0 ? 0 : (targetTick - older.tick) / tickDelta;
      return {
        renderServerTimeMs,
        olderTick: older.tick,
        newerTick: newer.tick,
        alpha: Math.max(0, Math.min(1, alpha)),
        mode: "interpolate",
      };
    }

    // Target is before the first snapshot — hold at the earliest known
    if (olderIndex === -1) {
      const first = snapshots[0];
      if (first === undefined) {
        return {
          renderServerTimeMs,
          olderTick: -1,
          newerTick: -1,
          alpha: 0,
          mode: "empty",
        };
      }
      return {
        renderServerTimeMs,
        olderTick: first.tick,
        newerTick: first.tick,
        alpha: 0,
        mode: "hold_latest",
      };
    }

    // Target is after the latest snapshot
    const latest = snapshots[snapshots.length - 1];
    if (latest === undefined) {
      return {
        renderServerTimeMs,
        olderTick: -1,
        newerTick: -1,
        alpha: 0,
        mode: "empty",
      };
    }
    const gapTicks = targetTick - latest.tick;

    if (gapTicks < this._options.freezeAfterMissingTicks) {
      return {
        renderServerTimeMs,
        olderTick: latest.tick,
        newerTick: latest.tick,
        alpha: 0,
        mode: "hold_latest",
      };
    }

    if (gapTicks < this._options.snapAfterMissingTicks) {
      return {
        renderServerTimeMs,
        olderTick: latest.tick,
        newerTick: latest.tick,
        alpha: 0,
        mode: "freeze",
        snapReason: `Missing ${gapTicks.toFixed(1)} ticks`,
      };
    }

    return {
      renderServerTimeMs,
      olderTick: latest.tick,
      newerTick: latest.tick,
      alpha: 0,
      mode: "snap",
      snapReason: `Missing ${gapTicks.toFixed(1)} ticks (snap threshold ${this._options.snapAfterMissingTicks})`,
    };
  }

  private _findInsertIndex(snapshot: RenderSnapshot): number {
    let left = 0;
    let right = this._snapshots.length;
    while (left < right) {
      const mid = (left + right) >>> 1;
      const midSnapshot = this._snapshots[mid];
      if (midSnapshot === undefined) {
        right = mid;
        continue;
      }
      if (
        midSnapshot.tick < snapshot.tick ||
        (midSnapshot.tick === snapshot.tick && midSnapshot.sequence < snapshot.sequence)
      ) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    return left;
  }

  private _trim(): void {
    const minToKeep = Math.max(2, Math.ceil(this._options.interpolationDelayMs / this._options.tickMs) + 1);
    while (this._snapshots.length > this._options.maxSnapshots && this._snapshots.length > minToKeep) {
      this._snapshots.shift();
    }
  }
}
