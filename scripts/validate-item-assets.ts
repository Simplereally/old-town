/**
 * Item asset validator (E41-S01).
 *
 * Loads every `content/items/*.json`, extracts `icon`/`model` AssetIds, and
 * cross-references them against `assets/items/manifest.json`. Exits non-zero on
 * any dangling reference so CI gates on missing art. Silent missing art is a bug.
 *
 * Usage: bun run items:validate-assets
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  type AssetManifest,
  assetManifestSchema,
  type ItemAssetRef,
  validateItemAssets,
} from "../packages/shared/src/index";

const CONTENT_ITEMS_DIR = resolve(process.cwd(), "content/items");
const MANIFEST_PATH = resolve(process.cwd(), "assets/items/manifest.json");

function loadManifest(): AssetManifest {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`ERROR asset manifest not found at ${MANIFEST_PATH}`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`ERROR asset manifest schema invalid: ${parsed.error.message}`);
    process.exit(1);
  }
  return parsed.data;
}

function loadItemRefs(): ItemAssetRef[] {
  const refs: ItemAssetRef[] = [];
  if (!existsSync(CONTENT_ITEMS_DIR)) return refs;
  for (const file of readdirSync(CONTENT_ITEMS_DIR)) {
    if (!file.endsWith(".json")) continue;
    const text = readFileSync(join(CONTENT_ITEMS_DIR, file), "utf8");
    const arr = JSON.parse(text) as Array<{ id?: string; icon?: string; model?: string }>;
    for (const item of arr) {
      if (typeof item.id !== "string" || typeof item.icon !== "string") continue;
      refs.push({
        id: item.id,
        icon: item.icon,
        ...(typeof item.model === "string" ? { model: item.model } : {}),
      });
    }
  }
  return refs;
}

function main(): void {
  const manifest = loadManifest();
  const refs = loadItemRefs();
  const issues = validateItemAssets(refs, manifest);

  if (issues.length > 0) {
    const lines = [`ERROR item asset validation failed - ${issues.length} dangling reference(s).`];
    for (const issue of issues) {
      lines.push(`  item=${issue.itemId} field=${issue.field} asset=${issue.assetId}`);
      lines.push(`    ${issue.message}`);
    }
    console.error(lines.join("\n"));
    process.exit(1);
  }

  console.log(
    `OK item assets valid - ${refs.length} item(s), ${manifest.assets.length} manifest entr(y/ies), zero dangling references.`,
  );
}

main();
