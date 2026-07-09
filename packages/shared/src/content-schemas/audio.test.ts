import { describe, expect, it } from "vitest";
import { audioDefSchema } from "./audio";

const validAmbience = {
  id: "ambience_market_bell",
  name: "Market Bell Murmur",
  category: "ambience",
  assetPath: "assets/audio/ambience/market_murmur.ogg",
  volume: 0.35,
  loop: true,
  fadeMs: 1000,
  zoneIds: ["market_bell"],
};

const validPositional = {
  id: "positional_forge_crackle",
  name: "Forge Crackle",
  category: "positional",
  assetPath: "assets/audio/positional/forge_crackle.ogg",
  volume: 0.45,
  loop: true,
  tile: { x: 60, y: 46, plane: 0 },
  maxDistanceTiles: 12,
  falloffStartTiles: 2,
};

describe("audioDefSchema", () => {
  it("accepts ambience, positional, ui, and action defs", () => {
    expect(audioDefSchema.safeParse(validAmbience).success).toBe(true);
    expect(audioDefSchema.safeParse(validPositional).success).toBe(true);
    expect(
      audioDefSchema.safeParse({
        id: "ui_click",
        name: "UI Click",
        category: "ui",
        assetPath: "assets/audio/ui/click.ogg",
      }).success,
    ).toBe(true);
    expect(
      audioDefSchema.safeParse({
        id: "door_open",
        name: "Door Open",
        category: "action",
        assetPath: "assets/audio/action/door_open.ogg",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid asset paths", () => {
    const result = audioDefSchema.safeParse({
      ...validAmbience,
      assetPath: "sounds/market.mp3",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown categories", () => {
    const result = audioDefSchema.safeParse({
      ...validAmbience,
      category: "music",
    });
    expect(result.success).toBe(false);
  });

  it("rejects positional without tile or maxDistanceTiles", () => {
    expect(
      audioDefSchema.safeParse({
        id: "positional_bad",
        name: "Bad",
        category: "positional",
        assetPath: "assets/audio/positional/forge_crackle.ogg",
      }).success,
    ).toBe(false);
  });

  it("rejects fallback ambience that also lists zoneIds", () => {
    expect(
      audioDefSchema.safeParse({
        id: "ambience_fallback",
        name: "Fallback",
        category: "ambience",
        assetPath: "assets/audio/ambience/fallback_silence.ogg",
        fallback: true,
        zoneIds: ["market_bell"],
      }).success,
    ).toBe(false);
  });
});
