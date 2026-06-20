import { Scene } from "three";
import { describe, expect, it } from "vitest";
import { ActorRenderer } from "./ActorRenderer";

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
});
