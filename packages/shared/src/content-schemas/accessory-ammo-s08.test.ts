import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifestSchema } from "../content-schemas/asset";

const ROOT = resolve(process.cwd(), "assets/items");
const ACCESSORY_DIR = join(ROOT, "silhouettes/accessory");
const AMMO_DIR = join(ROOT, "silhouettes/ammo");
const MANIFEST_PATH = join(ROOT, "manifest.json");

const ACCESSORY_SLOTS = ["cape", "amulet", "ring", "charm", "belt", "trophy"];
const VISIBLE_ACCESSORIES = ["cape", "amulet", "belt", "trophy"];

const BOW_AMMO = ["arrows", "war_arrows", "true_arrows", "barbs", "broadheads"];
const METAL_AMMO = ["bolts", "quarrels", "bodkins", "starheads"];
const ALL_AMMO = [...BOW_AMMO, ...METAL_AMMO];

const _ACCESSORY_TIERS = [
  "cobbled",
  "threadbare",
  "waxed",
  "bellstruck",
  "blacksealed",
  "warden_issued",
  "greenwold",
  "gravebound",
  "blueglass",
  "carmine",
  "argent",
  "crown",
  "starfall",
];

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

describe("accessory silhouettes (E41-S08)", () => {
  it("all 6 accessory SVG files exist", () => {
    const files = readdirSync(ACCESSORY_DIR).filter((f) => f.endsWith(".svg"));
    expect(files).toHaveLength(6);
    for (const slot of ACCESSORY_SLOTS) {
      expect(files).toContain(`${slot}.svg`);
    }
  });

  for (const slot of ACCESSORY_SLOTS) {
    if (slot === "ring" || slot === "charm") {
      it(`accessory ${slot}.svg has metal/seal regions`, () => {
        const svg = readFileSync(join(ACCESSORY_DIR, `${slot}.svg`), "utf8");
        expect(svg).toContain('data-region="metal"');
        expect(svg).toContain('data-region="seal"');
      });
    } else {
      it(`accessory ${slot}.svg has cloth/metal/seal regions`, () => {
        const svg = readFileSync(join(ACCESSORY_DIR, `${slot}.svg`), "utf8");
        expect(svg).toContain('data-region="cloth"');
        expect(svg).toContain('data-region="metal"');
        expect(svg).toContain('data-region="seal"');
      });
    }
  }
});

describe("ammo silhouettes (E41-S08)", () => {
  it("all 9 ammo SVG files exist", () => {
    const files = readdirSync(AMMO_DIR).filter((f) => f.endsWith(".svg"));
    expect(files).toHaveLength(9);
    for (const ammo of ALL_AMMO) {
      expect(files).toContain(`${ammo}.svg`);
    }
  });

  for (const ammo of ALL_AMMO) {
    it(`ammo ${ammo}.svg has shaft/head/fletch regions`, () => {
      const svg = readFileSync(join(AMMO_DIR, `${ammo}.svg`), "utf8");
      expect(svg).toContain('data-region="shaft"');
      expect(svg).toContain('data-region="head"');
      expect(svg).toContain('data-region="fletch"');
    });
  }
});

describe("accessory + ammo manifest entries (E41-S08)", () => {
  const manifestRaw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(manifestRaw);
  expect(parsed.success).toBe(true);
  const manifest = parsed.success ? parsed.data : null;
  if (!manifest) throw new Error("manifest parse failed");

  it("manifest has 78 accessory icon entries (6 × 13)", () => {
    const icons = manifest.assets.filter(
      (a) =>
        a.kind === "icon" &&
        ACCESSORY_SLOTS.some((s) => a.id.endsWith(`_${s}`)) &&
        a.source?.includes("accessory/"),
    );
    expect(icons).toHaveLength(78);
  });

  it("manifest has 52 visible-accessory model entries (4 × 13)", () => {
    const models = manifest.assets.filter(
      (a) =>
        a.kind === "model" &&
        VISIBLE_ACCESSORIES.some((s) => a.id.endsWith(`_${s}`)) &&
        a.source?.includes("accessory/"),
    );
    expect(models).toHaveLength(52);
  });

  it("ring and charm have no accessory model entries (icon-only)", () => {
    const ringModels = manifest.assets.filter(
      (a) => a.kind === "model" && a.id.endsWith("_ring") && a.source?.includes("accessory/"),
    );
    const charmModels = manifest.assets.filter(
      (a) => a.kind === "model" && a.id.endsWith("_charm") && a.source?.includes("accessory/"),
    );
    expect(ringModels).toHaveLength(0);
    expect(charmModels).toHaveLength(0);
  });

  it("manifest has 117 ammo icon entries (9 × 13)", () => {
    const icons = manifest.assets.filter(
      (a) =>
        a.kind === "icon" &&
        ALL_AMMO.some((s) => a.id.endsWith(`_${s}`)) &&
        a.source?.includes("ammo/"),
    );
    expect(icons).toHaveLength(117);
  });

  it("bow-tier ammo uses ranged palette", () => {
    for (const tier of RANGED_TIERS) {
      for (const ammo of BOW_AMMO) {
        const entry = manifest.assets.find((a) => a.id === `icon_${tier}_${ammo}`);
        expect(entry, `missing icon_${tier}_${ammo}`).toBeDefined();
        expect(entry?.palette).toContain("ranged/");
      }
    }
  });

  it("metal-head ammo uses melee palette", () => {
    for (const tier of MELEE_TIERS) {
      for (const ammo of METAL_AMMO) {
        const entry = manifest.assets.find((a) => a.id === `icon_${tier}_${ammo}`);
        expect(entry, `missing icon_${tier}_${ammo}`).toBeDefined();
        expect(entry?.palette).toContain("melee/");
      }
    }
  });
});
