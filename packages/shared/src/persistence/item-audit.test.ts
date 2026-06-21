import { describe, expect, it } from "vitest";
import { parseItemTransactionAuditEvent, parseItemTransactionAuditRecord } from "./item-audit";

describe("item transaction audit schema", () => {
  it("accepts the audit fields required for item mutation tracing", () => {
    expect(
      parseItemTransactionAuditRecord({
        id: 1,
        tick: 42,
        characterId: "dev-a",
        itemId: "ember_bead",
        quantity: 3,
        reason: "spell_bead_cost",
        beforeQuantity: 20,
        afterQuantity: 17,
        metadata: {
          spellId: "spark",
          costs: [{ itemId: "ember_bead", quantity: 3 }],
        },
      }),
    ).toEqual({
      id: 1,
      tick: 42,
      characterId: "dev-a",
      itemId: "ember_bead",
      quantity: 3,
      reason: "spell_bead_cost",
      beforeQuantity: 20,
      afterQuantity: 17,
      metadata: {
        spellId: "spark",
        costs: [{ itemId: "ember_bead", quantity: 3 }],
      },
    });
  });

  it("defaults metadata and rejects non-positive quantities", () => {
    expect(
      parseItemTransactionAuditEvent({
        tick: 1,
        characterId: "dev-a",
        itemId: "coin",
        quantity: 1,
        reason: "quest_reward",
      }),
    ).toMatchObject({ metadata: {} });

    expect(() =>
      parseItemTransactionAuditEvent({
        tick: 1,
        characterId: "dev-a",
        itemId: "coin",
        quantity: 0,
        reason: "quest_reward",
      }),
    ).toThrow();
  });
});
