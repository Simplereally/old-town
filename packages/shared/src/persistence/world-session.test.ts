import { describe, expect, it } from "vitest";
import { parseWorldSessionLease, worldSessionLeaseSchema } from "./world-session";

const validLease = {
  characterId: "dev-a",
  worldId: "world-1",
  sessionId: "session-1",
  leaseExpiresAt: 1_700_000_000_000,
  lastHeartbeatAt: 1_700_000_000_000,
};

describe("worldSessionLeaseSchema", () => {
  it("accepts a valid lease with all required fields", () => {
    expect(worldSessionLeaseSchema.safeParse(validLease).success).toBe(true);
  });

  it("rejects a missing required field", () => {
    const { characterId, ...missing } = validLease;
    void characterId;
    expect(worldSessionLeaseSchema.safeParse(missing).success).toBe(false);
  });

  it("rejects an extra field (strict)", () => {
    expect(worldSessionLeaseSchema.safeParse({ ...validLease, hack: true }).success).toBe(false);
  });

  it("rejects empty string identifiers", () => {
    expect(
      worldSessionLeaseSchema.safeParse({ ...validLease, characterId: "" }).success,
    ).toBe(false);
    expect(worldSessionLeaseSchema.safeParse({ ...validLease, worldId: "" }).success).toBe(false);
    expect(
      worldSessionLeaseSchema.safeParse({ ...validLease, sessionId: "" }).success,
    ).toBe(false);
  });

  it("rejects negative or non-integer timestamps", () => {
    expect(
      worldSessionLeaseSchema.safeParse({ ...validLease, leaseExpiresAt: -1 }).success,
    ).toBe(false);
    expect(
      worldSessionLeaseSchema.safeParse({ ...validLease, lastHeartbeatAt: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects identifiers exceeding their max length", () => {
    expect(
      worldSessionLeaseSchema.safeParse({ ...validLease, characterId: "a".repeat(129) }).success,
    ).toBe(false);
    expect(
      worldSessionLeaseSchema.safeParse({ ...validLease, worldId: "a".repeat(65) }).success,
    ).toBe(false);
  });

  it("rejects a non-object input", () => {
    expect(worldSessionLeaseSchema.safeParse("not-an-object").success).toBe(false);
    expect(worldSessionLeaseSchema.safeParse(null).success).toBe(false);
    expect(worldSessionLeaseSchema.safeParse(42).success).toBe(false);
  });
});

describe("parseWorldSessionLease", () => {
  it("returns the parsed lease for valid input", () => {
    const lease = parseWorldSessionLease(validLease);
    expect(lease).toEqual(validLease);
  });

  it("throws for invalid input", () => {
    expect(() => parseWorldSessionLease({ bad: true })).toThrow();
  });
});
