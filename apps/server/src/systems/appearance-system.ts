import {
  type AppearanceUpdate,
  type EntityId,
  EQUIPMENT_SLOTS,
  type ItemDef,
} from "@old-town/shared";
import type { ActorComponent, EquipmentComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";

export interface AppearanceContext {
  readonly world: World;
  readonly deltas: DeltaAccumulator;
  readonly items: ReadonlyMap<string, ItemDef>;
}

const lastAppearanceHash = new Map<EntityId, string>();

/**
 * Compute the renderable appearance for an entity from its actor base and
 * equipped items.  Body model is overridden by a body-slot item that carries
 * `model`; colors are derived from `visualIdentity` numeric values.
 */
export function computeAppearance(
  actor: ActorComponent,
  equipment: EquipmentComponent,
  items: ReadonlyMap<string, ItemDef>,
): AppearanceUpdate {
  const parts: string[] = [actor.appearanceId];
  const colors: number[] = [];

  for (const slot of EQUIPMENT_SLOTS) {
    const itemId = equipment.slots[slot];
    if (!itemId) continue;
    const def = items.get(itemId);
    if (!def) continue;

    if (def.model) {
      parts.push(`${slot}:${def.model}`);
    }

    if (def.visualIdentity) {
      for (const value of Object.values(def.visualIdentity)) {
        const num = Number(value);
        if (!Number.isNaN(num)) {
          colors.push(num);
        }
      }
    }
  }

  return {
    bodyId: parts.join("|"),
    ...(colors.length > 0 ? { colors } : {}),
    name: actor.name,
  };
}

/** Recompute appearance for a single entity and emit a delta if it changed. */
export function recalculateAppearance(ctx: AppearanceContext, entityId: EntityId): void {
  const actor = ctx.world.getComponent(entityId, "actor");
  const equipment = ctx.world.getComponent(entityId, "equipment");
  if (!actor || !equipment) return;

  const appearance = computeAppearance(actor, equipment, ctx.items);
  const hash = JSON.stringify(appearance);
  if (lastAppearanceHash.get(entityId) === hash) {
    return;
  }
  lastAppearanceHash.set(entityId, hash);
  ctx.deltas.markEntityUpdate(entityId, { appearance });
}

/** Recompute appearance for every entity with equipment and emit deltas. */
export function processAppearanceUpdates(ctx: AppearanceContext): void {
  for (const entityId of ctx.world.entityIdsWith("equipment")) {
    if (!ctx.world.isAlive(entityId)) {
      lastAppearanceHash.delete(entityId);
      continue;
    }
    recalculateAppearance(ctx, entityId);
  }
}

/** Clear the cached appearance hash for an entity (or all). */
export function clearAppearanceCache(entityId?: EntityId): void {
  if (entityId !== undefined) {
    lastAppearanceHash.delete(entityId);
  } else {
    lastAppearanceHash.clear();
  }
}
