/**
 * Item asset build pipeline (E41-S01).
 *
 * Loads `assets/items/manifest.json`, composes every icon entry from its
 * silhouette + tier palette, packs the result into a deterministic sprite atlas,
 * and writes `assets/items/atlases/atlas-0.svg` + `atlas-index.json`. Model
 * entries are validated but produce no raster output in this story.
 *
 * Usage: bun run items:build-assets
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  type AssetManifest,
  type AssetManifestEntry,
  assetManifestSchema,
  composeIconSilhouette,
  packIconAtlas,
  tierPaletteSchema,
} from "../packages/shared/src/index";

const ASSETS_DIR = resolve(process.cwd(), "assets/items");
const MANIFEST_PATH = join(ASSETS_DIR, "manifest.json");
const ATLASES_DIR = join(ASSETS_DIR, "atlases");

async function readJson<T>(path: string): Promise<T> {
  const text = await readFile(path, "utf8");
  return JSON.parse(text) as T;
}

async function loadManifest(): Promise<AssetManifest> {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`ERROR manifest not found at ${MANIFEST_PATH}`);
    process.exit(1);
  }
  const raw = await readJson<unknown>(MANIFEST_PATH);
  const parsed = assetManifestSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`ERROR manifest schema invalid: ${parsed.error.message}`);
    process.exit(1);
  }
  return parsed.data;
}

async function composeIconEntry(entry: AssetManifestEntry): Promise<string | null> {
  if (entry.kind !== "icon") return null;
  if (!entry.silhouette) {
    // Placeholder entry — not yet ready to build (future story). Skip silently.
    return null;
  }
  const silhouettePath = join(ASSETS_DIR, entry.silhouette);
  if (!existsSync(silhouettePath)) {
    console.error(`ERROR silhouette not found for "${entry.id}": ${entry.silhouette}`);
    process.exit(1);
  }
  const svg = await readFile(silhouettePath, "utf8");

  let regions: Record<string, string> = {};
  if (entry.paletteRegions) {
    regions = entry.paletteRegions;
  } else if (entry.palette) {
    const palettePath = join(ASSETS_DIR, entry.palette);
    if (!existsSync(palettePath)) {
      console.error(`ERROR palette not found for "${entry.id}": ${entry.palette}`);
      process.exit(1);
    }
    const paletteRaw = await readJson<unknown>(palettePath);
    const palette = tierPaletteSchema.safeParse(paletteRaw);
    if (!palette.success) {
      console.error(`ERROR palette invalid for "${entry.id}": ${palette.error.message}`);
      process.exit(1);
    }
    regions = palette.data.regions;
  }

  return composeIconSilhouette(svg, regions);
}

async function main(): Promise<void> {
  const manifest = await loadManifest();
  const icons: { id: string; svg: string }[] = [];

  for (const entry of manifest.assets) {
    if (entry.kind === "icon") {
      const svg = await composeIconEntry(entry);
      if (svg) icons.push({ id: entry.id, svg });
    }
  }

  const packed = packIconAtlas(icons);
  await mkdir(ATLASES_DIR, { recursive: true });
  await writeFile(join(ATLASES_DIR, "atlas-0.svg"), packed.atlasSvg, "utf8");
  await writeFile(
    join(ATLASES_DIR, "atlas-index.json"),
    `${JSON.stringify(packed.index, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `OK item assets built — ${icons.length} icon(s), atlas ${packed.index.atlas} (${Object.keys(packed.index.cells).length} cells).`,
  );
}

await main().catch((error) => {
  console.error(`ERROR ${(error as Error).message}`);
  process.exit(1);
});
