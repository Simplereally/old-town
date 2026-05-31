import { describe, expect, it } from "vitest";
import {
  animationId,
  assetId,
  CONTENT_ID_PATTERN,
  dropTableId,
  isContentId,
  itemId,
  MAX_CONTENT_ID_LENGTH,
  materialId,
  npcId,
  objectId,
  questId,
  skillId,
  spellId,
} from "./content-ids";

describe("isContentId", () => {
  it("accepts lowercase snake_case ids", () => {
    for (const id of [
      "a",
      "bronze_hatchet",
      "oak_tree",
      "wind_dart",
      "skill_1",
      "river_rat_drops",
    ]) {
      expect(isContentId(id)).toBe(true);
    }
    expect(CONTENT_ID_PATTERN.test("bronze_hatchet")).toBe(true);
  });

  it("rejects empty, uppercase, spaced, dashed, and bad-leading ids", () => {
    for (const id of [
      "",
      "Bronze",
      "bronze hatchet",
      "bronze-hatchet",
      "1tree",
      "_tree",
      "tree!",
    ]) {
      expect(isContentId(id)).toBe(false);
    }
  });

  it("rejects ids over the length cap", () => {
    expect(isContentId("a".repeat(MAX_CONTENT_ID_LENGTH))).toBe(true);
    expect(isContentId("a".repeat(MAX_CONTENT_ID_LENGTH + 1))).toBe(false);
  });
});

describe("content-id constructors", () => {
  it("brand valid ids as stable strings (not numeric)", () => {
    expect(itemId("bronze_hatchet")).toBe("bronze_hatchet");
    expect(typeof npcId("town_guard")).toBe("string");
    expect(objectId("oak_tree")).toBe("oak_tree");
    expect(skillId("woodcutting")).toBe("woodcutting");
    expect(spellId("wind_dart")).toBe("wind_dart");
    expect(questId("smoke_over_old_town")).toBe("smoke_over_old_town");
    expect(dropTableId("river_rat_drops")).toBe("river_rat_drops");
    expect(animationId("chop_swing")).toBe("chop_swing");
    expect(materialId("cobblestone")).toBe("cobblestone");
    expect(assetId("icon_bronze_hatchet")).toBe("icon_bronze_hatchet");
  });

  it("throw on illegal names", () => {
    expect(() => itemId("Bronze Hatchet")).toThrow();
    expect(() => npcId("")).toThrow();
    expect(() => objectId("oak-tree")).toThrow();
    expect(() => skillId("Woodcutting")).toThrow();
    expect(() => spellId("123")).toThrow();
    expect(() => assetId("")).toThrow();
  });
});
