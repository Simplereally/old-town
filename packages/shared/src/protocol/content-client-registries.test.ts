import { describe, expect, it } from "vitest";
import { contentClientRegistriesSchema } from "./content-client-registries";

const validRegistries = {
  item: {},
  npc: {},
  object: {},
  skill: {},
  spell: {},
  quest: {},
  dialogue: {},
  contract: {},
  material: {},
};

describe("contentClientRegistriesSchema", () => {
  it("accepts a valid registries object with all required keys (empty registries)", () => {
    expect(contentClientRegistriesSchema.safeParse(validRegistries).success).toBe(true);
  });

  it("rejects a missing registry key", () => {
    const { material, ...missing } = validRegistries;
    void material;
    expect(contentClientRegistriesSchema.safeParse(missing).success).toBe(false);
  });

  it("rejects an extra registry key (strict)", () => {
    expect(
      contentClientRegistriesSchema.safeParse({ ...validRegistries, extra: {} }).success,
    ).toBe(false);
  });

  it("rejects a non-object response", () => {
    expect(contentClientRegistriesSchema.safeParse("not-an-object").success).toBe(false);
    expect(contentClientRegistriesSchema.safeParse(null).success).toBe(false);
    expect(contentClientRegistriesSchema.safeParse(42).success).toBe(false);
  });

  it("accepts a valid item entry", () => {
    const data = {
      ...validRegistries,
      item: {
        penny_hatchet: {
          id: "penny_hatchet",
          name: "Penny Hatchet",
          stackable: false,
          tradeable: true,
          examine: "A cheap hatchet.",
          icon: "icon_penny_hatchet",
          value: 1,
        },
      },
    };
    expect(contentClientRegistriesSchema.safeParse(data).success).toBe(true);
  });
});
