import { ClientCommandType, parseClientCommand } from "@old-town/shared";

const ping = {
  type: ClientCommandType.Ping,
  commandId: 1,
  payload: { clientTimeMs: 123 },
};
console.log("ping", parseClientCommand(ping));

const malformed = {
  type: ClientCommandType.MoveClick,
  commandId: 2,
  payload: {},
};
console.log("malformed", parseClientCommand(malformed));
