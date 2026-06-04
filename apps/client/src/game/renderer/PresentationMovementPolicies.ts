import {
  GAME_TICK_MS,
  type HitsplatType,
  type TileCoord,
} from "@old-town/shared";
import type { RenderClockSample } from "./RenderClock";
import {
  RenderTransformCache,
  type RenderTransformSample,
} from "./RenderTransformCache";

export interface PresentationMovementPoliciesOptions {
  /** Server tick duration in milliseconds. */
  readonly tickMs: number;
  /** How long a hitsplat remains visible, in milliseconds. */
  readonly hitsplatDurationMs: number;
  /** How long an overhead chat bubble remains visible, in milliseconds. */
  readonly chatDurationMs: number;
  /** How long a click marker remains visible, in milliseconds. */
  readonly clickMarkerDurationMs: number;
  /** Initial capacity for the owned RenderTransformCache. */
  readonly transformCacheCapacity: number;
  /** World units per tile edge. */
  readonly tileSize?: number;
}

export interface ProjectilePresentation {
  readonly id: string;
  readonly startTile: TileCoord;
  readonly endTile: TileCoord;
  readonly startTick: number;
  readonly hitTick: number;
  readonly progress: number;
  readonly isDone: boolean;
}

export interface HitsplatPresentation {
  readonly id: number;
  readonly entityId: number;
  readonly amount: number;
  readonly type: HitsplatType;
  readonly startTick: number;
  readonly startServerTimeMs: number;
  readonly progress: number;
  readonly isDone: boolean;
}

export interface ChatBubblePresentation {
  readonly id: number;
  readonly entityId: number;
  readonly text: string;
  readonly serverTimeMs: number;
  readonly progress: number;
  readonly isDone: boolean;
}

export interface ClickMarkerPresentation {
  readonly id: number;
  readonly tile: TileCoord;
  readonly startRenderServerTimeMs: number;
  readonly progress: number;
  readonly isDone: boolean;
}

export interface RejectedMovePresentation {
  readonly tile: TileCoord;
  readonly tick: number;
}

interface ProjectileState {
  readonly startTile: TileCoord;
  readonly endTile: TileCoord;
  readonly startTick: number;
  readonly hitTick: number;
}

interface HitsplatState {
  readonly entityId: number;
  readonly amount: number;
  readonly type: HitsplatType;
  readonly startTick: number;
  readonly startServerTimeMs: number;
}

interface ChatBubbleState {
  readonly entityId: number;
  readonly text: string;
  readonly serverTimeMs: number;
}

interface ClickMarkerState {
  readonly tile: TileCoord;
  readonly startRenderServerTimeMs: number;
}

/**
 * Pure render-domain coordinator for movement and transient-presentation policies.
 *
 * Owns a `RenderTransformCache` and manages the lifetime of projectiles,
 * hitsplats, overhead chat, click markers, and rejected-move feedback using
 * server tick/time instead of wall-clock `performance.now()`.
 *
 * Background-tab pauses are handled by driving the visual timeline directly
 * from `renderServerTimeMs`.  Because `RenderClock` clamps `frameDeltaMs`
 * for the local render loop, but the visual lifetimes follow the server
 * timeline, projectiles and hitsplats complete deterministically without
 * running a huge local catch-up loop.
 */
export class PresentationMovementPolicies {
  readonly transformCache: RenderTransformCache;
  private readonly _options: PresentationMovementPoliciesOptions;

  private _projectiles = new Map<string, ProjectileState>();
  private _hitsplats = new Map<number, HitsplatState>();
  private _chatBubbles = new Map<number, ChatBubbleState>();
  private _clickMarkers = new Map<number, ClickMarkerState>();
  private _rejectedMoves: RejectedMovePresentation[] = [];

  private _hitsplatId = 1;
  private _chatBubbleId = 1;
  private _clickMarkerId = 1;

  /** The effective visual time used for lifetime progress, driven directly by renderServerTimeMs. */
  private _effectiveTimeMs = 0;

  constructor(options: PresentationMovementPoliciesOptions) {
    this._options = options;
    this.transformCache = new RenderTransformCache({
      initialCapacity: options.transformCacheCapacity,
      tileSize: options.tileSize ?? 1,
    });
  }

  /** Apply a snapshot sample to the owned RenderTransformCache. */
  applySnapshot(sample: RenderTransformSample): void {
    this.transformCache.applySample(sample);
  }

  /** Spawn a projectile with server-tick lifetime. */
  spawnProjectile(
    id: string,
    startTile: TileCoord,
    endTile: TileCoord,
    startTick: number,
    hitTick: number,
  ): void {
    this._projectiles.set(id, { startTile, endTile, startTick, hitTick });
  }

  /** Remove a projectile by id. */
  removeProjectile(id: string): void {
    this._projectiles.delete(id);
  }

  /** Clear all tracked projectiles. */
  clearProjectiles(): void {
    this._projectiles.clear();
  }

  /** Show a hitsplat with server-tick/time origin and a visual duration. */
  showHitsplat(
    entityId: number,
    amount: number,
    type: HitsplatType,
    startTick: number,
    startServerTimeMs: number,
  ): number {
    const id = this._hitsplatId++;
    this._hitsplats.set(id, {
      entityId,
      amount,
      type,
      startTick,
      startServerTimeMs,
    });
    return id;
  }

  /** Remove a hitsplat by id. */
  removeHitsplat(id: number): void {
    this._hitsplats.delete(id);
  }

  /** Clear all tracked hitsplats. */
  clearHitsplats(): void {
    this._hitsplats.clear();
  }

  /** Show an overhead chat bubble with server-time origin and a visual duration. */
  showChat(
    entityId: number,
    text: string,
    serverTimeMs: number,
  ): number {
    const id = this._chatBubbleId++;
    this._chatBubbles.set(id, { entityId, text, serverTimeMs });
    return id;
  }

  /** Remove a chat bubble by id. */
  removeChat(id: number): void {
    this._chatBubbles.delete(id);
  }

  /** Clear all tracked chat bubbles. */
  clearChats(): void {
    this._chatBubbles.clear();
  }

  /**
   * Record a client-only click marker.
   * Never writes serverTile or RenderTransformCache truth.
   */
  recordClick(tile: TileCoord, renderServerTimeMs: number): number {
    const id = this._clickMarkerId++;
    this._clickMarkers.set(id, {
      tile,
      startRenderServerTimeMs: renderServerTimeMs,
    });
    return id;
  }

  /** Remove a click marker by id. */
  removeClickMarker(id: number): void {
    this._clickMarkers.delete(id);
  }

  /** Clear all click markers. */
  clearClickMarkers(): void {
    this._clickMarkers.clear();
  }

  /** Record a rejected move for visual feedback. */
  recordRejectedMove(tile: TileCoord, tick: number): void {
    this._rejectedMoves.push({ tile, tick });
  }

  /** Clear all rejected-move records. */
  clearRejectedMoves(): void {
    this._rejectedMoves = [];
  }

  /**
   * Update all lifetimes using the current render clock sample.
   *
   * The effective visual time is driven directly from `renderServerTimeMs`.
   * Because `RenderClock` clamps `frameDeltaMs` for the local render loop,
   * but the visual lifetimes follow the server timeline, projectiles and
   * hitsplats complete deterministically without running a huge local
   * catch-up loop.
   */
  update(sample: RenderClockSample): void {
    this._effectiveTimeMs = sample.renderServerTimeMs;

    // Remove expired projectiles
    for (const [id, proj] of this._projectiles) {
      const durationMs = (proj.hitTick - proj.startTick) * this._options.tickMs;
      const elapsedMs = this._effectiveTimeMs - proj.startTick * this._options.tickMs;
      if (elapsedMs >= durationMs) {
        this._projectiles.delete(id);
      }
    }

    // Remove expired hitsplats
    for (const [id, hitsplat] of this._hitsplats) {
      const elapsedMs = this._effectiveTimeMs - hitsplat.startServerTimeMs;
      if (elapsedMs >= this._options.hitsplatDurationMs) {
        this._hitsplats.delete(id);
      }
    }

    // Remove expired chat bubbles
    for (const [id, bubble] of this._chatBubbles) {
      const elapsedMs = this._effectiveTimeMs - bubble.serverTimeMs;
      if (elapsedMs >= this._options.chatDurationMs) {
        this._chatBubbles.delete(id);
      }
    }

    // Remove expired click markers
    for (const [id, marker] of this._clickMarkers) {
      const elapsedMs = this._effectiveTimeMs - marker.startRenderServerTimeMs;
      if (elapsedMs >= this._options.clickMarkerDurationMs) {
        this._clickMarkers.delete(id);
      }
    }
  }

  /** Current active projectile presentations. */
  getProjectiles(): ProjectilePresentation[] {
    const result: ProjectilePresentation[] = [];
    for (const [id, proj] of this._projectiles) {
      const durationMs = (proj.hitTick - proj.startTick) * this._options.tickMs;
      const elapsedMs = this._effectiveTimeMs - proj.startTick * this._options.tickMs;
      const progress =
        durationMs > 0 ? Math.min(1, Math.max(0, elapsedMs / durationMs)) : 1;
      result.push({
        id,
        startTile: proj.startTile,
        endTile: proj.endTile,
        startTick: proj.startTick,
        hitTick: proj.hitTick,
        progress,
        isDone: progress >= 1,
      });
    }
    return result;
  }

  /** Current active hitsplat presentations. */
  getHitsplats(): HitsplatPresentation[] {
    const result: HitsplatPresentation[] = [];
    for (const [id, hitsplat] of this._hitsplats) {
      const elapsedMs = this._effectiveTimeMs - hitsplat.startServerTimeMs;
      const progress = Math.min(
        1,
        Math.max(0, elapsedMs / this._options.hitsplatDurationMs),
      );
      result.push({
        id,
        entityId: hitsplat.entityId,
        amount: hitsplat.amount,
        type: hitsplat.type,
        startTick: hitsplat.startTick,
        startServerTimeMs: hitsplat.startServerTimeMs,
        progress,
        isDone: progress >= 1,
      });
    }
    return result;
  }

  /** Current active chat bubble presentations. */
  getChatBubbles(): ChatBubblePresentation[] {
    const result: ChatBubblePresentation[] = [];
    for (const [id, bubble] of this._chatBubbles) {
      const elapsedMs = this._effectiveTimeMs - bubble.serverTimeMs;
      const progress = Math.min(
        1,
        Math.max(0, elapsedMs / this._options.chatDurationMs),
      );
      result.push({
        id,
        entityId: bubble.entityId,
        text: bubble.text,
        serverTimeMs: bubble.serverTimeMs,
        progress,
        isDone: progress >= 1,
      });
    }
    return result;
  }

  /** Current active click marker presentations. */
  getClickMarkers(): ClickMarkerPresentation[] {
    const result: ClickMarkerPresentation[] = [];
    for (const [id, marker] of this._clickMarkers) {
      const elapsedMs = this._effectiveTimeMs - marker.startRenderServerTimeMs;
      const progress = Math.min(
        1,
        Math.max(0, elapsedMs / this._options.clickMarkerDurationMs),
      );
      result.push({
        id,
        tile: marker.tile,
        startRenderServerTimeMs: marker.startRenderServerTimeMs,
        progress,
        isDone: progress >= 1,
      });
    }
    return result;
  }

  /** Current rejected-move records. */
  getRejectedMoves(): RejectedMovePresentation[] {
    return this._rejectedMoves;
  }
}
