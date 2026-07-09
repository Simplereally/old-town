import type { ContentClientRegistries } from "@old-town/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContentClient } from "./ContentClient";

function registries(overrides: Partial<ContentClientRegistries> = {}): ContentClientRegistries {
  return {
    item: {},
    npc: {},
    object: {},
    skill: {},
    spell: {},
    quest: {},
    dialogue: {},
    contract: {},
    material: {},
    audio: {},
    ...overrides,
  } as ContentClientRegistries;
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("ContentClient", () => {
  it("is not ready before load", () => {
    const client = new ContentClient();
    expect(client.ready).toBe(false);
  });

  it("load fetches /api/content and marks ready", async () => {
    const data = registries({ item: { coin: { id: "coin", name: "Coin" } as never } });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => data,
    } as unknown as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new ContentClient();
    await client.load("http://localhost:8080");

    expect(client.ready).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0]?.[0];
    expect(url.toString()).toBe("http://localhost:8080/api/content");
  });

  it("load throws when the response is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    } as unknown as Response) as unknown as typeof fetch;

    const client = new ContentClient();
    await expect(client.load("http://localhost:8080")).rejects.toThrow(
      "Failed to load content: 500 Internal Server Error",
    );
    expect(client.ready).toBe(false);
  });

  it("load throws when the parsed body is null", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => null,
    } as unknown as Response) as unknown as typeof fetch;

    const client = new ContentClient();
    await expect(client.load("http://localhost:8080")).rejects.toThrow(
      "Invalid content response: expected an object",
    );
  });

  it("load throws when the parsed body is a primitive", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => 42,
    } as unknown as Response) as unknown as typeof fetch;

    const client = new ContentClient();
    await expect(client.load("http://localhost:8080")).rejects.toThrow(
      "Invalid content response: expected an object",
    );
  });

  it("typed getters return definitions from the loaded registries", async () => {
    const data = registries({
      item: { coin: { id: "coin", name: "Coin" } as never },
      npc: { goblin: { id: "goblin", name: "Goblin" } as never },
      skill: { woodcutting: { id: "woodcutting", name: "Woodcutting" } as never },
      material: { grass: { id: "grass", name: "Grass", color: 0x4f8f3a } as never },
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => data,
    } as unknown as Response) as unknown as typeof fetch;

    const client = new ContentClient();
    await client.load("http://localhost:8080");

    expect(client.getItem("coin")?.id).toBe("coin");
    expect(client.getNpc("goblin")?.id).toBe("goblin");
    expect(client.getSkill("woodcutting")?.id).toBe("woodcutting");
    expect(client.getMaterial("grass")?.color).toBe(0x4f8f3a);
    expect(client.getItem("missing")).toBeUndefined();
  });

  it("getAllMaterials returns an empty object before load", () => {
    const client = new ContentClient();
    expect(client.getAllMaterials()).toEqual({});
  });

  it("getAllMaterials returns the material record after load", async () => {
    const data = registries({
      material: { grass: { id: "grass", name: "Grass" } as never },
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => data,
    } as unknown as Response) as unknown as typeof fetch;

    const client = new ContentClient();
    await client.load("http://localhost:8080");
    expect(Object.keys(client.getAllMaterials())).toEqual(["grass"]);
  });

  it("getQuestStage caches a stage map per quest and returns the matching stage", async () => {
    const data = registries({
      quest: {
        q1: {
          id: "q1",
          name: "Quest 1",
          questPoints: 1,
          requirements: [],
          varPrefix: "q1",
          stages: [
            { stage: 0, journalText: "Start", objectives: [], triggers: [] },
            { stage: 1, journalText: "Middle", objectives: [], triggers: [] },
          ],
        } as never,
      },
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => data,
    } as unknown as Response) as unknown as typeof fetch;

    const client = new ContentClient();
    await client.load("http://localhost:8080");

    expect(client.getQuestStage("q1", 0)?.journalText).toBe("Start");
    expect(client.getQuestStage("q1", 1)?.journalText).toBe("Middle");
    expect(client.getQuestStage("q1", 99)).toBeUndefined();
    expect(client.getQuestStage("missing", 0)).toBeUndefined();
  });

  it("getAll* helpers return arrays of registry values", async () => {
    const data = registries({
      skill: {
        wc: { id: "wc", name: "Woodcutting" } as never,
        min: { id: "min", name: "Mining" } as never,
      },
      spell: { fire: { id: "fire", name: "Fire" } as never },
      quest: { q1: { id: "q1", name: "Q1" } as never },
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => data,
    } as unknown as Response) as unknown as typeof fetch;

    const client = new ContentClient();
    await client.load("http://localhost:8080");

    expect(client.getAllSkills()).toHaveLength(2);
    expect(client.getAllSpells()).toHaveLength(1);
    expect(client.getAllQuests()).toHaveLength(1);
  });

  it("getAll* helpers return empty arrays before load", () => {
    const client = new ContentClient();
    expect(client.getAllSkills()).toEqual([]);
    expect(client.getAllSpells()).toEqual([]);
    expect(client.getAllQuests()).toEqual([]);
  });

  it("exposes audio definitions by id and category", async () => {
    const data = registries({
      audio: {
        ui_click: {
          id: "ui_click",
          name: "UI Click",
          category: "ui",
          assetPath: "assets/audio/ui/click.ogg",
          volume: 0.45,
          loop: false,
          fadeMs: 0,
          zoneIds: [],
          fallback: false,
        },
        door_open: {
          id: "door_open",
          name: "Door Open",
          category: "action",
          assetPath: "assets/audio/action/door_open.ogg",
          volume: 0.55,
          loop: false,
          fadeMs: 0,
          zoneIds: [],
          fallback: false,
        },
      },
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => data,
    } as unknown as Response) as unknown as typeof fetch;

    const client = new ContentClient();
    await client.load("http://localhost:8080");

    expect(client.getAudio("ui_click")?.category).toBe("ui");
    expect(client.getAudioByCategory("action")).toHaveLength(1);
    expect(Object.keys(client.getAllAudio())).toEqual(["ui_click", "door_open"]);
  });
});
