import { CollisionFlag, type TileCoord } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { loadContent } from "../content-loader";
import { createWorld } from "../ecs/world";
import { applyObjectCollision, CollisionMap } from "../world/collision";
import { findPath } from "../world/pathfinding";
import { loadAllRegionMapsIntoWorld } from "../world/region-loader";
import { createRuntimeMap } from "../world/runtime-map";

async function loadSeedRegion() {
  const content = await loadContent("content");
  if (!content.ok) {
    throw new Error(content.issues.map((issue) => issue.message).join("; "));
  }
  const world = createWorld();
  const map = createRuntimeMap();
  loadAllRegionMapsIntoWorld(world, map, content.registries);
  const collision = new CollisionMap(map);
  applyObjectCollision(world, content.registries, collision);
  return { world, map, collision, registries: content.registries };
}

describe("E43-S06 — Starter-region topology pass and collision validation", () => {
  it("building walls block movement on their tiles", async () => {
    const { collision } = await loadSeedRegion();

    // Wall at (20,20) should block occupancy.
    expect(collision.canOccupy({ x: 20, y: 20, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 21, y: 20, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 22, y: 20, plane: 0 })).toBe(false);
  });

  it("building door starts closed (blocking movement)", async () => {
    const { collision } = await loadSeedRegion();

    // Door at (21,22) should block movement when closed.
    expect(collision.canOccupy({ x: 21, y: 22, plane: 0 })).toBe(false);
  });

  it("building interior tile is enclosed by walls", async () => {
    const { collision } = await loadSeedRegion();

    // Interior at (21,21) should be enclosed — walls on all 4 sides (door closed).
    // The interior itself should not have wall collision, but it's surrounded.
    // Check that walls block the edges:
    expect(collision.canOccupy({ x: 20, y: 21, plane: 0 })).toBe(false); // west wall
    expect(collision.canOccupy({ x: 22, y: 21, plane: 0 })).toBe(false); // east wall
  });

  it("town gate blocks movement on both footprint tiles when closed", async () => {
    const { collision } = await loadSeedRegion();

    // Gate at (40,40) is 2×1, so blocks (40,40) and (41,40).
    expect(collision.canOccupy({ x: 40, y: 40, plane: 0 })).toBe(false);
    expect(collision.canOccupy({ x: 41, y: 40, plane: 0 })).toBe(false);
  });

  it("the seed region remains navigable — paths exist between distant points", async () => {
    const { collision } = await loadSeedRegion();

    // Path from (10,10) to (50,50) should reach (may route around buildings).
    const result = findPath(
      collision,
      { x: 10, y: 10, plane: 0 },
      { x: 50, y: 50, plane: 0 },
      {
        maxVisited: 16384,
        maxPathLength: 256,
      },
    );

    expect(result.reached).toBe(true);
    expect(result.path.length).toBeGreaterThan(0);
  });

  it("pathfinding routes through the building door when isClosedDoor is provided", async () => {
    const { collision } = await loadSeedRegion();

    // The door at (21,22) is closed. Without the door predicate, the interior is sealed.
    const interiorTile: TileCoord = { x: 21, y: 21, plane: 0 };
    const exteriorTile: TileCoord = { x: 21, y: 24, plane: 0 };

    // Without door predicate — no path into the sealed interior.
    const withoutDoor = findPath(collision, exteriorTile, interiorTile, {
      maxVisited: 4096,
    });
    expect(withoutDoor.reached).toBe(false);

    // With door predicate — path routes through the door.
    const withDoor = findPath(collision, exteriorTile, interiorTile, {
      maxVisited: 4096,
      isClosedDoor: (t) => t.x === 21 && t.y === 22,
    });
    expect(withDoor.reached).toBe(true);
    expect(withDoor.doorTiles).toContainEqual({ x: 21, y: 22, plane: 0 });
  });

  it("building objects have correct collision flags applied", async () => {
    const { collision } = await loadSeedRegion();

    // Wall at (20,20) should have BLOCK_FULL and BLOCK_LOS_FULL.
    const mask = collision.getMask({ x: 20, y: 20, plane: 0 });
    expect((mask & CollisionFlag.BLOCK_FULL) !== 0).toBe(true);
    expect((mask & CollisionFlag.BLOCK_LOS_FULL) !== 0).toBe(true);
  });

  it("roof object does not block movement (visual only)", async () => {
    const { collision } = await loadSeedRegion();

    // Roof at (21,21) should not block movement — it's purely visual.
    // The interior tile should be occupiable (no wall collision on it).
    // Note: the roof object itself has blocksMovement: false in buildings.json.
    const mask = collision.getMask({ x: 21, y: 21, plane: 0 });
    expect((mask & CollisionFlag.BLOCK_FULL) !== 0).toBe(false);
  });
});
