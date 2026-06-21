import { entityId } from "@old-town/shared";
import { expect, test } from "vitest";

test("brand equality", () => {
  const id = entityId(0);
  expect(id).toBe(0);
});
