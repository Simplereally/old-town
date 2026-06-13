import {
  Direction,
  GAME_TICK_MS,
  type MoveSpeed,
  TILE_SIZE_WORLD_UNITS,
  type TileCoord,
} from "@old-town/shared";
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
import { type RenderResourceKey, RenderResourceRegistry } from "../renderer/RenderResourceRegistry";
import { compose, PALETTE, vertexColorMaterial } from "./lowpoly";

export type AnimationState = "idle" | "walk" | "run" | "attack" | "cast" | "hit" | "die";

/** Number of visual substeps per server tick for quantized animation. */
export const ANIMATION_SUBSTEPS_PER_TICK = 4;
/** Duration of one animation substep in milliseconds. */
export const ANIMATION_SUBSTEP_MS = GAME_TICK_MS / ANIMATION_SUBSTEPS_PER_TICK;

/** Lightweight render handle for an actor. Used by the transform cache and policy layer. */
export interface ActorRenderHandle {
  readonly entityId: number;
  readonly kind: "player" | "npc";
  readonly resourceKey: string;
  readonly poolSlot: number;
  bucketId?: string;
}

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
  resourceKey: string;
  poolSlot: number;
}

export interface ActorMeshes {
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

/** Default pre-warm count for actor pools. */
const DEFAULT_POOL_SIZE = 8;

const HUMANOID_RESOURCE_KEY = "humanoid";

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
    return {
      archetype: "goblinoid",
      body: PALETTE.clothBrown,
      accent: PALETTE.goblinSkin,
      scale: 0.88,
    };
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

/**
 * Build a creature's merged vertex-coloured body geometry, facing +Z (south).
 * Used by the registry factory and creature pool pre-warm.
 */
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
        {
          geometry: new ConeGeometry(0.08, 0.16, 4),
          color: accent,
          y: 0.24,
          z: 0.45,
          rotX: Math.PI / 2,
        },
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
        {
          geometry: new BoxGeometry(0.09, 0.09, 0.32),
          color: accent,
          y: 0.58,
          z: -0.48,
          rotX: -0.6,
        },
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
        {
          geometry: new ConeGeometry(0.05, 0.12, 4),
          color: accent,
          y: 0.78,
          z: 0.16,
          rotX: Math.PI / 2,
        },
      ]);
    }
    case "bat": {
      return compose([
        { geometry: new IcosahedronGeometry(0.15, 0), color: body, y: 0.55 },
        {
          geometry: new BoxGeometry(0.36, 0.03, 0.22),
          color: accent,
          x: -0.28,
          y: 0.56,
          rotZ: 0.25,
        },
        {
          geometry: new BoxGeometry(0.36, 0.03, 0.22),
          color: accent,
          x: 0.28,
          y: 0.56,
          rotZ: -0.25,
        },
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
        {
          geometry: new ConeGeometry(0.05, 0.14, 4),
          color: accent,
          y: 0.44,
          z: 0.18,
          rotX: Math.PI / 2,
        },
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
        {
          geometry: new BoxGeometry(0.5, 0.03, 0.34),
          color: accent,
          x: -0.42,
          y: 0.72,
          z: -0.05,
          rotZ: 0.3,
        },
        {
          geometry: new BoxGeometry(0.5, 0.03, 0.34),
          color: accent,
          x: 0.42,
          y: 0.72,
          z: -0.05,
          rotZ: -0.3,
        },
        leg(-0.15, 0.22),
        leg(0.15, 0.22),
        leg(-0.15, -0.22),
        leg(0.15, -0.22),
        {
          geometry: new ConeGeometry(0.1, 0.6, 5),
          color: body,
          y: 0.5,
          z: -0.62,
          rotX: -Math.PI / 2,
        },
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
        {
          geometry: new ConeGeometry(0.06, 0.2, 4),
          color: body,
          y: 0.16,
          z: -0.4,
          rotX: -Math.PI / 2,
        },
      ]);
    }
    default: {
      // A simple vertex-coloured humanoid, used when a creature spec somehow
      // routes here. The shared-material humanoid build is preferred (see
      // _buildHumanoid); this keeps the function total.
      return compose([
        {
          geometry: new BoxGeometry(0.2, LEG_H, 0.24),
          color: PALETTE.clothGrey,
          x: -0.13,
          y: LEG_Y,
        },
        {
          geometry: new BoxGeometry(0.2, LEG_H, 0.24),
          color: PALETTE.clothGrey,
          x: 0.13,
          y: LEG_Y,
        },
        { geometry: new BoxGeometry(0.52, TORSO_H, 0.34), color: body, y: TORSO_Y },
        { geometry: new BoxGeometry(HEAD_S, HEAD_S, HEAD_S), color: accent, y: HEAD_Y },
      ]);
    }
  }
}

export interface ActorRendererOptions {
  readonly scene: Scene;
  readonly selfEntityId?: number;
  /** Optional render resource registry. If not provided, a private registry is created. */
  readonly registry?: RenderResourceRegistry;
  /** Initial pool capacity for each archetype. */
  readonly poolSize?: number;
}

/**
 * Actor renderer for players and NPCs. Maintains server tile truth and interpolates
 * visual position over the 600ms render window.
 *
 * Uses pooled presentation objects backed by registry-owned geometries and materials.
 * Humanoid groups and creature body meshes are pooled by archetype. Actor visual
 * positions are driven from RenderTransformCache presentation samples.
 */
export class ActorRenderer {
  private readonly scene: Scene;
  private readonly registry: RenderResourceRegistry;
  private selfEntityId: number;
  private readonly actors = new Map<number, ActorState>();
  readonly meshes = new Map<number, ActorMeshes>();
  private readonly actorGroup = new Group();
  private readonly poolSize: number;

  // Shared low-poly humanoid parts (flat-shaded for crisp faceted edges).
  private readonly bodyGeometry: BufferGeometry;
  private readonly headGeometry: BufferGeometry;
  private readonly legGeometry: BufferGeometry;
  private readonly armGeometry: BufferGeometry;
  private readonly playerMaterial: MeshLambertMaterial;
  private readonly npcMaterial: MeshLambertMaterial;
  private readonly localPlayerMaterial: MeshLambertMaterial;
  private readonly skinMaterial: MeshLambertMaterial;
  private readonly legMaterial: MeshLambertMaterial;
  private readonly markerGeometry: SphereGeometry;
  private readonly markerMaterial: MeshLambertMaterial;
  // One shared material for every non-humanoid creature; colour lives in the geometry.
  private readonly creatureMaterial: MeshLambertMaterial;
  // Shared health-bar materials (tinted white squares; scale and position drive the bar).
  private readonly healthBarBgMaterial: SpriteMaterial;
  private readonly healthBarFillMaterial: SpriteMaterial;

  // --- Pools ---
  private readonly humanoidPool: ActorMeshes[] = [];
  private readonly humanoidFreeList: ActorMeshes[] = [];
  private readonly humanoidActive = new Set<ActorMeshes>();
  private readonly creaturePools = new Map<string, ActorMeshes[]>();
  private readonly creatureFreeLists = new Map<string, ActorMeshes[]>();
  private readonly creatureActive = new Map<string, Set<ActorMeshes>>();
  private readonly registeredArchetypes = new Set<string>();
  private _nextPoolSlot = 0;

  constructor(options: ActorRendererOptions) {
    this.scene = options.scene;
    this.registry = options.registry ?? new RenderResourceRegistry();
    this.selfEntityId = options.selfEntityId ?? 0;
    this.poolSize = options.poolSize ?? DEFAULT_POOL_SIZE;
    this.actorGroup.name = "actors";
    this.scene.add(this.actorGroup);

    // Register and acquire shared humanoid geometries
    this._ensureHumanoidResourcesRegistered();
    this.bodyGeometry = this.registry.getGeometry({
      type: "actor",
      contentId: "humanoid",
      variant: "body",
    });
    this.headGeometry = this.registry.getGeometry({
      type: "actor",
      contentId: "humanoid",
      variant: "head",
    });
    this.legGeometry = this.registry.getGeometry({
      type: "actor",
      contentId: "humanoid",
      variant: "leg",
    });
    this.armGeometry = this.registry.getGeometry({
      type: "actor",
      contentId: "humanoid",
      variant: "arm",
    });
    this.markerGeometry = this.registry.getGeometry({
      type: "actor",
      contentId: "humanoid",
      variant: "marker",
    }) as SphereGeometry;

    // Register and acquire shared materials
    this.playerMaterial = this.registry.getMaterial({
      type: "actor",
      contentId: "player",
    }) as MeshLambertMaterial;
    this.npcMaterial = this.registry.getMaterial({
      type: "actor",
      contentId: "npc",
    }) as MeshLambertMaterial;
    this.localPlayerMaterial = this.registry.getMaterial({
      type: "actor",
      contentId: "localPlayer",
    }) as MeshLambertMaterial;
    this.skinMaterial = this.registry.getMaterial({
      type: "actor",
      contentId: "skin",
    }) as MeshLambertMaterial;
    this.legMaterial = this.registry.getMaterial({
      type: "actor",
      contentId: "leg",
    }) as MeshLambertMaterial;
    this.markerMaterial = this.registry.getMaterial({
      type: "actor",
      contentId: "marker",
    }) as MeshLambertMaterial;
    this.creatureMaterial = this.registry.getMaterial({
      type: "actor",
      contentId: "creature",
      materialId: "default",
    }) as MeshLambertMaterial;
    this.healthBarBgMaterial = this.registry.getMaterial({
      type: "actor",
      contentId: "healthBar",
      materialId: "bg",
    }) as SpriteMaterial;
    this.healthBarFillMaterial = this.registry.getMaterial({
      type: "actor",
      contentId: "healthBar",
      materialId: "fill",
    }) as SpriteMaterial;

    // Prewarm humanoid pool
    this._prewarmHumanoidPool();
  }

  setSelfEntityId(id: number): void {
    this.selfEntityId = id;
  }

  /** Return the render handle for an actor, if present. */
  getRenderHandle(entityId: number): ActorRenderHandle | undefined {
    const actor = this.actors.get(entityId);
    if (!actor) return undefined;
    return {
      entityId: actor.entityId,
      kind: actor.kind,
      resourceKey: actor.resourceKey,
      poolSlot: actor.poolSlot,
    };
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

    const spec = resolveCreature(defId ?? "Actor", kind);
    const resourceKey =
      spec.archetype === "humanoid"
        ? `${HUMANOID_RESOURCE_KEY}:${kind}`
        : `creature:${spec.archetype}`;
    const poolSlot = this._nextPoolSlot++;

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
      resourceKey,
      poolSlot,
    };

    this.actors.set(entityId, state);
    const meshes = this._acquireMeshes(state, spec);
    this.meshes.set(entityId, meshes);
  }

  /** Remove an actor. */
  remove(entityId: number): void {
    const meshes = this.meshes.get(entityId);
    if (meshes) {
      this._releaseMeshes(meshes);
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

  /** Update animation state from movement speed. */
  updateMoveSpeed(entityId: number, speed: MoveSpeed): void {
    const actor = this.actors.get(entityId);
    if (!actor) return;
    const state: AnimationState = speed === "stationary" ? "idle" : speed;
    actor.animationState = state;
  }

  /** Hide an actor (e.g. on death). */
  hide(entityId: number): void {
    const meshes = this.meshes.get(entityId);
    if (meshes) {
      meshes.group.visible = false;
    }
  }

  /** Show an actor (e.g. on respawn). */
  show(entityId: number): void {
    const meshes = this.meshes.get(entityId);
    if (meshes) {
      meshes.group.visible = true;
    }
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

  /** Update actor visual positions from RenderTransformCache. Call every frame. */
  updateFromCache(
    cache: import("../renderer/RenderTransformCache").RenderTransformCache,
    currentTick: number,
  ): void {
    for (const actor of this.actors.values()) {
      const presentation = cache.getPresentation(actor.entityId);
      const meshes = this.meshes.get(actor.entityId);
      if (!presentation || !meshes) continue;

      actor.visualPosition.set(presentation.renderX, presentation.renderY, presentation.renderZ);
      meshes.group.position.copy(actor.visualPosition);
      meshes.group.position.y += GROUND_OFFSET;
      meshes.group.rotation.y = this._directionToRotation(presentation.heading as Direction);

      // Drive animation state from movement presentation kind
      const movementKind = presentation.movementKind;
      let animState: AnimationState;
      switch (movementKind) {
        case 0:
          animState = "idle";
          break;
        case 1:
          animState = "walk";
          break;
        case 2:
          animState = "run";
          break;
        default:
          animState = "idle";
          break;
      }
      actor.animationState = animState;

      // Apply quantized CPU-side animation pose
      this._sampleAnimation(actor, meshes, performance.now());

      if (meshes.healthBar) {
        const elapsed = currentTick - actor.lastHitTick;
        meshes.healthBar.group.visible = elapsed <= HP_BAR_LIFETIME_TICKS && !!actor.healthBar;
      }

      // Update appearance metadata if cache provides it
      if (presentation.appearance) {
        if (presentation.appearance.name) {
          actor.name = presentation.appearance.name;
        }
      }
    }
  }

  /** Clear all actors. */
  clear(): void {
    for (const id of Array.from(this.actors.keys())) {
      this.remove(id);
    }
  }

  dispose(): void {
    this.clear();
    this.actorGroup.clear();
    this.scene.remove(this.actorGroup);

    // Release all humanoid pool objects
    for (const meshes of this.humanoidPool) {
      this._disposeMeshes(meshes);
    }
    this.humanoidPool.length = 0;
    this.humanoidFreeList.length = 0;
    this.humanoidActive.clear();

    // Release all creature pool objects
    for (const [, pool] of this.creaturePools) {
      for (const meshes of pool) {
        this._disposeMeshes(meshes);
      }
    }
    this.creaturePools.clear();
    this.creatureFreeLists.clear();
    this.creatureActive.clear();

    // Release shared geometries and materials via registry
    this.registry.releaseGeometry({ type: "actor", contentId: "humanoid", variant: "body" });
    this.registry.releaseGeometry({ type: "actor", contentId: "humanoid", variant: "head" });
    this.registry.releaseGeometry({ type: "actor", contentId: "humanoid", variant: "leg" });
    this.registry.releaseGeometry({ type: "actor", contentId: "humanoid", variant: "arm" });
    this.registry.releaseGeometry({ type: "actor", contentId: "humanoid", variant: "marker" });

    this.registry.releaseMaterial({ type: "actor", contentId: "player" });
    this.registry.releaseMaterial({ type: "actor", contentId: "npc" });
    this.registry.releaseMaterial({ type: "actor", contentId: "localPlayer" });
    this.registry.releaseMaterial({ type: "actor", contentId: "skin" });
    this.registry.releaseMaterial({ type: "actor", contentId: "leg" });
    this.registry.releaseMaterial({ type: "actor", contentId: "marker" });
    this.registry.releaseMaterial({ type: "actor", contentId: "creature", materialId: "default" });
    this.registry.releaseMaterial({ type: "actor", contentId: "healthBar", materialId: "bg" });
    this.registry.releaseMaterial({ type: "actor", contentId: "healthBar", materialId: "fill" });

    // If we created a private registry, dispose it too
    this.registry.dispose();
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

  /** Return pool statistics for diagnostics. */
  poolStats(): {
    humanoidPoolSize: number;
    humanoidActive: number;
    humanoidFree: number;
    creatureArchetypes: number;
  } {
    let creatureArchetypes = 0;
    for (const [archetype, activeSet] of this.creatureActive) {
      if (activeSet.size > 0 || (this.creaturePools.get(archetype)?.length ?? 0) > 0) {
        creatureArchetypes++;
      }
    }
    return {
      humanoidPoolSize: this.humanoidPool.length,
      humanoidActive: this.humanoidActive.size,
      humanoidFree: this.humanoidFreeList.length,
      creatureArchetypes,
    };
  }

  // --- Private ---

  private _ensureHumanoidResourcesRegistered(): void {
    this.registry.registerGeometry(
      { type: "actor", contentId: "humanoid", variant: "body" },
      () => new BoxGeometry(0.52, TORSO_H, 0.34),
    );
    this.registry.registerGeometry(
      { type: "actor", contentId: "humanoid", variant: "head" },
      () => new BoxGeometry(HEAD_S, HEAD_S, HEAD_S),
    );
    this.registry.registerGeometry(
      { type: "actor", contentId: "humanoid", variant: "leg" },
      () => new BoxGeometry(0.2, LEG_H, 0.24),
    );
    this.registry.registerGeometry(
      { type: "actor", contentId: "humanoid", variant: "arm" },
      () => new BoxGeometry(0.16, LEG_H, 0.22),
    );
    this.registry.registerGeometry(
      { type: "actor", contentId: "humanoid", variant: "marker" },
      () => new SphereGeometry(0.14, 8, 6),
    );

    this.registry.registerMaterial(
      { type: "actor", contentId: "player" },
      () => new MeshLambertMaterial({ color: 0x3a6ea5, flatShading: true }),
    );
    this.registry.registerMaterial(
      { type: "actor", contentId: "npc" },
      () => new MeshLambertMaterial({ color: 0x8b4513, flatShading: true }),
    );
    this.registry.registerMaterial(
      { type: "actor", contentId: "localPlayer" },
      () => new MeshLambertMaterial({ color: 0x4caf50, flatShading: true }),
    );
    this.registry.registerMaterial(
      { type: "actor", contentId: "skin" },
      () => new MeshLambertMaterial({ color: 0xe0ac69, flatShading: true }),
    );
    this.registry.registerMaterial(
      { type: "actor", contentId: "leg" },
      () => new MeshLambertMaterial({ color: 0x394a63, flatShading: true }),
    );
    this.registry.registerMaterial(
      { type: "actor", contentId: "marker" },
      () => new MeshLambertMaterial({ color: 0xffd23f, flatShading: true }),
    );
    this.registry.registerMaterial(
      { type: "actor", contentId: "creature", materialId: "default" },
      () => vertexColorMaterial(),
    );
    this.registry.registerMaterial(
      { type: "actor", contentId: "healthBar", materialId: "bg" },
      () => new SpriteMaterial({ color: 0x400000, depthTest: false }),
    );
    this.registry.registerMaterial(
      { type: "actor", contentId: "healthBar", materialId: "fill" },
      () => new SpriteMaterial({ color: 0x10c010, depthTest: false }),
    );
  }

  private _prewarmHumanoidPool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const meshes = this._createHumanoidMeshes();
      this.humanoidPool.push(meshes);
      this.humanoidFreeList.push(meshes);
    }
  }

  private _ensureCreaturePool(archetype: string, spec: CreatureSpec): void {
    if (this.registeredArchetypes.has(archetype)) return;
    this.registeredArchetypes.add(archetype);

    const geometryKey: RenderResourceKey = { type: "actor", contentId: archetype };
    this.registry.registerGeometry(geometryKey, () => buildCreatureGeometry(spec));
    const geometry = this.registry.getGeometry(geometryKey);

    const pool: ActorMeshes[] = [];
    const freeList: ActorMeshes[] = [];
    for (let i = 0; i < this.poolSize; i++) {
      const meshes = this._createCreatureMeshes(geometry, spec, archetype);
      pool.push(meshes);
      freeList.push(meshes);
    }
    this.creaturePools.set(archetype, pool);
    this.creatureFreeLists.set(archetype, freeList);
    this.creatureActive.set(archetype, new Set());
  }

  private _acquireMeshes(state: ActorState, spec: CreatureSpec): ActorMeshes {
    if (spec.archetype === "humanoid") {
      return this._acquireHumanoidMeshes(state);
    }
    return this._acquireCreatureMeshes(spec);
  }

  private _releaseMeshes(meshes: ActorMeshes): void {
    const archetype = meshes.group.userData.archetype as string | undefined;
    if (archetype === undefined || archetype === HUMANOID_RESOURCE_KEY) {
      // Humanoid
      if (this.humanoidActive.has(meshes)) {
        this.humanoidActive.delete(meshes);
        this._resetMeshes(meshes);
        this.humanoidFreeList.push(meshes);
      }
    } else {
      // Creature
      const activeSet = this.creatureActive.get(archetype);
      if (activeSet?.has(meshes)) {
        activeSet.delete(meshes);
        this._resetMeshes(meshes);
        const freeList = this.creatureFreeLists.get(archetype);
        if (freeList) freeList.push(meshes);
      }
    }
  }

  private _resetMeshes(meshes: ActorMeshes): void {
    this.actorGroup.remove(meshes.group);
    meshes.group.visible = false;
    meshes.group.position.set(0, 0, 0);
    meshes.group.rotation.set(0, 0, 0);
    meshes.group.scale.set(1, 1, 1);
    if (meshes.healthBar) {
      meshes.healthBar.group.visible = false;
    }
    // Reset body userData
    meshes.body.userData = {};
  }

  private _disposeMeshes(meshes: ActorMeshes): void {
    this.actorGroup.remove(meshes.group);
    meshes.group.clear();
    // Do not dispose shared geometry or materials
  }

  private _acquireHumanoidMeshes(state: ActorState): ActorMeshes {
    let meshes = this.humanoidFreeList.pop();
    if (!meshes) {
      meshes = this._createHumanoidMeshes();
      this.humanoidPool.push(meshes);
    }
    this.humanoidActive.add(meshes);

    const isLocalPlayer = state.isLocalPlayer;
    const kind = state.kind;
    const tunicMaterial = isLocalPlayer
      ? this.localPlayerMaterial
      : kind === "npc"
        ? this.npcMaterial
        : this.playerMaterial;

    meshes.body.material = tunicMaterial;
    for (let i = 2; i < meshes.parts.length; i++) {
      // arms use tunicMaterial
      const part = meshes.parts[i];
      if (part) part.material = tunicMaterial;
    }

    meshes.body.userData = { entityId: state.entityId, kind };
    if (meshes.marker) {
      meshes.marker.visible = isLocalPlayer;
    }
    meshes.group.visible = true;
    meshes.group.position.copy(state.visualPosition);
    meshes.group.position.y += GROUND_OFFSET;
    this.actorGroup.add(meshes.group);
    return meshes;
  }

  private _acquireCreatureMeshes(spec: CreatureSpec): ActorMeshes {
    const archetype = spec.archetype;
    this._ensureCreaturePool(archetype, spec);

    const freeList = this.creatureFreeLists.get(archetype);
    const activeSet = this.creatureActive.get(archetype);
    if (!freeList || !activeSet) {
      throw new Error(`Creature pool for ${archetype} not found after prewarm`);
    }

    let meshes = freeList.pop();
    if (!meshes) {
      const geometryKey: RenderResourceKey = { type: "actor", contentId: archetype };
      const geometry = this.registry.getGeometry(geometryKey);
      meshes = this._createCreatureMeshes(geometry, spec, archetype);
      const pool = this.creaturePools.get(archetype);
      if (!pool) {
        throw new Error(`Creature pool for ${archetype} not found after prewarm`);
      }
      pool.push(meshes);
    }
    activeSet.add(meshes);

    meshes.group.scale.setScalar(spec.scale);
    meshes.group.visible = true;
    this.actorGroup.add(meshes.group);
    return meshes;
  }

  private _createHumanoidMeshes(): ActorMeshes {
    const group = new Group();
    group.name = "humanoid";
    group.userData = { archetype: HUMANOID_RESOURCE_KEY };

    const body = new Mesh(this.bodyGeometry, this.playerMaterial);
    body.name = "body";
    body.position.y = TORSO_Y;
    body.castShadow = false;
    body.receiveShadow = false;
    group.add(body);

    const head = new Mesh(this.headGeometry, this.skinMaterial);
    head.name = "head";
    head.position.y = HEAD_Y;

    const leftLeg = new Mesh(this.legGeometry, this.legMaterial);
    leftLeg.name = "leftLeg";
    leftLeg.position.set(-0.13, LEG_Y, 0);
    const rightLeg = new Mesh(this.legGeometry, this.legMaterial);
    rightLeg.name = "rightLeg";
    rightLeg.position.set(0.13, LEG_Y, 0);

    const leftArm = new Mesh(this.armGeometry, this.playerMaterial);
    leftArm.name = "leftArm";
    leftArm.position.set(-0.34, ARM_Y, 0);
    const rightArm = new Mesh(this.armGeometry, this.playerMaterial);
    rightArm.name = "rightArm";
    rightArm.position.set(0.34, ARM_Y, 0);

    const parts = [head, leftLeg, rightLeg, leftArm, rightArm];
    for (const part of parts) {
      group.add(part);
    }

    const marker = new Mesh(this.markerGeometry, this.markerMaterial);
    marker.name = "marker";
    marker.position.y = HEAD_Y + 0.45;
    group.add(marker);
    // marker is always present but hidden for non-local players via visibility
    marker.visible = false;

    const healthBar = this._createHealthBarGroup();
    healthBar.group.name = "healthBar";
    group.add(healthBar.group);

    return { group, body, parts, marker, healthBar };
  }

  private _createCreatureMeshes(
    geometry: BufferGeometry,
    spec: CreatureSpec,
    archetype: string,
  ): ActorMeshes {
    const group = new Group();
    group.name = `creature_${archetype}`;
    group.userData = { archetype };

    const body = new Mesh(geometry, this.creatureMaterial);
    body.name = "body";
    body.castShadow = false;
    body.receiveShadow = false;
    group.add(body);

    const healthBar = this._createHealthBarGroup();
    healthBar.group.name = "healthBar";
    group.add(healthBar.group);

    group.scale.setScalar(spec.scale);
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

  /**
   * CPU-side quantized animation sampling.
   * Updates actor part transforms at four substeps per 600ms tick.
   * No shader skinning or GPU deformation is used.
   */
  private _sampleAnimation(state: ActorState, meshes: ActorMeshes, nowMs: number): void {
    const quantizedSubstep = Math.floor(nowMs / ANIMATION_SUBSTEP_MS) % ANIMATION_SUBSTEPS_PER_TICK;
    const t = (nowMs % ANIMATION_SUBSTEP_MS) / ANIMATION_SUBSTEP_MS;

    // Reset parts to default positions first
    if (meshes.parts.length > 0) {
      // Humanoid parts: head, leftLeg, rightLeg, leftArm, rightArm
      const head = meshes.parts[0];
      const leftLeg = meshes.parts[1];
      const rightLeg = meshes.parts[2];
      const leftArm = meshes.parts[3];
      const rightArm = meshes.parts[4];

      if (head) head.position.y = HEAD_Y;
      if (leftLeg) leftLeg.position.set(-0.13, LEG_Y, 0);
      if (rightLeg) rightLeg.position.set(0.13, LEG_Y, 0);
      if (leftArm) leftArm.position.set(-0.34, ARM_Y, 0);
      if (rightArm) rightArm.position.set(0.34, ARM_Y, 0);
    }

    switch (state.animationState) {
      case "idle": {
        // Subtle breathing: slight torso bob
        const breathe = Math.sin((quantizedSubstep * Math.PI) / 2) * 0.015;
        meshes.group.position.y += breathe;
        break;
      }
      case "walk": {
        // Bobbing and leg swing
        const bob = Math.sin((quantizedSubstep * Math.PI) / 2) * 0.04;
        meshes.group.position.y += bob;
        if (meshes.parts.length > 0) {
          const leftLeg = meshes.parts[1];
          const rightLeg = meshes.parts[2];
          const leftArm = meshes.parts[3];
          const rightArm = meshes.parts[4];
          const swing = Math.sin((quantizedSubstep * Math.PI) / 2) * 0.08;
          if (leftLeg) leftLeg.position.z = swing;
          if (rightLeg) rightLeg.position.z = -swing;
          if (leftArm) leftArm.position.z = -swing;
          if (rightArm) rightArm.position.z = swing;
        }
        break;
      }
      case "run": {
        // Faster bobbing and larger leg swing
        const bob = Math.sin((quantizedSubstep * Math.PI) / 2) * 0.07;
        meshes.group.position.y += bob;
        if (meshes.parts.length > 0) {
          const leftLeg = meshes.parts[1];
          const rightLeg = meshes.parts[2];
          const leftArm = meshes.parts[3];
          const rightArm = meshes.parts[4];
          const swing = Math.sin((quantizedSubstep * Math.PI) / 2) * 0.14;
          if (leftLeg) leftLeg.position.z = swing;
          if (rightLeg) rightLeg.position.z = -swing;
          if (leftArm) leftArm.rotation.z = swing;
          if (rightArm) rightArm.rotation.z = -swing;
        }
        break;
      }
      case "attack": {
        // Arm swing forward
        if (meshes.parts.length > 0) {
          const rightArm = meshes.parts[4];
          if (rightArm) rightArm.rotation.x = Math.sin((quantizedSubstep * Math.PI) / 2) * 0.6;
        }
        break;
      }
      case "cast": {
        // Arm raise
        if (meshes.parts.length > 0) {
          const leftArm = meshes.parts[3];
          if (leftArm)
            leftArm.rotation.x = -Math.PI / 2 + Math.sin((quantizedSubstep * Math.PI) / 2) * 0.2;
        }
        break;
      }
      case "hit": {
        // Flash red via material tint (temporary, reverted next frame)
        const flash = Math.sin((quantizedSubstep * Math.PI) / 2) > 0;
        if (flash) {
          const originalColor =
            meshes.body.material instanceof MeshLambertMaterial
              ? meshes.body.material.color.getHex()
              : undefined;
          meshes.body.userData._originalColor = originalColor;
          if (meshes.body.material instanceof MeshLambertMaterial) {
            meshes.body.material.color.setHex(0xff0000);
          }
        }
        break;
      }
      case "die": {
        // Collapse
        meshes.group.rotation.x = (Math.PI / 2) * Math.min(1, t);
        meshes.group.scale.y = Math.max(0.1, 1 - t);
        break;
      }
    }
  }
}
