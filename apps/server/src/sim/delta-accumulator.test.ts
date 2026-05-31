import { EntityUpdateMask, entityId } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { DeltaAccumulator } from "./delta-accumulator";

const player = entityId(1);
const npc = entityId(2);

describe("DeltaAccumulator", () => {
  it("coalesces entity update masks with last-write precedence per field", () => {
    const deltas = new DeltaAccumulator();

    deltas.markEntityUpdate(player, { position: { x: 1, y: 1, plane: 0 } });
    deltas.markEntityUpdate(player, { overheadText: "hello" });
    deltas.markEntityUpdate(player, { position: { x: 2, y: 3, plane: 0 } });

    const packet = deltas.peekPacket(7, 4_200);

    expect(packet.entityUpdates).toHaveLength(1);
    expect(packet.entityUpdates[0]).toEqual({
      entityId: player,
      mask: EntityUpdateMask.POSITION | EntityUpdateMask.OVERHEAD_TEXT,
      changes: {
        position: { x: 2, y: 3, plane: 0 },
        overheadText: "hello",
      },
    });
  });

  it("lets remove override pending updates", () => {
    const deltas = new DeltaAccumulator();

    deltas.markEntityUpdate(npc, { overheadText: "gone soon" });
    deltas.markEntityRemove(npc);

    const packet = deltas.consume(1, 600);

    expect(packet.entityRemoves).toEqual([npc]);
    expect(packet.entityUpdates).toEqual([]);
  });

  it("drops add and update when an entity is added then removed in the same tick", () => {
    const deltas = new DeltaAccumulator();

    deltas.markEntityAdd({
      entityId: npc,
      kind: "npc",
      tile: { x: 4, y: 5, plane: 0 },
      defId: "rat",
    });
    deltas.markEntityUpdate(npc, { overheadText: "spawned" });
    deltas.markEntityRemove(npc);

    const packet = deltas.consume(1, 600);

    expect(packet.entityAdds).toEqual([]);
    expect(packet.entityRemoves).toEqual([]);
    expect(packet.entityUpdates).toEqual([]);
  });

  it("tracks non-entity protocol deltas and coalesces keyed records", () => {
    const deltas = new DeltaAccumulator();

    deltas.markInventoryDelta({
      containerId: "inventory:1",
      changes: [
        { slot: 1, itemId: "logs", quantity: 1 },
        { slot: 1, itemId: "logs", quantity: 2 },
      ],
    });
    deltas.markSkillDelta({ skillId: "woodcutting", level: 1, xp: 10 });
    deltas.markSkillDelta({ skillId: "woodcutting", level: 2, xp: 100 });
    deltas.markVarbitDelta({ varId: "quest.stage", value: 1 });
    deltas.markVarbitDelta({ varId: "quest.started", value: true });
    deltas.markChat({
      entityId: player,
      name: "Tester",
      text: "hi",
      channel: "public",
      serverTime: 1,
    });
    deltas.markHitsplat({ entityId: npc, hitsplat: { amount: 3, type: "damage" } });
    deltas.markXpDrop({ skillId: "woodcutting", amount: 25 });
    deltas.markInterfaceOpen({ interfaceId: "bank" });
    deltas.markInterfaceClose({ interfaceId: "dialogue" });

    const packet = deltas.consume(3, 1_800);

    expect(packet.inventoryDeltas).toEqual([
      {
        containerId: "inventory:1",
        changes: [{ slot: 1, itemId: "logs", quantity: 2 }],
      },
    ]);
    expect(packet.skillDelta).toEqual([{ skillId: "woodcutting", level: 2, xp: 100 }]);
    expect(packet.varbitDelta).toEqual([
      { varId: "quest.stage", value: 1 },
      { varId: "quest.started", value: true },
    ]);
    expect(packet.chat).toHaveLength(1);
    expect(packet.hitsplats).toHaveLength(1);
    expect(packet.xpDrops).toEqual([{ skillId: "woodcutting", amount: 25 }]);
    expect(packet.interfaceOpens).toEqual([{ interfaceId: "bank" }]);
    expect(packet.interfaceCloses).toEqual([{ interfaceId: "dialogue" }]);
  });

  it("does not reset on peek, only on consume", () => {
    const deltas = new DeltaAccumulator();
    deltas.markEntityRemove(player);

    expect(deltas.peekPacket(1, 600).entityRemoves).toEqual([player]);
    expect(deltas.peekPacket(1, 600).entityRemoves).toEqual([player]);
    expect(deltas.consume(1, 600).entityRemoves).toEqual([player]);
    expect(deltas.peekPacket(2, 1_200).entityRemoves).toEqual([]);
  });
});
