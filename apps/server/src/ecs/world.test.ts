import type { Plane } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "./world";

describe("ECS World", () => {
  it("allocates entity ids monotonically", () => {
    const world = createWorld();
    const a = world.createEntity();
    const b = world.createEntity();
    expect(a).toBe(0);
    expect(b).toBe(1);
  });

  it("recycles released ids", () => {
    const world = createWorld();
    const a = world.createEntity();
    const b = world.createEntity();
    expect(b).toBe(1);
    world.destroyEntity(a);
    const c = world.createEntity();
    expect(c).toBe(a); // recycled
    const d = world.createEntity();
    expect(d).toBe(2); // new after recycle
  });

  it("tracks alive entities", () => {
    const world = createWorld();
    const id = world.createEntity();
    expect(world.isAlive(id)).toBe(true);
    world.destroyEntity(id);
    expect(world.isAlive(id)).toBe(false);
  });

  it("stores and retrieves components", () => {
    const world = createWorld();
    const id = world.createEntity();
    const pos = { entityId: id, x: 10, y: 20, plane: 0 as Plane };
    world.setComponent(id, "position", pos);
    expect(world.getComponent(id, "position")).toBe(pos);
  });

  it("removes all components on destroy", () => {
    const world = createWorld();
    const id = world.createEntity();
    world.setComponent(id, "position", { entityId: id, x: 0, y: 0, plane: 0 as Plane });
    world.setComponent(id, "actor", { entityId: id, name: "Test", level: 1, appearanceId: "test" });
    world.destroyEntity(id);
    expect(world.hasComponent(id, "position")).toBe(false);
    expect(world.hasComponent(id, "actor")).toBe(false);
  });

  it("componentEntries excludes destroyed entities", () => {
    const world = createWorld();
    const a = world.createEntity();
    const b = world.createEntity();
    world.setComponent(a, "position", { entityId: a, x: 0, y: 0, plane: 0 as Plane });
    world.setComponent(b, "position", { entityId: b, x: 1, y: 1, plane: 0 as Plane });
    world.destroyEntity(a);
    const alive = world.componentEntries("position").map(([, c]) => c);
    expect(alive).toHaveLength(1);
    expect(alive[0]?.entityId).toBe(b);
  });

  it("throws on destroying non-existent entity", () => {
    const world = createWorld();
    const id = world.createEntity();
    world.destroyEntity(id);
    expect(() => world.destroyEntity(id)).toThrow();
  });

  it("entity ids remain stable while alive", () => {
    const world = createWorld();
    const id = world.createEntity();
    const stored = id;
    world.setComponent(id, "position", { entityId: id, x: 5, y: 5, plane: 0 as Plane });
    expect(world.getComponent(stored, "position")?.x).toBe(5);
  });

  it("setComponent rejects dead entities", () => {
    const world = createWorld();
    const id = world.createEntity();
    world.destroyEntity(id);
    expect(() =>
      world.setComponent(id, "position", { entityId: id, x: 0, y: 0, plane: 0 as Plane }),
    ).toThrow("Cannot set component on dead entity");
  });

  it("setComponent rejects component.entityId mismatch", () => {
    const world = createWorld();
    const id = world.createEntity();
    const wrongId = world.createEntity();
    expect(() =>
      world.setComponent(id, "position", { entityId: wrongId, x: 0, y: 0, plane: 0 as Plane }),
    ).toThrow("Component entityId mismatch");
  });

  it("aliveEntityIds returns ascending IDs", () => {
    const world = createWorld();
    const a = world.createEntity();
    const b = world.createEntity();
    const c = world.createEntity();
    world.destroyEntity(b);
    const ids = world.aliveEntityIds();
    expect(ids).toEqual([a, c]);
    expect(ids[0] as number).toBeLessThan(ids[1] as number);
  });

  it("entityIdsWith returns ascending IDs", () => {
    const world = createWorld();
    const a = world.createEntity();
    const _b = world.createEntity();
    const c = world.createEntity();
    world.setComponent(c, "position", { entityId: c, x: 0, y: 0, plane: 0 as Plane });
    world.setComponent(a, "position", { entityId: a, x: 1, y: 1, plane: 0 as Plane });
    const ids = world.entityIdsWith("position");
    expect(ids).toEqual([a, c]);
    expect(ids[0] as number).toBeLessThan(ids[1] as number);
  });

  it("componentEntries returns ascending entries", () => {
    const world = createWorld();
    const a = world.createEntity();
    const b = world.createEntity();
    const c = world.createEntity();
    world.setComponent(c, "position", { entityId: c, x: 10, y: 10, plane: 0 as Plane });
    world.setComponent(a, "position", { entityId: a, x: 5, y: 5, plane: 0 as Plane });
    world.setComponent(b, "position", { entityId: b, x: 7, y: 7, plane: 0 as Plane });
    const entries = world.componentEntries("position");
    expect(entries.map(([id]) => id)).toEqual([a, b, c]);
  });

  it("componentCount returns the number of components for a kind", () => {
    const world = createWorld();
    const a = world.createEntity();
    const b = world.createEntity();
    world.setComponent(a, "position", { entityId: a, x: 0, y: 0, plane: 0 as Plane });
    world.setComponent(b, "position", { entityId: b, x: 1, y: 1, plane: 0 as Plane });
    expect(world.componentCount("position")).toBe(2);
    expect(world.componentCount("actor")).toBe(0);
  });

  it("hasComponent returns true only when component exists", () => {
    const world = createWorld();
    const id = world.createEntity();
    expect(world.hasComponent(id, "position")).toBe(false);
    world.setComponent(id, "position", { entityId: id, x: 0, y: 0, plane: 0 as Plane });
    expect(world.hasComponent(id, "position")).toBe(true);
  });

  it("removeComponent deletes the component and returns true", () => {
    const world = createWorld();
    const id = world.createEntity();
    world.setComponent(id, "position", { entityId: id, x: 0, y: 0, plane: 0 as Plane });
    expect(world.removeComponent(id, "position")).toBe(true);
    expect(world.hasComponent(id, "position")).toBe(false);
    expect(world.removeComponent(id, "position")).toBe(false);
  });

  it("aliveEntityCount matches aliveEntityIds length", () => {
    const world = createWorld();
    const _a = world.createEntity();
    const b = world.createEntity();
    const _c = world.createEntity();
    expect(world.aliveEntityCount()).toBe(3);
    world.destroyEntity(b);
    expect(world.aliveEntityCount()).toBe(2);
    expect(world.aliveEntityCount()).toBe(world.aliveEntityIds().length);
  });
});
