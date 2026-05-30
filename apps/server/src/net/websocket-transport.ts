import type { Server } from "node:http";
import {
  type ClientCommand,
  ClientCommandType,
  type DevAuthMessage,
  type FullStatePacket,
  TransportClientMessageType,
  TransportServerMessageType,
  decodeTransportMessage,
  encodeTransportPacket,
  isCompatibleProtocol,
  parseClientCommand,
} from "@old-town/shared";
import { type WebSocket, WebSocketServer } from "ws";
import type { Logger } from "../logger";

export interface TransportSession {
  readonly id: string;
  readonly characterId: string;
}

export interface WebSocketTransportOptions {
  readonly httpServer: Server;
  readonly logger: Pick<Logger, "debug" | "warn">;
  readonly getFullState: (session: TransportSession) => FullStatePacket;
  readonly onCommand?: (session: TransportSession, command: ClientCommand) => void;
  readonly onClose?: (session: TransportSession) => void;
}

export interface WebSocketTransport {
  readonly path: string;
  readonly sessions: ReadonlyMap<string, TransportSession>;
  close(): Promise<void>;
}

interface SocketState {
  session?: TransportSession;
}

const SOCKET_PATH = "/ws";

function send(socket: WebSocket, packet: Parameters<typeof encodeTransportPacket>[0]): void {
  socket.send(encodeTransportPacket(packet));
}

function parseDevAuth(raw: unknown): DevAuthMessage | undefined {
  if (
    typeof raw === "object" &&
    raw !== null &&
    (raw as { type?: unknown }).type === TransportClientMessageType.DevAuth &&
    typeof (raw as { protocolVersion?: unknown }).protocolVersion === "number"
  ) {
    return raw as DevAuthMessage;
  }
  return undefined;
}

export function createWebSocketTransport(options: WebSocketTransportOptions): WebSocketTransport {
  const sessions = new Map<string, TransportSession>();
  const socketStates = new WeakMap<WebSocket, SocketState>();
  let nextSessionId = 1;
  const wss = new WebSocketServer({ noServer: true });

  options.httpServer.on("upgrade", (request, socket, head) => {
    if (request.url !== SOCKET_PATH) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (socket) => {
    socketStates.set(socket, {});
    options.logger.debug("ws", "Socket opened");

    socket.on("message", (data) => {
      let message: unknown;
      try {
        message = decodeTransportMessage(data.toString());
      } catch {
        send(socket, { type: TransportServerMessageType.Error, reason: "malformed_json" });
        return;
      }

      const state = socketStates.get(socket);
      if (!state?.session) {
        const auth = parseDevAuth(message);
        if (!auth) {
          send(socket, { type: TransportServerMessageType.Error, reason: "auth_required" });
          socket.close(1008, "auth_required");
          return;
        }
        if (!isCompatibleProtocol(auth.protocolVersion)) {
          send(socket, { type: TransportServerMessageType.Error, reason: "incompatible_protocol" });
          socket.close(1002, "incompatible_protocol");
          return;
        }

        const session: TransportSession = {
          id: `dev-${nextSessionId}`,
          characterId: auth.characterId ?? "dev-character",
        };
        nextSessionId += 1;
        sessions.set(session.id, session);
        socketStates.set(socket, { session });
        send(socket, options.getFullState(session));
        return;
      }

      const parsed = parseClientCommand(message);
      if (!parsed.ok) {
        send(socket, {
          type: TransportServerMessageType.CommandRejected,
          reason: parsed.error,
        });
        return;
      }

      if (parsed.value.type === ClientCommandType.Ping) {
        send(socket, {
          type: TransportServerMessageType.Pong,
          commandId: parsed.value.commandId,
          clientTimeMs: parsed.value.payload.clientTimeMs,
          serverTime: Date.now(),
        });
        return;
      }

      options.onCommand?.(state.session, parsed.value);
    });

    socket.on("close", () => {
      const session = socketStates.get(socket)?.session;
      if (session) {
        sessions.delete(session.id);
        options.onClose?.(session);
      }
      options.logger.debug("ws", "Socket closed", session ? { sessionId: session.id } : undefined);
    });

    socket.on("error", (error) => {
      options.logger.warn("ws", "Socket error", { message: error.message });
    });
  });

  return {
    path: SOCKET_PATH,
    sessions,
    close: () =>
      new Promise<void>((resolve) => {
        for (const client of wss.clients) {
          client.terminate();
        }
        wss.close(() => resolve());
      }),
  };
}
