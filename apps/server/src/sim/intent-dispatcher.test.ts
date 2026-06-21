import { type ContentRegistries, createRng } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld } from "../ecs/world";
import { ChatSystem } from "../systems/chat-system";
import { ConsumableSystem } from "../systems/consumable-system";
import { makeRegistries } from "../test-support/registries";
import { CollisionMap } from "../world/collision";
import { createRuntimeMap } from "../world/runtime-map";
import { ActionQueue, ActionQueueType, InterruptGroup } from "./action-queue";
import { type ConsumedCommandGroup, IntentKind } from "./command-buffer";
import { DeltaAccumulator } from "./delta-accumulator";
import { dispatchIntentGroup } from "./intent-dispatcher";

function setup() {
  const world = createWorld();
  const player = world.createEntity();
  world.setComponent(player, "position", { entityId: player, x: 0, y: 0, plane: 0 });
  world.setComponent(player, "actor", {
    entityId: player,
    name: "Test",
    level: 1,
    appearanceId: "test",
  });

  const collision = new CollisionMap(createRuntimeMap());
  const deltas = new DeltaAccumulator();
  const actionQueue = new ActionQueue();
  const chatSystem = new ChatSystem();
  const consumableSystem = new ConsumableSystem();
  const registries: ContentRegistries = makeRegistries();

  const ctx = {
    world,
    collision,
    deltas,
    actionQueue,
    registries,
    rng: createRng(1),
    chatSystem,
    consumableSystem,
  };

  return {
    world,
    player,
    collision,
    deltas,
    actionQueue,
    chatSystem,
    consumableSystem,
    registries,
    ctx,
  };
}

function makeGroup(owner: number, intents: ConsumedCommandGroup["intents"]): ConsumedCommandGroup {
  return { ownerEntityId: owner as unknown as import("@old-town/shared").EntityId, intents };
}

describe("IntentDispatcher", () => {
  it("move intent cancels weak actions for the owner", () => {
    const { ctx, player, actionQueue } = setup();
    actionQueue.enqueue({
      id: "woodcutting",
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 4,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "test" },
    });

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Move,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { dest: { x: 1, y: 0, plane: 0 } },
        },
      ]),
      1,
      600,
    );

    expect(actionQueue.getDebugState()).toEqual([]);
  });

  it("item intent cancels weak actions for the owner", () => {
    const { ctx, player, actionQueue } = setup();
    actionQueue.enqueue({
      id: "woodcutting",
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 4,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "test" },
    });

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Item,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { itemUid: 1, actionId: "examine" },
        },
      ]),
      1,
      600,
    );

    expect(actionQueue.getDebugState()).toEqual([]);
  });

  it("ui unequip intent cancels weak actions for the owner", () => {
    const { ctx, player, actionQueue } = setup();
    actionQueue.enqueue({
      id: "woodcutting",
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 4,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "test" },
    });

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.UiAction,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { action: "unequip", value: 0 },
        },
      ]),
      1,
      600,
    );

    expect(actionQueue.getDebugState()).toEqual([]);
  });

  it("object intent emits explicit feedback and cancels weak actions", () => {
    const { ctx, player, actionQueue, deltas } = setup();
    actionQueue.enqueue({
      id: "woodcutting",
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 4,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "test" },
    });

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Object,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { objectEntityId: player, actionId: "woodcut" },
        },
      ]),
      1,
      600,
    );

    expect(actionQueue.getDebugState()).toEqual([]);
    const packet = deltas.consume(1, 600);
    expect(packet.chat?.[0]?.text).toBe("Nothing interesting happens.");
    expect(packet.chat?.[0]?.channel).toBe("system");
  });

  it("npc intent emits explicit feedback and cancels weak actions", () => {
    const { ctx, player, actionQueue, deltas } = setup();
    actionQueue.enqueue({
      id: "woodcutting",
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 4,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "test" },
    });

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Npc,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { npcEntityId: player, actionId: "talk" },
        },
      ]),
      1,
      600,
    );

    expect(actionQueue.getDebugState()).toEqual([]);
    const packet = deltas.consume(1, 600);
    expect(packet.chat?.[0]?.text).toBe("NPC interaction is not yet implemented.");
  });

  it("ground item intent emits explicit feedback and cancels weak actions", () => {
    const { ctx, player, actionQueue, deltas } = setup();
    actionQueue.enqueue({
      id: "woodcutting",
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 4,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "test" },
    });

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.GroundItem,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { groundItemEntityId: player, actionId: "pickup" },
        },
      ]),
      1,
      600,
    );

    expect(actionQueue.getDebugState()).toEqual([]);
    const packet = deltas.consume(1, 600);
    expect(packet.chat?.[0]?.text).toBe("That item is no longer there.");
    expect(packet.chat?.[0]?.channel).toBe("system");
  });

  it("spell intent routes through spell validation and cancels weak actions", () => {
    const { ctx, player, actionQueue, deltas } = setup();
    actionQueue.enqueue({
      id: "woodcutting",
      owner: player,
      type: ActionQueueType.Weak,
      delayTicks: 4,
      interruptGroup: InterruptGroup.Skilling,
      payload: { kind: "test" },
    });

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Spell,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { spellId: "spell_1", target: { kind: "none" } },
        },
      ]),
      1,
      600,
    );

    expect(actionQueue.getDebugState()).toEqual([]);
    const packet = deltas.consume(1, 600);
    expect(packet.chat?.[0]?.text).toBe("You do not know that spell.");
  });

  it("chat intent submits through chat system", () => {
    const { ctx, player, deltas } = setup();

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Chat,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { text: "Hello world" },
        },
      ]),
      1,
      600,
    );

    const packet = deltas.consume(1, 600);
    expect(packet.chat?.[0]?.text).toBe("Hello world");
    expect(packet.chat?.[0]?.channel).toBe("public");
  });

  it("ping intent is silently ignored", () => {
    const { ctx, player, deltas } = setup();

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Ping,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { clientTimeMs: 0 },
        },
      ]),
      1,
      600,
    );

    const packet = deltas.consume(1, 600);
    expect(packet.chat).toBeUndefined();
  });

  it("rejects NPC option with an invalid actionId not in the NPC definition", () => {
    const world = createWorld();
    const player = world.createEntity();
    world.setComponent(player, "position", { entityId: player, x: 0, y: 0, plane: 0 });
    const npcEntity = world.createEntity();
    world.setComponent(npcEntity, "npc", {
      entityId: npcEntity,
      npcId: "test_npc",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 5,
    });
    const registries = makeRegistries({
      npc: new Map([
        [
          "test_npc",
          {
            id: "test_npc",
            name: "Test NPC",
            size: 1,
            respawnTicks: 10,
            wanderRadius: 0,
            options: [{ label: "Talk", actionId: "talk", priority: 0, requiredDistance: 1 }],
            movementType: "static",
            aggressionMode: "peaceful",
            contractEligible: false,
          } as unknown as import("@old-town/shared").NpcDef,
        ],
      ]),
    });
    const deltas = new DeltaAccumulator();
    const ctx = {
      world,
      collision: new CollisionMap(createRuntimeMap()),
      deltas,
      actionQueue: new ActionQueue(),
      registries,
      rng: createRng(1),
      chatSystem: new ChatSystem(),
      consumableSystem: new ConsumableSystem(),
    };

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Npc,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { npcEntityId: npcEntity, actionId: "hack_server" },
        },
      ]),
      1,
      600,
    );

    const packet = deltas.consume(1, 600);
    expect(packet.chat?.[0]?.text).toBe("Nothing interesting happens.");
  });

  it("allows NPC system actionIds even when not in the NPC definition options", () => {
    const world = createWorld();
    const player = world.createEntity();
    world.setComponent(player, "position", { entityId: player, x: 0, y: 0, plane: 0 });
    const npcEntity = world.createEntity();
    world.setComponent(npcEntity, "npc", {
      entityId: npcEntity,
      npcId: "test_npc",
      brainState: "idle",
      respawnTick: 0,
      wanderRadius: 5,
    });
    const registries = makeRegistries({
      npc: new Map([
        [
          "test_npc",
          {
            id: "test_npc",
            name: "Test NPC",
            size: 1,
            respawnTicks: 10,
            wanderRadius: 0,
            options: [],
            movementType: "static",
            aggressionMode: "peaceful",
            contractEligible: false,
          } as unknown as import("@old-town/shared").NpcDef,
        ],
      ]),
    });
    const deltas = new DeltaAccumulator();
    const ctx = {
      world,
      collision: new CollisionMap(createRuntimeMap()),
      deltas,
      actionQueue: new ActionQueue(),
      registries,
      rng: createRng(1),
      chatSystem: new ChatSystem(),
      consumableSystem: new ConsumableSystem(),
    };

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Npc,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { npcEntityId: npcEntity, actionId: "examine" },
        },
      ]),
      1,
      600,
    );

    const packet = deltas.consume(1, 600);
    const messages = packet.chat ?? [];
    expect(messages.some((m) => m.text === "Nothing interesting happens.")).toBe(false);
  });

  it("rejects object option with an invalid actionId not in the object definition", () => {
    const world = createWorld();
    const player = world.createEntity();
    world.setComponent(player, "position", { entityId: player, x: 0, y: 0, plane: 0 });
    const objectEntity = world.createEntity();
    world.setComponent(objectEntity, "object", {
      entityId: objectEntity,
      objectId: "test_object",
      facing: 0,
      variant: 0,
    });
    const registries = makeRegistries({
      object: new Map([
        [
          "test_object",
          {
            id: "test_object",
            name: "Test Object",
            width: 1,
            length: 1,
            blocksMovement: true,
            blocksLineOfSight: false,
            defaultRotation: 0,
            options: [{ label: "Chop", actionId: "chop", priority: 0, requiredDistance: 1 }],
          } as unknown as import("@old-town/shared").ObjectDef,
        ],
      ]),
    });
    const deltas = new DeltaAccumulator();
    const ctx = {
      world,
      collision: new CollisionMap(createRuntimeMap()),
      deltas,
      actionQueue: new ActionQueue(),
      registries,
      rng: createRng(1),
      chatSystem: new ChatSystem(),
      consumableSystem: new ConsumableSystem(),
    };

    dispatchIntentGroup(
      ctx,
      makeGroup(player, [
        {
          kind: IntentKind.Object,
          ownerEntityId: player,
          connectionId: "c1",
          commandId: 1,
          receivedTick: 0,
          targetTick: 1,
          payload: { objectEntityId: objectEntity, actionId: "hack_server" },
        },
      ]),
      1,
      600,
    );

    const packet = deltas.consume(1, 600);
    expect(packet.chat?.[0]?.text).toBe("Nothing interesting happens.");
  });
});
