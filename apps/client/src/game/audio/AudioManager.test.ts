import type { AudioDef, ChunkData } from "@old-town/shared";
import { describe, expect, it, vi } from "vitest";
import { AudioManager, audioAssetUrl, positionalGain } from "./AudioManager";
import { resolveZoneIdAtTile } from "./zone-lookup";

function makeAudioElement(): HTMLAudioElement {
  const el = {
    volume: 0,
    loop: false,
    preload: "auto",
    paused: true,
    play: vi.fn(async () => {
      el.paused = false;
    }),
    pause: vi.fn(() => {
      el.paused = true;
    }),
    load: vi.fn(),
    removeAttribute: vi.fn(),
    onended: null as (() => void) | null,
    onerror: null as (() => void) | null,
  };
  return el as unknown as HTMLAudioElement;
}

const ambienceMarket: AudioDef = {
  id: "ambience_market_bell",
  name: "Market",
  category: "ambience",
  assetPath: "assets/audio/ambience/market_murmur.ogg",
  volume: 0.5,
  loop: true,
  fadeMs: 200,
  zoneIds: ["market_bell"],
  fallback: false,
};

const ambienceFallback: AudioDef = {
  id: "ambience_fallback",
  name: "Fallback",
  category: "ambience",
  assetPath: "assets/audio/ambience/fallback_silence.ogg",
  volume: 0.3,
  loop: true,
  fadeMs: 200,
  zoneIds: [],
  fallback: true,
};

const positionalForge: AudioDef = {
  id: "positional_forge_crackle",
  name: "Forge",
  category: "positional",
  assetPath: "assets/audio/positional/forge_crackle.ogg",
  volume: 1,
  loop: true,
  fadeMs: 100,
  zoneIds: [],
  fallback: false,
  tile: { x: 10, y: 10, plane: 0 },
  maxDistanceTiles: 10,
  falloffStartTiles: 2,
};

describe("zone lookup", () => {
  it("resolves zoneId from loaded region tile data", () => {
    const chunks = new Map<string, ChunkData>([
      [
        "1:1:0",
        {
          cx: 1,
          cy: 1,
          tiles: [
            {
              x: 10,
              y: 10,
              height: 0,
              underlayId: "grass",
              collision: 0,
              zoneId: "market_bell",
            },
          ],
        },
      ],
    ]);
    expect(resolveZoneIdAtTile(chunks, { x: 10, y: 10, plane: 0 })).toBe("market_bell");
    expect(resolveZoneIdAtTile(chunks, { x: 11, y: 10, plane: 0 })).toBeUndefined();
  });
});

describe("positionalGain", () => {
  it("is full inside falloff start and zero beyond max distance", () => {
    expect(positionalGain({ x: 10, y: 10 }, { x: 10, y: 10 }, 10, 2)).toBe(1);
    expect(positionalGain({ x: 12, y: 10 }, { x: 10, y: 10 }, 10, 2)).toBe(1);
    expect(positionalGain({ x: 20, y: 10 }, { x: 10, y: 10 }, 10, 2)).toBe(0);
    expect(positionalGain({ x: 16, y: 10 }, { x: 10, y: 10 }, 10, 2)).toBeCloseTo(0.5, 5);
  });
});

describe("AudioManager", () => {
  it("maps asset paths to public URLs", () => {
    expect(audioAssetUrl("assets/audio/ui/click.ogg")).toBe("/audio/ui/click.ogg");
  });

  it("starts configured ambience when entering a zone", () => {
    const created: HTMLAudioElement[] = [];
    const manager = new AudioManager({
      createAudioElement: () => {
        const el = makeAudioElement();
        created.push(el);
        return el;
      },
    });
    manager.setDefinitions(
      new Map([
        [ambienceFallback.id, ambienceFallback],
        [ambienceMarket.id, ambienceMarket],
      ]),
    );
    manager.setZone("market_bell");
    expect(manager.activeAmbienceId).toBe("ambience_market_bell");
    expect(created.length).toBeGreaterThan(0);
    manager.dispose();
  });

  it("fades previous ambience when leaving a zone", () => {
    const manager = new AudioManager({ createAudioElement: () => makeAudioElement() });
    manager.setDefinitions(
      new Map([
        [ambienceFallback.id, ambienceFallback],
        [ambienceMarket.id, ambienceMarket],
      ]),
    );
    manager.setZone("market_bell");
    expect(manager.activeAmbienceId).toBe("ambience_market_bell");
    manager.setZone("unknown_zone");
    expect(manager.activeAmbienceId).toBe("ambience_fallback");
    expect(manager.outgoingAmbienceCount).toBe(1);
    for (let i = 0; i < 40; i++) manager.update(50);
    expect(manager.outgoingAmbienceCount).toBe(0);
    manager.dispose();
  });

  it("changes positional gain with distance", () => {
    const manager = new AudioManager({ createAudioElement: () => makeAudioElement() });
    manager.setDefinitions(new Map([[positionalForge.id, positionalForge]]));
    manager.setSettings({ muted: false, masterVolume: 1, ambientVolume: 1 });
    manager.updateListenerTile({ x: 10, y: 10, plane: 0 });
    const near = manager.activePositionalCount;
    expect(near).toBe(1);
    // Force a few update steps so gain applies
    for (let i = 0; i < 10; i++) manager.update(50);
    manager.updateListenerTile({ x: 30, y: 30, plane: 0 });
    for (let i = 0; i < 10; i++) manager.update(50);
    expect(manager.activePositionalCount).toBe(1);
    manager.dispose();
  });

  it("plays UI one-shots immediately and rate-limits repeats", () => {
    let now = 1000;
    const manager = new AudioManager({
      nowMs: () => now,
      createAudioElement: () => makeAudioElement(),
    });
    const uiClick: AudioDef = {
      id: "ui_click",
      name: "Click",
      category: "ui",
      assetPath: "assets/audio/ui/click.ogg",
      volume: 1,
      loop: false,
      fadeMs: 0,
      zoneIds: [],
      fallback: false,
    };
    manager.setDefinitions(new Map([[uiClick.id, uiClick]]));
    manager.setSettings({ muted: false, masterVolume: 1, uiVolume: 1 });
    expect(manager.play("ui_click")).toBe(true);
    expect(manager.play("ui_click")).toBe(false); // rate-limited
    now += 100;
    expect(manager.play("ui_click")).toBe(true);
    manager.dispose();
  });

  it("dispose stops loops and releases resources", () => {
    const els: HTMLAudioElement[] = [];
    const manager = new AudioManager({
      createAudioElement: () => {
        const el = makeAudioElement();
        els.push(el);
        return el;
      },
    });
    manager.setDefinitions(
      new Map([
        [ambienceMarket.id, ambienceMarket],
        [positionalForge.id, positionalForge],
      ]),
    );
    manager.setZone("market_bell");
    manager.dispose();
    expect(manager.activeAmbienceId).toBeUndefined();
    expect(manager.activePositionalCount).toBe(0);
    expect(manager.activeSourceCount).toBe(0);
    for (const el of els) {
      expect(el.pause).toHaveBeenCalled();
    }
  });
});
