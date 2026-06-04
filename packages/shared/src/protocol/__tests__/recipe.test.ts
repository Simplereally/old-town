import { describe, expect, it } from "vitest";
import {
  type RecipeListPacket,
  type RecipeResultPacket,
  ServerPacketType,
} from "../packets";
import { ClientCommandType, type RecipeSelectCommand } from "../commands";
import { parseClientCommand } from "../command-schemas";
import { entityId } from "../../types/ids";

describe("recipe protocol", () => {
  it("round-trips a RecipeListPacket through a TickDelta", () => {
    const packet: RecipeListPacket = {
      interfaceId: "recipe",
      stationEntityId: 1,
      stationName: "Range",
      recipes: [
        {
          recipeId: "cook_raw_fish",
          name: "Cooked Fish",
          skillId: "cooking",
          levelRequired: 1,
          xp: 40,
          ingredients: [{ itemId: "raw_fish", quantity: 1 }],
          productId: "cooked_fish",
          productQuantity: 1,
        },
      ],
    };

    const delta = {
      type: ServerPacketType.TickDelta,
      tick: 42,
      serverTime: Date.now(),
      entityAdds: [],
      entityRemoves: [],
      entityUpdates: [],
      recipeLists: [packet],
    };

    const json = JSON.stringify(delta);
    const parsed = JSON.parse(json) as typeof delta;
    expect(parsed.recipeLists).toHaveLength(1);
    expect(parsed.recipeLists?.[0]?.recipes[0]?.recipeId).toBe("cook_raw_fish");
  });

  it("round-trips a RecipeResultPacket through a TickDelta", () => {
    const packet: RecipeResultPacket = {
      recipeId: "cook_raw_fish",
      success: true,
      productItemId: "cooked_fish",
      productQuantity: 1,
      xpReward: 40,
      message: "You cook the fish.",
    };

    const delta = {
      type: ServerPacketType.TickDelta,
      tick: 42,
      serverTime: Date.now(),
      entityAdds: [],
      entityRemoves: [],
      entityUpdates: [],
      recipeResults: [packet],
    };

    const json = JSON.stringify(delta);
    const parsed = JSON.parse(json) as typeof delta;
    expect(parsed.recipeResults).toHaveLength(1);
    expect(parsed.recipeResults?.[0]?.success).toBe(true);
    expect(parsed.recipeResults?.[0]?.xpReward).toBe(40);
  });

  it("serializes a RecipeSelect command correctly", () => {
    const command: RecipeSelectCommand = {
      type: ClientCommandType.RecipeSelect,
      commandId: 1,
      payload: {
        recipeId: "cook_raw_beef",
        stationEntityId: entityId(42),
      },
    };

    const result = parseClientCommand(command);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.type).toBe(ClientCommandType.RecipeSelect);
      expect((result.value.payload as { recipeId: string }).recipeId).toBe("cook_raw_beef");
      expect((result.value.payload as { stationEntityId: number }).stationEntityId).toBe(42);
    }
  });

  it("rejects a RecipeSelect command with an empty recipeId", () => {
    const result = parseClientCommand({
      type: ClientCommandType.RecipeSelect,
      commandId: 1,
      payload: { recipeId: "", stationEntityId: entityId(42) },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a RecipeSelect command with a missing recipeId", () => {
    const result = parseClientCommand({
      type: ClientCommandType.RecipeSelect,
      commandId: 1,
      payload: { stationEntityId: entityId(42) },
    });
    expect(result.ok).toBe(false);
  });
});
