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
    const pos = { entityId: id, x: 10, y: 20, plane: 0 };
    world.stores.position.set(id, pos);
    expect(world.stores.position.get(id)).toBe(pos);
  });

  it("removes all components on destroy", () => {
    const world = createWorld();
    const id = world.createEntity();
    world.stores.position.set(id, { entityId: id, x: 0, y: 0, plane: 0 });
    world.stores.actor.set(id, { entityId: id, name: "Test", level: 1, appearanceId: "test" });
    world.destroyEntity(id);
    expect(world.stores.position.has(id)).toBe(false);
    expect(world.stores.actor.has(id)).toBe(false);
  });

  it("queryAlive excludes destroyed entities", () => {
    const world = createWorld();
    const a = world.createEntity();
    const b = world.createEntity();
    world.stores.position.set(a, { entityId: a, x: 0, y: 0, plane: 0 });
    world.stores.position.set(b, { entityId: b, x: 1, y: 1, plane: 0 });
    world.destroyEntity(a);
    const alive = world.queryAlive(world.stores.position);
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
    world.stores.position.set(id, { entityId: id, x: 5, y: 5, plane: 0 });
    expect(world.stores.position.get(stored)?.x).toBe(5);
  });
});
