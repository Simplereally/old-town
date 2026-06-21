import { CHARACTER_SNAPSHOT_VERSION, type CharacterSnapshot } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import {
  type CharacterStateRow,
  snapshotToStateColumns,
  stateRowToSnapshot,
} from "./character-state-row";

const snapshot: CharacterSnapshot = {
  version: CHARACTER_SNAPSHOT_VERSION,
  characterId: "dev-a",
  savedAt: 1_700_000_000,
  position: { x: 30, y: 32, plane: 1 },
  hitpoints: { health: 7, maxHealth: 10 },
  combatStyle: "slash",
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
};

/** Build a row the way the driver returns it (snake_case, JSONB already parsed). */
function rowFromColumns(version = 1): CharacterStateRow {
  const columns = snapshotToStateColumns(snapshot, "old_town_dev");
  return {
    version,
    content_version: 1,
    world_id: columns.worldId,
    tile_x: columns.tileX,
    tile_y: columns.tileY,
    plane: columns.plane,
    health: columns.health,
    max_health: columns.maxHealth,
    combat_style: columns.combatStyle,
    skills: columns.skills,
    inventory: columns.inventory,
    equipment: columns.equipment,
    bank: columns.bank,
    quest_vars: columns.questVars,
    saved_at: columns.savedAt,
  };
}

describe("character_state row mapping", () => {
  it("projects a snapshot onto state columns and rebuilds it losslessly", () => {
    const columns = snapshotToStateColumns(snapshot, "old_town_dev");
    expect(columns).toMatchObject({
      worldId: "old_town_dev",
      tileX: 30,
      tileY: 32,
      plane: 1,
      health: 7,
      maxHealth: 10,
      combatStyle: "slash",
      savedAt: 1_700_000_000,
    });

    const rebuilt = stateRowToSnapshot("dev-a", rowFromColumns());
    expect(rebuilt).toEqual(snapshot);
  });

  it("treats a missing combat style as undefined, not the string 'null'", () => {
    const row = { ...rowFromColumns(), combat_style: null };
    const rebuilt = stateRowToSnapshot("dev-a", row);
    expect(rebuilt.combatStyle).toBeUndefined();
  });

  it("parses bigint columns returned as strings by the driver", () => {
    const row: CharacterStateRow = {
      ...rowFromColumns(),
      saved_at: "1700000000",
      tile_x: "30",
      tile_y: "32",
    };
    const rebuilt = stateRowToSnapshot("dev-a", row);
    expect(rebuilt.savedAt).toBe(1_700_000_000);
    expect(rebuilt.position).toEqual({ x: 30, y: 32, plane: 1 });
  });

  it("parses JSONB columns delivered as strings", () => {
    const row: CharacterStateRow = {
      ...rowFromColumns(),
      skills: JSON.stringify(snapshot.skills),
      inventory: JSON.stringify(snapshot.inventory),
      equipment: JSON.stringify(snapshot.equipment),
      bank: JSON.stringify(snapshot.bank),
      quest_vars: JSON.stringify(snapshot.vars),
    };
    const rebuilt = stateRowToSnapshot("dev-a", row);
    expect(rebuilt).toEqual(snapshot);
  });

  it("rejects a corrupt row at load (e.g. fractional tile) instead of corrupting ECS state", () => {
    const row = { ...rowFromColumns(), tile_x: 30.5 };
    expect(() => stateRowToSnapshot("dev-a", row)).toThrow();
  });
});
