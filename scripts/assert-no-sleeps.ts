#!/usr/bin/env bun
/**
 * Fail if fast-lane tests introduce real wall-clock sleeps.
 *
 * Scans apps/ for *.test.ts files looking for:
 *   - await new Promise(...) setTimeout(..., N) with N > 50 (or any numeric sleep)
 *   - Bun.sleep(...)
 *   - sleep(...) helper calls
 *
 * Heavy-lane files listed in ALLOWLIST are exempt (real-socket smokes).
 *
 * Usage: bun run test:no-sleeps
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** Files allowed to contain real sleeps (heavy-lane / real-socket smokes). */
const ALLOWLIST = new Set([
  "apps/server/src/net/multiplayer-loop.integration.test.ts",
  "apps/server/src/net/websocket-transport.integration.test.ts",
]);

const ROOT = path.resolve(import.meta.dirname, "..");
const APPS = path.join(ROOT, "apps");

const SLEEP_PATTERNS: { name: string; re: RegExp }[] = [
  {
    name: "await new Promise + setTimeout sleep",
    re: /await\s+new\s+Promise\s*\([^)]*setTimeout\s*\([^,]+,\s*(\d+)/g,
  },
  {
    name: "Bun.sleep",
    re: /\bBun\.sleep\s*\(\s*(\d+)/g,
  },
  {
    name: "sleep(",
    re: /(?<![\w.])sleep\s*\(\s*(\d+)/g,
  },
];

interface Offense {
  file: string;
  line: number;
  name: string;
  snippet: string;
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
}

function relativize(abs: string): string {
  return path.relative(ROOT, abs).split(path.sep).join("/");
}

function scanFile(abs: string): Offense[] {
  const rel = relativize(abs);
  if (ALLOWLIST.has(rel)) return [];
  const text = readFileSync(abs, "utf8");
  const lines = text.split("\n");
  const offenses: Offense[] = [];

  for (const { name, re } of SLEEP_PATTERNS) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null = re.exec(text);
    while (match) {
      const idx = match.index;
      const line = text.slice(0, idx).split("\n").length;
      const snippet = (lines[line - 1] ?? "").trim();
      // Ignore commented-out lines
      if (!snippet.startsWith("//") && !snippet.startsWith("*")) {
        const ms = match[1] !== undefined ? Number(match[1]) : undefined;
        // Flag any numeric sleep; story: no fast-lane sleep > 50 ms (we ban all to be safe)
        if (ms === undefined || ms > 0) {
          offenses.push({ file: rel, line, name, snippet });
        }
      }
      match = re.exec(text);
    }
  }
  return offenses;
}

function main(): void {
  const files: string[] = [];
  walk(APPS, files);
  const offenses = files.flatMap(scanFile);

  if (offenses.length === 0) {
    console.log(
      `test:no-sleeps OK — scanned ${files.length} test files, ${ALLOWLIST.size} allowlisted.`,
    );
    process.exit(0);
  }

  console.error(`test:no-sleeps FAILED — ${offenses.length} real-sleep offense(s):\n`);
  for (const o of offenses) {
    console.error(`  ${o.file}:${o.line}  [${o.name}]`);
    console.error(`    ${o.snippet}`);
  }
  console.error(
    `\nConvert to fake timers / manual ticks, or add the file to ALLOWLIST if it is heavy-lane.`,
  );
  process.exit(1);
}

main();
