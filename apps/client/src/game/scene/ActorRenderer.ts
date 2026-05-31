import { Direction, GAME_TICK_MS, TILE_SIZE_WORLD_UNITS, type TileCoord } from "@old-town/shared";
import type { Scene } from "three";
import { BoxGeometry, Group, Mesh, MeshLambertMaterial, SphereGeometry, Vector3 } from "three";

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
  readonly parts: Mesh[];
  readonly marker: Mesh | undefined;
}

// Local-space layout for the blocky low-poly humanoid (feet at y = 0).
const LEG_H = 0.5;
const TORSO_H = 0.55;
const HEAD_S = 0.36;
const LEG_Y = LEG_H / 2;
const TORSO_Y = LEG_H + TORSO_H / 2;
const ARM_Y = LEG_H + TORSO_H * 0.55;
const HEAD_Y = LEG_H + TORSO_H + HEAD_S / 2;
// Lift the whole figure so its feet rest on top of the terrain tile surface.
const GROUND_OFFSET = 0.1;

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
  // Shared low-poly humanoid parts (flat-shaded for crisp faceted edges).
  private readonly bodyGeometry = new BoxGeometry(0.52, TORSO_H, 0.34);
  private readonly headGeometry = new BoxGeometry(HEAD_S, HEAD_S, HEAD_S);
  private readonly legGeometry = new BoxGeometry(0.2, LEG_H, 0.24);
  private readonly armGeometry = new BoxGeometry(0.16, LEG_H, 0.22);
  private readonly playerMaterial = new MeshLambertMaterial({
    color: 0x3a6ea5,
    flatShading: true,
  });
  private readonly npcMaterial = new MeshLambertMaterial({ color: 0x8b4513, flatShading: true });
  private readonly localPlayerMaterial = new MeshLambertMaterial({
    color: 0x4caf50,
    flatShading: true,
  });
  private readonly skinMaterial = new MeshLambertMaterial({ color: 0xe0ac69, flatShading: true });
  private readonly legMaterial = new MeshLambertMaterial({ color: 0x394a63, flatShading: true });
  private readonly markerGeometry = new SphereGeometry(0.14, 8, 6);
  private readonly markerMaterial = new MeshLambertMaterial({ color: 0xffd23f, flatShading: true });

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
      meshes.group.clear();
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
      const tickStartTime = actor.tickStartTime;
      const previousServerTile = actor.previousServerTile;
      const serverTile = actor.serverTile;
      const entityId = actor.entityId;
      const facingDirection = actor.facingDirection;
      const visualPosition = actor.visualPosition;

      const tickProgress = Math.min((now - tickStartTime) / GAME_TICK_MS, 1);
      const prevWorld = this._tileToWorld(previousServerTile);
      const currWorld = this._tileToWorld(serverTile);
      visualPosition.lerpVectors(prevWorld, currWorld, tickProgress);

      const meshes = this.meshes.get(entityId);
      if (meshes) {
        meshes.group.position.copy(visualPosition);
        meshes.group.position.y += GROUND_OFFSET;
        meshes.group.rotation.y = this._directionToRotation(facingDirection);
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
    this.headGeometry.dispose();
    this.legGeometry.dispose();
    this.armGeometry.dispose();
    this.playerMaterial.dispose();
    this.npcMaterial.dispose();
    this.localPlayerMaterial.dispose();
    this.skinMaterial.dispose();
    this.legMaterial.dispose();
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
    const entityId = state.entityId;
    const kind = state.kind;
    const isLocalPlayer = state.isLocalPlayer;

    const group = new Group();
    group.name = `actor_${entityId}`;

    // Local player reads green, NPCs brown, remote players blue.
    const tunicMaterial = isLocalPlayer
      ? this.localPlayerMaterial
      : kind === "npc"
        ? this.npcMaterial
        : this.playerMaterial;

    // The torso doubles as the click/raycast target, so it keeps the per-kind
    // shared material that the picker and tests depend on.
    const body = new Mesh(this.bodyGeometry, tunicMaterial);
    body.position.y = TORSO_Y;
    body.castShadow = false;
    body.receiveShadow = false;
    body.userData = { entityId, kind };
    group.add(body);

    const head = new Mesh(this.headGeometry, this.skinMaterial);
    head.position.y = HEAD_Y;

    const leftLeg = new Mesh(this.legGeometry, this.legMaterial);
    leftLeg.position.set(-0.13, LEG_Y, 0);
    const rightLeg = new Mesh(this.legGeometry, this.legMaterial);
    rightLeg.position.set(0.13, LEG_Y, 0);

    const leftArm = new Mesh(this.armGeometry, tunicMaterial);
    leftArm.position.set(-0.34, ARM_Y, 0);
    const rightArm = new Mesh(this.armGeometry, tunicMaterial);
    rightArm.position.set(0.34, ARM_Y, 0);

    const parts = [head, leftLeg, rightLeg, leftArm, rightArm];
    for (const part of parts) {
      group.add(part);
    }

    let marker: Mesh | undefined;
    if (isLocalPlayer) {
      marker = new Mesh(this.markerGeometry, this.markerMaterial);
      marker.position.y = HEAD_Y + 0.45;
      group.add(marker);
    }

    group.position.copy(state.visualPosition);
    group.position.y += GROUND_OFFSET;
    this.actorGroup.add(group);
    this.meshes.set(state.entityId, { group, body, parts, marker });
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
