import type { RegionCoord, RegionId, TileCoord } from "@old-town/shared";

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
  readonly plane: number;
  readonly width: number;
  readonly height: number;
  readonly tag?: string;
}

export interface RuntimeRegion {
  readonly id: RegionId;
  readonly region: RegionCoord;
  readonly tileKeys: readonly string[];
  readonly objectEntityIds: readonly number[];
  readonly npcEntityIds: readonly number[];
  readonly groundItemEntityIds: readonly number[];
  readonly resourceNodeEntityIds: readonly number[];
  readonly triggerIds: readonly string[];
}

export interface RuntimeMap {
  readonly regions: Map<RegionId, RuntimeRegion>;
  readonly tiles: Map<string, RuntimeTile>;
  readonly triggers: Map<string, RuntimeAreaTrigger>;
}

export function createRuntimeMap(): RuntimeMap {
  return {
    regions: new Map(),
    tiles: new Map(),
    triggers: new Map(),
  };
}
