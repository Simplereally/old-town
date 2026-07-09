import type { TileCoord } from "@old-town/shared";
import type { PresentationSample } from "../net/SnapshotBuffer";
import type { ChunkBakeQueueStats } from "../renderer/ChunkBakeQueue";
import type { ChunkResidencyStats } from "../renderer/ChunkResidencyManager";
import type { RenderClockSample } from "../renderer/RenderClock";

interface OverlayElements {
  readonly connectionStatus: HTMLDivElement;
  readonly tickStatus: HTMLDivElement;
  readonly fpsStatus: HTMLDivElement;
}

export interface DebugOverlaySelfActor {
  readonly serverTile: TileCoord;
  readonly visualPosition: { readonly x: number; readonly y: number; readonly z: number };
  readonly facingDirection: number;
  readonly animationState: string;
}

export interface DebugOverlayDebugState {
  readonly actionQueue: readonly string[];
  readonly combatCooldown: number;
  readonly pendingHits: ReadonlyMap<string, number>;
  readonly npcLeash: TileCoord | undefined;
  readonly varbits: ReadonlyMap<string, number>;
}

export interface DebugOverlayUpdateInput {
  readonly nowMs: number;
  readonly connected: boolean;
  readonly currentTick: number;
  readonly fps: number;
  readonly selfActor: DebugOverlaySelfActor | undefined;
  readonly pingRtt: number;
  readonly renderStats: {
    readonly frameTimeMs: number;
    readonly drawCalls: number;
    readonly geometries: number;
    readonly textures: number;
  };
  readonly actorCount: number;
  readonly objectCount: number;
  readonly loadedChunkCount: number;
  readonly snapshotDepth: number;
  readonly latestAcceptedTick: number;
  readonly clockSample?: RenderClockSample | undefined;
  readonly presentationSample?: PresentationSample | undefined;
  readonly queueStats?: ChunkBakeQueueStats | undefined;
  readonly residencyStats?: ChunkResidencyStats | undefined;
  readonly atmospherePhase?: string | undefined;
  readonly atmosphereFrozen?: boolean | undefined;
  readonly blobShadowCount?: number | undefined;
  readonly debugState?: DebugOverlayDebugState | undefined;
}

export interface DebugOverlayOptions {
  readonly statusOverlay: HTMLDivElement;
  readonly debugOverlay: HTMLDivElement;
}

export class DebugOverlay {
  private readonly _elements: OverlayElements;
  private readonly _debugOverlay: HTMLDivElement;
  private readonly _debugStats: HTMLElement | null;
  private _lastOverlayConnection: boolean | undefined;
  private _lastOverlayTickText = "";
  private _lastOverlayFpsText = "";
  private _lastFpsOverlayUpdateMs = -Infinity;
  private _lastDebugOverlayUpdateMs = -Infinity;
  private _debugOverlayUpdatePending = false;
  private _debugOverlayUpdateHandle: number | undefined;

  constructor(options: DebugOverlayOptions) {
    const connectionStatus = options.statusOverlay.querySelector("#connection-status");
    const tickStatus = options.statusOverlay.querySelector("#tick-status");
    const fpsStatus = options.statusOverlay.querySelector("#fps-status");
    if (
      !(connectionStatus instanceof HTMLDivElement) ||
      !(tickStatus instanceof HTMLDivElement) ||
      !(fpsStatus instanceof HTMLDivElement)
    ) {
      throw new Error("Missing required status overlay elements");
    }
    this._elements = { connectionStatus, tickStatus, fpsStatus };
    this._debugOverlay = options.debugOverlay;
    this._debugStats = document.getElementById("debug-stats");
  }

  setConnectionFailed(): void {
    this._elements.connectionStatus.textContent = "Connection failed";
    this._elements.connectionStatus.className = "disconnected";
  }

  update(input: DebugOverlayUpdateInput): void {
    if (this._lastOverlayConnection !== input.connected) {
      this._lastOverlayConnection = input.connected;
      this._elements.connectionStatus.textContent = input.connected ? "Connected" : "Disconnected";
      this._elements.connectionStatus.className = input.connected ? "connected" : "disconnected";
    }

    const tickText = `Tick: ${input.currentTick}`;
    if (this._lastOverlayTickText !== tickText) {
      this._lastOverlayTickText = tickText;
      this._elements.tickStatus.textContent = tickText;
    }

    if (input.nowMs - this._lastFpsOverlayUpdateMs >= 250) {
      this._lastFpsOverlayUpdateMs = input.nowMs;
      const fpsText = `FPS: ${input.fps}`;
      if (this._lastOverlayFpsText !== fpsText) {
        this._lastOverlayFpsText = fpsText;
        this._elements.fpsStatus.textContent = fpsText;
      }
    }

    if (input.selfActor) {
      const selfActor = input.selfActor;
      if (
        this._debugOverlay.classList.contains("visible") &&
        !this._debugOverlayUpdatePending &&
        input.nowMs - this._lastDebugOverlayUpdateMs >= 250
      ) {
        this._debugOverlayUpdatePending = true;
        const doUpdate = () => {
          this._debugOverlayUpdatePending = false;
          this._lastDebugOverlayUpdateMs = input.nowMs;
          this._debugOverlayUpdateHandle = undefined;
          const cx = Math.floor(selfActor.serverTile.x / 8);
          const cy = Math.floor(selfActor.serverTile.y / 8);
          const rx = Math.floor(selfActor.serverTile.x / 64);
          const ry = Math.floor(selfActor.serverTile.y / 64);
          const lines = [
            `Tick: ${input.currentTick}`,
            `Ping: ${Math.round(input.pingRtt)}ms`,
            `Frame: ${input.renderStats.frameTimeMs.toFixed(1)}ms`,
            `Draw calls: ${input.renderStats.drawCalls}`,
            `Geometries: ${input.renderStats.geometries}`,
            `Textures: ${input.renderStats.textures}`,
            `Actors: ${input.actorCount}`,
            `Objects: ${input.objectCount}`,
            `Chunks: ${input.loadedChunkCount}`,
            `True tile: (${selfActor.serverTile.x}, ${selfActor.serverTile.y}, ${selfActor.serverTile.plane})`,
            `Visual: (${selfActor.visualPosition.x.toFixed(1)}, ${selfActor.visualPosition.y.toFixed(1)}, ${selfActor.visualPosition.z.toFixed(1)})`,
            `Region: ${rx}:${ry}:${selfActor.serverTile.plane}`,
            `Chunk: ${cx}:${cy}:${selfActor.serverTile.plane}`,
            `Facing: ${selfActor.facingDirection}`,
            `Anim: ${selfActor.animationState}`,
          ];
          if (input.clockSample && input.presentationSample) {
            lines.push(`Snapshot depth: ${input.snapshotDepth}`);
            lines.push(`Presentation mode: ${input.presentationSample.mode}`);
            lines.push(`Render server time: ${input.clockSample.renderServerTimeMs.toFixed(0)}ms`);
            lines.push(`Latest accepted tick: ${input.latestAcceptedTick}`);
            lines.push(`Interpolation alpha: ${input.presentationSample.alpha.toFixed(3)}`);
            if (input.presentationSample.snapReason) {
              lines.push(`Snap reason: ${input.presentationSample.snapReason}`);
            }
          }
          if (input.queueStats) {
            lines.push(`Bake queued: ${input.queueStats.queued}`);
            lines.push(`Bake baking: ${input.queueStats.baking}`);
            lines.push(`Bake waitingUpload: ${input.queueStats.waitingUpload}`);
            lines.push(`Bake resident: ${input.queueStats.resident}`);
            lines.push(`Bake visible: ${input.queueStats.visible}`);
            lines.push(`Bake hidden: ${input.queueStats.hiddenResident}`);
            lines.push(`Bake evictPending: ${input.queueStats.evictPending}`);
            lines.push(`Bake failed: ${input.queueStats.failed}`);
          }
          if (input.residencyStats) {
            lines.push(`Residency visible: ${input.residencyStats.visible}`);
            lines.push(`Residency hidden: ${input.residencyStats.hiddenResident}`);
            lines.push(
              `Residency GPU: ${(input.residencyStats.approximateGpuBytes / 1024 / 1024).toFixed(1)}MB`,
            );
          }
          if (input.atmospherePhase) {
            lines.push(
              `Atmosphere: ${input.atmospherePhase}${input.atmosphereFrozen ? " (frozen)" : ""}`,
            );
          }
          if (input.blobShadowCount !== undefined) {
            lines.push(`Blob shadows: ${input.blobShadowCount}`);
          }
          if (input.debugState) {
            const queue = input.debugState.actionQueue;
            if (queue.length > 0) {
              lines.push(`Action queue: ${queue.join(", ")}`);
            }
            const cooldown = input.debugState.combatCooldown;
            if (cooldown > 0) {
              lines.push(`Combat cooldown: ${cooldown}`);
            }
            const hits = input.debugState.pendingHits;
            if (hits.size > 0) {
              const hitLines = Array.from(hits.entries()).map(
                ([target, amount]) => `Pending hit ${target}: ${amount}`,
              );
              lines.push(...hitLines);
            }
            const leash = input.debugState.npcLeash;
            if (leash) {
              lines.push(`NPC leash: (${leash.x}, ${leash.y})`);
            }
            const vars = input.debugState.varbits;
            if (vars.size > 0) {
              const varLines = Array.from(vars.entries()).map(
                ([varId, value]) => `Var ${varId}: ${value}`,
              );
              lines.push(...varLines);
            }
          }
          if (this._debugStats) {
            this._debugStats.innerHTML = "";
            for (const line of lines) {
              const div = document.createElement("div");
              div.textContent = line;
              this._debugStats.appendChild(div);
            }
          }
        };
        if (typeof requestIdleCallback !== "undefined") {
          this._debugOverlayUpdateHandle = requestIdleCallback(doUpdate);
        } else {
          this._debugOverlayUpdateHandle = window.setTimeout(doUpdate, 0);
        }
      }
    }
  }

  dispose(): void {
    if (this._debugOverlayUpdateHandle !== undefined) {
      if (typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(this._debugOverlayUpdateHandle);
      } else {
        clearTimeout(this._debugOverlayUpdateHandle);
      }
      this._debugOverlayUpdateHandle = undefined;
    }
  }
}
