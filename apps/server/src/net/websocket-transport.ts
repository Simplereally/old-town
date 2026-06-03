import type { Server } from "node:http";
import {
  type ClientCommand,
  ClientCommandType,
  type DevAuthMessage,
  decodeTransportMessage,
  encodeTransportPacket,
  type FullStatePacket,
  isCompatibleProtocol,
  PROTOCOL_VERSION,
  parseClientCommand,
  TransportClientMessageType,
  TransportServerMessageType,
  type TransportServerPacket,
} from "@old-town/shared";
import { WebSocket, WebSocketServer } from "ws";
import type { Logger } from "../logger";

export interface TransportSession {
  readonly id: string;
  readonly characterId: string;
}

export interface WebSocketTransportOptions {
  readonly httpServer: Server;
  readonly logger: Pick<Logger, "debug" | "warn">;
  readonly getFullState: (session: TransportSession) => FullStatePacket | Promise<FullStatePacket>;
  readonly onCommand?: (
    session: TransportSession,
    command: ClientCommand,
  ) => { readonly ok: boolean; readonly reason?: string } | undefined;
  readonly onClose?: (session: TransportSession) => void | Promise<void>;
}

export interface WebSocketTransport {
  readonly path: string;
  readonly sessions: ReadonlyMap<string, TransportSession>;
  send(sessionId: string, packet: TransportServerPacket): boolean;
  close(): Promise<void>;
}

interface SocketState {
  session?: TransportSession;
}

const SOCKET_PATH = "/ws";
const UPGRADE_URL_BASE = "ws://old-town.local";
const MAX_SOCKET_PAYLOAD_BYTES = 64 * 1024;

function send(socket: WebSocket, packet: Parameters<typeof encodeTransportPacket>[0]): void {
  socket.send(encodeTransportPacket(packet));
}

function parseUpgradePath(requestUrl: string | undefined): string | undefined {
  if (!requestUrl) {
    return undefined;
  }
  try {
    return new URL(requestUrl, UPGRADE_URL_BASE).pathname;
  } catch {
    return undefined;
  }
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
  const socketsBySession = new Map<string, WebSocket>();
  const socketStates = new WeakMap<WebSocket, SocketState>();
  let nextSessionId = 1;
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_SOCKET_PAYLOAD_BYTES,
    perMessageDeflate: false,
  });

  options.httpServer.on("upgrade", (request, socket, head) => {
    const pathname = parseUpgradePath(request.url);
    if (pathname !== SOCKET_PATH) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
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

    socket.on("message", async (data, isBinary) => {
      if (isBinary) {
        send(socket, { type: TransportServerMessageType.Error, reason: "text_frames_only" });
        socket.close(1003, "text_frames_only");
        return;
      }

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
          options.logger.warn("ws", "Protocol version mismatch", {
            clientVersion: auth.protocolVersion,
            serverVersion: PROTOCOL_VERSION,
          });
          send(socket, { type: TransportServerMessageType.Error, reason: "incompatible_protocol" });
          socket.close(1002, "incompatible_protocol");
          return;
        }

        const characterId = typeof auth.characterId === "string" && auth.characterId.length > 0
          ? auth.characterId
          : "dev-character";
        const session: TransportSession = {
          id: `dev-${nextSessionId}`,
          characterId,
        };
        nextSessionId += 1;
        sessions.set(session.id, session);
        socketsBySession.set(session.id, socket);
        socketStates.set(socket, { session });
        try {
          send(socket, await options.getFullState(session));
        } catch (error) {
          sessions.delete(session.id);
          socketsBySession.delete(session.id);
          socketStates.set(socket, {});
          options.logger.warn("ws", "Full-state bootstrap failed", {
            message: error instanceof Error ? error.message : String(error),
          });
          send(socket, { type: TransportServerMessageType.Error, reason: "bootstrap_failed" });
          socket.close(1011, "bootstrap_failed");
        }
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

      const routeResult = options.onCommand?.(state.session, parsed.value);
      if (routeResult && !routeResult.ok) {
        send(socket, {
          type: TransportServerMessageType.CommandRejected,
          reason: routeResult.reason ?? "rejected",
        });
      }
    });

    socket.on("close", () => {
      const session = socketStates.get(socket)?.session;
      if (session) {
        sessions.delete(session.id);
        socketsBySession.delete(session.id);
        void Promise.resolve(options.onClose?.(session)).catch((error: unknown) => {
          options.logger.warn("ws", "Session close handler failed", {
            sessionId: session.id,
            message: error instanceof Error ? error.message : String(error),
          });
        });
      }
      options.logger.debug("ws", "Socket closed", session ? { sessionId: session.id } : undefined);
    });

    socket.on("error", (error) => {
      options.logger.warn("ws", "Socket error", { message: error.message });
    });

    // Keep-alive ping to prevent NAT/mobile timeouts
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, 15000);

    socket.on("close", () => {
      clearInterval(pingInterval);
    });
  });

  return {
    path: SOCKET_PATH,
    sessions,
    send: (sessionId, packet) => {
      const socket = socketsBySession.get(sessionId);
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return false;
      }
      send(socket, packet);
      return true;
    },
    close: () =>
      new Promise<void>((resolve) => {
        for (const client of wss.clients) {
          client.terminate();
        }
        wss.close(() => resolve());
      }),
  };
}
