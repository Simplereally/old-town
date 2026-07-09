import { describe, expect, it } from "vitest";
import {
  itemTransactionAuditEventSchema,
  parseItemTransactionAuditEvent,
  parseItemTransactionAuditRecord,
} from "./item-audit";

const validEvent = {
  tick: 42,
  characterId: "dev-a",
  itemId: "ember_bead",
  quantity: 3,
  reason: "spell_bead_cost",
};

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

  it("rejects a negative tick", () => {
    expect(() => parseItemTransactionAuditEvent({ ...validEvent, tick: -1 })).toThrow();
  });

  it("rejects an empty characterId or itemId", () => {
    expect(() => parseItemTransactionAuditEvent({ ...validEvent, characterId: "" })).toThrow();
    expect(() => parseItemTransactionAuditEvent({ ...validEvent, itemId: "" })).toThrow();
  });

  it("rejects an empty reason", () => {
    expect(() => parseItemTransactionAuditEvent({ ...validEvent, reason: "" })).toThrow();
  });

  it("accepts an optional idempotencyKey within length bounds", () => {
    const result = parseItemTransactionAuditEvent({ ...validEvent, idempotencyKey: "trade-abc-1" });
    expect(result.idempotencyKey).toBe("trade-abc-1");
  });

  it("rejects an idempotencyKey exceeding 200 characters", () => {
    expect(() =>
      parseItemTransactionAuditEvent({ ...validEvent, idempotencyKey: "a".repeat(201) }),
    ).toThrow();
  });

  it("rejects extra fields on the event schema (strict)", () => {
    expect(itemTransactionAuditEventSchema.safeParse({ ...validEvent, hack: true }).success).toBe(
      false,
    );
  });

  it("rejects a record missing the required id field", () => {
    expect(() => parseItemTransactionAuditRecord(validEvent)).toThrow();
  });

  it("rejects a record with a non-positive id", () => {
    expect(() => parseItemTransactionAuditRecord({ ...validEvent, id: 0 })).toThrow();
    expect(() => parseItemTransactionAuditRecord({ ...validEvent, id: -1 })).toThrow();
  });

  it("accepts optional beforeQuantity and afterQuantity as non-negative integers", () => {
    const result = parseItemTransactionAuditEvent({
      ...validEvent,
      beforeQuantity: 10,
      afterQuantity: 7,
    });
    expect(result.beforeQuantity).toBe(10);
    expect(result.afterQuantity).toBe(7);
  });

  it("rejects negative beforeQuantity or afterQuantity", () => {
    expect(() => parseItemTransactionAuditEvent({ ...validEvent, beforeQuantity: -1 })).toThrow();
    expect(() => parseItemTransactionAuditEvent({ ...validEvent, afterQuantity: -1 })).toThrow();
  });
});
