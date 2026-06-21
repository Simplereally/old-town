import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { loadContentDir } from "./loader";

let tmpDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tmpDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tmpDirs = [];
});

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "old-town-loader-"));
  tmpDirs.push(dir);
  return dir;
}

async function writeJson(root: string, relPath: string, value: unknown): Promise<void> {
  const path = join(root, relPath);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(root: string, relPath: string, text: string): Promise<void> {
  const path = join(root, relPath);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, text, "utf8");
}

describe("loadContentDir", () => {
  it("returns empty files and no issues for an empty directory", async () => {
    const dir = await tempDir();
    const result = await loadContentDir(dir);
    expect(result.files).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  it("returns empty files and no issues when the directory does not exist", async () => {
    const result = await loadContentDir(join(tmpdir(), "old-town-loader-nonexistent-xyz"));
    expect(result.files).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  it("loads and tags JSON files under known content directories", async () => {
    const dir = await tempDir();
    await writeJson(dir, "items/resources.json", [{ id: "oak_log" }]);
    await writeJson(dir, "npcs/town.json", [{ id: "goblin" }]);
    const result = await loadContentDir(dir);
    expect(result.issues).toEqual([]);
    expect(result.files).toHaveLength(2);
    const paths = result.files.map((f) => f.path).sort();
    expect(paths).toEqual(["items/resources.json", "npcs/town.json"]);
    const itemFile = result.files.find((f) => f.path === "items/resources.json");
    expect(itemFile?.kind).toBe("item");
    const npcFile = result.files.find((f) => f.path === "npcs/town.json");
    expect(npcFile?.kind).toBe("npc");
  });

  it("walks nested subdirectories", async () => {
    const dir = await tempDir();
    await writeJson(dir, "items/sub/dir/deep.json", [{ id: "deep" }]);
    const result = await loadContentDir(dir);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]?.path).toBe("items/sub/dir/deep.json");
    expect(result.files[0]?.kind).toBe("item");
  });

  it("ignores non-JSON files", async () => {
    const dir = await tempDir();
    await writeText(dir, "items/readme.md", "# Items");
    await writeText(dir, "items/data.txt", "not json");
    const result = await loadContentDir(dir);
    expect(result.files).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  it("reports an issue for files under an unknown top-level directory", async () => {
    const dir = await tempDir();
    await writeJson(dir, "unknown/stuff.json", [{ id: "x" }]);
    const result = await loadContentDir(dir);
    expect(result.files).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.path).toBe("unknown/stuff.json");
    expect(result.issues[0]?.message).toContain("unknown");
  });

  it("reports an issue for invalid JSON", async () => {
    const dir = await tempDir();
    await writeText(dir, "items/bad.json", "{ not valid json");
    const result = await loadContentDir(dir);
    expect(result.files).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.path).toBe("items/bad.json");
    expect(result.issues[0]?.message).toContain("invalid JSON");
  });

  it("parses the JSON data payload of a loaded file", async () => {
    const dir = await tempDir();
    const payload = [{ id: "oak_log", name: "Oak Log" }];
    await writeJson(dir, "items/resources.json", payload);
    const result = await loadContentDir(dir);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]?.data).toEqual(payload);
  });
});
