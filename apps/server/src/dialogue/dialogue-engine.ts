import type {
  ContentRegistries,
  DialogueDef,
  DialogueNode,
  EntityId,
  NpcDef,
  NpcIntent,
  TileCoord,
  UiActionIntent,
} from "@old-town/shared";
import type { World } from "../ecs/world";
import type { ItemAuditLog } from "../items/item-audit";
import { applyEffects } from "../quests/effects";
import { dispatchQuestEvent } from "../quests/quest-engine";
import { meetsAllRequirements } from "../quests/requirements";
import type { ActionHandler } from "../sim/action-executor";
import { type ActionExecution, ActionQueueType, InterruptGroup } from "../sim/action-queue";
import type { ActionRuntime } from "../sim/action-runtime";
import type { DeltaAccumulator } from "../sim/delta-accumulator";
import { type InteractionTarget, resolveInteraction } from "../systems/interaction-reach";
import { handleMoveIntent } from "../systems/movement-system";
import { npcFootprint } from "../systems/npc-system";
import type { CollisionMap, Footprint } from "../world/collision";

export interface DialogueContext {
  readonly world: World;
  readonly collision: CollisionMap;
  readonly deltas: DeltaAccumulator;
  readonly actionRuntime: ActionRuntime;
  readonly registries: ContentRegistries;
  readonly itemAudit?: ItemAuditLog | undefined;
}

export interface BeginDialogueActionPayload {
  readonly kind: "begin_dialogue";
  readonly npcEntityId: EntityId;
}

export type DialoguePayload = BeginDialogueActionPayload;
export type DialogueKind = DialoguePayload["kind"];
export type DialogueHandlerTable = {
  [K in DialogueKind]: ActionHandler<Extract<DialoguePayload, { kind: K }>>;
};

const TALK_ACTIONS = new Set(["talk"]);
const DIALOGUE_INTERFACE_ID = "dialogue";
const ONE_TILE: Footprint = { width: 1, length: 1 };

function actionId(prefix: string, owner: EntityId): string {
  return `${prefix}:${owner}`;
}

function tileOf(world: World, entityId: EntityId): TileCoord | undefined {
  const position = world.getComponent(entityId, "position");
  return position
    ? { x: position.x, y: position.y, plane: position.plane as TileCoord["plane"] }
    : undefined;
}

function systemMessage(
  deltas: DeltaAccumulator,
  owner: EntityId,
  text: string,
  serverTime: number,
): void {
  deltas.markChat({ entityId: owner, channel: "system", text, serverTime });
}

function dialogueNode(def: DialogueDef, nodeId: string): DialogueNode | undefined {
  return def.nodes.find((node) => node.id === nodeId);
}

function npcDefForEntity(ctx: DialogueContext, npcEntityId: EntityId): NpcDef | undefined {
  const npc = ctx.world.getComponent(npcEntityId, "npc");
  return npc ? ctx.registries.npc.get(npc.npcId) : undefined;
}

function talkOption(def: NpcDef): NpcDef["options"][number] | undefined {
  return def.options.find((option) => TALK_ACTIONS.has(option.actionId));
}

function dialogueTarget(
  ctx: DialogueContext,
  npcEntityId: EntityId,
  npcDef: NpcDef,
): InteractionTarget | undefined {
  const npcTile = tileOf(ctx.world, npcEntityId);
  if (!npcTile) {
    return undefined;
  }
  const option = talkOption(npcDef);
  return {
    origin: npcTile,
    footprint: ctx.world.hasComponent(npcEntityId, "npc")
      ? npcFootprint(ctx, npcEntityId)
      : ONE_TILE,
    requiredDistance: option?.requiredDistance ?? 1,
    faceTarget: option?.faceTarget ?? true,
    ...(option?.requiresLineOfSight !== undefined
      ? { requiresLineOfSight: option.requiresLineOfSight }
      : {}),
  };
}

function enqueueBeginDialogue(ctx: DialogueContext, owner: EntityId, npcEntityId: EntityId): void {
  const payload: BeginDialogueActionPayload = { kind: "begin_dialogue", npcEntityId };
  ctx.actionRuntime.enqueue({
    id: actionId("begin-dialogue", owner),
    owner,
    type: ActionQueueType.Weak,
    delayTicks: 1,
    repeat: { intervalTicks: 1 },
    interruptGroup: InterruptGroup.Dialogue,
    payload,
  });
}

function openDialogueNode(
  ctx: DialogueContext,
  owner: EntityId,
  dialogue: DialogueDef,
  nodeId: string,
  speakerName: string,
  serverTime: number,
  tick?: number,
  speakerEntityId?: EntityId,
): boolean {
  const node = dialogueNode(dialogue, nodeId);
  if (!node) {
    systemMessage(ctx.deltas, owner, "That dialogue is unavailable.", serverTime);
    closeDialogue(ctx, owner);
    return false;
  }
  if (!meetsAllRequirements(ctx, owner, node.requirements)) {
    systemMessage(ctx.deltas, owner, "You cannot continue that dialogue.", serverTime);
    closeDialogue(ctx, owner);
    return false;
  }

  applyEffects(
    {
      world: ctx.world,
      registries: ctx.registries,
      deltas: ctx.deltas,
      itemAudit: ctx.itemAudit,
      itemAuditReason: "quest_effect",
      itemAuditMetadata: { dialogueId: dialogue.id, nodeId: node.id, source: "dialogue_node" },
    },
    owner,
    node.effects,
    serverTime,
    tick,
  );
  ctx.world.setComponent(owner, "dialogue", {
    entityId: owner,
    dialogueId: dialogue.id,
    nodeId: node.id,
    speakerName,
    ...(speakerEntityId !== undefined ? { speakerEntityId } : {}),
  });
  ctx.deltas.markInterfaceOpen({
    interfaceId: DIALOGUE_INTERFACE_ID,
    dialogue: {
      dialogueId: dialogue.id,
      nodeId: node.id,
      speakerName,
      ...(node.npcText !== undefined ? { npcText: node.npcText } : {}),
      options: (node.playerOptions ?? [])
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => meetsAllRequirements(ctx, owner, option.requirements))
        .map(({ option, index }) => ({ index, text: option.text })),
    },
  });
  return true;
}

export function closeDialogue(ctx: DialogueContext, owner: EntityId): void {
  ctx.world.removeComponent(owner, "dialogue");
  ctx.deltas.markInterfaceClose({ interfaceId: DIALOGUE_INTERFACE_ID });
}

export function handleNpcDialogueIntent(
  ctx: DialogueContext,
  owner: EntityId,
  intent: NpcIntent,
  serverTime: number,
  tick?: number,
): boolean {
  return handleNpcDialogue(ctx, owner, intent, serverTime, tick, true);
}

function handleNpcDialogue(
  ctx: DialogueContext,
  owner: EntityId,
  intent: NpcIntent,
  serverTime: number,
  tick: number | undefined,
  queueWhenPathing: boolean,
): boolean {
  if (!TALK_ACTIONS.has(intent.actionId)) {
    return false;
  }
  if (!ctx.world.hasComponent(intent.npcEntityId, "npc")) {
    return false;
  }

  const npcDef = npcDefForEntity(ctx, intent.npcEntityId);
  if (!npcDef?.dialogueId || !talkOption(npcDef)) {
    systemMessage(ctx.deltas, owner, "They have nothing to say.", serverTime);
    return true;
  }
  const dialogue = ctx.registries.dialogue.get(npcDef.dialogueId);
  const actorTile = tileOf(ctx.world, owner);
  const target = dialogueTarget(ctx, intent.npcEntityId, npcDef);
  if (!dialogue || !actorTile || !target) {
    systemMessage(ctx.deltas, owner, "That dialogue is unavailable.", serverTime);
    return true;
  }

  const resolution = resolveInteraction(
    { collision: ctx.collision, deltas: ctx.deltas },
    {
      actor: owner,
      actorTile,
      actorFootprint: ONE_TILE,
      target,
    },
  );
  if (resolution.kind === "ready") {
    dispatchQuestEvent(
      ctx,
      owner,
      { kind: "dialogue", npcId: npcDef.id },
      serverTime,
      tick,
    );
    openDialogueNode(
      ctx,
      owner,
      dialogue,
      dialogue.root,
      npcDef.name,
      serverTime,
      tick,
      intent.npcEntityId,
    );
    return true;
  }
  if (resolution.kind === "path") {
    handleMoveIntent(
      { world: ctx.world, collision: ctx.collision, deltas: ctx.deltas },
      owner,
      { dest: resolution.destination },
      tick !== undefined ? { tick } : {},
    );
    if (queueWhenPathing) {
      enqueueBeginDialogue(ctx, owner, intent.npcEntityId);
    }
    return true;
  }

  systemMessage(ctx.deltas, owner, "You cannot reach them.", serverTime);
  return true;
}

export function handleDialogueUiIntent(
  ctx: DialogueContext,
  owner: EntityId,
  intent: UiActionIntent,
  serverTime: number,
  tick?: number,
): boolean {
  if (intent.action === "dialogue_close") {
    closeDialogue(ctx, owner);
    return true;
  }
  if (intent.action !== "dialogue_option") {
    return false;
  }

  const optionIndex = intent.value;
  if (optionIndex === undefined) {
    systemMessage(ctx.deltas, owner, "That dialogue option is unavailable.", serverTime);
    return true;
  }

  const active = ctx.world.getComponent(owner, "dialogue");
  if (!active || (intent.targetId !== undefined && intent.targetId !== active.dialogueId)) {
    systemMessage(ctx.deltas, owner, "That dialogue is no longer open.", serverTime);
    return true;
  }
  const dialogue = ctx.registries.dialogue.get(active.dialogueId);
  const node = dialogue ? dialogueNode(dialogue, active.nodeId) : undefined;
  const option = node?.playerOptions?.[optionIndex];
  if (!dialogue || !node || !option || !meetsAllRequirements(ctx, owner, option.requirements)) {
    systemMessage(ctx.deltas, owner, "That dialogue option is unavailable.", serverTime);
    return true;
  }

  applyEffects(
    {
      world: ctx.world,
      registries: ctx.registries,
      deltas: ctx.deltas,
      itemAudit: ctx.itemAudit,
      itemAuditReason: "quest_effect",
      itemAuditMetadata: {
        dialogueId: dialogue.id,
        nodeId: node.id,
        optionIndex,
        source: "dialogue_option",
      },
    },
    owner,
    option.effects,
    serverTime,
    tick,
  );
  openDialogueNode(
    ctx,
    owner,
    dialogue,
    option.next,
    active.speakerName,
    serverTime,
    tick,
    active.speakerEntityId,
  );
  return true;
}

export function handleBeginDialogue(
  ctx: DialogueContext,
  action: ActionExecution,
  payload: BeginDialogueActionPayload,
  serverTime: number,
): void {
  const handled = handleNpcDialogue(
    ctx,
    action.entry.owner,
    { npcEntityId: payload.npcEntityId, actionId: "talk" },
    serverTime,
    undefined,
    false,
  );
  if (!handled) {
    ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
    return;
  }
  if (ctx.world.hasComponent(action.entry.owner, "dialogue")) {
    ctx.actionRuntime.cancel(action.entry.owner, { id: action.entry.id });
  }
}

export function createDialogueActionHandlers(ctx: DialogueContext): DialogueHandlerTable {
  return {
    begin_dialogue: (payload, actionCtx) =>
      handleBeginDialogue(ctx, actionCtx.execution, payload, actionCtx.serverTime),
  };
}
