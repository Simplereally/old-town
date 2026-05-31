import {
  ACTIVE_SCENE_SIZE,
  CHUNK_SIZE,
  type ChatPacket,
  type ChunkId,
  type EntityId,
  type EntitySpawnPacket,
  type EntityUpdatePacket,
  REGION_SIZE,
  type RegionCoord,
  type RegionId,
  type RegionLoadPacket,
  type RegionUnloadPacket,
  type TickDeltaPacket,
  type TileCoord,
  chunkId,
  regionId,
} from "@old-town/shared";
import type { World } from "../ecs/world";

export interface InterestScene {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly plane: number;
}

export interface InterestTransition {
  readonly chunkLoads: readonly ChunkId[];
  readonly chunkUnloads: readonly ChunkId[];
  readonly regionLoads: readonly RegionLoadPacket[];
  readonly regionUnloads: readonly RegionUnloadPacket[];
}

interface InterestState {
  readonly chunks: Set<ChunkId>;
  readonly regions: Map<RegionId, RegionCoord>;
  readonly knownEntities: Set<EntityId>;
}

function sortedIds<T extends string>(values: Iterable<T>): T[] {
  const arr = Array.from(values);
  if (arr.length <= 1) return arr;
  return arr.toSorted((a, b) => a.localeCompare(b));
}

function diffSets<T extends string>(next: ReadonlySet<T>, previous: ReadonlySet<T>): readonly T[] {
  if (next.size === 0) return [];
  if (previous.size === 0) return sortedIds(next);
  return sortedIds(next).filter((value) => !previous.has(value));
}

const regionCoordCache = new Map<RegionId, RegionCoord>();

function regionCoordFromId(id: RegionId): RegionCoord {
  const cached = regionCoordCache.get(id);
  if (cached) {
    return cached;
  }
  const [rxRaw, ryRaw, planeRaw] = String(id)
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  if (rxRaw === undefined || ryRaw === undefined || planeRaw === undefined) {
    throw new Error(`Invalid region id ${id}`);
  }
  const coord: RegionCoord = {
    rx: rxRaw,
    ry: ryRaw,
    plane: planeRaw as RegionCoord["plane"],
  };
  regionCoordCache.set(id, coord);
  return coord;
}

function entityOrder(a: EntityId, b: EntityId): number {
  return (a as number) - (b as number);
}

function packetWith(
  packet: TickDeltaPacket,
  changes: Pick<TickDeltaPacket, "entityAdds" | "entityRemoves" | "entityUpdates"> &
    Partial<Pick<TickDeltaPacket, "chat" | "regionLoads" | "regionUnloads">>,
): TickDeltaPacket {
  return {
    ...packet,
    entityAdds: changes.entityAdds,
    entityRemoves: changes.entityRemoves,
    entityUpdates: changes.entityUpdates,
    ...(changes.regionLoads && changes.regionLoads.length > 0
      ? { regionLoads: changes.regionLoads }
      : {}),
    ...(changes.regionUnloads && changes.regionUnloads.length > 0
      ? { regionUnloads: changes.regionUnloads }
      : {}),
    ...(changes.chat ? { chat: changes.chat } : {}),
  };
}

export function computeInterestScene(center: TileCoord): InterestScene {
  const before = Math.floor(ACTIVE_SCENE_SIZE / 2);
  const after = ACTIVE_SCENE_SIZE - before - 1;
  return {
    minX: center.x - before,
    maxX: center.x + after,
    minY: center.y - before,
    maxY: center.y + after,
    plane: center.plane,
  };
}

export function sceneContainsTile(scene: InterestScene, tile: TileCoord): boolean {
  return (
    tile.plane === scene.plane &&
    tile.x >= scene.minX &&
    tile.x <= scene.maxX &&
    tile.y >= scene.minY &&
    tile.y <= scene.maxY
  );
}

export function intersectingChunks(scene: InterestScene): ReadonlySet<ChunkId> {
  const chunks = new Set<ChunkId>();
  const minCx = Math.floor(scene.minX / CHUNK_SIZE);
  const maxCx = Math.floor(scene.maxX / CHUNK_SIZE);
  const minCy = Math.floor(scene.minY / CHUNK_SIZE);
  const maxCy = Math.floor(scene.maxY / CHUNK_SIZE);
  const plane = scene.plane as TileCoord["plane"];
  for (let cx = minCx; cx <= maxCx; cx += 1) {
    for (let cy = minCy; cy <= maxCy; cy += 1) {
      chunks.add(chunkId({ cx, cy, plane }));
    }
  }
  return chunks;
}

export function intersectingRegions(scene: InterestScene): ReadonlyMap<RegionId, RegionCoord> {
  const regions = new Map<RegionId, RegionCoord>();
  for (const chunk of intersectingChunks(scene)) {
    const chunkStr = String(chunk);
    const [cxRaw, cyRaw, planeRaw] = chunkStr.split(":").map((part) => Number.parseInt(part, 10));
    if (cxRaw === undefined || cyRaw === undefined || planeRaw === undefined) {
      throw new Error(`Invalid chunk id ${chunk}`);
    }
    const coord = {
      rx: Math.floor(cxRaw / (REGION_SIZE / CHUNK_SIZE)),
      ry: Math.floor(cyRaw / (REGION_SIZE / CHUNK_SIZE)),
      plane: planeRaw as RegionCoord["plane"],
    };
    regions.set(regionId(coord), coord);
  }
  return regions;
}

export class InterestManager {
  private readonly stateByPlayer = new Map<EntityId, InterestState>();

  updateInterest(player: EntityId, center: TileCoord): InterestTransition {
    const scene = computeInterestScene(center);
    const nextChunks = intersectingChunks(scene);
    const nextRegions = intersectingRegions(scene);
    const previous = this.stateByPlayer.get(player);
    if (!previous) {
      this.stateByPlayer.set(player, {
        chunks: new Set(nextChunks),
        regions: new Map(nextRegions),
        knownEntities: new Set(),
      });
      return {
        chunkLoads: sortedIds(nextChunks),
        chunkUnloads: [],
        regionLoads: sortedIds(nextRegions.keys()).map((id) => ({
          regionId: id,
          region: nextRegions.get(id) ?? regionCoordFromId(id),
        })),
        regionUnloads: [],
      };
    }

    const chunkLoads = diffSets(nextChunks, previous.chunks);
    const chunkUnloads = diffSets(previous.chunks, nextChunks);
    const regionLoads = diffSets(new Set(nextRegions.keys()), new Set(previous.regions.keys())).map(
      (id) => ({
        regionId: id,
        region: nextRegions.get(id) ?? regionCoordFromId(id),
      }),
    );
    const regionUnloads = diffSets(
      new Set(previous.regions.keys()),
      new Set(nextRegions.keys()),
    ).map((id) => ({ regionId: id }));

    previous.chunks.clear();
    for (const chunk of nextChunks) previous.chunks.add(chunk);
    previous.regions.clear();
    for (const [id, region] of nextRegions) previous.regions.set(id, region);

    return { chunkLoads, chunkUnloads, regionLoads, regionUnloads };
  }

  filterDelta(
    player: EntityId,
    center: TileCoord,
    delta: TickDeltaPacket,
    world: World,
  ): TickDeltaPacket {
    const scene = computeInterestScene(center);
    const state = this.stateByPlayer.get(player) ?? {
      chunks: new Set<ChunkId>(),
      regions: new Map<RegionId, RegionCoord>(),
      knownEntities: new Set<EntityId>(),
    };
    if (!this.stateByPlayer.has(player)) {
      this.stateByPlayer.set(player, state);
    }

    const transition = this.updateInterest(player, center);
    const knownEntities = state.knownEntities;
    const entityAdds: EntitySpawnPacket[] = [];
    for (const add of delta.entityAdds) {
      if (!knownEntities.has(add.entityId) && sceneContainsTile(scene, add.tile)) {
        knownEntities.add(add.entityId);
        entityAdds.push(add);
      }
    }

    const entityRemoves = new Set<EntityId>();
    for (const removed of delta.entityRemoves) {
      if (knownEntities.delete(removed)) {
        entityRemoves.add(removed);
      }
    }

    const entityUpdates: EntityUpdatePacket[] = [];
    for (const update of delta.entityUpdates) {
      const tile = update.changes.position ?? this.positionTile(world, update.entityId);
      const visible = tile ? sceneContainsTile(scene, tile) : knownEntities.has(update.entityId);
      const known = knownEntities.has(update.entityId);
      if (known && !visible) {
        knownEntities.delete(update.entityId);
        entityRemoves.add(update.entityId);
      } else if (known && visible) {
        entityUpdates.push(update);
      }
    }

    const chat = delta.chat?.filter((packet) => this.chatVisible(scene, packet, world)) ?? [];

    return packetWith(delta, {
      entityAdds,
      entityRemoves: Array.from(entityRemoves).toSorted(entityOrder),
      entityUpdates,
      ...(delta.chat ? { chat } : {}),
      regionLoads: transition.regionLoads,
      regionUnloads: transition.regionUnloads,
    });
  }

  primeKnownEntities(player: EntityId, entities: readonly EntitySpawnPacket[]): void {
    const state = this.stateByPlayer.get(player) ?? {
      chunks: new Set<ChunkId>(),
      regions: new Map<RegionId, RegionCoord>(),
      knownEntities: new Set<EntityId>(),
    };
    for (const entity of entities) {
      state.knownEntities.add(entity.entityId);
    }
    this.stateByPlayer.set(player, state);
  }

  private positionTile(world: World, entityId: EntityId): TileCoord | undefined {
    const position = world.stores.position.get(entityId);
    return position
      ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
      : undefined;
  }

  private chatVisible(scene: InterestScene, packet: ChatPacket, world: World): boolean {
    if (packet.channel === "system" || packet.entityId === undefined) {
      return true;
    }
    const tile = this.positionTile(world, packet.entityId);
    return tile ? sceneContainsTile(scene, tile) : false;
  }
}
