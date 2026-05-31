import {
  type ClientCommand,
  ClientCommandType,
  type FullStatePacket,
  PROTOCOL_VERSION,
  ServerPacketType,
  type TickDeltaPacket,
  TransportClientMessageType,
  TransportServerMessageType,
  type TransportServerPacket,
  isCompatibleProtocol,
} from "@old-town/shared";

export interface GameSocketOptions {
  readonly protocolVersion?: number;
  readonly characterId?: string;
  readonly createSocket?: (url: string) => WebSocket;
}

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
    const socket = this.createSocket(this.url);
    this.socket = socket;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error("GameSocket connection timeout"));
      }, 10000);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: TransportClientMessageType.DevAuth,
            protocolVersion: this.protocolVersion,
            characterId: this.characterId,
          }),
        );
      };

      socket.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("GameSocket connection failed"));
      };

      socket.onclose = () => {
        clearTimeout(timeout);
        this.onClose?.();
      };

      socket.onmessage = (event) => {
        const packet = JSON.parse(String(event.data)) as TransportServerPacket;

        if (packet.type === ServerPacketType.FullState) {
          clearTimeout(timeout);
          if (!isCompatibleProtocol(packet.protocolVersion)) {
            reject(new Error(`Incompatible protocol ${packet.protocolVersion}`));
            socket.close();
            return;
          }
          // Attach message handler for ongoing deltas
          socket.onmessage = (event) => this._handleMessage(event);
          resolve(packet);
          return;
        }

        if (packet.type === TransportServerMessageType.Error) {
          clearTimeout(timeout);
          reject(new Error(`Server error: ${(packet as { reason: string }).reason}`));
          socket.close();
        }
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

  startPing(intervalMs = 5000): void {
    this.stopPing();
    this._pingInterval = setInterval(() => {
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
