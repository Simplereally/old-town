/**
 * Copy generated building .glb models from the authoring directory
 * (`assets/buildings/models/`) into the client's static public directory
 * (`apps/client/public/models/buildings/`) so Vite serves them at runtime.
 *
 * Validates the set against manifest.json: a missing or extra GLB fails the
 * copy, so the manifest stays the single source of truth.
 *
 * Run after `scripts/generate-building-models.py` has (re)generated the GLBs.
 */
import { cp, mkdir, readdir, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const srcDir = join(root, "assets", "buildings", "models");
const destDir = join(root, "apps", "client", "public", "models", "buildings");

async function main(): Promise<void> {
  const manifest = JSON.parse(await readFile(join(srcDir, "manifest.json"), "utf8")) as {
    archetypes: string[];
  };
  const expected = new Set(manifest.archetypes.map((id) => `${id}.glb`));

  const entries = await readdir(srcDir);
  const glbs = new Set(entries.filter((name) => name.endsWith(".glb")));

  const missing = [...expected].filter((name) => !glbs.has(name));
  const extra = [...glbs].filter((name) => !expected.has(name));
  if (missing.length > 0 || extra.length > 0) {
    if (missing.length > 0) console.error("[copy-building-models] missing GLBs:", missing);
    if (extra.length > 0)
      console.error("[copy-building-models] extra GLBs not in manifest:", extra);
    process.exit(1);
  }

  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
  for (const name of [...expected].sort()) {
    await cp(join(srcDir, name), join(destDir, name));
  }
  await cp(join(srcDir, "manifest.json"), join(destDir, "manifest.json"));
  console.log(
    `[copy-building-models] copied ${expected.size} glb files + manifest -> ${destDir.replace(`${root}/`, "")}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
