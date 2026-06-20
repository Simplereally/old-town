/**
 * Runtime validation for server → client packets. Every packet the client receives
 * passes through {@link parseServerPacket} / {@link parseTransportServerPacket}.
 * Schemas are `.strict()` so protocol drift is caught early, and the discriminated
 * union rejects unknown packet types. Mirrors the C2S pattern in `command-schemas.ts`.
 *
 * `DebugTickData` is the sole exception: it uses `.passthrough()` so the server can
 * add new debug fields without breaking older clients (debug data is non-critical).
 */
import { z } from "zod";
import { combatStyleSchema, contentIdSchema } from "../content-schemas/common";
import { Direction } from "../math/direction";
import type { ServerPacket } from "./packets";
import { ServerPacketType } from "./packets";
import type { ParseResult } from "./parse-result";
import { entityIdSchema, planeSchema, tileCoordSchema } from "./schema-primitives";
import type { TransportServerPacket } from "./transport";
import { TransportServerMessageType } from "./transport";

// --- Shared enum fragments --------------------------------------------------------

const entityKindSchema = z.enum(["player", "npc", "object", "ground_item", "grave", "projectile"]);

const hitsplatTypeSchema = z.enum(["damage", "block", "heal", "poison"]);

const moveSpeedSchema = z.enum(["stationary", "walk", "run"]);

const directionSchema = z.nativeEnum(Direction);

/** A region coordinate: `{ rx, ry, plane }`. */
const regionCoordSchema = z
  .object({ rx: z.number().int(), ry: z.number().int(), plane: planeSchema })
  .strict();

// --- Embedded entity-update types (entity-update.ts) ------------------------------

export const hitsplatSchema = z
  .object({ amount: z.number().int(), type: hitsplatTypeSchema })
  .strict();

export const healthBarSchema = z
  .object({ current: z.number().int(), max: z.number().int() })
  .strict();

export const animationPlaySchema = z
  .object({ id: z.string().min(1), startTick: z.number().int().optional() })
  .strict();

export const graphicPlaySchema = z
  .object({ id: z.string().min(1), height: z.number().optional() })
  .strict();

export const statusEffectUpdateSchema = z
  .object({
    effectId: z.string().min(1),
    durationTicks: z.number().int(),
    damagePerTick: z.number().int().optional(),
    healPerTick: z.number().int().optional(),
    statModifiers: z.record(z.string(), z.number()).optional(),
  })
  .strict();

export const appearanceUpdateSchema = z
  .object({
    bodyId: z.string().optional(),
    colors: z.array(z.number()).optional(),
    name: z.string().optional(),
  })
  .strict();

export const equipmentUpdateSchema = z.object({ slots: z.array(z.string().nullable()) }).strict();

export const entityUpdatePayloadSchema = z
  .object({
    position: tileCoordSchema.optional(),
    facingTile: tileCoordSchema.optional(),
    facingEntity: entityIdSchema.optional(),
    animation: animationPlaySchema.optional(),
    graphic: graphicPlaySchema.optional(),
    hitsplat: hitsplatSchema.optional(),
    overheadText: z.string().optional(),
    appearance: appearanceUpdateSchema.optional(),
    equipment: equipmentUpdateSchema.optional(),
    healthBar: healthBarSchema.optional(),
    transform: z.string().optional(),
    moveSpeed: moveSpeedSchema.optional(),
    statusEffects: z.array(statusEffectUpdateSchema).optional(),
    doorState: z.object({ isOpen: z.boolean() }).strict().optional(),
  })
  .strict();

export const entityUpdatePacketSchema = z
  .object({
    entityId: entityIdSchema,
    mask: z.number().int().nonnegative(),
    changes: entityUpdatePayloadSchema,
  })
  .strict();

export const entitySpawnPacketSchema = z
  .object({
    entityId: entityIdSchema,
    kind: entityKindSchema,
    tile: tileCoordSchema,
    defId: contentIdSchema.optional(),
    facing: directionSchema.optional(),
    appearance: appearanceUpdateSchema.optional(),
    healthBar: healthBarSchema.optional(),
    moveSpeed: moveSpeedSchema.optional(),
    quantity: z.number().int().nonnegative().optional(),
  })
  .strict();

// --- Embedded packet types (packets.ts) -------------------------------------------

export const inventorySlotChangeSchema = z
  .object({
    slot: z.number().int().nonnegative(),
    itemId: z.string().nullable(),
    quantity: z.number().int().nonnegative(),
    uid: z.number().int().nonnegative().optional(),
  })
  .strict();

export const inventoryDeltaSchema = z
  .object({
    containerId: z.string().min(1),
    changes: z.array(inventorySlotChangeSchema),
  })
  .strict();

export const skillDeltaSchema = z
  .object({
    skillId: contentIdSchema,
    level: z.number().int().nonnegative(),
    xp: z.number().int().nonnegative(),
    effectiveLevel: z.number().int().nonnegative(),
  })
  .strict();

const playerVarValueSchema = z.union([z.number().int(), z.boolean(), z.string()]);

export const varDeltaSchema = z
  .object({ varId: z.string().min(1), value: playerVarValueSchema })
  .strict();

export const chatPacketSchema = z
  .object({
    entityId: entityIdSchema.optional(),
    name: z.string().optional(),
    text: z.string(),
    channel: z.enum(["public", "system"]),
    serverTime: z.number().int(),
  })
  .strict();

export const hitsplatPacketSchema = z
  .object({ entityId: entityIdSchema, hitsplat: hitsplatSchema })
  .strict();

export const xpDropPacketSchema = z
  .object({ skillId: contentIdSchema, amount: z.number().int() })
  .strict();

export const projectilePacketSchema = z
  .object({
    id: z.string().min(1),
    projectileId: z.string().min(1),
    sourceEntityId: entityIdSchema.optional(),
    targetEntityId: entityIdSchema.optional(),
    startTile: tileCoordSchema,
    endTile: tileCoordSchema,
    startTick: z.number().int().nonnegative(),
    hitTick: z.number().int().nonnegative(),
  })
  .strict();

export const deathNoticePacketSchema = z.object({ entityId: entityIdSchema }).strict();

export const respawnNoticePacketSchema = z
  .object({ entityId: entityIdSchema, tile: tileCoordSchema })
  .strict();

export const contractCompletePacketSchema = z
  .object({
    entityId: entityIdSchema,
    contractId: z.string().min(1),
    name: z.string().min(1),
  })
  .strict();

export const contractProgressPacketSchema = z
  .object({
    entityId: entityIdSchema,
    contractId: z.string().min(1),
    objectiveKind: z.string().min(1),
    targetId: z.string().min(1),
    current: z.number().int().nonnegative(),
    required: z.number().int().nonnegative(),
  })
  .strict();

export const contractBoardEntrySchema = z
  .object({
    contractEntityId: entityIdSchema,
    contractId: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    contractType: z.string().min(1),
    requiredLevel: z.number().int().nonnegative(),
    status: z.string().min(1),
  })
  .strict();

export const contractBoardPacketSchema = z
  .object({
    entries: z.array(contractBoardEntrySchema),
  })
  .strict();

export const soundPacketSchema = z
  .object({
    soundId: z.string().min(1),
    tile: tileCoordSchema.optional(),
    volume: z.number().optional(),
  })
  .strict();

export const dialogueOptionPacketSchema = z
  .object({ index: z.number().int().nonnegative(), text: z.string().min(1) })
  .strict();

export const dialogueViewPacketSchema = z
  .object({
    dialogueId: z.string().min(1),
    nodeId: z.string().min(1),
    speakerName: z.string().min(1),
    npcText: z.string().optional(),
    options: z.array(dialogueOptionPacketSchema),
  })
  .strict();

export const shopStockPacketSchema = z
  .object({
    itemId: z.string().min(1),
    quantity: z.number().int().nonnegative(),
    price: z.number().int().nonnegative(),
    maxQuantity: z.number().int().nonnegative(),
  })
  .strict();

export const shopViewPacketSchema = z
  .object({
    shopId: z.string().min(1),
    name: z.string().min(1),
    stock: z.array(shopStockPacketSchema),
    sellMultiplier: z.number(),
    buyMultiplier: z.number(),
  })
  .strict();

export const activityViewPacketSchema = z
  .object({
    activityId: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    loopDescription: z.string(),
    risk: z.string(),
  })
  .strict();

export const recipeListEntrySchema = z
  .object({
    recipeId: z.string().min(1),
    name: z.string().min(1),
    skillId: contentIdSchema,
    levelRequired: z.number().int().nonnegative(),
    xp: z.number(),
    ingredients: z.array(
      z.object({ itemId: z.string().min(1), quantity: z.number().int().positive() }).strict(),
    ),
    productId: z.string().min(1),
    productQuantity: z.number().int().positive(),
  })
  .strict();

export const recipeListPacketSchema = z
  .object({
    interfaceId: z.string().min(1),
    stationEntityId: z.number().int().nonnegative(),
    stationName: z.string().min(1),
    recipes: z.array(recipeListEntrySchema),
  })
  .strict();

export const recipeResultPacketSchema = z
  .object({
    recipeId: z.string().min(1),
    success: z.boolean(),
    productItemId: z.string().optional(),
    productQuantity: z.number().int().positive().optional(),
    xpReward: z.number().optional(),
    message: z.string().optional(),
  })
  .strict();

export const interfaceOpenPacketSchema = z
  .object({
    interfaceId: z.string().min(1),
    dialogue: dialogueViewPacketSchema.optional(),
    shop: shopViewPacketSchema.optional(),
    recipe: recipeListPacketSchema.optional(),
    activity: activityViewPacketSchema.optional(),
    contractBoard: contractBoardPacketSchema.optional(),
  })
  .strict();

export const interfaceClosePacketSchema = z.object({ interfaceId: z.string().min(1) }).strict();

export const regionTileDataSchema = z
  .object({
    x: z.number().int(),
    y: z.number().int(),
    height: z.number(),
    underlayId: z.string().min(1),
    overlayId: z.string().optional(),
    collision: z.number().int().nonnegative(),
    water: z.boolean().optional(),
    bridge: z.boolean().optional(),
  })
  .strict();

export const chunkDataSchema = z
  .object({
    cx: z.number().int(),
    cy: z.number().int(),
    tiles: z.array(regionTileDataSchema),
  })
  .strict();

export const regionLoadPacketSchema = z
  .object({
    region: regionCoordSchema,
    regionId: z.string().min(1),
    chunks: z.array(chunkDataSchema).optional(),
  })
  .strict();

export const regionUnloadPacketSchema = z.object({ regionId: z.string().min(1) }).strict();

export const worldConstantsPacketSchema = z
  .object({
    gameTickMs: z.number().int().positive(),
    tileSizeWorldUnits: z.number().positive(),
    chunkSize: z.number().int().positive(),
    regionSize: z.number().int().positive(),
    activeSceneSize: z.number().int().positive(),
    planes: z.number().int().positive(),
  })
  .strict();

// --- Debug types ------------------------------------------------------------------

export const debugPathDataSchema = z
  .object({ entityId: entityIdSchema, path: z.array(tileCoordSchema) })
  .strict();

export const debugTickDataSchema = z
  .object({
    paths: z.array(debugPathDataSchema).optional(),
    trueTiles: z
      .array(z.object({ entityId: entityIdSchema, tile: tileCoordSchema }).strict())
      .optional(),
    collisionTiles: z.array(tileCoordSchema).optional(),
    footprints: z.array(tileCoordSchema).optional(),
    reachTiles: z
      .array(z.object({ center: tileCoordSchema, radius: z.number().int().nonnegative() }).strict())
      .optional(),
    loSRays: z
      .array(z.object({ start: tileCoordSchema, end: tileCoordSchema }).strict())
      .optional(),
    actionQueue: z.array(z.string()).optional(),
    combatCooldown: z.number().optional(),
    pendingHits: z
      .array(z.object({ targetId: entityIdSchema, amount: z.number().int() }).strict())
      .optional(),
    npcLeash: tileCoordSchema.optional(),
    varbits: z
      .array(z.object({ varId: z.string().min(1), value: z.number().int() }).strict())
      .optional(),
  })
  .passthrough();

// --- Top-level packet schemas -----------------------------------------------------

export const fullStatePacketSchema = z
  .object({
    type: z.literal(ServerPacketType.FullState),
    protocolVersion: z.number().int(),
    tick: z.number().int().nonnegative(),
    serverTime: z.number().int(),
    worldConstants: worldConstantsPacketSchema.optional(),
    selfEntityId: entityIdSchema,
    entities: z.array(entitySpawnPacketSchema),
    inventory: inventoryDeltaSchema.optional(),
    bank: inventoryDeltaSchema.optional(),
    equipment: equipmentUpdateSchema.optional(),
    skills: z.array(skillDeltaSchema).optional(),
    vars: z.array(varDeltaSchema).optional(),
    combatStyle: combatStyleSchema.optional(),
    regionLoads: z.array(regionLoadPacketSchema).optional(),
  })
  .strict();

export const tickDeltaPacketSchema = z
  .object({
    type: z.literal(ServerPacketType.TickDelta),
    tick: z.number().int().nonnegative(),
    serverTime: z.number().int(),
    entityAdds: z.array(entitySpawnPacketSchema),
    entityRemoves: z.array(entityIdSchema),
    entityUpdates: z.array(entityUpdatePacketSchema),
    inventoryDeltas: z.array(inventoryDeltaSchema).optional(),
    skillDelta: z.array(skillDeltaSchema).optional(),
    varbitDelta: z.array(varDeltaSchema).optional(),
    chat: z.array(chatPacketSchema).optional(),
    hitsplats: z.array(hitsplatPacketSchema).optional(),
    xpDrops: z.array(xpDropPacketSchema).optional(),
    projectiles: z.array(projectilePacketSchema).optional(),
    sounds: z.array(soundPacketSchema).optional(),
    regionLoads: z.array(regionLoadPacketSchema).optional(),
    regionUnloads: z.array(regionUnloadPacketSchema).optional(),
    interfaceOpens: z.array(interfaceOpenPacketSchema).optional(),
    interfaceCloses: z.array(interfaceClosePacketSchema).optional(),
    deathNotices: z.array(deathNoticePacketSchema).optional(),
    respawnNotices: z.array(respawnNoticePacketSchema).optional(),
    contractComplete: z.array(contractCompletePacketSchema).optional(),
    contractProgress: z.array(contractProgressPacketSchema).optional(),
    recipeLists: z.array(recipeListPacketSchema).optional(),
    recipeResults: z.array(recipeResultPacketSchema).optional(),
    debug: debugTickDataSchema.optional(),
  })
  .strict();

/** Validates any top-level server → client packet. */
export const serverPacketSchema = z.discriminatedUnion("type", [
  fullStatePacketSchema,
  tickDeltaPacketSchema,
]);

// --- Transport-level packet schemas ------------------------------------------------

export const pongPacketSchema = z
  .object({
    type: z.literal(TransportServerMessageType.Pong),
    commandId: z.number().int().nonnegative(),
    clientTimeMs: z.number().int().nonnegative(),
    serverTime: z.number().int(),
  })
  .strict();

export const commandRejectedPacketSchema = z
  .object({
    type: z.literal(TransportServerMessageType.CommandRejected),
    reason: z.string(),
  })
  .strict();

export const transportErrorPacketSchema = z
  .object({
    type: z.literal(TransportServerMessageType.Error),
    reason: z.string(),
  })
  .strict();

/** Validates any transport-level server → client packet (S2C + transport control). */
export const transportServerPacketSchema = z.discriminatedUnion("type", [
  fullStatePacketSchema,
  tickDeltaPacketSchema,
  pongPacketSchema,
  commandRejectedPacketSchema,
  transportErrorPacketSchema,
]);

// --- Validated decoders ------------------------------------------------------------

/**
 * Validate untrusted input as a {@link ServerPacket}. Returns a discriminated result
 * rather than throwing, so the transport layer can drop malformed packets cleanly.
 */
export function parseServerPacket(raw: unknown): ParseResult<ServerPacket> {
  const result = serverPacketSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, value: result.data as unknown as ServerPacket };
}

/**
 * Validate untrusted input as a {@link TransportServerPacket}. Returns a discriminated
 * result rather than throwing, so the transport layer can drop malformed packets cleanly.
 */
export function parseTransportServerPacket(raw: unknown): ParseResult<TransportServerPacket> {
  const result = transportServerPacketSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, value: result.data as unknown as TransportServerPacket };
}
