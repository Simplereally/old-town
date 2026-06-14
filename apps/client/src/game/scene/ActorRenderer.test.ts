import type { TileCoord } from "@old-town/shared";
import { Direction, entityId } from "@old-town/shared";
import { type MeshLambertMaterial, Scene } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActorRenderer } from "./ActorRenderer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);
const ID2 = entityId(2);

function actorMeshes(renderer: ActorRenderer, id: number) {
  const meshes = (renderer as unknown as { meshes: Map<number, unknown> }).meshes.get(id);
  if (!meshes) {
    throw new Error(`Expected actor meshes for ${id}`);
  }
  return meshes as {
    healthBar?: {
      group: { visible: boolean };
      fill: { scale: { x: number }; position: { x: number } };
    };
  };
}

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

  it("disposes actor resources on remove", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.remove(ID1);
    expect(renderer.actorCount).toBe(0);
  });

  it("does not dispose shared geometry or materials on remove", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const mesh = renderer.getRaycastTargets()[0];
    if (!mesh) throw new Error("Expected actor mesh");
    const geometryDispose = vi.spyOn(mesh.geometry, "dispose");
    const materialDispose = vi.spyOn(mesh.material as MeshLambertMaterial, "dispose");

    renderer.remove(ID1);

    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
  });

  it("disposes all resources on dispose", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.spawn(ID2, TILE, "npc", false);
    renderer.dispose();
    expect(renderer.actorCount).toBe(0);
  });

  it("keeps health bar hidden until a hit is reported", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.updateHealthBar(ID1, 10, 10);

    expect(actorMeshes(renderer, ID1).healthBar?.group.visible).toBe(false);
  });

  it("renders full, partial, and empty health bars with clamped width", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.notifyHit(ID1, 5);

    renderer.updateHealthBar(ID1, 10, 10);
    expect(actorMeshes(renderer, ID1).healthBar?.fill.scale.x).toBeCloseTo(1.2);

    renderer.updateHealthBar(ID1, 5, 10);
    expect(actorMeshes(renderer, ID1).healthBar?.fill.scale.x).toBeCloseTo(0.6);

    renderer.updateHealthBar(ID1, 0, 10);
    expect(actorMeshes(renderer, ID1).healthBar?.fill.scale.x).toBeGreaterThan(0);
    expect(actorMeshes(renderer, ID1).healthBar?.fill.scale.x).toBeLessThan(0.01);
  });

  it("clamps invalid health bar values before rendering", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.notifyHit(ID1, 5);

    renderer.updateHealthBar(ID1, 20, 10);
    expect(renderer.getActorState(ID1)?.healthBar).toEqual({ current: 10, max: 10 });
    expect(actorMeshes(renderer, ID1).healthBar?.fill.scale.x).toBeCloseTo(1.2);

    renderer.updateHealthBar(ID1, -5, 10);
    expect(renderer.getActorState(ID1)?.healthBar).toEqual({ current: 0, max: 10 });
    expect(actorMeshes(renderer, ID1).healthBar?.fill.scale.x).toBeLessThan(0.01);
  });
});
