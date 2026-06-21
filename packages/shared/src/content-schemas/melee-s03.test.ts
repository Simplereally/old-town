import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifestSchema } from "../content-schemas/asset";

const ROOT = resolve(process.cwd(), "assets/items");
const SILHOUETTE_DIR = join(ROOT, "silhouettes/melee");
const MANIFEST_PATH = join(ROOT, "manifest.json");

const MELEE_FAMILIES = [
  "sticker",
  "shortblade",
  "longblade",
  "greatblade",
  "sabre",
  "handaxe",
  "fellaxe",
  "cudgel",
  "maul",
  "spear",
  "billhook",
  "glaive",
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

const REQUIRED_REGIONS = ["blade", "grip", "accent", "trim"];

describe("melee silhouettes (E41-S03)", () => {
  it("all 12 family SVG files exist", () => {
    const files = readdirSync(SILHOUETTE_DIR).filter((f) => f.endsWith(".svg"));
    expect(files).toHaveLength(12);
    for (const family of MELEE_FAMILIES) {
      expect(files).toContain(`${family}.svg`);
    }
  });

  for (const family of MELEE_FAMILIES) {
    it(`${family}.svg has all required data-region attributes`, () => {
      const svg = readFileSync(join(SILHOUETTE_DIR, `${family}.svg`), "utf8");
      for (const region of REQUIRED_REGIONS) {
        expect(svg, `${family}.svg missing data-region="${region}"`).toContain(
          `data-region="${region}"`,
        );
      }
    });
  }
});

describe("melee manifest entries (E41-S03)", () => {
  const manifestRaw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(manifestRaw);
  expect(parsed.success).toBe(true);
  const manifest = parsed.success ? parsed.data : null;

  it("manifest has 156 melee icon entries (12 × 13)", () => {
    const meleeIcons = manifest?.assets.filter(
      (a) => a.kind === "icon" && MELEE_FAMILIES.some((f) => a.id.endsWith(`_${f}`)),
    );
    expect(meleeIcons).toHaveLength(156);
  });

  it("manifest has 156 melee model entries (12 × 13)", () => {
    const meleeModels = manifest?.assets.filter(
      (a) => a.kind === "model" && MELEE_FAMILIES.some((f) => a.id.endsWith(`_${f}`)),
    );
    expect(meleeModels).toHaveLength(156);
  });

  it("every icon_{tier}_{family} entry exists for all 12×13 combinations", () => {
    for (const tier of MELEE_TIERS) {
      for (const family of MELEE_FAMILIES) {
        const iconId = `icon_${tier}_${family}`;
        const entry = manifest?.assets.find((a) => a.id === iconId);
        expect(entry, `missing manifest entry ${iconId}`).toBeDefined();
        expect(entry?.kind).toBe("icon");
        expect(entry?.source).toContain(`melee/${family}.svg`);
      }
    }
  });

  it("every model_{tier}_{family} entry exists for all 12×13 combinations", () => {
    for (const tier of MELEE_TIERS) {
      for (const family of MELEE_FAMILIES) {
        const modelId = `model_${tier}_${family}`;
        const entry = manifest?.assets.find((a) => a.id === modelId);
        expect(entry, `missing manifest entry ${modelId}`).toBeDefined();
        expect(entry?.kind).toBe("model");
      }
    }
  });
});
