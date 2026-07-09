import type { EntityId, ObjectIntent, TileCoord } from "@old-town/shared";
import type { World } from "../ecs/world";
import {
  addItem,
  buildDelta,
  catalogFromItems,
  count,
  hasItem,
  removeItem,
} from "../items/inventory";
import type { ItemAuditLog } from "../items/item-audit";
import { addXp } from "../skills/skill-state";
import type { ResourceNodeContext } from "./resource-node-system";

export interface TrappingSystemContext extends ResourceNodeContext {
  readonly itemAudit?: ItemAuditLog | undefined;
}

function systemMessage(
  ctx: TrappingSystemContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function tileOf(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position ? { x: position.x, y: position.y, plane: position.plane } : undefined;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

interface TrappingRecipe {
  readonly objectId: string;
  readonly inputItemId: string;
  readonly inputQuantity: number;
  readonly outputItemId: string;
  readonly outputQuantity: number;
  readonly skillId: string;
  readonly xp: number;
  readonly noMaterialsMessage: string;
  readonly successMessage: string;
}

const TRAPPING_RECIPES: Record<string, TrappingRecipe> = {
  tan: {
    objectId: "patch_tanning_frame",
    inputItemId: "rabbit_hide",
    inputQuantity: 1,
    outputItemId: "plain_leather",
    outputQuantity: 1,
    skillId: "hearthcraft",
    xp: 20,
    noMaterialsMessage: "You have no hides to tan.",
    successMessage: "You tan the hide into leather.",
  },
  dye: {
    objectId: "patch_dye_vat",
    inputItemId: "plain_cloth",
    inputQuantity: 1,
    outputItemId: "coloured_cloth",
    outputQuantity: 1,
    skillId: "sleight",
    xp: 25,
    noMaterialsMessage: "You need cloth and dye to colour fabric.",
    successMessage: "You dye the cloth a vibrant colour.",
  },
  fire: {
    objectId: "trap_base",
    inputItemId: "",
    inputQuantity: 0,
    outputItemId: "",
    outputQuantity: 0,
    skillId: "hearthcraft",
    xp: 0,
    noMaterialsMessage: "",
    successMessage: "You set a fire trap.",
  },
  weave: {
    objectId: "chalkhouse_bead_loom",
    inputItemId: "bead_clay",
    inputQuantity: 2,
    outputItemId: "bead_strand",
    outputQuantity: 1,
    skillId: "sleight",
    xp: 22,
    noMaterialsMessage: "You need clay to weave beads.",
    successMessage: "You weave the clay into a bead strand.",
  },
  mix: {
    objectId: "chalkhouse_mixing_bench",
    inputItemId: "simple_herb",
    inputQuantity: 2,
    outputItemId: "simple_remedy",
    outputQuantity: 1,
    skillId: "hearthcraft",
    xp: 30,
    noMaterialsMessage: "You need herbs to mix a remedy.",
    successMessage: "You mix the herbs into a remedy.",
  },
};

const TRAPPING_ACTION_IDS = new Set(Object.keys(TRAPPING_RECIPES));

export function isTrappingAction(actionId: string): boolean {
  return TRAPPING_ACTION_IDS.has(actionId);
}

export function handleTrappingIntent(
  ctx: TrappingSystemContext,
  owner: EntityId,
  intent: ObjectIntent,
  serverTime: number,
  tick?: number,
): boolean {
  const object = ctx.world.getComponent(intent.objectEntityId, "object");
  if (!object) {
    return false;
  }
  const objectDef = ctx.registries.object.get(object.objectId);
  if (!objectDef) {
    return false;
  }

  const actorTile = tileOf(ctx.world, owner);
  const objectTile = tileOf(ctx.world, intent.objectEntityId);
  if (!actorTile || !objectTile) {
    return false;
  }
  if (chebyshev(actorTile, objectTile) > 1) {
    return false;
  }

  const recipe = TRAPPING_RECIPES[intent.actionId];
  if (!recipe) {
    return false;
  }

  if (recipe.objectId !== object.objectId) {
    systemMessage(ctx, owner, "You cannot do that here.", serverTime);
    return true;
  }

  // fire is a special case that doesn't consume materials
  if (intent.actionId === "fire") {
    systemMessage(ctx, owner, recipe.successMessage, serverTime);
    return true;
  }

  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    return false;
  }

  if (!hasItem(inventory, recipe.inputItemId, recipe.inputQuantity)) {
    systemMessage(ctx, owner, recipe.noMaterialsMessage, serverTime);
    return true;
  }

  const catalog = catalogFromItems(ctx.registries.item);
  const beforeInputQuantity = count(inventory, recipe.inputItemId);
  const removed = removeItem(inventory, recipe.inputItemId, recipe.inputQuantity);
  if (removed.removed < recipe.inputQuantity) {
    systemMessage(ctx, owner, recipe.noMaterialsMessage, serverTime);
    return true;
  }

  const afterInputQuantity = count(inventory, recipe.inputItemId);
  const beforeOutputQuantity = count(inventory, recipe.outputItemId);
  const added = addItem(inventory, catalog, recipe.outputItemId, recipe.outputQuantity);
  ctx.deltas.markInventoryDelta(buildDelta(inventory, [...removed.changes, ...added.changes]));

  if (removed.removed > 0) {
    ctx.itemAudit?.recordForEntity(owner, {
      tick: tick ?? 0,
      itemId: recipe.inputItemId,
      quantity: removed.removed,
      reason: "trapping_input",
      beforeQuantity: beforeInputQuantity,
      afterQuantity: afterInputQuantity,
      metadata: {
        actionId: intent.actionId,
        objectEntityId: intent.objectEntityId,
        objectId: object.objectId,
      },
    });
  }
  if (added.added > 0) {
    ctx.itemAudit?.recordForEntity(owner, {
      tick: tick ?? 0,
      itemId: recipe.outputItemId,
      quantity: added.added,
      reason: "trapping_output",
      beforeQuantity: beforeOutputQuantity,
      afterQuantity: count(inventory, recipe.outputItemId),
      metadata: {
        actionId: intent.actionId,
        objectEntityId: intent.objectEntityId,
        objectId: object.objectId,
      },
    });
  }

  if (recipe.xp > 0) {
    addXp({ world: ctx.world, deltas: ctx.deltas }, owner, recipe.skillId, recipe.xp);
  }

  systemMessage(ctx, owner, recipe.successMessage, serverTime);
  return true;
}
