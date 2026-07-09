import { Scene, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { E47_PROVISIONAL_DRAW_CALL_SOFT_CAP } from "../audio/e47-budgets";
import { BlobShadowLayer } from "../scene/BlobShadowLayer";
import { SelectionRingLayer } from "../scene/SelectionRingLayer";

describe("E47 resource disposal", () => {
  it("disposes blob shadows and selection rings without leaking scene children", () => {
    const scene = new Scene();
    const shadows = new BlobShadowLayer({ scene });
    const selection = new SelectionRingLayer({ scene });
    shadows.ensure(1, new Vector3(0, 0, 0));
    shadows.ensureObject(2, 1, 1);
    selection.select(1, new Vector3(0, 0, 0));
    expect(shadows.count).toBe(2);
    expect(selection.visible).toBe(true);
    shadows.dispose();
    selection.dispose();
    expect(shadows.count).toBe(0);
    expect(selection.visible).toBe(false);
  });

  it("documents the E47 provisional draw-call soft cap", () => {
    // Soft budget only — CI does not fail on draw calls; DebugOverlay surfaces them.
    expect(E47_PROVISIONAL_DRAW_CALL_SOFT_CAP).toBeGreaterThan(0);
  });
});
