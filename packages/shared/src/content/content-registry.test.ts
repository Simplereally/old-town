import { describe, expect, it } from "vitest";
import { type LoadedContentFile, validateContent } from "./content-registry";

function file(kind: LoadedContentFile["kind"], path: string, data: unknown): LoadedContentFile {
  return { kind, path, data };
}

const grass = { id: "grass", name: "Grass", color: 0x4f8f3a };
const oakLog = {
  id: "oak_log",
  name: "Oak Log",
  stackable: false,
  tradeable: true,
  examine: "A log.",
  icon: "icon_oak_log",
  value: 10,
};
const woodcutting = { id: "woodcutting", name: "Woodcutting", xpTableId: "oldtown_default" };

describe("validateContent — happy path", () => {
  it("builds registries and reports ok for consistent content", () => {
    const result = validateContent([
      file("material", "materials/ground.json", [grass]),
      file("item", "items/resources.json", [oakLog]),
      file("skill", "skills/woodcutting.json", [woodcutting]),
      file("resourceNode", "resource-nodes/trees.json", [
        {
          id: "oak_tree_node",
          name: "Oak Tree",
          skill: "woodcutting",
          requiredLevel: 15,
          baseXp: 37.5,
          actionTicks: 4,
          depletionChance: 0.125,
          respawnTicks: 30,
          toolTags: ["axe"],
          outputItemId: "oak_log",
        },
      ]),
    ]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.registries.item.has("oak_log")).toBe(true);
    expect(result.registries.resourceNode.has("oak_tree_node")).toBe(true);
  });
});

describe("validateContent — cross references", () => {
  it("flags a resource node referencing a missing output item, with path + id", () => {
    const result = validateContent([
      file("skill", "skills/woodcutting.json", [woodcutting]),
      file("resourceNode", "resource-nodes/trees.json", [
        {
          id: "oak_tree_node",
          name: "Oak Tree",
          skill: "woodcutting",
          requiredLevel: 1,
          baseXp: 1,
          actionTicks: 4,
          depletionChance: 0.1,
          respawnTicks: 30,
          toolTags: ["axe"],
          outputItemId: "missing_log",
        },
      ]),
    ]);
    expect(result.ok).toBe(false);
    const issue = result.issues.find((i) => i.message.includes("missing_log"));
    expect(issue?.path).toBe("resource-nodes/trees.json");
    expect(issue?.id).toBe("oak_tree_node");
  });

  it("flags an NPC referencing a missing drop table", () => {
    const result = validateContent([
      file("npc", "npcs/goblins.json", [
        { id: "cave_goblin", name: "Cave Goblin", size: 1, respawnTicks: 30, drops: "ghost_table" },
      ]),
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("ghost_table"))).toBe(true);
  });

  it("flags a dialogue option linking to a missing node", () => {
    const result = validateContent([
      file("dialogue", "dialogue/baker.json", [
        {
          id: "baker_dialogue",
          root: "start",
          nodes: [
            { id: "start", npcText: "Hi", playerOptions: [{ text: "Bye", next: "nowhere" }] },
          ],
        },
      ]),
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("nowhere"))).toBe(true);
  });
});

describe("validateContent — duplicate detection", () => {
  it("flags duplicate ids within a kind, citing both files", () => {
    const result = validateContent([
      file("item", "items/a.json", [oakLog]),
      file("item", "items/b.json", [oakLog]),
    ]);
    expect(result.ok).toBe(false);
    const dup = result.issues.find((i) => i.message.includes("duplicate"));
    expect(dup?.id).toBe("oak_log");
    expect(dup?.path).toBe("items/b.json");
    expect(dup?.message).toContain("items/a.json");
  });
});

describe("validateContent — schema failures", () => {
  it("reports the file path for a malformed definition", () => {
    const result = validateContent([
      file("item", "items/bad.json", [{ id: "no_name_item", stackable: false }]),
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.path).toBe("items/bad.json");
  });

  it("treats an empty content set as valid", () => {
    const result = validateContent([]);
    expect(result.ok).toBe(true);
  });
});

describe("validateContent — region map indexing", () => {
  it("indexes region maps by `rx:ry:plane` and reports ok for a valid map", () => {
    const result = validateContent([
      file("material", "materials/ground.json", [grass]),
      file("regionMap", "maps/seed.json", [
        {
          region: { rx: 0, ry: 0, plane: 0 },
          tiles: { default: { underlayId: "grass" } },
        },
      ]),
    ]);
    expect(result.ok).toBe(true);
    expect(result.registries.regionMap.has("0:0:0")).toBe(true);
  });

  it("reports undefined id for a region map with a malformed region coordinate", () => {
    const result = validateContent([
      file("regionMap", "maps/bad.json", [
        {
          region: { rx: "oops", ry: 0, plane: 0 },
          tiles: { default: { underlayId: "grass" } },
        },
      ]),
    ]);
    expect(result.ok).toBe(false);
    const issue = result.issues.find((i) => i.path === "maps/bad.json");
    expect(issue?.id).toBeUndefined();
  });
});

describe("validateContent — unknown kind", () => {
  it("skips files whose kind has no registered schema map", () => {
    // The registry builder initialises maps for every ContentKind, so an unknown
    // kind hits the `if (!registry) continue` guard. Cast to satisfy the typed
    // LoadedContentFile interface; this mirrors defensive runtime behaviour.
    const result = validateContent([
      file("unknown_kind" as LoadedContentFile["kind"], "x.json", [{ id: "x" }]),
    ]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });
});
