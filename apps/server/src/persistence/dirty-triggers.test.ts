import { entityId } from "@old-town/shared";
import { describe, expect, it, vi } from "vitest";
import { createPersistenceDirtyObserver } from "./dirty-triggers";
import type { CharacterSaveQueue } from "./save-queue";

const PLAYER = entityId(7);
const OTHER_PLAYER = entityId(9);

function setup() {
  const saveQueue = {
    markImmediate: vi.fn(),
    markLazy: vi.fn(),
  } as unknown as CharacterSaveQueue;
  const observer = createPersistenceDirtyObserver({
    saveQueue,
    players: { entityIds: () => [PLAYER, OTHER_PLAYER] },
    clock: () => ({ tick: 4, serverTime: 2_400 }),
  });
  return { observer, saveQueue };
}

describe("persistence dirty triggers", () => {
  it("marks inventory and equipment changes as immediate saves", () => {
    const { observer, saveQueue } = setup();

    observer.onInventoryDelta?.({
      containerId: "inventory:7",
      changes: [{ slot: 0, itemId: "coin", quantity: 5 }],
    });
    observer.onEntityUpdate?.(PLAYER, { equipment: { slots: ["pennywrought_shortblade"] } });

    expect(saveQueue.markImmediate).toHaveBeenCalledWith(PLAYER, "inventory", 4, 2_400);
    expect(saveQueue.markImmediate).toHaveBeenCalledWith(PLAYER, "equipment", 4, 2_400);
  });

  it("marks quest vars and skill deltas as immediate saves for connected players", () => {
    const { observer, saveQueue } = setup();

    observer.onVarbitDelta?.({ varId: "quest.smoke_over_old_town.completed", value: true });
    observer.onSkillDelta?.({ skillId: "cooking", level: 2, xp: 90 });

    expect(saveQueue.markImmediate).toHaveBeenCalledWith(PLAYER, "quest", 4, 2_400);
    expect(saveQueue.markImmediate).toHaveBeenCalledWith(OTHER_PLAYER, "quest", 4, 2_400);
    expect(saveQueue.markImmediate).toHaveBeenCalledWith(PLAYER, "level", 4, 2_400);
    expect(saveQueue.markImmediate).toHaveBeenCalledWith(OTHER_PLAYER, "level", 4, 2_400);
  });

  it("marks position and non-fatal hitpoint updates as lazy, death as immediate", () => {
    const { observer, saveQueue } = setup();

    observer.onEntityUpdate?.(PLAYER, { position: { x: 1, y: 2, plane: 0 } });
    observer.onEntityUpdate?.(PLAYER, { healthBar: { current: 6, max: 10 } });
    observer.onEntityUpdate?.(PLAYER, { healthBar: { current: 0, max: 10 } });

    expect(saveQueue.markLazy).toHaveBeenCalledWith(PLAYER, "position", 4, 2_400);
    expect(saveQueue.markLazy).toHaveBeenCalledWith(PLAYER, "hitpoints", 4, 2_400);
    expect(saveQueue.markImmediate).toHaveBeenCalledWith(PLAYER, "death", 4, 2_400);
  });
});
