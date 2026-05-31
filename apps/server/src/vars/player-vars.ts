import type { EntityId, PlayerVarValue, QuestDef, Requirement, VarDelta } from "@old-town/shared";
import type { VarComponent } from "../ecs/components";
import type { World } from "../ecs/world";
import type { DeltaAccumulator } from "../sim/delta-accumulator";

export type VarRequirement = Extract<Requirement, { kind: "var" }>;
export type QuestStageRequirement = Extract<Requirement, { kind: "quest_stage" }>;
export type QuestVarRef = Pick<QuestDef, "id" | "varPrefix"> | string;

export interface VarMutationContext {
  readonly world: World;
  readonly deltas?: DeltaAccumulator;
}

export function createVarComponent(
  entityId: EntityId,
  initialValues: Readonly<Record<string, PlayerVarValue>> = {},
): VarComponent {
  return {
    entityId,
    values: { ...initialValues },
  };
}

export function getVar(world: World, entityId: EntityId, key: string): PlayerVarValue | undefined {
  return world.getComponent(entityId, "vars")?.values[key];
}

export function getNumberVar(
  world: World,
  entityId: EntityId,
  key: string,
  defaultValue = 0,
): number {
  const value = getVar(world, entityId, key);
  if (value === undefined) {
    return defaultValue;
  }
  assertVarType(key, value, "number");
  return value;
}

export function getBooleanVar(
  world: World,
  entityId: EntityId,
  key: string,
  defaultValue = false,
): boolean {
  const value = getVar(world, entityId, key);
  if (value === undefined) {
    return defaultValue;
  }
  assertVarType(key, value, "boolean");
  return value;
}

export function getStringVar(
  world: World,
  entityId: EntityId,
  key: string,
  defaultValue = "",
): string {
  const value = getVar(world, entityId, key);
  if (value === undefined) {
    return defaultValue;
  }
  assertVarType(key, value, "string");
  return value;
}

export function setVar(
  ctx: VarMutationContext,
  entityId: EntityId,
  key: string,
  value: PlayerVarValue,
): boolean {
  assertNonEmptyVarKey(key);

  const existing = ctx.world.getComponent(entityId, "vars");
  const previousValue = existing?.values[key];
  if (previousValue === value) {
    return false;
  }

  ctx.world.setComponent(entityId, "vars", {
    entityId,
    values: {
      ...(existing?.values ?? {}),
      [key]: value,
    },
  });
  ctx.deltas?.markVarbitDelta({ varId: key, value });
  return true;
}

export function incrementVar(
  ctx: VarMutationContext,
  entityId: EntityId,
  key: string,
  amount = 1,
): number {
  if (!Number.isInteger(amount)) {
    throw new TypeError(`Var increment amount must be an integer: ${amount}`);
  }

  const current = getVar(ctx.world, entityId, key);
  if (current !== undefined) {
    assertVarType(key, current, "number");
  }
  const next = (current ?? 0) + amount;
  setVar(ctx, entityId, key, next);
  return next;
}

export function compareVarRequirement(
  world: World,
  entityId: EntityId,
  requirement: VarRequirement,
): boolean {
  const actual = getVar(world, entityId, requirement.key) ?? defaultValueFor(requirement.value);
  return compareVarValues(actual, requirement.op, requirement.value);
}

export function compareVarValues(
  actual: PlayerVarValue,
  op: VarRequirement["op"],
  expected: PlayerVarValue,
): boolean {
  switch (op) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gte":
      return compareNumbers(actual, expected, op, (a, b) => a >= b);
    case "lte":
      return compareNumbers(actual, expected, op, (a, b) => a <= b);
    case "gt":
      return compareNumbers(actual, expected, op, (a, b) => a > b);
    case "lt":
      return compareNumbers(actual, expected, op, (a, b) => a < b);
  }
}

export function questVarKey(quest: QuestVarRef, name: string): string {
  assertNonEmptyVarKey(name);
  return `quest.${questVarPrefix(quest)}.${name}`;
}

export function questStageVarKey(quest: QuestVarRef): string {
  return questVarKey(quest, "stage");
}

export function questCompletedVarKey(quest: QuestVarRef): string {
  return questVarKey(quest, "completed");
}

export function questCompletionTickVarKey(quest: QuestVarRef): string {
  return questVarKey(quest, "completed_tick");
}

export function questPointTotalVarKey(): string {
  return "quest.points";
}

export function questKillCountVarKey(quest: QuestVarRef, npcId: string): string {
  return questVarKey(quest, `kill.${npcId}`);
}

export function questTalkVarKey(quest: QuestVarRef, npcId: string): string {
  return questVarKey(quest, `talk.${npcId}`);
}

export function questObjectVarKey(quest: QuestVarRef, objectId: string, option: string): string {
  return questVarKey(quest, `object.${objectId}.${option}`);
}

export function questAreaVarKey(quest: QuestVarRef, areaId: string): string {
  return questVarKey(quest, `area.${areaId}`);
}

export function getQuestStage(world: World, entityId: EntityId, quest: QuestVarRef): number {
  return getNumberVar(world, entityId, questStageVarKey(quest), 0);
}

export function setQuestStage(
  ctx: VarMutationContext,
  entityId: EntityId,
  quest: QuestVarRef,
  stage: number,
): boolean {
  if (!Number.isInteger(stage) || stage < 0) {
    throw new TypeError(`Quest stage must be a non-negative integer: ${stage}`);
  }
  return setVar(ctx, entityId, questStageVarKey(quest), stage);
}

export function incrementQuestStage(
  ctx: VarMutationContext,
  entityId: EntityId,
  quest: QuestVarRef,
  amount = 1,
): number {
  return incrementVar(ctx, entityId, questStageVarKey(quest), amount);
}

export function meetsQuestStageRequirement(
  world: World,
  entityId: EntityId,
  requirement: QuestStageRequirement,
  quests: ReadonlyMap<string, QuestVarRef>,
): boolean {
  const quest = quests.get(requirement.questId) ?? requirement.questId;
  return getQuestStage(world, entityId, quest) >= requirement.minStage;
}

export function toVarDeltas(world: World, entityId: EntityId): readonly VarDelta[] {
  const values = world.getComponent(entityId, "vars")?.values;
  if (!values) {
    return [];
  }
  return Object.entries(values)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([varId, value]) => ({ varId, value }));
}

function questVarPrefix(quest: QuestVarRef): string {
  return typeof quest === "string" ? quest : quest.varPrefix;
}

function defaultValueFor(value: PlayerVarValue): PlayerVarValue {
  switch (typeof value) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "string":
      return "";
  }
}

function assertNonEmptyVarKey(key: string): void {
  if (key.trim().length === 0) {
    throw new TypeError("Var key must be non-empty");
  }
}

function assertVarType(
  key: string,
  value: PlayerVarValue,
  expectedType: "number",
): asserts value is number;
function assertVarType(
  key: string,
  value: PlayerVarValue,
  expectedType: "boolean",
): asserts value is boolean;
function assertVarType(
  key: string,
  value: PlayerVarValue,
  expectedType: "string",
): asserts value is string;
function assertVarType(
  key: string,
  value: PlayerVarValue,
  expectedType: "number" | "boolean" | "string",
): void {
  if (typeof value !== expectedType) {
    throw new TypeError(`Var "${key}" is ${typeof value}, not ${expectedType}`);
  }
}

function compareNumbers(
  actual: PlayerVarValue,
  expected: PlayerVarValue,
  op: VarRequirement["op"],
  compare: (actual: number, expected: number) => boolean,
): boolean {
  if (typeof actual !== "number" || typeof expected !== "number") {
    throw new TypeError(`Var comparison "${op}" requires number values`);
  }
  return compare(actual, expected);
}
