import { BoxGeometry, BufferAttribute } from "three";
import { describe, expect, it, vi } from "vitest";
import { compose, eyePart, jitter, PALETTE, type Part, paint, taperedBox } from "./lowpoly";

describe("PALETTE", () => {
  it("exposes a non-empty set of named hex colors", () => {
    expect(Object.keys(PALETTE).length).toBeGreaterThan(10);
    for (const value of Object.values(PALETTE)) {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffff);
    }
  });
});

describe("paint", () => {
  it("sets a 'color' BufferAttribute with the same count as position", () => {
    const geo = new BoxGeometry(1, 1, 1);
    const positionCount = geo.getAttribute("position").count;
    paint(geo, PALETTE.steel);
    const color = geo.getAttribute("color");
    expect(color).toBeDefined();
    expect(color.count).toBe(positionCount);
    expect(color.itemSize).toBe(3);
  });

  it("paints every vertex with the same normalized color", () => {
    const geo = new BoxGeometry(1, 1, 1);
    paint(geo, 0xff0000);
    const color = geo.getAttribute("color");
    for (let i = 0; i < color.count; i += 1) {
      expect(color.getX(i)).toBeCloseTo(1, 5);
      expect(color.getY(i)).toBeCloseTo(0, 5);
      expect(color.getZ(i)).toBeCloseTo(0, 5);
    }
  });
});

describe("jitter", () => {
  it("is deterministic: the same seed+amount yields identical positions", () => {
    const a = new BoxGeometry(1, 1, 1);
    const b = new BoxGeometry(1, 1, 1);
    jitter(a, 0.1, 42);
    jitter(b, 0.1, 42);
    const pa = a.getAttribute("position");
    const pb = b.getAttribute("position");
    expect(pa.count).toBe(pb.count);
    for (let i = 0; i < pa.count; i += 1) {
      expect(pa.getX(i)).toBeCloseTo(pb.getX(i), 10);
      expect(pa.getY(i)).toBeCloseTo(pb.getY(i), 10);
      expect(pa.getZ(i)).toBeCloseTo(pb.getZ(i), 10);
    }
  });

  it("different seeds produce different positions", () => {
    const a = new BoxGeometry(1, 1, 1);
    const b = new BoxGeometry(1, 1, 1);
    jitter(a, 0.1, 1);
    jitter(b, 0.1, 2);
    const pa = a.getAttribute("position");
    const pb = b.getAttribute("position");
    let anyDiff = false;
    for (let i = 0; i < pa.count && !anyDiff; i += 1) {
      if (pa.getX(i) !== pb.getX(i) || pa.getY(i) !== pb.getY(i) || pa.getZ(i) !== pb.getZ(i)) {
        anyDiff = true;
      }
    }
    expect(anyDiff).toBe(true);
  });

  it("amount=0 leaves positions unchanged", () => {
    const geo = new BoxGeometry(1, 1, 1);
    const before = new BoxGeometry(1, 1, 1);
    jitter(geo, 0, 7);
    const pa = geo.getAttribute("position");
    const pb = before.getAttribute("position");
    for (let i = 0; i < pa.count; i += 1) {
      expect(pa.getX(i)).toBeCloseTo(pb.getX(i), 10);
      expect(pa.getY(i)).toBeCloseTo(pb.getY(i), 10);
      expect(pa.getZ(i)).toBeCloseTo(pb.getZ(i), 10);
    }
  });
});

describe("compose", () => {
  it("merges parts into a single non-indexed BufferGeometry with a color attribute", () => {
    const parts: Part[] = [
      { geometry: new BoxGeometry(1, 1, 1), color: PALETTE.steel, y: 0 },
      { geometry: new BoxGeometry(0.5, 0.5, 0.5), color: PALETTE.barkMid, y: 1 },
    ];
    const merged = compose(parts);
    expect(merged.getAttribute("position").count).toBeGreaterThan(0);
    expect(merged.getAttribute("color")).toBeDefined();
    expect(merged.index).toBeNull();
  });

  it("applies translate, scale, and rotate transforms in local space", () => {
    const parts: Part[] = [
      {
        geometry: new BoxGeometry(1, 1, 1),
        color: PALETTE.steel,
        x: 2,
        y: 3,
        z: 4,
        sx: 2,
        sy: 1,
        sz: 1,
      },
    ];
    const merged = compose(parts);
    merged.computeBoundingBox();
    const box = merged.boundingBox;
    expect(box).not.toBeNull();
    if (!box) return;
    // Scaled x by 2 (width 2) then translated by x=2 => [1, 3]
    expect(box.min.x).toBeCloseTo(1, 5);
    expect(box.max.x).toBeCloseTo(3, 5);
    expect(box.min.y).toBeCloseTo(2.5, 5);
    expect(box.max.y).toBeCloseTo(3.5, 5);
    expect(box.min.z).toBeCloseTo(3.5, 5);
    expect(box.max.z).toBeCloseTo(4.5, 5);
  });

  it("throws when geometries cannot be merged (incompatible attributes)", () => {
    // mergeGeometries returns null when geometries have mismatched attributes.
    const g1 = new BoxGeometry(1, 1, 1);
    const g2 = new BoxGeometry(1, 1, 1);
    // Add an extra attribute to g1 that g2 does not have.
    g1.setAttribute(
      "extra",
      new BufferAttribute(new Float32Array(g1.getAttribute("position").count), 1),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() =>
        compose([
          { geometry: g1, color: PALETTE.steel },
          { geometry: g2, color: PALETTE.barkMid },
        ]),
      ).toThrow("lowpoly.compose: failed to merge geometries");
      expect(consoleError).toHaveBeenCalledOnce();
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe("taperedBox", () => {
  it("returns a plain BoxGeometry when topScale is 1", () => {
    const geo = taperedBox(1, 2, 1, 1);
    const pos = geo.getAttribute("position");
    // A default 1x2x1 box has x in [-0.5, 0.5]; tapering with scale 1 is a no-op.
    let hasFullWidth = false;
    for (let i = 0; i < pos.count; i += 1) {
      if (Math.abs(pos.getX(i)) > 0.49) hasFullWidth = true;
    }
    expect(hasFullWidth).toBe(true);
  });

  it("widens the top face when topScale > 1", () => {
    const geo = taperedBox(1, 2, 1, 2);
    const pos = geo.getAttribute("position");
    let topMaxX = -Infinity;
    let bottomMaxX = 0;
    for (let i = 0; i < pos.count; i += 1) {
      const y = pos.getY(i);
      const x = Math.abs(pos.getX(i));
      if (y > 0) {
        topMaxX = Math.max(topMaxX, x);
      } else {
        bottomMaxX = Math.max(bottomMaxX, x);
      }
    }
    // Bottom stays at 0.5, top widens to 1.0.
    expect(bottomMaxX).toBeCloseTo(0.5, 5);
    expect(topMaxX).toBeCloseTo(1.0, 5);
  });

  it("narrows the top face when topScale < 1", () => {
    const geo = taperedBox(1, 2, 1, 0.5);
    const pos = geo.getAttribute("position");
    let topMaxX = Infinity;
    for (let i = 0; i < pos.count; i += 1) {
      if (pos.getY(i) > 0) {
        topMaxX = Math.min(topMaxX, Math.abs(pos.getX(i)));
      }
    }
    // Top narrows from 0.5 to 0.25.
    expect(topMaxX).toBeCloseTo(0.25, 5);
  });
});

describe("eyePart", () => {
  it("returns a Part positioned at the given coordinates with the default eye color", () => {
    const eye = eyePart(0.1, 0.5, 0.3);
    expect(eye.x).toBe(0.1);
    expect(eye.y).toBe(0.5);
    expect(eye.z).toBe(0.3);
    expect(eye.color).toBe(PALETTE.shadow);
    expect(eye.geometry.getAttribute("position").count).toBeGreaterThan(0);
  });

  it("accepts a custom color for glowing/red eyes", () => {
    const eye = eyePart(0, 0, 0, PALETTE.ember);
    expect(eye.color).toBe(PALETTE.ember);
  });
});
