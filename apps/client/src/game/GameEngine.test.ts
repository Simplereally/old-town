import {
  ClientCommandType,
  entityId,
  type FullStatePacket,
  ServerPacketType,
  type TickDeltaPacket,
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
      dispose: vi.fn(),
    },
    fps: 60,
    running: false,
    onFrame: undefined,
    onResize: undefined,
    tileToWorld: vi.fn((x: number, y: number) => ({ x, y: 0, z: -y })),
    worldToTile: vi.fn((x: number, z: number) => ({ x: Math.floor(x), y: Math.floor(-z) })),
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
  socket: { sendCommand: ReturnType<typeof vi.fn> };
} {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const overlays = createOverlays();
  document.body.appendChild(overlays.status);
  document.body.appendChild(overlays.debug);

  const engine = new GameEngine({
    canvas,
    statusOverlay: overlays.status,
    debugOverlay: overlays.debug,
    serverUrl: "ws://localhost:8080/ws",
  });

  // Get the mocked socket
  const socket = (engine as unknown as Record<string, unknown>).socket as {
    sendCommand: ReturnType<typeof vi.fn>;
  };

  return { engine, canvas, overlays, socket };
}

function createFullStatePacket(): FullStatePacket {
  return {
    type: ServerPacketType.FullState,
    protocolVersion: 1,
    tick: 1,
    serverTime: 600,
    selfEntityId: entityId(42),
    entities: [],
  };
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

describe("GameEngine entity picking and context menu", () => {
  let engine: ReturnType<typeof createEngine>["engine"];
  let canvas: HTMLCanvasElement;
  let socket: { sendCommand: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const created = createEngine();
    engine = created.engine;
    canvas = created.canvas;
    socket = created.socket;
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;
  });

  it("sends NpcOption on left-click NPC", () => {
    const mockEntity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => mockEntity,
    );

    const clickEvent = new MouseEvent("click", { clientX: 400, clientY: 300, bubbles: true });
    canvas.dispatchEvent(clickEvent);

    expect(socket.sendCommand).toHaveBeenCalled();
    const calls = socket.sendCommand.mock.calls as unknown[][];
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(call.type).toBe(ClientCommandType.NpcOption);
    expect((call.payload as Record<string, unknown>).actionId).toBe("talk");
    expect((call.payload as Record<string, unknown>).npcEntityId).toBe(10);
  });

  it("sends ObjectOption on left-click object (fallback when content empty)", () => {
    const mockEntity = { entityId: 20, kind: "object" as const, defId: "tree_oak", distance: 1 };
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => mockEntity,
    );

    const clickEvent = new MouseEvent("click", { clientX: 400, clientY: 300, bubbles: true });
    canvas.dispatchEvent(clickEvent);

    expect(socket.sendCommand).toHaveBeenCalled();
    const calls = socket.sendCommand.mock.calls as unknown[][];
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(call.type).toBe(ClientCommandType.ObjectOption);
    expect((call.payload as Record<string, unknown>).actionId).toBe("use");
    expect((call.payload as Record<string, unknown>).objectEntityId).toBe(20);
  });

  it("sends GroundItemOption on left-click ground item", () => {
    const mockEntity = {
      entityId: 30,
      kind: "groundItem" as const,
      itemId: "coins",
      quantity: 5,
      distance: 1,
    };
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => mockEntity,
    );

    const clickEvent = new MouseEvent("click", { clientX: 400, clientY: 300, bubbles: true });
    canvas.dispatchEvent(clickEvent);

    expect(socket.sendCommand).toHaveBeenCalled();
    const calls = socket.sendCommand.mock.calls as unknown[][];
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(call.type).toBe(ClientCommandType.GroundItemOption);
    expect((call.payload as Record<string, unknown>).actionId).toBe("pickup");
    expect((call.payload as Record<string, unknown>).groundItemEntityId).toBe(30);
  });

  it("sends MoveClick on left-click player (default)", () => {
    engine.actors.spawn(entityId(42), { x: 30, y: 32, plane: 0 }, "hero", true, "player");
    const mockEntity = { entityId: 42, kind: "player" as const, defId: "hero", distance: 1 };
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => mockEntity,
    );

    const clickEvent = new MouseEvent("click", { clientX: 400, clientY: 300, bubbles: true });
    canvas.dispatchEvent(clickEvent);

    expect(socket.sendCommand).toHaveBeenCalled();
    const calls = socket.sendCommand.mock.calls as unknown[][];
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(call.type).toBe(ClientCommandType.MoveClick);
  });

  it("shows context menu on right-click", () => {
    const mockEntity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => mockEntity,
    );
    const contextMenu = asEngine(engine).contextMenu as {
      show: ReturnType<typeof vi.fn>;
      visible: boolean;
    };
    contextMenu.show = vi.fn();

    const rightClickEvent = new MouseEvent("contextmenu", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(rightClickEvent);

    expect(contextMenu.show).toHaveBeenCalled();
  });

  it("sends NpcOption from context menu click", () => {
    const mockEntity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => mockEntity,
    );
    (
      asEngine(engine)._inputInterpreter as { getContextMenuOptions: ReturnType<typeof vi.fn> }
    ).getContextMenuOptions = vi.fn(() => [{ label: "Attack", actionId: "attack", priority: 1 }]);

    const rightClickEvent = new MouseEvent("contextmenu", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(rightClickEvent);

    const attackItem = Array.from(document.querySelectorAll(".context-menu-item")).find((el) =>
      el.textContent?.includes("Attack"),
    );
    expect(attackItem).toBeDefined();
    (attackItem as HTMLDivElement)?.click();

    expect(socket.sendCommand).toHaveBeenCalled();
    const calls = socket.sendCommand.mock.calls as unknown[][];
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(call.type).toBe(ClientCommandType.NpcOption);
    expect((call.payload as Record<string, unknown>).actionId).toBe("attack");
    expect((call.payload as Record<string, unknown>).npcEntityId).toBe(10);
  });

  it("sends ObjectOption from context menu click", () => {
    const mockEntity = { entityId: 20, kind: "object" as const, defId: "rock_copper", distance: 1 };
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => mockEntity,
    );
    (
      asEngine(engine)._inputInterpreter as { getContextMenuOptions: ReturnType<typeof vi.fn> }
    ).getContextMenuOptions = vi.fn(() => [{ label: "Mine", actionId: "mine", priority: 1 }]);

    const rightClickEvent = new MouseEvent("contextmenu", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(rightClickEvent);

    const mineItem = Array.from(document.querySelectorAll(".context-menu-item")).find((el) =>
      el.textContent?.includes("Mine"),
    );
    expect(mineItem).toBeDefined();
    (mineItem as HTMLDivElement)?.click();

    expect(socket.sendCommand).toHaveBeenCalled();
    const calls = socket.sendCommand.mock.calls as unknown[][];
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(call.type).toBe(ClientCommandType.ObjectOption);
    expect((call.payload as Record<string, unknown>).actionId).toBe("mine");
    expect((call.payload as Record<string, unknown>).objectEntityId).toBe(20);
  });

  it("sends GroundItemOption from context menu click", () => {
    const mockEntity = {
      entityId: 30,
      kind: "groundItem" as const,
      itemId: "sword",
      quantity: 1,
      distance: 1,
    };
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => mockEntity,
    );
    (
      asEngine(engine)._inputInterpreter as { getContextMenuOptions: ReturnType<typeof vi.fn> }
    ).getContextMenuOptions = vi.fn(() => [{ label: "Pick up", actionId: "pickup", priority: 1 }]);

    const rightClickEvent = new MouseEvent("contextmenu", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(rightClickEvent);

    const pickupItem = Array.from(document.querySelectorAll(".context-menu-item")).find((el) =>
      el.textContent?.includes("Pick up"),
    );
    expect(pickupItem).toBeDefined();
    (pickupItem as HTMLDivElement)?.click();

    expect(socket.sendCommand).toHaveBeenCalled();
    const calls = socket.sendCommand.mock.calls as unknown[][];
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(call.type).toBe(ClientCommandType.GroundItemOption);
    expect((call.payload as Record<string, unknown>).actionId).toBe("pickup");
    expect((call.payload as Record<string, unknown>).groundItemEntityId).toBe(30);
  });

  it("sends MoveClick from Walk here context menu click", () => {
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => null,
    );
    (
      asEngine(engine)._inputInterpreter as { getContextMenuOptions: ReturnType<typeof vi.fn> }
    ).getContextMenuOptions = vi.fn(() => [
      { label: "Walk here", actionId: "walk_here", priority: 0 },
    ]);

    const rightClickEvent = new MouseEvent("contextmenu", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(rightClickEvent);

    const walkItem = Array.from(document.querySelectorAll(".context-menu-item")).find((el) =>
      el.textContent?.includes("Walk here"),
    );
    expect(walkItem).toBeDefined();
    (walkItem as HTMLDivElement)?.click();

    expect(socket.sendCommand).toHaveBeenCalled();
    const calls = socket.sendCommand.mock.calls as unknown[][];
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(call.type).toBe(ClientCommandType.MoveClick);
    const dest = (call.payload as Record<string, unknown>).dest as Record<string, unknown>;
    expect(dest.x).toBe(30);
    expect(dest.y).toBe(32);
  });

  it("does not block render loop with context menu", () => {
    const mockEntity = { entityId: 10, kind: "npc" as const, defId: "guard", distance: 1 };
    (asEngine(engine) as { _pickEntityAt: ReturnType<typeof vi.fn> })._pickEntityAt = vi.fn(
      () => mockEntity,
    );

    const rightClickEvent = new MouseEvent("contextmenu", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(rightClickEvent);

    const onFrame = asEngine(engine).renderer as { onFrame: (d: number, e: number) => void };
    expect(() => onFrame.onFrame(16, 1000)).not.toThrow();
  });
});

describe("GameEngine click-to-move", () => {
  let engine: ReturnType<typeof createEngine>["engine"];
  let canvas: HTMLCanvasElement;
  let socket: { sendCommand: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockCanvasContext();
    const created = createEngine();
    engine = created.engine;
    canvas = created.canvas;
    socket = created.socket;
  });

  it("sends MoveClickCommand on canvas click", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const clickEvent = new MouseEvent("click", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(clickEvent);

    expect(socket.sendCommand).toHaveBeenCalled();
    const calls = socket.sendCommand.mock.calls as unknown[][];
    expect(calls.length).toBeGreaterThan(0);
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(call.type).toBe(ClientCommandType.MoveClick);
    expect(call.payload).toBeDefined();
    expect(typeof (call.payload as Record<string, unknown>).dest).toBe("object");
    expect(
      typeof ((call.payload as Record<string, unknown>).dest as Record<string, unknown>).x,
    ).toBe("number");
    expect(
      typeof ((call.payload as Record<string, unknown>).dest as Record<string, unknown>).y,
    ).toBe("number");
    expect(call.commandId).toBeGreaterThan(0);
  });

  it("sends correct tile coordinate in MoveClickCommand", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const clickEvent = new MouseEvent("click", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(clickEvent);

    const calls = socket.sendCommand.mock.calls as unknown[][];
    expect(calls.length).toBeGreaterThan(0);
    const call = (calls[0] as unknown[])[0] as Record<string, unknown>;
    const dest = (call.payload as Record<string, unknown>).dest as Record<string, unknown>;
    expect(dest.x).toBe(30);
    expect(dest.y).toBe(32);
  });

  it("does not send command when not connected", () => {
    const clickEvent = new MouseEvent("click", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(clickEvent);

    expect(socket.sendCommand).not.toHaveBeenCalled();
  });

  it("handles debug paths from tick delta", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());

    const tickDelta: TickDeltaPacket = {
      ...createTickDeltaPacket(2),
      debug: {
        paths: [
          {
            entityId: entityId(42),
            path: [
              { x: 30, y: 32, plane: 0 },
              { x: 31, y: 32, plane: 0 },
            ],
          },
        ],
      },
    };

    (asEngine(engine)._handleTickDelta as (d: TickDeltaPacket) => void)(tickDelta);

    expect(engine.debug).toBeDefined();
  });

  it("logs rejected move when debug path is empty", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const clickEvent = new MouseEvent("click", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(clickEvent);

    const tickDelta: TickDeltaPacket = {
      ...createTickDeltaPacket(2),
      debug: {
        paths: [{ entityId: entityId(42), path: [] }],
      },
    };

    (asEngine(engine)._handleTickDelta as (d: TickDeltaPacket) => void)(tickDelta);

    const debugLog = document.getElementById("debug-log");
    expect(debugLog?.children.length).toBeGreaterThan(0);
    const lastEntry = debugLog?.children[debugLog.children.length - 1] as HTMLDivElement;
    expect(lastEntry.textContent).toContain("Move rejected");
  });

  it("increments commandId for each click", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const clickEvent1 = new MouseEvent("click", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(clickEvent1);

    const clickEvent2 = new MouseEvent("click", {
      clientX: 500,
      clientY: 400,
      bubbles: true,
    });
    canvas.dispatchEvent(clickEvent2);

    expect(socket.sendCommand).toHaveBeenCalledTimes(2);
    const calls = socket.sendCommand.mock.calls as unknown[][];
    expect(calls.length).toBe(2);
    const call1 = (calls[0] as unknown[])[0] as Record<string, unknown>;
    const call2 = (calls[1] as unknown[])[0] as Record<string, unknown>;
    expect(call2.commandId).toBe((call1.commandId as number) + 1);
  });

  it("cancels spell target mode on Escape key", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const engineWithMethods = asEngine(engine) as {
      enterSpellTargetMode: (spellId: string) => void;
      _spellTargetMode: { spellId: string } | undefined;
    };
    engineWithMethods.enterSpellTargetMode("wind_strike");
    expect(engineWithMethods._spellTargetMode).toBeDefined();

    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(escapeEvent);

    expect(engineWithMethods._spellTargetMode).toBeUndefined();
  });

  it("sends spell command when clicking in spell target mode", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    asEngine(engine)._connected = true;

    const engineWithMethods = asEngine(engine) as {
      enterSpellTargetMode: (spellId: string) => void;
    };
    engineWithMethods.enterSpellTargetMode("wind_strike");

    const clickEvent = new MouseEvent("click", {
      clientX: 400,
      clientY: 300,
      bubbles: true,
    });
    canvas.dispatchEvent(clickEvent);

    expect(socket.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ClientCommandType.CastSpell,
        payload: expect.objectContaining({ spellId: "wind_strike" }),
      }),
    );
  });

  it("shows chat overhead bubble for public chat messages", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());
    engine.actors.spawn(entityId(42), { x: 30, y: 32, plane: 0 }, "hero", true, "player");

    const tickDelta: TickDeltaPacket = {
      ...createTickDeltaPacket(2),
      chat: [
        {
          entityId: entityId(42),
          name: "hero",
          text: "Hello world!",
          channel: "public",
          serverTime: 1200,
        },
      ],
    };

    (asEngine(engine)._handleTickDelta as (d: TickDeltaPacket) => void)(tickDelta);

    expect(engine.chatOverhead.bubbleCount).toBe(1);
  });

  it("does not show chat overhead for system messages", () => {
    (asEngine(engine)._handleFullState as (s: FullStatePacket) => void)(createFullStatePacket());

    const tickDelta: TickDeltaPacket = {
      ...createTickDeltaPacket(2),
      chat: [
        {
          text: "Server restart in 5 minutes",
          channel: "system",
          serverTime: 1200,
        },
      ],
    };

    (asEngine(engine)._handleTickDelta as (d: TickDeltaPacket) => void)(tickDelta);

    expect(engine.chatOverhead.bubbleCount).toBe(0);
  });
});
