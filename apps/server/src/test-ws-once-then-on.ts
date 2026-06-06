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
  socket.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    console.log("server msg", msg);
    if (msg.type === "auth") {
      socket.send(JSON.stringify({ type: "auth_ok" }));
    } else if (msg.type === "ping") {
      socket.send(JSON.stringify({ type: "pong" }));
    }
  });
});

const client = new WebSocket(`ws://127.0.0.1:${port}/ws`);
await new Promise<void>((resolve, reject) => {
  client.once("open", resolve);
  client.once("error", reject);
});
console.log("client open");

client.send(JSON.stringify({ type: "auth" }));
const msg1 = await new Promise<unknown>((resolve) => {
  client.once("message", (data) => resolve(JSON.parse(data.toString())));
});
console.log("msg1", msg1);

await new Promise((resolve) => setTimeout(resolve, 100));

client.send(JSON.stringify({ type: "ping" }));
const msg2 = await new Promise<unknown>((resolve) => {
  const handler = (data: any) => {
    console.log("handler2 called");
    resolve(JSON.parse(data.toString()));
    client.removeListener("message", handler);
  };
  client.on("message", handler);
});
console.log("msg2", msg2);

client.close();
await new Promise<void>((resolve) => server.close(() => resolve()));
console.log("done");
