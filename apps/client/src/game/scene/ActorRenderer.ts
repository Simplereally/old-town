import { Direction, GAME_TICK_MS, TILE_SIZE_WORLD_UNITS, type TileCoord } from "@old-town/shared";
import { CylinderGeometry, Group, Mesh, MeshLambertMaterial, SphereGeometry, Vector3 } from "three";
import type { Scene } from "three";

export type AnimationState = "idle" | "walk" | "run" | "attack" | "cast" | "hit" | "die";

interface ActorState {
  readonly entityId: number;
  serverTile: TileCoord;
  previousServerTile: TileCoord;
  visualPosition: Vector3;
  facingDirection: Direction;
  animationState: AnimationState;
  isLocalPlayer: boolean;
  name: string;
  kind: "player" | "npc";
  healthBar?: { current: number; max: number };
  tickStartTime: number;
}

interface ActorMeshes {
  readonly group: Group;
  readonly body: Mesh;
  readonly marker: Mesh | undefined;
}

export interface ActorRendererOptions {
  readonly scene: Scene;
  readonly selfEntityId?: number;
}

/**
 * Actor renderer for players and NPCs. Maintains server tile truth and interpolates
 * visual position over the 600ms render window.
 */
export class ActorRenderer {
  private readonly scene: Scene;
  private selfEntityId: number;
  private readonly actors = new Map<number, ActorState>();
  private readonly meshes = new Map<number, ActorMeshes>();
  private readonly actorGroup = new Group();
  private readonly bodyGeometry = new CylinderGeometry(0.3, 0.3, 0.8, 8);
  private readonly playerMaterial = new MeshLambertMaterial({ color: 0x3a6ea5 });
  private readonly npcMaterial = new MeshLambertMaterial({ color: 0x8b4513 });
  private readonly localPlayerMaterial = new MeshLambertMaterial({ color: 0x4caf50 });
  private readonly markerGeometry = new SphereGeometry(0.15, 8, 8);
  private readonly markerMaterial = new MeshLambertMaterial({ color: 0xffff00 });

  constructor(options: ActorRendererOptions) {
    this.scene = options.scene;
    this.selfEntityId = options.selfEntityId ?? 0;
    this.actorGroup.name = "actors";
    this.scene.add(this.actorGroup);
  }

  setSelfEntityId(id: number): void {
    this.selfEntityId = id;
  }

  /** Spawn an actor. */
  spawn(
    entityId: number,
    tile: TileCoord,
    defId: string | undefined,
    isLocalPlayer: boolean,
    kind: "player" | "npc" = "player",
  ): void {
    if (this.actors.has(entityId)) {
      this.remove(entityId);
    }

    const state: ActorState = {
      entityId,
      serverTile: tile,
      previousServerTile: tile,
      visualPosition: this._tileToWorld(tile),
      facingDirection: Direction.South,
      animationState: "idle",
      isLocalPlayer,
      name: defId ?? "Actor",
      kind,
      tickStartTime: performance.now(),
    };

    this.actors.set(entityId, state);
    this._createMeshes(state);
  }

  /** Remove an actor. */
  remove(entityId: number): void {
    const meshes = this.meshes.get(entityId);
    if (meshes) {
      this.actorGroup.remove(meshes.group);
      meshes.body.geometry.dispose();
      (meshes.body.material as MeshLambertMaterial).dispose();
      if (meshes.marker) {
        meshes.marker.geometry.dispose();
        (meshes.marker.material as MeshLambertMaterial).dispose();
      }
      this.meshes.delete(entityId);
    }
    this.actors.delete(entityId);
  }

  /** Update actor server tile (called on each tick delta). */
  updateTile(entityId: number, tile: TileCoord): void {
    const actor = this.actors.get(entityId);
    if (!actor) return;
    actor.previousServerTile = actor.serverTile;
    actor.serverTile = tile;
    actor.tickStartTime = performance.now();
  }

  /** Update actor facing direction. */
  updateFacing(entityId: number, direction: Direction): void {
    const actor = this.actors.get(entityId);
    if (!actor) return;
    actor.facingDirection = direction;
  }

  /** Update animation state. */
  updateAnimation(entityId: number, state: AnimationState): void {
    const actor = this.actors.get(entityId);
    if (!actor) return;
    actor.animationState = state;
  }

  /** Update health bar. */
  updateHealthBar(entityId: number, health: number, maxHealth: number): void {
    const actor = this.actors.get(entityId);
    if (!actor) return;
    actor.healthBar = { current: health, max: maxHealth };
  }

  /** Update actor appearance (name, body style, colors). */
  updateAppearance(
    entityId: number,
    appearance: { name?: string; bodyId?: string; colors?: readonly number[] },
  ): void {
    const actor = this.actors.get(entityId);
    if (!actor) return;
    if (appearance.name) {
      actor.name = appearance.name;
    }
  }

  /** Interpolate all actor visual positions. Call this every frame. */
  interpolate(): void {
    const now = performance.now();

    for (const actor of this.actors.values()) {
      const tickProgress = Math.min((now - actor.tickStartTime) / GAME_TICK_MS, 1);
      const prevWorld = this._tileToWorld(actor.previousServerTile);
      const currWorld = this._tileToWorld(actor.serverTile);
      actor.visualPosition.lerpVectors(prevWorld, currWorld, tickProgress);

      const meshes = this.meshes.get(actor.entityId);
      if (meshes) {
        meshes.group.position.copy(actor.visualPosition);
        meshes.group.position.y += 0.4;
        meshes.group.rotation.y = this._directionToRotation(actor.facingDirection);
      }
    }
  }

  /** Clear all actors. */
  clear(): void {
    for (const id of this.actors.keys()) {
      this.remove(id);
    }
  }

  dispose(): void {
    this.clear();
    this.actorGroup.clear();
    this.scene.remove(this.actorGroup);
    this.bodyGeometry.dispose();
    this.playerMaterial.dispose();
    this.npcMaterial.dispose();
    this.localPlayerMaterial.dispose();
    this.markerGeometry.dispose();
    this.markerMaterial.dispose();
  }

  /** Number of rendered actors. */
  getActorState(entityId: number): ActorState | undefined {
    return this.actors.get(entityId);
  }

  getActorStates(): Map<number, ActorState> {
    return this.actors;
  }

  get actorCount(): number {
    return this.actors.size;
  }

  /** Return all body meshes for raycasting. */
  getRaycastTargets(): Mesh[] {
    const targets: Mesh[] = [];
    for (const meshes of this.meshes.values()) {
      targets.push(meshes.body);
    }
    return targets;
  }

  private _createMeshes(state: ActorState): void {
    const group = new Group();
    group.name = `actor_${state.entityId}`;

    const material = state.isLocalPlayer ? this.localPlayerMaterial : this.playerMaterial;

    const body = new Mesh(this.bodyGeometry, material);
    body.castShadow = false;
    body.receiveShadow = false;
    body.userData = { entityId: state.entityId, kind: state.kind };
    group.add(body);

    let marker: Mesh | undefined;
    if (state.isLocalPlayer) {
      marker = new Mesh(this.markerGeometry, this.markerMaterial);
      marker.position.y = 0.6;
      group.add(marker);
    }

    group.position.copy(state.visualPosition);
    group.position.y += 0.4;
    this.actorGroup.add(group);
    this.meshes.set(state.entityId, { group, body, marker });
  }

  private _tileToWorld(tile: TileCoord): Vector3 {
    return new Vector3(tile.x * TILE_SIZE_WORLD_UNITS, 0, -tile.y * TILE_SIZE_WORLD_UNITS);
  }

  private _directionToRotation(direction: Direction): number {
    // Direction 0 = North, 2 = East, 4 = South, 6 = West
    // Map to radians: North = -Z, East = +X, South = +Z, West = -X
    // Rotation is around Y axis
    const rotationMap: Record<Direction, number> = {
      [Direction.North]: Math.PI,
      [Direction.NorthEast]: Math.PI * 0.75,
      [Direction.East]: Math.PI * 0.5,
      [Direction.SouthEast]: Math.PI * 0.25,
      [Direction.South]: 0,
      [Direction.SouthWest]: -Math.PI * 0.25,
      [Direction.West]: -Math.PI * 0.5,
      [Direction.NorthWest]: -Math.PI * 0.75,
    };
    return rotationMap[direction] ?? 0;
  }
}
