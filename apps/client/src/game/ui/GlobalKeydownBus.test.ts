import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalKeydownBus } from "./GlobalKeydownBus";

function dispatchKeydown(key: string): void {
  document.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

afterEach(() => {
  // Ensure no callback leaks between tests: unregister every id we used.
  GlobalKeydownBus.unregister("a");
  GlobalKeydownBus.unregister("b");
  GlobalKeydownBus.unregister("c");
});

describe("GlobalKeydownBus", () => {
  it("delivers keydown events to a registered callback", () => {
    const cb = vi.fn();
    GlobalKeydownBus.register("a", cb);
    dispatchKeydown("Escape");
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0]?.[0]?.key).toBe("Escape");
  });

  it("delivers to multiple registered callbacks in registration order", () => {
    const order: string[] = [];
    GlobalKeydownBus.register("a", () => order.push("a"));
    GlobalKeydownBus.register("b", () => order.push("b"));
    dispatchKeydown("Enter");
    expect(order).toEqual(["a", "b"]);
  });

  it("re-registering the same id replaces the callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    GlobalKeydownBus.register("a", first);
    GlobalKeydownBus.register("a", second);
    dispatchKeydown("x");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("unregister stops delivery to that callback", () => {
    const cb = vi.fn();
    GlobalKeydownBus.register("a", cb);
    GlobalKeydownBus.unregister("a");
    dispatchKeydown("x");
    expect(cb).not.toHaveBeenCalled();
  });

  it("unregister of an unknown id is a no-op", () => {
    expect(() => GlobalKeydownBus.unregister("never-registered")).not.toThrow();
  });

  it("a single document listener fans out to every registered callback once per event", () => {
    const cb = vi.fn();
    GlobalKeydownBus.register("a", cb);
    GlobalKeydownBus.register("b", cb);
    dispatchKeydown("y");
    // Two ids registered with the same fn => fn invoked twice (once per id).
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
