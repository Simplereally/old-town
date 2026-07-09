import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { type LoadedContentFile, validateContent } from "../content/content-registry";
import { materialDefSchema } from "./material";

const CONTENT_DIR = resolve(process.cwd(), "content");

function file(kind: LoadedContentFile["kind"], path: string, data: unknown): LoadedContentFile {
  return { kind, path, data };
}

describe("E42-S01 — ground material schema", () => {
  it("parses a full material definition with all new fields", () => {
    const result = materialDefSchema.safeParse({
      id: "bellstone_plaza",
      name: "Bellstone Plaza",
      color: 0x9ba79b,
      accentColor: 0xbbc7bb,
      textureNoise: { scale: 2, amplitude: 0.05 },
      isWater: false,
      isBridge: false,
      roughness: 0.6,
      category: "plaza",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("plaza");
      expect(result.data.isWater).toBe(false);
      expect(result.data.roughness).toBe(0.6);
      expect(result.data.textureNoise?.scale).toBe(2);
    }
  });

  it("applies defaults for omitted optional fields", () => {
    const result = materialDefSchema.safeParse({
      id: "grass",
      name: "Grass",
      color: 0x4f8f3a,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isWater).toBe(false);
      expect(result.data.isBridge).toBe(false);
      expect(result.data.roughness).toBe(0.8);
      expect(result.data.category).toBe("misc");
    }
  });

  it("rejects an invalid category", () => {
    const result = materialDefSchema.safeParse({
      id: "bad",
      name: "Bad",
      color: 0,
      category: "lava",
    });
    expect(result.success).toBe(false);
  });

  it("rejects roughness outside 0..1", () => {
    const result = materialDefSchema.safeParse({
      id: "bad",
      name: "Bad",
      color: 0,
      roughness: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("parses a water material with isWater=true", () => {
    const result = materialDefSchema.safeParse({
      id: "water",
      name: "Water",
      color: 0x2b4b2c,
      isWater: true,
      category: "water",
      roughness: 0.1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isWater).toBe(true);
    }
  });
});

describe("E42-S01 — starter-materials.json content", () => {
  it("every material in the file parses and has required colors", async () => {
    const raw = await readFile(resolve(CONTENT_DIR, "materials/starter-materials.json"), "utf-8");
    const defs = JSON.parse(raw) as unknown[];
    expect(defs.length).toBeGreaterThan(0);
    for (const def of defs) {
      const result = materialDefSchema.safeParse(def);
      expect(result.success, `material ${(def as { id: string }).id} should parse`).toBe(true);
      if (result.success) {
        expect(result.data.color).toBeDefined();
        expect(result.data.category).toBeDefined();
      }
    }
  });

  it("includes all underlayIds referenced by the map generator", async () => {
    const raw = await readFile(resolve(CONTENT_DIR, "materials/starter-materials.json"), "utf-8");
    const defs = JSON.parse(raw) as Array<{ id: string }>;
    const ids = new Set(defs.map((d) => d.id));
    const required = [
      "grass",
      "bellstone_plaza",
      "wood_floor",
      "soot_cobble",
      "chalk_flagstone",
      "patch_grass",
      "stone_floor",
      "river_mud",
      "oldroad_slabs",
      "grave_soil",
      "dark_cellar_floor",
      "quarry_grit",
      "packed_road",
      "water",
    ];
    for (const id of required) {
      expect(ids.has(id), `material "${id}" must be defined`).toBe(true);
    }
  });
});

describe("E42-S01 — map material cross-reference validation", () => {
  it("every underlayId/overlayId in content/maps/*.json is defined in the material registry", async () => {
    const matRaw = await readFile(
      resolve(CONTENT_DIR, "materials/starter-materials.json"),
      "utf-8",
    );
    const materials = JSON.parse(matRaw) as Array<{ id: string }>;
    const materialIds = new Set(materials.map((m) => m.id));

    const mapFiles = [
      "maps/old-town-0-0-0.json",
      "maps/old-town-0-1-0.json",
      "maps/old-town-1-0-0.json",
      "maps/old-town-1-1-0.json",
    ];
    for (const mapFile of mapFiles) {
      const raw = await readFile(resolve(CONTENT_DIR, mapFile), "utf-8");
      const map = JSON.parse(raw) as {
        tiles: {
          default: { underlayId: string };
          overrides: Array<{ underlayId?: string; overlayId?: string }>;
        };
      };
      expect(materialIds.has(map.tiles.default.underlayId), `${mapFile} default.underlayId`).toBe(
        true,
      );
      for (const override of map.tiles.overrides) {
        if (override.underlayId !== undefined) {
          expect(
            materialIds.has(override.underlayId),
            `${mapFile} override.underlayId=${override.underlayId}`,
          ).toBe(true);
        }
        if (override.overlayId !== undefined) {
          expect(
            materialIds.has(override.overlayId),
            `${mapFile} override.overlayId=${override.overlayId}`,
          ).toBe(true);
        }
      }
    }
  });

  it("validator fails on a map with a bogus material ID", () => {
    const result = validateContent([
      file("material", "materials/ground.json", [{ id: "grass", name: "Grass", color: 0x4f8f3a }]),
      file("regionMap", "maps/bad.json", [
        {
          region: { rx: 0, ry: 0, plane: 0 },
          tiles: {
            default: { height: 0, underlayId: "nonexistent_material", collision: 0 },
            overrides: [],
          },
        },
      ]),
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("nonexistent_material"))).toBe(true);
  });

  it("validator passes when all map materials are defined", () => {
    const result = validateContent([
      file("material", "materials/ground.json", [
        { id: "grass", name: "Grass", color: 0x4f8f3a },
        { id: "bellstone_plaza", name: "Bellstone Plaza", color: 0x9ba79b },
      ]),
      file("regionMap", "maps/good.json", [
        {
          region: { rx: 0, ry: 0, plane: 0 },
          tiles: {
            default: { height: 0, underlayId: "grass", collision: 0 },
            overrides: [{ x: 0, y: 0, underlayId: "bellstone_plaza" }],
          },
        },
      ]),
    ]);
    expect(result.ok).toBe(true);
  });
});
