import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const sharedIndex = fileURLToPath(new URL("./packages/shared/src/index.ts", import.meta.url));
const sharedSrc = fileURLToPath(new URL("./packages/shared/src", import.meta.url));
const validatorIndex = fileURLToPath(
  new URL("./tools/content-validator/src/index.ts", import.meta.url),
);
const validatorSrc = fileURLToPath(new URL("./tools/content-validator/src", import.meta.url));

export default defineConfig({
  resolve: {
    // Mirror the TypeScript `paths` aliases so the runner resolves cross-package
    // imports identically to `tsc`.
    alias: [
      { find: /^@old-town\/shared$/, replacement: sharedIndex },
      { find: /^@old-town\/shared\/(.*)$/, replacement: `${sharedSrc}/$1` },
      { find: /^@old-town\/content-validator$/, replacement: validatorIndex },
      { find: /^@old-town\/content-validator\/(.*)$/, replacement: `${validatorSrc}/$1` },
    ],
  },
  test: {
    globals: false,
    environment: "jsdom",
    include: ["{apps,packages,tools}/**/src/**/*.{test,spec}.ts"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["{apps,packages,tools}/**/src/**/*.ts"],
      exclude: ["**/*.{test,spec}.ts", "**/*.d.ts"],
      // No thresholds yet: coverage runs as a reporting shell, not a gate, until the
      // engine has meaningful logic to cover (E01+).
    },
  },
});
