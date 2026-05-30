import {
  type ClientCommand,
  type FullStatePacket,
  PROTOCOL_VERSION,
  ServerPacketType,
  TransportClientMessageType,
  type TransportServerPacket,
  isCompatibleProtocol,
} from "@old-town/shared";

export interface GameSocketOptions {
  readonly protocolVersion?: number;
  readonly characterId?: string;
  readonly createSocket?: (url: string) => WebSocket;
}

export class GameSocket {
  private socket: WebSocket | undefined;
  private readonly protocolVersion: number;
  private readonly characterId: string;
  private readonly createSocket: (url: string) => WebSocket;

  constructor(
    private readonly url: string,
    options: GameSocketOptions = {},
  ) {
    this.protocolVersion = options.protocolVersion ?? PROTOCOL_VERSION;
    this.characterId = options.characterId ?? "dev-character";
    this.createSocket = options.createSocket ?? ((url) => new WebSocket(url));
  }

  connect(): Promise<FullStatePacket> {
    const socket = this.createSocket(this.url);
    this.socket = socket;

    return new Promise((resolve, reject) => {
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
        if (packet.type !== ServerPacketType.FullState) {
          return;
        }
        if (!isCompatibleProtocol(packet.protocolVersion)) {
          reject(new Error(`Incompatible protocol ${packet.protocolVersion}`));
          socket.close();
          return;
        }
        resolve(packet);
      };
    });
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
}
