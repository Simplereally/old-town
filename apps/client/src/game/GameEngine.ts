import {
  type FullStatePacket,
  type SpellTarget,
  TILE_SIZE_WORLD_UNITS,
  type TickDeltaPacket,
  type TileCoord,
} from "@old-town/shared";
import { Mesh, MeshBasicMaterial, RingGeometry, type Vector3 } from "three";
import { type ClientDecision, InputInterpreter } from "./input/InputInterpreter";
import { ClientCommandDispatcher } from "./net/ClientCommandDispatcher";
import { ClientPacketApplier } from "./net/ClientPacketApplier";
import { GameSocket } from "./net/GameSocket";
import { EntityPicker } from "./picking/EntityPicker";
import { HoverHighlighter } from "./picking/HoverHighlighter";
import { ThreeRenderer } from "./renderer/ThreeRenderer";
import { ActorRenderer } from "./scene/ActorRenderer";
import { ChatOverheadLayer } from "./scene/ChatOverheadLayer";
import { DebugLayer } from "./scene/DebugLayer";
import { GroundItemLayer } from "./scene/GroundItemLayer";
import { HitsplatLayer } from "./scene/HitsplatLayer";
import { ObjectRenderer } from "./scene/ObjectRenderer";
import { ProjectileLayer } from "./scene/ProjectileLayer";
import { TerrainLayer } from "./scene/TerrainLayer";
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
}

interface OverlayElements {
  connectionStatus: HTMLDivElement;
  tickStatus: HTMLDivElement;
  fpsStatus: HTMLDivElement;
}

/**
 * Top-level game engine. Orchestrates renderer, network, and UI.
 * Preserves server authority: the renderer never owns gameplay truth.
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
  readonly debug: DebugLayer | undefined;
  readonly uiState = new UIState();
  readonly content = new ContentClient();
  private readonly socket: GameSocket;
  private readonly _dispatcher: ClientCommandDispatcher;
  private readonly _inputInterpreter: InputInterpreter;
  private readonly _packetApplier: ClientPacketApplier;
  private readonly overlays: OverlayElements;
  private readonly canvas: HTMLCanvasElement;
  private readonly entityPicker: EntityPicker;
  private readonly hoverHighlighter: HoverHighlighter;
  private readonly contextMenu: ContextMenu;
  private uiManager: UIManager | undefined;
  private _running = false;
  private _currentTick = 0;
  private _serverTime = 0;
  private _connected = false;
  private _selfEntityId = 0;
  private _clickMarker: Mesh | undefined;
  private _lastPingRtt = 0;
  private _spellTargetMode: { spellId: string } | undefined;
  private _debugOverlayUpdatePending = false;

  constructor(options: GameEngineOptions) {
    const { canvas, statusOverlay, serverUrl } = options;
    this.canvas = canvas;

    this.renderer = new ThreeRenderer({ canvas });
    this.terrain = new TerrainLayer({ scene: this.renderer.scene });
    this.objects = new ObjectRenderer({ scene: this.renderer.scene });
    this.actors = new ActorRenderer({ scene: this.renderer.scene });
    this.projectiles = new ProjectileLayer({ scene: this.renderer.scene });
    this.hitsplats = new HitsplatLayer({ scene: this.renderer.scene });
    this.groundItems = new GroundItemLayer({ scene: this.renderer.scene });
    this.chatOverhead = new ChatOverheadLayer({ scene: this.renderer.scene });
    this.debug = import.meta.env.DEV ? new DebugLayer({ scene: this.renderer.scene }) : undefined;
    this.socket = new GameSocket(serverUrl);
    this._dispatcher = new ClientCommandDispatcher(this.socket);
    this._inputInterpreter = new InputInterpreter(this.content);
    this._packetApplier = new ClientPacketApplier({
      terrain: this.terrain,
      objects: this.objects,
      actors: this.actors,
      groundItems: this.groundItems,
      hitsplats: this.hitsplats,
      projectiles: this.projectiles,
      chatOverhead: this.chatOverhead,
      debug: this.debug,
      uiState: this.uiState,
      selfEntityId: 0,
      logDebug: (msg) => this._logDebug(msg),
      tileSizeWorldUnits: TILE_SIZE_WORLD_UNITS,
    });
    this.overlays = {
      connectionStatus: statusOverlay.querySelector("#connection-status") as HTMLDivElement,
      tickStatus: statusOverlay.querySelector("#tick-status") as HTMLDivElement,
      fpsStatus: statusOverlay.querySelector("#fps-status") as HTMLDivElement,
    };
    this.entityPicker = new EntityPicker({ camera: this.renderer.camera, canvas });
    this.hoverHighlighter = new HoverHighlighter({ scene: this.renderer.scene });
    this.contextMenu = new ContextMenu({
      container: document.body,
      callbacks: {
        onOptionSelected: (actionId, entity, tile) => {
          const decision = this._inputInterpreter.interpretContextMenu(entity, tile, actionId);
          this._applyDecision(decision);
          if (decision.type === "move") {
            this._showClickMarker(decision.tile);
            this._packetApplier.recordClickTile(decision.tile, this._currentTick);
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
    const connect = this.socket
      .connect()
      .then((fullState) => {
        this._handleFullState(fullState);
      })
      .catch((error) => {
        console.error("Failed to connect to server:", error);
        this.overlays.connectionStatus.textContent = "Connection failed";
        this.overlays.connectionStatus.className = "disconnected";
      });
    await Promise.all([contentLoad, connect]);

    const uiCallbacks: UIManagerCallbacks = {
      sendItemCommand: (uid, actionId) => this.sendItemCommand(uid, actionId),
      sendChatCommand: (text) => this.sendChatCommand(text),
      enterSpellTargetMode: (spellId) => this.enterSpellTargetMode(spellId),
      sendUiActionCommand: (action, targetId, value) =>
        this.sendUiActionCommand(action, targetId, value),
    };
    this.uiManager = new UIManager(this.uiState, this.content, uiCallbacks);

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
    const result = this._packetApplier.applyFullState(fullState);
    this._currentTick = result.tick;
    this._dispatcher.setCurrentTick(result.tick);
    this._serverTime = result.serverTime;
    this._selfEntityId = result.selfEntityId;
    this.actors.setSelfEntityId(this._selfEntityId);
    this._connected = true;
    this._updateOverlay();
  }

  private _handleTickDelta(packet: TickDeltaPacket): void {
    const result = this._packetApplier.applyTickDelta(packet, this._currentTick);
    this._currentTick = result.tick;
    this._dispatcher.setCurrentTick(result.tick);
    this._serverTime = result.serverTime;
  }

  shutdown(): void {
    this._running = false;
    this.socket.close();
    this.canvas.removeEventListener("click", this._handleCanvasClick);
    this.canvas.removeEventListener("mousemove", this._handleMouseMove);
    this.canvas.removeEventListener("contextmenu", this._handleContextMenu);
    GlobalKeydownBus.unregister("game-engine");
    this.contextMenu.hide();
    this.hoverHighlighter.dispose();
    this._removeClickMarker();
    this.uiManager?.dispose();
    this.terrain.dispose();
    this.objects.dispose();
    this.actors.dispose();
    this.projectiles.dispose();
    this.hitsplats.dispose();
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
      this._packetApplier.recordClickTile(decision.tile, this._currentTick);
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
        this.hoverHighlighter.highlight(pos, yOffset);
      }
    } else {
      this.hoverHighlighter.hide();
    }
  };

  private _handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    if (!this._connected) return;

    const entity = this._pickEntityAt(event.clientX, event.clientY);
    const tile = this.renderer.tilePicker.screenToTile(event.clientX, event.clientY);
    const options = this._inputInterpreter.getContextMenuOptions(entity, tile);
    this.contextMenu.show(event.clientX, event.clientY, options, entity, tile);
  };

  private _pickEntityAt(
    screenX: number,
    screenY: number,
  ): import("./picking/EntityPicker").PickedEntity | null {
    const actorTargets = this.actors.getRaycastTargets();
    const objectTargets = this.objects.getRaycastTargets();
    const groundItemTargets = this.groundItems.getRaycastTargets();
    const meshes = [...actorTargets, ...objectTargets, ...groundItemTargets];
    return this.entityPicker.pick(screenX, screenY, meshes);
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
    this._removeClickMarker();
    const geometry = new RingGeometry(0.3, 0.4, 16);
    const material = new MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
    this._clickMarker = new Mesh(geometry, material);
    this._clickMarker.rotation.x = -Math.PI / 2;
    this._clickMarker.position.set(
      tile.x * TILE_SIZE_WORLD_UNITS,
      0.05,
      -tile.y * TILE_SIZE_WORLD_UNITS,
    );
    this.renderer.scene.add(this._clickMarker);

    const start = performance.now();
    const fade = () => {
      if (!this._clickMarker) return;
      const elapsed = performance.now() - start;
      if (elapsed > 1500) {
        this._removeClickMarker();
        return;
      }
      const material = this._clickMarker.material as MeshBasicMaterial;
      material.opacity = 0.8 * (1 - elapsed / 1500);
      requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }

  private _removeClickMarker(): void {
    if (this._clickMarker) {
      this.renderer.scene.remove(this._clickMarker);
      this._clickMarker.geometry.dispose();
      (this._clickMarker.material as MeshBasicMaterial).dispose();
      this._clickMarker = undefined;
    }
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

  private _onFrame(_deltaTime: number, _elapsedTime: number): void {
    this.actors.interpolate();
    this.projectiles.update();
    const actorPositions = new Map<number, Vector3>();
    const actorStates = this.actors.getActorStates();
    for (const [id, actor] of actorStates) {
      actorPositions.set(id, actor.visualPosition);
    }
    // Keep the camera centred on the local player. The interpolated visual
    // position is presentational only and never feeds gameplay truth.
    const selfActor = actorStates.get(this._selfEntityId);
    if (selfActor) {
      this.renderer.cameraController.followTarget(selfActor.visualPosition);
    }
    this.hitsplats.update(actorPositions);
    this.chatOverhead.update(actorPositions);
    this.hoverHighlighter.update();
    this._updateOverlay();
  }

  private _updateOverlay(): void {
    if (this._connected) {
      this.overlays.connectionStatus.textContent = "Connected";
      this.overlays.connectionStatus.className = "connected";
    } else {
      this.overlays.connectionStatus.textContent = "Disconnected";
      this.overlays.connectionStatus.className = "disconnected";
    }
    this.overlays.tickStatus.textContent = `Tick: ${this._currentTick}`;
    this.overlays.fpsStatus.textContent = `FPS: ${this.renderer.fps}`;

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
