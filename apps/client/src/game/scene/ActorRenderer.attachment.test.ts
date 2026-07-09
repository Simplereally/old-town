import { type Object3D, Scene } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { ActorRenderer } from "./ActorRenderer";
import { MAGIC_FAMILIES } from "./models/magic";
import { MELEE_FAMILIES } from "./models/melee";
import { RANGED_FAMILIES } from "./models/ranged";
import { gripCategoryForFamily, resolveGrip } from "./models/weapon-grips";
import { GLB_WEAPON_FAMILIES } from "./WeaponGltfLoader";

const MELEE_TIER = "wardensteel";
const RANGED_BOW_TIER = "lathwood";
const MAGIC_TIER = "chalkmarked";

function assetIdForFamily(familyId: string): string {
  if (MELEE_FAMILIES.some((f) => f.id === familyId)) {
    return `model_${MELEE_TIER}_${familyId}`;
  }
  const ranged = RANGED_FAMILIES.find((f) => f.id === familyId);
  if (ranged) {
    // Bows + knife/dart use ranged tiers; crossbows + javelin/throwing_axe use melee metal.
    const useRanged = ranged.category === "bow" || familyId === "knife" || familyId === "dart";
    const tier = useRanged ? RANGED_BOW_TIER : MELEE_TIER;
    return `model_${tier}_${familyId}`;
  }
  if (MAGIC_FAMILIES.some((f) => f.id === familyId)) {
    return `model_${MAGIC_TIER}_${familyId}`;
  }
  throw new Error(`Unknown family ${familyId}`);
}

function countNamedMeshes(root: Object3D, name: string): number {
  let count = 0;
  root.traverse((obj) => {
    if (obj.name === name) count++;
  });
  return count;
}

describe("ActorRenderer attachment contract (E49-S05)", () => {
  let scene: Scene;
  let renderer: ActorRenderer;

  beforeEach(() => {
    scene = new Scene();
    renderer = new ActorRenderer({ scene, poolSize: 4 });
  });

  it("covers all 36 GLB_WEAPON_FAMILIES", () => {
    expect(GLB_WEAPON_FAMILIES).toHaveLength(36);
  });

  for (const mode of ["glb", "procedural"] as const) {
    describe(`mode=${mode}`, () => {
      for (const familyId of GLB_WEAPON_FAMILIES) {
        it(`attaches ${familyId} to a hand socket with resolveGrip transform`, () => {
          renderer.setWeaponModelMode(mode === "glb" ? "glb" : "procedural");
          // Force procedural path even in "glb" mode when no GLBs are loaded —
          // glbFamilies is empty in unit tests; attachment must still use sockets.
          renderer.spawn(1, { x: 0, y: 0, plane: 0 }, "player", true, "player");
          const assetId = assetIdForFamily(familyId);
          renderer.setWeaponModel(1, assetId);

          expect(renderer.hasWeaponMesh(1)).toBe(true);

          const category = gripCategoryForFamily(familyId, {
            melee: MELEE_FAMILIES,
            ranged: RANGED_FAMILIES,
            magic: MAGIC_FAMILIES,
          });
          expect(category).toBeDefined();

          const offHand = category === "magic_offhand";
          const socket = renderer.getHandSocket(1, offHand ? "off" : "main");
          expect(socket).toBeDefined();
          const weapon = socket!.children.find((c) => c.name === "weapon");
          expect(weapon).toBeDefined();
          expect(weapon!.parent).toBe(socket);

          const grip = resolveGrip(familyId, category!);
          expect(weapon!.position.x).toBe(grip.position[0]);
          expect(weapon!.position.y).toBe(grip.position[1]);
          expect(weapon!.position.z).toBe(grip.position[2]);
          expect(weapon!.rotation.x).toBe(grip.rotation[0]);
          expect(weapon!.rotation.y).toBe(grip.rotation[1]);
          expect(weapon!.rotation.z).toBe(grip.rotation[2]);

          // Never parented to the actor root.
          const meshes = renderer.meshes.get(1)!;
          expect(weapon!.parent).not.toBe(meshes.group);

          renderer.remove(1);
        });
      }
    });
  }

  it("re-equip churn keeps socket child count ≤ 1 and map size correct", () => {
    renderer.spawn(1, { x: 0, y: 0, plane: 0 }, "player", true, "player");
    const families = [
      "shortblade",
      "greatblade",
      "shortbow",
      "crossbow",
      "staff",
      "focus",
    ] as const;
    for (let i = 0; i < 20; i++) {
      const family = families[i % families.length]!;
      renderer.setWeaponModel(1, assetIdForFamily(family));
      const offHand = family === "focus";
      const socket = renderer.getHandSocket(1, offHand ? "off" : "main")!;
      const other = renderer.getHandSocket(1, offHand ? "main" : "off")!;
      expect(socket.children.filter((c) => c.name === "weapon").length).toBeLessThanOrEqual(1);
      expect(other.children.filter((c) => c.name === "weapon").length).toBe(0);
      expect(renderer.hasWeaponMesh(1)).toBe(true);

      renderer.setWeaponModel(1, null);
      expect(socket.children.filter((c) => c.name === "weapon").length).toBe(0);
      expect(renderer.hasWeaponMesh(1)).toBe(false);
    }
  });

  it("pool churn leaves no orphaned weapon meshes in the scene graph", () => {
    for (let i = 0; i < 20; i++) {
      const id = 100 + i;
      renderer.spawn(id, { x: i, y: 0, plane: 0 }, "player", false, "player");
      renderer.setWeaponModel(id, assetIdForFamily("shortblade"));
      expect(renderer.hasWeaponMesh(id)).toBe(true);
      renderer.remove(id);
    }
    expect(countNamedMeshes(scene, "weapon")).toBe(0);
    // Also check the actor group subtree via a fresh spawn's scene.
    renderer.spawn(1, { x: 0, y: 0, plane: 0 }, "player", true, "player");
    expect(countNamedMeshes(scene, "weapon")).toBe(0);
  });
});
