import { type Object3D, type OrthographicCamera, Raycaster, Vector2 } from "three";

export interface EntityPickerOptions {
  readonly camera: OrthographicCamera;
  readonly canvas: HTMLCanvasElement;
}

export interface PickedEntity {
  readonly entityId: number;
  readonly kind: "player" | "npc" | "object" | "groundItem";
  readonly defId?: string;
  readonly itemId?: string;
  readonly quantity?: number;
  readonly distance: number;
}

/**
 * Raycast-based entity picker. Checks actors, objects, and ground items
 * and returns the closest intersected entity.
 */
export class EntityPicker {
  private readonly raycaster: Raycaster;
  private readonly camera: OrthographicCamera;
  private readonly canvas: HTMLCanvasElement;

  constructor(options: EntityPickerOptions) {
    this.camera = options.camera;
    this.canvas = options.canvas;
    this.raycaster = new Raycaster();
  }

  /**
   * Raycast against a list of objects and return the closest picked entity.
   * Accepts both Meshes (actors, objects, fallback gem ground items) and
   * Sprites (icon-billboard ground items) — both carry the same userData shape.
   */
  pick(screenX: number, screenY: number, targets: Object3D[]): PickedEntity | null {
    const ndc = this._screenToNDC(screenX, screenY);
    this.raycaster.setFromCamera(ndc, this.camera);
    const intersects = this.raycaster.intersectObjects(targets, false);
    if (intersects.length === 0) return null;

    const closest = intersects[0];
    if (!closest) return null;
    const userData = closest.object.userData as Record<string, unknown>;

    const VALID_KINDS = new Set<string>(["player", "npc", "object", "groundItem"]);

    let entityId: number | undefined;
    let kind: PickedEntity["kind"] | undefined;
    let defId: string | undefined;
    let itemId: string | undefined;
    let quantity: number | undefined;

    if (closest.instanceId !== undefined && userData?.instanceMap) {
      const instanceMap = userData.instanceMap as Record<
        number,
        { entityId: number; defId?: string }
      >;
      const meta = instanceMap[closest.instanceId];
      if (meta) {
        entityId = meta.entityId;
        const rawKind = userData.kind;
        kind =
          typeof rawKind === "string" && VALID_KINDS.has(rawKind)
            ? (rawKind as PickedEntity["kind"])
            : undefined;
        defId = meta.defId;
      }
    } else if (userData && typeof userData.entityId === "number") {
      entityId = userData.entityId;
      const rawKind = userData.kind;
      kind =
        typeof rawKind === "string" && VALID_KINDS.has(rawKind)
          ? (rawKind as PickedEntity["kind"])
          : undefined;
      const rawDefId = userData.defId;
      defId = typeof rawDefId === "string" ? rawDefId : undefined;
      const rawItemId = userData.itemId;
      itemId = typeof rawItemId === "string" ? rawItemId : undefined;
      const rawQuantity = userData.quantity;
      quantity = typeof rawQuantity === "number" ? rawQuantity : undefined;
    }

    if (entityId === undefined || kind === undefined) return null;

    const result: PickedEntity = {
      entityId,
      kind,
      distance: closest.distance,
      ...(defId !== undefined ? { defId } : {}),
      ...(itemId !== undefined ? { itemId } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
    };
    return result;
  }

  private _screenToNDC(screenX: number, screenY: number): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    return new Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1,
    );
  }
}
