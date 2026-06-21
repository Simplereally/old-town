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
  const state = { session: false };
  socket.on("message", async (data, isBinary) => {
    console.log("server: message", data.toString(), isBinary);
    if (!state.session) {
      const auth = JSON.parse(data.toString());
      if (auth.type === "auth") {
        state.session = true;
        socket.send(JSON.stringify({ type: "auth_ok" }));
      }
      return;
    }
    const msg = JSON.parse(data.toString());
    if (msg.type === "ping") {
      try {
        socket.send(JSON.stringify({ type: "pong" }));
        console.log("server: sent pong");
      } catch (e) {
        console.log("server: send error", e);
      }
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

client.send(JSON.stringify({ type: "ping" }));
const msg2 = await new Promise<unknown>((resolve) => {
  client.once("message", (data) => resolve(JSON.parse(data.toString())));
});
console.log("msg2", msg2);

client.close();
await new Promise<void>((resolve) => server.close(() => resolve()));
console.log("done");
