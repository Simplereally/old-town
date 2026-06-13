import { createServer } from "node:http";
import WebSocket, { WebSocketServer, type RawData } from "ws";

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = (server.address() as { port: number }).port;

wss.on("connection", (socket) => {
  socket.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    console.log("server msg", msg);
    if (msg.type === "auth") {
      socket.send(JSON.stringify({ type: "auth_ok" }));
    } else if (msg.type === "ping") {
      socket.send(JSON.stringify({ type: "pong" }));
    } else if (msg.type === "ping2") {
      socket.send(JSON.stringify({ type: "pong2" }));
    }
  });
});

const client = new WebSocket(`ws://127.0.0.1:${port}/ws`);
await new Promise<void>((resolve, reject) => {
  client.once("open", resolve);
  client.once("error", reject);
});
console.log("client open");

// Add listener before any messages
const msgs: unknown[] = [];
const handler = (data: RawData) => {
  msgs.push(JSON.parse(data.toString()));
  console.log("client received", msgs.length, msgs);
};
client.on("message", handler);

client.send(JSON.stringify({ type: "auth" }));
await new Promise((resolve) => setTimeout(resolve, 100));
client.send(JSON.stringify({ type: "ping" }));
await new Promise((resolve) => setTimeout(resolve, 100));

// Remove listener and add a new one
client.removeListener("message", handler);
console.log("removed listener");

const msgs2: unknown[] = [];
const handler2 = (data: RawData) => {
  msgs2.push(JSON.parse(data.toString()));
  console.log("client received2", msgs2.length, msgs2);
};
client.on("message", handler2);
console.log("added listener2");

client.send(JSON.stringify({ type: "ping2" }));
await new Promise((resolve) => setTimeout(resolve, 500));
console.log("final msgs2", msgs2);
client.close();
await new Promise<void>((resolve) => server.close(() => resolve()));
console.log("done");
