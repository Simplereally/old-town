import { beforeEach, describe, expect, it } from "vitest";
import { RenderObjectPool } from "./RenderObjectPool";

interface TestObj {
  id: number;
  value: number;
  reset: boolean;
}

let globalId = 0;

function acquire(pool: RenderObjectPool<TestObj>): TestObj {
  const obj = pool.acquire();
  expect(obj).toBeDefined();
  return obj as TestObj;
}

function makePool(
  partial?: Partial<{
    initialSize: number;
    maxSize: number;
  }>,
): RenderObjectPool<TestObj> {
  return new RenderObjectPool<TestObj>({
    create: () => {
      globalId++;
      return { id: globalId, value: 0, reset: false };
    },
    reset: (obj) => {
      obj.value = 0;
      obj.reset = true;
    },
    initialSize: partial?.initialSize ?? 4,
    maxSize: partial?.maxSize ?? 8,
  });
}

describe("RenderObjectPool", () => {
  let pool: RenderObjectPool<TestObj>;

  beforeEach(() => {
    globalId = 0;
    pool = makePool();
  });

  it("prewarms to the requested size", () => {
    pool.prewarm(10);
    expect(pool.poolSize).toBe(10);
    expect(pool.activeCount).toBe(0);
  });

  it("acquires an object from the pool", () => {
    const obj = pool.acquire();
    expect(obj).not.toBeNull();
    expect(pool.activeCount).toBe(1);
  });

  it("returns null when pool is exhausted", () => {
    const smallPool = makePool({ initialSize: 2, maxSize: 2 });
    expect(smallPool.acquire()).not.toBeNull();
    expect(smallPool.acquire()).not.toBeNull();
    expect(smallPool.acquire()).toBeNull();
    expect(smallPool.activeCount).toBe(2);
  });

  it("releases an object back to the pool", () => {
    const obj = acquire(pool);
    obj.value = 42;
    pool.release(obj);
    expect(pool.activeCount).toBe(0);
    expect(obj.reset).toBe(true);
    expect(obj.value).toBe(0);
  });

  it("reuses released objects", () => {
    const obj1 = acquire(pool);
    pool.release(obj1);
    const obj2 = acquire(pool);
    expect(obj2).toBe(obj1);
    expect(pool.poolSize).toBe(4);
  });

  it("ignores release of already-released object", () => {
    const obj = acquire(pool);
    pool.release(obj);
    pool.release(obj);
    expect(pool.activeCount).toBe(0);
  });

  it("ignores release of unknown object", () => {
    const otherPool = makePool({ initialSize: 1, maxSize: 1 });
    const otherObj = acquire(otherPool);
    pool.release(otherObj);
    expect(pool.activeCount).toBe(0);
  });

  it("resets all active objects on reset()", () => {
    const obj1 = acquire(pool);
    const obj2 = acquire(pool);
    obj1.value = 10;
    obj2.value = 20;
    pool.reset();
    expect(pool.activeCount).toBe(0);
    expect(obj1.reset).toBe(true);
    expect(obj2.reset).toBe(true);
    expect(obj1.value).toBe(0);
    expect(obj2.value).toBe(0);
  });

  it("does not grow beyond configured maxSize", () => {
    const smallPool = makePool({ initialSize: 2, maxSize: 4 });
    for (let i = 0; i < 4; i++) {
      expect(smallPool.acquire()).not.toBeNull();
    }
    expect(smallPool.poolSize).toBe(4);
    expect(smallPool.acquire()).toBeNull();
    expect(smallPool.poolSize).toBe(4);
  });

  it("repeated spawn/remove cycles do not increase pool size beyond maxSize", () => {
    const smallPool = makePool({ initialSize: 2, maxSize: 4 });
    for (let cycle = 0; cycle < 100; cycle++) {
      const objs: TestObj[] = [];
      for (let i = 0; i < 4; i++) {
        const obj = smallPool.acquire();
        if (obj) objs.push(obj);
      }
      for (const obj of objs) {
        smallPool.release(obj);
      }
    }
    expect(smallPool.poolSize).toBeLessThanOrEqual(4);
    expect(smallPool.activeCount).toBe(0);
  });

  it("disposes and clears all internal state", () => {
    const obj = acquire(pool);
    pool.release(obj);
    pool.dispose();
    expect(pool.poolSize).toBe(0);
    expect(pool.activeCount).toBe(0);
  });

  it("stats reflect current state accurately", () => {
    const obj1 = acquire(pool);
    const _obj2 = acquire(pool);
    pool.release(obj1);
    expect(pool.activeCount).toBe(1);
    expect(pool.poolSize).toBe(4);
  });
});
