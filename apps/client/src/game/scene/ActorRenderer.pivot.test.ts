import type { TileCoord } from "@old-town/shared";
import { entityId } from "@old-town/shared";
import { Scene, Vector3 } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { type ActorMeshes, ActorRenderer, type AnimationState } from "./ActorRenderer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);

/** Shoulder height after E49-S04 pivot shift. */
const SHOULDER_Y = 0.5 + 0.55 * 0.55 + 0.25;
const HAND_LOCAL_Y = -0.5;

type SampleFn = (
  state: { animationState: AnimationState; entityId: number },
  meshes: ActorMeshes,
  nowMs: number,
) => void;

function sampleAnimation(
  renderer: ActorRenderer,
  entityId: number,
  pose: AnimationState,
  nowMs: number,
): void {
  const meshes = renderer.meshes.get(entityId);
  if (!meshes) throw new Error("missing meshes");
  const sample = (renderer as unknown as { _sampleAnimation: SampleFn })._sampleAnimation.bind(
    renderer,
  );
  sample({ animationState: pose, entityId }, meshes, nowMs);
}

describe("ActorRenderer shoulder pivot (E49-S04)", () => {
  let scene: Scene;
  let renderer: ActorRenderer;

  beforeEach(() => {
    scene = new Scene();
    renderer = new ActorRenderer({ scene, selfEntityId: ID1, poolSize: 2 });
  });

  it("places arms at SHOULDER_Y with hand sockets at local -LEG_H", () => {
    renderer.spawn(ID1, TILE, "player", true, "player");
    const meshes = renderer.meshes.get(ID1)!;
    expect(meshes.parts[3]!.position.y).toBeCloseTo(SHOULDER_Y, 5);
    expect(meshes.parts[4]!.position.y).toBeCloseTo(SHOULDER_Y, 5);
    expect(meshes.handSocketR!.position.y).toBe(HAND_LOCAL_Y);
    expect(meshes.handSocketL!.position.y).toBe(HAND_LOCAL_Y);
  });

  it("moves handSocketR world position during attack vs idle", () => {
    renderer.spawn(ID1, TILE, "player", true, "player");
    const socket = renderer.getHandSocket(ID1, "main")!;
    const meshes = renderer.meshes.get(ID1)!;

    sampleAnimation(renderer, ID1, "idle", 0);
    meshes.group.updateMatrixWorld(true);
    const idlePos = new Vector3();
    socket.getWorldPosition(idlePos);

    // Substep that yields a non-zero sin phase for the attack swing.
    sampleAnimation(renderer, ID1, "attack", 150);
    meshes.group.updateMatrixWorld(true);
    const attackPos = new Vector3();
    socket.getWorldPosition(attackPos);

    const delta = idlePos.distanceTo(attackPos);
    expect(delta).toBeGreaterThan(0.01);
  });

  it("pool reuse restores identical rest pose after many cycles", () => {
    renderer.spawn(ID1, TILE, "player", true, "player");
    const firstMeshes = renderer.meshes.get(ID1)!;
    const restArmY = firstMeshes.parts[4]!.position.y;
    const restSocketY = firstMeshes.handSocketR!.position.y;

    for (let i = 0; i < 20; i++) {
      // Mutate pose as if mid-animation, then release.
      sampleAnimation(renderer, ID1, "attack", 150 + i * 10);
      sampleAnimation(renderer, ID1, "run", 200 + i * 10);
      renderer.remove(ID1);
      renderer.spawn(ID1, TILE, "player", true, "player");
      const meshes = renderer.meshes.get(ID1)!;
      expect(meshes.parts[3]!.position.y).toBeCloseTo(restArmY, 5);
      expect(meshes.parts[4]!.position.y).toBeCloseTo(restArmY, 5);
      expect(meshes.parts[3]!.rotation.x).toBe(0);
      expect(meshes.parts[4]!.rotation.x).toBe(0);
      expect(meshes.handSocketR!.position.y).toBe(restSocketY);
      expect(meshes.handSocketL!.position.y).toBe(restSocketY);
    }
  });
});
