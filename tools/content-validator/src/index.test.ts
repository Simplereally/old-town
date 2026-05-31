import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { formatIssue, runContentCli } from "./index";

let tmpDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tmpDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tmpDirs = [];
});

describe("content validator CLI output", () => {
  it("renders actionable issue shape with path, pointer, id, dependency, and fix class", () => {
    const lines = formatIssue({
      severity: "error",
      path: "items/bad.json",
      pointer: "/name",
      id: "bad_item",
      dependency: ["item:bad_item"],
      suggestion: "fix_schema",
      message: "Required",
    });

    expect(lines.join("\n")).toContain("path=items/bad.json");
    expect(lines.join("\n")).toContain("pointer=/name");
    expect(lines.join("\n")).toContain("id=bad_item");
    expect(lines.join("\n")).toContain("suggested_fix=fix_schema");
    expect(lines.join("\n")).toContain("dependency: item:bad_item");
  });

  it("reports malformed content with exact file and JSON pointer", async () => {
    const dir = await tempContentDir();
    await writeJson(dir, "items/bad.json", [{ id: "no_name_item", stackable: false }]);

    const result = await runContentCli([dir]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("path=items/bad.json");
    expect(result.stderr).toContain("pointer=/name");
    expect(result.stderr).toContain("id=no_name_item");
    expect(result.stderr).toContain("suggested_fix=fix_schema");
  });

  it("lists registries and prints a textual dependency graph", async () => {
    const dir = await tempContentDir();
    await writeJson(dir, "items/resources.json", [
      {
        id: "oak_log",
        name: "Oak Log",
        stackable: false,
        tradeable: true,
        examine: "A log.",
        icon: "icon_oak_log",
        value: 10,
        options: [],
        tags: [],
      },
    ]);
    await writeJson(dir, "skills/gathering.json", [
      { id: "woodcutting", name: "Woodcutting", xpTableId: "oldtown_default" },
    ]);
    await writeJson(dir, "resource-nodes/trees.json", [
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
        outputItemId: "oak_log",
      },
    ]);

    const list = await runContentCli(["list", dir, "resourceNode"]);
    const graph = await runContentCli(["graph", dir]);

    expect(list.exitCode).toBe(0);
    expect(list.stdout).toContain("resourceNode count=1");
    expect(list.stdout).toContain("oak_tree_node path=resource-nodes/trees.json");
    expect(graph.exitCode).toBe(0);
    expect(graph.stdout).toContain("resourceNode:oak_tree_node -> item:oak_log");
    expect(graph.stdout).toContain("resourceNode:oak_tree_node -> skill:woodcutting");
  });
});

async function tempContentDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "old-town-content-validator-"));
  tmpDirs.push(dir);
  return dir;
}

async function writeJson(root: string, relPath: string, value: unknown): Promise<void> {
  const path = join(root, relPath);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
