import { createServer } from "node:http";
import { entityId, ServerPacketType } from "@old-town/shared";
import WebSocket from "ws";
import { createWebSocketTransport } from "./net/websocket-transport";

const httpServer = createServer();
const transport = createWebSocketTransport({
  httpServer,
  logger: { debug: () => {}, warn: () => {} },
  getFullState: () => ({
    type: ServerPacketType.FullState,
    protocolVersion: 1,
    tick: 0,
    serverTime: 0,
    selfEntityId: entityId(1),
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

client.close();
await new Promise<void>((resolve) => client.once("close", resolve));
console.log("client closed");

const timeout = (ms: number) =>
  new Promise<void>((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms));

try {
  await Promise.race([transport.close(), timeout(2000)]);
  console.log("transport.close resolved");
} catch (e) {
  console.log("transport.close failed", e);
}

try {
  await Promise.race([
    new Promise<void>((resolve) => httpServer.close(() => resolve())),
    timeout(2000),
  ]);
  console.log("httpServer.close resolved");
} catch (e) {
  console.log("httpServer.close failed", e);
}

console.log("done");
