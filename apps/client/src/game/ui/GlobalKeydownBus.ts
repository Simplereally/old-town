/**
 * Deduplicates document keydown listeners across the client.
 * Uses a single addEventListener with a Map of callbacks instead of N listeners.
 */
type KeydownCallback = (e: KeyboardEvent) => void;

const callbacks = new Map<string, KeydownCallback>();
let listener: KeydownCallback | null = null;

function register(id: string, callback: KeydownCallback): void {
  callbacks.set(id, callback);
  if (!listener) {
    listener = (e: KeyboardEvent) => {
      for (const cb of callbacks.values()) {
        cb(e);
      }
    };
    document.addEventListener("keydown", listener);
  }
}

function unregister(id: string): void {
  callbacks.delete(id);
  if (callbacks.size === 0 && listener) {
    document.removeEventListener("keydown", listener);
    listener = null;
  }
}

/** Shared keydown bus: register/unregister named document keydown handlers. */
export const GlobalKeydownBus = { register, unregister } as const;
