import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { type TierLadder, tierLadderSchema, tierPaletteSchema } from "../content-schemas/asset";

const PALETTES_DIR = resolve(process.cwd(), "assets/items/palettes");

/** Required region names per ladder (E41-S01 silhouette region contract). */
const REQUIRED_REGIONS: Record<TierLadder, readonly string[]> = {
  melee: ["blade", "grip", "accent"],
  ranged: ["limb", "string", "grip"],
  magic: ["cloth", "script", "seal"],
  "ranged-armour": ["hide", "stitch", "buckle"],
  accessory: ["cloth", "metal", "seal"],
};

const LADDERS = Object.keys(REQUIRED_REGIONS) as TierLadder[];

describe("tier palette files", () => {
  it("all 5 ladders × 13 tiers = 65 palette files exist", () => {
    let count = 0;
    for (const ladder of LADDERS) {
      const dir = join(PALETTES_DIR, ladder);
      const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
      count += files.length;
    }
    expect(count).toBe(65);
  });

  for (const ladder of LADDERS) {
    describe(`ladder: ${ladder}`, () => {
      it("has exactly 13 tier files that all parse and contain required regions", () => {
        const dir = join(PALETTES_DIR, ladder);
        const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
        expect(files).toHaveLength(13);

        const required = REQUIRED_REGIONS[ladder];
        for (const file of files) {
          const raw = JSON.parse(readFileSync(join(dir, file), "utf8")) as unknown;
          const parsed = tierPaletteSchema.safeParse(raw);
          expect(
            parsed.success,
            `${ladder}/${file}: ${parsed.success ? "" : parsed.error.message}`,
          ).toBe(true);
          if (parsed.success) {
            expect(parsed.data.ladder).toBe(tierLadderSchema.parse(ladder));
            expect(parsed.data.tierOrder).toBeGreaterThanOrEqual(0);
            expect(parsed.data.tierOrder).toBeLessThanOrEqual(12);
            const regionNames = Object.keys(parsed.data.regions);
            for (const req of required) {
              expect(regionNames, `${ladder}/${file} missing region ${req}`).toContain(req);
            }
            // Every region value is a hex colour string
            for (const [region, value] of Object.entries(parsed.data.regions)) {
              expect(value, `${ladder}/${file} region ${region}`).toMatch(/^#[0-9a-f]{6}$/i);
            }
          }
        }
      });
    });
  }
});
