/**
 * Server → client packet contracts (POC_SPEC §8). The server is trusted, so these are
 * plain data types (validated by construction, not by Zod). All packets carry the server
 * `tick` where relevant, and contain no Three.js/vector classes so they stay pure JSON.
 */
import type { RegionCoord, TileCoord } from "../types/coords";
import type { EntityId, RegionId } from "../types/ids";
import type {
  EntitySpawnPacket,
  EntityUpdatePacket,
  EquipmentUpdate,
  Hitsplat,
} from "./entity-update";

/**
 * Wire protocol version. Bump on any breaking change to packet/command shapes. The
 * client compares the version in the bootstrap {@link FullStatePacket} against this.
 */
export const PROTOCOL_VERSION = 3;

/** Discriminators for the two top-level server messages. */
export const ServerPacketType = {
  FullState: "S2C_FULL_STATE",
  TickDelta: "S2C_TICK_DELTA",
} as const;

export type ServerPacketType = (typeof ServerPacketType)[keyof typeof ServerPacketType];

// --- Embedded deltas --------------------------------------------------------------

/** A single inventory slot change. `itemId: null` clears the slot. */
export interface InventorySlotChange {
  readonly slot: number;
  readonly itemId: string | null;
  readonly quantity: number;
  readonly uid?: number;
}

/** Changes to one item container (inventory, bank, etc.). */
export interface InventoryDelta {
  readonly containerId: string;
  readonly changes: readonly InventorySlotChange[];
}

/** An updated skill level/xp. */
export interface SkillDelta {
  readonly skillId: string;
  readonly level: number;
  readonly xp: number;
}

/** A typed player/quest variable value. Gameplay owns these on the server. */
export type PlayerVarValue = number | boolean | string;

/** An updated player/quest variable. */
export interface VarDelta {
  readonly varId: string;
  readonly value: PlayerVarValue;
}

/** Legacy name retained for the POC_SPEC varbitDelta packet field. */
export type VarbitDelta = VarDelta;

/** A chat line. Timestamped with `serverTime` (POC_SPEC §8.4). */
export interface ChatPacket {
  readonly entityId?: EntityId;
  readonly name?: string;
  readonly text: string;
  readonly channel: "public" | "system";
  readonly serverTime: number;
}

/** A hitsplat applied to an entity (also expressible via the HITSPLAT update mask). */
export interface HitsplatPacket {
  readonly entityId: EntityId;
  readonly hitsplat: Hitsplat;
}

/** An XP gain to show as a floating drop. */
export interface XpDropPacket {
  readonly skillId: string;
  readonly amount: number;
}

/** Presentational projectile travel between authoritative tiles/entities. */
export interface ProjectilePacket {
  readonly id: string;
  readonly projectileId: string;
  readonly sourceEntityId?: EntityId;
  readonly targetEntityId?: EntityId;
  readonly startTile: TileCoord;
  readonly endTile: TileCoord;
  readonly startTick: number;
  readonly hitTick: number;
}

/** A sound cue to play. */
export interface SoundPacket {
  readonly soundId: string;
  readonly tile?: TileCoord;
  readonly volume?: number;
}

/** A request for the client to open an interface/panel. */
export interface DialogueOptionPacket {
  readonly index: number;
  readonly text: string;
}

/** Server-filtered dialogue node view. The client renders this, but cannot authorize it. */
export interface DialogueViewPacket {
  readonly dialogueId: string;
  readonly nodeId: string;
  readonly speakerName: string;
  readonly npcText?: string;
  readonly options: readonly DialogueOptionPacket[];
}

export interface InterfaceOpenPacket {
  readonly interfaceId: string;
  readonly dialogue?: DialogueViewPacket;
}

/** A request for the client to close an interface/panel. */
export interface InterfaceClosePacket {
  readonly interfaceId: string;
}

/** A single tile within a region load payload (compact form). */
export interface RegionTileData {
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly underlayId: string;
  readonly overlayId?: string;
  readonly collision: number;
  readonly water?: boolean;
  readonly bridge?: boolean;
}

/** A chunk (8x8 tiles) within a region. */
export interface ChunkData {
  readonly cx: number;
  readonly cy: number;
  readonly tiles: readonly RegionTileData[];
}

/** A region entering the player's loaded set. Terrain/object payloads are attached by
 *  later epics (E04/E06) once the map content schema exists. */
export interface RegionLoadPacket {
  readonly region: RegionCoord;
  readonly regionId: RegionId;
  /** Chunked tile data for this region. */
  readonly chunks?: readonly ChunkData[];
}

/** A region leaving the player's loaded set. */
export interface RegionUnloadPacket {
  readonly regionId: RegionId;
}

/** Spatial/temporal constants the client needs to interpret authoritative packets. */
export interface WorldConstantsPacket {
  readonly gameTickMs: number;
  readonly tileSizeWorldUnits: number;
  readonly chunkSize: number;
  readonly regionSize: number;
  readonly activeSceneSize: number;
  readonly planes: number;
}

// --- Top-level messages -----------------------------------------------------------

/** Authoritative bootstrap snapshot sent on login (POC_SPEC §8.1 S2C_FULL_STATE). */
export interface FullStatePacket {
  readonly type: typeof ServerPacketType.FullState;
  readonly protocolVersion: number;
  readonly tick: number;
  readonly serverTime: number;
  readonly worldConstants?: WorldConstantsPacket;
  readonly selfEntityId: EntityId;
  readonly entities: readonly EntitySpawnPacket[];
  readonly inventory?: InventoryDelta;
  readonly equipment?: EquipmentUpdate;
  readonly skills?: readonly SkillDelta[];
  readonly vars?: readonly VarbitDelta[];
  readonly regionLoads?: readonly RegionLoadPacket[];
}

/** Debug path data for an entity's queued movement path. */
export interface DebugPathData {
  readonly entityId: EntityId;
  readonly path: readonly TileCoord[];
}

/** Optional debug-only data attached to tick deltas for client visualization. */
export interface DebugTickData {
  readonly paths?: readonly DebugPathData[];
  readonly trueTiles?: readonly { entityId: EntityId; tile: TileCoord }[];
  readonly collisionTiles?: readonly TileCoord[];
  readonly footprints?: readonly TileCoord[];
  readonly reachTiles?: readonly { center: TileCoord; radius: number }[];
  readonly loSRays?: readonly { start: TileCoord; end: TileCoord }[];
  readonly actionQueue?: readonly string[];
  readonly combatCooldown?: number;
  readonly pendingHits?: readonly { targetId: EntityId; amount: number }[];
  readonly npcLeash?: TileCoord;
  readonly varbits?: readonly { varId: string; value: number }[];
}

/** Per-tick authoritative delta (POC_SPEC §8.3). */
export interface TickDeltaPacket {
  readonly type: typeof ServerPacketType.TickDelta;
  readonly tick: number;
  readonly serverTime: number;
  readonly entityAdds: readonly EntitySpawnPacket[];
  readonly entityRemoves: readonly EntityId[];
  readonly entityUpdates: readonly EntityUpdatePacket[];
  readonly inventoryDelta?: InventoryDelta;
  readonly skillDelta?: readonly SkillDelta[];
  readonly varbitDelta?: readonly VarbitDelta[];
  readonly chat?: readonly ChatPacket[];
  readonly hitsplats?: readonly HitsplatPacket[];
  readonly xpDrops?: readonly XpDropPacket[];
  readonly projectiles?: readonly ProjectilePacket[];
  readonly sounds?: readonly SoundPacket[];
  readonly regionLoads?: readonly RegionLoadPacket[];
  readonly regionUnloads?: readonly RegionUnloadPacket[];
  readonly interfaceOpens?: readonly InterfaceOpenPacket[];
  readonly interfaceCloses?: readonly InterfaceClosePacket[];
  readonly debug?: DebugTickData;
}

/** Any top-level server → client message. */
export type ServerPacket = FullStatePacket | TickDeltaPacket;

/** Whether a received protocol version is compatible with this build. */
export function isCompatibleProtocol(version: number): boolean {
  return version === PROTOCOL_VERSION;
}

/** Serialize a server packet to its JSON wire form. */
export function encodeServerPacket(packet: ServerPacket): string {
  return JSON.stringify(packet);
}

/** Deserialize a JSON wire string back into a server packet (server is trusted). */
export function decodeServerPacket(raw: string): ServerPacket {
  return JSON.parse(raw) as ServerPacket;
}
