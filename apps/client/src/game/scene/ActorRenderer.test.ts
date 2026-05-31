import { Direction, entityId } from "@old-town/shared";
import type { TileCoord } from "@old-town/shared";
import { Scene, Vector3 } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { ActorRenderer } from "./ActorRenderer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);
const ID2 = entityId(2);

describe("ActorRenderer", () => {
  let scene: Scene;
  let renderer: ActorRenderer;

  beforeEach(() => {
    scene = new Scene();
    renderer = new ActorRenderer({ scene, selfEntityId: ID1 });
  });

  it("starts with no actors", () => {
    expect(renderer.actorCount).toBe(0);
  });

  it("spawns an actor", () => {
    renderer.spawn(ID1, TILE, "player", true);
    expect(renderer.actorCount).toBe(1);
  });

  it("spawns a remote actor", () => {
    renderer.spawn(ID2, TILE, "npc_goblin", false);
    expect(renderer.actorCount).toBe(1);
  });

  it("removes an actor", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.remove(ID1);
    expect(renderer.actorCount).toBe(0);
  });

  it("updates actor tile", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const newTile: TileCoord = { x: 6, y: 5, plane: 0 };
    renderer.updateTile(ID1, newTile);
    const actor = renderer.getActorState(ID1);
    expect(actor).toBeDefined();
    expect(actor?.serverTile).toEqual(newTile);
  });

  it("updates actor facing", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.updateFacing(ID1, Direction.East);
    const actor = renderer.getActorState(ID1);
    expect(actor?.facingDirection).toBe(Direction.East);
  });

  it("interpolates actor position", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const newTile: TileCoord = { x: 6, y: 5, plane: 0 };
    renderer.updateTile(ID1, newTile);
    renderer.interpolate();
    const actor = renderer.getActorState(ID1);
    expect(actor?.visualPosition).toBeInstanceOf(Vector3);
  });

  it("clears all actors", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.spawn(ID2, TILE, "npc", false);
    renderer.clear();
    expect(renderer.actorCount).toBe(0);
  });

  it("handles update of non-existent actor gracefully", () => {
    renderer.updateTile(entityId(999), TILE);
    expect(renderer.actorCount).toBe(0);
  });

  it("sets self entity id", () => {
    renderer.setSelfEntityId(42);
    expect(renderer.getActorState(entityId(42))).toBeUndefined();
  });

  it("interpolates correctly at tick start", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const newTile: TileCoord = { x: 6, y: 5, plane: 0 };
    renderer.updateTile(ID1, newTile);
    renderer.interpolate();
    const actor = renderer.getActorState(ID1);
    expect(actor?.visualPosition.x).toBeCloseTo(5, 1);
    expect(actor?.visualPosition.z).toBeCloseTo(-5, 1);
  });

  it("disposes actor resources on remove", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.remove(ID1);
    expect(renderer.actorCount).toBe(0);
  });

  it("disposes all resources on dispose", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.spawn(ID2, TILE, "npc", false);
    renderer.dispose();
    expect(renderer.actorCount).toBe(0);
  });
});
