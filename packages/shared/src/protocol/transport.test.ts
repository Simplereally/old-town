import { describe, expect, it } from "vitest";
import { ClientCommandType } from "./commands";
import {
  devAuthMessageSchema,
  parseTransportMessage,
  TransportClientMessageType,
} from "./transport";

describe("DevAuth and transport message validation", () => {
  it("parseTransportMessage accepts a valid DevAuthMessage", () => {
    const result = parseTransportMessage({
      type: TransportClientMessageType.DevAuth,
      protocolVersion: 7,
      characterId: "dev-character",
    });
    expect(result.ok).toBe(true);
  });

  it("parseTransportMessage accepts a valid ClientCommand (Ping)", () => {
    const result = parseTransportMessage({
      type: ClientCommandType.Ping,
      commandId: 1,
      payload: { clientTimeMs: 100 },
    });
    expect(result.ok).toBe(true);
  });

  it("parseTransportMessage rejects malformed input", () => {
    expect(parseTransportMessage("not-an-object").ok).toBe(false);
    expect(parseTransportMessage(null).ok).toBe(false);
    expect(parseTransportMessage({ type: "unknown" }).ok).toBe(false);
  });

  it("devAuthMessageSchema rejects missing protocolVersion", () => {
    const result = devAuthMessageSchema.safeParse({
      type: TransportClientMessageType.DevAuth,
    });
    expect(result.success).toBe(false);
  });

  it("devAuthMessageSchema rejects extra fields (strict)", () => {
    const result = devAuthMessageSchema.safeParse({
      type: TransportClientMessageType.DevAuth,
      protocolVersion: 7,
      hack: true,
    });
    expect(result.success).toBe(false);
  });
});
