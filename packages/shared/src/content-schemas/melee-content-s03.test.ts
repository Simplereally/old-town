import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifestSchema } from "../content-schemas/asset";

const ROOT = resolve(process.cwd());
const WEAPONS_PATH = resolve(ROOT, "content/items/weapons.json");
const MANIFEST_PATH = resolve(ROOT, "assets/items/manifest.json");

interface WeaponItem {
  readonly id: string;
  readonly category?: string;
  readonly icon?: string;
  readonly model?: string;
}

describe("melee weapon content ↔ manifest resolution (E41-S03)", () => {
  const weapons = JSON.parse(readFileSync(WEAPONS_PATH, "utf8")) as WeaponItem[];
  const meleeItems = weapons.filter((w) => w.category === "melee");

  const manifestRaw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(manifestRaw);
  const manifest = parsed.success ? parsed.data : null;

  it("content/items/weapons.json has at least 2 melee items", () => {
    expect(meleeItems.length).toBeGreaterThanOrEqual(2);
  });

  it("every melee item has an icon and model field", () => {
    for (const item of meleeItems) {
      expect(item.icon, `${item.id} missing icon`).toBeTruthy();
      expect(item.model, `${item.id} missing model`).toBeTruthy();
    }
  });

  it("every melee item icon/model resolves to a manifest entry", () => {
    for (const item of meleeItems) {
      const iconEntry = manifest?.assets.find((a) => a.id === item.icon);
      expect(iconEntry, `${item.id}: icon "${item.icon}" not in manifest`).toBeDefined();
      expect(iconEntry?.kind).toBe("icon");

      const modelEntry = manifest?.assets.find((a) => a.id === item.model);
      expect(modelEntry, `${item.id}: model "${item.model}" not in manifest`).toBeDefined();
      expect(modelEntry?.kind).toBe("model");
    }
  });
});
