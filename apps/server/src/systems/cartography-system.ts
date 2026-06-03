import type { EntityId, ObjectIntent, TileCoord } from "@old-town/shared";
import type { World } from "../ecs/world";
import type { ItemAuditLog } from "../items/item-audit";
import { hasItem } from "../items/inventory";
import type { ResourceNodeContext } from "./resource-node-system";
import { addXp } from "../skills/skill-state";

export interface CartographySystemContext extends ResourceNodeContext {
  readonly itemAudit?: ItemAuditLog | undefined;
}

function systemMessage(
  ctx: CartographySystemContext,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  ctx.deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function tileOf(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return a.plane === b.plane ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) : Infinity;
}

function findSurveyTool(
  ctx: CartographySystemContext,
  owner: EntityId,
): { itemId: string; itemName: string } | undefined {
  const inventory = ctx.world.getComponent(owner, "inventory");
  if (!inventory) {
    return undefined;
  }
  for (const toolId of ["survey_quill", "survey_parchment"]) {
    if (hasItem(inventory, toolId, 1)) {
      const item = ctx.registries.item.get(toolId);
      return { itemId: toolId, itemName: item?.name ?? toolId };
    }
  }
  return undefined;
}

function revealTiles(
  ctx: CartographySystemContext,
  owner: EntityId,
  tableTile: TileCoord,
  radius: number,
): string[] {
  const vars = ctx.world.getComponent(owner, "vars");
  if (!vars) {
    return [];
  }

  const revealed: string[] = [];
  const existingKey = vars.values.map_revealed_tiles;
  const existing: string[] =
    typeof existingKey === "string" ? JSON.parse(existingKey) : [];
  const existingSet = new Set(existing);

  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      const tile = { x: tableTile.x + dx, y: tableTile.y + dy, plane: tableTile.plane };
      const key = `${tile.x},${tile.y},${tile.plane}`;
      if (!existingSet.has(key)) {
        revealed.push(key);
        existingSet.add(key);
      }
    }
  }

  const updated = [...existingSet];
  vars.values.map_revealed_tiles = JSON.stringify(updated);
  ctx.deltas.markVarbitDelta({ varId: "map_revealed_tiles", value: updated.length });

  return revealed;
}

const SURVEY_OBJECT_IDS = new Set(["map_table"]);
const SURVEY_RADIUS = 3;
const SURVEY_XP_PER_TILE = 5;

export function handleSurveyIntent(
  ctx: CartographySystemContext,
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

  if (!SURVEY_OBJECT_IDS.has(object.objectId)) {
    systemMessage(ctx, owner, "You cannot survey here.", serverTime);
    return true;
  }

  const tool = findSurveyTool(ctx, owner);
  if (!tool) {
    systemMessage(ctx, owner, "You need a quill or parchment to survey.", serverTime);
    return true;
  }

  const revealed = revealTiles(ctx, owner, objectTile, SURVEY_RADIUS);
  const xp = revealed.length * SURVEY_XP_PER_TILE;

  if (xp > 0) {
    addXp({ world: ctx.world, deltas: ctx.deltas }, owner, "cartography", xp);
  }

  systemMessage(
    ctx,
    owner,
    revealed.length > 0
      ? `You survey the area and chart ${revealed.length} new tiles.`
      : "You survey the area but find nothing new to chart.",
    serverTime,
  );

  ctx.itemAudit?.recordForEntity(owner, {
    tick: tick ?? 0,
    itemId: tool.itemId,
    quantity: 0,
    reason: "survey",
    beforeQuantity: 0,
    afterQuantity: 0,
    metadata: {
      objectEntityId: intent.objectEntityId,
      objectId: object.objectId,
      tilesRevealed: revealed.length,
      xpAwarded: xp,
    },
  });

  return true;
}
