#!/usr/bin/env bun
/**
 * E35 Render Stress Report
 *
 * Aggregates all E35 stress test results into a single report.
 *
 * Usage:
 *   bun scripts/render-stress-report.ts          # full report
 *   bun scripts/render-stress-report.ts --ci     # CI-only report, exit non-zero on failure
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

interface VitestAssertion {
  ancestorTitles: string[];
  fullName: string;
  status: "passed" | "failed" | "pending" | "skipped" | "todo";
  title: string;
  duration: number;
  failureMessages: string[];
}

interface VitestSuiteResult {
  name: string;
  status: "passed" | "failed";
  assertionResults: VitestAssertion[];
}

interface VitestJsonOutput {
  success: boolean;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  testResults: VitestSuiteResult[];
}

interface Gate {
  name: string;
  target: string;
  actual: string | null;
  status: "passed" | "failed" | "skipped" | "manual";
  ci: boolean;
}

interface Report {
  ciEnforceable: Gate[];
  manual: Gate[];
}

const STRESS_DIR = resolve(import.meta.dirname ?? ".", "../apps/client/src/game/renderer/stress");

const VITEST_CMD = "npx";
const VITEST_ARGS = ["vitest", "run", STRESS_DIR, "--reporter=json", "--color=false"];

function runVitest(): VitestJsonOutput {
  const result = spawnSync(VITEST_CMD, VITEST_ARGS, {
    cwd: resolve(import.meta.dirname ?? ".", ".."),
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  });

  const stdout = result.stdout || "";
  // Vitest JSON reporter may prefix the JSON with normal text; grab the last JSON object.
  const lastBrace = stdout.lastIndexOf("}");
  const firstBrace = stdout.indexOf("{");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(
      `Could not parse vitest JSON output. Exit code: ${result.status}. Stderr: ${result.stderr || ""}`,
    );
  }
  const jsonText = stdout.slice(firstBrace, lastBrace + 1);
  const parsed: VitestJsonOutput = JSON.parse(jsonText);
  return parsed;
}

function buildGates(output: VitestJsonOutput, ciOnly: boolean): Report {
  const ciGates: Gate[] = [];
  const manualGates: Gate[] = [];

  for (const suite of output.testResults) {
    const fileName = suite.name.split("/").pop() ?? "";

    // Group assertions by their top-level describe block
    const groups = new Map<string, VitestAssertion[]>();
    for (const assertion of suite.assertionResults) {
      const topDescribe = assertion.ancestorTitles[0] ?? "(default)";
      const list = groups.get(topDescribe) ?? [];
      list.push(assertion);
      groups.set(topDescribe, list);
    }

    for (const [describeTitle, assertions] of groups) {
      const allPassed = assertions.every((a) => a.status === "passed");
      const anyFailed = assertions.some((a) => a.status === "failed");
      const anySkipped = assertions.some((a) => a.status === "skipped" || a.status === "pending");

      let status: Gate["status"];
      if (anyFailed) status = "failed";
      else if (anySkipped) status = "skipped";
      else status = "passed";

      const gateName = `${fileName.replace(/\.stress\.test\.ts$/, "")} › ${describeTitle}`;
      const isManual =
        describeTitle.includes("Actor pools") || describeTitle.includes("Manual browser");

      let target = "";
      let actual: string | null = null;

      // Derive target and actual from known test suites
      if (fileName === "region-crossing.stress.test.ts") {
        if (describeTitle === "RegionCrossingHarness") {
          target =
            "Cross ≥4 region boundaries, revisit evicted region, visible pipeline, lifecycle transitions, re-enter recovery, diagnostics, upload exhaustion, out-of-order completions";
          actual = allPassed ? "7/7 passed" : null;
        }
      } else if (fileName === "snapshot-jitter.stress.test.ts") {
        if (describeTitle === "SnapshotJitterHarness") {
          target =
            "Deterministic path ≥120 ticks, deterministic seeded schedule, no WebGL required";
          actual = allPassed ? "3/3 passed" : null;
        } else if (describeTitle === "Snapshot Jitter Stress") {
          target =
            "No stale packet mutates accepted state, mode distribution includes interpolate/hold/freeze/snap, snap threshold respected, no invented ticks";
          actual = allPassed ? "4/4 passed" : null;
        }
      } else if (fileName === "entity-scale.stress.test.ts") {
        if (describeTitle === "EntityScaleHarness") {
          target =
            "1000 entities with stable ids and mixed kinds, ≥60 server ticks, deterministic paths, fake RAF without WebGL";
          actual = allPassed ? "4/4 passed" : null;
        } else if (describeTitle === "RenderTransformCache capacity growth") {
          target =
            "Preserves entity mapping past initial size, no stale removed entities after growth + removals";
          actual = allPassed ? "2/2 passed" : null;
        } else if (describeTitle === "forEachPresentation hot loop") {
          target =
            "Iterates all 1000 presentations without per-entity allocation, no new presentation objects in hot loop";
          actual = allPassed ? "2/2 passed" : null;
        } else if (describeTitle === "Frame metrics") {
          target =
            "Records entity count and transform duration across frames, tracks max observed capacity growth";
          actual = allPassed ? "2/2 passed" : null;
        } else if (describeTitle === "Actor pools (conditional on WebGL)") {
          target = "MeshPool / InstanceBucket draw-call validation with live WebGL context";
          actual = null;
          status = "manual";
        } else if (describeTitle === "Manual browser 1k actor rendering") {
          target = "Visual performance >30 FPS with p95 frame time <16.6ms in browser";
          actual = null;
          status = "manual";
        }
      } else if (fileName === "instanced-props.stress.test.ts") {
        if (describeTitle === "InstancedPropHarness stress") {
          target =
            "10k props ≤10 buckets, 30k props ≤20 buckets, needsUpdate policy, dirty range policy, bounds policy, release/re-acquire, mixed flush, deterministic generation";
          actual = allPassed ? "11/11 passed" : null;
        }
      }

      if (!target) {
        target = `${assertions.length} assertion(s)`;
        actual = allPassed ? `${assertions.length}/${assertions.length} passed` : null;
      }

      const gate: Gate = {
        name: gateName,
        target,
        actual,
        status,
        ci: !isManual,
      };

      if (isManual) {
        manualGates.push(gate);
      } else {
        ciGates.push(gate);
      }
    }
  }

  return { ciEnforceable: ciGates, manual: manualGates };
}

function formatReport(report: Report, summary: VitestJsonOutput): string {
  const lines: string[] = [];
  lines.push("=== E35 Render Stress Report ===");
  lines.push("");
  lines.push(
    `Total suites: ${summary.testResults.length} | Total tests: ${summary.numTotalTests} | Passed: ${summary.numPassedTests} | Failed: ${summary.numFailedTests} | Pending: ${summary.numPendingTests}`,
  );
  lines.push("");

  lines.push("CI-enforceable");
  lines.push("─".repeat(60));
  for (const gate of report.ciEnforceable) {
    lines.push(`Gate : ${gate.name}`);
    lines.push(`Target: ${gate.target}`);
    lines.push(`Actual: ${gate.actual ?? "—"}`);
    lines.push(`Status: ${gate.status.toUpperCase()}`);
    lines.push("");
  }

  lines.push("Manual / browser-only");
  lines.push("─".repeat(60));
  for (const gate of report.manual) {
    lines.push(`Gate : ${gate.name}`);
    lines.push(`Target: ${gate.target}`);
    lines.push(`Actual: ${gate.actual ?? "—"}`);
    lines.push(`Status: ${gate.status.toUpperCase()}`);
    lines.push("");
  }

  const ciFailed = report.ciEnforceable.some((g) => g.status === "failed");
  const ciSkipped = report.ciEnforceable.some((g) => g.status === "skipped");

  lines.push("=".repeat(60));
  if (ciFailed) {
    lines.push("RESULT: FAIL — at least one CI-enforceable gate failed.");
  } else if (ciSkipped) {
    lines.push("RESULT: SKIP — at least one CI-enforceable gate was skipped.");
  } else {
    lines.push("RESULT: PASS — all CI-enforceable gates passed.");
  }
  lines.push("");

  return lines.join("\n");
}

function main() {
  const ciOnly = process.argv.includes("--ci");

  const output = runVitest();
  const report = buildGates(output, ciOnly);

  if (ciOnly) {
    // In CI mode, filter the report to only show CI-enforceable gates
    const ciReport: Report = {
      ciEnforceable: report.ciEnforceable,
      manual: [],
    };
    console.log(formatReport(ciReport, output));
  } else {
    console.log(formatReport(report, output));
  }

  const ciFailed = report.ciEnforceable.some((g) => g.status === "failed");
  if (ciFailed) {
    process.exit(1);
  }
}

main();
