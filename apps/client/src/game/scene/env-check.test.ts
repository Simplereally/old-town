import { describe, expect, it } from "vitest";

describe("environment check", () => {
  it("has document", () => {
    expect(typeof document).toBe("object");
  });
});
