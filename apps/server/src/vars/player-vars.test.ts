import { entityId } from "@old-town/shared";
import { describe, expect, it } from "vitest";
import { createWorld, type World } from "../ecs/world";
import { DeltaAccumulator } from "../sim/delta-accumulator";
import {
  compareVarRequirement,
  createVarComponent,
  getBooleanVar,
  getNumberVar,
  getQuestStage,
  getStringVar,
  getVar,
  incrementQuestStage,
  incrementVar,
  meetsQuestStageRequirement,
  questCompletedVarKey,
  questStageVarKey,
  setQuestStage,
  setVar,
  toVarDeltas,
  type VarRequirement,
} from "./player-vars";

const PLAYER = entityId(0);

function createTestWorld(): { readonly world: World; readonly deltas: DeltaAccumulator } {
  const world = createWorld();
  const player = world.createEntity();
  expect(player).toBe(PLAYER);
  return { world, deltas: new DeltaAccumulator() };
}

describe("player vars", () => {
  it("stores typed values and emits coalesced deltas", () => {
    const { world, deltas } = createTestWorld();

    expect(setVar({ world, deltas }, PLAYER, "quest.smoke.stage", 1)).toBe(true);
    expect(setVar({ world, deltas }, PLAYER, "quest.smoke.started", true)).toBe(true);
    expect(setVar({ world, deltas }, PLAYER, "quest.smoke.speaker", "baker")).toBe(true);
    expect(setVar({ world, deltas }, PLAYER, "quest.smoke.stage", 2)).toBe(true);

    expect(getVar(world, PLAYER, "quest.smoke.stage")).toBe(2);
    expect(getNumberVar(world, PLAYER, "quest.smoke.stage")).toBe(2);
    expect(getBooleanVar(world, PLAYER, "quest.smoke.started")).toBe(true);
    expect(getStringVar(world, PLAYER, "quest.smoke.speaker")).toBe("baker");
    expect(deltas.consume(1, 600).varbitDelta).toEqual([
      { varId: "quest.smoke.speaker", value: "baker" },
      { varId: "quest.smoke.stage", value: 2 },
      { varId: "quest.smoke.started", value: true },
    ]);
  });

  it("uses typed defaults for missing vars without creating storage", () => {
    const { world } = createTestWorld();

    expect(getNumberVar(world, PLAYER, "missing.number")).toBe(0);
    expect(getBooleanVar(world, PLAYER, "missing.boolean")).toBe(false);
    expect(getStringVar(world, PLAYER, "missing.string")).toBe("");
    expect(world.hasComponent(PLAYER, "vars")).toBe(false);

    expect(
      compareVarRequirement(world, PLAYER, {
        kind: "var",
        key: "missing.number",
        op: "eq",
        value: 0,
      }),
    ).toBe(true);
    expect(
      compareVarRequirement(world, PLAYER, {
        kind: "var",
        key: "missing.boolean",
        op: "eq",
        value: false,
      }),
    ).toBe(true);
    expect(
      compareVarRequirement(world, PLAYER, {
        kind: "var",
        key: "missing.string",
        op: "eq",
        value: "",
      }),
    ).toBe(true);
  });

  it("increments numeric vars and rejects type mismatches", () => {
    const { world, deltas } = createTestWorld();

    expect(incrementVar({ world, deltas }, PLAYER, "quest.smoke.logs")).toBe(1);
    expect(incrementVar({ world, deltas }, PLAYER, "quest.smoke.logs", 2)).toBe(3);
    expect(getNumberVar(world, PLAYER, "quest.smoke.logs")).toBe(3);

    setVar({ world }, PLAYER, "quest.smoke.started", true);
    expect(() => incrementVar({ world }, PLAYER, "quest.smoke.started")).toThrow(/not number/);
    expect(() => getStringVar(world, PLAYER, "quest.smoke.started")).toThrow(/not string/);
  });

  it("compares typed var requirements", () => {
    const { world } = createTestWorld();
    setVar({ world }, PLAYER, "quest.smoke.stage", 2);
    setVar({ world }, PLAYER, "quest.smoke.started", true);
    setVar({ world }, PLAYER, "quest.smoke.speaker", "baker");

    const requirements: readonly [VarRequirement, boolean][] = [
      [{ kind: "var", key: "quest.smoke.stage", op: "gte", value: 2 }, true],
      [{ kind: "var", key: "quest.smoke.stage", op: "lt", value: 2 }, false],
      [{ kind: "var", key: "quest.smoke.started", op: "eq", value: true }, true],
      [{ kind: "var", key: "quest.smoke.speaker", op: "neq", value: "guard" }, true],
    ];

    for (const [requirement, expected] of requirements) {
      expect(compareVarRequirement(world, PLAYER, requirement)).toBe(expected);
    }

    expect(() =>
      compareVarRequirement(world, PLAYER, {
        kind: "var",
        key: "quest.smoke.speaker",
        op: "gte",
        value: "baker",
      }),
    ).toThrow(/requires number/);
  });

  it("provides quest-stage key helpers and snapshots", () => {
    const { world, deltas } = createTestWorld();
    const quest = { id: "smoke_over_old_town", varPrefix: "smoke_over_old_town" };
    const quests = new Map([[quest.id, quest]]);

    world.setComponent(
      PLAYER,
      "vars",
      createVarComponent(PLAYER, { [questCompletedVarKey(quest)]: false }),
    );
    expect(questStageVarKey(quest)).toBe("quest.smoke_over_old_town.stage");
    expect(setQuestStage({ world, deltas }, PLAYER, quest, 2)).toBe(true);
    expect(incrementQuestStage({ world, deltas }, PLAYER, quest)).toBe(3);
    expect(getQuestStage(world, PLAYER, quest)).toBe(3);
    expect(
      meetsQuestStageRequirement(
        world,
        PLAYER,
        { kind: "quest_stage", questId: quest.id, minStage: 3 },
        quests,
      ),
    ).toBe(true);

    expect(toVarDeltas(world, PLAYER)).toEqual([
      { varId: "quest.smoke_over_old_town.completed", value: false },
      { varId: "quest.smoke_over_old_town.stage", value: 3 },
    ]);
    expect(deltas.peek().varbitDelta).toEqual([
      { varId: "quest.smoke_over_old_town.stage", value: 3 },
    ]);
  });
});
