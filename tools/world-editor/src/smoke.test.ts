import { SHARED_PACKAGE } from "@old-town/shared";
import { describe, expect, it } from "vitest";

describe("@old-town/world-editor smoke", () => {
  it("loads the shared package across the workspace alias", () => {
    expect(SHARED_PACKAGE).toBe("@old-town/shared");
  });
});
