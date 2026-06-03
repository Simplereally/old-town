import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = (server.address() as { port: number }).port;
console.log("listening on", port);

const client = new WebSocket(`ws://127.0.0.1:${port}/ws`);
await new Promise<void>((resolve, reject) => {
  client.once("open", resolve);
  client.once("error", reject);
});
console.log("client open");

client.close();
await new Promise<void>((resolve) => client.once("close", resolve));
console.log("client closed");

await new Promise<void>((resolve) => {
  wss.close(() => {
    console.log("wss closed");
    resolve();
  });
});

await new Promise<void>((resolve) => {
  server.close(() => {
    console.log("server closed callback");
    resolve();
  });
});
console.log("done");
