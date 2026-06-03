import { createServer } from "node:http";
import {
  TransportClientMessageType,
  PROTOCOL_VERSION,
  ServerPacketType,
  ClientCommandType,
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

const client = new WebSocket(url);
await new Promise<void>((resolve, reject) => {
  client.once("open", resolve);
  client.once("error", reject);
});
console.log("client open");

const msgs: unknown[] = [];
client.on("message", (data) => {
  msgs.push(JSON.parse(data.toString()));
  console.log("client received", msgs.length, msgs);
});

client.send(
  JSON.stringify({
    type: TransportClientMessageType.DevAuth,
    protocolVersion: PROTOCOL_VERSION,
  }),
);

await new Promise((resolve) => setTimeout(resolve, 100));

client.send(
  JSON.stringify({
    type: ClientCommandType.Ping,
    commandId: 1,
    payload: { clientTimeMs: 123 },
  }),
);

await new Promise((resolve) => setTimeout(resolve, 500));
console.log("final msgs", msgs);
client.close();
console.log("done");
