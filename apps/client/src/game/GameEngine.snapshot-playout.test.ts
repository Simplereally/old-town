import {
  entityId,
  type FullStatePacket,
  ServerPacketType,
  type TickDeltaPacket,
  type TileCoord,
} from "@old-town/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock ThreeRenderer before importing GameEngine
vi.mock("./renderer/ThreeRenderer", () => {
  const mockScene = { add: vi.fn(), remove: vi.fn(), background: null };
  const mockCamera = {
    position: { set: vi.fn(), copy: vi.fn() },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn(),
    left: -40,
    right: 40,
    top: 40,
    bottom: -40,
  };
  const mockTilePicker = {
    screenToTile: vi.fn(() => ({ x: 30, y: 32 })),
  };
  const mockRenderer = {
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    scene: mockScene,
    camera: mockCamera,
    tilePicker: mockTilePicker,
    gridOverlay: { dispose: vi.fn(), toggle: vi.fn(), visible: false },
    cameraController: {
      controls: { update: vi.fn(), dispose: vi.fn(), target: { copy: vi.fn() } },
      followTarget: vi.fn(),
      dispose: vi.fn(),
    },
    fps: 60,
    running: false,
    onFrame: undefined,
    onResize: undefined,
    debugCounters: vi.fn(() => ({
      fps: 60,
      frameTimeMs: 16,
      drawCalls: 10,
      geometries: 5,
      textures: 2,
    })),
    tileToWorld: vi.fn((x: number, y: number) => ({ x, y: 0, z: y })),
    worldToTile: vi.fn((x: number, z: number) => ({ x: Math.floor(x), y: Math.floor(z) })),
  };
  return {
    ThreeRenderer: vi.fn(() => mockRenderer),
  };
});

// Mock GameSocket
vi.mock("./net/GameSocket", () => {
  return {
    GameSocket: vi.fn(() => ({
      connect: vi.fn(() =>
        Promise.resolve({
          type: ServerPacketType.FullState,
          protocolVersion: 1,
          tick: 1,
          serverTime: 600,
          selfEntityId: 42,
          entities: [],
        }),
      ),
      close: vi.fn(),
      sendCommand: vi.fn(),
      onTickDelta: undefined,
      onClose: undefined,
      onError: undefined,
    })),
  };
});

// Mock requestAnimationFrame
const rafCallbacks = new Set<number>();
let rafId = 0;
global.requestAnimationFrame = vi.fn((_cb: FrameRequestCallback) => {
  rafId += 1;
  rafCallbacks.add(rafId);
  return rafId;
});
global.cancelAnimationFrame = vi.fn((id: number) => {
  rafCallbacks.delete(id);
});

// Mock performance.now
global.performance.now = vi.fn(() => Date.now());

function mockCanvasContext(): void {
  const mockCtx = {
    font: "",
    fillStyle: "",
    textBaseline: "",
    textAlign: "",
    measureText: vi.fn(() => ({ width: 80 })),
    fillRect: vi.fn(),
    fillText: vi.fn(),
  };
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === "canvas") {
      const canvas = originalCreateElement(tagName);
      canvas.getContext = vi.fn((type: string) => {
        if (type === "2d") return mockCtx as unknown as CanvasRenderingContext2D;
        return null;
      }) as unknown as typeof canvas.getContext;
      return canvas;
    }
    return originalCreateElement(tagName);
  }) as typeof document.createElement;
}

// Now import GameEngine
const { GameEngine } = await import("./GameEngine");

beforeEach(() => {
  document.body.innerHTML = "";
});

function createOverlays(): { status: HTMLDivElement; debug: HTMLDivElement } {
  const status = document.createElement("div");
  status.innerHTML = `
    <div id="connection-status"></div>
    <div id="tick-status"></div>
    <div id="fps-status"></div>
  `;
  const debug = document.createElement("div");
  debug.innerHTML = `<div id="debug-stats"></div><div id="debug-log"></div>`;
  return { status, debug };
}

function createEngine(): {
  engine: InstanceType<typeof GameEngine>;
  canvas: HTMLCanvasElement;
  overlays: { status: HTMLDivElement; debug: HTMLDivElement };
} {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const overlays = createOverlays();
  document.body.innerHTML = "";
  document.body.appendChild(overlays.status);
  document.body.appendChild(overlays.debug);

  const engine = new GameEngine({
    canvas,
    statusOverlay: overlays.status,
    debugOverlay: overlays.debug,
    serverUrl: "ws://localhost:8080/ws",
  });

  return { engine, canvas, overlays };
}

function createFullStatePacket(partial: Record<string, unknown> = {}): FullStatePacket {
  return {
    type: ServerPacketType.FullState,
    protocolVersion: 1,
    tick: 1,
    serverTime: 600,
    selfEntityId: entityId(42),
    entities: [],
    ...partial,
  } as unknown as FullStatePacket;
}

function createTickDeltaPacket(tick: number): TickDeltaPacket {
  return {
    type: ServerPacketType.TickDelta,
    tick,
    serverTime: tick * 600,
    entityAdds: [],
    entityRemoves: [],
    entityUpdates: [],
  };
}

function asEngine(e: unknown): Record<string, unknown> {
  return e as Record<string, unknown>;
}

function spawnPlayerEntity(
  engine: InstanceType<typeof GameEngine>,
  id: number,
  tile: TileCoord,
  isLocalPlayer = false,
): void {
  engine.actors.spawn(id, tile, "hero", isLocalPlayer, "player");
}

describe("GameEngine snapshot playout", () => {
  let engine: InstanceType<typeof GameEngine>;
  let _canvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvasContext();
    const created = createEngine();
    engine = created.engine;
    _canvas = created.canvas;
  });

  it("_onFrame passes RAF timestamp to RenderClock.sample", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const sampleSpy = vi.spyOn(engine.renderClock, "sample");
    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;
    onFrame(16, 1, 1500);

    expect(sampleSpy).toHaveBeenCalledWith(1500);
  });

  it("_onFrame samples SnapshotBuffer using renderServerTimeMs", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    // Flush the full-state presentation events so the queue is clean
    (asEngine(engine)._applyPresentationEvents as () => void)();

    const snapshotBuffer = asEngine(engine)._snapshotBuffer as {
      sample: ReturnType<typeof vi.fn>;
    };
    const sampleSpy = vi.spyOn(snapshotBuffer, "sample");

    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;
    onFrame(16, 1, 1500);

    expect(sampleSpy).toHaveBeenCalled();
    const callArg = sampleSpy.mock.calls[0]?.[0] as number;
    // Verify the call arg is the renderServerTimeMs from the clock sample
    const clockSample = engine.renderClock.sample(1500);
    expect(callArg).toBe(clockSample.renderServerTimeMs);
  });

  it("_onFrame applies PresentationSample to RenderTransformCache", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const cache = asEngine(engine)._renderTransformCache as {
      applySample: ReturnType<typeof vi.fn>;
    };
    const applySpy = vi.spyOn(cache, "applySample");

    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;
    onFrame(16, 1, 1500);

    expect(applySpy).toHaveBeenCalled();
    const sampleArg = applySpy.mock.calls[0]?.[0] as {
      mode: string;
      alpha: number;
    };
    expect(sampleArg.mode).toBeDefined();
    expect(typeof sampleArg.alpha).toBe("number");
  });

  it("does not advance server tick when rendering multiple frames between packets", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;

    // Render 5 frames between packets
    onFrame(16, 1, 1000);
    onFrame(16, 1, 1016);
    onFrame(16, 1, 1033);
    onFrame(16, 1, 1050);
    onFrame(16, 1, 1066);

    expect(asEngine(engine)._currentTick).toBe(1);
  });

  it("actor positions are updated from RenderTransformCache on frame", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    // Flush the full-state presentation events so the queue is clean
    (asEngine(engine)._applyPresentationEvents as () => void)();

    spawnPlayerEntity(engine, entityId(42), { x: 10, y: 20, plane: 0 }, true);

    const cache = asEngine(engine)._renderTransformCache as {
      applySample: ReturnType<typeof vi.fn>;
      forEachPresentation: (cb: (p: unknown) => void) => void;
    };

    // Mock the cache to provide a known position
    cache.applySample = vi.fn();
    const mockPresentation = {
      entityId: 42,
      renderX: 15.5,
      renderY: 0,
      renderZ: 25.5,
      heading: 0,
    };
    cache.forEachPresentation = (cb) => cb(mockPresentation);
    (cache as unknown as Record<string, unknown>).getPresentation = vi.fn(() => mockPresentation);

    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;
    onFrame(16, 1, 1000);

    const actor = engine.actors.getActorState(42);
    expect(actor).toBeDefined();
    expect(actor?.visualPosition.x).toBe(15.5);
    expect(actor?.visualPosition.y).toBe(0);
    expect(actor?.visualPosition.z).toBe(25.5);
  });

  it("camera follow uses RenderTransformCache position for self actor", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    spawnPlayerEntity(engine, entityId(42), { x: 10, y: 20, plane: 0 }, true);

    const cache = asEngine(engine)._renderTransformCache as {
      applySample: ReturnType<typeof vi.fn>;
      forEachPresentation: (cb: (p: unknown) => void) => void;
    };

    cache.applySample = vi.fn();
    const mockPresentation = {
      entityId: 42,
      renderX: 12.5,
      renderY: 0,
      renderZ: 22.5,
      heading: 0,
    };
    cache.forEachPresentation = (cb) => cb(mockPresentation);
    (cache as unknown as Record<string, unknown>).getPresentation = vi.fn(() => mockPresentation);

    const followSpy = (
      asEngine(engine).renderer as { cameraController: { followTarget: ReturnType<typeof vi.fn> } }
    ).cameraController.followTarget;

    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;
    onFrame(16, 1, 1000);

    expect(followSpy).toHaveBeenCalled();
    const target = followSpy.mock.calls[followSpy.mock.calls.length - 1]?.[0] as {
      x: number;
      y: number;
      z: number;
    };
    expect(target.x).toBe(12.5);
    expect(target.y).toBe(0);
    expect(target.z).toBe(22.5);
  });

  it("projectiles use renderServerTimeMs for progress", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const projectileLayer = asEngine(engine).projectiles as {
      update: ReturnType<typeof vi.fn>;
    };
    const updateSpy = vi.spyOn(projectileLayer, "update");

    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;
    onFrame(16, 1, 2000);

    // Verify the renderServerTimeMs passed to projectiles.update matches the clock sample
    const clockSample = engine.renderClock.sample(2000);
    expect(updateSpy).toHaveBeenCalledWith(clockSample.renderServerTimeMs);
  });

  it("debug overlay includes snapshot buffer depth", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    // Flush the full-state presentation events so the queue is clean
    (asEngine(engine)._applyPresentationEvents as () => void)();

    spawnPlayerEntity(engine, entityId(42), { x: 10, y: 20, plane: 0 }, true);

    const debugOverlay = document.createElement("div");
    debugOverlay.id = "debug-overlay";
    debugOverlay.classList.add("visible");
    const debugStats = document.createElement("div");
    debugStats.id = "debug-stats";
    debugOverlay.appendChild(debugStats);
    document.body.appendChild(debugOverlay);

    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;
    const updateOverlaySpy = vi.spyOn(
      asEngine(engine) as { _updateOverlay: () => void },
      "_updateOverlay",
    );
    expect(() => onFrame(16, 1, 1000)).not.toThrow();

    // Verify _updateOverlay was actually invoked
    expect(updateOverlaySpy).toHaveBeenCalled();

    // The overlay is deferred and may not be updated in the same tick.
    // Verify that _debugOverlayUpdatePending was set (meaning the overlay was scheduled).
    expect(asEngine(engine)._debugOverlayUpdatePending).toBe(true);

    // Verify _updateOverlay was called with the snapshot/playout parameters
    const lastCall = (updateOverlaySpy.mock.calls as unknown[][])[
      updateOverlaySpy.mock.calls.length - 1
    ];
    expect(lastCall).toBeDefined();
    // _updateOverlay now takes 4 args: clockSample, presentationSample, queueStats, residencyStats
    expect(lastCall?.length).toBe(4);
    expect(lastCall?.[0]).toHaveProperty("renderServerTimeMs");
    expect(lastCall?.[1]).toHaveProperty("mode");
    expect(lastCall?.[1]).toHaveProperty("alpha");
    expect(lastCall?.[2]).toHaveProperty("queued");
    expect(lastCall?.[3]).toHaveProperty("visible");
  });

  it("_onFrame does not call actor position updates from network callbacks", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    // Flush the full-state presentation events so the queue is clean
    (asEngine(engine)._applyPresentationEvents as () => void)();

    spawnPlayerEntity(engine, entityId(42), { x: 0, y: 0, plane: 0 }, true);

    // Directly handle a tick delta without going through the render frame
    const tickDelta: TickDeltaPacket = {
      ...createTickDeltaPacket(2),
      entityUpdates: [
        {
          entityId: entityId(42),
          mask: 0,
          changes: {
            position: { x: 1, y: 0, plane: 0 },
          },
        },
      ],
    };

    (asEngine(engine)._handleTickDelta as (d: TickDeltaPacket) => void)(tickDelta);

    // Before applying presentation events, the actor should still be at the old tile
    const actorBefore = engine.actors.getActorState(42);
    expect(actorBefore).toBeDefined();
    expect(actorBefore?.serverTile).toEqual({ x: 0, y: 0, plane: 0 });

    // After applying presentation events
    (asEngine(engine)._applyPresentationEvents as () => void)();
    const actorAfter = engine.actors.getActorState(42);
    expect(actorAfter).toBeDefined();
    expect(actorAfter?.serverTile).toEqual({ x: 1, y: 0, plane: 0 });
  });

  it("renders smooth movement under jittered 600ms packet sequence", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(
      createFullStatePacket({
        tick: 1,
        serverTime: 600,
        entities: [
          {
            entityId: entityId(99),
            kind: "player",
            tile: { x: 0, y: 0, plane: 0 },
            moveSpeed: "stationary",
            appearance: { name: "Remote" },
          },
        ],
      }),
    );
    asEngine(engine)._connected = true;
    // Apply the full-state spawn events so the actor exists in the renderer
    (asEngine(engine)._applyPresentationEvents as () => void)();

    // Ingest tick deltas with jittered arrival times
    const tickDelta1 = {
      ...createTickDeltaPacket(2),
      entityUpdates: [
        {
          entityId: entityId(99),
          mask: 0,
          changes: { position: { x: 1, y: 0, plane: 0 as const } },
        },
      ],
    };
    const tickDelta2 = {
      ...createTickDeltaPacket(3),
      entityUpdates: [
        {
          entityId: entityId(99),
          mask: 0,
          changes: { position: { x: 2, y: 0, plane: 0 as const } },
        },
      ],
    };

    (asEngine(engine)._handleTickDelta as (d: TickDeltaPacket) => void)(tickDelta1);
    (asEngine(engine)._applyPresentationEvents as () => void)();
    (asEngine(engine)._handleTickDelta as (d: TickDeltaPacket) => void)(tickDelta2);
    (asEngine(engine)._applyPresentationEvents as () => void)();

    // Now simulate multiple render frames
    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;

    // Sync clock first
    engine.renderClock.syncToServer(1, 600, 0);

    const positions: number[] = [];
    for (let i = 0; i < 10; i++) {
      const rafTime = 1200 + i * 16;
      onFrame(16, 1, rafTime);
      const actor = engine.actors.getActorState(99);
      if (actor) {
        positions.push(actor.visualPosition.x);
      }
    }

    expect(positions.length).toBeGreaterThan(0);

    // Positions should be monotonically increasing (smooth movement)
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i] as number).toBeGreaterThanOrEqual(positions[i - 1] as number);
    }

    // Should not have snapped back to origin
    expect(positions[positions.length - 1] as number).toBeGreaterThan(0);
  });

  it("hover highlighter follows cached entity position", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    spawnPlayerEntity(engine, entityId(42), { x: 10, y: 20, plane: 0 }, true);

    const hoverHighlighter = asEngine(engine)._hoverHighlighter as {
      setTargetEntityId: ReturnType<typeof vi.fn>;
      updateFromCache: ReturnType<typeof vi.fn>;
    };
    const updateSpy = vi.spyOn(hoverHighlighter, "updateFromCache");

    const onFrame = (
      asEngine(engine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;
    onFrame(16, 1, 1000);

    expect(updateSpy).toHaveBeenCalled();
    const cacheArg = updateSpy.mock.calls[0]?.[0];
    expect(cacheArg).toBe(asEngine(engine)._renderTransformCache);
  });

  it("presentation mode is empty before any snapshot", () => {
    const created = createEngine();
    const freshEngine = created.engine;
    asEngine(freshEngine)._connected = true;

    const cache = asEngine(freshEngine)._renderTransformCache as {
      applySample: ReturnType<typeof vi.fn>;
    };
    const applySpy = vi.spyOn(cache, "applySample");

    const onFrame = (
      asEngine(freshEngine).renderer as { onFrame: (d: number, e: number, t: number) => void }
    ).onFrame;
    onFrame(16, 1, 1000);

    expect(applySpy).toHaveBeenCalled();
    const sampleArg = applySpy.mock.calls[0]?.[0] as { mode: string };
    expect(sampleArg.mode).toBe("empty");
  });
});
