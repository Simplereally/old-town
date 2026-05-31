import type { TileCoord } from "@old-town/shared";
import type { Scene } from "three";
import {
  BoxGeometry,
  BufferAttribute,
  type BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshLambertMaterial,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

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

/** A single coloured chunk of a composite low-poly prop, in local space. */
interface Part {
  readonly geometry: BufferGeometry;
  readonly color: number;
  readonly x?: number;
  readonly y?: number;
  readonly z?: number;
  readonly rotY?: number;
}

/** Bake a flat vertex colour onto every vertex of a geometry, in place. */
function paint(geometry: BufferGeometry, color: number): void {
  const c = new Color(color);
  const count = geometry.getAttribute("position").count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
}

/**
 * Merge several coloured primitives into one vertex-coloured BufferGeometry.
 * Each object is a single Mesh sharing one geometry + one material, which keeps
 * pooling cheap and matches the renderer's one-mesh-per-object contract.
 */
function compose(parts: Part[]): BufferGeometry {
  const geometries = parts.map((part) => {
    // Non-indexed so flat shading and the colour attribute stay consistent.
    const geometry = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry;
    paint(geometry, part.color);
    if (part.rotY) {
      geometry.rotateY(part.rotY);
    }
    geometry.translate(part.x ?? 0, part.y ?? 0, part.z ?? 0);
    return geometry;
  });
  const merged = mergeGeometries(geometries, false);
  if (!merged) {
    throw new Error("Failed to merge object geometry");
  }
  return merged;
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

function vertexColorMaterial(): MeshLambertMaterial {
  return new MeshLambertMaterial({ vertexColors: true, flatShading: true });
}

function buildTemplate(defId: string): ObjectTemplate {
  const type = defIdToType(defId);
  const geometry = buildGeometry(type);
  return {
    geometry,
    material: vertexColorMaterial(),
    scale: new Vector3(1, 1, 1),
    // Rest props on top of the ~0.1-tall terrain tile surface.
    yOffset: 0.1,
  };
}

function buildGeometry(type: string): BufferGeometry {
  switch (type) {
    case "tree": {
      // Stubby trunk topped with three tapering foliage cones.
      return compose([
        { geometry: new CylinderGeometry(0.13, 0.17, 0.85, 6), color: 0x6b4a2b, y: 0.42 },
        { geometry: new ConeGeometry(0.75, 0.95, 7), color: 0x2f6b30, y: 1.05 },
        { geometry: new ConeGeometry(0.58, 0.85, 7), color: 0x3c7d3a, y: 1.55 },
        { geometry: new ConeGeometry(0.4, 0.75, 7), color: 0x4c9a48, y: 2.0 },
      ]);
    }
    case "rock": {
      const base = new IcosahedronGeometry(0.55, 0);
      base.scale(1.1, 0.7, 1.0);
      return compose([
        { geometry: base, color: 0x8a8d8f, y: 0.38 },
        { geometry: new IcosahedronGeometry(0.3, 0), color: 0x73767a, x: 0.26, y: 0.32, z: -0.16 },
      ]);
    }
    case "building": {
      // Walls plus a four-sided pyramid roof aligned to the footprint.
      return compose([
        { geometry: new BoxGeometry(1.0, 1.3, 1.0), color: 0xb59264, y: 0.65 },
        { geometry: new ConeGeometry(0.85, 0.7, 4), color: 0x6e3a2c, rotY: Math.PI / 4, y: 1.62 },
      ]);
    }
    case "door": {
      return compose([
        { geometry: new BoxGeometry(0.85, 1.5, 0.16), color: 0x6b4a2b, y: 0.75 },
        { geometry: new BoxGeometry(0.1, 0.1, 0.12), color: 0xcaa64a, x: 0.28, y: 0.75, z: 0.1 },
      ]);
    }
    case "resource": {
      // A rocky node shot through with bright ore veins.
      const stone = new IcosahedronGeometry(0.5, 0);
      stone.scale(1.1, 0.85, 1.0);
      return compose([
        { geometry: stone, color: 0x77797b, y: 0.42 },
        { geometry: new IcosahedronGeometry(0.17, 0), color: 0xc8772e, x: -0.2, y: 0.52, z: 0.2 },
        { geometry: new IcosahedronGeometry(0.13, 0), color: 0x8fb0c0, x: 0.22, y: 0.36, z: -0.12 },
      ]);
    }
    default: {
      return compose([
        { geometry: new BoxGeometry(0.7, 0.6, 0.7), color: 0x9aa0a6, y: 0.4 },
        { geometry: new BoxGeometry(0.74, 0.12, 0.74), color: 0x7c8288, y: 0.74 },
      ]);
    }
  }
}

const _typeCache = new Map<string, string>();
function defIdToType(defId: string): string {
  const cached = _typeCache.get(defId);
  if (cached !== undefined) return cached;
  let result = "default";
  if (defId.includes("tree")) result = "tree";
  else if (defId.includes("rock")) result = "rock";
  else if (defId.includes("building")) result = "building";
  else if (defId.includes("door")) result = "door";
  else if (defId.includes("ore") || defId.includes("node")) result = "resource";
  _typeCache.set(defId, result);
  return result;
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
