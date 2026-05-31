import type { BeginDialogueActionPayload, DialogueHandlerTable } from "../dialogue/dialogue-engine";
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
  | TeleportActionPayload;

export type ActionKind = ActionPayload["kind"];

export type ActionHandlerTable = SkillingHandlerTable &
  ResourceNodeHandlerTable &
  SpellHandlerTable &
  DialogueHandlerTable;
