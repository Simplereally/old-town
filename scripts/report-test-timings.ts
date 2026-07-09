#!/usr/bin/env bun
/**
 * Parse a vitest JSON reporter output file and print a per-file duration table.
 *
 * Usage:
 *   bunx vitest run --reporter=json --outputFile=/tmp/vitest-report.json
 *   bun scripts/report-test-timings.ts /tmp/vitest-report.json
 *   bun scripts/report-test-timings.ts /tmp/vitest-report.json --top 20
 */

import { readFileSync } from "node:fs";
import path from "node:path";

interface VitestAssertionResult {
  status?: string;
  duration?: number;
  fullName?: string;
  title?: string;
}

interface VitestTestResult {
  name?: string;
  status?: string;
  startTime?: number;
  endTime?: number;
  assertionResults?: VitestAssertionResult[];
}

interface VitestJsonReport {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  startTime?: number;
  success?: boolean;
  testResults?: VitestTestResult[];
}

interface FileRow {
  file: string;
  durationMs: number;
  testCount: number;
  durationPerTest: number;
}

function usage(): never {
  console.error(
    "Usage: bun scripts/report-test-timings.ts <vitest-json-report> [--top N] [--json]",
  );
  process.exit(2);
}

function parseArgs(argv: string[]): { reportPath: string; top: number; asJson: boolean } {
  if (argv.length < 1) usage();
  let reportPath = "";
  let top = 20;
  let asJson = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--top") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 1) usage();
      top = Math.floor(n);
    } else if (arg === "--json") {
      asJson = true;
    } else if (!arg.startsWith("-") && reportPath === "") {
      reportPath = arg;
    } else {
      usage();
    }
  }
  if (reportPath === "") usage();
  return { reportPath, top, asJson };
}

function relativize(filePath: string): string {
  const cwd = process.cwd();
  const abs = path.resolve(filePath);
  if (abs.startsWith(cwd)) {
    return path.relative(cwd, abs).split(path.sep).join("/");
  }
  return filePath.split(path.sep).join("/");
}

function fileDurationMs(result: VitestTestResult): number {
  if (
    typeof result.startTime === "number" &&
    typeof result.endTime === "number" &&
    result.endTime >= result.startTime
  ) {
    return result.endTime - result.startTime;
  }
  const assertions = result.assertionResults ?? [];
  return assertions.reduce((sum, a) => sum + (a.duration ?? 0), 0);
}

function buildRows(report: VitestJsonReport): FileRow[] {
  const rows: FileRow[] = [];
  for (const result of report.testResults ?? []) {
    if (!result.name) continue;
    const durationMs = fileDurationMs(result);
    const testCount = result.assertionResults?.length ?? 0;
    rows.push({
      file: relativize(result.name),
      durationMs,
      testCount,
      durationPerTest: testCount > 0 ? durationMs / testCount : durationMs,
    });
  }
  rows.sort((a, b) => b.durationMs - a.durationMs);
  return rows;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function padLeft(s: string, n: number): string {
  return s.length >= n ? s : " ".repeat(n - s.length) + s;
}

function main(): void {
  const { reportPath, top, asJson } = parseArgs(process.argv.slice(2));
  const raw = readFileSync(reportPath, "utf8");
  const report = JSON.parse(raw) as VitestJsonReport;
  const rows = buildRows(report);

  const cpuSumMs = rows.reduce((sum, r) => sum + r.durationMs, 0);
  const wallMs =
    typeof report.startTime === "number"
      ? Date.now() - report.startTime // fallback if end missing; prefer file mtime below
      : cpuSumMs;

  // Prefer wall time from the newest endTime − earliest startTime across files.
  let earliest = Number.POSITIVE_INFINITY;
  let latest = 0;
  for (const result of report.testResults ?? []) {
    if (typeof result.startTime === "number") earliest = Math.min(earliest, result.startTime);
    if (typeof result.endTime === "number") latest = Math.max(latest, result.endTime);
  }
  const measuredWallMs =
    Number.isFinite(earliest) && latest > earliest ? latest - earliest : wallMs;

  const totalTests = report.numTotalTests ?? rows.reduce((s, r) => s + r.testCount, 0);
  const summary = {
    reportPath: relativize(reportPath),
    success: report.success ?? report.numFailedTests === 0,
    totalFiles: rows.length,
    totalTests,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    wallTimeMs: measuredWallMs,
    cpuSumMs,
    top: rows.slice(0, top),
  };

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`Report: ${summary.reportPath}`);
  console.log(
    `Files: ${summary.totalFiles}  Tests: ${summary.totalTests}` +
      (summary.passed != null ? `  Passed: ${summary.passed}` : "") +
      (summary.failed != null ? `  Failed: ${summary.failed}` : ""),
  );
  console.log(
    `Wall time: ${(summary.wallTimeMs / 1000).toFixed(2)}s  ` +
      `CPU-summed: ${(summary.cpuSumMs / 1000).toFixed(2)}s`,
  );
  console.log("");
  console.log(`${pad("Duration", 10)} ${pad("Tests", 6)} ${pad("ms/test", 10)} File`);
  console.log("-".repeat(80));
  for (const row of summary.top) {
    console.log(
      `${padLeft(row.durationMs.toFixed(0), 10)} ` +
        `${padLeft(String(row.testCount), 6)} ` +
        `${padLeft(row.durationPerTest.toFixed(1), 10)} ` +
        row.file,
    );
  }
}

main();
