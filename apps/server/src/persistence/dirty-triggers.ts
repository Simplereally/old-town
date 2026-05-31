import { type EntityId, type EntityUpdatePayload, entityId } from "@old-town/shared";
import type { DeltaMutationObserver } from "../sim/delta-accumulator";
import type { CharacterSaveQueue } from "./save-queue";

export interface DirtyTriggerClock {
  readonly tick: number;
  readonly serverTime: number;
}

export interface DirtyPlayerDirectory {
  entityIds(): readonly EntityId[];
}

export interface PersistenceDirtyTriggerOptions {
  readonly saveQueue: CharacterSaveQueue;
  readonly players: DirtyPlayerDirectory;
  readonly clock: () => DirtyTriggerClock;
}

const INVENTORY_CONTAINER_PREFIX = "inventory:";

export function createPersistenceDirtyObserver(
  options: PersistenceDirtyTriggerOptions,
): DeltaMutationObserver {
  const markAllImmediate = (reason: "level" | "quest"): void => {
    const { tick, serverTime } = options.clock();
    for (const playerId of options.players.entityIds()) {
      options.saveQueue.markImmediate(playerId, reason, tick, serverTime);
    }
  };

  return {
    onInventoryDelta(delta) {
      const playerId = entityIdFromInventoryContainer(delta.containerId);
      if (playerId === undefined) {
        return;
      }
      const { tick, serverTime } = options.clock();
      options.saveQueue.markImmediate(playerId, "inventory", tick, serverTime);
    },
    onSkillDelta() {
      markAllImmediate("level");
    },
    onVarbitDelta(delta) {
      if (delta.varId.startsWith("quest.") || delta.varId.startsWith("unlock.")) {
        markAllImmediate("quest");
      }
    },
    onEntityUpdate(entityId, changes) {
      markEntityUpdate(options.saveQueue, options.clock(), entityId, changes);
    },
  };
}

function markEntityUpdate(
  saveQueue: CharacterSaveQueue,
  clock: DirtyTriggerClock,
  entityId: EntityId,
  changes: EntityUpdatePayload,
): void {
  if (changes.equipment) {
    saveQueue.markImmediate(entityId, "equipment", clock.tick, clock.serverTime);
  }
  if (changes.position) {
    saveQueue.markLazy(entityId, "position", clock.tick, clock.serverTime);
  }
  const health = changes.healthBar;
  if (health) {
    if (health.current <= 0) {
      saveQueue.markImmediate(entityId, "death", clock.tick, clock.serverTime);
    } else {
      saveQueue.markLazy(entityId, "hitpoints", clock.tick, clock.serverTime);
    }
  }
}

function entityIdFromInventoryContainer(containerId: string): EntityId | undefined {
  if (!containerId.startsWith(INVENTORY_CONTAINER_PREFIX)) {
    return undefined;
  }
  const raw = containerId.slice(INVENTORY_CONTAINER_PREFIX.length);
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? entityId(parsed) : undefined;
}
