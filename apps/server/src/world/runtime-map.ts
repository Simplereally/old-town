import type { EntityId, Plane, RegionCoord, RegionId, TileCoord } from "@old-town/shared";

export interface RuntimeTile {
  readonly tile: TileCoord;
  readonly height: number;
  readonly underlayId: string;
  readonly overlayId?: string;
  readonly collision: number;
  readonly water: boolean;
  readonly bridge: boolean;
  readonly zoneId?: string;
}

export interface RuntimeAreaTrigger {
  readonly id: string;
  readonly regionId: RegionId;
  readonly x: number;
  readonly y: number;
  readonly plane: Plane;
  readonly width: number;
  readonly height: number;
  readonly tag?: string;
}

export interface RuntimeRegion {
  readonly id: RegionId;
  readonly region: RegionCoord;
  readonly tileKeys: readonly string[];
  readonly objectEntityIds: readonly EntityId[];
  readonly npcEntityIds: readonly EntityId[];
  readonly groundItemEntityIds: readonly EntityId[];
  readonly resourceNodeEntityIds: readonly EntityId[];
  readonly triggerIds: readonly string[];
}

export interface RuntimeMap {
  readonly regions: Map<RegionId, RuntimeRegion>;
  readonly tiles: Map<string, RuntimeTile>;
  readonly triggers: Map<string, RuntimeAreaTrigger>;
  playerSpawnPoints: PlayerSpawnPoint[];
  deathRespawnPoints: DeathRespawnPoint[];
}

export interface PlayerSpawnPoint {
  readonly tile: TileCoord;
  readonly spawnType: string;
}

export interface DeathRespawnPoint {
  readonly tile: TileCoord;
  readonly respawnType: string;
  readonly priority: number;
}

export function createRuntimeMap(): RuntimeMap {
  return {
    regions: new Map(),
    tiles: new Map(),
    triggers: new Map(),
    playerSpawnPoints: [],
    deathRespawnPoints: [],
  };
}
