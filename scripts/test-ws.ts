import { createServer } from "node:http";
import {
  TransportClientMessageType,
  PROTOCOL_VERSION,
  ServerPacketType,
} from "@old-town/shared";
import WebSocket from "ws";
import { createWebSocketTransport } from "./apps/server/src/net/websocket-transport";

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
  socket.once("open", () => resolve());
  socket.once("error", (error) => reject(error));
});
console.log("open");
socket.send(
  JSON.stringify({
    type: TransportClientMessageType.DevAuth,
    protocolVersion: PROTOCOL_VERSION,
  }),
);
const msg = await new Promise<unknown>((resolve) => {
  socket.once("message", (data) => resolve(JSON.parse(data.toString())));
});
console.log("msg", msg);
socket.close();
await new Promise<void>((resolve) => httpServer.close(() => resolve()));
console.log("done");
