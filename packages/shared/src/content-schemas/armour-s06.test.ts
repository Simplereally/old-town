import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifestSchema } from "../content-schemas/asset";

const ROOT = resolve(process.cwd(), "assets/items");
const SILHOUETTE_DIR = join(ROOT, "silhouettes/armour-melee");
const MANIFEST_PATH = join(ROOT, "manifest.json");

const ARMOUR_SLOTS = [
  "helm",
  "greathelm",
  "harness",
  "hauberk",
  "platecoat",
  "chausses",
  "sabatons",
  "gauntlets",
  "ward",
];

const MELEE_TIERS = [
  "cobbled",
  "pennywrought",
  "pig_iron",
  "bellmetal",
  "blackbar",
  "wardensteel",
  "greenwold",
  "graveiron",
  "blueglass",
  "carmine_steel",
  "argent",
  "crownsteel",
  "starfall",
];

describe("melee armour silhouettes (E41-S06)", () => {
  it("all 9 slot SVG files exist", () => {
    const files = readdirSync(SILHOUETTE_DIR).filter((f) => f.endsWith(".svg"));
    expect(files).toHaveLength(9);
    for (const slot of ARMOUR_SLOTS) {
      expect(files).toContain(`${slot}.svg`);
    }
  });

  for (const slot of ARMOUR_SLOTS) {
    it(`${slot}.svg has metal/trim/accent/straps regions`, () => {
      const svg = readFileSync(join(SILHOUETTE_DIR, `${slot}.svg`), "utf8");
      expect(svg).toContain('data-region="metal"');
      expect(svg).toContain('data-region="trim"');
      expect(svg).toContain('data-region="accent"');
      expect(svg).toContain('data-region="straps"');
    });
  }
});

describe("melee armour manifest entries (E41-S06)", () => {
  const manifestRaw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(manifestRaw);
  expect(parsed.success).toBe(true);
  const manifest = parsed.success ? parsed.data : null;
  if (!manifest) throw new Error("manifest parse failed");

  it("manifest has 117 armour icon entries (9 × 13)", () => {
    const armourIcons = manifest.assets.filter(
      (a) =>
        a.kind === "icon" &&
        ARMOUR_SLOTS.some((s) => a.id.endsWith(`_${s}`)) &&
        a.source?.includes("armour-melee/"),
    );
    expect(armourIcons).toHaveLength(117);
  });

  it("manifest has 117 armour model entries (9 × 13)", () => {
    const armourModels = manifest.assets.filter(
      (a) =>
        a.kind === "model" &&
        ARMOUR_SLOTS.some((s) => a.id.endsWith(`_${s}`)) &&
        a.source?.includes("armour-melee/"),
    );
    expect(armourModels).toHaveLength(117);
  });

  it("every icon_{tier}_{slot} uses melee palette", () => {
    for (const tier of MELEE_TIERS) {
      for (const slot of ARMOUR_SLOTS) {
        const entry = manifest.assets.find((a) => a.id === `icon_${tier}_${slot}`);
        expect(entry, `missing icon_${tier}_${slot}`).toBeDefined();
        expect(entry?.palette).toContain("melee/");
      }
    }
  });
});
