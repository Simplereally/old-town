import type { HitsplatType } from "@old-town/shared";
import { GAME_TICK_MS } from "@old-town/shared";
import type { Scene, Vector3 } from "three";
import { CanvasTexture, Group, Sprite, SpriteMaterial } from "three";

interface Hitsplat {
  readonly entityId: number;
  readonly amount: number;
  readonly type: HitsplatType;
  readonly startTick: number;
  readonly startTime: number;
  readonly sprite: Sprite;
  readonly texture: CanvasTexture;
}

export interface HitsplatLayerOptions {
  readonly scene: Scene;
}

/** Number of game ticks a hitsplat remains visible. OSRS uses 1–2 ticks; we use 2 for clarity. */
const HITSPLAT_LIFETIME_TICKS = 2;

/** Sprite scale in world units. */
const HITSPLAT_SCALE = 0.5;

/** Canvas size for the hitsplat texture. */
const CANVAS_SIZE = 64;

function colorForType(type: HitsplatType): string {
  switch (type) {
    case "damage":
      return "#d01010";
    case "block":
      return "#1080d0";
    case "heal":
      return "#10a010";
    case "poison":
      return "#609010";
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function createHitsplatTexture(amount: number, type: HitsplatType): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context not available");
  }

  const bgColor = colorForType(type);
  const half = CANVAS_SIZE / 2;

  // Background
  ctx.fillStyle = bgColor;
  drawRoundedRect(ctx, 2, 2, CANVAS_SIZE - 4, CANVAS_SIZE - 4, 8);
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 2, 2, CANVAS_SIZE - 4, CANVAS_SIZE - 4, 8);
  ctx.stroke();

  // Text shadow for depth
  ctx.font = "bold 28px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  const text = amount.toString();
  ctx.fillText(text, half + 1, half + 2);

  // Main text
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, half, half);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = "srgb";
  return texture;
}

/**
 * Renders damage/heal/poison/block numbers above entities as floating 3D sprites.
 *
 * Lifetime is **tick-based** (2 ticks), matching OSRS behaviour. Visuals are
 * interpolated at frame rate for smooth rising and fade, but the hitsplat is
 * removed on the exact tick boundary so timing is deterministic and resilient
 * to frame drops or reconnects.
 */
export class HitsplatLayer {
  private readonly scene: Scene;
  private readonly hitsplats = new Map<number, Hitsplat>();
  private readonly group = new Group();
  private _nextId = 1;

  constructor(options: HitsplatLayerOptions) {
    this.scene = options.scene;
    this.group.name = "hitsplats";
    this.scene.add(this.group);
  }

  /**
   * Show a new hitsplat above an entity.
   *
   * @param entityId  The entity to anchor the hitsplat to.
   * @param amount    The numeric value to display (e.g. 5, 0, 3).
   * @param type      The kind of hitsplat (damage, block, heal, poison).
   * @param tick      The authoritative server tick this hitsplat was created on.
   */
  show(entityId: number, amount: number, type: HitsplatType, tick: number): void {
    const id = this._nextId++;
    const texture = createHitsplatTexture(amount, type);
    const material = new SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new Sprite(material);
    sprite.position.set(0, 1.15, 0);
    sprite.scale.set(HITSPLAT_SCALE, HITSPLAT_SCALE, 1);

    this.group.add(sprite);
    this.hitsplats.set(id, {
      entityId,
      amount,
      type,
      startTick: tick,
      startTime: performance.now(),
      sprite,
      texture,
    });
  }

  /**
   * Update positions and lifetimes of all active hitsplats.
   *
   * @param currentTick      The authoritative server tick the client is currently on.
   * @param entityPositions  Map of entity IDs to their interpolated world positions.
   */
  update(currentTick: number, entityPositions: Map<number, Vector3>): void {
    const now = performance.now();

    for (const [id, hitsplat] of this.hitsplats) {
      const tickAge = currentTick - hitsplat.startTick;

      // OSRS hitsplats vanish after exactly 2 ticks.
      if (tickAge >= HITSPLAT_LIFETIME_TICKS) {
        this._remove(id);
        continue;
      }

      const pos = entityPositions.get(hitsplat.entityId);
      if (!pos) {
        this._remove(id);
        continue;
      }

      // Smooth visual interpolation within the tick.
      const elapsedMs = now - hitsplat.startTime;
      const totalMs = HITSPLAT_LIFETIME_TICKS * GAME_TICK_MS;
      const timeProgress = Math.min(1, elapsedMs / totalMs);

      hitsplat.sprite.position.x = pos.x;
      hitsplat.sprite.position.z = pos.z;
      hitsplat.sprite.position.y = pos.y + 1.15;

      // Fade out during the last 30% of the lifetime.
      const material = hitsplat.sprite.material as SpriteMaterial;
      material.opacity = timeProgress > 0.7 ? 1 - (timeProgress - 0.7) / 0.3 : 1;
    }
  }

  clear(): void {
    for (const id of this.hitsplats.keys()) {
      this._remove(id);
    }
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
  }

  private _remove(id: number): void {
    const hitsplat = this.hitsplats.get(id);
    if (!hitsplat) return;
    this.group.remove(hitsplat.sprite);
    hitsplat.sprite.material.dispose();
    hitsplat.texture.dispose();
    this.hitsplats.delete(id);
  }
}
