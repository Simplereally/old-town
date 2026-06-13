import { createServer } from "node:http";
import {
  ClientCommandType,
  PROTOCOL_VERSION,
  ServerPacketType,
  TransportClientMessageType,
} from "@old-town/shared";
import WebSocket from "ws";
import { createWebSocketTransport } from "./net/websocket-transport";

const httpServer = createServer();
const transport = createWebSocketTransport({
  httpServer,
  logger: { debug: () => {}, warn: () => {} },
  getFullState: () => ({
    type: ServerPacketType.FullState,
    protocolVersion: PROTOCOL_VERSION,
    tick: 0,
    serverTime: 0,
    selfEntityId: 1,
    entities: [],
  }),
});
await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
const port = (httpServer.address() as { port: number }).port;
const url = `ws://127.0.0.1:${port}${transport.path}`;

const socket = new WebSocket(url);
await new Promise<void>((resolve, reject) => {
  socket.once("open", resolve);
  socket.once("error", reject);
});
console.log("socket open");

socket.send(
  JSON.stringify({
    type: TransportClientMessageType.DevAuth,
    protocolVersion: PROTOCOL_VERSION,
  }),
);
const msg1 = await new Promise<unknown>((resolve) => {
  socket.once("message", (data) => resolve(JSON.parse(data.toString())));
});
console.log("msg1", msg1);

socket.send(
  JSON.stringify({
    type: ClientCommandType.Ping,
    commandId: 1,
    payload: { clientTimeMs: 123 },
  }),
);
const msg2 = await new Promise<unknown>((resolve) => {
  socket.once("message", (data) => resolve(JSON.parse(data.toString())));
});
console.log("msg2", msg2);

socket.close();
console.log("done");
