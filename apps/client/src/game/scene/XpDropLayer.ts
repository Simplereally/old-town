import type { Scene, Vector3 } from "three";
import { CanvasTexture, Group, Sprite, SpriteMaterial } from "three";

interface XpDrop {
  readonly entityId: number;
  readonly skillId: string;
  readonly amount: number;
  readonly startTick: number;
  readonly startTime: number;
  readonly sprite: Sprite;
  readonly texture: CanvasTexture;
}

export interface XpDropLayerOptions {
  readonly scene: Scene;
}

/** Lifetime of an XP drop in milliseconds. */
const XP_DROP_LIFETIME_MS = 1500;

/** Sprite scale in world units. */
const XP_DROP_SCALE = 0.5;

/** Canvas size for the XP drop texture. */
const CANVAS_SIZE = 64;

function colorForSkill(skillId: string): string {
  switch (skillId) {
    case "attack":
      return "#ff0000";
    case "strength":
      return "#008000";
    case "defence":
      return "#4169e1";
    case "hitpoints":
      return "#ff69b4";
    case "magic":
      return "#9400d3";
    case "ranged":
      return "#228b22";
    case "woodcutting":
      return "#a0522d";
    case "mining":
      return "#808080";
    case "fishing":
      return "#4169e1";
    case "cooking":
      return "#dda0dd";
    case "smithing":
      return "#b8860b";
    case "trapping":
      return "#8b4513";
    case "gardening":
      return "#2e8b57";
    case "bowcraft":
      return "#daa520";
    case "tailoring":
      return "#ff6347";
    case "handicraft":
      return "#cd853f";
    case "beadwork":
      return "#ff1493";
    case "apothecary":
      return "#20b2aa";
    case "carpentry":
      return "#8b4513";
    case "wayfaring":
      return "#4682b4";
    case "sleight":
      return "#9932cc";
    case "wardenry":
      return "#556b2f";
    case "hearthcraft":
      return "#ff8c00";
    case "cartography":
      return "#1e90ff";
    case "favour":
      return "#ffd700";
    default:
      return "#ffffff";
  }
}

function createXpDropTexture(amount: number, skillId: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context not available");
  }

  const color = colorForSkill(skillId);
  const half = CANVAS_SIZE / 2;

  ctx.font = "bold 22px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Text shadow for depth
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  const text = `+${amount}`;
  ctx.fillText(text, half + 1, half + 2);

  // Main text
  ctx.fillStyle = color;
  ctx.fillText(text, half, half);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = "srgb";
  return texture;
}

/**
 * Renders XP gain numbers as floating 3D sprites above entities.
 *
 * Lifetime is **time-based** (1.5 seconds) for smooth UI animation.
 * Drops float upward and fade out while tracking the entity's world position.
 */
export class XpDropLayer {
  private readonly scene: Scene;
  private readonly drops = new Map<number, XpDrop>();
  private readonly group = new Group();
  private _nextId = 1;

  constructor(options: XpDropLayerOptions) {
    this.scene = options.scene;
    this.group.name = "xpDrops";
    this.scene.add(this.group);
  }

  /**
   * Show a new XP drop above an entity.
   *
   * @param entityId  The entity to anchor the XP drop to.
   * @param skillId   The skill that gained XP.
   * @param amount    The amount of XP gained.
   * @param tick      The authoritative server tick this drop was created on.
   */
  show(entityId: number, skillId: string, amount: number, tick: number): void {
    const id = this._nextId++;
    const texture = createXpDropTexture(amount, skillId);
    const material = new SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new Sprite(material);
    sprite.position.set(0, 1.4, 0);
    sprite.scale.set(XP_DROP_SCALE, XP_DROP_SCALE, 1);

    this.group.add(sprite);
    this.drops.set(id, {
      entityId,
      skillId,
      amount,
      startTick: tick,
      startTime: performance.now(),
      sprite,
      texture,
    });
  }

  /**
   * Update positions and lifetimes of all active XP drops.
   *
   * @param currentTick      The authoritative server tick the client is currently on.
   * @param entityPositions  Map of entity IDs to their interpolated world positions.
   */
  update(_currentTick: number, entityPositions: Map<number, Vector3>): void {
    const now = performance.now();

    for (const [id, drop] of this.drops) {
      const elapsedMs = now - drop.startTime;
      const timeProgress = Math.min(1, elapsedMs / XP_DROP_LIFETIME_MS);

      if (timeProgress >= 1) {
        this._remove(id);
        continue;
      }

      const pos = entityPositions.get(drop.entityId);
      if (!pos) {
        this._remove(id);
        continue;
      }

      drop.sprite.position.x = pos.x;
      drop.sprite.position.z = pos.z;

      // Float upward: start at y=1.4, rise by 0.6 over lifetime
      drop.sprite.position.y = pos.y + 1.4 + timeProgress * 0.6;

      // Fade out during the last 40% of the lifetime
      const material = drop.sprite.material as SpriteMaterial;
      material.opacity = timeProgress > 0.6 ? 1 - (timeProgress - 0.6) / 0.4 : 1;
    }
  }

  clear(): void {
    for (const id of this.drops.keys()) {
      this._remove(id);
    }
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
  }

  private _remove(id: number): void {
    const drop = this.drops.get(id);
    if (!drop) return;
    this.group.remove(drop.sprite);
    drop.sprite.material.dispose();
    drop.texture.dispose();
    this.drops.delete(id);
  }

  /** Number of active drops. Exposed for tests. */
  get activeCount(): number {
    return this.drops.size;
  }
}
