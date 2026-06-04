#!/usr/bin/env bun
/**
 * Assert Render Boundary Enforcement
 *
 * Static analysis script that prevents gameplay, network, and shared modules
 * from importing Three.js or mutating renderer-owned objects.
 *
 * Fixture-free assertion logic:
 * - We walk the source tree and read every .ts file.
 * - Forbidden three imports are checked with regex (no AST parser needed).
 * - Object3D mutation is checked with targeted regex patterns.
 * - Scene-layer method calls in net code are checked with regex.
 * - Violations are collected, printed, and the script exits non-zero.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

interface Violation {
  file: string;
  line: number;
  reason: string;
  code: string;
}

const THREE_IMPORT_RE = /from\s+["']three["']/;
const THREE_EXAMPLES_IMPORT_RE = /from\s+["']three\/examples/;

const SCENE_LAYER_METHOD_RE =
  /\b(actors\.updateTile|objects\.spawn|terrain\.loadChunk|projectiles\.spawn|hitsplats\.show)\s*\(/;

const MUTATION_PATTERNS = [
  { name: "Object3D.position mutation", re: /\.(position\.(x|y|z)\s*=|position\.(set|copy)\s*\()/ },
  { name: "Object3D.rotation mutation", re: /\.(rotation\.(x|y|z)\s*=|rotation\.(set|copy)\s*\()/ },
  { name: "Object3D.scale mutation", re: /\.(scale\.(x|y|z)\s*=|scale\.(set|copy)\s*\()/ },
  {
    name: "matrix mutation",
    re: /\.(matrix\.(set|multiply|compose|makeRotation|makeTranslation|makeScale)|matrixAutoUpdate\s*=|matrixWorldNeedsUpdate\s*=)/,
  },
  { name: "instanceMatrix mutation", re: /\.instanceMatrix\.(set|copy|needsUpdate\s*=)/ },
  {
    name: "material mutation",
    re: /\.(material\s*=|material\.(opacity|color|transparent|needsUpdate|depthTest|depthWrite|side|visible)\s*=)/,
  },
];

function walk(dir: string, cb: (filePath: string) => void): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "build")
        continue;
      walk(fullPath, cb);
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      cb(fullPath);
    }
  }
}

function isRenderTestFile(filePath: string): boolean {
  const relative = filePath.replace(/\\/g, "/");
  if (relative.includes("/renderer/")) return true;
  if (relative.includes("/scene/")) return true;
  if (relative.endsWith(".test.ts") && /render|scene/i.test(relative)) return true;
  return false;
}

function collectViolations(): Violation[] {
  const violations: Violation[] = [];
  const root = process.cwd();

  // 1. packages/shared/** must not import three or three/examples
  const sharedDir = path.join(root, "packages", "shared");
  walk(sharedDir, (filePath) => {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
      if (THREE_IMPORT_RE.test(line) || THREE_EXAMPLES_IMPORT_RE.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          reason: "packages/shared/** must not import three or three/examples",
          code: line.trim(),
        });
      }
    }
  });

  // 2. apps/server/** must not import three or three/examples
  const serverDir = path.join(root, "apps", "server");
  walk(serverDir, (filePath) => {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
      if (THREE_IMPORT_RE.test(line) || THREE_EXAMPLES_IMPORT_RE.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          reason: "apps/server/** must not import three or three/examples",
          code: line.trim(),
        });
      }
    }
  });

  // 3. apps/client/src/game/net/** must not import three or three/examples
  const netDir = path.join(root, "apps", "client", "src", "game", "net");
  walk(netDir, (filePath) => {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
      if (THREE_IMPORT_RE.test(line) || THREE_EXAMPLES_IMPORT_RE.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          reason: "apps/client/src/game/net/** must not import three or three/examples",
          code: line.trim(),
        });
      }
    }
  });

  // 4. apps/client/src/game/net/** must not call known scene-layer methods
  walk(netDir, (filePath) => {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
      const match = line.match(SCENE_LAYER_METHOD_RE);
      if (match) {
        violations.push({
          file: filePath,
          line: i + 1,
          reason: `apps/client/src/game/net/** must not call scene-layer method ${match[1]}`,
          code: line.trim(),
        });
      }
    }
  });

  // 5. Object3D mutation must only occur in renderer/**, scene/**, or render tests
  const clientGameDir = path.join(root, "apps", "client", "src", "game");
  walk(clientGameDir, (filePath) => {
    if (isRenderTestFile(filePath)) return;
    const relative = filePath.replace(/\\/g, "/");
    if (relative.includes("/renderer/")) return;
    if (relative.includes("/scene/")) return;

    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
      for (const pattern of MUTATION_PATTERNS) {
        if (pattern.re.test(line)) {
          violations.push({
            file: filePath,
            line: i + 1,
            reason: `${pattern.name} must only occur in renderer/**, scene/**, or render tests`,
            code: line.trim(),
          });
        }
      }
    }
  });

  return violations;
}

function main(): void {
  const violations = collectViolations();
  if (violations.length === 0) {
    console.log("Render boundaries OK. No violations found.");
    process.exit(0);
  }

  console.error("Render boundary violations found:\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    Reason: ${v.reason}`);
    console.error(`    Code:   ${v.code}\n`);
  }
  console.error(`Total violations: ${violations.length}`);
  process.exit(1);
}

main();
