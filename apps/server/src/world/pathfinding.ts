import type { TileCoord } from "@old-town/shared";
import type { CollisionMap, Footprint } from "./collision";

export interface PathfindingOptions {
  readonly footprint?: Footprint;
  readonly maxPathLength?: number;
  readonly maxVisited?: number;
}

export interface PathfindingResult {
  readonly path: readonly TileCoord[];
  readonly reached: boolean;
  readonly destination: TileCoord;
  readonly explored: number;
}

interface SearchNode {
  readonly tile: TileCoord;
  readonly key: string;
  readonly g: number;
  readonly h: number;
  readonly order: number;
  readonly parent?: string;
}

const DEFAULT_MAX_PATH_LENGTH = 64;
const DEFAULT_MAX_VISITED = 4096;

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
    open.sort(compareNodes);
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
      return {
        path: capped,
        reached: capped.length === path.length,
        destination,
        explored: closed.size,
      };
    }

    for (const [dx, dy] of NEIGHBORS) {
      const next: TileCoord = {
        x: current.tile.x + dx,
        y: current.tile.y + dy,
        plane: current.tile.plane,
      };
      const nextKey = key(next);
      if (closed.has(nextKey) || !collision.canStep(current.tile, next, footprint)) {
        continue;
      }

      const g = current.g + 1;
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
      };
      nextOrder += 1;
      nodes.set(nextKey, node);
      open.push(node);
    }
  }

  const path = capPath(reconstruct(nodes, best), maxPathLength);
  return {
    path,
    reached: false,
    destination: path[path.length - 1] ?? start,
    explored: closed.size,
  };
}
