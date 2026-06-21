import type { TileCoord } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { ClientWorldStore, type WorldEntity } from "./ClientWorldStore";

function entity(id: number, overrides: Partial<WorldEntity> = {}): WorldEntity {
  return {
    entityId: id,
    kind: "player",
    tile: { x: 0, y: 0, plane: 0 } satisfies TileCoord,
    previousTile: null,
    moveSpeed: "idle",
    facing: 0,
    appearance: {},
    healthBar: null,
    defId: "player",
    isLocalPlayer: false,
    ...overrides,
  };
}

describe("ClientWorldStore", () => {
  it("starts empty with selfEntityId 0", () => {
    const store = new ClientWorldStore();
    expect(store.selfEntityId).toBe(0);
    expect(store.getAllEntities()).toEqual([]);
    expect(store.getEntity(1)).toBeUndefined();
  });

  it("setSelfEntityId updates the self id getter", () => {
    const store = new ClientWorldStore();
    store.setSelfEntityId(42);
    expect(store.selfEntityId).toBe(42);
  });

  it("setEntity/getEntity round-trips an entity by id", () => {
    const store = new ClientWorldStore();
    const e = entity(7, { kind: "npc", defId: "goblin" });
    store.setEntity(e);
    expect(store.getEntity(7)).toBe(e);
    expect(store.getEntity(99)).toBeUndefined();
  });

  it("setEntity replaces an existing entity with the same id", () => {
    const store = new ClientWorldStore();
    store.setEntity(entity(1, { defId: "a" }));
    store.setEntity(entity(1, { defId: "b" }));
    expect(store.getEntity(1)?.defId).toBe("b");
  });

  it("removeEntity deletes the entity and leaves others intact", () => {
    const store = new ClientWorldStore();
    store.setEntity(entity(1));
    store.setEntity(entity(2));
    store.removeEntity(1);
    expect(store.getEntity(1)).toBeUndefined();
    expect(store.getEntity(2)).toBeDefined();
  });

  it("removeEntity on a missing id is a no-op", () => {
    const store = new ClientWorldStore();
    expect(() => store.removeEntity(999)).not.toThrow();
  });

  it("getAllEntities returns a snapshot of all stored entities", () => {
    const store = new ClientWorldStore();
    store.setEntity(entity(1));
    store.setEntity(entity(2));
    store.setEntity(entity(3));
    const all = store.getAllEntities();
    expect(all).toHaveLength(3);
    expect(all.map((e) => e.entityId).sort()).toEqual([1, 2, 3]);
  });

  it("clear empties entities and resets selfEntityId to 0", () => {
    const store = new ClientWorldStore();
    store.setSelfEntityId(42);
    store.setEntity(entity(1));
    store.setEntity(entity(2));
    store.clear();
    expect(store.getAllEntities()).toEqual([]);
    expect(store.getEntity(1)).toBeUndefined();
    expect(store.selfEntityId).toBe(0);
  });
});
