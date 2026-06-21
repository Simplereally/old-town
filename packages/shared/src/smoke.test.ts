import { SHARED_PACKAGE } from "@old-town/shared";
import { describe, expect, it } from "vitest";

describe("@old-town/shared smoke", () => {
  it("resolves its own package marker through the workspace alias", () => {
    expect(SHARED_PACKAGE).toBe("@old-town/shared");
  });
});
