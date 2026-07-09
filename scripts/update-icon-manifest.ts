/**
 * Updates `assets/items/manifest.json` icon entries to point at their rendered
 * PNG sources in `icons-png/`.
 *
 * Scans the manifest for icon assets still using the placeholder silhouette and
 * checks whether a matching PNG exists in `assets/items/icons-png/`. If so, it
 * rewrites the `source` field to `icons-png/<id>.png`.
 *
 * Usage: bun run scripts/update-icon-manifest.ts [--dry-run]
 */

import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const ASSETS_DIR = resolve(process.cwd(), "assets/items");
const MANIFEST = join(ASSETS_DIR, "manifest.json");
const PNG_DIR = join(ASSETS_DIR, "icons-png");

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const raw = await readFile(MANIFEST, "utf8");
  const manifest = JSON.parse(raw) as {
    assets: Array<{ id: string; kind: string; source?: string }>;
  };

  // Build set of available PNG filenames (without extension)
  const available = new Set<string>();
  if (existsSync(PNG_DIR)) {
    const files = await readdir(PNG_DIR);
    for (const f of files) {
      if (f.endsWith(".png")) available.add(f.replace(/\.png$/, ""));
    }
  }

  let updated = 0;
  let skipped = 0;
  for (const asset of manifest.assets) {
    if (asset.kind !== "icon") continue;
    if (!asset.source?.includes("_placeholder")) continue;
    const pngId = asset.id.replace(/^icon_/, "");
    if (!available.has(pngId)) {
      skipped++;
      continue;
    }
    asset.source = `icons-png/${pngId}.png`;
    updated++;
  }

  console.log(
    `[manifest] ${updated} icon(s) updated, ${skipped} still on placeholder, ${available.size} PNG(s) available`,
  );

  if (dryRun) {
    console.log("[manifest] dry-run — no changes written");
    return;
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("[manifest] written");
}

await main().catch((error) => {
  console.error(`[manifest] ERROR ${(error as Error).message}`);
  process.exit(1);
});
process.exit(0);
