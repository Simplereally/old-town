import type { BeginDialogueActionPayload, DialogueHandlerTable } from "../dialogue/dialogue-engine";
import type {
  BeginInteractPayload,
  ObjectInteractionKind,
} from "../systems/object-interaction-router";
import type {
  ResourceNodeHandlerTable,
  ResourceNodeRespawnPayload,
} from "../systems/resource-node-system";
import type {
  BeginGatherActionPayload,
  BeginProcessActionPayload,
  GatherActionPayload,
  ProcessActionPayload,
  SkillingHandlerTable,
} from "../systems/skilling-system";
import type { SpellHandlerTable, TeleportActionPayload } from "../systems/spell-system";

export type ActionPayload =
  | BeginDialogueActionPayload
  | BeginGatherActionPayload
  | GatherActionPayload
  | BeginProcessActionPayload
  | ProcessActionPayload
  | ResourceNodeRespawnPayload
  | TeleportActionPayload
  | BeginInteractPayload;

export type ActionKind = ActionPayload["kind"];

export type ActionHandlerTable = SkillingHandlerTable &
  ResourceNodeHandlerTable &
  SpellHandlerTable &
  DialogueHandlerTable &
  {
    begin_interact: import("../sim/action-executor").ActionHandler<BeginInteractPayload>;
  };
