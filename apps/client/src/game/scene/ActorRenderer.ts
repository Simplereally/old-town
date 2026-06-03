import { Direction, GAME_TICK_MS, TILE_SIZE_WORLD_UNITS, type TileCoord } from "@old-town/shared";
import type { BufferGeometry, Scene } from "three";
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import { compose, PALETTE, vertexColorMaterial } from "./lowpoly";

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
  lastHitTick: number;
  tickStartTime: number;
}

interface ActorMeshes {
  readonly group: Group;
  readonly body: Mesh;
  readonly parts: Mesh[];
  readonly marker: Mesh | undefined;
  healthBar?: {
    group: Group;
    bg: Sprite;
    fill: Sprite;
  };
}

/** Non-humanoid body plan for a creature, resolved from its def keyword. */
type CreatureArchetype =
  | "humanoid"
  | "rodent"
  | "canine"
  | "goblinoid"
  | "bat"
  | "bird"
  | "drake"
  | "wisp"
  | "serpent";

interface CreatureSpec {
  readonly archetype: CreatureArchetype;
  readonly body: number;
  readonly accent: number;
  readonly scale: number;
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

/** Number of ticks the health bar stays visible after being hit. OSRS: ~10-12 ticks. */
const HP_BAR_LIFETIME_TICKS = 10;
const HP_BAR_WIDTH = 1.2;
const HP_BAR_HEIGHT = 0.18;
const HP_BAR_FILL_HEIGHT = 0.15;
const HP_BAR_EPSILON = 0.001;

/**
 * Pick a non-humanoid body plan from a creature def. Keyword-based and purely
 * presentational; gameplay never reads it. Townsfolk and players fall through to
 * the humanoid plan. The client only receives a `defId` at spawn (not the def's
 * `creatureKind`), so resolution keys off the id string.
 */
function resolveCreature(defId: string, kind: "player" | "npc"): CreatureSpec {
  if (kind === "player") {
    return { archetype: "humanoid", body: PALETTE.clothBlue, accent: PALETTE.skin, scale: 1 };
  }
  const id = defId;
  const has = (...keys: string[]): boolean => keys.some((k) => id.includes(k));

  if (has("rat", "mite", "mouse", "vermin")) {
    return {
      archetype: "rodent",
      body: PALETTE.furGrey,
      accent: PALETTE.skin,
      scale: id.includes("mite") ? 0.42 : 0.6,
    };
  }
  if (has("fox")) {
    return { archetype: "canine", body: PALETTE.furRed, accent: PALETTE.highlight, scale: 0.72 };
  }
  if (has("dog", "hound", "wolf", "cur")) {
    return { archetype: "canine", body: PALETTE.furBrown, accent: PALETTE.barkDark, scale: 0.82 };
  }
  if (has("goblin", "imp")) {
    return { archetype: "goblinoid", body: PALETTE.clothBrown, accent: PALETTE.goblinSkin, scale: 0.88 };
  }
  if (has("bat")) {
    return { archetype: "bat", body: PALETTE.furBlack, accent: PALETTE.drakeHide, scale: 0.72 };
  }
  if (has("crow", "raven", "rook", "bird")) {
    return { archetype: "bird", body: PALETTE.furBlack, accent: PALETTE.goldMetal, scale: 0.58 };
  }
  if (has("drake", "whelp", "dragon", "wyrm", "wyvern")) {
    return { archetype: "drake", body: PALETTE.drakeHide, accent: PALETTE.ember, scale: 1.05 };
  }
  if (has("wisp", "wraith", "ghost", "spirit", "shade", "spectre")) {
    return { archetype: "wisp", body: PALETTE.wispGlow, accent: PALETTE.highlight, scale: 0.82 };
  }
  if (has("snapper", "turtle", "crab", "eel", "snake", "serpent")) {
    return { archetype: "serpent", body: PALETTE.furGrey, accent: PALETTE.leafDark, scale: 0.92 };
  }
  return { archetype: "humanoid", body: PALETTE.clothBrown, accent: PALETTE.skin, scale: 1 };
}

const creatureTemplates = new Map<string, BufferGeometry>();

function getCreatureTemplate(spec: CreatureSpec): BufferGeometry {
  const key = `${spec.archetype}:${spec.body}:${spec.accent}`;
  const cached = creatureTemplates.get(key);
  if (cached) return cached;
  const geometry = buildCreatureGeometry(spec);
  creatureTemplates.set(key, geometry);
  return geometry;
}

/** Build a creature's merged vertex-coloured body geometry, facing +Z (south). */
function buildCreatureGeometry(spec: CreatureSpec): BufferGeometry {
  const { archetype, body, accent } = spec;
  switch (archetype) {
    case "rodent": {
      const leg = (x: number, z: number) => ({
        geometry: new BoxGeometry(0.06, 0.16, 0.06),
        color: body,
        x,
        y: 0.08,
        z,
      });
      return compose([
        { geometry: new BoxGeometry(0.24, 0.2, 0.46), color: body, y: 0.22 },
        { geometry: new BoxGeometry(0.18, 0.18, 0.18), color: body, y: 0.26, z: 0.3 },
        { geometry: new ConeGeometry(0.08, 0.16, 4), color: accent, y: 0.24, z: 0.45, rotX: Math.PI / 2 },
        { geometry: new IcosahedronGeometry(0.06, 0), color: body, x: -0.07, y: 0.4, z: 0.27 },
        { geometry: new IcosahedronGeometry(0.06, 0), color: body, x: 0.07, y: 0.4, z: 0.27 },
        leg(-0.09, 0.16),
        leg(0.09, 0.16),
        leg(-0.09, -0.16),
        leg(0.09, -0.16),
        {
          geometry: new CylinderGeometry(0.03, 0.015, 0.5, 4),
          color: accent,
          y: 0.2,
          z: -0.42,
          rotX: -0.4,
        },
      ]);
    }
    case "canine": {
      const leg = (x: number, z: number) => ({
        geometry: new BoxGeometry(0.1, 0.34, 0.1),
        color: body,
        x,
        y: 0.17,
        z,
      });
      return compose([
        { geometry: new BoxGeometry(0.32, 0.3, 0.66), color: body, y: 0.5 },
        { geometry: new BoxGeometry(0.26, 0.26, 0.26), color: body, y: 0.56, z: 0.42 },
        { geometry: new BoxGeometry(0.14, 0.13, 0.18), color: accent, y: 0.5, z: 0.58 },
        { geometry: new BoxGeometry(0.06, 0.12, 0.04), color: body, x: -0.09, y: 0.73, z: 0.4 },
        { geometry: new BoxGeometry(0.06, 0.12, 0.04), color: body, x: 0.09, y: 0.73, z: 0.4 },
        leg(-0.11, 0.22),
        leg(0.11, 0.22),
        leg(-0.11, -0.22),
        leg(0.11, -0.22),
        { geometry: new BoxGeometry(0.09, 0.09, 0.32), color: accent, y: 0.58, z: -0.48, rotX: -0.6 },
      ]);
    }
    case "goblinoid": {
      return compose([
        { geometry: new BoxGeometry(0.13, 0.3, 0.14), color: body, x: -0.1, y: 0.15 },
        { geometry: new BoxGeometry(0.13, 0.3, 0.14), color: body, x: 0.1, y: 0.15 },
        { geometry: new BoxGeometry(0.36, 0.36, 0.24), color: body, y: 0.48 },
        { geometry: new BoxGeometry(0.1, 0.32, 0.1), color: accent, x: -0.25, y: 0.46 },
        { geometry: new BoxGeometry(0.1, 0.32, 0.1), color: accent, x: 0.25, y: 0.46 },
        { geometry: new BoxGeometry(0.27, 0.26, 0.26), color: accent, y: 0.8 },
        { geometry: new ConeGeometry(0.06, 0.16, 4), color: accent, x: -0.17, y: 0.84, rotZ: 1.1 },
        { geometry: new ConeGeometry(0.06, 0.16, 4), color: accent, x: 0.17, y: 0.84, rotZ: -1.1 },
        { geometry: new ConeGeometry(0.05, 0.12, 4), color: accent, y: 0.78, z: 0.16, rotX: Math.PI / 2 },
      ]);
    }
    case "bat": {
      return compose([
        { geometry: new IcosahedronGeometry(0.15, 0), color: body, y: 0.55 },
        { geometry: new BoxGeometry(0.36, 0.03, 0.22), color: accent, x: -0.28, y: 0.56, rotZ: 0.25 },
        { geometry: new BoxGeometry(0.36, 0.03, 0.22), color: accent, x: 0.28, y: 0.56, rotZ: -0.25 },
        { geometry: new ConeGeometry(0.04, 0.1, 4), color: body, x: -0.06, y: 0.68 },
        { geometry: new ConeGeometry(0.04, 0.1, 4), color: body, x: 0.06, y: 0.68 },
      ]);
    }
    case "bird": {
      const leg = (x: number) => ({
        geometry: new BoxGeometry(0.03, 0.16, 0.03),
        color: PALETTE.barkDark,
        x,
        y: 0.08,
      });
      return compose([
        { geometry: new IcosahedronGeometry(0.16, 0), color: body, y: 0.32, sz: 1.3 },
        { geometry: new BoxGeometry(0.15, 0.16, 0.14), color: body, y: 0.46, z: 0.05 },
        { geometry: new ConeGeometry(0.05, 0.14, 4), color: accent, y: 0.44, z: 0.18, rotX: Math.PI / 2 },
        { geometry: new BoxGeometry(0.12, 0.04, 0.24), color: body, y: 0.3, z: -0.18 },
        { geometry: new BoxGeometry(0.05, 0.18, 0.28), color: body, x: -0.14, y: 0.34 },
        { geometry: new BoxGeometry(0.05, 0.18, 0.28), color: body, x: 0.14, y: 0.34 },
        leg(-0.06),
        leg(0.06),
      ]);
    }
    case "drake": {
      const leg = (x: number, z: number) => ({
        geometry: new BoxGeometry(0.12, 0.32, 0.12),
        color: body,
        x,
        y: 0.16,
        z,
      });
      return compose([
        { geometry: new BoxGeometry(0.4, 0.36, 0.7), color: body, y: 0.55 },
        { geometry: new BoxGeometry(0.2, 0.2, 0.28), color: body, y: 0.66, z: 0.42 },
        { geometry: new BoxGeometry(0.24, 0.22, 0.26), color: body, y: 0.66, z: 0.6 },
        { geometry: new ConeGeometry(0.05, 0.16, 4), color: accent, x: -0.08, y: 0.84, z: 0.56 },
        { geometry: new ConeGeometry(0.05, 0.16, 4), color: accent, x: 0.08, y: 0.84, z: 0.56 },
        { geometry: new BoxGeometry(0.5, 0.03, 0.34), color: accent, x: -0.42, y: 0.72, z: -0.05, rotZ: 0.3 },
        { geometry: new BoxGeometry(0.5, 0.03, 0.34), color: accent, x: 0.42, y: 0.72, z: -0.05, rotZ: -0.3 },
        leg(-0.15, 0.22),
        leg(0.15, 0.22),
        leg(-0.15, -0.22),
        leg(0.15, -0.22),
        { geometry: new ConeGeometry(0.1, 0.6, 5), color: body, y: 0.5, z: -0.62, rotX: -Math.PI / 2 },
      ]);
    }
    case "wisp": {
      return compose([
        { geometry: new IcosahedronGeometry(0.2, 1), color: body, y: 0.7 },
        { geometry: new IcosahedronGeometry(0.32, 0), color: body, y: 0.7 },
        { geometry: new IcosahedronGeometry(0.05, 0), color: accent, x: 0.28, y: 0.92 },
        { geometry: new IcosahedronGeometry(0.05, 0), color: accent, x: -0.24, y: 0.5 },
      ]);
    }
    case "serpent": {
      const shell = new IcosahedronGeometry(0.34, 1);
      const leg = (x: number, z: number) => ({
        geometry: new BoxGeometry(0.12, 0.14, 0.12),
        color: body,
        x,
        y: 0.09,
        z,
      });
      return compose([
        { geometry: shell, color: accent, y: 0.24, sy: 0.55 },
        { geometry: new CylinderGeometry(0.32, 0.32, 0.12, 8), color: body, y: 0.1 },
        { geometry: new BoxGeometry(0.2, 0.18, 0.2), color: body, y: 0.2, z: 0.36 },
        leg(-0.22, 0.18),
        leg(0.22, 0.18),
        leg(-0.22, -0.18),
        leg(0.22, -0.18),
        { geometry: new ConeGeometry(0.06, 0.2, 4), color: body, y: 0.16, z: -0.4, rotX: -Math.PI / 2 },
      ]);
    }
    default: {
      // A simple vertex-coloured humanoid, used when a creature spec somehow
      // routes here. The shared-material humanoid build is preferred (see
      // _buildHumanoid); this keeps the function total.
      return compose([
        { geometry: new BoxGeometry(0.2, LEG_H, 0.24), color: PALETTE.clothGrey, x: -0.13, y: LEG_Y },
        { geometry: new BoxGeometry(0.2, LEG_H, 0.24), color: PALETTE.clothGrey, x: 0.13, y: LEG_Y },
        { geometry: new BoxGeometry(0.52, TORSO_H, 0.34), color: body, y: TORSO_Y },
        { geometry: new BoxGeometry(HEAD_S, HEAD_S, HEAD_S), color: accent, y: HEAD_Y },
      ]);
    }
  }
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
  // One shared material for every non-humanoid creature; colour lives in the geometry.
  private readonly creatureMaterial = vertexColorMaterial();
  // Shared health-bar materials (tinted white squares; scale and position drive the bar).
  private readonly healthBarBgMaterial = new SpriteMaterial({ color: 0x400000, depthTest: false });
  private readonly healthBarFillMaterial = new SpriteMaterial({ color: 0x10c010, depthTest: false });

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
      lastHitTick: -Infinity,
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

  /** Update health bar and make it visible. */
  updateHealthBar(entityId: number, health: number, maxHealth: number): void {
    const actor = this.actors.get(entityId);
    if (!actor) return;
    const safeMax = Math.max(1, Math.floor(maxHealth));
    const safeCurrent = Math.min(safeMax, Math.max(0, Math.floor(health)));
    actor.healthBar = { current: safeCurrent, max: safeMax };
    const meshes = this.meshes.get(entityId);
    if (meshes?.healthBar) {
      this._applyHealthBarVisual(meshes.healthBar, safeCurrent, safeMax);
      meshes.healthBar.group.visible = Number.isFinite(actor.lastHitTick);
    }
  }

  /** Notify that this actor was hit (even for 0). Resets the health-bar visibility timer. */
  notifyHit(entityId: number, tick: number): void {
    const actor = this.actors.get(entityId);
    if (!actor) return;
    actor.lastHitTick = tick;
    const meshes = this.meshes.get(entityId);
    if (meshes?.healthBar && actor.healthBar) {
      meshes.healthBar.group.visible = true;
    }
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
  interpolate(currentTick: number): void {
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

        if (meshes.healthBar) {
          const elapsed = currentTick - actor.lastHitTick;
          meshes.healthBar.group.visible = elapsed <= HP_BAR_LIFETIME_TICKS && !!actor.healthBar;
        }
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
    this.creatureMaterial.dispose();
    this.healthBarBgMaterial.dispose();
    this.healthBarFillMaterial.dispose();
    for (const geometry of creatureTemplates.values()) {
      geometry.dispose();
    }
    creatureTemplates.clear();
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
    const spec = resolveCreature(state.name, state.kind);
    const meshes =
      spec.archetype === "humanoid"
        ? this._buildHumanoid(state)
        : this._buildCreature(state, spec);
    this.meshes.set(state.entityId, meshes);
  }

  /** Build the shared-material blocky humanoid used for players and townsfolk. */
  private _buildHumanoid(state: ActorState): ActorMeshes {
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

    const healthBar = this._createHealthBarGroup();
    group.add(healthBar.group);

    group.position.copy(state.visualPosition);
    group.position.y += GROUND_OFFSET;
    this.actorGroup.add(group);
    return { group, body, parts, marker, healthBar };
  }

  /** Build a non-humanoid creature as a single merged vertex-coloured mesh. */
  private _buildCreature(state: ActorState, spec: CreatureSpec): ActorMeshes {
    const group = new Group();
    group.name = `actor_${state.entityId}`;

    const body = new Mesh(getCreatureTemplate(spec), this.creatureMaterial);
    body.castShadow = false;
    body.receiveShadow = false;
    body.userData = { entityId: state.entityId, kind: state.kind };
    group.add(body);

    const healthBar = this._createHealthBarGroup();
    group.add(healthBar.group);

    group.scale.setScalar(spec.scale);
    group.position.copy(state.visualPosition);
    group.position.y += GROUND_OFFSET;
    this.actorGroup.add(group);
    return { group, body, parts: [], marker: undefined, healthBar };
  }

  private _tileToWorld(tile: TileCoord): Vector3 {
    return new Vector3(tile.x * TILE_SIZE_WORLD_UNITS, 0, -tile.y * TILE_SIZE_WORLD_UNITS);
  }

  /** Build a billboarded health-bar group (red bg + green fill). */
  private _createHealthBarGroup(): NonNullable<ActorMeshes["healthBar"]> {
    const group = new Group();
    group.position.set(0, 1.85, 0);
    group.visible = false;

    const bg = new Sprite(this.healthBarBgMaterial);
    bg.center.set(0, 0.5);
    bg.position.x = -HP_BAR_WIDTH / 2;
    bg.scale.set(HP_BAR_WIDTH, HP_BAR_HEIGHT, 1);
    group.add(bg);

    const fill = new Sprite(this.healthBarFillMaterial);
    fill.center.set(0, 0.5);
    fill.position.x = -HP_BAR_WIDTH / 2;
    fill.scale.set(HP_BAR_EPSILON, HP_BAR_FILL_HEIGHT, 1);
    group.add(fill);

    return { group, bg, fill };
  }

  private _applyHealthBarVisual(
    healthBar: NonNullable<ActorMeshes["healthBar"]>,
    health: number,
    maxHealth: number,
  ): void {
    const ratio = maxHealth > 0 ? Math.min(1, Math.max(0, health / maxHealth)) : 0;
    healthBar.fill.scale.x = ratio <= 0 ? HP_BAR_EPSILON : HP_BAR_WIDTH * ratio;
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
