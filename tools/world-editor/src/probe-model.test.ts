import { CollisionFlag, type ContentRegistries, type RegionMapDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  interactionFixture,
  losFixture,
  pathFixture,
  probeFixtureJson,
  runInteractionProbe,
  runLosProbe,
  runPathProbe,
} from "./probe-model";

const region: RegionMapDef = {
  region: { rx: 0, ry: 0, plane: 0 },
  tiles: {
    default: { height: 0, underlayId: "grass", collision: 0 },
    overrides: [
      { x: 1, y: 1, collision: CollisionFlag.BLOCK_EAST | CollisionFlag.BLOCK_LOS_EAST },
      { x: 2, y: 1, collision: CollisionFlag.BLOCK_WEST },
    ],
  },
  objects: [{ objectId: "tree", x: 4, y: 4, rotation: 0 }],
  npcSpawns: [{ npcId: "rat", x: 7, y: 7, wanderRadius: 2 }],
  groundItemSpawns: [],
  resourceNodeSpawns: [],
  playerSpawnPoints: [],
  deathRespawnPoints: [],
  triggers: [],
};

const registries = {
  object: new Map([
    [
      "tree",
      {
        id: "tree",
        name: "Tree",
        width: 1,
        length: 1,
        blocksMovement: true,
        blocksLineOfSight: true,
        options: [],
        defaultRotation: 0,
      },
    ],
  ]),
  npc: new Map([
    [
      "rat",
      {
        id: "rat",
        name: "Rat",
        size: 1,
        wanderRadius: 0,
        respawnTicks: 10,
        options: [],
        movementType: "static",
        aggressionMode: "peaceful",
        contractEligible: false,
      },
    ],
  ]),
} as Pick<ContentRegistries, "object" | "npc">;

describe("world editor probe model", () => {
  it("runs path probes through production pathfinding and collision", () => {
    const result = runPathProbe(region, registries, { x: 0, y: 1 }, { x: 3, y: 1 });

    expect(result.reached).toBe(true);
    expect(result.path.map((tile) => `${tile.x},${tile.y}`)).not.toEqual(["1,1", "2,1", "3,1"]);
    expect(
      JSON.parse(probeFixtureJson(pathFixture(region, { x: 0, y: 1 }, { x: 3, y: 1 }, result))),
    ).toMatchObject({
      kind: "path",
      reached: true,
    });
  });

  it("runs line-of-sight probes through production collision checks", () => {
    const result = runLosProbe(region, registries, { x: 1, y: 1 }, { x: 2, y: 1 });

    expect(result.clear).toBe(false);
    expect(losFixture(region, { x: 1, y: 1 }, { x: 2, y: 1 }, result).ray).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ]);
  });

  it("runs interaction reach probes against placed object footprints", () => {
    const result = runInteractionProbe(
      region,
      registries,
      { x: 0, y: 4 },
      { kind: "object", index: 0 },
      1,
      false,
    );

    expect(result.inRange).toBe(false);
    expect(result.nearestTile).toEqual({ x: 3, y: 3 });
    expect(result.reachTiles).toContainEqual({ x: 3, y: 4 });
    expect(interactionFixture(region, { x: 0, y: 4 }, result)).toMatchObject({
      kind: "interaction",
      nearestTile: { x: 3, y: 3 },
    });
  });
});
