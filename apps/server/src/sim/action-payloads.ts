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

export type ActionPayload =
  | BeginGatherActionPayload
  | GatherActionPayload
  | BeginProcessActionPayload
  | ProcessActionPayload
  | ResourceNodeRespawnPayload;

export type ActionKind = ActionPayload["kind"];

export type ActionHandlerTable = SkillingHandlerTable & ResourceNodeHandlerTable;
