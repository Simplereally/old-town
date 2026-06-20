import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifestSchema } from "../content-schemas/asset";

const ROOT = resolve(process.cwd(), "assets/items");
const RANGED_DIR = join(ROOT, "silhouettes/armour-ranged");
const MAGIC_DIR = join(ROOT, "silhouettes/armour-magic");
const MANIFEST_PATH = join(ROOT, "manifest.json");

const RANGED_SLOTS = ["coif", "jerkin", "chaps", "vambraces", "treads", "buckler"];
const MAGIC_SLOTS = ["cowl", "robe", "wraps", "cuffs", "softshoes", "charmward"];

const RANGED_ARMOUR_TIERS = [
  "cobbled",
  "patchhide",
  "boghide",
  "bellhide",
  "blackscale",
  "wardenhide",
  "greenwold",
  "graveskin",
  "blueglass_scale",
  "carmine_hide",
  "argentweave",
  "crownhide",
  "starfall_hide",
];

const MAGIC_TIERS = [
  "cobbled",
  "chalkmarked",
  "tallowbound",
  "bellwax",
  "blacksalt",
  "warden_script",
  "greenwold",
  "gravebound",
  "blueglass",
  "carmine_ink",
  "argent_script",
  "crownvellum",
  "starfall",
];

describe("ranged armour silhouettes (E41-S07)", () => {
  it("all 6 ranged slot SVG files exist", () => {
    const files = readdirSync(RANGED_DIR).filter((f) => f.endsWith(".svg"));
    expect(files).toHaveLength(6);
    for (const slot of RANGED_SLOTS) {
      expect(files).toContain(`${slot}.svg`);
    }
  });

  for (const slot of RANGED_SLOTS) {
    it(`ranged ${slot}.svg has hide/stitch/buckle regions`, () => {
      const svg = readFileSync(join(RANGED_DIR, `${slot}.svg`), "utf8");
      expect(svg).toContain('data-region="hide"');
      expect(svg).toContain('data-region="stitch"');
      expect(svg).toContain('data-region="buckle"');
    });
  }
});

describe("magic armour silhouettes (E41-S07)", () => {
  it("all 6 magic slot SVG files exist", () => {
    const files = readdirSync(MAGIC_DIR).filter((f) => f.endsWith(".svg"));
    expect(files).toHaveLength(6);
    for (const slot of MAGIC_SLOTS) {
      expect(files).toContain(`${slot}.svg`);
    }
  });

  for (const slot of MAGIC_SLOTS) {
    it(`magic ${slot}.svg has cloth/script/seal regions`, () => {
      const svg = readFileSync(join(MAGIC_DIR, `${slot}.svg`), "utf8");
      expect(svg).toContain('data-region="cloth"');
      expect(svg).toContain('data-region="script"');
      expect(svg).toContain('data-region="seal"');
    });
  }
});

describe("ranged+magic armour manifest entries (E41-S07)", () => {
  const manifestRaw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(manifestRaw);
  expect(parsed.success).toBe(true);
  const manifest = parsed.success ? parsed.data : null;
  if (!manifest) throw new Error("manifest parse failed");

  it("manifest has 78 ranged armour icon entries (6 × 13)", () => {
    const icons = manifest.assets.filter(
      (a) =>
        a.kind === "icon" &&
        RANGED_SLOTS.some((s) => a.id.endsWith(`_${s}`)) &&
        a.source?.includes("armour-ranged/"),
    );
    expect(icons).toHaveLength(78);
  });

  it("manifest has 78 magic armour icon entries (6 × 13)", () => {
    const icons = manifest.assets.filter(
      (a) =>
        a.kind === "icon" &&
        MAGIC_SLOTS.some((s) => a.id.endsWith(`_${s}`)) &&
        a.source?.includes("armour-magic/"),
    );
    expect(icons).toHaveLength(78);
  });

  it("every ranged armour icon uses ranged-armour palette", () => {
    for (const tier of RANGED_ARMOUR_TIERS) {
      for (const slot of RANGED_SLOTS) {
        const entry = manifest.assets.find((a) => a.id === `icon_${tier}_${slot}`);
        expect(entry, `missing icon_${tier}_${slot}`).toBeDefined();
        expect(entry?.palette).toContain("ranged-armour/");
      }
    }
  });

  it("every magic armour icon uses magic palette", () => {
    for (const tier of MAGIC_TIERS) {
      for (const slot of MAGIC_SLOTS) {
        const entry = manifest.assets.find((a) => a.id === `icon_${tier}_${slot}`);
        expect(entry, `missing icon_${tier}_${slot}`).toBeDefined();
        expect(entry?.palette).toContain("magic/");
      }
    }
  });
});
