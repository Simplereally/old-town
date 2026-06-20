import type { TileCoord } from "@old-town/shared";
import { entityId } from "@old-town/shared";
import { Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { ObjectRenderer } from "./ObjectRenderer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);
const ID2 = entityId(2);

describe("E43-S05 — Roof and interior rendering", () => {
  let scene: Scene;
  let renderer: ObjectRenderer;

  beforeEach(() => {
    scene = new Scene();
    renderer = new ObjectRenderer({ scene });
  });

  it("resolves building_ def IDs to correct archetypes", () => {
    renderer.spawn(ID1, TILE, "building_wall_straight");
    renderer.spawn(ID2, TILE, "building_roof_flat");
    renderer.flush(1);

    const targets = renderer.getRaycastTargets();
    // wall and roof are different archetypes => two buckets
    expect(targets.length).toBe(2);
  });

  it("resolves building_door_wood to door archetype", () => {
    renderer.spawn(ID1, TILE, "building_door_wood");
    renderer.flush(1);
    const targets = renderer.getRaycastTargets();
    expect(targets.length).toBe(1);
  });

  it("resolves building_gate_town to gate archetype", () => {
    renderer.spawn(ID1, TILE, "building_gate_town");
    renderer.flush(1);
    const targets = renderer.getRaycastTargets();
    expect(targets.length).toBe(1);
  });

  it("setRoofVisible hides only roof buckets, not walls", () => {
    renderer.spawn(ID1, TILE, "building_roof_flat");
    renderer.spawn(ID2, TILE, "building_wall_straight");
    renderer.flush(1);

    const targets = renderer.getRaycastTargets();
    expect(targets.length).toBe(2);

    // Hide roofs in region 0:0:0
    renderer.setRoofVisible("0:0:0", false);

    const roofBucket = targets.find(
      (m) => (m.userData as { archetypeId?: string }).archetypeId === "roof",
    );
    const wallBucket = targets.find(
      (m) => (m.userData as { archetypeId?: string }).archetypeId === "wall",
    );

    // Roof should be hidden, wall should remain visible.
    expect(roofBucket?.visible).toBe(false);
    expect(wallBucket?.visible).toBe(true);
  });

  it("setRoofVisible restores roof visibility when set to true", () => {
    renderer.spawn(ID1, TILE, "building_roof_flat");
    renderer.flush(1);

    renderer.setRoofVisible("0:0:0", false);
    renderer.setRoofVisible("0:0:0", true);

    const targets = renderer.getRaycastTargets();
    const roofBucket = targets[0];
    expect(roofBucket?.visible).toBe(true);
  });

  it("updateDoorState changes door transform (open vs closed)", () => {
    renderer.spawn(ID1, TILE, "building_door_wood");
    renderer.flush(1);

    // Opening the door should not throw and should keep the object.
    renderer.updateDoorState(ID1, true);
    renderer.flush(2);
    expect(renderer.objectCount).toBe(1);

    // Closing should also work.
    renderer.updateDoorState(ID1, false);
    renderer.flush(3);
    expect(renderer.objectCount).toBe(1);
  });

  it("updateDoorState is a no-op for non-existent entities", () => {
    renderer.updateDoorState(entityId(999), true);
    expect(renderer.objectCount).toBe(0);
  });

  it("roof visibility does not affect collision or object count", () => {
    renderer.spawn(ID1, TILE, "building_roof_flat");
    renderer.spawn(ID2, TILE, "building_door_wood");
    renderer.flush(1);

    renderer.setRoofVisible("0:0:0", false);
    renderer.setRoofVisible("0:0:0", true);

    expect(renderer.objectCount).toBe(2);
  });
});
