import type { TileCoord } from "@old-town/shared";
import { entityId } from "@old-town/shared";
import { Group, Mesh, Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { ActorRenderer } from "./ActorRenderer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };
const ID1 = entityId(1);
const ID2 = entityId(2);

/** Arm geometry is LEG_H=0.5; after shoulder-pivot translate, hand is at local y = -0.5. */
const HAND_LOCAL_Y = -0.5;
/** Shoulder height: ARM_Y (0.8025) + LEG_H/2. */
const SHOULDER_Y = 0.5 + 0.55 * 0.55 + 0.25;

describe("ActorRenderer hand sockets (E49-S01)", () => {
  let scene: Scene;
  let renderer: ActorRenderer;

  beforeEach(() => {
    scene = new Scene();
    renderer = new ActorRenderer({ scene, selfEntityId: ID1, poolSize: 2 });
  });

  it("creates both sockets as children of the correct arm at the hand point", () => {
    renderer.spawn(ID1, TILE, "player", true, "player");

    const socketR = renderer.getHandSocket(ID1, "main");
    const socketL = renderer.getHandSocket(ID1, "off");
    expect(socketR).toBeInstanceOf(Group);
    expect(socketL).toBeInstanceOf(Group);
    expect(socketR!.name).toBe("handSocketR");
    expect(socketL!.name).toBe("handSocketL");
    expect(socketR!.position.x).toBe(0);
    expect(socketR!.position.y).toBe(HAND_LOCAL_Y);
    expect(socketR!.position.z).toBe(0);
    expect(socketL!.position.y).toBe(HAND_LOCAL_Y);

    const meshes = renderer.meshes.get(ID1)!;
    const leftArm = meshes.parts[3]!;
    const rightArm = meshes.parts[4]!;
    expect(leftArm).toBeInstanceOf(Mesh);
    expect(rightArm).toBeInstanceOf(Mesh);
    expect(socketL!.parent).toBe(leftArm);
    expect(socketR!.parent).toBe(rightArm);
    expect(leftArm.position.y).toBeCloseTo(SHOULDER_Y, 5);
    expect(rightArm.position.y).toBeCloseTo(SHOULDER_Y, 5);
  });

  it("preserves socket transforms across pool release and re-acquire", () => {
    renderer.spawn(ID1, TILE, "player", true, "player");
    const firstR = renderer.getHandSocket(ID1, "main")!;
    const firstL = renderer.getHandSocket(ID1, "off")!;
    // Mutate to prove reset restores rest pose.
    firstR.position.set(1, 2, 3);
    firstL.rotation.set(0.5, 0.5, 0.5);

    renderer.remove(ID1);
    renderer.spawn(ID2, TILE, "player", false, "player");

    const socketR = renderer.getHandSocket(ID2, "main")!;
    const socketL = renderer.getHandSocket(ID2, "off")!;
    // Same pooled mesh record reused (poolSize=2, one free).
    expect(socketR.position.x).toBe(0);
    expect(socketR.position.y).toBe(HAND_LOCAL_Y);
    expect(socketR.position.z).toBe(0);
    expect(socketR.rotation.x).toBe(0);
    expect(socketR.rotation.y).toBe(0);
    expect(socketR.rotation.z).toBe(0);
    expect(socketL.position.y).toBe(HAND_LOCAL_Y);
    expect(socketL.rotation.x).toBe(0);
    expect(socketL.rotation.y).toBe(0);
    expect(socketL.rotation.z).toBe(0);
  });

  it("returns undefined for creature actors without throwing", () => {
    renderer.spawn(ID1, TILE, "mud_goblin", false, "npc");
    expect(renderer.getHandSocket(ID1, "main")).toBeUndefined();
    expect(renderer.getHandSocket(ID1, "off")).toBeUndefined();
    const meshes = renderer.meshes.get(ID1)!;
    expect(meshes.handSocketR).toBeUndefined();
    expect(meshes.handSocketL).toBeUndefined();
    expect(meshes.parts).toHaveLength(0);
  });
});
