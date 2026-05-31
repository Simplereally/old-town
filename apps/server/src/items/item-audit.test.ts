import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { entityId, type ItemTransactionAuditRecord } from "@old-town/shared";
import { describe, expect, it, vi } from "vitest";
import { MemoryPersistenceAdapter } from "../persistence";
import { ItemAuditLog } from "./item-audit";

describe("ItemAuditLog", () => {
  it("records local recent events and persists them through the adapter", async () => {
    const adapter = new MemoryPersistenceAdapter();
    const audit = new ItemAuditLog({
      persistence: adapter,
      resolveCharacterId: (id) => (id === entityId(7) ? "dev-a" : undefined),
    });

    const record = audit.recordForEntity(entityId(7), {
      tick: 5,
      itemId: "coin",
      quantity: 10,
      reason: "quest_reward",
      beforeQuantity: 0,
      afterQuantity: 10,
      metadata: { questId: "smoke_over_old_town" },
    });

    await audit.flush();

    expect(audit.recent()).toEqual([record]);
    await expect(adapter.recentItemTransactions()).resolves.toEqual([record]);
  });

  it("does not let persistence failures authorize or roll back gameplay", async () => {
    const logger = { debug: vi.fn(), warn: vi.fn() };
    const audit = new ItemAuditLog({
      logger,
      persistence: {
        recordItemTransaction: async (_record: ItemTransactionAuditRecord) => {
          throw new Error("audit store unavailable");
        },
      },
    });

    expect(() =>
      audit.record({
        tick: 1,
        characterId: "dev-a",
        itemId: "bread",
        quantity: 1,
        reason: "consume",
        beforeQuantity: 2,
        afterQuantity: 1,
      }),
    ).not.toThrow();

    await audit.flush();

    expect(audit.snapshot()).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "item-audit",
      "Failed to persist item transaction",
      expect.objectContaining({ reason: "consume" }),
    );
  });

  it("keeps authoritative item mutation paths on the audited allowlist", async () => {
    const srcRoot = join(process.cwd(), "apps/server/src");
    const productionFiles = await sourceFiles(srcRoot);
    const mutatorPattern = /\b(addItem|removeItem|removeFromSlot|moveItem|swapSlots)\(/;
    const allowed = new Set([
      "items/equipment.ts",
      "items/inventory.ts",
      "items/item-actions.ts",
      "net/dev-session.ts",
      "quests/effects.ts",
      "systems/ground-item-system.ts",
      "systems/skilling-system.ts",
      "systems/spell-system.ts",
    ]);

    const filesWithMutators: string[] = [];
    for (const file of productionFiles) {
      const source = await readFile(file, "utf8");
      if (mutatorPattern.test(source)) {
        filesWithMutators.push(relative(srcRoot, file));
      }
    }

    expect(filesWithMutators.toSorted()).toEqual(Array.from(allowed).toSorted());
  });
});

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(path)));
      continue;
    }
    if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(path);
    }
  }
  return files;
}
