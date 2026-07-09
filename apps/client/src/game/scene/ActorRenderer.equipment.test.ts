import { Scene } from "three";
import { describe, expect, it } from "vitest";
import { ActorRenderer } from "./ActorRenderer";
import { resolveGrip } from "./models/weapon-grips";

describe("ActorRenderer equipment composition (E41-S09)", () => {
  let scene: Scene;
  let renderer: ActorRenderer;

  function createRenderer(): ActorRenderer {
    scene = new Scene();
    return new ActorRenderer({ scene });
  }

  it("attaches a full same-tier melee set without errors", () => {
    renderer = createRenderer();
    renderer.spawn(1, { x: 0, y: 0, plane: 0 }, "humanoid_male", true, "player");
    // Weapon
    renderer.setWeaponModel(1, "model_wardensteel_shortblade");
    // Armour
    renderer.setArmourModel(1, "head", "model_wardensteel_helm");
    renderer.setArmourModel(1, "body", "model_wardensteel_harness");
    renderer.setArmourModel(1, "legs", "model_wardensteel_chausses");
    renderer.setArmourModel(1, "feet", "model_wardensteel_sabatons");
    renderer.setArmourModel(1, "hands", "model_wardensteel_gauntlets");
    renderer.setArmourModel(1, "shield", "model_wardensteel_ward");
    // No errors thrown means composition succeeded
    expect(renderer.actorCount).toBe(1);
  });

  it("attaches a mixed-tier set without slot conflicts", () => {
    renderer = createRenderer();
    renderer.spawn(2, { x: 1, y: 1, plane: 0 }, "humanoid_male", false, "player");
    renderer.setWeaponModel(2, "model_bellmetal_shortblade");
    renderer.setArmourModel(2, "head", "model_wardensteel_helm");
    renderer.setArmourModel(2, "body", "model_bellmetal_harness");
    renderer.setArmourModel(2, "legs", "model_pennywrought_chausses");
    renderer.setArmourModel(2, "shield", "model_starfall_ward");
    expect(renderer.actorCount).toBe(1);
  });

  it("attaches ranged armour and accessories", () => {
    renderer = createRenderer();
    renderer.spawn(3, { x: 2, y: 2, plane: 0 }, "humanoid_male", false, "player");
    renderer.setWeaponModel(3, "model_lathwood_shortbow");
    renderer.setArmourModel(3, "head", "model_patchhide_coif");
    renderer.setArmourModel(3, "body", "model_patchhide_jerkin");
    renderer.setArmourModel(3, "legs", "model_patchhide_chaps");
    renderer.setArmourModel(3, "shield", "model_patchhide_buckler");
    renderer.setAccessoryModel(3, "cape", "model_warden_issued_cape");
    renderer.setAccessoryModel(3, "amulet", "model_warden_issued_amulet");
    expect(renderer.actorCount).toBe(1);
  });

  it("attaches magic armour and accessories", () => {
    renderer = createRenderer();
    renderer.spawn(4, { x: 3, y: 3, plane: 0 }, "humanoid_male", false, "player");
    renderer.setWeaponModel(4, "model_chalkmarked_staff");
    renderer.setArmourModel(4, "head", "model_chalkmarked_cowl");
    renderer.setArmourModel(4, "body", "model_chalkmarked_robe");
    renderer.setArmourModel(4, "legs", "model_chalkmarked_wraps");
    renderer.setArmourModel(4, "shield", "model_chalkmarked_charmward");
    renderer.setAccessoryModel(4, "cape", "model_starfall_cape");
    expect(renderer.actorCount).toBe(1);
  });

  it("clears armour slot on null", () => {
    renderer = createRenderer();
    renderer.spawn(5, { x: 4, y: 4, plane: 0 }, "humanoid_male", false, "player");
    renderer.setArmourModel(5, "head", "model_wardensteel_helm");
    renderer.setArmourModel(5, "head", null);
    expect(renderer.actorCount).toBe(1);
  });

  it("clears accessory slot on null", () => {
    renderer = createRenderer();
    renderer.spawn(6, { x: 5, y: 5, plane: 0 }, "humanoid_male", false, "player");
    renderer.setAccessoryModel(6, "cape", "model_warden_issued_cape");
    renderer.setAccessoryModel(6, "cape", null);
    expect(renderer.actorCount).toBe(1);
  });

  it("defaults to glb weapon model mode", () => {
    renderer = createRenderer();
    expect(renderer.weaponModelMode).toBe("glb");
  });

  it("re-applies weapons when weapon model mode toggles", () => {
    renderer = createRenderer();
    renderer.spawn(7, { x: 6, y: 6, plane: 0 }, "humanoid_male", false, "player");
    renderer.setWeaponModel(7, "model_wardensteel_shortblade");
    // Weapon mesh is present.
    expect(renderer.hasWeaponMesh(7)).toBe(true);

    // Switch to procedural — weapon should be re-attached.
    renderer.setWeaponModelMode("procedural");
    expect(renderer.weaponModelMode).toBe("procedural");
    expect(renderer.hasWeaponMesh(7)).toBe(true);

    // Switch back to glb.
    renderer.setWeaponModelMode("glb");
    expect(renderer.weaponModelMode).toBe("glb");
    expect(renderer.hasWeaponMesh(7)).toBe(true);
  });

  it("clears weapon asset tracking on despawn", () => {
    renderer = createRenderer();
    renderer.spawn(8, { x: 7, y: 7, plane: 0 }, "humanoid_male", false, "player");
    renderer.setWeaponModel(8, "model_wardensteel_shortblade");
    expect(renderer.hasWeaponAssetId(8)).toBe(true);
    renderer.remove(8);
    expect(renderer.hasWeaponAssetId(8)).toBe(false);
  });

  it("attaches weapon mesh to the main-hand socket with grip transform", () => {
    renderer = createRenderer();
    renderer.spawn(9, { x: 8, y: 8, plane: 0 }, "humanoid_male", false, "player");
    renderer.setWeaponModel(9, "model_wardensteel_shortblade");

    const socket = renderer.getHandSocket(9, "main");
    expect(socket).toBeDefined();
    const weapon = socket!.children.find((c) => c.name === "weapon");
    expect(weapon).toBeDefined();
    expect(renderer.hasWeaponMesh(9)).toBe(true);

    const grip = resolveGrip("shortblade", "melee_1h");
    expect(weapon!.position.x).toBe(grip.position[0]);
    expect(weapon!.position.y).toBe(grip.position[1]);
    expect(weapon!.position.z).toBe(grip.position[2]);
    expect(weapon!.rotation.x).toBe(grip.rotation[0]);
    expect(weapon!.rotation.y).toBe(grip.rotation[1]);
    expect(weapon!.rotation.z).toBe(grip.rotation[2]);
  });

  it("attaches off-hand focus to the left-hand socket", () => {
    renderer = createRenderer();
    renderer.spawn(10, { x: 9, y: 9, plane: 0 }, "humanoid_male", false, "player");
    renderer.setWeaponModel(10, "model_chalkmarked_focus");

    const socket = renderer.getHandSocket(10, "off");
    expect(socket).toBeDefined();
    const weapon = socket!.children.find((c) => c.name === "weapon");
    expect(weapon).toBeDefined();
    expect(
      renderer.getHandSocket(10, "main")!.children.find((c) => c.name === "weapon"),
    ).toBeUndefined();
  });

  it("clears weapon from the socket and the weaponMeshes map", () => {
    renderer = createRenderer();
    renderer.spawn(11, { x: 10, y: 10, plane: 0 }, "humanoid_male", false, "player");
    renderer.setWeaponModel(11, "model_wardensteel_shortblade");
    const socket = renderer.getHandSocket(11, "main")!;
    expect(socket.children.some((c) => c.name === "weapon")).toBe(true);

    renderer.setWeaponModel(11, null);
    expect(socket.children.some((c) => c.name === "weapon")).toBe(false);
    expect(renderer.hasWeaponMesh(11)).toBe(false);
  });

  it("attaches shield to the left-hand socket with shield grip", () => {
    renderer = createRenderer();
    renderer.spawn(13, { x: 12, y: 12, plane: 0 }, "humanoid_male", false, "player");
    renderer.setArmourModel(13, "shield", "model_wardensteel_ward");

    const socket = renderer.getHandSocket(13, "off")!;
    const shield = socket.children.find((c) => c.name === "armour_shield");
    expect(shield).toBeDefined();
    const grip = resolveGrip("ward", "shield");
    expect(shield!.position.x).toBe(grip.position[0]);
    expect(shield!.position.y).toBe(grip.position[1]);
    expect(shield!.position.z).toBe(grip.position[2]);
    expect(shield!.rotation.y).toBe(grip.rotation[1]);
  });

  it("despawn detaches weapon and shield from sockets (no pool ghosts)", () => {
    renderer = createRenderer();
    renderer.spawn(14, { x: 13, y: 13, plane: 0 }, "humanoid_male", false, "player");
    renderer.setWeaponModel(14, "model_wardensteel_shortblade");
    renderer.setArmourModel(14, "shield", "model_wardensteel_ward");
    const socketR = renderer.getHandSocket(14, "main")!;
    const socketL = renderer.getHandSocket(14, "off")!;
    expect(socketR.children.length).toBeGreaterThan(0);
    expect(socketL.children.length).toBeGreaterThan(0);

    renderer.remove(14);
    expect(socketR.children.length).toBe(0);
    expect(socketL.children.length).toBe(0);

    // Re-acquire pooled humanoid — sockets must stay empty until re-equip.
    renderer.spawn(15, { x: 14, y: 14, plane: 0 }, "humanoid_male", false, "player");
    expect(renderer.getHandSocket(15, "main")!.children.length).toBe(0);
    expect(renderer.getHandSocket(15, "off")!.children.length).toBe(0);
  });
});
