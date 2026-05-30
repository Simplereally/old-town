import {
  type ChatPacket,
  type ClientCommand,
  type FullStatePacket,
  PROTOCOL_VERSION,
  ServerPacketType,
  type TickDeltaPacket,
  TransportClientMessageType,
  type TransportServerPacket,
  isCompatibleProtocol,
} from "@old-town/shared";

export interface GameSocketOptions {
  readonly protocolVersion?: number;
  readonly characterId?: string;
  readonly createSocket?: (url: string) => WebSocket;
  readonly onChat?: (packet: ChatPacket) => void;
  readonly onDelta?: (packet: TickDeltaPacket) => void;
}

export class GameSocket {
  private socket: WebSocket | undefined;
  private readonly protocolVersion: number;
  private readonly characterId: string;
  private readonly createSocket: (url: string) => WebSocket;
  private readonly chatHandlers = new Set<(packet: ChatPacket) => void>();
  private readonly deltaHandlers = new Set<(packet: TickDeltaPacket) => void>();

  constructor(
    private readonly url: string,
    options: GameSocketOptions = {},
  ) {
    this.protocolVersion = options.protocolVersion ?? PROTOCOL_VERSION;
    this.characterId = options.characterId ?? "dev-character";
    this.createSocket = options.createSocket ?? ((url) => new WebSocket(url));
    if (options.onChat) {
      this.chatHandlers.add(options.onChat);
    }
    if (options.onDelta) {
      this.deltaHandlers.add(options.onDelta);
    }
  }

  connect(): Promise<FullStatePacket> {
    const socket = this.createSocket(this.url);
    this.socket = socket;

    return new Promise((resolve, reject) => {
      let bootstrapped = false;
      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: TransportClientMessageType.DevAuth,
            protocolVersion: this.protocolVersion,
            characterId: this.characterId,
          }),
        );
      };
      socket.onerror = () => reject(new Error("GameSocket connection failed"));
      socket.onmessage = (event) => {
        const packet = JSON.parse(String(event.data)) as TransportServerPacket;
        if (packet.type === ServerPacketType.TickDelta) {
          this.handleDelta(packet);
          return;
        }
        if (packet.type !== ServerPacketType.FullState || bootstrapped) return;
        if (!isCompatibleProtocol(packet.protocolVersion)) {
          reject(new Error(`Incompatible protocol ${packet.protocolVersion}`));
          socket.close();
          return;
        }
        bootstrapped = true;
        resolve(packet);
      };
    });
  }

  onDelta(handler: (packet: TickDeltaPacket) => void): () => void {
    this.deltaHandlers.add(handler);
    return () => this.deltaHandlers.delete(handler);
  }

  onChat(handler: (packet: ChatPacket) => void): () => void {
    this.chatHandlers.add(handler);
    return () => this.chatHandlers.delete(handler);
  }

  sendCommand(command: ClientCommand): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("GameSocket is not open");
    }
    this.socket.send(JSON.stringify(command));
  }

  close(): void {
    this.socket?.close();
    this.socket = undefined;
  }

  private handleDelta(packet: TickDeltaPacket): void {
    console.debug("Old Town tick delta", packet);
    for (const chat of packet.chat ?? []) {
      console.debug("Old Town chat", chat);
      for (const handler of this.chatHandlers) {
        handler(chat);
      }
    }
    for (const handler of this.deltaHandlers) {
      handler(packet);
    }
  }
}
