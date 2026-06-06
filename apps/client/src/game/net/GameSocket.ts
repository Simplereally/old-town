import {
  type ClientCommand,
  ClientCommandType,
  type FullStatePacket,
  isCompatibleProtocol,
  PROTOCOL_VERSION,
  ServerPacketType,
  type TickDeltaPacket,
  TransportClientMessageType,
  TransportServerMessageType,
  type TransportServerPacket,
} from "@old-town/shared";

export interface GameSocketOptions {
  readonly protocolVersion?: number | undefined;
  readonly characterId?: string | undefined;
  readonly createSocket?: (url: string) => WebSocket;
}

const CONNECT_TIMEOUT_MS = 10000;

/**
 * WebSocket connection to the authoritative server.
 * Handles handshake, full state bootstrap, and continuous tick deltas.
 */
export class GameSocket {
  private socket: WebSocket | undefined;
  private readonly protocolVersion: number;
  private readonly characterId: string;
  private readonly createSocket: (url: string) => WebSocket;

  onTickDelta?: (packet: TickDeltaPacket) => void;
  onPong?: (clientTimeMs: number, serverTime: number) => void;
  onCommandRejected?: (reason: string) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  private _lastPingTime = 0;
  private _pingInterval: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly url: string,
    options: GameSocketOptions = {},
  ) {
    this.protocolVersion = options.protocolVersion ?? PROTOCOL_VERSION;
    this.characterId = options.characterId ?? "dev-character";
    this.createSocket = options.createSocket ?? ((url) => new WebSocket(url));
  }

  get serverUrl(): string {
    return this.url;
  }

  get lastPingTime(): number {
    return this._lastPingTime;
  }

  connect(): Promise<FullStatePacket> {
    this.close();

    const socket = this.createSocket(this.url);
    this.socket = socket;

    return new Promise((resolve, reject) => {
      let settled = false;

      const fail = (error: Error): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        this.onError?.(error);
        reject(error);
      };

      const succeed = (packet: FullStatePacket): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        socket.onmessage = (event) => this._handleMessage(event);
        resolve(packet);
      };

      const timeout = setTimeout(() => {
        fail(new Error(`GameSocket connection timeout after ${CONNECT_TIMEOUT_MS}ms`));
        socket.close();
      }, CONNECT_TIMEOUT_MS);

      socket.onopen = () => {
        const authMessage = {
          type: TransportClientMessageType.DevAuth,
          protocolVersion: this.protocolVersion,
          characterId: this.characterId,
        };
        console.log("[GameSocket] Sending DevAuth", {
          protocolVersion: authMessage.protocolVersion,
        });
        socket.send(JSON.stringify(authMessage));
      };

      socket.onerror = () => {
        fail(new Error(`GameSocket connection failed: ${this.url}`));
      };

      socket.onclose = (event) => {
        if (!settled) {
          fail(
            new Error(`GameSocket closed before bootstrap: ${event.code} ${event.reason}`.trim()),
          );
        }
        this.onClose?.();
      };

      socket.onmessage = (event) => {
        let packet: TransportServerPacket;
        try {
          packet = JSON.parse(String(event.data)) as TransportServerPacket;
        } catch (error) {
          fail(error instanceof Error ? error : new Error(String(error)));
          socket.close();
          return;
        }

        if (packet.type === ServerPacketType.FullState) {
          if (!isCompatibleProtocol(packet.protocolVersion)) {
            console.error("Protocol version mismatch", {
              clientVersion: this.protocolVersion,
              serverVersion: packet.protocolVersion,
            });
            fail(new Error(`Incompatible protocol ${packet.protocolVersion}`));
            socket.close();
            return;
          }
          succeed(packet);
          return;
        }

        if (packet.type === TransportServerMessageType.Error) {
          fail(new Error(`Server error: ${(packet as { reason: string }).reason}`));
          socket.close();
          return;
        }

        fail(new Error(`Unexpected bootstrap packet: ${packet.type}`));
        socket.close();
      };
    });
  }

  private _handleMessage(event: MessageEvent): void {
    try {
      const packet = JSON.parse(String(event.data)) as TransportServerPacket;
      if (packet.type === ServerPacketType.TickDelta) {
        this.onTickDelta?.(packet as TickDeltaPacket);
      } else if (packet.type === TransportServerMessageType.Pong) {
        const pong = packet as { clientTimeMs: number; serverTime: number };
        this.onPong?.(pong.clientTimeMs, pong.serverTime);
      } else if (packet.type === TransportServerMessageType.CommandRejected) {
        const rejection = packet as { reason: string };
        this.onCommandRejected?.(rejection.reason);
      }
    } catch (error) {
      console.error("Failed to parse server message:", error);
    }
  }

  sendCommand(command: ClientCommand): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("GameSocket is not open");
    }
    this.socket.send(JSON.stringify(command));
  }

  get open(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  startPing(intervalMs = 5000): void {
    this.stopPing();
    this._pingInterval = setInterval(() => {
      if (!this.open) {
        this.stopPing();
        return;
      }
      this._lastPingTime = performance.now();
      this.sendCommand({
        type: ClientCommandType.Ping,
        commandId: 0,
        payload: { clientTimeMs: this._lastPingTime },
      });
    }, intervalMs);
  }

  stopPing(): void {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = undefined;
    }
  }

  close(): void {
    this.stopPing();
    this.socket?.close();
    this.socket = undefined;
  }
}
