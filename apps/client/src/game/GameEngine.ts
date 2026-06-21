import {
  chunkToRegion,
  type CombatStyle,
  type FullStatePacket,
  GAME_TICK_MS,
  type Plane,
  type RegionId,
  regionId,
  type SpellTarget,
  TILE_SIZE_WORLD_UNITS,
  type TickDeltaPacket,
  type TileCoord,
} from "@old-town/shared";
import { Vector3 } from "three";
import {
  calculateCombatLevel,
  type ClientDecision,
  InputInterpreter,
  type InputInterpreterSettings,
  type MenuResolveState,
} from "./input/InputInterpreter";
import { ClientCommandDispatcher } from "./net/ClientCommandDispatcher";
import type { DebugEvent, PresentationEvent } from "./net/presentation-events";
import { ClientPacketApplier } from "./net/ClientPacketApplier";
import { ClientPacketIngestor } from "./net/ClientPacketIngestor";
import { ClientWorldStore } from "./net/ClientWorldStore";
import { GameSocket } from "./net/GameSocket";
import { SnapshotBuffer } from "./net/SnapshotBuffer";
import { EntityPicker, type PickedEntity } from "./picking/EntityPicker";
import { ChunkBakeQueue, type ChunkMetadata } from "./renderer/ChunkBakeQueue";
import {
  ChunkBakeWorkerClient,
  createSynchronousTestClient,
} from "./renderer/ChunkBakeWorkerClient";
import { ChunkResidencyManager } from "./renderer/ChunkResidencyManager";
import { ChunkUploadQueue } from "./renderer/ChunkUploadQueue";
import { MaterialColorResolver } from "./renderer/MaterialColorResolver";
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
import { IconTextureFactory } from "./scene/IconTextureFactory";
import { ObjectRenderer } from "./scene/ObjectRenderer";
import { ProjectileLayer } from "./scene/ProjectileLayer";
import { TerrainLayer } from "./scene/TerrainLayer";
import { XpDropLayer } from "./scene/XpDropLayer";
import { ContentClient } from "./ui/ContentClient";
import { ContextMenu } from "./ui/ContextMenu";
import { DebugOverlay } from "./ui/DebugOverlay";
import { GlobalKeydownBus } from "./ui/GlobalKeydownBus";
import { IconAtlas } from "./ui/IconAtlas";
import { UIManager, type UIManagerCallbacks } from "./ui/UIManager";
import { UIState } from "./ui/UIState";

export interface GameEngineOptions {
  readonly canvas: HTMLCanvasElement;
  readonly statusOverlay: HTMLDivElement;
  readonly debugOverlay: HTMLDivElement;
  readonly serverUrl: string;
  readonly characterId?: string;
}

/**
 * How far behind estimated server time the client renders, in milliseconds.
 *
 * A full tick (600 ms) is the bare minimum: it makes render time reach the
 * newest snapshot exactly when the next one is due, so any late/bursty arrival
 * (server tick-loop catch-up, GC, network jitter) drops it past the newest
 * snapshot and the actor freezes/teleports. Rendering 1.5 ticks behind keeps a
 * bracketing snapshot pair available plus half a tick of jitter slack, while
 * staying responsive enough for an OSRS-style tick game. RenderClock and
 * SnapshotBuffer must use the same value.
 */
const INTERPOLATION_DELAY_MS = Math.round(GAME_TICK_MS * 1.5);

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
  readonly icons = new IconAtlas();
  readonly iconTextures = new IconTextureFactory();
  readonly renderClock: RenderClock;
  private readonly socket: GameSocket;
  private readonly _dispatcher: ClientCommandDispatcher;
  private readonly _inputInterpreter: InputInterpreter;
  private readonly _packetIngestor: ClientPacketIngestor;
  private readonly _snapshotBuffer: SnapshotBuffer;
  private readonly _renderTransformCache: RenderTransformCache;
  private readonly _overlay: DebugOverlay;
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
  private _spellTargetMode: { readonly spellId: string } | undefined;
  private _itemTargetMode: { readonly itemUid: number } | undefined;
  private readonly _presentationEventQueue: PresentationEvent[] = [];
  private readonly _debugEventQueue: DebugEvent[] = [];
  private readonly _chunkBakeQueue: ChunkBakeQueue;
  private readonly _chunkBakeWorker: ChunkBakeWorkerClient;
  private readonly _chunkUploadQueue: ChunkUploadQueue;
  private readonly _chunkResidency: ChunkResidencyManager;
  private readonly _registry: RenderResourceRegistry;
  private _colorResolver: MaterialColorResolver = new MaterialColorResolver({});
  private readonly _pendingRegionLoads: Array<{
    regionId: string;
    chunks: readonly import("@old-town/shared").ChunkData[];
  }> = [];
  private readonly _pendingRegionUnloads: Array<{ regionId: string }> = [];
  private readonly _loadedChunkData = new Map<string, import("@old-town/shared").ChunkData>();
  private readonly _actorPositions = new Map<number, Vector3>();
  private readonly _seenActorPositionIds = new Set<number>();
  private readonly _cameraFollowTarget = new Vector3();
  private _frameId = 0;

  constructor(options: GameEngineOptions) {
    const { canvas, statusOverlay, debugOverlay, serverUrl, characterId } = options;
    this._canvas = canvas;

    this.renderer = new ThreeRenderer({ canvas });
    this._registry = new RenderResourceRegistry();
    this.terrain = new TerrainLayer({ scene: this.renderer.scene, colorResolver: this._colorResolver });
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
      colorResolver: this._colorResolver,
    });
    this._chunkUploadQueue = uploadQueue;
    this._chunkResidency = new ChunkResidencyManager({
      chunkBakeQueue: this._chunkBakeQueue,
      chunkUploadQueue: uploadQueue,
      visibleRadiusTiles: 64,
      residentRadiusTiles: 128,
      maxGpuBytes: 256 * 1024 * 1024,
      onDisposeChunk: (chunkId) => {
        this.terrain.unloadChunk(chunkId);
      },
    });
    this._chunkBakeWorker =
      import.meta.env.DEV && import.meta.env.VITEST
        ? createSynchronousTestClient(
            (_jobId, _regionId, chunkCoord, payload) => {
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
            onSuccess: (_jobId, _regionId, chunkCoord, payload) => {
              const cid =
                `${chunkCoord.cx}:${chunkCoord.cy}:${chunkCoord.plane}` as import("@old-town/shared").ChunkId;
              this._chunkUploadQueue.enqueueBakedChunk(cid, payload);
            },
            onFailure: (_jobId, _regionId, chunkCoord, _errorCode, _message) => {
              const cid =
                `${chunkCoord.cx}:${chunkCoord.cy}:${chunkCoord.plane}` as import("@old-town/shared").ChunkId;
              this._chunkBakeQueue.onWorkerFailed(cid);
            },
          });
    this.socket = new GameSocket(serverUrl, { characterId });
    this._dispatcher = new ClientCommandDispatcher(this.socket);
    this._inputInterpreter = new InputInterpreter(this.content, UIManager.loadInputSettings());

    this.renderClock = new RenderClock({
      tickMs: GAME_TICK_MS,
      interpolationDelayMs: INTERPOLATION_DELAY_MS,
      maxFrameDeltaMs: 100,
      serverTimeSmoothing: 0.1,
    });

    const store = new ClientWorldStore();
    this._snapshotBuffer = new SnapshotBuffer({
      tickMs: GAME_TICK_MS,
      interpolationDelayMs: INTERPOLATION_DELAY_MS,
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

    this._overlay = new DebugOverlay({ statusOverlay, debugOverlay });
    this._entityPicker = new EntityPicker({ camera: this.renderer.camera, canvas });
    this._hoverHighlighter = new HoverHighlighter({ scene: this.renderer.scene });
    this._contextMenu = new ContextMenu({
      container: document.body,
      callbacks: {
        onOptionSelected: (actionId, entity, tile) => {
          const decision = this._inputInterpreter.interpretContextMenu(
            entity,
            tile,
            actionId,
            this._spellTargetMode,
            this._itemTargetMode,
          );
          this._applyDecision(decision);
          if (decision.type === "move") {
            this._showClickMarker(decision.tile);
            this._packetIngestor.recordClickTile(decision.tile, this._currentTick);
            this._logDebug(`Context: Walk here (${decision.tile.x}, ${decision.tile.y})`);
          }
          if (decision.type === "castSpell") {
            this._spellTargetMode = undefined;
            this._updateSpellTargetOverlay();
            this._logDebug(`Context: cast ${decision.spellId}`);
          }
          if (decision.type === "useItemOn") {
            this._dispatcher.useItemOn(decision.itemUid, decision.target);
            this._itemTargetMode = undefined;
            this._updateItemTargetOverlay();
            this._logDebug(`Context: use item ${decision.itemUid} on ${decision.target.kind}`);
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
    this._overlay.update({
      nowMs: performance.now(),
      connected: this._connected,
      currentTick: this._currentTick,
      fps: this.renderer.fps,
      selfActor: undefined,
      pingRtt: this._lastPingRtt,
      renderStats: this.renderer.debugCounters(),
      actorCount: this.actors.actorCount,
      objectCount: this.objects.objectCount,
      loadedChunkCount: this.terrain.loadedChunkCount,
      snapshotDepth: this._snapshotBuffer.depth,
      latestAcceptedTick: this._snapshotBuffer.latestAcceptedTick,
    });

    const contentLoad = this.content.load(this.socket.httpUrl).then(() => {
      this._colorResolver = new MaterialColorResolver(this.content.getAllMaterials());
      this.terrain.setColorResolver(this._colorResolver);
      this._chunkUploadQueue.setColorResolver(this._colorResolver);
    }).catch((error) => {
      console.warn("Failed to load content registries:", error);
    });
    const iconLoad = this.icons.load(this.socket.httpUrl).catch((error) => {
      console.warn("Failed to load icon atlas:", error);
    });
    const iconTextureLoad = this.iconTextures
      .load(this.socket.httpUrl)
      .then(() => {
        this.groundItems.setIconResolver((assetId) => this.iconTextures.resolveTexture(assetId));
      })
      .catch((error) => {
        console.warn("Failed to load icon textures:", error);
      });
    let fullState: FullStatePacket | undefined;
    try {
      fullState = await this.socket.connect();
    } catch (error) {
      console.error("Failed to connect to server:", error);
      this._overlay.setConnectionFailed();
      throw error;
    }
    this._handleFullState(fullState);
    await contentLoad;
    await iconLoad;
    await iconTextureLoad;

    const uiCallbacks: UIManagerCallbacks = {
      sendItemCommand: (uid, actionId) => this.sendItemCommand(uid, actionId),
      sendChatCommand: (text) => this.sendChatCommand(text),
      enterSpellTargetMode: (spellId) => this.enterSpellTargetMode(spellId),
      enterItemTargetMode: (itemUid) => this.enterItemTargetMode(itemUid),
      sendUiActionCommand: (action, targetId, value) =>
        this.sendUiActionCommand(action, targetId, value),
      sendBankCommand: (action, itemUid, quantity) =>
        this.sendBankCommand(action, itemUid, quantity),
      sendShopCommand: (action, itemId, quantity) => this.sendShopCommand(action, itemId, quantity),
      sendRecipeCommand: (recipeId, stationEntityId) =>
        this.sendRecipeCommand(recipeId, stationEntityId),
      sendSetCombatStyle: (style) => this.sendSetCombatStyle(style),
      setInputSettings: (settings) => this.setInputSettings(settings),
    };
    this._uiManager = new UIManager(this.uiState, this.content, uiCallbacks, this.icons);

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
      this._overlay.update({
        nowMs: performance.now(),
        connected: this._connected,
        currentTick: this._currentTick,
        fps: this.renderer.fps,
        selfActor: undefined,
        pingRtt: this._lastPingRtt,
        renderStats: this.renderer.debugCounters(),
        actorCount: this.actors.actorCount,
        objectCount: this.objects.objectCount,
        loadedChunkCount: this.terrain.loadedChunkCount,
        snapshotDepth: this._snapshotBuffer.depth,
        latestAcceptedTick: this._snapshotBuffer.latestAcceptedTick,
      });
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
    this._uiManager?.openDefaultPanels();
    this._overlay.update({
      nowMs: performance.now(),
      connected: this._connected,
      currentTick: this._currentTick,
      fps: this.renderer.fps,
      selfActor: undefined,
      pingRtt: this._lastPingRtt,
      renderStats: this.renderer.debugCounters(),
      actorCount: this.actors.actorCount,
      objectCount: this.objects.objectCount,
      loadedChunkCount: this.terrain.loadedChunkCount,
      snapshotDepth: this._snapshotBuffer.depth,
      latestAcceptedTick: this._snapshotBuffer.latestAcceptedTick,
    });
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
    this._overlay.dispose();
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
    this.iconTextures.dispose();
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
      const decision = this._inputInterpreter.interpretEscape(
        this._spellTargetMode,
        this._itemTargetMode,
      );
      if (decision.type === "cancelSpellTarget") {
        this._spellTargetMode = undefined;
        this._logDebug("Spell target mode cancelled");
        this._updateSpellTargetOverlay();
      }
      if (decision.type === "cancelItemTarget") {
        this._itemTargetMode = undefined;
        this._logDebug("Item target mode cancelled");
        this._updateItemTargetOverlay();
      }
    }
  };

  private _updateSpellTargetOverlay(): void {
    const overlay = document.getElementById("spell-target-overlay");
    if (overlay) {
      overlay.classList.toggle("visible", !!this._spellTargetMode);
    }
  }

  private _updateItemTargetOverlay(): void {
    const overlay = document.getElementById("item-target-overlay");
    if (overlay) {
      overlay.classList.toggle("visible", !!this._itemTargetMode);
    }
  }

  private _handleCanvasClick = (event: MouseEvent): void => {
    if (!this._connected) return;

    const entity = this._pickEntityAt(event.clientX, event.clientY);
    const tile = this.renderer.tilePicker.screenToTile(event.clientX, event.clientY);
    const menuState = this._getMenuResolveState();
    if (this._inputInterpreter.shouldOpenMenuOnPrimaryClick()) {
      const resolveState: MenuResolveState = this._spellTargetMode
        ? { ...menuState, spellMode: this._spellTargetMode }
        : this._itemTargetMode
          ? { ...menuState, itemMode: this._itemTargetMode }
          : menuState;
      const options = this._inputInterpreter.getContextMenuOptions(entity, tile, resolveState);
      this._contextMenu.show(event.clientX, event.clientY, options, entity, tile);
      return;
    }
    const playerTile =
      entity?.kind === "player"
        ? (this.actors.getActorState(entity.entityId)?.serverTile ?? null)
        : null;
    const decision = this._inputInterpreter.interpretCanvasClick(
      entity,
      tile,
      playerTile,
      this._spellTargetMode,
      this._itemTargetMode,
      menuState,
    );

    if (decision.type === "castSpell") {
      this._dispatcher.castSpell(decision.spellId, decision.target);
      this._spellTargetMode = undefined;
      this._updateSpellTargetOverlay();
      this._logDebug(`Spell target: ${decision.target.kind}`);
      return;
    }

    if (decision.type === "useItemOn") {
      this._dispatcher.useItemOn(decision.itemUid, decision.target);
      this._itemTargetMode = undefined;
      this._updateItemTargetOverlay();
      this._logDebug(`Item target: ${decision.target.kind}`);
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
    const tooltip = document.getElementById("hover-tooltip");
    if (entity) {
      const pos = this._getEntityWorldPosition(entity);
      if (pos) {
        const yOffset = entity.kind === "player" || entity.kind === "npc" ? 0.8 : 0.05;
        this._hoverHighlighter.highlight(pos, yOffset);
        this._hoverHighlighter.setTargetEntityId(entity.entityId);
      }
      if (tooltip) {
        const name = this._inputInterpreter.getEntityName(entity);
        if (name) {
          tooltip.textContent = name;
          tooltip.style.left = `${event.clientX + 12}px`;
          tooltip.style.top = `${event.clientY + 12}px`;
          tooltip.classList.remove("hidden");
        } else {
          tooltip.classList.add("hidden");
        }
      }
    } else {
      this._hoverHighlighter.hide();
      if (tooltip) {
        tooltip.classList.add("hidden");
      }
    }
  };

  private _handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    if (!this._connected) return;

    const entity = this._pickEntityAt(event.clientX, event.clientY);
    const tile = this.renderer.tilePicker.screenToTile(event.clientX, event.clientY);
    const menuState = this._getMenuResolveState();
    const resolveState: MenuResolveState = this._spellTargetMode
      ? { ...menuState, spellMode: this._spellTargetMode }
      : this._itemTargetMode
        ? { ...menuState, itemMode: this._itemTargetMode }
        : menuState;
    const options = this._inputInterpreter.getContextMenuOptions(entity, tile, resolveState);
    this._contextMenu.show(event.clientX, event.clientY, options, entity, tile);
  };

  setInputSettings(settings: Partial<InputInterpreterSettings>): void {
    this._inputInterpreter.setSettings(settings);
  }

  private _getMenuResolveState(): MenuResolveState {
    return { playerCombatLevel: calculateCombatLevel(this.uiState.skills) };
  }

  private _pickEntityAt(
    screenX: number,
    screenY: number,
  ): PickedEntity | null {
    const actorTargets = this.actors.getRaycastTargets();
    const objectTargets = this.objects.getRaycastTargets();
    const groundItemTargets = this.groundItems.getRaycastTargets();
    const meshes = [...actorTargets, ...objectTargets, ...groundItemTargets];
    return this._entityPicker.pick(screenX, screenY, meshes);
  }

  private _getEntityWorldPosition(
    entity: PickedEntity,
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
      case "useItemOn":
        this._dispatcher.useItemOn(decision.itemUid, decision.target);
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
      case "cancelItemTarget":
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

  enterItemTargetMode(itemUid: number): void {
    this._itemTargetMode = { itemUid };
    this._updateItemTargetOverlay();
    this._logDebug(`Item target mode: item ${itemUid}`);
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

  sendSetCombatStyle(style: CombatStyle): void {
    this._dispatcher.setCombatStyle(style);
    this._logDebug(`UI: combatStyle ${style}`);
  }

  private _logDebug(message: string): void {
    const log = document.getElementById("debug-log");
    if (!log) return;
    const entry = document.createElement("div");
    entry.textContent = `[T${this._currentTick}] ${message}`;
    entry.classList.add("debug-log-entry");
    log.appendChild(entry);
    while (log.children.length > 50) {
      if (log.firstChild) {
        log.removeChild(log.firstChild);
      }
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
      for (const chunk of load.chunks) {
        this._loadedChunkData.set(this._chunkKey(chunk.cx, chunk.cy, plane), chunk);
      }
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
      const chunk = this._loadedChunkData.get(job.chunkId);
      if (metadata.length >= 2) {
        this._chunkBakeWorker.submit({
          type: "bake_chunk",
          regionId: job.regionId,
          chunkCoord: {
            cx: metadata[0] as number,
            cy: metadata[1] as number,
            plane: (metadata[2] ?? 0) as 0 | 1 | 2 | 3,
          },
          tiles: chunk?.tiles ?? [],
          objectRefs: [],
          requestVersion: 1,
          materialColors: this._chunkUploadQueue.colorRecord,
        });
      }
      job = this._chunkBakeQueue.dequeueJob();
    }

    // 2. Process GPU uploads
    this._chunkUploadQueue.processFrame(frameNow);
    this._chunkResidency.forEachChunk((chunkId, state) => {
      if (state !== "unseen") return;
      const group = this._chunkUploadQueue.getChunkGroup(chunkId);
      if (group) {
        this._chunkResidency.onGpuResident(chunkId, 0);
      }
    });

    // 3. Evaluate residency and visibility
    this._chunkResidency.evaluate(this._frameId);

    // 4. Sync terrain visibility with chunk residency
    const stats = this._chunkResidency.getStats();
    const queueStats = this._chunkBakeQueue.getStats();
    const regionVisibility = new Map<RegionId, boolean>();
    this._chunkResidency.forEachChunk((chunkId, state, metadata) => {
      if (state === "visible") {
        const group = this._chunkUploadQueue.getChunkGroup(chunkId);
        if (group) {
          this.terrain.addBakedChunk(chunkId, group);
        }
      } else if (state === "hidden_resident" || state === "evict_pending") {
        this.terrain.unloadChunk(chunkId);
      }

      const region = this._regionIdForChunk(metadata);
      regionVisibility.set(region, (regionVisibility.get(region) ?? false) || state === "visible");
    });
    for (const [region, visible] of regionVisibility) {
      this.objects.setRegionVisible(region, visible);
    }

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
    this._seenActorPositionIds.clear();
    this._renderTransformCache.forEachPresentation((p) => {
      if (p.kind !== "player" && p.kind !== "npc" && p.kind !== "creature") return;
      let position = this._actorPositions.get(p.entityId);
      if (!position) {
        position = new Vector3();
        this._actorPositions.set(p.entityId, position);
      }
      position.set(p.renderX, p.renderY, p.renderZ);
      this._seenActorPositionIds.add(p.entityId);
    });
    for (const entityId of this._actorPositions.keys()) {
      if (!this._seenActorPositionIds.has(entityId)) {
        this._actorPositions.delete(entityId);
      }
    }

    // Keep the camera centred on the local player. The interpolated visual
    // position is presentational only and never feeds gameplay truth.
    const selfPresentation = this._renderTransformCache.getPresentation(this._selfEntityId);
    if (selfPresentation) {
      this._cameraFollowTarget.set(
        selfPresentation.renderX,
        selfPresentation.renderY,
        selfPresentation.renderZ,
      );
      this.renderer.cameraController.followTarget(this._cameraFollowTarget);
    }

    this.projectiles.update(clockSample.renderServerTimeMs);
    this.hitsplats.update(this._currentTick, clockSample.renderServerTimeMs, this._actorPositions);
    this.xpDrops.update(this._currentTick, this._actorPositions);
    this.chatOverhead.update(this._actorPositions);
    this._hoverHighlighter.updateFromCache(this._renderTransformCache);
    this._clickMarkers.update(clockSample.renderServerTimeMs);
    this._overlay.update({
      nowMs: clockSample.rafNowMs,
      connected: this._connected,
      currentTick: this._currentTick,
      fps: this.renderer.fps,
      selfActor: selfActor
        ? {
            serverTile: selfActor.serverTile,
            visualPosition: selfActor.visualPosition,
            facingDirection: selfActor.facingDirection,
            animationState: selfActor.animationState,
          }
        : undefined,
      pingRtt: this._lastPingRtt,
      renderStats: this.renderer.debugCounters(),
      actorCount: this.actors.actorCount,
      objectCount: this.objects.objectCount,
      loadedChunkCount: this.terrain.loadedChunkCount,
      snapshotDepth: this._snapshotBuffer.depth,
      latestAcceptedTick: this._snapshotBuffer.latestAcceptedTick,
      clockSample,
      presentationSample,
      queueStats,
      residencyStats: stats,
      debugState: this.debug
        ? {
            actionQueue: this.debug.getActionQueue(),
            combatCooldown: this.debug.getCombatCooldown(),
            pendingHits: this.debug.getPendingHits(),
            npcLeash: this.debug.getNpcLeash(),
            varbits: this.debug.getVarbits(),
          }
        : undefined,
    });
  }

  private _applyPresentationEvents(): void {
    for (const event of this._presentationEventQueue) {
      this._applyPresentationEvent(event);
    }
    this._presentationEventQueue.length = 0;
  }

  private _chunkKey(cx: number, cy: number, plane: number): string {
    return `${cx}:${cy}:${plane}`;
  }

  private _regionIdForChunk(metadata: ChunkMetadata): RegionId {
    return regionId(
      chunkToRegion({
        cx: metadata.cx,
        cy: metadata.cy,
        plane: metadata.plane as Plane,
      }),
    );
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
      case "actors.spawn":
        this.actors.spawn(
          event.payload.entityId,
          event.payload.tile,
          event.payload.defId,
          event.payload.isLocalPlayer,
          event.payload.kind,
        );
        break;
      case "actors.remove":
        this.actors.remove(event.payload.entityId);
        break;
      case "actors.updateTile":
        this.actors.updateTile(event.payload.entityId, event.payload.tile);
        break;
      case "actors.updateFacing":
        this.actors.updateFacing(event.payload.entityId, event.payload.direction);
        break;
      case "actors.updateHealthBar":
        this.actors.updateHealthBar(
          event.payload.entityId,
          event.payload.health,
          event.payload.maxHealth,
        );
        break;
      case "actors.notifyHit":
        this.actors.notifyHit(event.payload.entityId, event.payload.tick);
        break;
      case "actors.updateAppearance":
        this.actors.updateAppearance(event.payload.entityId, event.payload.appearance);
        break;
      case "actors.setWeaponModel": {
        const modelAssetId = event.payload.weaponItemId
          ? (this.content.getItem(event.payload.weaponItemId)?.model ?? null)
          : null;
        this.actors.setWeaponModel(event.payload.entityId, modelAssetId);
        break;
      }
      case "actors.setArmourModel": {
        const modelAssetId = event.payload.itemId
          ? (this.content.getItem(event.payload.itemId)?.model ?? null)
          : null;
        this.actors.setArmourModel(event.payload.entityId, event.payload.slot, modelAssetId);
        break;
      }
      case "actors.setAccessoryModel": {
        const modelAssetId = event.payload.itemId
          ? (this.content.getItem(event.payload.itemId)?.model ?? null)
          : null;
        this.actors.setAccessoryModel(event.payload.entityId, event.payload.slot, modelAssetId);
        break;
      }
      case "actors.updateAnimation":
        this.actors.playAction(
          event.payload.entityId,
          event.payload.animationId,
          event.payload.startTick,
        );
        break;
      case "actors.updateMoveSpeed":
        this.actors.updateMoveSpeed(event.payload.entityId, event.payload.speed);
        break;
      case "actors.hide":
        this.actors.hide(event.payload.entityId);
        break;
      case "actors.show":
        this.actors.show(event.payload.entityId);
        break;
      case "objects.clear":
        this.objects.clear();
        break;
      case "objects.spawn":
        this.objects.spawn(event.payload.entityId, event.payload.tile, event.payload.defId);
        break;
      case "objects.remove":
        this.objects.remove(event.payload.entityId);
        break;
      case "objects.transform":
        this.objects.transform(event.payload.entityId, event.payload.defId);
        break;
      case "objects.updateDoorState":
        this.objects.updateDoorState(event.payload.entityId, event.payload.isOpen);
        break;
      case "groundItems.clear":
        this.groundItems.clear();
        break;
      case "groundItems.spawn": {
        const iconAssetId = this.content.getItem(event.payload.defId)?.icon ?? undefined;
        this.groundItems.spawn(
          event.payload.entityId,
          event.payload.tile,
          event.payload.defId,
          event.payload.quantity,
          iconAssetId,
        );
        break;
      }
      case "groundItems.remove":
        this.groundItems.remove(event.payload.entityId);
        break;
      case "hitsplats.clear":
        this.hitsplats.clear();
        break;
      case "hitsplats.show":
        this.hitsplats.show(
          event.payload.entityId,
          event.payload.amount,
          event.payload.type,
          event.payload.tick,
        );
        break;
      case "xpDrops.clear":
        this.xpDrops.clear();
        break;
      case "xpDrops.show":
        this.xpDrops.show(
          event.payload.entityId,
          event.payload.skillId,
          event.payload.amount,
          event.payload.tick,
        );
        break;
      case "projectiles.clear":
        this.projectiles.clear();
        break;
      case "projectiles.spawn":
        this.projectiles.spawn(
          event.payload.id,
          event.payload.startTile,
          event.payload.endTile,
          event.payload.startTick,
          event.payload.hitTick,
        );
        break;
      case "chatOverhead.clear":
        this.chatOverhead.clear();
        break;
      case "chatOverhead.show": {
        const actor = this.actors.getActorState(event.payload.entityId);
        if (actor) {
          this.chatOverhead.show(event.payload.entityId, event.payload.text, actor.visualPosition);
        }
        break;
      }
      case "region.load":
        this._pendingRegionLoads.push(event.payload);
        break;
      case "region.unload":
        this._pendingRegionUnloads.push(event.payload);
        break;
    }
  }

  private _applyDebugEvent(event: DebugEvent): void {
    if (!this.debug) return;
    switch (event.type) {
      case "debug.clear":
        this.debug.clear();
        break;
      case "debug.markPathTile":
        this.debug.markPathTile(event.payload.tile);
        break;
      case "debug.markTrueTile":
        this.debug.markTrueTile(event.payload.tile, event.payload.entityId);
        break;
      case "debug.markCollisionTile":
        this.debug.markCollisionTile(event.payload.tile);
        break;
      case "debug.markFootprint":
        this.debug.markFootprint(event.payload.tile);
        break;
      case "debug.markReachTiles":
        this.debug.markReachTiles(event.payload.center, event.payload.radius);
        break;
      case "debug.markLoSRay": {
        const start = new Vector3(event.payload.start.x, event.payload.start.y, event.payload.start.z);
        const end = new Vector3(event.payload.end.x, event.payload.end.y, event.payload.end.z);
        this.debug.markLoSRay(start, end);
        break;
      }
      case "debug.setActionQueue":
        this.debug.setActionQueue(event.payload.queue);
        break;
      case "debug.setCombatCooldown":
        this.debug.setCombatCooldown(event.payload.ticks);
        break;
      case "debug.setPendingHits":
        this.debug.setPendingHits(event.payload.hits);
        break;
      case "debug.setNpcLeash":
        this.debug.setNpcLeash(event.payload.tile);
        break;
      case "debug.setVarbits":
        this.debug.setVarbits(event.payload.vars);
        break;
    }
  }
}
