/**
 * E35-S05: Instanced Prop Scale Stress Harness — headless runner.
 *
 * Run with:
 *   bun run stress:render:props-browser
 *
 * This script runs the headless 30k prop scenario and prints exact pass/fail
 * metrics. For a real browser test with WebGL, start the dev server and open
 * the local URL printed below.
 */

import { InstancedPropHarness } from "../apps/client/src/game/renderer/stress/InstancedPropHarness";

function makeKeys(count: number) {
  const keys = [];
  const archetypes = [
    "tree_oak",
    "tree_pine",
    "rock_granite",
    "rock_moss",
    "flower_red",
    "flower_blue",
    "fence_wood",
    "lamp_post",
    "bench_park",
    "barrel",
  ];
  const materials = ["mat_a", "mat_b", "mat_c"];
  const regions = ["r0", "r1", "r2"];
  const layers = ["ground", "overlay"];
  let i = 0;
  for (const a of archetypes) {
    for (const m of materials) {
      for (const r of regions) {
        for (const l of layers) {
          if (i >= count) break;
          keys.push({ archetypeId: a, materialId: m, regionId: r, layer: l });
          i++;
        }
      }
    }
  }
  return keys;
}

function runHeadless(): void {
  const harness = new InstancedPropHarness({
    propCount: 30_000,
    seed: 99,
    initialCapacity: 128,
    keys: makeKeys(20),
  });

  const stats = harness.flush(1);
  harness.dispose();

  const pass =
    stats.visibleProps === 30_000 &&
    stats.activeSlots === 30_000 &&
    stats.bucketCount > 0 &&
    stats.bucketCount <= 20 &&
    stats.lastFlushDurationMs >= 0;

  console.log("=== E35-S05 Instanced Prop Stress Harness ===");
  console.log("Scenario: 30,000 props across 20 bucket keys");
  console.log("");
  console.log("Metrics:");
  console.log(`  visibleProps      : ${stats.visibleProps}`);
  console.log(`  activeSlots       : ${stats.activeSlots}`);
  console.log(`  bucketCount       : ${stats.bucketCount}`);
  console.log(`  dirtyBucketCount  : ${stats.dirtyBucketCount}`);
  console.log(`  flushDurationMs   : ${stats.lastFlushDurationMs.toFixed(3)}`);
  console.log(`  totalCapacity     : ${stats.totalCapacity}`);
  console.log("");
  console.log(`Result: ${pass ? "PASS" : "FAIL"}`);
  console.log("");
  console.log("For a real browser WebGL test, run:");
  console.log("  bun run client:dev");
  console.log("Then open http://localhost:5173/ and load the prop stress scene.");

  if (!pass) {
    process.exit(1);
  }
}

runHeadless();
