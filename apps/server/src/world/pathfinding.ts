import type { TileCoord } from "@old-town/shared";
import type { CollisionMap, Footprint } from "./collision";

export interface PathfindingOptions {
  readonly footprint?: Footprint;
  readonly maxPathLength?: number;
  readonly maxVisited?: number;
  /**
   * Predicate returning true when a tile is a closed door that can be opened to pass through.
   * When provided, the pathfinder treats closed-door tiles as passable with a cost penalty
   * and records them in `doorTiles` so the caller can queue open-interactions before crossing.
   */
  readonly isClosedDoor?: (tile: TileCoord) => boolean;
}

export interface PathfindingResult {
  readonly path: readonly TileCoord[];
  readonly reached: boolean;
  readonly destination: TileCoord;
  readonly explored: number;
  /** Tiles along the path that are closed doors and must be opened before crossing. */
  readonly doorTiles: readonly TileCoord[];
}

interface SearchNode {
  readonly tile: TileCoord;
  readonly key: string;
  readonly g: number;
  readonly h: number;
  readonly order: number;
  readonly parent?: string;
  /** True if this node's tile is a closed door that must be opened. */
  readonly isDoorTile?: boolean;
}

const DEFAULT_MAX_PATH_LENGTH = 128;
const DEFAULT_MAX_VISITED = 16384;

const NEIGHBORS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
];

function key(tile: TileCoord): string {
  return `${tile.x}:${tile.y}:${tile.plane}`;
}

function sameTile(a: TileCoord, b: TileCoord): boolean {
  return a.x === b.x && a.y === b.y && a.plane === b.plane;
}

function chebyshev(a: TileCoord, b: TileCoord): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function compareNodes(a: SearchNode, b: SearchNode): number {
  const f = a.g + a.h - (b.g + b.h);
  if (f !== 0) return f;
  if (a.h !== b.h) return a.h - b.h;
  return a.order - b.order;
}

function reconstruct(nodes: ReadonlyMap<string, SearchNode>, node: SearchNode): TileCoord[] {
  const path: TileCoord[] = [];
  let current: SearchNode | undefined = node;
  while (current?.parent) {
    path.push(current.tile);
    current = nodes.get(current.parent);
  }
  path.reverse();
  return path;
}

function reconstructDoorTiles(
  nodes: ReadonlyMap<string, SearchNode>,
  node: SearchNode,
): TileCoord[] {
  const doors: TileCoord[] = [];
  let current: SearchNode | undefined = node;
  while (current?.parent) {
    if (current.isDoorTile) {
      doors.push(current.tile);
    }
    current = nodes.get(current.parent);
  }
  doors.reverse();
  return doors;
}

function capPath(path: readonly TileCoord[], maxPathLength: number): readonly TileCoord[] {
  return path.length > maxPathLength ? path.slice(0, maxPathLength) : path;
}

export function findPath(
  collision: CollisionMap,
  start: TileCoord,
  destination: TileCoord,
  options: PathfindingOptions = {},
): PathfindingResult {
  const maxPathLength = options.maxPathLength ?? DEFAULT_MAX_PATH_LENGTH;
  const maxVisited = options.maxVisited ?? DEFAULT_MAX_VISITED;
  const footprint = options.footprint;
  const isClosedDoor = options.isClosedDoor;
  const DOOR_COST_PENALTY = 2;
  const startKey = key(start);
  const startNode: SearchNode = {
    tile: start,
    key: startKey,
    g: 0,
    h: chebyshev(start, destination),
    order: 0,
  };
  const open = [startNode];
  const nodes = new Map<string, SearchNode>([[startKey, startNode]]);
  const closed = new Set<string>();
  let best = startNode;
  let nextOrder = 1;

  while (open.length > 0 && closed.size < maxVisited) {
    if (open.length > 1) {
      open.sort(compareNodes);
    }
    const current = open.shift();
    if (!current || closed.has(current.key)) {
      continue;
    }

    closed.add(current.key);
    if (
      current.h < best.h ||
      (current.h === best.h && current.g < best.g) ||
      (current.h === best.h && current.g === best.g && current.key.localeCompare(best.key) < 0)
    ) {
      best = current;
    }

    if (sameTile(current.tile, destination)) {
      const path = reconstruct(nodes, current);
      const capped = capPath(path, maxPathLength);
      const doorTiles = reconstructDoorTiles(nodes, current);
      return {
        path: capped,
        reached: capped.length === path.length,
        destination,
        explored: closed.size,
        doorTiles,
      };
    }

    const currentTile = current.tile;
    for (const [dx, dy] of NEIGHBORS) {
      const next: TileCoord = {
        x: currentTile.x + dx,
        y: currentTile.y + dy,
        plane: currentTile.plane,
      };
      const nextKey = key(next);
      if (closed.has(nextKey)) {
        continue;
      }

      const canStep = collision.canStep(currentTile, next, footprint);
      const isDoor = isClosedDoor?.(next) === true;
      if (!canStep && !isDoor) {
        continue;
      }

      const g = current.g + (isDoor ? DOOR_COST_PENALTY : 1);
      const existing = nodes.get(nextKey);
      if (existing && existing.g <= g) {
        continue;
      }

      const node: SearchNode = {
        tile: next,
        key: nextKey,
        g,
        h: chebyshev(next, destination),
        order: nextOrder,
        parent: current.key,
        isDoorTile: isDoor,
      };
      nextOrder += 1;
      nodes.set(nextKey, node);
      open.push(node);
    }
  }

  const path = capPath(reconstruct(nodes, best), maxPathLength);
  const doorTiles = reconstructDoorTiles(nodes, best);
  return {
    path,
    reached: false,
    destination: path[path.length - 1] ?? start,
    explored: closed.size,
    doorTiles,
  };
}
