import { SHARED_PACKAGE } from "@old-town/shared";
import { describe, it, expect } from "vitest";

describe("debug import", () => {
  it("SHARED_PACKAGE is exported from shared", () => {
    expect(SHARED_PACKAGE).toBe("@old-town/shared");
  });
});
