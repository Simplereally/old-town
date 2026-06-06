import { createServer } from "node:http";
import WebSocket, { WebSocketServer } from "ws";

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
  console.log("server: connection");
  socket.on("message", (data) => {
    console.log("server: message", data.toString());
  });
  socket.send(JSON.stringify({ type: "msg1" }));
  socket.send(JSON.stringify({ type: "msg2" }));
});

const client = new WebSocket(`ws://127.0.0.1:${port}/ws`);
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

await new Promise((resolve) => setTimeout(resolve, 500));
console.log("final msgs", msgs);
client.close();
await new Promise<void>((resolve) => server.close(() => resolve()));
console.log("done");
