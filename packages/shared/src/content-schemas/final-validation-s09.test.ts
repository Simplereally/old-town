import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifestSchema } from "../content-schemas/asset";

const ROOT = resolve(process.cwd());
const ITEMS_DIR = join(ROOT, "content/items");
const MANIFEST_PATH = join(ROOT, "assets/items/manifest.json");

interface ItemDef {
  readonly id: string;
  readonly icon: string;
  readonly model?: string;
  readonly options?: readonly string[];
}

function loadAllItems(): ItemDef[] {
  const files = readdirSync(ITEMS_DIR).filter((f) => f.endsWith(".json"));
  const items: ItemDef[] = [];
  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(ITEMS_DIR, file), "utf8")) as unknown;
    if (Array.isArray(raw)) {
      for (const entry of raw) {
        if (entry && typeof entry === "object" && "id" in entry && "icon" in entry) {
          items.push(entry as ItemDef);
        }
      }
    }
  }
  return items;
}

describe("E41-S09 final validation: every item has resolvable icon and model", () => {
  const manifestRaw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(manifestRaw);
  expect(parsed.success).toBe(true);
  const manifest = parsed.success ? parsed.data : null;
  if (!manifest) throw new Error("manifest parse failed");

  const knownIds = new Set(manifest.assets.map((a) => a.id));
  const items = loadAllItems();

  it("content has item definitions", () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it("every item has a resolvable icon", () => {
    const missing: string[] = [];
    for (const item of items) {
      if (!knownIds.has(item.icon)) {
        missing.push(`${item.id} → ${item.icon}`);
      }
    }
    expect(missing, `items with missing icons: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("every equippable item has a resolvable model", () => {
    const missing: string[] = [];
    for (const item of items) {
      if (item.model !== undefined && !knownIds.has(item.model)) {
        missing.push(`${item.id} → ${item.model}`);
      }
    }
    expect(missing, `items with missing models: ${missing.join(", ")}`).toHaveLength(0);
  });
});
