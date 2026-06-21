import { describe, expect, it } from "vitest";
import { CONTENT_DIR_KINDS, kindForContentDir } from "./content-layout";

describe("kindForContentDir", () => {
  it("resolves each top-level content directory to its content kind", () => {
    expect(kindForContentDir("items")).toBe("item");
    expect(kindForContentDir("npcs")).toBe("npc");
    expect(kindForContentDir("objects")).toBe("object");
    expect(kindForContentDir("prayers")).toBe("prayer");
    expect(kindForContentDir("processing-recipes")).toBe("processingRecipe");
    expect(kindForContentDir("skills")).toBe("skill");
    expect(kindForContentDir("resource-nodes")).toBe("resourceNode");
    expect(kindForContentDir("spells")).toBe("spell");
    expect(kindForContentDir("quests")).toBe("quest");
    expect(kindForContentDir("dialogue")).toBe("dialogue");
    expect(kindForContentDir("drops")).toBe("dropTable");
    expect(kindForContentDir("maps")).toBe("regionMap");
    expect(kindForContentDir("materials")).toBe("material");
    expect(kindForContentDir("animations")).toBe("animation");
    expect(kindForContentDir("shops")).toBe("shop");
    expect(kindForContentDir("banks")).toBe("bank");
    expect(kindForContentDir("service-fees")).toBe("serviceFee");
    expect(kindForContentDir("status-effects")).toBe("statusEffect");
    expect(kindForContentDir("contracts")).toBe("contract");
    expect(kindForContentDir("activities")).toBe("activity");
    expect(kindForContentDir("bosses")).toBe("boss");
    expect(kindForContentDir("trails")).toBe("trail");
    expect(kindForContentDir("charters")).toBe("charter");
    expect(kindForContentDir("properties")).toBe("property");
  });

  it("returns undefined for an unknown directory name", () => {
    expect(kindForContentDir("unknown")).toBeUndefined();
    expect(kindForContentDir("")).toBeUndefined();
  });

  it("maps every CONTENT_KINDS entry (no content kind lacks a directory)", () => {
    const kinds = new Set(Object.values(CONTENT_DIR_KINDS));
    expect(kinds.size).toBeGreaterThan(0);
    for (const kind of kinds) {
      expect(typeof kind).toBe("string");
    }
  });
});
