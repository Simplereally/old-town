import type { TileCoord } from "@old-town/shared";
import { Direction, entityId } from "@old-town/shared";
import { type MeshLambertMaterial, Scene } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTION_ANIMATION_DURATION_MS,
  ActorRenderer,
  ANIMATION_SUBSTEP_MS,
  ANIMATION_SUBSTEPS_PER_TICK,
} from "./ActorRenderer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);
const ID2 = entityId(2);

function mockCache(presentation: {
  renderX: number;
  renderY: number;
  renderZ: number;
  heading: number;
  movementKind: number;
  appearance?: { name?: string; bodyId?: string; colors?: readonly number[] };
}) {
  return {
    getPresentation: () => ({
      entityId: ID1,
      prevTileX: 5,
      prevTileY: 5,
      prevTilePlane: 0,
      currTileX: 6,
      currTileY: 5,
      currTilePlane: 0,
      renderX: presentation.renderX,
      renderY: presentation.renderY,
      renderZ: presentation.renderZ,
      heading: presentation.heading,
      movementKind: presentation.movementKind,
      renderHandleId: 0,
      kind: "player" as const,
      defId: "player",
      appearance: presentation.appearance,
      debugName: undefined,
    }),
  } as unknown as import("../renderer/RenderTransformCache").RenderTransformCache;
}

describe("ActorRenderer pooling", () => {
  let scene: Scene;
  let renderer: ActorRenderer;

  beforeEach(() => {
    scene = new Scene();
    renderer = new ActorRenderer({ scene, selfEntityId: ID1, poolSize: 4 });
  });

  it("spawns an actor and creates a render handle", () => {
    renderer.spawn(ID1, TILE, "player", true);
    expect(renderer.actorCount).toBe(1);

    const handle = renderer.getRenderHandle(ID1);
    expect(handle).toBeDefined();
    expect(handle?.entityId).toBe(ID1);
    expect(handle?.kind).toBe("player");
    expect(handle?.resourceKey).toBe("humanoid:player");
    expect(handle?.poolSlot).toBeGreaterThanOrEqual(0);
  });

  it("spawns a remote actor with correct handle", () => {
    renderer.spawn(ID2, TILE, "npc_goblin", false, "npc");
    expect(renderer.actorCount).toBe(1);

    const handle = renderer.getRenderHandle(ID2);
    expect(handle).toBeDefined();
    expect(handle?.kind).toBe("npc");
    expect(handle?.resourceKey).toBe("creature:goblinoid");
  });

  it("removes an actor and clears handle", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.remove(ID1);
    expect(renderer.actorCount).toBe(0);
    expect(renderer.getRenderHandle(ID1)).toBeUndefined();
  });

  it("reuses pooled humanoid group after remove", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const handle1 = renderer.getRenderHandle(ID1);
    const group1 = renderer.meshes.get(ID1)?.group;
    expect(group1).toBeDefined();

    renderer.remove(ID1);
    renderer.spawn(ID2, TILE, "player", false);
    const handle2 = renderer.getRenderHandle(ID2);
    const group2 = renderer.meshes.get(ID2)?.group;

    expect(group2).toBe(group1);
    expect(handle2).toBeDefined();
    expect(handle1).toBeDefined();
    expect((handle2 as NonNullable<typeof handle2>).poolSlot).toBe(
      (handle1 as NonNullable<typeof handle1>).poolSlot + 1,
    );
  });

  it("reuses pooled creature mesh after remove", () => {
    renderer.spawn(ID1, TILE, "npc_goblin", false, "npc");
    const group1 = renderer.meshes.get(ID1)?.group;
    expect(group1).toBeDefined();

    renderer.remove(ID1);
    renderer.spawn(ID2, TILE, "npc_goblin", false, "npc");
    const group2 = renderer.meshes.get(ID2)?.group;

    expect(group2).toBe(group1);
  });

  it("updates actor appearance through render metadata", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.updateAppearance(ID1, { name: "Alice" });
    const actor = renderer.getActorState(ID1);
    expect(actor?.name).toBe("Alice");
  });

  it("updates actor facing direction", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.updateFacing(ID1, Direction.East);
    const actor = renderer.getActorState(ID1);
    expect(actor?.facingDirection).toBe(Direction.East);

    const meshes = renderer.meshes.get(ID1);
    expect(meshes).toBeDefined();
    // Mesh rotation is applied from the snapshot heading during updateFromCache.
    const cache = mockCache({
      renderX: 0,
      renderY: 0,
      renderZ: 0,
      heading: Direction.East,
      movementKind: 0,
    });
    renderer.updateFromCache(cache, 1);
    expect(meshes?.group.rotation.y).toBeCloseTo(Math.PI * 0.5, 3);
  });

  it("updates health bar and keeps it hidden until hit", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.updateHealthBar(ID1, 10, 10);
    const meshes = renderer.meshes.get(ID1);
    expect(meshes).toBeDefined();
    expect(meshes?.healthBar?.group.visible).toBe(false);
  });

  it("shows health bar after hit and renders partial fill", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.notifyHit(ID1, 5);
    renderer.updateHealthBar(ID1, 5, 10);
    const meshes = renderer.meshes.get(ID1);
    expect(meshes?.healthBar?.group.visible).toBe(true);
    expect(meshes?.healthBar?.fill.scale.x).toBeCloseTo(0.6, 2);
  });

  it("drives position from RenderTransformCache", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const cache = mockCache({
      renderX: 12.0,
      renderY: 0.5,
      renderZ: -8.0,
      heading: 2, // East
      movementKind: 0, // Idle
    });
    renderer.updateFromCache(cache, 1);
    const meshes = renderer.meshes.get(ID1);
    expect(meshes).toBeDefined();
    expect(meshes?.group.position.x).toBeCloseTo(12.0, 2);
    expect(meshes?.group.position.y).toBeCloseTo(0.5 + 0.1, 1); // GROUND_OFFSET + possible animation offset
    expect(meshes?.group.position.z).toBeCloseTo(-8.0, 2);
    expect(meshes?.group.rotation.y).toBeCloseTo(Math.PI * 0.5, 3);
  });

  it("updates animation state from cache movement kind", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const cache = mockCache({
      renderX: 0,
      renderY: 0,
      renderZ: 0,
      heading: 0,
      movementKind: 1, // Walk
    });
    renderer.updateFromCache(cache, 1);
    const actor = renderer.getActorState(ID1);
    expect(actor?.animationState).toBe("walk");
  });

  it("server action animation overrides locomotion until it expires", () => {
    const nowSpy = vi.spyOn(performance, "now").mockReturnValue(1000);
    renderer.spawn(ID1, TILE, "player", true);

    // The cache reports the actor is walking every frame.
    const walking = mockCache({ renderX: 0, renderY: 0, renderZ: 0, heading: 0, movementKind: 1 });

    // The server signals an attack swing; it must win over the walk pose and
    // survive the per-frame locomotion update that previously stomped it.
    renderer.playAction(ID1, "melee_attack");
    renderer.updateFromCache(walking, 1);
    expect(renderer.getActorState(ID1)?.animationState).toBe("attack");

    // Still inside the action window — action keeps precedence.
    nowSpy.mockReturnValue(1000 + ACTION_ANIMATION_DURATION_MS / 2);
    renderer.updateFromCache(walking, 2);
    expect(renderer.getActorState(ID1)?.animationState).toBe("attack");

    // Past the action window — locomotion resumes on its own, no server packet.
    nowSpy.mockReturnValue(1000 + ACTION_ANIMATION_DURATION_MS + 1);
    renderer.updateFromCache(walking, 3);
    expect(renderer.getActorState(ID1)?.animationState).toBe("walk");

    nowSpy.mockRestore();
  });

  it("resolves server animation content ids to presentational poses", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const idle = mockCache({ renderX: 0, renderY: 0, renderZ: 0, heading: 0, movementKind: 0 });

    renderer.playAction(ID1, "magic_cast");
    renderer.updateFromCache(idle, 1);
    expect(renderer.getActorState(ID1)?.animationState).toBe("cast");

    // Unknown ids fall back to a generic swing rather than vanishing.
    renderer.playAction(ID1, "totally_unknown_move");
    renderer.updateFromCache(idle, 2);
    expect(renderer.getActorState(ID1)?.animationState).toBe("attack");
  });

  it("updates appearance from cache", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const cache = mockCache({
      renderX: 0,
      renderY: 0,
      renderZ: 0,
      heading: 0,
      movementKind: 0,
      appearance: { name: "Bob" },
    });
    renderer.updateFromCache(cache, 1);
    const actor = renderer.getActorState(ID1);
    expect(actor?.name).toBe("Bob");
  });

  it("preserves local-player marker as pooled render child", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const meshes = renderer.meshes.get(ID1);
    expect(meshes).toBeDefined();
    expect(meshes?.marker).toBeDefined();
    expect(meshes?.marker?.visible).toBe(true);
  });

  it("does not show marker for non-local player", () => {
    renderer.spawn(ID1, TILE, "player", false);
    const meshes = renderer.meshes.get(ID1);
    expect(meshes).toBeDefined();
    expect(meshes?.marker).toBeDefined();
    expect(meshes?.marker?.visible).toBe(false);
  });

  it("returns pool stats after spawn and remove", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.spawn(ID2, TILE, "player", false);
    let stats = renderer.poolStats();
    expect(stats.humanoidActive).toBe(2);
    expect(stats.humanoidFree).toBe(2);
    expect(stats.humanoidPoolSize).toBe(4);

    renderer.remove(ID1);
    stats = renderer.poolStats();
    expect(stats.humanoidActive).toBe(1);
    expect(stats.humanoidFree).toBe(3);
  });

  it("does not dispose shared geometry or materials on remove", () => {
    renderer.spawn(ID1, TILE, "player", true);
    const meshes = renderer.meshes.get(ID1);
    if (!meshes) throw new Error("Expected actor mesh");
    const geometryDispose = vi.spyOn(meshes.body.geometry, "dispose");
    const materialDispose = vi.spyOn(meshes.body.material as MeshLambertMaterial, "dispose");

    renderer.remove(ID1);

    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
  });

  it("defines animation quantization constants", () => {
    expect(ANIMATION_SUBSTEPS_PER_TICK).toBe(4);
    expect(ANIMATION_SUBSTEP_MS).toBe(150);
  });

  it("clears all actors and releases pools", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.spawn(ID2, TILE, "npc_goblin", false, "npc");
    renderer.clear();
    expect(renderer.actorCount).toBe(0);
    const stats = renderer.poolStats();
    expect(stats.humanoidActive).toBe(0);
    expect(stats.humanoidFree).toBe(4);
  });

  it("disposes actor resources on dispose", () => {
    renderer.spawn(ID1, TILE, "player", true);
    renderer.spawn(ID2, TILE, "player", false);
    renderer.dispose();
    expect(renderer.actorCount).toBe(0);
  });
});
