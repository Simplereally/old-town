/**
 * Copy generated weapon .glb models from the authoring directory
 * (`assets/items/models/`) into the client's static public directory
 * (`apps/client/public/models/weapons/`) so Vite serves them at runtime.
 *
 * Run after `scripts/generate-weapon-models.py` has (re)generated the GLBs.
 */
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const srcDir = join(root, "assets", "items", "models");
const destDir = join(root, "apps", "client", "public", "models", "weapons");

async function main(): Promise<void> {
  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir);
  const glbs = entries.filter((name) => name.endsWith(".glb")).sort();
  if (glbs.length === 0) {
    console.warn("[copy-weapon-models] no .glb files found in", srcDir);
    process.exitCode = 1;
    return;
  }
  let copied = 0;
  for (const name of glbs) {
    await cp(join(srcDir, name), join(destDir, name));
    copied++;
  }
  console.log(
    `[copy-weapon-models] copied ${copied} glb files -> ${destDir.replace(`${root}/`, "")}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
