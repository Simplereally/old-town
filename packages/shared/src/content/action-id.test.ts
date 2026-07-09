import { describe, expect, it } from "vitest";
import { ACTION_ID_PATTERN, actionId, actionIdSchema } from "./action-id";

describe("ACTION_ID_PATTERN", () => {
  it("accepts lowercase snake_case tokens starting with a letter", () => {
    for (const id of ["a", "chop", "talk", "pick_up", "woodcut", "use_item_on", "a1", "action_1"]) {
      expect(ACTION_ID_PATTERN.test(id)).toBe(true);
    }
  });

  it("rejects uppercase, hyphens, spaces, and non-letter leads", () => {
    for (const id of ["", "Talk", "talk-to", "talk to", "1action", "_action", "action!"]) {
      expect(ACTION_ID_PATTERN.test(id)).toBe(false);
    }
  });

  it("rejects tokens longer than 32 characters", () => {
    expect(ACTION_ID_PATTERN.test("a".repeat(32))).toBe(true);
    expect(ACTION_ID_PATTERN.test("a".repeat(33))).toBe(false);
  });
});

describe("actionId constructor", () => {
  it("brands a valid token and returns it unchanged at runtime", () => {
    expect(actionId("chop")).toBe("chop");
    expect(actionId("use_item_on")).toBe("use_item_on");
  });

  it("throws on an invalid token", () => {
    expect(() => actionId("Talk-To")).toThrow();
    expect(() => actionId("")).toThrow();
    expect(() => actionId("1chop")).toThrow();
    expect(() => actionId("a".repeat(33))).toThrow();
  });
});

describe("actionIdSchema", () => {
  it("accepts a valid actionId string", () => {
    expect(actionIdSchema.safeParse("woodcut").success).toBe(true);
  });

  it("rejects an invalid actionId string", () => {
    expect(actionIdSchema.safeParse("Talk-To").success).toBe(false);
    expect(actionIdSchema.safeParse("").success).toBe(false);
  });
});
