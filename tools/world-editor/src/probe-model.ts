import {
  type ContentRegistries,
  REGION_SIZE,
  type RegionMapDef,
  type TileCoord,
  tileKey,
} from "@old-town/shared";
import {
  findNearestInteractionTile,
  type InteractionTarget,
  interactionCandidateTiles,
  isWithinInteractionRange,
} from "../../../apps/server/src/systems/interaction-reach";
import {
  CollisionMap,
  type Footprint,
  objectCollisionFlags,
} from "../../../apps/server/src/world/collision";
import { findPath, type PathfindingResult } from "../../../apps/server/src/world/pathfinding";
import { createRuntimeMap } from "../../../apps/server/src/world/runtime-map";
import {
  assertRegionBounds,
  type PlacementSelection,
  regionKey,
  tileAtFromMap,
  tileOverrideMap,
} from "./editor-model";

export interface EditorProbePoint {
  readonly x: number;
  readonly y: number;
}

export interface LosProbeResult {
  readonly clear: boolean;
  readonly ray: readonly EditorProbePoint[];
}

export interface InteractionProbeResult {
  readonly inRange: boolean;
  readonly nearestTile?: EditorProbePoint | undefined;
  readonly path: PathfindingResult;
  readonly reachTiles: readonly EditorProbePoint[];
}

export interface ProbeFixture {
  readonly region: string;
  readonly kind: "path" | "los" | "interaction";
  readonly start: EditorProbePoint;
  readonly end?: EditorProbePoint | undefined;
  readonly reached?: boolean | undefined;
  readonly path?: readonly EditorProbePoint[] | undefined;
  readonly losClear?: boolean | undefined;
  readonly ray?: readonly EditorProbePoint[] | undefined;
  readonly nearestTile?: EditorProbePoint | undefined;
  readonly reachTiles?: readonly EditorProbePoint[] | undefined;
}

const ONE_TILE: Footprint = { width: 1, length: 1 };

function tile(point: EditorProbePoint, plane: number): TileCoord {
  return { x: point.x, y: point.y, plane: plane as TileCoord["plane"] };
}

function point(coord: TileCoord): EditorProbePoint {
  return { x: coord.x, y: coord.y };
}

export function buildEditorCollision(
  region: RegionMapDef,
  registries: Pick<ContentRegistries, "object">,
): CollisionMap {
  const map = createRuntimeMap();
  const overrides = tileOverrideMap(region);
  for (let x = 0; x < REGION_SIZE; x += 1) {
    for (let y = 0; y < REGION_SIZE; y += 1) {
      const current = tileAtFromMap(region, overrides, x, y);
      const coord = tile({ x, y }, region.region.plane);
      map.tiles.set(tileKey(coord), {
        tile: coord,
        height: current.height,
        underlayId: current.underlayId,
        ...(current.overlayId ? { overlayId: current.overlayId } : {}),
        collision: current.collision,
        water: current.water,
        bridge: current.bridge,
        ...(current.zoneId ? { zoneId: current.zoneId } : {}),
      });
    }
  }
  const collision = new CollisionMap(map);
  for (const placed of region.objects) {
    const def = registries.object.get(placed.objectId);
    if (!def) {
      continue;
    }
    collision.applyFootprint(
      tile({ x: placed.x, y: placed.y }, region.region.plane),
      { width: def.width, length: def.length },
      objectCollisionFlags(def),
    );
  }
  return collision;
}

export function runPathProbe(
  region: RegionMapDef,
  registries: Pick<ContentRegistries, "object">,
  start: EditorProbePoint,
  end: EditorProbePoint,
): PathfindingResult {
  assertProbePoint(start);
  assertProbePoint(end);
  return findPath(
    buildEditorCollision(region, registries),
    tile(start, region.region.plane),
    tile(end, region.region.plane),
  );
}

export function runLosProbe(
  region: RegionMapDef,
  registries: Pick<ContentRegistries, "object">,
  start: EditorProbePoint,
  end: EditorProbePoint,
): LosProbeResult {
  assertProbePoint(start);
  assertProbePoint(end);
  const collision = buildEditorCollision(region, registries);
  const from = tile(start, region.region.plane);
  const to = tile(end, region.region.plane);
  return {
    clear: collision.hasLineOfSight(from, to),
    ray: rayTiles(start, end),
  };
}

export function runInteractionProbe(
  region: RegionMapDef,
  registries: Pick<ContentRegistries, "object" | "npc">,
  actor: EditorProbePoint,
  selection: PlacementSelection,
  requiredDistance: number,
  requiresLineOfSight: boolean,
): InteractionProbeResult {
  assertProbePoint(actor);
  const target = interactionTargetForSelection(
    region,
    registries,
    selection,
    requiredDistance,
    requiresLineOfSight,
  );
  const collision = buildEditorCollision(region, registries);
  const actorTile = tile(actor, region.region.plane);
  const nearestTile = findNearestInteractionTile(collision, actorTile, target, ONE_TILE);
  const path = nearestTile
    ? findPath(collision, actorTile, nearestTile)
    : {
        path: [],
        reached: false,
        destination: actorTile,
        explored: 0,
        doorTiles: [],
      };
  return {
    inRange: isWithinInteractionRange(collision, actorTile, target, ONE_TILE),
    nearestTile: nearestTile ? point(nearestTile) : undefined,
    path,
    reachTiles: interactionCandidateTiles(target, ONE_TILE).map(point),
  };
}

export function probeFixtureJson(fixture: ProbeFixture): string {
  return `${JSON.stringify(fixture, null, 2)}\n`;
}

export function pathFixture(
  region: RegionMapDef,
  start: EditorProbePoint,
  end: EditorProbePoint,
  result: PathfindingResult,
): ProbeFixture {
  return {
    region: regionKey(region),
    kind: "path",
    start,
    end,
    reached: result.reached,
    path: result.path.map(point),
  };
}

export function losFixture(
  region: RegionMapDef,
  start: EditorProbePoint,
  end: EditorProbePoint,
  result: LosProbeResult,
): ProbeFixture {
  return {
    region: regionKey(region),
    kind: "los",
    start,
    end,
    losClear: result.clear,
    ray: result.ray,
  };
}

export function interactionFixture(
  region: RegionMapDef,
  start: EditorProbePoint,
  result: InteractionProbeResult,
): ProbeFixture {
  return {
    region: regionKey(region),
    kind: "interaction",
    start,
    reached: result.path.reached,
    path: result.path.path.map(point),
    nearestTile: result.nearestTile,
    reachTiles: result.reachTiles,
  };
}

function interactionTargetForSelection(
  region: RegionMapDef,
  registries: Pick<ContentRegistries, "object" | "npc">,
  selection: PlacementSelection,
  requiredDistance: number,
  requiresLineOfSight: boolean,
): InteractionTarget {
  switch (selection.kind) {
    case "object": {
      const placed = region.objects[selection.index];
      if (!placed) {
        throw new RangeError("Missing object placement");
      }
      const def = registries.object.get(placed.objectId);
      return {
        origin: tile({ x: placed.x, y: placed.y }, region.region.plane),
        footprint: { width: def?.width ?? 1, length: def?.length ?? 1 },
        requiredDistance,
        requiresLineOfSight,
      };
    }
    case "npc": {
      const placed = region.npcSpawns[selection.index];
      if (!placed) {
        throw new RangeError("Missing NPC placement");
      }
      const def = registries.npc.get(placed.npcId);
      const size = def?.size ?? 1;
      return {
        origin: tile({ x: placed.x, y: placed.y }, region.region.plane),
        footprint: { width: size, length: size },
        requiredDistance,
        requiresLineOfSight,
      };
    }
    case "groundItem": {
      const placed = region.groundItemSpawns[selection.index];
      if (!placed) {
        throw new RangeError("Missing ground item placement");
      }
      return {
        origin: tile({ x: placed.x, y: placed.y }, region.region.plane),
        footprint: ONE_TILE,
        requiredDistance,
        requiresLineOfSight,
      };
    }
    case "trigger": {
      const placed = region.triggers[selection.index];
      if (!placed) {
        throw new RangeError("Missing trigger placement");
      }
      return {
        origin: tile({ x: placed.x, y: placed.y }, region.region.plane),
        footprint: { width: placed.width, length: placed.height },
        requiredDistance,
        requiresLineOfSight,
      };
    }
  }
}

function rayTiles(start: EditorProbePoint, end: EditorProbePoint): readonly EditorProbePoint[] {
  const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  const ray: EditorProbePoint[] = [];
  if (steps === 0) {
    return [start];
  }
  for (let step = 0; step <= steps; step += 1) {
    ray.push({
      x: Math.round(start.x + ((end.x - start.x) * step) / steps),
      y: Math.round(start.y + ((end.y - start.y) * step) / steps),
    });
  }
  return ray;
}

function assertProbePoint(point: EditorProbePoint): void {
  if (!assertRegionBounds(point.x, point.y)) {
    throw new RangeError(`Probe point ${point.x},${point.y} is outside region bounds`);
  }
}
