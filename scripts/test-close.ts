import { createServer } from "node:http";

const server = createServer();
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = (server.address() as { port: number }).port;
console.log("listening on", port);

// Connect a socket
const socket = await Bun.connect({ hostname: "127.0.0.1", port, socket: { data() {} } });
console.log("connected");
socket.end();

// Close server
await new Promise<void>((resolve) => {
  server.close(() => {
    console.log("server closed callback");
    resolve();
  });
});
console.log("done");
