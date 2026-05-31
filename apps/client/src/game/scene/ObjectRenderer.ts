import type { TileCoord } from "@old-town/shared";
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  Vector3,
} from "three";
import type { Scene } from "three";

interface ObjectInstance {
  readonly entityId: number;
  readonly mesh: Mesh;
  readonly tile: TileCoord;
  readonly defId: string;
}

interface ObjectTemplate {
  readonly geometry: BoxGeometry | ConeGeometry | CylinderGeometry;
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
  const type = defIdToType(defId);
  switch (type) {
    case "tree": {
      return {
        geometry: new ConeGeometry(0.5, 2, 6),
        material: new MeshLambertMaterial({ color: 0x2d5a27 }),
        scale: new Vector3(1, 1, 1),
        yOffset: 1,
      };
    }
    case "rock": {
      return {
        geometry: new BoxGeometry(0.8, 0.6, 0.8),
        material: new MeshLambertMaterial({ color: 0x808080 }),
        scale: new Vector3(1, 1, 1),
        yOffset: 0.3,
      };
    }
    case "building": {
      return {
        geometry: new BoxGeometry(1, 2, 1),
        material: new MeshLambertMaterial({ color: 0x8b6f47 }),
        scale: new Vector3(1, 1, 1),
        yOffset: 1,
      };
    }
    case "door": {
      return {
        geometry: new BoxGeometry(0.8, 1.5, 0.2),
        material: new MeshLambertMaterial({ color: 0x654321 }),
        scale: new Vector3(1, 1, 1),
        yOffset: 0.75,
      };
    }
    case "resource": {
      return {
        geometry: new CylinderGeometry(0.4, 0.4, 0.8, 8),
        material: new MeshLambertMaterial({ color: 0x8b7355 }),
        scale: new Vector3(1, 1, 1),
        yOffset: 0.4,
      };
    }
    default: {
      return {
        geometry: new BoxGeometry(0.8, 0.8, 0.8),
        material: new MeshLambertMaterial({ color: 0xaaaaaa }),
        scale: new Vector3(1, 1, 1),
        yOffset: 0.4,
      };
    }
  }
}

function defIdToType(defId: string): string {
  if (defId.includes("tree")) return "tree";
  if (defId.includes("rock")) return "rock";
  if (defId.includes("building")) return "building";
  if (defId.includes("door")) return "door";
  if (defId.includes("ore") || defId.includes("node")) return "resource";
  return "default";
}

export interface ObjectRendererOptions {
  readonly scene: Scene;
}

/**
 * Object renderer for static and dynamic world objects (trees, rocks, buildings, doors).
 * Uses object pooling with individual meshes. InstancedMesh can be added later for
 * repeated objects (e.g., trees of the same type).
 */
export class ObjectRenderer {
  private readonly scene: Scene;
  private readonly objects = new Map<number, ObjectInstance>();
  private readonly objectGroup = new Group();

  constructor(options: ObjectRendererOptions) {
    this.scene = options.scene;
    this.objectGroup.name = "objects";
    this.scene.add(this.objectGroup);
  }

  /** Spawn an object at a tile. */
  spawn(entityId: number, tile: TileCoord, defId: string): void {
    if (this.objects.has(entityId)) {
      this.remove(entityId);
    }

    const template = getTemplate(defId);
    const mesh = new Mesh(template.geometry.clone(), template.material.clone());
    mesh.position.set(tile.x, template.yOffset, -tile.y);
    mesh.scale.copy(template.scale);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
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

  /** Remove an object by entity ID. */
  remove(entityId: number): void {
    const obj = this.objects.get(entityId);
    if (!obj) return;
    this.objectGroup.remove(obj.mesh);
    obj.mesh.geometry.dispose();
    (obj.mesh.material as MeshLambertMaterial).dispose();
    this.objects.delete(entityId);
  }

  /** Update an object's transform (rotation, state). */
  updateTransform(entityId: number, rotation: number): void {
    const obj = this.objects.get(entityId);
    if (!obj) return;
    obj.mesh.rotation.y = (rotation * Math.PI) / 2;
  }

  /** Clear all objects. */
  clear(): void {
    for (const id of this.objects.keys()) {
      this.remove(id);
    }
  }

  dispose(): void {
    this.clear();
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
}
