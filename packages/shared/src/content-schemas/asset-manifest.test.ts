import { describe, expect, it } from "vitest";
import { assetManifestEntrySchema, assetManifestSchema } from "./asset";

describe("assetManifestSchema", () => {
  it("accepts a valid manifest with icon and model entries", () => {
    const valid = {
      version: 1,
      assets: [
        {
          id: "icon_shortblade",
          kind: "icon",
          source: "silhouettes/shortblade.svg",
          silhouette: "silhouettes/shortblade.svg",
          palette: "palettes/melee/pennywrought.json",
        },
        {
          id: "model_shortblade",
          kind: "model",
          source: "models/shortblade.json",
        },
      ],
    };
    expect(assetManifestSchema.parse(valid)).toEqual(valid);
  });

  it("rejects an entry missing kind", () => {
    const entry = {
      id: "icon_x",
      source: "silhouettes/x.svg",
    };
    const result = assetManifestEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects an entry missing source", () => {
    const entry = {
      id: "icon_x",
      kind: "icon",
    };
    const result = assetManifestEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects an entry missing id", () => {
    const entry = {
      kind: "icon",
      source: "silhouettes/x.svg",
    };
    const result = assetManifestEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid kind value", () => {
    const entry = {
      id: "icon_x",
      kind: "texture",
      source: "silhouettes/x.svg",
    };
    const result = assetManifestEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("rejects a manifest with wrong version", () => {
    const manifest = { version: 2, assets: [] };
    const result = assetManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });

  it("rejects a manifest with unknown top-level fields (strict)", () => {
    const manifest = { version: 1, assets: [], extra: true };
    const result = assetManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });
});
