import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const sharedIndex = fileURLToPath(new URL("./packages/shared/src/index.ts", import.meta.url));
const sharedSrc = fileURLToPath(new URL("./packages/shared/src", import.meta.url));
const validatorIndex = fileURLToPath(
  new URL("./tools/content-validator/src/index.ts", import.meta.url),
);
const validatorSrc = fileURLToPath(new URL("./tools/content-validator/src", import.meta.url));

const alias = [
  { find: /^@old-town\/shared$/, replacement: sharedIndex },
  { find: /^@old-town\/shared\/(.*)$/, replacement: `${sharedSrc}/$1` },
  { find: /^@old-town\/content-validator$/, replacement: validatorIndex },
  { find: /^@old-town\/content-validator\/(.*)$/, replacement: `${validatorSrc}/$1` },
];

const sharedTestDefaults = {
  globals: false as const,
  environment: "jsdom" as const,
  environmentOptions: {
    jsdom: { url: "http://localhost/" },
  },
  setupFiles: ["./vitest.setup.ts"],
};

/** Heavy-lane filename convention (E50): integration / perf suites. */
const HEAVY_INCLUDE = [
  "{apps,packages,tools}/**/src/**/*.integration.test.ts",
  "{apps,packages,tools}/**/src/**/*.perf.test.ts",
];

const UNIT_INCLUDE = ["{apps,packages,tools}/**/src/**/*.{test,spec}.ts"];

const UNIT_EXCLUDE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/*.integration.test.ts",
  "**/*.perf.test.ts",
];

export default defineConfig({
  resolve: {
    // Mirror the TypeScript `paths` aliases so the runner resolves cross-package
    // imports identically to `tsc`.
    alias,
  },
  test: {
    // Root coverage config applies when running `test:coverage` / `test:all`.
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["{apps,packages,tools}/**/src/**/*.ts"],
      exclude: ["**/*.{test,spec}.ts", "**/*.d.ts"],
    },
    projects: [
      {
        resolve: { alias },
        test: {
          ...sharedTestDefaults,
          name: "unit",
          include: UNIT_INCLUDE,
          exclude: UNIT_EXCLUDE,
          // threads + isolate:false verified with 3 consecutive green unit runs (E50-S03).
          pool: "threads",
          isolate: false,
        },
      },
      {
        resolve: { alias },
        test: {
          ...sharedTestDefaults,
          name: "heavy",
          include: HEAVY_INCLUDE,
          pool: "threads",
          isolate: true,
        },
      },
    ],
  },
});
