import type { TileCoord } from "@old-town/shared";
import type { BufferGeometry, MeshLambertMaterial, Scene } from "three";
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  TetrahedronGeometry,
  Vector3,
} from "three";
import { InstanceBucket, type InstanceBucketKey } from "../renderer/InstanceBucket";
import { type RenderResourceKey, RenderResourceRegistry } from "../renderer/RenderResourceRegistry";
import { compose, PALETTE, vertexColorMaterial } from "./lowpoly";

interface ObjectInstance {
  readonly entityId: number;
  readonly tile: TileCoord;
  readonly defId: string;
  readonly archetypeId: string;
  readonly bucketKey: string;
  readonly slot: number;
}

/** Visual archetype for an object def. Resolution is keyword-based and purely
 * presentational — gameplay never reads it. Ordered most-specific first; the
 * first matching keyword wins. Unknown defs fall back to a readable crate
 * rather than a featureless cube. */
function resolveArchetype(defId: string): string {
  const id = defId;
  const has = (...keys: string[]): boolean => keys.some((k) => id.includes(k));

  if (has("tree", "stave", "timber", "log")) return "tree";
  if (has("ore", "rock", "deposit", "outcrop", "stone", "coal", "node")) return "ore_rock";
  if (has("furnace", "foundry_furnace")) return "furnace";
  if (has("kiln", "oven")) return "kiln";
  if (has("hearth", "range", "forge", "brazier", "smoke_vent", "vent")) return "hearth";
  if (has("anvil")) return "anvil";
  if (has("vat", "dye")) return "vat";
  if (has("loom")) return "loom";
  if (has("frame", "tanning")) return "frame";
  if (has("counter", "stall", "stoop")) return "counter";
  if (has("desk", "table", "bench", "board", "ledger")) return "table";
  if (has("chest", "supply")) return "chest";
  if (has("door", "hatch")) return "door";
  if (has("bell")) return "bell";
  if (has("signpost", "sign")) return "signpost";
  if (has("arch", "gravegate")) return "arch";
  if (has("flower")) return "flower";
  if (has("clay")) return "rock";
  if (has("building", "house", "hall")) return "building";
  return "crate";
}

/** Bark tone for a wood prop, inferred from the def keyword. */
function woodTone(defId: string): number {
  if (defId.includes("dry") || defId.includes("dead") || defId.includes("scrub")) {
    return PALETTE.deadWood;
  }
  return PALETTE.barkMid;
}

/** Ore-vein tone for a rock node, inferred from the def keyword. */
function oreTone(defId: string): number {
  if (defId.includes("copper") || defId.includes("penny")) return PALETTE.oreCopper;
  if (defId.includes("coal") || defId.includes("black")) return PALETTE.oreCoal;
  if (defId.includes("tin") || defId.includes("silver")) return PALETTE.silver;
  return PALETTE.oreIron;
}

function buildGeometry(archetype: string, defId: string): BufferGeometry {
  switch (archetype) {
    case "tree": {
      const dead = defId.includes("dry") || defId.includes("dead");
      const trunk = woodTone(defId);
      if (dead) {
        return compose([
          { geometry: new CylinderGeometry(0.12, 0.18, 1.6, 5), color: trunk, y: 0.8 },
          {
            geometry: new CylinderGeometry(0.05, 0.08, 0.7, 4),
            color: trunk,
            x: 0.2,
            y: 1.4,
            rotZ: -0.7,
          },
          {
            geometry: new CylinderGeometry(0.05, 0.08, 0.6, 4),
            color: trunk,
            x: -0.18,
            y: 1.5,
            rotZ: 0.8,
          },
        ]);
      }
      return compose([
        { geometry: new CylinderGeometry(0.13, 0.17, 0.85, 6), color: trunk, y: 0.42 },
        { geometry: new ConeGeometry(0.75, 0.95, 7), color: PALETTE.leafDark, y: 1.05 },
        { geometry: new ConeGeometry(0.58, 0.85, 7), color: PALETTE.leafMid, y: 1.55 },
        { geometry: new ConeGeometry(0.4, 0.75, 7), color: PALETTE.leafLight, y: 2.0 },
      ]);
    }
    case "ore_rock": {
      const stone = new IcosahedronGeometry(0.5, 0);
      stone.scale(1.1, 0.85, 1.0);
      const vein = oreTone(defId);
      return compose([
        { geometry: stone, color: PALETTE.stoneMid, y: 0.42, jitter: 0.06, seed: 3 },
        { geometry: new IcosahedronGeometry(0.17, 0), color: vein, x: -0.2, y: 0.52, z: 0.2 },
        { geometry: new IcosahedronGeometry(0.13, 0), color: vein, x: 0.22, y: 0.36, z: -0.12 },
      ]);
    }
    case "furnace": {
      return compose([
        { geometry: new BoxGeometry(1.0, 1.0, 1.0), color: PALETTE.stoneDark, y: 0.5 },
        {
          geometry: new BoxGeometry(0.34, 0.7, 0.34),
          color: PALETTE.stoneMid,
          x: 0.0,
          y: 1.3,
          z: -0.2,
        },
        { geometry: new BoxGeometry(0.46, 0.42, 0.16), color: PALETTE.ember, y: 0.42, z: 0.5 },
        { geometry: new BoxGeometry(0.3, 0.26, 0.12), color: PALETTE.flame, y: 0.4, z: 0.55 },
      ]);
    }
    case "kiln": {
      const dome = new IcosahedronGeometry(0.62, 1);
      dome.scale(1, 0.8, 1);
      return compose([
        { geometry: new CylinderGeometry(0.62, 0.7, 0.7, 8), color: PALETTE.clay, y: 0.35 },
        { geometry: dome, color: PALETTE.clay, y: 0.7 },
        { geometry: new BoxGeometry(0.34, 0.34, 0.12), color: PALETTE.ember, y: 0.4, z: 0.66 },
      ]);
    }
    case "hearth": {
      return compose([
        { geometry: new BoxGeometry(1.0, 0.45, 0.8), color: PALETTE.stoneMid, y: 0.22 },
        { geometry: new BoxGeometry(0.7, 0.16, 0.5), color: PALETTE.coal, y: 0.5 },
        { geometry: new ConeGeometry(0.3, 0.4, 6), color: PALETTE.flame, y: 0.66 },
        { geometry: new ConeGeometry(0.18, 0.28, 6), color: PALETTE.ember, y: 0.82 },
      ]);
    }
    case "anvil": {
      return compose([
        { geometry: new CylinderGeometry(0.26, 0.3, 0.5, 7), color: PALETTE.barkMid, y: 0.25 },
        { geometry: new BoxGeometry(0.6, 0.18, 0.28), color: PALETTE.iron, y: 0.6 },
        { geometry: new BoxGeometry(0.3, 0.16, 0.24), color: PALETTE.iron, y: 0.76 },
        {
          geometry: new ConeGeometry(0.13, 0.34, 4),
          color: PALETTE.iron,
          x: -0.36,
          y: 0.76,
          rotZ: Math.PI / 2,
        },
      ]);
    }
    case "vat": {
      return compose([
        { geometry: new CylinderGeometry(0.42, 0.46, 0.8, 9), color: PALETTE.barkMid, y: 0.4 },
        { geometry: new CylinderGeometry(0.36, 0.36, 0.06, 9), color: PALETTE.dye, y: 0.82 },
        { geometry: new CylinderGeometry(0.48, 0.48, 0.08, 9), color: PALETTE.iron, y: 0.5 },
      ]);
    }
    case "loom": {
      return compose([
        { geometry: new BoxGeometry(0.12, 1.2, 0.12), color: PALETTE.barkMid, x: -0.5, y: 0.6 },
        { geometry: new BoxGeometry(0.12, 1.2, 0.12), color: PALETTE.barkMid, x: 0.5, y: 0.6 },
        { geometry: new BoxGeometry(1.1, 0.12, 0.12), color: PALETTE.barkLight, y: 1.1 },
        { geometry: new BoxGeometry(0.9, 0.7, 0.02), color: PALETTE.clothCream, y: 0.72 },
      ]);
    }
    case "frame": {
      return compose([
        {
          geometry: new BoxGeometry(0.1, 1.0, 0.1),
          color: PALETTE.barkMid,
          x: -0.45,
          y: 0.5,
          rotZ: 0.18,
        },
        {
          geometry: new BoxGeometry(0.1, 1.0, 0.1),
          color: PALETTE.barkMid,
          x: 0.45,
          y: 0.5,
          rotZ: -0.18,
        },
        { geometry: new BoxGeometry(0.72, 0.66, 0.04), color: PALETTE.leather, y: 0.62 },
      ]);
    }
    case "counter": {
      return compose([
        { geometry: new BoxGeometry(1.1, 0.7, 0.5), color: PALETTE.barkMid, y: 0.35, z: 0.1 },
        { geometry: new BoxGeometry(1.2, 0.12, 0.62), color: PALETTE.barkLight, y: 0.74, z: 0.08 },
      ]);
    }
    case "table": {
      const leg = (x: number, z: number) => ({
        geometry: new BoxGeometry(0.1, 0.5, 0.1),
        color: PALETTE.barkDark,
        x,
        y: 0.25,
        z,
      });
      return compose([
        leg(-0.45, -0.3),
        leg(0.45, -0.3),
        leg(-0.45, 0.3),
        leg(0.45, 0.3),
        { geometry: new BoxGeometry(1.1, 0.1, 0.8), color: PALETTE.barkMid, y: 0.55 },
        { geometry: new BoxGeometry(0.3, 0.18, 0.22), color: PALETTE.clothCream, x: 0.2, y: 0.69 },
      ]);
    }
    case "chest": {
      const lid = new CylinderGeometry(0.42, 0.42, 0.78, 8, 1, false, 0, Math.PI);
      return compose([
        { geometry: new BoxGeometry(0.82, 0.46, 0.56), color: PALETTE.barkMid, y: 0.23 },
        { geometry: lid, color: PALETTE.barkLight, y: 0.46, rotZ: Math.PI / 2, rotY: Math.PI / 2 },
        { geometry: new BoxGeometry(0.1, 0.14, 0.06), color: PALETTE.goldMetal, y: 0.46, z: 0.29 },
      ]);
    }
    case "door": {
      return compose([
        { geometry: new BoxGeometry(0.85, 1.5, 0.16), color: PALETTE.barkMid, y: 0.75 },
        {
          geometry: new BoxGeometry(0.1, 0.1, 0.12),
          color: PALETTE.goldMetal,
          x: 0.28,
          y: 0.75,
          z: 0.1,
        },
      ]);
    }
    case "bell": {
      const bell = new CylinderGeometry(0.28, 0.36, 0.5, 8, 1, true);
      return compose([
        { geometry: new BoxGeometry(0.1, 1.4, 0.1), color: PALETTE.barkMid, x: -0.45, y: 0.7 },
        { geometry: new BoxGeometry(0.1, 1.4, 0.1), color: PALETTE.barkMid, x: 0.45, y: 0.7 },
        { geometry: new BoxGeometry(1.1, 0.12, 0.1), color: PALETTE.barkLight, y: 1.36 },
        { geometry: bell, color: PALETTE.bronze, y: 1.0 },
      ]);
    }
    case "signpost": {
      return compose([
        { geometry: new CylinderGeometry(0.08, 0.08, 1.4, 6), color: PALETTE.barkMid, y: 0.7 },
        { geometry: new BoxGeometry(0.7, 0.34, 0.06), color: PALETTE.barkLight, y: 1.2, z: 0.06 },
      ]);
    }
    case "arch": {
      return compose([
        { geometry: new BoxGeometry(0.3, 1.7, 0.3), color: PALETTE.stoneMid, x: -0.7, y: 0.85 },
        { geometry: new BoxGeometry(0.3, 1.7, 0.3), color: PALETTE.stoneMid, x: 0.7, y: 0.85 },
        { geometry: new BoxGeometry(1.9, 0.34, 0.34), color: PALETTE.stoneLight, y: 1.85 },
      ]);
    }
    case "flower": {
      return compose([
        { geometry: new CylinderGeometry(0.02, 0.02, 0.3, 4), color: PALETTE.leafMid, y: 0.15 },
        { geometry: new IcosahedronGeometry(0.12, 0), color: PALETTE.clothRed, y: 0.34 },
      ]);
    }
    case "building": {
      return compose([
        { geometry: new BoxGeometry(1.0, 1.3, 1.0), color: PALETTE.clothCream, y: 0.65 },
        {
          geometry: new ConeGeometry(0.85, 0.7, 4),
          color: PALETTE.clothRed,
          rotY: Math.PI / 4,
          y: 1.62,
        },
      ]);
    }
    case "rock": {
      const base = new IcosahedronGeometry(0.55, 0);
      base.scale(1.1, 0.7, 1.0);
      return compose([
        { geometry: base, color: PALETTE.stoneMid, y: 0.38, jitter: 0.07, seed: 5 },
        {
          geometry: new IcosahedronGeometry(0.3, 0),
          color: PALETTE.stoneDark,
          x: 0.26,
          y: 0.32,
          z: -0.16,
        },
      ]);
    }
    default: {
      return compose([
        { geometry: new BoxGeometry(0.74, 0.66, 0.74), color: PALETTE.barkMid, y: 0.43 },
        { geometry: new BoxGeometry(0.8, 0.12, 0.8), color: PALETTE.barkDark, y: 0.74 },
        { geometry: new BoxGeometry(0.8, 0.12, 0.8), color: PALETTE.barkDark, y: 0.12 },
        { geometry: new TetrahedronGeometry(0.1), color: PALETTE.barkLight, y: 0.84 },
      ]);
    }
  }
}

function computeRegionId(tile: TileCoord): string {
  const regionSize = 64;
  const rx = Math.floor(tile.x / regionSize);
  const ry = Math.floor(tile.y / regionSize);
  return `r${rx}:${ry}:${tile.plane}`;
}

function makeBucketKey(
  archetypeId: string,
  materialId: string,
  regionId: string,
  layer: string,
): string {
  return `${archetypeId}:${materialId}:${regionId}:${layer}`;
}

export interface ObjectRendererOptions {
  readonly scene: Scene;
  readonly registry?: RenderResourceRegistry;
}

/**
 * Object renderer for static and dynamic world objects (trees, rocks, buildings, doors).
 * Uses InstanceBuckets keyed by archetype+material+region+layer to batch draw calls.
 * Geometry and material are obtained through RenderResourceRegistry.
 */
export class ObjectRenderer {
  private readonly scene: Scene;
  private readonly registry: RenderResourceRegistry;
  private readonly objects = new Map<number, ObjectInstance>();
  private readonly buckets = new Map<string, InstanceBucket>();
  private readonly objectGroup = new Group();
  private readonly flushPending = new Set<string>();
  private readonly _registeredArchetypes = new Set<string>();
  private readonly _scratchPos = new Vector3();
  private readonly _scratchQuat = new Quaternion();
  private readonly _scratchScale = new Vector3();
  private readonly _scratchMatrix = new Matrix4();
  private _frameId = 0;

  constructor(options: ObjectRendererOptions) {
    this.scene = options.scene;
    this.registry = options.registry ?? new RenderResourceRegistry();
    this.objectGroup.name = "objects";
    this.scene.add(this.objectGroup);
  }

  /** Spawn an object at a tile. Acquires a slot in the correct bucket. */
  spawn(entityId: number, tile: TileCoord, defId: string): void {
    if (this.objects.has(entityId)) {
      this.remove(entityId);
    }

    const archetypeId = resolveArchetype(defId);
    const regionId = computeRegionId(tile);
    const materialId = "default";
    const layer = "objects";
    const keyStr = makeBucketKey(archetypeId, materialId, regionId, layer);

    const bucket = this._getOrCreateBucket(keyStr, archetypeId, regionId, materialId, layer);
    let slot = bucket.acquire(entityId);
    if (slot === null) {
      bucket.growCapacity(Math.max(bucket.stats().capacity * 2, 16));
      slot = bucket.acquire(entityId);
      if (slot === null) return;
    }

    this._scratchPos.set(tile.x, 0.1, -tile.y);
    this._scratchQuat.set(0, 0, 0, 1);
    this._scratchScale.set(1, 1, 1);
    this._scratchMatrix.compose(this._scratchPos, this._scratchQuat, this._scratchScale);
    bucket.writeTransform(entityId, this._scratchMatrix);

    this.objects.set(entityId, {
      entityId,
      tile,
      defId,
      archetypeId,
      bucketKey: keyStr,
      slot,
    });

    this._updateBucketUserData(keyStr);
    this._markPending(keyStr);
  }

  /** Remove an object by entity ID. Releases its bucket slot. */
  remove(entityId: number): void {
    const obj = this.objects.get(entityId);
    if (!obj) return;

    this.objects.delete(entityId);

    const bucket = this.buckets.get(obj.bucketKey);
    if (bucket) {
      bucket.release(entityId);
      this._updateBucketUserData(obj.bucketKey);
      this._markPending(obj.bucketKey);
    }
  }

  /** Update an object's transform (rotation). */
  updateTransform(entityId: number, rotation: number): void {
    const obj = this.objects.get(entityId);
    if (!obj) return;

    const bucket = this.buckets.get(obj.bucketKey);
    if (!bucket) return;

    const angle = (rotation * Math.PI) / 2;
    this._scratchPos.set(obj.tile.x, 0.1, -obj.tile.y);
    this._scratchQuat.set(0, Math.sin(angle / 2), 0, Math.cos(angle / 2));
    this._scratchScale.set(1, 1, 1);
    this._scratchMatrix.compose(this._scratchPos, this._scratchQuat, this._scratchScale);
    bucket.writeTransform(entityId, this._scratchMatrix);
    this._markPending(obj.bucketKey);
  }

  /** Replace the object's render definition while keeping its authoritative tile. */
  transform(entityId: number, defId: string): void {
    const obj = this.objects.get(entityId);
    if (!obj) return;
    this.remove(entityId);
    this.spawn(entityId, obj.tile, defId);
  }

  /** Clear all objects. */
  clear(): void {
    for (const id of Array.from(this.objects.keys())) {
      this.remove(id);
    }
    for (const bucket of this.buckets.values()) {
      bucket.flush(this._frameId);
    }
    this.flushPending.clear();
  }

  dispose(): void {
    this.clear();
    for (const bucket of this.buckets.values()) {
      bucket.dispose();
    }
    this.buckets.clear();

    for (const archetypeId of this._registeredArchetypes) {
      this.registry.releaseGeometry({ type: "prop", contentId: archetypeId });
      this.registry.releaseMaterial({
        type: "prop",
        contentId: archetypeId,
        materialId: "default",
      });
    }
    this._registeredArchetypes.clear();

    this.objectGroup.clear();
    this.scene.remove(this.objectGroup);
  }

  /** Number of rendered objects. */
  get objectCount(): number {
    return this.objects.size;
  }

  /** Return all bucket meshes for raycasting. */
  getRaycastTargets(): import("three").Mesh[] {
    const targets: import("three").Mesh[] = [];
    for (const bucket of this.buckets.values()) {
      targets.push(bucket.mesh);
    }
    return targets;
  }

  /** Flush all changed buckets. Call once per render frame. */
  flush(frameId: number): void {
    this._frameId = frameId;
    for (const keyStr of this.flushPending) {
      const bucket = this.buckets.get(keyStr);
      if (bucket) {
        bucket.flush(frameId);
      }
    }
    this.flushPending.clear();
  }

  /** Cull or show all buckets belonging to a region without destroying slots. */
  setRegionVisible(regionId: string, visible: boolean): void {
    for (const bucket of this.buckets.values()) {
      if (bucket.key.regionId === regionId) {
        bucket.mesh.visible = visible;
      }
    }
  }

  private _getOrCreateBucket(
    keyStr: string,
    archetypeId: string,
    regionId: string,
    materialId: string,
    layer: string,
  ): InstanceBucket {
    let bucket = this.buckets.get(keyStr);
    if (bucket) return bucket;

    this._ensureArchetypeRegistered(archetypeId);

    const geometryKey: RenderResourceKey = { type: "prop", contentId: archetypeId };
    const materialKey: RenderResourceKey = { type: "prop", contentId: archetypeId, materialId };

    const geometry = this.registry.getGeometry(geometryKey);
    const material = this.registry.getMaterial(materialKey);

    const key: InstanceBucketKey = { archetypeId, materialId, regionId, layer };
    bucket = new InstanceBucket(key, {
      geometry,
      material,
      initialCapacity: 16,
    });

    this.objectGroup.add(bucket.mesh);
    this.buckets.set(keyStr, bucket);
    return bucket;
  }

  private _ensureArchetypeRegistered(archetypeId: string): void {
    if (this._registeredArchetypes.has(archetypeId)) return;
    this._registeredArchetypes.add(archetypeId);

    const geometryKey: RenderResourceKey = { type: "prop", contentId: archetypeId };
    const materialKey: RenderResourceKey = {
      type: "prop",
      contentId: archetypeId,
      materialId: "default",
    };

    this.registry.registerGeometry(geometryKey, () => {
      return buildGeometry(archetypeId, `${archetypeId}_default`);
    });

    this.registry.registerMaterial(materialKey, () => {
      return vertexColorMaterial();
    });
  }

  private _updateBucketUserData(keyStr: string): void {
    const bucket = this.buckets.get(keyStr);
    if (!bucket) return;
    const instanceMap: { entityId: number; defId: string }[] = [];
    for (const obj of this.objects.values()) {
      if (obj.bucketKey === keyStr) {
        instanceMap[obj.slot] = { entityId: obj.entityId, defId: obj.defId };
      }
    }
    bucket.mesh.userData = {
      kind: "object",
      instanceMap,
    };
  }

  private _markPending(keyStr: string): void {
    this.flushPending.add(keyStr);
  }
}
