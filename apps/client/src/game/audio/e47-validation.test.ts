import type { AudioDef } from "@old-town/shared";
import { describe, expect, it, vi } from "vitest";
import { AudioManager } from "./AudioManager";
import { E47_MAX_ACTIVE_AUDIO_SOURCES, E47_MAX_ONESHOT_SOUNDS } from "./e47-budgets";

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

const ambienceA: AudioDef = {
  id: "ambience_market_bell",
  name: "Market",
  category: "ambience",
  assetPath: "assets/audio/ambience/market_murmur.ogg",
  volume: 0.5,
  loop: true,
  fadeMs: 50,
  zoneIds: ["market_bell"],
  fallback: false,
};

const ambienceB: AudioDef = {
  id: "ambience_foundry_row",
  name: "Foundry",
  category: "ambience",
  assetPath: "assets/audio/ambience/foundry_hum.ogg",
  volume: 0.5,
  loop: true,
  fadeMs: 50,
  zoneIds: ["foundry_row"],
  fallback: false,
};

const ambienceFallback: AudioDef = {
  id: "ambience_fallback",
  name: "Fallback",
  category: "ambience",
  assetPath: "assets/audio/ambience/fallback_silence.ogg",
  volume: 0.3,
  loop: true,
  fadeMs: 50,
  zoneIds: [],
  fallback: true,
};

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

describe("E47 atmosphere validation", () => {
  it("does not accumulate ambience sources across zone changes", () => {
    const manager = new AudioManager({ createAudioElement: () => makeAudioElement() });
    manager.setDefinitions(
      new Map([
        [ambienceA.id, ambienceA],
        [ambienceB.id, ambienceB],
        [ambienceFallback.id, ambienceFallback],
      ]),
    );
    manager.setZone("market_bell");
    manager.setZone("foundry_row");
    manager.setZone("market_bell");
    manager.setZone("foundry_row");
    expect(manager.outgoingAmbienceCount).toBeLessThanOrEqual(3);
    for (let i = 0; i < 60; i++) manager.update(50);
    expect(manager.outgoingAmbienceCount).toBe(0);
    expect(manager.activeAmbienceId).toBe("ambience_foundry_row");
    expect(manager.activeSourceCount).toBeLessThanOrEqual(E47_MAX_ACTIVE_AUDIO_SOURCES);
    manager.dispose();
    expect(manager.activeSourceCount).toBe(0);
  });

  it("enforces the E47 one-shot budget", () => {
    let now = 0;
    const manager = new AudioManager({
      nowMs: () => {
        now += 100;
        return now;
      },
      createAudioElement: () => makeAudioElement(),
    });
    manager.setDefinitions(new Map([[uiClick.id, uiClick]]));
    manager.setSettings({ muted: false, masterVolume: 1, uiVolume: 1 });
    let played = 0;
    for (let i = 0; i < E47_MAX_ONESHOT_SOUNDS + 4; i++) {
      if (manager.play("ui_click")) played++;
    }
    expect(played).toBe(E47_MAX_ONESHOT_SOUNDS);
    expect(manager.activeOneShotCount).toBe(E47_MAX_ONESHOT_SOUNDS);
    manager.dispose();
  });

  it("disposes selection/atmosphere-related audio cleanly", () => {
    const manager = new AudioManager({ createAudioElement: () => makeAudioElement() });
    manager.setDefinitions(
      new Map([
        [ambienceA.id, ambienceA],
        [ambienceFallback.id, ambienceFallback],
      ]),
    );
    manager.setZone("market_bell");
    manager.dispose();
    expect(manager.activeAmbienceId).toBeUndefined();
    expect(manager.activePositionalCount).toBe(0);
    expect(manager.outgoingAmbienceCount).toBe(0);
    expect(manager.activeSourceCount).toBe(0);
  });
});
