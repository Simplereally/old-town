import { type EntityId, type EntityUpdatePayload, entityId } from "@old-town/shared";
import type { DeltaMutationObserver } from "../sim/delta-accumulator";
import type { CharacterSaveQueue } from "./save-queue";

export interface DirtyTriggerClock {
  readonly tick: number;
  readonly serverTime: number;
}

export interface DirtyPlayerDirectory {
  entityIds(): readonly EntityId[];
  hasPlayer(entityId: EntityId): boolean;
}

export interface PersistenceDirtyTriggerOptions {
  readonly saveQueue: CharacterSaveQueue;
  readonly players: DirtyPlayerDirectory;
  readonly clock: () => DirtyTriggerClock;
}

const INVENTORY_CONTAINER_PREFIX = "inventory:";
const BANK_CONTAINER_PREFIX = "bank:";

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
    onEntityUpdate(eid, changes) {
      if (!options.players.hasPlayer(eid)) {
        return;
      }
      markEntityUpdate(options.saveQueue, options.clock(), eid, changes);
    },
  };
}

function markEntityUpdate(
  saveQueue: CharacterSaveQueue,
  clock: DirtyTriggerClock,
  eid: EntityId,
  changes: EntityUpdatePayload,
): void {
  if (changes.equipment) {
    saveQueue.markImmediate(eid, "equipment", clock.tick, clock.serverTime);
  }
  if (changes.position) {
    saveQueue.markLazy(eid, "position", clock.tick, clock.serverTime);
  }
  const health = changes.healthBar;
  if (health) {
    if (health.current <= 0) {
      saveQueue.markImmediate(eid, "death", clock.tick, clock.serverTime);
    } else {
      saveQueue.markLazy(eid, "hitpoints", clock.tick, clock.serverTime);
    }
  }
}

function entityIdFromInventoryContainer(containerId: string): EntityId | undefined {
  if (containerId.startsWith(INVENTORY_CONTAINER_PREFIX)) {
    const raw = containerId.slice(INVENTORY_CONTAINER_PREFIX.length);
    const parsed = Number.parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? entityId(parsed) : undefined;
  }
  if (containerId.startsWith(BANK_CONTAINER_PREFIX)) {
    const raw = containerId.slice(BANK_CONTAINER_PREFIX.length);
    const parsed = Number.parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? entityId(parsed) : undefined;
  }
  return undefined;
}
