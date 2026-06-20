/**
 * Asset manifest cross-reference for the content validator (E41-S01).
 *
 * Loads `assets/items/manifest.json` and cross-references every item's `icon`/
 * `model` AssetId against it. When the manifest is absent or empty (the S01 seed
 * state, before later stories populate art), asset validation is skipped so the
 * build stays green between stories. Once the manifest has entries, dangling
 * references fail validation.
 */
import { existsSync, readFileSync } from "node:fs";
import {
  type AssetManifest,
  assetManifestSchema,
  type ContentIssue,
  type ItemAssetRef,
  validateItemAssets,
} from "@old-town/shared";

export interface AssetValidationResult {
  readonly issues: ContentIssue[];
  readonly skipped: boolean;
  readonly manifestEntryCount: number;
  readonly itemCount: number;
}

/**
 * Cross-reference item icon/model AssetIds against the asset manifest.
 * Returns `skipped: true` when the manifest is missing or empty so CI does not
 * fail before art is populated (E41-S02 onward fills the manifest).
 */
export function validateAssets(
  items: readonly ItemAssetRef[],
  manifestPath: string,
): AssetValidationResult {
  if (!existsSync(manifestPath)) {
    return { issues: [], skipped: true, manifestEntryCount: 0, itemCount: items.length };
  }

  const raw = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
  const parsed = assetManifestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      issues: [
        {
          path: manifestPath,
          message: `asset manifest schema invalid: ${parsed.error.message}`,
          suggestion: "fix_manifest_schema",
        },
      ],
      skipped: false,
      manifestEntryCount: 0,
      itemCount: items.length,
    };
  }

  const manifest: AssetManifest = parsed.data;
  if (manifest.assets.length === 0) {
    return { issues: [], skipped: true, manifestEntryCount: 0, itemCount: items.length };
  }

  const assetIssues = validateItemAssets(items, manifest);
  const issues: ContentIssue[] = assetIssues.map((issue) => ({
    id: issue.itemId,
    pointer: `/${issue.field}`,
    dependency: [`item:${issue.itemId}`, `asset:${issue.assetId}`],
    suggestion: "create_or_fix_missing_asset_reference",
    message: issue.message,
  }));

  return {
    issues,
    skipped: false,
    manifestEntryCount: manifest.assets.length,
    itemCount: items.length,
  };
}
