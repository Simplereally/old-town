import {
  type CharacterSnapshot,
  entityId,
  type ItemTransactionAuditRecord,
} from "@old-town/shared";
import { describe, expect, it, vi } from "vitest";
import { createWorld } from "../ecs/world";
import { createEquipment } from "../items/equipment";
import { createInventory } from "../items/inventory";
import { type PersistenceAdapter, PersistenceVersionConflictError } from "./adapter";
import { PersistenceMetrics } from "./metrics";
import { CharacterSaveQueue } from "./save-queue";

const PLAYER = entityId(0);

class RecordingPersistenceAdapter implements PersistenceAdapter {
  readonly kind = "memory";
  readonly enabled = true;
  readonly saves: CharacterSnapshot[] = [];

  async loadCharacter(): Promise<CharacterSnapshot | undefined> {
    return undefined;
  }

  async saveCharacter(snapshot: CharacterSnapshot): Promise<void> {
    this.saves.push(snapshot);
  }

  async recordItemTransaction(_record: ItemTransactionAuditRecord): Promise<void> {}

  async recentItemTransactions(): Promise<readonly ItemTransactionAuditRecord[]> {
    return [];
  }
}

class ConflictPersistenceAdapter implements PersistenceAdapter {
  readonly kind = "postgres";
  readonly enabled = true;

  async loadCharacter(): Promise<CharacterSnapshot | undefined> {
    return undefined;
  }

  async saveCharacter(): Promise<void> {
    throw new PersistenceVersionConflictError("dev-a", 1);
  }

  async recordItemTransaction(_record: ItemTransactionAuditRecord): Promise<void> {}

  async recentItemTransactions(): Promise<readonly ItemTransactionAuditRecord[]> {
    return [];
  }
}

function buildWorld() {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);
  world.setComponent(PLAYER, "position", { entityId: PLAYER, x: 30, y: 32, plane: 0 });
  world.setComponent(PLAYER, "inventory", createInventory(PLAYER, "inventory:0", 28));
  world.setComponent(PLAYER, "equipment", createEquipment(PLAYER));
  world.setComponent(PLAYER, "skills", {
    entityId: PLAYER,
    skills: { cooking: { level: 1, xp: 0, boost: 0, drain: 0 } },
  });
  world.setComponent(PLAYER, "vars", { entityId: PLAYER, values: {} });
  world.setComponent(PLAYER, "combatant", {
    entityId: PLAYER,
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
  return world;
}

function makeQueue(
  adapter: PersistenceAdapter,
  options: { metrics?: PersistenceMetrics } = {},
): {
  logger: {
    debug: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  queue: CharacterSaveQueue;
} {
  const logger = { debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const queue = new CharacterSaveQueue({
    world: buildWorld(),
    registries: { item: new Map() },
    persistence: adapter,
    resolveCharacterId: (entityId) => (entityId === PLAYER ? "dev-a" : undefined),
    lazySaveIntervalTicks: 3,
    logger,
    ...(options.metrics ? { metrics: options.metrics } : {}),
  });
  return { logger, queue };
}

function setup() {
  const adapter = new RecordingPersistenceAdapter();
  const { logger, queue } = makeQueue(adapter);
  return { adapter, logger, queue };
}

describe("CharacterSaveQueue", () => {
  it("flushes immediate saves on the current tick", async () => {
    const { adapter, logger, queue } = setup();

    queue.markImmediate(PLAYER, "inventory", 1, 600);
    queue.flushDue(1, 600);
    await queue.flushAll(1, 600);

    expect(adapter.saves).toHaveLength(1);
    expect(adapter.saves[0]?.characterId).toBe("dev-a");
    expect(logger.debug).toHaveBeenCalledWith(
      "persistence",
      "Queued immediate character save",
      expect.objectContaining({ entityId: PLAYER, reason: "inventory" }),
    );
  });

  it("coalesces lazy saves until the configured due tick", async () => {
    const { adapter, queue } = setup();

    queue.markLazy(PLAYER, "position", 1, 600);
    queue.markLazy(PLAYER, "hitpoints", 2, 1_200);
    queue.flushDue(3, 1_800);
    expect(adapter.saves).toHaveLength(0);

    queue.flushDue(4, 2_400);
    await queue.flushAll(4, 2_400);

    expect(adapter.saves).toHaveLength(1);
    expect(adapter.saves[0]?.savedAt).toBe(2_400);
  });

  it("does not save lazy-only changes before their due tick unless shutdown flushes", async () => {
    const { adapter, queue } = setup();

    queue.markLazy(PLAYER, "position", 1, 600);
    queue.flushDue(2, 1_200);

    expect(adapter.saves).toHaveLength(0);

    await queue.flushAll(2, 1_200);

    expect(adapter.saves).toHaveLength(1);
    expect(adapter.saves[0]?.savedAt).toBe(1_200);
  });

  it("reports the oldest dirty tick as save lag input", () => {
    const { queue } = setup();
    expect(queue.oldestDirtyTick).toBeUndefined();

    queue.markLazy(PLAYER, "position", 5, 3_000);
    expect(queue.oldestDirtyTick).toBe(5);

    queue.discard(PLAYER);
    expect(queue.oldestDirtyTick).toBeUndefined();
  });

  it("feeds enqueue and completion counts to metrics", async () => {
    const metrics = new PersistenceMetrics();
    const adapter = new RecordingPersistenceAdapter();
    const { queue } = makeQueue(adapter, { metrics });

    queue.markImmediate(PLAYER, "inventory", 1, 600);
    queue.markLazy(PLAYER, "position", 1, 600);
    queue.flushDue(1, 600);
    await queue.flushAll(1, 600);

    const snapshot = metrics.snapshot({
      currentTick: 1,
      pendingSaves: queue.pendingCount,
      inFlightSaves: queue.inFlightCount,
      oldestDirtyTick: queue.oldestDirtyTick,
    });
    expect(snapshot.totalImmediateSaves).toBe(1);
    expect(snapshot.totalLazySaves).toBe(1);
    expect(snapshot.totalSavesCompleted).toBe(1);
    expect(snapshot.lastSavedTick).toBe(1);
  });

  it("counts optimistic version conflicts as failures without throwing on the tick", async () => {
    const metrics = new PersistenceMetrics();
    const { queue, logger } = makeQueue(new ConflictPersistenceAdapter(), { metrics });

    queue.markImmediate(PLAYER, "bank", 1, 600);
    queue.flushDue(1, 600);
    await queue.flushAll(1, 600);

    const snapshot = metrics.snapshot({
      currentTick: 1,
      pendingSaves: 0,
      inFlightSaves: 0,
      oldestDirtyTick: undefined,
    });
    expect(snapshot.totalSaveFailures).toBe(1);
    expect(snapshot.versionConflicts).toBe(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "persistence",
      "Character save failed",
      expect.objectContaining({ characterId: "dev-a" }),
    );
  });
});
