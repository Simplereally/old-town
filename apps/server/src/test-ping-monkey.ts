import { createServer } from "node:http";
import {
  ClientCommandType,
  PROTOCOL_VERSION,
  ServerPacketType,
  TransportClientMessageType,
  type TransportServerPacket,
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

client.send(
  JSON.stringify({
    type: TransportClientMessageType.DevAuth,
    protocolVersion: PROTOCOL_VERSION,
  }),
);
const msg1 = await new Promise<unknown>((resolve) => {
  client.once("message", (data) => resolve(JSON.parse(data.toString())));
});
console.log("msg1", msg1);

// Monkey-patch the transport's send function to log
const origSend = transport.send;
transport.send = (sessionId: string, packet: TransportServerPacket) => {
  console.log("transport.send", sessionId, packet);
  return origSend.call(transport, sessionId, packet);
};

// Also intercept the socket's send on the server side
// We can't easily do that without modifying the source.

client.send(
  JSON.stringify({
    type: ClientCommandType.Ping,
    commandId: 1,
    payload: { clientTimeMs: 123 },
  }),
);
console.log("sent ping");

const msg2 = await new Promise<unknown>((resolve) => {
  client.once("message", (data) => resolve(JSON.parse(data.toString())));
});
console.log("msg2", msg2);

client.close();
console.log("done");
