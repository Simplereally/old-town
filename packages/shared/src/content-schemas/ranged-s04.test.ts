import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifestSchema } from "../content-schemas/asset";

const ROOT = resolve(process.cwd(), "assets/items");
const SILHOUETTE_DIR = join(ROOT, "silhouettes/ranged");
const MANIFEST_PATH = join(ROOT, "manifest.json");

const BOW_FAMILIES = [
  "bentbow",
  "shortbow",
  "longbow",
  "recurve",
  "warbow",
  "quickbow",
  "stillbow",
  "starbow",
];
const CROSSBOW_FAMILIES = ["latchbow", "crossbow", "arbalest", "crankbow", "handbow", "greatbow"];
const THROWN_FAMILIES = ["knife", "dart", "javelin", "throwing_axe"];
const ALL_FAMILIES = [...BOW_FAMILIES, ...CROSSBOW_FAMILIES, ...THROWN_FAMILIES];

const RANGED_TIERS = [
  "cobbled",
  "lathwood",
  "bogwood",
  "bellhorn",
  "blackstring",
  "warden_yew",
  "greenwold",
  "gravebent",
  "blueglass",
  "carmine_ash",
  "argentwood",
  "crownhorn",
  "starfall",
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

describe("ranged silhouettes (E41-S04)", () => {
  it("all 18 family SVG files exist", () => {
    const files = readdirSync(SILHOUETTE_DIR).filter((f) => f.endsWith(".svg"));
    expect(files).toHaveLength(18);
    for (const family of ALL_FAMILIES) {
      expect(files).toContain(`${family}.svg`);
    }
  });

  for (const family of BOW_FAMILIES) {
    it(`bow ${family}.svg has limb/string/grip regions`, () => {
      const svg = readFileSync(join(SILHOUETTE_DIR, `${family}.svg`), "utf8");
      expect(svg).toContain('data-region="limb"');
      expect(svg).toContain('data-region="string"');
      expect(svg).toContain('data-region="grip"');
    });
  }

  for (const family of CROSSBOW_FAMILIES) {
    it(`crossbow ${family}.svg has prod/stock/mechanism regions`, () => {
      const svg = readFileSync(join(SILHOUETTE_DIR, `${family}.svg`), "utf8");
      expect(svg).toContain('data-region="prod"');
      expect(svg).toContain('data-region="stock"');
      expect(svg).toContain('data-region="mechanism"');
    });
  }

  for (const family of THROWN_FAMILIES) {
    it(`thrown ${family}.svg has blade/head + shaft + fletch regions`, () => {
      const svg = readFileSync(join(SILHOUETTE_DIR, `${family}.svg`), "utf8");
      // All thrown have shaft and fletch
      expect(svg).toContain('data-region="shaft"');
      expect(svg).toContain('data-region="fletch"');
      // knife/dart have blade; javelin/throwing_axe have head
      if (family === "knife" || family === "dart") {
        expect(svg).toContain('data-region="blade"');
      } else {
        expect(svg).toContain('data-region="head"');
      }
    });
  }
});

describe("ranged manifest entries (E41-S04)", () => {
  const manifestRaw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(manifestRaw);
  expect(parsed.success).toBe(true);
  const manifest = parsed.success ? parsed.data : null;
  if (!manifest) throw new Error("manifest parse failed");

  it("manifest has 234 ranged icon entries (18 × 13)", () => {
    const rangedIcons = manifest.assets.filter(
      (a) =>
        a.kind === "icon" &&
        ALL_FAMILIES.some((f) => a.id.endsWith(`_${f}`)) &&
        a.source?.includes("ranged/"),
    );
    expect(rangedIcons).toHaveLength(234);
  });

  it("manifest has 234 ranged model entries (18 × 13)", () => {
    const rangedModels = manifest.assets.filter(
      (a) =>
        a.kind === "model" &&
        ALL_FAMILIES.some((f) => a.id.endsWith(`_${f}`)) &&
        a.source?.includes("ranged/"),
    );
    expect(rangedModels).toHaveLength(234);
  });

  it("every bow icon_{tier}_{family} uses ranged palette", () => {
    for (const tier of RANGED_TIERS) {
      for (const family of BOW_FAMILIES) {
        const entry = manifest.assets.find((a) => a.id === `icon_${tier}_${family}`);
        expect(entry, `missing icon_${tier}_${family}`).toBeDefined();
        expect(entry?.palette).toContain("ranged/");
      }
    }
  });

  it("every crossbow icon_{tier}_{family} uses melee palette", () => {
    for (const tier of MELEE_TIERS) {
      for (const family of CROSSBOW_FAMILIES) {
        const entry = manifest.assets.find((a) => a.id === `icon_${tier}_${family}`);
        expect(entry, `missing icon_${tier}_${family}`).toBeDefined();
        expect(entry?.palette).toContain("melee/");
      }
    }
  });
});
