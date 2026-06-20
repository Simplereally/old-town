import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateAssets } from "./asset-validation";

let tmpDirs: string[] = [];

afterEach(() => {
  for (const dir of tmpDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs = [];
});

function writeManifest(manifest: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "asset-val-"));
  tmpDirs.push(dir);
  const path = join(dir, "manifest.json");
  writeFileSync(path, JSON.stringify(manifest), "utf8");
  return path;
}

describe("validateAssets (content validator asset cross-reference)", () => {
  it("flags an item whose icon is not in the manifest", () => {
    const path = writeManifest({
      version: 1,
      assets: [{ id: "icon_other", kind: "icon", source: "x.svg" }],
    });

    const result = validateAssets([{ id: "bad_item", icon: "icon_missing" }], path);
    expect(result.skipped).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.message).toContain("icon_missing");
  });

  it("flags a dangling model reference", () => {
    const path = writeManifest({
      version: 1,
      assets: [{ id: "icon_ok", kind: "icon", source: "x.svg" }],
    });

    const result = validateAssets(
      [{ id: "item_y", icon: "icon_ok", model: "model_missing" }],
      path,
    );
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.message).toContain("model_missing");
  });

  it("skips validation when manifest has zero entries (S01 seed state)", () => {
    const path = writeManifest({ version: 1, assets: [] });

    const result = validateAssets([{ id: "item", icon: "icon_x" }], path);
    expect(result.skipped).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("skips validation when manifest file is absent", () => {
    const result = validateAssets([{ id: "item", icon: "icon_x" }], "/nonexistent/manifest.json");
    expect(result.skipped).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("passes when every icon and model resolves", () => {
    const path = writeManifest({
      version: 1,
      assets: [
        { id: "icon_a", kind: "icon", source: "a.svg" },
        { id: "model_a", kind: "model", source: "a.json" },
      ],
    });

    const result = validateAssets([{ id: "item_a", icon: "icon_a", model: "model_a" }], path);
    expect(result.issues).toEqual([]);
  });
});
