import { describe, expect, it } from "vitest";
import { contentClientRegistriesSchema } from "../protocol/content-client-registries";
import type { LoadedContentFile } from "./content-registry";
import { validateContent } from "./content-registry";

const ambienceFile: LoadedContentFile = {
  path: "audio/ambience.json",
  kind: "audio",
  data: [
    {
      id: "ambience_fallback",
      name: "Quiet Town Bed",
      category: "ambience",
      assetPath: "assets/audio/ambience/fallback_silence.ogg",
      volume: 0.2,
      loop: true,
      fadeMs: 1200,
      fallback: true,
    },
    {
      id: "ambience_market_bell",
      name: "Market Bell Murmur",
      category: "ambience",
      assetPath: "assets/audio/ambience/market_murmur.ogg",
      volume: 0.35,
      loop: true,
      fadeMs: 1000,
      zoneIds: ["market_bell"],
    },
  ],
};

const actionFile: LoadedContentFile = {
  path: "audio/action.json",
  kind: "audio",
  data: [
    {
      id: "door_open",
      name: "Door Open",
      category: "action",
      assetPath: "assets/audio/action/door_open.ogg",
      volume: 0.55,
    },
  ],
};

describe("audio content pipeline", () => {
  it("validates audio content files into the audio registry", () => {
    const result = validateContent([ambienceFile, actionFile]);
    expect(result.ok).toBe(true);
    expect(result.registries.audio.size).toBe(3);
    expect(result.registries.audio.get("door_open")?.category).toBe("action");
    expect(result.registries.audio.get("ambience_market_bell")?.zoneIds).toEqual(["market_bell"]);
  });

  it("rejects duplicate audio ids", () => {
    const duplicate: LoadedContentFile = {
      path: "audio/dup.json",
      kind: "audio",
      data: {
        id: "door_open",
        name: "Door Open Dup",
        category: "action",
        assetPath: "assets/audio/action/door_open.ogg",
      },
    };
    const result = validateContent([actionFile, duplicate]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("duplicate"))).toBe(true);
  });

  it("serializes into the client content registries shape", () => {
    const result = validateContent([ambienceFile, actionFile]);
    expect(result.ok).toBe(true);
    const payload = {
      item: {},
      npc: {},
      object: {},
      skill: {},
      spell: {},
      quest: {},
      dialogue: {},
      contract: {},
      material: {},
      audio: Object.fromEntries(result.registries.audio),
    };
    expect(contentClientRegistriesSchema.safeParse(payload).success).toBe(true);
    expect(payload.audio.door_open?.id).toBe("door_open");
  });
});
