/**
 * Server → client packet contracts (POC_SPEC §8). The server is trusted, so these are
 * plain data types (validated by construction, not by Zod). All packets carry the server
 * `tick` where relevant, and contain no Three.js/vector classes so they stay pure JSON.
 */
import type { RegionCoord, TileCoord } from "../types/coords";
import type { EntityId, RegionId } from "../types/ids";
import type { EntitySpawnPacket, EntityUpdatePacket, Hitsplat } from "./entity-update";

/**
 * Wire protocol version. Bump on any breaking change to packet/command shapes. The
 * client compares the version in the bootstrap {@link FullStatePacket} against this.
 */
export const PROTOCOL_VERSION = 1;

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

/** An updated player/quest variable (integer-valued). */
export interface VarbitDelta {
  readonly varId: string;
  readonly value: number;
}

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

/** A sound cue to play. */
export interface SoundPacket {
  readonly soundId: string;
  readonly tile?: TileCoord;
  readonly volume?: number;
}

/** A request for the client to open an interface/panel. */
export interface InterfaceOpenPacket {
  readonly interfaceId: string;
}

/** A region entering the player's loaded set. Terrain/object payloads are attached by
 *  later epics (E04/E06) once the map content schema exists. */
export interface RegionLoadPacket {
  readonly region: RegionCoord;
  readonly regionId: RegionId;
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
  readonly skills?: readonly SkillDelta[];
  readonly vars?: readonly VarbitDelta[];
  readonly regionLoads?: readonly RegionLoadPacket[];
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
  readonly sounds?: readonly SoundPacket[];
  readonly regionLoads?: readonly RegionLoadPacket[];
  readonly regionUnloads?: readonly RegionUnloadPacket[];
  readonly interfaceOpens?: readonly InterfaceOpenPacket[];
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
