import {
  CHARACTER_SNAPSHOT_VERSION,
  type CharacterSnapshot,
  type ContentRegistries,
  type EntityId,
  type EquipmentSlotName,
  INVENTORY_SIZE,
  parseCharacterSnapshot,
} from "@old-town/shared";
import type {
  BankComponent,
  EquipmentComponent,
  InventoryComponent,
  InventorySlot,
  SkillsComponent,
} from "../ecs/components";
import type { World } from "../ecs/world";
import { aggregateBonuses, createEquipment } from "../items/equipment";
import { createBank, createInventory } from "../items/inventory";
import { createVarComponent } from "../vars/player-vars";

const DEFAULT_BANK_CAPACITY = 400;

export interface CharacterSnapshotContext {
  readonly world: World;
  readonly registries: Pick<ContentRegistries, "item">;
}

export function snapshotCharacter(
  ctx: CharacterSnapshotContext,
  entityId: EntityId,
  characterId: string,
  savedAt: number,
): CharacterSnapshot {
  const position = ctx.world.getComponent(entityId, "position");
  const combatant = ctx.world.getComponent(entityId, "combatant");
  const skills = ctx.world.getComponent(entityId, "skills");
  const inventory = ctx.world.getComponent(entityId, "inventory");
  const equipment = ctx.world.getComponent(entityId, "equipment");
  const vars = ctx.world.getComponent(entityId, "vars");
  const bank = ctx.world.getComponent(entityId, "bank");

  const snapshot: CharacterSnapshot = {
    version: CHARACTER_SNAPSHOT_VERSION,
    characterId,
    savedAt,
    position: position
      ? {
          x: position.x,
          y: position.y,
          plane: position.plane as CharacterSnapshot["position"]["plane"],
        }
      : { x: 0, y: 0, plane: 0 },
    hitpoints: {
      health: Math.max(0, combatant?.health ?? 1),
      maxHealth: Math.max(1, combatant?.maxHealth ?? 1),
    },
    skills: cloneSkills(skills),
    inventory: snapshotInventory(inventory, entityId),
    equipment: snapshotEquipment(equipment),
    vars: { ...(vars?.values ?? {}) },
    bank: snapshotBank(bank),
  };

  return parseCharacterSnapshot(snapshot);
}

export function applyCharacterSnapshot(
  ctx: CharacterSnapshotContext,
  entityId: EntityId,
  snapshotInput: CharacterSnapshot,
): void {
  const snapshot = parseCharacterSnapshot(snapshotInput);
  ctx.world.setComponent(entityId, "position", {
    entityId,
    x: snapshot.position.x,
    y: snapshot.position.y,
    plane: snapshot.position.plane,
  });
  ctx.world.setComponent(entityId, "inventory", restoreInventory(entityId, snapshot));
  ctx.world.setComponent(entityId, "bank", restoreBank(entityId, snapshot));
  ctx.world.setComponent(entityId, "equipment", restoreEquipment(ctx, entityId, snapshot));
  const existingSkills = ctx.world.getComponent(entityId, "skills")?.skills ?? {};
  ctx.world.setComponent(entityId, "skills", {
    entityId,
    skills: { ...existingSkills, ...cloneSkills({ entityId, skills: snapshot.skills }) },
  });
  ctx.world.setComponent(entityId, "vars", createVarComponent(entityId, snapshot.vars));

  const existingCombatant = ctx.world.getComponent(entityId, "combatant");
  if (existingCombatant) {
    ctx.world.setComponent(entityId, "combatant", {
      ...existingCombatant,
      health: snapshot.hitpoints.health,
      maxHealth: snapshot.hitpoints.maxHealth,
      dead: snapshot.hitpoints.health <= 0,
    });
  }
}

function cloneSkills(skills: SkillsComponent | undefined): CharacterSnapshot["skills"] {
  if (!skills) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(skills.skills).map(([skillId, state]) => [skillId, { ...state }]),
  );
}

function snapshotInventory(
  inventory: InventoryComponent | undefined,
  entityId: EntityId,
): CharacterSnapshot["inventory"] {
  if (!inventory) {
    return {
      containerId: `inventory:${entityId}`,
      capacity: INVENTORY_SIZE,
      nextUid: 1,
      slots: [],
    };
  }
  return {
    containerId: inventory.containerId,
    capacity: inventory.capacity,
    nextUid: inventory.nextUid,
    slots: inventory.slots.flatMap((item, slot) =>
      item ? [{ slot, itemId: item.itemId, quantity: item.quantity, uid: item.uid }] : [],
    ),
  };
}

function snapshotBank(bank: BankComponent | undefined): CharacterSnapshot["bank"] {
  if (!bank) {
    return { slots: [] };
  }
  return {
    slots: bank.slots.flatMap((item, slot) =>
      item ? [{ slot, itemId: item.itemId, quantity: item.quantity }] : [],
    ),
  };
}

function snapshotEquipment(
  equipment: EquipmentComponent | undefined,
): CharacterSnapshot["equipment"] {
  return { slots: { ...(equipment?.slots ?? {}) } };
}

function restoreInventory(entityId: EntityId, snapshot: CharacterSnapshot): InventoryComponent {
  const inventory = createInventory(
    entityId,
    snapshot.inventory.containerId,
    snapshot.inventory.capacity,
  );
  inventory.nextUid = snapshot.inventory.nextUid;
  for (const item of snapshot.inventory.slots) {
    inventory.slots[item.slot] = {
      itemId: item.itemId,
      quantity: item.quantity,
      uid: item.uid,
    } satisfies InventorySlot;
  }
  return inventory;
}

function restoreBank(entityId: EntityId, snapshot: CharacterSnapshot): BankComponent {
  const bank = createBank(entityId, DEFAULT_BANK_CAPACITY);
  for (const item of snapshot.bank.slots) {
    bank.slots[item.slot] = {
      itemId: item.itemId,
      quantity: item.quantity,
      uid: bank.nextUid,
    } satisfies InventorySlot;
    bank.nextUid += 1;
  }
  return bank;
}

function restoreEquipment(
  ctx: CharacterSnapshotContext,
  entityId: EntityId,
  snapshot: CharacterSnapshot,
): EquipmentComponent {
  const equipment = createEquipment(entityId);
  equipment.slots = { ...snapshot.equipment.slots } as Partial<Record<EquipmentSlotName, string>>;
  equipment.bonuses = aggregateBonuses(equipment, ctx.registries.item);
  return equipment;
}
