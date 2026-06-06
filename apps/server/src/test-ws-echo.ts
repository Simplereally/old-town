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
    socket.send(data.toString());
  });
});

const client = new WebSocket(`ws://127.0.0.1:${port}/ws`);
await new Promise<void>((resolve, reject) => {
  client.once("open", resolve);
  client.once("error", reject);
});
console.log("client open");

client.send("hello");
const msg = await new Promise<unknown>((resolve) => {
  client.once("message", (data) => resolve(data.toString()));
});
console.log("client received", msg);

client.close();
await new Promise<void>((resolve) => server.close(() => resolve()));
console.log("done");
