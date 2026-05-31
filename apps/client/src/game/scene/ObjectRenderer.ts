import type { TileCoord } from "@old-town/shared";
import type { Scene } from "three";
import {
  BoxGeometry,
  type BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  type MeshLambertMaterial,
  TetrahedronGeometry,
  Vector3,
} from "three";
import { compose, PALETTE, vertexColorMaterial } from "./lowpoly";

interface ObjectInstance {
  readonly entityId: number;
  readonly mesh: Mesh;
  readonly tile: TileCoord;
  readonly defId: string;
}

interface ObjectTemplate {
  readonly geometry: BufferGeometry;
  readonly material: MeshLambertMaterial;
  readonly scale: Vector3;
  readonly yOffset: number;
}

const objectTemplates = new Map<string, ObjectTemplate>();

function getTemplate(defId: string): ObjectTemplate {
  const existing = objectTemplates.get(defId);
  if (existing) {
    return existing;
  }

  const template = buildTemplate(defId);
  objectTemplates.set(defId, template);
  return template;
}

function buildTemplate(defId: string): ObjectTemplate {
  const geometry = buildGeometry(resolveArchetype(defId), defId);
  return {
    geometry,
    material: vertexColorMaterial(),
    scale: new Vector3(1, 1, 1),
    // Rest props on top of the ~0.1-tall terrain tile surface.
    yOffset: 0.1,
  };
}

/**
 * Visual archetype for an object def. Resolution is keyword-based and purely
 * presentational — gameplay never reads it. Ordered most-specific first; the
 * first matching keyword wins. Unknown defs fall back to a readable crate
 * rather than a featureless cube.
 */
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
        // Bare, leafless silhouette: trunk plus a few jagged branch stubs.
        return compose([
          { geometry: new CylinderGeometry(0.12, 0.18, 1.6, 5), color: trunk, y: 0.8 },
          { geometry: new CylinderGeometry(0.05, 0.08, 0.7, 4), color: trunk, x: 0.2, y: 1.4, rotZ: -0.7 },
          { geometry: new CylinderGeometry(0.05, 0.08, 0.6, 4), color: trunk, x: -0.18, y: 1.5, rotZ: 0.8 },
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
      // Stone block, stubby chimney, and a glowing fire mouth.
      return compose([
        { geometry: new BoxGeometry(1.0, 1.0, 1.0), color: PALETTE.stoneDark, y: 0.5 },
        { geometry: new BoxGeometry(0.34, 0.7, 0.34), color: PALETTE.stoneMid, x: 0.0, y: 1.3, z: -0.2 },
        { geometry: new BoxGeometry(0.46, 0.42, 0.16), color: PALETTE.ember, y: 0.42, z: 0.5 },
        { geometry: new BoxGeometry(0.3, 0.26, 0.12), color: PALETTE.flame, y: 0.4, z: 0.55 },
      ]);
    }
    case "kiln": {
      // Domed clay kiln with a glowing opening.
      const dome = new IcosahedronGeometry(0.62, 1);
      dome.scale(1, 0.8, 1);
      return compose([
        { geometry: new CylinderGeometry(0.62, 0.7, 0.7, 8), color: PALETTE.clay, y: 0.35 },
        { geometry: dome, color: PALETTE.clay, y: 0.7 },
        { geometry: new BoxGeometry(0.34, 0.34, 0.12), color: PALETTE.ember, y: 0.4, z: 0.66 },
      ]);
    }
    case "hearth": {
      // Open stone hearth with embers and a hanging pot.
      return compose([
        { geometry: new BoxGeometry(1.0, 0.45, 0.8), color: PALETTE.stoneMid, y: 0.22 },
        { geometry: new BoxGeometry(0.7, 0.16, 0.5), color: PALETTE.coal, y: 0.5 },
        { geometry: new ConeGeometry(0.3, 0.4, 6), color: PALETTE.flame, y: 0.66 },
        { geometry: new ConeGeometry(0.18, 0.28, 6), color: PALETTE.ember, y: 0.82 },
      ]);
    }
    case "anvil": {
      // Dark iron anvil on a wooden stump.
      return compose([
        { geometry: new CylinderGeometry(0.26, 0.3, 0.5, 7), color: PALETTE.barkMid, y: 0.25 },
        { geometry: new BoxGeometry(0.6, 0.18, 0.28), color: PALETTE.iron, y: 0.6 },
        { geometry: new BoxGeometry(0.3, 0.16, 0.24), color: PALETTE.iron, y: 0.76 },
        { geometry: new ConeGeometry(0.13, 0.34, 4), color: PALETTE.iron, x: -0.36, y: 0.76, rotZ: Math.PI / 2 },
      ]);
    }
    case "vat": {
      // Barrel vat brimming with dye.
      return compose([
        { geometry: new CylinderGeometry(0.42, 0.46, 0.8, 9), color: PALETTE.barkMid, y: 0.4 },
        { geometry: new CylinderGeometry(0.36, 0.36, 0.06, 9), color: PALETTE.dye, y: 0.82 },
        { geometry: new CylinderGeometry(0.48, 0.48, 0.08, 9), color: PALETTE.iron, y: 0.5 },
      ]);
    }
    case "loom": {
      // Upright frame strung with threads.
      return compose([
        { geometry: new BoxGeometry(0.12, 1.2, 0.12), color: PALETTE.barkMid, x: -0.5, y: 0.6 },
        { geometry: new BoxGeometry(0.12, 1.2, 0.12), color: PALETTE.barkMid, x: 0.5, y: 0.6 },
        { geometry: new BoxGeometry(1.1, 0.12, 0.12), color: PALETTE.barkLight, y: 1.1 },
        { geometry: new BoxGeometry(0.9, 0.7, 0.02), color: PALETTE.clothCream, y: 0.72 },
      ]);
    }
    case "frame": {
      // A-frame stretched with a drying hide.
      return compose([
        { geometry: new BoxGeometry(0.1, 1.0, 0.1), color: PALETTE.barkMid, x: -0.45, y: 0.5, rotZ: 0.18 },
        { geometry: new BoxGeometry(0.1, 1.0, 0.1), color: PALETTE.barkMid, x: 0.45, y: 0.5, rotZ: -0.18 },
        { geometry: new BoxGeometry(0.72, 0.66, 0.04), color: PALETTE.leather, y: 0.62 },
      ]);
    }
    case "counter": {
      // Service counter: a top slab on a solid base.
      return compose([
        { geometry: new BoxGeometry(1.1, 0.7, 0.5), color: PALETTE.barkMid, y: 0.35, z: 0.1 },
        { geometry: new BoxGeometry(1.2, 0.12, 0.62), color: PALETTE.barkLight, y: 0.74, z: 0.08 },
      ]);
    }
    case "table": {
      // Four legs and a top, with a little clutter.
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
      // Crate body with a rounded lid and a clasp.
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
        { geometry: new BoxGeometry(0.1, 0.1, 0.12), color: PALETTE.goldMetal, x: 0.28, y: 0.75, z: 0.1 },
      ]);
    }
    case "bell": {
      // Two posts, a crossbeam, and a hanging bell.
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
      // Two stone pillars under a lintel.
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
        { geometry: new ConeGeometry(0.85, 0.7, 4), color: PALETTE.clothRed, rotY: Math.PI / 4, y: 1.62 },
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
      // Crate: a slatted wooden box. Far more legible than a bare cube.
      return compose([
        { geometry: new BoxGeometry(0.74, 0.66, 0.74), color: PALETTE.barkMid, y: 0.43 },
        { geometry: new BoxGeometry(0.8, 0.12, 0.8), color: PALETTE.barkDark, y: 0.74 },
        { geometry: new BoxGeometry(0.8, 0.12, 0.8), color: PALETTE.barkDark, y: 0.12 },
        { geometry: new TetrahedronGeometry(0.1), color: PALETTE.barkLight, y: 0.84 },
      ]);
    }
  }
}

export interface ObjectRendererOptions {
  readonly scene: Scene;
}

/**
 * Object renderer for static and dynamic world objects (trees, rocks, buildings, doors).
 * Uses shared geometry/materials and a mesh pool to avoid creating unique meshes/materials
 * for every object instance.
 */
export class ObjectRenderer {
  private readonly scene: Scene;
  private readonly objects = new Map<number, ObjectInstance>();
  private readonly objectGroup = new Group();
  private readonly meshPool = new Map<string, Mesh[]>();

  constructor(options: ObjectRendererOptions) {
    this.scene = options.scene;
    this.objectGroup.name = "objects";
    this.scene.add(this.objectGroup);
  }

  /** Spawn an object at a tile. Reuses pooled meshes when available. */
  spawn(entityId: number, tile: TileCoord, defId: string): void {
    if (this.objects.has(entityId)) {
      this.remove(entityId);
    }

    const template = getTemplate(defId);
    const yOffset = template.yOffset;
    const scale = template.scale;
    const mesh = this._acquireMesh(defId, template);
    mesh.position.set(tile.x, yOffset, -tile.y);
    mesh.scale.copy(scale);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.visible = true;
    mesh.name = `object_${entityId}`;
    mesh.userData = { entityId, kind: "object", defId };

    this.objectGroup.add(mesh);
    this.objects.set(entityId, {
      entityId,
      mesh,
      tile,
      defId,
    });
  }

  /** Remove an object by entity ID. Returns mesh to pool for reuse. */
  remove(entityId: number): void {
    const obj = this.objects.get(entityId);
    if (!obj) return;
    this.objectGroup.remove(obj.mesh);
    this._releaseMesh(obj.defId, obj.mesh);
    this.objects.delete(entityId);
  }

  /** Update an object's transform (rotation, state). */
  updateTransform(entityId: number, rotation: number): void {
    const obj = this.objects.get(entityId);
    if (!obj) return;
    obj.mesh.rotation.y = (rotation * Math.PI) / 2;
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
  }

  dispose(): void {
    this.clear();
    for (const meshes of this.meshPool.values()) {
      for (const mesh of meshes) {
        mesh.clear();
      }
    }
    this.meshPool.clear();
    // Dispose templates
    for (const template of objectTemplates.values()) {
      template.geometry.dispose();
      template.material.dispose();
    }
    objectTemplates.clear();
    this.objectGroup.clear();
    this.scene.remove(this.objectGroup);
  }

  /** Number of rendered objects. */
  get objectCount(): number {
    return this.objects.size;
  }

  /** Return all object meshes for raycasting. */
  getRaycastTargets(): Mesh[] {
    const targets: Mesh[] = [];
    for (const obj of this.objects.values()) {
      targets.push(obj.mesh);
    }
    return targets;
  }

  private _acquireMesh(defId: string, template: ObjectTemplate): Mesh {
    const pool = this.meshPool.get(defId);
    const material = template.material;
    const geometry = template.geometry;
    if (pool && pool.length > 0) {
      const mesh = pool.pop();
      if (mesh) {
        mesh.material = material;
        mesh.geometry = geometry;
        mesh.rotation.set(0, 0, 0);
        return mesh;
      }
    }
    return new Mesh(geometry, material);
  }

  private _releaseMesh(defId: string, mesh: Mesh): void {
    let pool = this.meshPool.get(defId);
    if (!pool) {
      pool = [];
      this.meshPool.set(defId, pool);
    }
    mesh.visible = false;
    mesh.userData = {};
    pool.push(mesh);
  }
}
