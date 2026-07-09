/**
 * PNG icon atlas packer.
 *
 * Packs individual 64×64 RGBA PNGs from `assets/items/icons-png/` into a single
 * raster sprite-sheet PNG + an `AtlasIndex` JSON file (same format as the SVG
 * atlas) so the client `IconAtlas` can resolve both SVG and raster icons.
 *
 * Usage: bun run icons:pack-png
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { PNG } from "pngjs";
import type { AtlasCell, AtlasIndex } from "../packages/shared/src/index";

const ASSETS_DIR = resolve(process.cwd(), "assets/items");
const SRC_DIR = join(ASSETS_DIR, "icons-png");
const OUT_DIR = join(ASSETS_DIR, "atlases");
const CELL_SIZE = 64;

async function readPng(path: string): Promise<PNG> {
  const buf = await readFile(path);
  return PNG.sync.read(buf);
}

async function main(): Promise<void> {
  const entries = await readdir(SRC_DIR);
  const pngFiles = entries.filter((f) => f.endsWith(".png")).sort();
  if (pngFiles.length === 0) {
    console.warn("[pack-icon-png] no PNGs found in", SRC_DIR);
    process.exitCode = 1;
    return;
  }

  // Load all PNGs
  const icons: { id: string; png: PNG }[] = [];
  for (const file of pngFiles) {
    const id = `icon_${file.replace(/\.png$/, "")}`;
    const png = await readPng(join(SRC_DIR, file));
    if (png.width !== CELL_SIZE || png.height !== CELL_SIZE) {
      console.warn(
        `[pack-icon-png] skipping ${file}: expected ${CELL_SIZE}×${CELL_SIZE}, got ${png.width}×${png.height}`,
      );
      continue;
    }
    icons.push({ id, png });
  }

  // Layout: near-square grid, left-to-right, top-to-bottom (matches SVG packer)
  const count = icons.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const atlasW = cols * CELL_SIZE;
  const atlasH = rows * CELL_SIZE;

  const atlas = new PNG({ width: atlasW, height: atlasH });
  const cells: Record<string, AtlasCell> = {};

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    if (!icon) continue;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    cells[icon.id] = { x, y, w: CELL_SIZE, h: CELL_SIZE };

    // Copy pixel data
    const src = icon.png.data;
    const dst = atlas.data;
    for (let py = 0; py < CELL_SIZE; py++) {
      for (let px = 0; px < CELL_SIZE; px++) {
        const srcIdx = (py * CELL_SIZE + px) * 4;
        const dstIdx = ((y + py) * atlasW + (x + px)) * 4;
        dst[dstIdx] = src[srcIdx];
        dst[dstIdx + 1] = src[srcIdx + 1];
        dst[dstIdx + 2] = src[srcIdx + 2];
        dst[dstIdx + 3] = src[srcIdx + 3];
      }
    }
  }

  await mkdir(OUT_DIR, { recursive: true });
  const atlasPath = join(OUT_DIR, "atlas-png-0.png");
  await writeFile(atlasPath, PNG.sync.write(atlas));

  const index: AtlasIndex = {
    version: 1,
    atlas: "atlas-png-0.png",
    cellSize: CELL_SIZE,
    cells,
  };
  await writeFile(join(OUT_DIR, "atlas-png-index.json"), `${JSON.stringify(index, null, 2)}\n`);

  console.log(
    `[pack-icon-png] packed ${icons.length} icon(s) into ${atlasPath.replace(`${process.cwd()}/`, "")} (${atlasW}×${atlasH})`,
  );
}

await main().catch((error) => {
  console.error(`[pack-icon-png] ERROR ${(error as Error).message}`);
  process.exit(1);
});
process.exit(0);
