import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { objectDefSchema } from "@old-town/shared/content-schemas/object";
import { describe, expect, it } from "vitest";

interface ObjectFile {
  id: string;
  isDoor?: boolean;
  isGate?: boolean;
  options: Array<{ label: string; actionId: string }>;
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
  width: number;
  length: number;
  footprint?: Array<{ dx: number; dy: number }>;
  defaultCollision?: number;
  roofCoverage?: { width: number; length: number };
}

async function loadObjects(file: string): Promise<ObjectFile[]> {
  const path = join(import.meta.dirname, "..", "..", "..", "..", "content", "objects", file);
  return JSON.parse(await readFile(path, "utf-8")) as ObjectFile[];
}

async function loadAllObjects(): Promise<ObjectFile[]> {
  const [buildings, doors, starter] = await Promise.all([
    loadObjects("buildings.json"),
    loadObjects("doors.json"),
    loadObjects("starter-objects.json"),
  ]);
  return [...buildings, ...doors, ...starter];
}

describe("E43-S01 — Building object definitions", () => {
  it("every building object validates against objectDefSchema", async () => {
    const buildings = await loadObjects("buildings.json");
    for (const obj of buildings) {
      expect(() => objectDefSchema.parse(obj)).not.toThrow();
    }
  });

  it("every door object validates against objectDefSchema", async () => {
    const doors = await loadObjects("doors.json");
    for (const obj of doors) {
      expect(() => objectDefSchema.parse(obj)).not.toThrow();
    }
  });

  it("every building object has a valid footprint and collision mask", async () => {
    const buildings = await loadObjects("buildings.json");
    for (const obj of buildings) {
      expect(obj.width).toBeGreaterThanOrEqual(1);
      expect(obj.length).toBeGreaterThanOrEqual(1);
      // Walls must block movement; roofs must not.
      if (obj.id.includes("wall")) {
        expect(obj.blocksMovement).toBe(true);
      }
      if (obj.id.includes("roof")) {
        expect(obj.blocksMovement).toBe(false);
        expect(obj.roofCoverage).toBeDefined();
      }
    }
  });

  it("door objects have Open and Close options", async () => {
    const doors = await loadObjects("doors.json");
    for (const obj of doors) {
      expect(obj.isDoor).toBe(true);
      const openOption = obj.options.find((o) => o.label === "Open");
      expect(openOption).toBeDefined();
      expect(openOption!.actionId).toBe("open");
    }
  });

  it("gate objects are marked isGate and have width >= 2", async () => {
    const doors = await loadObjects("doors.json");
    const gates = doors.filter((d) => d.isGate === true);
    expect(gates.length).toBeGreaterThan(0);
    for (const gate of gates) {
      expect(gate.width).toBeGreaterThanOrEqual(2);
    }
  });

  it("no object ID conflicts with existing objects", async () => {
    const all = await loadAllObjects();
    const ids = all.map((o) => o.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it("building object IDs use the building_ namespace", async () => {
    const buildings = await loadObjects("buildings.json");
    for (const obj of buildings) {
      expect(obj.id.startsWith("building_")).toBe(true);
    }
  });

  it("door object IDs use the building_ namespace", async () => {
    const doors = await loadObjects("doors.json");
    for (const obj of doors) {
      expect(obj.id.startsWith("building_")).toBe(true);
    }
  });
});
