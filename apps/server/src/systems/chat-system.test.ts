import {
  ACTIVE_SCENE_SIZE,
  EntityUpdateMask,
  ServerPacketType,
  type TickDeltaPacket,
  type TileCoord,
  hasFlag,
} from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { type World, createWorld } from "../ecs/world";
import { DeltaBroadcaster } from "../net/delta-broadcaster";
import { InterestManager } from "../net/interest-manager";
import type { TransportSession } from "../net/websocket-transport";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import { ChatSystem } from "./chat-system";

function tile(x: number, y: number): TileCoord {
  return { x, y, plane: 0 };
}

function createPlayer(world: World, session: TransportSession, at: TileCoord) {
  const entityId = world.createEntity();
  world.stores.position.set(entityId, { entityId, x: at.x, y: at.y, plane: at.plane });
  world.stores.player.set(entityId, {
    entityId,
    accountId: "dev",
    sessionId: session.id,
    interestRadius: ACTIVE_SCENE_SIZE / 2,
  });
  world.stores.actor.set(entityId, {
    entityId,
    name: session.characterId,
    level: 3,
    appearanceId: "dev_player",
  });
  return entityId;
}

function spawn(world: World, entityId: ReturnType<World["createEntity"]>) {
  const position = world.stores.position.get(entityId);
  if (!position) {
    throw new Error(`Missing position for ${entityId}`);
  }
  return {
    entityId,
    kind: "player" as const,
    tile: tile(position.x, position.y),
  };
}

describe("ChatSystem", () => {
  it("emits nearby chat and overhead text while filtering distant listeners", () => {
    const world = createWorld();
    const deltas = new DeltaAccumulator();
    const speakerSession = { id: "speaker", characterId: "Speaker" };
    const nearSession = { id: "near", characterId: "Near" };
    const farSession = { id: "far", characterId: "Far" };
    const speaker = createPlayer(world, speakerSession, tile(0, 0));
    const near = createPlayer(world, nearSession, tile(1, 0));
    const far = createPlayer(world, farSession, tile(1_000, 1_000));
    const sent = new Map<string, TickDeltaPacket>();
    const entityBySession = new Map([
      [nearSession.id, near],
      [farSession.id, far],
    ]);
    const broadcaster = new DeltaBroadcaster({
      world,
      deltas,
      interestManager: new InterestManager(),
      transport: {
        sessions: new Map([
          [nearSession.id, nearSession],
          [farSession.id, farSession],
        ]),
        send: (sessionId, packet) => {
          sent.set(sessionId, packet);
          return true;
        },
      },
      getEntityId: (session) => entityBySession.get(session.id),
    });
    broadcaster.primeSession(nearSession, [spawn(world, speaker), spawn(world, near)]);
    broadcaster.primeSession(farSession, [spawn(world, far)]);

    const result = new ChatSystem().submit(
      { world, deltas },
      speaker,
      { text: " Hello   town " },
      1,
      600,
    );
    expect(result).toMatchObject({ ok: true });
    broadcaster.broadcastTick(1, 600);

    const nearPacket = sent.get(nearSession.id);
    const farPacket = sent.get(farSession.id);
    expect(nearPacket?.chat?.[0]).toMatchObject({
      entityId: speaker,
      name: "Speaker",
      text: "Hello town",
      channel: "public",
    });
    expect(nearPacket?.entityUpdates[0]?.changes.overheadText).toBe("Hello town");
    expect(hasFlag(nearPacket?.entityUpdates[0]?.mask ?? 0, EntityUpdateMask.OVERHEAD_TEXT)).toBe(
      true,
    );
    expect(farPacket).toMatchObject({
      type: ServerPacketType.TickDelta,
      chat: [],
      entityUpdates: [],
    });
  });

  it("rate-limits repeated chat and keeps the profanity hook policy-free", () => {
    const world = createWorld();
    const deltas = new DeltaAccumulator();
    const session = { id: "speaker", characterId: "Speaker" };
    const speaker = createPlayer(world, session, tile(0, 0));
    const chat = new ChatSystem({
      rateLimitTicks: 2,
      profanityFilter: (text) => text.replace("foo", "bar"),
    });

    expect(chat.submit({ world, deltas }, speaker, { text: "foo" }, 1, 600)).toMatchObject({
      ok: true,
      packet: { text: "bar" },
    });
    expect(chat.submit({ world, deltas }, speaker, { text: "again" }, 2, 1_200)).toEqual({
      ok: false,
      reason: "rate_limited",
    });
    expect(chat.submit({ world, deltas }, speaker, { text: "again" }, 3, 1_800)).toMatchObject({
      ok: true,
    });
    expect(deltas.peek().chat?.map((packet) => packet.text)).toEqual(["bar", "again"]);
  });

  it("rejects malformed chat text before creating packets", () => {
    const world = createWorld();
    const deltas = new DeltaAccumulator();
    const session = { id: "speaker", characterId: "Speaker" };
    const speaker = createPlayer(world, session, tile(0, 0));
    const chat = new ChatSystem();

    expect(chat.submit({ world, deltas }, speaker, { text: "   " }, 1, 600)).toEqual({
      ok: false,
      reason: "malformed",
    });
    expect(chat.submit({ world, deltas }, speaker, { text: "hello\nthere" }, 2, 1_200)).toEqual({
      ok: false,
      reason: "malformed",
    });
    expect(deltas.peek().chat).toBeUndefined();
    expect(deltas.peek().entityUpdates).toEqual([]);
  });
});
