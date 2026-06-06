import {
  type FullStatePacket,
  GAME_TICK_MS,
  type SpellTarget,
  TILE_SIZE_WORLD_UNITS,
  type TickDeltaPacket,
  type TileCoord,
} from "@old-town/shared";
import { Vector3 } from "three";
import { type ClientDecision, InputInterpreter } from "./input/InputInterpreter";
import { ClientCommandDispatcher } from "./net/ClientCommandDispatcher";
import type { PresentationEvent } from "./net/ClientPacketApplier";
import { ClientPacketApplier } from "./net/ClientPacketApplier";
import { ClientPacketIngestor } from "./net/ClientPacketIngestor";
import { ClientWorldStore } from "./net/ClientWorldStore";
import { GameSocket } from "./net/GameSocket";
import { SnapshotBuffer } from "./net/SnapshotBuffer";
import { EntityPicker } from "./picking/EntityPicker";
import { ChunkBakeQueue } from "./renderer/ChunkBakeQueue";
import {
  ChunkBakeWorkerClient,
  createSynchronousTestClient,
} from "./renderer/ChunkBakeWorkerClient";
import { ChunkResidencyManager } from "./renderer/ChunkResidencyManager";
import { ChunkUploadQueue } from "./renderer/ChunkUploadQueue";
import { RenderClock } from "./renderer/RenderClock";
import { RenderResourceRegistry } from "./renderer/RenderResourceRegistry";
import { RenderTransformCache } from "./renderer/RenderTransformCache";
import { ThreeRenderer } from "./renderer/ThreeRenderer";
import { ActorRenderer } from "./scene/ActorRenderer";
import { ChatOverheadLayer } from "./scene/ChatOverheadLayer";
import { ClickMarkerLayer } from "./scene/ClickMarkerLayer";
import { DebugLayer } from "./scene/DebugLayer";
import { GroundItemLayer } from "./scene/GroundItemLayer";
import { HitsplatLayer } from "./scene/HitsplatLayer";
import { HoverHighlighter } from "./scene/HoverHighlighter";
import { ObjectRenderer } from "./scene/ObjectRenderer";
import { ProjectileLayer } from "./scene/ProjectileLayer";
import { TerrainLayer } from "./scene/TerrainLayer";
import { XpDropLayer } from "./scene/XpDropLayer";
import { ContentClient } from "./ui/ContentClient";
import { ContextMenu } from "./ui/ContextMenu";
import { GlobalKeydownBus } from "./ui/GlobalKeydownBus";
import { UIManager, type UIManagerCallbacks } from "./ui/UIManager";
import { UIState } from "./ui/UIState";

export interface GameEngineOptions {
  readonly canvas: HTMLCanvasElement;
  readonly statusOverlay: HTMLDivElement;
  readonly debugOverlay: HTMLDivElement;
  readonly serverUrl: string;
  readonly characterId?: string;
}

interface OverlayElements {
  connectionStatus: HTMLDivElement;
  tickStatus: HTMLDivElement;
  fpsStatus: HTMLDivElement;
}

/**
 * Top-level game engine. Orchestrates renderer, network, and UI.
 * Preserves server authority: the renderer never owns gameplay truth.
 *
 * E32 refactor: socket callbacks now call pure ClientPacketIngestor which
 * returns PresentationEvent / DebugEvent queues. Scene-layer updates are
 * deferred to the render frame so network callbacks never mutate Three
 * objects.
 */
export class GameEngine {
  readonly renderer: ThreeRenderer;
  readonly terrain: TerrainLayer;
  readonly objects: ObjectRenderer;
  readonly actors: ActorRenderer;
  readonly projectiles: ProjectileLayer;
  readonly hitsplats: HitsplatLayer;
  readonly groundItems: GroundItemLayer;
  readonly chatOverhead: ChatOverheadLayer;
  readonly xpDrops: XpDropLayer;
  readonly debug: DebugLayer | undefined;
  readonly uiState = new UIState();
  readonly content = new ContentClient();
  readonly renderClock: RenderClock;
  private readonly socket: GameSocket;
  private readonly _dispatcher: ClientCommandDispatcher;
  private readonly _inputInterpreter: InputInterpreter;
  private readonly _packetIngestor: ClientPacketIngestor;
  private readonly _snapshotBuffer: SnapshotBuffer;
  private readonly _renderTransformCache: RenderTransformCache;
  private readonly _overlays: OverlayElements;
  private readonly _canvas: HTMLCanvasElement;
  private readonly _entityPicker: EntityPicker;
  private readonly _hoverHighlighter: HoverHighlighter;
  private readonly _contextMenu: ContextMenu;
  private _uiManager: UIManager | undefined;
  private _running = false;
  private _currentTick = 0;
  private _serverTime = 0;
  private _connected = false;
  private _selfEntityId = 0;
  private readonly _clickMarkers: ClickMarkerLayer;
  private _lastPingRtt = 0;
  private _spellTargetMode: { spellId: string } | undefined;
  private _debugOverlayUpdatePending = false;
  private readonly _presentationEventQueue: PresentationEvent[] = [];
  private readonly _debugEventQueue: PresentationEvent[] = [];
  private readonly _chunkBakeQueue: ChunkBakeQueue;
  private readonly _chunkBakeWorker: ChunkBakeWorkerClient;
  private readonly _chunkUploadQueue: ChunkUploadQueue;
  private readonly _chunkResidency: ChunkResidencyManager;
  private readonly _registry: RenderResourceRegistry;
  private readonly _pendingRegionLoads: Array<{
    regionId: string;
    chunks: readonly import("@old-town/shared").ChunkData[];
  }> = [];
  private readonly _pendingRegionUnloads: Array<{ regionId: string }> = [];
  private _frameId = 0;

  constructor(options: GameEngineOptions) {
    const { canvas, statusOverlay, serverUrl, characterId } = options;
    this._canvas = canvas;

    this.renderer = new ThreeRenderer({ canvas });
    this._registry = new RenderResourceRegistry();
    this.terrain = new TerrainLayer({ scene: this.renderer.scene });
    this.objects = new ObjectRenderer({ scene: this.renderer.scene, registry: this._registry });
    this.actors = new ActorRenderer({ scene: this.renderer.scene });
    this.projectiles = new ProjectileLayer({ scene: this.renderer.scene });
    this.hitsplats = new HitsplatLayer({ scene: this.renderer.scene });
    this.xpDrops = new XpDropLayer({ scene: this.renderer.scene });
    this.groundItems = new GroundItemLayer({ scene: this.renderer.scene });
    this.chatOverhead = new ChatOverheadLayer({ scene: this.renderer.scene });
    this._clickMarkers = new ClickMarkerLayer({ scene: this.renderer.scene });
    this.debug = import.meta.env.DEV ? new DebugLayer({ scene: this.renderer.scene }) : undefined;

    this._chunkBakeQueue = new ChunkBakeQueue();
    const uploadQueue = new ChunkUploadQueue({
      scene: this.renderer.scene,
      registry: this._registry,
      chunkBakeQueue: this._chunkBakeQueue,
    });
    this._chunkUploadQueue = uploadQueue;
    this._chunkResidency = new ChunkResidencyManager({
      chunkBakeQueue: this._chunkBakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 64,
      residentRadiusTiles: 128,
      maxGpuBytes: 256 * 1024 * 1024,
      onDisposeChunk: (chunkId) => {
        // When a chunk is disposed, evict it from terrain and hide object buckets
        this.terrain.unloadChunk(chunkId);
        const [regionId] = chunkId.split(":");
        if (regionId) {
          this.objects.setRegionVisible(regionId, false);
        }
      },
    });
    this._chunkBakeWorker =
      import.meta.env.DEV && import.meta.env.VITEST
        ? createSynchronousTestClient(
            (jobId, regionId, chunkCoord, payload) => {
              const cid =
                `${chunkCoord.cx}:${chunkCoord.cy}:${chunkCoord.plane}` as import("@old-town/shared").ChunkId;
              this._chunkUploadQueue.enqueueBakedChunk(cid, payload);
            },
            () => {
              this._chunkBakeQueue.onWorkerFailed("0:0:0" as import("@old-town/shared").ChunkId);
            },
          )
        : new ChunkBakeWorkerClient({
            poolSize: 2,
            onSuccess: (jobId, regionId, chunkCoord, payload) => {
              const cid =
                `${chunkCoord.cx}:${chunkCoord.cy}:${chunkCoord.plane}` as import("@old-town/shared").ChunkId;
              this._chunkUploadQueue.enqueueBakedChunk(cid, payload);
            },
            onFailure: (jobId, regionId, chunkCoord, errorCode, message) => {
              const cid =
                `${chunkCoord.cx}:${chunkCoord.cy}:${chunkCoord.plane}` as import("@old-town/shared").ChunkId;
              this._chunkBakeQueue.onWorkerFailed(cid);
            },
          });
    this.socket = new GameSocket(serverUrl, { characterId });
    this._dispatcher = new ClientCommandDispatcher(this.socket);
    this._inputInterpreter = new InputInterpreter(this.content);

    this.renderClock = new RenderClock({
      tickMs: GAME_TICK_MS,
      interpolationDelayMs: GAME_TICK_MS,
      maxFrameDeltaMs: 100,
      serverTimeSmoothing: 0.1,
    });

    const store = new ClientWorldStore();
    this._snapshotBuffer = new SnapshotBuffer({
      tickMs: GAME_TICK_MS,
      interpolationDelayMs: GAME_TICK_MS,
      maxSnapshots: 32,
      freezeAfterMissingTicks: 2,
      snapAfterMissingTicks: 6,
    });
    this._renderTransformCache = new RenderTransformCache({
      initialCapacity: 256,
      tileSize: TILE_SIZE_WORLD_UNITS,
    });
    const applier = new ClientPacketApplier({
      store,
      snapshotBuffer: this._snapshotBuffer,
      uiState: this.uiState,
      logDebug: (msg) => this._logDebug(msg),
      tileSizeWorldUnits: TILE_SIZE_WORLD_UNITS,
    });
    this._packetIngestor = new ClientPacketIngestor(applier, this.renderClock);

    this._overlays = {
      connectionStatus: statusOverlay.querySelector("#connection-status") as HTMLDivElement,
      tickStatus: statusOverlay.querySelector("#tick-status") as HTMLDivElement,
      fpsStatus: statusOverlay.querySelector("#fps-status") as HTMLDivElement,
    };
    this._entityPicker = new EntityPicker({ camera: this.renderer.camera, canvas });
    this._hoverHighlighter = new HoverHighlighter({ scene: this.renderer.scene });
    this._contextMenu = new ContextMenu({
      container: document.body,
      callbacks: {
        onOptionSelected: (actionId, entity, tile) => {
          const decision = this._inputInterpreter.interpretContextMenu(entity, tile, actionId);
          this._applyDecision(decision);
          if (decision.type === "move") {
            this._showClickMarker(decision.tile);
            this._packetIngestor.recordClickTile(decision.tile, this._currentTick);
            this._logDebug(`Context: Walk here (${decision.tile.x}, ${decision.tile.y})`);
          }
          if (decision.type === "examine") {
            this._logDebug(`Examine: ${entity?.defId ?? entity?.itemId ?? "entity"}`);
          }
          if (decision.type === "npcOption") {
            this._logDebug(`Context: ${actionId} ${entity?.defId ?? "NPC"}`);
          }
          if (decision.type === "objectOption") {
            this._logDebug(`Context: ${actionId} ${entity?.defId ?? "object"}`);
          }
          if (decision.type === "groundItemOption") {
            this._logDebug(`Context: ${actionId} ${entity?.itemId ?? "item"}`);
          }
        },
      },
    });

    this.renderer.onFrame = this._onFrame.bind(this);
    this._setupInputHandlers(canvas);
  }

  async start(): Promise<void> {
    if (this._running) return;
    this._running = true;

    this.renderer.start();
    this._updateOverlay();

    const contentLoad = this.content.load(this.socket.serverUrl).catch((error) => {
      console.warn("Failed to load content registries:", error);
    });
    let fullState: FullStatePacket | undefined;
    try {
      fullState = await this.socket.connect();
    } catch (error) {
      console.error("Failed to connect to server:", error);
      this._overlays.connectionStatus.textContent = "Connection failed";
      this._overlays.connectionStatus.className = "disconnected";
      throw error;
    }
    this._handleFullState(fullState);
    await contentLoad;

    const uiCallbacks: UIManagerCallbacks = {
      sendItemCommand: (uid, actionId) => this.sendItemCommand(uid, actionId),
      sendChatCommand: (text) => this.sendChatCommand(text),
      enterSpellTargetMode: (spellId) => this.enterSpellTargetMode(spellId),
      sendUiActionCommand: (action, targetId, value) =>
        this.sendUiActionCommand(action, targetId, value),
      sendBankCommand: (action, itemUid, quantity) =>
        this.sendBankCommand(action, itemUid, quantity),
      sendShopCommand: (action, itemId, quantity) => this.sendShopCommand(action, itemId, quantity),
      sendRecipeCommand: (recipeId, stationEntityId) =>
        this.sendRecipeCommand(recipeId, stationEntityId),
    };
    this._uiManager = new UIManager(this.uiState, this.content, uiCallbacks);

    this.socket.onTickDelta = (packet) => {
      this._handleTickDelta(packet);
    };
    this.socket.onPong = () => {
      this._lastPingRtt = performance.now() - this.socket.lastPingTime;
    };
    this.socket.onCommandRejected = (reason) => {
      this._logDebug(`Command rejected: ${reason}`);
      this.uiState.addChat([
        {
          text: `Command rejected: ${reason}`,
          channel: "system",
          serverTime: this._serverTime,
        },
      ]);
    };
    this.socket.startPing();
    this.socket.onClose = () => {
      this._connected = false;
      this._updateOverlay();
    };
  }

  private _handleFullState(fullState: FullStatePacket): void {
    const result = this._packetIngestor.ingestFullState(fullState, performance.now());
    this._currentTick = result.tick;
    this._dispatcher.setCurrentTick(result.tick);
    this._serverTime = result.serverTime;
    this._selfEntityId = result.selfEntityId;
    this._presentationEventQueue.push(...result.presentationEvents);
    this._debugEventQueue.push(...result.debugEvents);
    this.actors.setSelfEntityId(this._selfEntityId);
    this._connected = true;
    this._updateOverlay();
  }

  private _handleTickDelta(packet: TickDeltaPacket): void {
    const result = this._packetIngestor.ingestTickDelta(
      packet,
      this._currentTick,
      performance.now(),
    );
    if (result) {
      this._currentTick = result.tick;
      this._dispatcher.setCurrentTick(result.tick);
      this._serverTime = result.serverTime;
      this._presentationEventQueue.push(...result.presentationEvents);
      this._debugEventQueue.push(...result.debugEvents);
    }
  }

  shutdown(): void {
    this._running = false;
    this.socket.close();
    this._canvas.removeEventListener("click", this._handleCanvasClick);
    this._canvas.removeEventListener("mousemove", this._handleMouseMove);
    this._canvas.removeEventListener("contextmenu", this._handleContextMenu);
    GlobalKeydownBus.unregister("game-engine");
    this._contextMenu.hide();
    this._hoverHighlighter.dispose();
    this._clickMarkers.dispose();
    this._uiManager?.dispose();
    this._chunkBakeWorker.dispose();
    this._chunkUploadQueue.dispose();
    this._chunkResidency.dispose();
    this._registry.dispose();
    this.terrain.dispose();
    this.objects.dispose();
    this.actors.dispose();
    this.projectiles.dispose();
    this.hitsplats.dispose();
    this.xpDrops.dispose();
    this.groundItems.dispose();
    this.chatOverhead.dispose();
    this.debug?.dispose();
    this.renderer.dispose();
  }

  private _setupInputHandlers(canvas: HTMLCanvasElement): void {
    canvas.addEventListener("click", this._handleCanvasClick);
    canvas.addEventListener("mousemove", this._handleMouseMove);
    canvas.addEventListener("contextmenu", this._handleContextMenu);
    GlobalKeydownBus.register("game-engine", this._handleKeyDown);
  }

  private _handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      const decision = this._inputInterpreter.interpretEscape(this._spellTargetMode);
      if (decision.type === "cancelSpellTarget") {
        this._spellTargetMode = undefined;
        this._logDebug("Spell target mode cancelled");
        this._updateSpellTargetOverlay();
      }
    }
  };

  private _updateSpellTargetOverlay(): void {
    const overlay = document.getElementById("spell-target-overlay");
    if (overlay) {
      overlay.classList.toggle("visible", !!this._spellTargetMode);
    }
  }

  private _handleCanvasClick = (event: MouseEvent): void => {
    if (!this._connected) return;

    const entity = this._pickEntityAt(event.clientX, event.clientY);
    const tile = this.renderer.tilePicker.screenToTile(event.clientX, event.clientY);
    const playerTile =
      entity?.kind === "player"
        ? (this.actors.getActorState(entity.entityId)?.serverTile ?? null)
        : null;
    const decision = this._inputInterpreter.interpretCanvasClick(
      entity,
      tile,
      playerTile,
      this._spellTargetMode,
    );

    if (decision.type === "castSpell") {
      this._dispatcher.castSpell(decision.spellId, decision.target);
      this._spellTargetMode = undefined;
      this._updateSpellTargetOverlay();
      this._logDebug(`Spell target: ${decision.target.kind}`);
      return;
    }

    this._applyDecision(decision);
    if (decision.type === "move") {
      this._showClickMarker(decision.tile);
      this._packetIngestor.recordClickTile(decision.tile, this._currentTick);
      this._logDebug(`Click: move to (${decision.tile.x}, ${decision.tile.y})`);
    }
    if (decision.type === "npcOption") {
      this._logDebug(`Click: ${decision.actionId} ${entity?.defId ?? "NPC"}`);
    }
    if (decision.type === "objectOption") {
      this._logDebug(`Click: ${decision.actionId} ${entity?.defId ?? "object"}`);
    }
    if (decision.type === "groundItemOption") {
      this._logDebug(`Click: ${decision.actionId} ${entity?.itemId ?? "item"}`);
    }
  };

  private _handleMouseMove = (event: MouseEvent): void => {
    if (!this._connected) return;
    const entity = this._pickEntityAt(event.clientX, event.clientY);
    if (entity) {
      const pos = this._getEntityWorldPosition(entity);
      if (pos) {
        const yOffset = entity.kind === "player" || entity.kind === "npc" ? 0.8 : 0.05;
        this._hoverHighlighter.highlight(pos, yOffset);
        this._hoverHighlighter.setTargetEntityId(entity.entityId);
      }
    } else {
      this._hoverHighlighter.hide();
    }
  };

  private _handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    if (!this._connected) return;

    const entity = this._pickEntityAt(event.clientX, event.clientY);
    const tile = this.renderer.tilePicker.screenToTile(event.clientX, event.clientY);
    const options = this._inputInterpreter.getContextMenuOptions(entity, tile);
    this._contextMenu.show(event.clientX, event.clientY, options, entity, tile);
  };

  private _pickEntityAt(
    screenX: number,
    screenY: number,
  ): import("./picking/EntityPicker").PickedEntity | null {
    const actorTargets = this.actors.getRaycastTargets();
    const objectTargets = this.objects.getRaycastTargets();
    const groundItemTargets = this.groundItems.getRaycastTargets();
    const meshes = [...actorTargets, ...objectTargets, ...groundItemTargets];
    return this._entityPicker.pick(screenX, screenY, meshes);
  }

  private _getEntityWorldPosition(
    entity: import("./picking/EntityPicker").PickedEntity,
  ): Vector3 | null {
    if (entity.kind === "player" || entity.kind === "npc") {
      const actor = this.actors.getActorState(entity.entityId);
      return actor ? actor.visualPosition.clone() : null;
    }
    if (entity.kind === "object") {
      return null;
    }
    return null;
  }

  private _applyDecision(decision: ClientDecision): void {
    switch (decision.type) {
      case "move":
        this._dispatcher.move(decision.tile);
        break;
      case "npcOption":
        this._dispatcher.npcOption(decision.entityId, decision.actionId);
        break;
      case "objectOption":
        this._dispatcher.objectOption(decision.entityId, decision.actionId);
        break;
      case "groundItemOption":
        this._dispatcher.groundItemOption(decision.entityId, decision.actionId);
        break;
      case "inventoryItemOption":
        this._dispatcher.inventoryItemOption(decision.itemUid, decision.actionId);
        break;
      case "castSpell":
        this._dispatcher.castSpell(decision.spellId, decision.target);
        break;
      case "chat":
        this._dispatcher.chat(decision.text);
        break;
      case "uiAction":
        this._dispatcher.uiAction(decision.action, decision.targetId, decision.value);
        break;
      case "examine":
      case "cancelSpellTarget":
      case "none":
        break;
    }
  }

  private _showClickMarker(tile: TileCoord): void {
    this._clickMarkers.show(tile, this._serverTime);
  }

  /** Send an item option command from UI panels (equip, drop, eat, use). */
  sendItemCommand(itemUid: number, actionId: string): void {
    this._dispatcher.inventoryItemOption(itemUid, actionId);
    this._logDebug(`UI: ${actionId} item ${itemUid}`);
  }

  /** Send a spell cast command from the spellbook panel. */
  sendSpellCommand(spellId: string, target: SpellTarget): void {
    this._dispatcher.castSpell(spellId, target);
    this._logDebug(`UI: cast ${spellId}`);
  }

  /** Send a chat message from the chat box. */
  sendChatCommand(text: string): void {
    this._dispatcher.chat(text);
    this._logDebug(`UI: chat "${text}"`);
  }

  enterSpellTargetMode(spellId: string): void {
    this._spellTargetMode = { spellId };
    this._updateSpellTargetOverlay();
    this._logDebug(`Spell target mode: ${spellId}`);
  }

  sendUiActionCommand(action: string, targetId?: string, value?: number): void {
    this._dispatcher.uiAction(action, targetId, value);
    this._logDebug(`UI: action ${action}${targetId ? ` ${targetId}` : ""}`);
  }

  sendBankCommand(
    action: "deposit" | "withdraw" | "open" | "close",
    itemUid?: number,
    quantity?: number,
  ): void {
    this._dispatcher.bankAction(action, itemUid, quantity);
    this._logDebug(`UI: bank ${action}${itemUid ? ` ${itemUid}` : ""}`);
  }

  sendShopCommand(
    action: "buy" | "sell" | "open" | "close",
    itemId?: string,
    quantity?: number,
  ): void {
    this._dispatcher.shopAction(action, itemId, quantity);
    this._logDebug(`UI: shop ${action}${itemId ? ` ${itemId}` : ""}`);
  }

  sendRecipeCommand(recipeId: string, stationEntityId: number): void {
    this._dispatcher.recipeSelect(recipeId, stationEntityId);
    this._logDebug(`UI: recipeSelect ${recipeId} @ ${stationEntityId}`);
  }

  private _logDebug(message: string): void {
    const log = document.getElementById("debug-log");
    if (!log) return;
    const entry = document.createElement("div");
    entry.textContent = `[T${this._currentTick}] ${message}`;
    entry.classList.add("debug-log-entry");
    log.appendChild(entry);
    while (log.children.length > 50) {
      log.removeChild(log.firstChild as Node);
    }
    log.scrollTop = log.scrollHeight;
  }

  private _onFrame(_deltaTime: number, _elapsedTime: number, rafNowMs?: number): void {
    this._frameId++;
    const frameNow = rafNowMs ?? performance.now();

    this._applyPresentationEvents();
    this._applyDebugEvents();

    // --- Region crossing: process pending region loads/unloads ---
    for (const load of this._pendingRegionLoads) {
      const regionParts = load.regionId.split(":");
      const plane = Number(regionParts[2] ?? 0) as 0 | 1 | 2 | 3;
      this._chunkResidency.ingestRegionLoad(
        load.regionId as import("@old-town/shared").RegionId,
        load.chunks.map((c) => ({ cx: c.cx, cy: c.cy, plane })),
      );
    }
    this._pendingRegionLoads.length = 0;
    for (const unload of this._pendingRegionUnloads) {
      this._chunkResidency.ingestRegionUnload(
        unload.regionId as import("@old-town/shared").RegionId,
      );
    }
    this._pendingRegionUnloads.length = 0;

    // --- Update focus tile from local player authoritative position ---
    const selfActor = this.actors.getActorState(this._selfEntityId);
    if (selfActor) {
      this._chunkResidency.setFocusTile(selfActor.serverTile);
    }

    // --- Drive chunk bake pipeline ---
    // 1. Dequeue jobs from ChunkBakeQueue and submit to worker
    let job = this._chunkBakeQueue.dequeueJob();
    while (job) {
      const metadata = job.chunkId.split(":").map(Number);
      if (metadata.length >= 2) {
        this._chunkBakeWorker.submit({
          type: "bake_chunk",
          regionId: job.regionId,
          chunkCoord: {
            cx: metadata[0]!,
            cy: metadata[1]!,
            plane: (metadata[2] ?? 0) as 0 | 1 | 2 | 3,
          },
          tiles: [],
          objectRefs: [],
          requestVersion: 1,
        });
      }
      job = this._chunkBakeQueue.dequeueJob();
    }

    // 2. Process GPU uploads
    this._chunkUploadQueue.processFrame(frameNow);

    // 3. Evaluate residency and visibility
    this._chunkResidency.evaluate(this._frameId);

    // 4. Sync terrain visibility with chunk residency
    const stats = this._chunkResidency.getStats();
    const queueStats = this._chunkBakeQueue.getStats();
    this._chunkResidency.forEachChunk((chunkId, state) => {
      if (state === "visible") {
        const group = this._chunkUploadQueue.getChunkGroup(chunkId);
        if (group) {
          this.terrain.addBakedChunk(chunkId, group);
        }
      } else if (state === "hidden_resident" || state === "evict_pending") {
        this.terrain.unloadChunk(chunkId);
      }
    });

    // 5. Sync object bucket visibility: only show when chunk is visible
    this._chunkResidency.forEachChunk((chunkId, state) => {
      const [regionId] = chunkId.split(":");
      if (!regionId) return;
      if (state === "visible") {
        this.objects.setRegionVisible(regionId, true);
      } else if (state === "hidden_resident" || state === "evict_pending" || state === "disposed") {
        this.objects.setRegionVisible(regionId, false);
      }
    });

    this.objects.flush(frameNow);

    const clockSample = this.renderClock.sample(frameNow);
    const presentationSample = this._snapshotBuffer.sample(clockSample.renderServerTimeMs);

    // Apply the presentation sample to the render transform cache.
    const olderSnapshot =
      presentationSample.olderTick >= 0
        ? this._snapshotBuffer.getSnapshot(presentationSample.olderTick)
        : undefined;
    const newerSnapshot = this._snapshotBuffer.getSnapshot(presentationSample.newerTick);

    if (newerSnapshot && presentationSample.mode !== "empty") {
      this._renderTransformCache.applySample({
        alpha: presentationSample.alpha,
        mode: presentationSample.mode,
        snapReason: presentationSample.snapReason,
        olderSnapshot,
        newerSnapshot,
      });
    } else if (presentationSample.mode === "empty") {
      this._renderTransformCache.applySample({
        alpha: 0,
        mode: "empty",
        newerSnapshot: newerSnapshot ?? {
          tick: -1,
          sequence: -1,
          serverTimeMs: 0,
          entities: [],
          events: [],
          regionLoads: [],
          regionUnloads: [],
        },
      });
    }

    // Update actor scene meshes from the presentation cache.
    this.actors.updateFromCache(this._renderTransformCache, this._currentTick);

    // Build actor positions map from cache for hitsplats / XP drops / chat.
    const actorPositions = new Map<number, Vector3>();
    this._renderTransformCache.forEachPresentation((p) => {
      actorPositions.set(p.entityId, new Vector3(p.renderX, p.renderY, p.renderZ));
    });

    // Keep the camera centred on the local player. The interpolated visual
    // position is presentational only and never feeds gameplay truth.
    const selfPresentation = this._renderTransformCache.getPresentation(this._selfEntityId);
    if (selfPresentation) {
      this.renderer.cameraController.followTarget(
        new Vector3(selfPresentation.renderX, selfPresentation.renderY, selfPresentation.renderZ),
      );
    }

    this.projectiles.update(clockSample.renderServerTimeMs);
    this.hitsplats.update(this._currentTick, clockSample.renderServerTimeMs, actorPositions);
    this.xpDrops.update(this._currentTick, actorPositions);
    this.chatOverhead.update(actorPositions);
    this._hoverHighlighter.updateFromCache(this._renderTransformCache);
    this._clickMarkers.update(clockSample.renderServerTimeMs);
    this._updateOverlay(clockSample, presentationSample, queueStats, stats);
  }

  private _applyPresentationEvents(): void {
    for (const event of this._presentationEventQueue) {
      this._applyPresentationEvent(event);
    }
    this._presentationEventQueue.length = 0;
  }

  private _applyDebugEvents(): void {
    for (const event of this._debugEventQueue) {
      this._applyDebugEvent(event);
    }
    this._debugEventQueue.length = 0;
  }

  private _applyPresentationEvent(event: PresentationEvent): void {
    switch (event.type) {
      case "actors.clear":
        this.actors.clear();
        break;
      case "actors.spawn": {
        const p = event.payload as {
          entityId: number;
          tile: TileCoord;
          defId: string | undefined;
          isLocalPlayer: boolean;
          kind: "player" | "npc";
        };
        this.actors.spawn(p.entityId, p.tile, p.defId, p.isLocalPlayer, p.kind);
        break;
      }
      case "actors.remove":
        this.actors.remove((event.payload as { entityId: number }).entityId);
        break;
      case "actors.updateTile": {
        const p = event.payload as { entityId: number; tile: TileCoord };
        this.actors.updateTile(p.entityId, p.tile);
        break;
      }
      case "actors.updateFacing": {
        const p = event.payload as { entityId: number; direction: number };
        this.actors.updateFacing(p.entityId, p.direction);
        break;
      }
      case "actors.updateHealthBar": {
        const p = event.payload as { entityId: number; health: number; maxHealth: number };
        this.actors.updateHealthBar(p.entityId, p.health, p.maxHealth);
        break;
      }
      case "actors.notifyHit": {
        const p = event.payload as { entityId: number; tick: number };
        this.actors.notifyHit(p.entityId, p.tick);
        break;
      }
      case "actors.updateAppearance": {
        const p = event.payload as {
          entityId: number;
          appearance: { name?: string; bodyId?: string; colors?: readonly number[] };
        };
        this.actors.updateAppearance(p.entityId, p.appearance);
        break;
      }
      case "actors.updateAnimation": {
        const p = event.payload as { entityId: number; state: string };
        this.actors.updateAnimation(
          p.entityId,
          p.state as import("./scene/ActorRenderer").AnimationState,
        );
        break;
      }
      case "actors.updateMoveSpeed": {
        const p = event.payload as {
          entityId: number;
          speed: import("@old-town/shared").MoveSpeed;
        };
        this.actors.updateMoveSpeed(p.entityId, p.speed);
        break;
      }
      case "actors.hide":
        this.actors.hide((event.payload as { entityId: number }).entityId);
        break;
      case "actors.show":
        this.actors.show((event.payload as { entityId: number }).entityId);
        break;
      case "objects.clear":
        this.objects.clear();
        break;
      case "objects.spawn": {
        const p = event.payload as { entityId: number; tile: TileCoord; defId: string };
        this.objects.spawn(p.entityId, p.tile, p.defId);
        break;
      }
      case "objects.remove":
        this.objects.remove((event.payload as { entityId: number }).entityId);
        break;
      case "objects.transform": {
        const p = event.payload as { entityId: number; defId: string };
        this.objects.transform(p.entityId, p.defId);
        break;
      }
      case "groundItems.clear":
        this.groundItems.clear();
        break;
      case "groundItems.spawn": {
        const p = event.payload as {
          entityId: number;
          tile: TileCoord;
          defId: string;
          quantity: number;
        };
        this.groundItems.spawn(p.entityId, p.tile, p.defId, p.quantity);
        break;
      }
      case "groundItems.remove":
        this.groundItems.remove((event.payload as { entityId: number }).entityId);
        break;
      case "hitsplats.clear":
        this.hitsplats.clear();
        break;
      case "hitsplats.show": {
        const p = event.payload as {
          entityId: number;
          amount: number;
          type: import("@old-town/shared").HitsplatType | undefined;
          tick: number;
        };
        this.hitsplats.show(p.entityId, p.amount, p.type ?? "damage", p.tick);
        break;
      }
      case "xpDrops.clear":
        this.xpDrops.clear();
        break;
      case "xpDrops.show": {
        const p = event.payload as {
          entityId: number;
          skillId: string;
          amount: number;
          tick: number;
        };
        this.xpDrops.show(p.entityId, p.skillId, p.amount, p.tick);
        break;
      }
      case "projectiles.clear":
        this.projectiles.clear();
        break;
      case "projectiles.spawn": {
        const p = event.payload as {
          id: string;
          startTile: TileCoord;
          endTile: TileCoord;
          startTick: number;
          hitTick: number;
        };
        this.projectiles.spawn(p.id, p.startTile, p.endTile, p.startTick, p.hitTick);
        break;
      }
      case "chatOverhead.clear":
        this.chatOverhead.clear();
        break;
      case "chatOverhead.show": {
        const p = event.payload as { entityId: number; text: string };
        const actor = this.actors.getActorState(p.entityId);
        if (actor) {
          this.chatOverhead.show(p.entityId, p.text, actor.visualPosition);
        }
        break;
      }
      case "region.load": {
        const p = event.payload as {
          regionId: string;
          chunks: readonly import("@old-town/shared").ChunkData[];
        };
        this._pendingRegionLoads.push(p);
        break;
      }
      case "region.unload": {
        const p = event.payload as { regionId: string };
        this._pendingRegionUnloads.push(p);
        break;
      }
    }
  }

  private _applyDebugEvent(event: PresentationEvent): void {
    if (!this.debug) return;
    switch (event.type) {
      case "debug.clear":
        this.debug.clear();
        break;
      case "debug.markPathTile":
        this.debug.markPathTile((event.payload as { tile: TileCoord }).tile);
        break;
      case "debug.markTrueTile": {
        const p = event.payload as { tile: TileCoord; entityId: number };
        this.debug.markTrueTile(p.tile, p.entityId);
        break;
      }
      case "debug.markCollisionTile":
        this.debug.markCollisionTile((event.payload as { tile: TileCoord }).tile);
        break;
      case "debug.markFootprint":
        this.debug.markFootprint((event.payload as { tile: TileCoord }).tile);
        break;
      case "debug.markReachTiles": {
        const p = event.payload as { center: TileCoord; radius: number };
        this.debug.markReachTiles(p.center, p.radius);
        break;
      }
      case "debug.markLoSRay": {
        const p = event.payload as {
          start: { x: number; y: number; z: number };
          end: { x: number; y: number; z: number };
        };
        const start = new Vector3(p.start.x, p.start.y, p.start.z);
        const end = new Vector3(p.end.x, p.end.y, p.end.z);
        this.debug.markLoSRay(start, end);
        break;
      }
      case "debug.setActionQueue":
        this.debug.setActionQueue((event.payload as { queue: string[] }).queue);
        break;
      case "debug.setCombatCooldown":
        this.debug.setCombatCooldown((event.payload as { ticks: number }).ticks);
        break;
      case "debug.setPendingHits":
        this.debug.setPendingHits((event.payload as { hits: Map<string, number> }).hits);
        break;
      case "debug.setNpcLeash":
        this.debug.setNpcLeash((event.payload as { tile: TileCoord }).tile);
        break;
      case "debug.setVarbits":
        this.debug.setVarbits((event.payload as { vars: Map<string, number> }).vars);
        break;
    }
  }

  private _updateOverlay(
    clockSample?: import("./renderer/RenderClock").RenderClockSample,
    presentationSample?: import("./net/SnapshotBuffer").PresentationSample,
    queueStats?: import("./renderer/ChunkBakeQueue").ChunkBakeQueueStats,
    residencyStats?: import("./renderer/ChunkResidencyManager").ChunkResidencyStats,
  ): void {
    if (this._connected) {
      this._overlays.connectionStatus.textContent = "Connected";
      this._overlays.connectionStatus.className = "connected";
    } else {
      this._overlays.connectionStatus.textContent = "Disconnected";
      this._overlays.connectionStatus.className = "disconnected";
    }
    this._overlays.tickStatus.textContent = `Tick: ${this._currentTick}`;
    this._overlays.fpsStatus.textContent = `FPS: ${this.renderer.fps}`;

    const selfActor = this.actors.getActorState(this._selfEntityId);
    if (selfActor) {
      const debug = document.getElementById("debug-overlay");
      if (debug?.classList.contains("visible") && !this._debugOverlayUpdatePending) {
        this._debugOverlayUpdatePending = true;
        const doUpdate = () => {
          this._debugOverlayUpdatePending = false;
          const cx = Math.floor(selfActor.serverTile.x / 8);
          const cy = Math.floor(selfActor.serverTile.y / 8);
          const rx = Math.floor(selfActor.serverTile.x / 64);
          const ry = Math.floor(selfActor.serverTile.y / 64);
          const renderStats = this.renderer.debugCounters();
          const lines = [
            `Tick: ${this._currentTick}`,
            `Ping: ${Math.round(this._lastPingRtt)}ms`,
            `Frame: ${renderStats.frameTimeMs.toFixed(1)}ms`,
            `Draw calls: ${renderStats.drawCalls}`,
            `Geometries: ${renderStats.geometries}`,
            `Textures: ${renderStats.textures}`,
            `Actors: ${this.actors.actorCount}`,
            `Objects: ${this.objects.objectCount}`,
            `Chunks: ${this.terrain.loadedChunkCount}`,
            `True tile: (${selfActor.serverTile.x}, ${selfActor.serverTile.y}, ${selfActor.serverTile.plane})`,
            `Visual: (${selfActor.visualPosition.x.toFixed(1)}, ${selfActor.visualPosition.y.toFixed(1)}, ${selfActor.visualPosition.z.toFixed(1)})`,
            `Region: ${rx}:${ry}:${selfActor.serverTile.plane}`,
            `Chunk: ${cx}:${cy}:${selfActor.serverTile.plane}`,
            `Facing: ${selfActor.facingDirection}`,
            `Anim: ${selfActor.animationState}`,
          ];
          if (clockSample && presentationSample) {
            lines.push(`Snapshot depth: ${this._snapshotBuffer.depth}`);
            lines.push(`Presentation mode: ${presentationSample.mode}`);
            lines.push(`Render server time: ${clockSample.renderServerTimeMs.toFixed(0)}ms`);
            lines.push(`Latest accepted tick: ${this._snapshotBuffer.latestAcceptedTick}`);
            lines.push(`Interpolation alpha: ${presentationSample.alpha.toFixed(3)}`);
            if (presentationSample.snapReason) {
              lines.push(`Snap reason: ${presentationSample.snapReason}`);
            }
          }
          if (queueStats) {
            lines.push(`Bake queued: ${queueStats.queued}`);
            lines.push(`Bake baking: ${queueStats.baking}`);
            lines.push(`Bake waitingUpload: ${queueStats.waitingUpload}`);
            lines.push(`Bake resident: ${queueStats.resident}`);
            lines.push(`Bake visible: ${queueStats.visible}`);
            lines.push(`Bake hidden: ${queueStats.hiddenResident}`);
            lines.push(`Bake evictPending: ${queueStats.evictPending}`);
            lines.push(`Bake failed: ${queueStats.failed}`);
          }
          if (residencyStats) {
            lines.push(`Residency visible: ${residencyStats.visible}`);
            lines.push(`Residency hidden: ${residencyStats.hiddenResident}`);
            lines.push(
              `Residency GPU: ${(residencyStats.approximateGpuBytes / 1024 / 1024).toFixed(1)}MB`,
            );
          }
          if (this.debug) {
            const queue = this.debug.getActionQueue();
            if (queue.length > 0) {
              lines.push(`Action queue: ${queue.join(", ")}`);
            }
            const cooldown = this.debug.getCombatCooldown();
            if (cooldown > 0) {
              lines.push(`Combat cooldown: ${cooldown}`);
            }
            const hits = this.debug.getPendingHits();
            if (hits.size > 0) {
              const hitLines = Array.from(hits.entries()).map(
                ([target, amount]) => `Pending hit ${target}: ${amount}`,
              );
              lines.push(...hitLines);
            }
            const leash = this.debug.getNpcLeash();
            if (leash) {
              lines.push(`NPC leash: (${leash.x}, ${leash.y})`);
            }
            const vars = this.debug.getVarbits();
            if (vars.size > 0) {
              const varLines = Array.from(vars.entries()).map(
                ([varId, value]) => `Var ${varId}: ${value}`,
              );
              lines.push(...varLines);
            }
          }
          const stats = document.getElementById("debug-stats");
          if (stats) {
            stats.innerHTML = lines.map((line) => `<div>${line}</div>`).join("");
          }
        };
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(doUpdate);
        } else {
          setTimeout(doUpdate, 0);
        }
      }
    }
  }
}
