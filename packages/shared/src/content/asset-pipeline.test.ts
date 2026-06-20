import { describe, expect, it } from "vitest";
import type { AssetManifest } from "../content-schemas/asset";
import {
  composeIconSilhouette,
  ICON_CELL_SIZE,
  PLACEHOLDER_COLOR,
  packIconAtlas,
  validateItemAssets,
} from "./asset-pipeline";

describe("composeIconSilhouette", () => {
  it("recolors data-region elements from a region map", () => {
    const svg = '<svg><path data-region="blade" d="M0 0"/><rect data-region="grip"/></svg>';
    const out = composeIconSilhouette(svg, { blade: "#b87333", grip: "#8a6a44" });
    expect(out).toContain('data-region="blade" fill="#b87333"');
    expect(out).toContain('data-region="grip" fill="#8a6a44"');
  });

  it("falls back to magenta for regions absent from the palette", () => {
    const svg = '<svg><path data-region="blade" d="M0 0"/></svg>';
    const out = composeIconSilhouette(svg, {});
    expect(out).toContain(`fill="${PLACEHOLDER_COLOR}"`);
  });

  it("is deterministic: identical input yields identical output", () => {
    const svg = '<svg><path data-region="blade" d="M0 0"/></svg>';
    const regions = { blade: "#b87333" };
    expect(composeIconSilhouette(svg, regions)).toBe(composeIconSilhouette(svg, regions));
  });

  it("accepts a Map as well as a plain object", () => {
    const svg = '<svg><path data-region="blade" d="M0 0"/></svg>';
    const map = new Map([["blade", "#b87333"]]);
    expect(composeIconSilhouette(svg, map)).toContain('fill="#b87333"');
  });
});

describe("packIconAtlas", () => {
  it("sorts icons by id for stable diffs", () => {
    const icons = [
      { id: "icon_zeta", svg: "<g/>" },
      { id: "icon_alpha", svg: "<g/>" },
      { id: "icon_mid", svg: "<g/>" },
    ];
    const { index } = packIconAtlas(icons);
    const ids = Object.keys(index.cells);
    expect(ids).toEqual(["icon_alpha", "icon_mid", "icon_zeta"]);
  });

  it("places cells left-to-right, top-to-bottom in a near-square grid", () => {
    const icons = Array.from({ length: 5 }, (_, i) => ({ id: `icon_${i}`, svg: "<g/>" }));
    const { index } = packIconAtlas(icons);
    // 5 icons → cols=3, rows=2
    const cells = index.cells;
    expect(cells.icon_0).toEqual({ x: 0, y: 0, w: ICON_CELL_SIZE, h: ICON_CELL_SIZE });
    expect(cells.icon_1?.x).toBe(ICON_CELL_SIZE);
    expect(cells.icon_3?.x).toBe(0);
    expect(cells.icon_3?.y).toBe(ICON_CELL_SIZE);
  });

  it("is deterministic: same input → same atlas SVG and index", () => {
    const icons = [
      { id: "icon_b", svg: "<g b/>" },
      { id: "icon_a", svg: "<g a/>" },
    ];
    const a = packIconAtlas(icons);
    const b = packIconAtlas(icons);
    expect(a.atlasSvg).toBe(b.atlasSvg);
    expect(a.index).toEqual(b.index);
  });

  it("produces an empty atlas for zero icons", () => {
    const { atlasSvg, index } = packIconAtlas([]);
    expect(Object.keys(index.cells)).toHaveLength(0);
    expect(atlasSvg).toContain('width="0"');
  });
});

describe("validateItemAssets", () => {
  const manifest: AssetManifest = {
    version: 1,
    assets: [
      { id: "icon_a", kind: "icon", source: "silhouettes/a.svg" },
      { id: "model_a", kind: "model", source: "models/a.json" },
    ],
  };

  it("returns no issues when every icon and model resolves", () => {
    const issues = validateItemAssets(
      [{ id: "item_a", icon: "icon_a", model: "model_a" }],
      manifest,
    );
    expect(issues).toEqual([]);
  });

  it("reports a dangling icon reference", () => {
    const issues = validateItemAssets([{ id: "item_x", icon: "icon_missing" }], manifest);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.field).toBe("icon");
    expect(issues[0]?.assetId).toBe("icon_missing");
  });

  it("reports a dangling model reference but allows absent model", () => {
    const issues = validateItemAssets(
      [{ id: "item_y", icon: "icon_a", model: "model_missing" }],
      manifest,
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.field).toBe("model");
  });

  it("does not report when model is absent (non-equippable items)", () => {
    const issues = validateItemAssets([{ id: "item_z", icon: "icon_a" }], manifest);
    expect(issues).toEqual([]);
  });
});
