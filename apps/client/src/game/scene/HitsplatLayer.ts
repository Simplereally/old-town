import { Group, type Mesh, MeshBasicMaterial, PlaneGeometry, type Vector3 } from "three";
import type { Scene } from "three";
import { MeshPool } from "../renderer/MeshPool";

interface Hitsplat {
  readonly entityId: number;
  readonly amount: number;
  readonly type: "damage" | "block" | "heal" | "poison";
  readonly startTime: number;
  readonly mesh: Mesh;
}

export interface HitsplatLayerOptions {
  readonly scene: Scene;
}

export class HitsplatLayer {
  private readonly scene: Scene;
  private readonly hitsplats = new Map<number, Hitsplat>();
  private readonly group = new Group();
  private readonly damagePool: MeshPool;
  private readonly healPool: MeshPool;
  private readonly blockPool: MeshPool;
  private readonly poisonPool: MeshPool;
  private _nextId = 1;

  constructor(options: HitsplatLayerOptions) {
    this.scene = options.scene;
    this.group.name = "hitsplats";
    this.scene.add(this.group);
    const geometry = new PlaneGeometry(0.6, 0.3);
    this.damagePool = new MeshPool({
      geometry,
      material: new MeshBasicMaterial({ color: 0xff0000, side: 2 }),
      initialSize: 4,
    });
    this.healPool = new MeshPool({
      geometry,
      material: new MeshBasicMaterial({ color: 0x00ff00, side: 2 }),
      initialSize: 2,
    });
    this.blockPool = new MeshPool({
      geometry,
      material: new MeshBasicMaterial({ color: 0xaaaaaa, side: 2 }),
      initialSize: 2,
    });
    this.poisonPool = new MeshPool({
      geometry,
      material: new MeshBasicMaterial({ color: 0x00aa00, side: 2 }),
      initialSize: 2,
    });
  }

  show(
    entityId: number,
    amount: number,
    type: "damage" | "block" | "heal" | "poison" = "damage",
  ): void {
    const id = this._nextId++;
    const pool =
      type === "heal"
        ? this.healPool
        : type === "block"
          ? this.blockPool
          : type === "poison"
            ? this.poisonPool
            : this.damagePool;
    const mesh = pool.acquire();
    mesh.position.set(0, 1.5, 0);
    mesh.name = `hitsplat_${id}`;
    (mesh.material as MeshBasicMaterial).opacity = 1;
    this.group.add(mesh);

    this.hitsplats.set(id, {
      entityId,
      amount,
      type,
      startTime: performance.now(),
      mesh,
    });
  }

  update(entityPositions: Map<number, Vector3>): void {
    const now = performance.now();
    const lifetime = 1200;

    for (const [id, hitsplat] of this.hitsplats) {
      const entityId = hitsplat.entityId;
      const mesh = hitsplat.mesh;
      const startTime = hitsplat.startTime;

      const pos = entityPositions.get(entityId);
      if (pos) {
        mesh.position.copy(pos);
        mesh.position.y += 1.5;
        const progress = (now - startTime) / lifetime;
        if (progress >= 1) {
          this._remove(id);
        } else {
          mesh.position.y += progress * 0.5;
          const mat = mesh.material as MeshBasicMaterial;
          mat.opacity = 1 - progress;
          mat.transparent = true;
        }
      } else {
        this._remove(id);
      }
    }
  }

  clear(): void {
    for (const id of this.hitsplats.keys()) {
      this._remove(id);
    }
  }

  dispose(): void {
    this.clear();
    this.damagePool.dispose();
    this.healPool.dispose();
    this.blockPool.dispose();
    this.poisonPool.dispose();
    this.scene.remove(this.group);
  }

  private _remove(id: number): void {
    const hitsplat = this.hitsplats.get(id);
    if (!hitsplat) return;
    this.group.remove(hitsplat.mesh);
    const pool =
      hitsplat.type === "heal"
        ? this.healPool
        : hitsplat.type === "block"
          ? this.blockPool
          : hitsplat.type === "poison"
            ? this.poisonPool
            : this.damagePool;
    pool.release(hitsplat.mesh);
    this.hitsplats.delete(id);
  }
}
