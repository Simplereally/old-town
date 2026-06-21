import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifestSchema } from "../content-schemas/asset";

const ROOT = resolve(process.cwd(), "assets/items");
const SILHOUETTE_DIR = join(ROOT, "silhouettes/magic");
const MANIFEST_PATH = join(ROOT, "manifest.json");

const MAGIC_FAMILIES = ["wand", "staff", "rod", "focus", "primer", "codex"];

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

const STAFF_FAMILIES = ["wand", "staff", "rod"];
const BOOK_FAMILIES = ["primer", "codex"];

describe("magic silhouettes (E41-S05)", () => {
  it("all 6 family SVG files exist", () => {
    const files = readdirSync(SILHOUETTE_DIR).filter((f) => f.endsWith(".svg"));
    expect(files).toHaveLength(6);
    for (const family of MAGIC_FAMILIES) {
      expect(files).toContain(`${family}.svg`);
    }
  });

  for (const family of STAFF_FAMILIES) {
    it(`staff-type ${family}.svg has shaft/tip/bead regions`, () => {
      const svg = readFileSync(join(SILHOUETTE_DIR, `${family}.svg`), "utf8");
      expect(svg).toContain('data-region="shaft"');
      expect(svg).toContain('data-region="tip"');
      expect(svg).toContain('data-region="bead"');
    });
  }

  it("focus.svg has lens/rim regions", () => {
    const svg = readFileSync(join(SILHOUETTE_DIR, "focus.svg"), "utf8");
    expect(svg).toContain('data-region="lens"');
    expect(svg).toContain('data-region="rim"');
  });

  for (const family of BOOK_FAMILIES) {
    it(`book-type ${family}.svg has cover/page/seal regions`, () => {
      const svg = readFileSync(join(SILHOUETTE_DIR, `${family}.svg`), "utf8");
      expect(svg).toContain('data-region="cover"');
      expect(svg).toContain('data-region="page"');
      expect(svg).toContain('data-region="seal"');
    });
  }
});

describe("magic manifest entries (E41-S05)", () => {
  const manifestRaw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(manifestRaw);
  expect(parsed.success).toBe(true);
  const manifest = parsed.success ? parsed.data : null;
  if (!manifest) throw new Error("manifest parse failed");

  it("manifest has 78 magic icon entries (6 × 13)", () => {
    const magicIcons = manifest.assets.filter(
      (a) =>
        a.kind === "icon" &&
        MAGIC_FAMILIES.some((f) => a.id.endsWith(`_${f}`)) &&
        a.source?.includes("magic/"),
    );
    expect(magicIcons).toHaveLength(78);
  });

  it("manifest has 78 magic model entries (6 × 13)", () => {
    const magicModels = manifest.assets.filter(
      (a) =>
        a.kind === "model" &&
        MAGIC_FAMILIES.some((f) => a.id.endsWith(`_${f}`)) &&
        a.source?.includes("magic/"),
    );
    expect(magicModels).toHaveLength(78);
  });

  it("every icon_{tier}_{family} uses magic palette", () => {
    for (const tier of MAGIC_TIERS) {
      for (const family of MAGIC_FAMILIES) {
        const entry = manifest.assets.find((a) => a.id === `icon_${tier}_${family}`);
        expect(entry, `missing icon_${tier}_${family}`).toBeDefined();
        expect(entry?.palette).toContain("magic/");
      }
    }
  });
});
