import {
  ClientCommandType,
  Direction,
  type FullStatePacket,
  type SpellTarget,
  TILE_SIZE_WORLD_UNITS,
  type TickDeltaPacket,
  type TileCoord,
  entityId,
} from "@old-town/shared";
import { Mesh, MeshBasicMaterial, RingGeometry, Vector3 } from "three";
import { GameSocket } from "./net/GameSocket";
import { EntityPicker } from "./picking/EntityPicker";
import { HoverHighlighter } from "./picking/HoverHighlighter";
import { ThreeRenderer } from "./renderer/ThreeRenderer";
import { ActorRenderer } from "./scene/ActorRenderer";
import { DebugLayer } from "./scene/DebugLayer";
import { GroundItemLayer } from "./scene/GroundItemLayer";
import { HitsplatLayer } from "./scene/HitsplatLayer";
import { ObjectRenderer } from "./scene/ObjectRenderer";
import { ProjectileLayer } from "./scene/ProjectileLayer";
import { TerrainLayer } from "./scene/TerrainLayer";
import { ContentClient } from "./ui/ContentClient";
import { ContextMenu } from "./ui/ContextMenu";
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
  readonly debug: DebugLayer | undefined;
  readonly uiState = new UIState();
  readonly content = new ContentClient();
  private readonly socket: GameSocket;
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
  private _commandId = 0;
  private _clickMarker: Mesh | undefined;
  private _lastClickTile: TileCoord | undefined;
  private _lastClickTick = 0;
  private _lastPingRtt = 0;
  private _lastServerTime = 0;
  private _hoveredEntity: import("./picking/EntityPicker").PickedEntity | null = null;
  private _spellTargetMode: { spellId: string } | undefined;

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
    this.debug = import.meta.env.DEV ? new DebugLayer({ scene: this.renderer.scene }) : undefined;
    this.socket = new GameSocket(serverUrl);
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
        onWalkHere: (tile) => this._onWalkHere(tile),
        onExamine: (entity) => this._onExamine(entity),
        onNpcOption: (entity, option) => this._onNpcOption(entity, option),
        onObjectOption: (entity, option) => this._onObjectOption(entity, option),
        onItemOption: (entity, option) => this._onItemOption(entity, option),
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

    try {
      await this.content.load(this.socket.serverUrl);
    } catch (error) {
      console.warn("Failed to load content registries:", error);
    }

    try {
      const fullState = await this.socket.connect();
      this._handleFullState(fullState);
      this._connected = true;
      this._updateOverlay();
    } catch (error) {
      console.error("Failed to connect to server:", error);
      this.overlays.connectionStatus.textContent = "Connection failed";
      this.overlays.connectionStatus.className = "disconnected";
    }

    const uiCallbacks: UIManagerCallbacks = {
      sendItemCommand: (uid, option) => this.sendItemCommand(uid, option),
      sendChatCommand: (text) => this.sendChatCommand(text),
      enterSpellTargetMode: (spellId) => this.enterSpellTargetMode(spellId),
      sendUiActionCommand: (action, targetId, value) =>
        this.sendUiActionCommand(action, targetId, value),
    };
    this.uiManager = new UIManager(this.uiState, this.content, uiCallbacks);

    this.socket.onTickDelta = (packet) => this._handleTickDelta(packet);
    this.socket.onPong = (_clientTimeMs, serverTime) => {
      this._lastPingRtt = performance.now() - this.socket.lastPingTime;
      this._lastServerTime = serverTime;
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

  shutdown(): void {
    this._running = false;
    this.socket.close();
    this.canvas.removeEventListener("click", this._handleCanvasClick);
    this.canvas.removeEventListener("mousemove", this._handleMouseMove);
    this.canvas.removeEventListener("contextmenu", this._handleContextMenu);
    document.removeEventListener("keydown", this._handleKeyDown);
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
    this.debug?.dispose();
    this.renderer.dispose();
  }

  private _setupInputHandlers(canvas: HTMLCanvasElement): void {
    canvas.addEventListener("click", this._handleCanvasClick);
    canvas.addEventListener("mousemove", this._handleMouseMove);
    canvas.addEventListener("contextmenu", this._handleContextMenu);
    document.addEventListener("keydown", this._handleKeyDown);
  }

  private _handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      if (this._spellTargetMode) {
        this._spellTargetMode = undefined;
        this._logDebug("Spell target mode cancelled");
        this._updateSpellTargetOverlay();
      }
    }
  };

  private _updateSpellTargetOverlay(): void {
    const overlay = document.getElementById("spell-target-overlay");
    if (overlay) {
      overlay.style.display = this._spellTargetMode ? "block" : "none";
    }
  }

  private _handleCanvasClick = (event: MouseEvent): void => {
    if (!this._connected) return;

    if (this._spellTargetMode) {
      const entity = this._pickEntityAt(event.clientX, event.clientY);
      const tile = this.renderer.tilePicker.screenToTile(event.clientX, event.clientY);
      const target: SpellTarget = entity
        ? { kind: "entity", entityId: entityId(entity.entityId) }
        : tile
          ? { kind: "tile", tile: { x: tile.x, y: tile.y, plane: 0 } }
          : { kind: "none" };
      this.sendSpellCommand(this._spellTargetMode.spellId, target);
      this._spellTargetMode = undefined;
      this._updateSpellTargetOverlay();
      this._logDebug(`Spell target: ${target.kind}`);
      return;
    }

    const entity = this._pickEntityAt(event.clientX, event.clientY);
    if (entity) {
      this._executeDefaultAction(entity, event.clientX, event.clientY);
      return;
    }

    const tile = this.renderer.tilePicker.screenToTile(event.clientX, event.clientY);
    if (!tile) return;

    const tileCoord: TileCoord = { x: tile.x, y: tile.y, plane: 0 };
    this._showClickMarker(tileCoord);
    this._sendMoveCommand(tileCoord);
    this._lastClickTile = tileCoord;
    this._lastClickTick = this._currentTick;
    this._logDebug(`Click: move to (${tile.x}, ${tile.y})`);
  };

  private _handleMouseMove = (event: MouseEvent): void => {
    if (!this._connected) return;
    const entity = this._pickEntityAt(event.clientX, event.clientY);
    this._hoveredEntity = entity;
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
    this.contextMenu.show(event.clientX, event.clientY, entity, tile);
  };

  private _pickEntityAt(
    screenX: number,
    screenY: number,
  ): import("./picking/EntityPicker").PickedEntity | null {
    const meshes = [
      ...this.actors.getRaycastTargets(),
      ...this.objects.getRaycastTargets(),
      ...this.groundItems.getRaycastTargets(),
    ];
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

  private _executeDefaultAction(
    entity: import("./picking/EntityPicker").PickedEntity,
    _screenX: number,
    _screenY: number,
  ): void {
    switch (entity.kind) {
      case "npc": {
        this._sendNpcCommand(entity.entityId, "talk-to");
        this._logDebug(`Click: Talk-to ${entity.defId ?? "NPC"}`);
        break;
      }
      case "object": {
        const action = this._inferObjectAction(entity.defId ?? "");
        this._sendObjectCommand(entity.entityId, action);
        this._logDebug(`Click: ${action} ${entity.defId ?? "object"}`);
        break;
      }
      case "groundItem": {
        this._sendItemCommand(entity.entityId, "pick-up");
        this._logDebug(`Click: Pick up ${entity.itemId ?? "item"}`);
        break;
      }
      default: {
        const actor = this.actors.getActorState(entity.entityId);
        if (actor) {
          this._sendMoveCommand(actor.serverTile);
          this._logDebug(`Click: walk to player ${entity.defId ?? ""}`);
        }
        break;
      }
    }
  }

  private _inferObjectAction(defId: string): string {
    if (defId.includes("tree")) return "chop";
    if (defId.includes("rock") || defId.includes("ore")) return "mine";
    if (defId.includes("door")) return "open";
    return "use";
  }

  private _onWalkHere(tile: { x: number; y: number }): void {
    const tileCoord: TileCoord = { x: tile.x, y: tile.y, plane: 0 };
    this._showClickMarker(tileCoord);
    this._sendMoveCommand(tileCoord);
    this._lastClickTile = tileCoord;
    this._lastClickTick = this._currentTick;
    this._logDebug(`Context: Walk here (${tile.x}, ${tile.y})`);
  }

  private _onExamine(entity: import("./picking/EntityPicker").PickedEntity): void {
    this._logDebug(`Examine: ${entity.defId ?? entity.itemId ?? "entity"}`);
  }

  private _onNpcOption(
    entity: import("./picking/EntityPicker").PickedEntity,
    option: string,
  ): void {
    this._sendNpcCommand(entity.entityId, option);
    this._logDebug(`Context: ${option} ${entity.defId ?? "NPC"}`);
  }

  private _onObjectOption(
    entity: import("./picking/EntityPicker").PickedEntity,
    option: string,
  ): void {
    this._sendObjectCommand(entity.entityId, option);
    this._logDebug(`Context: ${option} ${entity.defId ?? "object"}`);
  }

  private _onItemOption(
    entity: import("./picking/EntityPicker").PickedEntity,
    option: string,
  ): void {
    this._sendItemCommand(entity.entityId, option);
    this._logDebug(`Context: ${option} ${entity.itemId ?? "item"}`);
  }

  private _sendNpcCommand(npcEntityId: number, option: string): void {
    this._commandId += 1;
    this.socket.sendCommand({
      type: ClientCommandType.NpcOption,
      commandId: this._commandId,
      clientTickHint: this._currentTick,
      payload: { npcEntityId: entityId(npcEntityId), option },
    });
  }

  private _sendObjectCommand(objectEntityId: number, option: string): void {
    this._commandId += 1;
    this.socket.sendCommand({
      type: ClientCommandType.ObjectOption,
      commandId: this._commandId,
      clientTickHint: this._currentTick,
      payload: { objectEntityId: entityId(objectEntityId), option },
    });
  }

  private _sendItemCommand(itemEntityId: number, option: string): void {
    this._commandId += 1;
    this.socket.sendCommand({
      type: ClientCommandType.ItemOption,
      commandId: this._commandId,
      clientTickHint: this._currentTick,
      payload: { itemUid: itemEntityId, option },
    });
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

  private _sendMoveCommand(tile: TileCoord): void {
    this._commandId += 1;
    this.socket.sendCommand({
      type: ClientCommandType.MoveClick,
      commandId: this._commandId,
      clientTickHint: this._currentTick,
      payload: { dest: tile },
    });
  }

  /** Send an item option command from UI panels (equip, drop, eat, use). */
  sendItemCommand(itemUid: number, option: string): void {
    this._commandId += 1;
    this.socket.sendCommand({
      type: ClientCommandType.ItemOption,
      commandId: this._commandId,
      clientTickHint: this._currentTick,
      payload: { itemUid, option },
    });
    this._logDebug(`UI: ${option} item ${itemUid}`);
  }

  /** Send a spell cast command from the spellbook panel. */
  sendSpellCommand(spellId: string, target: SpellTarget): void {
    this._commandId += 1;
    this.socket.sendCommand({
      type: ClientCommandType.CastSpell,
      commandId: this._commandId,
      clientTickHint: this._currentTick,
      payload: { spellId, target },
    });
    this._logDebug(`UI: cast ${spellId}`);
  }

  /** Send a chat message from the chat box. */
  sendChatCommand(text: string): void {
    this._commandId += 1;
    this.socket.sendCommand({
      type: ClientCommandType.Chat,
      commandId: this._commandId,
      clientTickHint: this._currentTick,
      payload: { text },
    });
    this._logDebug(`UI: chat "${text}"`);
  }

  enterSpellTargetMode(spellId: string): void {
    this._spellTargetMode = { spellId };
    this._updateSpellTargetOverlay();
    this._logDebug(`Spell target mode: ${spellId}`);
  }

  sendUiActionCommand(action: string, targetId?: string, value?: number): void {
    this._commandId += 1;
    const payload: { action: string; targetId?: string; value?: number } = { action };
    if (targetId !== undefined) payload.targetId = targetId;
    if (value !== undefined) payload.value = value;
    this.socket.sendCommand({
      type: ClientCommandType.UiAction,
      commandId: this._commandId,
      clientTickHint: this._currentTick,
      payload,
    });
    this._logDebug(`UI: action ${action}${targetId ? ` ${targetId}` : ""}`);
  }

  private _logDebug(message: string): void {
    const log = document.getElementById("debug-log");
    if (!log) return;
    const entry = document.createElement("div");
    entry.textContent = `[T${this._currentTick}] ${message}`;
    entry.style.fontSize = "11px";
    entry.style.color = "#aaa";
    log.appendChild(entry);
    while (log.children.length > 50) {
      log.removeChild(log.firstChild as Node);
    }
    log.scrollTop = log.scrollHeight;
  }

  private _handleFullState(state: FullStatePacket): void {
    this._currentTick = state.tick;
    this._serverTime = state.serverTime;
    this._selfEntityId = state.selfEntityId;
    this.actors.setSelfEntityId(this._selfEntityId);

    if (state.regionLoads) {
      for (const region of state.regionLoads) {
        if (region.chunks) {
          for (const chunk of region.chunks) {
            this.terrain.loadChunk(region.regionId, chunk);
          }
        }
      }
    }

    for (const entity of state.entities) {
      if (entity.kind === "object") {
        this.objects.spawn(entity.entityId, entity.tile, entity.defId ?? "default");
      } else if (entity.kind === "player" || entity.kind === "npc") {
        this.actors.spawn(
          entity.entityId,
          entity.tile,
          entity.defId,
          entity.entityId === this._selfEntityId,
          entity.kind,
        );
      }
      if (entity.kind === "player" && entity.entityId === this._selfEntityId) {
        if (entity.appearance) {
          this.actors.updateAppearance(entity.entityId, entity.appearance);
        }
      }
    }

    if (state.inventory) {
      this.uiState.setInventory(state.inventory);
    }
    if (state.skills) {
      this.uiState.setSkills(state.skills);
    }
    if (state.vars) {
      this.uiState.setVars(state.vars);
    }
  }

  private _handleTickDelta(delta: TickDeltaPacket): void {
    this._currentTick = delta.tick;
    this._serverTime = delta.serverTime;

    if (delta.regionUnloads) {
      for (const region of delta.regionUnloads) {
        this.terrain.unloadRegion(region.regionId);
      }
    }

    if (delta.regionLoads) {
      for (const region of delta.regionLoads) {
        if (region.chunks) {
          for (const chunk of region.chunks) {
            this.terrain.loadChunk(region.regionId, chunk);
          }
        }
      }
    }

    for (const entity of delta.entityAdds) {
      if (entity.kind === "object") {
        this.objects.spawn(entity.entityId, entity.tile, entity.defId ?? "default");
      } else if (entity.kind === "player" || entity.kind === "npc") {
        this.actors.spawn(
          entity.entityId,
          entity.tile,
          entity.defId,
          entity.entityId === this._selfEntityId,
          entity.kind,
        );
      }
    }

    for (const id of delta.entityRemoves) {
      this.objects.remove(id);
      this.actors.remove(id);
    }

    for (const update of delta.entityUpdates) {
      if (update.changes.position) {
        this.actors.updateTile(update.entityId, update.changes.position);
      }
      if (update.changes.facingTile) {
        const actor = this.actors.getActorState(update.entityId);
        if (actor) {
          const dx = update.changes.facingTile.x - actor.serverTile.x;
          const dy = update.changes.facingTile.y - actor.serverTile.y;
          if (dx !== 0 || dy !== 0) {
            const direction = this._getDirectionFromDelta(dx, dy);
            this.actors.updateFacing(update.entityId, direction);
          }
        }
      }
      if (update.changes.hitsplat) {
        this.hitsplats.show(
          update.entityId,
          update.changes.hitsplat.amount,
          update.changes.hitsplat.type,
        );
      }
      if (update.changes.equipment && update.entityId === this._selfEntityId) {
        this._syncEquipment(update.changes.equipment.slots);
      }
      if (update.changes.appearance) {
        this.actors.updateAppearance(update.entityId, update.changes.appearance);
      }
    }

    if (delta.hitsplats) {
      for (const hitsplat of delta.hitsplats) {
        this.hitsplats.show(hitsplat.entityId, hitsplat.hitsplat.amount, hitsplat.hitsplat.type);
      }
    }

    if (delta.inventoryDelta) {
      this.uiState.applyInventoryDelta(delta.inventoryDelta);
    }
    if (delta.skillDelta) {
      this.uiState.applySkillDelta(delta.skillDelta);
    }
    if (delta.varbitDelta) {
      this.uiState.applyVarbitDelta(delta.varbitDelta);
    }
    if (delta.chat) {
      this.uiState.addChat(delta.chat);
    }

    if (delta.interfaceOpens) {
      for (const open of delta.interfaceOpens) {
        this.uiState.setDialogue(open.interfaceId, "start");
      }
    }

    if (delta.debug?.paths) {
      this._handleDebugPaths(delta.debug.paths);
    }
    if (delta.debug?.trueTiles) {
      for (const tt of delta.debug.trueTiles) {
        this.debug?.markTrueTile(tt.tile, tt.entityId);
      }
    }
    if (delta.debug?.collisionTiles) {
      for (const tile of delta.debug.collisionTiles) {
        this.debug?.markCollisionTile(tile);
      }
    }
    if (delta.debug?.footprints) {
      for (const tile of delta.debug.footprints) {
        this.debug?.markFootprint(tile);
      }
    }
    if (delta.debug?.reachTiles) {
      for (const rt of delta.debug.reachTiles) {
        this.debug?.markReachTiles(rt.center, rt.radius);
      }
    }
    if (delta.debug?.loSRays) {
      for (const ray of delta.debug.loSRays) {
        const start = new Vector3(
          ray.start.x * TILE_SIZE_WORLD_UNITS,
          0.5,
          -ray.start.y * TILE_SIZE_WORLD_UNITS,
        );
        const end = new Vector3(
          ray.end.x * TILE_SIZE_WORLD_UNITS,
          0.5,
          -ray.end.y * TILE_SIZE_WORLD_UNITS,
        );
        this.debug?.markLoSRay(start, end);
      }
    }
    if (delta.debug?.actionQueue) {
      this.debug?.setActionQueue(delta.debug.actionQueue as string[]);
    }
    if (delta.debug?.combatCooldown !== undefined) {
      this.debug?.setCombatCooldown(delta.debug.combatCooldown);
    }
    if (delta.debug?.pendingHits) {
      const hits = new Map<string, number>();
      for (const h of delta.debug.pendingHits) {
        hits.set(h.targetId.toString(), h.amount);
      }
      this.debug?.setPendingHits(hits);
    }
    if (delta.debug?.npcLeash) {
      this.debug?.setNpcLeash(delta.debug.npcLeash);
    }
    if (delta.debug?.varbits) {
      const vars = new Map<string, number>();
      for (const v of delta.debug.varbits) {
        vars.set(v.varId, v.value);
      }
      this.debug?.setVarbits(vars);
    }
  }

  private _syncEquipment(slots: readonly (string | null)[]): void {
    this.uiState.setEquipment(slots);
  }

  private _handleDebugPaths(
    paths: readonly { readonly entityId: number; readonly path: readonly TileCoord[] }[],
  ): void {
    let foundSelfPath = false;
    for (const pathData of paths) {
      if (pathData.entityId === this._selfEntityId) {
        foundSelfPath = true;
        if (
          pathData.path.length === 0 &&
          this._lastClickTile &&
          this._lastClickTick > this._currentTick - 2
        ) {
          this._logDebug(
            `Move rejected: no path to (${this._lastClickTile.x}, ${this._lastClickTile.y})`,
          );
        } else {
          for (const tile of pathData.path) {
            this.debug?.markPathTile(tile);
          }
        }
      }
    }
    if (!foundSelfPath && this._lastClickTile && this._lastClickTick > this._currentTick - 2) {
      this._logDebug(
        `Move rejected: no path to (${this._lastClickTile.x}, ${this._lastClickTile.y})`,
      );
    }
  }

  private _getDirectionFromDelta(dx: number, dy: number): Direction {
    if (dy > 0)
      return dx > 0 ? Direction.NorthEast : dx < 0 ? Direction.NorthWest : Direction.North;
    if (dy < 0)
      return dx > 0 ? Direction.SouthEast : dx < 0 ? Direction.SouthWest : Direction.South;
    return dx > 0 ? Direction.East : Direction.West;
  }

  private _onFrame(_deltaTime: number, _elapsedTime: number): void {
    this.actors.interpolate();
    this.projectiles.update();
    const actorPositions = new Map<number, Vector3>();
    for (const [id, actor] of this.actors.getActorStates()) {
      actorPositions.set(id, actor.visualPosition);
    }
    this.hitsplats.update(actorPositions);
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
      if (debug?.classList.contains("visible")) {
        const cx = Math.floor(selfActor.serverTile.x / 8);
        const cy = Math.floor(selfActor.serverTile.y / 8);
        const rx = Math.floor(selfActor.serverTile.x / 64);
        const ry = Math.floor(selfActor.serverTile.y / 64);
        const lines = [
          `Tick: ${this._currentTick}`,
          `Ping: ${Math.round(this._lastPingRtt)}ms`,
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
      }
    }
  }
}
