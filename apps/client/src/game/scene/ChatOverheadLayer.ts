import { CanvasTexture, Sprite, SpriteMaterial } from "three";
import type { Scene, Vector3 } from "three";

interface ChatBubble {
  readonly sprite: Sprite;
  readonly startTime: number;
  readonly entityId: number;
  readonly text: string;
}

export interface ChatOverheadLayerOptions {
  readonly scene: Scene;
}

/**
 * Renders chat messages as 3D overhead text bubbles anchored to actor positions.
 * Bubbles fade out after a duration and follow their actor as they move.
 */
export class ChatOverheadLayer {
  private readonly scene: Scene;
  private readonly bubbles = new Map<number, ChatBubble>();
  private readonly duration = 4000;
  private readonly fadeDuration = 500;

  constructor(options: ChatOverheadLayerOptions) {
    this.scene = options.scene;
  }

  show(entityId: number, text: string, worldPosition: Vector3): void {
    this.remove(entityId);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fontSize = 14;
    ctx.font = `${fontSize}px sans-serif`;
    const metrics = ctx.measureText(text);
    const padding = 6;
    const width = Math.ceil(metrics.width + padding * 2);
    const height = Math.ceil(fontSize + padding * 2);

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, width / 2, height / 2);

    const texture = new CanvasTexture(canvas);
    const material = new SpriteMaterial({ map: texture, transparent: true });
    const sprite = new Sprite(material);
    sprite.position.copy(worldPosition);
    sprite.position.y += 1.5;
    sprite.scale.set(width / 40, height / 40, 1);

    this.scene.add(sprite);
    this.bubbles.set(entityId, {
      sprite,
      startTime: performance.now(),
      entityId,
      text,
    });
  }

  update(actorPositions: Map<number, Vector3>): void {
    const now = performance.now();
    for (const [entityId, bubble] of this.bubbles) {
      const sprite = bubble.sprite;
      const startTime = bubble.startTime;

      const pos = actorPositions.get(entityId);
      if (pos) {
        sprite.position.x = pos.x;
        sprite.position.z = pos.z;
        sprite.position.y = pos.y + 1.5;
      }

      const elapsed = now - startTime;
      if (elapsed > this.duration) {
        this.remove(entityId);
      } else if (elapsed > this.duration - this.fadeDuration) {
        const fadeProgress = (elapsed - (this.duration - this.fadeDuration)) / this.fadeDuration;
        sprite.material.opacity = Math.max(0, 1 - fadeProgress);
      }
    }
  }

  remove(entityId: number): void {
    const bubble = this.bubbles.get(entityId);
    if (!bubble) return;
    this.scene.remove(bubble.sprite);
    bubble.sprite.material.map?.dispose();
    bubble.sprite.material.dispose();
    this.bubbles.delete(entityId);
  }

  clear(): void {
    for (const id of Array.from(this.bubbles.keys())) {
      this.remove(id);
    }
  }

  dispose(): void {
    this.clear();
  }

  get bubbleCount(): number {
    return this.bubbles.size;
  }
}
