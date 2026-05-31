import type { TileCoord } from "@old-town/shared";
import { Scene, Vector3 } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { DebugLayer } from "./DebugLayer";

const TILE: TileCoord = { x: 5, y: 5, plane: 0 };

describe("DebugLayer", () => {
  let scene: Scene;
  let layer: DebugLayer;

  beforeEach(() => {
    scene = new Scene();
    layer = new DebugLayer({ scene });
  });

  it("starts hidden", () => {
    expect(layer.visible).toBe(false);
  });

  it("can be toggled visible", () => {
    layer.toggle();
    expect(layer.visible).toBe(true);
  });

  it("marks a true tile", () => {
    layer.markTrueTile(TILE, 1);
    expect(scene.children.length).toBe(1); // Group added
  });

  it("marks a path tile", () => {
    layer.markPathTile(TILE);
    expect(scene.children.length).toBe(1);
  });

  it("marks a collision tile", () => {
    layer.markCollisionTile(TILE);
    expect(scene.children.length).toBe(1);
  });

  it("marks a footprint", () => {
    layer.markFootprint(TILE);
    expect(scene.children.length).toBe(1);
  });

  it("clears all debug tiles", () => {
    layer.markTrueTile(TILE, 1);
    layer.markPathTile(TILE);
    layer.clear();
    expect(scene.children.length).toBe(1); // Group remains
  });

  it("draws a line", () => {
    const start = new Vector3(0, 0, 0);
    const end = new Vector3(5, 0, 5);
    const line = layer.drawLine(start, end);
    expect(line).toBeDefined();
    expect(scene.children.length).toBe(1);
  });

  it("marks reach tiles", () => {
    layer.markReachTiles(TILE, 1);
    expect(scene.children.length).toBe(1);
  });

  it("marks a line-of-sight ray", () => {
    const start = new Vector3(0, 0.5, 0);
    const end = new Vector3(5, 0.5, 5);
    layer.markLoSRay(start, end);
    expect(scene.children.length).toBe(1);
  });

  it("toggles individual primitive visibility", () => {
    layer.setShowPrimitive("collision", true);
    expect(layer.getShowPrimitive("collision")).toBe(true);
    layer.setShowPrimitive("collision", false);
    expect(layer.getShowPrimitive("collision")).toBe(false);
  });

  it("stores action queue state", () => {
    layer.setActionQueue(["move", "attack"]);
    expect(layer.getShowPrimitive("actionQueue")).toBe(false);
  });

  it("stores combat cooldown", () => {
    layer.setCombatCooldown(5);
    expect(layer.getShowPrimitive("combatCooldown")).toBe(false);
  });

  it("stores pending hits", () => {
    const hits = new Map<string, number>();
    hits.set("npc_1", 10);
    layer.setPendingHits(hits);
    expect(layer.getShowPrimitive("combatCooldown")).toBe(false);
  });

  it("stores npc leash", () => {
    layer.setNpcLeash(TILE);
    expect(layer.getShowPrimitive("npcLeash")).toBe(false);
  });

  it("stores varbits", () => {
    const vars = new Map<string, number>();
    vars.set("quest.stage", 3);
    layer.setVarbits(vars);
    expect(layer.getShowPrimitive("varbits")).toBe(false);
  });

  it("disposes all resources", () => {
    layer.markTrueTile(TILE, 1);
    layer.markPathTile(TILE);
    layer.dispose();
    expect(scene.children.length).toBe(0);
  });
});
