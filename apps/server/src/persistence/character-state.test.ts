import { CHARACTER_SNAPSHOT_VERSION, type CharacterSnapshot, type ItemDef } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { createInventory } from "../items/inventory";
import { makeRegistries } from "../test-support/registries";
import { applyCharacterSnapshot, snapshotCharacter } from "./character-state";

function defItem(over: Partial<ItemDef> & { id: string }): ItemDef {
  return {
    id: over.id,
    name: over.name ?? over.id,
    stackable: over.stackable ?? false,
    tradeable: over.tradeable ?? true,
    examine: over.examine ?? "An item.",
    icon: over.icon ?? `icon_${over.id}`,
    value: over.value ?? 1,
    options: over.options ?? [],
    tags: over.tags ?? [],
    ...(over.equipment ? { equipment: over.equipment } : {}),
  };
}

const PENNY_BLADE = defItem({
  id: "pennywrought_shortblade",
  name: "Pennywrought Shortblade",
  equipment: { slot: "weapon", bonuses: { slashAttack: 5 }, requirements: [] },
});

function baseSnapshot(overrides: Partial<CharacterSnapshot> = {}): CharacterSnapshot {
  return {
    version: CHARACTER_SNAPSHOT_VERSION,
    characterId: "dev-a",
    savedAt: 1_700_000_000,
    position: { x: 30, y: 32, plane: 0 },
    hitpoints: { health: 10, maxHealth: 10 },
    skills: { cooking: { level: 2, xp: 90, boost: 0, drain: 0 } },
    inventory: {
      containerId: "inventory:dev-a",
      capacity: 28,
      nextUid: 3,
      slots: [{ slot: 0, itemId: "bread", quantity: 5, uid: 2 }],
    },
    equipment: { slots: { weapon: "pennywrought_shortblade" } },
    vars: { "quest.points": 1 },
    bank: { capacity: 400, nextUid: 4, slots: [{ slot: 1, itemId: "coin", quantity: 50, uid: 3 }] },
    ...overrides,
  };
}

function setupPlayer(snapshot?: CharacterSnapshot, itemMap?: Map<string, ItemDef>) {
  const world = createWorld();
  const registries = makeRegistries(itemMap ? { item: itemMap } : {});
  const entityId = world.createEntity();
  if (snapshot) {
    applyCharacterSnapshot({ world, registries }, entityId, snapshot);
  }
  return { world, registries, entityId };
}

describe("snapshotCharacter / applyCharacterSnapshot", () => {
  it("round-trips a fully-populated character through snapshot and apply", () => {
    const original = baseSnapshot();
    const { world, registries, entityId } = setupPlayer(original);
    // applyCharacterSnapshot only updates an existing combatant; create one so hitpoints round-trip.
    world.setComponent(entityId, "combatant", {
      entityId,
      health: 1,
      maxHealth: 1,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 1,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: 3,
      eatBlockedUntilTick: 0,
    });
    applyCharacterSnapshot({ world, registries }, entityId, original);

    const reSnapshotted = snapshotCharacter(
      { world, registries },
      entityId,
      "dev-a",
      1_700_000_600,
    );
    expect(reSnapshotted).toMatchObject({
      characterId: "dev-a",
      savedAt: 1_700_000_600,
      position: { x: 30, y: 32, plane: 0 },
      hitpoints: { health: 10, maxHealth: 10 },
      skills: { cooking: { level: 2, xp: 90, boost: 0, drain: 0 } },
      vars: { "quest.points": 1 },
    });
    expect(reSnapshotted.inventory.slots).toContainEqual({
      slot: 0,
      itemId: "bread",
      quantity: 5,
      uid: 2,
    });
    expect(reSnapshotted.bank.slots).toContainEqual({
      slot: 1,
      itemId: "coin",
      quantity: 50,
      uid: 3,
    });
    expect(reSnapshotted.equipment.slots.weapon).toBe("pennywrought_shortblade");
  });

  it("snapshots default position and hitpoints when components are missing", () => {
    const world = createWorld();
    const registries = makeRegistries();
    const entityId = world.createEntity();
    // No position, combatant, inventory, equipment, skills, vars, bank — all default.

    const snapshot = snapshotCharacter({ world, registries }, entityId, "dev-b", 100);
    expect(snapshot.position).toEqual({ x: 0, y: 0, plane: 0 });
    expect(snapshot.hitpoints).toEqual({ health: 1, maxHealth: 1 });
    expect(snapshot.inventory).toMatchObject({ capacity: 28, nextUid: 1, slots: [] });
    expect(snapshot.bank).toMatchObject({ capacity: 400, nextUid: 1, slots: [] });
    expect(snapshot.equipment).toEqual({ slots: {} });
    expect(snapshot.vars).toEqual({});
    expect(snapshot.skills).toEqual({});
  });

  it("clamps negative health to zero during snapshot but keeps maxHealth >= 1", () => {
    const world = createWorld();
    const registries = makeRegistries();
    const entityId = world.createEntity();
    world.setComponent(entityId, "combatant", {
      entityId,
      health: -5,
      maxHealth: 0,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 1,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: 3,
      eatBlockedUntilTick: 0,
    });

    const snapshot = snapshotCharacter({ world, registries }, entityId, "dev-c", 0);
    expect(snapshot.hitpoints).toEqual({ health: 0, maxHealth: 1 });
  });

  it("preserves combatStyle on the snapshot when the combatant carries one", () => {
    const world = createWorld();
    const registries = makeRegistries();
    const entityId = world.createEntity();
    world.setComponent(entityId, "combatant", {
      entityId,
      health: 10,
      maxHealth: 10,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 1,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: 3,
      eatBlockedUntilTick: 0,
      combatStyle: "slash",
    });

    const snapshot = snapshotCharacter({ world, registries }, entityId, "dev-d", 0);
    expect(snapshot.combatStyle).toBe("slash");
  });

  it("restores bank slots with their stored uid on apply", () => {
    const snapshot = baseSnapshot({
      bank: {
        capacity: 400,
        nextUid: 5,
        slots: [{ slot: 0, itemId: "coin", quantity: 1, uid: 4 }],
      },
    });
    const { world, entityId } = setupPlayer(snapshot);

    const bank = world.getComponent(entityId, "bank");
    expect(bank?.slots[0]).toMatchObject({ itemId: "coin", quantity: 1, uid: 4 });
    expect(bank?.nextUid).toBe(5);
  });

  it("recomputes equipment bonuses from the item registry on apply", () => {
    const items = new Map([[PENNY_BLADE.id, PENNY_BLADE]]);
    const { world, entityId } = setupPlayer(baseSnapshot(), items);

    const equipment = world.getComponent(entityId, "equipment");
    expect(equipment?.bonuses.slashAttack).toBe(5);
  });

  it("merges snapshot skills into existing skills without losing unrelated entries", () => {
    const world = createWorld();
    const registries = makeRegistries();
    const entityId = world.createEntity();
    world.setComponent(entityId, "skills", {
      entityId,
      skills: { mining: { level: 5, xp: 100, boost: 0, drain: 0 } },
    });

    applyCharacterSnapshot({ world, registries }, entityId, baseSnapshot());

    const skills = world.getComponent(entityId, "skills");
    // mining survived, cooking was applied from the snapshot
    expect(skills?.skills.mining).toEqual({ level: 5, xp: 100, boost: 0, drain: 0 });
    expect(skills?.skills.cooking).toEqual({ level: 2, xp: 90, boost: 0, drain: 0 });
  });

  it("updates an existing combatant's health and dead flag on apply", () => {
    const world = createWorld();
    const registries = makeRegistries();
    const entityId = world.createEntity();
    world.setComponent(entityId, "combatant", {
      entityId,
      health: 10,
      maxHealth: 10,
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 1,
      targetId: undefined,
      attackCooldown: 0,
      combatLevel: 3,
      eatBlockedUntilTick: 0,
    });

    applyCharacterSnapshot(
      { world, registries },
      entityId,
      baseSnapshot({ hitpoints: { health: 0, maxHealth: 10 } }),
    );
    const combatant = world.getComponent(entityId, "combatant");
    expect(combatant?.health).toBe(0);
    expect(combatant?.maxHealth).toBe(10);
    expect(combatant?.dead).toBe(true);
  });

  it("snapshots inventory nextUid as the max of current nextUid and highest slot uid + 1", () => {
    const world = createWorld();
    const registries = makeRegistries();
    const entityId = world.createEntity();
    const inventory = createInventory(entityId, `inventory:${entityId}`, 28);
    inventory.nextUid = 2; // deliberately lower than the slot uid
    inventory.slots[0] = { itemId: "coin", quantity: 1, uid: 99 };
    world.setComponent(entityId, "inventory", inventory);

    const snapshot = snapshotCharacter({ world, registries }, entityId, "dev-e", 0);
    expect(snapshot.inventory.nextUid).toBe(100);
  });
});
